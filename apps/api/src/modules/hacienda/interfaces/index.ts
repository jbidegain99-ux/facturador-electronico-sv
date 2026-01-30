// ============================================================================
// HACIENDA CONFIGURATION INTERFACES
// ============================================================================

export type HaciendaEnvironment = 'TEST' | 'PRODUCTION';
export type TestingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_AUTHORIZATION' | 'AUTHORIZED';
export type HaciendaTestType = 'EMISSION' | 'CANCELLATION' | 'CONTINGENCY';
export type HaciendaTestStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

// DTE Types and their codes
export const DTE_TYPES = {
  '01': 'Factura',
  '03': 'Comprobante de Crédito Fiscal',
  '04': 'Nota de Remisión',
  '05': 'Nota de Crédito',
  '06': 'Nota de Débito',
  '11': 'Factura de Exportación',
  '14': 'Factura de Sujeto Excluido',
} as const;

export type DteTypeCode = keyof typeof DTE_TYPES;

// Minimum tests required by Hacienda per DTE type
export const TESTS_REQUIRED: Record<DteTypeCode, { emission: number; cancellation: number }> = {
  '01': { emission: 5, cancellation: 1 },
  '03': { emission: 5, cancellation: 1 },
  '04': { emission: 3, cancellation: 1 },
  '05': { emission: 2, cancellation: 1 },
  '06': { emission: 2, cancellation: 1 },
  '11': { emission: 3, cancellation: 1 },
  '14': { emission: 3, cancellation: 1 },
};

// Hacienda API URLs
export const HACIENDA_URLS = {
  TEST: 'https://apitest.dtes.mh.gob.sv',
  PRODUCTION: 'https://api.dtes.mh.gob.sv',
} as const;

export const HACIENDA_ENDPOINTS = {
  AUTH: '/seguridad/auth',
  RECEPCION_DTE: '/fesv/recepciondte',
  RECEPCION_LOTE: '/fesv/recepcionlote',
  CONTINGENCIA: '/fesv/contingencia',
  ANULAR_DTE: '/fesv/anulardte',
  CONSULTA_DTE: '/fesv/recepcion/consultadte/',
} as const;

// Token validity
export const TOKEN_VALIDITY = {
  TEST: 48 * 60 * 60 * 1000, // 48 hours in ms
  PRODUCTION: 24 * 60 * 60 * 1000, // 24 hours in ms
} as const;

// Certificate information extracted from .p12
export interface CertificateInfo {
  subject: string;
  issuer: string;
  nit: string | null;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
}

// Environment configuration response
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

// Main Hacienda configuration response
export interface HaciendaConfigResponse {
  activeEnvironment: HaciendaEnvironment;
  testingStatus: TestingStatus;
  testingStartedAt?: Date;
  testingCompletedAt?: Date;
  productionAuthorizedAt?: Date;
  testConfig: EnvironmentConfigResponse | null;
  prodConfig: EnvironmentConfigResponse | null;
}

// Test progress by DTE type
export interface TestProgressByDte {
  dteType: DteTypeCode;
  dteName: string;
  emissionRequired: number;
  emissionCompleted: number;
  cancellationRequired: number;
  cancellationCompleted: number;
  isComplete: boolean;
}

// Overall test progress response
export interface TestProgressResponse {
  progress: TestProgressByDte[];
  totalRequired: number;
  totalCompleted: number;
  percentComplete: number;
  canRequestAuthorization: boolean;
  daysRemaining?: number;
  testingStartedAt?: Date;
}

// Test record for history
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

// Hacienda authentication response
export interface HaciendaAuthResponse {
  status: 'OK' | 'ERROR';
  body?: {
    token: string;
    roles: string[];
  };
  message?: string;
  descripcion?: string;
}

// Hacienda DTE reception response
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

// Test execution request
export interface ExecuteTestRequest {
  dteType: DteTypeCode;
  testType: HaciendaTestType;
  testData?: Record<string, unknown>;
}

// Test execution result
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
