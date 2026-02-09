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
exports.ValidateConnectionResponseDto = exports.QuickSetupResponseDto = exports.ValidateConnectionDto = exports.QuickSetupDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
/**
 * DTO for quick setup of Hacienda credentials
 * Used by companies that already have their certificates and API credentials
 */
let QuickSetupDto = (() => {
    let _environment_decorators;
    let _environment_initializers = [];
    let _environment_extraInitializers = [];
    let _apiUser_decorators;
    let _apiUser_initializers = [];
    let _apiUser_extraInitializers = [];
    let _apiPassword_decorators;
    let _apiPassword_initializers = [];
    let _apiPassword_extraInitializers = [];
    let _certificatePassword_decorators;
    let _certificatePassword_initializers = [];
    let _certificatePassword_extraInitializers = [];
    return class QuickSetupDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _environment_decorators = [(0, swagger_1.ApiProperty)({
                    enum: ['TEST', 'PRODUCTION'],
                    description: 'Environment to configure',
                    example: 'TEST',
                }), (0, class_validator_1.IsEnum)(['TEST', 'PRODUCTION'], {
                    message: 'El ambiente debe ser TEST o PRODUCTION',
                })];
            _apiUser_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'API user for Hacienda authentication (usually NIT without dashes)',
                    example: '06140101001000',
                }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)({ message: 'El usuario de API es requerido' })];
            _apiPassword_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'API password for Hacienda authentication',
                    example: 'SecurePassword123!',
                    minLength: 8,
                    maxLength: 50,
                }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña de API es requerida' }), (0, class_validator_1.MinLength)(8, { message: 'La contraseña debe tener al menos 8 caracteres' }), (0, class_validator_1.MaxLength)(50, { message: 'La contraseña no puede exceder 50 caracteres' })];
            _certificatePassword_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Certificate password for the .p12/.pfx file',
                    example: 'CertPassword123',
                }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña del certificado es requerida' })];
            __esDecorate(null, null, _environment_decorators, { kind: "field", name: "environment", static: false, private: false, access: { has: obj => "environment" in obj, get: obj => obj.environment, set: (obj, value) => { obj.environment = value; } }, metadata: _metadata }, _environment_initializers, _environment_extraInitializers);
            __esDecorate(null, null, _apiUser_decorators, { kind: "field", name: "apiUser", static: false, private: false, access: { has: obj => "apiUser" in obj, get: obj => obj.apiUser, set: (obj, value) => { obj.apiUser = value; } }, metadata: _metadata }, _apiUser_initializers, _apiUser_extraInitializers);
            __esDecorate(null, null, _apiPassword_decorators, { kind: "field", name: "apiPassword", static: false, private: false, access: { has: obj => "apiPassword" in obj, get: obj => obj.apiPassword, set: (obj, value) => { obj.apiPassword = value; } }, metadata: _metadata }, _apiPassword_initializers, _apiPassword_extraInitializers);
            __esDecorate(null, null, _certificatePassword_decorators, { kind: "field", name: "certificatePassword", static: false, private: false, access: { has: obj => "certificatePassword" in obj, get: obj => obj.certificatePassword, set: (obj, value) => { obj.certificatePassword = value; } }, metadata: _metadata }, _certificatePassword_initializers, _certificatePassword_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        environment = __runInitializers(this, _environment_initializers, void 0);
        apiUser = (__runInitializers(this, _environment_extraInitializers), __runInitializers(this, _apiUser_initializers, void 0));
        apiPassword = (__runInitializers(this, _apiUser_extraInitializers), __runInitializers(this, _apiPassword_initializers, void 0));
        certificatePassword = (__runInitializers(this, _apiPassword_extraInitializers), __runInitializers(this, _certificatePassword_initializers, void 0));
        constructor() {
            __runInitializers(this, _certificatePassword_extraInitializers);
        }
    };
})();
exports.QuickSetupDto = QuickSetupDto;
/**
 * DTO for validating Hacienda API connection without saving
 */
let ValidateConnectionDto = (() => {
    let _environment_decorators;
    let _environment_initializers = [];
    let _environment_extraInitializers = [];
    let _apiUser_decorators;
    let _apiUser_initializers = [];
    let _apiUser_extraInitializers = [];
    let _apiPassword_decorators;
    let _apiPassword_initializers = [];
    let _apiPassword_extraInitializers = [];
    return class ValidateConnectionDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _environment_decorators = [(0, swagger_1.ApiProperty)({
                    enum: ['TEST', 'PRODUCTION'],
                    description: 'Environment to validate against',
                    example: 'TEST',
                }), (0, class_validator_1.IsEnum)(['TEST', 'PRODUCTION'], {
                    message: 'El ambiente debe ser TEST o PRODUCTION',
                })];
            _apiUser_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'API user for Hacienda authentication (usually NIT without dashes)',
                    example: '06140101001000',
                }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)({ message: 'El usuario de API es requerido' })];
            _apiPassword_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'API password for Hacienda authentication',
                    example: 'SecurePassword123!',
                    minLength: 8,
                    maxLength: 50,
                }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña de API es requerida' }), (0, class_validator_1.MinLength)(8, { message: 'La contraseña debe tener al menos 8 caracteres' }), (0, class_validator_1.MaxLength)(50, { message: 'La contraseña no puede exceder 50 caracteres' })];
            __esDecorate(null, null, _environment_decorators, { kind: "field", name: "environment", static: false, private: false, access: { has: obj => "environment" in obj, get: obj => obj.environment, set: (obj, value) => { obj.environment = value; } }, metadata: _metadata }, _environment_initializers, _environment_extraInitializers);
            __esDecorate(null, null, _apiUser_decorators, { kind: "field", name: "apiUser", static: false, private: false, access: { has: obj => "apiUser" in obj, get: obj => obj.apiUser, set: (obj, value) => { obj.apiUser = value; } }, metadata: _metadata }, _apiUser_initializers, _apiUser_extraInitializers);
            __esDecorate(null, null, _apiPassword_decorators, { kind: "field", name: "apiPassword", static: false, private: false, access: { has: obj => "apiPassword" in obj, get: obj => obj.apiPassword, set: (obj, value) => { obj.apiPassword = value; } }, metadata: _metadata }, _apiPassword_initializers, _apiPassword_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        environment = __runInitializers(this, _environment_initializers, void 0);
        apiUser = (__runInitializers(this, _environment_extraInitializers), __runInitializers(this, _apiUser_initializers, void 0));
        apiPassword = (__runInitializers(this, _apiUser_extraInitializers), __runInitializers(this, _apiPassword_initializers, void 0));
        constructor() {
            __runInitializers(this, _apiPassword_extraInitializers);
        }
    };
})();
exports.ValidateConnectionDto = ValidateConnectionDto;
/**
 * Response for quick setup endpoint
 */
let QuickSetupResponseDto = (() => {
    let _success_decorators;
    let _success_initializers = [];
    let _success_extraInitializers = [];
    let _message_decorators;
    let _message_initializers = [];
    let _message_extraInitializers = [];
    let _data_decorators;
    let _data_initializers = [];
    let _data_extraInitializers = [];
    let _errors_decorators;
    let _errors_initializers = [];
    let _errors_extraInitializers = [];
    return class QuickSetupResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _success_decorators = [(0, swagger_1.ApiProperty)()];
            _message_decorators = [(0, swagger_1.ApiProperty)()];
            _data_decorators = [(0, swagger_1.ApiPropertyOptional)()];
            _errors_decorators = [(0, swagger_1.ApiPropertyOptional)()];
            __esDecorate(null, null, _success_decorators, { kind: "field", name: "success", static: false, private: false, access: { has: obj => "success" in obj, get: obj => obj.success, set: (obj, value) => { obj.success = value; } }, metadata: _metadata }, _success_initializers, _success_extraInitializers);
            __esDecorate(null, null, _message_decorators, { kind: "field", name: "message", static: false, private: false, access: { has: obj => "message" in obj, get: obj => obj.message, set: (obj, value) => { obj.message = value; } }, metadata: _metadata }, _message_initializers, _message_extraInitializers);
            __esDecorate(null, null, _data_decorators, { kind: "field", name: "data", static: false, private: false, access: { has: obj => "data" in obj, get: obj => obj.data, set: (obj, value) => { obj.data = value; } }, metadata: _metadata }, _data_initializers, _data_extraInitializers);
            __esDecorate(null, null, _errors_decorators, { kind: "field", name: "errors", static: false, private: false, access: { has: obj => "errors" in obj, get: obj => obj.errors, set: (obj, value) => { obj.errors = value; } }, metadata: _metadata }, _errors_initializers, _errors_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        success = __runInitializers(this, _success_initializers, void 0);
        message = (__runInitializers(this, _success_extraInitializers), __runInitializers(this, _message_initializers, void 0));
        data = (__runInitializers(this, _message_extraInitializers), __runInitializers(this, _data_initializers, void 0));
        errors = (__runInitializers(this, _data_extraInitializers), __runInitializers(this, _errors_initializers, void 0));
        constructor() {
            __runInitializers(this, _errors_extraInitializers);
        }
    };
})();
exports.QuickSetupResponseDto = QuickSetupResponseDto;
/**
 * Response for validate connection endpoint
 */
let ValidateConnectionResponseDto = (() => {
    let _success_decorators;
    let _success_initializers = [];
    let _success_extraInitializers = [];
    let _tokenExpiry_decorators;
    let _tokenExpiry_initializers = [];
    let _tokenExpiry_extraInitializers = [];
    let _error_decorators;
    let _error_initializers = [];
    let _error_extraInitializers = [];
    return class ValidateConnectionResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _success_decorators = [(0, swagger_1.ApiProperty)()];
            _tokenExpiry_decorators = [(0, swagger_1.ApiPropertyOptional)()];
            _error_decorators = [(0, swagger_1.ApiPropertyOptional)()];
            __esDecorate(null, null, _success_decorators, { kind: "field", name: "success", static: false, private: false, access: { has: obj => "success" in obj, get: obj => obj.success, set: (obj, value) => { obj.success = value; } }, metadata: _metadata }, _success_initializers, _success_extraInitializers);
            __esDecorate(null, null, _tokenExpiry_decorators, { kind: "field", name: "tokenExpiry", static: false, private: false, access: { has: obj => "tokenExpiry" in obj, get: obj => obj.tokenExpiry, set: (obj, value) => { obj.tokenExpiry = value; } }, metadata: _metadata }, _tokenExpiry_initializers, _tokenExpiry_extraInitializers);
            __esDecorate(null, null, _error_decorators, { kind: "field", name: "error", static: false, private: false, access: { has: obj => "error" in obj, get: obj => obj.error, set: (obj, value) => { obj.error = value; } }, metadata: _metadata }, _error_initializers, _error_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        success = __runInitializers(this, _success_initializers, void 0);
        tokenExpiry = (__runInitializers(this, _success_extraInitializers), __runInitializers(this, _tokenExpiry_initializers, void 0));
        error = (__runInitializers(this, _tokenExpiry_extraInitializers), __runInitializers(this, _error_initializers, void 0));
        constructor() {
            __runInitializers(this, _error_extraInitializers);
        }
    };
})();
exports.ValidateConnectionResponseDto = ValidateConnectionResponseDto;
