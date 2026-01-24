import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailAdapterFactory } from '../adapters/adapter.factory';
import { TenantEmailConfig } from '@prisma/client';
import { HealthStatus } from '../types/email.types';

export interface HealthDashboardStats {
  total: number;
  healthy: number;
  degraded: number;
  unhealthy: number;
  pending: number;
  healthPercentage: number;
}

export interface TenantHealthStatus {
  tenantId: string;
  tenantName: string;
  provider: string;
  status: HealthStatus;
  lastCheck?: Date;
  lastError?: string;
  isActive: boolean;
  isVerified: boolean;
}

@Injectable()
export class EmailHealthService {
  private readonly logger = new Logger(EmailHealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adapterFactory: EmailAdapterFactory,
  ) {}

  /**
   * Run health checks on all active email configurations
   * Runs every 15 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async runScheduledHealthChecks() {
    this.logger.log('Starting scheduled email health checks...');

    const activeConfigs = await this.prisma.tenantEmailConfig.findMany({
      where: { isActive: true },
      include: { tenant: true },
    });

    let healthy = 0;
    let unhealthy = 0;

    for (const config of activeConfigs) {
      try {
        const result = await this.checkHealth(config);
        if (result.status === HealthStatus.HEALTHY) {
          healthy++;
        } else {
          unhealthy++;
        }
      } catch (error) {
        unhealthy++;
        this.logger.error(
          `Health check failed for tenant ${config.tenantId}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    this.logger.log(
      `Health checks completed. Healthy: ${healthy}, Unhealthy: ${unhealthy}`,
    );
  }

  /**
   * Check health of a single configuration
   */
  async checkHealth(config: TenantEmailConfig) {
    const adapter = this.adapterFactory.createAdapter(config);
    const startTime = Date.now();

    try {
      const result = await adapter.testConnection();

      const status = result.success
        ? HealthStatus.HEALTHY
        : HealthStatus.UNHEALTHY;

      // Record health check
      await this.prisma.emailHealthCheck.create({
        data: {
          configId: config.id,
          checkType: 'CONNECTION_TEST',
          status,
          responseTimeMs: result.responseTimeMs,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode,
        },
      });

      // Check if OAuth token needs refresh
      if (
        config.oauth2RefreshToken &&
        config.oauth2TokenExpiry &&
        new Date(config.oauth2TokenExpiry) <
          new Date(Date.now() + 24 * 60 * 60 * 1000)
      ) {
        await this.refreshOAuthToken(config);
      }

      if (adapter.dispose) {
        await adapter.dispose();
      }

      return { status, responseTimeMs: result.responseTimeMs };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.emailHealthCheck.create({
        data: {
          configId: config.id,
          checkType: 'CONNECTION_TEST',
          status: HealthStatus.UNHEALTHY,
          responseTimeMs: Date.now() - startTime,
          errorMessage,
        },
      });

      if (adapter.dispose) {
        await adapter.dispose();
      }

      return { status: HealthStatus.UNHEALTHY, error: errorMessage };
    }
  }

  /**
   * Refresh OAuth token for configurations that need it
   */
  private async refreshOAuthToken(config: TenantEmailConfig) {
    this.logger.log(`Refreshing OAuth token for tenant ${config.tenantId}`);

    const adapter = this.adapterFactory.createAdapter(config);

    if (!adapter.refreshOAuthToken) {
      return;
    }

    try {
      const result = await adapter.refreshOAuthToken();

      if (result.success) {
        // The adapter updates its internal config, but we need to persist
        // Note: In a real implementation, we'd need to encrypt and save the new tokens
        await this.prisma.emailHealthCheck.create({
          data: {
            configId: config.id,
            checkType: 'OAUTH_REFRESH',
            status: HealthStatus.HEALTHY,
          },
        });

        this.logger.log(
          `OAuth token refreshed successfully for tenant ${config.tenantId}`,
        );
      } else {
        await this.prisma.emailHealthCheck.create({
          data: {
            configId: config.id,
            checkType: 'OAUTH_REFRESH',
            status: HealthStatus.UNHEALTHY,
            errorMessage: result.errorMessage,
          },
        });

        this.logger.warn(
          `OAuth token refresh failed for tenant ${config.tenantId}: ${result.errorMessage}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `OAuth token refresh error for tenant ${config.tenantId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }

    if (adapter.dispose) {
      await adapter.dispose();
    }
  }

  /**
   * Get health dashboard statistics (for admin)
   */
  async getDashboardStats(): Promise<HealthDashboardStats> {
    const configs = await this.prisma.tenantEmailConfig.findMany({
      include: {
        healthChecks: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
    });

    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;
    let pending = 0;

    for (const config of configs) {
      if (!config.isActive && !config.isVerified) {
        pending++;
        continue;
      }

      const lastCheck = config.healthChecks[0];
      if (!lastCheck) {
        pending++;
        continue;
      }

      switch (lastCheck.status) {
        case HealthStatus.HEALTHY:
          healthy++;
          break;
        case HealthStatus.DEGRADED:
          degraded++;
          break;
        case HealthStatus.UNHEALTHY:
          unhealthy++;
          break;
        default:
          pending++;
      }
    }

    const total = configs.length;
    const healthPercentage =
      total > 0 ? Math.round((healthy / total) * 100) : 0;

    return {
      total,
      healthy,
      degraded,
      unhealthy,
      pending,
      healthPercentage,
    };
  }

  /**
   * Get all tenant health statuses (for admin dashboard)
   */
  async getAllTenantHealth(): Promise<TenantHealthStatus[]> {
    const configs = await this.prisma.tenantEmailConfig.findMany({
      include: {
        tenant: true,
        healthChecks: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
    });

    return configs.map((config) => {
      const lastCheck = config.healthChecks[0];

      return {
        tenantId: config.tenantId,
        tenantName: config.tenant.nombre,
        provider: config.provider,
        status: lastCheck?.status || HealthStatus.UNKNOWN,
        lastCheck: lastCheck?.checkedAt,
        lastError: lastCheck?.errorMessage || undefined,
        isActive: config.isActive,
        isVerified: config.isVerified,
      };
    });
  }

  /**
   * Get tenants with issues (unhealthy or degraded)
   */
  async getTenantsWithIssues(): Promise<TenantHealthStatus[]> {
    const allHealth = await this.getAllTenantHealth();

    return allHealth.filter(
      (t) =>
        t.status === HealthStatus.UNHEALTHY ||
        t.status === HealthStatus.DEGRADED,
    );
  }

  /**
   * Force a health check for a specific tenant
   */
  async forceHealthCheck(tenantId: string) {
    const config = await this.prisma.tenantEmailConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      throw new Error('Email configuration not found');
    }

    return this.checkHealth(config);
  }
}
