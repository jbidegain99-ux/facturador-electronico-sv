"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrevoAdapter = void 0;
const common_1 = require("@nestjs/common");
const email_types_1 = require("../types/email.types");
const email_adapter_interface_1 = require("./email-adapter.interface");
/**
 * Brevo (formerly Sendinblue) email adapter using REST API
 */
class BrevoAdapter extends email_adapter_interface_1.BaseEmailAdapter {
    provider = email_types_1.EmailProvider.BREVO;
    logger = new common_1.Logger(BrevoAdapter.name);
    apiUrl = 'https://api.brevo.com/v3';
    constructor(config) {
        super(config);
    }
    async testConnection() {
        const startTime = Date.now();
        try {
            const response = await fetch(`${this.apiUrl}/account`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'api-key': this.config.apiKey,
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(`Brevo connection test failed: ${errorMessage}`);
            return {
                success: false,
                responseTimeMs: Date.now() - startTime,
                errorMessage,
            };
        }
    }
    async validateConfiguration() {
        const errors = [];
        if (!this.config.apiKey) {
            errors.push('Brevo API key is required');
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
    async sendEmail(params) {
        try {
            const recipients = this.normalizeRecipients(params.to);
            const emailRequest = {
                sender: {
                    name: this.config.fromName || this.config.fromEmail,
                    email: this.config.fromEmail,
                },
                to: recipients.map((email) => ({ email })),
                subject: params.subject,
                htmlContent: params.html,
                textContent: params.text,
                cc: params.cc?.map((email) => ({ email })),
                bcc: params.bcc?.map((email) => ({ email })),
            };
            if (params.replyTo || this.config.replyToEmail) {
                emailRequest.replyTo = {
                    email: params.replyTo || this.config.replyToEmail,
                };
            }
            const response = await fetch(`${this.apiUrl}/smtp/email`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'api-key': this.config.apiKey,
                },
                body: JSON.stringify(emailRequest),
                signal: AbortSignal.timeout(this.getTimeoutMs()),
            });
            if (!response.ok) {
                const errorBody = await response.json();
                this.logger.error(`Brevo API error: ${JSON.stringify(errorBody)}`);
                return {
                    success: false,
                    errorMessage: errorBody.message || `HTTP ${response.status}`,
                    errorCode: errorBody.code,
                };
            }
            const data = await response.json();
            this.logger.debug(`Email sent successfully via Brevo. MessageId: ${data.messageId}`);
            return {
                success: true,
                messageId: data.messageId,
                providerResponse: data,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to send email via Brevo: ${errorMessage}`);
            return {
                success: false,
                errorMessage,
            };
        }
    }
    async sendEmailWithAttachment(params) {
        try {
            const recipients = this.normalizeRecipients(params.to);
            const emailRequest = {
                sender: {
                    name: this.config.fromName || this.config.fromEmail,
                    email: this.config.fromEmail,
                },
                to: recipients.map((email) => ({ email })),
                subject: params.subject,
                htmlContent: params.html,
                textContent: params.text,
                cc: params.cc?.map((email) => ({ email })),
                bcc: params.bcc?.map((email) => ({ email })),
                attachment: params.attachments.map((att) => ({
                    name: att.filename,
                    content: Buffer.isBuffer(att.content)
                        ? att.content.toString('base64')
                        : att.content,
                })),
            };
            if (params.replyTo || this.config.replyToEmail) {
                emailRequest.replyTo = {
                    email: params.replyTo || this.config.replyToEmail,
                };
            }
            const response = await fetch(`${this.apiUrl}/smtp/email`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'api-key': this.config.apiKey,
                },
                body: JSON.stringify(emailRequest),
                signal: AbortSignal.timeout(this.getTimeoutMs()),
            });
            if (!response.ok) {
                const errorBody = await response.json();
                this.logger.error(`Brevo API error: ${JSON.stringify(errorBody)}`);
                return {
                    success: false,
                    errorMessage: errorBody.message || `HTTP ${response.status}`,
                    errorCode: errorBody.code,
                };
            }
            const data = await response.json();
            this.logger.debug(`Email with attachments sent successfully via Brevo. MessageId: ${data.messageId}`);
            return {
                success: true,
                messageId: data.messageId,
                providerResponse: data,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to send email with attachments via Brevo: ${errorMessage}`);
            return {
                success: false,
                errorMessage,
            };
        }
    }
}
exports.BrevoAdapter = BrevoAdapter;
