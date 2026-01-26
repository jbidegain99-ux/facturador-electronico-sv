import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from './dto';

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
      } else {
        results.push({ action: 'exists', plan: existing });
      }
    }

    return results;
  }
}
