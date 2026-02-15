import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailAdapterFactory } from '../adapters';
import {
  IEmailAdapter,
  SendEmailParams,
  SendEmailResult,
  SendEmailWithAttachmentParams,
  DecryptedEmailConfig,
} from '../adapters/email-adapter.interface';
import { Microsoft365Adapter } from '../adapters/microsoft365.adapter';
import { EmailProvider } from '../types/email.types';

interface GraphTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * DefaultEmailService - Centralized email sending service.
 *
 * Resolution order:
 * 1. If tenant has their own TenantEmailConfig (active) → use that
 * 2. Otherwise → use Republicode shared mailbox (facturas@republicode.com)
 *    via Microsoft Graph client_credentials flow
 */
@Injectable()
export class DefaultEmailService {
  private readonly logger = new Logger(DefaultEmailService.name);

  // Cached token for client_credentials flow
  private cachedToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly adapterFactory: EmailAdapterFactory,
  ) {}

  /**
   * Get an email adapter for the given tenant.
   * Falls back to Republicode default if tenant has no config.
   */
  async getAdapterForTenant(tenantId: string): Promise<IEmailAdapter> {
    // 1. Check if tenant has their own email config
    const tenantConfig = await this.prisma.tenantEmailConfig.findUnique({
      where: { tenantId },
    });

    if (tenantConfig?.isActive) {
      this.logger.debug(
        `Using tenant email config (${tenantConfig.provider}) for tenant ${tenantId}`,
      );
      return this.adapterFactory.createAdapter(tenantConfig);
    }

    // 2. Fall back to Republicode default
    this.logger.debug(
      `No tenant email config for ${tenantId}, using Republicode default`,
    );
    return this.createDefaultAdapter();
  }

  /**
   * Send an email for a tenant (auto-resolves which adapter to use)
   */
  async sendEmail(
    tenantId: string,
    params: SendEmailParams,
  ): Promise<SendEmailResult> {
    try {
      const adapter = await this.getAdapterForTenant(tenantId);
      const result = await adapter.sendEmail(params);

      if (result.success) {
        this.logger.log(
          `Email sent to ${Array.isArray(params.to) ? params.to.join(', ') : params.to} for tenant ${tenantId}`,
        );
      } else {
        this.logger.warn(
          `Email failed for tenant ${tenantId}: ${result.errorMessage}`,
        );
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Email send error for tenant ${tenantId}: ${errorMessage}`,
      );
      return { success: false, errorMessage };
    }
  }

  /**
   * Send an email with attachments for a tenant
   */
  async sendEmailWithAttachment(
    tenantId: string,
    params: SendEmailWithAttachmentParams,
  ): Promise<SendEmailResult> {
    try {
      const adapter = await this.getAdapterForTenant(tenantId);
      const result = await adapter.sendEmailWithAttachment(params);

      if (result.success) {
        this.logger.log(
          `Email with ${params.attachments.length} attachment(s) sent to ${Array.isArray(params.to) ? params.to.join(', ') : params.to} for tenant ${tenantId}`,
        );
      } else {
        this.logger.warn(
          `Email with attachments failed for tenant ${tenantId}: ${result.errorMessage}`,
        );
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Email with attachments error for tenant ${tenantId}: ${errorMessage}`,
      );
      return { success: false, errorMessage };
    }
  }

  /**
   * Create an adapter for the Republicode default mailbox
   * using client_credentials flow (no user interaction required)
   */
  private createDefaultAdapter(): IEmailAdapter {
    const tenantId = this.configService.get<string>('AZURE_MAIL_TENANT_ID');
    const clientId = this.configService.get<string>('AZURE_MAIL_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'AZURE_MAIL_CLIENT_SECRET',
    );
    const fromEmail = this.configService.get<string>(
      'AZURE_MAIL_FROM',
      'facturas@republicode.com',
    );
    const fromName = this.configService.get<string>(
      'AZURE_MAIL_FROM_NAME',
      'Facturador Electrónico SV',
    );

    if (!tenantId || !clientId || !clientSecret) {
      this.logger.error(
        'Default email not configured: missing AZURE_MAIL_TENANT_ID, AZURE_MAIL_CLIENT_ID, or AZURE_MAIL_CLIENT_SECRET',
      );
      return new NoOpEmailAdapter();
    }

    const config: DecryptedEmailConfig = {
      id: 'default-republicode',
      tenantId: 'republicode',
      provider: EmailProvider.MICROSOFT_365,
      oauth2ClientId: clientId,
      oauth2ClientSecret: clientSecret,
      oauth2TenantId: tenantId,
      fromEmail,
      fromName,
      timeoutSeconds: 30,
    };

    // Use a custom adapter that supports client_credentials flow
    return new ClientCredentialsMsGraphAdapter(config, this);
  }

  /**
   * Get an access token using client_credentials flow.
   * Tokens are cached until expiry.
   */
  async getClientCredentialsToken(): Promise<string> {
    // Return cached token if still valid (with 5 min buffer)
    if (
      this.cachedToken &&
      this.tokenExpiresAt &&
      this.tokenExpiresAt > new Date(Date.now() + 5 * 60 * 1000)
    ) {
      return this.cachedToken;
    }

    const tenantId = this.configService.get<string>('AZURE_MAIL_TENANT_ID');
    const clientId = this.configService.get<string>('AZURE_MAIL_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'AZURE_MAIL_CLIENT_SECRET',
    );

    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to get client_credentials token: HTTP ${response.status} - ${errorBody}`,
      );
    }

    const data = (await response.json()) as GraphTokenResponse;
    this.cachedToken = data.access_token;
    this.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);

    this.logger.debug('Obtained new client_credentials access token');
    return this.cachedToken;
  }
}

/**
 * Microsoft Graph adapter using client_credentials flow
 * (for shared mailbox / application permissions)
 */
class ClientCredentialsMsGraphAdapter extends Microsoft365Adapter {
  private readonly defaultEmailService: DefaultEmailService;

  constructor(
    config: DecryptedEmailConfig,
    defaultEmailService: DefaultEmailService,
  ) {
    super(config);
    this.defaultEmailService = defaultEmailService;
  }

  /**
   * Override to use client_credentials token instead of delegated OAuth
   */
  async refreshOAuthToken() {
    try {
      const accessToken =
        await this.defaultEmailService.getClientCredentialsToken();
      this.config.oauth2AccessToken = accessToken;
      this.config.oauth2TokenExpiry = new Date(Date.now() + 3500 * 1000);

      return {
        success: true,
        accessToken,
        expiresAt: this.config.oauth2TokenExpiry,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, errorMessage };
    }
  }

  /**
   * Override testConnection to use client_credentials flow
   * (GET /me doesn't work with app-only tokens, test by getting the mailbox)
   */
  async testConnection() {
    const startTime = Date.now();
    try {
      const token =
        await this.defaultEmailService.getClientCredentialsToken();

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/users/${this.config.fromEmail}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(this.getTimeoutMs()),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        return {
          success: false,
          responseTimeMs: Date.now() - startTime,
          errorMessage: `HTTP ${response.status}: ${errorBody}`,
          errorCode: `HTTP_${response.status}`,
        };
      }

      return { success: true, responseTimeMs: Date.now() - startTime };
    } catch (error) {
      return {
        success: false,
        responseTimeMs: Date.now() - startTime,
        errorMessage:
          error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Override validateConfiguration - client_credentials doesn't need refresh token
   */
  async validateConfiguration() {
    const errors: string[] = [];
    if (!this.config.oauth2ClientId) errors.push('Client ID is required');
    if (!this.config.oauth2ClientSecret)
      errors.push('Client Secret is required');
    if (!this.config.oauth2TenantId) errors.push('Tenant ID is required');
    if (!this.config.fromEmail) errors.push('From email is required');
    return { valid: errors.length === 0, errors };
  }
}

/**
 * No-op adapter when email is not configured.
 * Logs the intent but doesn't send anything.
 */
class NoOpEmailAdapter implements IEmailAdapter {
  readonly provider = EmailProvider.SMTP_GENERIC;
  private readonly logger = new Logger('NoOpEmailAdapter');

  async testConnection() {
    return {
      success: false,
      responseTimeMs: 0,
      errorMessage: 'Email not configured',
    };
  }

  async validateConfiguration() {
    return { valid: false, errors: ['Email not configured'] };
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    this.logger.warn(
      `[NO-OP] Email not sent (not configured): to=${Array.isArray(params.to) ? params.to.join(', ') : params.to}, subject=${params.subject}`,
    );
    return {
      success: false,
      errorMessage: 'Email service not configured',
    };
  }

  async sendEmailWithAttachment(
    params: SendEmailWithAttachmentParams,
  ): Promise<SendEmailResult> {
    this.logger.warn(
      `[NO-OP] Email with attachments not sent (not configured): to=${Array.isArray(params.to) ? params.to.join(', ') : params.to}, subject=${params.subject}`,
    );
    return {
      success: false,
      errorMessage: 'Email service not configured',
    };
  }
}
