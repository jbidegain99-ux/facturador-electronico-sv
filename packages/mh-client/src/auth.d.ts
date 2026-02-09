import { MHEnvironment } from './config';
import { MHAuthResponse } from './types';
export declare class MHAuthError extends Error {
    readonly statusCode?: number | undefined;
    readonly responseBody?: unknown | undefined;
    constructor(message: string, statusCode?: number | undefined, responseBody?: unknown | undefined);
}
export interface AuthenticateOptions {
    env?: MHEnvironment;
}
export declare function authenticate(nit: string, password: string, options?: AuthenticateOptions): Promise<MHAuthResponse>;
//# sourceMappingURL=auth.d.ts.map