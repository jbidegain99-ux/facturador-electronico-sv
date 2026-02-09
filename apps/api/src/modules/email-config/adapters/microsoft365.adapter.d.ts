import { BaseEmailAdapter, ConnectionTestResult, DecryptedEmailConfig, OAuthRefreshResult, SendEmailParams, SendEmailResult, SendEmailWithAttachmentParams, ValidationResult } from './email-adapter.interface';
/**
 * Microsoft 365 / Outlook email adapter using Microsoft Graph API
 * Requires Azure AD App Registration with Mail.Send permission
 */
export declare class Microsoft365Adapter extends BaseEmailAdapter {
    readonly provider: "MICROSOFT_365";
    private readonly logger;
    private readonly graphUrl;
    private readonly tokenUrl;
    constructor(config: DecryptedEmailConfig);
    testConnection(): Promise<ConnectionTestResult>;
    validateConfiguration(): Promise<ValidationResult>;
    private getValidAccessToken;
    refreshOAuthToken(): Promise<OAuthRefreshResult>;
    sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
    sendEmailWithAttachment(params: SendEmailWithAttachmentParams): Promise<SendEmailResult>;
}
//# sourceMappingURL=microsoft365.adapter.d.ts.map