import { EmailProvider, EmailAuthMethod } from '../types/email.types';
export declare class CreateEmailConfigDto {
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
    notes?: string;
}
//# sourceMappingURL=create-email-config.dto.d.ts.map