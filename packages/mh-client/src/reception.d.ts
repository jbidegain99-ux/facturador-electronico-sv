import { MHEnvironment } from './config';
export interface SendDTERequest {
    ambiente: '00' | '01';
    idEnvio: number;
    version: number;
    tipoDte: string;
    documento: string;
    codigoGeneracion?: string;
}
export interface AnularDTERequest {
    ambiente: '00' | '01';
    idEnvio: number;
    version: number;
    documento: string;
}
export interface ConsultarDTERequest {
    codigoGeneracion: string;
}
export interface MHRecepcionResponse {
    version: number;
    ambiente: string;
    versionApp: number;
    estado: 'PROCESADO' | 'RECHAZADO' | 'CONTINGENCIA';
    codigoGeneracion: string;
    selloRecibido: string | null;
    fhProcesamiento: string;
    clasificaMsg: string;
    codigoMsg: string;
    descripcionMsg: string;
    observaciones: string[];
}
export interface MHConsultaResponse {
    version: number;
    ambiente: string;
    estado: 'PROCESADO' | 'RECHAZADO' | 'NO_ENCONTRADO';
    codigoGeneracion: string;
    selloRecibido: string | null;
    fhProcesamiento: string;
    observaciones: string[];
}
export interface MHAnulacionResponse {
    version: number;
    ambiente: string;
    estado: 'PROCESADO' | 'RECHAZADO';
    codigoGeneracion: string;
    selloRecibido: string | null;
    fhProcesamiento: string;
    codigoMsg: string;
    descripcionMsg: string;
    observaciones: string[];
}
export declare class MHReceptionError extends Error {
    readonly statusCode?: number | undefined;
    readonly response?: (MHRecepcionResponse | MHAnulacionResponse) | undefined;
    readonly observaciones?: string[] | undefined;
    constructor(message: string, statusCode?: number | undefined, response?: (MHRecepcionResponse | MHAnulacionResponse) | undefined, observaciones?: string[] | undefined);
}
export interface SendDTEOptions {
    env?: MHEnvironment;
    timeout?: number;
}
/**
 * Envía un DTE firmado al Ministerio de Hacienda
 */
export declare function sendDTE(token: string, request: SendDTERequest, options?: SendDTEOptions): Promise<MHRecepcionResponse>;
/**
 * Consulta el estado de un DTE por su código de generación
 */
export declare function consultarDTE(token: string, codigoGeneracion: string, options?: SendDTEOptions): Promise<MHConsultaResponse>;
/**
 * Anula un DTE previamente emitido
 */
export declare function anularDTE(token: string, request: AnularDTERequest, options?: SendDTEOptions): Promise<MHAnulacionResponse>;
/**
 * Envía lote de DTEs en contingencia
 */
export declare function sendContingencia(token: string, documentos: Array<{
    documento: string;
    tipoDte: string;
}>, options?: SendDTEOptions): Promise<MHRecepcionResponse[]>;
//# sourceMappingURL=reception.d.ts.map