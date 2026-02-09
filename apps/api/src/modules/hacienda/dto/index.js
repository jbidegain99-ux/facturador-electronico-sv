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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestProgressResponseDto = exports.TestProgressByDteDto = exports.HaciendaConfigResponseDto = exports.EnvironmentConfigResponseDto = exports.CertificateInfoDto = exports.GenerateTestDataDto = exports.GetTestHistoryQueryDto = exports.ExecuteTestDto = exports.RenewTokenDto = exports.TestConnectionDto = exports.SwitchEnvironmentDto = exports.ConfigureEnvironmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
// Re-export quick setup DTOs
__exportStar(require("./quick-setup.dto"), exports);
let ConfigureEnvironmentDto = (() => {
    let _apiUser_decorators;
    let _apiUser_initializers = [];
    let _apiUser_extraInitializers = [];
    let _apiPassword_decorators;
    let _apiPassword_initializers = [];
    let _apiPassword_extraInitializers = [];
    let _certificatePassword_decorators;
    let _certificatePassword_initializers = [];
    let _certificatePassword_extraInitializers = [];
    return class ConfigureEnvironmentDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
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
            __esDecorate(null, null, _apiUser_decorators, { kind: "field", name: "apiUser", static: false, private: false, access: { has: obj => "apiUser" in obj, get: obj => obj.apiUser, set: (obj, value) => { obj.apiUser = value; } }, metadata: _metadata }, _apiUser_initializers, _apiUser_extraInitializers);
            __esDecorate(null, null, _apiPassword_decorators, { kind: "field", name: "apiPassword", static: false, private: false, access: { has: obj => "apiPassword" in obj, get: obj => obj.apiPassword, set: (obj, value) => { obj.apiPassword = value; } }, metadata: _metadata }, _apiPassword_initializers, _apiPassword_extraInitializers);
            __esDecorate(null, null, _certificatePassword_decorators, { kind: "field", name: "certificatePassword", static: false, private: false, access: { has: obj => "certificatePassword" in obj, get: obj => obj.certificatePassword, set: (obj, value) => { obj.certificatePassword = value; } }, metadata: _metadata }, _certificatePassword_initializers, _certificatePassword_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        apiUser = __runInitializers(this, _apiUser_initializers, void 0);
        apiPassword = (__runInitializers(this, _apiUser_extraInitializers), __runInitializers(this, _apiPassword_initializers, void 0));
        certificatePassword = (__runInitializers(this, _apiPassword_extraInitializers), __runInitializers(this, _certificatePassword_initializers, void 0));
        constructor() {
            __runInitializers(this, _certificatePassword_extraInitializers);
        }
    };
})();
exports.ConfigureEnvironmentDto = ConfigureEnvironmentDto;
let SwitchEnvironmentDto = (() => {
    let _environment_decorators;
    let _environment_initializers = [];
    let _environment_extraInitializers = [];
    return class SwitchEnvironmentDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _environment_decorators = [(0, swagger_1.ApiProperty)({
                    enum: ['TEST', 'PRODUCTION'],
                    description: 'Environment to switch to',
                    example: 'PRODUCTION',
                }), (0, class_validator_1.IsEnum)(['TEST', 'PRODUCTION'], {
                    message: 'El ambiente debe ser TEST o PRODUCTION',
                })];
            __esDecorate(null, null, _environment_decorators, { kind: "field", name: "environment", static: false, private: false, access: { has: obj => "environment" in obj, get: obj => obj.environment, set: (obj, value) => { obj.environment = value; } }, metadata: _metadata }, _environment_initializers, _environment_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        environment = __runInitializers(this, _environment_initializers, void 0);
        constructor() {
            __runInitializers(this, _environment_extraInitializers);
        }
    };
})();
exports.SwitchEnvironmentDto = SwitchEnvironmentDto;
let TestConnectionDto = (() => {
    let _environment_decorators;
    let _environment_initializers = [];
    let _environment_extraInitializers = [];
    return class TestConnectionDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _environment_decorators = [(0, swagger_1.ApiProperty)({
                    enum: ['TEST', 'PRODUCTION'],
                    description: 'Environment to test connection',
                    example: 'TEST',
                }), (0, class_validator_1.IsEnum)(['TEST', 'PRODUCTION'], {
                    message: 'El ambiente debe ser TEST o PRODUCTION',
                })];
            __esDecorate(null, null, _environment_decorators, { kind: "field", name: "environment", static: false, private: false, access: { has: obj => "environment" in obj, get: obj => obj.environment, set: (obj, value) => { obj.environment = value; } }, metadata: _metadata }, _environment_initializers, _environment_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        environment = __runInitializers(this, _environment_initializers, void 0);
        constructor() {
            __runInitializers(this, _environment_extraInitializers);
        }
    };
})();
exports.TestConnectionDto = TestConnectionDto;
let RenewTokenDto = (() => {
    let _environment_decorators;
    let _environment_initializers = [];
    let _environment_extraInitializers = [];
    return class RenewTokenDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _environment_decorators = [(0, swagger_1.ApiProperty)({
                    enum: ['TEST', 'PRODUCTION'],
                    description: 'Environment to renew token',
                    example: 'TEST',
                }), (0, class_validator_1.IsEnum)(['TEST', 'PRODUCTION'], {
                    message: 'El ambiente debe ser TEST o PRODUCTION',
                })];
            __esDecorate(null, null, _environment_decorators, { kind: "field", name: "environment", static: false, private: false, access: { has: obj => "environment" in obj, get: obj => obj.environment, set: (obj, value) => { obj.environment = value; } }, metadata: _metadata }, _environment_initializers, _environment_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        environment = __runInitializers(this, _environment_initializers, void 0);
        constructor() {
            __runInitializers(this, _environment_extraInitializers);
        }
    };
})();
exports.RenewTokenDto = RenewTokenDto;
let ExecuteTestDto = (() => {
    let _dteType_decorators;
    let _dteType_initializers = [];
    let _dteType_extraInitializers = [];
    let _testType_decorators;
    let _testType_initializers = [];
    let _testType_extraInitializers = [];
    let _testData_decorators;
    let _testData_initializers = [];
    let _testData_extraInitializers = [];
    let _codigoGeneracionToCancel_decorators;
    let _codigoGeneracionToCancel_initializers = [];
    let _codigoGeneracionToCancel_extraInitializers = [];
    return class ExecuteTestDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _dteType_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'DTE type code',
                    enum: ['01', '03', '04', '05', '06', '11', '14'],
                    example: '01',
                }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsEnum)(['01', '03', '04', '05', '06', '11', '14'], {
                    message: 'Tipo de DTE inválido',
                })];
            _testType_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Test type',
                    enum: ['EMISSION', 'CANCELLATION', 'CONTINGENCY'],
                    example: 'EMISSION',
                }), (0, class_validator_1.IsEnum)(['EMISSION', 'CANCELLATION', 'CONTINGENCY'], {
                    message: 'Tipo de prueba inválido',
                })];
            _testData_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Optional custom test data',
                    type: 'object',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsObject)()];
            _codigoGeneracionToCancel_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'For cancellation: codigo generacion of DTE to cancel',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _dteType_decorators, { kind: "field", name: "dteType", static: false, private: false, access: { has: obj => "dteType" in obj, get: obj => obj.dteType, set: (obj, value) => { obj.dteType = value; } }, metadata: _metadata }, _dteType_initializers, _dteType_extraInitializers);
            __esDecorate(null, null, _testType_decorators, { kind: "field", name: "testType", static: false, private: false, access: { has: obj => "testType" in obj, get: obj => obj.testType, set: (obj, value) => { obj.testType = value; } }, metadata: _metadata }, _testType_initializers, _testType_extraInitializers);
            __esDecorate(null, null, _testData_decorators, { kind: "field", name: "testData", static: false, private: false, access: { has: obj => "testData" in obj, get: obj => obj.testData, set: (obj, value) => { obj.testData = value; } }, metadata: _metadata }, _testData_initializers, _testData_extraInitializers);
            __esDecorate(null, null, _codigoGeneracionToCancel_decorators, { kind: "field", name: "codigoGeneracionToCancel", static: false, private: false, access: { has: obj => "codigoGeneracionToCancel" in obj, get: obj => obj.codigoGeneracionToCancel, set: (obj, value) => { obj.codigoGeneracionToCancel = value; } }, metadata: _metadata }, _codigoGeneracionToCancel_initializers, _codigoGeneracionToCancel_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        dteType = __runInitializers(this, _dteType_initializers, void 0);
        testType = (__runInitializers(this, _dteType_extraInitializers), __runInitializers(this, _testType_initializers, void 0));
        testData = (__runInitializers(this, _testType_extraInitializers), __runInitializers(this, _testData_initializers, void 0));
        codigoGeneracionToCancel = (__runInitializers(this, _testData_extraInitializers), __runInitializers(this, _codigoGeneracionToCancel_initializers, void 0));
        constructor() {
            __runInitializers(this, _codigoGeneracionToCancel_extraInitializers);
        }
    };
})();
exports.ExecuteTestDto = ExecuteTestDto;
let GetTestHistoryQueryDto = (() => {
    let _dteType_decorators;
    let _dteType_initializers = [];
    let _dteType_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _limit_decorators;
    let _limit_initializers = [];
    let _limit_extraInitializers = [];
    let _offset_decorators;
    let _offset_initializers = [];
    let _offset_extraInitializers = [];
    return class GetTestHistoryQueryDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _dteType_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Filter by DTE type',
                    enum: ['01', '03', '04', '05', '06', '11', '14'],
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _status_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Filter by test status',
                    enum: ['PENDING', 'SUCCESS', 'FAILED'],
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _limit_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Number of records to return',
                    default: 50,
                }), (0, class_validator_1.IsOptional)()];
            _offset_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Number of records to skip',
                    default: 0,
                }), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _dteType_decorators, { kind: "field", name: "dteType", static: false, private: false, access: { has: obj => "dteType" in obj, get: obj => obj.dteType, set: (obj, value) => { obj.dteType = value; } }, metadata: _metadata }, _dteType_initializers, _dteType_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _limit_decorators, { kind: "field", name: "limit", static: false, private: false, access: { has: obj => "limit" in obj, get: obj => obj.limit, set: (obj, value) => { obj.limit = value; } }, metadata: _metadata }, _limit_initializers, _limit_extraInitializers);
            __esDecorate(null, null, _offset_decorators, { kind: "field", name: "offset", static: false, private: false, access: { has: obj => "offset" in obj, get: obj => obj.offset, set: (obj, value) => { obj.offset = value; } }, metadata: _metadata }, _offset_initializers, _offset_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        dteType = __runInitializers(this, _dteType_initializers, void 0);
        status = (__runInitializers(this, _dteType_extraInitializers), __runInitializers(this, _status_initializers, void 0));
        limit = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _limit_initializers, void 0));
        offset = (__runInitializers(this, _limit_extraInitializers), __runInitializers(this, _offset_initializers, void 0));
        constructor() {
            __runInitializers(this, _offset_extraInitializers);
        }
    };
})();
exports.GetTestHistoryQueryDto = GetTestHistoryQueryDto;
let GenerateTestDataDto = (() => {
    let _dteType_decorators;
    let _dteType_initializers = [];
    let _dteType_extraInitializers = [];
    return class GenerateTestDataDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _dteType_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'DTE type code',
                    enum: ['01', '03', '04', '05', '06', '11', '14'],
                    example: '01',
                }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsEnum)(['01', '03', '04', '05', '06', '11', '14'], {
                    message: 'Tipo de DTE inválido',
                })];
            __esDecorate(null, null, _dteType_decorators, { kind: "field", name: "dteType", static: false, private: false, access: { has: obj => "dteType" in obj, get: obj => obj.dteType, set: (obj, value) => { obj.dteType = value; } }, metadata: _metadata }, _dteType_initializers, _dteType_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        dteType = __runInitializers(this, _dteType_initializers, void 0);
        constructor() {
            __runInitializers(this, _dteType_extraInitializers);
        }
    };
})();
exports.GenerateTestDataDto = GenerateTestDataDto;
// Response DTOs for documentation
let CertificateInfoDto = (() => {
    let _fileName_decorators;
    let _fileName_initializers = [];
    let _fileName_extraInitializers = [];
    let _validUntil_decorators;
    let _validUntil_initializers = [];
    let _validUntil_extraInitializers = [];
    let _nit_decorators;
    let _nit_initializers = [];
    let _nit_extraInitializers = [];
    let _subject_decorators;
    let _subject_initializers = [];
    let _subject_extraInitializers = [];
    return class CertificateInfoDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _fileName_decorators = [(0, swagger_1.ApiProperty)()];
            _validUntil_decorators = [(0, swagger_1.ApiProperty)()];
            _nit_decorators = [(0, swagger_1.ApiProperty)({ nullable: true })];
            _subject_decorators = [(0, swagger_1.ApiProperty)()];
            __esDecorate(null, null, _fileName_decorators, { kind: "field", name: "fileName", static: false, private: false, access: { has: obj => "fileName" in obj, get: obj => obj.fileName, set: (obj, value) => { obj.fileName = value; } }, metadata: _metadata }, _fileName_initializers, _fileName_extraInitializers);
            __esDecorate(null, null, _validUntil_decorators, { kind: "field", name: "validUntil", static: false, private: false, access: { has: obj => "validUntil" in obj, get: obj => obj.validUntil, set: (obj, value) => { obj.validUntil = value; } }, metadata: _metadata }, _validUntil_initializers, _validUntil_extraInitializers);
            __esDecorate(null, null, _nit_decorators, { kind: "field", name: "nit", static: false, private: false, access: { has: obj => "nit" in obj, get: obj => obj.nit, set: (obj, value) => { obj.nit = value; } }, metadata: _metadata }, _nit_initializers, _nit_extraInitializers);
            __esDecorate(null, null, _subject_decorators, { kind: "field", name: "subject", static: false, private: false, access: { has: obj => "subject" in obj, get: obj => obj.subject, set: (obj, value) => { obj.subject = value; } }, metadata: _metadata }, _subject_initializers, _subject_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        fileName = __runInitializers(this, _fileName_initializers, void 0);
        validUntil = (__runInitializers(this, _fileName_extraInitializers), __runInitializers(this, _validUntil_initializers, void 0));
        nit = (__runInitializers(this, _validUntil_extraInitializers), __runInitializers(this, _nit_initializers, void 0));
        subject = (__runInitializers(this, _nit_extraInitializers), __runInitializers(this, _subject_initializers, void 0));
        constructor() {
            __runInitializers(this, _subject_extraInitializers);
        }
    };
})();
exports.CertificateInfoDto = CertificateInfoDto;
let EnvironmentConfigResponseDto = (() => {
    let _environment_decorators;
    let _environment_initializers = [];
    let _environment_extraInitializers = [];
    let _isConfigured_decorators;
    let _isConfigured_initializers = [];
    let _isConfigured_extraInitializers = [];
    let _isValidated_decorators;
    let _isValidated_initializers = [];
    let _isValidated_extraInitializers = [];
    let _tokenExpiry_decorators;
    let _tokenExpiry_initializers = [];
    let _tokenExpiry_extraInitializers = [];
    let _certificateInfo_decorators;
    let _certificateInfo_initializers = [];
    let _certificateInfo_extraInitializers = [];
    let _lastValidationAt_decorators;
    let _lastValidationAt_initializers = [];
    let _lastValidationAt_extraInitializers = [];
    let _lastValidationError_decorators;
    let _lastValidationError_initializers = [];
    let _lastValidationError_extraInitializers = [];
    return class EnvironmentConfigResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _environment_decorators = [(0, swagger_1.ApiProperty)({ enum: ['TEST', 'PRODUCTION'] })];
            _isConfigured_decorators = [(0, swagger_1.ApiProperty)()];
            _isValidated_decorators = [(0, swagger_1.ApiProperty)()];
            _tokenExpiry_decorators = [(0, swagger_1.ApiPropertyOptional)()];
            _certificateInfo_decorators = [(0, swagger_1.ApiPropertyOptional)({ type: CertificateInfoDto })];
            _lastValidationAt_decorators = [(0, swagger_1.ApiPropertyOptional)()];
            _lastValidationError_decorators = [(0, swagger_1.ApiPropertyOptional)()];
            __esDecorate(null, null, _environment_decorators, { kind: "field", name: "environment", static: false, private: false, access: { has: obj => "environment" in obj, get: obj => obj.environment, set: (obj, value) => { obj.environment = value; } }, metadata: _metadata }, _environment_initializers, _environment_extraInitializers);
            __esDecorate(null, null, _isConfigured_decorators, { kind: "field", name: "isConfigured", static: false, private: false, access: { has: obj => "isConfigured" in obj, get: obj => obj.isConfigured, set: (obj, value) => { obj.isConfigured = value; } }, metadata: _metadata }, _isConfigured_initializers, _isConfigured_extraInitializers);
            __esDecorate(null, null, _isValidated_decorators, { kind: "field", name: "isValidated", static: false, private: false, access: { has: obj => "isValidated" in obj, get: obj => obj.isValidated, set: (obj, value) => { obj.isValidated = value; } }, metadata: _metadata }, _isValidated_initializers, _isValidated_extraInitializers);
            __esDecorate(null, null, _tokenExpiry_decorators, { kind: "field", name: "tokenExpiry", static: false, private: false, access: { has: obj => "tokenExpiry" in obj, get: obj => obj.tokenExpiry, set: (obj, value) => { obj.tokenExpiry = value; } }, metadata: _metadata }, _tokenExpiry_initializers, _tokenExpiry_extraInitializers);
            __esDecorate(null, null, _certificateInfo_decorators, { kind: "field", name: "certificateInfo", static: false, private: false, access: { has: obj => "certificateInfo" in obj, get: obj => obj.certificateInfo, set: (obj, value) => { obj.certificateInfo = value; } }, metadata: _metadata }, _certificateInfo_initializers, _certificateInfo_extraInitializers);
            __esDecorate(null, null, _lastValidationAt_decorators, { kind: "field", name: "lastValidationAt", static: false, private: false, access: { has: obj => "lastValidationAt" in obj, get: obj => obj.lastValidationAt, set: (obj, value) => { obj.lastValidationAt = value; } }, metadata: _metadata }, _lastValidationAt_initializers, _lastValidationAt_extraInitializers);
            __esDecorate(null, null, _lastValidationError_decorators, { kind: "field", name: "lastValidationError", static: false, private: false, access: { has: obj => "lastValidationError" in obj, get: obj => obj.lastValidationError, set: (obj, value) => { obj.lastValidationError = value; } }, metadata: _metadata }, _lastValidationError_initializers, _lastValidationError_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        environment = __runInitializers(this, _environment_initializers, void 0);
        isConfigured = (__runInitializers(this, _environment_extraInitializers), __runInitializers(this, _isConfigured_initializers, void 0));
        isValidated = (__runInitializers(this, _isConfigured_extraInitializers), __runInitializers(this, _isValidated_initializers, void 0));
        tokenExpiry = (__runInitializers(this, _isValidated_extraInitializers), __runInitializers(this, _tokenExpiry_initializers, void 0));
        certificateInfo = (__runInitializers(this, _tokenExpiry_extraInitializers), __runInitializers(this, _certificateInfo_initializers, void 0));
        lastValidationAt = (__runInitializers(this, _certificateInfo_extraInitializers), __runInitializers(this, _lastValidationAt_initializers, void 0));
        lastValidationError = (__runInitializers(this, _lastValidationAt_extraInitializers), __runInitializers(this, _lastValidationError_initializers, void 0));
        constructor() {
            __runInitializers(this, _lastValidationError_extraInitializers);
        }
    };
})();
exports.EnvironmentConfigResponseDto = EnvironmentConfigResponseDto;
let HaciendaConfigResponseDto = (() => {
    let _activeEnvironment_decorators;
    let _activeEnvironment_initializers = [];
    let _activeEnvironment_extraInitializers = [];
    let _testingStatus_decorators;
    let _testingStatus_initializers = [];
    let _testingStatus_extraInitializers = [];
    let _testingStartedAt_decorators;
    let _testingStartedAt_initializers = [];
    let _testingStartedAt_extraInitializers = [];
    let _testingCompletedAt_decorators;
    let _testingCompletedAt_initializers = [];
    let _testingCompletedAt_extraInitializers = [];
    let _productionAuthorizedAt_decorators;
    let _productionAuthorizedAt_initializers = [];
    let _productionAuthorizedAt_extraInitializers = [];
    let _testConfig_decorators;
    let _testConfig_initializers = [];
    let _testConfig_extraInitializers = [];
    let _prodConfig_decorators;
    let _prodConfig_initializers = [];
    let _prodConfig_extraInitializers = [];
    return class HaciendaConfigResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _activeEnvironment_decorators = [(0, swagger_1.ApiProperty)({ enum: ['TEST', 'PRODUCTION'] })];
            _testingStatus_decorators = [(0, swagger_1.ApiProperty)({ enum: ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_AUTHORIZATION', 'AUTHORIZED'] })];
            _testingStartedAt_decorators = [(0, swagger_1.ApiPropertyOptional)()];
            _testingCompletedAt_decorators = [(0, swagger_1.ApiPropertyOptional)()];
            _productionAuthorizedAt_decorators = [(0, swagger_1.ApiPropertyOptional)()];
            _testConfig_decorators = [(0, swagger_1.ApiPropertyOptional)({ type: EnvironmentConfigResponseDto })];
            _prodConfig_decorators = [(0, swagger_1.ApiPropertyOptional)({ type: EnvironmentConfigResponseDto })];
            __esDecorate(null, null, _activeEnvironment_decorators, { kind: "field", name: "activeEnvironment", static: false, private: false, access: { has: obj => "activeEnvironment" in obj, get: obj => obj.activeEnvironment, set: (obj, value) => { obj.activeEnvironment = value; } }, metadata: _metadata }, _activeEnvironment_initializers, _activeEnvironment_extraInitializers);
            __esDecorate(null, null, _testingStatus_decorators, { kind: "field", name: "testingStatus", static: false, private: false, access: { has: obj => "testingStatus" in obj, get: obj => obj.testingStatus, set: (obj, value) => { obj.testingStatus = value; } }, metadata: _metadata }, _testingStatus_initializers, _testingStatus_extraInitializers);
            __esDecorate(null, null, _testingStartedAt_decorators, { kind: "field", name: "testingStartedAt", static: false, private: false, access: { has: obj => "testingStartedAt" in obj, get: obj => obj.testingStartedAt, set: (obj, value) => { obj.testingStartedAt = value; } }, metadata: _metadata }, _testingStartedAt_initializers, _testingStartedAt_extraInitializers);
            __esDecorate(null, null, _testingCompletedAt_decorators, { kind: "field", name: "testingCompletedAt", static: false, private: false, access: { has: obj => "testingCompletedAt" in obj, get: obj => obj.testingCompletedAt, set: (obj, value) => { obj.testingCompletedAt = value; } }, metadata: _metadata }, _testingCompletedAt_initializers, _testingCompletedAt_extraInitializers);
            __esDecorate(null, null, _productionAuthorizedAt_decorators, { kind: "field", name: "productionAuthorizedAt", static: false, private: false, access: { has: obj => "productionAuthorizedAt" in obj, get: obj => obj.productionAuthorizedAt, set: (obj, value) => { obj.productionAuthorizedAt = value; } }, metadata: _metadata }, _productionAuthorizedAt_initializers, _productionAuthorizedAt_extraInitializers);
            __esDecorate(null, null, _testConfig_decorators, { kind: "field", name: "testConfig", static: false, private: false, access: { has: obj => "testConfig" in obj, get: obj => obj.testConfig, set: (obj, value) => { obj.testConfig = value; } }, metadata: _metadata }, _testConfig_initializers, _testConfig_extraInitializers);
            __esDecorate(null, null, _prodConfig_decorators, { kind: "field", name: "prodConfig", static: false, private: false, access: { has: obj => "prodConfig" in obj, get: obj => obj.prodConfig, set: (obj, value) => { obj.prodConfig = value; } }, metadata: _metadata }, _prodConfig_initializers, _prodConfig_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        activeEnvironment = __runInitializers(this, _activeEnvironment_initializers, void 0);
        testingStatus = (__runInitializers(this, _activeEnvironment_extraInitializers), __runInitializers(this, _testingStatus_initializers, void 0));
        testingStartedAt = (__runInitializers(this, _testingStatus_extraInitializers), __runInitializers(this, _testingStartedAt_initializers, void 0));
        testingCompletedAt = (__runInitializers(this, _testingStartedAt_extraInitializers), __runInitializers(this, _testingCompletedAt_initializers, void 0));
        productionAuthorizedAt = (__runInitializers(this, _testingCompletedAt_extraInitializers), __runInitializers(this, _productionAuthorizedAt_initializers, void 0));
        testConfig = (__runInitializers(this, _productionAuthorizedAt_extraInitializers), __runInitializers(this, _testConfig_initializers, void 0));
        prodConfig = (__runInitializers(this, _testConfig_extraInitializers), __runInitializers(this, _prodConfig_initializers, void 0));
        constructor() {
            __runInitializers(this, _prodConfig_extraInitializers);
        }
    };
})();
exports.HaciendaConfigResponseDto = HaciendaConfigResponseDto;
let TestProgressByDteDto = (() => {
    let _dteType_decorators;
    let _dteType_initializers = [];
    let _dteType_extraInitializers = [];
    let _dteName_decorators;
    let _dteName_initializers = [];
    let _dteName_extraInitializers = [];
    let _emissionRequired_decorators;
    let _emissionRequired_initializers = [];
    let _emissionRequired_extraInitializers = [];
    let _emissionCompleted_decorators;
    let _emissionCompleted_initializers = [];
    let _emissionCompleted_extraInitializers = [];
    let _cancellationRequired_decorators;
    let _cancellationRequired_initializers = [];
    let _cancellationRequired_extraInitializers = [];
    let _cancellationCompleted_decorators;
    let _cancellationCompleted_initializers = [];
    let _cancellationCompleted_extraInitializers = [];
    let _isComplete_decorators;
    let _isComplete_initializers = [];
    let _isComplete_extraInitializers = [];
    return class TestProgressByDteDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _dteType_decorators = [(0, swagger_1.ApiProperty)()];
            _dteName_decorators = [(0, swagger_1.ApiProperty)()];
            _emissionRequired_decorators = [(0, swagger_1.ApiProperty)()];
            _emissionCompleted_decorators = [(0, swagger_1.ApiProperty)()];
            _cancellationRequired_decorators = [(0, swagger_1.ApiProperty)()];
            _cancellationCompleted_decorators = [(0, swagger_1.ApiProperty)()];
            _isComplete_decorators = [(0, swagger_1.ApiProperty)()];
            __esDecorate(null, null, _dteType_decorators, { kind: "field", name: "dteType", static: false, private: false, access: { has: obj => "dteType" in obj, get: obj => obj.dteType, set: (obj, value) => { obj.dteType = value; } }, metadata: _metadata }, _dteType_initializers, _dteType_extraInitializers);
            __esDecorate(null, null, _dteName_decorators, { kind: "field", name: "dteName", static: false, private: false, access: { has: obj => "dteName" in obj, get: obj => obj.dteName, set: (obj, value) => { obj.dteName = value; } }, metadata: _metadata }, _dteName_initializers, _dteName_extraInitializers);
            __esDecorate(null, null, _emissionRequired_decorators, { kind: "field", name: "emissionRequired", static: false, private: false, access: { has: obj => "emissionRequired" in obj, get: obj => obj.emissionRequired, set: (obj, value) => { obj.emissionRequired = value; } }, metadata: _metadata }, _emissionRequired_initializers, _emissionRequired_extraInitializers);
            __esDecorate(null, null, _emissionCompleted_decorators, { kind: "field", name: "emissionCompleted", static: false, private: false, access: { has: obj => "emissionCompleted" in obj, get: obj => obj.emissionCompleted, set: (obj, value) => { obj.emissionCompleted = value; } }, metadata: _metadata }, _emissionCompleted_initializers, _emissionCompleted_extraInitializers);
            __esDecorate(null, null, _cancellationRequired_decorators, { kind: "field", name: "cancellationRequired", static: false, private: false, access: { has: obj => "cancellationRequired" in obj, get: obj => obj.cancellationRequired, set: (obj, value) => { obj.cancellationRequired = value; } }, metadata: _metadata }, _cancellationRequired_initializers, _cancellationRequired_extraInitializers);
            __esDecorate(null, null, _cancellationCompleted_decorators, { kind: "field", name: "cancellationCompleted", static: false, private: false, access: { has: obj => "cancellationCompleted" in obj, get: obj => obj.cancellationCompleted, set: (obj, value) => { obj.cancellationCompleted = value; } }, metadata: _metadata }, _cancellationCompleted_initializers, _cancellationCompleted_extraInitializers);
            __esDecorate(null, null, _isComplete_decorators, { kind: "field", name: "isComplete", static: false, private: false, access: { has: obj => "isComplete" in obj, get: obj => obj.isComplete, set: (obj, value) => { obj.isComplete = value; } }, metadata: _metadata }, _isComplete_initializers, _isComplete_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        dteType = __runInitializers(this, _dteType_initializers, void 0);
        dteName = (__runInitializers(this, _dteType_extraInitializers), __runInitializers(this, _dteName_initializers, void 0));
        emissionRequired = (__runInitializers(this, _dteName_extraInitializers), __runInitializers(this, _emissionRequired_initializers, void 0));
        emissionCompleted = (__runInitializers(this, _emissionRequired_extraInitializers), __runInitializers(this, _emissionCompleted_initializers, void 0));
        cancellationRequired = (__runInitializers(this, _emissionCompleted_extraInitializers), __runInitializers(this, _cancellationRequired_initializers, void 0));
        cancellationCompleted = (__runInitializers(this, _cancellationRequired_extraInitializers), __runInitializers(this, _cancellationCompleted_initializers, void 0));
        isComplete = (__runInitializers(this, _cancellationCompleted_extraInitializers), __runInitializers(this, _isComplete_initializers, void 0));
        constructor() {
            __runInitializers(this, _isComplete_extraInitializers);
        }
    };
})();
exports.TestProgressByDteDto = TestProgressByDteDto;
let TestProgressResponseDto = (() => {
    let _progress_decorators;
    let _progress_initializers = [];
    let _progress_extraInitializers = [];
    let _totalRequired_decorators;
    let _totalRequired_initializers = [];
    let _totalRequired_extraInitializers = [];
    let _totalCompleted_decorators;
    let _totalCompleted_initializers = [];
    let _totalCompleted_extraInitializers = [];
    let _percentComplete_decorators;
    let _percentComplete_initializers = [];
    let _percentComplete_extraInitializers = [];
    let _canRequestAuthorization_decorators;
    let _canRequestAuthorization_initializers = [];
    let _canRequestAuthorization_extraInitializers = [];
    let _daysRemaining_decorators;
    let _daysRemaining_initializers = [];
    let _daysRemaining_extraInitializers = [];
    let _testingStartedAt_decorators;
    let _testingStartedAt_initializers = [];
    let _testingStartedAt_extraInitializers = [];
    return class TestProgressResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _progress_decorators = [(0, swagger_1.ApiProperty)({ type: [TestProgressByDteDto] })];
            _totalRequired_decorators = [(0, swagger_1.ApiProperty)()];
            _totalCompleted_decorators = [(0, swagger_1.ApiProperty)()];
            _percentComplete_decorators = [(0, swagger_1.ApiProperty)()];
            _canRequestAuthorization_decorators = [(0, swagger_1.ApiProperty)()];
            _daysRemaining_decorators = [(0, swagger_1.ApiPropertyOptional)()];
            _testingStartedAt_decorators = [(0, swagger_1.ApiPropertyOptional)()];
            __esDecorate(null, null, _progress_decorators, { kind: "field", name: "progress", static: false, private: false, access: { has: obj => "progress" in obj, get: obj => obj.progress, set: (obj, value) => { obj.progress = value; } }, metadata: _metadata }, _progress_initializers, _progress_extraInitializers);
            __esDecorate(null, null, _totalRequired_decorators, { kind: "field", name: "totalRequired", static: false, private: false, access: { has: obj => "totalRequired" in obj, get: obj => obj.totalRequired, set: (obj, value) => { obj.totalRequired = value; } }, metadata: _metadata }, _totalRequired_initializers, _totalRequired_extraInitializers);
            __esDecorate(null, null, _totalCompleted_decorators, { kind: "field", name: "totalCompleted", static: false, private: false, access: { has: obj => "totalCompleted" in obj, get: obj => obj.totalCompleted, set: (obj, value) => { obj.totalCompleted = value; } }, metadata: _metadata }, _totalCompleted_initializers, _totalCompleted_extraInitializers);
            __esDecorate(null, null, _percentComplete_decorators, { kind: "field", name: "percentComplete", static: false, private: false, access: { has: obj => "percentComplete" in obj, get: obj => obj.percentComplete, set: (obj, value) => { obj.percentComplete = value; } }, metadata: _metadata }, _percentComplete_initializers, _percentComplete_extraInitializers);
            __esDecorate(null, null, _canRequestAuthorization_decorators, { kind: "field", name: "canRequestAuthorization", static: false, private: false, access: { has: obj => "canRequestAuthorization" in obj, get: obj => obj.canRequestAuthorization, set: (obj, value) => { obj.canRequestAuthorization = value; } }, metadata: _metadata }, _canRequestAuthorization_initializers, _canRequestAuthorization_extraInitializers);
            __esDecorate(null, null, _daysRemaining_decorators, { kind: "field", name: "daysRemaining", static: false, private: false, access: { has: obj => "daysRemaining" in obj, get: obj => obj.daysRemaining, set: (obj, value) => { obj.daysRemaining = value; } }, metadata: _metadata }, _daysRemaining_initializers, _daysRemaining_extraInitializers);
            __esDecorate(null, null, _testingStartedAt_decorators, { kind: "field", name: "testingStartedAt", static: false, private: false, access: { has: obj => "testingStartedAt" in obj, get: obj => obj.testingStartedAt, set: (obj, value) => { obj.testingStartedAt = value; } }, metadata: _metadata }, _testingStartedAt_initializers, _testingStartedAt_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        progress = __runInitializers(this, _progress_initializers, void 0);
        totalRequired = (__runInitializers(this, _progress_extraInitializers), __runInitializers(this, _totalRequired_initializers, void 0));
        totalCompleted = (__runInitializers(this, _totalRequired_extraInitializers), __runInitializers(this, _totalCompleted_initializers, void 0));
        percentComplete = (__runInitializers(this, _totalCompleted_extraInitializers), __runInitializers(this, _percentComplete_initializers, void 0));
        canRequestAuthorization = (__runInitializers(this, _percentComplete_extraInitializers), __runInitializers(this, _canRequestAuthorization_initializers, void 0));
        daysRemaining = (__runInitializers(this, _canRequestAuthorization_extraInitializers), __runInitializers(this, _daysRemaining_initializers, void 0));
        testingStartedAt = (__runInitializers(this, _daysRemaining_extraInitializers), __runInitializers(this, _testingStartedAt_initializers, void 0));
        constructor() {
            __runInitializers(this, _testingStartedAt_extraInitializers);
        }
    };
})();
exports.TestProgressResponseDto = TestProgressResponseDto;
