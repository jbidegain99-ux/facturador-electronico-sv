import { Injectable, Logger } from '@nestjs/common';
import {
  sendDTE,
  consultarDTE,
  anularDTE,
  SendDTERequest,
  MHRecepcionResponse,
  MHConsultaResponse,
  MHReceptionError,
  MHAuthError,
  MHEnvironment,
} from '@facturador/mh-client';
import { MhAuthService } from '../mh-auth/mh-auth.service';
import { SignerService } from '../signer/signer.service';
import { DTE, TipoDte, DTE_VERSIONS } from '@facturador/shared';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

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
   * Classify whether an error is transient (retryable) or permanent.
   */
  private isTransientError(error: unknown): boolean {
    if (error instanceof MHAuthError) {
      // Auth errors with 5xx or timeout are transient
      const code = error.statusCode;
      return code !== undefined && (code >= 500 || code === 408 || code === 429);
    }
    if (error instanceof MHReceptionError) {
      const code = error.statusCode;
      // 5xx, 408 timeout, 429 rate limit are transient
      if (code !== undefined && (code >= 500 || code === 408 || code === 429)) return true;
      // Explicit rejection by MH (validation errors) is permanent
      if (error.message.includes('timeout') || error.message.includes('Timeout')) return true;
      return false;
    }
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return msg.includes('timeout') || msg.includes('econnreset')
        || msg.includes('econnrefused') || msg.includes('socket hang up')
        || msg.includes('network') || msg.includes('fetch failed');
    }
    return false;
  }

  /**
   * Check if the error indicates an expired/invalid auth token.
   */
  private isAuthTokenError(error: unknown): boolean {
    if (error instanceof MHAuthError) return true;
    if (error instanceof MHReceptionError) {
      return error.statusCode === 401 || error.statusCode === 403;
    }
    return false;
  }

  /**
   * Sleep for a given number of milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Transmite un DTE de forma síncrona con reintentos automáticos
   * para errores transitorios.
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

    let lastError: unknown = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // 1. Obtener token de autenticación
        this.logger.log(`Getting auth token for NIT: ${nit} (attempt ${attempt + 1})`);
        const tokenInfo = await this.mhAuthService.getToken(nit, password, env);

        this.addLog({
          dteId,
          action: 'TRANSMIT',
          status: 'SUCCESS',
          message: `Token obtenido (intento ${attempt + 1})`,
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
        lastError = error;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // On auth token error, invalidate cache and retry
        if (this.isAuthTokenError(error)) {
          this.logger.warn(`Auth token error on attempt ${attempt + 1}, invalidating cache: ${errorMessage}`);
          this.mhAuthService.clearCache(nit, env);
        }

        // If transient and we have retries left, wait and retry
        if (this.isTransientError(error) && attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          this.logger.warn(
            `Transient error on attempt ${attempt + 1}/${MAX_RETRIES + 1}, retrying in ${delay}ms: ${errorMessage}`,
          );
          this.addLog({
            dteId,
            action: 'RETRY',
            status: 'FAILURE',
            message: `Intento ${attempt + 1} falló (transitorio): ${errorMessage}. Reintentando...`,
          });
          await this.sleep(delay);
          continue;
        }

        // Permanent error or retries exhausted
        break;
      }
    }

    // All attempts failed
    const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';
    const observaciones = lastError instanceof MHReceptionError ? lastError.observaciones : undefined;

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

  /**
   * Transmite un DTE (calls transmitSync directly)
   */
  async transmitAsync(
    dteId: string,
    _tenantId: string,
    nit: string,
    password: string,
    env: MHEnvironment = 'test'
  ): Promise<{ jobId: string; message: string }> {
    const result = await this.transmitSync(dteId, nit, password, env);
    return {
      jobId: 'sync',
      message: result.success
        ? `DTE transmitido: ${result.selloRecibido}`
        : `Error: ${result.error}`,
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
   * Obtiene el estado de un job de transmisión (no-op, queue removed)
   */
  async getJobStatus(_jobId: string): Promise<{
    id: string;
    state: string;
    progress: number;
    attemptsMade: number;
    failedReason?: string;
  } | null> {
    return null;
  }
}
