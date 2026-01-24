import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TenantEmailConfig } from '@prisma/client';
import {
  EmailProvider,
  EmailAuthMethod,
  ConfiguredBy,
  HealthStatus,
  EmailSendStatus,
} from '../types/email.types';
import { EncryptionService } from './encryption.service';
import { EmailAdapterFactory } from '../adapters/adapter.factory';
import {
  CreateEmailConfigDto,
  UpdateEmailConfigDto,
  TestEmailConfigDto,
} from '../dto';
import {
  SendEmailParams,
  SendEmailWithAttachmentParams,
  SendEmailResult,
  ConnectionTestResult,
} from '../adapters/email-adapter.interface';

@Injectable()
export class EmailConfigService {
  private readonly logger = new Logger(EmailConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly adapterFactory: EmailAdapterFactory,
  ) {}

  /**
   * Get email configuration for a tenant
   */
  async getConfig(tenantId: string): Promise<TenantEmailConfig | null> {
    return this.prisma.tenantEmailConfig.findUnique({
      where: { tenantId },
      include: {
        healthChecks: {
          orderBy: { checkedAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  /**
   * Create or update email configuration for a tenant
   */
  async upsertConfig(
    tenantId: string,
    dto: CreateEmailConfigDto,
    configuredBy: ConfiguredBy = ConfiguredBy.SELF,
    configuredByUserId?: string,
  ): Promise<TenantEmailConfig> {
    const existing = await this.prisma.tenantEmailConfig.findUnique({
      where: { tenantId },
    });

    // Encrypt sensitive fields
    const encryptedData = this.encryptSensitiveFields(dto);

    if (existing) {
      return this.prisma.tenantEmailConfig.update({
        where: { tenantId },
        data: {
          ...encryptedData,
          isVerified: false, // Reset verification on config change
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.tenantEmailConfig.create({
      data: {
        tenantId,
        ...encryptedData,
        configuredBy,
        configuredByUserId,
      },
    });
  }

  /**
   * Update email configuration
   */
  async updateConfig(
    tenantId: string,
    dto: UpdateEmailConfigDto,
  ): Promise<TenantEmailConfig> {
    const existing = await this.prisma.tenantEmailConfig.findUnique({
      where: { tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Email configuration not found');
    }

    const encryptedData = this.encryptSensitiveFields(dto);

    // If critical fields changed, reset verification
    const resetVerification =
      dto.provider !== undefined ||
      dto.authMethod !== undefined ||
      dto.apiKey !== undefined ||
      dto.smtpHost !== undefined ||
      dto.oauth2ClientId !== undefined;

    return this.prisma.tenantEmailConfig.update({
      where: { tenantId },
      data: {
        ...encryptedData,
        isVerified: resetVerification ? false : existing.isVerified,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete email configuration
   */
  async deleteConfig(tenantId: string): Promise<void> {
    const existing = await this.prisma.tenantEmailConfig.findUnique({
      where: { tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Email configuration not found');
    }

    await this.prisma.tenantEmailConfig.delete({
      where: { tenantId },
    });

    this.logger.log(`Email configuration deleted for tenant ${tenantId}`);
  }

  /**
   * Test the email configuration connection
   */
  async testConnection(tenantId: string): Promise<ConnectionTestResult> {
    const config = await this.prisma.tenantEmailConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      throw new NotFoundException('Email configuration not found');
    }

    const adapter = this.adapterFactory.createAdapter(config);

    // First validate the configuration
    const validation = await adapter.validateConfiguration();
    if (!validation.valid) {
      return {
        success: false,
        responseTimeMs: 0,
        errorMessage: `Configuration invalid: ${validation.errors.join(', ')}`,
        errorCode: 'VALIDATION_ERROR',
      };
    }

    // Then test the connection
    const result = await adapter.testConnection();

    // Record health check
    await this.prisma.emailHealthCheck.create({
      data: {
        configId: config.id,
        checkType: 'CONNECTION_TEST',
        status: result.success ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        responseTimeMs: result.responseTimeMs,
        errorMessage: result.errorMessage,
        errorCode: result.errorCode,
      },
    });

    // Update last test timestamp
    await this.prisma.tenantEmailConfig.update({
      where: { tenantId },
      data: { lastTestAt: new Date() },
    });

    // Cleanup adapter if needed
    if (adapter.dispose) {
      await adapter.dispose();
    }

    return result;
  }

  /**
   * Send a test email
   */
  async sendTestEmail(
    tenantId: string,
    dto: TestEmailConfigDto,
  ): Promise<SendEmailResult> {
    const config = await this.prisma.tenantEmailConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      throw new NotFoundException('Email configuration not found');
    }

    const adapter = this.adapterFactory.createAdapter(config);

    const testHtml = this.generateTestEmailHtml(
      dto.message || 'Este es un correo de prueba para verificar la configuración de email.',
    );

    const result = await adapter.sendEmail({
      to: dto.recipientEmail,
      subject: dto.subject || '✅ Prueba de Configuración de Email - Republicode',
      html: testHtml,
      text: dto.message || 'Este es un correo de prueba.',
    });

    // Log the send attempt
    await this.prisma.emailSendLog.create({
      data: {
        configId: config.id,
        recipientEmail: dto.recipientEmail,
        subject: dto.subject || 'Prueba de Configuración de Email',
        status: result.success ? EmailSendStatus.SENT : EmailSendStatus.FAILED,
        providerMessageId: result.messageId,
        errorMessage: result.errorMessage,
      },
    });

    // If successful, mark as verified
    if (result.success) {
      await this.prisma.tenantEmailConfig.update({
        where: { tenantId },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      });
    }

    // Record health check
    await this.prisma.emailHealthCheck.create({
      data: {
        configId: config.id,
        checkType: 'SEND_TEST',
        status: result.success ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        errorMessage: result.errorMessage,
        errorCode: result.errorCode,
      },
    });

    if (adapter.dispose) {
      await adapter.dispose();
    }

    return result;
  }

  /**
   * Send an email using the tenant's configuration
   */
  async sendEmail(
    tenantId: string,
    params: SendEmailParams,
    dteId?: string,
  ): Promise<SendEmailResult> {
    const config = await this.prisma.tenantEmailConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      throw new NotFoundException('Email configuration not found');
    }

    if (!config.isActive) {
      throw new BadRequestException('Email configuration is not active');
    }

    if (!config.isVerified) {
      throw new BadRequestException(
        'Email configuration has not been verified. Please send a test email first.',
      );
    }

    const adapter = this.adapterFactory.createAdapter(config);
    const recipients = Array.isArray(params.to) ? params.to : [params.to];

    const result = await adapter.sendEmail(params);

    // Log the send
    await this.prisma.emailSendLog.create({
      data: {
        configId: config.id,
        dteId,
        recipientEmail: recipients[0],
        subject: params.subject,
        status: result.success ? EmailSendStatus.SENT : EmailSendStatus.FAILED,
        providerMessageId: result.messageId,
        errorMessage: result.errorMessage,
      },
    });

    if (adapter.dispose) {
      await adapter.dispose();
    }

    return result;
  }

  /**
   * Send an email with attachments (typically for DTEs with PDF)
   */
  async sendEmailWithAttachment(
    tenantId: string,
    params: SendEmailWithAttachmentParams,
    dteId?: string,
  ): Promise<SendEmailResult> {
    const config = await this.prisma.tenantEmailConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      throw new NotFoundException('Email configuration not found');
    }

    if (!config.isActive) {
      throw new BadRequestException('Email configuration is not active');
    }

    if (!config.isVerified) {
      throw new BadRequestException(
        'Email configuration has not been verified. Please send a test email first.',
      );
    }

    const adapter = this.adapterFactory.createAdapter(config);
    const recipients = Array.isArray(params.to) ? params.to : [params.to];

    const result = await adapter.sendEmailWithAttachment(params);

    // Log the send
    await this.prisma.emailSendLog.create({
      data: {
        configId: config.id,
        dteId,
        recipientEmail: recipients[0],
        subject: params.subject,
        status: result.success ? EmailSendStatus.SENT : EmailSendStatus.FAILED,
        providerMessageId: result.messageId,
        errorMessage: result.errorMessage,
      },
    });

    if (adapter.dispose) {
      await adapter.dispose();
    }

    return result;
  }

  /**
   * Activate or deactivate email configuration
   */
  async setActive(tenantId: string, isActive: boolean): Promise<TenantEmailConfig> {
    const config = await this.prisma.tenantEmailConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      throw new NotFoundException('Email configuration not found');
    }

    if (isActive && !config.isVerified) {
      throw new BadRequestException(
        'Cannot activate unverified configuration. Send a test email first.',
      );
    }

    return this.prisma.tenantEmailConfig.update({
      where: { tenantId },
      data: { isActive },
    });
  }

  /**
   * Get email send logs for a tenant
   */
  async getSendLogs(
    tenantId: string,
    page = 1,
    limit = 20,
  ) {
    const config = await this.prisma.tenantEmailConfig.findUnique({
      where: { tenantId },
      select: { id: true },
    });

    if (!config) {
      return { logs: [], total: 0, page, limit };
    }

    const [logs, total] = await Promise.all([
      this.prisma.emailSendLog.findMany({
        where: { configId: config.id },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.emailSendLog.count({
        where: { configId: config.id },
      }),
    ]);

    return { logs, total, page, limit };
  }

  /**
   * Encrypt sensitive fields before storing
   */
  private encryptSensitiveFields<T extends Partial<CreateEmailConfigDto>>(dto: T): T {
    const result = { ...dto } as T;

    // Encrypt SMTP password
    if (dto.smtpPassword) {
      (result as Record<string, unknown>).smtpPassword = this.encryptionService.encrypt(dto.smtpPassword);
    }

    // Encrypt API credentials
    if (dto.apiKey) {
      (result as Record<string, unknown>).apiKey = this.encryptionService.encrypt(dto.apiKey);
    }
    if (dto.apiSecret) {
      (result as Record<string, unknown>).apiSecret = this.encryptionService.encrypt(dto.apiSecret);
    }

    // Encrypt OAuth2 credentials
    if (dto.oauth2ClientSecret) {
      (result as Record<string, unknown>).oauth2ClientSecret = this.encryptionService.encrypt(
        dto.oauth2ClientSecret,
      );
    }

    return result;
  }

  /**
   * Generate HTML for test email
   */
  private generateTestEmailHtml(message: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
    .message { color: #374151; line-height: 1.6; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Republicode - Facturación Electrónica</h1>
    </div>
    <div class="content">
      <div class="success-icon">✅</div>
      <p class="message">${message}</p>
      <p class="message" style="margin-top: 20px;">
        Su configuración de correo electrónico ha sido verificada correctamente.
        Ahora puede enviar facturas y documentos tributarios electrónicos por email.
      </p>
    </div>
    <div class="footer">
      Este es un correo automático de prueba.<br>
      © ${new Date().getFullYear()} Republicode - El Salvador
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
