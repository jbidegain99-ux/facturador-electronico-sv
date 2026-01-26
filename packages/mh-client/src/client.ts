import { MH_ENDPOINTS } from '@facturador/shared';
import type {
  MhClientConfig,
  MhAuthRequest,
  MhAuthResponse,
  MhRecepcionRequest,
  MhRecepcionResponse,
} from './types';

export class MhClient {
  private config: MhClientConfig;
  private token: string | null = null;

  constructor(config: MhClientConfig) {
    this.config = config;
  }

  async authenticate(credentials: MhAuthRequest): Promise<string> {
    const url = `${this.config.baseUrl}${MH_ENDPOINTS.AUTH}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        user: credentials.user,
        pwd: credentials.pwd,
      }),
    });

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.status}`);
    }

    const data: MhAuthResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error('Authentication failed');
    }

    const body = data.body as { token: string; roles: string[] };
    this.token = body.token;
    return this.token;
  }

  async sendDte(request: Omit<MhRecepcionRequest, 'ambiente'>): Promise<MhRecepcionResponse> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const url = `${this.config.baseUrl}${MH_ENDPOINTS.RECEPCION_DTE}`;

    const fullRequest: MhRecepcionRequest = {
      ...request,
      ambiente: this.config.ambiente,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.token,
      },
      body: JSON.stringify(fullRequest),
    });

    const data: MhRecepcionResponse = await response.json();
    return data;
  }

  async consultaDte(nitEmisor: string, tipoDte: string, codigoGeneracion: string): Promise<unknown> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const url = `${this.config.baseUrl}${MH_ENDPOINTS.CONSULTA_DTE}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.token,
      },
      body: JSON.stringify({
        nitEmisor,
        tdte: tipoDte,
        codigoGeneracion,
      }),
    });

    return response.json();
  }

  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }
}
