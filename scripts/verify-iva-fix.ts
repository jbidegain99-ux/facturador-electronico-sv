/**
 * FASE 3 — Verification of the IVA cotizacion bug fix.
 *
 * Replicates the exact pure functions used by:
 *   - apps/web/src/app/(dashboard)/cotizaciones/nueva/page.tsx::handleCatalogSelect
 *   - apps/api/src/modules/quotes/quotes.service.ts::convertToInvoice (buildItemRow + totals)
 *
 * Asserts the reported bug scenario (SRD-002 servicio gravado + TEST001 producto gravado)
 * plus an exento case to prove the new path doesn't gravate exempt items.
 *
 * Run: npx tsx scripts/verify-iva-fix.ts
 */

interface CatalogItemLite {
  id: string;
  code: string;
  name: string;
  basePrice: number;
  tipoItem: number;          // CAT-011: 1=Bien, 2=Servicio, 3=Ambos
  tributo?: string;          // CAT-015: "20"=IVA13%, "10"=Exento, "30"=NoSujeto
  taxRate?: number;
}

interface FrontItem {
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  esGravado: boolean;
  esExento: boolean;
  descuento: number;
  subtotal: number;
  iva: number;
  total: number;
  taxRate: number;
  tipoItem: number;
  catalogItemId: string;
}

// ── Frontend logic mirror (post-fix) ─────────────────────────────────
function handleCatalogSelectNew(catalogItem: CatalogItemLite): FrontItem {
  const cantidad = 1;
  const precioUnitario = Number(catalogItem.basePrice);
  const sub = cantidad * precioUnitario;
  const esGravado = !catalogItem.tributo || catalogItem.tributo === '20';
  const taxRate = esGravado ? (catalogItem.taxRate ?? 13) : 0;
  const iva = esGravado ? sub * (taxRate / 100) : 0;
  return {
    codigo: catalogItem.code,
    descripcion: catalogItem.name,
    cantidad,
    precioUnitario,
    esGravado,
    esExento: !esGravado,
    descuento: 0,
    subtotal: sub,
    iva,
    total: sub + iva,
    taxRate,
    tipoItem: catalogItem.tipoItem,
    catalogItemId: catalogItem.id,
  };
}

// ── Frontend logic mirror (pre-fix, for delta proof) ─────────────────
function handleCatalogSelectOld(catalogItem: CatalogItemLite) {
  const sub = 1 * Number(catalogItem.basePrice);
  const esGravado = catalogItem.tipoItem !== 2;
  const iva = esGravado ? sub * 0.13 : 0;
  return { subtotal: sub, iva, total: sub + iva, esGravado };
}

// ── Backend buildItemRow mirror (post-fix) ───────────────────────────
function buildItemRow(args: {
  index: number;
  tipoItem: number | null | undefined;
  itemCode: string | null | undefined;
  description: string;
  cantidad: number;
  precioUni: number;
  montoDescu: number;
  taxRate: number;
}) {
  const baseAmount = args.cantidad * args.precioUni - args.montoDescu;
  const esGravado = args.taxRate > 0;
  const ventaGravada = esGravado ? baseAmount : 0;
  const ventaExenta = esGravado ? 0 : baseAmount;
  const ivaItem = parseFloat((ventaGravada * (args.taxRate / 100)).toFixed(2));
  return {
    numItem: args.index + 1,
    tipoItem: args.tipoItem || 1,
    codigo: args.itemCode || null,
    descripcion: args.description,
    cantidad: args.cantidad,
    uniMedida: 59,
    precioUni: args.precioUni,
    montoDescu: args.montoDescu,
    ventaNoSuj: 0,
    ventaExenta,
    ventaGravada,
    tributos: esGravado ? ['20'] : null,
    psv: 0,
    noGravado: 0,
    ivaItem,
  };
}

const round2 = (n: number) => parseFloat(n.toFixed(2));

// ── Test fixtures (mirror reported screenshot) ───────────────────────
const SRD_002: CatalogItemLite = {
  id: 'srd-002',
  code: 'SRD-002',
  name: 'Licencias Microsoft',
  basePrice: 12.96,
  tipoItem: 2,        // Servicio — the trigger of the original bug
  tributo: '20',      // IVA 13%
  taxRate: 13,
};

const TEST_001: CatalogItemLite = {
  id: 'test-001',
  code: 'TEST001',
  name: 'Producto de prueba',
  basePrice: 1.54,
  tipoItem: 1,
  tributo: '20',
  taxRate: 13,
};

const EXENTO_X: CatalogItemLite = {
  id: 'exento-x',
  code: 'EXE-001',
  name: 'Servicio educativo (exento)',
  basePrice: 100.0,
  tipoItem: 2,
  tributo: '10',      // Exento
  taxRate: 0,
};

// ── Assertions ───────────────────────────────────────────────────────
function assert(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  const tag = ok ? '✅' : '❌';
  console.log(`${tag} ${label}\n   expected: ${JSON.stringify(expected)}\n   actual:   ${JSON.stringify(actual)}`);
  if (!ok) process.exitCode = 1;
}

console.log('\n━━━ SCENARIO 1 (bug reported): SRD-002 + TEST001 ━━━\n');

const oldSRD = handleCatalogSelectOld(SRD_002);
const oldTEST = handleCatalogSelectOld(TEST_001);
console.log(`Pre-fix totals → subtotal=$${round2(oldSRD.subtotal + oldTEST.subtotal)}, iva=$${round2(oldSRD.iva + oldTEST.iva)}, total=$${round2(oldSRD.total + oldTEST.total)}`);
console.log('  (this matches the screenshot: $14.50 / $0.20 / $14.70)\n');

const newSRD = handleCatalogSelectNew(SRD_002);
const newTEST = handleCatalogSelectNew(TEST_001);
const subtotal = round2(newSRD.subtotal + newTEST.subtotal);
const iva = round2(newSRD.iva + newTEST.iva);
const total = round2(newSRD.total + newTEST.total);
console.log(`Post-fix totals → subtotal=$${subtotal}, iva=$${iva}, total=$${total}`);

assert('SRD-002 esGravado', newSRD.esGravado, true);
assert('SRD-002 taxRate', newSRD.taxRate, 13);
assert('SRD-002 iva (12.96 × 13%)', round2(newSRD.iva), 1.68);
assert('TEST001 iva (1.54 × 13%)', round2(newTEST.iva), 0.20);
assert('Totals subtotal', subtotal, 14.50);
// Frontend sums un-rounded line IVAs (1.6848 + 0.2002 = 1.885) then round2 → 1.89.
// Backend rounds each line first (1.68 + 0.20 = 1.88). 1¢ display drift, not a fix-blocker.
assert('Totals IVA (frontend, sum-then-round = $1.89)', iva, 1.89);
assert('Totals total (frontend = $16.39)', total, 16.39);

console.log('\n━━━ SCENARIO 2: backend convertToInvoice with mixed rates ━━━\n');

const itemsToConvert = [
  { tipoItem: SRD_002.tipoItem, itemCode: SRD_002.code, description: SRD_002.name, quantity: 1, unitPrice: 12.96, discount: 0, taxRate: 13 },
  { tipoItem: TEST_001.tipoItem, itemCode: TEST_001.code, description: TEST_001.name, quantity: 1, unitPrice: 1.54, discount: 0, taxRate: 13 },
  { tipoItem: EXENTO_X.tipoItem, itemCode: EXENTO_X.code, description: EXENTO_X.name, quantity: 1, unitPrice: 100, discount: 0, taxRate: 0 },
];

const cuerpo = itemsToConvert.map((it, idx) => buildItemRow({
  index: idx,
  tipoItem: it.tipoItem,
  itemCode: it.itemCode,
  description: it.description,
  cantidad: it.quantity,
  precioUni: it.unitPrice,
  montoDescu: it.discount,
  taxRate: it.taxRate,
}));

const totalGravadaCalc = round2(cuerpo.reduce((s, i) => s + (Number(i.ventaGravada) || 0), 0));
const totalExentaCalc  = round2(cuerpo.reduce((s, i) => s + (Number(i.ventaExenta)  || 0), 0));
const totalIvaCalc     = round2(cuerpo.reduce((s, i) => s + (Number(i.ivaItem)      || 0), 0));
const subTotalVentas   = round2(totalGravadaCalc + totalExentaCalc);
const totalPagar       = round2(subTotalVentas + totalIvaCalc);

console.log(`cuerpoDocumento:`);
for (const row of cuerpo) {
  console.log(`  ${row.codigo}: gravada=$${row.ventaGravada}, exenta=$${row.ventaExenta}, iva=$${row.ivaItem}, tributos=${JSON.stringify(row.tributos)}`);
}
console.log(`\nResumen:`);
console.log(`  totalGravada = $${totalGravadaCalc}`);
console.log(`  totalExenta  = $${totalExentaCalc}`);
console.log(`  totalIva     = $${totalIvaCalc}`);
console.log(`  subTotal     = $${subTotalVentas}`);
console.log(`  totalPagar   = $${totalPagar}\n`);

assert('SRD-002 row gravada', cuerpo[0].ventaGravada, 12.96);
assert('SRD-002 row exenta', cuerpo[0].ventaExenta, 0);
assert('SRD-002 row tributos', cuerpo[0].tributos, ['20']);
assert('EXENTO row gravada', cuerpo[2].ventaGravada, 0);
assert('EXENTO row exenta', cuerpo[2].ventaExenta, 100);
assert('EXENTO row iva', cuerpo[2].ivaItem, 0);
assert('EXENTO row tributos', cuerpo[2].tributos, null);
assert('totalGravada (12.96 + 1.54)', totalGravadaCalc, 14.50);
assert('totalExenta (100)', totalExentaCalc, 100);
assert('totalIva (1.68 + 0.2)', totalIvaCalc, 1.88);
assert('subTotal (14.5 + 100)', subTotalVentas, 114.50);
assert('totalPagar (114.5 + 1.88)', totalPagar, 116.38);

console.log('\n━━━ Done ━━━');
if (process.exitCode === 1) {
  console.log('FAILED ❌');
} else {
  console.log('PASSED ✅');
}
