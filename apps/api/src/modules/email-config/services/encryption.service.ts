import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly logger = new Logger(EncryptionService.name);
  private encryptionKey: Buffer;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const keyHex = this.configService.get<string>('ENCRYPTION_KEY');

    if (!keyHex) {
      this.logger.warn(
        'ENCRYPTION_KEY not set. Generating random key for development. ' +
          'Set ENCRYPTION_KEY environment variable for production!',
      );
      // Generate a random key for development
      this.encryptionKey = crypto.randomBytes(32);
    } else {
      // Key should be 64 hex characters (32 bytes)
      if (keyHex.length !== 64) {
        throw new Error(
          'ENCRYPTION_KEY must be 64 hex characters (32 bytes for AES-256)',
        );
      }
      this.encryptionKey = Buffer.from(keyHex, 'hex');
    }
  }

  /**
   * Encrypt a string value
   * Returns: base64 encoded string containing salt + iv + authTag + encrypted data
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      return plaintext;
    }

    try {
      // Generate random IV
      const iv = crypto.randomBytes(IV_LENGTH);

      // Generate random salt for key derivation
      const salt = crypto.randomBytes(SALT_LENGTH);

      // Derive a unique key for this encryption using PBKDF2
      const derivedKey = crypto.pbkdf2Sync(
        this.encryptionKey,
        salt,
        100000, // iterations
        32, // key length
        'sha512',
      );

      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

      // Encrypt
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine: salt + iv + authTag + encrypted
      const combined = Buffer.concat([salt, iv, authTag, encrypted]);

      return combined.toString('base64');
    } catch (error) {
      this.logger.error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt a string value
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext) {
      return ciphertext;
    }

    try {
      // Decode from base64
      const combined = Buffer.from(ciphertext, 'base64');

      // Extract components
      const salt = combined.subarray(0, SALT_LENGTH);
      const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const authTag = combined.subarray(
        SALT_LENGTH + IV_LENGTH,
        SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH,
      );
      const encrypted = combined.subarray(
        SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH,
      );

      // Derive the same key
      const derivedKey = crypto.pbkdf2Sync(
        this.encryptionKey,
        salt,
        100000,
        32,
        'sha512',
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Check if a value appears to be encrypted (base64 with correct structure)
   */
  isEncrypted(value: string): boolean {
    if (!value) return false;

    try {
      const decoded = Buffer.from(value, 'base64');
      // Check minimum length: salt + iv + authTag + at least 1 byte of data
      return decoded.length >= SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1;
    } catch {
      return false;
    }
  }

  /**
   * Mask a sensitive value for logging/display (show last 4 chars)
   */
  mask(value: string, visibleChars = 4): string {
    if (!value || value.length <= visibleChars) {
      return '****';
    }
    return '*'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
  }

  /**
   * Generate a random encryption key (for setup purposes)
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
