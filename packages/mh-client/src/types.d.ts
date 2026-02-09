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
export declare function isAuthSuccess(response: MHAuthResponse): response is MHAuthResponse & {
    body: MHAuthResponseBody;
};
export type MhAuthRequest = MHAuthRequest;
export type MhAuthResponse = MHAuthResponse;
export interface MhClientConfig {
    baseUrl: string;
    ambiente: '00' | '01';
}
export interface MhRecepcionRequest {
    ambiente: '00' | '01';
    idEnvio: number;
    version: number;
    tipoDte: string;
    documento: string;
}
export interface MhRecepcionResponse {
    version: number;
    ambiente: string;
    versionApp: number;
    estado: string;
    codigoGeneracion: string;
    selloRecibido: string | null;
    fhProcesamiento: string;
    clasificaMsg: string;
    codigoMsg: string;
    descripcionMsg: string;
    observaciones: string[];
}
//# sourceMappingURL=types.d.ts.map