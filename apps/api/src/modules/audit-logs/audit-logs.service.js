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
exports.AuditLogsService = void 0;
const common_1 = require("@nestjs/common");
let AuditLogsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AuditLogsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AuditLogsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async log(options) {
            return this.prisma.auditLog.create({
                data: {
                    userId: options.userId,
                    userEmail: options.userEmail,
                    userName: options.userName,
                    userRole: options.userRole,
                    tenantId: options.tenantId,
                    tenantNombre: options.tenantNombre,
                    action: options.action,
                    module: options.module,
                    description: options.description,
                    entityType: options.entityType,
                    entityId: options.entityId,
                    oldValue: options.oldValue ? JSON.stringify(options.oldValue) : null,
                    newValue: options.newValue ? JSON.stringify(options.newValue) : null,
                    metadata: options.metadata ? JSON.stringify(options.metadata) : null,
                    ipAddress: options.ipAddress,
                    userAgent: options.userAgent,
                    requestPath: options.requestPath,
                    requestMethod: options.requestMethod,
                    success: options.success ?? true,
                    errorMessage: options.errorMessage,
                },
            });
        }
        async findAll(filters, page = 1, limit = 50) {
            const skip = (page - 1) * limit;
            const where = {};
            if (filters.userId)
                where.userId = filters.userId;
            if (filters.tenantId)
                where.tenantId = filters.tenantId;
            if (filters.action)
                where.action = filters.action;
            if (filters.module)
                where.module = filters.module;
            if (filters.entityType)
                where.entityType = filters.entityType;
            if (filters.entityId)
                where.entityId = filters.entityId;
            if (filters.success !== undefined)
                where.success = filters.success;
            if (filters.startDate || filters.endDate) {
                where.createdAt = {};
                if (filters.startDate)
                    where.createdAt.gte = new Date(filters.startDate);
                if (filters.endDate)
                    where.createdAt.lte = new Date(filters.endDate);
            }
            if (filters.search) {
                where.OR = [
                    { description: { contains: filters.search } },
                    { userEmail: { contains: filters.search } },
                    { userName: { contains: filters.search } },
                    { tenantNombre: { contains: filters.search } },
                    { entityType: { contains: filters.search } },
                ];
            }
            const [data, total] = await Promise.all([
                this.prisma.auditLog.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                this.prisma.auditLog.count({ where }),
            ]);
            return {
                data,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        async findOne(id) {
            return this.prisma.auditLog.findUnique({
                where: { id },
            });
        }
        async getStats(tenantId, days = 30) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const where = {
                createdAt: { gte: startDate },
            };
            if (tenantId) {
                where.tenantId = tenantId;
            }
            const [total, byAction, byModule, bySuccess, recentActivity,] = await Promise.all([
                this.prisma.auditLog.count({ where }),
                this.prisma.auditLog.groupBy({
                    by: ['action'],
                    where,
                    _count: true,
                    orderBy: { _count: { action: 'desc' } },
                    take: 10,
                }),
                this.prisma.auditLog.groupBy({
                    by: ['module'],
                    where,
                    _count: true,
                    orderBy: { _count: { module: 'desc' } },
                }),
                this.prisma.auditLog.groupBy({
                    by: ['success'],
                    where,
                    _count: true,
                }),
                this.prisma.auditLog.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        action: true,
                        module: true,
                        description: true,
                        userName: true,
                        tenantNombre: true,
                        success: true,
                        createdAt: true,
                    },
                }),
            ]);
            return {
                total,
                byAction: byAction.map((g) => ({ action: g.action, count: g._count })),
                byModule: byModule.map((g) => ({ module: g.module, count: g._count })),
                successRate: bySuccess.find((g) => g.success)?._count ?? 0,
                failureRate: bySuccess.find((g) => !g.success)?._count ?? 0,
                recentActivity,
            };
        }
        async getActivityTimeline(tenantId, days = 7) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const where = {
                createdAt: { gte: startDate },
            };
            if (tenantId) {
                where.tenantId = tenantId;
            }
            const logs = await this.prisma.auditLog.findMany({
                where,
                select: {
                    createdAt: true,
                    action: true,
                },
            });
            // Group by day
            const timeline = {};
            for (let i = 0; i <= days; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const key = date.toISOString().split('T')[0];
                timeline[key] = 0;
            }
            for (const log of logs) {
                const key = log.createdAt.toISOString().split('T')[0];
                if (timeline[key] !== undefined) {
                    timeline[key]++;
                }
            }
            return Object.entries(timeline)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));
        }
        async getTenantActivity(tenantId, limit = 50) {
            return this.prisma.auditLog.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                take: limit,
            });
        }
        async getUserActivity(userId, limit = 50) {
            return this.prisma.auditLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
            });
        }
        async cleanOldLogs(daysToKeep = 90) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const result = await this.prisma.auditLog.deleteMany({
                where: {
                    createdAt: { lt: cutoffDate },
                },
            });
            return { deleted: result.count };
        }
    };
    return AuditLogsService = _classThis;
})();
exports.AuditLogsService = AuditLogsService;
