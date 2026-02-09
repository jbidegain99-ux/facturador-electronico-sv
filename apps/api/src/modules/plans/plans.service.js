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
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
let PlansService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PlansService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PlansService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async findAll() {
            return this.prisma.plan.findMany({
                orderBy: { orden: 'asc' },
                include: {
                    _count: {
                        select: { tenants: true },
                    },
                },
            });
        }
        async findActive() {
            return this.prisma.plan.findMany({
                where: { isActive: true },
                orderBy: { orden: 'asc' },
            });
        }
        async findOne(id) {
            const plan = await this.prisma.plan.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { tenants: true },
                    },
                    tenants: {
                        select: {
                            id: true,
                            nombre: true,
                            nit: true,
                            planStatus: true,
                        },
                        take: 10,
                    },
                },
            });
            if (!plan) {
                throw new common_1.NotFoundException('Plan no encontrado');
            }
            return plan;
        }
        async findByCode(codigo) {
            return this.prisma.plan.findUnique({
                where: { codigo },
            });
        }
        async create(dto) {
            // Check if code already exists
            const existing = await this.findByCode(dto.codigo);
            if (existing) {
                throw new common_1.ConflictException(`Ya existe un plan con el código ${dto.codigo}`);
            }
            // If this plan is default, remove default from others
            if (dto.isDefault) {
                await this.prisma.plan.updateMany({
                    where: { isDefault: true },
                    data: { isDefault: false },
                });
            }
            return this.prisma.plan.create({
                data: {
                    codigo: dto.codigo,
                    nombre: dto.nombre,
                    descripcion: dto.descripcion,
                    maxDtesPerMonth: dto.maxDtesPerMonth,
                    maxUsers: dto.maxUsers,
                    maxClientes: dto.maxClientes,
                    maxStorageMb: dto.maxStorageMb,
                    features: dto.features,
                    precioMensual: dto.precioMensual,
                    precioAnual: dto.precioAnual,
                    orden: dto.orden ?? 0,
                    isDefault: dto.isDefault ?? false,
                },
            });
        }
        async update(id, dto) {
            const plan = await this.prisma.plan.findUnique({ where: { id } });
            if (!plan) {
                throw new common_1.NotFoundException('Plan no encontrado');
            }
            // If setting as default, remove default from others
            if (dto.isDefault) {
                await this.prisma.plan.updateMany({
                    where: { isDefault: true, id: { not: id } },
                    data: { isDefault: false },
                });
            }
            return this.prisma.plan.update({
                where: { id },
                data: dto,
            });
        }
        async delete(id) {
            const plan = await this.prisma.plan.findUnique({
                where: { id },
                include: { _count: { select: { tenants: true } } },
            });
            if (!plan) {
                throw new common_1.NotFoundException('Plan no encontrado');
            }
            if (plan._count.tenants > 0) {
                throw new common_1.ConflictException(`No se puede eliminar el plan porque tiene ${plan._count.tenants} tenant(s) asociado(s)`);
            }
            return this.prisma.plan.delete({ where: { id } });
        }
        async assignPlanToTenant(tenantId, planId) {
            const [tenant, plan] = await Promise.all([
                this.prisma.tenant.findUnique({ where: { id: tenantId } }),
                this.prisma.plan.findUnique({ where: { id: planId } }),
            ]);
            if (!tenant) {
                throw new common_1.NotFoundException('Tenant no encontrado');
            }
            if (!plan) {
                throw new common_1.NotFoundException('Plan no encontrado');
            }
            if (!plan.isActive) {
                throw new common_1.BadRequestException('No se puede asignar un plan inactivo');
            }
            return this.prisma.tenant.update({
                where: { id: tenantId },
                data: { planId },
                include: { planRef: true },
            });
        }
        async removePlanFromTenant(tenantId) {
            const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
            if (!tenant) {
                throw new common_1.NotFoundException('Tenant no encontrado');
            }
            return this.prisma.tenant.update({
                where: { id: tenantId },
                data: { planId: null },
            });
        }
        async getTenantUsage(tenantId) {
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
                include: {
                    planRef: true,
                    _count: {
                        select: {
                            usuarios: true,
                            clientes: true,
                        },
                    },
                },
            });
            if (!tenant) {
                throw new common_1.NotFoundException('Tenant no encontrado');
            }
            // Get current month DTE count
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const dtesThisMonth = await this.prisma.dTE.count({
                where: {
                    tenantId,
                    createdAt: { gte: startOfMonth },
                },
            });
            const plan = tenant.planRef;
            return {
                tenantId,
                planId: plan?.id ?? null,
                planCodigo: plan?.codigo ?? null,
                planNombre: plan?.nombre ?? null,
                usage: {
                    dtesThisMonth,
                    maxDtesPerMonth: plan?.maxDtesPerMonth ?? -1,
                    dtesRemaining: plan?.maxDtesPerMonth === -1 ? -1 : Math.max(0, (plan?.maxDtesPerMonth ?? 0) - dtesThisMonth),
                    users: tenant._count.usuarios,
                    maxUsers: plan?.maxUsers ?? -1,
                    usersRemaining: plan?.maxUsers === -1 ? -1 : Math.max(0, (plan?.maxUsers ?? 0) - tenant._count.usuarios),
                    clientes: tenant._count.clientes,
                    maxClientes: plan?.maxClientes ?? -1,
                    clientesRemaining: plan?.maxClientes === -1 ? -1 : Math.max(0, (plan?.maxClientes ?? 0) - tenant._count.clientes),
                },
                limits: {
                    canCreateDte: plan?.maxDtesPerMonth === -1 || dtesThisMonth < (plan?.maxDtesPerMonth ?? 0),
                    canAddUser: plan?.maxUsers === -1 || tenant._count.usuarios < (plan?.maxUsers ?? 0),
                    canAddCliente: plan?.maxClientes === -1 || tenant._count.clientes < (plan?.maxClientes ?? 0),
                },
            };
        }
        async checkLimit(tenantId, type) {
            const usage = await this.getTenantUsage(tenantId);
            switch (type) {
                case 'dte':
                    return usage.limits.canCreateDte;
                case 'user':
                    return usage.limits.canAddUser;
                case 'cliente':
                    return usage.limits.canAddCliente;
                default:
                    return true;
            }
        }
        async getPlansWithStats() {
            const plans = await this.prisma.plan.findMany({
                orderBy: { orden: 'asc' },
                include: {
                    _count: {
                        select: { tenants: true },
                    },
                },
            });
            // Get active tenants per plan
            const planStats = await Promise.all(plans.map(async (plan) => {
                const activeTenantsCount = await this.prisma.tenant.count({
                    where: { planId: plan.id, planStatus: 'ACTIVE' },
                });
                return {
                    ...plan,
                    activeTenantsCount,
                    totalTenantsCount: plan._count.tenants,
                };
            }));
            return planStats;
        }
        async seedDefaultPlans() {
            const defaultPlans = [
                {
                    codigo: 'DEMO',
                    nombre: 'Demo',
                    descripcion: 'Plan de demostración con funcionalidad limitada',
                    maxDtesPerMonth: 10,
                    maxUsers: 1,
                    maxClientes: 10,
                    maxStorageMb: 100,
                    features: JSON.stringify(['facturacion_basica']),
                    orden: 0,
                    isDefault: true,
                },
                {
                    codigo: 'TRIAL',
                    nombre: 'Prueba',
                    descripcion: 'Plan de prueba por 30 días',
                    maxDtesPerMonth: 50,
                    maxUsers: 2,
                    maxClientes: 50,
                    maxStorageMb: 250,
                    features: JSON.stringify(['facturacion_basica', 'reportes_basicos']),
                    orden: 1,
                },
                {
                    codigo: 'BASIC',
                    nombre: 'Básico',
                    descripcion: 'Plan básico para pequeñas empresas',
                    maxDtesPerMonth: 100,
                    maxUsers: 3,
                    maxClientes: 100,
                    maxStorageMb: 500,
                    features: JSON.stringify(['facturacion_basica', 'reportes_basicos', 'soporte_email']),
                    precioMensual: 29.99,
                    precioAnual: 299.99,
                    orden: 2,
                },
                {
                    codigo: 'PRO',
                    nombre: 'Profesional',
                    descripcion: 'Plan profesional con funcionalidades avanzadas',
                    maxDtesPerMonth: 500,
                    maxUsers: 10,
                    maxClientes: 500,
                    maxStorageMb: 2000,
                    features: JSON.stringify([
                        'facturacion_basica',
                        'reportes_avanzados',
                        'soporte_prioritario',
                        'api_access',
                        'multi_sucursal',
                    ]),
                    precioMensual: 79.99,
                    precioAnual: 799.99,
                    orden: 3,
                },
                {
                    codigo: 'ENTERPRISE',
                    nombre: 'Empresarial',
                    descripcion: 'Plan empresarial sin límites',
                    maxDtesPerMonth: -1,
                    maxUsers: -1,
                    maxClientes: -1,
                    maxStorageMb: -1,
                    features: JSON.stringify([
                        'facturacion_basica',
                        'reportes_avanzados',
                        'soporte_dedicado',
                        'api_access',
                        'multi_sucursal',
                        'integraciones',
                        'white_label',
                    ]),
                    precioMensual: 199.99,
                    precioAnual: 1999.99,
                    orden: 4,
                },
            ];
            const results = [];
            for (const planData of defaultPlans) {
                const existing = await this.findByCode(planData.codigo);
                if (!existing) {
                    const plan = await this.prisma.plan.create({ data: planData });
                    results.push({ action: 'created', plan });
                }
                else {
                    results.push({ action: 'exists', plan: existing });
                }
            }
            return results;
        }
    };
    return PlansService = _classThis;
})();
exports.PlansService = PlansService;
