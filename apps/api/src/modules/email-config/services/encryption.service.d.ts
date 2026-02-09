import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class EncryptionService implements OnModuleInit {
    private configService;
    private readonly logger;
    private encryptionKey;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    /**
     * Encrypt a string value
     * Returns: base64 encoded string containing salt + iv + authTag + encrypted data
     */
    encrypt(plaintext: string): string;
    /**
     * Decrypt a string value
     */
    decrypt(ciphertext: string): string;
    /**
     * Check if a value appears to be encrypted (base64 with correct structure)
     */
    isEncrypted(value: string): boolean;
    /**
     * Mask a sensitive value for logging/display (show last 4 chars)
     */
    mask(value: string, visibleChars?: number): string;
    /**
     * Generate a random encryption key (for setup purposes)
     */
    static generateKey(): string;
}
//# sourceMappingURL=encryption.service.d.ts.map