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
exports.CreateTicketDto = exports.TicketPriority = exports.TicketType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var TicketType;
(function (TicketType) {
    TicketType["EMAIL_CONFIG"] = "EMAIL_CONFIG";
    TicketType["TECHNICAL"] = "TECHNICAL";
    TicketType["BILLING"] = "BILLING";
    TicketType["GENERAL"] = "GENERAL";
    TicketType["ONBOARDING"] = "ONBOARDING";
})(TicketType || (exports.TicketType = TicketType = {}));
var TicketPriority;
(function (TicketPriority) {
    TicketPriority["LOW"] = "LOW";
    TicketPriority["MEDIUM"] = "MEDIUM";
    TicketPriority["HIGH"] = "HIGH";
    TicketPriority["URGENT"] = "URGENT";
})(TicketPriority || (exports.TicketPriority = TicketPriority = {}));
let CreateTicketDto = (() => {
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _subject_decorators;
    let _subject_initializers = [];
    let _subject_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _priority_decorators;
    let _priority_initializers = [];
    let _priority_extraInitializers = [];
    return class CreateTicketDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _type_decorators = [(0, swagger_1.ApiProperty)({ enum: TicketType, description: 'Tipo de ticket' }), (0, class_validator_1.IsEnum)(TicketType)];
            _subject_decorators = [(0, swagger_1.ApiProperty)({ description: 'Asunto del ticket', maxLength: 255 }), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            _description_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Descripcion detallada del problema' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _metadata_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Metadatos adicionales en formato JSON' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _priority_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: TicketPriority, description: 'Prioridad del ticket' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(TicketPriority)];
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _subject_decorators, { kind: "field", name: "subject", static: false, private: false, access: { has: obj => "subject" in obj, get: obj => obj.subject, set: (obj, value) => { obj.subject = value; } }, metadata: _metadata }, _subject_initializers, _subject_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
            __esDecorate(null, null, _priority_decorators, { kind: "field", name: "priority", static: false, private: false, access: { has: obj => "priority" in obj, get: obj => obj.priority, set: (obj, value) => { obj.priority = value; } }, metadata: _metadata }, _priority_initializers, _priority_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        type = __runInitializers(this, _type_initializers, void 0);
        subject = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _subject_initializers, void 0));
        description = (__runInitializers(this, _subject_extraInitializers), __runInitializers(this, _description_initializers, void 0));
        metadata = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
        priority = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _priority_initializers, void 0));
        constructor() {
            __runInitializers(this, _priority_extraInitializers);
        }
    };
})();
exports.CreateTicketDto = CreateTicketDto;
