"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetApiCredentialsDto = exports.UploadProdCertificateDto = exports.UploadTestCertificateDto = exports.CertificateUploadMode = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var CertificateUploadMode;
(function (CertificateUploadMode) {
    CertificateUploadMode["COMBINED"] = "combined";
    CertificateUploadMode["SEPARATE"] = "separate";
})(CertificateUploadMode || (exports.CertificateUploadMode = CertificateUploadMode = {}));
let UploadTestCertificateDto = (() => {
    let _certificate_decorators;
    let _certificate_initializers = [];
    let _certificate_extraInitializers = [];
    let _password_decorators;
    let _password_initializers = [];
    let _password_extraInitializers = [];
    let _expiryDate_decorators;
    let _expiryDate_initializers = [];
    let _expiryDate_extraInitializers = [];
    let _privateKey_decorators;
    let _privateKey_initializers = [];
    let _privateKey_extraInitializers = [];
    let _uploadMode_decorators;
    let _uploadMode_initializers = [];
    let _uploadMode_extraInitializers = [];
    return class UploadTestCertificateDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _certificate_decorators = [(0, swagger_1.ApiProperty)({ description: 'Certificado de pruebas en base64 (público para modo separado, combinado para .p12/.pfx)' }), (0, class_validator_1.IsString)()];
            _password_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Contraseña del certificado (.p12/.pfx) o llave privada encriptada' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _expiryDate_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Fecha de expiración del certificado' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)()];
            _privateKey_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Llave privada en base64 (solo para modo separado)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _uploadMode_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Modo de carga: combined (.p12/.pfx) o separate (.crt + .key)', enum: CertificateUploadMode }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(CertificateUploadMode)];
            __esDecorate(null, null, _certificate_decorators, { kind: "field", name: "certificate", static: false, private: false, access: { has: obj => "certificate" in obj, get: obj => obj.certificate, set: (obj, value) => { obj.certificate = value; } }, metadata: _metadata }, _certificate_initializers, _certificate_extraInitializers);
            __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: obj => "password" in obj, get: obj => obj.password, set: (obj, value) => { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
            __esDecorate(null, null, _expiryDate_decorators, { kind: "field", name: "expiryDate", static: false, private: false, access: { has: obj => "expiryDate" in obj, get: obj => obj.expiryDate, set: (obj, value) => { obj.expiryDate = value; } }, metadata: _metadata }, _expiryDate_initializers, _expiryDate_extraInitializers);
            __esDecorate(null, null, _privateKey_decorators, { kind: "field", name: "privateKey", static: false, private: false, access: { has: obj => "privateKey" in obj, get: obj => obj.privateKey, set: (obj, value) => { obj.privateKey = value; } }, metadata: _metadata }, _privateKey_initializers, _privateKey_extraInitializers);
            __esDecorate(null, null, _uploadMode_decorators, { kind: "field", name: "uploadMode", static: false, private: false, access: { has: obj => "uploadMode" in obj, get: obj => obj.uploadMode, set: (obj, value) => { obj.uploadMode = value; } }, metadata: _metadata }, _uploadMode_initializers, _uploadMode_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        certificate = __runInitializers(this, _certificate_initializers, void 0);
        password = (__runInitializers(this, _certificate_extraInitializers), __runInitializers(this, _password_initializers, void 0));
        expiryDate = (__runInitializers(this, _password_extraInitializers), __runInitializers(this, _expiryDate_initializers, void 0));
        privateKey = (__runInitializers(this, _expiryDate_extraInitializers), __runInitializers(this, _privateKey_initializers, void 0));
        uploadMode = (__runInitializers(this, _privateKey_extraInitializers), __runInitializers(this, _uploadMode_initializers, void 0));
        constructor() {
            __runInitializers(this, _uploadMode_extraInitializers);
        }
    };
})();
exports.UploadTestCertificateDto = UploadTestCertificateDto;
let UploadProdCertificateDto = (() => {
    let _certificate_decorators;
    let _certificate_initializers = [];
    let _certificate_extraInitializers = [];
    let _password_decorators;
    let _password_initializers = [];
    let _password_extraInitializers = [];
    let _expiryDate_decorators;
    let _expiryDate_initializers = [];
    let _expiryDate_extraInitializers = [];
    let _privateKey_decorators;
    let _privateKey_initializers = [];
    let _privateKey_extraInitializers = [];
    let _uploadMode_decorators;
    let _uploadMode_initializers = [];
    let _uploadMode_extraInitializers = [];
    return class UploadProdCertificateDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _certificate_decorators = [(0, swagger_1.ApiProperty)({ description: 'Certificado productivo en base64 (público para modo separado, combinado para .p12/.pfx)' }), (0, class_validator_1.IsString)()];
            _password_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Contraseña del certificado (.p12/.pfx) o llave privada encriptada' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _expiryDate_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Fecha de expiración del certificado' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)()];
            _privateKey_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Llave privada en base64 (solo para modo separado)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _uploadMode_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Modo de carga: combined (.p12/.pfx) o separate (.crt + .key)', enum: CertificateUploadMode }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(CertificateUploadMode)];
            __esDecorate(null, null, _certificate_decorators, { kind: "field", name: "certificate", static: false, private: false, access: { has: obj => "certificate" in obj, get: obj => obj.certificate, set: (obj, value) => { obj.certificate = value; } }, metadata: _metadata }, _certificate_initializers, _certificate_extraInitializers);
            __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: obj => "password" in obj, get: obj => obj.password, set: (obj, value) => { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
            __esDecorate(null, null, _expiryDate_decorators, { kind: "field", name: "expiryDate", static: false, private: false, access: { has: obj => "expiryDate" in obj, get: obj => obj.expiryDate, set: (obj, value) => { obj.expiryDate = value; } }, metadata: _metadata }, _expiryDate_initializers, _expiryDate_extraInitializers);
            __esDecorate(null, null, _privateKey_decorators, { kind: "field", name: "privateKey", static: false, private: false, access: { has: obj => "privateKey" in obj, get: obj => obj.privateKey, set: (obj, value) => { obj.privateKey = value; } }, metadata: _metadata }, _privateKey_initializers, _privateKey_extraInitializers);
            __esDecorate(null, null, _uploadMode_decorators, { kind: "field", name: "uploadMode", static: false, private: false, access: { has: obj => "uploadMode" in obj, get: obj => obj.uploadMode, set: (obj, value) => { obj.uploadMode = value; } }, metadata: _metadata }, _uploadMode_initializers, _uploadMode_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        certificate = __runInitializers(this, _certificate_initializers, void 0);
        password = (__runInitializers(this, _certificate_extraInitializers), __runInitializers(this, _password_initializers, void 0));
        expiryDate = (__runInitializers(this, _password_extraInitializers), __runInitializers(this, _expiryDate_initializers, void 0));
        privateKey = (__runInitializers(this, _expiryDate_extraInitializers), __runInitializers(this, _privateKey_initializers, void 0));
        uploadMode = (__runInitializers(this, _privateKey_extraInitializers), __runInitializers(this, _uploadMode_initializers, void 0));
        constructor() {
            __runInitializers(this, _uploadMode_extraInitializers);
        }
    };
})();
exports.UploadProdCertificateDto = UploadProdCertificateDto;
let SetApiCredentialsDto = (() => {
    let _apiPassword_decorators;
    let _apiPassword_initializers = [];
    let _apiPassword_extraInitializers = [];
    let _environmentUrl_decorators;
    let _environmentUrl_initializers = [];
    let _environmentUrl_extraInitializers = [];
    return class SetApiCredentialsDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _apiPassword_decorators = [(0, swagger_1.ApiProperty)({ description: 'Contraseña API proporcionada por Hacienda' }), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(8, { message: 'La contraseña API debe tener al menos 8 caracteres' })];
            _environmentUrl_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'URL del ambiente (se configura automáticamente si no se provee)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _apiPassword_decorators, { kind: "field", name: "apiPassword", static: false, private: false, access: { has: obj => "apiPassword" in obj, get: obj => obj.apiPassword, set: (obj, value) => { obj.apiPassword = value; } }, metadata: _metadata }, _apiPassword_initializers, _apiPassword_extraInitializers);
            __esDecorate(null, null, _environmentUrl_decorators, { kind: "field", name: "environmentUrl", static: false, private: false, access: { has: obj => "environmentUrl" in obj, get: obj => obj.environmentUrl, set: (obj, value) => { obj.environmentUrl = value; } }, metadata: _metadata }, _environmentUrl_initializers, _environmentUrl_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        apiPassword = __runInitializers(this, _apiPassword_initializers, void 0);
        environmentUrl = (__runInitializers(this, _apiPassword_extraInitializers), __runInitializers(this, _environmentUrl_initializers, void 0));
        constructor() {
            __runInitializers(this, _environmentUrl_extraInitializers);
        }
    };
})();
exports.SetApiCredentialsDto = SetApiCredentialsDto;
