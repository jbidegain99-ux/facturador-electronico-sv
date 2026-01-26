import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider, TenantEmailConfig } from '../types/email.types';
import { EncryptionService } from '../services/encryption.service';
import {
  DecryptedEmailConfig,
  IEmailAdapter,
} from './email-adapter.interface';
import { SendGridAdapter } from './sendgrid.adapter';
import { MailgunAdapter } from './mailgun.adapter';
import { AmazonSesAdapter } from './amazon-ses.adapter';
import { Microsoft365Adapter } from './microsoft365.adapter';
import { GoogleWorkspaceAdapter } from './google-workspace.adapter';
import { PostmarkAdapter } from './postmark.adapter';
import { BrevoAdapter } from './brevo.adapter';
import { MailtrapAdapter } from './mailtrap.adapter';
import { SmtpGenericAdapter } from './smtp-generic.adapter';

@Injectable()
export class EmailAdapterFactory {
  private readonly logger = new Logger(EmailAdapterFactory.name);

  constructor(private readonly encryptionService: EncryptionService) {}

  /**
   * Create an email adapter for the given configuration
   */
  createAdapter(config: TenantEmailConfig): IEmailAdapter {
    const decryptedConfig = this.decryptConfig(config);

    switch (config.provider) {
      case EmailProvider.SENDGRID:
        this.logger.debug(`Creating SendGrid adapter for tenant ${config.tenantId}`);
        return new SendGridAdapter(decryptedConfig);

      case EmailProvider.MAILGUN:
        this.logger.debug(`Creating Mailgun adapter for tenant ${config.tenantId}`);
        return new MailgunAdapter(decryptedConfig);

      case EmailProvider.AMAZON_SES:
        this.logger.debug(`Creating Amazon SES adapter for tenant ${config.tenantId}`);
        return new AmazonSesAdapter(decryptedConfig);

      case EmailProvider.MICROSOFT_365:
        this.logger.debug(`Creating Microsoft 365 adapter for tenant ${config.tenantId}`);
        return new Microsoft365Adapter(decryptedConfig);

      case EmailProvider.GOOGLE_WORKSPACE:
        this.logger.debug(`Creating Google Workspace adapter for tenant ${config.tenantId}`);
        return new GoogleWorkspaceAdapter(decryptedConfig);

      case EmailProvider.POSTMARK:
        this.logger.debug(`Creating Postmark adapter for tenant ${config.tenantId}`);
        return new PostmarkAdapter(decryptedConfig);

      case EmailProvider.BREVO:
        this.logger.debug(`Creating Brevo adapter for tenant ${config.tenantId}`);
        return new BrevoAdapter(decryptedConfig);

      case EmailProvider.MAILTRAP:
        this.logger.debug(`Creating Mailtrap adapter for tenant ${config.tenantId}`);
        return new MailtrapAdapter(decryptedConfig);

      case EmailProvider.SMTP_GENERIC:
      default:
        this.logger.debug(`Creating SMTP Generic adapter for tenant ${config.tenantId}`);
        return new SmtpGenericAdapter(decryptedConfig);
    }
  }

  /**
   * Decrypt all sensitive fields in the configuration
   */
  private decryptConfig(config: TenantEmailConfig): DecryptedEmailConfig {
    return {
      id: config.id,
      tenantId: config.tenantId,
      provider: config.provider as EmailProvider,

      // SMTP
      smtpHost: config.smtpHost || undefined,
      smtpPort: config.smtpPort || undefined,
      smtpSecure: config.smtpSecure ?? undefined,
      smtpUser: config.smtpUser || undefined,
      smtpPassword: this.safeDecrypt(config.smtpPassword),

      // API
      apiKey: this.safeDecrypt(config.apiKey),
      apiSecret: this.safeDecrypt(config.apiSecret),
      apiEndpoint: config.apiEndpoint || undefined,

      // OAuth2
      oauth2ClientId: config.oauth2ClientId || undefined,
      oauth2ClientSecret: this.safeDecrypt(config.oauth2ClientSecret),
      oauth2TenantId: config.oauth2TenantId || undefined,
      oauth2RefreshToken: this.safeDecrypt(config.oauth2RefreshToken),
      oauth2AccessToken: this.safeDecrypt(config.oauth2AccessToken),
      oauth2TokenExpiry: config.oauth2TokenExpiry || undefined,

      // Sender
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      replyToEmail: config.replyToEmail || undefined,

      // Settings
      rateLimitPerHour: config.rateLimitPerHour || undefined,
      retryAttempts: config.retryAttempts || undefined,
      timeoutSeconds: config.timeoutSeconds || undefined,
    };
  }

  /**
   * Safely decrypt a value, returning undefined if null/empty
   */
  private safeDecrypt(value: string | null | undefined): string | undefined {
    if (!value) return undefined;

    try {
      return this.encryptionService.decrypt(value);
    } catch (error) {
      this.logger.warn(
        `Failed to decrypt value: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return undefined;
    }
  }

  /**
   * Get list of providers that require OAuth2 flow
   */
  static getOAuth2Providers(): EmailProvider[] {
    return [EmailProvider.MICROSOFT_365, EmailProvider.GOOGLE_WORKSPACE];
  }

  /**
   * Get list of providers that support API key authentication
   */
  static getApiKeyProviders(): EmailProvider[] {
    return [
      EmailProvider.SENDGRID,
      EmailProvider.MAILGUN,
      EmailProvider.POSTMARK,
      EmailProvider.BREVO,
      EmailProvider.MAILTRAP,
    ];
  }

  /**
   * Get list of providers that support SMTP authentication
   */
  static getSmtpProviders(): EmailProvider[] {
    return [
      EmailProvider.SMTP_GENERIC,
      EmailProvider.AMAZON_SES,
      EmailProvider.SENDGRID,
      EmailProvider.MAILGUN,
    ];
  }

  /**
   * Check if a provider requires OAuth2 flow
   */
  static requiresOAuth2(provider: EmailProvider): boolean {
    return this.getOAuth2Providers().includes(provider);
  }
}
