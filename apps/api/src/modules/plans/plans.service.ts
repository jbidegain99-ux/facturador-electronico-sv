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
      },
      limits: {
        canCreateDte: plan?.maxDtesPerMonth === -1 || dtesThisMonth < (plan?.maxDtesPerMonth ?? 0),
        canAddUser: plan?.maxUsers === -1 || tenant._count.usuarios < (plan?.maxUsers ?? 0),
        canAddCliente: plan?.maxClientes === -1 || tenant._count.clientes < (plan?.maxClientes ?? 0),
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

  async checkLimit(tenantId: string, type: 'dte' | 'user' | 'cliente'): Promise<boolean> {
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
    const planDefinitions = [
      {
        codigo: PlanCode.STARTER,
        nombre: 'Starter',
        descripcion: 'Perfecto para pequenas empresas comenzando con facturacion electronica',
        maxDtesPerMonth: PLAN_CONFIGS.STARTER.limits.dtes,
        maxUsers: PLAN_CONFIGS.STARTER.limits.users,
        maxClientes: PLAN_CONFIGS.STARTER.limits.customers,
        maxStorageMb: PLAN_CONFIGS.STARTER.limits.storage * 1024,
        features: JSON.stringify(
          Object.entries(PLAN_CONFIGS.STARTER.features)
            .filter(([, v]) => v)
            .map(([k]) => k),
        ),
        precioMensual: PLAN_CONFIGS.STARTER.price.monthly,
        precioAnual: PLAN_CONFIGS.STARTER.price.yearly,
        orden: 1,
        isDefault: true,
      },
      {
        codigo: PlanCode.PROFESSIONAL,
        nombre: 'Professional',
        descripcion: 'Para empresas en crecimiento que necesitan herramientas avanzadas',
        maxDtesPerMonth: PLAN_CONFIGS.PROFESSIONAL.limits.dtes,
        maxUsers: PLAN_CONFIGS.PROFESSIONAL.limits.users,
        maxClientes: PLAN_CONFIGS.PROFESSIONAL.limits.customers,
        maxStorageMb: PLAN_CONFIGS.PROFESSIONAL.limits.storage * 1024,
        features: JSON.stringify(
          Object.entries(PLAN_CONFIGS.PROFESSIONAL.features)
            .filter(([, v]) => v)
            .map(([k]) => k),
        ),
        precioMensual: PLAN_CONFIGS.PROFESSIONAL.price.monthly,
        precioAnual: PLAN_CONFIGS.PROFESSIONAL.price.yearly,
        orden: 2,
      },
      {
        codigo: PlanCode.ENTERPRISE,
        nombre: 'Enterprise',
        descripcion: 'Solucion completa sin limites para grandes organizaciones',
        maxDtesPerMonth: PLAN_CONFIGS.ENTERPRISE.limits.dtes,
        maxUsers: PLAN_CONFIGS.ENTERPRISE.limits.users,
        maxClientes: PLAN_CONFIGS.ENTERPRISE.limits.customers,
        maxStorageMb: PLAN_CONFIGS.ENTERPRISE.limits.storage,
        features: JSON.stringify(
          Object.entries(PLAN_CONFIGS.ENTERPRISE.features)
            .filter(([, v]) => v)
            .map(([k]) => k),
        ),
        precioMensual: PLAN_CONFIGS.ENTERPRISE.price.monthly,
        precioAnual: PLAN_CONFIGS.ENTERPRISE.price.yearly,
        orden: 3,
      },
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
          features: planData.features,
          precioMensual: planData.precioMensual,
          precioAnual: planData.precioAnual,
          orden: planData.orden,
          isDefault: planData.isDefault,
        },
      });
      results.push({ action: 'upserted', plan });
    }

    return { message: '3 planes creados/actualizados exitosamente', plans: results };
  }
}
