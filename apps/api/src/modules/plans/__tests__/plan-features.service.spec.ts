import { Test, TestingModule } from '@nestjs/testing';
import { PlanFeaturesService } from '../services/plan-features.service';
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
      prisma.planFeature.findUnique.mockResolvedValue(null);

      // ENTERPRISE should have webhooks via hardcoded fallback
      const result = await service.checkFeatureAccess('ENTERPRISE', 'webhooks');
      expect(result).toBe(true);
    });

    it('should deny webhooks for STARTER via fallback', async () => {
      prisma.planFeature.findUnique.mockResolvedValue(null);

      const result = await service.checkFeatureAccess('STARTER', 'webhooks');
      expect(result).toBe(false);
    });

    it('should normalize legacy plan codes', async () => {
      prisma.planFeature.findUnique.mockResolvedValue(null);

      // PRO should normalize to PROFESSIONAL which has quotes_b2b
      const result = await service.checkFeatureAccess('PRO', 'quotes_b2b');
      expect(result).toBe(true);
    });

    it('should grant invoicing to all plans', async () => {
      prisma.planFeature.findUnique.mockResolvedValue(null);

      expect(await service.checkFeatureAccess('STARTER', 'invoicing')).toBe(true);
      expect(await service.checkFeatureAccess('PROFESSIONAL', 'invoicing')).toBe(true);
      expect(await service.checkFeatureAccess('ENTERPRISE', 'invoicing')).toBe(true);
    });

    it('should grant accounting to STARTER, PROFESSIONAL, ENTERPRISE but not FREE', async () => {
      prisma.planFeature.findUnique.mockResolvedValue(null);

      expect(await service.checkFeatureAccess('FREE', 'accounting')).toBe(false);
      expect(await service.checkFeatureAccess('STARTER', 'accounting')).toBe(true);
      expect(await service.checkFeatureAccess('PROFESSIONAL', 'accounting')).toBe(true);
      expect(await service.checkFeatureAccess('ENTERPRISE', 'accounting')).toBe(true);
    });

    it('should grant webhooks only to ENTERPRISE', async () => {
      prisma.planFeature.findUnique.mockResolvedValue(null);

      expect(await service.checkFeatureAccess('FREE', 'webhooks')).toBe(false);
      expect(await service.checkFeatureAccess('STARTER', 'webhooks')).toBe(false);
      expect(await service.checkFeatureAccess('PROFESSIONAL', 'webhooks')).toBe(false);
      expect(await service.checkFeatureAccess('ENTERPRISE', 'webhooks')).toBe(true);
    });

    it('should deny phone_support for non-ENTERPRISE plans', async () => {
      prisma.planFeature.findUnique.mockResolvedValue(null);

      expect(await service.checkFeatureAccess('STARTER', 'phone_support')).toBe(false);
      expect(await service.checkFeatureAccess('PROFESSIONAL', 'phone_support')).toBe(false);
      expect(await service.checkFeatureAccess('ENTERPRISE', 'phone_support')).toBe(true);
    });

    it('should deny quotes_b2b for STARTER but allow for PROFESSIONAL', async () => {
      prisma.planFeature.findUnique.mockResolvedValue(null);

      expect(await service.checkFeatureAccess('STARTER', 'quotes_b2b')).toBe(false);
      expect(await service.checkFeatureAccess('PROFESSIONAL', 'quotes_b2b')).toBe(true);
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
      expect(result).not.toContain('phone_support');
      expect(result).not.toContain('external_email');
      expect(result).toHaveLength(6);
    });

    it('should return PROFESSIONAL features (8 enabled, no webhooks/api)', async () => {
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
  });

  describe('getPlanLimits', () => {
    it('should return limits for FREE (10 DTEs, 10 clients, 1 branch)', async () => {
      const limits = await service.getPlanLimits('FREE');
      expect(limits.maxDtesPerMonth).toBe(10);
      expect(limits.maxClients).toBe(10);
      expect(limits.maxUsers).toBe(1);
      expect(limits.maxBranches).toBe(1);
      expect(limits.maxCatalogItems).toBe(50);
    });

    it('should return limits for STARTER (300 DTEs, 100 clients, 1 branch)', async () => {
      const limits = await service.getPlanLimits('STARTER');
      expect(limits.maxDtesPerMonth).toBe(300);
      expect(limits.maxClients).toBe(100);
      expect(limits.maxUsers).toBe(3);
      expect(limits.maxBranches).toBe(1);
      expect(limits.maxCatalogItems).toBe(300);
    });

    it('should return limits for PROFESSIONAL (2000 DTEs, 500 clients, 5 branches)', async () => {
      const limits = await service.getPlanLimits('PROFESSIONAL');
      expect(limits.maxDtesPerMonth).toBe(2000);
      expect(limits.maxClients).toBe(500);
      expect(limits.maxUsers).toBe(10);
      expect(limits.maxBranches).toBe(5);
      expect(limits.maxCatalogItems).toBe(1000);
    });

    it('should return unlimited for ENTERPRISE', async () => {
      const limits = await service.getPlanLimits('ENTERPRISE');
      expect(limits.maxDtesPerMonth).toBe(-1);
      expect(limits.maxClients).toBe(-1);
      expect(limits.maxUsers).toBe(-1);
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

    it('should never exceed for unlimited plans', async () => {
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
      expect(result.canAddBranch).toBe(false); // STARTER limit is 1
      expect(result.limits.maxBranches).toBe(1);
    });
  });
});
