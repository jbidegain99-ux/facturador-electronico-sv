# Fase 3a — Kardex Art. 142-A Excel Export (design spec)

**Fecha:** 2026-04-17
**Fase:** 3a (primera sub-fase de Fase 3 — Reportes fiscales)
**Depende de:** Fases 1.2-1.6 merged a main ✅ (InventoryMovement data completo con correlativo, supplier, nacionalidad, balances)
**Plan:** se genera después vía `superpowers:writing-plans`

**Propósito:** generar reportes Excel de Kardex cumpliendo Art. 142-A del Código Tributario El Salvador. Dos métodos: single-item (un Excel por producto) y book (multi-item con 1 sheet por item). Data ya lista desde Fase 1.5a+1.6 (movimientos ENTRADA_COMPRA + SALIDA_VENTA + ajustes). Sin UI en este scope — retorna Buffer para consumption futura (Fase 2 controller o scripts).

---

## 0. Decisiones locked

| # | Decisión | Elegido |
|---|---|---|
| D1 | Alcance MVP | **C (hybrid):** single-item + multi-item book methods. Single es 80% de la lógica; book itera + wraps. |
| D2 | Módulo | Extender `reports` module existente (ya tiene `reports.service.ts` + `reports.controller.ts`) |
| D3 | Output shape | `Promise<Buffer>` — caller decide (HTTP stream, file save, Azure Blob upload, etc.) |
| D4 | Período | Custom date range (`startDate` + `endDate`) — flexible. Callers wrap para "este mes", "año fiscal". |
| D5 | Empty range behavior | Retorna Excel con header + "sin movimientos" row. NO throw. |
| D6 | Item not found | Throw `NotFoundException` — caller responsibility. |
| D7 | Styling | Header púrpura `FF7C3AED` + texto blanco (Facturo brand). Rows alternating white/`FAFAFA`. Totals row amarillo `FFF9C4`. |
| D8 | Sheet names | Truncar a 31 chars (límite Excel). Usar `catalogItem.code`. |
| D9 | Reutilizar `exceljs@^4.4.0` | Ya instalado desde Fase 1.2. Zero new deps. |

---

## 1. Alcance (IN / OUT)

**IN Fase 3a:**
- `KardexReportService` en `reports` module
- Public: `generateKardexExcel(tenantId, catalogItemId, startDate, endDate): Promise<Buffer>`
- Public: `generateKardexBookExcel(tenantId, startDate, endDate): Promise<Buffer>`
- Internal helper (también testable): `loadKardexData(tenantId, catalogItemId, startDate, endDate): Promise<{meta, rows, totals}>`
- Types: `KardexReportMeta`, `KardexReportRow`, `KardexReportTotals`
- Excel layout: header empresa + header producto + 13 columnas Art. 142-A + totals row
- Styling Facturo (header púrpura, rows alternating, totals amarillo)
- Supplier lookup (`Cliente.numDocumento` + `Cliente.nombre`) via relation join
- Unit tests ~8 casos (verifican Buffer content via `ExcelJS.Workbook.xlsx.load`)

**OUT (diferido):**
- Controller HTTP `/api/reports/kardex` → **Fase 2**
- RBAC permission gates → Fase 2 cuando controller se cree
- PDF alternative format → post-MVP
- Azure Blob Storage upload + retention → post-MVP
- Background scheduled generation → post-MVP
- Consolidated summary sheet en book → post-MVP
- Multi-tenant batch export → post-MVP
- Email send del reporte al contador → post-MVP
- Historical integrity validation (detect gaps en correlativo) → post-MVP

---

## 2. Módulo + archivos

```
apps/api/src/modules/reports/
├── reports.module.ts                     — MODIFY: agregar provider
├── reports.service.ts                    (existente — no tocar)
├── reports.service.spec.ts               (existente — no tocar)
├── reports.controller.ts                 (existente — no tocar; Fase 2 agregará endpoint)
└── services/                             ← CREATE if missing
    ├── kardex-report.service.ts          ← NUEVO (~250 LOC)
    └── kardex-report.service.spec.ts     ← NUEVO (~250 LOC)
```

**Modify only:** `reports.module.ts` para registrar `KardexReportService` como provider + export (para Fase 2 controller).

**No schema changes. No new deps.** `exceljs@^4.4.0` ya instalado desde Fase 1.2.

---

## 3. Contratos públicos

```typescript
// kardex-report.service.ts

import type { Buffer } from 'node:buffer';

// =========================================================================
// Types
// =========================================================================

export interface KardexReportMeta {
  tenant: {
    nombre: string;
    nit: string;
    nrc: string;
  };
  catalogItem: {
    code: string;
    name: string;
    unit: string;  // CAT-014 uniMedida — display-friendly
  };
  periodo: {
    startDate: Date;
    endDate: Date;
  };
}

export interface KardexReportRow {
  correlativo: number;
  fecha: Date;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  nitProveedor: string | null;
  nombreProveedor: string | null;
  nacionalidadProveedor: string;  // 'SV' default
  qtyIn: number;
  qtyOut: number;
  balanceQty: number;
  unitCost: number;
  balanceValue: number;
  observaciones: string | null;
}

export interface KardexReportTotals {
  sumQtyIn: number;
  sumQtyOut: number;
  finalBalanceQty: number;   // balanceQty of last row (or 0 if empty)
  finalBalanceValue: number; // balanceValue of last row (or 0 if empty)
}

export interface KardexReportData {
  meta: KardexReportMeta;
  rows: KardexReportRow[];
  totals: KardexReportTotals;
}

// =========================================================================
// Service
// =========================================================================

@Injectable()
export class KardexReportService {
  constructor(private readonly prisma: PrismaService) {}

  async generateKardexExcel(
    tenantId: string,
    catalogItemId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Buffer>;

  async generateKardexBookExcel(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Buffer>;

  async loadKardexData(
    tenantId: string,
    catalogItemId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<KardexReportData>;
}
```

**Exceptions:**
- `NotFoundException` — `catalogItem` no existe o `tenantId` mismatch
- No throw en range vacío — retorna Buffer con sheet vacío + mensaje "Sin movimientos"
- `NotFoundException` si `tenantId` no existe

---

## 4. Excel layout

### Single-item sheet

```
Row 1: "KARDEX - ART. 142-A CÓDIGO TRIBUTARIO"
       (merged A1:M1, bold, centered, font 14, fill FF7C3AED, font color white)

Row 2: "Empresa: {tenant.nombre} | NIT: {tenant.nit} | NRC: {tenant.nrc}"
       (merged A2:M2, bold, centered, fill F0F0F0)

Row 3: "Producto: {catalogItem.code} - {catalogItem.name} ({catalogItem.unit})
         | Período: {DD/MM/YYYY} - {DD/MM/YYYY}"
       (merged A3:M3, centered, fill F0F0F0)

Row 4: (empty spacer)

Row 5: Column headers (bold, fill E0E0E0)
  A5: "Correlativo"
  B5: "Fecha"
  C5: "Tipo Doc"
  D5: "Número Doc"
  E5: "NIT Proveedor"
  F5: "Nombre Proveedor"
  G5: "Nacionalidad"
  H5: "Entrada"
  I5: "Salida"
  J5: "Saldo Qty"
  K5: "Costo Unit"
  L5: "Saldo Valor"
  M5: "Observaciones"

Row 6..N: Data rows
  - Alternating fill: even rows white, odd rows FAFAFA
  - B6: date formatted "DD/MM/YYYY"
  - Numeric columns (H, I, J, K, L): right-aligned, 4-decimal (qty/cost) or 2-decimal (valor)
  - Column widths auto-adjusted by ExcelJS; manual widths if narrow:
    A=12, B=12, C=10, D=25, E=18, F=35, G=14, H=12, I=12, J=14, K=14, L=16, M=30

Row N+1: (empty spacer)

Row N+2: TOTALS (bold, fill FFF9C4)
  A: "TOTAL"
  H: sumQtyIn (formatted as 4-decimal)
  I: sumQtyOut (formatted as 4-decimal)
  J: finalBalanceQty (4-decimal)
  L: finalBalanceValue (2-decimal)

Empty-range behavior (rows.length === 0):
  Row 6: merged A6:M6 "Sin movimientos en el período seleccionado" (italic, centered, fill F5F5F5)
  Row 7-8: empty
  Row 9: TOTALS con valores 0 (same layout)

Sheet name: catalogItem.code, truncated to first 31 chars
```

### Book (multi-item)

- Workbook con 1 sheet por cada `catalogItemId` que tiene ≥ 1 movimiento en el período
- Cada sheet usa el mismo layout single-item
- Order: por `catalogItem.code` ASC
- No summary sheet en MVP (diferido §G O5)

---

## 5. Flow del `loadKardexData()`

```
INPUT: tenantId, catalogItemId, startDate, endDate

1. Load CatalogItem + Tenant (parallel queries)
   [catalogItem, tenant] = await Promise.all([
     prisma.catalogItem.findUnique({ where: { id: catalogItemId } }),
     prisma.tenant.findUnique({ where: { id: tenantId } }),
   ])
   if !catalogItem || catalogItem.tenantId !== tenantId:
     throw new NotFoundException(`CatalogItem ${catalogItemId} not found for tenant ${tenantId}`)
   if !tenant:
     throw new NotFoundException(`Tenant ${tenantId} not found`)

2. Load InventoryMovements in range (with supplier join)
   movements = await prisma.inventoryMovement.findMany({
     where: {
       tenantId,
       catalogItemId,
       movementDate: { gte: startDate, lte: endDate },
     },
     include: {
       supplier: { select: { numDocumento: true, nombre: true } },
     },
     orderBy: { correlativo: 'asc' },
   })

3. Transform to KardexReportRow[]
   rows = movements.map(m => ({
     correlativo: m.correlativo,
     fecha: m.movementDate,
     tipoDocumento: m.documentType,
     numeroDocumento: m.documentNumber,
     nitProveedor: m.supplier?.numDocumento ?? null,
     nombreProveedor: m.supplier?.nombre ?? null,
     nacionalidadProveedor: m.supplierNationality ?? 'SV',
     qtyIn: Number(m.qtyIn),
     qtyOut: Number(m.qtyOut),
     balanceQty: Number(m.balanceQty),
     unitCost: Number(m.unitCost),
     balanceValue: Number(m.balanceValue),
     observaciones: m.notes,
   }))

4. Compute totals
   totals = {
     sumQtyIn: rows.reduce((s, r) => s + r.qtyIn, 0),
     sumQtyOut: rows.reduce((s, r) => s + r.qtyOut, 0),
     finalBalanceQty: rows[rows.length - 1]?.balanceQty ?? 0,
     finalBalanceValue: rows[rows.length - 1]?.balanceValue ?? 0,
   }

5. Build meta
   meta = {
     tenant: { nombre: tenant.nombre, nit: tenant.nit, nrc: tenant.nrc },
     catalogItem: {
       code: catalogItem.code,
       name: catalogItem.name,
       unit: catalogItem.uniMedida ?? 'UND',  // fallback
     },
     periodo: { startDate, endDate },
   }

6. Return { meta, rows, totals }
```

## 6. Flow del `generateKardexExcel()`

```
INPUT: tenantId, catalogItemId, startDate, endDate

1. const data = await this.loadKardexData(tenantId, catalogItemId, startDate, endDate)

2. const workbook = new ExcelJS.Workbook()
   workbook.creator = 'Facturo'
   workbook.created = new Date()

3. const sheetName = data.meta.catalogItem.code.slice(0, 31)
   const sheet = workbook.addWorksheet(sheetName)

4. this.buildSheetHeader(sheet, data.meta)   // Rows 1-3
5. this.buildColumnHeaders(sheet)             // Row 5
6. this.buildDataRows(sheet, data.rows)       // Rows 6..N (or empty-message row)
7. this.buildTotalsRow(sheet, data.rows.length + 7, data.totals)

8. this.applyColumnWidths(sheet)

9. const buffer = await workbook.xlsx.writeBuffer()
10. return Buffer.from(buffer)
```

## 7. Flow del `generateKardexBookExcel()`

```
INPUT: tenantId, startDate, endDate

1. Find all catalogItemIds with movements in period (grouped query)
   itemsWithMovements = await prisma.inventoryMovement.groupBy({
     by: ['catalogItemId'],
     where: {
       tenantId,
       movementDate: { gte: startDate, lte: endDate },
     },
   })
   → Array<{ catalogItemId: string }>

2. const workbook = new ExcelJS.Workbook()

3. Build sheets in parallel (map to catalog items, sorted by code)
   Sort itemsWithMovements by catalogItem.code ascending:
     - Resolve each catalogItemId to CatalogItem (single findMany with IDs list)
     - Sort by code
   
   For each item:
     - data = await loadKardexData(tenantId, item.catalogItemId, startDate, endDate)
     - sheet = workbook.addWorksheet(data.meta.catalogItem.code.slice(0, 31))
     - buildSheetHeader + buildColumnHeaders + buildDataRows + buildTotalsRow
   
   NOTE: if N items, makes N+1 DB queries (1 groupBy + N loadKardexData).
   For MVP tolerable. Optimize via batch fetch if performance matters later.

4. If itemsWithMovements.length === 0:
   Add a single sheet "Kardex Mensual" con row "Sin movimientos en el período".

5. return Buffer.from(await workbook.xlsx.writeBuffer())
```

---

## 8. Helper private methods (internal to service)

Encapsulan el building del Excel. Llamables desde `generateKardex*`. NO testables directamente (testadas vía integration con `generateKardexExcel`).

```typescript
private buildSheetHeader(sheet: ExcelJS.Worksheet, meta: KardexReportMeta): void;
private buildColumnHeaders(sheet: ExcelJS.Worksheet): void;
private buildDataRows(sheet: ExcelJS.Worksheet, rows: KardexReportRow[]): void;
private buildEmptyMessageRow(sheet: ExcelJS.Worksheet): void;  // si rows.length === 0
private buildTotalsRow(sheet: ExcelJS.Worksheet, rowNum: number, totals: KardexReportTotals): void;
private applyColumnWidths(sheet: ExcelJS.Worksheet): void;
```

---

## 9. Tests (~8 casos)

**Mocks:** `PrismaService` manual mock con `catalogItem.findUnique`, `tenant.findUnique`, `inventoryMovement.findMany`, `inventoryMovement.groupBy`.

**Verificación de Buffer content:** en tests, leer el Buffer via `await new ExcelJS.Workbook().xlsx.load(buffer)` y assert worksheet cells. Valida structure + values + formatting opcional.

**Casos:**

1. **Happy single-item** — 3 movements en período:
   - Load returns 3 rows con transformación correcta (supplier joined, nacionalidad fallback)
   - Excel tiene 3 data rows + totals row con sums correctos
   - Final balance = last row's balanceQty/Value

2. **Empty period** — item existe pero sin movimientos:
   - `findMany` returns []
   - Excel tiene header + "Sin movimientos" row + totals con zeros
   - No throw

3. **CatalogItem not found** — invalid ID:
   - `findUnique` returns null
   - Throws `NotFoundException`

4. **tenantId mismatch** — catalogItem existe pero tenantId distinto:
   - CatalogItem returned but catalogItem.tenantId !== tenantId
   - Throws `NotFoundException`

5. **Supplier join populates correctly** — movement con supplierId:
   - Row has nitProveedor + nombreProveedor from related Cliente
   - Row sin supplierId: nitProveedor=null, nombreProveedor=null (ajuste manual)

6. **Totals math** — rows con qtyIn/qtyOut variados:
   - sumQtyIn = sum de qtyIn de todas las rows
   - sumQtyOut = sum de qtyOut
   - finalBalanceQty = rows[last].balanceQty
   - finalBalanceValue = rows[last].balanceValue

7. **Book multi-item** — 3 items con movimientos en período:
   - `groupBy` returns 3 catalogItemIds
   - Workbook tiene 3 sheets, ordenados por code ASC
   - Cada sheet con layout correcto

8. **Sheet name truncation** — catalogItem.code = 50 chars:
   - Sheet name = primeros 31 chars
   - No throw de ExcelJS

---

## 10. Open decisions — diferidas

| # | Item | Futuro |
|---|---|---|
| O1 | Controller HTTP `/api/reports/kardex` + `/kardex/book` | Fase 2 |
| O2 | PDF alternative format vía `pdfmake` | Post-MVP si contador lo pide |
| O3 | Azure Blob Storage upload + retention policy | Post-MVP |
| O4 | Summary sheet en book (total company + grand totals) | Post-MVP |
| O5 | Multi-tenant batch export via job | Post-MVP |
| O6 | Scheduling — auto-generate al cierre de mes | Post-MVP |
| O7 | Historical integrity validation (detect correlativo gaps) | Post-MVP |
| O8 | Excel import (contador loads manual adjustments) | Post-MVP |
| O9 | Performance: batch fetch para book (N+1 queries) | Optimizar si N > 50 items reales |

---

## 11. Checklist de aprobación

- [ ] §1 alcance — 2 métodos public + helper + types, sin controller
- [ ] §2 módulo — reports/services/ + module register
- [ ] §3 contratos — `generateKardexExcel`, `generateKardexBookExcel`, `loadKardexData` + 3 types
- [ ] §4 layout — 13 columnas Art. 142-A + header + totals, styling Facturo
- [ ] §5-7 flows — load → transform → Excel build → Buffer
- [ ] §8 helpers privados — sheet building isolado
- [ ] §9 tests — 8 casos, verificar Buffer content via ExcelJS load
- [ ] §10 open decisions — controller, PDF, Azure Blob, scheduling diferidos

Una vez aprobado, invoco `superpowers:writing-plans`.
