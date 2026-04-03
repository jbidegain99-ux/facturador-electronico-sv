/**
 * Cleanup script for test DTEs in Facturosv
 *
 * Removes:
 *   1. All DTEs from Jose Bidegain's tenant created before 2026-03-02
 *   2. All DTEs where the cliente is "Adriana Bidegain" (any date)
 *
 * Run from project root:
 *   npx tsx scripts/cleanup-test-dtes.ts --verify
 *   npx tsx scripts/cleanup-test-dtes.ts --clean
 *   npx tsx scripts/cleanup-test-dtes.ts --post
 */

import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env from apps/api
dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });

const prisma = new PrismaClient();

const CUTOFF_DATE = new Date('2026-03-02T00:00:00.000Z'); // exclusive

interface DteInfo {
  id: string;
  tipoDte: string;
  numeroControl: string;
  codigoGeneracion: string;
  estado: string;
  totalPagar: Prisma.Decimal;
  createdAt: Date;
  tenantId: string;
  clienteId: string | null;
  clienteNombre?: string;
  reason: string;
}

interface CleanupResult {
  dteCount: number;
  deletedByTable: Record<string, number>;
  dtes: DteInfo[];
  status: 'success' | 'failed';
  errors: string[];
}

async function findDtesToDelete(): Promise<DteInfo[]> {
  const results: DteInfo[] = [];

  // 1. Find Jose Bidegain's user → tenant
  const joseUser = await prisma.user.findFirst({
    where: { nombre: { contains: 'Jose Bidegain' } },
    select: { id: true, nombre: true, tenantId: true },
  });

  if (joseUser?.tenantId) {
    console.log(`  Found user "${joseUser.nombre}" → tenantId: ${joseUser.tenantId}`);

    const joseDtes = await prisma.dTE.findMany({
      where: {
        tenantId: joseUser.tenantId,
        createdAt: { lt: CUTOFF_DATE },
      },
      include: { cliente: { select: { nombre: true } } },
    });

    for (const dte of joseDtes) {
      results.push({
        id: dte.id,
        tipoDte: dte.tipoDte,
        numeroControl: dte.numeroControl,
        codigoGeneracion: dte.codigoGeneracion,
        estado: dte.estado,
        totalPagar: dte.totalPagar,
        createdAt: dte.createdAt,
        tenantId: dte.tenantId,
        clienteId: dte.clienteId,
        clienteNombre: dte.cliente?.nombre,
        reason: `Jose Bidegain tenant, before ${CUTOFF_DATE.toISOString().slice(0, 10)}`,
      });
    }
  } else {
    console.log('  ⚠️  User "Jose Bidegain" not found or has no tenant');
  }

  // 2. Find all DTEs where cliente is "Adriana Bidegain"
  const adrianaClientes = await prisma.cliente.findMany({
    where: { nombre: { contains: 'Adriana Bidegain' } },
    select: { id: true, nombre: true, tenantId: true },
  });

  if (adrianaClientes.length > 0) {
    for (const cli of adrianaClientes) {
      console.log(`  Found cliente "${cli.nombre}" (id: ${cli.id}, tenant: ${cli.tenantId})`);
    }

    const adrianaDtes = await prisma.dTE.findMany({
      where: {
        clienteId: { in: adrianaClientes.map((c) => c.id) },
      },
      include: { cliente: { select: { nombre: true } } },
    });

    for (const dte of adrianaDtes) {
      // Avoid duplicates (could overlap with Jose's tenant DTEs)
      if (!results.find((r) => r.id === dte.id)) {
        results.push({
          id: dte.id,
          tipoDte: dte.tipoDte,
          numeroControl: dte.numeroControl,
          codigoGeneracion: dte.codigoGeneracion,
          estado: dte.estado,
          totalPagar: dte.totalPagar,
          createdAt: dte.createdAt,
          tenantId: dte.tenantId,
          clienteId: dte.clienteId,
          clienteNombre: dte.cliente?.nombre,
          reason: `Cliente: Adriana Bidegain`,
        });
      }
    }
  } else {
    console.log('  ⚠️  No cliente found with name "Adriana Bidegain"');
  }

  return results;
}

async function verify(): Promise<void> {
  console.log('\n=== FASE 1: IDENTIFICACIÓN DE DTEs A ELIMINAR ===\n');

  const dtes = await findDtesToDelete();

  if (dtes.length === 0) {
    console.log('  ✅ No se encontraron DTEs de prueba para eliminar.');
    return;
  }

  console.log(`\n  Total DTEs a eliminar: ${dtes.length}\n`);

  // Group by reason
  const byReason: Record<string, DteInfo[]> = {};
  for (const d of dtes) {
    (byReason[d.reason] ??= []).push(d);
  }
  for (const [reason, list] of Object.entries(byReason)) {
    console.log(`  ${reason}: ${list.length} DTEs`);
  }

  // Show DTE list
  console.log('\n  --- DETALLE ---');
  for (const d of dtes) {
    console.log(
      `  ${d.tipoDte.padEnd(4)} | ${d.numeroControl.padEnd(20)} | ${d.estado.padEnd(12)} | $${d.totalPagar.toString().padStart(10)} | ${d.createdAt.toISOString().slice(0, 10)} | ${d.clienteNombre ?? 'N/A'} | ${d.reason}`,
    );
  }

  const dteIds = dtes.map((d) => d.id);

  // Count related records
  console.log('\n=== FASE 2: REGISTROS RELACIONADOS ===\n');

  const dteLogCount = await prisma.dTELog.count({
    where: { dteId: { in: dteIds } },
  });

  const paymentMethodCount = await prisma.paymentMethod.count({
    where: { dteId: { in: dteIds } },
  });

  const emailLogCount = await prisma.emailSendLog.count({
    where: { dteId: { in: dteIds } },
  });

  const operationLogCount = await prisma.dteOperationLog.count({
    where: { dteId: { in: dteIds } },
  });

  const errorLogCount = await prisma.dteErrorLog.count({
    where: { dteId: { in: dteIds } },
  });

  const journalEntryCount = await prisma.journalEntry.count({
    where: {
      sourceType: 'DTE',
      sourceDocumentId: { in: dteIds },
    },
  });

  const auditLogCount = await prisma.auditLog.count({
    where: {
      entityType: 'DTE',
      entityId: { in: dteIds },
    },
  });

  const recurringHistCount = await prisma.recurringInvoiceHistory.count({
    where: { dteId: { in: dteIds } },
  });

  const table = [
    ['DTELog', dteLogCount],
    ['PaymentMethod', paymentMethodCount],
    ['EmailSendLog', emailLogCount],
    ['DteOperationLog', operationLogCount],
    ['DteErrorLog', errorLogCount],
    ['JournalEntry (sourceDocumentId)', journalEntryCount],
    ['AuditLog (entityId)', auditLogCount],
    ['RecurringInvoiceHistory', recurringHistCount],
    ['DTE (principal)', dtes.length],
  ] as const;

  for (const [name, count] of table) {
    const marker = count > 0 ? '🔴' : '✅';
    console.log(`  ${marker} ${name.padEnd(35)} ${count}`);
  }

  // Check total DTEs in system vs to-delete for safety check
  const totalDtes = await prisma.dTE.count();
  const pct = ((dtes.length / totalDtes) * 100).toFixed(1);
  console.log(`\n  DTEs a eliminar: ${dtes.length} / ${totalDtes} total (${pct}%)`);
  if (parseFloat(pct) > 10) {
    console.log('  ⚠️  MÁS DEL 10% DE DTEs SERÍAN ELIMINADOS — REVISAR MANUALMENTE');
  }

  // Save evidence
  const evidence = {
    timestamp: new Date().toISOString(),
    totalDtesInSystem: totalDtes,
    dtesToDelete: dtes.length,
    percentage: pct,
    relatedRecords: Object.fromEntries(table.map(([k, v]) => [k, v])),
    dtes: dtes.map((d) => ({
      id: d.id,
      tipo: d.tipoDte,
      numero: d.numeroControl,
      codigo: d.codigoGeneracion,
      estado: d.estado,
      total: d.totalPagar.toString(),
      fecha: d.createdAt.toISOString(),
      cliente: d.clienteNombre,
      reason: d.reason,
    })),
  };

  fs.writeFileSync('outputs/cleanup-verify.json', JSON.stringify(evidence, null, 2));
  console.log('\n  📄 Evidencia guardada en outputs/cleanup-verify.json');
  console.log('\n  ⚠️  Ejecutar con --clean para proceder con la eliminación.');
}

async function clean(): Promise<void> {
  console.log('\n=== EJECUTANDO LIMPIEZA DE DTEs DE PRUEBA ===\n');

  const dtes = await findDtesToDelete();

  if (dtes.length === 0) {
    console.log('  ✅ No hay DTEs para eliminar.');
    return;
  }

  const dteIds = dtes.map((d) => d.id);
  console.log(`  DTEs identificados para eliminación: ${dteIds.length}`);

  // Safety: check percentage
  const totalDtes = await prisma.dTE.count();
  const pct = (dteIds.length / totalDtes) * 100;
  if (pct > 15) {
    console.log(`  ❌ ABORTANDO: ${pct.toFixed(1)}% de DTEs serían eliminados (límite: 15%)`);
    console.log('  Revise manualmente y ajuste el límite si es correcto.');
    return;
  }

  const result: CleanupResult = {
    dteCount: dteIds.length,
    deletedByTable: {},
    dtes,
    status: 'success',
    errors: [],
  };

  const startTime = Date.now();

  try {
    // Execute all deletions in a single transaction
    await prisma.$transaction(async (tx) => {
      // 1. DteErrorLog (string ref, not FK — but clean up)
      let r = await tx.dteErrorLog.deleteMany({
        where: { dteId: { in: dteIds } },
      });
      result.deletedByTable['DteErrorLog'] = r.count;
      console.log(`  DteErrorLog: ${r.count} eliminados`);

      // 2. DteOperationLog (string ref dteId)
      r = await tx.dteOperationLog.deleteMany({
        where: { dteId: { in: dteIds } },
      });
      result.deletedByTable['DteOperationLog'] = r.count;
      console.log(`  DteOperationLog: ${r.count} eliminados`);

      // 3. RecurringInvoiceHistory (nullable dteId ref)
      r = await tx.recurringInvoiceHistory.deleteMany({
        where: { dteId: { in: dteIds } },
      });
      result.deletedByTable['RecurringInvoiceHistory'] = r.count;
      console.log(`  RecurringInvoiceHistory: ${r.count} eliminados`);

      // 4. AuditLog (entityType=DTE, entityId matching)
      r = await tx.auditLog.deleteMany({
        where: { entityType: 'DTE', entityId: { in: dteIds } },
      });
      result.deletedByTable['AuditLog'] = r.count;
      console.log(`  AuditLog: ${r.count} eliminados`);

      // 5. JournalEntryLine → JournalEntry (sourceDocumentId)
      const journalEntries = await tx.journalEntry.findMany({
        where: { sourceType: 'DTE', sourceDocumentId: { in: dteIds } },
        select: { id: true },
      });
      const journalIds = journalEntries.map((j) => j.id);

      if (journalIds.length > 0) {
        r = await tx.journalEntryLine.deleteMany({
          where: { entryId: { in: journalIds } },
        });
        result.deletedByTable['JournalEntryLine'] = r.count;
        console.log(`  JournalEntryLine: ${r.count} eliminados`);

        r = await tx.journalEntry.deleteMany({
          where: { id: { in: journalIds } },
        });
        result.deletedByTable['JournalEntry'] = r.count;
        console.log(`  JournalEntry: ${r.count} eliminados`);
      }

      // 6. EmailSendLog (nullable dteId ref)
      r = await tx.emailSendLog.deleteMany({
        where: { dteId: { in: dteIds } },
      });
      result.deletedByTable['EmailSendLog'] = r.count;
      console.log(`  EmailSendLog: ${r.count} eliminados`);

      // 7. PaymentMethod (FK to DTE, onDelete: NoAction)
      r = await tx.paymentMethod.deleteMany({
        where: { dteId: { in: dteIds } },
      });
      result.deletedByTable['PaymentMethod'] = r.count;
      console.log(`  PaymentMethod: ${r.count} eliminados`);

      // 8. DTELog (FK to DTE, onDelete: NoAction)
      r = await tx.dTELog.deleteMany({
        where: { dteId: { in: dteIds } },
      });
      result.deletedByTable['DTELog'] = r.count;
      console.log(`  DTELog: ${r.count} eliminados`);

      // 9. DTE (principal)
      r = await tx.dTE.deleteMany({
        where: { id: { in: dteIds } },
      });
      result.deletedByTable['DTE'] = r.count;
      console.log(`  DTE: ${r.count} eliminados`);
    }, { timeout: 60000 });
  } catch (err) {
    result.status = 'failed';
    result.errors.push(String(err));
    console.error('\n  ❌ ERROR — Transacción revertida:', err);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n  Tiempo de ejecución: ${elapsed}s`);
  console.log(`  Estado: ${result.status}`);

  // Save result
  fs.mkdirSync('outputs', { recursive: true });
  fs.writeFileSync(
    'outputs/cleanup-result.json',
    JSON.stringify(
      {
        ...result,
        executionTimeSeconds: elapsed,
        timestamp: new Date().toISOString(),
        dtes: result.dtes.map((d) => ({
          id: d.id,
          tipo: d.tipoDte,
          numero: d.numeroControl,
          codigo: d.codigoGeneracion,
          estado: d.estado,
          total: d.totalPagar.toString(),
          fecha: d.createdAt.toISOString(),
          cliente: d.clienteNombre,
          reason: d.reason,
        })),
      },
      null,
      2,
    ),
  );
  console.log('  📄 Resultado guardado en outputs/cleanup-result.json');

  if (result.status === 'success') {
    console.log('\n  ⚠️  Ejecutar con --post para verificación post-limpieza.');
  }
}

async function post(): Promise<void> {
  console.log('\n=== VERIFICACIÓN POST-LIMPIEZA ===\n');

  const dtes = await findDtesToDelete();

  if (dtes.length === 0) {
    console.log('  ✅ Limpieza confirmada: 0 DTEs de prueba restantes.');
  } else {
    console.log(`  ❌ Aún quedan ${dtes.length} DTEs de prueba:`);
    for (const d of dtes) {
      console.log(`    - ${d.numeroControl} | ${d.estado} | ${d.createdAt.toISOString().slice(0, 10)} | ${d.reason}`);
    }
  }

  // Also verify related tables are clean
  const joseUser = await prisma.user.findFirst({
    where: { nombre: { contains: 'Jose Bidegain' } },
    select: { tenantId: true },
  });

  if (joseUser?.tenantId) {
    const remainingDtes = await prisma.dTE.count({
      where: { tenantId: joseUser.tenantId },
    });
    console.log(`\n  DTEs restantes en tenant de Jose Bidegain: ${remainingDtes}`);
  }

  const totalDtes = await prisma.dTE.count();
  console.log(`  DTEs totales en el sistema: ${totalDtes}`);
}

async function main(): Promise<void> {
  const phase = process.argv[2] || '--verify';

  console.log('=========================================');
  console.log('  CLEANUP: DTEs de prueba - Facturosv');
  console.log(`  Fecha: ${new Date().toISOString()}`);
  console.log(`  Fase: ${phase}`);
  console.log('=========================================');

  try {
    switch (phase) {
      case '--verify':
        await verify();
        break;
      case '--clean':
        await clean();
        break;
      case '--post':
        await post();
        break;
      default:
        console.log('Uso: npx tsx scripts/cleanup-test-dtes.ts [--verify|--clean|--post]');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
