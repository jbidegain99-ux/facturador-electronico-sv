import { BaseEmailAdapter, ConnectionTestResult, DecryptedEmailConfig, SendEmailParams, SendEmailResult, SendEmailWithAttachmentParams, ValidationResult } from './email-adapter.interface';
/**
 * Brevo (formerly Sendinblue) email adapter using REST API
 */
export declare class BrevoAdapter extends BaseEmailAdapter {
    readonly provider: "BREVO";
    private readonly logger;
    private readonly apiUrl;
    constructor(config: DecryptedEmailConfig);
    testConnection(): Promise<ConnectionTestResult>;
    validateConfiguration(): Promise<ValidationResult>;
    sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
    sendEmailWithAttachment(params: SendEmailWithAttachmentParams): Promise<SendEmailResult>;
}
//# sourceMappingURL=brevo.adapter.d.ts.map