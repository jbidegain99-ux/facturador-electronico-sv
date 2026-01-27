import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface BackupStats {
  totalTenants: number;
  totalUsers: number;
  totalDtes: number;
  totalClientes: number;
  lastBackupDate: string | null;
  systemStatus: 'healthy' | 'warning' | 'error';
}

export interface TenantBackupData {
  tenant: any;
  users: any[];
  clientes: any[];
  dtes: any[];
  onboarding: any | null;
  emailConfig: any | null;
}

export interface SystemBackupData {
  metadata: {
    createdAt: string;
    version: string;
    type: 'full' | 'tenant';
    tenantId?: string;
  };
  data: TenantBackupData[] | TenantBackupData;
}

@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);

  constructor(private prisma: PrismaService) {}

  async getBackupStats(): Promise<BackupStats> {
    const [
      totalTenants,
      totalUsers,
      totalDtes,
      totalClientes,
    ] = await Promise.all([
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

  async generateFullBackup(): Promise<SystemBackupData> {
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

    const backupData: TenantBackupData[] = [];

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

  async generateTenantBackup(tenantId: string): Promise<SystemBackupData> {
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
    const [
      tenantCount,
      userCount,
      dteCount,
      clienteCount,
      dtesByStatus,
      tenantsByPlan,
    ] = await Promise.all([
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
    const estimatedSize = (
      tenantCount * 2 + // ~2KB per tenant
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
}
