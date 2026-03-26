/**
 * RBAC Migration Script - Phase 4
 *
 * Migrates existing users from legacy `User.rol` string field to proper
 * RBAC UserRoleAssignment records. Idempotent: skips users that already
 * have role assignments.
 *
 * Prerequisites:
 *   1. Run `prisma db push` to create RBAC tables
 *   2. Run `npx ts-node prisma/seed-rbac.ts` to seed permissions + templates
 *
 * Usage: npx ts-node prisma/migrate-roles.ts
 *        npx ts-node prisma/migrate-roles.ts --dry-run
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

/** Maps legacy User.rol values to RoleTemplate codes */
const LEGACY_ROLE_MAP: Record<string, string> = {
  ADMIN: 'tenant_admin',
  FACTURADOR: 'cashier',
  GERENTE: 'branch_manager',
  CONTADOR: 'accountant',
};

interface MigrationStats {
  totalUsers: number;
  skippedNoTenant: number;
  skippedSuperAdmin: number;
  skippedAlreadyMigrated: number;
  skippedUnknownRole: number;
  migrated: number;
  rolesCreated: number;
  errors: string[];
}

async function main() {
  console.log(`\nRBAC Migration ${DRY_RUN ? '(DRY RUN)' : ''}\n${'='.repeat(50)}\n`);

  const stats: MigrationStats = {
    totalUsers: 0,
    skippedNoTenant: 0,
    skippedSuperAdmin: 0,
    skippedAlreadyMigrated: 0,
    skippedUnknownRole: 0,
    migrated: 0,
    rolesCreated: 0,
    errors: [],
  };

  // Load all role templates with their permissions
  const templates = await prisma.roleTemplate.findMany({
    include: { permissions: { include: { permission: true } } },
  });

  if (templates.length === 0) {
    console.error('No role templates found. Run seed-rbac.ts first.');
    process.exit(1);
  }

  const templateMap = new Map(templates.map((t) => [t.code, t]));
  console.log(`  Loaded ${templates.length} role templates`);

  // Cache of tenant roles: tenantId:templateCode → roleId
  const roleCache = new Map<string, string>();

  // Load all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, rol: true, tenantId: true },
  });

  stats.totalUsers = users.length;
  console.log(`  Found ${users.length} users to process\n`);

  for (const user of users) {
    // Skip SUPER_ADMIN (they bypass RBAC via guard)
    if (user.rol === 'SUPER_ADMIN') {
      stats.skippedSuperAdmin++;
      continue;
    }

    // Skip users without a tenant
    if (!user.tenantId) {
      stats.skippedNoTenant++;
      continue;
    }

    // Check if user already has RBAC assignments
    const existingAssignment = await prisma.userRoleAssignment.findFirst({
      where: { userId: user.id, tenantId: user.tenantId },
    });

    if (existingAssignment) {
      stats.skippedAlreadyMigrated++;
      continue;
    }

    // Map legacy role to template
    const templateCode = LEGACY_ROLE_MAP[user.rol];
    if (!templateCode) {
      stats.skippedUnknownRole++;
      stats.errors.push(`Unknown role "${user.rol}" for user ${user.email} (${user.id})`);
      continue;
    }

    const template = templateMap.get(templateCode);
    if (!template) {
      stats.errors.push(`Template "${templateCode}" not found for role "${user.rol}"`);
      continue;
    }

    try {
      // Get or create tenant-scoped role from template
      const cacheKey = `${user.tenantId}:${templateCode}`;
      let roleId = roleCache.get(cacheKey);

      if (!roleId) {
        if (DRY_RUN) {
          roleId = `dry-run-${cacheKey}`;
        } else {
          const role = await prisma.role.upsert({
            where: {
              tenantId_name: { tenantId: user.tenantId, name: template.name },
            },
            create: {
              tenantId: user.tenantId,
              name: template.name,
              templateId: template.id,
              isCustom: false,
            },
            update: {},
          });

          // Copy template permissions to role
          const existingPerms = await prisma.rolePermission.count({
            where: { roleId: role.id },
          });

          if (existingPerms === 0) {
            await prisma.rolePermission.createMany({
              data: template.permissions.map((tp) => ({
                roleId: role.id,
                permissionId: tp.permissionId,
              })),
              skipDuplicates: true,
            });
          }

          roleId = role.id;
          stats.rolesCreated++;
        }
        roleCache.set(cacheKey, roleId);
      }

      // Create the user role assignment
      if (!DRY_RUN) {
        await prisma.userRoleAssignment.create({
          data: {
            userId: user.id,
            roleId,
            tenantId: user.tenantId,
            scopeType: 'tenant',
            scopeId: user.tenantId,
            assignedBy: user.id, // Self-assigned during migration
          },
        });
      }

      stats.migrated++;
      console.log(`  ${DRY_RUN ? '[DRY] ' : ''}Migrated: ${user.email} (${user.rol} → ${template.name})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      stats.errors.push(`Failed to migrate ${user.email}: ${msg}`);
    }
  }

  // Print summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Migration Summary ${DRY_RUN ? '(DRY RUN - no changes made)' : ''}`);
  console.log(`${'='.repeat(50)}`);
  console.log(`  Total users:           ${stats.totalUsers}`);
  console.log(`  Migrated:              ${stats.migrated}`);
  console.log(`  Roles created:         ${stats.rolesCreated}`);
  console.log(`  Skipped (no tenant):   ${stats.skippedNoTenant}`);
  console.log(`  Skipped (SUPER_ADMIN): ${stats.skippedSuperAdmin}`);
  console.log(`  Skipped (already done): ${stats.skippedAlreadyMigrated}`);
  console.log(`  Skipped (unknown rol): ${stats.skippedUnknownRole}`);

  if (stats.errors.length > 0) {
    console.log(`\n  Errors (${stats.errors.length}):`);
    stats.errors.forEach((e) => console.log(`    - ${e}`));
  }

  console.log('');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
