import { Test, TestingModule } from '@nestjs/testing';
import { PlanFeaturesService } from './plan-features.service';
import { PrismaService } from '../../../prisma/prisma.service';

interface MockPrisma {
  tenant: { findUnique: jest.Mock };
  planFeature: { findUnique: jest.Mock; findMany: jest.Mock };
  dTE: { count: jest.Mock };
  cliente: { count: jest.Mock };
  sucursal: { count: jest.Mock };
}

function createMockPrisma(): MockPrisma {
  return {
    tenant: { findUnique: jest.fn() },
    planFeature: { findUnique: jest.fn(), findMany: jest.fn() },
    dTE: { count: jest.fn() },
    cliente: { count: jest.fn() },
    sucursal: { count: jest.fn() },
  };
}

describe('PlanFeaturesService', () => {
  let service: PlanFeaturesService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanFeaturesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PlanFeaturesService>(PlanFeaturesService);
  });

  describe('getTenantPlanCode', () => {
    it('should return normalized plan code from tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'PROFESSIONAL' });
      const result = await service.getTenantPlanCode('tenant-1');
      expect(result).toBe('PROFESSIONAL');
    });

    it('should normalize legacy BASIC to STARTER', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'BASIC' });
      const result = await service.getTenantPlanCode('tenant-1');
      expect(result).toBe('STARTER');
    });

    it('should normalize legacy PRO to PROFESSIONAL', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'PRO' });
      const result = await service.getTenantPlanCode('tenant-1');
      expect(result).toBe('PROFESSIONAL');
    });

    it('should normalize legacy EMPRESARIAL to ENTERPRISE', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'EMPRESARIAL' });
      const result = await service.getTenantPlanCode('tenant-1');
      expect(result).toBe('ENTERPRISE');
    });

    it('should normalize legacy DEMO to STARTER', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'DEMO' });
      const result = await service.getTenantPlanCode('tenant-1');
      expect(result).toBe('STARTER');
    });

    it('should normalize legacy TRIAL to STARTER', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'TRIAL' });
      const result = await service.getTenantPlanCode('tenant-1');
      expect(result).toBe('STARTER');
    });

    it('should default to STARTER when tenant not found', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);
      const result = await service.getTenantPlanCode('nonexistent');
      expect(result).toBe('STARTER');
    });
  });

  describe('checkFeatureAccess', () => {
    beforeEach(() => {
      // Default: no DB overrides, so fallback to hardcoded PLAN_CONFIGS
      prisma.planFeature.findUnique.mockResolvedValue(null);
    });

    it('should return true when database says feature is enabled', async () => {
      prisma.planFeature.findUnique.mockResolvedValue({
        planCode: 'PROFESSIONAL',
        featureCode: 'quotes_b2b',
        enabled: true,
      });

      const result = await service.checkFeatureAccess('PROFESSIONAL', 'quotes_b2b');
      expect(result).toBe(true);
    });

    it('should return false when database says feature is disabled', async () => {
      prisma.planFeature.findUnique.mockResolvedValue({
        planCode: 'STARTER',
        featureCode: 'quotes_b2b',
        enabled: false,
      });

      const result = await service.checkFeatureAccess('STARTER', 'quotes_b2b');
      expect(result).toBe(false);
    });

    it('should fall back to hardcoded features when not in database', async () => {
      const result = await service.checkFeatureAccess('ENTERPRISE', 'webhooks');
      expect(result).toBe(true);
    });

    // --- Exact test cases from spec ---

    it('checkFeatureAccess(FREE, invoicing) should be true', async () => {
      expect(await service.checkFeatureAccess('FREE', 'invoicing')).toBe(true);
    });

    it('checkFeatureAccess(FREE, accounting) should be false', async () => {
      expect(await service.checkFeatureAccess('FREE', 'accounting')).toBe(false);
    });

    it('checkFeatureAccess(STARTER, accounting) should be true', async () => {
      expect(await service.checkFeatureAccess('STARTER', 'accounting')).toBe(true);
    });

    it('checkFeatureAccess(STARTER, quotes_b2b) should be false', async () => {
      expect(await service.checkFeatureAccess('STARTER', 'quotes_b2b')).toBe(false);
    });

    it('checkFeatureAccess(PROFESSIONAL, quotes_b2b) should be true', async () => {
      expect(await service.checkFeatureAccess('PROFESSIONAL', 'quotes_b2b')).toBe(true);
    });

    it('checkFeatureAccess(PROFESSIONAL, webhooks) should be false', async () => {
      expect(await service.checkFeatureAccess('PROFESSIONAL', 'webhooks')).toBe(false);
    });

    it('checkFeatureAccess(ENTERPRISE, webhooks) should be true', async () => {
      expect(await service.checkFeatureAccess('ENTERPRISE', 'webhooks')).toBe(true);
    });

    it('checkFeatureAccess(ENTERPRISE, api_full) should be true', async () => {
      expect(await service.checkFeatureAccess('ENTERPRISE', 'api_full')).toBe(true);
    });

    it('should grant invoicing to all plans', async () => {
      expect(await service.checkFeatureAccess('FREE', 'invoicing')).toBe(true);
      expect(await service.checkFeatureAccess('STARTER', 'invoicing')).toBe(true);
      expect(await service.checkFeatureAccess('PROFESSIONAL', 'invoicing')).toBe(true);
      expect(await service.checkFeatureAccess('ENTERPRISE', 'invoicing')).toBe(true);
    });

    it('should grant accounting to STARTER+ but not FREE', async () => {
      expect(await service.checkFeatureAccess('FREE', 'accounting')).toBe(false);
      expect(await service.checkFeatureAccess('STARTER', 'accounting')).toBe(true);
      expect(await service.checkFeatureAccess('PROFESSIONAL', 'accounting')).toBe(true);
      expect(await service.checkFeatureAccess('ENTERPRISE', 'accounting')).toBe(true);
    });

    it('should grant webhooks and api_full only to ENTERPRISE', async () => {
      expect(await service.checkFeatureAccess('FREE', 'webhooks')).toBe(false);
      expect(await service.checkFeatureAccess('STARTER', 'webhooks')).toBe(false);
      expect(await service.checkFeatureAccess('PROFESSIONAL', 'webhooks')).toBe(false);
      expect(await service.checkFeatureAccess('ENTERPRISE', 'webhooks')).toBe(true);

      expect(await service.checkFeatureAccess('FREE', 'api_full')).toBe(false);
      expect(await service.checkFeatureAccess('STARTER', 'api_full')).toBe(false);
      expect(await service.checkFeatureAccess('PROFESSIONAL', 'api_full')).toBe(false);
      expect(await service.checkFeatureAccess('ENTERPRISE', 'api_full')).toBe(true);
    });

    it('should deny phone_support for non-ENTERPRISE plans', async () => {
      expect(await service.checkFeatureAccess('FREE', 'phone_support')).toBe(false);
      expect(await service.checkFeatureAccess('STARTER', 'phone_support')).toBe(false);
      expect(await service.checkFeatureAccess('PROFESSIONAL', 'phone_support')).toBe(false);
      expect(await service.checkFeatureAccess('ENTERPRISE', 'phone_support')).toBe(true);
    });

    // --- Legacy alias normalization ---

    it('should normalize BASIC to STARTER features', async () => {
      expect(await service.checkFeatureAccess('BASIC', 'accounting')).toBe(true);
      expect(await service.checkFeatureAccess('BASIC', 'quotes_b2b')).toBe(false);
    });

    it('should normalize PRO to PROFESSIONAL features', async () => {
      expect(await service.checkFeatureAccess('PRO', 'quotes_b2b')).toBe(true);
      expect(await service.checkFeatureAccess('PRO', 'webhooks')).toBe(false);
    });

    it('should normalize EMPRESARIAL to ENTERPRISE features', async () => {
      expect(await service.checkFeatureAccess('EMPRESARIAL', 'webhooks')).toBe(true);
      expect(await service.checkFeatureAccess('EMPRESARIAL', 'api_full')).toBe(true);
    });

    it('should use FREE defaults for unknown plan codes', async () => {
      expect(await service.checkFeatureAccess('UNKNOWN_PLAN', 'invoicing')).toBe(true);
      expect(await service.checkFeatureAccess('UNKNOWN_PLAN', 'accounting')).toBe(false);
    });
  });

  describe('getPlanFeatures', () => {
    it('should return database features when available', async () => {
      prisma.planFeature.findMany.mockResolvedValue([
        { featureCode: 'invoicing' },
        { featureCode: 'catalog' },
        { featureCode: 'quotes_b2b' },
      ]);

      const result = await service.getPlanFeatures('PROFESSIONAL');
      expect(result).toEqual(['invoicing', 'catalog', 'quotes_b2b']);
    });

    it('should fall back to hardcoded features when database empty', async () => {
      prisma.planFeature.findMany.mockResolvedValue([]);

      const result = await service.getPlanFeatures('ENTERPRISE');
      expect(result).toContain('invoicing');
      expect(result).toContain('accounting');
      expect(result).toContain('webhooks');
      expect(result).toContain('api_full');
      expect(result).toContain('phone_support');
      expect(result).toContain('external_email');
      expect(result).toContain('hacienda_setup_support');
      expect(result).toHaveLength(13); // all 13 features enabled
    });

    it('should return FREE features (3 enabled)', async () => {
      prisma.planFeature.findMany.mockResolvedValue([]);

      const result = await service.getPlanFeatures('FREE');
      expect(result).toContain('invoicing');
      expect(result).toContain('catalog');
      expect(result).toContain('ticket_support');
      expect(result).not.toContain('accounting');
      expect(result).not.toContain('recurring_invoices');
      expect(result).toHaveLength(3);
    });

    it('should return STARTER features (6 enabled)', async () => {
      prisma.planFeature.findMany.mockResolvedValue([]);

      const result = await service.getPlanFeatures('STARTER');
      expect(result).toContain('invoicing');
      expect(result).toContain('accounting');
      expect(result).toContain('catalog');
      expect(result).toContain('recurring_invoices');
      expect(result).toContain('ticket_support');
      expect(result).toContain('logo_branding');
      expect(result).not.toContain('quotes_b2b');
      expect(result).not.toContain('webhooks');
      expect(result).toHaveLength(6);
    });

    it('should return PROFESSIONAL features (10 enabled)', async () => {
      prisma.planFeature.findMany.mockResolvedValue([]);

      const result = await service.getPlanFeatures('PROFESSIONAL');
      expect(result).toContain('invoicing');
      expect(result).toContain('accounting');
      expect(result).toContain('quotes_b2b');
      expect(result).toContain('advanced_reports');
      expect(result).toContain('external_email');
      expect(result).toContain('hacienda_setup_support');
      expect(result).not.toContain('webhooks');
      expect(result).not.toContain('api_full');
      expect(result).not.toContain('phone_support');
      expect(result).toHaveLength(10);
    });
  });

  describe('getPlanLimits', () => {
    it('should return limits for FREE plan', async () => {
      const limits = await service.getPlanLimits('FREE');
      expect(limits).toEqual({
        maxDtesPerMonth: 10,
        maxClients: 10,
        maxUsers: 1,
        maxStorageGb: 0.5,
        maxBranches: 1,
        maxCatalogItems: 50,
      });
    });

    it('should return limits for STARTER plan', async () => {
      const limits = await service.getPlanLimits('STARTER');
      expect(limits).toEqual({
        maxDtesPerMonth: 300,
        maxClients: 100,
        maxUsers: 3,
        maxStorageGb: 1,
        maxBranches: 1,
        maxCatalogItems: 300,
      });
    });

    it('should return limits for PROFESSIONAL plan', async () => {
      const limits = await service.getPlanLimits('PROFESSIONAL');
      expect(limits).toEqual({
        maxDtesPerMonth: 2000,
        maxClients: 500,
        maxUsers: 10,
        maxStorageGb: 10,
        maxBranches: 5,
        maxCatalogItems: 1000,
      });
    });

    it('should return unlimited (-1) for ENTERPRISE plan', async () => {
      const limits = await service.getPlanLimits('ENTERPRISE');
      expect(limits).toEqual({
        maxDtesPerMonth: -1,
        maxClients: -1,
        maxUsers: -1,
        maxStorageGb: -1,
        maxBranches: -1,
        maxCatalogItems: -1,
      });
    });

    it('should normalize BASIC to STARTER limits', async () => {
      const limits = await service.getPlanLimits('BASIC');
      expect(limits.maxDtesPerMonth).toBe(300);
      expect(limits.maxClients).toBe(100);
      expect(limits.maxBranches).toBe(1);
    });

    it('should normalize PRO to PROFESSIONAL limits', async () => {
      const limits = await service.getPlanLimits('PRO');
      expect(limits.maxDtesPerMonth).toBe(2000);
      expect(limits.maxClients).toBe(500);
      expect(limits.maxBranches).toBe(5);
    });

    it('should normalize EMPRESARIAL to ENTERPRISE limits', async () => {
      const limits = await service.getPlanLimits('EMPRESARIAL');
      expect(limits.maxDtesPerMonth).toBe(-1);
      expect(limits.maxClients).toBe(-1);
      expect(limits.maxBranches).toBe(-1);
    });

    it('should normalize DEMO to STARTER limits', async () => {
      const limits = await service.getPlanLimits('DEMO');
      expect(limits.maxDtesPerMonth).toBe(300);
      expect(limits.maxClients).toBe(100);
      expect(limits.maxBranches).toBe(1);
    });
  });

  describe('checkDTELimitExceeded', () => {
    it('should return false when under limit', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'STARTER' });

      const result = await service.checkDTELimitExceeded('tenant-1', 50);
      expect(result).toBe(false);
    });

    it('should return true when at limit', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'STARTER' });

      const result = await service.checkDTELimitExceeded('tenant-1', 300);
      expect(result).toBe(true);
    });

    it('should return true when over limit', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'FREE' });

      const result = await service.checkDTELimitExceeded('tenant-1', 15);
      expect(result).toBe(true);
    });

    it('should never exceed for unlimited ENTERPRISE plan', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'ENTERPRISE' });

      const result = await service.checkDTELimitExceeded('tenant-1', 99999);
      expect(result).toBe(false);
    });
  });

  describe('checkCustomerLimitExceeded', () => {
    it('should return false when under limit', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'PROFESSIONAL' });

      const result = await service.checkCustomerLimitExceeded('tenant-1', 200);
      expect(result).toBe(false);
    });

    it('should return true when at limit', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'PROFESSIONAL' });

      const result = await service.checkCustomerLimitExceeded('tenant-1', 500);
      expect(result).toBe(true);
    });

    it('should never exceed for ENTERPRISE', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'ENTERPRISE' });

      const result = await service.checkCustomerLimitExceeded('tenant-1', 99999);
      expect(result).toBe(false);
    });
  });

  describe('checkBranchLimitExceeded', () => {
    it('should return false when under limit', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'PROFESSIONAL' });

      const result = await service.checkBranchLimitExceeded('tenant-1', 3);
      expect(result).toBe(false);
    });

    it('should return true when at limit for STARTER (max 1)', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'STARTER' });

      const result = await service.checkBranchLimitExceeded('tenant-1', 1);
      expect(result).toBe(true);
    });

    it('should return true when at limit for PROFESSIONAL (max 5)', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'PROFESSIONAL' });

      const result = await service.checkBranchLimitExceeded('tenant-1', 5);
      expect(result).toBe(true);
    });

    it('should never exceed for ENTERPRISE', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'ENTERPRISE' });

      const result = await service.checkBranchLimitExceeded('tenant-1', 99999);
      expect(result).toBe(false);
    });
  });

  describe('getTenantUsageInfo', () => {
    it('should return full usage info', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'PROFESSIONAL' });
      prisma.planFeature.findMany.mockResolvedValue([
        { featureCode: 'invoicing' },
        { featureCode: 'accounting' },
        { featureCode: 'quotes_b2b' },
      ]);
      prisma.dTE.count.mockResolvedValue(50);
      prisma.cliente.count.mockResolvedValue(30);
      prisma.sucursal.count.mockResolvedValue(2);

      const result = await service.getTenantUsageInfo('tenant-1');

      expect(result.planCode).toBe('PROFESSIONAL');
      expect(result.enabledFeatures).toEqual(['invoicing', 'accounting', 'quotes_b2b']);
      expect(result.limits.maxDtesPerMonth).toBe(2000);
      expect(result.limits.maxBranches).toBe(5);
      expect(result.usage.dtesThisMonth).toBe(50);
      expect(result.usage.clientCount).toBe(30);
      expect(result.usage.branchCount).toBe(2);
      expect(result.canCreateDte).toBe(true);
      expect(result.canAddClient).toBe(true);
      expect(result.canAddBranch).toBe(true);
    });

    it('should flag canCreateDte false when at limit', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'STARTER' });
      prisma.planFeature.findMany.mockResolvedValue([]);
      prisma.dTE.count.mockResolvedValue(300);
      prisma.cliente.count.mockResolvedValue(5);
      prisma.sucursal.count.mockResolvedValue(0);

      const result = await service.getTenantUsageInfo('tenant-1');
      expect(result.canCreateDte).toBe(false);
      expect(result.canAddClient).toBe(true);
    });

    it('should flag canAddBranch false when at limit for STARTER', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'STARTER' });
      prisma.planFeature.findMany.mockResolvedValue([]);
      prisma.dTE.count.mockResolvedValue(0);
      prisma.cliente.count.mockResolvedValue(0);
      prisma.sucursal.count.mockResolvedValue(1);

      const result = await service.getTenantUsageInfo('tenant-1');
      expect(result.canAddBranch).toBe(false);
      expect(result.limits.maxBranches).toBe(1);
    });

    it('should always allow everything for ENTERPRISE', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'ENTERPRISE' });
      prisma.planFeature.findMany.mockResolvedValue([]);
      prisma.dTE.count.mockResolvedValue(50000);
      prisma.cliente.count.mockResolvedValue(10000);
      prisma.sucursal.count.mockResolvedValue(100);

      const result = await service.getTenantUsageInfo('tenant-1');
      expect(result.canCreateDte).toBe(true);
      expect(result.canAddClient).toBe(true);
      expect(result.canAddBranch).toBe(true);
    });
  });
});
