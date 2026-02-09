export type HaciendaEnvironment = 'TEST' | 'PRODUCTION';
export type TestingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_AUTHORIZATION' | 'AUTHORIZED';
export type HaciendaTestType = 'EMISSION' | 'CANCELLATION' | 'CONTINGENCY';
export type HaciendaTestStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export declare const DTE_TYPES: {
    readonly '01': "Factura";
    readonly '03': "Comprobante de Crédito Fiscal";
    readonly '04': "Nota de Remisión";
    readonly '05': "Nota de Crédito";
    readonly '06': "Nota de Débito";
    readonly '11': "Factura de Exportación";
    readonly '14': "Factura de Sujeto Excluido";
};
export type DteTypeCode = keyof typeof DTE_TYPES;
export declare const TESTS_REQUIRED: Record<DteTypeCode, {
    emission: number;
    cancellation: number;
}>;
export declare const HACIENDA_URLS: {
    readonly TEST: "https://apitest.dtes.mh.gob.sv";
    readonly PRODUCTION: "https://api.dtes.mh.gob.sv";
};
export declare const HACIENDA_ENDPOINTS: {
    readonly AUTH: "/seguridad/auth";
    readonly RECEPCION_DTE: "/fesv/recepciondte";
    readonly RECEPCION_LOTE: "/fesv/recepcionlote";
    readonly CONTINGENCIA: "/fesv/contingencia";
    readonly ANULAR_DTE: "/fesv/anulardte";
    readonly CONSULTA_DTE: "/fesv/recepcion/consultadte/";
};
export declare const TOKEN_VALIDITY: {
    readonly TEST: number;
    readonly PRODUCTION: number;
};
export interface CertificateInfo {
    subject: string;
    issuer: string;
    nit: string | null;
    validFrom: Date;
    validTo: Date;
    serialNumber: string;
}
export interface EnvironmentConfigResponse {
    environment: HaciendaEnvironment;
    isConfigured: boolean;
    isValidated: boolean;
    tokenExpiry?: Date;
    certificateInfo?: {
        fileName: string;
        validUntil: Date;
        nit: string | null;
        subject: string;
    };
    lastValidationAt?: Date;
    lastValidationError?: string;
}
export interface HaciendaConfigResponse {
    activeEnvironment: HaciendaEnvironment;
    testingStatus: TestingStatus;
    testingStartedAt?: Date;
    testingCompletedAt?: Date;
    productionAuthorizedAt?: Date;
    testConfig: EnvironmentConfigResponse | null;
    prodConfig: EnvironmentConfigResponse | null;
}
export interface TestProgressByDte {
    dteType: DteTypeCode;
    dteName: string;
    emissionRequired: number;
    emissionCompleted: number;
    cancellationRequired: number;
    cancellationCompleted: number;
    isComplete: boolean;
}
export interface TestProgressResponse {
    progress: TestProgressByDte[];
    totalRequired: number;
    totalCompleted: number;
    percentComplete: number;
    canRequestAuthorization: boolean;
    daysRemaining?: number;
    testingStartedAt?: Date;
}
export interface TestRecordResponse {
    id: string;
    dteType: DteTypeCode;
    dteName: string;
    testType: HaciendaTestType;
    status: HaciendaTestStatus;
    codigoGeneracion?: string;
    selloRecibido?: string;
    errorMessage?: string;
    executedAt: Date;
}
export interface HaciendaAuthResponse {
    status: 'OK' | 'ERROR';
    body?: {
        token: string;
        roles: string[];
    };
    message?: string;
    descripcion?: string;
}
export interface HaciendaRecepcionResponse {
    version: number;
    ambiente: string;
    versionApp: number;
    estado: 'PROCESADO' | 'RECHAZADO';
    codigoGeneracion: string;
    selloRecibido?: string;
    fhProcesamiento?: string;
    clasificaMsg?: string;
    codigoMsg?: string;
    descripcionMsg?: string;
    observaciones?: string[];
}
export interface ExecuteTestRequest {
    dteType: DteTypeCode;
    testType: HaciendaTestType;
    testData?: Record<string, unknown>;
}
export interface ExecuteTestResult {
    success: boolean;
    testRecord: {
        id: string;
        dteType: DteTypeCode;
        testType: HaciendaTestType;
        status: HaciendaTestStatus;
        codigoGeneracion?: string;
        selloRecibido?: string;
        errorMessage?: string;
        executedAt: Date;
    };
    progress: TestProgressResponse;
}
//# sourceMappingURL=index.d.ts.map