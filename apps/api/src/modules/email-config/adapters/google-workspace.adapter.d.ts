import { BaseEmailAdapter, ConnectionTestResult, DecryptedEmailConfig, OAuthRefreshResult, SendEmailParams, SendEmailResult, SendEmailWithAttachmentParams, ValidationResult } from './email-adapter.interface';
/**
 * Google Workspace / Gmail email adapter using Gmail API
 * Requires Google Cloud Project with Gmail API enabled
 */
export declare class GoogleWorkspaceAdapter extends BaseEmailAdapter {
    readonly provider: "GOOGLE_WORKSPACE";
    private readonly logger;
    private readonly gmailUrl;
    private readonly tokenUrl;
    constructor(config: DecryptedEmailConfig);
    testConnection(): Promise<ConnectionTestResult>;
    validateConfiguration(): Promise<ValidationResult>;
    private getValidAccessToken;
    refreshOAuthToken(): Promise<OAuthRefreshResult>;
    /**
     * Build a MIME message for Gmail API
     */
    private buildMimeMessage;
    sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
    sendEmailWithAttachment(params: SendEmailWithAttachmentParams): Promise<SendEmailResult>;
}
//# sourceMappingURL=google-workspace.adapter.d.ts.map