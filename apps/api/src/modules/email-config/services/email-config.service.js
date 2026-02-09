"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailConfigService = void 0;
const common_1 = require("@nestjs/common");
const email_types_1 = require("../types/email.types");
let EmailConfigService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var EmailConfigService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EmailConfigService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        encryptionService;
        adapterFactory;
        logger = new common_1.Logger(EmailConfigService.name);
        constructor(prisma, encryptionService, adapterFactory) {
            this.prisma = prisma;
            this.encryptionService = encryptionService;
            this.adapterFactory = adapterFactory;
        }
        /**
         * Get email configuration for a tenant
         */
        async getConfig(tenantId) {
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
        async upsertConfig(tenantId, dto, configuredBy = email_types_1.ConfiguredBy.SELF, configuredByUserId) {
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
        async updateConfig(tenantId, dto) {
            const existing = await this.prisma.tenantEmailConfig.findUnique({
                where: { tenantId },
            });
            if (!existing) {
                throw new common_1.NotFoundException('Email configuration not found');
            }
            const encryptedData = this.encryptSensitiveFields(dto);
            // If critical fields changed, reset verification
            const resetVerification = dto.provider !== undefined ||
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
        async deleteConfig(tenantId) {
            const existing = await this.prisma.tenantEmailConfig.findUnique({
                where: { tenantId },
            });
            if (!existing) {
                throw new common_1.NotFoundException('Email configuration not found');
            }
            await this.prisma.tenantEmailConfig.delete({
                where: { tenantId },
            });
            this.logger.log(`Email configuration deleted for tenant ${tenantId}`);
        }
        /**
         * Test the email configuration connection
         */
        async testConnection(tenantId) {
            const config = await this.prisma.tenantEmailConfig.findUnique({
                where: { tenantId },
            });
            if (!config) {
                throw new common_1.NotFoundException('Email configuration not found');
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
                    status: result.success ? email_types_1.HealthStatus.HEALTHY : email_types_1.HealthStatus.UNHEALTHY,
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
        async sendTestEmail(tenantId, dto) {
            const config = await this.prisma.tenantEmailConfig.findUnique({
                where: { tenantId },
            });
            if (!config) {
                throw new common_1.NotFoundException('Email configuration not found');
            }
            const adapter = this.adapterFactory.createAdapter(config);
            const testHtml = this.generateTestEmailHtml(dto.message || 'Este es un correo de prueba para verificar la configuración de email.');
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
                    status: result.success ? email_types_1.EmailSendStatus.SENT : email_types_1.EmailSendStatus.FAILED,
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
                    status: result.success ? email_types_1.HealthStatus.HEALTHY : email_types_1.HealthStatus.UNHEALTHY,
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
        async sendEmail(tenantId, params, dteId) {
            const config = await this.prisma.tenantEmailConfig.findUnique({
                where: { tenantId },
            });
            if (!config) {
                throw new common_1.NotFoundException('Email configuration not found');
            }
            if (!config.isActive) {
                throw new common_1.BadRequestException('Email configuration is not active');
            }
            if (!config.isVerified) {
                throw new common_1.BadRequestException('Email configuration has not been verified. Please send a test email first.');
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
                    status: result.success ? email_types_1.EmailSendStatus.SENT : email_types_1.EmailSendStatus.FAILED,
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
        async sendEmailWithAttachment(tenantId, params, dteId) {
            const config = await this.prisma.tenantEmailConfig.findUnique({
                where: { tenantId },
            });
            if (!config) {
                throw new common_1.NotFoundException('Email configuration not found');
            }
            if (!config.isActive) {
                throw new common_1.BadRequestException('Email configuration is not active');
            }
            if (!config.isVerified) {
                throw new common_1.BadRequestException('Email configuration has not been verified. Please send a test email first.');
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
                    status: result.success ? email_types_1.EmailSendStatus.SENT : email_types_1.EmailSendStatus.FAILED,
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
        async setActive(tenantId, isActive) {
            const config = await this.prisma.tenantEmailConfig.findUnique({
                where: { tenantId },
            });
            if (!config) {
                throw new common_1.NotFoundException('Email configuration not found');
            }
            if (isActive && !config.isVerified) {
                throw new common_1.BadRequestException('Cannot activate unverified configuration. Send a test email first.');
            }
            return this.prisma.tenantEmailConfig.update({
                where: { tenantId },
                data: { isActive },
            });
        }
        /**
         * Get email send logs for a tenant
         */
        async getSendLogs(tenantId, page = 1, limit = 20) {
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
        encryptSensitiveFields(dto) {
            const result = { ...dto };
            // Encrypt SMTP password
            if (dto.smtpPassword) {
                result.smtpPassword = this.encryptionService.encrypt(dto.smtpPassword);
            }
            // Encrypt API credentials
            if (dto.apiKey) {
                result.apiKey = this.encryptionService.encrypt(dto.apiKey);
            }
            if (dto.apiSecret) {
                result.apiSecret = this.encryptionService.encrypt(dto.apiSecret);
            }
            // Encrypt OAuth2 credentials
            if (dto.oauth2ClientSecret) {
                result.oauth2ClientSecret = this.encryptionService.encrypt(dto.oauth2ClientSecret);
            }
            return result;
        }
        /**
         * Generate HTML for test email
         */
        generateTestEmailHtml(message) {
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
    };
    return EmailConfigService = _classThis;
})();
exports.EmailConfigService = EmailConfigService;
