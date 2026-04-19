/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * One-time idempotent seed for Fase 2.5 Inventory Adjustments.
 * Run from apps/api/: npx ts-node --compiler-options '{"strict":false}' scripts/seed-inventory-adjust-perm.ts [--dry-run]
 *
 * Adds the 4 expense accounts (5104-5107) required by the new accounting mappings
 * (AJUSTE_ROBO/MERMA/DONACION/AUTOCONSUMO) to every tenant that has a
 * standard chart of accounts. Skips any tenant that already has these accounts.
 *
 * The RBAC permission `inventory:adjust` is NOT seeded here — it's defined
 * statically in LEGACY_ROLE_PERMISSIONS and applied at request time, no DB
 * migration needed.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACCOUNTS_TO_SEED = [
  { code: '5104', name: 'Pérdida por robo', accountType: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5105', name: 'Merma inventario', accountType: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5106', name: 'Donaciones', accountType: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5107', name: 'Gasto autoconsumo', accountType: 'EXPENSE', normalBalance: 'DEBIT' },
] as const;

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`=== Fase 2.5 Account Seed ${dryRun ? '(DRY RUN)' : ''} ===\n`);

  const tenants = await prisma.tenant.findMany({ select: { id: true, nombre: true } });
  console.log(`Found ${tenants.length} tenants\n`);

  let created = 0;
  let skipped = 0;

  for (const tenant of tenants) {
    console.log(`[${tenant.id}] ${tenant.nombre}`);
    for (const acct of ACCOUNTS_TO_SEED) {
      const existing = await prisma.accountingAccount.findFirst({
        where: { tenantId: tenant.id, code: acct.code },
        select: { id: true },
      });
      if (existing) {
        console.log(`  ✓ ${acct.code} already exists`);
        skipped++;
        continue;
      }
      if (dryRun) {
        console.log(`  [dry] would create ${acct.code} ${acct.name}`);
        continue;
      }
      await prisma.accountingAccount.create({
        data: {
          tenantId: tenant.id,
          code: acct.code,
          name: acct.name,
          accountType: acct.accountType,
          normalBalance: acct.normalBalance,
          isActive: true,
          allowsPosting: true,
          level: 1,
          currentBalance: 0,
        },
      });
      console.log(`  + created ${acct.code} ${acct.name}`);
      created++;
    }
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
