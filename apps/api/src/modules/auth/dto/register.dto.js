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
exports.RegisterDto = exports.UserRegistroDto = exports.TenantRegistroDto = exports.DireccionDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
let DireccionDto = (() => {
    let _departamento_decorators;
    let _departamento_initializers = [];
    let _departamento_extraInitializers = [];
    let _municipio_decorators;
    let _municipio_initializers = [];
    let _municipio_extraInitializers = [];
    let _complemento_decorators;
    let _complemento_initializers = [];
    let _complemento_extraInitializers = [];
    return class DireccionDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _departamento_decorators = [(0, swagger_1.ApiProperty)({ example: '06', description: 'Codigo de departamento' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _municipio_decorators = [(0, swagger_1.ApiProperty)({ example: '14', description: 'Codigo de municipio' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _complemento_decorators = [(0, swagger_1.ApiProperty)({ example: 'Calle Principal #123, Colonia Centro' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(500, { message: 'La direccion no puede exceder 500 caracteres' })];
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
exports.DireccionDto = DireccionDto;
let TenantRegistroDto = (() => {
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
    let _descActividad_decorators;
    let _descActividad_initializers = [];
    let _descActividad_extraInitializers = [];
    let _telefono_decorators;
    let _telefono_initializers = [];
    let _telefono_extraInitializers = [];
    let _correo_decorators;
    let _correo_initializers = [];
    let _correo_extraInitializers = [];
    let _nombreComercial_decorators;
    let _nombreComercial_initializers = [];
    let _nombreComercial_extraInitializers = [];
    let _direccion_decorators;
    let _direccion_initializers = [];
    let _direccion_extraInitializers = [];
    return class TenantRegistroDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _nombre_decorators = [(0, swagger_1.ApiProperty)({ example: 'Mi Empresa S.A. de C.V.' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(200, { message: 'El nombre no puede exceder 200 caracteres' })];
            _nit_decorators = [(0, swagger_1.ApiProperty)({ example: '0614-123456-123-4' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(17, { message: 'El NIT no puede exceder 17 caracteres' }), (0, class_validator_1.Matches)(/^\d{4}-\d{6}-\d{3}-\d$/, { message: 'El NIT debe tener el formato 0000-000000-000-0' })];
            _nrc_decorators = [(0, swagger_1.ApiProperty)({ example: '123456-7' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(9, { message: 'El NRC no puede exceder 9 caracteres' }), (0, class_validator_1.Matches)(/^\d{1,6}-\d$/, { message: 'El NRC debe tener el formato 000000-0' })];
            _actividadEcon_decorators = [(0, swagger_1.ApiProperty)({ example: '62011', description: 'Codigo de actividad economica' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _descActividad_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Actividades de programacion informatica' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _telefono_decorators = [(0, swagger_1.ApiProperty)({ example: '2222-3333' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(20, { message: 'El telefono no puede exceder 20 caracteres' }), (0, class_validator_1.Matches)(/^\d{4}-\d{4}$/, { message: 'El telefono debe tener el formato 0000-0000' })];
            _correo_decorators = [(0, swagger_1.ApiProperty)({ example: 'empresa@ejemplo.com' }), (0, class_validator_1.IsEmail)({}, { message: 'El correo de la empresa debe ser un email valido' }), (0, class_validator_1.MaxLength)(100, { message: 'El correo no puede exceder 100 caracteres' })];
            _nombreComercial_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Mi Empresa' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.MaxLength)(200, { message: 'El nombre comercial no puede exceder 200 caracteres' })];
            _direccion_decorators = [(0, swagger_1.ApiProperty)({ type: DireccionDto }), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(() => DireccionDto)];
            __esDecorate(null, null, _nombre_decorators, { kind: "field", name: "nombre", static: false, private: false, access: { has: obj => "nombre" in obj, get: obj => obj.nombre, set: (obj, value) => { obj.nombre = value; } }, metadata: _metadata }, _nombre_initializers, _nombre_extraInitializers);
            __esDecorate(null, null, _nit_decorators, { kind: "field", name: "nit", static: false, private: false, access: { has: obj => "nit" in obj, get: obj => obj.nit, set: (obj, value) => { obj.nit = value; } }, metadata: _metadata }, _nit_initializers, _nit_extraInitializers);
            __esDecorate(null, null, _nrc_decorators, { kind: "field", name: "nrc", static: false, private: false, access: { has: obj => "nrc" in obj, get: obj => obj.nrc, set: (obj, value) => { obj.nrc = value; } }, metadata: _metadata }, _nrc_initializers, _nrc_extraInitializers);
            __esDecorate(null, null, _actividadEcon_decorators, { kind: "field", name: "actividadEcon", static: false, private: false, access: { has: obj => "actividadEcon" in obj, get: obj => obj.actividadEcon, set: (obj, value) => { obj.actividadEcon = value; } }, metadata: _metadata }, _actividadEcon_initializers, _actividadEcon_extraInitializers);
            __esDecorate(null, null, _descActividad_decorators, { kind: "field", name: "descActividad", static: false, private: false, access: { has: obj => "descActividad" in obj, get: obj => obj.descActividad, set: (obj, value) => { obj.descActividad = value; } }, metadata: _metadata }, _descActividad_initializers, _descActividad_extraInitializers);
            __esDecorate(null, null, _telefono_decorators, { kind: "field", name: "telefono", static: false, private: false, access: { has: obj => "telefono" in obj, get: obj => obj.telefono, set: (obj, value) => { obj.telefono = value; } }, metadata: _metadata }, _telefono_initializers, _telefono_extraInitializers);
            __esDecorate(null, null, _correo_decorators, { kind: "field", name: "correo", static: false, private: false, access: { has: obj => "correo" in obj, get: obj => obj.correo, set: (obj, value) => { obj.correo = value; } }, metadata: _metadata }, _correo_initializers, _correo_extraInitializers);
            __esDecorate(null, null, _nombreComercial_decorators, { kind: "field", name: "nombreComercial", static: false, private: false, access: { has: obj => "nombreComercial" in obj, get: obj => obj.nombreComercial, set: (obj, value) => { obj.nombreComercial = value; } }, metadata: _metadata }, _nombreComercial_initializers, _nombreComercial_extraInitializers);
            __esDecorate(null, null, _direccion_decorators, { kind: "field", name: "direccion", static: false, private: false, access: { has: obj => "direccion" in obj, get: obj => obj.direccion, set: (obj, value) => { obj.direccion = value; } }, metadata: _metadata }, _direccion_initializers, _direccion_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        nombre = __runInitializers(this, _nombre_initializers, void 0);
        nit = (__runInitializers(this, _nombre_extraInitializers), __runInitializers(this, _nit_initializers, void 0));
        nrc = (__runInitializers(this, _nit_extraInitializers), __runInitializers(this, _nrc_initializers, void 0));
        actividadEcon = (__runInitializers(this, _nrc_extraInitializers), __runInitializers(this, _actividadEcon_initializers, void 0));
        descActividad = (__runInitializers(this, _actividadEcon_extraInitializers), __runInitializers(this, _descActividad_initializers, void 0));
        telefono = (__runInitializers(this, _descActividad_extraInitializers), __runInitializers(this, _telefono_initializers, void 0));
        correo = (__runInitializers(this, _telefono_extraInitializers), __runInitializers(this, _correo_initializers, void 0));
        nombreComercial = (__runInitializers(this, _correo_extraInitializers), __runInitializers(this, _nombreComercial_initializers, void 0));
        direccion = (__runInitializers(this, _nombreComercial_extraInitializers), __runInitializers(this, _direccion_initializers, void 0));
        constructor() {
            __runInitializers(this, _direccion_extraInitializers);
        }
    };
})();
exports.TenantRegistroDto = TenantRegistroDto;
let UserRegistroDto = (() => {
    let _nombre_decorators;
    let _nombre_initializers = [];
    let _nombre_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _password_decorators;
    let _password_initializers = [];
    let _password_extraInitializers = [];
    return class UserRegistroDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _nombre_decorators = [(0, swagger_1.ApiProperty)({ example: 'Juan Perez' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(200, { message: 'El nombre no puede exceder 200 caracteres' })];
            _email_decorators = [(0, swagger_1.ApiProperty)({ example: 'admin@empresa.com' }), (0, class_validator_1.IsEmail)({}, { message: 'El correo del administrador debe ser un email valido' }), (0, class_validator_1.MaxLength)(100, { message: 'El correo no puede exceder 100 caracteres' })];
            _password_decorators = [(0, swagger_1.ApiProperty)({ example: 'password123', minLength: 8 }), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(8, { message: 'La contrasena debe tener al menos 8 caracteres' }), (0, class_validator_1.MaxLength)(128, { message: 'La contrasena no puede exceder 128 caracteres' })];
            __esDecorate(null, null, _nombre_decorators, { kind: "field", name: "nombre", static: false, private: false, access: { has: obj => "nombre" in obj, get: obj => obj.nombre, set: (obj, value) => { obj.nombre = value; } }, metadata: _metadata }, _nombre_initializers, _nombre_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: obj => "password" in obj, get: obj => obj.password, set: (obj, value) => { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        nombre = __runInitializers(this, _nombre_initializers, void 0);
        email = (__runInitializers(this, _nombre_extraInitializers), __runInitializers(this, _email_initializers, void 0));
        password = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _password_initializers, void 0));
        constructor() {
            __runInitializers(this, _password_extraInitializers);
        }
    };
})();
exports.UserRegistroDto = UserRegistroDto;
let RegisterDto = (() => {
    let _tenant_decorators;
    let _tenant_initializers = [];
    let _tenant_extraInitializers = [];
    let _user_decorators;
    let _user_initializers = [];
    let _user_extraInitializers = [];
    return class RegisterDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _tenant_decorators = [(0, swagger_1.ApiProperty)({ type: TenantRegistroDto }), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(() => TenantRegistroDto)];
            _user_decorators = [(0, swagger_1.ApiProperty)({ type: UserRegistroDto }), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(() => UserRegistroDto)];
            __esDecorate(null, null, _tenant_decorators, { kind: "field", name: "tenant", static: false, private: false, access: { has: obj => "tenant" in obj, get: obj => obj.tenant, set: (obj, value) => { obj.tenant = value; } }, metadata: _metadata }, _tenant_initializers, _tenant_extraInitializers);
            __esDecorate(null, null, _user_decorators, { kind: "field", name: "user", static: false, private: false, access: { has: obj => "user" in obj, get: obj => obj.user, set: (obj, value) => { obj.user = value; } }, metadata: _metadata }, _user_initializers, _user_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        tenant = __runInitializers(this, _tenant_initializers, void 0);
        user = (__runInitializers(this, _tenant_extraInitializers), __runInitializers(this, _user_initializers, void 0));
        constructor() {
            __runInitializers(this, _user_extraInitializers);
        }
    };
})();
exports.RegisterDto = RegisterDto;
