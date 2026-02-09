"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignerController = exports.LoadCertificateDto = exports.VerifySignatureDto = exports.SignTestDto = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
class SignTestDto {
    payload;
}
exports.SignTestDto = SignTestDto;
class VerifySignatureDto {
    jws;
}
exports.VerifySignatureDto = VerifySignatureDto;
class LoadCertificateDto {
    password;
}
exports.LoadCertificateDto = LoadCertificateDto;
let SignerController = (() => {
    let _classDecorators = [(0, common_1.Controller)('signer')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getStatus_decorators;
    let _loadCertificate_decorators;
    let _signTest_decorators;
    let _verifySignature_decorators;
    let _decodeJWS_decorators;
    var SignerController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getStatus_decorators = [(0, common_1.Get)('status')];
            _loadCertificate_decorators = [(0, common_1.Post)('load'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('certificate'))];
            _signTest_decorators = [(0, common_1.Post)('test')];
            _verifySignature_decorators = [(0, common_1.Post)('verify')];
            _decodeJWS_decorators = [(0, common_1.Post)('decode')];
            __esDecorate(this, null, _getStatus_decorators, { kind: "method", name: "getStatus", static: false, private: false, access: { has: obj => "getStatus" in obj, get: obj => obj.getStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _loadCertificate_decorators, { kind: "method", name: "loadCertificate", static: false, private: false, access: { has: obj => "loadCertificate" in obj, get: obj => obj.loadCertificate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _signTest_decorators, { kind: "method", name: "signTest", static: false, private: false, access: { has: obj => "signTest" in obj, get: obj => obj.signTest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _verifySignature_decorators, { kind: "method", name: "verifySignature", static: false, private: false, access: { has: obj => "verifySignature" in obj, get: obj => obj.verifySignature }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _decodeJWS_decorators, { kind: "method", name: "decodeJWS", static: false, private: false, access: { has: obj => "decodeJWS" in obj, get: obj => obj.decodeJWS }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SignerController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        signerService = __runInitializers(this, _instanceExtraInitializers);
        constructor(signerService) {
            this.signerService = signerService;
        }
        getStatus() {
            const isLoaded = this.signerService.isCertificateLoaded();
            if (!isLoaded) {
                return {
                    loaded: false,
                    valid: false,
                    certificate: null,
                };
            }
            try {
                const certInfo = this.signerService.getCertificateInfo();
                const isValid = this.signerService.isCertificateValid();
                return {
                    loaded: true,
                    valid: isValid,
                    certificate: {
                        subject: certInfo.subject,
                        issuer: certInfo.issuer,
                        validFrom: certInfo.validFrom.toISOString(),
                        validTo: certInfo.validTo.toISOString(),
                        serialNumber: certInfo.serialNumber,
                    },
                };
            }
            catch (error) {
                return {
                    loaded: false,
                    valid: false,
                    certificate: null,
                };
            }
        }
        async loadCertificate(file, dto) {
            if (!file) {
                throw new common_1.HttpException('Certificate file is required', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!dto.password) {
                throw new common_1.HttpException('Password is required', common_1.HttpStatus.BAD_REQUEST);
            }
            try {
                const certInfo = await this.signerService.loadCertificateFromBuffer(file.buffer, dto.password);
                return {
                    success: true,
                    message: 'Certificate loaded successfully',
                    certificate: {
                        subject: certInfo.subject,
                        issuer: certInfo.issuer,
                        validFrom: certInfo.validFrom.toISOString(),
                        validTo: certInfo.validTo.toISOString(),
                        serialNumber: certInfo.serialNumber,
                    },
                };
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to load certificate',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
        }
        async signTest(dto) {
            if (!dto.payload || typeof dto.payload !== 'object') {
                throw new common_1.HttpException('Payload must be a valid JSON object', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!this.signerService.isCertificateLoaded()) {
                throw new common_1.HttpException('No certificate loaded. Upload a certificate first using POST /signer/load', common_1.HttpStatus.PRECONDITION_FAILED);
            }
            try {
                const result = await this.signerService.signDTEWithInfo(dto.payload);
                return {
                    success: true,
                    jws: result.jws,
                    jwsParts: {
                        header: this.signerService.decodeJWSHeader(result.jws),
                        payloadPreview: JSON.stringify(dto.payload).substring(0, 200) + '...',
                    },
                    certificate: {
                        subject: result.certificateInfo.subject,
                        validTo: result.certificateInfo.validTo.toISOString(),
                    },
                };
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to sign payload',
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async verifySignature(dto) {
            if (!dto.jws || typeof dto.jws !== 'string') {
                throw new common_1.HttpException('JWS string is required', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!this.signerService.isCertificateLoaded()) {
                throw new common_1.HttpException('No certificate loaded. Upload a certificate first using POST /signer/load', common_1.HttpStatus.PRECONDITION_FAILED);
            }
            try {
                const result = await this.signerService.verifySignature(dto.jws);
                return {
                    success: true,
                    valid: result.valid,
                    payload: result.payload,
                };
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to verify signature',
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        decodeJWS(dto) {
            if (!dto.jws || typeof dto.jws !== 'string') {
                throw new common_1.HttpException('JWS string is required', common_1.HttpStatus.BAD_REQUEST);
            }
            try {
                const header = this.signerService.decodeJWSHeader(dto.jws);
                const payload = this.signerService.decodeJWSPayload(dto.jws);
                return {
                    success: true,
                    header,
                    payload,
                };
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to decode JWS',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
        }
    };
    return SignerController = _classThis;
})();
exports.SignerController = SignerController;
