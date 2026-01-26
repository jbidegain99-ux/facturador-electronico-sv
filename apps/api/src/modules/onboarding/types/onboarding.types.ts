// Local type definitions for onboarding
// These replace Prisma enums since SQL Server doesn't support native enums

export const OnboardingStep = {
  WELCOME: 'WELCOME',
  COMPANY_INFO: 'COMPANY_INFO',
  HACIENDA_CREDENTIALS: 'HACIENDA_CREDENTIALS',
  DTE_TYPE_SELECTION: 'DTE_TYPE_SELECTION',
  TEST_ENVIRONMENT_REQUEST: 'TEST_ENVIRONMENT_REQUEST',
  TEST_CERTIFICATE: 'TEST_CERTIFICATE',
  API_CREDENTIALS_TEST: 'API_CREDENTIALS_TEST',
  EXECUTE_TESTS: 'EXECUTE_TESTS',
  REQUEST_AUTHORIZATION: 'REQUEST_AUTHORIZATION',
  PROD_CERTIFICATE: 'PROD_CERTIFICATE',
  API_CREDENTIALS_PROD: 'API_CREDENTIALS_PROD',
  FINAL_VALIDATION: 'FINAL_VALIDATION',
  COMPLETED: 'COMPLETED',
} as const;

export type OnboardingStep = (typeof OnboardingStep)[keyof typeof OnboardingStep];

export const OnboardingStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_HACIENDA: 'WAITING_HACIENDA',
  WAITING_CLIENT: 'WAITING_CLIENT',
  BLOCKED: 'BLOCKED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type OnboardingStatus = (typeof OnboardingStatus)[keyof typeof OnboardingStatus];

export const AssistanceLevel = {
  SELF_SERVICE: 'SELF_SERVICE',
  GUIDED: 'GUIDED',
  FULL_SERVICE: 'FULL_SERVICE',
} as const;

export type AssistanceLevel = (typeof AssistanceLevel)[keyof typeof AssistanceLevel];

export const DteType = {
  FACTURA: 'FACTURA',
  CREDITO_FISCAL: 'CREDITO_FISCAL',
  NOTA_REMISION: 'NOTA_REMISION',
  NOTA_CREDITO: 'NOTA_CREDITO',
  NOTA_DEBITO: 'NOTA_DEBITO',
  COMPROBANTE_RETENCION: 'COMPROBANTE_RETENCION',
  COMPROBANTE_LIQUIDACION: 'COMPROBANTE_LIQUIDACION',
  DOCUMENTO_CONTABLE_LIQUIDACION: 'DOCUMENTO_CONTABLE_LIQUIDACION',
  FACTURA_EXPORTACION: 'FACTURA_EXPORTACION',
  FACTURA_SUJETO_EXCLUIDO: 'FACTURA_SUJETO_EXCLUIDO',
  COMPROBANTE_DONACION: 'COMPROBANTE_DONACION',
} as const;

export type DteType = (typeof DteType)[keyof typeof DteType];

export const StepStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
  BLOCKED: 'BLOCKED',
  FAILED: 'FAILED',
} as const;

export type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];

export const PerformedBy = {
  TENANT: 'TENANT',
  REPUBLICODE: 'REPUBLICODE',
  SYSTEM: 'SYSTEM',
} as const;

export type PerformedBy = (typeof PerformedBy)[keyof typeof PerformedBy];

export const TestResult = {
  SUCCESS: 'SUCCESS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SIGNATURE_ERROR: 'SIGNATURE_ERROR',
  TRANSMISSION_ERROR: 'TRANSMISSION_ERROR',
  OTHER_ERROR: 'OTHER_ERROR',
} as const;

export type TestResult = (typeof TestResult)[keyof typeof TestResult];

export const CommunicationType = {
  EMAIL: 'EMAIL',
  IN_APP_MESSAGE: 'IN_APP_MESSAGE',
  PHONE_CALL_LOG: 'PHONE_CALL_LOG',
  MEETING_NOTES: 'MEETING_NOTES',
  SYSTEM_NOTIFICATION: 'SYSTEM_NOTIFICATION',
} as const;

export type CommunicationType = (typeof CommunicationType)[keyof typeof CommunicationType];

export const CommunicationDirection = {
  TO_TENANT: 'TO_TENANT',
  FROM_TENANT: 'FROM_TENANT',
  INTERNAL: 'INTERNAL',
} as const;

export type CommunicationDirection = (typeof CommunicationDirection)[keyof typeof CommunicationDirection];

// Interface definitions for Prisma models (for when Prisma client is unavailable)
export interface Tenant {
  id: string;
  nombre: string;
  nit: string;
  nrc: string;
  actividadEcon: string;
  direccion: string;
  telefono: string;
  correo: string;
  nombreComercial: string | null;
  certificatePath: string | null;
  mhToken: string | null;
  mhTokenExpiry: Date | null;
  logoUrl: string | null;
  primaryColor: string | null;
  plan: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantOnboarding {
  id: string;
  tenantId: string;
  currentStep: string;
  overallStatus: string;
  nit: string | null;
  nrc: string | null;
  razonSocial: string | null;
  nombreComercial: string | null;
  actividadEconomica: string | null;
  haciendaUser: string | null;
  haciendaPassword: string | null;
  assistanceLevel: string | null;
  assignedTo: string | null;
  notes: string | null;
  testCertificatePath: string | null;
  testCertificatePassword: string | null;
  prodCertificatePath: string | null;
  prodCertificatePassword: string | null;
  testApiUser: string | null;
  testApiPassword: string | null;
  prodApiUser: string | null;
  prodApiPassword: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DteTypeSelection {
  id: string;
  onboardingId: string;
  dteType: string;
  isRequired: boolean;
  testCompleted: boolean;
  testCompletedAt: Date | null;
}

export interface OnboardingStepRecord {
  id: string;
  onboardingId: string;
  step: string;
  status: string;
  stepData: string | null;
  notes: string | null;
  blockerReason: string | null;
  performedBy: string | null;
  performedByUserId: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
