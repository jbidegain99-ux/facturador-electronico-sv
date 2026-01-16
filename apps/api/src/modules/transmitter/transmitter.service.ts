import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MhAuthService } from '../auth/mh-auth.service';

interface MhResponse {
  version: number;
  ambiente: string;
  versionApp: number;
  estado: string;
  codigoGeneracion: string;
  selloRecibido: string;
  fhProcesamiento: string;
  clasificaMsg: string;
  codigoMsg: string;
  descripcionMsg: string;
  observaciones: string[];
}

export interface TransmitResult {
  estado: string;
  selloRecepcion: string | null;
  fechaRecepcion: string | null;
  codigoMh: string | null;
  descripcionMh: string | null;
}

@Injectable()
export class TransmitterService {
  private readonly logger = new Logger(TransmitterService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private mhAuthService: MhAuthService,
  ) {}

  async send(tenantId: string, tipoDte: string, documentoFirmado: string): Promise<TransmitResult> {
    const baseUrl = this.configService.get<string>('MH_API_BASE_URL');
    const token = await this.mhAuthService.getToken(tenantId);

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error('Tenant no encontrado');
    }

    const url = `${baseUrl}/fesv/recepciondte`;

    const requestBody = {
      ambiente: this.configService.get<string>('MH_AMBIENTE') || '00',
      idEnvio: 1,
      version: this.getVersionForTipoDte(tipoDte),
      tipoDte,
      documento: documentoFirmado,
    };

    this.logger.log(`Transmitiendo DTE tipo ${tipoDte} al MH`);
    this.logger.debug(`Request: ${JSON.stringify(requestBody)}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      this.logger.debug(`Response: ${responseText}`);

      if (!response.ok) {
        this.logger.error(`Error del MH: ${response.status} - ${responseText}`);
        return {
          estado: 'RECHAZADO',
          selloRecepcion: null,
          fechaRecepcion: null,
          codigoMh: response.status.toString(),
          descripcionMh: responseText,
        };
      }

      const data: MhResponse = JSON.parse(responseText);

      if (data.estado === 'PROCESADO') {
        this.logger.log(`DTE procesado exitosamente. Sello: ${data.selloRecibido}`);
        return {
          estado: 'PROCESADO',
          selloRecepcion: data.selloRecibido,
          fechaRecepcion: data.fhProcesamiento,
          codigoMh: data.codigoMsg,
          descripcionMh: data.descripcionMsg,
        };
      } else {
        this.logger.warn(`DTE rechazado: ${data.descripcionMsg}`);
        return {
          estado: 'RECHAZADO',
          selloRecepcion: null,
          fechaRecepcion: null,
          codigoMh: data.codigoMsg,
          descripcionMh: data.descripcionMsg + (data.observaciones?.join(', ') || ''),
        };
      }
    } catch (error) {
      this.logger.error(`Error transmitiendo al MH: ${error}`);
      throw error;
    }
  }

  private getVersionForTipoDte(tipoDte: string): number {
    const versions: Record<string, number> = {
      '01': 1, // Factura Consumidor Final
      '03': 3, // Comprobante de Credito Fiscal
      '05': 3, // Nota de Credito
      '06': 3, // Nota de Debito
    };
    return versions[tipoDte] || 1;
  }
}
