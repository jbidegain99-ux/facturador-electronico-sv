import { getBaseUrl, MHEnvironment } from './config';

// Request types
export interface SendDTERequest {
  ambiente: '00' | '01';
  idEnvio: number;
  version: number;
  tipoDte: string;
  documento: string; // JWS firmado
  codigoGeneracion?: string;
}

export interface AnularDTERequest {
  ambiente: '00' | '01';
  idEnvio: number;
  version: number;
  documento: string; // JWS del documento de anulación firmado
}

export interface ConsultarDTERequest {
  codigoGeneracion: string;
}

// Response types
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

export class MHReceptionError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: MHRecepcionResponse | MHAnulacionResponse,
    public readonly observaciones?: string[]
  ) {
    super(message);
    this.name = 'MHReceptionError';
  }
}

export interface SendDTEOptions {
  env?: MHEnvironment;
  timeout?: number;
}

/**
 * Envía un DTE firmado al Ministerio de Hacienda
 */
export async function sendDTE(
  token: string,
  request: SendDTERequest,
  options: SendDTEOptions = {}
): Promise<MHRecepcionResponse> {
  const { env = 'test', timeout = 30000 } = options;
  const baseUrl = getBaseUrl(env);
  const url = `${baseUrl}/fesv/recepciondte`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data: MHRecepcionResponse = await response.json();

    if (!response.ok) {
      throw new MHReceptionError(
        data.descripcionMsg || `HTTP error: ${response.status}`,
        response.status,
        data,
        data.observaciones
      );
    }

    if (data.estado === 'RECHAZADO') {
      throw new MHReceptionError(
        data.descripcionMsg || 'DTE rechazado por el MH',
        response.status,
        data,
        data.observaciones
      );
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof MHReceptionError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new MHReceptionError('Request timeout', 408);
    }

    throw new MHReceptionError(
      `Failed to send DTE: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Consulta el estado de un DTE por su código de generación
 */
export async function consultarDTE(
  token: string,
  codigoGeneracion: string,
  options: SendDTEOptions = {}
): Promise<MHConsultaResponse> {
  const { env = 'test', timeout = 30000 } = options;
  const baseUrl = getBaseUrl(env);
  const url = `${baseUrl}/fesv/recepciondte/${codigoGeneracion}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data: MHConsultaResponse = await response.json();

    if (!response.ok && response.status !== 404) {
      throw new MHReceptionError(
        `HTTP error: ${response.status}`,
        response.status
      );
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof MHReceptionError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new MHReceptionError('Request timeout', 408);
    }

    throw new MHReceptionError(
      `Failed to query DTE: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Anula un DTE previamente emitido
 */
export async function anularDTE(
  token: string,
  request: AnularDTERequest,
  options: SendDTEOptions = {}
): Promise<MHAnulacionResponse> {
  const { env = 'test', timeout = 30000 } = options;
  const baseUrl = getBaseUrl(env);
  const url = `${baseUrl}/fesv/anulardte`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data: MHAnulacionResponse = await response.json();

    if (!response.ok) {
      throw new MHReceptionError(
        data.descripcionMsg || `HTTP error: ${response.status}`,
        response.status,
        undefined,
        data.observaciones
      );
    }

    if (data.estado === 'RECHAZADO') {
      throw new MHReceptionError(
        data.descripcionMsg || 'Anulación rechazada por el MH',
        response.status,
        undefined,
        data.observaciones
      );
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof MHReceptionError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new MHReceptionError('Request timeout', 408);
    }

    throw new MHReceptionError(
      `Failed to cancel DTE: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Envía lote de DTEs en contingencia
 */
export async function sendContingencia(
  token: string,
  documentos: Array<{ documento: string; tipoDte: string }>,
  options: SendDTEOptions = {}
): Promise<MHRecepcionResponse[]> {
  const { env = 'test', timeout = 60000 } = options;
  const baseUrl = getBaseUrl(env);
  const url = `${baseUrl}/fesv/contingencia`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ambiente: env === 'prod' ? '01' : '00',
        idEnvio: Date.now(),
        version: 3,
        documentos,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new MHReceptionError(
        `HTTP error: ${response.status}`,
        response.status
      );
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof MHReceptionError) {
      throw error;
    }

    throw new MHReceptionError(
      `Failed to send contingencia: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
