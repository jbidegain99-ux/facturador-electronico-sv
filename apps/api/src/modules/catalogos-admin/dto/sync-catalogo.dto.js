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
exports.UpdateCatalogoDto = exports.CreateCatalogoDto = exports.SyncCatalogoDto = exports.CatalogoItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
let CatalogoItemDto = (() => {
    let _codigo_decorators;
    let _codigo_initializers = [];
    let _codigo_extraInitializers = [];
    let _valor_decorators;
    let _valor_initializers = [];
    let _valor_extraInitializers = [];
    let _descripcion_decorators;
    let _descripcion_initializers = [];
    let _descripcion_extraInitializers = [];
    let _parentCodigo_decorators;
    let _parentCodigo_initializers = [];
    let _parentCodigo_extraInitializers = [];
    let _orden_decorators;
    let _orden_initializers = [];
    let _orden_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    return class CatalogoItemDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _codigo_decorators = [(0, swagger_1.ApiProperty)({ description: 'Codigo del item' }), (0, class_validator_1.IsString)()];
            _valor_decorators = [(0, swagger_1.ApiProperty)({ description: 'Valor/nombre del item' }), (0, class_validator_1.IsString)()];
            _descripcion_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Descripcion del item' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _parentCodigo_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Codigo del padre (para municipios)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _orden_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Orden de visualizacion' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)()];
            _metadata_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Metadatos adicionales en JSON' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _codigo_decorators, { kind: "field", name: "codigo", static: false, private: false, access: { has: obj => "codigo" in obj, get: obj => obj.codigo, set: (obj, value) => { obj.codigo = value; } }, metadata: _metadata }, _codigo_initializers, _codigo_extraInitializers);
            __esDecorate(null, null, _valor_decorators, { kind: "field", name: "valor", static: false, private: false, access: { has: obj => "valor" in obj, get: obj => obj.valor, set: (obj, value) => { obj.valor = value; } }, metadata: _metadata }, _valor_initializers, _valor_extraInitializers);
            __esDecorate(null, null, _descripcion_decorators, { kind: "field", name: "descripcion", static: false, private: false, access: { has: obj => "descripcion" in obj, get: obj => obj.descripcion, set: (obj, value) => { obj.descripcion = value; } }, metadata: _metadata }, _descripcion_initializers, _descripcion_extraInitializers);
            __esDecorate(null, null, _parentCodigo_decorators, { kind: "field", name: "parentCodigo", static: false, private: false, access: { has: obj => "parentCodigo" in obj, get: obj => obj.parentCodigo, set: (obj, value) => { obj.parentCodigo = value; } }, metadata: _metadata }, _parentCodigo_initializers, _parentCodigo_extraInitializers);
            __esDecorate(null, null, _orden_decorators, { kind: "field", name: "orden", static: false, private: false, access: { has: obj => "orden" in obj, get: obj => obj.orden, set: (obj, value) => { obj.orden = value; } }, metadata: _metadata }, _orden_initializers, _orden_extraInitializers);
            __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        codigo = __runInitializers(this, _codigo_initializers, void 0);
        valor = (__runInitializers(this, _codigo_extraInitializers), __runInitializers(this, _valor_initializers, void 0));
        descripcion = (__runInitializers(this, _valor_extraInitializers), __runInitializers(this, _descripcion_initializers, void 0));
        parentCodigo = (__runInitializers(this, _descripcion_extraInitializers), __runInitializers(this, _parentCodigo_initializers, void 0));
        orden = (__runInitializers(this, _parentCodigo_extraInitializers), __runInitializers(this, _orden_initializers, void 0));
        metadata = (__runInitializers(this, _orden_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
        constructor() {
            __runInitializers(this, _metadata_extraInitializers);
        }
    };
})();
exports.CatalogoItemDto = CatalogoItemDto;
let SyncCatalogoDto = (() => {
    let _items_decorators;
    let _items_initializers = [];
    let _items_extraInitializers = [];
    let _version_decorators;
    let _version_initializers = [];
    let _version_extraInitializers = [];
    return class SyncCatalogoDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _items_decorators = [(0, swagger_1.ApiProperty)({ type: [CatalogoItemDto], description: 'Lista de items a sincronizar' }), (0, class_validator_1.IsArray)(), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(() => CatalogoItemDto)];
            _version_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Version del catalogo' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _items_decorators, { kind: "field", name: "items", static: false, private: false, access: { has: obj => "items" in obj, get: obj => obj.items, set: (obj, value) => { obj.items = value; } }, metadata: _metadata }, _items_initializers, _items_extraInitializers);
            __esDecorate(null, null, _version_decorators, { kind: "field", name: "version", static: false, private: false, access: { has: obj => "version" in obj, get: obj => obj.version, set: (obj, value) => { obj.version = value; } }, metadata: _metadata }, _version_initializers, _version_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        items = __runInitializers(this, _items_initializers, void 0);
        version = (__runInitializers(this, _items_extraInitializers), __runInitializers(this, _version_initializers, void 0));
        constructor() {
            __runInitializers(this, _version_extraInitializers);
        }
    };
})();
exports.SyncCatalogoDto = SyncCatalogoDto;
let CreateCatalogoDto = (() => {
    let _codigo_decorators;
    let _codigo_initializers = [];
    let _codigo_extraInitializers = [];
    let _nombre_decorators;
    let _nombre_initializers = [];
    let _nombre_extraInitializers = [];
    let _descripcion_decorators;
    let _descripcion_initializers = [];
    let _descripcion_extraInitializers = [];
    return class CreateCatalogoDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _codigo_decorators = [(0, swagger_1.ApiProperty)({ description: 'Codigo del catalogo (ej: CAT-002)' }), (0, class_validator_1.IsString)()];
            _nombre_decorators = [(0, swagger_1.ApiProperty)({ description: 'Nombre del catalogo' }), (0, class_validator_1.IsString)()];
            _descripcion_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Descripcion del catalogo' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _codigo_decorators, { kind: "field", name: "codigo", static: false, private: false, access: { has: obj => "codigo" in obj, get: obj => obj.codigo, set: (obj, value) => { obj.codigo = value; } }, metadata: _metadata }, _codigo_initializers, _codigo_extraInitializers);
            __esDecorate(null, null, _nombre_decorators, { kind: "field", name: "nombre", static: false, private: false, access: { has: obj => "nombre" in obj, get: obj => obj.nombre, set: (obj, value) => { obj.nombre = value; } }, metadata: _metadata }, _nombre_initializers, _nombre_extraInitializers);
            __esDecorate(null, null, _descripcion_decorators, { kind: "field", name: "descripcion", static: false, private: false, access: { has: obj => "descripcion" in obj, get: obj => obj.descripcion, set: (obj, value) => { obj.descripcion = value; } }, metadata: _metadata }, _descripcion_initializers, _descripcion_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        codigo = __runInitializers(this, _codigo_initializers, void 0);
        nombre = (__runInitializers(this, _codigo_extraInitializers), __runInitializers(this, _nombre_initializers, void 0));
        descripcion = (__runInitializers(this, _nombre_extraInitializers), __runInitializers(this, _descripcion_initializers, void 0));
        constructor() {
            __runInitializers(this, _descripcion_extraInitializers);
        }
    };
})();
exports.CreateCatalogoDto = CreateCatalogoDto;
let UpdateCatalogoDto = (() => {
    let _nombre_decorators;
    let _nombre_initializers = [];
    let _nombre_extraInitializers = [];
    let _descripcion_decorators;
    let _descripcion_initializers = [];
    let _descripcion_extraInitializers = [];
    let _version_decorators;
    let _version_initializers = [];
    let _version_extraInitializers = [];
    let _isActive_decorators;
    let _isActive_initializers = [];
    let _isActive_extraInitializers = [];
    return class UpdateCatalogoDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _nombre_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Nombre del catalogo' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _descripcion_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Descripcion del catalogo' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _version_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Version del catalogo' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _isActive_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Estado activo' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _nombre_decorators, { kind: "field", name: "nombre", static: false, private: false, access: { has: obj => "nombre" in obj, get: obj => obj.nombre, set: (obj, value) => { obj.nombre = value; } }, metadata: _metadata }, _nombre_initializers, _nombre_extraInitializers);
            __esDecorate(null, null, _descripcion_decorators, { kind: "field", name: "descripcion", static: false, private: false, access: { has: obj => "descripcion" in obj, get: obj => obj.descripcion, set: (obj, value) => { obj.descripcion = value; } }, metadata: _metadata }, _descripcion_initializers, _descripcion_extraInitializers);
            __esDecorate(null, null, _version_decorators, { kind: "field", name: "version", static: false, private: false, access: { has: obj => "version" in obj, get: obj => obj.version, set: (obj, value) => { obj.version = value; } }, metadata: _metadata }, _version_initializers, _version_extraInitializers);
            __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: obj => "isActive" in obj, get: obj => obj.isActive, set: (obj, value) => { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        nombre = __runInitializers(this, _nombre_initializers, void 0);
        descripcion = (__runInitializers(this, _nombre_extraInitializers), __runInitializers(this, _descripcion_initializers, void 0));
        version = (__runInitializers(this, _descripcion_extraInitializers), __runInitializers(this, _version_initializers, void 0));
        isActive = (__runInitializers(this, _version_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
        constructor() {
            __runInitializers(this, _isActive_extraInitializers);
        }
    };
})();
exports.UpdateCatalogoDto = UpdateCatalogoDto;
