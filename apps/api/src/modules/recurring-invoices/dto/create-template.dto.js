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
exports.CreateTemplateDto = exports.TemplateItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
let TemplateItemDto = (() => {
    let _descripcion_decorators;
    let _descripcion_initializers = [];
    let _descripcion_extraInitializers = [];
    let _cantidad_decorators;
    let _cantidad_initializers = [];
    let _cantidad_extraInitializers = [];
    let _precioUnitario_decorators;
    let _precioUnitario_initializers = [];
    let _precioUnitario_extraInitializers = [];
    let _descuento_decorators;
    let _descuento_initializers = [];
    let _descuento_extraInitializers = [];
    return class TemplateItemDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _descripcion_decorators = [(0, class_validator_1.IsString)()];
            _cantidad_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0.01)];
            _precioUnitario_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0)];
            _descuento_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0)];
            __esDecorate(null, null, _descripcion_decorators, { kind: "field", name: "descripcion", static: false, private: false, access: { has: obj => "descripcion" in obj, get: obj => obj.descripcion, set: (obj, value) => { obj.descripcion = value; } }, metadata: _metadata }, _descripcion_initializers, _descripcion_extraInitializers);
            __esDecorate(null, null, _cantidad_decorators, { kind: "field", name: "cantidad", static: false, private: false, access: { has: obj => "cantidad" in obj, get: obj => obj.cantidad, set: (obj, value) => { obj.cantidad = value; } }, metadata: _metadata }, _cantidad_initializers, _cantidad_extraInitializers);
            __esDecorate(null, null, _precioUnitario_decorators, { kind: "field", name: "precioUnitario", static: false, private: false, access: { has: obj => "precioUnitario" in obj, get: obj => obj.precioUnitario, set: (obj, value) => { obj.precioUnitario = value; } }, metadata: _metadata }, _precioUnitario_initializers, _precioUnitario_extraInitializers);
            __esDecorate(null, null, _descuento_decorators, { kind: "field", name: "descuento", static: false, private: false, access: { has: obj => "descuento" in obj, get: obj => obj.descuento, set: (obj, value) => { obj.descuento = value; } }, metadata: _metadata }, _descuento_initializers, _descuento_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        descripcion = __runInitializers(this, _descripcion_initializers, void 0);
        cantidad = (__runInitializers(this, _descripcion_extraInitializers), __runInitializers(this, _cantidad_initializers, void 0));
        precioUnitario = (__runInitializers(this, _cantidad_extraInitializers), __runInitializers(this, _precioUnitario_initializers, void 0));
        descuento = (__runInitializers(this, _precioUnitario_extraInitializers), __runInitializers(this, _descuento_initializers, 0));
        constructor() {
            __runInitializers(this, _descuento_extraInitializers);
        }
    };
})();
exports.TemplateItemDto = TemplateItemDto;
let CreateTemplateDto = (() => {
    let _nombre_decorators;
    let _nombre_initializers = [];
    let _nombre_extraInitializers = [];
    let _descripcion_decorators;
    let _descripcion_initializers = [];
    let _descripcion_extraInitializers = [];
    let _clienteId_decorators;
    let _clienteId_initializers = [];
    let _clienteId_extraInitializers = [];
    let _tipoDte_decorators;
    let _tipoDte_initializers = [];
    let _tipoDte_extraInitializers = [];
    let _interval_decorators;
    let _interval_initializers = [];
    let _interval_extraInitializers = [];
    let _anchorDay_decorators;
    let _anchorDay_initializers = [];
    let _anchorDay_extraInitializers = [];
    let _dayOfWeek_decorators;
    let _dayOfWeek_initializers = [];
    let _dayOfWeek_extraInitializers = [];
    let _mode_decorators;
    let _mode_initializers = [];
    let _mode_extraInitializers = [];
    let _autoTransmit_decorators;
    let _autoTransmit_initializers = [];
    let _autoTransmit_extraInitializers = [];
    let _items_decorators;
    let _items_initializers = [];
    let _items_extraInitializers = [];
    let _notas_decorators;
    let _notas_initializers = [];
    let _notas_extraInitializers = [];
    let _startDate_decorators;
    let _startDate_initializers = [];
    let _startDate_extraInitializers = [];
    let _endDate_decorators;
    let _endDate_initializers = [];
    let _endDate_extraInitializers = [];
    return class CreateTemplateDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _nombre_decorators = [(0, class_validator_1.IsString)()];
            _descripcion_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _clienteId_decorators = [(0, class_validator_1.IsString)()];
            _tipoDte_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['01', '03'])];
            _interval_decorators = [(0, class_validator_1.IsIn)(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])];
            _anchorDay_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(31)];
            _dayOfWeek_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(6)];
            _mode_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['AUTO_DRAFT', 'AUTO_SEND'])];
            _autoTransmit_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _items_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(() => TemplateItemDto)];
            _notas_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _startDate_decorators = [(0, class_validator_1.IsDateString)()];
            _endDate_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)()];
            __esDecorate(null, null, _nombre_decorators, { kind: "field", name: "nombre", static: false, private: false, access: { has: obj => "nombre" in obj, get: obj => obj.nombre, set: (obj, value) => { obj.nombre = value; } }, metadata: _metadata }, _nombre_initializers, _nombre_extraInitializers);
            __esDecorate(null, null, _descripcion_decorators, { kind: "field", name: "descripcion", static: false, private: false, access: { has: obj => "descripcion" in obj, get: obj => obj.descripcion, set: (obj, value) => { obj.descripcion = value; } }, metadata: _metadata }, _descripcion_initializers, _descripcion_extraInitializers);
            __esDecorate(null, null, _clienteId_decorators, { kind: "field", name: "clienteId", static: false, private: false, access: { has: obj => "clienteId" in obj, get: obj => obj.clienteId, set: (obj, value) => { obj.clienteId = value; } }, metadata: _metadata }, _clienteId_initializers, _clienteId_extraInitializers);
            __esDecorate(null, null, _tipoDte_decorators, { kind: "field", name: "tipoDte", static: false, private: false, access: { has: obj => "tipoDte" in obj, get: obj => obj.tipoDte, set: (obj, value) => { obj.tipoDte = value; } }, metadata: _metadata }, _tipoDte_initializers, _tipoDte_extraInitializers);
            __esDecorate(null, null, _interval_decorators, { kind: "field", name: "interval", static: false, private: false, access: { has: obj => "interval" in obj, get: obj => obj.interval, set: (obj, value) => { obj.interval = value; } }, metadata: _metadata }, _interval_initializers, _interval_extraInitializers);
            __esDecorate(null, null, _anchorDay_decorators, { kind: "field", name: "anchorDay", static: false, private: false, access: { has: obj => "anchorDay" in obj, get: obj => obj.anchorDay, set: (obj, value) => { obj.anchorDay = value; } }, metadata: _metadata }, _anchorDay_initializers, _anchorDay_extraInitializers);
            __esDecorate(null, null, _dayOfWeek_decorators, { kind: "field", name: "dayOfWeek", static: false, private: false, access: { has: obj => "dayOfWeek" in obj, get: obj => obj.dayOfWeek, set: (obj, value) => { obj.dayOfWeek = value; } }, metadata: _metadata }, _dayOfWeek_initializers, _dayOfWeek_extraInitializers);
            __esDecorate(null, null, _mode_decorators, { kind: "field", name: "mode", static: false, private: false, access: { has: obj => "mode" in obj, get: obj => obj.mode, set: (obj, value) => { obj.mode = value; } }, metadata: _metadata }, _mode_initializers, _mode_extraInitializers);
            __esDecorate(null, null, _autoTransmit_decorators, { kind: "field", name: "autoTransmit", static: false, private: false, access: { has: obj => "autoTransmit" in obj, get: obj => obj.autoTransmit, set: (obj, value) => { obj.autoTransmit = value; } }, metadata: _metadata }, _autoTransmit_initializers, _autoTransmit_extraInitializers);
            __esDecorate(null, null, _items_decorators, { kind: "field", name: "items", static: false, private: false, access: { has: obj => "items" in obj, get: obj => obj.items, set: (obj, value) => { obj.items = value; } }, metadata: _metadata }, _items_initializers, _items_extraInitializers);
            __esDecorate(null, null, _notas_decorators, { kind: "field", name: "notas", static: false, private: false, access: { has: obj => "notas" in obj, get: obj => obj.notas, set: (obj, value) => { obj.notas = value; } }, metadata: _metadata }, _notas_initializers, _notas_extraInitializers);
            __esDecorate(null, null, _startDate_decorators, { kind: "field", name: "startDate", static: false, private: false, access: { has: obj => "startDate" in obj, get: obj => obj.startDate, set: (obj, value) => { obj.startDate = value; } }, metadata: _metadata }, _startDate_initializers, _startDate_extraInitializers);
            __esDecorate(null, null, _endDate_decorators, { kind: "field", name: "endDate", static: false, private: false, access: { has: obj => "endDate" in obj, get: obj => obj.endDate, set: (obj, value) => { obj.endDate = value; } }, metadata: _metadata }, _endDate_initializers, _endDate_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        nombre = __runInitializers(this, _nombre_initializers, void 0);
        descripcion = (__runInitializers(this, _nombre_extraInitializers), __runInitializers(this, _descripcion_initializers, void 0));
        clienteId = (__runInitializers(this, _descripcion_extraInitializers), __runInitializers(this, _clienteId_initializers, void 0));
        tipoDte = (__runInitializers(this, _clienteId_extraInitializers), __runInitializers(this, _tipoDte_initializers, '01'));
        interval = (__runInitializers(this, _tipoDte_extraInitializers), __runInitializers(this, _interval_initializers, void 0));
        anchorDay = (__runInitializers(this, _interval_extraInitializers), __runInitializers(this, _anchorDay_initializers, void 0));
        dayOfWeek = (__runInitializers(this, _anchorDay_extraInitializers), __runInitializers(this, _dayOfWeek_initializers, void 0));
        mode = (__runInitializers(this, _dayOfWeek_extraInitializers), __runInitializers(this, _mode_initializers, 'AUTO_DRAFT'));
        autoTransmit = (__runInitializers(this, _mode_extraInitializers), __runInitializers(this, _autoTransmit_initializers, false));
        items = (__runInitializers(this, _autoTransmit_extraInitializers), __runInitializers(this, _items_initializers, void 0));
        notas = (__runInitializers(this, _items_extraInitializers), __runInitializers(this, _notas_initializers, void 0));
        startDate = (__runInitializers(this, _notas_extraInitializers), __runInitializers(this, _startDate_initializers, void 0));
        endDate = (__runInitializers(this, _startDate_extraInitializers), __runInitializers(this, _endDate_initializers, void 0));
        constructor() {
            __runInitializers(this, _endDate_extraInitializers);
        }
    };
})();
exports.CreateTemplateDto = CreateTemplateDto;
