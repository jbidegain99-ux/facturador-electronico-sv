# RBAC Multi-Tenant Architecture Analysis - Facturosv

**Date:** 2026-03-26
**Scope:** Full security and architecture audit for RBAC implementation
**Codebase:** `facturador-electronico-sv/apps/api`

---

## 1. Current Authentication & Authorization Architecture

### 1.1 Request Flow (Current State)

```
Client Request
  │
  ▼
┌─────────────────────────────┐
│  Helmet (security headers)  │
│  CORS (origin validation)   │
│  ValidationPipe (whitelist) │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  ThrottlerGuard (APP_GUARD) │  ← 20/sec, 300/min, 5000/hr
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  JwtAuthGuard (APP_GUARD)   │  ← Checks @Public() decorator
│  ├─ @Public() → skip        │
│  └─ Otherwise → validate JWT│
│     └─ JwtStrategy.validate │
│        ├─ User exists in DB?│
│        └─ tenantId matches? │  ← Prevents stale tokens
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  Controller-level Guards    │
│  ├─ SuperAdminGuard         │  ← user.rol === 'SUPER_ADMIN'
│  └─ PlanFeatureGuard        │  ← @RequireFeature('accounting')
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  Controller Handler         │
│  └─ @CurrentUser() extracts │
│     { id, email, tenantId,  │
│       rol, tenant }         │
└─────────────────────────────┘
```

### 1.2 JWT Payload

```typescript
interface JwtPayload {
  sub: string;      // User ID (cuid)
  email: string;
  tenantId: string; // Tenant isolation key
  rol: string;      // SUPER_ADMIN | ADMIN | FACTURADOR
}
```

- **Token expiration:** 8 hours
- **Stale token protection:** JwtStrategy validates `payload.tenantId === user.tenantId` in DB on every request
- **Tenant source:** Always from JWT, never from request params (correct pattern)

### 1.3 Existing Guards

| Guard | Scope | Purpose |
|-------|-------|---------|
| `JwtAuthGuard` | APP_GUARD (global) | JWT validation, respects @Public() |
| `ThrottlerGuard` | APP_GUARD (global) | Rate limiting (3-tier) |
| `SuperAdminGuard` | Controller-level | Checks `user.rol === 'SUPER_ADMIN'` |
| `PlanFeatureGuard` | Controller-level | Feature gating by plan |

### 1.4 Existing Decorators

| Decorator | Purpose |
|-----------|---------|
| `@Public()` | Skip JWT auth on endpoint |
| `@CurrentUser()` | Extract user from `request.user` |
| `@RequireFeature(code)` | Require plan feature |

### 1.5 What's Missing

| Component | Status | Priority |
|-----------|--------|----------|
| `TenantGuard` | Not implemented | HIGH |
| `RbacGuard` / `@RequirePermission()` | Not implemented | HIGH |
| `nestjs-cls` (AsyncLocalStorage) | Not installed | MEDIUM |
| `@casl/core` + `@casl/prisma` | Not installed | MEDIUM |
| Redis caching layer | Not installed | MEDIUM |
| Role/Permission DB tables | Not present | HIGH |
| Prisma Client Extension for tenant | Not implemented | HIGH |
| Audit log for permission changes | Partial (AuditLog table exists) | MEDIUM |

---

## 2. Prisma Schema Audit

### 2.1 Tenant Isolation Coverage

**Total models:** 53
**Models with direct `tenantId`:** 25 (correctly isolated)
**Models isolated via FK relation:** 8 (DTELog via DTE, PuntoVenta via Sucursal, etc.)
**System-wide reference data (no tenant needed):** 7 (Catalogo, Plan, PlanFeature, etc.)
**Models needing attention:** 2

### 2.2 Models Missing Direct Tenant Isolation

| Model | Current Isolation | Risk | Recommendation |
|-------|-------------------|------|----------------|
| **PuntoVenta** | Via `sucursalId → Sucursal.tenantId` | MEDIUM - Direct queries skip tenant | Add `tenantId` field + index |
| **DTELog** | Via `dteId → DTE.tenantId` | LOW - Always queried via DTE | Add `tenantId` for direct query safety |

### 2.3 Existing Indexes (Strong)

The schema already has excellent compound indexes with `tenantId` as first column:
- `DTE: @@unique([tenantId, numeroControl])`, `@@index([tenantId, estado, createdAt])`
- `Cliente: @@unique([tenantId, numDocumento])`, `@@index([tenantId, createdAt])`
- `CatalogItem: @@unique([tenantId, code])`, 5 compound indexes
- `Quote: @@unique([tenantId, quoteNumber])`, 3 compound indexes
- `JournalEntry: @@unique([tenantId, entryNumber])`, 3 compound indexes
- All major models have `@@index([tenantId])` at minimum

### 2.4 Soft Deletes

**Current state:** No `deletedAt` fields exist in the schema. Hard deletes only.

**Recommendation:** For RBAC, add soft deletes to security-sensitive models (User, Role assignments) for audit trail. Not blocking for initial RBAC implementation.

### 2.5 Cross-Tenant Relationship Risks

| Relationship | Risk | Mitigation |
|-------------|------|------------|
| `DTE → Cliente` | Cliente could belong to different tenant | Application-level check exists (same tenantId) |
| `Quote → Cliente` | Same as above | Application-level check exists |
| `DTE → PuntoVenta` | PuntoVenta lacks tenantId | Add tenantId to PuntoVenta |
| `SupportTicket → User (assignee)` | Assignee could be from different tenant | SuperAdmin only assigns; acceptable |
| `User.tenantId` nullable | Allows users without tenant | Intentional for SUPER_ADMIN; acceptable |

---

## 3. Security Vulnerabilities Found

### 3.1 CRITICAL: DTE Service Optional tenantId

**File:** `modules/dte/dte.service.ts`
**Impact:** Cross-tenant DTE access possible

```typescript
// VULNERABLE: tenantId is optional
async signDte(dteId: string, tenantId?: string) {
  const dte = tenantId
    ? await this.prisma.dTE.findFirst({ where: { id: dteId, tenantId } })
    : await this.prisma.dTE.findUnique({ where: { id: dteId } }); // NO TENANT!
}
```

The cron service calls `signDte(dte.id)` without tenantId. While the cron fetches DTEs by tenant already, the service method itself is unsafe.

**Fix:** Make `tenantId` required:
```typescript
async signDte(dteId: string, tenantId: string) {
  const dte = await this.prisma.dTE.findFirst({
    where: { id: dteId, tenantId },
    include: { tenant: true },
  });
}
```

### 3.2 CRITICAL: Recurring Invoice Scheduler No Tenant Filter

**File:** `modules/recurring-invoices/recurring-invoices.service.ts`

```typescript
// VULNERABLE: Returns templates from ALL tenants
async getDueTemplates() {
  return this.prisma.recurringInvoiceTemplate.findMany({
    where: { status: 'ACTIVE', nextRunDate: { lte: new Date() } },
    // Missing: tenantId filter
  });
}
```

This is a cron context - it's intentionally querying all tenants. However, `recordSuccess()` and `recordFailure()` should validate tenant ownership.

**Fix:** Add tenant validation in record methods:
```typescript
async recordSuccess(templateId: string, dteId: string, tenantId: string) {
  const template = await this.prisma.recurringInvoiceTemplate.findFirst({
    where: { id: templateId, tenantId },
  });
}
```

### 3.3 MEDIUM: Support Service Fetch-Then-Check Pattern

**File:** `modules/support/support.service.ts`

```typescript
// SUBOPTIMAL: Fetches first, then checks tenant
const ticket = await this.prisma.supportTicket.findUnique({
  where: { id: ticketId }, // No tenant filter
});
if (ticket.tenantId !== tenantId) throw new ForbiddenException();
```

**Fix:** Single query with tenant filter:
```typescript
const ticket = await this.prisma.supportTicket.findFirst({
  where: { id: ticketId, tenantId },
});
if (!ticket) throw new NotFoundException();
```

### 3.4 Summary

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1 | CRITICAL | Optional tenantId in signDte/transmitDte | dte.service.ts |
| 2 | CRITICAL | No tenant validation in recordSuccess/recordFailure | recurring-invoices.service.ts |
| 3 | MEDIUM | Fetch-then-check pattern in support service | support.service.ts |
| 4 | LOW | SuperAdmin endpoints accept arbitrary tenantId | super-admin.controller.ts (acceptable - admin only) |

---

## 4. Proposed RBAC Schema

### 4.1 New Prisma Models

```prisma
// ─── Role Templates (system-wide, immutable) ───
model RoleTemplate {
  id          String   @id @default(cuid())
  code        String   @unique        // tenant_admin, branch_manager, cashier, accountant, viewer
  name        String                  // Display name
  description String?
  isSystem    Boolean  @default(true) // Cannot be deleted
  createdAt   DateTime @default(now())

  permissions RoleTemplatePermission[]
  roles       Role[]                  // Roles derived from this template
}

// ─── Permissions (system-wide, enumerated) ───
model Permission {
  id       String @id @default(cuid())
  code     String @unique  // e.g., "dte:create", "dte:void", "branch:read", "user:manage"
  resource String          // e.g., "dte", "branch", "user", "report", "config"
  action   String          // e.g., "create", "read", "update", "delete", "void", "transmit"
  name     String          // Display name: "Crear DTE"
  category String          // UI grouping: "Facturación", "Administración", etc.

  templatePermissions RoleTemplatePermission[]
  rolePermissions     RolePermission[]

  @@unique([resource, action])
  @@index([resource])
}

// ─── Template ↔ Permission mapping ───
model RoleTemplatePermission {
  id           String @id @default(cuid())
  templateId   String
  permissionId String
  template     RoleTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  permission   Permission   @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([templateId, permissionId])
}

// ─── Tenant-Scoped Roles ───
model Role {
  id          String  @id @default(cuid())
  tenantId    String
  tenant      Tenant  @relation(fields: [tenantId], references: [id], onDelete: NoAction)
  name        String                  // Can be customized: "Cajero Senior"
  templateId  String?                 // Derived from template (null = fully custom)
  template    RoleTemplate? @relation(fields: [templateId], references: [id])
  isCustom    Boolean @default(false) // true = tenant created custom role
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  permissions  RolePermission[]
  assignments  UserRoleAssignment[]

  @@unique([tenantId, name])
  @@index([tenantId])
}

// ─── Role ↔ Permission (tenant-level override) ───
model RolePermission {
  id           String @id @default(cuid())
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
}

// ─── User ↔ Role Assignment (with scope) ───
model UserRoleAssignment {
  id        String   @id @default(cuid())
  userId    String
  roleId    String
  tenantId  String

  // Hierarchical scope
  scopeType String   // "tenant" | "branch" | "pos"
  scopeId   String   // tenantId | sucursalId | puntoVentaId

  assignedBy String  // userId of who assigned
  assignedAt DateTime @default(now())
  expiresAt  DateTime? // Optional expiration

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: NoAction)

  // Prevent duplicate role assignments at same scope
  @@unique([userId, roleId, scopeType, scopeId])
  @@index([userId, tenantId])
  @@index([tenantId])
  @@index([scopeType, scopeId])
}
```

### 4.2 Scope Hierarchy

```
Tenant (Empresa)           scopeType: "tenant"   scopeId: tenant.id
  ├─ Sucursal A            scopeType: "branch"   scopeId: sucursal.id
  │   ├─ PuntoVenta 1      scopeType: "pos"      scopeId: puntoVenta.id
  │   └─ PuntoVenta 2      scopeType: "pos"      scopeId: puntoVenta.id
  └─ Sucursal B            scopeType: "branch"   scopeId: sucursal.id
      └─ PuntoVenta 3      scopeType: "pos"      scopeId: puntoVenta.id
```

**Inheritance rules:**
- `tenant` scope → access to ALL branches and POS within that tenant
- `branch` scope → access to that branch and ALL its POS
- `pos` scope → access to that POS only

**Resolution algorithm:**
```
getEffectivePermissions(userId, tenantId, branchId?, posId?):
  1. Get all UserRoleAssignments for userId + tenantId
  2. Filter to applicable scopes:
     - scopeType=tenant (always applies)
     - scopeType=branch where scopeId=branchId (if branchId provided)
     - scopeType=pos where scopeId=posId (if posId provided)
  3. Collect all permissions from matched roles
  4. UNION all permissions (most permissive wins)
  5. Return deduplicated permission set
```

**Conflict resolution:** If user has `cashier` at branch level and `viewer` at tenant level, they get the UNION of both permission sets. No denials - permissions are additive only.

### 4.3 Default Role Templates

| Template Code | Permissions | Typical Scope |
|--------------|-------------|---------------|
| `tenant_admin` | ALL permissions | tenant |
| `branch_manager` | dte:*, branch:read, user:read, report:read, client:*, config:read | branch |
| `cashier` | dte:create, dte:read, client:read, client:create | pos |
| `accountant` | dte:read, report:*, accounting:*, client:read | tenant |
| `viewer` | dte:read, client:read, report:read | tenant/branch |

### 4.4 Permission Catalog

```
Resource     Actions                              Codes
─────────    ─────────────────────────             ─────
dte          create, read, update, void, transmit  dte:create, dte:read, dte:update, dte:void, dte:transmit
client       create, read, update, delete          client:create, client:read, client:update, client:delete
branch       read, update                          branch:read, branch:update
pos          read, update                          pos:read, pos:update
user         read, manage                          user:read, user:manage
role         read, manage                          role:read, role:manage
report       read, export                          report:read, report:export
accounting   read, create, approve                 accounting:read, accounting:create, accounting:approve
config       read, update                          config:read, config:update
catalog      read, manage                          catalog:read, catalog:manage
quote        create, read, update, delete, send    quote:create, quote:read, quote:update, quote:delete, quote:send
webhook      read, manage                          webhook:read, webhook:manage
```

---

## 5. Implementation Reference Code

### 5.1 Guard Chain (Proposed)

```
Request → ThrottlerGuard → JwtAuthGuard → TenantGuard → RbacGuard → Handler
              (global)        (global)      (NEW global)  (NEW global)
```

### 5.2 TenantGuard

```typescript
// guards/tenant.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const SKIP_TENANT_KEY = 'skipTenantCheck';
export const SkipTenantCheck = () => SetMetadata(SKIP_TENANT_KEY, true);

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip for public routes (already handled by JwtAuthGuard)
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Skip if explicitly marked
    const skipTenant = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipTenant) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // SUPER_ADMIN can operate without tenant (for admin endpoints)
    if (user?.rol === 'SUPER_ADMIN') return true;

    if (!user?.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    return true;
  }
}
```

### 5.3 RbacGuard + @RequirePermission Decorator

```typescript
// decorators/require-permission.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'requiredPermission';

// Usage: @RequirePermission('dte:create') or @RequirePermission('dte:create', 'dte:transmit')
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSION_KEY, permissions);
```

```typescript
// guards/rbac.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { RbacService } from '../services/rbac.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @RequirePermission decorator = allow (backward compatible)
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Public routes already handled
    if (!user) return true;

    // SUPER_ADMIN bypasses all permission checks
    if (user.rol === 'SUPER_ADMIN') return true;

    // Resolve scope from request (branch/pos context)
    const scopeContext = this.resolveScopeFromRequest(request);

    const hasPermission = await this.rbacService.hasPermissions(
      user.id,
      user.tenantId,
      requiredPermissions,
      scopeContext,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permisos insuficientes. Se requiere: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  private resolveScopeFromRequest(request: Record<string, unknown>): {
    branchId?: string;
    posId?: string;
  } {
    const params = request.params as Record<string, string> | undefined;
    const body = request.body as Record<string, string> | undefined;
    return {
      branchId: params?.sucursalId || body?.sucursalId,
      posId: params?.puntoVentaId || body?.puntoVentaId,
    };
  }
}
```

### 5.4 RBAC Service

```typescript
// services/rbac.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ScopeContext {
  branchId?: string;
  posId?: string;
}

interface CachedPermissions {
  permissions: Set<string>;
  expiresAt: number;
}

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  // L1 in-memory cache (per-process)
  // Key: `${userId}:${tenantId}`
  private cache = new Map<string, CachedPermissions>();
  private readonly CACHE_TTL_MS = 30_000; // 30 seconds

  constructor(private prisma: PrismaService) {}

  async hasPermissions(
    userId: string,
    tenantId: string,
    requiredPermissions: string[],
    scope?: ScopeContext,
  ): Promise<boolean> {
    const userPermissions = await this.getEffectivePermissions(userId, tenantId, scope);
    return requiredPermissions.every((p) => userPermissions.has(p));
  }

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

    // Query all role assignments for this user in this tenant
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

    // Filter assignments by applicable scope
    const applicableAssignments = assignments.filter((a) => {
      if (a.scopeType === 'tenant') return true;
      if (a.scopeType === 'branch' && scope?.branchId === a.scopeId) return true;
      if (a.scopeType === 'pos' && scope?.posId === a.scopeId) return true;
      // Branch scope also applies to its child POS
      if (a.scopeType === 'branch' && scope?.posId) {
        // Would need to check if POS belongs to this branch
        // For performance, this check can be done via a preloaded map
        return false; // Simplified - full impl would check POS→Branch relationship
      }
      return false;
    });

    // Collect all permissions (UNION / additive)
    const permissions = new Set<string>();
    for (const assignment of applicableAssignments) {
      for (const rp of assignment.role.permissions) {
        permissions.add(rp.permission.code);
      }
    }

    // Cache result
    this.cache.set(cacheKey, {
      permissions,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    return permissions;
  }

  invalidateUser(userId: string, tenantId: string): void {
    this.cache.delete(`${userId}:${tenantId}`);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}
```

### 5.5 Prisma Client Extension for Tenant Isolation

```typescript
// prisma/tenant-extension.ts
import { Prisma } from '@prisma/client';

// Models that require tenant filtering
const TENANT_MODELS = new Set([
  'dTE', 'cliente', 'sucursal', 'paymentMethod', 'tenantEmailConfig',
  'emailConfigRequest', 'pendingNotification', 'tenantOnboarding',
  'supportTicket', 'haciendaConfig', 'importJob',
  'recurringInvoiceTemplate', 'catalogCategory', 'catalogItem',
  'quote', 'accountingAccount', 'journalEntry', 'accountMappingRule',
  'webhookEndpoint', 'webhookDelivery', 'dteOperationLog', 'dteErrorLog',
]);

export function createTenantExtension(getTenantId: () => string | null) {
  return Prisma.defineExtension({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const tenantId = getTenantId();
            if (tenantId) {
              args.where = { ...args.where, tenantId };
            }
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const tenantId = getTenantId();
            if (tenantId) {
              args.where = { ...args.where, tenantId };
            }
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          // findUnique cannot add arbitrary where clauses
          // Tenant filtering should happen at service level for findUnique
          return query(args);
        },
        async create({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const tenantId = getTenantId();
            if (tenantId && !(args.data as Record<string, unknown>).tenantId) {
              (args.data as Record<string, unknown>).tenantId = tenantId;
            }
          }
          return query(args);
        },
        async update({ model, args, query }) {
          // Updates use unique where, tenant check at service level
          return query(args);
        },
        async delete({ model, args, query }) {
          // Deletes use unique where, tenant check at service level
          return query(args);
        },
      },
    },
  });
}
```

**Important limitation:** Prisma Client Extensions can inject `tenantId` into `findMany`/`findFirst` WHERE clauses, but `findUnique`, `update`, and `delete` use unique identifiers. For those, tenant validation must happen at the service level (fetch + verify tenantId, or use `findFirst` with composite where).

### 5.6 Controller Usage Example

```typescript
@Controller('dtes')
@ApiBearerAuth()
export class DteController {
  constructor(private dteService: DteService) {}

  @Get()
  @RequirePermission('dte:read')
  findAll(@CurrentUser() user: CurrentUserData) {
    return this.dteService.findAll(user.tenantId);
  }

  @Post()
  @RequirePermission('dte:create')
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateDteDto) {
    return this.dteService.create(user.tenantId, dto);
  }

  @Post(':id/void')
  @RequirePermission('dte:void')
  void(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.dteService.void(id, user.tenantId);
  }

  @Post(':id/transmit')
  @RequirePermission('dte:transmit')
  transmit(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.dteService.transmit(id, user.tenantId);
  }
}
```

### 5.7 Guard Registration (app.module.ts)

```typescript
@Module({
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },     // 1st: Auth
    { provide: APP_GUARD, useClass: TenantGuard },       // 2nd: Tenant exists
    { provide: APP_GUARD, useClass: RbacGuard },         // 3rd: Permissions
    { provide: APP_GUARD, useClass: ThrottlerGuard },    // Rate limiting
  ],
})
export class AppModule {}
```

---

## 6. Caching Strategy

### 6.1 Architecture (Start Simple)

For initial implementation, use **in-memory L1 cache only** (no Redis needed yet):

```
L1 (in-memory Map)
  Key: userId:tenantId
  Value: Set<permissionCode>
  TTL: 30 seconds
  Invalidation: On role/permission change
```

### 6.2 When to Add Redis (L2)

Add Redis L2 cache when:
- Multiple API instances run behind a load balancer
- Permission invalidation must propagate across instances
- You're seeing >50ms latency on permission queries

**For now:** Single instance deployment on Azure App Service = L1 in-memory is sufficient.

### 6.3 Invalidation Triggers

| Event | Action |
|-------|--------|
| Role assigned to user | Invalidate `userId:tenantId` |
| Role removed from user | Invalidate `userId:tenantId` |
| Role permissions changed | Invalidate all users with that role |
| User logs out | Invalidate `userId:tenantId` |
| Bulk permission change | `invalidateAll()` |

---

## 7. Migration Strategy

### 7.1 Backward Compatibility

The existing `User.rol` field (`ADMIN`, `FACTURADOR`, etc.) will coexist with the new RBAC tables during migration:

1. **Phase 1:** Add RBAC tables + seed default roles. `RbacGuard` checks `@RequirePermission` but falls back to legacy `rol` check if no assignments exist.
2. **Phase 2:** Auto-migrate existing users to RBAC assignments based on their `rol` field.
3. **Phase 3:** Remove legacy `rol` field fallback. All authorization through RBAC.

### 7.2 Seed Script

```typescript
// prisma/seed-rbac.ts
const PERMISSIONS = [
  { resource: 'dte', action: 'create', name: 'Crear DTE', category: 'Facturación' },
  { resource: 'dte', action: 'read', name: 'Ver DTEs', category: 'Facturación' },
  { resource: 'dte', action: 'update', name: 'Editar DTE', category: 'Facturación' },
  { resource: 'dte', action: 'void', name: 'Anular DTE', category: 'Facturación' },
  { resource: 'dte', action: 'transmit', name: 'Transmitir DTE', category: 'Facturación' },
  { resource: 'client', action: 'create', name: 'Crear Cliente', category: 'Clientes' },
  { resource: 'client', action: 'read', name: 'Ver Clientes', category: 'Clientes' },
  { resource: 'client', action: 'update', name: 'Editar Cliente', category: 'Clientes' },
  { resource: 'client', action: 'delete', name: 'Eliminar Cliente', category: 'Clientes' },
  // ... (full list in permission catalog above)
];

const TEMPLATES = {
  tenant_admin: { name: 'Administrador', permissions: '*' }, // all permissions
  branch_manager: {
    name: 'Gerente de Sucursal',
    permissions: ['dte:*', 'client:*', 'branch:read', 'report:read', 'catalog:read'],
  },
  cashier: {
    name: 'Cajero/Facturador',
    permissions: ['dte:create', 'dte:read', 'client:read', 'client:create', 'catalog:read'],
  },
  accountant: {
    name: 'Contador',
    permissions: ['dte:read', 'report:*', 'accounting:*', 'client:read'],
  },
  viewer: {
    name: 'Solo Lectura',
    permissions: ['dte:read', 'client:read', 'report:read', 'catalog:read'],
  },
};
```

### 7.3 User Migration

```typescript
// Map legacy roles to RBAC role templates
const LEGACY_ROLE_MAP = {
  'ADMIN': 'tenant_admin',
  'FACTURADOR': 'cashier',
  'GERENTE': 'branch_manager',
  'CONTADOR': 'accountant',
};

// For each existing user, create a UserRoleAssignment
// at tenant scope with the corresponding role template
```

---

## 8. Implementation Checklist

### Phase 0: Security Fixes (2-3 hours) - DO FIRST
- [ ] Fix `dte.service.ts`: Make `tenantId` required in `signDte()` and `transmitDte()`
- [ ] Fix `recurring-invoices.service.ts`: Add tenant validation to `recordSuccess()` / `recordFailure()`
- [ ] Fix `support.service.ts`: Use single query with tenant filter instead of fetch-then-check
- [ ] Add `tenantId` field to `PuntoVenta` model in schema.prisma
- [ ] Run `prisma db push` to apply PuntoVenta change
- [ ] Backfill PuntoVenta.tenantId from Sucursal.tenantId

### Phase 1: Schema & Seed (4-6 hours)
- [ ] Create RBAC models in `schema.prisma` (Role, Permission, RoleTemplate, etc.)
- [ ] Run `prisma db push` or `prisma migrate dev --name add_rbac`
- [ ] Create seed script for permissions and role templates
- [ ] Run seed against dev database
- [ ] Validate with `prisma validate`

### Phase 2: Guards & Service (8-10 hours)
- [ ] Create `TenantGuard` + `@SkipTenantCheck()` decorator
- [ ] Create `RbacService` with in-memory cache
- [ ] Create `RbacGuard` + `@RequirePermission()` decorator
- [ ] Register `TenantGuard` and `RbacGuard` as `APP_GUARD`
- [ ] Create `RbacModule` and import in `AppModule`
- [ ] Add `@RequirePermission()` to all controller endpoints (incremental)
- [ ] Implement legacy `rol` fallback for backward compatibility
- [ ] Unit tests for each guard and the RbacService

### Phase 3: Prisma Extension (4-6 hours)
- [ ] Create `createTenantExtension()` utility
- [ ] Integrate with `PrismaService` to auto-inject tenantId
- [ ] Test that `findMany` queries auto-filter by tenant
- [ ] Verify `create` operations auto-set tenantId
- [ ] Integration tests for tenant isolation

### Phase 4: User Migration (3-4 hours)
- [ ] Create migration script: legacy `rol` → RBAC assignments
- [ ] Run migration on dev database
- [ ] Verify all existing users have correct role assignments
- [ ] Test login/access with migrated users

### Phase 5: Admin UI (12-16 hours)
- [ ] Roles list page (view/create/edit roles)
- [ ] Permission matrix UI (checkboxes per resource/action)
- [ ] User role assignment page (assign roles with scope)
- [ ] Invite user flow (assign role during invite)
- [ ] Audit log page (who changed what permissions)

### Phase 6: Security Hardening (4-6 hours)
- [ ] Add `@RequirePermission()` to ALL remaining endpoints
- [ ] Remove legacy `rol` fallback
- [ ] IDOR scan: verify all services use tenantId from JWT
- [ ] Add permission change audit logging
- [ ] Penetration test: cross-tenant access attempts

### Phase 7: Go-Live (4-6 hours)
- [ ] Deploy to staging
- [ ] Test with Republicode account (real data)
- [ ] Performance check: <5ms overhead per request
- [ ] Rollback plan ready
- [ ] Deploy to production

**Estimated total: 40-55 hours (1.5-2 sprints)**

---

## 9. Dependencies to Install

```bash
# Required
pnpm add nestjs-cls          # AsyncLocalStorage for request context (useful with Prisma extension)

# Optional (can implement without)
# pnpm add @casl/core @casl/prisma  # Only if you want CASL-based ability checks
# pnpm add ioredis                   # Only when scaling to multiple instances
```

`nestjs-cls` is the only new dependency needed. The RBAC system uses NestJS guards + Prisma + in-memory cache - no heavy framework needed.

---

## 10. Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Permission model | String codes (`resource:action`) | Simple, queryable, no enum maintenance |
| Scope hierarchy | 3 levels (tenant/branch/pos) | Matches existing Facturosv data model |
| Conflict resolution | Additive (UNION) | Simpler than deny rules; no "deny" needed for invoicing SaaS |
| Cache | L1 in-memory only (initially) | Single Azure App Service instance; add Redis later |
| Framework | Pure NestJS guards (no CASL) | Less deps, full control, fits existing patterns |
| Migration | Phased with legacy fallback | Zero-downtime, incremental rollout |
| Template roles | Immutable system templates + custom | Tenants can customize without affecting others |
| Azure SQL Server | No RLS | SQL Server RLS is more limited than PostgreSQL; rely on app-level enforcement |
