import { getBaseUrl, MHEnvironment } from './config';
import { MHAuthRequest, MHAuthResponse, isAuthSuccess } from './types';

export class MHAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseBody?: unknown
  ) {
    super(message);
    this.name = 'MHAuthError';
  }
}

export interface AuthenticateOptions {
  env?: MHEnvironment;
}

export async function authenticate(
  nit: string,
  password: string,
  options: AuthenticateOptions = {}
): Promise<MHAuthResponse> {
  const { env = 'test' } = options;
  const baseUrl = getBaseUrl(env);
  const url = `${baseUrl}/seguridad/auth`;

  const nitSinGuiones = nit.replace(/-/g, '');

  const body: MHAuthRequest = {
    user: nitSinGuiones,
    pwd: password,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new MHAuthError(
        `HTTP error from MH API: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const data: MHAuthResponse = await response.json();

    if (!isAuthSuccess(data)) {
      const errorBody = data.body as { message: string };
      throw new MHAuthError(
        errorBody.message || 'Authentication failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof MHAuthError) {
      throw error;
    }
    throw new MHAuthError(
      `Failed to connect to MH API: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
