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
exports.ImportClientesDto = exports.ImportClienteItem = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
let ImportClienteItem = (() => {
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
    return class ImportClienteItem {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _tipoDocumento_decorators = [(0, swagger_1.ApiProperty)({ description: 'Tipo de documento (36=NIT, 13=DUI, etc.)' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _numDocumento_decorators = [(0, swagger_1.ApiProperty)({ description: 'Numero de documento' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _nombre_decorators = [(0, swagger_1.ApiProperty)({ description: 'Nombre o razon social' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _nrc_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'NRC del cliente' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _correo_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Correo electronico' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _telefono_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Telefono' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _direccion_decorators = [(0, swagger_1.ApiProperty)({ description: 'Direccion' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            __esDecorate(null, null, _tipoDocumento_decorators, { kind: "field", name: "tipoDocumento", static: false, private: false, access: { has: obj => "tipoDocumento" in obj, get: obj => obj.tipoDocumento, set: (obj, value) => { obj.tipoDocumento = value; } }, metadata: _metadata }, _tipoDocumento_initializers, _tipoDocumento_extraInitializers);
            __esDecorate(null, null, _numDocumento_decorators, { kind: "field", name: "numDocumento", static: false, private: false, access: { has: obj => "numDocumento" in obj, get: obj => obj.numDocumento, set: (obj, value) => { obj.numDocumento = value; } }, metadata: _metadata }, _numDocumento_initializers, _numDocumento_extraInitializers);
            __esDecorate(null, null, _nombre_decorators, { kind: "field", name: "nombre", static: false, private: false, access: { has: obj => "nombre" in obj, get: obj => obj.nombre, set: (obj, value) => { obj.nombre = value; } }, metadata: _metadata }, _nombre_initializers, _nombre_extraInitializers);
            __esDecorate(null, null, _nrc_decorators, { kind: "field", name: "nrc", static: false, private: false, access: { has: obj => "nrc" in obj, get: obj => obj.nrc, set: (obj, value) => { obj.nrc = value; } }, metadata: _metadata }, _nrc_initializers, _nrc_extraInitializers);
            __esDecorate(null, null, _correo_decorators, { kind: "field", name: "correo", static: false, private: false, access: { has: obj => "correo" in obj, get: obj => obj.correo, set: (obj, value) => { obj.correo = value; } }, metadata: _metadata }, _correo_initializers, _correo_extraInitializers);
            __esDecorate(null, null, _telefono_decorators, { kind: "field", name: "telefono", static: false, private: false, access: { has: obj => "telefono" in obj, get: obj => obj.telefono, set: (obj, value) => { obj.telefono = value; } }, metadata: _metadata }, _telefono_initializers, _telefono_extraInitializers);
            __esDecorate(null, null, _direccion_decorators, { kind: "field", name: "direccion", static: false, private: false, access: { has: obj => "direccion" in obj, get: obj => obj.direccion, set: (obj, value) => { obj.direccion = value; } }, metadata: _metadata }, _direccion_initializers, _direccion_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        tipoDocumento = __runInitializers(this, _tipoDocumento_initializers, void 0);
        numDocumento = (__runInitializers(this, _tipoDocumento_extraInitializers), __runInitializers(this, _numDocumento_initializers, void 0));
        nombre = (__runInitializers(this, _numDocumento_extraInitializers), __runInitializers(this, _nombre_initializers, void 0));
        nrc = (__runInitializers(this, _nombre_extraInitializers), __runInitializers(this, _nrc_initializers, void 0));
        correo = (__runInitializers(this, _nrc_extraInitializers), __runInitializers(this, _correo_initializers, void 0));
        telefono = (__runInitializers(this, _correo_extraInitializers), __runInitializers(this, _telefono_initializers, void 0));
        direccion = (__runInitializers(this, _telefono_extraInitializers), __runInitializers(this, _direccion_initializers, void 0));
        constructor() {
            __runInitializers(this, _direccion_extraInitializers);
        }
    };
})();
exports.ImportClienteItem = ImportClienteItem;
let ImportClientesDto = (() => {
    let _clientes_decorators;
    let _clientes_initializers = [];
    let _clientes_extraInitializers = [];
    let _fileName_decorators;
    let _fileName_initializers = [];
    let _fileName_extraInitializers = [];
    return class ImportClientesDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _clientes_decorators = [(0, swagger_1.ApiProperty)({ type: [ImportClienteItem], description: 'Lista de clientes a importar' }), (0, class_validator_1.IsArray)(), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(() => ImportClienteItem)];
            _fileName_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Nombre del archivo de origen' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _clientes_decorators, { kind: "field", name: "clientes", static: false, private: false, access: { has: obj => "clientes" in obj, get: obj => obj.clientes, set: (obj, value) => { obj.clientes = value; } }, metadata: _metadata }, _clientes_initializers, _clientes_extraInitializers);
            __esDecorate(null, null, _fileName_decorators, { kind: "field", name: "fileName", static: false, private: false, access: { has: obj => "fileName" in obj, get: obj => obj.fileName, set: (obj, value) => { obj.fileName = value; } }, metadata: _metadata }, _fileName_initializers, _fileName_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        clientes = __runInitializers(this, _clientes_initializers, void 0);
        fileName = (__runInitializers(this, _clientes_extraInitializers), __runInitializers(this, _fileName_initializers, void 0));
        constructor() {
            __runInitializers(this, _fileName_extraInitializers);
        }
    };
})();
exports.ImportClientesDto = ImportClientesDto;
