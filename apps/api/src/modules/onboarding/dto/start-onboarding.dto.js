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
exports.StartOnboardingDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const onboarding_types_1 = require("../types/onboarding.types");
let StartOnboardingDto = (() => {
    let _assistanceLevel_decorators;
    let _assistanceLevel_initializers = [];
    let _assistanceLevel_extraInitializers = [];
    let _notes_decorators;
    let _notes_initializers = [];
    let _notes_extraInitializers = [];
    return class StartOnboardingDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _assistanceLevel_decorators = [(0, swagger_1.ApiProperty)({
                    enum: ['SELF_SERVICE', 'GUIDED', 'FULL_SERVICE'],
                    description: 'Nivel de asistencia deseado',
                }), (0, class_validator_1.IsEnum)(onboarding_types_1.AssistanceLevel)];
            _notes_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Notas o comentarios iniciales' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _assistanceLevel_decorators, { kind: "field", name: "assistanceLevel", static: false, private: false, access: { has: obj => "assistanceLevel" in obj, get: obj => obj.assistanceLevel, set: (obj, value) => { obj.assistanceLevel = value; } }, metadata: _metadata }, _assistanceLevel_initializers, _assistanceLevel_extraInitializers);
            __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: obj => "notes" in obj, get: obj => obj.notes, set: (obj, value) => { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        assistanceLevel = __runInitializers(this, _assistanceLevel_initializers, void 0);
        notes = (__runInitializers(this, _assistanceLevel_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
        constructor() {
            __runInitializers(this, _notes_extraInitializers);
        }
    };
})();
exports.StartOnboardingDto = StartOnboardingDto;
