import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as forge from 'node-forge';
import * as jose from 'jose';
import { readFileSync } from 'fs';

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
}

export interface SignResult {
  jws: string;
  certificateInfo: CertificateInfo;
}

@Injectable()
export class SignerService implements OnModuleInit {
  private readonly logger = new Logger(SignerService.name);
  private privateKey: forge.pki.rsa.PrivateKey | null = null;
  private certificate: forge.pki.Certificate | null = null;
  private josePrivateKey: jose.KeyLike | null = null;
  private josePublicKey: jose.KeyLike | null = null;

  async onModuleInit() {
    const certPath = process.env.CERT_PATH;
    const certPassword = process.env.CERT_PASSWORD;

    if (certPath && certPassword) {
      try {
        await this.loadCertificate(certPath, certPassword);
        this.logger.log('Certificate loaded successfully on startup');
      } catch (error) {
        this.logger.warn(`Could not load certificate on startup: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  async loadCertificate(p12Path: string, password: string): Promise<CertificateInfo> {
    try {
      const p12Buffer = readFileSync(p12Path);
      const p12Base64 = p12Buffer.toString('base64');
      const p12Der = forge.util.decode64(p12Base64);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      // Extract private key
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];

      if (!keyBag || keyBag.length === 0 || !keyBag[0].key) {
        throw new Error('No private key found in certificate');
      }

      this.privateKey = keyBag[0].key as forge.pki.rsa.PrivateKey;

      // Extract certificate
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag];

      if (!certBag || certBag.length === 0 || !certBag[0].cert) {
        throw new Error('No certificate found in .p12 file');
      }

      this.certificate = certBag[0].cert;

      // Convert to jose format for signing/verification
      const privateKeyPem = forge.pki.privateKeyToPem(this.privateKey);
      const publicKeyPem = forge.pki.publicKeyToPem(this.certificate.publicKey);

      this.josePrivateKey = await jose.importPKCS8(privateKeyPem, 'RS256');
      this.josePublicKey = await jose.importSPKI(publicKeyPem, 'RS256');

      const certInfo = this.getCertificateInfo();
      this.logger.log(`Certificate loaded: ${certInfo.subject}`);

      return certInfo;
    } catch (error) {
      this.privateKey = null;
      this.certificate = null;
      this.josePrivateKey = null;
      this.josePublicKey = null;

      throw new Error(`Failed to load certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadCertificateFromBuffer(p12Buffer: Buffer, password: string): Promise<CertificateInfo> {
    try {
      const p12Base64 = p12Buffer.toString('base64');
      const p12Der = forge.util.decode64(p12Base64);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];

      if (!keyBag || keyBag.length === 0 || !keyBag[0].key) {
        throw new Error('No private key found in certificate');
      }

      this.privateKey = keyBag[0].key as forge.pki.rsa.PrivateKey;

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag];

      if (!certBag || certBag.length === 0 || !certBag[0].cert) {
        throw new Error('No certificate found in .p12 file');
      }

      this.certificate = certBag[0].cert;

      const privateKeyPem = forge.pki.privateKeyToPem(this.privateKey);
      const publicKeyPem = forge.pki.publicKeyToPem(this.certificate.publicKey);

      this.josePrivateKey = await jose.importPKCS8(privateKeyPem, 'RS256');
      this.josePublicKey = await jose.importSPKI(publicKeyPem, 'RS256');

      return this.getCertificateInfo();
    } catch (error) {
      throw new Error(`Failed to load certificate from buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getCertificateInfo(): CertificateInfo {
    if (!this.certificate) {
      throw new Error('No certificate loaded');
    }

    const getAttributeValue = (attrs: forge.pki.CertificateField[], shortName: string): string => {
      const attr = attrs.find(a => a.shortName === shortName);
      return attr?.value?.toString() || '';
    };

    const subjectCN = getAttributeValue(this.certificate.subject.attributes, 'CN');
    const issuerCN = getAttributeValue(this.certificate.issuer.attributes, 'CN');

    return {
      subject: subjectCN || this.certificate.subject.attributes.map(a => `${a.shortName}=${a.value}`).join(', '),
      issuer: issuerCN || this.certificate.issuer.attributes.map(a => `${a.shortName}=${a.value}`).join(', '),
      validFrom: this.certificate.validity.notBefore,
      validTo: this.certificate.validity.notAfter,
      serialNumber: this.certificate.serialNumber,
    };
  }

  isCertificateLoaded(): boolean {
    return this.josePrivateKey !== null && this.josePublicKey !== null;
  }

  isCertificateValid(): boolean {
    if (!this.certificate) {
      return false;
    }
    const now = new Date();
    return now >= this.certificate.validity.notBefore && now <= this.certificate.validity.notAfter;
  }

  async signDTE<T extends object>(dteJson: T): Promise<string> {
    if (!this.josePrivateKey) {
      throw new Error('No private key loaded. Call loadCertificate first.');
    }

    if (!this.isCertificateValid()) {
      throw new Error('Certificate has expired or is not yet valid');
    }

    try {
      const payload = JSON.stringify(dteJson);

      const jws = await new jose.CompactSign(new TextEncoder().encode(payload))
        .setProtectedHeader({ alg: 'RS256' })
        .sign(this.josePrivateKey);

      this.logger.debug(`DTE signed successfully. JWS length: ${jws.length}`);

      return jws;
    } catch (error) {
      throw new Error(`Failed to sign DTE: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async signDTEWithInfo<T extends object>(dteJson: T): Promise<SignResult> {
    const jws = await this.signDTE(dteJson);
    return {
      jws,
      certificateInfo: this.getCertificateInfo(),
    };
  }

  async verifySignature(jws: string): Promise<{ valid: boolean; payload: unknown }> {
    if (!this.josePublicKey) {
      throw new Error('No public key loaded. Call loadCertificate first.');
    }

    try {
      const { payload } = await jose.compactVerify(jws, this.josePublicKey);
      const payloadString = new TextDecoder().decode(payload);

      return {
        valid: true,
        payload: JSON.parse(payloadString),
      };
    } catch (error) {
      this.logger.warn(`Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        valid: false,
        payload: null,
      };
    }
  }

  async verifySignatureWithPublicKey(jws: string, publicKeyPem: string): Promise<{ valid: boolean; payload: unknown }> {
    try {
      const publicKey = await jose.importSPKI(publicKeyPem, 'RS256');
      const { payload } = await jose.compactVerify(jws, publicKey);
      const payloadString = new TextDecoder().decode(payload);

      return {
        valid: true,
        payload: JSON.parse(payloadString),
      };
    } catch (error) {
      return {
        valid: false,
        payload: null,
      };
    }
  }

  decodeJWSPayload(jws: string): unknown {
    try {
      const parts = jws.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWS format');
      }

      const payloadBase64 = parts[1];
      const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8');

      return JSON.parse(payloadJson);
    } catch (error) {
      throw new Error(`Failed to decode JWS payload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  decodeJWSHeader(jws: string): { alg: string; [key: string]: unknown } {
    try {
      const parts = jws.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWS format');
      }

      const headerBase64 = parts[0];
      const headerJson = Buffer.from(headerBase64, 'base64url').toString('utf-8');

      return JSON.parse(headerJson);
    } catch (error) {
      throw new Error(`Failed to decode JWS header: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
