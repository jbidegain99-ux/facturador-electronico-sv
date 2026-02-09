import { BaseEmailAdapter, ConnectionTestResult, DecryptedEmailConfig, SendEmailParams, SendEmailResult, SendEmailWithAttachmentParams, ValidationResult } from './email-adapter.interface';
/**
 * Mailtrap email adapter using REST API
 * Great for testing/development environments
 */
export declare class MailtrapAdapter extends BaseEmailAdapter {
    readonly provider: "MAILTRAP";
    private readonly logger;
    private readonly apiUrl;
    constructor(config: DecryptedEmailConfig);
    testConnection(): Promise<ConnectionTestResult>;
    validateConfiguration(): Promise<ValidationResult>;
    sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
    sendEmailWithAttachment(params: SendEmailWithAttachmentParams): Promise<SendEmailResult>;
}
//# sourceMappingURL=mailtrap.adapter.d.ts.map