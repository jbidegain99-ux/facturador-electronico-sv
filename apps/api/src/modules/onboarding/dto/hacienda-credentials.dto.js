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
exports.VerifyHaciendaAccessDto = exports.SetHaciendaCredentialsDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
let SetHaciendaCredentialsDto = (() => {
    let _haciendaUser_decorators;
    let _haciendaUser_initializers = [];
    let _haciendaUser_extraInitializers = [];
    let _haciendaPassword_decorators;
    let _haciendaPassword_initializers = [];
    let _haciendaPassword_extraInitializers = [];
    return class SetHaciendaCredentialsDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _haciendaUser_decorators = [(0, swagger_1.ApiProperty)({ description: 'Usuario de Servicios en Línea MH (generalmente NIT sin guiones)' }), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(14, { message: 'Usuario debe tener al menos 14 caracteres' })];
            _haciendaPassword_decorators = [(0, swagger_1.ApiProperty)({ description: 'Contraseña de Servicios en Línea MH' }), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(6, { message: 'Contraseña debe tener al menos 6 caracteres' })];
            __esDecorate(null, null, _haciendaUser_decorators, { kind: "field", name: "haciendaUser", static: false, private: false, access: { has: obj => "haciendaUser" in obj, get: obj => obj.haciendaUser, set: (obj, value) => { obj.haciendaUser = value; } }, metadata: _metadata }, _haciendaUser_initializers, _haciendaUser_extraInitializers);
            __esDecorate(null, null, _haciendaPassword_decorators, { kind: "field", name: "haciendaPassword", static: false, private: false, access: { has: obj => "haciendaPassword" in obj, get: obj => obj.haciendaPassword, set: (obj, value) => { obj.haciendaPassword = value; } }, metadata: _metadata }, _haciendaPassword_initializers, _haciendaPassword_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        haciendaUser = __runInitializers(this, _haciendaUser_initializers, void 0);
        haciendaPassword = (__runInitializers(this, _haciendaUser_extraInitializers), __runInitializers(this, _haciendaPassword_initializers, void 0));
        constructor() {
            __runInitializers(this, _haciendaPassword_extraInitializers);
        }
    };
})();
exports.SetHaciendaCredentialsDto = SetHaciendaCredentialsDto;
let VerifyHaciendaAccessDto = (() => {
    let _haciendaUser_decorators;
    let _haciendaUser_initializers = [];
    let _haciendaUser_extraInitializers = [];
    let _haciendaPassword_decorators;
    let _haciendaPassword_initializers = [];
    let _haciendaPassword_extraInitializers = [];
    return class VerifyHaciendaAccessDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _haciendaUser_decorators = [(0, swagger_1.ApiProperty)({ description: 'Usuario de Servicios en Línea MH' }), (0, class_validator_1.IsString)()];
            _haciendaPassword_decorators = [(0, swagger_1.ApiProperty)({ description: 'Contraseña de Servicios en Línea MH' }), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _haciendaUser_decorators, { kind: "field", name: "haciendaUser", static: false, private: false, access: { has: obj => "haciendaUser" in obj, get: obj => obj.haciendaUser, set: (obj, value) => { obj.haciendaUser = value; } }, metadata: _metadata }, _haciendaUser_initializers, _haciendaUser_extraInitializers);
            __esDecorate(null, null, _haciendaPassword_decorators, { kind: "field", name: "haciendaPassword", static: false, private: false, access: { has: obj => "haciendaPassword" in obj, get: obj => obj.haciendaPassword, set: (obj, value) => { obj.haciendaPassword = value; } }, metadata: _metadata }, _haciendaPassword_initializers, _haciendaPassword_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        haciendaUser = __runInitializers(this, _haciendaUser_initializers, void 0);
        haciendaPassword = (__runInitializers(this, _haciendaUser_extraInitializers), __runInitializers(this, _haciendaPassword_initializers, void 0));
        constructor() {
            __runInitializers(this, _haciendaPassword_extraInitializers);
        }
    };
})();
exports.VerifyHaciendaAccessDto = VerifyHaciendaAccessDto;
