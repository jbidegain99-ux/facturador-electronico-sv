// Local type definitions for email configuration
// These replace Prisma enums since SQL Server doesn't support native enums

export const EmailProvider = {
  SENDGRID: 'SENDGRID',
  MAILGUN: 'MAILGUN',
  AMAZON_SES: 'AMAZON_SES',
  MICROSOFT_365: 'MICROSOFT_365',
  GOOGLE_WORKSPACE: 'GOOGLE_WORKSPACE',
  POSTMARK: 'POSTMARK',
  BREVO: 'BREVO',
  MAILTRAP: 'MAILTRAP',
  SMTP_GENERIC: 'SMTP_GENERIC',
} as const;

export type EmailProvider = (typeof EmailProvider)[keyof typeof EmailProvider];

export const EmailAuthMethod = {
  API_KEY: 'API_KEY',
  SMTP_BASIC: 'SMTP_BASIC',
  OAUTH2: 'OAUTH2',
  AWS_IAM: 'AWS_IAM',
} as const;

export type EmailAuthMethod = (typeof EmailAuthMethod)[keyof typeof EmailAuthMethod];

export const ConfiguredBy = {
  SELF: 'SELF',
  REPUBLICODE: 'REPUBLICODE',
  PENDING: 'PENDING',
} as const;

export type ConfiguredBy = (typeof ConfiguredBy)[keyof typeof ConfiguredBy];

export const HealthCheckType = {
  CONNECTION_TEST: 'CONNECTION_TEST',
  AUTHENTICATION_TEST: 'AUTHENTICATION_TEST',
  SEND_TEST: 'SEND_TEST',
  QUOTA_CHECK: 'QUOTA_CHECK',
  OAUTH_REFRESH: 'OAUTH_REFRESH',
} as const;

export type HealthCheckType = (typeof HealthCheckType)[keyof typeof HealthCheckType];

export const HealthStatus = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNHEALTHY: 'UNHEALTHY',
  UNKNOWN: 'UNKNOWN',
} as const;

export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];

export const EmailSendStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  OPENED: 'OPENED',
  BOUNCED: 'BOUNCED',
  FAILED: 'FAILED',
  SPAM_REPORTED: 'SPAM_REPORTED',
} as const;

export type EmailSendStatus = (typeof EmailSendStatus)[keyof typeof EmailSendStatus];

export const EmailRequestType = {
  NEW_SETUP: 'NEW_SETUP',
  MIGRATION: 'MIGRATION',
  CONFIGURATION_HELP: 'CONFIGURATION_HELP',
  TROUBLESHOOTING: 'TROUBLESHOOTING',
} as const;

export type EmailRequestType = (typeof EmailRequestType)[keyof typeof EmailRequestType];

export const RequestStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_CLIENT: 'WAITING_CLIENT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const MessageSender = {
  TENANT: 'TENANT',
  REPUBLICODE: 'REPUBLICODE',
  SYSTEM: 'SYSTEM',
} as const;

export type MessageSender = (typeof MessageSender)[keyof typeof MessageSender];

// Model interfaces (to avoid direct @prisma/client imports)
export interface TenantEmailConfig {
  id: string;
  tenantId: string;

  // Provider and method
  provider: string;
  authMethod: string;
  isActive: boolean;
  isVerified: boolean;

  // SMTP Configuration
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean | null;
  smtpUser: string | null;
  smtpPassword: string | null;

  // API Configuration
  apiKey: string | null;
  apiSecret: string | null;
  apiEndpoint: string | null;

  // OAuth2 (for M365 and Google)
  oauth2ClientId: string | null;
  oauth2ClientSecret: string | null;
  oauth2TenantId: string | null;
  oauth2RefreshToken: string | null;
  oauth2AccessToken: string | null;
  oauth2TokenExpiry: Date | null;

  // Sender Configuration
  fromEmail: string;
  fromName: string;
  replyToEmail: string | null;

  // Advanced Configuration
  rateLimitPerHour: number | null;
  retryAttempts: number | null;
  timeoutSeconds: number | null;

  // Metadata
  configuredBy: string;
  configuredByUserId: string | null;
  notes: string | null;

  // Audit
  createdAt: Date;
  updatedAt: Date;
  verifiedAt: Date | null;
  lastTestAt: Date | null;
}

export interface EmailConfigRequest {
  id: string;
  tenantId: string;
  requestType: string;
  status: string;
  preferredProvider: string | null;
  description: string | null;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}
