export declare const OnboardingStep: {
    readonly WELCOME: "WELCOME";
    readonly COMPANY_INFO: "COMPANY_INFO";
    readonly HACIENDA_CREDENTIALS: "HACIENDA_CREDENTIALS";
    readonly DTE_TYPE_SELECTION: "DTE_TYPE_SELECTION";
    readonly TEST_ENVIRONMENT_REQUEST: "TEST_ENVIRONMENT_REQUEST";
    readonly TEST_CERTIFICATE: "TEST_CERTIFICATE";
    readonly API_CREDENTIALS_TEST: "API_CREDENTIALS_TEST";
    readonly EXECUTE_TESTS: "EXECUTE_TESTS";
    readonly REQUEST_AUTHORIZATION: "REQUEST_AUTHORIZATION";
    readonly PROD_CERTIFICATE: "PROD_CERTIFICATE";
    readonly API_CREDENTIALS_PROD: "API_CREDENTIALS_PROD";
    readonly FINAL_VALIDATION: "FINAL_VALIDATION";
    readonly COMPLETED: "COMPLETED";
};
export type OnboardingStep = (typeof OnboardingStep)[keyof typeof OnboardingStep];
export declare const OnboardingStatus: {
    readonly NOT_STARTED: "NOT_STARTED";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly WAITING_HACIENDA: "WAITING_HACIENDA";
    readonly WAITING_CLIENT: "WAITING_CLIENT";
    readonly BLOCKED: "BLOCKED";
    readonly COMPLETED: "COMPLETED";
    readonly CANCELLED: "CANCELLED";
};
export type OnboardingStatus = (typeof OnboardingStatus)[keyof typeof OnboardingStatus];
export declare const AssistanceLevel: {
    readonly SELF_SERVICE: "SELF_SERVICE";
    readonly GUIDED: "GUIDED";
    readonly FULL_SERVICE: "FULL_SERVICE";
};
export type AssistanceLevel = (typeof AssistanceLevel)[keyof typeof AssistanceLevel];
export declare const DteType: {
    readonly FACTURA: "FACTURA";
    readonly CREDITO_FISCAL: "CREDITO_FISCAL";
    readonly NOTA_REMISION: "NOTA_REMISION";
    readonly NOTA_CREDITO: "NOTA_CREDITO";
    readonly NOTA_DEBITO: "NOTA_DEBITO";
    readonly COMPROBANTE_RETENCION: "COMPROBANTE_RETENCION";
    readonly COMPROBANTE_LIQUIDACION: "COMPROBANTE_LIQUIDACION";
    readonly DOCUMENTO_CONTABLE_LIQUIDACION: "DOCUMENTO_CONTABLE_LIQUIDACION";
    readonly FACTURA_EXPORTACION: "FACTURA_EXPORTACION";
    readonly FACTURA_SUJETO_EXCLUIDO: "FACTURA_SUJETO_EXCLUIDO";
    readonly COMPROBANTE_DONACION: "COMPROBANTE_DONACION";
};
export type DteType = (typeof DteType)[keyof typeof DteType];
export declare const StepStatus: {
    readonly PENDING: "PENDING";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly COMPLETED: "COMPLETED";
    readonly SKIPPED: "SKIPPED";
    readonly BLOCKED: "BLOCKED";
    readonly FAILED: "FAILED";
};
export type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];
export declare const PerformedBy: {
    readonly TENANT: "TENANT";
    readonly REPUBLICODE: "REPUBLICODE";
    readonly SYSTEM: "SYSTEM";
};
export type PerformedBy = (typeof PerformedBy)[keyof typeof PerformedBy];
export declare const TestResult: {
    readonly SUCCESS: "SUCCESS";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly SIGNATURE_ERROR: "SIGNATURE_ERROR";
    readonly TRANSMISSION_ERROR: "TRANSMISSION_ERROR";
    readonly OTHER_ERROR: "OTHER_ERROR";
};
export type TestResult = (typeof TestResult)[keyof typeof TestResult];
export declare const CommunicationType: {
    readonly EMAIL: "EMAIL";
    readonly IN_APP_MESSAGE: "IN_APP_MESSAGE";
    readonly PHONE_CALL_LOG: "PHONE_CALL_LOG";
    readonly MEETING_NOTES: "MEETING_NOTES";
    readonly SYSTEM_NOTIFICATION: "SYSTEM_NOTIFICATION";
};
export type CommunicationType = (typeof CommunicationType)[keyof typeof CommunicationType];
export declare const CommunicationDirection: {
    readonly TO_TENANT: "TO_TENANT";
    readonly FROM_TENANT: "FROM_TENANT";
    readonly INTERNAL: "INTERNAL";
};
export type CommunicationDirection = (typeof CommunicationDirection)[keyof typeof CommunicationDirection];
export interface Tenant {
    id: string;
    nombre: string;
    nit: string;
    nrc: string;
    actividadEcon: string;
    telefono: string;
    correo: string;
    nombreComercial: string | null;
    direccion: string;
    plan: string;
    planId: string | null;
    planStatus: string;
    planStartDate: Date | null;
    planEndDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface TenantOnboarding {
    id: string;
    tenantId: string;
    currentStep: string;
    overallStatus: string;
    assistanceLevel: string;
    assignedTo: string | null;
    notes: string | null;
    testCertificatePath: string | null;
    testCertificatePassword: string | null;
    prodCertificatePath: string | null;
    prodCertificatePassword: string | null;
    haciendaUserTest: string | null;
    haciendaPasswordTest: string | null;
    haciendaUserProd: string | null;
    haciendaPasswordProd: string | null;
    createdAt: Date;
    updatedAt: Date;
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
    performedById: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
}
export interface DteTypeSelection {
    id: string;
    onboardingId: string;
    dteType: string;
    isEnabled: boolean;
    testStatus: string | null;
    prodStatus: string | null;
    testCompletedAt: Date | null;
    prodCompletedAt: Date | null;
}
//# sourceMappingURL=onboarding.types.d.ts.map