"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogosPublicController = exports.CatalogosAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../super-admin/guards/super-admin.guard");
// ============ ADMIN ENDPOINTS ============
let CatalogosAdminController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('admin-catalogos'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('admin/catalogos'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getAllCatalogos_decorators;
    let _createCatalogo_decorators;
    let _seedCatalogos_decorators;
    let _seedDepartamentos_decorators;
    let _getCatalogo_decorators;
    let _updateCatalogo_decorators;
    let _getCatalogoItems_decorators;
    let _syncCatalogo_decorators;
    let _exportCatalogo_decorators;
    var CatalogosAdminController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getAllCatalogos_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Listar todos los catalogos' })];
            _createCatalogo_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({ summary: 'Crear un nuevo catalogo' })];
            _seedCatalogos_decorators = [(0, common_1.Post)('seed'), (0, swagger_1.ApiOperation)({ summary: 'Sembrar catalogos iniciales' })];
            _seedDepartamentos_decorators = [(0, common_1.Post)('seed/departamentos'), (0, swagger_1.ApiOperation)({ summary: 'Sembrar departamentos de El Salvador' })];
            _getCatalogo_decorators = [(0, common_1.Get)(':codigo'), (0, swagger_1.ApiOperation)({ summary: 'Obtener detalle de un catalogo' })];
            _updateCatalogo_decorators = [(0, common_1.Patch)(':codigo'), (0, swagger_1.ApiOperation)({ summary: 'Actualizar un catalogo' })];
            _getCatalogoItems_decorators = [(0, common_1.Get)(':codigo/items'), (0, swagger_1.ApiOperation)({ summary: 'Obtener items de un catalogo' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false }), (0, swagger_1.ApiQuery)({ name: 'search', required: false }), (0, swagger_1.ApiQuery)({ name: 'parentCodigo', required: false })];
            _syncCatalogo_decorators = [(0, common_1.Post)(':codigo/sync'), (0, swagger_1.ApiOperation)({ summary: 'Sincronizar items de un catalogo' })];
            _exportCatalogo_decorators = [(0, common_1.Get)(':codigo/export'), (0, swagger_1.ApiOperation)({ summary: 'Exportar catalogo como JSON' })];
            __esDecorate(this, null, _getAllCatalogos_decorators, { kind: "method", name: "getAllCatalogos", static: false, private: false, access: { has: obj => "getAllCatalogos" in obj, get: obj => obj.getAllCatalogos }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createCatalogo_decorators, { kind: "method", name: "createCatalogo", static: false, private: false, access: { has: obj => "createCatalogo" in obj, get: obj => obj.createCatalogo }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _seedCatalogos_decorators, { kind: "method", name: "seedCatalogos", static: false, private: false, access: { has: obj => "seedCatalogos" in obj, get: obj => obj.seedCatalogos }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _seedDepartamentos_decorators, { kind: "method", name: "seedDepartamentos", static: false, private: false, access: { has: obj => "seedDepartamentos" in obj, get: obj => obj.seedDepartamentos }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getCatalogo_decorators, { kind: "method", name: "getCatalogo", static: false, private: false, access: { has: obj => "getCatalogo" in obj, get: obj => obj.getCatalogo }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateCatalogo_decorators, { kind: "method", name: "updateCatalogo", static: false, private: false, access: { has: obj => "updateCatalogo" in obj, get: obj => obj.updateCatalogo }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getCatalogoItems_decorators, { kind: "method", name: "getCatalogoItems", static: false, private: false, access: { has: obj => "getCatalogoItems" in obj, get: obj => obj.getCatalogoItems }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _syncCatalogo_decorators, { kind: "method", name: "syncCatalogo", static: false, private: false, access: { has: obj => "syncCatalogo" in obj, get: obj => obj.syncCatalogo }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _exportCatalogo_decorators, { kind: "method", name: "exportCatalogo", static: false, private: false, access: { has: obj => "exportCatalogo" in obj, get: obj => obj.exportCatalogo }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CatalogosAdminController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        catalogosService = __runInitializers(this, _instanceExtraInitializers);
        constructor(catalogosService) {
            this.catalogosService = catalogosService;
        }
        getAllCatalogos() {
            return this.catalogosService.getAllCatalogos();
        }
        createCatalogo(data) {
            return this.catalogosService.createCatalogo(data);
        }
        seedCatalogos() {
            return this.catalogosService.seedInitialCatalogos();
        }
        seedDepartamentos() {
            return this.catalogosService.seedDepartamentosYMunicipios();
        }
        getCatalogo(codigo) {
            return this.catalogosService.getCatalogoByCodigo(codigo);
        }
        updateCatalogo(codigo, data) {
            return this.catalogosService.updateCatalogo(codigo, data);
        }
        getCatalogoItems(codigo, page, limit, search, parentCodigo) {
            return this.catalogosService.getCatalogoItems(codigo, {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 50,
                search,
                parentCodigo,
            });
        }
        syncCatalogo(codigo, data) {
            return this.catalogosService.syncCatalogo(codigo, data);
        }
        async exportCatalogo(codigo, res) {
            const data = await this.catalogosService.exportCatalogo(codigo);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=${codigo}.json`);
            return res.send(JSON.stringify(data, null, 2));
        }
    };
    return CatalogosAdminController = _classThis;
})();
exports.CatalogosAdminController = CatalogosAdminController;
// ============ PUBLIC ENDPOINTS (for forms) ============
let CatalogosPublicController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('catalogos'), (0, common_1.Controller)('catalogos')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getPublicItems_decorators;
    var CatalogosPublicController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getPublicItems_decorators = [(0, common_1.Get)(':codigo/items'), (0, swagger_1.ApiOperation)({ summary: 'Obtener items activos de un catalogo (publico)' }), (0, swagger_1.ApiQuery)({ name: 'parentCodigo', required: false })];
            __esDecorate(this, null, _getPublicItems_decorators, { kind: "method", name: "getPublicItems", static: false, private: false, access: { has: obj => "getPublicItems" in obj, get: obj => obj.getPublicItems }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CatalogosPublicController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        catalogosService = __runInitializers(this, _instanceExtraInitializers);
        constructor(catalogosService) {
            this.catalogosService = catalogosService;
        }
        getPublicItems(codigo, parentCodigo) {
            return this.catalogosService.getPublicCatalogoItems(codigo, parentCodigo);
        }
    };
    return CatalogosPublicController = _classThis;
})();
exports.CatalogosPublicController = CatalogosPublicController;
