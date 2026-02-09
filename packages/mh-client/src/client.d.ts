import type { MhClientConfig, MhAuthRequest, MhRecepcionRequest, MhRecepcionResponse } from './types';
export declare class MhClient {
    private config;
    private token;
    constructor(config: MhClientConfig);
    authenticate(credentials: MhAuthRequest): Promise<string>;
    sendDte(request: Omit<MhRecepcionRequest, 'ambiente'>): Promise<MhRecepcionResponse>;
    consultaDte(nitEmisor: string, tipoDte: string, codigoGeneracion: string): Promise<unknown>;
    setToken(token: string): void;
    getToken(): string | null;
}
//# sourceMappingURL=client.d.ts.map