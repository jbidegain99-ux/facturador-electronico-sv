import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailProvider } from '@prisma/client';
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
 * Generic SMTP adapter using Nodemailer
 * Works with any SMTP server including custom/self-hosted
 */
export class SmtpGenericAdapter extends BaseEmailAdapter {
  readonly provider = EmailProvider.SMTP_GENERIC;
  private readonly logger = new Logger(SmtpGenericAdapter.name);
  private transporter: nodemailer.Transporter;

  constructor(config: DecryptedEmailConfig) {
    super(config);
    this.transporter = this.createTransporter();
  }

  private createTransporter(): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: this.config.smtpHost,
      port: this.config.smtpPort || 587,
      secure: this.config.smtpSecure ?? (this.config.smtpPort === 465),
      auth: {
        user: this.config.smtpUser,
        pass: this.config.smtpPassword,
      },
      tls: {
        rejectUnauthorized: true,
      },
      connectionTimeout: this.getTimeoutMs(),
      greetingTimeout: this.getTimeoutMs(),
      socketTimeout: this.getTimeoutMs(),
    });
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

      this.logger.warn(`SMTP connection test failed: ${errorMessage}`);

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

    if (!this.config.smtpHost) {
      errors.push('SMTP host is required');
    }

    if (!this.config.smtpPort) {
      errors.push('SMTP port is required');
    }

    if (!this.config.smtpUser) {
      errors.push('SMTP username is required');
    }

    if (!this.config.smtpPassword) {
      errors.push('SMTP password is required');
    }

    if (!this.config.fromEmail) {
      errors.push('From email is required');
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
        headers: params.headers,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.debug(
        `Email sent successfully via SMTP. MessageId: ${info.messageId}`,
      );

      return {
        success: true,
        messageId: info.messageId,
        providerResponse: info,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Failed to send email via SMTP: ${errorMessage}`);

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
        `Email with attachments sent successfully via SMTP. MessageId: ${info.messageId}`,
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
        `Failed to send email with attachments via SMTP: ${errorMessage}`,
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
