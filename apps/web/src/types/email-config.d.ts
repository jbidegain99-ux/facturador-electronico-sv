export type EmailProvider = 'SENDGRID' | 'MAILGUN' | 'AMAZON_SES' | 'MICROSOFT_365' | 'GOOGLE_WORKSPACE' | 'POSTMARK' | 'BREVO' | 'MAILTRAP' | 'SMTP_GENERIC';
export type EmailAuthMethod = 'API_KEY' | 'SMTP_BASIC' | 'OAUTH2' | 'AWS_IAM';
export type ConfiguredBy = 'SELF' | 'REPUBLICODE' | 'PENDING';
export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
export type RequestStatus = 'PENDING' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'COMPLETED' | 'CANCELLED';
export type EmailRequestType = 'NEW_SETUP' | 'MIGRATION' | 'CONFIGURATION_HELP' | 'TROUBLESHOOTING';
export interface EmailConfig {
    id: string;
    provider: EmailProvider;
    authMethod: EmailAuthMethod;
    isActive: boolean;
    isVerified: boolean;
    fromEmail: string;
    fromName: string;
    replyToEmail?: string;
    rateLimitPerHour?: number;
    configuredBy: ConfiguredBy;
    lastTestAt?: string;
    verifiedAt?: string;
    createdAt: string;
    updatedAt: string;
}
export interface EmailConfigForm {
    provider: EmailProvider;
    authMethod: EmailAuthMethod;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUser?: string;
    smtpPassword?: string;
    apiKey?: string;
    apiSecret?: string;
    apiEndpoint?: string;
    oauth2ClientId?: string;
    oauth2ClientSecret?: string;
    oauth2TenantId?: string;
    fromEmail: string;
    fromName: string;
    replyToEmail?: string;
    rateLimitPerHour?: number;
    retryAttempts?: number;
    timeoutSeconds?: number;
}
export interface ConnectionTestResult {
    success: boolean;
    responseTimeMs: number;
    message: string;
    errorCode?: string;
}
export interface SendTestResult {
    success: boolean;
    messageId?: string;
    message: string;
}
export interface EmailSendLog {
    id: string;
    recipientEmail: string;
    subject: string;
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'BOUNCED' | 'FAILED' | 'SPAM_REPORTED';
    providerMessageId?: string;
    errorMessage?: string;
    sentAt: string;
    dteId?: string;
}
export interface HealthCheck {
    id: string;
    checkType: string;
    status: HealthStatus;
    responseTimeMs?: number;
    errorMessage?: string;
    checkedAt: string;
}
export interface AssistanceRequest {
    id: string;
    requestType: EmailRequestType;
    desiredProvider?: EmailProvider;
    currentProvider?: string;
    accountEmail?: string;
    additionalNotes?: string;
    status: RequestStatus;
    assignedTo?: string;
    createdAt: string;
    updatedAt: string;
    messages: AssistanceMessage[];
}
export interface AssistanceMessage {
    id: string;
    senderType: 'TENANT' | 'REPUBLICODE' | 'SYSTEM';
    message: string;
    createdAt: string;
}
export interface ProviderInfo {
    id: EmailProvider;
    name: string;
    description: string;
    icon: string;
    authMethods: EmailAuthMethod[];
    requiresOAuth: boolean;
    features: string[];
}
export declare const EMAIL_PROVIDERS: ProviderInfo[];
//# sourceMappingURL=email-config.d.ts.map