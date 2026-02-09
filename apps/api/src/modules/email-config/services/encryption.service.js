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
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
let EncryptionService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var EncryptionService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EncryptionService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        configService;
        logger = new common_1.Logger(EncryptionService.name);
        encryptionKey;
        constructor(configService) {
            this.configService = configService;
        }
        onModuleInit() {
            const keyHex = this.configService.get('ENCRYPTION_KEY');
            if (!keyHex) {
                this.logger.warn('ENCRYPTION_KEY not set. Generating random key for development. ' +
                    'Set ENCRYPTION_KEY environment variable for production!');
                // Generate a random key for development
                this.encryptionKey = crypto.randomBytes(32);
            }
            else {
                // Key should be 64 hex characters (32 bytes)
                if (keyHex.length !== 64) {
                    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes for AES-256)');
                }
                this.encryptionKey = Buffer.from(keyHex, 'hex');
            }
        }
        /**
         * Encrypt a string value
         * Returns: base64 encoded string containing salt + iv + authTag + encrypted data
         */
        encrypt(plaintext) {
            if (!plaintext) {
                return plaintext;
            }
            try {
                // Generate random IV
                const iv = crypto.randomBytes(IV_LENGTH);
                // Generate random salt for key derivation
                const salt = crypto.randomBytes(SALT_LENGTH);
                // Derive a unique key for this encryption using PBKDF2
                const derivedKey = crypto.pbkdf2Sync(this.encryptionKey, salt, 100000, // iterations
                32, // key length
                'sha512');
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
            }
            catch (error) {
                this.logger.error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                throw new Error('Failed to encrypt data');
            }
        }
        /**
         * Decrypt a string value
         */
        decrypt(ciphertext) {
            if (!ciphertext) {
                return ciphertext;
            }
            try {
                // Decode from base64
                const combined = Buffer.from(ciphertext, 'base64');
                // Extract components
                const salt = combined.subarray(0, SALT_LENGTH);
                const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
                const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
                const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
                // Derive the same key
                const derivedKey = crypto.pbkdf2Sync(this.encryptionKey, salt, 100000, 32, 'sha512');
                // Create decipher
                const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
                decipher.setAuthTag(authTag);
                // Decrypt
                const decrypted = Buffer.concat([
                    decipher.update(encrypted),
                    decipher.final(),
                ]);
                return decrypted.toString('utf8');
            }
            catch (error) {
                this.logger.error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                throw new Error('Failed to decrypt data');
            }
        }
        /**
         * Check if a value appears to be encrypted (base64 with correct structure)
         */
        isEncrypted(value) {
            if (!value)
                return false;
            try {
                const decoded = Buffer.from(value, 'base64');
                // Check minimum length: salt + iv + authTag + at least 1 byte of data
                return decoded.length >= SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1;
            }
            catch {
                return false;
            }
        }
        /**
         * Mask a sensitive value for logging/display (show last 4 chars)
         */
        mask(value, visibleChars = 4) {
            if (!value || value.length <= visibleChars) {
                return '****';
            }
            return '*'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
        }
        /**
         * Generate a random encryption key (for setup purposes)
         */
        static generateKey() {
            return crypto.randomBytes(32).toString('hex');
        }
    };
    return EncryptionService = _classThis;
})();
exports.EncryptionService = EncryptionService;
