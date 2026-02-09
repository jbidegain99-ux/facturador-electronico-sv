"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEmailAdapter = void 0;
/**
 * Base abstract class for email adapters with common functionality
 */
class BaseEmailAdapter {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Get the from address formatted with name
     */
    getFromAddress() {
        return `"${this.config.fromName}" <${this.config.fromEmail}>`;
    }
    /**
     * Get reply-to address, falling back to from address
     */
    getReplyTo() {
        return this.config.replyToEmail || this.config.fromEmail;
    }
    /**
     * Get timeout in milliseconds
     */
    getTimeoutMs() {
        return (this.config.timeoutSeconds || 30) * 1000;
    }
    /**
     * Format recipients to array
     */
    normalizeRecipients(to) {
        return Array.isArray(to) ? to : [to];
    }
}
exports.BaseEmailAdapter = BaseEmailAdapter;
