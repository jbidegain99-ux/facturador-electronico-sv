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
exports.AssignPlanDto = exports.UpdatePlanDto = exports.CreatePlanDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
let CreatePlanDto = (() => {
    let _codigo_decorators;
    let _codigo_initializers = [];
    let _codigo_extraInitializers = [];
    let _nombre_decorators;
    let _nombre_initializers = [];
    let _nombre_extraInitializers = [];
    let _descripcion_decorators;
    let _descripcion_initializers = [];
    let _descripcion_extraInitializers = [];
    let _maxDtesPerMonth_decorators;
    let _maxDtesPerMonth_initializers = [];
    let _maxDtesPerMonth_extraInitializers = [];
    let _maxUsers_decorators;
    let _maxUsers_initializers = [];
    let _maxUsers_extraInitializers = [];
    let _maxClientes_decorators;
    let _maxClientes_initializers = [];
    let _maxClientes_extraInitializers = [];
    let _maxStorageMb_decorators;
    let _maxStorageMb_initializers = [];
    let _maxStorageMb_extraInitializers = [];
    let _features_decorators;
    let _features_initializers = [];
    let _features_extraInitializers = [];
    let _precioMensual_decorators;
    let _precioMensual_initializers = [];
    let _precioMensual_extraInitializers = [];
    let _precioAnual_decorators;
    let _precioAnual_initializers = [];
    let _precioAnual_extraInitializers = [];
    let _orden_decorators;
    let _orden_initializers = [];
    let _orden_extraInitializers = [];
    let _isDefault_decorators;
    let _isDefault_initializers = [];
    let _isDefault_extraInitializers = [];
    return class CreatePlanDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _codigo_decorators = [(0, swagger_1.ApiProperty)({ description: 'Codigo unico del plan (ej: BASIC, PRO)' }), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(50)];
            _nombre_decorators = [(0, swagger_1.ApiProperty)({ description: 'Nombre del plan' }), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(100)];
            _descripcion_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Descripcion del plan' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(500)];
            _maxDtesPerMonth_decorators = [(0, swagger_1.ApiProperty)({ description: 'DTEs por mes (-1 para ilimitado)', default: 100 }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(-1)];
            _maxUsers_decorators = [(0, swagger_1.ApiProperty)({ description: 'Usuarios maximos (-1 para ilimitado)', default: 1 }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(-1)];
            _maxClientes_decorators = [(0, swagger_1.ApiProperty)({ description: 'Clientes maximos (-1 para ilimitado)', default: 100 }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(-1)];
            _maxStorageMb_decorators = [(0, swagger_1.ApiProperty)({ description: 'Almacenamiento en MB (-1 para ilimitado)', default: 500 }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(-1)];
            _features_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Features habilitados (JSON array)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _precioMensual_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Precio mensual' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0)];
            _precioAnual_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Precio anual' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0)];
            _orden_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Orden de visualizacion' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0)];
            _isDefault_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Es el plan por defecto', default: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _codigo_decorators, { kind: "field", name: "codigo", static: false, private: false, access: { has: obj => "codigo" in obj, get: obj => obj.codigo, set: (obj, value) => { obj.codigo = value; } }, metadata: _metadata }, _codigo_initializers, _codigo_extraInitializers);
            __esDecorate(null, null, _nombre_decorators, { kind: "field", name: "nombre", static: false, private: false, access: { has: obj => "nombre" in obj, get: obj => obj.nombre, set: (obj, value) => { obj.nombre = value; } }, metadata: _metadata }, _nombre_initializers, _nombre_extraInitializers);
            __esDecorate(null, null, _descripcion_decorators, { kind: "field", name: "descripcion", static: false, private: false, access: { has: obj => "descripcion" in obj, get: obj => obj.descripcion, set: (obj, value) => { obj.descripcion = value; } }, metadata: _metadata }, _descripcion_initializers, _descripcion_extraInitializers);
            __esDecorate(null, null, _maxDtesPerMonth_decorators, { kind: "field", name: "maxDtesPerMonth", static: false, private: false, access: { has: obj => "maxDtesPerMonth" in obj, get: obj => obj.maxDtesPerMonth, set: (obj, value) => { obj.maxDtesPerMonth = value; } }, metadata: _metadata }, _maxDtesPerMonth_initializers, _maxDtesPerMonth_extraInitializers);
            __esDecorate(null, null, _maxUsers_decorators, { kind: "field", name: "maxUsers", static: false, private: false, access: { has: obj => "maxUsers" in obj, get: obj => obj.maxUsers, set: (obj, value) => { obj.maxUsers = value; } }, metadata: _metadata }, _maxUsers_initializers, _maxUsers_extraInitializers);
            __esDecorate(null, null, _maxClientes_decorators, { kind: "field", name: "maxClientes", static: false, private: false, access: { has: obj => "maxClientes" in obj, get: obj => obj.maxClientes, set: (obj, value) => { obj.maxClientes = value; } }, metadata: _metadata }, _maxClientes_initializers, _maxClientes_extraInitializers);
            __esDecorate(null, null, _maxStorageMb_decorators, { kind: "field", name: "maxStorageMb", static: false, private: false, access: { has: obj => "maxStorageMb" in obj, get: obj => obj.maxStorageMb, set: (obj, value) => { obj.maxStorageMb = value; } }, metadata: _metadata }, _maxStorageMb_initializers, _maxStorageMb_extraInitializers);
            __esDecorate(null, null, _features_decorators, { kind: "field", name: "features", static: false, private: false, access: { has: obj => "features" in obj, get: obj => obj.features, set: (obj, value) => { obj.features = value; } }, metadata: _metadata }, _features_initializers, _features_extraInitializers);
            __esDecorate(null, null, _precioMensual_decorators, { kind: "field", name: "precioMensual", static: false, private: false, access: { has: obj => "precioMensual" in obj, get: obj => obj.precioMensual, set: (obj, value) => { obj.precioMensual = value; } }, metadata: _metadata }, _precioMensual_initializers, _precioMensual_extraInitializers);
            __esDecorate(null, null, _precioAnual_decorators, { kind: "field", name: "precioAnual", static: false, private: false, access: { has: obj => "precioAnual" in obj, get: obj => obj.precioAnual, set: (obj, value) => { obj.precioAnual = value; } }, metadata: _metadata }, _precioAnual_initializers, _precioAnual_extraInitializers);
            __esDecorate(null, null, _orden_decorators, { kind: "field", name: "orden", static: false, private: false, access: { has: obj => "orden" in obj, get: obj => obj.orden, set: (obj, value) => { obj.orden = value; } }, metadata: _metadata }, _orden_initializers, _orden_extraInitializers);
            __esDecorate(null, null, _isDefault_decorators, { kind: "field", name: "isDefault", static: false, private: false, access: { has: obj => "isDefault" in obj, get: obj => obj.isDefault, set: (obj, value) => { obj.isDefault = value; } }, metadata: _metadata }, _isDefault_initializers, _isDefault_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        codigo = __runInitializers(this, _codigo_initializers, void 0);
        nombre = (__runInitializers(this, _codigo_extraInitializers), __runInitializers(this, _nombre_initializers, void 0));
        descripcion = (__runInitializers(this, _nombre_extraInitializers), __runInitializers(this, _descripcion_initializers, void 0));
        maxDtesPerMonth = (__runInitializers(this, _descripcion_extraInitializers), __runInitializers(this, _maxDtesPerMonth_initializers, void 0));
        maxUsers = (__runInitializers(this, _maxDtesPerMonth_extraInitializers), __runInitializers(this, _maxUsers_initializers, void 0));
        maxClientes = (__runInitializers(this, _maxUsers_extraInitializers), __runInitializers(this, _maxClientes_initializers, void 0));
        maxStorageMb = (__runInitializers(this, _maxClientes_extraInitializers), __runInitializers(this, _maxStorageMb_initializers, void 0));
        features = (__runInitializers(this, _maxStorageMb_extraInitializers), __runInitializers(this, _features_initializers, void 0));
        precioMensual = (__runInitializers(this, _features_extraInitializers), __runInitializers(this, _precioMensual_initializers, void 0));
        precioAnual = (__runInitializers(this, _precioMensual_extraInitializers), __runInitializers(this, _precioAnual_initializers, void 0));
        orden = (__runInitializers(this, _precioAnual_extraInitializers), __runInitializers(this, _orden_initializers, void 0));
        isDefault = (__runInitializers(this, _orden_extraInitializers), __runInitializers(this, _isDefault_initializers, void 0));
        constructor() {
            __runInitializers(this, _isDefault_extraInitializers);
        }
    };
})();
exports.CreatePlanDto = CreatePlanDto;
let UpdatePlanDto = (() => {
    let _nombre_decorators;
    let _nombre_initializers = [];
    let _nombre_extraInitializers = [];
    let _descripcion_decorators;
    let _descripcion_initializers = [];
    let _descripcion_extraInitializers = [];
    let _maxDtesPerMonth_decorators;
    let _maxDtesPerMonth_initializers = [];
    let _maxDtesPerMonth_extraInitializers = [];
    let _maxUsers_decorators;
    let _maxUsers_initializers = [];
    let _maxUsers_extraInitializers = [];
    let _maxClientes_decorators;
    let _maxClientes_initializers = [];
    let _maxClientes_extraInitializers = [];
    let _maxStorageMb_decorators;
    let _maxStorageMb_initializers = [];
    let _maxStorageMb_extraInitializers = [];
    let _features_decorators;
    let _features_initializers = [];
    let _features_extraInitializers = [];
    let _precioMensual_decorators;
    let _precioMensual_initializers = [];
    let _precioMensual_extraInitializers = [];
    let _precioAnual_decorators;
    let _precioAnual_initializers = [];
    let _precioAnual_extraInitializers = [];
    let _orden_decorators;
    let _orden_initializers = [];
    let _orden_extraInitializers = [];
    let _isActive_decorators;
    let _isActive_initializers = [];
    let _isActive_extraInitializers = [];
    let _isDefault_decorators;
    let _isDefault_initializers = [];
    let _isDefault_extraInitializers = [];
    return class UpdatePlanDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _nombre_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Nombre del plan' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(100)];
            _descripcion_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Descripcion del plan' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(500)];
            _maxDtesPerMonth_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'DTEs por mes (-1 para ilimitado)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(-1)];
            _maxUsers_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Usuarios maximos (-1 para ilimitado)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(-1)];
            _maxClientes_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Clientes maximos (-1 para ilimitado)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(-1)];
            _maxStorageMb_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Almacenamiento en MB (-1 para ilimitado)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(-1)];
            _features_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Features habilitados (JSON array)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _precioMensual_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Precio mensual' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0)];
            _precioAnual_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Precio anual' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0)];
            _orden_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Orden de visualizacion' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0)];
            _isActive_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Plan activo' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _isDefault_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Es el plan por defecto' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _nombre_decorators, { kind: "field", name: "nombre", static: false, private: false, access: { has: obj => "nombre" in obj, get: obj => obj.nombre, set: (obj, value) => { obj.nombre = value; } }, metadata: _metadata }, _nombre_initializers, _nombre_extraInitializers);
            __esDecorate(null, null, _descripcion_decorators, { kind: "field", name: "descripcion", static: false, private: false, access: { has: obj => "descripcion" in obj, get: obj => obj.descripcion, set: (obj, value) => { obj.descripcion = value; } }, metadata: _metadata }, _descripcion_initializers, _descripcion_extraInitializers);
            __esDecorate(null, null, _maxDtesPerMonth_decorators, { kind: "field", name: "maxDtesPerMonth", static: false, private: false, access: { has: obj => "maxDtesPerMonth" in obj, get: obj => obj.maxDtesPerMonth, set: (obj, value) => { obj.maxDtesPerMonth = value; } }, metadata: _metadata }, _maxDtesPerMonth_initializers, _maxDtesPerMonth_extraInitializers);
            __esDecorate(null, null, _maxUsers_decorators, { kind: "field", name: "maxUsers", static: false, private: false, access: { has: obj => "maxUsers" in obj, get: obj => obj.maxUsers, set: (obj, value) => { obj.maxUsers = value; } }, metadata: _metadata }, _maxUsers_initializers, _maxUsers_extraInitializers);
            __esDecorate(null, null, _maxClientes_decorators, { kind: "field", name: "maxClientes", static: false, private: false, access: { has: obj => "maxClientes" in obj, get: obj => obj.maxClientes, set: (obj, value) => { obj.maxClientes = value; } }, metadata: _metadata }, _maxClientes_initializers, _maxClientes_extraInitializers);
            __esDecorate(null, null, _maxStorageMb_decorators, { kind: "field", name: "maxStorageMb", static: false, private: false, access: { has: obj => "maxStorageMb" in obj, get: obj => obj.maxStorageMb, set: (obj, value) => { obj.maxStorageMb = value; } }, metadata: _metadata }, _maxStorageMb_initializers, _maxStorageMb_extraInitializers);
            __esDecorate(null, null, _features_decorators, { kind: "field", name: "features", static: false, private: false, access: { has: obj => "features" in obj, get: obj => obj.features, set: (obj, value) => { obj.features = value; } }, metadata: _metadata }, _features_initializers, _features_extraInitializers);
            __esDecorate(null, null, _precioMensual_decorators, { kind: "field", name: "precioMensual", static: false, private: false, access: { has: obj => "precioMensual" in obj, get: obj => obj.precioMensual, set: (obj, value) => { obj.precioMensual = value; } }, metadata: _metadata }, _precioMensual_initializers, _precioMensual_extraInitializers);
            __esDecorate(null, null, _precioAnual_decorators, { kind: "field", name: "precioAnual", static: false, private: false, access: { has: obj => "precioAnual" in obj, get: obj => obj.precioAnual, set: (obj, value) => { obj.precioAnual = value; } }, metadata: _metadata }, _precioAnual_initializers, _precioAnual_extraInitializers);
            __esDecorate(null, null, _orden_decorators, { kind: "field", name: "orden", static: false, private: false, access: { has: obj => "orden" in obj, get: obj => obj.orden, set: (obj, value) => { obj.orden = value; } }, metadata: _metadata }, _orden_initializers, _orden_extraInitializers);
            __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: obj => "isActive" in obj, get: obj => obj.isActive, set: (obj, value) => { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
            __esDecorate(null, null, _isDefault_decorators, { kind: "field", name: "isDefault", static: false, private: false, access: { has: obj => "isDefault" in obj, get: obj => obj.isDefault, set: (obj, value) => { obj.isDefault = value; } }, metadata: _metadata }, _isDefault_initializers, _isDefault_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        nombre = __runInitializers(this, _nombre_initializers, void 0);
        descripcion = (__runInitializers(this, _nombre_extraInitializers), __runInitializers(this, _descripcion_initializers, void 0));
        maxDtesPerMonth = (__runInitializers(this, _descripcion_extraInitializers), __runInitializers(this, _maxDtesPerMonth_initializers, void 0));
        maxUsers = (__runInitializers(this, _maxDtesPerMonth_extraInitializers), __runInitializers(this, _maxUsers_initializers, void 0));
        maxClientes = (__runInitializers(this, _maxUsers_extraInitializers), __runInitializers(this, _maxClientes_initializers, void 0));
        maxStorageMb = (__runInitializers(this, _maxClientes_extraInitializers), __runInitializers(this, _maxStorageMb_initializers, void 0));
        features = (__runInitializers(this, _maxStorageMb_extraInitializers), __runInitializers(this, _features_initializers, void 0));
        precioMensual = (__runInitializers(this, _features_extraInitializers), __runInitializers(this, _precioMensual_initializers, void 0));
        precioAnual = (__runInitializers(this, _precioMensual_extraInitializers), __runInitializers(this, _precioAnual_initializers, void 0));
        orden = (__runInitializers(this, _precioAnual_extraInitializers), __runInitializers(this, _orden_initializers, void 0));
        isActive = (__runInitializers(this, _orden_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
        isDefault = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _isDefault_initializers, void 0));
        constructor() {
            __runInitializers(this, _isDefault_extraInitializers);
        }
    };
})();
exports.UpdatePlanDto = UpdatePlanDto;
let AssignPlanDto = (() => {
    let _planId_decorators;
    let _planId_initializers = [];
    let _planId_extraInitializers = [];
    return class AssignPlanDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _planId_decorators = [(0, swagger_1.ApiProperty)({ description: 'ID del plan a asignar' }), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _planId_decorators, { kind: "field", name: "planId", static: false, private: false, access: { has: obj => "planId" in obj, get: obj => obj.planId, set: (obj, value) => { obj.planId = value; } }, metadata: _metadata }, _planId_initializers, _planId_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        planId = __runInitializers(this, _planId_initializers, void 0);
        constructor() {
            __runInitializers(this, _planId_extraInitializers);
        }
    };
})();
exports.AssignPlanDto = AssignPlanDto;
