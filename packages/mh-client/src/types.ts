export interface MHAuthRequest {
  user: string;
  pwd: string;
}

export interface MHAuthResponseBody {
  token: string;
  roles: string[];
}

export interface MHAuthErrorBody {
  message: string;
}

export interface MHAuthResponse {
  status: 'OK' | 'ERROR';
  body: MHAuthResponseBody | MHAuthErrorBody;
}

export function isAuthSuccess(response: MHAuthResponse): response is MHAuthResponse & { body: MHAuthResponseBody } {
  return response.status === 'OK';
}
