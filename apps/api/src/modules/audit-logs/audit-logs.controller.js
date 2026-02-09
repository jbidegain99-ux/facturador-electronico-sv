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
exports.AuditLogsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../super-admin/guards/super-admin.guard");
const dto_1 = require("./dto");
let AuditLogsController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Audit Logs'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('admin/audit-logs'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findAll_decorators;
    let _getStats_decorators;
    let _getTimeline_decorators;
    let _getTenantActivity_decorators;
    let _getUserActivity_decorators;
    let _findOne_decorators;
    let _cleanup_decorators;
    var AuditLogsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _findAll_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Listar logs de auditoría con filtros' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'userId', required: false }), (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false }), (0, swagger_1.ApiQuery)({ name: 'action', required: false, enum: dto_1.AuditAction }), (0, swagger_1.ApiQuery)({ name: 'module', required: false, enum: dto_1.AuditModule }), (0, swagger_1.ApiQuery)({ name: 'entityType', required: false }), (0, swagger_1.ApiQuery)({ name: 'entityId', required: false }), (0, swagger_1.ApiQuery)({ name: 'success', required: false, type: Boolean }), (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }), (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }), (0, swagger_1.ApiQuery)({ name: 'search', required: false })];
            _getStats_decorators = [(0, common_1.Get)('stats'), (0, swagger_1.ApiOperation)({ summary: 'Obtener estadísticas de auditoría' }), (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false }), (0, swagger_1.ApiQuery)({ name: 'days', required: false, type: Number })];
            _getTimeline_decorators = [(0, common_1.Get)('timeline'), (0, swagger_1.ApiOperation)({ summary: 'Obtener línea de tiempo de actividad' }), (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false }), (0, swagger_1.ApiQuery)({ name: 'days', required: false, type: Number })];
            _getTenantActivity_decorators = [(0, common_1.Get)('tenant/:tenantId'), (0, swagger_1.ApiOperation)({ summary: 'Obtener actividad de un tenant' }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number })];
            _getUserActivity_decorators = [(0, common_1.Get)('user/:userId'), (0, swagger_1.ApiOperation)({ summary: 'Obtener actividad de un usuario' }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number })];
            _findOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Obtener log por ID' })];
            _cleanup_decorators = [(0, common_1.Post)('cleanup'), (0, swagger_1.ApiOperation)({ summary: 'Limpiar logs antiguos' }), (0, swagger_1.ApiQuery)({ name: 'daysToKeep', required: false, type: Number })];
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getStats_decorators, { kind: "method", name: "getStats", static: false, private: false, access: { has: obj => "getStats" in obj, get: obj => obj.getStats }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTimeline_decorators, { kind: "method", name: "getTimeline", static: false, private: false, access: { has: obj => "getTimeline" in obj, get: obj => obj.getTimeline }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTenantActivity_decorators, { kind: "method", name: "getTenantActivity", static: false, private: false, access: { has: obj => "getTenantActivity" in obj, get: obj => obj.getTenantActivity }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getUserActivity_decorators, { kind: "method", name: "getUserActivity", static: false, private: false, access: { has: obj => "getUserActivity" in obj, get: obj => obj.getUserActivity }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _cleanup_decorators, { kind: "method", name: "cleanup", static: false, private: false, access: { has: obj => "cleanup" in obj, get: obj => obj.cleanup }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AuditLogsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        auditLogsService = __runInitializers(this, _instanceExtraInitializers);
        constructor(auditLogsService) {
            this.auditLogsService = auditLogsService;
        }
        async findAll(page, limit, userId, tenantId, action, module, entityType, entityId, success, startDate, endDate, search) {
            const filters = {
                userId,
                tenantId,
                action,
                module,
                entityType,
                entityId,
                success: success ? success === 'true' : undefined,
                startDate,
                endDate,
                search,
            };
            return this.auditLogsService.findAll(filters, page, limit);
        }
        async getStats(tenantId, days) {
            return this.auditLogsService.getStats(tenantId, days);
        }
        async getTimeline(tenantId, days) {
            return this.auditLogsService.getActivityTimeline(tenantId, days);
        }
        async getTenantActivity(tenantId, limit) {
            return this.auditLogsService.getTenantActivity(tenantId, limit);
        }
        async getUserActivity(userId, limit) {
            return this.auditLogsService.getUserActivity(userId, limit);
        }
        async findOne(id) {
            return this.auditLogsService.findOne(id);
        }
        async cleanup(daysToKeep) {
            return this.auditLogsService.cleanOldLogs(daysToKeep);
        }
    };
    return AuditLogsController = _classThis;
})();
exports.AuditLogsController = AuditLogsController;
