import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from './dto';
import { getPlanFeatures, normalizePlanCode, PlanFeatures, PLAN_CONFIGS, PlanCode } from '../../common/plan-features';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

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

  async findOne(id: string) {
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
      throw new NotFoundException('Plan no encontrado');
    }

    return plan;
  }

  async findByCode(codigo: string) {
    return this.prisma.plan.findUnique({
      where: { codigo },
    });
  }

  async create(dto: CreatePlanDto) {
    // Check if code already exists
    const existing = await this.findByCode(dto.codigo);
    if (existing) {
      throw new ConflictException(`Ya existe un plan con el código ${dto.codigo}`);
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

  async update(id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
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

  async delete(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: { _count: { select: { tenants: true } } },
    });

    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }

    if (plan._count.tenants > 0) {
      throw new ConflictException(
        `No se puede eliminar el plan porque tiene ${plan._count.tenants} tenant(s) asociado(s)`,
      );
    }

    return this.prisma.plan.delete({ where: { id } });
  }

  async assignPlanToTenant(tenantId: string, planId: string) {
    const [tenant, plan] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
      this.prisma.plan.findUnique({ where: { id: planId } }),
    ]);

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }

    if (!plan.isActive) {
      throw new BadRequestException('No se puede asignar un plan inactivo');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { planId },
      include: { planRef: true },
    });
  }

  async removePlanFromTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { planId: null },
    });
  }

  async getTenantUsage(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        planRef: true,
        _count: {
          select: {
            usuarios: true,
            clientes: true,
            sucursales: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
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
        branches: tenant._count.sucursales,
        maxBranches: plan?.maxBranches ?? -1,
        branchesRemaining: plan?.maxBranches === -1 ? -1 : Math.max(0, (plan?.maxBranches ?? -1) - tenant._count.sucursales),
      },
      limits: {
        canCreateDte: plan?.maxDtesPerMonth === -1 || dtesThisMonth < (plan?.maxDtesPerMonth ?? 0),
        canAddUser: plan?.maxUsers === -1 || tenant._count.usuarios < (plan?.maxUsers ?? 0),
        canAddCliente: plan?.maxClientes === -1 || tenant._count.clientes < (plan?.maxClientes ?? 0),
        canAddBranch: plan?.maxBranches === -1 || tenant._count.sucursales < (plan?.maxBranches ?? 0),
      },
    };
  }

  async getTenantFeatures(tenantId: string): Promise<PlanFeatures & { planCode: string }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });
    const rawPlanCode = tenant?.plan ?? 'STARTER';
    const planCode = normalizePlanCode(rawPlanCode);
    return { ...getPlanFeatures(planCode), planCode };
  }

  async checkLimit(tenantId: string, type: 'dte' | 'user' | 'cliente' | 'branch'): Promise<boolean> {
    const usage = await this.getTenantUsage(tenantId);

    switch (type) {
      case 'dte':
        return usage.limits.canCreateDte;
      case 'user':
        return usage.limits.canAddUser;
      case 'cliente':
        return usage.limits.canAddCliente;
      case 'branch':
        return usage.limits.canAddBranch;
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
    const planStats = await Promise.all(
      plans.map(async (plan) => {
        const activeTenantsCount = await this.prisma.tenant.count({
          where: { planId: plan.id, planStatus: 'ACTIVE' },
        });

        return {
          ...plan,
          activeTenantsCount,
          totalTenantsCount: plan._count.tenants,
        };
      }),
    );

    return planStats;
  }

  async seedDefaultPlans() {
    const buildPlanData = (code: PlanCode, nombre: string, descripcion: string, orden: number, isDefault = false) => {
      const config = PLAN_CONFIGS[code];
      return {
        codigo: code,
        nombre,
        descripcion,
        maxDtesPerMonth: config.limits.dtes,
        maxUsers: config.limits.users,
        maxClientes: config.limits.customers,
        maxStorageMb: config.limits.storage === -1 ? -1 : config.limits.storage * 1024,
        maxBranches: config.limits.branches,
        maxCatalogItems: config.limits.catalog,
        features: JSON.stringify(
          Object.entries(config.features)
            .filter(([, v]) => v)
            .map(([k]) => k),
        ),
        precioMensual: config.price.monthly,
        precioAnual: config.price.yearly,
        orden,
        isDefault,
      };
    };

    const planDefinitions = [
      buildPlanData(PlanCode.FREE, 'Free', 'Plan gratuito para probar la plataforma', 0),
      buildPlanData(PlanCode.STARTER, 'Starter', 'Perfecto para pequenas empresas comenzando con facturacion electronica', 1, true),
      buildPlanData(PlanCode.PROFESSIONAL, 'Professional', 'Para empresas en crecimiento que necesitan herramientas avanzadas', 2),
      buildPlanData(PlanCode.ENTERPRISE, 'Enterprise', 'Solucion completa sin limites para grandes organizaciones', 3),
    ];

    const results = [];
    for (const planData of planDefinitions) {
      const plan = await this.prisma.plan.upsert({
        where: { codigo: planData.codigo },
        create: planData,
        update: {
          nombre: planData.nombre,
          descripcion: planData.descripcion,
          maxDtesPerMonth: planData.maxDtesPerMonth,
          maxUsers: planData.maxUsers,
          maxClientes: planData.maxClientes,
          maxStorageMb: planData.maxStorageMb,
          maxBranches: planData.maxBranches,
          maxCatalogItems: planData.maxCatalogItems,
          features: planData.features,
          precioMensual: planData.precioMensual,
          precioAnual: planData.precioAnual,
          orden: planData.orden,
          isDefault: planData.isDefault,
        },
      });
      results.push({ action: 'upserted', plan });
    }

    // Seed PlanSupportConfig for all plans
    const supportConfigs = [
      { planCode: PlanCode.FREE, ticketSupportEnabled: true, ticketResponseHours: 0, resolutionSLAHours: 0, phoneSupportEnabled: false, accountManagerEnabled: false, hasLiveChat: false, priority: 'BAJA' },
      { planCode: PlanCode.STARTER, ticketSupportEnabled: true, ticketResponseHours: 24, resolutionSLAHours: 48, phoneSupportEnabled: false, accountManagerEnabled: false, hasLiveChat: false, priority: 'NORMAL' },
      { planCode: PlanCode.PROFESSIONAL, ticketSupportEnabled: true, ticketResponseHours: 12, resolutionSLAHours: 24, phoneSupportEnabled: false, accountManagerEnabled: false, hasLiveChat: false, priority: 'ALTA' },
      { planCode: PlanCode.ENTERPRISE, ticketSupportEnabled: true, ticketResponseHours: 2, resolutionSLAHours: 8, phoneSupportEnabled: true, phoneSupportHours: 'Lun-Vie 8am-6pm CST', accountManagerEnabled: true, hasLiveChat: true, chatSchedule: 'Lun-Vie 8am-8pm CST, Sab 10am-2pm', priority: 'CRITICA' },
    ];

    for (const sc of supportConfigs) {
      await this.prisma.planSupportConfig.upsert({
        where: { planCode: sc.planCode },
        create: sc,
        update: sc,
      });
    }

    // Seed PlanFeature rows for FREE plan
    const freeFeatures = Object.entries(PLAN_CONFIGS.FREE.features);
    for (const [featureCode, enabled] of freeFeatures) {
      await this.prisma.planFeature.upsert({
        where: { planCode_featureCode: { planCode: PlanCode.FREE, featureCode } },
        create: { planCode: PlanCode.FREE, featureCode, enabled },
        update: { enabled },
      });
    }

    return { message: '4 planes creados/actualizados exitosamente', plans: results };
  }
}
