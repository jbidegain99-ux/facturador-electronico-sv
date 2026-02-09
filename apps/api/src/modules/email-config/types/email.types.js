"use strict";
// Local type definitions for email configuration
// These replace Prisma enums since SQL Server doesn't support native enums
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSender = exports.RequestStatus = exports.EmailRequestType = exports.EmailSendStatus = exports.HealthStatus = exports.HealthCheckType = exports.ConfiguredBy = exports.EmailAuthMethod = exports.EmailProvider = void 0;
exports.EmailProvider = {
    SENDGRID: 'SENDGRID',
    MAILGUN: 'MAILGUN',
    AMAZON_SES: 'AMAZON_SES',
    MICROSOFT_365: 'MICROSOFT_365',
    GOOGLE_WORKSPACE: 'GOOGLE_WORKSPACE',
    POSTMARK: 'POSTMARK',
    BREVO: 'BREVO',
    MAILTRAP: 'MAILTRAP',
    SMTP_GENERIC: 'SMTP_GENERIC',
};
exports.EmailAuthMethod = {
    API_KEY: 'API_KEY',
    SMTP_BASIC: 'SMTP_BASIC',
    OAUTH2: 'OAUTH2',
    AWS_IAM: 'AWS_IAM',
};
exports.ConfiguredBy = {
    SELF: 'SELF',
    REPUBLICODE: 'REPUBLICODE',
    PENDING: 'PENDING',
};
exports.HealthCheckType = {
    CONNECTION_TEST: 'CONNECTION_TEST',
    AUTHENTICATION_TEST: 'AUTHENTICATION_TEST',
    SEND_TEST: 'SEND_TEST',
    QUOTA_CHECK: 'QUOTA_CHECK',
    OAUTH_REFRESH: 'OAUTH_REFRESH',
};
exports.HealthStatus = {
    HEALTHY: 'HEALTHY',
    DEGRADED: 'DEGRADED',
    UNHEALTHY: 'UNHEALTHY',
    UNKNOWN: 'UNKNOWN',
};
exports.EmailSendStatus = {
    PENDING: 'PENDING',
    SENT: 'SENT',
    DELIVERED: 'DELIVERED',
    OPENED: 'OPENED',
    BOUNCED: 'BOUNCED',
    FAILED: 'FAILED',
    SPAM_REPORTED: 'SPAM_REPORTED',
};
exports.EmailRequestType = {
    NEW_SETUP: 'NEW_SETUP',
    MIGRATION: 'MIGRATION',
    CONFIGURATION_HELP: 'CONFIGURATION_HELP',
    TROUBLESHOOTING: 'TROUBLESHOOTING',
};
exports.RequestStatus = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    WAITING_CLIENT: 'WAITING_CLIENT',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
};
exports.MessageSender = {
    TENANT: 'TENANT',
    REPUBLICODE: 'REPUBLICODE',
    SYSTEM: 'SYSTEM',
};
