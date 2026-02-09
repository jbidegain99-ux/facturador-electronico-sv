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
exports.CreateClienteDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
let DireccionClienteDto = (() => {
    let _departamento_decorators;
    let _departamento_initializers = [];
    let _departamento_extraInitializers = [];
    let _municipio_decorators;
    let _municipio_initializers = [];
    let _municipio_extraInitializers = [];
    let _complemento_decorators;
    let _complemento_initializers = [];
    let _complemento_extraInitializers = [];
    return class DireccionClienteDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _departamento_decorators = [(0, swagger_1.ApiProperty)({ example: '06' }), (0, class_validator_1.IsString)()];
            _municipio_decorators = [(0, swagger_1.ApiProperty)({ example: '14' }), (0, class_validator_1.IsString)()];
            _complemento_decorators = [(0, swagger_1.ApiProperty)({ example: 'Colonia Centro, Calle Principal #456' }), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _departamento_decorators, { kind: "field", name: "departamento", static: false, private: false, access: { has: obj => "departamento" in obj, get: obj => obj.departamento, set: (obj, value) => { obj.departamento = value; } }, metadata: _metadata }, _departamento_initializers, _departamento_extraInitializers);
            __esDecorate(null, null, _municipio_decorators, { kind: "field", name: "municipio", static: false, private: false, access: { has: obj => "municipio" in obj, get: obj => obj.municipio, set: (obj, value) => { obj.municipio = value; } }, metadata: _metadata }, _municipio_initializers, _municipio_extraInitializers);
            __esDecorate(null, null, _complemento_decorators, { kind: "field", name: "complemento", static: false, private: false, access: { has: obj => "complemento" in obj, get: obj => obj.complemento, set: (obj, value) => { obj.complemento = value; } }, metadata: _metadata }, _complemento_initializers, _complemento_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        departamento = __runInitializers(this, _departamento_initializers, void 0);
        municipio = (__runInitializers(this, _departamento_extraInitializers), __runInitializers(this, _municipio_initializers, void 0));
        complemento = (__runInitializers(this, _municipio_extraInitializers), __runInitializers(this, _complemento_initializers, void 0));
        constructor() {
            __runInitializers(this, _complemento_extraInitializers);
        }
    };
})();
let CreateClienteDto = (() => {
    let _tipoDocumento_decorators;
    let _tipoDocumento_initializers = [];
    let _tipoDocumento_extraInitializers = [];
    let _numDocumento_decorators;
    let _numDocumento_initializers = [];
    let _numDocumento_extraInitializers = [];
    let _nombre_decorators;
    let _nombre_initializers = [];
    let _nombre_extraInitializers = [];
    let _nrc_decorators;
    let _nrc_initializers = [];
    let _nrc_extraInitializers = [];
    let _correo_decorators;
    let _correo_initializers = [];
    let _correo_extraInitializers = [];
    let _telefono_decorators;
    let _telefono_initializers = [];
    let _telefono_extraInitializers = [];
    let _direccion_decorators;
    let _direccion_initializers = [];
    let _direccion_extraInitializers = [];
    let _actividadEcon_decorators;
    let _actividadEcon_initializers = [];
    let _actividadEcon_extraInitializers = [];
    let _descActividad_decorators;
    let _descActividad_initializers = [];
    let _descActividad_extraInitializers = [];
    return class CreateClienteDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _tipoDocumento_decorators = [(0, swagger_1.ApiProperty)({ example: '36', description: 'Tipo de documento: 36=NIT, 13=DUI, etc.' }), (0, class_validator_1.IsString)()];
            _numDocumento_decorators = [(0, swagger_1.ApiProperty)({ example: '06141234567890' }), (0, class_validator_1.IsString)()];
            _nombre_decorators = [(0, swagger_1.ApiProperty)({ example: 'Cliente Ejemplo S.A. de C.V.' }), (0, class_validator_1.IsString)()];
            _nrc_decorators = [(0, swagger_1.ApiProperty)({ example: '1234567', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _correo_decorators = [(0, swagger_1.ApiProperty)({ example: 'cliente@ejemplo.com', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEmail)()];
            _telefono_decorators = [(0, swagger_1.ApiProperty)({ example: '22001234', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _direccion_decorators = [(0, swagger_1.ApiProperty)({ required: true }), (0, class_validator_1.IsObject)(), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(() => DireccionClienteDto)];
            _actividadEcon_decorators = [(0, swagger_1.ApiProperty)({ example: '46510', required: false, description: 'Codigo de actividad economica' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _descActividad_decorators = [(0, swagger_1.ApiProperty)({ example: 'Venta al por menor', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _tipoDocumento_decorators, { kind: "field", name: "tipoDocumento", static: false, private: false, access: { has: obj => "tipoDocumento" in obj, get: obj => obj.tipoDocumento, set: (obj, value) => { obj.tipoDocumento = value; } }, metadata: _metadata }, _tipoDocumento_initializers, _tipoDocumento_extraInitializers);
            __esDecorate(null, null, _numDocumento_decorators, { kind: "field", name: "numDocumento", static: false, private: false, access: { has: obj => "numDocumento" in obj, get: obj => obj.numDocumento, set: (obj, value) => { obj.numDocumento = value; } }, metadata: _metadata }, _numDocumento_initializers, _numDocumento_extraInitializers);
            __esDecorate(null, null, _nombre_decorators, { kind: "field", name: "nombre", static: false, private: false, access: { has: obj => "nombre" in obj, get: obj => obj.nombre, set: (obj, value) => { obj.nombre = value; } }, metadata: _metadata }, _nombre_initializers, _nombre_extraInitializers);
            __esDecorate(null, null, _nrc_decorators, { kind: "field", name: "nrc", static: false, private: false, access: { has: obj => "nrc" in obj, get: obj => obj.nrc, set: (obj, value) => { obj.nrc = value; } }, metadata: _metadata }, _nrc_initializers, _nrc_extraInitializers);
            __esDecorate(null, null, _correo_decorators, { kind: "field", name: "correo", static: false, private: false, access: { has: obj => "correo" in obj, get: obj => obj.correo, set: (obj, value) => { obj.correo = value; } }, metadata: _metadata }, _correo_initializers, _correo_extraInitializers);
            __esDecorate(null, null, _telefono_decorators, { kind: "field", name: "telefono", static: false, private: false, access: { has: obj => "telefono" in obj, get: obj => obj.telefono, set: (obj, value) => { obj.telefono = value; } }, metadata: _metadata }, _telefono_initializers, _telefono_extraInitializers);
            __esDecorate(null, null, _direccion_decorators, { kind: "field", name: "direccion", static: false, private: false, access: { has: obj => "direccion" in obj, get: obj => obj.direccion, set: (obj, value) => { obj.direccion = value; } }, metadata: _metadata }, _direccion_initializers, _direccion_extraInitializers);
            __esDecorate(null, null, _actividadEcon_decorators, { kind: "field", name: "actividadEcon", static: false, private: false, access: { has: obj => "actividadEcon" in obj, get: obj => obj.actividadEcon, set: (obj, value) => { obj.actividadEcon = value; } }, metadata: _metadata }, _actividadEcon_initializers, _actividadEcon_extraInitializers);
            __esDecorate(null, null, _descActividad_decorators, { kind: "field", name: "descActividad", static: false, private: false, access: { has: obj => "descActividad" in obj, get: obj => obj.descActividad, set: (obj, value) => { obj.descActividad = value; } }, metadata: _metadata }, _descActividad_initializers, _descActividad_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        tipoDocumento = __runInitializers(this, _tipoDocumento_initializers, void 0);
        numDocumento = (__runInitializers(this, _tipoDocumento_extraInitializers), __runInitializers(this, _numDocumento_initializers, void 0));
        nombre = (__runInitializers(this, _numDocumento_extraInitializers), __runInitializers(this, _nombre_initializers, void 0));
        nrc = (__runInitializers(this, _nombre_extraInitializers), __runInitializers(this, _nrc_initializers, void 0));
        correo = (__runInitializers(this, _nrc_extraInitializers), __runInitializers(this, _correo_initializers, void 0));
        telefono = (__runInitializers(this, _correo_extraInitializers), __runInitializers(this, _telefono_initializers, void 0));
        direccion = (__runInitializers(this, _telefono_extraInitializers), __runInitializers(this, _direccion_initializers, void 0));
        actividadEcon = (__runInitializers(this, _direccion_extraInitializers), __runInitializers(this, _actividadEcon_initializers, void 0));
        descActividad = (__runInitializers(this, _actividadEcon_extraInitializers), __runInitializers(this, _descActividad_initializers, void 0));
        constructor() {
            __runInitializers(this, _descActividad_extraInitializers);
        }
    };
})();
exports.CreateClienteDto = CreateClienteDto;
