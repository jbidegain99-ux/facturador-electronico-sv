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
exports.AddMessageDto = exports.UpdateEmailAssistanceRequestDto = exports.CreateEmailAssistanceRequestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const email_types_1 = require("../types/email.types");
let CreateEmailAssistanceRequestDto = (() => {
    let _requestType_decorators;
    let _requestType_initializers = [];
    let _requestType_extraInitializers = [];
    let _desiredProvider_decorators;
    let _desiredProvider_initializers = [];
    let _desiredProvider_extraInitializers = [];
    let _currentProvider_decorators;
    let _currentProvider_initializers = [];
    let _currentProvider_extraInitializers = [];
    let _accountEmail_decorators;
    let _accountEmail_initializers = [];
    let _accountEmail_extraInitializers = [];
    let _additionalNotes_decorators;
    let _additionalNotes_initializers = [];
    let _additionalNotes_extraInitializers = [];
    return class CreateEmailAssistanceRequestDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _requestType_decorators = [(0, swagger_1.ApiProperty)({
                    enum: email_types_1.EmailRequestType,
                    example: 'NEW_SETUP',
                    description: 'Type of assistance needed',
                }), (0, class_validator_1.IsEnum)(email_types_1.EmailRequestType)];
            _desiredProvider_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    enum: email_types_1.EmailProvider,
                    example: 'SENDGRID',
                    description: 'Preferred email provider',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(email_types_1.EmailProvider)];
            _currentProvider_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    example: 'Gmail',
                    description: 'Current email provider if any',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _accountEmail_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    example: 'admin@company.com',
                    description: 'Account email for current provider',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEmail)()];
            _additionalNotes_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    example: 'Necesitamos poder enviar facturas a nuestros clientes por correo.',
                    description: 'Additional notes or requirements',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _requestType_decorators, { kind: "field", name: "requestType", static: false, private: false, access: { has: obj => "requestType" in obj, get: obj => obj.requestType, set: (obj, value) => { obj.requestType = value; } }, metadata: _metadata }, _requestType_initializers, _requestType_extraInitializers);
            __esDecorate(null, null, _desiredProvider_decorators, { kind: "field", name: "desiredProvider", static: false, private: false, access: { has: obj => "desiredProvider" in obj, get: obj => obj.desiredProvider, set: (obj, value) => { obj.desiredProvider = value; } }, metadata: _metadata }, _desiredProvider_initializers, _desiredProvider_extraInitializers);
            __esDecorate(null, null, _currentProvider_decorators, { kind: "field", name: "currentProvider", static: false, private: false, access: { has: obj => "currentProvider" in obj, get: obj => obj.currentProvider, set: (obj, value) => { obj.currentProvider = value; } }, metadata: _metadata }, _currentProvider_initializers, _currentProvider_extraInitializers);
            __esDecorate(null, null, _accountEmail_decorators, { kind: "field", name: "accountEmail", static: false, private: false, access: { has: obj => "accountEmail" in obj, get: obj => obj.accountEmail, set: (obj, value) => { obj.accountEmail = value; } }, metadata: _metadata }, _accountEmail_initializers, _accountEmail_extraInitializers);
            __esDecorate(null, null, _additionalNotes_decorators, { kind: "field", name: "additionalNotes", static: false, private: false, access: { has: obj => "additionalNotes" in obj, get: obj => obj.additionalNotes, set: (obj, value) => { obj.additionalNotes = value; } }, metadata: _metadata }, _additionalNotes_initializers, _additionalNotes_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        requestType = __runInitializers(this, _requestType_initializers, void 0);
        desiredProvider = (__runInitializers(this, _requestType_extraInitializers), __runInitializers(this, _desiredProvider_initializers, void 0));
        currentProvider = (__runInitializers(this, _desiredProvider_extraInitializers), __runInitializers(this, _currentProvider_initializers, void 0));
        accountEmail = (__runInitializers(this, _currentProvider_extraInitializers), __runInitializers(this, _accountEmail_initializers, void 0));
        additionalNotes = (__runInitializers(this, _accountEmail_extraInitializers), __runInitializers(this, _additionalNotes_initializers, void 0));
        constructor() {
            __runInitializers(this, _additionalNotes_extraInitializers);
        }
    };
})();
exports.CreateEmailAssistanceRequestDto = CreateEmailAssistanceRequestDto;
let UpdateEmailAssistanceRequestDto = (() => {
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _assignedTo_decorators;
    let _assignedTo_initializers = [];
    let _assignedTo_extraInitializers = [];
    return class UpdateEmailAssistanceRequestDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _status_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    enum: email_types_1.RequestStatus,
                    example: 'IN_PROGRESS',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(email_types_1.RequestStatus)];
            _assignedTo_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    example: 'user-id-123',
                    description: 'ID of the assigned agent',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _assignedTo_decorators, { kind: "field", name: "assignedTo", static: false, private: false, access: { has: obj => "assignedTo" in obj, get: obj => obj.assignedTo, set: (obj, value) => { obj.assignedTo = value; } }, metadata: _metadata }, _assignedTo_initializers, _assignedTo_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        status = __runInitializers(this, _status_initializers, void 0);
        assignedTo = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _assignedTo_initializers, void 0));
        constructor() {
            __runInitializers(this, _assignedTo_extraInitializers);
        }
    };
})();
exports.UpdateEmailAssistanceRequestDto = UpdateEmailAssistanceRequestDto;
let AddMessageDto = (() => {
    let _message_decorators;
    let _message_initializers = [];
    let _message_extraInitializers = [];
    let _attachments_decorators;
    let _attachments_initializers = [];
    let _attachments_extraInitializers = [];
    return class AddMessageDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _message_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'Hemos recibido su solicitud y la estamos procesando.',
                    description: 'Message content',
                }), (0, class_validator_1.IsString)()];
            _attachments_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    example: ['https://example.com/attachment.pdf'],
                    description: 'Array of attachment URLs',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)({ each: true })];
            __esDecorate(null, null, _message_decorators, { kind: "field", name: "message", static: false, private: false, access: { has: obj => "message" in obj, get: obj => obj.message, set: (obj, value) => { obj.message = value; } }, metadata: _metadata }, _message_initializers, _message_extraInitializers);
            __esDecorate(null, null, _attachments_decorators, { kind: "field", name: "attachments", static: false, private: false, access: { has: obj => "attachments" in obj, get: obj => obj.attachments, set: (obj, value) => { obj.attachments = value; } }, metadata: _metadata }, _attachments_initializers, _attachments_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        message = __runInitializers(this, _message_initializers, void 0);
        attachments = (__runInitializers(this, _message_extraInitializers), __runInitializers(this, _attachments_initializers, void 0));
        constructor() {
            __runInitializers(this, _attachments_extraInitializers);
        }
    };
})();
exports.AddMessageDto = AddMessageDto;
