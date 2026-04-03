/**
 * Wellnest Reconciliation Script
 * Matches Wellnest Site purchases against Facturador DTEs.
 *
 * Phases:
 *   --audit     (default) Analyze and report discrepancies
 *   --create    Create missing DTEs for unmatched paid purchases
 *   --post      Post-creation verification
 *
 * Run: npx tsx scripts/reconcile-wellnest.ts [--audit|--create|--post]
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });

const prisma = new PrismaClient();
const OUTPUT_DIR = path.resolve(__dirname, '../outputs');
const WELLNEST_TENANT_ID = 'cmlrggeh6000c5uj5byzwyhyh';
const IVA_RATE = 0.13;

interface WellnestPurchase {
  purchaseId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  documentId: string | null;
  documentType: string | null;
  packageId: string;
  packageName: string;
  classCount: number;
  originalPrice: number;
  finalPrice: number;
  status: string;
  createdAt: string;
  invoiceStatus: string | null;
  invoiceNumber: string | null;
  dteUuid: string | null;
  invoiceReference: string | null;
  sharedFromId: string | null;
  sharedGroupId: string | null;
  discountCode: string | null;
  paymentProviderId: string | null;
}

interface MatchResult {
  purchase: WellnestPurchase;
  matchedDteId: string | null;
  matchedDteNumero: string | null;
  matchType: 'exact_purchaseId' | 'name_amount_date' | 'unmatched';
  action: 'skip_matched' | 'skip_free' | 'skip_trial' | 'create_dte';
  reason: string;
}

function loadPurchases(): WellnestPurchase[] {
  const data = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, 'wellnest-purchases.json'), 'utf-8'));
  return data.purchases;
}

async function audit(): Promise<void> {
  console.log('\n=== FASE 1: AUDITORÍA WELLNEST ↔ FACTURADOR ===\n');

  // 1. Load purchases
  const purchases = loadPurchases();
  console.log(`  Wellnest Site: ${purchases.length} compras totales`);

  const paidPurchases = purchases.filter((p) => p.finalPrice > 0);
  const freePurchases = purchases.filter((p) => p.finalPrice === 0);
  const sentPurchases = purchases.filter((p) => p.invoiceStatus === 'sent_to_facturador');
  const sentPaid = sentPurchases.filter((p) => p.finalPrice > 0);
  const sentFree = sentPurchases.filter((p) => p.finalPrice === 0);

  console.log(`    Compras pagadas (>$0): ${paidPurchases.length} ($${paidPurchases.reduce((s, p) => s + p.finalPrice, 0).toFixed(2)})`);
  console.log(`    Compras gratis ($0):   ${freePurchases.length}`);
  console.log(`    Enviadas al facturador: ${sentPurchases.length} (${sentPaid.length} pagadas, ${sentFree.length} gratis)`);

  // 2. Load Wellnest DTEs from Facturador
  const dtes = await prisma.dTE.findMany({
    where: { tenantId: WELLNEST_TENANT_ID },
    select: {
      id: true,
      tipoDte: true,
      numeroControl: true,
      codigoGeneracion: true,
      totalGravada: true,
      totalIva: true,
      totalPagar: true,
      estado: true,
      createdAt: true,
      jsonOriginal: true,
      clienteId: true,
      cliente: { select: { nombre: true, numDocumento: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`\n  Facturador (Wellnest tenant): ${dtes.length} DTEs totales`);
  console.log(`    Total: $${dtes.reduce((s, d) => s + Number(d.totalPagar), 0).toFixed(2)}`);

  // 3. Extract purchaseId from each DTE's jsonOriginal (in extension.observaciones)
  interface DteWithPurchaseId {
    id: string;
    tipoDte: string;
    numeroControl: string;
    totalPagar: number;
    estado: string;
    createdAt: Date;
    clienteNombre: string;
    purchaseId: string | null;
  }

  const dtesWithPurchase: DteWithPurchaseId[] = dtes.map((d) => {
    let purchaseId: string | null = null;
    try {
      const json = JSON.parse(d.jsonOriginal);
      const obs = json.extension?.observaciones || '';
      const match = obs.match(/Wellnest Purchase:\s*(\S+)/);
      if (match) purchaseId = match[1];
    } catch { /* ignore */ }

    return {
      id: d.id,
      tipoDte: d.tipoDte,
      numeroControl: d.numeroControl,
      totalPagar: Number(d.totalPagar),
      estado: d.estado,
      createdAt: d.createdAt,
      clienteNombre: d.cliente?.nombre || 'N/A',
      purchaseId,
    };
  });

  const dtesWithPurchaseId = dtesWithPurchase.filter((d) => d.purchaseId);
  const dtesWithoutPurchaseId = dtesWithPurchase.filter((d) => !d.purchaseId);

  console.log(`    Con purchaseId en observaciones: ${dtesWithPurchaseId.length}`);
  console.log(`    Sin purchaseId (test/manual): ${dtesWithoutPurchaseId.length}`);

  // 4. Match purchases to DTEs
  const results: MatchResult[] = [];
  const matchedDteIds = new Set<string>();

  for (const purchase of purchases) {
    // Skip free trials without invoiceStatus
    if (purchase.finalPrice === 0 && !purchase.invoiceStatus) {
      results.push({
        purchase,
        matchedDteId: null,
        matchedDteNumero: null,
        matchType: 'unmatched',
        action: 'skip_trial',
        reason: 'Clase de prueba gratis ($0), sin factura',
      });
      continue;
    }

    // Try exact match by purchaseId
    const exactMatch = dtesWithPurchase.find(
      (d) => d.purchaseId === purchase.purchaseId && !matchedDteIds.has(d.id),
    );

    if (exactMatch) {
      matchedDteIds.add(exactMatch.id);
      results.push({
        purchase,
        matchedDteId: exactMatch.id,
        matchedDteNumero: exactMatch.numeroControl,
        matchType: 'exact_purchaseId',
        action: 'skip_matched',
        reason: `Match exacto por purchaseId → ${exactMatch.numeroControl}`,
      });
      continue;
    }

    // Try fuzzy match by name + amount + date range
    const purchaseDate = new Date(purchase.createdAt);
    const fuzzyMatch = dtesWithPurchase.find((d) => {
      if (matchedDteIds.has(d.id)) return false;
      const nameMatch = d.clienteNombre.toLowerCase().trim() === purchase.customerName.toLowerCase().trim();
      const amountMatch = Math.abs(d.totalPagar - purchase.finalPrice) < 0.02;
      const dayDiff = Math.abs(d.createdAt.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
      return nameMatch && amountMatch && dayDiff <= 2;
    });

    if (fuzzyMatch) {
      matchedDteIds.add(fuzzyMatch.id);
      results.push({
        purchase,
        matchedDteId: fuzzyMatch.id,
        matchedDteNumero: fuzzyMatch.numeroControl,
        matchType: 'name_amount_date',
        action: 'skip_matched',
        reason: `Match por nombre+monto+fecha → ${fuzzyMatch.numeroControl}`,
      });
      continue;
    }

    // No match found
    if (purchase.finalPrice === 0) {
      results.push({
        purchase,
        matchedDteId: null,
        matchedDteNumero: null,
        matchType: 'unmatched',
        action: purchase.invoiceStatus === 'sent_to_facturador' ? 'create_dte' : 'skip_free',
        reason: purchase.invoiceStatus === 'sent_to_facturador'
          ? 'Enviada al facturador pero sin DTE ($0)'
          : 'Gratis sin factura',
      });
    } else {
      results.push({
        purchase,
        matchedDteId: null,
        matchedDteNumero: null,
        matchType: 'unmatched',
        action: 'create_dte',
        reason: 'Compra pagada sin DTE correspondiente',
      });
    }
  }

  // 5. Identify orphan DTEs (in Facturador but no matching purchase)
  const orphanDtes = dtesWithPurchase.filter((d) => !matchedDteIds.has(d.id));

  // 6. Report
  const matched = results.filter((r) => r.action === 'skip_matched');
  const toCreate = results.filter((r) => r.action === 'create_dte');
  const skippedTrial = results.filter((r) => r.action === 'skip_trial');
  const skippedFree = results.filter((r) => r.action === 'skip_free');

  console.log('\n=== RESULTADO DEL MATCHING ===\n');
  console.log(`  ✅ Matched (DTE existe):      ${matched.length}`);
  console.log(`     - Por purchaseId exacto:   ${matched.filter((r) => r.matchType === 'exact_purchaseId').length}`);
  console.log(`     - Por nombre+monto+fecha:  ${matched.filter((r) => r.matchType === 'name_amount_date').length}`);
  console.log(`  🔴 Sin DTE (crear):           ${toCreate.length} ($${toCreate.reduce((s, r) => s + r.purchase.finalPrice, 0).toFixed(2)})`);
  console.log(`  ⏭️  Skip trial ($0, sin inv):  ${skippedTrial.length}`);
  console.log(`  ⏭️  Skip free (sin inv):       ${skippedFree.length}`);
  console.log(`  🟡 DTEs huérfanos (sin compra): ${orphanDtes.length}`);

  if (toCreate.length > 0) {
    console.log('\n  --- COMPRAS SIN DTE (A CREAR) ---');
    for (const r of toCreate) {
      const p = r.purchase;
      console.log(`    ${p.customerName.padEnd(40)} $${p.finalPrice.toFixed(2).padStart(8)} | ${p.packageName.padEnd(35)} | ${p.createdAt.slice(0, 10)} | ${p.invoiceStatus || 'N/A'}`);
    }
  }

  if (orphanDtes.length > 0) {
    console.log('\n  --- DTEs HUÉRFANOS (SIN COMPRA MATCHING) ---');
    for (const d of orphanDtes) {
      console.log(`    ${d.clienteNombre.padEnd(40)} $${d.totalPagar.toFixed(2).padStart(8)} | ${d.numeroControl.padEnd(40)} | ${d.createdAt.toISOString().slice(0, 10)} | ${d.estado} | purchaseId=${d.purchaseId || 'NONE'}`);
    }
  }

  // Save full audit report
  const report = {
    timestamp: new Date().toISOString(),
    wellnestSite: {
      totalPurchases: purchases.length,
      paidPurchases: paidPurchases.length,
      freePurchases: freePurchases.length,
      totalRevenue: paidPurchases.reduce((s, p) => s + p.finalPrice, 0),
      uniqueCustomers: new Set(purchases.map((p) => p.userId)).size,
    },
    facturador: {
      totalDtes: dtes.length,
      totalAmount: dtes.reduce((s, d) => s + Number(d.totalPagar), 0),
      withPurchaseId: dtesWithPurchaseId.length,
      withoutPurchaseId: dtesWithoutPurchaseId.length,
    },
    matching: {
      matched: matched.length,
      byPurchaseId: matched.filter((r) => r.matchType === 'exact_purchaseId').length,
      byNameAmountDate: matched.filter((r) => r.matchType === 'name_amount_date').length,
      toCreate: toCreate.length,
      toCreateAmount: toCreate.reduce((s, r) => s + r.purchase.finalPrice, 0),
      skippedTrial: skippedTrial.length,
      skippedFree: skippedFree.length,
      orphanDtes: orphanDtes.length,
    },
    toCreate: toCreate.map((r) => ({
      purchaseId: r.purchase.purchaseId,
      customer: r.purchase.customerName,
      email: r.purchase.customerEmail,
      amount: r.purchase.finalPrice,
      package: r.purchase.packageName,
      classCount: r.purchase.classCount,
      date: r.purchase.createdAt,
      documentId: r.purchase.documentId,
      documentType: r.purchase.documentType,
      reason: r.reason,
    })),
    orphanDtes: orphanDtes.map((d) => ({
      dteId: d.id,
      numero: d.numeroControl,
      cliente: d.clienteNombre,
      amount: d.totalPagar,
      estado: d.estado,
      date: d.createdAt.toISOString(),
      purchaseId: d.purchaseId,
    })),
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, 'reconciliation-audit.json'), JSON.stringify(report, null, 2));
  console.log(`\n  📄 Auditoría guardada en outputs/reconciliation-audit.json`);

  if (toCreate.length > 0) {
    console.log(`\n  ⚠️  Ejecutar con --create para crear ${toCreate.length} DTEs faltantes.`);
  } else {
    console.log('\n  ✅ No hay DTEs faltantes por crear.');
  }
}

async function createMissingDtes(): Promise<void> {
  console.log('\n=== FASE 2: CREAR DTEs FALTANTES ===\n');

  // Load audit results
  const auditPath = path.join(OUTPUT_DIR, 'reconciliation-audit.json');
  if (!fs.existsSync(auditPath)) {
    console.log('  ❌ Primero ejecute --audit para generar el reporte.');
    return;
  }

  const audit = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));
  const toCreate: Array<{
    purchaseId: string;
    customer: string;
    email: string;
    amount: number;
    package: string;
    classCount: number;
    date: string;
    documentId: string | null;
    documentType: string | null;
  }> = audit.toCreate;

  if (toCreate.length === 0) {
    console.log('  ✅ No hay DTEs por crear.');
    return;
  }

  console.log(`  DTEs a crear: ${toCreate.length}`);
  console.log(`  Monto total: $${toCreate.reduce((s, c) => s + c.amount, 0).toFixed(2)}`);

  // Get tenant info
  const tenant = await prisma.tenant.findUnique({
    where: { id: WELLNEST_TENANT_ID },
  });

  if (!tenant) {
    console.log('  ❌ Tenant Wellnest no encontrado.');
    return;
  }

  // Get current DTE count for number control
  const currentDteCount = await prisma.dTE.count({
    where: { tenantId: WELLNEST_TENANT_ID },
  });

  // Get the latest numeroControl to continue the sequence
  const latestDte = await prisma.dTE.findFirst({
    where: { tenantId: WELLNEST_TENANT_ID },
    orderBy: { numeroControl: 'desc' },
    select: { numeroControl: true },
  });

  // Parse the correlativo from the latest DTE number
  let nextCorrelativo = currentDteCount + 1;
  if (latestDte) {
    const match = latestDte.numeroControl.match(/(\d+)$/);
    if (match) {
      nextCorrelativo = parseInt(match[1], 10) + 1;
    }
  }

  console.log(`  DTEs actuales: ${currentDteCount}`);
  console.log(`  Próximo correlativo: ${nextCorrelativo}`);

  // Determine codEstableMH and codPuntoVentaMH from existing DTEs
  const sampleDte = await prisma.dTE.findFirst({
    where: { tenantId: WELLNEST_TENANT_ID },
    select: { numeroControl: true },
    orderBy: { createdAt: 'desc' },
  });

  let codEstable = 'M638';
  let codPuntoVenta = 'P001';
  if (sampleDte) {
    const ncMatch = sampleDte.numeroControl.match(/DTE-\d+-(\w+)(\w{4})-/);
    if (ncMatch) {
      codEstable = ncMatch[1];
      codPuntoVenta = ncMatch[2];
    }
    // More precise parse
    const parts = sampleDte.numeroControl.split('-');
    if (parts.length >= 4) {
      const estPv = parts[2]; // e.g., "M638P001"
      const estMatch = estPv.match(/^(\w{4})(\w{4})$/);
      if (estMatch) {
        codEstable = estMatch[1];
        codPuntoVenta = estMatch[2];
      }
    }
  }

  console.log(`  Establecimiento: ${codEstable}, Punto de venta: ${codPuntoVenta}`);

  const startTime = Date.now();
  const createdDtes: Array<{
    purchaseId: string;
    dteId: string;
    numeroControl: string;
    codigoGeneracion: string;
    cliente: string;
    amount: number;
    estado: string;
  }> = [];
  const errors: string[] = [];

  // Create DTEs in a transaction
  try {
    await prisma.$transaction(async (tx) => {
      let correlativo = nextCorrelativo;

      for (const purchase of toCreate) {
        try {
          const numCtrl = `DTE-01-${codEstable}${codPuntoVenta}-${String(correlativo).padStart(15, '0')}`;
          const codigoGen = crypto.randomUUID().toUpperCase();

          // IVA desglose (Wellnest prices are IVA-inclusive)
          const precioConIva = purchase.amount;
          let ventaGravada: number;
          let totalIva: number;
          let totalPagar: number;

          if (precioConIva === 0) {
            ventaGravada = 0;
            totalIva = 0;
            totalPagar = 0;
          } else {
            ventaGravada = Math.round((precioConIva / (1 + IVA_RATE)) * 100) / 100;
            totalIva = Math.round((precioConIva - ventaGravada) * 100) / 100;
            totalPagar = Math.round((ventaGravada + totalIva) * 100) / 100;
          }

          const purchaseDate = new Date(purchase.date);
          const fecha = purchaseDate.toISOString().split('T')[0];
          const hora = purchaseDate.toTimeString().split(' ')[0];

          // Build DTE JSON (same structure as webhook handler)
          const dteData = {
            identificacion: {
              version: 1,
              ambiente: '00',
              tipoDte: '01',
              numeroControl: numCtrl,
              codigoGeneracion: codigoGen,
              tipoModelo: 1,
              tipoOperacion: 1,
              tipoContingencia: null,
              motivoContin: null,
              fecEmi: fecha,
              horEmi: hora,
            },
            emisor: {
              nit: tenant.nit.replace(/-/g, ''),
              nrc: tenant.nrc.replace(/-/g, ''),
              nombre: tenant.nombre,
              codActividad: tenant.actividadEcon || '',
              descActividad: '',
              telefono: tenant.telefono.replace(/-/g, ''),
              correo: tenant.correo,
              codEstableMH: codEstable === 'M001' ? '0000' : codEstable,
              codEstable: codEstable === 'M001' ? '0000' : codEstable,
              codPuntoVentaMH: codPuntoVenta === 'P001' ? '0000' : codPuntoVenta,
              codPuntoVenta: codPuntoVenta === 'P001' ? '0000' : codPuntoVenta,
            },
            receptor: {
              tipoDocumento: purchase.documentType === 'NIT' ? '36' : '36',
              numDocumento: purchase.documentId || '',
              nombre: purchase.customer,
              correo: purchase.email,
              telefono: '',
              direccion: {},
            },
            cuerpoDocumento: [
              {
                numItem: 1,
                tipoItem: 2,
                cantidad: 1,
                codigo: '',
                descripcion: `Paquete de ${purchase.classCount} clases - Wellnest Studio`,
                precioUni: ventaGravada,
                montoDescu: 0,
                ventaGravada,
                ivaItem: totalIva,
                noGravado: 0,
              },
            ],
            resumen: {
              totalGravada: ventaGravada,
              totalIva,
              subTotalVentas: ventaGravada,
              totalPagar,
              totalLetras: '',
              condicionOperacion: 1,
            },
            extension: {
              observaciones: `Wellnest Purchase: ${purchase.purchaseId} | Payment: reconciliacion`,
            },
          };

          // Find or create Cliente
          let cliente = await tx.cliente.findFirst({
            where: {
              tenantId: WELLNEST_TENANT_ID,
              nombre: purchase.customer,
            },
          });

          if (!cliente) {
            cliente = await tx.cliente.create({
              data: {
                tenantId: WELLNEST_TENANT_ID,
                nombre: purchase.customer,
                tipoDocumento: '36',
                numDocumento: purchase.documentId || `RECON-${String(correlativo).padStart(5, '0')}`,
                correo: purchase.email,
                telefono: '',
                direccion: JSON.stringify({
                  departamento: '06',
                  municipio: '14',
                  complemento: 'San Salvador',
                }),
              },
            });
          }

          // Create DTE
          const dte = await tx.dTE.create({
            data: {
              tenantId: WELLNEST_TENANT_ID,
              clienteId: cliente.id,
              tipoDte: '01',
              codigoGeneracion: codigoGen,
              numeroControl: numCtrl,
              jsonOriginal: JSON.stringify(dteData),
              estado: 'PENDIENTE',
              totalGravada: ventaGravada,
              totalIva,
              totalPagar,
              createdAt: purchaseDate,
            },
          });

          createdDtes.push({
            purchaseId: purchase.purchaseId,
            dteId: dte.id,
            numeroControl: numCtrl,
            codigoGeneracion: codigoGen,
            cliente: purchase.customer,
            amount: purchase.amount,
            estado: 'PENDIENTE',
          });

          correlativo++;
        } catch (err) {
          errors.push(`Error for ${purchase.customer} (${purchase.purchaseId}): ${err}`);
        }
      }
    }, { timeout: 120000 });
  } catch (err) {
    console.error('  ❌ Transaction failed:', err);
    return;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n  DTEs creados: ${createdDtes.length}`);
  console.log(`  Errores: ${errors.length}`);
  console.log(`  Tiempo: ${elapsed}s`);

  if (errors.length > 0) {
    console.log('\n  Errores:');
    for (const e of errors) console.log(`    ${e}`);
  }

  // Show created DTEs
  console.log('\n  --- DTEs CREADOS ---');
  for (const d of createdDtes) {
    console.log(`    ${d.numeroControl} | ${d.cliente.padEnd(40)} | $${d.amount.toFixed(2).padStart(8)} | ${d.estado}`);
  }

  // Save result
  const result = {
    timestamp: new Date().toISOString(),
    executionTimeSeconds: elapsed,
    totalCreated: createdDtes.length,
    totalErrors: errors.length,
    totalAmount: createdDtes.reduce((s, d) => s + d.amount, 0),
    dtes: createdDtes,
    errors,
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, 'reconciliation-created.json'), JSON.stringify(result, null, 2));
  console.log(`\n  📄 Resultado guardado en outputs/reconciliation-created.json`);
  console.log(`\n  ⚠️  Ejecutar con --post para verificación final.`);
}

async function cleanup(): Promise<void> {
  console.log('\n=== LIMPIEZA: Eliminar Orphan DTEs + Crear Adriana DTEs ===\n');

  // Load audit data
  const auditPath = path.join(OUTPUT_DIR, 'reconciliation-audit.json');
  if (!fs.existsSync(auditPath)) {
    console.log('  ❌ Primero ejecute --audit.');
    return;
  }

  const auditData = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));
  const orphanDteIds: string[] = auditData.orphanDtes.map((d: { dteId: string }) => d.dteId);
  const toCreate: Array<{
    purchaseId: string;
    customer: string;
    email: string;
    amount: number;
    package: string;
    classCount: number;
    date: string;
    documentId: string | null;
    documentType: string | null;
  }> = auditData.toCreate;

  console.log(`  Orphan DTEs a eliminar: ${orphanDteIds.length}`);
  console.log(`  DTEs a crear (Adriana): ${toCreate.length}`);

  // Get tenant
  const tenant = await prisma.tenant.findUnique({ where: { id: WELLNEST_TENANT_ID } });
  if (!tenant) {
    console.log('  ❌ Tenant Wellnest no encontrado.');
    return;
  }

  // Pre-check: verify orphan DTEs still exist
  const existingOrphans = await prisma.dTE.count({
    where: { id: { in: orphanDteIds }, tenantId: WELLNEST_TENANT_ID },
  });
  console.log(`  Orphans verificados en BD: ${existingOrphans}/${orphanDteIds.length}`);

  if (existingOrphans !== orphanDteIds.length) {
    console.log('  ⚠️  Algunos orphan DTEs ya no existen. Continuando con los disponibles.');
  }

  // Get latest DTE number for new DTEs
  const latestDte = await prisma.dTE.findFirst({
    where: { tenantId: WELLNEST_TENANT_ID },
    orderBy: { numeroControl: 'desc' },
    select: { numeroControl: true },
  });

  let nextCorrelativo = 1;
  if (latestDte) {
    const m = latestDte.numeroControl.match(/(\d+)$/);
    if (m) nextCorrelativo = parseInt(m[1], 10) + 1;
  }

  // Determine codEstable from existing DTEs
  let codEstable = 'M638';
  let codPuntoVenta = 'P001';
  if (latestDte) {
    const parts = latestDte.numeroControl.split('-');
    if (parts.length >= 4) {
      const estPv = parts[2];
      const estMatch = estPv.match(/^(\w{4})(\w{4})$/);
      if (estMatch) {
        codEstable = estMatch[1];
        codPuntoVenta = estMatch[2];
      }
    }
  }

  const startTime = Date.now();
  const deletedDtes: Array<{ id: string; numero: string; cliente: string; amount: number }> = [];
  const createdDtes: Array<{ purchaseId: string; dteId: string; numero: string; cliente: string; amount: number }> = [];
  const errors: string[] = [];

  try {
    await prisma.$transaction(async (tx) => {
      // ====== STEP 1: Delete orphan DTEs ======
      console.log('\n  --- STEP 1: Eliminando orphan DTEs ---');

      // Get orphan details before deleting
      const orphanDetails = await tx.dTE.findMany({
        where: { id: { in: orphanDteIds }, tenantId: WELLNEST_TENANT_ID },
        select: { id: true, numeroControl: true, totalPagar: true, cliente: { select: { nombre: true } } },
      });

      // Delete related records first
      const logResult = await tx.dTELog.deleteMany({
        where: { dteId: { in: orphanDteIds } },
      });
      console.log(`    DTELog eliminados: ${logResult.count}`);

      const pmResult = await tx.paymentMethod.deleteMany({
        where: { dteId: { in: orphanDteIds } },
      });
      console.log(`    PaymentMethod eliminados: ${pmResult.count}`);

      const emailResult = await tx.emailSendLog.deleteMany({
        where: { dteId: { in: orphanDteIds } },
      });
      console.log(`    EmailSendLog eliminados: ${emailResult.count}`);

      const opLogResult = await tx.dteOperationLog.deleteMany({
        where: { dteId: { in: orphanDteIds } },
      });
      console.log(`    DteOperationLog eliminados: ${opLogResult.count}`);

      const errLogResult = await tx.dteErrorLog.deleteMany({
        where: { dteId: { in: orphanDteIds } },
      });
      console.log(`    DteErrorLog eliminados: ${errLogResult.count}`);

      const auditLogResult = await tx.auditLog.deleteMany({
        where: { entityType: 'DTE', entityId: { in: orphanDteIds } },
      });
      console.log(`    AuditLog eliminados: ${auditLogResult.count}`);

      // Delete the DTEs
      const dteResult = await tx.dTE.deleteMany({
        where: { id: { in: orphanDteIds }, tenantId: WELLNEST_TENANT_ID },
      });
      console.log(`    DTE eliminados: ${dteResult.count}`);

      for (const d of orphanDetails) {
        deletedDtes.push({
          id: d.id,
          numero: d.numeroControl,
          cliente: d.cliente?.nombre || 'N/A',
          amount: Number(d.totalPagar),
        });
      }

      // ====== STEP 2: Create missing DTEs for Adriana ======
      if (toCreate.length > 0) {
        console.log('\n  --- STEP 2: Creando DTEs faltantes ---');

        // Recalculate next correlativo after deletion
        const remainingLatest = await tx.dTE.findFirst({
          where: { tenantId: WELLNEST_TENANT_ID },
          orderBy: { numeroControl: 'desc' },
          select: { numeroControl: true },
        });

        let correlativo = nextCorrelativo;
        if (remainingLatest) {
          const m = remainingLatest.numeroControl.match(/(\d+)$/);
          if (m) correlativo = parseInt(m[1], 10) + 1;
        }

        for (const purchase of toCreate) {
          const numCtrl = `DTE-01-${codEstable}${codPuntoVenta}-${String(correlativo).padStart(15, '0')}`;
          const codigoGen = crypto.randomUUID().toUpperCase();

          const purchaseDate = new Date(purchase.date);
          const fecha = purchaseDate.toISOString().split('T')[0];
          const hora = purchaseDate.toTimeString().split(' ')[0];

          const dteJson = {
            identificacion: {
              version: 1, ambiente: '00', tipoDte: '01', numeroControl: numCtrl,
              codigoGeneracion: codigoGen, tipoModelo: 1, tipoOperacion: 1,
              tipoContingencia: null, motivoContin: null, fecEmi: fecha, horEmi: hora,
            },
            emisor: {
              nit: tenant.nit.replace(/-/g, ''), nrc: tenant.nrc.replace(/-/g, ''),
              nombre: tenant.nombre, codActividad: tenant.actividadEcon || '',
              descActividad: '', telefono: tenant.telefono.replace(/-/g, ''),
              correo: tenant.correo,
              codEstableMH: codEstable, codEstable,
              codPuntoVentaMH: codPuntoVenta, codPuntoVenta,
            },
            receptor: {
              tipoDocumento: '36', numDocumento: purchase.documentId || '',
              nombre: purchase.customer, correo: purchase.email, telefono: '', direccion: {},
            },
            cuerpoDocumento: [{
              numItem: 1, tipoItem: 2, cantidad: 1, codigo: '',
              descripcion: `Paquete de ${purchase.classCount} clases - Wellnest Studio`,
              precioUni: 0, montoDescu: 0, ventaGravada: 0, ivaItem: 0, noGravado: 0,
            }],
            resumen: {
              totalGravada: 0, totalIva: 0, subTotalVentas: 0, totalPagar: 0,
              totalLetras: '', condicionOperacion: 1,
            },
            extension: {
              observaciones: `Wellnest Purchase: ${purchase.purchaseId} | Payment: reconciliacion`,
            },
          };

          // Find or create Cliente
          let cliente = await tx.cliente.findFirst({
            where: { tenantId: WELLNEST_TENANT_ID, nombre: purchase.customer },
          });
          if (!cliente) {
            cliente = await tx.cliente.create({
              data: {
                tenantId: WELLNEST_TENANT_ID, nombre: purchase.customer,
                tipoDocumento: '36', numDocumento: purchase.documentId || `RECON-${String(correlativo).padStart(5, '0')}`,
                correo: purchase.email, telefono: '',
                direccion: JSON.stringify({ departamento: '06', municipio: '14', complemento: 'San Salvador' }),
              },
            });
          }

          const dte = await tx.dTE.create({
            data: {
              tenantId: WELLNEST_TENANT_ID, clienteId: cliente.id, tipoDte: '01',
              codigoGeneracion: codigoGen, numeroControl: numCtrl,
              jsonOriginal: JSON.stringify(dteJson), estado: 'PENDIENTE',
              totalGravada: 0, totalIva: 0, totalPagar: 0, createdAt: purchaseDate,
            },
          });

          createdDtes.push({
            purchaseId: purchase.purchaseId, dteId: dte.id,
            numero: numCtrl, cliente: purchase.customer, amount: 0,
          });
          console.log(`    Creado: ${numCtrl} | ${purchase.customer} | $0.00`);
          correlativo++;
        }
      }
    }, { timeout: 120000 });
  } catch (err) {
    console.error('\n  ❌ Transaction FAILED (rolled back):', err);
    return;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n=== RESULTADO ===`);
  console.log(`  Orphan DTEs eliminados: ${deletedDtes.length}`);
  console.log(`  Revenue eliminada: $${deletedDtes.reduce((s, d) => s + d.amount, 0).toFixed(2)}`);
  console.log(`  DTEs creados: ${createdDtes.length}`);
  console.log(`  Errores: ${errors.length}`);
  console.log(`  Tiempo: ${elapsed}s`);

  // Show deleted DTEs
  console.log('\n  --- DTEs ELIMINADOS ---');
  for (const d of deletedDtes) {
    console.log(`    ${d.numero.padEnd(45)} | ${d.cliente.padEnd(30)} | $${d.amount.toFixed(2).padStart(10)}`);
  }

  // Save results
  const result = {
    timestamp: new Date().toISOString(),
    executionTimeSeconds: elapsed,
    deleted: {
      total: deletedDtes.length,
      totalAmount: deletedDtes.reduce((s, d) => s + d.amount, 0),
      dtes: deletedDtes,
    },
    created: {
      total: createdDtes.length,
      totalAmount: 0,
      dtes: createdDtes,
    },
    errors,
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, 'reconciliation-cleanup.json'), JSON.stringify(result, null, 2));
  console.log(`\n  📄 Resultado guardado en outputs/reconciliation-cleanup.json`);
  console.log(`\n  ⚠️  Ejecutar con --post para verificación final.`);
}

async function postVerify(): Promise<void> {
  console.log('\n=== FASE 3: VERIFICACIÓN POST-RECONCILIACIÓN ===\n');

  const purchases = loadPurchases();
  const paidPurchases = purchases.filter((p) => p.finalPrice > 0);

  // Current DTEs
  const dtes = await prisma.dTE.findMany({
    where: { tenantId: WELLNEST_TENANT_ID },
    select: {
      id: true,
      tipoDte: true,
      numeroControl: true,
      totalPagar: true,
      estado: true,
      createdAt: true,
      jsonOriginal: true,
      cliente: { select: { nombre: true } },
    },
  });

  const totalDtePagar = dtes.reduce((s, d) => s + Number(d.totalPagar), 0);
  const uniqueClientes = new Set(dtes.map((d) => d.cliente?.nombre).filter(Boolean));

  // Count by estado
  const byEstado: Record<string, number> = {};
  for (const d of dtes) {
    byEstado[d.estado] = (byEstado[d.estado] || 0) + 1;
  }

  // Match DTEs to paid purchases
  let matchedPaid = 0;
  for (const p of paidPurchases) {
    const found = dtes.find((d) => {
      try {
        const json = JSON.parse(d.jsonOriginal);
        return json.extension?.observaciones?.includes(p.purchaseId);
      } catch {
        return false;
      }
    });
    if (found) matchedPaid++;
  }

  console.log('  Wellnest Site:');
  console.log(`    Total compras: ${purchases.length}`);
  console.log(`    Compras pagadas: ${paidPurchases.length} ($${paidPurchases.reduce((s, p) => s + p.finalPrice, 0).toFixed(2)})`);

  console.log('\n  Facturador (Wellnest tenant):');
  console.log(`    Total DTEs: ${dtes.length}`);
  console.log(`    Total monto: $${totalDtePagar.toFixed(2)}`);
  console.log(`    Clientes únicos: ${uniqueClientes.size}`);
  console.log(`    Por estado: ${Object.entries(byEstado).map(([k, v]) => `${k}: ${v}`).join(', ')}`);

  // Expected: 96 DTEs (94 matched + 2 Adriana created), revenue from IVA desglose
  const sentPurchases = purchases.filter((p) => p.invoiceStatus === 'sent_to_facturador');
  const expectedDtes = sentPurchases.length; // 96

  console.log('\n  Validación:');
  const dteCountOk = dtes.length === expectedDtes;
  console.log(`    ${dteCountOk ? '✅' : '❌'} Total DTEs: ${dtes.length} (esperado: ${expectedDtes})`);

  console.log(`    Clientes únicos: ${uniqueClientes.size}`);
  console.log(`    Total monto DTEs: $${totalDtePagar.toFixed(2)}`);
  console.log(`    Por estado: ${Object.entries(byEstado).map(([k, v]) => `${k}: ${v}`).join(', ')}`);

  console.log('\n  Cobertura:');
  console.log(`    Compras pagadas con DTE: ${matchedPaid}/${paidPurchases.length} (${((matchedPaid / paidPurchases.length) * 100).toFixed(1)}%)`);

  // Check no orphan Jose test DTEs remain
  const joseTestDtes = dtes.filter((d) => {
    const clientName = d.cliente?.nombre || '';
    return (clientName === 'Jose Bidegain' || clientName.toLowerCase().includes('test')) &&
      d.createdAt < new Date('2026-03-01');
  });
  console.log(`    ${joseTestDtes.length === 0 ? '✅' : '❌'} Orphan test DTEs: ${joseTestDtes.length}`);

  const allPaidCovered = matchedPaid === paidPurchases.length;
  console.log(`    ${allPaidCovered ? '✅' : '❌'} Todas las compras pagadas tienen DTE: ${allPaidCovered}`);
  console.log(`    ${dteCountOk ? '✅' : '❌'} Conteo reconciliado: ${dtes.length}/${expectedDtes}`);
}

async function main(): Promise<void> {
  const phase = process.argv[2] || '--audit';

  console.log('=========================================');
  console.log('  RECONCILIACIÓN: Wellnest ↔ Facturador');
  console.log(`  Fecha: ${new Date().toISOString()}`);
  console.log(`  Fase: ${phase}`);
  console.log('=========================================');

  try {
    switch (phase) {
      case '--audit':
        await audit();
        break;
      case '--create':
        await createMissingDtes();
        break;
      case '--cleanup':
        await cleanup();
        break;
      case '--post':
        await postVerify();
        break;
      default:
        console.log('Uso: npx tsx scripts/reconcile-wellnest.ts [--audit|--create|--cleanup|--post]');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
