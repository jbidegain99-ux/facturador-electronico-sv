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
exports.SignerService = void 0;
const common_1 = require("@nestjs/common");
const forge = __importStar(require("node-forge"));
const jose = __importStar(require("jose"));
const fs_1 = require("fs");
let SignerService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SignerService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SignerService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        logger = new common_1.Logger(SignerService.name);
        privateKey = null;
        certificate = null;
        josePrivateKey = null;
        josePublicKey = null;
        async onModuleInit() {
            const certPath = process.env.CERT_PATH;
            const certPassword = process.env.CERT_PASSWORD;
            if (certPath && certPassword) {
                try {
                    await this.loadCertificate(certPath, certPassword);
                    this.logger.log('Certificate loaded successfully on startup');
                }
                catch (error) {
                    this.logger.warn(`Could not load certificate on startup: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        }
        async loadCertificate(p12Path, password) {
            try {
                const p12Buffer = (0, fs_1.readFileSync)(p12Path);
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
                this.privateKey = keyBag[0].key;
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
            }
            catch (error) {
                this.privateKey = null;
                this.certificate = null;
                this.josePrivateKey = null;
                this.josePublicKey = null;
                throw new Error(`Failed to load certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        async loadCertificateFromBuffer(p12Buffer, password) {
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
                this.privateKey = keyBag[0].key;
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
            }
            catch (error) {
                throw new Error(`Failed to load certificate from buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        getCertificateInfo() {
            if (!this.certificate) {
                throw new Error('No certificate loaded');
            }
            const getAttributeValue = (attrs, shortName) => {
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
        isCertificateLoaded() {
            return this.josePrivateKey !== null && this.josePublicKey !== null;
        }
        isCertificateValid() {
            if (!this.certificate) {
                return false;
            }
            const now = new Date();
            return now >= this.certificate.validity.notBefore && now <= this.certificate.validity.notAfter;
        }
        async signDTE(dteJson) {
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
            }
            catch (error) {
                throw new Error(`Failed to sign DTE: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        async signDTEWithInfo(dteJson) {
            const jws = await this.signDTE(dteJson);
            return {
                jws,
                certificateInfo: this.getCertificateInfo(),
            };
        }
        async verifySignature(jws) {
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
            }
            catch (error) {
                this.logger.warn(`Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return {
                    valid: false,
                    payload: null,
                };
            }
        }
        async verifySignatureWithPublicKey(jws, publicKeyPem) {
            try {
                const publicKey = await jose.importSPKI(publicKeyPem, 'RS256');
                const { payload } = await jose.compactVerify(jws, publicKey);
                const payloadString = new TextDecoder().decode(payload);
                return {
                    valid: true,
                    payload: JSON.parse(payloadString),
                };
            }
            catch (error) {
                return {
                    valid: false,
                    payload: null,
                };
            }
        }
        decodeJWSPayload(jws) {
            try {
                const parts = jws.split('.');
                if (parts.length !== 3) {
                    throw new Error('Invalid JWS format');
                }
                const payloadBase64 = parts[1];
                const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
                return JSON.parse(payloadJson);
            }
            catch (error) {
                throw new Error(`Failed to decode JWS payload: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        decodeJWSHeader(jws) {
            try {
                const parts = jws.split('.');
                if (parts.length !== 3) {
                    throw new Error('Invalid JWS format');
                }
                const headerBase64 = parts[0];
                const headerJson = Buffer.from(headerBase64, 'base64url').toString('utf-8');
                return JSON.parse(headerJson);
            }
            catch (error) {
                throw new Error(`Failed to decode JWS header: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };
    return SignerService = _classThis;
})();
exports.SignerService = SignerService;
