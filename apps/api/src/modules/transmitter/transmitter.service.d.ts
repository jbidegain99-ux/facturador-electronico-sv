import { Queue } from 'bullmq';
import { MHConsultaResponse, MHEnvironment } from '@facturador/mh-client';
import { MhAuthService } from '../mh-auth/mh-auth.service';
import { SignerService } from '../signer/signer.service';
import { DTE, TipoDte } from '@facturador/shared';
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
export declare class TransmitterService {
    private transmissionQueue;
    private mhAuthService;
    private signerService;
    private readonly logger;
    private dteRecords;
    private dteLogs;
    constructor(transmissionQueue: Queue | undefined, mhAuthService: MhAuthService, signerService: SignerService);
    /**
     * Guarda un DTE en memoria (reemplazar con DB en producción)
     */
    saveDTE(record: DTERecord): void;
    /**
     * Obtiene un DTE por ID
     */
    getDTE(dteId: string): DTERecord | undefined;
    /**
     * Obtiene un DTE por código de generación
     */
    getDTEByCodigoGeneracion(codigoGeneracion: string): DTERecord | undefined;
    /**
     * Actualiza un DTE
     */
    updateDTE(dteId: string, updates: Partial<DTERecord>): DTERecord | undefined;
    /**
     * Agrega un log para un DTE
     */
    addLog(log: Omit<DTELog, 'id' | 'createdAt'>): void;
    /**
     * Obtiene logs de un DTE
     */
    getLogs(dteId: string): DTELog[];
    /**
     * Transmite un DTE de forma síncrona (sin cola)
     */
    transmitSync(dteId: string, nit: string, password: string, env?: MHEnvironment): Promise<TransmitResult>;
    /**
     * Encola un DTE para transmisión con reintentos
     */
    transmitAsync(dteId: string, tenantId: string, nit: string, password: string, env?: MHEnvironment): Promise<{
        jobId: string;
        message: string;
    }>;
    /**
     * Consulta el estado de un DTE en el MH
     */
    consultarEstado(codigoGeneracion: string, nit: string, password: string, env?: MHEnvironment): Promise<MHConsultaResponse>;
    /**
     * Anula un DTE
     */
    anular(dteId: string, motivo: string, nit: string, password: string, env?: MHEnvironment): Promise<TransmitResult>;
    /**
     * Obtiene el estado de un job de transmisión
     */
    getJobStatus(jobId: string): Promise<{
        id: string;
        state: string;
        progress: number;
        attemptsMade: number;
        failedReason?: string;
    } | null>;
}
//# sourceMappingURL=transmitter.service.d.ts.map