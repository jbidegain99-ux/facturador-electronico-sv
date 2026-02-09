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
exports.UpdateCompanyInfoDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
let UpdateCompanyInfoDto = (() => {
    let _nit_decorators;
    let _nit_initializers = [];
    let _nit_extraInitializers = [];
    let _nrc_decorators;
    let _nrc_initializers = [];
    let _nrc_extraInitializers = [];
    let _razonSocial_decorators;
    let _razonSocial_initializers = [];
    let _razonSocial_extraInitializers = [];
    let _nombreComercial_decorators;
    let _nombreComercial_initializers = [];
    let _nombreComercial_extraInitializers = [];
    let _actividadEconomica_decorators;
    let _actividadEconomica_initializers = [];
    let _actividadEconomica_extraInitializers = [];
    let _emailHacienda_decorators;
    let _emailHacienda_initializers = [];
    let _emailHacienda_extraInitializers = [];
    let _telefonoHacienda_decorators;
    let _telefonoHacienda_initializers = [];
    let _telefonoHacienda_extraInitializers = [];
    return class UpdateCompanyInfoDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _nit_decorators = [(0, swagger_1.ApiProperty)({ description: 'NIT del contribuyente', example: '0614-123456-123-0' }), (0, class_validator_1.IsString)(), (0, class_validator_1.Matches)(/^\d{4}-\d{6}-\d{3}-\d$/, { message: 'NIT debe tener formato 0000-000000-000-0' })];
            _nrc_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'NRC del contribuyente', example: '123456-7' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Matches)(/^\d{1,7}-\d$/, { message: 'NRC debe tener formato 0000000-0' })];
            _razonSocial_decorators = [(0, swagger_1.ApiProperty)({ description: 'Razón social' }), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 250)];
            _nombreComercial_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Nombre comercial' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 250)];
            _actividadEconomica_decorators = [(0, swagger_1.ApiProperty)({ description: 'Código de actividad económica' }), (0, class_validator_1.IsString)()];
            _emailHacienda_decorators = [(0, swagger_1.ApiProperty)({ description: 'Email registrado en Hacienda' }), (0, class_validator_1.IsEmail)()];
            _telefonoHacienda_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Teléfono registrado en Hacienda' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _nit_decorators, { kind: "field", name: "nit", static: false, private: false, access: { has: obj => "nit" in obj, get: obj => obj.nit, set: (obj, value) => { obj.nit = value; } }, metadata: _metadata }, _nit_initializers, _nit_extraInitializers);
            __esDecorate(null, null, _nrc_decorators, { kind: "field", name: "nrc", static: false, private: false, access: { has: obj => "nrc" in obj, get: obj => obj.nrc, set: (obj, value) => { obj.nrc = value; } }, metadata: _metadata }, _nrc_initializers, _nrc_extraInitializers);
            __esDecorate(null, null, _razonSocial_decorators, { kind: "field", name: "razonSocial", static: false, private: false, access: { has: obj => "razonSocial" in obj, get: obj => obj.razonSocial, set: (obj, value) => { obj.razonSocial = value; } }, metadata: _metadata }, _razonSocial_initializers, _razonSocial_extraInitializers);
            __esDecorate(null, null, _nombreComercial_decorators, { kind: "field", name: "nombreComercial", static: false, private: false, access: { has: obj => "nombreComercial" in obj, get: obj => obj.nombreComercial, set: (obj, value) => { obj.nombreComercial = value; } }, metadata: _metadata }, _nombreComercial_initializers, _nombreComercial_extraInitializers);
            __esDecorate(null, null, _actividadEconomica_decorators, { kind: "field", name: "actividadEconomica", static: false, private: false, access: { has: obj => "actividadEconomica" in obj, get: obj => obj.actividadEconomica, set: (obj, value) => { obj.actividadEconomica = value; } }, metadata: _metadata }, _actividadEconomica_initializers, _actividadEconomica_extraInitializers);
            __esDecorate(null, null, _emailHacienda_decorators, { kind: "field", name: "emailHacienda", static: false, private: false, access: { has: obj => "emailHacienda" in obj, get: obj => obj.emailHacienda, set: (obj, value) => { obj.emailHacienda = value; } }, metadata: _metadata }, _emailHacienda_initializers, _emailHacienda_extraInitializers);
            __esDecorate(null, null, _telefonoHacienda_decorators, { kind: "field", name: "telefonoHacienda", static: false, private: false, access: { has: obj => "telefonoHacienda" in obj, get: obj => obj.telefonoHacienda, set: (obj, value) => { obj.telefonoHacienda = value; } }, metadata: _metadata }, _telefonoHacienda_initializers, _telefonoHacienda_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        nit = __runInitializers(this, _nit_initializers, void 0);
        nrc = (__runInitializers(this, _nit_extraInitializers), __runInitializers(this, _nrc_initializers, void 0));
        razonSocial = (__runInitializers(this, _nrc_extraInitializers), __runInitializers(this, _razonSocial_initializers, void 0));
        nombreComercial = (__runInitializers(this, _razonSocial_extraInitializers), __runInitializers(this, _nombreComercial_initializers, void 0));
        actividadEconomica = (__runInitializers(this, _nombreComercial_extraInitializers), __runInitializers(this, _actividadEconomica_initializers, void 0));
        emailHacienda = (__runInitializers(this, _actividadEconomica_extraInitializers), __runInitializers(this, _emailHacienda_initializers, void 0));
        telefonoHacienda = (__runInitializers(this, _emailHacienda_extraInitializers), __runInitializers(this, _telefonoHacienda_initializers, void 0));
        constructor() {
            __runInitializers(this, _telefonoHacienda_extraInitializers);
        }
    };
})();
exports.UpdateCompanyInfoDto = UpdateCompanyInfoDto;
