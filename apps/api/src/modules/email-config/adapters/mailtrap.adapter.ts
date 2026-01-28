import { Logger } from '@nestjs/common';
import { EmailProvider } from '../types/email.types';
import {
  BaseEmailAdapter,
  ConnectionTestResult,
  DecryptedEmailConfig,
  SendEmailParams,
  SendEmailResult,
  SendEmailWithAttachmentParams,
  ValidationResult,
} from './email-adapter.interface';

interface MailtrapEmailRequest {
  from: { email: string; name: string };
  to: { email: string }[];
  cc?: { email: string }[];
  bcc?: { email: string }[];
  subject: string;
  html: string;
  text?: string;
  attachments?: MailtrapAttachment[];
}

interface MailtrapAttachment {
  filename: string;
  content: string; // base64
  type: string;
  disposition?: string;
}

/**
 * Mailtrap email adapter using REST API
 * Great for testing/development environments
 */
export class MailtrapAdapter extends BaseEmailAdapter {
  readonly provider = EmailProvider.MAILTRAP;
  private readonly logger = new Logger(MailtrapAdapter.name);
  private readonly apiUrl: string;

  constructor(config: DecryptedEmailConfig) {
    super(config);
    // Mailtrap has different endpoints for testing vs sending
    // Testing: https://sandbox.api.mailtrap.io/api/send
    // Sending: https://send.api.mailtrap.io/api/send
    this.apiUrl =
      config.apiEndpoint || 'https://send.api.mailtrap.io/api/send';
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // Mailtrap doesn't have a specific test endpoint
      // We'll verify by checking if the API key format is correct
      // and attempting a minimal request
      const response = await fetch(this.apiUrl.replace('/send', ''), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Api-Token': this.config.apiKey!,
        },
        signal: AbortSignal.timeout(this.getTimeoutMs()),
      });

      // Even a 404 means the API key worked for auth
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          responseTimeMs: Date.now() - startTime,
          errorMessage: 'Invalid API token',
          errorCode: 'AUTH_ERROR',
        };
      }

      return {
        success: true,
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.warn(`Mailtrap connection test failed: ${errorMessage}`);

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
      errors.push('Mailtrap API token is required');
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

      const emailRequest: MailtrapEmailRequest = {
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName || this.config.fromEmail,
        },
        to: recipients.map((email) => ({ email })),
        subject: params.subject,
        html: params.html,
        text: params.text,
        cc: params.cc?.map((email) => ({ email })),
        bcc: params.bcc?.map((email) => ({ email })),
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Api-Token': this.config.apiKey!,
        },
        body: JSON.stringify(emailRequest),
        signal: AbortSignal.timeout(this.getTimeoutMs()),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        this.logger.error(`Mailtrap API error: ${JSON.stringify(errorBody)}`);

        return {
          success: false,
          errorMessage:
            errorBody.errors?.join(', ') || `HTTP ${response.status}`,
          errorCode: `HTTP_${response.status}`,
        };
      }

      const data = await response.json();

      this.logger.debug(
        `Email sent successfully via Mailtrap. MessageIds: ${data.message_ids?.join(', ')}`,
      );

      return {
        success: true,
        messageId: data.message_ids?.[0],
        providerResponse: data,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Failed to send email via Mailtrap: ${errorMessage}`);

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

      const emailRequest: MailtrapEmailRequest = {
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName || this.config.fromEmail,
        },
        to: recipients.map((email) => ({ email })),
        subject: params.subject,
        html: params.html,
        text: params.text,
        cc: params.cc?.map((email) => ({ email })),
        bcc: params.bcc?.map((email) => ({ email })),
        attachments: params.attachments.map((att) => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content)
            ? att.content.toString('base64')
            : att.content,
          type: att.contentType,
          disposition: att.contentDisposition || 'attachment',
        })),
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Api-Token': this.config.apiKey!,
        },
        body: JSON.stringify(emailRequest),
        signal: AbortSignal.timeout(this.getTimeoutMs()),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        this.logger.error(`Mailtrap API error: ${JSON.stringify(errorBody)}`);

        return {
          success: false,
          errorMessage:
            errorBody.errors?.join(', ') || `HTTP ${response.status}`,
          errorCode: `HTTP_${response.status}`,
        };
      }

      const data = await response.json();

      this.logger.debug(
        `Email with attachments sent successfully via Mailtrap. MessageIds: ${data.message_ids?.join(', ')}`,
      );

      return {
        success: true,
        messageId: data.message_ids?.[0],
        providerResponse: data,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to send email with attachments via Mailtrap: ${errorMessage}`,
      );

      return {
        success: false,
        errorMessage,
      };
    }
  }
}
