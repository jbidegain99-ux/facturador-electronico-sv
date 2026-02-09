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
exports.BackupsService = void 0;
const common_1 = require("@nestjs/common");
let BackupsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var BackupsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BackupsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        logger = new common_1.Logger(BackupsService.name);
        constructor(prisma) {
            this.prisma = prisma;
        }
        async getBackupStats() {
            const [totalTenants, totalUsers, totalDtes, totalClientes,] = await Promise.all([
                this.prisma.tenant.count(),
                this.prisma.user.count(),
                this.prisma.dTE.count(),
                this.prisma.cliente.count(),
            ]);
            return {
                totalTenants,
                totalUsers,
                totalDtes,
                totalClientes,
                lastBackupDate: null, // Would be stored in a backups table in full implementation
                systemStatus: 'healthy',
            };
        }
        async generateFullBackup() {
            this.logger.log('Generating full system backup...');
            const tenants = await this.prisma.tenant.findMany({
                include: {
                    usuarios: {
                        select: {
                            id: true,
                            email: true,
                            nombre: true,
                            rol: true,
                            createdAt: true,
                        },
                    },
                    clientes: true,
                    dtes: {
                        include: {
                            cliente: true,
                        },
                    },
                },
            });
            const backupData = [];
            for (const tenant of tenants) {
                const onboarding = await this.prisma.tenantOnboarding.findUnique({
                    where: { tenantId: tenant.id },
                    include: {
                        dteTypes: true,
                        steps: true,
                    },
                });
                const emailConfig = await this.prisma.tenantEmailConfig.findUnique({
                    where: { tenantId: tenant.id },
                    select: {
                        id: true,
                        provider: true,
                        authMethod: true,
                        fromEmail: true,
                        fromName: true,
                        isVerified: true,
                        isActive: true,
                        createdAt: true,
                        // Exclude sensitive fields like apiKey, passwords
                    },
                });
                backupData.push({
                    tenant: {
                        ...tenant,
                        usuarios: undefined, // Remove nested relation
                        clientes: undefined,
                        dtes: undefined,
                    },
                    users: tenant.usuarios,
                    clientes: tenant.clientes,
                    dtes: tenant.dtes,
                    onboarding,
                    emailConfig,
                });
            }
            return {
                metadata: {
                    createdAt: new Date().toISOString(),
                    version: '1.0',
                    type: 'full',
                },
                data: backupData,
            };
        }
        async generateTenantBackup(tenantId) {
            this.logger.log(`Generating backup for tenant ${tenantId}...`);
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
            });
            if (!tenant) {
                throw new Error('Tenant not found');
            }
            const [users, clientes, dtes, onboarding, emailConfig] = await Promise.all([
                this.prisma.user.findMany({
                    where: { tenantId },
                    select: {
                        id: true,
                        email: true,
                        nombre: true,
                        rol: true,
                        createdAt: true,
                    },
                }),
                this.prisma.cliente.findMany({
                    where: { tenantId },
                }),
                this.prisma.dTE.findMany({
                    where: { tenantId },
                    include: {
                        cliente: true,
                        logs: true,
                    },
                }),
                this.prisma.tenantOnboarding.findUnique({
                    where: { tenantId },
                    include: {
                        dteTypes: true,
                        steps: true,
                    },
                }),
                this.prisma.tenantEmailConfig.findUnique({
                    where: { tenantId },
                    select: {
                        id: true,
                        provider: true,
                        authMethod: true,
                        fromEmail: true,
                        fromName: true,
                        isVerified: true,
                        isActive: true,
                        createdAt: true,
                    },
                }),
            ]);
            return {
                metadata: {
                    createdAt: new Date().toISOString(),
                    version: '1.0',
                    type: 'tenant',
                    tenantId,
                },
                data: {
                    tenant,
                    users,
                    clientes,
                    dtes,
                    onboarding,
                    emailConfig,
                },
            };
        }
        async getDataSummary() {
            const [tenantCount, userCount, dteCount, clienteCount, dtesByStatus, tenantsByPlan,] = await Promise.all([
                this.prisma.tenant.count(),
                this.prisma.user.count(),
                this.prisma.dTE.count(),
                this.prisma.cliente.count(),
                this.prisma.dTE.groupBy({
                    by: ['estado'],
                    _count: true,
                }),
                this.prisma.tenant.groupBy({
                    by: ['plan'],
                    _count: true,
                }),
            ]);
            // Calculate approximate storage size (rough estimate)
            const estimatedSize = (tenantCount * 2 + // ~2KB per tenant
                userCount * 1 + // ~1KB per user
                dteCount * 5 + // ~5KB per DTE
                clienteCount * 1 // ~1KB per cliente
            );
            return {
                counts: {
                    tenants: tenantCount,
                    users: userCount,
                    dtes: dteCount,
                    clientes: clienteCount,
                },
                dtesByStatus: dtesByStatus.map(s => ({ status: s.estado, count: s._count })),
                tenantsByPlan: tenantsByPlan.map(t => ({ plan: t.plan, count: t._count })),
                estimatedSizeKB: estimatedSize,
                estimatedSizeMB: Math.round(estimatedSize / 1024 * 100) / 100,
            };
        }
    };
    return BackupsService = _classThis;
})();
exports.BackupsService = BackupsService;
