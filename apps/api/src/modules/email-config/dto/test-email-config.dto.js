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
exports.SendTestEmailResultDto = exports.TestConnectionResultDto = exports.TestEmailConfigDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
let TestEmailConfigDto = (() => {
    let _recipientEmail_decorators;
    let _recipientEmail_initializers = [];
    let _recipientEmail_extraInitializers = [];
    let _subject_decorators;
    let _subject_initializers = [];
    let _subject_extraInitializers = [];
    let _message_decorators;
    let _message_initializers = [];
    let _message_extraInitializers = [];
    return class TestEmailConfigDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _recipientEmail_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'test@example.com',
                    description: 'Email address to send test email to',
                }), (0, class_validator_1.IsEmail)()];
            _subject_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    example: 'Prueba de configuración de email',
                    description: 'Custom subject for test email',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _message_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    example: 'Este es un correo de prueba para verificar la configuración.',
                    description: 'Custom message for test email',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _recipientEmail_decorators, { kind: "field", name: "recipientEmail", static: false, private: false, access: { has: obj => "recipientEmail" in obj, get: obj => obj.recipientEmail, set: (obj, value) => { obj.recipientEmail = value; } }, metadata: _metadata }, _recipientEmail_initializers, _recipientEmail_extraInitializers);
            __esDecorate(null, null, _subject_decorators, { kind: "field", name: "subject", static: false, private: false, access: { has: obj => "subject" in obj, get: obj => obj.subject, set: (obj, value) => { obj.subject = value; } }, metadata: _metadata }, _subject_initializers, _subject_extraInitializers);
            __esDecorate(null, null, _message_decorators, { kind: "field", name: "message", static: false, private: false, access: { has: obj => "message" in obj, get: obj => obj.message, set: (obj, value) => { obj.message = value; } }, metadata: _metadata }, _message_initializers, _message_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        recipientEmail = __runInitializers(this, _recipientEmail_initializers, void 0);
        subject = (__runInitializers(this, _recipientEmail_extraInitializers), __runInitializers(this, _subject_initializers, void 0));
        message = (__runInitializers(this, _subject_extraInitializers), __runInitializers(this, _message_initializers, void 0));
        constructor() {
            __runInitializers(this, _message_extraInitializers);
        }
    };
})();
exports.TestEmailConfigDto = TestEmailConfigDto;
class TestConnectionResultDto {
    success;
    responseTimeMs;
    errorMessage;
    errorCode;
}
exports.TestConnectionResultDto = TestConnectionResultDto;
class SendTestEmailResultDto {
    success;
    messageId;
    errorMessage;
}
exports.SendTestEmailResultDto = SendTestEmailResultDto;
