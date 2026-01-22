import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  // ============ DASHBOARD STATS ============
  async getDashboardStats() {
    const [
      totalTenants,
      activeTenants,
      suspendedTenants,
      trialTenants,
      totalUsers,
      totalDtes,
      dtesThisMonth,
    ] = await Promise.all([
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
      dtesByStatus: dtesByStatus.map((s: { estado: string; _count: { estado: number } }) => ({ status: s.estado, count: s._count.estado })),
      tenantsByPlan: tenantsByPlan.map((p: { plan: string; _count: { plan: number } }) => ({ plan: p.plan, count: p._count.plan })),
      last7Days,
    };
  }

  private async getLast7DaysDtes() {
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
  async getAllTenants(params: {
    page?: number;
    limit?: number;
    search?: string;
    plan?: string;
    status?: string;
  }) {
    const { page = 1, limit = 10, search, plan, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { nit: { contains: search, mode: 'insensitive' } },
        { correo: { contains: search, mode: 'insensitive' } },
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

  async getTenantById(id: string) {
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
      throw new NotFoundException('Empresa no encontrada');
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
      dteStats: dteStats.map((s: { estado: string; _count: { estado: number } }) => ({ status: s.estado, count: s._count.estado })),
      dtesLast30Days,
    };
  }

  async updateTenantPlan(id: string, data: {
    plan?: string;
    planStatus?: string;
    planExpiry?: Date;
    maxDtesPerMonth?: number;
    adminNotes?: string;
  }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: {
        plan: data.plan as any,
        planStatus: data.planStatus as any,
        planExpiry: data.planExpiry,
        maxDtesPerMonth: data.maxDtesPerMonth,
        adminNotes: data.adminNotes,
      },
    });
  }

  async suspendTenant(id: string, reason?: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: {
        planStatus: 'SUSPENDED',
        adminNotes: reason ? `SUSPENDIDO: ${reason}\n${tenant.adminNotes || ''}` : tenant.adminNotes,
      },
    });
  }

  async activateTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: { planStatus: 'ACTIVE' },
    });
  }

  async deleteTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Empresa no encontrada');
    }

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

    return { message: 'Empresa eliminada correctamente' };
  }

  // ============ SUPER ADMIN MANAGEMENT ============
  async createSuperAdmin(data: { email: string; password: string; nombre: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('Ya existe un usuario con este correo');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
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
  async bootstrapSuperAdmin(data: { email: string; password: string; nombre: string }) {
    // Check if any SUPER_ADMIN already exists
    const existingAdmin = await this.prisma.user.findFirst({
      where: { rol: 'SUPER_ADMIN' },
    });

    if (existingAdmin) {
      throw new ConflictException('Ya existe un Super Administrador. Use el panel de admin para crear mas.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('Ya existe un usuario con este correo');
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

  async hasSuperAdmin(): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { rol: 'SUPER_ADMIN' },
    });
    return count > 0;
  }
}
