import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

interface ScopeContext {
  branchId?: string;
  posId?: string;
}

interface CachedPermissions {
  permissions: Set<string>;
  expiresAt: number;
}

/** Maps legacy User.rol values to equivalent permission sets for backward compatibility. */
const LEGACY_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['*'], // Full access
  FACTURADOR: [
    'dte:create', 'dte:read', 'dte:update', 'dte:transmit', 'dte:export',
    'client:create', 'client:read', 'client:update',
    'catalog:read', 'quote:create', 'quote:read', 'quote:update',
    'branch:read', 'pos:read', 'report:read',
  ],
  GERENTE: [
    'dte:create', 'dte:read', 'dte:update', 'dte:void', 'dte:transmit', 'dte:export',
    'client:create', 'client:read', 'client:update', 'client:delete',
    'branch:read', 'pos:read', 'pos:update',
    'report:read', 'report:export', 'catalog:read', 'catalog:manage',
    'quote:create', 'quote:read', 'quote:update', 'quote:delete', 'quote:send',
    'user:read', 'inventory:adjust',
  ],
  CONTADOR: [
    'dte:read', 'dte:export', 'client:read',
    'report:read', 'report:export',
    'accounting:read', 'accounting:create', 'accounting:approve',
    'catalog:read', 'inventory:adjust',
  ],
};

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  // L1 in-memory cache: key = "userId:tenantId"
  private cache = new Map<string, CachedPermissions>();
  private readonly CACHE_TTL_MS = 30_000; // 30 seconds

  constructor(private prisma: PrismaService) {}

  /**
   * Check if a user has ALL the required permissions.
   */
  async hasPermissions(
    userId: string,
    tenantId: string,
    requiredPermissions: string[],
    scope?: ScopeContext,
  ): Promise<boolean> {
    const userPermissions = await this.getEffectivePermissions(userId, tenantId, scope);
    return requiredPermissions.every((p) => userPermissions.has(p));
  }

  /**
   * Resolve the full set of permission codes for a user within a tenant.
   * Checks RBAC assignments first; falls back to legacy rol field.
   */
  async getEffectivePermissions(
    userId: string,
    tenantId: string,
    scope?: ScopeContext,
  ): Promise<Set<string>> {
    const cacheKey = `${userId}:${tenantId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions;
    }

    // Query all active role assignments for this user in this tenant
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        userId,
        tenantId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    let permissions: Set<string>;

    if (assignments.length > 0) {
      // RBAC path: collect permissions from applicable role assignments
      permissions = this.resolveFromAssignments(assignments, scope);
    } else {
      // Legacy fallback: derive permissions from User.rol field
      permissions = await this.resolveFromLegacyRole(userId);
    }

    // Cache the result
    this.cache.set(cacheKey, {
      permissions,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    return permissions;
  }

  /**
   * Collect permissions from RBAC assignments, filtering by applicable scope.
   * Permissions are additive (UNION of all matching roles).
   */
  private resolveFromAssignments(
    assignments: Array<{
      scopeType: string;
      scopeId: string;
      role: {
        permissions: Array<{
          permission: { code: string };
        }>;
      };
    }>,
    scope?: ScopeContext,
  ): Set<string> {
    const permissions = new Set<string>();

    for (const assignment of assignments) {
      // Check if this assignment's scope applies
      if (!this.isScopeApplicable(assignment.scopeType, assignment.scopeId, scope)) {
        continue;
      }

      for (const rp of assignment.role.permissions) {
        permissions.add(rp.permission.code);
      }
    }

    return permissions;
  }

  /**
   * Determine if a role assignment's scope applies to the current request context.
   *
   * - "tenant" scope always applies (covers everything in the tenant)
   * - "branch" scope applies if the request targets that branch or any of its POS
   * - "pos" scope applies only if the request targets that specific POS
   *
   * When no scope context is provided (e.g. list endpoints), tenant-level
   * assignments always apply, but branch/pos assignments also apply since
   * the user has SOME access within the tenant.
   */
  private isScopeApplicable(
    scopeType: string,
    scopeId: string,
    scope?: ScopeContext,
  ): boolean {
    if (scopeType === 'tenant') return true;

    // If no specific scope requested, include all assignments
    // (the endpoint isn't scoped to a specific branch/pos)
    if (!scope?.branchId && !scope?.posId) return true;

    if (scopeType === 'branch') {
      return scopeId === scope?.branchId;
    }

    if (scopeType === 'pos') {
      return scopeId === scope?.posId;
    }

    return false;
  }

  /**
   * Fallback: derive permissions from the legacy User.rol string field.
   * Used when no RBAC UserRoleAssignment records exist for the user.
   */
  private async resolveFromLegacyRole(userId: string): Promise<Set<string>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { rol: true },
    });

    if (!user) return new Set();

    const legacyPerms = LEGACY_ROLE_PERMISSIONS[user.rol];
    if (!legacyPerms) return new Set();

    // Wildcard "*" means all permissions
    if (legacyPerms.includes('*')) {
      const allPerms = await this.prisma.permission.findMany({ select: { code: true } });
      return new Set(allPerms.map((p) => p.code));
    }

    return new Set(legacyPerms);
  }

  /**
   * Invalidate cached permissions for a specific user in a tenant.
   * Call this when role assignments change.
   */
  invalidateUser(userId: string, tenantId: string): void {
    this.cache.delete(`${userId}:${tenantId}`);
  }

  /**
   * Invalidate all cached permissions (e.g. after bulk permission changes).
   */
  invalidateAll(): void {
    this.cache.clear();
  }
}
