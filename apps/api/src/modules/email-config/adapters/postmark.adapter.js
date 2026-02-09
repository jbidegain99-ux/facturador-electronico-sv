"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostmarkAdapter = void 0;
const common_1 = require("@nestjs/common");
const email_types_1 = require("../types/email.types");
const email_adapter_interface_1 = require("./email-adapter.interface");
/**
 * Postmark email adapter using REST API
 * Postmark is focused on transactional emails with excellent deliverability
 */
class PostmarkAdapter extends email_adapter_interface_1.BaseEmailAdapter {
    provider = email_types_1.EmailProvider.POSTMARK;
    logger = new common_1.Logger(PostmarkAdapter.name);
    apiUrl = 'https://api.postmarkapp.com';
    constructor(config) {
        super(config);
    }
    async testConnection() {
        const startTime = Date.now();
        try {
            // Verify API key by fetching server info
            const response = await fetch(`${this.apiUrl}/server`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Postmark-Server-Token': this.config.apiKey,
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
            this.logger.warn(`Postmark connection test failed: ${errorMessage}`);
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
            errors.push('Postmark Server API Token is required');
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
                From: this.getFromAddress(),
                To: recipients.join(','),
                Subject: params.subject,
                HtmlBody: params.html,
                TextBody: params.text,
                Cc: params.cc?.join(','),
                Bcc: params.bcc?.join(','),
                ReplyTo: params.replyTo || this.config.replyToEmail,
            };
            const response = await fetch(`${this.apiUrl}/email`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Postmark-Server-Token': this.config.apiKey,
                },
                body: JSON.stringify(emailRequest),
                signal: AbortSignal.timeout(this.getTimeoutMs()),
            });
            if (!response.ok) {
                const errorBody = await response.json();
                this.logger.error(`Postmark API error: ${JSON.stringify(errorBody)}`);
                return {
                    success: false,
                    errorMessage: errorBody.Message || `HTTP ${response.status}`,
                    errorCode: errorBody.ErrorCode?.toString(),
                };
            }
            const data = await response.json();
            this.logger.debug(`Email sent successfully via Postmark. MessageId: ${data.MessageID}`);
            return {
                success: true,
                messageId: data.MessageID,
                providerResponse: data,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to send email via Postmark: ${errorMessage}`);
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
                From: this.getFromAddress(),
                To: recipients.join(','),
                Subject: params.subject,
                HtmlBody: params.html,
                TextBody: params.text,
                Cc: params.cc?.join(','),
                Bcc: params.bcc?.join(','),
                ReplyTo: params.replyTo || this.config.replyToEmail,
                Attachments: params.attachments.map((att) => ({
                    Name: att.filename,
                    Content: Buffer.isBuffer(att.content)
                        ? att.content.toString('base64')
                        : att.content,
                    ContentType: att.contentType,
                    ContentID: att.cid,
                })),
            };
            const response = await fetch(`${this.apiUrl}/email`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Postmark-Server-Token': this.config.apiKey,
                },
                body: JSON.stringify(emailRequest),
                signal: AbortSignal.timeout(this.getTimeoutMs()),
            });
            if (!response.ok) {
                const errorBody = await response.json();
                this.logger.error(`Postmark API error: ${JSON.stringify(errorBody)}`);
                return {
                    success: false,
                    errorMessage: errorBody.Message || `HTTP ${response.status}`,
                    errorCode: errorBody.ErrorCode?.toString(),
                };
            }
            const data = await response.json();
            this.logger.debug(`Email with attachments sent successfully via Postmark. MessageId: ${data.MessageID}`);
            return {
                success: true,
                messageId: data.MessageID,
                providerResponse: data,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to send email with attachments via Postmark: ${errorMessage}`);
            return {
                success: false,
                errorMessage,
            };
        }
    }
}
exports.PostmarkAdapter = PostmarkAdapter;
