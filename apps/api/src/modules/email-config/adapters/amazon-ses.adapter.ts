import { Logger } from '@nestjs/common';
import { EmailProvider } from '../types/email.types';
import * as nodemailer from 'nodemailer';
import {
  BaseEmailAdapter,
  ConnectionTestResult,
  DecryptedEmailConfig,
  SendEmailParams,
  SendEmailResult,
  SendEmailWithAttachmentParams,
  ValidationResult,
} from './email-adapter.interface';

/**
 * Amazon SES adapter using SMTP interface
 * This approach is simpler and doesn't require AWS SDK
 * Uses SES SMTP credentials (not IAM credentials)
 */
export class AmazonSesAdapter extends BaseEmailAdapter {
  readonly provider = EmailProvider.AMAZON_SES;
  private readonly logger = new Logger(AmazonSesAdapter.name);
  private transporter: nodemailer.Transporter;

  constructor(config: DecryptedEmailConfig) {
    super(config);
    this.transporter = this.createTransporter();
  }

  private createTransporter(): nodemailer.Transporter {
    // SES SMTP endpoints by region
    const region = this.extractRegion();
    const smtpHost = `email-smtp.${region}.amazonaws.com`;

    return nodemailer.createTransport({
      host: this.config.smtpHost || smtpHost,
      port: this.config.smtpPort || 587,
      secure: this.config.smtpSecure ?? false,
      auth: {
        user: this.config.smtpUser || this.config.apiKey, // SES SMTP username
        pass: this.config.smtpPassword || this.config.apiSecret, // SES SMTP password
      },
      tls: {
        rejectUnauthorized: true,
      },
      connectionTimeout: this.getTimeoutMs(),
      greetingTimeout: this.getTimeoutMs(),
      socketTimeout: this.getTimeoutMs(),
    });
  }

  private extractRegion(): string {
    // Try to extract region from endpoint or default to us-east-1
    if (this.config.apiEndpoint) {
      const match = this.config.apiEndpoint.match(
        /email-smtp\.([a-z0-9-]+)\.amazonaws\.com/,
      );
      if (match) return match[1];
    }
    return 'us-east-1';
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      await this.transporter.verify();

      return {
        success: true,
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as NodeJS.ErrnoException).code;

      this.logger.warn(`Amazon SES connection test failed: ${errorMessage}`);

      return {
        success: false,
        responseTimeMs: Date.now() - startTime,
        errorMessage,
        errorCode,
      };
    }
  }

  async validateConfiguration(): Promise<ValidationResult> {
    const errors: string[] = [];

    // Either SMTP or API credentials are required
    const hasSmtp = this.config.smtpUser && this.config.smtpPassword;
    const hasApi = this.config.apiKey && this.config.apiSecret;

    if (!hasSmtp && !hasApi) {
      errors.push(
        'SES SMTP credentials (smtpUser/smtpPassword) or API credentials (apiKey/apiSecret) are required',
      );
    }

    if (!this.config.fromEmail) {
      errors.push('From email is required (must be verified in SES)');
    }

    if (!this.config.fromName) {
      errors.push('From name is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      const recipients = this.normalizeRecipients(params.to);

      const mailOptions: nodemailer.SendMailOptions = {
        from: this.getFromAddress(),
        to: recipients.join(', '),
        cc: params.cc?.join(', '),
        bcc: params.bcc?.join(', '),
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo || this.getReplyTo(),
        headers: process.env.SES_CONFIGURATION_SET
          ? { ...params.headers, 'X-SES-CONFIGURATION-SET': process.env.SES_CONFIGURATION_SET }
          : params.headers,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.debug(
        `Email sent successfully via Amazon SES. MessageId: ${info.messageId}`,
      );

      return {
        success: true,
        messageId: info.messageId,
        providerResponse: info,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to send email via Amazon SES: ${errorMessage}`,
      );

      return {
        success: false,
        errorMessage,
        errorCode: (error as NodeJS.ErrnoException).code,
      };
    }
  }

  async sendEmailWithAttachment(
    params: SendEmailWithAttachmentParams,
  ): Promise<SendEmailResult> {
    try {
      const recipients = this.normalizeRecipients(params.to);

      const mailOptions: nodemailer.SendMailOptions = {
        from: this.getFromAddress(),
        to: recipients.join(', '),
        cc: params.cc?.join(', '),
        bcc: params.bcc?.join(', '),
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo || this.getReplyTo(),
        headers: params.headers,
        attachments: params.attachments.map((att) => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content)
            ? att.content
            : Buffer.from(att.content, 'base64'),
          contentType: att.contentType,
          contentDisposition: att.contentDisposition || 'attachment',
          cid: att.cid,
        })),
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.debug(
        `Email with attachments sent successfully via Amazon SES. MessageId: ${info.messageId}`,
      );

      return {
        success: true,
        messageId: info.messageId,
        providerResponse: info,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to send email with attachments via Amazon SES: ${errorMessage}`,
      );

      return {
        success: false,
        errorMessage,
        errorCode: (error as NodeJS.ErrnoException).code,
      };
    }
  }

  async dispose(): Promise<void> {
    this.transporter.close();
  }
}
