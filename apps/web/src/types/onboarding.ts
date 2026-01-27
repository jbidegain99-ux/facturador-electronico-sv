// Onboarding types for frontend

export type OnboardingStep =
  | 'WELCOME'
  | 'COMPANY_INFO'
  | 'HACIENDA_CREDENTIALS'
  | 'DTE_TYPE_SELECTION'
  | 'TEST_ENVIRONMENT_REQUEST'
  | 'TEST_CERTIFICATE'
  | 'API_CREDENTIALS_TEST'
  | 'EXECUTE_TESTS'
  | 'REQUEST_AUTHORIZATION'
  | 'PROD_CERTIFICATE'
  | 'API_CREDENTIALS_PROD'
  | 'FINAL_VALIDATION'
  | 'COMPLETED';

export type OnboardingStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'WAITING_HACIENDA'
  | 'WAITING_CLIENT'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

export type StepStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'SKIPPED';

export type AssistanceLevel = 'SELF_SERVICE' | 'GUIDED' | 'FULL_SERVICE';

export type DteType =
  | 'FACTURA'
  | 'CREDITO_FISCAL'
  | 'NOTA_REMISION'
  | 'NOTA_CREDITO'
  | 'NOTA_DEBITO'
  | 'COMPROBANTE_RETENCION'
  | 'COMPROBANTE_LIQUIDACION'
  | 'DOCUMENTO_CONTABLE_LIQUIDACION'
  | 'FACTURA_EXPORTACION'
  | 'FACTURA_SUJETO_EXCLUIDO'
  | 'COMPROBANTE_DONACION';

export interface StepDetail {
  step: OnboardingStep;
  name: string;
  description: string;
  order: number;
  status: StepStatus;
  isCurrentStep: boolean;
  canNavigateTo: boolean;
  stepData?: Record<string, unknown>;
  notes?: string;
  blockerReason?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface OnboardingProgress {
  hasStarted: boolean;
  currentStep: OnboardingStep;
  overallStatus: OnboardingStatus;
  completedSteps: number;
  totalSteps: number;
  percentComplete: number;
  steps: StepDetail[];
  canProceed?: boolean;
  nextAction?: string;
}

export interface OnboardingState {
  id: string;
  tenantId: string;
  currentStep: OnboardingStep;
  overallStatus: OnboardingStatus;
  assistanceLevel: AssistanceLevel;
  // Company info
  nit?: string;
  nrc?: string;
  razonSocial?: string;
  nombreComercial?: string;
  actividadEconomica?: string;
  emailHacienda?: string;
  telefonoHacienda?: string;
  // Credentials status (not actual values)
  hasHaciendaCredentials: boolean;
  hasTestCertificate: boolean;
  hasTestApiCredentials: boolean;
  hasProdCertificate: boolean;
  hasProdApiCredentials: boolean;
  // DTE types
  dteTypes?: DteTypeSelection[];
  // Test progress
  testProgress?: TestProgressSummary;
  // Steps
  steps: StepDetail[];
  // Dates
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface DteTypeSelection {
  dteType: DteType;
  isRequired: boolean;
  testCompleted: boolean;
  testCompletedAt?: string;
  testsRequired: number;
  testsCompleted: number;
}

export interface DteTypeOption {
  dteType: DteType;
  name: string;
  testsRequired: number;
}

export interface TestProgressSummary {
  initialized: boolean;
  totalTestsRequired: number;
  totalTestsCompleted: number;
  percentComplete: number;
  dteProgress: {
    dteType: DteType;
    name: string;
    required: number;
    completed: number;
    isComplete: boolean;
  }[];
  eventProgress: {
    eventType: string;
    name: string;
    required: number;
    completed: number;
    isComplete: boolean;
  }[];
  canRequestAuthorization: boolean;
  lastTestAt?: string;
  lastTestResult?: 'SUCCESS' | 'FAILED';
}

export interface TestResult {
  success: boolean;
  message: string;
  responseCode?: string;
  selloRecibido?: string;
  codigoGeneracion?: string;
  errors?: string[];
  timestamp: string;
}

export interface Communication {
  id: string;
  type: 'NOTE' | 'QUESTION' | 'DOCUMENT' | 'NOTIFICATION';
  direction: 'INCOMING' | 'OUTGOING';
  subject?: string;
  content: string;
  attachments?: string[];
  relatedStep?: OnboardingStep;
  sentBy?: string;
  sentAt: string;
  readAt?: string;
}

// Form types
export interface CompanyInfoForm {
  nit: string;
  nrc?: string;
  razonSocial: string;
  nombreComercial?: string;
  actividadEconomica: string;
  emailHacienda: string;
  telefonoHacienda?: string;
}

export interface HaciendaCredentialsForm {
  haciendaUser: string;
  haciendaPassword: string;
}

export interface CertificateForm {
  certificate: string; // base64 - public certificate for separate mode, combined cert for p12/pfx mode
  password: string; // password for p12/pfx or encrypted private key
  expiryDate?: string;
  privateKey?: string; // base64 - private key for separate mode
  uploadMode?: 'combined' | 'separate';
}

export interface ApiCredentialsForm {
  apiPassword: string;
  environmentUrl?: string;
}

// Step metadata for UI
export const STEP_INFO: Record<
  OnboardingStep,
  { name: string; description: string; icon: string }
> = {
  WELCOME: {
    name: 'Bienvenida',
    description: 'Introducción al proceso de autorización',
    icon: 'HandWaving',
  },
  COMPANY_INFO: {
    name: 'Datos de Empresa',
    description: 'Información del contribuyente',
    icon: 'Building2',
  },
  HACIENDA_CREDENTIALS: {
    name: 'Credenciales MH',
    description: 'Acceso a Servicios en Línea',
    icon: 'Key',
  },
  DTE_TYPE_SELECTION: {
    name: 'Tipos de DTE',
    description: 'Documentos a emitir',
    icon: 'FileText',
  },
  TEST_ENVIRONMENT_REQUEST: {
    name: 'Ambiente Pruebas',
    description: 'Solicitar acceso',
    icon: 'FlaskConical',
  },
  TEST_CERTIFICATE: {
    name: 'Certificado Pruebas',
    description: 'Certificado digital',
    icon: 'ShieldCheck',
  },
  API_CREDENTIALS_TEST: {
    name: 'API Pruebas',
    description: 'Credenciales de API',
    icon: 'KeyRound',
  },
  EXECUTE_TESTS: {
    name: 'Ejecutar Pruebas',
    description: 'Pruebas técnicas',
    icon: 'PlayCircle',
  },
  REQUEST_AUTHORIZATION: {
    name: 'Solicitar Autorización',
    description: 'Enviar solicitud',
    icon: 'Send',
  },
  PROD_CERTIFICATE: {
    name: 'Certificado Producción',
    description: 'Certificado productivo',
    icon: 'ShieldCheck',
  },
  API_CREDENTIALS_PROD: {
    name: 'API Producción',
    description: 'Credenciales productivas',
    icon: 'KeyRound',
  },
  FINAL_VALIDATION: {
    name: 'Validación Final',
    description: 'Verificar configuración',
    icon: 'CheckCircle2',
  },
  COMPLETED: {
    name: 'Completado',
    description: '¡Listo para facturar!',
    icon: 'PartyPopper',
  },
};

export const DTE_TYPE_INFO: Record<DteType, { name: string; description: string }> = {
  FACTURA: {
    name: 'Factura',
    description: 'Factura electrónica para consumidores finales',
  },
  CREDITO_FISCAL: {
    name: 'Crédito Fiscal',
    description: 'Comprobante de Crédito Fiscal para contribuyentes',
  },
  NOTA_REMISION: {
    name: 'Nota de Remisión',
    description: 'Para traslado de mercaderías',
  },
  NOTA_CREDITO: {
    name: 'Nota de Crédito',
    description: 'Para anular o reducir el valor de facturas',
  },
  NOTA_DEBITO: {
    name: 'Nota de Débito',
    description: 'Para aumentar el valor de facturas',
  },
  COMPROBANTE_RETENCION: {
    name: 'Comprobante de Retención',
    description: 'Para retenciones de IVA',
  },
  COMPROBANTE_LIQUIDACION: {
    name: 'Comprobante de Liquidación',
    description: 'Para liquidaciones de comisiones',
  },
  DOCUMENTO_CONTABLE_LIQUIDACION: {
    name: 'Documento Contable',
    description: 'Documento contable de liquidación',
  },
  FACTURA_EXPORTACION: {
    name: 'Factura de Exportación',
    description: 'Para ventas al extranjero',
  },
  FACTURA_SUJETO_EXCLUIDO: {
    name: 'Factura Sujeto Excluido',
    description: 'Para sujetos excluidos del IVA',
  },
  COMPROBANTE_DONACION: {
    name: 'Comprobante de Donación',
    description: 'Para donaciones',
  },
};
