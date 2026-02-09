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
exports.CreateEmailConfigDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const email_types_1 = require("../types/email.types");
let CreateEmailConfigDto = (() => {
    let _provider_decorators;
    let _provider_initializers = [];
    let _provider_extraInitializers = [];
    let _authMethod_decorators;
    let _authMethod_initializers = [];
    let _authMethod_extraInitializers = [];
    let _smtpHost_decorators;
    let _smtpHost_initializers = [];
    let _smtpHost_extraInitializers = [];
    let _smtpPort_decorators;
    let _smtpPort_initializers = [];
    let _smtpPort_extraInitializers = [];
    let _smtpSecure_decorators;
    let _smtpSecure_initializers = [];
    let _smtpSecure_extraInitializers = [];
    let _smtpUser_decorators;
    let _smtpUser_initializers = [];
    let _smtpUser_extraInitializers = [];
    let _smtpPassword_decorators;
    let _smtpPassword_initializers = [];
    let _smtpPassword_extraInitializers = [];
    let _apiKey_decorators;
    let _apiKey_initializers = [];
    let _apiKey_extraInitializers = [];
    let _apiSecret_decorators;
    let _apiSecret_initializers = [];
    let _apiSecret_extraInitializers = [];
    let _apiEndpoint_decorators;
    let _apiEndpoint_initializers = [];
    let _apiEndpoint_extraInitializers = [];
    let _oauth2ClientId_decorators;
    let _oauth2ClientId_initializers = [];
    let _oauth2ClientId_extraInitializers = [];
    let _oauth2ClientSecret_decorators;
    let _oauth2ClientSecret_initializers = [];
    let _oauth2ClientSecret_extraInitializers = [];
    let _oauth2TenantId_decorators;
    let _oauth2TenantId_initializers = [];
    let _oauth2TenantId_extraInitializers = [];
    let _fromEmail_decorators;
    let _fromEmail_initializers = [];
    let _fromEmail_extraInitializers = [];
    let _fromName_decorators;
    let _fromName_initializers = [];
    let _fromName_extraInitializers = [];
    let _replyToEmail_decorators;
    let _replyToEmail_initializers = [];
    let _replyToEmail_extraInitializers = [];
    let _rateLimitPerHour_decorators;
    let _rateLimitPerHour_initializers = [];
    let _rateLimitPerHour_extraInitializers = [];
    let _retryAttempts_decorators;
    let _retryAttempts_initializers = [];
    let _retryAttempts_extraInitializers = [];
    let _timeoutSeconds_decorators;
    let _timeoutSeconds_initializers = [];
    let _timeoutSeconds_extraInitializers = [];
    let _notes_decorators;
    let _notes_initializers = [];
    let _notes_extraInitializers = [];
    return class CreateEmailConfigDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _provider_decorators = [(0, swagger_1.ApiProperty)({
                    enum: email_types_1.EmailProvider,
                    example: 'SENDGRID',
                    description: 'Email provider to use',
                }), (0, class_validator_1.IsEnum)(email_types_1.EmailProvider)];
            _authMethod_decorators = [(0, swagger_1.ApiProperty)({
                    enum: email_types_1.EmailAuthMethod,
                    example: 'API_KEY',
                    description: 'Authentication method',
                }), (0, class_validator_1.IsEnum)(email_types_1.EmailAuthMethod)];
            _smtpHost_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'smtp.sendgrid.net' }), (0, class_validator_1.ValidateIf)((o) => o.authMethod === 'SMTP_BASIC'), (0, class_validator_1.IsString)()];
            _smtpPort_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 587 }), (0, class_validator_1.ValidateIf)((o) => o.authMethod === 'SMTP_BASIC'), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(65535)];
            _smtpSecure_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: true }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _smtpUser_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'apikey' }), (0, class_validator_1.ValidateIf)((o) => o.authMethod === 'SMTP_BASIC'), (0, class_validator_1.IsString)()];
            _smtpPassword_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'SG.xxxxx' }), (0, class_validator_1.ValidateIf)((o) => o.authMethod === 'SMTP_BASIC'), (0, class_validator_1.IsString)()];
            _apiKey_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' }), (0, class_validator_1.ValidateIf)((o) => o.authMethod === 'API_KEY'), (0, class_validator_1.IsString)()];
            _apiSecret_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _apiEndpoint_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'https://api.sendgrid.com/v3' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _oauth2ClientId_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }), (0, class_validator_1.ValidateIf)((o) => o.authMethod === 'OAUTH2'), (0, class_validator_1.IsString)()];
            _oauth2ClientSecret_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.ValidateIf)((o) => o.authMethod === 'OAUTH2'), (0, class_validator_1.IsString)()];
            _oauth2TenantId_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _fromEmail_decorators = [(0, swagger_1.ApiProperty)({ example: 'facturas@miempresa.com' }), (0, class_validator_1.IsEmail)()];
            _fromName_decorators = [(0, swagger_1.ApiProperty)({ example: 'Mi Empresa S.A. de C.V.' }), (0, class_validator_1.IsString)()];
            _replyToEmail_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'soporte@miempresa.com' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEmail)()];
            _rateLimitPerHour_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 100, description: 'Max emails per hour' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(10000)];
            _retryAttempts_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 3, description: 'Number of retry attempts' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(10)];
            _timeoutSeconds_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 30, description: 'Timeout in seconds' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(5), (0, class_validator_1.Max)(120)];
            _notes_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Additional notes' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _provider_decorators, { kind: "field", name: "provider", static: false, private: false, access: { has: obj => "provider" in obj, get: obj => obj.provider, set: (obj, value) => { obj.provider = value; } }, metadata: _metadata }, _provider_initializers, _provider_extraInitializers);
            __esDecorate(null, null, _authMethod_decorators, { kind: "field", name: "authMethod", static: false, private: false, access: { has: obj => "authMethod" in obj, get: obj => obj.authMethod, set: (obj, value) => { obj.authMethod = value; } }, metadata: _metadata }, _authMethod_initializers, _authMethod_extraInitializers);
            __esDecorate(null, null, _smtpHost_decorators, { kind: "field", name: "smtpHost", static: false, private: false, access: { has: obj => "smtpHost" in obj, get: obj => obj.smtpHost, set: (obj, value) => { obj.smtpHost = value; } }, metadata: _metadata }, _smtpHost_initializers, _smtpHost_extraInitializers);
            __esDecorate(null, null, _smtpPort_decorators, { kind: "field", name: "smtpPort", static: false, private: false, access: { has: obj => "smtpPort" in obj, get: obj => obj.smtpPort, set: (obj, value) => { obj.smtpPort = value; } }, metadata: _metadata }, _smtpPort_initializers, _smtpPort_extraInitializers);
            __esDecorate(null, null, _smtpSecure_decorators, { kind: "field", name: "smtpSecure", static: false, private: false, access: { has: obj => "smtpSecure" in obj, get: obj => obj.smtpSecure, set: (obj, value) => { obj.smtpSecure = value; } }, metadata: _metadata }, _smtpSecure_initializers, _smtpSecure_extraInitializers);
            __esDecorate(null, null, _smtpUser_decorators, { kind: "field", name: "smtpUser", static: false, private: false, access: { has: obj => "smtpUser" in obj, get: obj => obj.smtpUser, set: (obj, value) => { obj.smtpUser = value; } }, metadata: _metadata }, _smtpUser_initializers, _smtpUser_extraInitializers);
            __esDecorate(null, null, _smtpPassword_decorators, { kind: "field", name: "smtpPassword", static: false, private: false, access: { has: obj => "smtpPassword" in obj, get: obj => obj.smtpPassword, set: (obj, value) => { obj.smtpPassword = value; } }, metadata: _metadata }, _smtpPassword_initializers, _smtpPassword_extraInitializers);
            __esDecorate(null, null, _apiKey_decorators, { kind: "field", name: "apiKey", static: false, private: false, access: { has: obj => "apiKey" in obj, get: obj => obj.apiKey, set: (obj, value) => { obj.apiKey = value; } }, metadata: _metadata }, _apiKey_initializers, _apiKey_extraInitializers);
            __esDecorate(null, null, _apiSecret_decorators, { kind: "field", name: "apiSecret", static: false, private: false, access: { has: obj => "apiSecret" in obj, get: obj => obj.apiSecret, set: (obj, value) => { obj.apiSecret = value; } }, metadata: _metadata }, _apiSecret_initializers, _apiSecret_extraInitializers);
            __esDecorate(null, null, _apiEndpoint_decorators, { kind: "field", name: "apiEndpoint", static: false, private: false, access: { has: obj => "apiEndpoint" in obj, get: obj => obj.apiEndpoint, set: (obj, value) => { obj.apiEndpoint = value; } }, metadata: _metadata }, _apiEndpoint_initializers, _apiEndpoint_extraInitializers);
            __esDecorate(null, null, _oauth2ClientId_decorators, { kind: "field", name: "oauth2ClientId", static: false, private: false, access: { has: obj => "oauth2ClientId" in obj, get: obj => obj.oauth2ClientId, set: (obj, value) => { obj.oauth2ClientId = value; } }, metadata: _metadata }, _oauth2ClientId_initializers, _oauth2ClientId_extraInitializers);
            __esDecorate(null, null, _oauth2ClientSecret_decorators, { kind: "field", name: "oauth2ClientSecret", static: false, private: false, access: { has: obj => "oauth2ClientSecret" in obj, get: obj => obj.oauth2ClientSecret, set: (obj, value) => { obj.oauth2ClientSecret = value; } }, metadata: _metadata }, _oauth2ClientSecret_initializers, _oauth2ClientSecret_extraInitializers);
            __esDecorate(null, null, _oauth2TenantId_decorators, { kind: "field", name: "oauth2TenantId", static: false, private: false, access: { has: obj => "oauth2TenantId" in obj, get: obj => obj.oauth2TenantId, set: (obj, value) => { obj.oauth2TenantId = value; } }, metadata: _metadata }, _oauth2TenantId_initializers, _oauth2TenantId_extraInitializers);
            __esDecorate(null, null, _fromEmail_decorators, { kind: "field", name: "fromEmail", static: false, private: false, access: { has: obj => "fromEmail" in obj, get: obj => obj.fromEmail, set: (obj, value) => { obj.fromEmail = value; } }, metadata: _metadata }, _fromEmail_initializers, _fromEmail_extraInitializers);
            __esDecorate(null, null, _fromName_decorators, { kind: "field", name: "fromName", static: false, private: false, access: { has: obj => "fromName" in obj, get: obj => obj.fromName, set: (obj, value) => { obj.fromName = value; } }, metadata: _metadata }, _fromName_initializers, _fromName_extraInitializers);
            __esDecorate(null, null, _replyToEmail_decorators, { kind: "field", name: "replyToEmail", static: false, private: false, access: { has: obj => "replyToEmail" in obj, get: obj => obj.replyToEmail, set: (obj, value) => { obj.replyToEmail = value; } }, metadata: _metadata }, _replyToEmail_initializers, _replyToEmail_extraInitializers);
            __esDecorate(null, null, _rateLimitPerHour_decorators, { kind: "field", name: "rateLimitPerHour", static: false, private: false, access: { has: obj => "rateLimitPerHour" in obj, get: obj => obj.rateLimitPerHour, set: (obj, value) => { obj.rateLimitPerHour = value; } }, metadata: _metadata }, _rateLimitPerHour_initializers, _rateLimitPerHour_extraInitializers);
            __esDecorate(null, null, _retryAttempts_decorators, { kind: "field", name: "retryAttempts", static: false, private: false, access: { has: obj => "retryAttempts" in obj, get: obj => obj.retryAttempts, set: (obj, value) => { obj.retryAttempts = value; } }, metadata: _metadata }, _retryAttempts_initializers, _retryAttempts_extraInitializers);
            __esDecorate(null, null, _timeoutSeconds_decorators, { kind: "field", name: "timeoutSeconds", static: false, private: false, access: { has: obj => "timeoutSeconds" in obj, get: obj => obj.timeoutSeconds, set: (obj, value) => { obj.timeoutSeconds = value; } }, metadata: _metadata }, _timeoutSeconds_initializers, _timeoutSeconds_extraInitializers);
            __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: obj => "notes" in obj, get: obj => obj.notes, set: (obj, value) => { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        provider = __runInitializers(this, _provider_initializers, void 0);
        authMethod = (__runInitializers(this, _provider_extraInitializers), __runInitializers(this, _authMethod_initializers, void 0));
        // SMTP Configuration
        smtpHost = (__runInitializers(this, _authMethod_extraInitializers), __runInitializers(this, _smtpHost_initializers, void 0));
        smtpPort = (__runInitializers(this, _smtpHost_extraInitializers), __runInitializers(this, _smtpPort_initializers, void 0));
        smtpSecure = (__runInitializers(this, _smtpPort_extraInitializers), __runInitializers(this, _smtpSecure_initializers, void 0));
        smtpUser = (__runInitializers(this, _smtpSecure_extraInitializers), __runInitializers(this, _smtpUser_initializers, void 0));
        smtpPassword = (__runInitializers(this, _smtpUser_extraInitializers), __runInitializers(this, _smtpPassword_initializers, void 0));
        // API Configuration
        apiKey = (__runInitializers(this, _smtpPassword_extraInitializers), __runInitializers(this, _apiKey_initializers, void 0));
        apiSecret = (__runInitializers(this, _apiKey_extraInitializers), __runInitializers(this, _apiSecret_initializers, void 0));
        apiEndpoint = (__runInitializers(this, _apiSecret_extraInitializers), __runInitializers(this, _apiEndpoint_initializers, void 0));
        // OAuth2 Configuration (for M365 and Google)
        oauth2ClientId = (__runInitializers(this, _apiEndpoint_extraInitializers), __runInitializers(this, _oauth2ClientId_initializers, void 0));
        oauth2ClientSecret = (__runInitializers(this, _oauth2ClientId_extraInitializers), __runInitializers(this, _oauth2ClientSecret_initializers, void 0));
        oauth2TenantId = (__runInitializers(this, _oauth2ClientSecret_extraInitializers), __runInitializers(this, _oauth2TenantId_initializers, void 0)); // For Azure AD
        // Sender Configuration
        fromEmail = (__runInitializers(this, _oauth2TenantId_extraInitializers), __runInitializers(this, _fromEmail_initializers, void 0));
        fromName = (__runInitializers(this, _fromEmail_extraInitializers), __runInitializers(this, _fromName_initializers, void 0));
        replyToEmail = (__runInitializers(this, _fromName_extraInitializers), __runInitializers(this, _replyToEmail_initializers, void 0));
        // Advanced Configuration
        rateLimitPerHour = (__runInitializers(this, _replyToEmail_extraInitializers), __runInitializers(this, _rateLimitPerHour_initializers, void 0));
        retryAttempts = (__runInitializers(this, _rateLimitPerHour_extraInitializers), __runInitializers(this, _retryAttempts_initializers, void 0));
        timeoutSeconds = (__runInitializers(this, _retryAttempts_extraInitializers), __runInitializers(this, _timeoutSeconds_initializers, void 0));
        notes = (__runInitializers(this, _timeoutSeconds_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
        constructor() {
            __runInitializers(this, _notes_extraInitializers);
        }
    };
})();
exports.CreateEmailConfigDto = CreateEmailConfigDto;
