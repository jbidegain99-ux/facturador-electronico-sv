import { BaseEmailAdapter, ConnectionTestResult, DecryptedEmailConfig, SendEmailParams, SendEmailResult, SendEmailWithAttachmentParams, ValidationResult } from './email-adapter.interface';
/**
 * Generic SMTP adapter using Nodemailer
 * Works with any SMTP server including custom/self-hosted
 */
export declare class SmtpGenericAdapter extends BaseEmailAdapter {
    readonly provider: "SMTP_GENERIC";
    private readonly logger;
    private transporter;
    constructor(config: DecryptedEmailConfig);
    private createTransporter;
    testConnection(): Promise<ConnectionTestResult>;
    validateConfiguration(): Promise<ValidationResult>;
    sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
    sendEmailWithAttachment(params: SendEmailWithAttachmentParams): Promise<SendEmailResult>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=smtp-generic.adapter.d.ts.map