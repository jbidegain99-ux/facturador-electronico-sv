"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailtrapAdapter = void 0;
const common_1 = require("@nestjs/common");
const email_types_1 = require("../types/email.types");
const email_adapter_interface_1 = require("./email-adapter.interface");
/**
 * Mailtrap email adapter using REST API
 * Great for testing/development environments
 */
class MailtrapAdapter extends email_adapter_interface_1.BaseEmailAdapter {
    provider = email_types_1.EmailProvider.MAILTRAP;
    logger = new common_1.Logger(MailtrapAdapter.name);
    apiUrl;
    constructor(config) {
        super(config);
        // Mailtrap has different endpoints for testing vs sending
        // Testing: https://sandbox.api.mailtrap.io/api/send
        // Sending: https://send.api.mailtrap.io/api/send
        this.apiUrl =
            config.apiEndpoint || 'https://send.api.mailtrap.io/api/send';
    }
    async testConnection() {
        const startTime = Date.now();
        try {
            // Mailtrap doesn't have a specific test endpoint
            // We'll verify by checking if the API key format is correct
            // and attempting a minimal request
            const response = await fetch(this.apiUrl.replace('/send', ''), {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Api-Token': this.config.apiKey,
                },
                signal: AbortSignal.timeout(this.getTimeoutMs()),
            });
            // Even a 404 means the API key worked for auth
            if (response.status === 401 || response.status === 403) {
                return {
                    success: false,
                    responseTimeMs: Date.now() - startTime,
                    errorMessage: 'Invalid API token',
                    errorCode: 'AUTH_ERROR',
                };
            }
            return {
                success: true,
                responseTimeMs: Date.now() - startTime,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(`Mailtrap connection test failed: ${errorMessage}`);
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
            errors.push('Mailtrap API token is required');
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
                from: {
                    email: this.config.fromEmail,
                    name: this.config.fromName || this.config.fromEmail,
                },
                to: recipients.map((email) => ({ email })),
                subject: params.subject,
                html: params.html,
                text: params.text,
                cc: params.cc?.map((email) => ({ email })),
                bcc: params.bcc?.map((email) => ({ email })),
            };
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Api-Token': this.config.apiKey,
                },
                body: JSON.stringify(emailRequest),
                signal: AbortSignal.timeout(this.getTimeoutMs()),
            });
            if (!response.ok) {
                const errorBody = await response.json();
                this.logger.error(`Mailtrap API error: ${JSON.stringify(errorBody)}`);
                return {
                    success: false,
                    errorMessage: errorBody.errors?.join(', ') || `HTTP ${response.status}`,
                    errorCode: `HTTP_${response.status}`,
                };
            }
            const data = await response.json();
            this.logger.debug(`Email sent successfully via Mailtrap. MessageIds: ${data.message_ids?.join(', ')}`);
            return {
                success: true,
                messageId: data.message_ids?.[0],
                providerResponse: data,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to send email via Mailtrap: ${errorMessage}`);
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
                from: {
                    email: this.config.fromEmail,
                    name: this.config.fromName || this.config.fromEmail,
                },
                to: recipients.map((email) => ({ email })),
                subject: params.subject,
                html: params.html,
                text: params.text,
                cc: params.cc?.map((email) => ({ email })),
                bcc: params.bcc?.map((email) => ({ email })),
                attachments: params.attachments.map((att) => ({
                    filename: att.filename,
                    content: Buffer.isBuffer(att.content)
                        ? att.content.toString('base64')
                        : att.content,
                    type: att.contentType,
                    disposition: att.contentDisposition || 'attachment',
                })),
            };
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Api-Token': this.config.apiKey,
                },
                body: JSON.stringify(emailRequest),
                signal: AbortSignal.timeout(this.getTimeoutMs()),
            });
            if (!response.ok) {
                const errorBody = await response.json();
                this.logger.error(`Mailtrap API error: ${JSON.stringify(errorBody)}`);
                return {
                    success: false,
                    errorMessage: errorBody.errors?.join(', ') || `HTTP ${response.status}`,
                    errorCode: `HTTP_${response.status}`,
                };
            }
            const data = await response.json();
            this.logger.debug(`Email with attachments sent successfully via Mailtrap. MessageIds: ${data.message_ids?.join(', ')}`);
            return {
                success: true,
                messageId: data.message_ids?.[0],
                providerResponse: data,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to send email with attachments via Mailtrap: ${errorMessage}`);
            return {
                success: false,
                errorMessage,
            };
        }
    }
}
exports.MailtrapAdapter = MailtrapAdapter;
