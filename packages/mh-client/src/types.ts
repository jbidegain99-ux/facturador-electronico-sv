export interface MhClientConfig {
  baseUrl: string;
  ambiente: '00' | '01'; // 00 = pruebas, 01 = produccion
}

export interface MhAuthRequest {
  user: string;
  pwd: string;
}

export interface MhAuthResponseBody {
  token: string;
  roles: string[];
}

export interface MhAuthErrorBody {
  message: string;
}

export interface MhAuthResponse {
  status: 'OK' | 'ERROR';
  body: MhAuthResponseBody | MhAuthErrorBody;
}

export interface MhRecepcionRequest {
  ambiente: '00' | '01';
  idEnvio: number;
  version: number;
  tipoDte: string;
  documento: string; // JSON firmado del DTE
}

export interface MhRecepcionResponseBody {
  selloRecibido: string;
  estado: string;
  codigoGeneracion: string;
  observaciones?: string[];
}

export interface MhRecepcionErrorBody {
  descripcionMsg: string;
  codigoMsg?: string;
  observaciones?: string[];
}

export interface MhRecepcionResponse {
  estado: 'PROCESADO' | 'RECHAZADO';
  codigoGeneracion?: string;
  selloRecibido?: string;
  fhProcesamiento?: string;
  observaciones?: string[];
  clasificaMsg?: string;
  codigoMsg?: string;
  descripcionMsg?: string;
}

export function isAuthSuccess(response: MhAuthResponse): response is MhAuthResponse & { body: MhAuthResponseBody } {
  return response.status === 'OK';
}

// Aliases for backward compatibility
export type MHAuthRequest = MhAuthRequest;
export type MHAuthResponse = MhAuthResponse;
export type MHAuthResponseBody = MhAuthResponseBody;
export type MHAuthErrorBody = MhAuthErrorBody;
