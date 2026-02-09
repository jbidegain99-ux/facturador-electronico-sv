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
exports.BackupsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../super-admin/guards/super-admin.guard");
let BackupsController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Backups'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('admin/backups'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getStats_decorators;
    let _getDataSummary_decorators;
    let _generateFullBackup_decorators;
    let _generateTenantBackup_decorators;
    let _previewFullBackup_decorators;
    let _previewTenantBackup_decorators;
    var BackupsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getStats_decorators = [(0, common_1.Get)('stats'), (0, swagger_1.ApiOperation)({ summary: 'Get backup statistics' })];
            _getDataSummary_decorators = [(0, common_1.Get)('summary'), (0, swagger_1.ApiOperation)({ summary: 'Get data summary for backup estimation' })];
            _generateFullBackup_decorators = [(0, common_1.Post)('generate/full'), (0, swagger_1.ApiOperation)({ summary: 'Generate full system backup' })];
            _generateTenantBackup_decorators = [(0, common_1.Post)('generate/tenant/:tenantId'), (0, swagger_1.ApiOperation)({ summary: 'Generate backup for specific tenant' })];
            _previewFullBackup_decorators = [(0, common_1.Get)('preview/full'), (0, swagger_1.ApiOperation)({ summary: 'Preview full backup without downloading' })];
            _previewTenantBackup_decorators = [(0, common_1.Get)('preview/tenant/:tenantId'), (0, swagger_1.ApiOperation)({ summary: 'Preview tenant backup without downloading' })];
            __esDecorate(this, null, _getStats_decorators, { kind: "method", name: "getStats", static: false, private: false, access: { has: obj => "getStats" in obj, get: obj => obj.getStats }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getDataSummary_decorators, { kind: "method", name: "getDataSummary", static: false, private: false, access: { has: obj => "getDataSummary" in obj, get: obj => obj.getDataSummary }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _generateFullBackup_decorators, { kind: "method", name: "generateFullBackup", static: false, private: false, access: { has: obj => "generateFullBackup" in obj, get: obj => obj.generateFullBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _generateTenantBackup_decorators, { kind: "method", name: "generateTenantBackup", static: false, private: false, access: { has: obj => "generateTenantBackup" in obj, get: obj => obj.generateTenantBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _previewFullBackup_decorators, { kind: "method", name: "previewFullBackup", static: false, private: false, access: { has: obj => "previewFullBackup" in obj, get: obj => obj.previewFullBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _previewTenantBackup_decorators, { kind: "method", name: "previewTenantBackup", static: false, private: false, access: { has: obj => "previewTenantBackup" in obj, get: obj => obj.previewTenantBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BackupsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        backupsService = __runInitializers(this, _instanceExtraInitializers);
        constructor(backupsService) {
            this.backupsService = backupsService;
        }
        async getStats() {
            return this.backupsService.getBackupStats();
        }
        async getDataSummary() {
            return this.backupsService.getDataSummary();
        }
        async generateFullBackup(res) {
            const backupData = await this.backupsService.generateFullBackup();
            const filename = `backup-full-${new Date().toISOString().split('T')[0]}.json`;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.status(common_1.HttpStatus.OK).send(JSON.stringify(backupData, null, 2));
        }
        async generateTenantBackup(tenantId, res) {
            const backupData = await this.backupsService.generateTenantBackup(tenantId);
            const filename = `backup-tenant-${tenantId}-${new Date().toISOString().split('T')[0]}.json`;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.status(common_1.HttpStatus.OK).send(JSON.stringify(backupData, null, 2));
        }
        async previewFullBackup() {
            const backupData = await this.backupsService.generateFullBackup();
            return {
                metadata: backupData.metadata,
                summary: {
                    totalTenants: Array.isArray(backupData.data) ? backupData.data.length : 1,
                    timestamp: backupData.metadata.createdAt,
                },
            };
        }
        async previewTenantBackup(tenantId) {
            const backupData = await this.backupsService.generateTenantBackup(tenantId);
            const data = backupData.data;
            return {
                metadata: backupData.metadata,
                summary: {
                    tenantName: data.tenant?.nombre,
                    usersCount: data.users?.length || 0,
                    clientesCount: data.clientes?.length || 0,
                    dtesCount: data.dtes?.length || 0,
                    hasOnboarding: !!data.onboarding,
                    hasEmailConfig: !!data.emailConfig,
                    timestamp: backupData.metadata.createdAt,
                },
            };
        }
    };
    return BackupsController = _classThis;
})();
exports.BackupsController = BackupsController;
