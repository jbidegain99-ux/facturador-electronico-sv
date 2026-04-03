/**
 * Cleanup script for Republicode tenant data
 * Run from project root: npx ts-node scripts/cleanup-republicode.ts
 * Or: npx tsx scripts/cleanup-republicode.ts
 *
 * Phases:
 *   --verify    (default) Count records only
 *   --clean     Execute deletion
 *   --post      Post-cleanup verification
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

async function findTenant(): Promise<string | null> {
  const tenants = await prisma.tenant.findMany({
    where: {
      OR: [
        { nombre: { contains: 'Republicode' } },
        { nombre: { contains: 'republicode' } },
      ],
    },
    select: { id: true, nombre: true, nit: true, nrc: true, correo: true, plan: true, planStatus: true },
  });

  if (tenants.length === 0) {
    console.log('No se encontró tenant con nombre "Republicode"');
    return null;
  }

  console.log('\n=== TENANT ENCONTRADO ===');
  for (const t of tenants) {
    console.log(`  ID: ${t.id}`);
    console.log(`  Nombre: ${t.nombre}`);
    console.log(`  NIT: ${t.nit}`);
    console.log(`  NRC: ${t.nrc}`);
    console.log(`  Correo: ${t.correo}`);
    console.log(`  Plan: ${t.plan} (${t.planStatus})`);
  }

  return tenants[0].id;
}

async function verify(tenantId: string): Promise<void> {
  console.log('\n=== VERIFICACIÓN PRE-LIMPIEZA ===');
  console.log(`Tenant ID: ${tenantId}\n`);

  const dteCount = await prisma.dTE.count({ where: { tenantId } });
  const dteLogCount = await prisma.dTELog.count({ where: { dte: { tenantId } } });
  const clienteCount = await prisma.cliente.count({ where: { tenantId } });
  const recurringCount = await prisma.recurringInvoiceTemplate.count({ where: { tenantId } });
  const recurringHistCount = await prisma.recurringInvoiceHistory.count({ where: { template: { tenantId } } });
  const haciendaConfigCount = await prisma.haciendaConfig.count({ where: { tenantId } });
  const haciendaEnvCount = await prisma.haciendaEnvironmentConfig.count({ where: { haciendaConfig: { tenantId } } });
  const haciendaTestCount = await prisma.haciendaTestRecord.count({ where: { haciendaConfig: { tenantId } } });
  const importJobCount = await prisma.importJob.count({ where: { tenantId } });
  const emailLogCount = await prisma.emailSendLog.count({ where: { tenantId } });
  const catItemCount = await prisma.catalogItem.count({ where: { category: { tenantId } } });
  const catCatCount = await prisma.catalogCategory.count({ where: { tenantId } });
  const quoteCount = await prisma.quote.count({ where: { tenantId } });
  const journalCount = await prisma.journalEntry.count({ where: { tenantId } });
  const accountCount = await prisma.accountingAccount.count({ where: { tenantId } });
  const mappingCount = await prisma.accountMappingRule.count({ where: { tenantId } });
  const webhookEpCount = await prisma.webhookEndpoint.count({ where: { tenantId } });
  const webhookDelCount = await prisma.webhookDelivery.count({ where: { tenantId } });
  const auditCount = await prisma.auditLog.count({ where: { tenantId } });

  const rows = [
    ['DTE (Facturas)', dteCount],
    ['DTELog', dteLogCount],
    ['Cliente', clienteCount],
    ['RecurringInvoiceTemplate', recurringCount],
    ['RecurringInvoiceHistory', recurringHistCount],
    ['HaciendaConfig', haciendaConfigCount],
    ['HaciendaEnvironmentConfig', haciendaEnvCount],
    ['HaciendaTestRecord', haciendaTestCount],
    ['ImportJob', importJobCount],
    ['EmailSendLog', emailLogCount],
    ['CatalogItem', catItemCount],
    ['CatalogCategory', catCatCount],
    ['Quote', quoteCount],
    ['JournalEntry', journalCount],
    ['AccountingAccount', accountCount],
    ['AccountMappingRule', mappingCount],
    ['WebhookEndpoint', webhookEpCount],
    ['WebhookDelivery', webhookDelCount],
    ['AuditLog', auditCount],
  ] as const;

  let totalData = 0;
  for (const [table, count] of rows) {
    const marker = count > 0 ? '🔴' : '✅';
    console.log(`  ${marker} ${table.padEnd(30)} ${count}`);
    totalData += count;
  }

  console.log(`\n  Total registros de datos: ${totalData}`);
  if (totalData === 0) {
    console.log('  ✅ Tenant ya está limpio - no hay nada que borrar.');
  } else {
    console.log('  ⚠️  Ejecutar con --clean para limpiar estos registros.');
  }
}

async function clean(tenantId: string): Promise<void> {
  console.log('\n=== EJECUTANDO LIMPIEZA ===');
  console.log(`Tenant ID: ${tenantId}\n`);

  // 1. Recurring Invoice History → Templates
  let result = await prisma.recurringInvoiceHistory.deleteMany({
    where: { template: { tenantId } },
  });
  console.log(`  RecurringInvoiceHistory: ${result.count} eliminados`);

  result = await prisma.recurringInvoiceTemplate.deleteMany({ where: { tenantId } });
  console.log(`  RecurringInvoiceTemplate: ${result.count} eliminados`);

  // 2. Quotes → LineItems, StatusHistory (Cascade handles children)
  result = await prisma.quote.deleteMany({ where: { tenantId } });
  console.log(`  Quote (+ LineItems, StatusHistory via cascade): ${result.count} eliminados`);

  // 3. DTE Logs → DTEs
  result = await prisma.dTELog.deleteMany({ where: { dte: { tenantId } } });
  console.log(`  DTELog: ${result.count} eliminados`);

  result = await prisma.dTE.deleteMany({ where: { tenantId } });
  console.log(`  DTE: ${result.count} eliminados`);

  // 4. Clientes
  result = await prisma.cliente.deleteMany({ where: { tenantId } });
  console.log(`  Cliente: ${result.count} eliminados`);

  // 5. Hacienda: TestRecords → EnvironmentConfig (TEST only) → reset Config
  result = await prisma.haciendaTestRecord.deleteMany({
    where: { haciendaConfig: { tenantId } },
  });
  console.log(`  HaciendaTestRecord: ${result.count} eliminados`);

  result = await prisma.haciendaEnvironmentConfig.deleteMany({
    where: { haciendaConfig: { tenantId }, environment: 'TEST' },
  });
  console.log(`  HaciendaEnvironmentConfig (TEST): ${result.count} eliminados`);

  const hcUpdate = await prisma.haciendaConfig.updateMany({
    where: { tenantId },
    data: { activeEnvironment: 'PRODUCTION', testingStatus: 'AUTHORIZED' },
  });
  console.log(`  HaciendaConfig reset a PRODUCTION: ${hcUpdate.count} actualizados`);

  // 6. Accounting
  result = await prisma.journalEntryLine.deleteMany({
    where: { entry: { tenantId } },
  });
  console.log(`  JournalEntryLine: ${result.count} eliminados`);

  result = await prisma.journalEntry.deleteMany({ where: { tenantId } });
  console.log(`  JournalEntry: ${result.count} eliminados`);

  result = await prisma.accountMappingRule.deleteMany({ where: { tenantId } });
  console.log(`  AccountMappingRule: ${result.count} eliminados`);

  // NOTE: AccountingAccount (chart of accounts) preserved intentionally
  // Uncomment if you also want to wipe the chart:
  // result = await prisma.accountingAccount.deleteMany({ where: { tenantId } });
  // console.log(`  AccountingAccount: ${result.count} eliminados`);

  // 7. Webhooks
  result = await prisma.webhookDelivery.deleteMany({ where: { tenantId } });
  console.log(`  WebhookDelivery: ${result.count} eliminados`);

  result = await prisma.webhookEndpoint.deleteMany({ where: { tenantId } });
  console.log(`  WebhookEndpoint: ${result.count} eliminados`);

  // 8. Import Jobs
  result = await prisma.importJob.deleteMany({ where: { tenantId } });
  console.log(`  ImportJob: ${result.count} eliminados`);

  // 9. Catalog Items → Categories
  result = await prisma.catalogItem.deleteMany({
    where: { category: { tenantId } },
  });
  console.log(`  CatalogItem: ${result.count} eliminados`);

  result = await prisma.catalogCategory.deleteMany({ where: { tenantId } });
  console.log(`  CatalogCategory: ${result.count} eliminados`);

  // 10. Email Send Logs (preserva TenantEmailConfig)
  result = await prisma.emailSendLog.deleteMany({ where: { tenantId } });
  console.log(`  EmailSendLog: ${result.count} eliminados`);

  // 11. Reset Tenant counters & MH token
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      dtesUsedThisMonth: 0,
      monthResetDate: new Date(),
      mhToken: null,
      mhTokenExpiry: null,
    },
  });
  console.log(`  Tenant: contadores reseteados, MH token limpiado`);

  console.log('\n=== LIMPIEZA COMPLETADA ===');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args.includes('--clean') ? 'clean' : args.includes('--post') ? 'post' : 'verify';

  try {
    const tenantId = await findTenant();
    if (!tenantId) {
      process.exit(1);
    }

    switch (mode) {
      case 'verify':
      case 'post':
        await verify(tenantId);
        break;
      case 'clean':
        await verify(tenantId);
        console.log('\n--- Procediendo con limpieza en 3 segundos... ---');
        await new Promise((resolve) => setTimeout(resolve, 3000));
        await clean(tenantId);
        console.log('\n--- Verificación post-limpieza ---');
        await verify(tenantId);
        break;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
