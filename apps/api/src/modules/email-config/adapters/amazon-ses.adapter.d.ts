import { BaseEmailAdapter, ConnectionTestResult, DecryptedEmailConfig, SendEmailParams, SendEmailResult, SendEmailWithAttachmentParams, ValidationResult } from './email-adapter.interface';
/**
 * Amazon SES adapter using SMTP interface
 * This approach is simpler and doesn't require AWS SDK
 * Uses SES SMTP credentials (not IAM credentials)
 */
export declare class AmazonSesAdapter extends BaseEmailAdapter {
    readonly provider: "AMAZON_SES";
    private readonly logger;
    private transporter;
    constructor(config: DecryptedEmailConfig);
    private createTransporter;
    private extractRegion;
    testConnection(): Promise<ConnectionTestResult>;
    validateConfiguration(): Promise<ValidationResult>;
    sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
    sendEmailWithAttachment(params: SendEmailWithAttachmentParams): Promise<SendEmailResult>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=amazon-ses.adapter.d.ts.map