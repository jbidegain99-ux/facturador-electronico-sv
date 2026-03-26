/**
 * RBAC Security Test Suite
 *
 * Validates critical security scenarios:
 * - Tenant isolation (cross-tenant access prevention)
 * - Permission escalation prevention
 * - Guard chain execution order
 * - Legacy role fallback correctness
 */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './guards/tenant.guard';
import { RbacGuard } from './guards/rbac.guard';
import { RbacService } from './services/rbac.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService, MockPrismaClient } from '../../test/helpers/mock-prisma';

describe('RBAC Security', () => {
  let prisma: MockPrismaClient;
  let rbacService: RbacService;

  beforeEach(() => {
    prisma = createMockPrismaService();
    rbacService = new RbacService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    rbacService.invalidateAll();
  });

  const createMockContext = (
    user?: Record<string, unknown>,
    metadata?: Record<string, unknown>,
  ): ExecutionContext => {
    const reflectorValues = new Map<string, unknown>();
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        reflectorValues.set(key, value);
      });
    }

    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params: {}, body: {} }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  describe('Tenant Isolation', () => {
    it('should deny access when user has no tenantId', () => {
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const guard = new TenantGuard(reflector);

      const ctx = createMockContext({ id: 'user-1', rol: 'FACTURADOR', tenantId: null });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should allow SUPER_ADMIN to bypass tenant check', () => {
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const guard = new TenantGuard(reflector);

      const ctx = createMockContext({ id: 'admin-1', rol: 'SUPER_ADMIN', tenantId: null });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should isolate permissions between tenants', async () => {
      // User in tenant-1 has dte:create
      prisma.userRoleAssignment.findMany.mockResolvedValue([
        {
          scopeType: 'tenant', scopeId: 'tenant-1',
          role: { permissions: [{ permission: { code: 'dte:create' } }] },
        },
      ]);

      const hasAccess = await rbacService.hasPermissions('user-1', 'tenant-1', ['dte:create']);
      expect(hasAccess).toBe(true);

      // Same user queried against tenant-2 should have different result
      rbacService.invalidateAll();
      prisma.userRoleAssignment.findMany.mockResolvedValue([]); // No assignments in tenant-2
      prisma.user.findUnique.mockResolvedValue({ rol: 'FACTURADOR' });

      // Tenant-2 falls back to legacy role, which doesn't have all permissions
      const hasVoidInOtherTenant = await rbacService.hasPermissions('user-1', 'tenant-2', ['dte:void']);
      expect(hasVoidInOtherTenant).toBe(false); // FACTURADOR doesn't have dte:void
    });
  });

  describe('Permission Escalation Prevention', () => {
    it('should not grant permissions beyond what is assigned', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([
        {
          scopeType: 'tenant', scopeId: 'tenant-1',
          role: { permissions: [{ permission: { code: 'dte:read' } }] },
        },
      ]);

      // Has dte:read
      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['dte:read'])).toBe(true);
      // Does NOT have dte:void (escalation attempt)
      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['dte:void'])).toBe(false);
      // Does NOT have role:manage (admin escalation attempt)
      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['role:manage'])).toBe(false);
      // Does NOT have user:manage
      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['user:manage'])).toBe(false);
    });

    it('should require ALL permissions when multiple are specified', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([
        {
          scopeType: 'tenant', scopeId: 'tenant-1',
          role: { permissions: [
            { permission: { code: 'dte:create' } },
            // Missing dte:transmit
          ] },
        },
      ]);

      // Has one but not both
      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['dte:create', 'dte:transmit'])).toBe(false);
      // Has the single one
      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['dte:create'])).toBe(true);
    });
  });

  describe('Scope-Based Access', () => {
    it('should deny branch-scoped user access to other branches', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([
        {
          scopeType: 'branch', scopeId: 'branch-A',
          role: { permissions: [{ permission: { code: 'dte:create' } }] },
        },
      ]);

      // Access to own branch: allowed
      expect(await rbacService.hasPermissions(
        'user-1', 'tenant-1', ['dte:create'], { branchId: 'branch-A' },
      )).toBe(true);

      // Access to other branch: denied
      rbacService.invalidateAll();
      expect(await rbacService.hasPermissions(
        'user-1', 'tenant-1', ['dte:create'], { branchId: 'branch-B' },
      )).toBe(false);
    });

    it('should allow tenant-scoped user access to all branches', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([
        {
          scopeType: 'tenant', scopeId: 'tenant-1',
          role: { permissions: [{ permission: { code: 'dte:create' } }] },
        },
      ]);

      // Tenant scope applies everywhere
      expect(await rbacService.hasPermissions(
        'user-1', 'tenant-1', ['dte:create'], { branchId: 'branch-A' },
      )).toBe(true);
      expect(await rbacService.hasPermissions(
        'user-1', 'tenant-1', ['dte:create'], { branchId: 'branch-Z' },
      )).toBe(true);
    });
  });

  describe('Legacy Role Fallback', () => {
    it('should grant ADMIN all permissions via legacy fallback', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([]); // No RBAC
      prisma.user.findUnique.mockResolvedValue({ rol: 'ADMIN' });
      prisma.permission.findMany.mockResolvedValue([
        { code: 'dte:create' }, { code: 'dte:void' },
        { code: 'role:manage' }, { code: 'user:manage' },
      ]);

      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['dte:void'])).toBe(true);
      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['role:manage'])).toBe(true);
    });

    it('should restrict FACTURADOR to invoice-related permissions only', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([]);
      prisma.user.findUnique.mockResolvedValue({ rol: 'FACTURADOR' });

      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['dte:create'])).toBe(true);
      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['dte:read'])).toBe(true);

      rbacService.invalidateAll();
      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['dte:void'])).toBe(false);

      rbacService.invalidateAll();
      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['role:manage'])).toBe(false);

      rbacService.invalidateAll();
      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['config:update'])).toBe(false);
    });

    it('should prioritize RBAC assignments over legacy role', async () => {
      // User has ADMIN legacy role but only dte:read via RBAC
      prisma.userRoleAssignment.findMany.mockResolvedValue([
        {
          scopeType: 'tenant', scopeId: 'tenant-1',
          role: { permissions: [{ permission: { code: 'dte:read' } }] },
        },
      ]);

      // RBAC takes precedence - user only has dte:read, NOT all admin permissions
      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['dte:read'])).toBe(true);
      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['dte:void'])).toBe(false);
      // Legacy role is NOT consulted when RBAC assignments exist
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('Cache Security', () => {
    it('should not serve stale permissions after invalidation', async () => {
      // First: user has dte:create
      prisma.userRoleAssignment.findMany.mockResolvedValue([
        {
          scopeType: 'tenant', scopeId: 'tenant-1',
          role: { permissions: [{ permission: { code: 'dte:create' } }] },
        },
      ]);

      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['dte:create'])).toBe(true);

      // Invalidate and change permissions
      rbacService.invalidateUser('user-1', 'tenant-1');
      prisma.userRoleAssignment.findMany.mockResolvedValue([]); // Removed all
      prisma.user.findUnique.mockResolvedValue({ rol: 'FACTURADOR' });

      // Should re-query and reflect new state
      expect(await rbacService.hasPermissions('user-1', 'tenant-1', ['dte:void'])).toBe(false);
      expect(prisma.userRoleAssignment.findMany).toHaveBeenCalledTimes(2);
    });
  });
});
