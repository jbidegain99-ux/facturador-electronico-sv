import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as forge from 'node-forge';
import * as jose from 'jose';
import { CertificateInfo } from '../interfaces';

/**
 * Service for handling digital certificates (.p12/.pfx files)
 * Used for signing DTEs for Hacienda
 */
@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);

  /**
   * Parse and validate a certificate buffer (supports .p12/.pfx and .crt/.cer/.pem)
   * @param buffer - The certificate file as a Buffer
   * @param password - The certificate password (required for .p12/.pfx, optional for PEM)
   * @returns Certificate information
   */
  async parseCertificate(
    buffer: Buffer,
    password: string,
  ): Promise<CertificateInfo> {
    // Try to detect file type
    const content = buffer.toString('utf8');
    const isPem = content.includes('-----BEGIN');

    if (isPem) {
      return this.parsePemCertificate(buffer);
    }

    // Try PKCS#12 format
    return this.parsePkcs12Certificate(buffer, password);
  }

  /**
   * Parse PEM format certificate (.crt, .cer, .pem)
   */
  private async parsePemCertificate(buffer: Buffer): Promise<CertificateInfo> {
    try {
      const pemContent = buffer.toString('utf8');
      const certificate = forge.pki.certificateFromPem(pemContent);

      const nit = this.extractNitFromCertificate(certificate);

      const certInfo: CertificateInfo = {
        subject: this.formatSubject(certificate.subject.attributes),
        issuer: this.formatSubject(certificate.issuer.attributes),
        nit,
        validFrom: certificate.validity.notBefore,
        validTo: certificate.validity.notAfter,
        serialNumber: certificate.serialNumber,
      };

      this.logger.log(
        `PEM Certificate parsed successfully: ${certInfo.subject}, NIT: ${certInfo.nit || 'N/A'}`,
      );

      return certInfo;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Failed to parse PEM certificate: ${message}`);
      throw new BadRequestException(`Error al procesar el certificado PEM: ${message}`);
    }
  }

  /**
   * Parse PKCS#12 format certificate (.p12, .pfx)
   */
  private async parsePkcs12Certificate(
    buffer: Buffer,
    password: string,
  ): Promise<CertificateInfo> {
    try {
      const p12Base64 = buffer.toString('base64');
      const p12Der = forge.util.decode64(p12Base64);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      // Extract certificate
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag];

      if (!certBag || certBag.length === 0 || !certBag[0].cert) {
        throw new BadRequestException('No se encontró certificado en el archivo .p12');
      }

      const certificate = certBag[0].cert;

      // Verify private key exists
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];

      if (!keyBag || keyBag.length === 0 || !keyBag[0].key) {
        throw new BadRequestException('No se encontró llave privada en el certificado');
      }

      // Extract NIT from certificate subject
      const nit = this.extractNitFromCertificate(certificate);

      const certInfo: CertificateInfo = {
        subject: this.formatSubject(certificate.subject.attributes),
        issuer: this.formatSubject(certificate.issuer.attributes),
        nit,
        validFrom: certificate.validity.notBefore,
        validTo: certificate.validity.notAfter,
        serialNumber: certificate.serialNumber,
      };

      this.logger.log(
        `PKCS#12 Certificate parsed successfully: ${certInfo.subject}, NIT: ${certInfo.nit || 'N/A'}`,
      );

      return certInfo;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Error desconocido';

      if (message.includes('PKCS#12 MAC could not be verified')) {
        throw new BadRequestException(
          'Contraseña del certificado incorrecta',
        );
      }

      if (message.includes('Invalid PEM formatted message') || message.includes('Too few bytes')) {
        throw new BadRequestException(
          'Formato de archivo inválido. Verifique que el archivo sea un certificado válido.',
        );
      }

      this.logger.error(`Failed to parse PKCS#12 certificate: ${message}`);
      throw new BadRequestException(`Error al procesar el certificado: ${message}`);
    }
  }

  /**
   * Validate that a certificate is currently valid (not expired, not before valid date)
   * @param buffer - The .p12/.pfx file as a Buffer
   * @param password - The certificate password
   */
  async validateCertificate(
    buffer: Buffer,
    password: string,
  ): Promise<{ valid: boolean; message: string; info: CertificateInfo }> {
    const info = await this.parseCertificate(buffer, password);
    const now = new Date();

    if (now < info.validFrom) {
      return {
        valid: false,
        message: `El certificado aún no es válido. Válido desde: ${info.validFrom.toLocaleDateString()}`,
        info,
      };
    }

    if (now > info.validTo) {
      return {
        valid: false,
        message: `El certificado ha expirado. Expiró el: ${info.validTo.toLocaleDateString()}`,
        info,
      };
    }

    // Check if certificate expires in less than 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if (info.validTo < thirtyDaysFromNow) {
      const daysRemaining = Math.ceil(
        (info.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        valid: true,
        message: `El certificado es válido pero expirará en ${daysRemaining} días`,
        info,
      };
    }

    return {
      valid: true,
      message: 'El certificado es válido',
      info,
    };
  }

  /**
   * Extract private key and certificate for signing
   * Returns JOSE-compatible keys for JWS signing
   */
  async extractSigningKeys(
    buffer: Buffer,
    password: string,
  ): Promise<{
    privateKey: jose.KeyLike;
    publicKey: jose.KeyLike;
    certificate: forge.pki.Certificate;
  }> {
    try {
      const p12Base64 = buffer.toString('base64');
      const p12Der = forge.util.decode64(p12Base64);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      // Extract private key
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];

      if (!keyBag || keyBag.length === 0 || !keyBag[0].key) {
        throw new BadRequestException('No se encontró llave privada en el certificado');
      }

      const forgePrivateKey = keyBag[0].key as forge.pki.rsa.PrivateKey;

      // Extract certificate
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag];

      if (!certBag || certBag.length === 0 || !certBag[0].cert) {
        throw new BadRequestException('No se encontró certificado en el archivo .p12');
      }

      const certificate = certBag[0].cert;

      // Convert to JOSE format
      const privateKeyPem = forge.pki.privateKeyToPem(forgePrivateKey);
      const publicKeyPem = forge.pki.publicKeyToPem(certificate.publicKey);

      const privateKey = await jose.importPKCS8(privateKeyPem, 'RS256');
      const publicKey = await jose.importSPKI(publicKeyPem, 'RS256');

      return {
        privateKey,
        publicKey,
        certificate,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Failed to extract signing keys: ${message}`);
      throw new BadRequestException(`Error al extraer llaves de firma: ${message}`);
    }
  }

  /**
   * Sign a DTE JSON payload using the certificate
   * @param buffer - The .p12/.pfx file as a Buffer
   * @param password - The certificate password
   * @param payload - The DTE JSON object to sign
   * @returns JWS compact serialization string
   */
  async signPayload<T extends object>(
    buffer: Buffer,
    password: string,
    payload: T,
  ): Promise<string> {
    const { privateKey, certificate } = await this.extractSigningKeys(buffer, password);

    // Verify certificate is still valid
    const now = new Date();
    if (now < certificate.validity.notBefore || now > certificate.validity.notAfter) {
      throw new BadRequestException('El certificado ha expirado o aún no es válido');
    }

    const payloadString = JSON.stringify(payload);

    const jws = await new jose.CompactSign(new TextEncoder().encode(payloadString))
      .setProtectedHeader({ alg: 'RS256' })
      .sign(privateKey);

    this.logger.debug(`Payload signed successfully. JWS length: ${jws.length}`);

    return jws;
  }

  /**
   * Verify a JWS signature using a certificate
   */
  async verifySignature(
    buffer: Buffer,
    password: string,
    jws: string,
  ): Promise<{ valid: boolean; payload: unknown }> {
    try {
      const { publicKey } = await this.extractSigningKeys(buffer, password);
      const { payload } = await jose.compactVerify(jws, publicKey);
      const payloadString = new TextDecoder().decode(payload);

      return {
        valid: true,
        payload: JSON.parse(payloadString),
      };
    } catch (error) {
      this.logger.warn(
        `Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {
        valid: false,
        payload: null,
      };
    }
  }

  /**
   * Extract NIT from certificate subject or serial number
   */
  private extractNitFromCertificate(certificate: forge.pki.Certificate): string | null {
    // Try to find NIT in subject attributes (common name or other fields)
    const cnAttr = certificate.subject.attributes.find(
      (attr) => attr.shortName === 'CN',
    );

    if (cnAttr && cnAttr.value) {
      const cnValue = cnAttr.value.toString();
      // NIT format in El Salvador: XXXX-XXXXXX-XXX-X
      const nitMatch = cnValue.match(/\d{4}-\d{6}-\d{3}-\d/);
      if (nitMatch) {
        return nitMatch[0];
      }
      // Try without dashes
      const nitMatchNoDash = cnValue.match(/\d{14}/);
      if (nitMatchNoDash) {
        const nit = nitMatchNoDash[0];
        return `${nit.slice(0, 4)}-${nit.slice(4, 10)}-${nit.slice(10, 13)}-${nit.slice(13)}`;
      }
    }

    // Try serial number attribute
    const serialAttr = certificate.subject.attributes.find(
      (attr) => attr.shortName === 'serialName' || attr.name === 'serialNumber',
    );

    if (serialAttr && serialAttr.value) {
      const serialValue = serialAttr.value.toString();
      const nitMatch = serialValue.match(/\d{4}-\d{6}-\d{3}-\d/);
      if (nitMatch) {
        return nitMatch[0];
      }
    }

    return null;
  }

  /**
   * Format certificate subject/issuer attributes to readable string
   */
  private formatSubject(attributes: forge.pki.CertificateField[]): string {
    return attributes
      .map((attr) => `${attr.shortName}=${attr.value}`)
      .join(', ');
  }

  /**
   * Get certificate expiry days remaining
   */
  getDaysUntilExpiry(validTo: Date): number {
    const now = new Date();
    const diff = validTo.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
