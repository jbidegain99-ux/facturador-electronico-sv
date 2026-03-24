import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlanFeatureGuard } from './plan-feature.guard';
import { PlanFeaturesService } from '../services/plan-features.service';
import { PrismaService } from '../../../prisma/prisma.service';

function createMockExecutionContext(user: Record<string, unknown> | null): ExecutionContext {
  const request = { user };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn() as unknown as ReturnType<ExecutionContext['getClass']>,
    getArgs: () => [],
    getArgByIndex: () => null,
    switchToRpc: () => ({} as ReturnType<ExecutionContext['switchToRpc']>),
    switchToWs: () => ({} as ReturnType<ExecutionContext['switchToWs']>),
    getType: () => 'http' as const,
  } as ExecutionContext;
}

describe('PlanFeatureGuard', () => {
  let guard: PlanFeatureGuard;
  let reflector: Reflector;
  let planFeaturesService: { getTenantPlanCode: jest.Mock; checkFeatureAccess: jest.Mock };
  let mockPrisma: { tenantFeatureUsage: { upsert: jest.Mock } };

  beforeEach(async () => {
    planFeaturesService = {
      getTenantPlanCode: jest.fn(),
      checkFeatureAccess: jest.fn(),
    };

    mockPrisma = {
      tenantFeatureUsage: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanFeatureGuard,
        Reflector,
        { provide: PlanFeaturesService, useValue: planFeaturesService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<PlanFeatureGuard>(PlanFeatureGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should allow access when no feature_required metadata is set (no decorator)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockExecutionContext({ tenantId: 'tenant-1' });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(planFeaturesService.getTenantPlanCode).not.toHaveBeenCalled();
    expect(planFeaturesService.checkFeatureAccess).not.toHaveBeenCalled();
  });

  it('should allow access when feature is enabled for tenant plan', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('quotes_b2b');
    planFeaturesService.getTenantPlanCode.mockResolvedValue('PROFESSIONAL');
    planFeaturesService.checkFeatureAccess.mockResolvedValue(true);

    const context = createMockExecutionContext({
      id: 'user-1',
      tenantId: 'tenant-1',
      rol: 'ADMIN',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(planFeaturesService.getTenantPlanCode).toHaveBeenCalledWith('tenant-1');
    expect(planFeaturesService.checkFeatureAccess).toHaveBeenCalledWith('PROFESSIONAL', 'quotes_b2b');
  });

  it('should deny access when feature is not enabled for tenant plan', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('webhooks');
    planFeaturesService.getTenantPlanCode.mockResolvedValue('STARTER');
    planFeaturesService.checkFeatureAccess.mockResolvedValue(false);

    const context = createMockExecutionContext({
      id: 'user-1',
      tenantId: 'tenant-1',
      rol: 'ADMIN',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException with plan code in message', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('webhooks');
    planFeaturesService.getTenantPlanCode.mockResolvedValue('STARTER');
    planFeaturesService.checkFeatureAccess.mockResolvedValue(false);

    const context = createMockExecutionContext({
      id: 'user-1',
      tenantId: 'tenant-1',
      rol: 'ADMIN',
    });

    try {
      await guard.canActivate(context);
      fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).message).toContain('STARTER');
    }
  });

  it('should include plan code PROFESSIONAL in error message when denied', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('api_full');
    planFeaturesService.getTenantPlanCode.mockResolvedValue('PROFESSIONAL');
    planFeaturesService.checkFeatureAccess.mockResolvedValue(false);

    const context = createMockExecutionContext({
      id: 'user-1',
      tenantId: 'tenant-1',
      rol: 'ADMIN',
    });

    try {
      await guard.canActivate(context);
      fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).message).toContain('PROFESSIONAL');
    }
  });

  it('should throw ForbiddenException when user has no tenantId', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('quotes_b2b');

    const context = createMockExecutionContext({
      id: 'user-1',
      tenantId: null,
      rol: 'ADMIN',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow('Usuario no tiene tenant asignado');
  });

  it('should throw ForbiddenException when no user on request', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('quotes_b2b');

    const context = createMockExecutionContext(null);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user object has no tenantId property', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('invoicing');

    const context = createMockExecutionContext({ id: 'user-1', rol: 'ADMIN' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should track denied feature usage via prisma upsert', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('webhooks');
    planFeaturesService.getTenantPlanCode.mockResolvedValue('STARTER');
    planFeaturesService.checkFeatureAccess.mockResolvedValue(false);

    const context = createMockExecutionContext({
      id: 'user-1',
      tenantId: 'tenant-1',
      rol: 'ADMIN',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);

    expect(mockPrisma.tenantFeatureUsage.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId_featureCode: {
            tenantId: 'tenant-1',
            featureCode: 'webhooks',
          },
        },
        create: expect.objectContaining({
          tenantId: 'tenant-1',
          featureCode: 'webhooks',
          usageCount: 1,
        }),
        update: expect.objectContaining({
          usageCount: { increment: 1 },
        }),
      }),
    );
  });

  it('should not throw if tracking denied usage fails', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('webhooks');
    planFeaturesService.getTenantPlanCode.mockResolvedValue('STARTER');
    planFeaturesService.checkFeatureAccess.mockResolvedValue(false);
    mockPrisma.tenantFeatureUsage.upsert.mockRejectedValue(new Error('DB connection lost'));

    const context = createMockExecutionContext({
      id: 'user-1',
      tenantId: 'tenant-1',
      rol: 'ADMIN',
    });

    // Should still throw ForbiddenException, not the DB error
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
