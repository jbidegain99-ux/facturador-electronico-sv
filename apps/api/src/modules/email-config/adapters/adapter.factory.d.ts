import { EmailProvider, TenantEmailConfig } from '../types/email.types';
import { EncryptionService } from '../services/encryption.service';
import { IEmailAdapter } from './email-adapter.interface';
export declare class EmailAdapterFactory {
    private readonly encryptionService;
    private readonly logger;
    constructor(encryptionService: EncryptionService);
    /**
     * Create an email adapter for the given configuration
     */
    createAdapter(config: TenantEmailConfig): IEmailAdapter;
    /**
     * Decrypt all sensitive fields in the configuration
     */
    private decryptConfig;
    /**
     * Safely decrypt a value, returning undefined if null/empty
     */
    private safeDecrypt;
    /**
     * Get list of providers that require OAuth2 flow
     */
    static getOAuth2Providers(): EmailProvider[];
    /**
     * Get list of providers that support API key authentication
     */
    static getApiKeyProviders(): EmailProvider[];
    /**
     * Get list of providers that support SMTP authentication
     */
    static getSmtpProviders(): EmailProvider[];
    /**
     * Check if a provider requires OAuth2 flow
     */
    static requiresOAuth2(provider: EmailProvider): boolean;
}
//# sourceMappingURL=adapter.factory.d.ts.map