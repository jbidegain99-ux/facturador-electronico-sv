// Types for Hacienda Configuration

export type HaciendaEnvironment = 'TEST' | 'PRODUCTION';
export type TestingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_AUTHORIZATION' | 'AUTHORIZED';
export type HaciendaTestType = 'EMISSION' | 'CANCELLATION' | 'CONTINGENCY';
export type HaciendaTestStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export type DteTypeCode = '01' | '03' | '04' | '05' | '06' | '11' | '14';

export const DTE_TYPES: Record<DteTypeCode, string> = {
  '01': 'Factura',
  '03': 'Comprobante de Crédito Fiscal',
  '04': 'Nota de Remisión',
  '05': 'Nota de Crédito',
  '06': 'Nota de Débito',
  '11': 'Factura de Exportación',
  '14': 'Factura de Sujeto Excluido',
};

export const TESTS_REQUIRED: Record<DteTypeCode, { emission: number; cancellation: number }> = {
  '01': { emission: 5, cancellation: 1 },
  '03': { emission: 5, cancellation: 1 },
  '04': { emission: 3, cancellation: 1 },
  '05': { emission: 2, cancellation: 1 },
  '06': { emission: 2, cancellation: 1 },
  '11': { emission: 3, cancellation: 1 },
  '14': { emission: 3, cancellation: 1 },
};

export interface CertificateInfo {
  fileName: string;
  validUntil: string;
  nit: string | null;
  subject: string;
}

export interface EnvironmentConfigData {
  environment: HaciendaEnvironment;
  isConfigured: boolean;
  isValidated: boolean;
  tokenExpiry?: string;
  certificateInfo?: CertificateInfo;
  lastValidationAt?: string;
  lastValidationError?: string;
}

export interface HaciendaConfig {
  activeEnvironment: HaciendaEnvironment;
  testingStatus: TestingStatus;
  testingStartedAt?: string;
  testingCompletedAt?: string;
  productionAuthorizedAt?: string;
  testConfig: EnvironmentConfigData | null;
  prodConfig: EnvironmentConfigData | null;
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

export interface TestProgress {
  progress: TestProgressByDte[];
  totalRequired: number;
  totalCompleted: number;
  percentComplete: number;
  canRequestAuthorization: boolean;
  daysRemaining?: number;
  testingStartedAt?: string;
}

export interface TestRecord {
  id: string;
  dteType: DteTypeCode;
  dteName: string;
  testType: HaciendaTestType;
  status: HaciendaTestStatus;
  codigoGeneracion?: string;
  selloRecibido?: string;
  errorMessage?: string;
  executedAt: string;
}

export interface ExecuteTestResult {
  success: boolean;
  testRecord: TestRecord;
  progress: TestProgress;
}
