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
exports.CommunicationListDto = exports.CommunicationDto = exports.AddCommunicationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const onboarding_types_1 = require("../types/onboarding.types");
let AddCommunicationDto = (() => {
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _subject_decorators;
    let _subject_initializers = [];
    let _subject_extraInitializers = [];
    let _content_decorators;
    let _content_initializers = [];
    let _content_extraInitializers = [];
    let _attachments_decorators;
    let _attachments_initializers = [];
    let _attachments_extraInitializers = [];
    let _relatedStep_decorators;
    let _relatedStep_initializers = [];
    let _relatedStep_extraInitializers = [];
    return class AddCommunicationDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _type_decorators = [(0, swagger_1.ApiProperty)({
                    enum: onboarding_types_1.CommunicationType,
                    description: 'Tipo de comunicación',
                }), (0, class_validator_1.IsEnum)(onboarding_types_1.CommunicationType)];
            _subject_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Asunto del mensaje' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _content_decorators = [(0, swagger_1.ApiProperty)({ description: 'Contenido del mensaje' }), (0, class_validator_1.IsString)()];
            _attachments_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'URLs de archivos adjuntos' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsUrl)({}, { each: true })];
            _relatedStep_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    enum: onboarding_types_1.OnboardingStep,
                    description: 'Paso relacionado',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(onboarding_types_1.OnboardingStep)];
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _subject_decorators, { kind: "field", name: "subject", static: false, private: false, access: { has: obj => "subject" in obj, get: obj => obj.subject, set: (obj, value) => { obj.subject = value; } }, metadata: _metadata }, _subject_initializers, _subject_extraInitializers);
            __esDecorate(null, null, _content_decorators, { kind: "field", name: "content", static: false, private: false, access: { has: obj => "content" in obj, get: obj => obj.content, set: (obj, value) => { obj.content = value; } }, metadata: _metadata }, _content_initializers, _content_extraInitializers);
            __esDecorate(null, null, _attachments_decorators, { kind: "field", name: "attachments", static: false, private: false, access: { has: obj => "attachments" in obj, get: obj => obj.attachments, set: (obj, value) => { obj.attachments = value; } }, metadata: _metadata }, _attachments_initializers, _attachments_extraInitializers);
            __esDecorate(null, null, _relatedStep_decorators, { kind: "field", name: "relatedStep", static: false, private: false, access: { has: obj => "relatedStep" in obj, get: obj => obj.relatedStep, set: (obj, value) => { obj.relatedStep = value; } }, metadata: _metadata }, _relatedStep_initializers, _relatedStep_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        type = __runInitializers(this, _type_initializers, void 0);
        subject = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _subject_initializers, void 0));
        content = (__runInitializers(this, _subject_extraInitializers), __runInitializers(this, _content_initializers, void 0));
        attachments = (__runInitializers(this, _content_extraInitializers), __runInitializers(this, _attachments_initializers, void 0));
        relatedStep = (__runInitializers(this, _attachments_extraInitializers), __runInitializers(this, _relatedStep_initializers, void 0));
        constructor() {
            __runInitializers(this, _relatedStep_extraInitializers);
        }
    };
})();
exports.AddCommunicationDto = AddCommunicationDto;
// Response DTOs
class CommunicationDto {
    id;
    type;
    direction;
    subject;
    content;
    attachments;
    relatedStep;
    sentBy;
    sentAt;
    readAt;
}
exports.CommunicationDto = CommunicationDto;
class CommunicationListDto {
    communications;
    total;
    unreadCount;
}
exports.CommunicationListDto = CommunicationListDto;
