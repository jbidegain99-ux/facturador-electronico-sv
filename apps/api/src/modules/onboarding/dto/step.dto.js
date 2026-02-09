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
exports.OnboardingProgressDto = exports.StepDetailDto = exports.GoToStepDto = exports.CompleteStepDto = exports.UpdateStepDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const onboarding_types_1 = require("../types/onboarding.types");
let UpdateStepDto = (() => {
    let _step_decorators;
    let _step_initializers = [];
    let _step_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _stepData_decorators;
    let _stepData_initializers = [];
    let _stepData_extraInitializers = [];
    let _notes_decorators;
    let _notes_initializers = [];
    let _notes_extraInitializers = [];
    let _blockerReason_decorators;
    let _blockerReason_initializers = [];
    let _blockerReason_extraInitializers = [];
    return class UpdateStepDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _step_decorators = [(0, swagger_1.ApiProperty)({
                    enum: onboarding_types_1.OnboardingStep,
                    description: 'Paso del proceso',
                }), (0, class_validator_1.IsEnum)(onboarding_types_1.OnboardingStep)];
            _status_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    enum: onboarding_types_1.StepStatus,
                    description: 'Estado del paso',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(onboarding_types_1.StepStatus)];
            _stepData_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Datos específicos del paso (JSON)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsObject)()];
            _notes_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Notas u observaciones' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _blockerReason_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Razón del bloqueo (si aplica)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _step_decorators, { kind: "field", name: "step", static: false, private: false, access: { has: obj => "step" in obj, get: obj => obj.step, set: (obj, value) => { obj.step = value; } }, metadata: _metadata }, _step_initializers, _step_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _stepData_decorators, { kind: "field", name: "stepData", static: false, private: false, access: { has: obj => "stepData" in obj, get: obj => obj.stepData, set: (obj, value) => { obj.stepData = value; } }, metadata: _metadata }, _stepData_initializers, _stepData_extraInitializers);
            __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: obj => "notes" in obj, get: obj => obj.notes, set: (obj, value) => { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
            __esDecorate(null, null, _blockerReason_decorators, { kind: "field", name: "blockerReason", static: false, private: false, access: { has: obj => "blockerReason" in obj, get: obj => obj.blockerReason, set: (obj, value) => { obj.blockerReason = value; } }, metadata: _metadata }, _blockerReason_initializers, _blockerReason_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        step = __runInitializers(this, _step_initializers, void 0);
        status = (__runInitializers(this, _step_extraInitializers), __runInitializers(this, _status_initializers, void 0));
        stepData = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _stepData_initializers, void 0));
        notes = (__runInitializers(this, _stepData_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
        blockerReason = (__runInitializers(this, _notes_extraInitializers), __runInitializers(this, _blockerReason_initializers, void 0));
        constructor() {
            __runInitializers(this, _blockerReason_extraInitializers);
        }
    };
})();
exports.UpdateStepDto = UpdateStepDto;
let CompleteStepDto = (() => {
    let _step_decorators;
    let _step_initializers = [];
    let _step_extraInitializers = [];
    let _stepData_decorators;
    let _stepData_initializers = [];
    let _stepData_extraInitializers = [];
    let _notes_decorators;
    let _notes_initializers = [];
    let _notes_extraInitializers = [];
    return class CompleteStepDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _step_decorators = [(0, swagger_1.ApiProperty)({
                    enum: onboarding_types_1.OnboardingStep,
                    description: 'Paso a completar',
                }), (0, class_validator_1.IsEnum)(onboarding_types_1.OnboardingStep)];
            _stepData_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Datos del paso completado' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsObject)()];
            _notes_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Notas adicionales' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _step_decorators, { kind: "field", name: "step", static: false, private: false, access: { has: obj => "step" in obj, get: obj => obj.step, set: (obj, value) => { obj.step = value; } }, metadata: _metadata }, _step_initializers, _step_extraInitializers);
            __esDecorate(null, null, _stepData_decorators, { kind: "field", name: "stepData", static: false, private: false, access: { has: obj => "stepData" in obj, get: obj => obj.stepData, set: (obj, value) => { obj.stepData = value; } }, metadata: _metadata }, _stepData_initializers, _stepData_extraInitializers);
            __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: obj => "notes" in obj, get: obj => obj.notes, set: (obj, value) => { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        step = __runInitializers(this, _step_initializers, void 0);
        stepData = (__runInitializers(this, _step_extraInitializers), __runInitializers(this, _stepData_initializers, void 0));
        notes = (__runInitializers(this, _stepData_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
        constructor() {
            __runInitializers(this, _notes_extraInitializers);
        }
    };
})();
exports.CompleteStepDto = CompleteStepDto;
let GoToStepDto = (() => {
    let _step_decorators;
    let _step_initializers = [];
    let _step_extraInitializers = [];
    return class GoToStepDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _step_decorators = [(0, swagger_1.ApiProperty)({
                    enum: onboarding_types_1.OnboardingStep,
                    description: 'Paso al que navegar',
                }), (0, class_validator_1.IsEnum)(onboarding_types_1.OnboardingStep)];
            __esDecorate(null, null, _step_decorators, { kind: "field", name: "step", static: false, private: false, access: { has: obj => "step" in obj, get: obj => obj.step, set: (obj, value) => { obj.step = value; } }, metadata: _metadata }, _step_initializers, _step_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        step = __runInitializers(this, _step_initializers, void 0);
        constructor() {
            __runInitializers(this, _step_extraInitializers);
        }
    };
})();
exports.GoToStepDto = GoToStepDto;
// Response DTO
class StepDetailDto {
    step;
    name;
    description;
    status;
    order;
    isCurrentStep;
    canNavigateTo;
    stepData;
    notes;
    blockerReason;
    performedBy;
    startedAt;
    completedAt;
}
exports.StepDetailDto = StepDetailDto;
class OnboardingProgressDto {
    currentStep;
    overallStatus;
    completedSteps;
    totalSteps;
    percentComplete;
    steps;
    canProceed;
    nextAction;
}
exports.OnboardingProgressDto = OnboardingProgressDto;
