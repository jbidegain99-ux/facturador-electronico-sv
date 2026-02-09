import { BaseEmailAdapter, ConnectionTestResult, DecryptedEmailConfig, SendEmailParams, SendEmailResult, SendEmailWithAttachmentParams, ValidationResult } from './email-adapter.interface';
/**
 * Postmark email adapter using REST API
 * Postmark is focused on transactional emails with excellent deliverability
 */
export declare class PostmarkAdapter extends BaseEmailAdapter {
    readonly provider: "POSTMARK";
    private readonly logger;
    private readonly apiUrl;
    constructor(config: DecryptedEmailConfig);
    testConnection(): Promise<ConnectionTestResult>;
    validateConfiguration(): Promise<ValidationResult>;
    sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
    sendEmailWithAttachment(params: SendEmailWithAttachmentParams): Promise<SendEmailResult>;
}
//# sourceMappingURL=postmark.adapter.d.ts.map