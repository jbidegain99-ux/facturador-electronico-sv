import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { TransmitterService, DTERecord } from './transmitter.service';
import { DteBuilderService } from '../dte/services/dte-builder.service';
import { DTE, TipoDte, Ambiente } from '@facturador/shared';
import { MHEnvironment } from '@facturador/mh-client';

export class TransmitDto {
  nit: string;
  password: string;
  env?: MHEnvironment;
  async?: boolean;
}

export class CreateAndTransmitDto {
  nit: string;
  password: string;
  env?: MHEnvironment;
  tenantId: string;
  tipoDte: TipoDte;
  ambiente?: Ambiente;
  emisor: Record<string, unknown>;
  receptor?: Record<string, unknown>;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    esGravado?: boolean;
    esExento?: boolean;
    codigo?: string;
  }>;
  codEstablecimiento: string;
  correlativo: number;
  condicionOperacion?: 1 | 2 | 3;
}

export class AnularDto {
  nit: string;
  password: string;
  env?: MHEnvironment;
  motivo: string;
}

export class ConsultarDto {
  nit: string;
  password: string;
  env?: MHEnvironment;
}

@Controller('transmitter')
export class TransmitterController {
  constructor(
    private readonly transmitterService: TransmitterService,
    private readonly dteBuilder: DteBuilderService,
  ) {}

  @Post('send/:dteId')
  async sendDTE(
    @Param('dteId') dteId: string,
    @Body() dto: TransmitDto
  ) {
    const record = this.transmitterService.getDTE(dteId);

    if (!record) {
      throw new HttpException(`DTE not found: ${dteId}`, HttpStatus.NOT_FOUND);
    }

    try {
      if (dto.async) {
        const result = await this.transmitterService.transmitAsync(
          dteId,
          record.tenantId,
          dto.nit,
          dto.password,
          dto.env || 'test'
        );
        return {
          success: true,
          message: result.message,
          jobId: result.jobId,
          dteId,
        };
      } else {
        const result = await this.transmitterService.transmitSync(
          dteId,
          dto.nit,
          dto.password,
          dto.env || 'test'
        );
        return result;
      }
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Transmission failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('create-and-send')
  async createAndSend(@Body() dto: CreateAndTransmitDto) {
    try {
      // 1. Build the DTE
      let dte: DTE;
      const buildInput = {
        emisor: dto.emisor as never,
        receptor: dto.receptor as never,
        items: dto.items,
        codEstablecimiento: dto.codEstablecimiento,
        correlativo: dto.correlativo,
        ambiente: dto.ambiente,
        condicionOperacion: dto.condicionOperacion,
      };

      if (dto.tipoDte === '01') {
        dte = this.dteBuilder.buildFactura(buildInput);
      } else if (dto.tipoDte === '03') {
        if (!dto.receptor) {
          throw new Error('Receptor is required for CCF');
        }
        dte = this.dteBuilder.buildCCF(buildInput as never);
      } else {
        throw new Error(`DTE type ${dto.tipoDte} not implemented yet`);
      }

      // 2. Create DTE record
      const dteId = crypto.randomUUID();
      const record: DTERecord = {
        id: dteId,
        tenantId: dto.tenantId,
        codigoGeneracion: dte.identificacion.codigoGeneracion,
        numeroControl: dte.identificacion.numeroControl,
        tipoDte: dto.tipoDte,
        ambiente: dto.ambiente || '00',
        status: 'PENDIENTE',
        jsonDte: dte,
        intentos: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.transmitterService.saveDTE(record);

      // 3. Transmit
      const result = await this.transmitterService.transmitSync(
        dteId,
        dto.nit,
        dto.password,
        dto.env || 'test'
      );

      return {
        ...result,
        dte,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create and send DTE',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('status/:codigoGeneracion')
  async getStatus(
    @Param('codigoGeneracion') codigoGeneracion: string,
    @Query() query: ConsultarDto
  ) {
    // First check local record
    const record = this.transmitterService.getDTEByCodigoGeneracion(codigoGeneracion);

    if (record) {
      return {
        source: 'local',
        dteId: record.id,
        codigoGeneracion: record.codigoGeneracion,
        status: record.status,
        selloRecibido: record.selloRecibido,
        fhProcesamiento: record.fhProcesamiento,
        observaciones: record.observaciones,
        intentos: record.intentos,
      };
    }

    // If not found locally and credentials provided, check MH
    if (query.nit && query.password) {
      try {
        const mhStatus = await this.transmitterService.consultarEstado(
          codigoGeneracion,
          query.nit,
          query.password,
          query.env || 'test'
        );

        return {
          source: 'mh',
          ...mhStatus,
        };
      } catch (error) {
        throw new HttpException(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to query MH',
          },
          HttpStatus.BAD_GATEWAY
        );
      }
    }

    throw new HttpException(
      `DTE not found: ${codigoGeneracion}`,
      HttpStatus.NOT_FOUND
    );
  }

  @Get('dte/:dteId')
  getDTE(@Param('dteId') dteId: string) {
    const record = this.transmitterService.getDTE(dteId);

    if (!record) {
      throw new HttpException(`DTE not found: ${dteId}`, HttpStatus.NOT_FOUND);
    }

    return {
      id: record.id,
      tenantId: record.tenantId,
      codigoGeneracion: record.codigoGeneracion,
      numeroControl: record.numeroControl,
      tipoDte: record.tipoDte,
      ambiente: record.ambiente,
      status: record.status,
      selloRecibido: record.selloRecibido,
      fhProcesamiento: record.fhProcesamiento,
      observaciones: record.observaciones,
      intentos: record.intentos,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  @Get('dte/:dteId/json')
  getDTEJson(@Param('dteId') dteId: string) {
    const record = this.transmitterService.getDTE(dteId);

    if (!record) {
      throw new HttpException(`DTE not found: ${dteId}`, HttpStatus.NOT_FOUND);
    }

    return record.jsonDte;
  }

  @Get('dte/:dteId/logs')
  getDTELogs(@Param('dteId') dteId: string) {
    const record = this.transmitterService.getDTE(dteId);

    if (!record) {
      throw new HttpException(`DTE not found: ${dteId}`, HttpStatus.NOT_FOUND);
    }

    return this.transmitterService.getLogs(dteId);
  }

  @Post('anular/:dteId')
  async anularDTE(
    @Param('dteId') dteId: string,
    @Body() dto: AnularDto
  ) {
    const record = this.transmitterService.getDTE(dteId);

    if (!record) {
      throw new HttpException(`DTE not found: ${dteId}`, HttpStatus.NOT_FOUND);
    }

    try {
      const result = await this.transmitterService.anular(
        dteId,
        dto.motivo,
        dto.nit,
        dto.password,
        dto.env || 'test'
      );
      return result;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to cancel DTE',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('job/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    const status = await this.transmitterService.getJobStatus(jobId);

    if (!status) {
      throw new HttpException(`Job not found: ${jobId}`, HttpStatus.NOT_FOUND);
    }

    return status;
  }
}
