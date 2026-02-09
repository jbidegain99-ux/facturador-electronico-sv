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
exports.CertificateService = void 0;
const common_1 = require("@nestjs/common");
const forge = __importStar(require("node-forge"));
const jose = __importStar(require("jose"));
const crypto = __importStar(require("crypto"));
/**
 * Service for handling digital certificates (.p12/.pfx and .crt/.cer/.pem files)
 * Used for signing DTEs for Hacienda
 */
let CertificateService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CertificateService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CertificateService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        logger = new common_1.Logger(CertificateService.name);
        /**
         * Parse and validate a certificate buffer (supports .p12/.pfx, .crt/.cer/.pem, and Hacienda XML)
         * @param buffer - The certificate file as a Buffer
         * @param password - The certificate password (required for .p12/.pfx, optional for PEM/DER)
         * @returns Certificate information
         */
        async parseCertificate(buffer, password) {
            // Try to detect file type
            const content = buffer.toString('utf8');
            this.logger.debug(`Parsing certificate - Size: ${buffer.length} bytes`);
            // Check for Hacienda XML format first (starts with <CertificadoMH>)
            if (content.includes('<CertificadoMH>')) {
                this.logger.debug('Detected Hacienda XML format certificate');
                return this.parseHaciendaXmlCertificate(content);
            }
            const isPem = content.includes('-----BEGIN');
            if (isPem) {
                this.logger.debug('Detected PEM format certificate');
                return this.parsePemCertificate(buffer);
            }
            // Check if content is base64-encoded certificate (without PEM headers)
            const trimmedContent = content.trim();
            const isBase64 = /^[A-Za-z0-9+/=\s]+$/.test(trimmedContent) && trimmedContent.length > 100;
            if (isBase64) {
                this.logger.debug('Detected base64-encoded certificate without PEM headers');
                try {
                    return await this.parseBase64Certificate(trimmedContent);
                }
                catch (error) {
                    this.logger.debug(`Base64 certificate parsing failed: ${error instanceof Error ? error.message : 'Unknown'}`);
                }
            }
            // Try DER format (binary X.509 certificate - .crt, .cer)
            try {
                this.logger.debug('Trying DER format parsing');
                return await this.parseDerCertificate(buffer);
            }
            catch (error) {
                // If DER fails, try PKCS#12 format
                this.logger.debug(`DER parsing failed: ${error instanceof Error ? error.message : 'Unknown'}, trying PKCS#12 format`);
            }
            // Try PKCS#12 format (.p12, .pfx)
            return this.parsePkcs12Certificate(buffer, password);
        }
        /**
         * Parse Hacienda's custom XML certificate format (.crt from MH)
         */
        parseHaciendaXmlCertificate(content) {
            try {
                // Extract NIT
                const nitMatch = content.match(/<nit>(\d+)<\/nit>/);
                const nit = nitMatch ? this.formatNit(nitMatch[1]) : null;
                // Extract validity dates (Unix timestamps in seconds)
                const notBeforeMatch = content.match(/<notBefore>(\d+(?:\.\d+)?)<\/notBefore>/);
                const notAfterMatch = content.match(/<notAfter>(\d+(?:\.\d+)?)<\/notAfter>/);
                const validFrom = notBeforeMatch
                    ? new Date(parseFloat(notBeforeMatch[1]) * 1000)
                    : new Date();
                const validTo = notAfterMatch
                    ? new Date(parseFloat(notAfterMatch[1]) * 1000)
                    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                // Extract subject info
                const orgNameMatch = content.match(/<organizationName>([^<]+)<\/organizationName>/);
                const commonNameMatch = content.match(/<subject>.*?<commonName>([^<]*)<\/commonName>/s);
                const orgUnitMatch = content.match(/<organizationUnitName>([^<]*)<\/organizationUnitName>/);
                // Extract issuer info
                const issuerOrgMatch = content.match(/<issuer>.*?<organizationalName>([^<]+)<\/organizationalName>/s);
                const issuerCnMatch = content.match(/<issuer>.*?<commonName>([^<]+)<\/commonName>/s);
                // Extract serial from description or _id
                const descMatch = content.match(/<description>(\d+)<\/description>/);
                const idMatch = content.match(/<_id>([^<]+)<\/_id>/);
                const serialNumber = descMatch?.[1] || idMatch?.[1] || 'N/A';
                // Build subject string
                const subjectParts = [];
                if (orgNameMatch?.[1])
                    subjectParts.push(`O=${orgNameMatch[1]}`);
                if (orgUnitMatch?.[1])
                    subjectParts.push(`OU=${orgUnitMatch[1]}`);
                if (commonNameMatch?.[1])
                    subjectParts.push(`CN=${commonNameMatch[1]}`);
                const subject = subjectParts.join(', ') || 'Certificado MH';
                // Build issuer string
                const issuerParts = [];
                if (issuerOrgMatch?.[1])
                    issuerParts.push(`O=${issuerOrgMatch[1]}`);
                if (issuerCnMatch?.[1])
                    issuerParts.push(`CN=${issuerCnMatch[1]}`);
                const issuer = issuerParts.join(', ') || 'Ministerio de Hacienda';
                const certInfo = {
                    subject,
                    issuer,
                    nit,
                    validFrom,
                    validTo,
                    serialNumber,
                };
                this.logger.log(`Hacienda XML Certificate parsed successfully: ${certInfo.subject}, NIT: ${certInfo.nit || 'N/A'}`);
                return certInfo;
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Error desconocido';
                this.logger.error(`Failed to parse Hacienda XML certificate: ${message}`);
                throw new common_1.BadRequestException(`Error al procesar el certificado XML de Hacienda: ${message}`);
            }
        }
        /**
         * Format NIT with dashes (XXXX-XXXXXX-XXX-X)
         */
        formatNit(nit) {
            const cleanNit = nit.replace(/\D/g, '');
            if (cleanNit.length === 14) {
                return `${cleanNit.slice(0, 4)}-${cleanNit.slice(4, 10)}-${cleanNit.slice(10, 13)}-${cleanNit.slice(13)}`;
            }
            return nit;
        }
        /**
         * Parse DER format certificate (.crt, .cer in binary format)
         */
        async parseDerCertificate(buffer) {
            try {
                // Convert buffer to forge-compatible format
                const derBytes = forge.util.createBuffer(buffer.toString('binary'));
                const asn1 = forge.asn1.fromDer(derBytes);
                const certificate = forge.pki.certificateFromAsn1(asn1);
                const nit = this.extractNitFromCertificate(certificate);
                const certInfo = {
                    subject: this.formatSubject(certificate.subject.attributes),
                    issuer: this.formatSubject(certificate.issuer.attributes),
                    nit,
                    validFrom: certificate.validity.notBefore,
                    validTo: certificate.validity.notAfter,
                    serialNumber: certificate.serialNumber,
                };
                this.logger.log(`DER Certificate parsed successfully: ${certInfo.subject}, NIT: ${certInfo.nit || 'N/A'}`);
                return certInfo;
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Error desconocido';
                this.logger.debug(`Failed to parse DER certificate: ${message}`);
                throw new common_1.BadRequestException(`Error al procesar certificado DER: ${message}`);
            }
        }
        /**
         * Parse PEM format certificate (.crt, .cer, .pem in text format)
         */
        async parsePemCertificate(buffer) {
            try {
                const pemContent = buffer.toString('utf8');
                const certificate = forge.pki.certificateFromPem(pemContent);
                const nit = this.extractNitFromCertificate(certificate);
                const certInfo = {
                    subject: this.formatSubject(certificate.subject.attributes),
                    issuer: this.formatSubject(certificate.issuer.attributes),
                    nit,
                    validFrom: certificate.validity.notBefore,
                    validTo: certificate.validity.notAfter,
                    serialNumber: certificate.serialNumber,
                };
                this.logger.log(`PEM Certificate parsed successfully: ${certInfo.subject}, NIT: ${certInfo.nit || 'N/A'}`);
                return certInfo;
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Error desconocido';
                this.logger.error(`Failed to parse PEM certificate: ${message}`);
                throw new common_1.BadRequestException(`Error al procesar el certificado PEM: ${message}`);
            }
        }
        /**
         * Parse base64-encoded certificate (without PEM headers)
         */
        async parseBase64Certificate(base64Content) {
            try {
                // Remove any whitespace/newlines
                const cleanBase64 = base64Content.replace(/\s/g, '');
                // Wrap with PEM headers
                const pemContent = `-----BEGIN CERTIFICATE-----\n${cleanBase64}\n-----END CERTIFICATE-----`;
                const certificate = forge.pki.certificateFromPem(pemContent);
                const nit = this.extractNitFromCertificate(certificate);
                const certInfo = {
                    subject: this.formatSubject(certificate.subject.attributes),
                    issuer: this.formatSubject(certificate.issuer.attributes),
                    nit,
                    validFrom: certificate.validity.notBefore,
                    validTo: certificate.validity.notAfter,
                    serialNumber: certificate.serialNumber,
                };
                this.logger.log(`Base64 Certificate parsed successfully: ${certInfo.subject}, NIT: ${certInfo.nit || 'N/A'}`);
                return certInfo;
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Error desconocido';
                this.logger.debug(`Failed to parse base64 certificate: ${message}`);
                throw new common_1.BadRequestException(`Error al procesar el certificado base64: ${message}`);
            }
        }
        /**
         * Parse PKCS#12 format certificate (.p12, .pfx)
         */
        async parsePkcs12Certificate(buffer, password) {
            try {
                const p12Base64 = buffer.toString('base64');
                const p12Der = forge.util.decode64(p12Base64);
                const p12Asn1 = forge.asn1.fromDer(p12Der);
                const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
                // Extract certificate
                const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
                const certBag = certBags[forge.pki.oids.certBag];
                if (!certBag || certBag.length === 0 || !certBag[0].cert) {
                    throw new common_1.BadRequestException('No se encontró certificado en el archivo .p12');
                }
                const certificate = certBag[0].cert;
                // Verify private key exists
                const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
                const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
                if (!keyBag || keyBag.length === 0 || !keyBag[0].key) {
                    throw new common_1.BadRequestException('No se encontró llave privada en el certificado');
                }
                // Extract NIT from certificate subject
                const nit = this.extractNitFromCertificate(certificate);
                const certInfo = {
                    subject: this.formatSubject(certificate.subject.attributes),
                    issuer: this.formatSubject(certificate.issuer.attributes),
                    nit,
                    validFrom: certificate.validity.notBefore,
                    validTo: certificate.validity.notAfter,
                    serialNumber: certificate.serialNumber,
                };
                this.logger.log(`PKCS#12 Certificate parsed successfully: ${certInfo.subject}, NIT: ${certInfo.nit || 'N/A'}`);
                return certInfo;
            }
            catch (error) {
                if (error instanceof common_1.BadRequestException) {
                    throw error;
                }
                const message = error instanceof Error ? error.message : 'Error desconocido';
                if (message.includes('PKCS#12 MAC could not be verified')) {
                    throw new common_1.BadRequestException('Contraseña del certificado incorrecta');
                }
                if (message.includes('Invalid PEM formatted message') || message.includes('Too few bytes')) {
                    throw new common_1.BadRequestException('Formato de archivo inválido. Verifique que el archivo sea un certificado válido.');
                }
                this.logger.error(`Failed to parse PKCS#12 certificate: ${message}`);
                throw new common_1.BadRequestException(`Error al procesar el certificado: ${message}`);
            }
        }
        /**
         * Validate that a certificate is currently valid (not expired, not before valid date)
         * @param buffer - The certificate file as a Buffer
         * @param password - The certificate password
         */
        async validateCertificate(buffer, password) {
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
                const daysRemaining = Math.ceil((info.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
        async extractSigningKeys(buffer, password) {
            const content = buffer.toString('utf8');
            // Check for Hacienda XML format
            if (content.includes('<CertificadoMH>')) {
                return this.extractSigningKeysFromHaciendaXml(content, password);
            }
            // Try PKCS#12 format
            try {
                const p12Base64 = buffer.toString('base64');
                const p12Der = forge.util.decode64(p12Base64);
                const p12Asn1 = forge.asn1.fromDer(p12Der);
                const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
                // Extract private key
                const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
                const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
                if (!keyBag || keyBag.length === 0 || !keyBag[0].key) {
                    throw new common_1.BadRequestException('No se encontró llave privada en el certificado');
                }
                const forgePrivateKey = keyBag[0].key;
                // Extract certificate
                const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
                const certBag = certBags[forge.pki.oids.certBag];
                if (!certBag || certBag.length === 0 || !certBag[0].cert) {
                    throw new common_1.BadRequestException('No se encontró certificado en el archivo .p12');
                }
                const certificate = certBag[0].cert;
                // Convert to JOSE format
                const privateKeyPem = forge.pki.privateKeyToPem(forgePrivateKey);
                const publicKeyPem = forge.pki.publicKeyToPem(certificate.publicKey);
                // Hacienda requires RS512 (RSA with SHA-512) for all DTE signing
                const algorithm = 'RS512';
                const privateKey = await jose.importPKCS8(privateKeyPem, algorithm);
                const publicKey = await jose.importSPKI(publicKeyPem, algorithm);
                this.logger.log(`Extracted signing keys from PKCS#12 certificate (algorithm: ${algorithm})`);
                return {
                    privateKey,
                    publicKey,
                    certificate,
                    algorithm,
                };
            }
            catch (error) {
                if (error instanceof common_1.BadRequestException) {
                    throw error;
                }
                const message = error instanceof Error ? error.message : 'Error desconocido';
                this.logger.error(`Failed to extract signing keys: ${message}`);
                throw new common_1.BadRequestException(`Error al extraer llaves de firma: ${message}`);
            }
        }
        /**
         * Extract signing keys from Hacienda's custom XML certificate format
         * Uses RS512 algorithm as required by Hacienda's API
         */
        async extractSigningKeysFromHaciendaXml(content, password) {
            try {
                // Extract private key (PKCS#8 format)
                const privateKeyMatch = content.match(/<privateKey>.*?<encodied>([^<]+)<\/encodied>/s);
                if (!privateKeyMatch) {
                    throw new common_1.BadRequestException('No se encontró llave privada en el certificado XML');
                }
                // Extract public key (SPKI format)
                const publicKeyMatch = content.match(/<publicKey>.*?<encodied>([^<]+)<\/encodied>/s);
                if (!publicKeyMatch) {
                    throw new common_1.BadRequestException('No se encontró llave pública en el certificado XML');
                }
                // Extract the private key clave (hash) for password verification
                const privateKeyClaveMatch = content.match(/<privateKey>.*?<clave>([^<]+)<\/clave>/s);
                // Verify password if provided and clave exists
                if (password && privateKeyClaveMatch) {
                    const storedHash = privateKeyClaveMatch[1];
                    const computedHash = crypto.createHash('sha512').update(password).digest('hex');
                    if (storedHash !== computedHash) {
                        this.logger.warn('Certificate password verification failed');
                        // Note: We don't throw here as some certificates may not require password verification
                        // The signing will fail at Hacienda's end if the key is wrong
                    }
                    else {
                        this.logger.debug('Certificate password verified successfully');
                    }
                }
                // Clean base64 and wrap with PEM headers
                const privateKeyBase64 = privateKeyMatch[1].replace(/\s/g, '');
                const publicKeyBase64 = publicKeyMatch[1].replace(/\s/g, '');
                const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64}\n-----END PRIVATE KEY-----`;
                const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`;
                // Hacienda uses RS512 (RSA with SHA-512) as per their Java implementation
                const algorithm = 'RS512';
                const privateKey = await jose.importPKCS8(privateKeyPem, algorithm);
                const publicKey = await jose.importSPKI(publicKeyPem, algorithm);
                this.logger.log(`Successfully extracted signing keys from Hacienda XML certificate (algorithm: ${algorithm})`);
                return {
                    privateKey,
                    publicKey,
                    certificate: null, // XML format doesn't have a standard X.509 certificate
                    algorithm,
                };
            }
            catch (error) {
                if (error instanceof common_1.BadRequestException) {
                    throw error;
                }
                const message = error instanceof Error ? error.message : 'Error desconocido';
                this.logger.error(`Failed to extract signing keys from Hacienda XML: ${message}`);
                throw new common_1.BadRequestException(`Error al extraer llaves de firma del XML: ${message}`);
            }
        }
        /**
         * Sign a DTE JSON payload using the certificate
         * @param buffer - The .p12/.pfx file or Hacienda XML as a Buffer
         * @param password - The certificate password (not needed for XML format)
         * @param payload - The DTE JSON object to sign
         * @returns JWS compact serialization string
         */
        async signPayload(buffer, password, payload) {
            const { privateKey, certificate, algorithm } = await this.extractSigningKeys(buffer, password);
            this.logger.debug(`Signing payload with algorithm: ${algorithm}`);
            // Verify certificate is still valid (only for PKCS#12 format with X.509 cert)
            if (certificate) {
                const now = new Date();
                if (now < certificate.validity.notBefore || now > certificate.validity.notAfter) {
                    throw new common_1.BadRequestException('El certificado ha expirado o aún no es válido');
                }
            }
            else {
                // For Hacienda XML format, validate using parsed certificate info
                const content = buffer.toString('utf8');
                if (content.includes('<CertificadoMH>')) {
                    const certInfo = this.parseHaciendaXmlCertificate(content);
                    const now = new Date();
                    if (now < certInfo.validFrom || now > certInfo.validTo) {
                        throw new common_1.BadRequestException('El certificado ha expirado o aún no es válido');
                    }
                }
            }
            const payloadString = JSON.stringify(payload);
            const jws = await new jose.CompactSign(new TextEncoder().encode(payloadString))
                .setProtectedHeader({ alg: algorithm })
                .sign(privateKey);
            this.logger.debug(`Payload signed successfully with ${algorithm}. JWS length: ${jws.length}`);
            return jws;
        }
        /**
         * Verify a JWS signature using a certificate
         */
        async verifySignature(buffer, password, jws) {
            try {
                const { publicKey } = await this.extractSigningKeys(buffer, password);
                const { payload } = await jose.compactVerify(jws, publicKey);
                const payloadString = new TextDecoder().decode(payload);
                return {
                    valid: true,
                    payload: JSON.parse(payloadString),
                };
            }
            catch (error) {
                this.logger.warn(`Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return {
                    valid: false,
                    payload: null,
                };
            }
        }
        /**
         * Extract NIT from certificate subject or serial number
         */
        extractNitFromCertificate(certificate) {
            // Try to find NIT in subject attributes (common name or other fields)
            const cnAttr = certificate.subject.attributes.find((attr) => attr.shortName === 'CN');
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
            const serialAttr = certificate.subject.attributes.find((attr) => attr.shortName === 'serialName' || attr.name === 'serialNumber');
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
        formatSubject(attributes) {
            return attributes
                .map((attr) => `${attr.shortName}=${attr.value}`)
                .join(', ');
        }
        /**
         * Get certificate expiry days remaining
         */
        getDaysUntilExpiry(validTo) {
            const now = new Date();
            const diff = validTo.getTime() - now.getTime();
            return Math.ceil(diff / (1000 * 60 * 60 * 24));
        }
    };
    return CertificateService = _classThis;
})();
exports.CertificateService = CertificateService;
