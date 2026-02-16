/**
 * Cleanup script: Remove junk test tenants from the database.
 * Keeps only Republicode (real) and one clean demo tenant.
 *
 * Run with: npx ts-node -P apps/api/tsconfig.json apps/api/prisma/cleanup-junk-tenants.ts
 * Or from apps/api: npx ts-node prisma/cleanup-junk-tenants.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// NITs of tenants to KEEP
const KEEP_NITS = [
  '0614-180723-106-0', // Republicode S.A. de C.V. (production)
  '0700-210296-101-1', // Prueba QA 2 (clean demo)
];

async function main() {
  console.log('=== DB Cleanup: Removing Junk Test Tenants ===\n');

  // 1. Find all tenants
  const allTenants = await prisma.tenant.findMany({
    select: {
      id: true,
      nombre: true,
      nit: true,
      _count: {
        select: {
          usuarios: true,
          dtes: true,
          clientes: true,
          supportTickets: true,
          quotes: true,
          recurringTemplates: true,
          importJobs: true,
          catalogItems: true,
        },
      },
    },
  });

  console.log(`Total tenants: ${allTenants.length}`);

  const tenantsToKeep = allTenants.filter((t) => KEEP_NITS.includes(t.nit));
  const tenantsToDelete = allTenants.filter((t) => !KEEP_NITS.includes(t.nit));

  console.log(`\nKeeping ${tenantsToKeep.length} tenants:`);
  for (const t of tenantsToKeep) {
    console.log(`  - ${t.nombre} (${t.nit}) — ${t._count.dtes} DTEs, ${t._count.clientes} clients`);
  }

  console.log(`\nDeleting ${tenantsToDelete.length} tenants:`);
  for (const t of tenantsToDelete) {
    console.log(`  - ${t.nombre} (${t.nit}) — ${t._count.dtes} DTEs, ${t._count.clientes} clients, ${t._count.usuarios} users`);
  }

  if (tenantsToDelete.length === 0) {
    console.log('\nNo tenants to delete. Exiting.');
    return;
  }

  const tenantIds = tenantsToDelete.map((t) => t.id);

  console.log('\nStarting cleanup...\n');

  // 2. Delete dependent records in correct order (children first)
  // Some relations use onDelete: NoAction so we must delete manually

  // Quote line items (via quotes)
  const quoteIds = (
    await prisma.quote.findMany({
      where: { tenantId: { in: tenantIds } },
      select: { id: true },
    })
  ).map((q) => q.id);

  if (quoteIds.length > 0) {
    const deletedLineItems = await prisma.quoteLineItem.deleteMany({
      where: { quoteId: { in: quoteIds } },
    });
    console.log(`  Deleted ${deletedLineItems.count} quote line items`);

    const deletedQuotes = await prisma.quote.deleteMany({
      where: { tenantId: { in: tenantIds } },
    });
    console.log(`  Deleted ${deletedQuotes.count} quotes`);
  }

  // DTE logs (via DTEs)
  const dteIds = (
    await prisma.dTE.findMany({
      where: { tenantId: { in: tenantIds } },
      select: { id: true },
    })
  ).map((d) => d.id);

  if (dteIds.length > 0) {
    const deletedDteLogs = await prisma.dTELog.deleteMany({
      where: { dteId: { in: dteIds } },
    });
    console.log(`  Deleted ${deletedDteLogs.count} DTE logs`);

    const deletedDtes = await prisma.dTE.deleteMany({
      where: { tenantId: { in: tenantIds } },
    });
    console.log(`  Deleted ${deletedDtes.count} DTEs`);
  }

  // Support tickets (activities, comments first)
  const ticketIds = (
    await prisma.supportTicket.findMany({
      where: { tenantId: { in: tenantIds } },
      select: { id: true },
    })
  ).map((t) => t.id);

  if (ticketIds.length > 0) {
    const deletedActivities = await prisma.ticketActivity.deleteMany({
      where: { ticketId: { in: ticketIds } },
    });
    console.log(`  Deleted ${deletedActivities.count} ticket activities`);

    const deletedComments = await prisma.ticketComment.deleteMany({
      where: { ticketId: { in: ticketIds } },
    });
    console.log(`  Deleted ${deletedComments.count} ticket comments`);

    const deletedTickets = await prisma.supportTicket.deleteMany({
      where: { tenantId: { in: tenantIds } },
    });
    console.log(`  Deleted ${deletedTickets.count} support tickets`);
  }

  // Recurring invoice items and templates
  const templateIds = (
    await prisma.recurringInvoiceTemplate.findMany({
      where: { tenantId: { in: tenantIds } },
      select: { id: true },
    })
  ).map((t) => t.id);

  if (templateIds.length > 0) {
    const deletedHistory = await prisma.recurringInvoiceHistory.deleteMany({
      where: { templateId: { in: templateIds } },
    });
    console.log(`  Deleted ${deletedHistory.count} recurring invoice history`);

    const deletedTemplates = await prisma.recurringInvoiceTemplate.deleteMany({
      where: { tenantId: { in: tenantIds } },
    });
    console.log(`  Deleted ${deletedTemplates.count} recurring invoice templates`);
  }

  // Clients
  const deletedClients = await prisma.cliente.deleteMany({
    where: { tenantId: { in: tenantIds } },
  });
  console.log(`  Deleted ${deletedClients.count} clients`);

  // Catalog items and categories
  const deletedCatalogItems = await prisma.catalogItem.deleteMany({
    where: { tenantId: { in: tenantIds } },
  });
  console.log(`  Deleted ${deletedCatalogItems.count} catalog items`);

  const deletedCategories = await prisma.catalogCategory.deleteMany({
    where: { tenantId: { in: tenantIds } },
  });
  console.log(`  Deleted ${deletedCategories.count} catalog categories`);

  // Import jobs
  const deletedImportJobs = await prisma.importJob.deleteMany({
    where: { tenantId: { in: tenantIds } },
  });
  console.log(`  Deleted ${deletedImportJobs.count} import jobs`);

  // Email config requests
  const deletedEmailRequests = await prisma.emailConfigRequest.deleteMany({
    where: { tenantId: { in: tenantIds } },
  });
  console.log(`  Deleted ${deletedEmailRequests.count} email config requests`);

  // Hacienda configs (cascade handles environment configs and test records)
  const deletedHaciendaConfigs = await prisma.haciendaConfig.deleteMany({
    where: { tenantId: { in: tenantIds } },
  });
  console.log(`  Deleted ${deletedHaciendaConfigs.count} hacienda configs`);

  // Email send logs (for tenants without a config, using tenantId directly)
  const deletedEmailLogs = await prisma.emailSendLog.deleteMany({
    where: { tenantId: { in: tenantIds } },
  });
  console.log(`  Deleted ${deletedEmailLogs.count} email send logs`);

  // Tenant email configs (cascade handles health checks and remaining send logs)
  const deletedEmailConfigs = await prisma.tenantEmailConfig.deleteMany({
    where: { tenantId: { in: tenantIds } },
  });
  console.log(`  Deleted ${deletedEmailConfigs.count} tenant email configs`);

  // Onboarding records
  const deletedOnboarding = await prisma.tenantOnboarding.deleteMany({
    where: { tenantId: { in: tenantIds } },
  });
  console.log(`  Deleted ${deletedOnboarding.count} onboarding records`);

  // Accounting records
  const journalIds = (
    await prisma.journalEntry.findMany({
      where: { tenantId: { in: tenantIds } },
      select: { id: true },
    })
  ).map((j) => j.id);

  if (journalIds.length > 0) {
    const deletedJournalLines = await prisma.journalEntryLine.deleteMany({
      where: { entryId: { in: journalIds } },
    });
    console.log(`  Deleted ${deletedJournalLines.count} journal entry lines`);
  }

  const deletedJournalEntries = await prisma.journalEntry.deleteMany({
    where: { tenantId: { in: tenantIds } },
  });
  console.log(`  Deleted ${deletedJournalEntries.count} journal entries`);

  const deletedAccountRules = await prisma.accountMappingRule.deleteMany({
    where: { tenantId: { in: tenantIds } },
  });
  console.log(`  Deleted ${deletedAccountRules.count} account mapping rules`);

  const deletedAccounts = await prisma.accountingAccount.deleteMany({
    where: { tenantId: { in: tenantIds } },
  });
  console.log(`  Deleted ${deletedAccounts.count} accounting accounts`);

  // Audit logs for users being deleted
  const userIds = (
    await prisma.user.findMany({
      where: { tenantId: { in: tenantIds } },
      select: { id: true },
    })
  ).map((u) => u.id);

  if (userIds.length > 0) {
    // Audit logs
    const deletedAuditLogs = await prisma.auditLog.deleteMany({
      where: { userId: { in: userIds } },
    });
    console.log(`  Deleted ${deletedAuditLogs.count} audit logs`);
  }

  // Users (must delete after all references are cleaned)
  const deletedUsers = await prisma.user.deleteMany({
    where: { tenantId: { in: tenantIds } },
  });
  console.log(`  Deleted ${deletedUsers.count} users`);

  // Finally, delete the tenants themselves
  const deletedTenants = await prisma.tenant.deleteMany({
    where: { id: { in: tenantIds } },
  });
  console.log(`  Deleted ${deletedTenants.count} tenants`);

  // 3. Verify
  const remainingTenants = await prisma.tenant.findMany({
    select: { id: true, nombre: true, nit: true },
  });
  const remainingUsers = await prisma.user.count();

  console.log(`\n=== Cleanup Complete ===`);
  console.log(`Remaining tenants: ${remainingTenants.length}`);
  for (const t of remainingTenants) {
    console.log(`  - ${t.nombre} (${t.nit})`);
  }
  console.log(`Remaining users: ${remainingUsers}`);
}

main()
  .catch((e) => {
    console.error('Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
