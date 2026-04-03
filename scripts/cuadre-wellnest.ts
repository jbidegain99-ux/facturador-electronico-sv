/**
 * Cuadre detallado: Wellnest purchases vs Facturo DTEs
 * Matches each DTE to its purchase and compares amounts.
 *
 * Run: npx tsx scripts/cuadre-wellnest.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });

const prisma = new PrismaClient();
const WELLNEST_TENANT_ID = 'cmlrggeh6000c5uj5byzwyhyh';
const OUTPUT_DIR = path.resolve(__dirname, '../outputs');

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function main() {
  console.log('\n=== CUADRE DETALLADO: Wellnest Site ↔ Facturo ===\n');

  // Load purchases
  const purchaseData = JSON.parse(
    fs.readFileSync(path.join(OUTPUT_DIR, 'wellnest-purchases.json'), 'utf-8'),
  );
  const purchases: Array<{
    purchaseId: string;
    customerName: string;
    finalPrice: number;
    packageName: string;
    classCount: number;
    createdAt: string;
    invoiceStatus: string | null;
  }> = purchaseData.purchases;

  const sentPurchases = purchases.filter((p) => p.invoiceStatus === 'sent_to_facturador');

  // Load DTEs
  const dtes = await prisma.dTE.findMany({
    where: { tenantId: WELLNEST_TENANT_ID },
    select: {
      id: true,
      numeroControl: true,
      totalGravada: true,
      totalIva: true,
      totalPagar: true,
      estado: true,
      createdAt: true,
      jsonOriginal: true,
      cliente: { select: { nombre: true } },
    },
    orderBy: { numeroControl: 'asc' },
  });

  console.log(`  Purchases enviadas: ${sentPurchases.length}`);
  console.log(`  DTEs en Facturo: ${dtes.length}`);

  // Extract purchaseId from each DTE
  const dteMap = new Map<string, typeof dtes[0]>();
  const dteByPurchaseId = new Map<string, typeof dtes[0]>();

  for (const dte of dtes) {
    dteMap.set(dte.id, dte);
    try {
      const json = JSON.parse(dte.jsonOriginal);
      const obs: string = json.extension?.observaciones || '';
      const match = obs.match(/Wellnest Purchase:\s*(\S+)/);
      if (match) {
        dteByPurchaseId.set(match[1], dte);
      }
    } catch { /* ignore */ }
  }

  // Match and compare
  console.log('\n  --- COMPARACIÓN DTE vs PURCHASE ---\n');
  console.log(
    '  ' +
    'Num DTE'.padEnd(48) +
    'Cliente'.padEnd(35) +
    'DTE $'.padStart(10) +
    'Purchase $'.padStart(12) +
    'Diff'.padStart(10) +
    '  Status',
  );
  console.log('  ' + '-'.repeat(125));

  let totalDte = 0;
  let totalPurchase = 0;
  let totalDiff = 0;
  let matchCount = 0;
  let mismatchCount = 0;
  const mismatches: Array<{
    numero: string;
    cliente: string;
    dtePagar: number;
    purchasePrice: number;
    diff: number;
    purchaseId: string;
    packageName: string;
  }> = [];

  // Track matched DTEs
  const matchedDteIds = new Set<string>();

  for (const purchase of sentPurchases) {
    // Find DTE by purchaseId
    let dte = dteByPurchaseId.get(purchase.purchaseId);

    // Fallback: match by name + date
    if (!dte) {
      const pDate = new Date(purchase.createdAt);
      dte = dtes.find((d) => {
        if (matchedDteIds.has(d.id)) return false;
        const nameMatch = (d.cliente?.nombre || '').toLowerCase().trim() === purchase.customerName.toLowerCase().trim();
        const dayDiff = Math.abs(d.createdAt.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24);
        return nameMatch && dayDiff <= 2;
      });
    }

    if (dte) {
      matchedDteIds.add(dte.id);
      const dtePagar = Number(dte.totalPagar);
      const diff = round2(dtePagar - purchase.finalPrice);

      totalDte += dtePagar;
      totalPurchase += purchase.finalPrice;
      totalDiff += Math.abs(diff);

      const status = Math.abs(diff) < 0.02 ? '✅' : '❌';
      if (Math.abs(diff) >= 0.02) {
        mismatchCount++;
        mismatches.push({
          numero: dte.numeroControl,
          cliente: purchase.customerName,
          dtePagar,
          purchasePrice: purchase.finalPrice,
          diff,
          purchaseId: purchase.purchaseId,
          packageName: purchase.packageName,
        });
      } else {
        matchCount++;
      }

      console.log(
        '  ' +
        dte.numeroControl.padEnd(48) +
        purchase.customerName.substring(0, 33).padEnd(35) +
        `$${dtePagar.toFixed(2)}`.padStart(10) +
        `$${purchase.finalPrice.toFixed(2)}`.padStart(12) +
        `$${diff.toFixed(2)}`.padStart(10) +
        `  ${status}`,
      );
    } else {
      console.log(
        '  ' +
        '??? (sin DTE)'.padEnd(48) +
        purchase.customerName.substring(0, 33).padEnd(35) +
        'N/A'.padStart(10) +
        `$${purchase.finalPrice.toFixed(2)}`.padStart(12) +
        'N/A'.padStart(10) +
        '  ❓',
      );
    }
  }

  // Unmatched DTEs
  const unmatchedDtes = dtes.filter((d) => !matchedDteIds.has(d.id));

  console.log('\n  ' + '='.repeat(125));
  console.log(
    '  ' +
    'TOTAL'.padEnd(83) +
    `$${round2(totalDte).toFixed(2)}`.padStart(10) +
    `$${round2(totalPurchase).toFixed(2)}`.padStart(12) +
    `$${round2(totalDte - totalPurchase).toFixed(2)}`.padStart(10),
  );

  console.log('\n=== RESUMEN ===\n');
  console.log(`  Matches exactos (diff < $0.02): ${matchCount}`);
  console.log(`  Mismatches:                     ${mismatchCount}`);
  console.log(`  DTEs sin purchase:              ${unmatchedDtes.length}`);
  console.log(`  Total DTE:      $${round2(totalDte).toFixed(2)}`);
  console.log(`  Total Purchase: $${round2(totalPurchase).toFixed(2)}`);
  console.log(`  Diferencia:     $${round2(totalDte - totalPurchase).toFixed(2)}`);

  if (mismatches.length > 0) {
    console.log('\n  --- DETALLE MISMATCHES ---');
    for (const m of mismatches) {
      console.log(`    ${m.numero} | ${m.cliente.padEnd(35)} | DTE: $${m.dtePagar.toFixed(2).padStart(8)} | Purchase: $${m.purchasePrice.toFixed(2).padStart(8)} | Diff: $${m.diff.toFixed(2).padStart(8)} | ${m.packageName}`);
    }
  }

  if (unmatchedDtes.length > 0) {
    console.log('\n  --- DTEs SIN PURCHASE MATCH ---');
    for (const d of unmatchedDtes) {
      console.log(`    ${d.numeroControl} | ${(d.cliente?.nombre || 'N/A').padEnd(35)} | $${Number(d.totalPagar).toFixed(2).padStart(8)} | ${d.estado}`);
    }
  }

  // Save
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'cuadre-detallado.json'),
    JSON.stringify({ totalDte: round2(totalDte), totalPurchase: round2(totalPurchase), diff: round2(totalDte - totalPurchase), matchCount, mismatchCount, unmatchedDtes: unmatchedDtes.length, mismatches }, null, 2),
  );
  console.log(`\n  📄 Detalle guardado en outputs/cuadre-detallado.json`);

  await prisma.$disconnect();
}

main().catch(console.error);
