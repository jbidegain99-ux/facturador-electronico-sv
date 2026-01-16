export interface MhAuthRequest {
  user: string;
  pwd: string;
}

export interface MhAuthResponse {
  status: string;
  body: {
    token: string;
    roles: string[];
  };
}

export interface MhRecepcionRequest {
  ambiente: string;
  idEnvio: number;
  version: number;
  tipoDte: string;
  documento: string;
}

export interface MhRecepcionResponse {
  version: number;
  ambiente: string;
  versionApp: number;
  estado: 'PROCESADO' | 'RECHAZADO';
  codigoGeneracion: string;
  selloRecibido: string;
  fhProcesamiento: string;
  clasificaMsg: string;
  codigoMsg: string;
  descripcionMsg: string;
  observaciones: string[];
}

export interface MhAnulacionRequest {
  ambiente: string;
  idEnvio: number;
  version: number;
  documento: string;
}

export interface MhConsultaRequest {
  nitEmisor: string;
  tdte: string;
  codigoGeneracion: string;
}

export interface MhClientConfig {
  baseUrl: string;
  ambiente: '00' | '01';
}
