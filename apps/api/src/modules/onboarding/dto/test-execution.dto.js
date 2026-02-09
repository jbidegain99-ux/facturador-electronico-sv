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
exports.TestProgressSummaryDto = exports.TestResultDto = exports.ExecuteEventTestDto = exports.ExecuteTestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const onboarding_types_1 = require("../types/onboarding.types");
let ExecuteTestDto = (() => {
    let _dteType_decorators;
    let _dteType_initializers = [];
    let _dteType_extraInitializers = [];
    let _testData_decorators;
    let _testData_initializers = [];
    let _testData_extraInitializers = [];
    return class ExecuteTestDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _dteType_decorators = [(0, swagger_1.ApiProperty)({
                    enum: onboarding_types_1.DteType,
                    description: 'Tipo de DTE a probar',
                }), (0, class_validator_1.IsEnum)(onboarding_types_1.DteType)];
            _testData_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Datos de prueba del DTE' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsObject)()];
            __esDecorate(null, null, _dteType_decorators, { kind: "field", name: "dteType", static: false, private: false, access: { has: obj => "dteType" in obj, get: obj => obj.dteType, set: (obj, value) => { obj.dteType = value; } }, metadata: _metadata }, _dteType_initializers, _dteType_extraInitializers);
            __esDecorate(null, null, _testData_decorators, { kind: "field", name: "testData", static: false, private: false, access: { has: obj => "testData" in obj, get: obj => obj.testData, set: (obj, value) => { obj.testData = value; } }, metadata: _metadata }, _testData_initializers, _testData_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        dteType = __runInitializers(this, _dteType_initializers, void 0);
        testData = (__runInitializers(this, _dteType_extraInitializers), __runInitializers(this, _testData_initializers, void 0));
        constructor() {
            __runInitializers(this, _testData_extraInitializers);
        }
    };
})();
exports.ExecuteTestDto = ExecuteTestDto;
let ExecuteEventTestDto = (() => {
    let _eventType_decorators;
    let _eventType_initializers = [];
    let _eventType_extraInitializers = [];
    let _relatedDteId_decorators;
    let _relatedDteId_initializers = [];
    let _relatedDteId_extraInitializers = [];
    let _eventData_decorators;
    let _eventData_initializers = [];
    let _eventData_extraInitializers = [];
    return class ExecuteEventTestDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _eventType_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Tipo de evento a probar',
                    enum: ['ANULACION', 'CONTINGENCIA', 'INVALIDACION'],
                }), (0, class_validator_1.IsString)()];
            _relatedDteId_decorators = [(0, swagger_1.ApiProperty)({ description: 'ID del DTE relacionado (si aplica)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _eventData_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Datos adicionales del evento' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsObject)()];
            __esDecorate(null, null, _eventType_decorators, { kind: "field", name: "eventType", static: false, private: false, access: { has: obj => "eventType" in obj, get: obj => obj.eventType, set: (obj, value) => { obj.eventType = value; } }, metadata: _metadata }, _eventType_initializers, _eventType_extraInitializers);
            __esDecorate(null, null, _relatedDteId_decorators, { kind: "field", name: "relatedDteId", static: false, private: false, access: { has: obj => "relatedDteId" in obj, get: obj => obj.relatedDteId, set: (obj, value) => { obj.relatedDteId = value; } }, metadata: _metadata }, _relatedDteId_initializers, _relatedDteId_extraInitializers);
            __esDecorate(null, null, _eventData_decorators, { kind: "field", name: "eventData", static: false, private: false, access: { has: obj => "eventData" in obj, get: obj => obj.eventData, set: (obj, value) => { obj.eventData = value; } }, metadata: _metadata }, _eventData_initializers, _eventData_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        eventType = __runInitializers(this, _eventType_initializers, void 0);
        relatedDteId = (__runInitializers(this, _eventType_extraInitializers), __runInitializers(this, _relatedDteId_initializers, void 0));
        eventData = (__runInitializers(this, _relatedDteId_extraInitializers), __runInitializers(this, _eventData_initializers, void 0));
        constructor() {
            __runInitializers(this, _eventData_extraInitializers);
        }
    };
})();
exports.ExecuteEventTestDto = ExecuteEventTestDto;
// Response DTOs
class TestResultDto {
    success;
    dteType;
    eventType;
    message;
    responseCode;
    selloRecibido;
    codigoGeneracion;
    errors;
    timestamp;
}
exports.TestResultDto = TestResultDto;
class TestProgressSummaryDto {
    totalTestsRequired;
    totalTestsCompleted;
    percentComplete;
    dteProgress;
    eventProgress;
    canRequestAuthorization;
    lastTestAt;
    lastTestResult;
}
exports.TestProgressSummaryDto = TestProgressSummaryDto;
