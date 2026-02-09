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
exports.PlansController = exports.PlansAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../super-admin/guards/super-admin.guard");
let PlansAdminController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Plans'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('admin/plans'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findAll_decorators;
    let _findActive_decorators;
    let _findOne_decorators;
    let _create_decorators;
    let _update_decorators;
    let _delete_decorators;
    let _seed_decorators;
    let _assignPlan_decorators;
    let _removePlan_decorators;
    let _getTenantUsage_decorators;
    var PlansAdminController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _findAll_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Listar todos los planes con estadísticas' })];
            _findActive_decorators = [(0, common_1.Get)('active'), (0, swagger_1.ApiOperation)({ summary: 'Listar solo planes activos' })];
            _findOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Obtener plan por ID' })];
            _create_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({ summary: 'Crear nuevo plan' })];
            _update_decorators = [(0, common_1.Put)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Actualizar plan' })];
            _delete_decorators = [(0, common_1.Delete)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Eliminar plan' })];
            _seed_decorators = [(0, common_1.Post)('seed'), (0, swagger_1.ApiOperation)({ summary: 'Crear planes por defecto' })];
            _assignPlan_decorators = [(0, common_1.Post)('tenant/:tenantId/assign'), (0, swagger_1.ApiOperation)({ summary: 'Asignar plan a tenant' })];
            _removePlan_decorators = [(0, common_1.Delete)('tenant/:tenantId/plan'), (0, swagger_1.ApiOperation)({ summary: 'Remover plan de tenant' })];
            _getTenantUsage_decorators = [(0, common_1.Get)('tenant/:tenantId/usage'), (0, swagger_1.ApiOperation)({ summary: 'Obtener uso del tenant respecto a su plan' })];
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findActive_decorators, { kind: "method", name: "findActive", static: false, private: false, access: { has: obj => "findActive" in obj, get: obj => obj.findActive }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _delete_decorators, { kind: "method", name: "delete", static: false, private: false, access: { has: obj => "delete" in obj, get: obj => obj.delete }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _seed_decorators, { kind: "method", name: "seed", static: false, private: false, access: { has: obj => "seed" in obj, get: obj => obj.seed }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _assignPlan_decorators, { kind: "method", name: "assignPlan", static: false, private: false, access: { has: obj => "assignPlan" in obj, get: obj => obj.assignPlan }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _removePlan_decorators, { kind: "method", name: "removePlan", static: false, private: false, access: { has: obj => "removePlan" in obj, get: obj => obj.removePlan }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTenantUsage_decorators, { kind: "method", name: "getTenantUsage", static: false, private: false, access: { has: obj => "getTenantUsage" in obj, get: obj => obj.getTenantUsage }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PlansAdminController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        plansService = __runInitializers(this, _instanceExtraInitializers);
        constructor(plansService) {
            this.plansService = plansService;
        }
        async findAll() {
            return this.plansService.getPlansWithStats();
        }
        async findActive() {
            return this.plansService.findActive();
        }
        async findOne(id) {
            return this.plansService.findOne(id);
        }
        async create(dto) {
            return this.plansService.create(dto);
        }
        async update(id, dto) {
            return this.plansService.update(id, dto);
        }
        async delete(id) {
            return this.plansService.delete(id);
        }
        async seed() {
            return this.plansService.seedDefaultPlans();
        }
        async assignPlan(tenantId, dto) {
            return this.plansService.assignPlanToTenant(tenantId, dto.planId);
        }
        async removePlan(tenantId) {
            return this.plansService.removePlanFromTenant(tenantId);
        }
        async getTenantUsage(tenantId) {
            return this.plansService.getTenantUsage(tenantId);
        }
    };
    return PlansAdminController = _classThis;
})();
exports.PlansAdminController = PlansAdminController;
let PlansController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Plans'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('plans'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findActive_decorators;
    let _getMyUsage_decorators;
    var PlansController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _findActive_decorators = [(0, common_1.Get)('active'), (0, swagger_1.ApiOperation)({ summary: 'Listar planes activos (para usuarios)' })];
            _getMyUsage_decorators = [(0, common_1.Get)('my-usage'), (0, swagger_1.ApiOperation)({ summary: 'Obtener uso del plan del tenant actual' })];
            __esDecorate(this, null, _findActive_decorators, { kind: "method", name: "findActive", static: false, private: false, access: { has: obj => "findActive" in obj, get: obj => obj.findActive }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getMyUsage_decorators, { kind: "method", name: "getMyUsage", static: false, private: false, access: { has: obj => "getMyUsage" in obj, get: obj => obj.getMyUsage }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PlansController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        plansService = __runInitializers(this, _instanceExtraInitializers);
        constructor(plansService) {
            this.plansService = plansService;
        }
        async findActive() {
            return this.plansService.findActive();
        }
        async getMyUsage(user) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de empresas pueden consultar uso del plan');
            }
            return this.plansService.getTenantUsage(user.tenantId);
        }
    };
    return PlansController = _classThis;
})();
exports.PlansController = PlansController;
