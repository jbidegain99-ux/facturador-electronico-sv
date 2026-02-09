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
exports.CreateTenantDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
let CreateTenantDto = (() => {
    let _nombre_decorators;
    let _nombre_initializers = [];
    let _nombre_extraInitializers = [];
    let _nit_decorators;
    let _nit_initializers = [];
    let _nit_extraInitializers = [];
    let _nrc_decorators;
    let _nrc_initializers = [];
    let _nrc_extraInitializers = [];
    let _actividadEcon_decorators;
    let _actividadEcon_initializers = [];
    let _actividadEcon_extraInitializers = [];
    let _direccion_decorators;
    let _direccion_initializers = [];
    let _direccion_extraInitializers = [];
    let _telefono_decorators;
    let _telefono_initializers = [];
    let _telefono_extraInitializers = [];
    let _correo_decorators;
    let _correo_initializers = [];
    let _correo_extraInitializers = [];
    let _nombreComercial_decorators;
    let _nombreComercial_initializers = [];
    let _nombreComercial_extraInitializers = [];
    return class CreateTenantDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _nombre_decorators = [(0, swagger_1.ApiProperty)({ example: 'Mi Empresa S.A. de C.V.' }), (0, class_validator_1.IsString)()];
            _nit_decorators = [(0, swagger_1.ApiProperty)({ example: '06141234567890' }), (0, class_validator_1.IsString)()];
            _nrc_decorators = [(0, swagger_1.ApiProperty)({ example: '1234567' }), (0, class_validator_1.IsString)()];
            _actividadEcon_decorators = [(0, swagger_1.ApiProperty)({ example: '46510' }), (0, class_validator_1.IsString)()];
            _direccion_decorators = [(0, swagger_1.ApiProperty)({
                    example: {
                        departamento: '06',
                        municipio: '14',
                        complemento: 'Colonia Escalon, Calle Principal #123',
                    },
                }), (0, class_validator_1.IsObject)()];
            _telefono_decorators = [(0, swagger_1.ApiProperty)({ example: '22001234' }), (0, class_validator_1.IsString)()];
            _correo_decorators = [(0, swagger_1.ApiProperty)({ example: 'empresa@ejemplo.com' }), (0, class_validator_1.IsEmail)()];
            _nombreComercial_decorators = [(0, swagger_1.ApiProperty)({ example: 'Mi Tienda', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _nombre_decorators, { kind: "field", name: "nombre", static: false, private: false, access: { has: obj => "nombre" in obj, get: obj => obj.nombre, set: (obj, value) => { obj.nombre = value; } }, metadata: _metadata }, _nombre_initializers, _nombre_extraInitializers);
            __esDecorate(null, null, _nit_decorators, { kind: "field", name: "nit", static: false, private: false, access: { has: obj => "nit" in obj, get: obj => obj.nit, set: (obj, value) => { obj.nit = value; } }, metadata: _metadata }, _nit_initializers, _nit_extraInitializers);
            __esDecorate(null, null, _nrc_decorators, { kind: "field", name: "nrc", static: false, private: false, access: { has: obj => "nrc" in obj, get: obj => obj.nrc, set: (obj, value) => { obj.nrc = value; } }, metadata: _metadata }, _nrc_initializers, _nrc_extraInitializers);
            __esDecorate(null, null, _actividadEcon_decorators, { kind: "field", name: "actividadEcon", static: false, private: false, access: { has: obj => "actividadEcon" in obj, get: obj => obj.actividadEcon, set: (obj, value) => { obj.actividadEcon = value; } }, metadata: _metadata }, _actividadEcon_initializers, _actividadEcon_extraInitializers);
            __esDecorate(null, null, _direccion_decorators, { kind: "field", name: "direccion", static: false, private: false, access: { has: obj => "direccion" in obj, get: obj => obj.direccion, set: (obj, value) => { obj.direccion = value; } }, metadata: _metadata }, _direccion_initializers, _direccion_extraInitializers);
            __esDecorate(null, null, _telefono_decorators, { kind: "field", name: "telefono", static: false, private: false, access: { has: obj => "telefono" in obj, get: obj => obj.telefono, set: (obj, value) => { obj.telefono = value; } }, metadata: _metadata }, _telefono_initializers, _telefono_extraInitializers);
            __esDecorate(null, null, _correo_decorators, { kind: "field", name: "correo", static: false, private: false, access: { has: obj => "correo" in obj, get: obj => obj.correo, set: (obj, value) => { obj.correo = value; } }, metadata: _metadata }, _correo_initializers, _correo_extraInitializers);
            __esDecorate(null, null, _nombreComercial_decorators, { kind: "field", name: "nombreComercial", static: false, private: false, access: { has: obj => "nombreComercial" in obj, get: obj => obj.nombreComercial, set: (obj, value) => { obj.nombreComercial = value; } }, metadata: _metadata }, _nombreComercial_initializers, _nombreComercial_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        nombre = __runInitializers(this, _nombre_initializers, void 0);
        nit = (__runInitializers(this, _nombre_extraInitializers), __runInitializers(this, _nit_initializers, void 0));
        nrc = (__runInitializers(this, _nit_extraInitializers), __runInitializers(this, _nrc_initializers, void 0));
        actividadEcon = (__runInitializers(this, _nrc_extraInitializers), __runInitializers(this, _actividadEcon_initializers, void 0));
        direccion = (__runInitializers(this, _actividadEcon_extraInitializers), __runInitializers(this, _direccion_initializers, void 0));
        telefono = (__runInitializers(this, _direccion_extraInitializers), __runInitializers(this, _telefono_initializers, void 0));
        correo = (__runInitializers(this, _telefono_extraInitializers), __runInitializers(this, _correo_initializers, void 0));
        nombreComercial = (__runInitializers(this, _correo_extraInitializers), __runInitializers(this, _nombreComercial_initializers, void 0));
        constructor() {
            __runInitializers(this, _nombreComercial_extraInitializers);
        }
    };
})();
exports.CreateTenantDto = CreateTenantDto;
