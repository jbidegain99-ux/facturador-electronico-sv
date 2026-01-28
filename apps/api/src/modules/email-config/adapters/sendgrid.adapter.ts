import { Logger } from '@nestjs/common';
import { EmailProvider } from '../types/email.types';
import {
  BaseEmailAdapter,
  ConnectionTestResult,
  DecryptedEmailConfig,
  QuotaStatus,
  SendEmailParams,
  SendEmailResult,
  SendEmailWithAttachmentParams,
  ValidationResult,
} from './email-adapter.interface';

interface SendGridMailPersonalization {
  to: { email: string }[];
  cc?: { email: string }[];
  bcc?: { email: string }[];
}

interface SendGridMailContent {
  type: string;
  value: string;
}

interface SendGridAttachment {
  content: string;
  filename: string;
  type: string;
  disposition: string;
  content_id?: string;
}

interface SendGridMailRequest {
  personalizations: SendGridMailPersonalization[];
  from: { email: string; name: string };
  reply_to?: { email: string };
  subject: string;
  content: SendGridMailContent[];
  attachments?: SendGridAttachment[];
}

/**
 * SendGrid email adapter using REST API
 */
export class SendGridAdapter extends BaseEmailAdapter {
  readonly provider = EmailProvider.SENDGRID;
  private readonly logger = new Logger(SendGridAdapter.name);
  private readonly apiUrl = 'https://api.sendgrid.com/v3';

  constructor(config: DecryptedEmailConfig) {
    super(config);
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // Verify API key by fetching user profile
      const response = await fetch(`${this.apiUrl}/user/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.getTimeoutMs()),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return {
          success: false,
          responseTimeMs: Date.now() - startTime,
          errorMessage: `HTTP ${response.status}: ${errorBody}`,
          errorCode: `HTTP_${response.status}`,
        };
      }

      return {
        success: true,
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.warn(`SendGrid connection test failed: ${errorMessage}`);

      return {
        success: false,
        responseTimeMs: Date.now() - startTime,
        errorMessage,
      };
    }
  }

  async validateConfiguration(): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!this.config.apiKey) {
      errors.push('SendGrid API key is required');
    } else if (!this.config.apiKey.startsWith('SG.')) {
      errors.push('SendGrid API key should start with "SG."');
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

      const mailRequest: SendGridMailRequest = {
        personalizations: [
          {
            to: recipients.map((email) => ({ email })),
            cc: params.cc?.map((email) => ({ email })),
            bcc: params.bcc?.map((email) => ({ email })),
          },
        ],
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName || this.config.fromEmail,
        },
        subject: params.subject,
        content: [
          ...(params.text ? [{ type: 'text/plain', value: params.text }] : []),
          { type: 'text/html', value: params.html },
        ],
      };

      if (params.replyTo || this.config.replyToEmail) {
        mailRequest.reply_to = {
          email: params.replyTo || this.config.replyToEmail!,
        };
      }

      const response = await fetch(`${this.apiUrl}/mail/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mailRequest),
        signal: AbortSignal.timeout(this.getTimeoutMs()),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`SendGrid API error: ${errorBody}`);

        return {
          success: false,
          errorMessage: `SendGrid error: ${response.status}`,
          errorCode: `HTTP_${response.status}`,
        };
      }

      // SendGrid returns 202 Accepted with message ID in header
      const messageId = response.headers.get('x-message-id');

      this.logger.debug(
        `Email sent successfully via SendGrid. MessageId: ${messageId}`,
      );

      return {
        success: true,
        messageId: messageId || undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Failed to send email via SendGrid: ${errorMessage}`);

      return {
        success: false,
        errorMessage,
      };
    }
  }

  async sendEmailWithAttachment(
    params: SendEmailWithAttachmentParams,
  ): Promise<SendEmailResult> {
    try {
      const recipients = this.normalizeRecipients(params.to);

      const mailRequest: SendGridMailRequest = {
        personalizations: [
          {
            to: recipients.map((email) => ({ email })),
            cc: params.cc?.map((email) => ({ email })),
            bcc: params.bcc?.map((email) => ({ email })),
          },
        ],
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName || this.config.fromEmail,
        },
        subject: params.subject,
        content: [
          ...(params.text ? [{ type: 'text/plain', value: params.text }] : []),
          { type: 'text/html', value: params.html },
        ],
        attachments: params.attachments.map((att) => ({
          content: Buffer.isBuffer(att.content)
            ? att.content.toString('base64')
            : att.content,
          filename: att.filename,
          type: att.contentType,
          disposition: att.contentDisposition || 'attachment',
          content_id: att.cid,
        })),
      };

      if (params.replyTo || this.config.replyToEmail) {
        mailRequest.reply_to = {
          email: params.replyTo || this.config.replyToEmail!,
        };
      }

      const response = await fetch(`${this.apiUrl}/mail/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mailRequest),
        signal: AbortSignal.timeout(this.getTimeoutMs()),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`SendGrid API error: ${errorBody}`);

        return {
          success: false,
          errorMessage: `SendGrid error: ${response.status}`,
          errorCode: `HTTP_${response.status}`,
        };
      }

      const messageId = response.headers.get('x-message-id');

      this.logger.debug(
        `Email with attachments sent successfully via SendGrid. MessageId: ${messageId}`,
      );

      return {
        success: true,
        messageId: messageId || undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to send email with attachments via SendGrid: ${errorMessage}`,
      );

      return {
        success: false,
        errorMessage,
      };
    }
  }

  async getQuotaStatus(): Promise<QuotaStatus> {
    try {
      // SendGrid provides stats through their API
      const response = await fetch(`${this.apiUrl}/user/credits`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.getTimeoutMs()),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        used: data.used || 0,
        limit: data.total || 0,
        remaining: data.remain || 0,
        resetAt: data.next_reset ? new Date(data.next_reset) : undefined,
      };
    } catch (error) {
      this.logger.warn(
        `Failed to get SendGrid quota: ${error instanceof Error ? error.message : 'Unknown'}`,
      );

      // Return default values if quota check fails
      return {
        used: 0,
        limit: 0,
        remaining: 0,
      };
    }
  }
}
