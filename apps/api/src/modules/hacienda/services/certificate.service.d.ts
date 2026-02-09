import * as forge from 'node-forge';
import * as jose from 'jose';
import { CertificateInfo } from '../interfaces';
/**
 * Service for handling digital certificates (.p12/.pfx and .crt/.cer/.pem files)
 * Used for signing DTEs for Hacienda
 */
export declare class CertificateService {
    private readonly logger;
    /**
     * Parse and validate a certificate buffer (supports .p12/.pfx, .crt/.cer/.pem, and Hacienda XML)
     * @param buffer - The certificate file as a Buffer
     * @param password - The certificate password (required for .p12/.pfx, optional for PEM/DER)
     * @returns Certificate information
     */
    parseCertificate(buffer: Buffer, password: string): Promise<CertificateInfo>;
    /**
     * Parse Hacienda's custom XML certificate format (.crt from MH)
     */
    private parseHaciendaXmlCertificate;
    /**
     * Format NIT with dashes (XXXX-XXXXXX-XXX-X)
     */
    private formatNit;
    /**
     * Parse DER format certificate (.crt, .cer in binary format)
     */
    private parseDerCertificate;
    /**
     * Parse PEM format certificate (.crt, .cer, .pem in text format)
     */
    private parsePemCertificate;
    /**
     * Parse base64-encoded certificate (without PEM headers)
     */
    private parseBase64Certificate;
    /**
     * Parse PKCS#12 format certificate (.p12, .pfx)
     */
    private parsePkcs12Certificate;
    /**
     * Validate that a certificate is currently valid (not expired, not before valid date)
     * @param buffer - The certificate file as a Buffer
     * @param password - The certificate password
     */
    validateCertificate(buffer: Buffer, password: string): Promise<{
        valid: boolean;
        message: string;
        info: CertificateInfo;
    }>;
    /**
     * Extract private key and certificate for signing
     * Returns JOSE-compatible keys for JWS signing
     */
    extractSigningKeys(buffer: Buffer, password: string): Promise<{
        privateKey: jose.KeyLike;
        publicKey: jose.KeyLike;
        certificate: forge.pki.Certificate | null;
        algorithm: string;
    }>;
    /**
     * Extract signing keys from Hacienda's custom XML certificate format
     * Uses RS512 algorithm as required by Hacienda's API
     */
    private extractSigningKeysFromHaciendaXml;
    /**
     * Sign a DTE JSON payload using the certificate
     * @param buffer - The .p12/.pfx file or Hacienda XML as a Buffer
     * @param password - The certificate password (not needed for XML format)
     * @param payload - The DTE JSON object to sign
     * @returns JWS compact serialization string
     */
    signPayload<T extends object>(buffer: Buffer, password: string, payload: T): Promise<string>;
    /**
     * Verify a JWS signature using a certificate
     */
    verifySignature(buffer: Buffer, password: string, jws: string): Promise<{
        valid: boolean;
        payload: unknown;
    }>;
    /**
     * Extract NIT from certificate subject or serial number
     */
    private extractNitFromCertificate;
    /**
     * Format certificate subject/issuer attributes to readable string
     */
    private formatSubject;
    /**
     * Get certificate expiry days remaining
     */
    getDaysUntilExpiry(validTo: Date): number;
}
//# sourceMappingURL=certificate.service.d.ts.map