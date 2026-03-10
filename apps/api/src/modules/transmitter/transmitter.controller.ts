import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpException,
  HttpStatus,
  Query,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TransmitterService, DTERecord } from './transmitter.service';
import { DteBuilderService } from '../dte/services/dte-builder.service';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
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

@ApiTags('transmitter')
@Controller('transmitter')
@ApiBearerAuth()
export class TransmitterController {
  private readonly logger = new Logger(TransmitterController.name);

  constructor(
    private readonly transmitterService: TransmitterService,
    private readonly dteBuilder: DteBuilderService,
  ) {}

  /**
   * Validates that the DTE record belongs to the authenticated user's tenant.
   * Returns the record if valid, throws if not found or unauthorized.
   */
  private getDTEForTenant(dteId: string, user: CurrentUserData): DTERecord {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    const record = this.transmitterService.getDTE(dteId);

    if (!record) {
      throw new HttpException(`DTE not found: ${dteId}`, HttpStatus.NOT_FOUND);
    }

    if (record.tenantId !== user.tenantId) {
      // Return 404 instead of 403 to prevent tenant enumeration
      throw new HttpException(`DTE not found: ${dteId}`, HttpStatus.NOT_FOUND);
    }

    return record;
  }

  @Post('send/:dteId')
  async sendDTE(
    @Param('dteId') dteId: string,
    @Body() dto: TransmitDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const record = this.getDTEForTenant(dteId, user);

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
  async createAndSend(
    @Body() dto: CreateAndTransmitDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

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

      // 2. Create DTE record — use tenantId from JWT, not from request body
      const dteId = crypto.randomUUID();
      const record: DTERecord = {
        id: dteId,
        tenantId: user.tenantId,
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
    @Query() query: ConsultarDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    // First check local record (with tenant validation)
    const record = this.transmitterService.getDTEByCodigoGeneracion(codigoGeneracion);

    if (record) {
      if (record.tenantId !== user.tenantId) {
        throw new HttpException(`DTE not found: ${codigoGeneracion}`, HttpStatus.NOT_FOUND);
      }

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
  getDTE(
    @Param('dteId') dteId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const record = this.getDTEForTenant(dteId, user);

    return {
      id: record.id,
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
  getDTEJson(
    @Param('dteId') dteId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const record = this.getDTEForTenant(dteId, user);
    return record.jsonDte;
  }

  @Get('dte/:dteId/logs')
  getDTELogs(
    @Param('dteId') dteId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    this.getDTEForTenant(dteId, user);
    return this.transmitterService.getLogs(dteId);
  }

  @Post('anular/:dteId')
  async anularDTE(
    @Param('dteId') dteId: string,
    @Body() dto: AnularDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    this.getDTEForTenant(dteId, user);

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
