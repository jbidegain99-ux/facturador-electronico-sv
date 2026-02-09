export type OnboardingStep = 'WELCOME' | 'COMPANY_INFO' | 'HACIENDA_CREDENTIALS' | 'DTE_TYPE_SELECTION' | 'TEST_ENVIRONMENT_REQUEST' | 'TEST_CERTIFICATE' | 'API_CREDENTIALS_TEST' | 'EXECUTE_TESTS' | 'REQUEST_AUTHORIZATION' | 'PROD_CERTIFICATE' | 'API_CREDENTIALS_PROD' | 'FINAL_VALIDATION' | 'COMPLETED';
export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_HACIENDA' | 'WAITING_CLIENT' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'SKIPPED';
export type AssistanceLevel = 'SELF_SERVICE' | 'GUIDED' | 'FULL_SERVICE';
export type DteType = 'FACTURA' | 'CREDITO_FISCAL' | 'NOTA_REMISION' | 'NOTA_CREDITO' | 'NOTA_DEBITO' | 'COMPROBANTE_RETENCION' | 'COMPROBANTE_LIQUIDACION' | 'DOCUMENTO_CONTABLE_LIQUIDACION' | 'FACTURA_EXPORTACION' | 'FACTURA_SUJETO_EXCLUIDO' | 'COMPROBANTE_DONACION';
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
    nit?: string;
    nrc?: string;
    razonSocial?: string;
    nombreComercial?: string;
    actividadEconomica?: string;
    emailHacienda?: string;
    telefonoHacienda?: string;
    hasHaciendaCredentials: boolean;
    hasTestCertificate: boolean;
    hasTestApiCredentials: boolean;
    hasProdCertificate: boolean;
    hasProdApiCredentials: boolean;
    dteTypes?: DteTypeSelection[];
    testProgress?: TestProgressSummary;
    steps: StepDetail[];
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
    certificate: string;
    password: string;
    expiryDate?: string;
    privateKey?: string;
    uploadMode?: 'combined' | 'separate';
}
export interface ApiCredentialsForm {
    apiPassword: string;
    environmentUrl?: string;
}
export declare const STEP_INFO: Record<OnboardingStep, {
    name: string;
    description: string;
    icon: string;
}>;
export declare const DTE_TYPE_INFO: Record<DteType, {
    name: string;
    description: string;
}>;
//# sourceMappingURL=onboarding.d.ts.map