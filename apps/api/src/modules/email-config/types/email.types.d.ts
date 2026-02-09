export declare const EmailProvider: {
    readonly SENDGRID: "SENDGRID";
    readonly MAILGUN: "MAILGUN";
    readonly AMAZON_SES: "AMAZON_SES";
    readonly MICROSOFT_365: "MICROSOFT_365";
    readonly GOOGLE_WORKSPACE: "GOOGLE_WORKSPACE";
    readonly POSTMARK: "POSTMARK";
    readonly BREVO: "BREVO";
    readonly MAILTRAP: "MAILTRAP";
    readonly SMTP_GENERIC: "SMTP_GENERIC";
};
export type EmailProvider = (typeof EmailProvider)[keyof typeof EmailProvider];
export declare const EmailAuthMethod: {
    readonly API_KEY: "API_KEY";
    readonly SMTP_BASIC: "SMTP_BASIC";
    readonly OAUTH2: "OAUTH2";
    readonly AWS_IAM: "AWS_IAM";
};
export type EmailAuthMethod = (typeof EmailAuthMethod)[keyof typeof EmailAuthMethod];
export declare const ConfiguredBy: {
    readonly SELF: "SELF";
    readonly REPUBLICODE: "REPUBLICODE";
    readonly PENDING: "PENDING";
};
export type ConfiguredBy = (typeof ConfiguredBy)[keyof typeof ConfiguredBy];
export declare const HealthCheckType: {
    readonly CONNECTION_TEST: "CONNECTION_TEST";
    readonly AUTHENTICATION_TEST: "AUTHENTICATION_TEST";
    readonly SEND_TEST: "SEND_TEST";
    readonly QUOTA_CHECK: "QUOTA_CHECK";
    readonly OAUTH_REFRESH: "OAUTH_REFRESH";
};
export type HealthCheckType = (typeof HealthCheckType)[keyof typeof HealthCheckType];
export declare const HealthStatus: {
    readonly HEALTHY: "HEALTHY";
    readonly DEGRADED: "DEGRADED";
    readonly UNHEALTHY: "UNHEALTHY";
    readonly UNKNOWN: "UNKNOWN";
};
export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];
export declare const EmailSendStatus: {
    readonly PENDING: "PENDING";
    readonly SENT: "SENT";
    readonly DELIVERED: "DELIVERED";
    readonly OPENED: "OPENED";
    readonly BOUNCED: "BOUNCED";
    readonly FAILED: "FAILED";
    readonly SPAM_REPORTED: "SPAM_REPORTED";
};
export type EmailSendStatus = (typeof EmailSendStatus)[keyof typeof EmailSendStatus];
export declare const EmailRequestType: {
    readonly NEW_SETUP: "NEW_SETUP";
    readonly MIGRATION: "MIGRATION";
    readonly CONFIGURATION_HELP: "CONFIGURATION_HELP";
    readonly TROUBLESHOOTING: "TROUBLESHOOTING";
};
export type EmailRequestType = (typeof EmailRequestType)[keyof typeof EmailRequestType];
export declare const RequestStatus: {
    readonly PENDING: "PENDING";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly WAITING_CLIENT: "WAITING_CLIENT";
    readonly COMPLETED: "COMPLETED";
    readonly CANCELLED: "CANCELLED";
};
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];
export declare const MessageSender: {
    readonly TENANT: "TENANT";
    readonly REPUBLICODE: "REPUBLICODE";
    readonly SYSTEM: "SYSTEM";
};
export type MessageSender = (typeof MessageSender)[keyof typeof MessageSender];
import type { TenantEmailConfig as PrismaTenantEmailConfig, EmailConfigRequest as PrismaEmailConfigRequest } from '@prisma/client';
export type TenantEmailConfig = PrismaTenantEmailConfig;
export type EmailConfigRequest = PrismaEmailConfigRequest;
//# sourceMappingURL=email.types.d.ts.map