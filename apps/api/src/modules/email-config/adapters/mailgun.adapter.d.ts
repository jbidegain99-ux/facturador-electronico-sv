import { BaseEmailAdapter, ConnectionTestResult, DecryptedEmailConfig, SendEmailParams, SendEmailResult, SendEmailWithAttachmentParams, ValidationResult } from './email-adapter.interface';
/**
 * Mailgun email adapter using REST API
 */
export declare class MailgunAdapter extends BaseEmailAdapter {
    readonly provider: "MAILGUN";
    private readonly logger;
    private domain;
    private baseUrl;
    constructor(config: DecryptedEmailConfig);
    private extractDomain;
    testConnection(): Promise<ConnectionTestResult>;
    validateConfiguration(): Promise<ValidationResult>;
    sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
    sendEmailWithAttachment(params: SendEmailWithAttachmentParams): Promise<SendEmailResult>;
}
//# sourceMappingURL=mailgun.adapter.d.ts.map