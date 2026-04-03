/**
 * Fix: Remove IVA desglose from Wellnest tipo 01 DTEs.
 *
 * Factura tipo 01 (consumidor final) does NOT break out IVA separately.
 * The full sale price goes as ventaGravada with totalIva = 0.
 *
 * Before: gravada=13.27, iva=1.73, totalPagar=15.00
 * After:  gravada=15.00, iva=0.00, totalPagar=15.00
 *
 * Run:
 *   npx tsx scripts/fix-wellnest-no-iva.ts --verify   (read-only)
 *   npx tsx scripts/fix-wellnest-no-iva.ts --fix       (apply changes)
 *   npx tsx scripts/fix-wellnest-no-iva.ts --post      (verify after fix)
 */

import { PrismaClient, Prisma } from '@prisma/client';
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

interface DteRecord {
  id: string;
  numeroControl: string;
  totalGravada: Prisma.Decimal;
  totalIva: Prisma.Decimal;
  totalPagar: Prisma.Decimal;
  jsonOriginal: string;
  estado: string;
  createdAt: Date;
  cliente: { nombre: string } | null;
}

async function getAllWellnestDtes(): Promise<DteRecord[]> {
  return prisma.dTE.findMany({
    where: { tenantId: WELLNEST_TENANT_ID, tipoDte: '01' },
    select: {
      id: true,
      numeroControl: true,
      totalGravada: true,
      totalIva: true,
      totalPagar: true,
      jsonOriginal: true,
      estado: true,
      createdAt: true,
      cliente: { select: { nombre: true } },
    },
    orderBy: { numeroControl: 'asc' },
  });
}

async function verify(): Promise<void> {
  console.log('\n=== VERIFICACIÓN: IVA en DTEs Wellnest tipo 01 ===\n');

  const dtes = await getAllWellnestDtes();
  console.log(`  Total DTEs tipo 01: ${dtes.length}`);

  let withIva = 0;
  let withoutIva = 0;
  let totalCurrentPagar = 0;
  let totalCurrentIva = 0;

  const fixes: Array<{
    numero: string;
    cliente: string;
    before: { gravada: number; iva: number; pagar: number };
    after: { gravada: number; iva: number; pagar: number };
  }> = [];

  for (const dte of dtes) {
    const iva = Number(dte.totalIva);
    const pagar = Number(dte.totalPagar);
    const gravada = Number(dte.totalGravada);
    totalCurrentPagar += pagar;
    totalCurrentIva += iva;

    if (iva > 0) {
      withIva++;
      fixes.push({
        numero: dte.numeroControl,
        cliente: dte.cliente?.nombre || 'N/A',
        before: { gravada, iva, pagar },
        after: { gravada: pagar, iva: 0, pagar }, // totalPagar stays the same
      });
    } else {
      withoutIva++;
    }
  }

  console.log(`  Con IVA desglosado: ${withIva}`);
  console.log(`  Sin IVA (ya correcto): ${withoutIva}`);
  console.log(`  Total IVA actual: $${round2(totalCurrentIva).toFixed(2)}`);
  console.log(`  Total pagar actual: $${round2(totalCurrentPagar).toFixed(2)}`);
  console.log(`  Total pagar después del fix: $${round2(totalCurrentPagar).toFixed(2)} (sin cambio)`);

  if (fixes.length > 0) {
    console.log('\n  --- DTEs A CORREGIR ---');
    for (const f of fixes) {
      console.log(
        `    ${f.numero.padEnd(45)} | ${f.cliente.substring(0, 30).padEnd(30)} | gravada: $${f.before.gravada.toFixed(2)} → $${f.after.gravada.toFixed(2)} | iva: $${f.before.iva.toFixed(2)} → $0.00 | total: $${f.before.pagar.toFixed(2)} (sin cambio)`,
      );
    }
  }

  // Save evidence
  const evidence = {
    timestamp: new Date().toISOString(),
    totalDtes: dtes.length,
    withIva,
    withoutIva,
    totalCurrentIva: round2(totalCurrentIva),
    totalCurrentPagar: round2(totalCurrentPagar),
    fixes: fixes.map((f) => ({
      numero: f.numero,
      cliente: f.cliente,
      before: f.before,
      after: f.after,
    })),
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, 'fix-iva-verify.json'), JSON.stringify(evidence, null, 2));
  console.log(`\n  📄 Evidencia guardada en outputs/fix-iva-verify.json`);
  console.log(`\n  ⚠️  Ejecutar con --fix para aplicar correcciones a ${withIva} DTEs.`);
}

async function fix(): Promise<void> {
  console.log('\n=== APLICANDO FIX: Eliminar IVA desglose en Wellnest tipo 01 ===\n');

  const dtes = await getAllWellnestDtes();
  const toFix = dtes.filter((d) => Number(d.totalIva) > 0);

  console.log(`  DTEs a corregir: ${toFix.length}`);

  if (toFix.length === 0) {
    console.log('  ✅ No hay DTEs con IVA para corregir.');
    return;
  }

  const startTime = Date.now();
  let fixed = 0;
  const errors: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (const dte of toFix) {
      try {
        const pagar = Number(dte.totalPagar); // This is the correct final price

        // Parse and fix jsonOriginal
        const json = JSON.parse(dte.jsonOriginal);

        // Fix cuerpoDocumento items
        if (Array.isArray(json.cuerpoDocumento)) {
          for (const item of json.cuerpoDocumento) {
            // precioUni should be the full IVA-inclusive price
            // Currently it's the net price, we need to add back the IVA portion
            const currentVentaGravada = Number(item.ventaGravada) || 0;
            const currentIvaItem = Number(item.ivaItem) || 0;
            const fullPrice = round2(currentVentaGravada + currentIvaItem);

            item.precioUni = fullPrice;
            item.ventaGravada = fullPrice;
            item.ivaItem = 0;
          }
        }

        // Fix resumen
        if (json.resumen) {
          json.resumen.totalGravada = pagar;
          json.resumen.totalIva = 0;
          json.resumen.subTotalVentas = pagar;
          if (json.resumen.subTotal !== undefined) json.resumen.subTotal = pagar;
          if (json.resumen.montoTotalOperacion !== undefined) json.resumen.montoTotalOperacion = pagar;
          json.resumen.totalPagar = pagar;

          // Fix pagos if present
          if (Array.isArray(json.resumen.pagos) && json.resumen.pagos.length > 0) {
            json.resumen.pagos[0].montoPago = pagar;
          }
        }

        // Update DB: totalGravada = totalPagar, totalIva = 0
        await tx.dTE.update({
          where: { id: dte.id },
          data: {
            totalGravada: new Prisma.Decimal(pagar),
            totalIva: new Prisma.Decimal(0),
            totalPagar: new Prisma.Decimal(pagar),
            jsonOriginal: JSON.stringify(json),
          },
        });

        fixed++;
      } catch (err) {
        errors.push(`${dte.numeroControl}: ${err}`);
      }
    }
  }, { timeout: 120000 });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`  DTEs corregidos: ${fixed}`);
  console.log(`  Errores: ${errors.length}`);
  console.log(`  Tiempo: ${elapsed}s`);

  if (errors.length > 0) {
    for (const e of errors) console.log(`    ❌ ${e}`);
  }

  // Save result
  const result = {
    timestamp: new Date().toISOString(),
    fixed,
    errors,
    executionTimeSeconds: elapsed,
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'fix-iva-result.json'), JSON.stringify(result, null, 2));
  console.log(`\n  📄 Resultado guardado en outputs/fix-iva-result.json`);
  console.log(`\n  ⚠️  Ejecutar con --post para verificación.`);
}

async function post(): Promise<void> {
  console.log('\n=== VERIFICACIÓN POST-FIX ===\n');

  const dtes = await getAllWellnestDtes();

  let withIva = 0;
  let totalPagar = 0;
  let totalIva = 0;
  let totalGravada = 0;

  for (const dte of dtes) {
    const iva = Number(dte.totalIva);
    if (iva > 0) withIva++;
    totalPagar += Number(dte.totalPagar);
    totalIva += Number(dte.totalIva);
    totalGravada += Number(dte.totalGravada);
  }

  console.log(`  Total DTEs: ${dtes.length}`);
  console.log(`  DTEs con IVA > 0: ${withIva}`);
  console.log(`  Total gravada: $${round2(totalGravada).toFixed(2)}`);
  console.log(`  Total IVA: $${round2(totalIva).toFixed(2)}`);
  console.log(`  Total pagar: $${round2(totalPagar).toFixed(2)}`);

  console.log('\n  Validación:');
  console.log(`    ${withIva === 0 ? '✅' : '❌'} Sin IVA desglosado: ${withIva === 0}`);
  console.log(`    ${round2(totalIva) === 0 ? '✅' : '❌'} Total IVA = $0.00: ${round2(totalIva) === 0}`);
  console.log(`    ${round2(totalGravada) === round2(totalPagar) ? '✅' : '❌'} Gravada = Pagar: $${round2(totalGravada).toFixed(2)} = $${round2(totalPagar).toFixed(2)}`);

  // Verify against purchases
  const purchasesPath = path.join(OUTPUT_DIR, 'wellnest-purchases.json');
  if (fs.existsSync(purchasesPath)) {
    const purchases = JSON.parse(fs.readFileSync(purchasesPath, 'utf-8')).purchases;
    const sentPurchases = purchases.filter((p: { invoiceStatus: string }) => p.invoiceStatus === 'sent_to_facturador');
    const siteTotal = round2(sentPurchases.reduce((s: number, p: { finalPrice: number }) => s + p.finalPrice, 0));
    const match = Math.abs(round2(totalPagar) - siteTotal) < 0.02;
    console.log(`    ${match ? '✅' : '❌'} Total Facturo ($${round2(totalPagar).toFixed(2)}) = Total Site ($${siteTotal.toFixed(2)}): ${match}`);
  }
}

async function main(): Promise<void> {
  const phase = process.argv[2] || '--verify';

  console.log('=========================================');
  console.log('  FIX: Eliminar IVA de Wellnest tipo 01');
  console.log(`  Fecha: ${new Date().toISOString()}`);
  console.log(`  Fase: ${phase}`);
  console.log('=========================================');

  try {
    switch (phase) {
      case '--verify': await verify(); break;
      case '--fix': await fix(); break;
      case '--post': await post(); break;
      default: console.log('Uso: npx tsx scripts/fix-wellnest-no-iva.ts [--verify|--fix|--post]');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
