"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminService = void 0;
const common_1 = require("@nestjs/common");
const dto_1 = require("../audit-logs/dto");
const bcrypt = __importStar(require("bcryptjs"));
let SuperAdminService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SuperAdminService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SuperAdminService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        auditLogsService;
        constructor(prisma, auditLogsService) {
            this.prisma = prisma;
            this.auditLogsService = auditLogsService;
        }
        // ============ DASHBOARD STATS ============
        async getDashboardStats() {
            const [totalTenants, activeTenants, suspendedTenants, trialTenants, totalUsers, totalDtes, dtesThisMonth,] = await Promise.all([
                this.prisma.tenant.count(),
                this.prisma.tenant.count({ where: { planStatus: 'ACTIVE' } }),
                this.prisma.tenant.count({ where: { planStatus: 'SUSPENDED' } }),
                this.prisma.tenant.count({ where: { plan: 'TRIAL' } }),
                this.prisma.user.count({ where: { rol: { not: 'SUPER_ADMIN' } } }),
                this.prisma.dTE.count(),
                this.prisma.dTE.count({
                    where: {
                        createdAt: {
                            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        },
                    },
                }),
            ]);
            // DTEs por estado
            const dtesByStatus = await this.prisma.dTE.groupBy({
                by: ['estado'],
                _count: { estado: true },
            });
            // Tenants por plan
            const tenantsByPlan = await this.prisma.tenant.groupBy({
                by: ['plan'],
                _count: { plan: true },
            });
            // Ultimos 7 dias de DTEs
            const last7Days = await this.getLast7DaysDtes();
            return {
                totalTenants,
                activeTenants,
                suspendedTenants,
                trialTenants,
                totalUsers,
                totalDtes,
                dtesThisMonth,
                dtesByStatus: dtesByStatus.map((s) => ({ status: s.estado, count: s._count.estado })),
                tenantsByPlan: tenantsByPlan.map((p) => ({ plan: p.plan, count: p._count.plan })),
                last7Days,
            };
        }
        async getLast7DaysDtes() {
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                const nextDay = new Date(date);
                nextDay.setDate(nextDay.getDate() + 1);
                const count = await this.prisma.dTE.count({
                    where: {
                        createdAt: {
                            gte: date,
                            lt: nextDay,
                        },
                    },
                });
                days.push({
                    date: date.toISOString().split('T')[0],
                    count,
                });
            }
            return days;
        }
        // ============ TENANT MANAGEMENT ============
        async getAllTenants(params) {
            const { page = 1, limit = 10, search, plan, status } = params;
            const skip = (page - 1) * limit;
            const where = {};
            if (search) {
                // SQL Server uses collation for case sensitivity
                where.OR = [
                    { nombre: { contains: search } },
                    { nit: { contains: search } },
                    { correo: { contains: search } },
                ];
            }
            if (plan) {
                where.plan = plan;
            }
            if (status) {
                where.planStatus = status;
            }
            const [tenants, total] = await Promise.all([
                this.prisma.tenant.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        _count: {
                            select: {
                                usuarios: true,
                                dtes: true,
                            },
                        },
                    },
                }),
                this.prisma.tenant.count({ where }),
            ]);
            return {
                data: tenants,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        async getTenantById(id) {
            const tenant = await this.prisma.tenant.findUnique({
                where: { id },
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
                    _count: {
                        select: {
                            dtes: true,
                            clientes: true,
                        },
                    },
                },
            });
            if (!tenant) {
                throw new common_1.NotFoundException('Empresa no encontrada');
            }
            // Estadisticas de DTEs
            const dteStats = await this.prisma.dTE.groupBy({
                by: ['estado'],
                where: { tenantId: id },
                _count: { estado: true },
            });
            // DTEs ultimos 30 dias
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const dtesLast30Days = await this.prisma.dTE.count({
                where: {
                    tenantId: id,
                    createdAt: { gte: thirtyDaysAgo },
                },
            });
            return {
                ...tenant,
                dteStats: dteStats.map((s) => ({ status: s.estado, count: s._count.estado })),
                dtesLast30Days,
            };
        }
        async updateTenantPlan(id, data, adminUserId, adminEmail) {
            const tenant = await this.prisma.tenant.findUnique({ where: { id } });
            if (!tenant) {
                throw new common_1.NotFoundException('Empresa no encontrada');
            }
            const oldValues = {
                plan: tenant.plan,
                planStatus: tenant.planStatus,
                maxDtesPerMonth: tenant.maxDtesPerMonth,
            };
            const updated = await this.prisma.tenant.update({
                where: { id },
                data: {
                    plan: data.plan,
                    planStatus: data.planStatus,
                    planExpiry: data.planExpiry,
                    maxDtesPerMonth: data.maxDtesPerMonth,
                    adminNotes: data.adminNotes,
                },
            });
            // Audit log
            await this.auditLogsService.log({
                userId: adminUserId,
                userEmail: adminEmail,
                userRole: 'SUPER_ADMIN',
                tenantId: id,
                tenantNombre: tenant.nombre,
                action: dto_1.AuditAction.UPDATE,
                module: dto_1.AuditModule.ADMIN,
                description: `Plan de empresa actualizado: ${tenant.nombre}`,
                entityType: 'Tenant',
                entityId: id,
                oldValue: oldValues,
                newValue: data,
                success: true,
            });
            return updated;
        }
        async suspendTenant(id, reason, adminUserId, adminEmail) {
            const tenant = await this.prisma.tenant.findUnique({ where: { id } });
            if (!tenant) {
                throw new common_1.NotFoundException('Empresa no encontrada');
            }
            const updated = await this.prisma.tenant.update({
                where: { id },
                data: {
                    planStatus: 'SUSPENDED',
                    adminNotes: reason ? `SUSPENDIDO: ${reason}\n${tenant.adminNotes || ''}` : tenant.adminNotes,
                },
            });
            // Audit log
            await this.auditLogsService.log({
                userId: adminUserId,
                userEmail: adminEmail,
                userRole: 'SUPER_ADMIN',
                tenantId: id,
                tenantNombre: tenant.nombre,
                action: dto_1.AuditAction.UPDATE,
                module: dto_1.AuditModule.ADMIN,
                description: `Empresa suspendida: ${tenant.nombre}${reason ? ` - Motivo: ${reason}` : ''}`,
                entityType: 'Tenant',
                entityId: id,
                metadata: { reason },
                success: true,
            });
            return updated;
        }
        async activateTenant(id, adminUserId, adminEmail) {
            const tenant = await this.prisma.tenant.findUnique({ where: { id } });
            if (!tenant) {
                throw new common_1.NotFoundException('Empresa no encontrada');
            }
            const updated = await this.prisma.tenant.update({
                where: { id },
                data: { planStatus: 'ACTIVE' },
            });
            // Audit log
            await this.auditLogsService.log({
                userId: adminUserId,
                userEmail: adminEmail,
                userRole: 'SUPER_ADMIN',
                tenantId: id,
                tenantNombre: tenant.nombre,
                action: dto_1.AuditAction.UPDATE,
                module: dto_1.AuditModule.ADMIN,
                description: `Empresa activada: ${tenant.nombre}`,
                entityType: 'Tenant',
                entityId: id,
                success: true,
            });
            return updated;
        }
        async deleteTenant(id, adminUserId, adminEmail) {
            const tenant = await this.prisma.tenant.findUnique({ where: { id } });
            if (!tenant) {
                throw new common_1.NotFoundException('Empresa no encontrada');
            }
            // Store tenant info for audit before deletion
            const tenantInfo = { nombre: tenant.nombre, nit: tenant.nit };
            // Eliminar en orden por las relaciones
            await this.prisma.$transaction([
                this.prisma.dTELog.deleteMany({
                    where: { dte: { tenantId: id } },
                }),
                this.prisma.dTE.deleteMany({ where: { tenantId: id } }),
                this.prisma.cliente.deleteMany({ where: { tenantId: id } }),
                this.prisma.user.deleteMany({ where: { tenantId: id } }),
                this.prisma.tenant.delete({ where: { id } }),
            ]);
            // Audit log
            await this.auditLogsService.log({
                userId: adminUserId,
                userEmail: adminEmail,
                userRole: 'SUPER_ADMIN',
                action: dto_1.AuditAction.DELETE,
                module: dto_1.AuditModule.ADMIN,
                description: `Empresa eliminada: ${tenantInfo.nombre} (NIT: ${tenantInfo.nit})`,
                entityType: 'Tenant',
                entityId: id,
                oldValue: tenantInfo,
                success: true,
            });
            return { message: 'Empresa eliminada correctamente' };
        }
        // ============ SUPER ADMIN MANAGEMENT ============
        async createSuperAdmin(data, createdByUserId, createdByEmail) {
            const existing = await this.prisma.user.findUnique({
                where: { email: data.email },
            });
            if (existing) {
                throw new common_1.ConflictException('Ya existe un usuario con este correo');
            }
            const hashedPassword = await bcrypt.hash(data.password, 10);
            const admin = await this.prisma.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    nombre: data.nombre,
                    rol: 'SUPER_ADMIN',
                    tenantId: null,
                },
                select: {
                    id: true,
                    email: true,
                    nombre: true,
                    rol: true,
                    createdAt: true,
                },
            });
            // Audit log
            await this.auditLogsService.log({
                userId: createdByUserId,
                userEmail: createdByEmail,
                userRole: 'SUPER_ADMIN',
                action: dto_1.AuditAction.CREATE,
                module: dto_1.AuditModule.ADMIN,
                description: `Nuevo Super Admin creado: ${data.email}`,
                entityType: 'User',
                entityId: admin.id,
                newValue: { email: data.email, nombre: data.nombre },
                success: true,
            });
            return admin;
        }
        async getAllSuperAdmins() {
            return this.prisma.user.findMany({
                where: { rol: 'SUPER_ADMIN' },
                select: {
                    id: true,
                    email: true,
                    nombre: true,
                    createdAt: true,
                },
            });
        }
        // ============ ACTIVITY LOGS ============
        async getRecentActivity(limit = 50) {
            const recentDtes = await this.prisma.dTE.findMany({
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    tenant: {
                        select: { nombre: true, nit: true },
                    },
                },
            });
            const recentTenants = await this.prisma.tenant.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    nombre: true,
                    nit: true,
                    plan: true,
                    createdAt: true,
                },
            });
            return {
                recentDtes,
                recentTenants,
            };
        }
        // ============ BOOTSTRAP (First Super Admin) ============
        async bootstrapSuperAdmin(data) {
            // Check if any SUPER_ADMIN already exists
            const existingAdmin = await this.prisma.user.findFirst({
                where: { rol: 'SUPER_ADMIN' },
            });
            if (existingAdmin) {
                throw new common_1.ConflictException('Ya existe un Super Administrador. Use el panel de admin para crear mas.');
            }
            const existing = await this.prisma.user.findUnique({
                where: { email: data.email },
            });
            if (existing) {
                throw new common_1.ConflictException('Ya existe un usuario con este correo');
            }
            const hashedPassword = await bcrypt.hash(data.password, 10);
            const admin = await this.prisma.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    nombre: data.nombre,
                    rol: 'SUPER_ADMIN',
                    tenantId: null,
                },
                select: {
                    id: true,
                    email: true,
                    nombre: true,
                    rol: true,
                    createdAt: true,
                },
            });
            return {
                message: 'Super Administrador creado exitosamente',
                admin,
            };
        }
        async hasSuperAdmin() {
            const count = await this.prisma.user.count({
                where: { rol: 'SUPER_ADMIN' },
            });
            return count > 0;
        }
    };
    return SuperAdminService = _classThis;
})();
exports.SuperAdminService = SuperAdminService;
