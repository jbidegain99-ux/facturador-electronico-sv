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

/**
 * Mailgun email adapter using REST API
 */
export class MailgunAdapter extends BaseEmailAdapter {
  readonly provider = EmailProvider.MAILGUN;
  private readonly logger = new Logger(MailgunAdapter.name);
  private domain: string;
  private baseUrl: string;

  constructor(config: DecryptedEmailConfig) {
    super(config);
    // Extract domain from endpoint or use default
    this.domain = this.extractDomain();
    this.baseUrl = config.apiEndpoint || 'https://api.mailgun.net/v3';
  }

  private extractDomain(): string {
    // Domain can be in apiEndpoint or extracted from fromEmail
    if (this.config.apiEndpoint) {
      // Try to extract from endpoint like https://api.mailgun.net/v3/mydomain.com
      const match = this.config.apiEndpoint.match(/\/v3\/([^/]+)/);
      if (match) return match[1];
    }
    // Fall back to domain from email
    const emailDomain = this.config.fromEmail.split('@')[1];
    return emailDomain || '';
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/${this.domain}`, {
        method: 'GET',
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(`api:${this.config.apiKey}`).toString('base64'),
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

      this.logger.warn(`Mailgun connection test failed: ${errorMessage}`);

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
      errors.push('Mailgun API key is required');
    }

    if (!this.domain) {
      errors.push('Mailgun domain is required (set via apiEndpoint)');
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

      const formData = new FormData();
      formData.append('from', this.getFromAddress());
      formData.append('to', recipients.join(','));
      formData.append('subject', params.subject);
      formData.append('html', params.html);

      if (params.text) {
        formData.append('text', params.text);
      }

      if (params.cc?.length) {
        formData.append('cc', params.cc.join(','));
      }

      if (params.bcc?.length) {
        formData.append('bcc', params.bcc.join(','));
      }

      if (params.replyTo || this.config.replyToEmail) {
        formData.append(
          'h:Reply-To',
          params.replyTo || this.config.replyToEmail!,
        );
      }

      const response = await fetch(
        `${this.baseUrl}/${this.domain}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization:
              'Basic ' +
              Buffer.from(`api:${this.config.apiKey}`).toString('base64'),
          },
          body: formData,
          signal: AbortSignal.timeout(this.getTimeoutMs()),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Mailgun API error: ${errorBody}`);

        return {
          success: false,
          errorMessage: `Mailgun error: ${response.status}`,
          errorCode: `HTTP_${response.status}`,
        };
      }

      const data = await response.json();

      this.logger.debug(
        `Email sent successfully via Mailgun. MessageId: ${data.id}`,
      );

      return {
        success: true,
        messageId: data.id,
        providerResponse: data,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Failed to send email via Mailgun: ${errorMessage}`);

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

      const formData = new FormData();
      formData.append('from', this.getFromAddress());
      formData.append('to', recipients.join(','));
      formData.append('subject', params.subject);
      formData.append('html', params.html);

      if (params.text) {
        formData.append('text', params.text);
      }

      if (params.cc?.length) {
        formData.append('cc', params.cc.join(','));
      }

      if (params.bcc?.length) {
        formData.append('bcc', params.bcc.join(','));
      }

      if (params.replyTo || this.config.replyToEmail) {
        formData.append(
          'h:Reply-To',
          params.replyTo || this.config.replyToEmail!,
        );
      }

      // Add attachments
      for (const att of params.attachments) {
        const content = Buffer.isBuffer(att.content)
          ? att.content
          : Buffer.from(att.content, 'base64');

        const blob = new Blob([content], { type: att.contentType });
        formData.append('attachment', blob, att.filename);
      }

      const response = await fetch(
        `${this.baseUrl}/${this.domain}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization:
              'Basic ' +
              Buffer.from(`api:${this.config.apiKey}`).toString('base64'),
          },
          body: formData,
          signal: AbortSignal.timeout(this.getTimeoutMs()),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Mailgun API error: ${errorBody}`);

        return {
          success: false,
          errorMessage: `Mailgun error: ${response.status}`,
          errorCode: `HTTP_${response.status}`,
        };
      }

      const data = await response.json();

      this.logger.debug(
        `Email with attachments sent successfully via Mailgun. MessageId: ${data.id}`,
      );

      return {
        success: true,
        messageId: data.id,
        providerResponse: data,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to send email with attachments via Mailgun: ${errorMessage}`,
      );

      return {
        success: false,
        errorMessage,
      };
    }
  }
}
