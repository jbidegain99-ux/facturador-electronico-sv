import { Logger } from '@nestjs/common';
import { EmailProvider } from '@prisma/client';
import {
  BaseEmailAdapter,
  ConnectionTestResult,
  DecryptedEmailConfig,
  OAuthRefreshResult,
  SendEmailParams,
  SendEmailResult,
  SendEmailWithAttachmentParams,
  ValidationResult,
} from './email-adapter.interface';

/**
 * Google Workspace / Gmail email adapter using Gmail API
 * Requires Google Cloud Project with Gmail API enabled
 */
export class GoogleWorkspaceAdapter extends BaseEmailAdapter {
  readonly provider = EmailProvider.GOOGLE_WORKSPACE;
  private readonly logger = new Logger(GoogleWorkspaceAdapter.name);
  private readonly gmailUrl = 'https://gmail.googleapis.com/gmail/v1';
  private readonly tokenUrl = 'https://oauth2.googleapis.com/token';

  constructor(config: DecryptedEmailConfig) {
    super(config);
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      const accessToken = await this.getValidAccessToken();

      // Verify by getting user profile
      const response = await fetch(`${this.gmailUrl}/users/me/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
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

      this.logger.warn(
        `Google Workspace connection test failed: ${errorMessage}`,
      );

      return {
        success: false,
        responseTimeMs: Date.now() - startTime,
        errorMessage,
      };
    }
  }

  async validateConfiguration(): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!this.config.oauth2ClientId) {
      errors.push('Google Cloud Client ID is required');
    }

    if (!this.config.oauth2ClientSecret) {
      errors.push('Google Cloud Client Secret is required');
    }

    if (!this.config.oauth2RefreshToken && !this.config.oauth2AccessToken) {
      errors.push(
        'OAuth tokens are required. Complete the OAuth flow first.',
      );
    }

    if (!this.config.fromEmail) {
      errors.push('From email is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private async getValidAccessToken(): Promise<string> {
    // Check if current token is still valid
    if (
      this.config.oauth2AccessToken &&
      this.config.oauth2TokenExpiry &&
      new Date(this.config.oauth2TokenExpiry) > new Date()
    ) {
      return this.config.oauth2AccessToken;
    }

    // Need to refresh the token
    if (!this.config.oauth2RefreshToken) {
      throw new Error(
        'No refresh token available. Please complete OAuth flow.',
      );
    }

    const result = await this.refreshOAuthToken();
    if (!result.success) {
      throw new Error(`Failed to refresh token: ${result.errorMessage}`);
    }

    return result.accessToken!;
  }

  async refreshOAuthToken(): Promise<OAuthRefreshResult> {
    try {
      const params = new URLSearchParams({
        client_id: this.config.oauth2ClientId!,
        client_secret: this.config.oauth2ClientSecret!,
        refresh_token: this.config.oauth2RefreshToken!,
        grant_type: 'refresh_token',
      });

      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: AbortSignal.timeout(this.getTimeoutMs()),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        this.logger.error(
          `Token refresh failed: ${JSON.stringify(errorBody)}`,
        );

        return {
          success: false,
          errorMessage:
            errorBody.error_description || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();

      // Update config with new tokens
      this.config.oauth2AccessToken = data.access_token;
      this.config.oauth2TokenExpiry = new Date(
        Date.now() + data.expires_in * 1000,
      );

      return {
        success: true,
        accessToken: data.access_token,
        expiresAt: this.config.oauth2TokenExpiry,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Token refresh error: ${errorMessage}`);

      return {
        success: false,
        errorMessage,
      };
    }
  }

  /**
   * Build a MIME message for Gmail API
   */
  private buildMimeMessage(
    params: SendEmailParams | SendEmailWithAttachmentParams,
  ): string {
    const recipients = this.normalizeRecipients(params.to);
    const boundary = `boundary_${Date.now()}`;

    let message = '';

    // Headers
    message += `From: ${this.getFromAddress()}\r\n`;
    message += `To: ${recipients.join(', ')}\r\n`;

    if (params.cc?.length) {
      message += `Cc: ${params.cc.join(', ')}\r\n`;
    }

    if (params.bcc?.length) {
      message += `Bcc: ${params.bcc.join(', ')}\r\n`;
    }

    if (params.replyTo || this.config.replyToEmail) {
      message += `Reply-To: ${params.replyTo || this.config.replyToEmail}\r\n`;
    }

    message += `Subject: =?UTF-8?B?${Buffer.from(params.subject).toString('base64')}?=\r\n`;
    message += 'MIME-Version: 1.0\r\n';

    const hasAttachments =
      'attachments' in params && params.attachments?.length > 0;

    if (hasAttachments) {
      message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

      // HTML body part
      message += `--${boundary}\r\n`;
      message += 'Content-Type: text/html; charset="UTF-8"\r\n';
      message += 'Content-Transfer-Encoding: base64\r\n\r\n';
      message += Buffer.from(params.html).toString('base64') + '\r\n';

      // Attachments
      for (const att of (params as SendEmailWithAttachmentParams).attachments) {
        message += `--${boundary}\r\n`;
        message += `Content-Type: ${att.contentType}; name="${att.filename}"\r\n`;
        message += 'Content-Transfer-Encoding: base64\r\n';
        message += `Content-Disposition: ${att.contentDisposition || 'attachment'}; filename="${att.filename}"\r\n`;

        if (att.cid) {
          message += `Content-ID: <${att.cid}>\r\n`;
        }

        message += '\r\n';

        const content = Buffer.isBuffer(att.content)
          ? att.content.toString('base64')
          : att.content;
        message += content + '\r\n';
      }

      message += `--${boundary}--`;
    } else {
      message += 'Content-Type: text/html; charset="UTF-8"\r\n';
      message += 'Content-Transfer-Encoding: base64\r\n\r\n';
      message += Buffer.from(params.html).toString('base64');
    }

    return message;
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      const accessToken = await this.getValidAccessToken();
      const mimeMessage = this.buildMimeMessage(params);

      // Gmail API requires base64url encoding
      const encodedMessage = Buffer.from(mimeMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch(
        `${this.gmailUrl}/users/me/messages/send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: encodedMessage }),
          signal: AbortSignal.timeout(this.getTimeoutMs()),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Gmail API error: ${errorBody}`);

        return {
          success: false,
          errorMessage: `Gmail API error: ${response.status}`,
          errorCode: `HTTP_${response.status}`,
        };
      }

      const data = await response.json();

      this.logger.debug(
        `Email sent successfully via Google Workspace. MessageId: ${data.id}`,
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
        `Failed to send email via Google Workspace: ${errorMessage}`,
      );

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
      const accessToken = await this.getValidAccessToken();
      const mimeMessage = this.buildMimeMessage(params);

      const encodedMessage = Buffer.from(mimeMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch(
        `${this.gmailUrl}/users/me/messages/send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: encodedMessage }),
          signal: AbortSignal.timeout(this.getTimeoutMs()),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Gmail API error: ${errorBody}`);

        return {
          success: false,
          errorMessage: `Gmail API error: ${response.status}`,
          errorCode: `HTTP_${response.status}`,
        };
      }

      const data = await response.json();

      this.logger.debug(
        `Email with attachments sent successfully via Google Workspace. MessageId: ${data.id}`,
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
        `Failed to send email with attachments via Google Workspace: ${errorMessage}`,
      );

      return {
        success: false,
        errorMessage,
      };
    }
  }
}
