import { PrismaService } from '../../../prisma/prisma.service';
import { EmailAdapterFactory } from '../adapters/adapter.factory';
import { HealthStatus, TenantEmailConfig } from '../types/email.types';
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
export declare class EmailHealthService {
    private readonly prisma;
    private readonly adapterFactory;
    private readonly logger;
    constructor(prisma: PrismaService, adapterFactory: EmailAdapterFactory);
    /**
     * Run health checks on all active email configurations
     * Runs every 15 minutes
     */
    runScheduledHealthChecks(): Promise<void>;
    /**
     * Check health of a single configuration
     */
    checkHealth(config: TenantEmailConfig): Promise<{
        status: "HEALTHY" | "UNHEALTHY";
        responseTimeMs: number;
        error?: undefined;
    } | {
        status: "UNHEALTHY";
        error: string;
        responseTimeMs?: undefined;
    }>;
    /**
     * Refresh OAuth token for configurations that need it
     */
    private refreshOAuthToken;
    /**
     * Get health dashboard statistics (for admin)
     */
    getDashboardStats(): Promise<HealthDashboardStats>;
    /**
     * Get all tenant health statuses (for admin dashboard)
     */
    getAllTenantHealth(): Promise<TenantHealthStatus[]>;
    /**
     * Get tenants with issues (unhealthy or degraded)
     */
    getTenantsWithIssues(): Promise<TenantHealthStatus[]>;
    /**
     * Force a health check for a specific tenant
     */
    forceHealthCheck(tenantId: string): Promise<{
        status: "HEALTHY" | "UNHEALTHY";
        responseTimeMs: number;
        error?: undefined;
    } | {
        status: "UNHEALTHY";
        error: string;
        responseTimeMs?: undefined;
    }>;
}
//# sourceMappingURL=email-health.service.d.ts.map