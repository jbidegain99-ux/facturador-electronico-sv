import { Logger } from '@nestjs/common';
import { EmailProvider } from '../types/email.types';
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

interface MsGraphMessage {
  message: {
    subject: string;
    body: {
      contentType: 'HTML' | 'Text';
      content: string;
    };
    toRecipients: { emailAddress: { address: string } }[];
    ccRecipients?: { emailAddress: { address: string } }[];
    bccRecipients?: { emailAddress: { address: string } }[];
    replyTo?: { emailAddress: { address: string } }[];
    attachments?: MsGraphAttachment[];
  };
  saveToSentItems?: boolean;
}

interface MsGraphAttachment {
  '@odata.type': '#microsoft.graph.fileAttachment';
  name: string;
  contentBytes: string;
  contentType: string;
  isInline?: boolean;
  contentId?: string;
}

/**
 * Microsoft 365 / Outlook email adapter using Microsoft Graph API
 * Requires Azure AD App Registration with Mail.Send permission
 */
export class Microsoft365Adapter extends BaseEmailAdapter {
  readonly provider = EmailProvider.MICROSOFT_365;
  private readonly logger = new Logger(Microsoft365Adapter.name);
  private readonly graphUrl = 'https://graph.microsoft.com/v1.0';
  private readonly tokenUrl = 'https://login.microsoftonline.com';

  constructor(config: DecryptedEmailConfig) {
    super(config);
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // Try to get a valid access token
      const accessToken = await this.getValidAccessToken();

      // Verify by getting user profile
      const response = await fetch(`${this.graphUrl}/me`, {
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

      this.logger.warn(`Microsoft 365 connection test failed: ${errorMessage}`);

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
      errors.push('Azure AD Client ID is required');
    }

    if (!this.config.oauth2ClientSecret) {
      errors.push('Azure AD Client Secret is required');
    }

    if (!this.config.oauth2TenantId) {
      errors.push('Azure AD Tenant ID is required');
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

  protected async getValidAccessToken(): Promise<string> {
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
      const tokenEndpoint = `${this.tokenUrl}/${this.config.oauth2TenantId}/oauth2/v2.0/token`;

      const params = new URLSearchParams({
        client_id: this.config.oauth2ClientId!,
        client_secret: this.config.oauth2ClientSecret!,
        refresh_token: this.config.oauth2RefreshToken!,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/.default offline_access',
      });

      const response = await fetch(tokenEndpoint, {
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

      if (data.refresh_token) {
        this.config.oauth2RefreshToken = data.refresh_token;
      }

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

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      const accessToken = await this.getValidAccessToken();
      const recipients = this.normalizeRecipients(params.to);

      const message: MsGraphMessage = {
        message: {
          subject: params.subject,
          body: {
            contentType: 'HTML',
            content: params.html,
          },
          toRecipients: recipients.map((email) => ({
            emailAddress: { address: email },
          })),
          ccRecipients: params.cc?.map((email) => ({
            emailAddress: { address: email },
          })),
          bccRecipients: params.bcc?.map((email) => ({
            emailAddress: { address: email },
          })),
        },
        saveToSentItems: true,
      };

      if (params.replyTo || this.config.replyToEmail) {
        message.message.replyTo = [
          {
            emailAddress: {
              address: params.replyTo || this.config.replyToEmail!,
            },
          },
        ];
      }

      const response = await fetch(
        `${this.graphUrl}/users/${this.config.fromEmail}/sendMail`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
          signal: AbortSignal.timeout(this.getTimeoutMs()),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Microsoft Graph API error: ${errorBody}`);

        return {
          success: false,
          errorMessage: `Graph API error: ${response.status}`,
          errorCode: `HTTP_${response.status}`,
        };
      }

      // Microsoft Graph returns 202 Accepted with no body
      this.logger.debug('Email sent successfully via Microsoft 365');

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to send email via Microsoft 365: ${errorMessage}`,
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
      const recipients = this.normalizeRecipients(params.to);

      const message: MsGraphMessage = {
        message: {
          subject: params.subject,
          body: {
            contentType: 'HTML',
            content: params.html,
          },
          toRecipients: recipients.map((email) => ({
            emailAddress: { address: email },
          })),
          ccRecipients: params.cc?.map((email) => ({
            emailAddress: { address: email },
          })),
          bccRecipients: params.bcc?.map((email) => ({
            emailAddress: { address: email },
          })),
          attachments: params.attachments.map((att) => ({
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: att.filename,
            contentBytes: Buffer.isBuffer(att.content)
              ? att.content.toString('base64')
              : att.content,
            contentType: att.contentType,
            isInline: att.contentDisposition === 'inline',
            contentId: att.cid,
          })),
        },
        saveToSentItems: true,
      };

      if (params.replyTo || this.config.replyToEmail) {
        message.message.replyTo = [
          {
            emailAddress: {
              address: params.replyTo || this.config.replyToEmail!,
            },
          },
        ];
      }

      const response = await fetch(
        `${this.graphUrl}/users/${this.config.fromEmail}/sendMail`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
          signal: AbortSignal.timeout(this.getTimeoutMs()),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Microsoft Graph API error: ${errorBody}`);

        return {
          success: false,
          errorMessage: `Graph API error: ${response.status}`,
          errorCode: `HTTP_${response.status}`,
        };
      }

      this.logger.debug(
        'Email with attachments sent successfully via Microsoft 365',
      );

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to send email with attachments via Microsoft 365: ${errorMessage}`,
      );

      return {
        success: false,
        errorMessage,
      };
    }
  }
}
