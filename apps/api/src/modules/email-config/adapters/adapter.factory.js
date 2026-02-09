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
exports.EmailAdapterFactory = void 0;
const common_1 = require("@nestjs/common");
const email_types_1 = require("../types/email.types");
const sendgrid_adapter_1 = require("./sendgrid.adapter");
const mailgun_adapter_1 = require("./mailgun.adapter");
const amazon_ses_adapter_1 = require("./amazon-ses.adapter");
const microsoft365_adapter_1 = require("./microsoft365.adapter");
const google_workspace_adapter_1 = require("./google-workspace.adapter");
const postmark_adapter_1 = require("./postmark.adapter");
const brevo_adapter_1 = require("./brevo.adapter");
const mailtrap_adapter_1 = require("./mailtrap.adapter");
const smtp_generic_adapter_1 = require("./smtp-generic.adapter");
let EmailAdapterFactory = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var EmailAdapterFactory = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EmailAdapterFactory = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        encryptionService;
        logger = new common_1.Logger(EmailAdapterFactory.name);
        constructor(encryptionService) {
            this.encryptionService = encryptionService;
        }
        /**
         * Create an email adapter for the given configuration
         */
        createAdapter(config) {
            const decryptedConfig = this.decryptConfig(config);
            switch (config.provider) {
                case email_types_1.EmailProvider.SENDGRID:
                    this.logger.debug(`Creating SendGrid adapter for tenant ${config.tenantId}`);
                    return new sendgrid_adapter_1.SendGridAdapter(decryptedConfig);
                case email_types_1.EmailProvider.MAILGUN:
                    this.logger.debug(`Creating Mailgun adapter for tenant ${config.tenantId}`);
                    return new mailgun_adapter_1.MailgunAdapter(decryptedConfig);
                case email_types_1.EmailProvider.AMAZON_SES:
                    this.logger.debug(`Creating Amazon SES adapter for tenant ${config.tenantId}`);
                    return new amazon_ses_adapter_1.AmazonSesAdapter(decryptedConfig);
                case email_types_1.EmailProvider.MICROSOFT_365:
                    this.logger.debug(`Creating Microsoft 365 adapter for tenant ${config.tenantId}`);
                    return new microsoft365_adapter_1.Microsoft365Adapter(decryptedConfig);
                case email_types_1.EmailProvider.GOOGLE_WORKSPACE:
                    this.logger.debug(`Creating Google Workspace adapter for tenant ${config.tenantId}`);
                    return new google_workspace_adapter_1.GoogleWorkspaceAdapter(decryptedConfig);
                case email_types_1.EmailProvider.POSTMARK:
                    this.logger.debug(`Creating Postmark adapter for tenant ${config.tenantId}`);
                    return new postmark_adapter_1.PostmarkAdapter(decryptedConfig);
                case email_types_1.EmailProvider.BREVO:
                    this.logger.debug(`Creating Brevo adapter for tenant ${config.tenantId}`);
                    return new brevo_adapter_1.BrevoAdapter(decryptedConfig);
                case email_types_1.EmailProvider.MAILTRAP:
                    this.logger.debug(`Creating Mailtrap adapter for tenant ${config.tenantId}`);
                    return new mailtrap_adapter_1.MailtrapAdapter(decryptedConfig);
                case email_types_1.EmailProvider.SMTP_GENERIC:
                default:
                    this.logger.debug(`Creating SMTP Generic adapter for tenant ${config.tenantId}`);
                    return new smtp_generic_adapter_1.SmtpGenericAdapter(decryptedConfig);
            }
        }
        /**
         * Decrypt all sensitive fields in the configuration
         */
        decryptConfig(config) {
            return {
                id: config.id,
                tenantId: config.tenantId,
                provider: config.provider,
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
        safeDecrypt(value) {
            if (!value)
                return undefined;
            try {
                return this.encryptionService.decrypt(value);
            }
            catch (error) {
                this.logger.warn(`Failed to decrypt value: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return undefined;
            }
        }
        /**
         * Get list of providers that require OAuth2 flow
         */
        static getOAuth2Providers() {
            return [email_types_1.EmailProvider.MICROSOFT_365, email_types_1.EmailProvider.GOOGLE_WORKSPACE];
        }
        /**
         * Get list of providers that support API key authentication
         */
        static getApiKeyProviders() {
            return [
                email_types_1.EmailProvider.SENDGRID,
                email_types_1.EmailProvider.MAILGUN,
                email_types_1.EmailProvider.POSTMARK,
                email_types_1.EmailProvider.BREVO,
                email_types_1.EmailProvider.MAILTRAP,
            ];
        }
        /**
         * Get list of providers that support SMTP authentication
         */
        static getSmtpProviders() {
            return [
                email_types_1.EmailProvider.SMTP_GENERIC,
                email_types_1.EmailProvider.AMAZON_SES,
                email_types_1.EmailProvider.SENDGRID,
                email_types_1.EmailProvider.MAILGUN,
            ];
        }
        /**
         * Check if a provider requires OAuth2 flow
         */
        static requiresOAuth2(provider) {
            return this.getOAuth2Providers().includes(provider);
        }
    };
    return EmailAdapterFactory = _classThis;
})();
exports.EmailAdapterFactory = EmailAdapterFactory;
