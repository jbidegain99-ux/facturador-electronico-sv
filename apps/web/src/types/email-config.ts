// Email Configuration Types

export type EmailProvider =
  | 'SENDGRID'
  | 'MAILGUN'
  | 'AMAZON_SES'
  | 'MICROSOFT_365'
  | 'GOOGLE_WORKSPACE'
  | 'POSTMARK'
  | 'BREVO'
  | 'MAILTRAP'
  | 'SMTP_GENERIC';

export type EmailAuthMethod = 'API_KEY' | 'SMTP_BASIC' | 'OAUTH2' | 'AWS_IAM';

export type ConfiguredBy = 'SELF' | 'REPUBLICODE' | 'PENDING';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

export type RequestStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'WAITING_CLIENT'
  | 'COMPLETED'
  | 'CANCELLED';

export type EmailRequestType =
  | 'NEW_SETUP'
  | 'MIGRATION'
  | 'CONFIGURATION_HELP'
  | 'TROUBLESHOOTING';

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

  // SMTP
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;

  // API
  apiKey?: string;
  apiSecret?: string;
  apiEndpoint?: string;

  // OAuth2
  oauth2ClientId?: string;
  oauth2ClientSecret?: string;
  oauth2TenantId?: string;

  // Sender
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;

  // Advanced
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

// Provider info for UI
export interface ProviderInfo {
  id: EmailProvider;
  name: string;
  description: string;
  icon: string;
  authMethods: EmailAuthMethod[];
  requiresOAuth: boolean;
  features: string[];
}

export const EMAIL_PROVIDERS: ProviderInfo[] = [
  {
    id: 'SENDGRID',
    name: 'SendGrid',
    description: 'Mejor deliverability, ideal para alto volumen',
    icon: '📧',
    authMethods: ['API_KEY'],
    requiresOAuth: false,
    features: ['API Key simple', 'Estadísticas detalladas', 'Templates'],
  },
  {
    id: 'MAILGUN',
    name: 'Mailgun',
    description: 'Excelente para desarrolladores',
    icon: '🔫',
    authMethods: ['API_KEY'],
    requiresOAuth: false,
    features: ['API REST', 'Logs detallados', 'Webhooks'],
  },
  {
    id: 'AMAZON_SES',
    name: 'Amazon SES',
    description: 'Más económico a escala',
    icon: '☁️',
    authMethods: ['SMTP_BASIC', 'AWS_IAM'],
    requiresOAuth: false,
    features: ['Bajo costo', 'Alta escalabilidad', 'Integración AWS'],
  },
  {
    id: 'MICROSOFT_365',
    name: 'Microsoft 365',
    description: 'Ideal si ya usa Outlook/Office 365',
    icon: '📨',
    authMethods: ['OAUTH2'],
    requiresOAuth: true,
    features: ['Integración Office', 'OAuth2 seguro', 'Buzón corporativo'],
  },
  {
    id: 'GOOGLE_WORKSPACE',
    name: 'Google Workspace',
    description: 'Ideal si ya usa Gmail empresarial',
    icon: '📬',
    authMethods: ['OAUTH2'],
    requiresOAuth: true,
    features: ['Integración Google', 'OAuth2 seguro', 'Gmail API'],
  },
  {
    id: 'POSTMARK',
    name: 'Postmark',
    description: 'Enfocado en email transaccional',
    icon: '📮',
    authMethods: ['API_KEY'],
    requiresOAuth: false,
    features: ['Alta deliverability', 'Templates', 'Tracking'],
  },
  {
    id: 'BREVO',
    name: 'Brevo',
    description: 'Buena opción para SMBs (ex-Sendinblue)',
    icon: '💌',
    authMethods: ['API_KEY'],
    requiresOAuth: false,
    features: ['Plan gratuito', 'Marketing + Transaccional', 'CRM'],
  },
  {
    id: 'MAILTRAP',
    name: 'Mailtrap',
    description: 'Ideal para testing y desarrollo',
    icon: '🧪',
    authMethods: ['API_KEY'],
    requiresOAuth: false,
    features: ['Ambiente de pruebas', 'Email preview', 'Testing'],
  },
  {
    id: 'SMTP_GENERIC',
    name: 'SMTP Genérico',
    description: 'Para servidores propios o no listados',
    icon: '⚙️',
    authMethods: ['SMTP_BASIC'],
    requiresOAuth: false,
    features: ['Compatible con cualquier SMTP', 'Configuración manual'],
  },
];
