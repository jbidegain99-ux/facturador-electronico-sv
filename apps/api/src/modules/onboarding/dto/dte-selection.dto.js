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
exports.DteTypeStatusDto = exports.SetDteTypesDto = exports.DteTypeSelectionItemDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const onboarding_types_1 = require("../types/onboarding.types");
let DteTypeSelectionItemDto = (() => {
    let _dteType_decorators;
    let _dteType_initializers = [];
    let _dteType_extraInitializers = [];
    let _isRequired_decorators;
    let _isRequired_initializers = [];
    let _isRequired_extraInitializers = [];
    return class DteTypeSelectionItemDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _dteType_decorators = [(0, swagger_1.ApiProperty)({
                    enum: onboarding_types_1.DteType,
                    description: 'Tipo de DTE',
                }), (0, class_validator_1.IsEnum)(onboarding_types_1.DteType)];
            _isRequired_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Si es requerido por el negocio' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _dteType_decorators, { kind: "field", name: "dteType", static: false, private: false, access: { has: obj => "dteType" in obj, get: obj => obj.dteType, set: (obj, value) => { obj.dteType = value; } }, metadata: _metadata }, _dteType_initializers, _dteType_extraInitializers);
            __esDecorate(null, null, _isRequired_decorators, { kind: "field", name: "isRequired", static: false, private: false, access: { has: obj => "isRequired" in obj, get: obj => obj.isRequired, set: (obj, value) => { obj.isRequired = value; } }, metadata: _metadata }, _isRequired_initializers, _isRequired_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        dteType = __runInitializers(this, _dteType_initializers, void 0);
        isRequired = (__runInitializers(this, _dteType_extraInitializers), __runInitializers(this, _isRequired_initializers, void 0));
        constructor() {
            __runInitializers(this, _isRequired_extraInitializers);
        }
    };
})();
exports.DteTypeSelectionItemDto = DteTypeSelectionItemDto;
let SetDteTypesDto = (() => {
    let _dteTypes_decorators;
    let _dteTypes_initializers = [];
    let _dteTypes_extraInitializers = [];
    return class SetDteTypesDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _dteTypes_decorators = [(0, swagger_1.ApiProperty)({
                    type: [DteTypeSelectionItemDto],
                    description: 'Lista de tipos de DTE seleccionados',
                }), (0, class_validator_1.IsArray)(), (0, class_validator_1.ArrayNotEmpty)({ message: 'Debe seleccionar al menos un tipo de DTE' })];
            __esDecorate(null, null, _dteTypes_decorators, { kind: "field", name: "dteTypes", static: false, private: false, access: { has: obj => "dteTypes" in obj, get: obj => obj.dteTypes, set: (obj, value) => { obj.dteTypes = value; } }, metadata: _metadata }, _dteTypes_initializers, _dteTypes_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        dteTypes = __runInitializers(this, _dteTypes_initializers, void 0);
        constructor() {
            __runInitializers(this, _dteTypes_extraInitializers);
        }
    };
})();
exports.SetDteTypesDto = SetDteTypesDto;
// Response DTO for DTE types with their status
class DteTypeStatusDto {
    dteType;
    name;
    description;
    isRequired;
    isSelected;
    testCompleted;
    testCompletedAt;
    testsRequired;
    testsCompleted;
}
exports.DteTypeStatusDto = DteTypeStatusDto;
