import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { normalizePlanCode, getPlanFeatures, PLAN_CONFIGS, PlanCode, FeatureCode } from '../../../common/plan-features';

export interface PlanLimits {
  maxDtesPerMonth: number;
  maxClients: number;
  maxCatalogItems: number;
  maxUsers: number;
  maxStorageGb: number;
}

export interface TenantUsageInfo {
  planCode: string;
  enabledFeatures: FeatureCode[];
  limits: PlanLimits;
  usage: {
    dtesThisMonth: number;
    clientCount: number;
  };
  canCreateDte: boolean;
  canAddClient: boolean;
}

@Injectable()
export class PlanFeaturesService {
  private readonly logger = new Logger(PlanFeaturesService.name);

  constructor(private prisma: PrismaService) {}

  async getTenantPlanCode(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });
    return normalizePlanCode(tenant?.plan ?? 'STARTER');
  }

  /**
   * Check if a plan has a specific feature enabled.
   * First checks database (plan_features table), then falls back to hardcoded PLAN_CONFIGS.
   */
  async checkFeatureAccess(planCode: string, featureCode: string): Promise<boolean> {
    const normalized = normalizePlanCode(planCode);

    // Try database first
    const dbFeature = await this.prisma.planFeature.findUnique({
      where: { planCode_featureCode: { planCode: normalized, featureCode } },
    });

    if (dbFeature !== null) {
      return dbFeature.enabled;
    }

    // Fallback to hardcoded PLAN_CONFIGS
    const config = PLAN_CONFIGS[normalized as PlanCode];
    if (config) {
      return config.features[featureCode as FeatureCode] ?? false;
    }

    // Unknown plan code: use STARTER features as default
    return PLAN_CONFIGS[PlanCode.STARTER].features[featureCode as FeatureCode] ?? false;
  }

  async getPlanFeatures(planCode: string): Promise<FeatureCode[]> {
    const normalized = normalizePlanCode(planCode);

    const dbFeatures = await this.prisma.planFeature.findMany({
      where: { planCode: normalized, enabled: true },
      select: { featureCode: true },
    });

    if (dbFeatures.length > 0) {
      return dbFeatures.map((f) => f.featureCode as FeatureCode);
    }

    // Fallback: derive from hardcoded PLAN_CONFIGS
    const config = PLAN_CONFIGS[normalized as PlanCode] ?? PLAN_CONFIGS[PlanCode.STARTER];
    return (Object.entries(config.features) as [FeatureCode, boolean][])
      .filter(([, enabled]) => enabled)
      .map(([code]) => code);
  }

  async getPlanLimits(planCode: string): Promise<PlanLimits> {
    const normalized = normalizePlanCode(planCode);
    const config = PLAN_CONFIGS[normalized as PlanCode] ?? PLAN_CONFIGS[PlanCode.STARTER];
    return {
      maxDtesPerMonth: config.limits.dtes,
      maxClients: config.limits.customers,
      maxCatalogItems: config.limits.dtes === -1 ? -1 : Math.min(config.limits.dtes, 1000),
      maxUsers: config.limits.users,
      maxStorageGb: config.limits.storage,
    };
  }

  async checkDTELimitExceeded(tenantId: string, currentCount: number): Promise<boolean> {
    const planCode = await this.getTenantPlanCode(tenantId);
    const limits = await this.getPlanLimits(planCode);
    if (limits.maxDtesPerMonth === -1) return false;
    return currentCount >= limits.maxDtesPerMonth;
  }

  async checkCustomerLimitExceeded(tenantId: string, currentCount: number): Promise<boolean> {
    const planCode = await this.getTenantPlanCode(tenantId);
    const limits = await this.getPlanLimits(planCode);
    if (limits.maxClients === -1) return false;
    return currentCount >= limits.maxClients;
  }

  async getTenantUsageInfo(tenantId: string): Promise<TenantUsageInfo> {
    const planCode = await this.getTenantPlanCode(tenantId);
    const [enabledFeatures, limits] = await Promise.all([
      this.getPlanFeatures(planCode),
      this.getPlanLimits(planCode),
    ]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [dtesThisMonth, clientCount] = await Promise.all([
      this.prisma.dTE.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.cliente.count({
        where: { tenantId },
      }),
    ]);

    return {
      planCode,
      enabledFeatures,
      limits,
      usage: { dtesThisMonth, clientCount },
      canCreateDte: limits.maxDtesPerMonth === -1 || dtesThisMonth < limits.maxDtesPerMonth,
      canAddClient: limits.maxClients === -1 || clientCount < limits.maxClients,
    };
  }
}
