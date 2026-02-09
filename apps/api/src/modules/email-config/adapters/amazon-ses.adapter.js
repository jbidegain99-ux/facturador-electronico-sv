"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonSesAdapter = void 0;
const common_1 = require("@nestjs/common");
const email_types_1 = require("../types/email.types");
const nodemailer = __importStar(require("nodemailer"));
const email_adapter_interface_1 = require("./email-adapter.interface");
/**
 * Amazon SES adapter using SMTP interface
 * This approach is simpler and doesn't require AWS SDK
 * Uses SES SMTP credentials (not IAM credentials)
 */
class AmazonSesAdapter extends email_adapter_interface_1.BaseEmailAdapter {
    provider = email_types_1.EmailProvider.AMAZON_SES;
    logger = new common_1.Logger(AmazonSesAdapter.name);
    transporter;
    constructor(config) {
        super(config);
        this.transporter = this.createTransporter();
    }
    createTransporter() {
        // SES SMTP endpoints by region
        const region = this.extractRegion();
        const smtpHost = `email-smtp.${region}.amazonaws.com`;
        return nodemailer.createTransport({
            host: this.config.smtpHost || smtpHost,
            port: this.config.smtpPort || 587,
            secure: this.config.smtpSecure ?? false,
            auth: {
                user: this.config.smtpUser || this.config.apiKey, // SES SMTP username
                pass: this.config.smtpPassword || this.config.apiSecret, // SES SMTP password
            },
            tls: {
                rejectUnauthorized: true,
            },
            connectionTimeout: this.getTimeoutMs(),
            greetingTimeout: this.getTimeoutMs(),
            socketTimeout: this.getTimeoutMs(),
        });
    }
    extractRegion() {
        // Try to extract region from endpoint or default to us-east-1
        if (this.config.apiEndpoint) {
            const match = this.config.apiEndpoint.match(/email-smtp\.([a-z0-9-]+)\.amazonaws\.com/);
            if (match)
                return match[1];
        }
        return 'us-east-1';
    }
    async testConnection() {
        const startTime = Date.now();
        try {
            await this.transporter.verify();
            return {
                success: true,
                responseTimeMs: Date.now() - startTime,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorCode = error.code;
            this.logger.warn(`Amazon SES connection test failed: ${errorMessage}`);
            return {
                success: false,
                responseTimeMs: Date.now() - startTime,
                errorMessage,
                errorCode,
            };
        }
    }
    async validateConfiguration() {
        const errors = [];
        // Either SMTP or API credentials are required
        const hasSmtp = this.config.smtpUser && this.config.smtpPassword;
        const hasApi = this.config.apiKey && this.config.apiSecret;
        if (!hasSmtp && !hasApi) {
            errors.push('SES SMTP credentials (smtpUser/smtpPassword) or API credentials (apiKey/apiSecret) are required');
        }
        if (!this.config.fromEmail) {
            errors.push('From email is required (must be verified in SES)');
        }
        if (!this.config.fromName) {
            errors.push('From name is required');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    async sendEmail(params) {
        try {
            const recipients = this.normalizeRecipients(params.to);
            const mailOptions = {
                from: this.getFromAddress(),
                to: recipients.join(', '),
                cc: params.cc?.join(', '),
                bcc: params.bcc?.join(', '),
                subject: params.subject,
                html: params.html,
                text: params.text,
                replyTo: params.replyTo || this.getReplyTo(),
                headers: process.env.SES_CONFIGURATION_SET
                    ? { ...params.headers, 'X-SES-CONFIGURATION-SET': process.env.SES_CONFIGURATION_SET }
                    : params.headers,
            };
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.debug(`Email sent successfully via Amazon SES. MessageId: ${info.messageId}`);
            return {
                success: true,
                messageId: info.messageId,
                providerResponse: info,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to send email via Amazon SES: ${errorMessage}`);
            return {
                success: false,
                errorMessage,
                errorCode: error.code,
            };
        }
    }
    async sendEmailWithAttachment(params) {
        try {
            const recipients = this.normalizeRecipients(params.to);
            const mailOptions = {
                from: this.getFromAddress(),
                to: recipients.join(', '),
                cc: params.cc?.join(', '),
                bcc: params.bcc?.join(', '),
                subject: params.subject,
                html: params.html,
                text: params.text,
                replyTo: params.replyTo || this.getReplyTo(),
                headers: params.headers,
                attachments: params.attachments.map((att) => ({
                    filename: att.filename,
                    content: Buffer.isBuffer(att.content)
                        ? att.content
                        : Buffer.from(att.content, 'base64'),
                    contentType: att.contentType,
                    contentDisposition: att.contentDisposition || 'attachment',
                    cid: att.cid,
                })),
            };
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.debug(`Email with attachments sent successfully via Amazon SES. MessageId: ${info.messageId}`);
            return {
                success: true,
                messageId: info.messageId,
                providerResponse: info,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to send email with attachments via Amazon SES: ${errorMessage}`);
            return {
                success: false,
                errorMessage,
                errorCode: error.code,
            };
        }
    }
    async dispose() {
        this.transporter.close();
    }
}
exports.AmazonSesAdapter = AmazonSesAdapter;
