import { BaseEmailAdapter, ConnectionTestResult, DecryptedEmailConfig, QuotaStatus, SendEmailParams, SendEmailResult, SendEmailWithAttachmentParams, ValidationResult } from './email-adapter.interface';
/**
 * SendGrid email adapter using REST API
 */
export declare class SendGridAdapter extends BaseEmailAdapter {
    readonly provider: "SENDGRID";
    private readonly logger;
    private readonly apiUrl;
    constructor(config: DecryptedEmailConfig);
    testConnection(): Promise<ConnectionTestResult>;
    validateConfiguration(): Promise<ValidationResult>;
    sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
    sendEmailWithAttachment(params: SendEmailWithAttachmentParams): Promise<SendEmailResult>;
    getQuotaStatus(): Promise<QuotaStatus>;
}
//# sourceMappingURL=sendgrid.adapter.d.ts.map