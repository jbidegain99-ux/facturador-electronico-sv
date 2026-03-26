import { RbacService } from './rbac.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { createMockPrismaService, MockPrismaClient } from '../../../test/helpers/mock-prisma';

describe('RbacService', () => {
  let service: RbacService;
  let prisma: MockPrismaClient;

  beforeEach(() => {
    prisma = createMockPrismaService();
    service = new RbacService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    service.invalidateAll();
  });

  describe('hasPermissions', () => {
    it('should return true when user has all required permissions via RBAC', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([
        {
          scopeType: 'tenant',
          scopeId: 'tenant-1',
          role: {
            permissions: [
              { permission: { code: 'dte:create' } },
              { permission: { code: 'dte:read' } },
              { permission: { code: 'dte:transmit' } },
            ],
          },
        },
      ]);

      const result = await service.hasPermissions('user-1', 'tenant-1', ['dte:create', 'dte:read']);
      expect(result).toBe(true);
    });

    it('should return false when user lacks a required permission', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([
        {
          scopeType: 'tenant',
          scopeId: 'tenant-1',
          role: {
            permissions: [
              { permission: { code: 'dte:read' } },
            ],
          },
        },
      ]);

      const result = await service.hasPermissions('user-1', 'tenant-1', ['dte:create', 'dte:read']);
      expect(result).toBe(false);
    });

    it('should union permissions from multiple role assignments', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([
        {
          scopeType: 'tenant',
          scopeId: 'tenant-1',
          role: {
            permissions: [{ permission: { code: 'dte:read' } }],
          },
        },
        {
          scopeType: 'tenant',
          scopeId: 'tenant-1',
          role: {
            permissions: [{ permission: { code: 'dte:create' } }],
          },
        },
      ]);

      const result = await service.hasPermissions('user-1', 'tenant-1', ['dte:create', 'dte:read']);
      expect(result).toBe(true);
    });
  });

  describe('legacy role fallback', () => {
    it('should fall back to ADMIN legacy role (all permissions)', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([]); // No RBAC assignments
      prisma.user.findUnique.mockResolvedValue({ rol: 'ADMIN' });
      prisma.permission.findMany.mockResolvedValue([
        { code: 'dte:create' },
        { code: 'dte:void' },
        { code: 'config:update' },
      ]);

      const result = await service.hasPermissions('user-1', 'tenant-1', ['dte:void', 'config:update']);
      expect(result).toBe(true);
    });

    it('should fall back to FACTURADOR legacy role (limited permissions)', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([]);
      prisma.user.findUnique.mockResolvedValue({ rol: 'FACTURADOR' });

      // FACTURADOR has dte:create but not dte:void
      const hasCreate = await service.hasPermissions('user-1', 'tenant-1', ['dte:create']);
      expect(hasCreate).toBe(true);

      service.invalidateUser('user-1', 'tenant-1');

      const hasVoid = await service.hasPermissions('user-1', 'tenant-1', ['dte:void']);
      expect(hasVoid).toBe(false);
    });

    it('should return false for unknown legacy role', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([]);
      prisma.user.findUnique.mockResolvedValue({ rol: 'UNKNOWN_ROLE' });

      const result = await service.hasPermissions('user-1', 'tenant-1', ['dte:read']);
      expect(result).toBe(false);
    });
  });

  describe('scope filtering', () => {
    it('should include tenant-scoped assignments regardless of request scope', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([
        {
          scopeType: 'tenant',
          scopeId: 'tenant-1',
          role: {
            permissions: [{ permission: { code: 'dte:read' } }],
          },
        },
      ]);

      const result = await service.hasPermissions(
        'user-1', 'tenant-1', ['dte:read'], { branchId: 'branch-99' },
      );
      expect(result).toBe(true);
    });

    it('should include branch-scoped assignment when branchId matches', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([
        {
          scopeType: 'branch',
          scopeId: 'branch-1',
          role: {
            permissions: [{ permission: { code: 'dte:create' } }],
          },
        },
      ]);

      const result = await service.hasPermissions(
        'user-1', 'tenant-1', ['dte:create'], { branchId: 'branch-1' },
      );
      expect(result).toBe(true);
    });

    it('should exclude branch-scoped assignment when branchId does not match', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([
        {
          scopeType: 'branch',
          scopeId: 'branch-1',
          role: {
            permissions: [{ permission: { code: 'dte:create' } }],
          },
        },
      ]);

      const result = await service.hasPermissions(
        'user-1', 'tenant-1', ['dte:create'], { branchId: 'branch-OTHER' },
      );
      expect(result).toBe(false);
    });
  });

  describe('caching', () => {
    it('should cache permissions and not re-query on second call', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([
        {
          scopeType: 'tenant',
          scopeId: 'tenant-1',
          role: {
            permissions: [{ permission: { code: 'dte:read' } }],
          },
        },
      ]);

      await service.hasPermissions('user-1', 'tenant-1', ['dte:read']);
      await service.hasPermissions('user-1', 'tenant-1', ['dte:read']);

      expect(prisma.userRoleAssignment.findMany).toHaveBeenCalledTimes(1);
    });

    it('should re-query after invalidation', async () => {
      prisma.userRoleAssignment.findMany.mockResolvedValue([
        {
          scopeType: 'tenant',
          scopeId: 'tenant-1',
          role: {
            permissions: [{ permission: { code: 'dte:read' } }],
          },
        },
      ]);

      await service.hasPermissions('user-1', 'tenant-1', ['dte:read']);
      service.invalidateUser('user-1', 'tenant-1');
      await service.hasPermissions('user-1', 'tenant-1', ['dte:read']);

      expect(prisma.userRoleAssignment.findMany).toHaveBeenCalledTimes(2);
    });
  });
});
