import { TenantEmailConfig } from '@prisma/client';
import { EmailProvider } from '../types/email.types';

/**
 * Parameters for sending an email
 */
export interface SendEmailParams {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

/**
 * Email attachment configuration
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string; // Buffer or base64 string
  contentType: string;
  contentDisposition?: 'attachment' | 'inline';
  cid?: string; // For inline images
}

/**
 * Parameters for sending an email with attachments
 */
export interface SendEmailWithAttachmentParams extends SendEmailParams {
  attachments: EmailAttachment[];
}

/**
 * Result of a connection test
 */
export interface ConnectionTestResult {
  success: boolean;
  responseTimeMs: number;
  errorMessage?: string;
  errorCode?: string;
}

/**
 * Result of sending an email
 */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  providerResponse?: unknown;
  errorMessage?: string;
  errorCode?: string;
}

/**
 * Result of validating a configuration
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Result of an OAuth token refresh
 */
export interface OAuthRefreshResult {
  success: boolean;
  accessToken?: string;
  expiresAt?: Date;
  errorMessage?: string;
}

/**
 * Email quota/limit status
 */
export interface QuotaStatus {
  used: number;
  limit: number;
  remaining: number;
  resetAt?: Date;
}

/**
 * Decrypted email configuration for adapter use
 */
export interface DecryptedEmailConfig {
  id: string;
  tenantId: string;
  provider: EmailProvider;

  // SMTP
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;

  // API
  apiKey?: string;
  apiSecret?: string;
  apiEndpoint?: string;

  // OAuth2
  oauth2ClientId?: string;
  oauth2ClientSecret?: string;
  oauth2TenantId?: string;
  oauth2RefreshToken?: string;
  oauth2AccessToken?: string;
  oauth2TokenExpiry?: Date;

  // Sender
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;

  // Settings
  rateLimitPerHour?: number;
  retryAttempts?: number;
  timeoutSeconds?: number;
}

/**
 * Interface that all email adapters must implement
 */
export interface IEmailAdapter {
  /**
   * The email provider this adapter handles
   */
  readonly provider: EmailProvider;

  /**
   * Test the connection to the email service
   */
  testConnection(): Promise<ConnectionTestResult>;

  /**
   * Validate the configuration before saving
   */
  validateConfiguration(): Promise<ValidationResult>;

  /**
   * Send a simple email
   */
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;

  /**
   * Send an email with attachments (used for DTE PDFs)
   */
  sendEmailWithAttachment(
    params: SendEmailWithAttachmentParams,
  ): Promise<SendEmailResult>;

  /**
   * Refresh OAuth token (only for OAuth2 adapters like M365, Google)
   */
  refreshOAuthToken?(): Promise<OAuthRefreshResult>;

  /**
   * Get current quota status (if supported by provider)
   */
  getQuotaStatus?(): Promise<QuotaStatus>;

  /**
   * Clean up resources when adapter is no longer needed
   */
  dispose?(): Promise<void>;
}

/**
 * Base abstract class for email adapters with common functionality
 */
export abstract class BaseEmailAdapter implements IEmailAdapter {
  abstract readonly provider: EmailProvider;
  protected config: DecryptedEmailConfig;

  constructor(config: DecryptedEmailConfig) {
    this.config = config;
  }

  abstract testConnection(): Promise<ConnectionTestResult>;
  abstract validateConfiguration(): Promise<ValidationResult>;
  abstract sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
  abstract sendEmailWithAttachment(
    params: SendEmailWithAttachmentParams,
  ): Promise<SendEmailResult>;

  /**
   * Get the from address formatted with name
   */
  protected getFromAddress(): string {
    return `"${this.config.fromName}" <${this.config.fromEmail}>`;
  }

  /**
   * Get reply-to address, falling back to from address
   */
  protected getReplyTo(): string {
    return this.config.replyToEmail || this.config.fromEmail;
  }

  /**
   * Get timeout in milliseconds
   */
  protected getTimeoutMs(): number {
    return (this.config.timeoutSeconds || 30) * 1000;
  }

  /**
   * Format recipients to array
   */
  protected normalizeRecipients(to: string | string[]): string[] {
    return Array.isArray(to) ? to : [to];
  }
}
