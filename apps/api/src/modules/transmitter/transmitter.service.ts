import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import {
  sendDTE,
  consultarDTE,
  anularDTE,
  SendDTERequest,
  MHRecepcionResponse,
  MHConsultaResponse,
  MHReceptionError,
  MHEnvironment,
} from '@facturador/mh-client';
import { MhAuthService } from '../mh-auth/mh-auth.service';
import { SignerService } from '../signer/signer.service';
import { DTE, TipoDte, DTE_VERSIONS } from '@facturador/shared';

export type DTEStatus = 'PENDIENTE' | 'PROCESANDO' | 'PROCESADO' | 'RECHAZADO' | 'ANULADO' | 'ERROR';

export interface DTERecord {
  id: string;
  tenantId: string;
  codigoGeneracion: string;
  numeroControl: string;
  tipoDte: TipoDte;
  ambiente: '00' | '01';
  status: DTEStatus;
  jsonDte: DTE;
  jwsFirmado?: string;
  selloRecibido?: string;
  fhProcesamiento?: string;
  observaciones?: string[];
  intentos: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DTELog {
  id: string;
  dteId: string;
  action: 'CREATE' | 'SIGN' | 'TRANSMIT' | 'RESPONSE' | 'RETRY' | 'ERROR' | 'ANULAR';
  status: 'SUCCESS' | 'FAILURE';
  message: string;
  data?: Record<string, unknown>;
  createdAt: Date;
}

export interface TransmitResult {
  success: boolean;
  dteId: string;
  codigoGeneracion: string;
  status: DTEStatus;
  selloRecibido?: string;
  fhProcesamiento?: string;
  observaciones?: string[];
  error?: string;
}

export interface TransmitJobData {
  dteId: string;
  tenantId: string;
  nit: string;
  password: string;
  env: MHEnvironment;
}

@Injectable()
export class TransmitterService {
  private readonly logger = new Logger(TransmitterService.name);

  // In-memory storage (replace with database in production)
  private dteRecords: Map<string, DTERecord> = new Map();
  private dteLogs: Map<string, DTELog[]> = new Map();

  constructor(
    @InjectQueue('dte-transmission') private transmissionQueue: Queue,
    private mhAuthService: MhAuthService,
    private signerService: SignerService,
  ) {}

  /**
   * Guarda un DTE en memoria (reemplazar con DB en producción)
   */
  saveDTE(record: DTERecord): void {
    this.dteRecords.set(record.id, record);
    this.logger.log(`DTE saved: ${record.id} - ${record.codigoGeneracion}`);
  }

  /**
   * Obtiene un DTE por ID
   */
  getDTE(dteId: string): DTERecord | undefined {
    return this.dteRecords.get(dteId);
  }

  /**
   * Obtiene un DTE por código de generación
   */
  getDTEByCodigoGeneracion(codigoGeneracion: string): DTERecord | undefined {
    for (const record of this.dteRecords.values()) {
      if (record.codigoGeneracion === codigoGeneracion) {
        return record;
      }
    }
    return undefined;
  }

  /**
   * Actualiza un DTE
   */
  updateDTE(dteId: string, updates: Partial<DTERecord>): DTERecord | undefined {
    const record = this.dteRecords.get(dteId);
    if (record) {
      const updated = { ...record, ...updates, updatedAt: new Date() };
      this.dteRecords.set(dteId, updated);
      return updated;
    }
    return undefined;
  }

  /**
   * Agrega un log para un DTE
   */
  addLog(log: Omit<DTELog, 'id' | 'createdAt'>): void {
    const logEntry: DTELog = {
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    const logs = this.dteLogs.get(log.dteId) || [];
    logs.push(logEntry);
    this.dteLogs.set(log.dteId, logs);

    this.logger.debug(`Log added for DTE ${log.dteId}: ${log.action} - ${log.status}`);
  }

  /**
   * Obtiene logs de un DTE
   */
  getLogs(dteId: string): DTELog[] {
    return this.dteLogs.get(dteId) || [];
  }

  /**
   * Transmite un DTE de forma síncrona (sin cola)
   */
  async transmitSync(
    dteId: string,
    nit: string,
    password: string,
    env: MHEnvironment = 'test'
  ): Promise<TransmitResult> {
    const record = this.getDTE(dteId);

    if (!record) {
      throw new Error(`DTE not found: ${dteId}`);
    }

    this.updateDTE(dteId, { status: 'PROCESANDO' });
    this.addLog({
      dteId,
      action: 'TRANSMIT',
      status: 'SUCCESS',
      message: 'Iniciando transmisión',
    });

    try {
      // 1. Obtener token de autenticación
      this.logger.log(`Getting auth token for NIT: ${nit}`);
      const tokenInfo = await this.mhAuthService.getToken(nit, password, env);

      this.addLog({
        dteId,
        action: 'TRANSMIT',
        status: 'SUCCESS',
        message: 'Token obtenido',
      });

      // 2. Firmar el DTE si no está firmado
      let jwsFirmado = record.jwsFirmado;
      if (!jwsFirmado) {
        if (!this.signerService.isCertificateLoaded()) {
          throw new Error('No certificate loaded for signing');
        }

        this.logger.log(`Signing DTE: ${dteId}`);
        jwsFirmado = await this.signerService.signDTE(record.jsonDte);
        this.updateDTE(dteId, { jwsFirmado });

        this.addLog({
          dteId,
          action: 'SIGN',
          status: 'SUCCESS',
          message: 'DTE firmado',
        });
      }

      // 3. Preparar request para MH
      const request: SendDTERequest = {
        ambiente: record.ambiente,
        idEnvio: Date.now(),
        version: DTE_VERSIONS[record.tipoDte],
        tipoDte: record.tipoDte,
        documento: jwsFirmado,
        codigoGeneracion: record.codigoGeneracion,
      };

      // 4. Enviar al MH
      this.logger.log(`Sending DTE to MH: ${record.codigoGeneracion}`);
      const response = await sendDTE(tokenInfo.token, request, { env });

      // 5. Procesar respuesta exitosa
      this.updateDTE(dteId, {
        status: 'PROCESADO',
        selloRecibido: response.selloRecibido || undefined,
        fhProcesamiento: response.fhProcesamiento,
        observaciones: response.observaciones,
      });

      this.addLog({
        dteId,
        action: 'RESPONSE',
        status: 'SUCCESS',
        message: `DTE procesado: ${response.selloRecibido}`,
        data: response as unknown as Record<string, unknown>,
      });

      this.logger.log(`DTE transmitted successfully: ${record.codigoGeneracion} - Sello: ${response.selloRecibido}`);

      return {
        success: true,
        dteId,
        codigoGeneracion: record.codigoGeneracion,
        status: 'PROCESADO',
        selloRecibido: response.selloRecibido || undefined,
        fhProcesamiento: response.fhProcesamiento,
        observaciones: response.observaciones,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const observaciones = error instanceof MHReceptionError ? error.observaciones : undefined;

      this.updateDTE(dteId, {
        status: 'RECHAZADO',
        observaciones,
        intentos: (record.intentos || 0) + 1,
      });

      this.addLog({
        dteId,
        action: 'ERROR',
        status: 'FAILURE',
        message: errorMessage,
        data: { observaciones },
      });

      this.logger.error(`DTE transmission failed: ${record.codigoGeneracion} - ${errorMessage}`);

      return {
        success: false,
        dteId,
        codigoGeneracion: record.codigoGeneracion,
        status: 'RECHAZADO',
        observaciones,
        error: errorMessage,
      };
    }
  }

  /**
   * Encola un DTE para transmisión con reintentos
   */
  async transmitAsync(
    dteId: string,
    tenantId: string,
    nit: string,
    password: string,
    env: MHEnvironment = 'test'
  ): Promise<{ jobId: string; message: string }> {
    const record = this.getDTE(dteId);

    if (!record) {
      throw new Error(`DTE not found: ${dteId}`);
    }

    if (record.status === 'PROCESADO') {
      throw new Error(`DTE already processed: ${dteId}`);
    }

    const jobData: TransmitJobData = {
      dteId,
      tenantId,
      nit,
      password,
      env,
    };

    const job = await this.transmissionQueue.add('transmit', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000, // 1s, 2s, 4s
      },
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    this.updateDTE(dteId, { status: 'PROCESANDO' });

    this.addLog({
      dteId,
      action: 'TRANSMIT',
      status: 'SUCCESS',
      message: `Job encolado: ${job.id}`,
    });

    this.logger.log(`DTE queued for transmission: ${dteId} - Job: ${job.id}`);

    return {
      jobId: job.id || '',
      message: `DTE encolado para transmisión. Job ID: ${job.id}`,
    };
  }

  /**
   * Consulta el estado de un DTE en el MH
   */
  async consultarEstado(
    codigoGeneracion: string,
    nit: string,
    password: string,
    env: MHEnvironment = 'test'
  ): Promise<MHConsultaResponse> {
    const tokenInfo = await this.mhAuthService.getToken(nit, password, env);
    return consultarDTE(tokenInfo.token, codigoGeneracion, { env });
  }

  /**
   * Anula un DTE
   */
  async anular(
    dteId: string,
    motivo: string,
    nit: string,
    password: string,
    env: MHEnvironment = 'test'
  ): Promise<TransmitResult> {
    const record = this.getDTE(dteId);

    if (!record) {
      throw new Error(`DTE not found: ${dteId}`);
    }

    if (record.status !== 'PROCESADO') {
      throw new Error(`Cannot cancel DTE with status: ${record.status}`);
    }

    try {
      const tokenInfo = await this.mhAuthService.getToken(nit, password, env);

      // Crear documento de anulación
      const anulacionDoc = {
        identificacion: {
          version: 2,
          ambiente: record.ambiente,
          codigoGeneracion: crypto.randomUUID().toUpperCase(),
          fecAnula: new Date().toISOString().split('T')[0],
          horAnula: new Date().toTimeString().split(' ')[0],
        },
        emisor: {
          nit: nit.replace(/-/g, ''),
          nombre: (record.jsonDte as { emisor: { nombre: string } }).emisor.nombre,
          tipoEstablecimiento: '01',
          nomEstablecimiento: null,
          codEstableMH: null,
          codEstable: null,
          codPuntoVentaMH: null,
          codPuntoVenta: null,
          telefono: (record.jsonDte as { emisor: { telefono: string } }).emisor.telefono,
          correo: (record.jsonDte as { emisor: { correo: string } }).emisor.correo,
        },
        documento: {
          tipoDte: record.tipoDte,
          codigoGeneracion: record.codigoGeneracion,
          selloRecibido: record.selloRecibido,
          numeroControl: record.numeroControl,
          fecEmi: record.jsonDte.identificacion.fecEmi,
          montoIva: 0,
          codigoGeneracionR: null,
          tipoDocumento: null,
          numDocumento: null,
          nombre: null,
          telefono: null,
          correo: null,
        },
        motivo: {
          tipoAnulacion: 1,
          motivoAnulacion: motivo,
          nombreResponsable: 'Responsable',
          tipDocResponsable: '36',
          numDocResponsable: nit.replace(/-/g, ''),
          nombreSolicita: 'Solicitante',
          tipDocSolicita: '36',
          numDocSolicita: nit.replace(/-/g, ''),
        },
      };

      // Firmar documento de anulación
      const jwsAnulacion = await this.signerService.signDTE(anulacionDoc);

      // Enviar anulación
      const response = await anularDTE(
        tokenInfo.token,
        {
          ambiente: record.ambiente,
          idEnvio: Date.now(),
          version: 2,
          documento: jwsAnulacion,
        },
        { env }
      );

      this.updateDTE(dteId, { status: 'ANULADO' });

      this.addLog({
        dteId,
        action: 'ANULAR',
        status: 'SUCCESS',
        message: `DTE anulado: ${response.selloRecibido}`,
        data: { motivo },
      });

      return {
        success: true,
        dteId,
        codigoGeneracion: record.codigoGeneracion,
        status: 'ANULADO',
        selloRecibido: response.selloRecibido || undefined,
        fhProcesamiento: response.fhProcesamiento,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.addLog({
        dteId,
        action: 'ANULAR',
        status: 'FAILURE',
        message: errorMessage,
      });

      return {
        success: false,
        dteId,
        codigoGeneracion: record.codigoGeneracion,
        status: record.status,
        error: errorMessage,
      };
    }
  }

  /**
   * Obtiene el estado de un job de transmisión
   */
  async getJobStatus(jobId: string): Promise<{
    id: string;
    state: string;
    progress: number;
    attemptsMade: number;
    failedReason?: string;
  } | null> {
    const job = await this.transmissionQueue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();

    return {
      id: job.id || '',
      state,
      progress: job.progress as number,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
    };
  }
}
