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
exports.SuperAdminController = exports.SuperAdminBootstrapController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const super_admin_guard_1 = require("./guards/super-admin.guard");
// Bootstrap controller - no authentication required
let SuperAdminBootstrapController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('super-admin'), (0, common_1.Controller)('super-admin')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _checkBootstrapStatus_decorators;
    let _bootstrapSuperAdmin_decorators;
    var SuperAdminBootstrapController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _checkBootstrapStatus_decorators = [(0, common_1.Get)('bootstrap/status'), (0, swagger_1.ApiOperation)({ summary: 'Check if a Super Admin exists' })];
            _bootstrapSuperAdmin_decorators = [(0, common_1.Post)('bootstrap'), (0, swagger_1.ApiOperation)({ summary: 'Create the first Super Admin (only works if none exists)' })];
            __esDecorate(this, null, _checkBootstrapStatus_decorators, { kind: "method", name: "checkBootstrapStatus", static: false, private: false, access: { has: obj => "checkBootstrapStatus" in obj, get: obj => obj.checkBootstrapStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _bootstrapSuperAdmin_decorators, { kind: "method", name: "bootstrapSuperAdmin", static: false, private: false, access: { has: obj => "bootstrapSuperAdmin" in obj, get: obj => obj.bootstrapSuperAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SuperAdminBootstrapController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        superAdminService = __runInitializers(this, _instanceExtraInitializers);
        constructor(superAdminService) {
            this.superAdminService = superAdminService;
        }
        async checkBootstrapStatus() {
            const hasAdmin = await this.superAdminService.hasSuperAdmin();
            return { hasAdmin, canBootstrap: !hasAdmin };
        }
        async bootstrapSuperAdmin(data) {
            return this.superAdminService.bootstrapSuperAdmin(data);
        }
    };
    return SuperAdminBootstrapController = _classThis;
})();
exports.SuperAdminBootstrapController = SuperAdminBootstrapController;
// Main controller - requires SUPER_ADMIN authentication
let SuperAdminController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('super-admin'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('super-admin'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getDashboardStats_decorators;
    let _getRecentActivity_decorators;
    let _getAllTenants_decorators;
    let _getTenantById_decorators;
    let _updateTenantPlan_decorators;
    let _suspendTenant_decorators;
    let _activateTenant_decorators;
    let _deleteTenant_decorators;
    let _getAllSuperAdmins_decorators;
    let _createSuperAdmin_decorators;
    var SuperAdminController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getDashboardStats_decorators = [(0, common_1.Get)('dashboard'), (0, swagger_1.ApiOperation)({ summary: 'Obtener estadisticas del dashboard' })];
            _getRecentActivity_decorators = [(0, common_1.Get)('activity'), (0, swagger_1.ApiOperation)({ summary: 'Obtener actividad reciente' })];
            _getAllTenants_decorators = [(0, common_1.Get)('tenants'), (0, swagger_1.ApiOperation)({ summary: 'Listar todas las empresas' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false }), (0, swagger_1.ApiQuery)({ name: 'search', required: false }), (0, swagger_1.ApiQuery)({ name: 'plan', required: false }), (0, swagger_1.ApiQuery)({ name: 'status', required: false })];
            _getTenantById_decorators = [(0, common_1.Get)('tenants/:id'), (0, swagger_1.ApiOperation)({ summary: 'Obtener detalle de una empresa' })];
            _updateTenantPlan_decorators = [(0, common_1.Put)('tenants/:id'), (0, swagger_1.ApiOperation)({ summary: 'Actualizar plan/configuracion de empresa' })];
            _suspendTenant_decorators = [(0, common_1.Post)('tenants/:id/suspend'), (0, swagger_1.ApiOperation)({ summary: 'Suspender una empresa' })];
            _activateTenant_decorators = [(0, common_1.Post)('tenants/:id/activate'), (0, swagger_1.ApiOperation)({ summary: 'Activar una empresa suspendida' })];
            _deleteTenant_decorators = [(0, common_1.Delete)('tenants/:id'), (0, swagger_1.ApiOperation)({ summary: 'Eliminar una empresa y todos sus datos' })];
            _getAllSuperAdmins_decorators = [(0, common_1.Get)('admins'), (0, swagger_1.ApiOperation)({ summary: 'Listar super administradores' })];
            _createSuperAdmin_decorators = [(0, common_1.Post)('admins'), (0, swagger_1.ApiOperation)({ summary: 'Crear nuevo super administrador' })];
            __esDecorate(this, null, _getDashboardStats_decorators, { kind: "method", name: "getDashboardStats", static: false, private: false, access: { has: obj => "getDashboardStats" in obj, get: obj => obj.getDashboardStats }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getRecentActivity_decorators, { kind: "method", name: "getRecentActivity", static: false, private: false, access: { has: obj => "getRecentActivity" in obj, get: obj => obj.getRecentActivity }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getAllTenants_decorators, { kind: "method", name: "getAllTenants", static: false, private: false, access: { has: obj => "getAllTenants" in obj, get: obj => obj.getAllTenants }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTenantById_decorators, { kind: "method", name: "getTenantById", static: false, private: false, access: { has: obj => "getTenantById" in obj, get: obj => obj.getTenantById }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateTenantPlan_decorators, { kind: "method", name: "updateTenantPlan", static: false, private: false, access: { has: obj => "updateTenantPlan" in obj, get: obj => obj.updateTenantPlan }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _suspendTenant_decorators, { kind: "method", name: "suspendTenant", static: false, private: false, access: { has: obj => "suspendTenant" in obj, get: obj => obj.suspendTenant }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _activateTenant_decorators, { kind: "method", name: "activateTenant", static: false, private: false, access: { has: obj => "activateTenant" in obj, get: obj => obj.activateTenant }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteTenant_decorators, { kind: "method", name: "deleteTenant", static: false, private: false, access: { has: obj => "deleteTenant" in obj, get: obj => obj.deleteTenant }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getAllSuperAdmins_decorators, { kind: "method", name: "getAllSuperAdmins", static: false, private: false, access: { has: obj => "getAllSuperAdmins" in obj, get: obj => obj.getAllSuperAdmins }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createSuperAdmin_decorators, { kind: "method", name: "createSuperAdmin", static: false, private: false, access: { has: obj => "createSuperAdmin" in obj, get: obj => obj.createSuperAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SuperAdminController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        superAdminService = __runInitializers(this, _instanceExtraInitializers);
        constructor(superAdminService) {
            this.superAdminService = superAdminService;
        }
        // ============ DASHBOARD ============
        getDashboardStats() {
            return this.superAdminService.getDashboardStats();
        }
        getRecentActivity(limit) {
            return this.superAdminService.getRecentActivity(limit ? parseInt(limit) : 50);
        }
        // ============ TENANTS ============
        getAllTenants(page, limit, search, plan, status) {
            return this.superAdminService.getAllTenants({
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 10,
                search,
                plan,
                status,
            });
        }
        getTenantById(id) {
            return this.superAdminService.getTenantById(id);
        }
        updateTenantPlan(id, data, user) {
            return this.superAdminService.updateTenantPlan(id, data, user.id, user.email);
        }
        suspendTenant(id, data, user) {
            return this.superAdminService.suspendTenant(id, data.reason, user.id, user.email);
        }
        activateTenant(id, user) {
            return this.superAdminService.activateTenant(id, user.id, user.email);
        }
        deleteTenant(id, user) {
            return this.superAdminService.deleteTenant(id, user.id, user.email);
        }
        // ============ SUPER ADMINS ============
        getAllSuperAdmins() {
            return this.superAdminService.getAllSuperAdmins();
        }
        createSuperAdmin(data, user) {
            return this.superAdminService.createSuperAdmin(data, user.id, user.email);
        }
    };
    return SuperAdminController = _classThis;
})();
exports.SuperAdminController = SuperAdminController;
