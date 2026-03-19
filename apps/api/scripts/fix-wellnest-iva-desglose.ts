/**
 * Corrección retroactiva: Desglose IVA en DTEs de Wellnest
 *
 * Problema: Wellnest envía `amount` con IVA incluido (13%), pero el webhook
 * lo trataba como monto neto y agregaba 13% adicional.
 *
 * Ejemplo:
 *   Antes:  precioUni=15.00, ventaGravada=15.00, ivaItem=1.95, totalPagar=16.95 ❌
 *   Ahora:  precioUni=13.27, ventaGravada=13.27, ivaItem=1.73, totalPagar=15.00 ✓
 *
 * Usage (from apps/api/):
 *   npx ts-node -r dotenv/config scripts/fix-wellnest-iva-desglose.ts
 *
 * Dry-run (no changes):
 *   DRY_RUN=true npx ts-node -r dotenv/config scripts/fix-wellnest-iva-desglose.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === 'true';
const WELLNEST_TENANT_ID = 'cmlr9oa4a000a7kxp86k3kbsg';
const IVA_RATE = 0.13;
const SINCE_DATE = new Date('2026-03-01T00:00:00Z');

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface CuerpoItem {
  numItem: number;
  tipoItem: number;
  cantidad: number;
  codigo: string;
  descripcion: string;
  precioUni: number;
  montoDescu: number;
  ventaGravada: number;
  ventaNoSuj?: number;
  ventaExenta?: number;
  ivaItem?: number;
  noGravado: number;
  [key: string]: unknown;
}

interface DteJson {
  identificacion: Record<string, unknown>;
  emisor: Record<string, unknown>;
  receptor: Record<string, unknown>;
  cuerpoDocumento: CuerpoItem[];
  resumen: {
    totalGravada: number;
    totalIva: number;
    subTotalVentas: number;
    subTotal?: number;
    montoTotalOperacion?: number;
    totalPagar: number;
    totalLetras: string;
    condicionOperacion: number;
    pagos?: Array<{ codigo: string; montoPago: number; referencia: string | null; plazo: string | null; periodo: number | null }>;
    [key: string]: unknown;
  };
  extension?: Record<string, unknown>;
  [key: string]: unknown;
}

interface FixResult {
  dteId: string;
  codigoGeneracion: string;
  createdAt: Date;
  before: {
    precioUni: number;
    ventaGravada: number;
    ivaItem: number;
    totalGravada: number;
    totalIva: number;
    totalPagar: number;
  };
  after: {
    precioUni: number;
    ventaGravada: number;
    ivaItem: number;
    totalGravada: number;
    totalIva: number;
    totalPagar: number;
  };
  delta: number;
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Wellnest IVA Desglose Fix`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : '🔴 LIVE — will update DB'}`);
  console.log(`  Tenant: ${WELLNEST_TENANT_ID}`);
  console.log(`  Since: ${SINCE_DATE.toISOString()}`);
  console.log(`${'='.repeat(60)}\n`);

  // 1. Fetch all Wellnest DTEs since March 1
  const dtes = await prisma.dTE.findMany({
    where: {
      tenantId: WELLNEST_TENANT_ID,
      tipoDte: '01',
      createdAt: { gte: SINCE_DATE },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${dtes.length} DTEs for Wellnest since ${SINCE_DATE.toISOString().split('T')[0]}\n`);

  if (dtes.length === 0) {
    console.log('No DTEs to fix. Exiting.');
    return;
  }

  const fixes: FixResult[] = [];
  const skipped: string[] = [];

  for (const dte of dtes) {
    let json: DteJson;
    try {
      json = JSON.parse(dte.jsonOriginal) as DteJson;
    } catch {
      console.error(`  ❌ Cannot parse jsonOriginal for DTE ${dte.id}`);
      skipped.push(dte.id);
      continue;
    }

    const items = json.cuerpoDocumento;
    if (!items || items.length === 0) {
      console.error(`  ❌ No cuerpoDocumento for DTE ${dte.id}`);
      skipped.push(dte.id);
      continue;
    }

    const resumen = json.resumen;
    const oldTotalPagar = Number(resumen.totalPagar);
    const oldTotalIva = Number(resumen.totalIva);
    const oldTotalGravada = Number(resumen.totalGravada);

    // Check if this DTE has the IVA-on-top problem:
    // If totalPagar ≈ totalGravada * 1.13, IVA was added on top
    const expectedWrongTotal = round2(oldTotalGravada * (1 + IVA_RATE));
    const isAffected = Math.abs(oldTotalPagar - expectedWrongTotal) < 0.02;

    if (!isAffected) {
      console.log(`  ⏭️  DTE ${dte.id} — totalPagar=${oldTotalPagar} does not match IVA-on-top pattern, skipping`);
      skipped.push(dte.id);
      continue;
    }

    // Recalculate: the original ventaGravada was the IVA-inclusive price
    // (because amount was treated as net, but it was actually IVA-inclusive)
    const precioConIva = oldTotalGravada; // This was the amount - discount (IVA inclusive)

    // Correct desglose
    let newTotalGravada = 0;
    let newTotalIva = 0;

    for (const item of items) {
      const oldPrecioUni = Number(item.precioUni);
      const oldMontoDescu = Number(item.montoDescu) || 0;
      const cantidad = Number(item.cantidad) || 1;

      // The original precioUni was the IVA-inclusive price
      // The original montoDescu was the IVA-inclusive discount
      // ventaGravada = precioUni * cantidad - montoDescu (IVA inclusive)
      const itemPrecioConIva = oldPrecioUni * cantidad - oldMontoDescu;

      // Desglose
      const newPrecioUni = round2(oldPrecioUni / (1 + IVA_RATE));
      const newMontoDescu = round2(oldMontoDescu / (1 + IVA_RATE));
      const newVentaGravada = round2(itemPrecioConIva / (1 + IVA_RATE));
      const newIvaItem = round2(itemPrecioConIva - newVentaGravada);

      item.precioUni = newPrecioUni;
      item.montoDescu = newMontoDescu;
      item.ventaGravada = newVentaGravada;
      item.ivaItem = newIvaItem;

      newTotalGravada += newVentaGravada;
      newTotalIva += newIvaItem;
    }

    newTotalGravada = round2(newTotalGravada);
    newTotalIva = round2(newTotalIva);
    const newTotalPagar = round2(newTotalGravada + newTotalIva);

    // Update resumen
    resumen.totalGravada = newTotalGravada;
    resumen.totalIva = newTotalIva;
    resumen.subTotalVentas = newTotalGravada;
    if (resumen.subTotal !== undefined) resumen.subTotal = newTotalGravada;
    resumen.montoTotalOperacion = newTotalPagar;
    resumen.totalPagar = newTotalPagar;

    // Update pagos if present
    if (resumen.pagos && Array.isArray(resumen.pagos) && resumen.pagos.length > 0) {
      resumen.pagos[0].montoPago = newTotalPagar;
    }

    const fix: FixResult = {
      dteId: dte.id,
      codigoGeneracion: dte.codigoGeneracion,
      createdAt: dte.createdAt,
      before: {
        precioUni: Number(items[0] ? (dtes.find(d => d.id === dte.id) ? JSON.parse(dte.jsonOriginal).cuerpoDocumento[0]?.precioUni : 0) : 0),
        ventaGravada: oldTotalGravada,
        ivaItem: oldTotalIva,
        totalGravada: oldTotalGravada,
        totalIva: oldTotalIva,
        totalPagar: oldTotalPagar,
      },
      after: {
        precioUni: items[0]?.precioUni || 0,
        ventaGravada: newTotalGravada,
        ivaItem: newTotalIva,
        totalGravada: newTotalGravada,
        totalIva: newTotalIva,
        totalPagar: newTotalPagar,
      },
      delta: round2(oldTotalPagar - newTotalPagar),
    };

    fixes.push(fix);

    console.log(`  ✅ DTE ${dte.id}`);
    console.log(`     Before: gravada=${oldTotalGravada}, iva=${oldTotalIva}, total=${oldTotalPagar}`);
    console.log(`     After:  gravada=${newTotalGravada}, iva=${newTotalIva}, total=${newTotalPagar}`);
    console.log(`     Delta:  -${fix.delta}`);

    if (!DRY_RUN) {
      await prisma.dTE.update({
        where: { id: dte.id },
        data: {
          jsonOriginal: JSON.stringify(json),
          totalGravada: new Prisma.Decimal(newTotalGravada),
          totalIva: new Prisma.Decimal(newTotalIva),
          totalPagar: new Prisma.Decimal(newTotalPagar),
        },
      });
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Total DTEs found:     ${dtes.length}`);
  console.log(`  DTEs corrected:       ${fixes.length}`);
  console.log(`  DTEs skipped:         ${skipped.length}`);

  if (fixes.length > 0) {
    const totalDelta = round2(fixes.reduce((sum, f) => sum + f.delta, 0));
    console.log(`  Total delta (over-invoiced): $${totalDelta}`);
  }

  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN — no changes made' : 'LIVE — changes applied'}`);
  console.log(`${'='.repeat(60)}\n`);

  // Output JSON evidence for first 5 fixes
  if (fixes.length > 0) {
    const evidence = fixes.slice(0, 5).map(f => ({
      dteId: f.dteId,
      codigoGeneracion: f.codigoGeneracion,
      createdAt: f.createdAt.toISOString(),
      before: f.before,
      after: f.after,
      delta: f.delta,
    }));
    console.log('\nEvidence (first 5 fixes):');
    console.log(JSON.stringify(evidence, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
