# Fase 3c — Estado de Costo de Venta Excel Export

**Date:** 2026-04-17
**Phase:** 3c (tercera sub-fase de Fase 3 — Reportes fiscales)
**Status:** Design approved — ready for plan
**Depende de:** Fases 1.2–1.6 + 3a + 3b merged en `main` ✅
**Branch:** `feature/cogs-statement-report`

---

## 1. Objetivo

Generar un Excel de una hoja con el **Estado de Costo de Venta** para un período, útil como:
- Soporte para la **F11 Declaración de Renta anual** (sección de Costos y Gastos).
- Reporte interno mensual/trimestral para verificar que el inventario "cuadra".
- Validación cruzada entre el cálculo por fórmula (Inv.Inicial + Compras − Inv.Final) y el COGS registrado en asientos contables (vía `SALIDA_VENTA` en `InventoryMovement`).

Alcance: **fórmula de comerciante (retailer)**. Fórmula manufacturera (Materia Prima + MOD + CIF) queda fuera de scope.

### Scope IN

- Cálculo del Costo de lo Vendido por fórmula:
  - `Inventario Inicial + (Compras Brutas − Devoluciones sobre compras − Descuentos sobre compras) − Inventario Final = Costo de lo Vendido`
- Sección de Reconciliación con COGS registrado:
  - COGS registrado = `SALIDA_VENTA` total − `ENTRADA_DEVOLUCION_VENTA` total
  - Ajustes físicos = `AJUSTE_FISICO_FALTANTE` (merma) − `AJUSTE_FISICO_SOBRANTE`
  - Diferencia esperada = 0 (si no, hay inconsistencia que el contador debe investigar)
- Excel 1 hoja con styling consistente Facturo (header púrpura, totales amarillo, alerta verde/rojo para diferencia).

### Scope OUT (deferred)

- **Fórmula manufacturera** (MP/MOD/CIF): requiere nuevos movement types que no existen.
- **Devoluciones sobre compras (`SALIDA_DEVOLUCION_COMPRA`)**: no hay movement type aún. En este MVP sale en $0.00 con nota explícita en Excel.
- **Per-product breakdown**: el detalle por producto ya está en Kardex (Fase 3a). No se duplica.
- **Múltiples sheets**: YAGNI — el Estado es inherentemente un resumen de 1 página.
- **Controller HTTP `/api/reports/cogs-statement`** → Fase 2.
- **RBAC permissions gate** → Fase 2.
- **PDF format** → post-MVP.
- **Azure Blob upload + retención** → post-MVP.

---

## 2. Arquitectura

Nuevo service en `apps/api/src/modules/reports/services/cogs-statement-report.service.ts`. Mismo patrón que `KardexReportService` y `IvaDeclaracionReportService`:

- Un método público: `generateCogsStatementExcel(tenantId, periodStart, periodEnd): Promise<Buffer>`.
- Un loader puro: `loadCogsStatementData(...): Promise<CogsStatementData>`.
- Private helpers para construir el Excel.
- Registrado en `reports.module.ts`.
- Zero schema changes, zero new deps.

### Interfaces públicas

```typescript
export interface CogsStatementMeta {
  tenant: { nombre: string; nit: string; nrc: string };
  periodo: { startDate: Date; endDate: Date };
}

export interface CogsStatementFormula {
  inventarioInicial: number;
  comprasBrutas: number;
  devolucionesSobreCompras: number;  // 0 en MVP
  descuentosSobreCompras: number;
  comprasNetas: number;               // comprasBrutas - devoluciones - descuentos
  mercaderiaDisponible: number;       // inventarioInicial + comprasNetas
  inventarioFinal: number;
  costoDeLoVendido: number;           // mercaderiaDisponible - inventarioFinal
}

export interface CogsStatementReconciliacion {
  cogsFormula: number;                 // = formula.costoDeLoVendido
  cogsRegistrado: number;              // SALIDA_VENTA - ENTRADA_DEVOLUCION_VENTA
  faltantes: number;                   // AJUSTE_FISICO_FALTANTE (positive)
  sobrantes: number;                   // AJUSTE_FISICO_SOBRANTE (positive)
  ajusteNeto: number;                  // faltantes - sobrantes
  diferencia: number;                  // cogsFormula - cogsRegistrado - ajusteNeto
}

export interface CogsStatementData {
  meta: CogsStatementMeta;
  formula: CogsStatementFormula;
  reconciliacion: CogsStatementReconciliacion;
}
```

---

## 3. Flujo de datos

### Paso 1 — Inventario Inicial

Suma del último `balanceValue` por `catalogItemId` cuyo movimiento es estrictamente anterior a `periodStart`.

```typescript
// Prisma findMany + reducción in-memory (Prisma SQLServer no soporta DISTINCT ON)
const preMovs = await prisma.inventoryMovement.findMany({
  where: { tenantId, movementDate: { lt: periodStart } },
  select: { catalogItemId: true, balanceValue: true, movementDate: true, correlativo: true },
  orderBy: [{ catalogItemId: 'asc' }, { movementDate: 'desc' }, { correlativo: 'desc' }],
});

// Reducción: primera ocurrencia por catalogItemId (mayor movementDate+correlativo)
const inventarioInicial = new Map<string, number>();
for (const m of preMovs) {
  if (!inventarioInicial.has(m.catalogItemId)) {
    inventarioInicial.set(m.catalogItemId, Number(m.balanceValue));
  }
}
const invInicial = Array.from(inventarioInicial.values()).reduce((s, v) => s + v, 0);
```

### Paso 2 — Compras brutas del período

```typescript
const comprasAgg = await prisma.inventoryMovement.aggregate({
  where: {
    tenantId,
    movementType: 'ENTRADA_COMPRA',
    movementDate: { gte: periodStart, lte: periodEnd },
  },
  _sum: { totalCost: true },
});
const comprasBrutas = Number(comprasAgg._sum.totalCost ?? 0);
```

### Paso 3 — Devoluciones sobre compras

```typescript
const devolucionesSobreCompras = 0;  // MVP: no existe SALIDA_DEVOLUCION_COMPRA
```

### Paso 4 — Descuentos sobre compras

```typescript
const descuentosAgg = await prisma.purchase.aggregate({
  where: {
    tenantId,
    purchaseDate: { gte: periodStart, lte: periodEnd },
  },
  _sum: { discountAmount: true },
});
const descuentosSobreCompras = Number(descuentosAgg._sum.discountAmount ?? 0);
```

### Paso 5 — Inventario Final

Suma del último `balanceValue` por `catalogItemId` cuyo movimiento es `<= periodEnd` (incluye los del período).

```typescript
const allMovs = await prisma.inventoryMovement.findMany({
  where: { tenantId, movementDate: { lte: periodEnd } },
  select: { catalogItemId: true, balanceValue: true, movementDate: true, correlativo: true },
  orderBy: [{ catalogItemId: 'asc' }, { movementDate: 'desc' }, { correlativo: 'desc' }],
});

const inventarioFinal = new Map<string, number>();
for (const m of allMovs) {
  if (!inventarioFinal.has(m.catalogItemId)) {
    inventarioFinal.set(m.catalogItemId, Number(m.balanceValue));
  }
}
const invFinal = Array.from(inventarioFinal.values()).reduce((s, v) => s + v, 0);
```

### Paso 6 — COGS por fórmula

```typescript
const comprasNetas = comprasBrutas - devolucionesSobreCompras - descuentosSobreCompras;
const mercaderiaDisponible = invInicial + comprasNetas;
const costoDeLoVendido = mercaderiaDisponible - invFinal;
```

### Paso 7 — Reconciliación

```typescript
const salidaVentaAgg = await prisma.inventoryMovement.aggregate({
  where: { tenantId, movementType: 'SALIDA_VENTA', movementDate: { gte: periodStart, lte: periodEnd } },
  _sum: { totalCost: true },
});
const devolucionVentaAgg = await prisma.inventoryMovement.aggregate({
  where: { tenantId, movementType: 'ENTRADA_DEVOLUCION_VENTA', movementDate: { gte: periodStart, lte: periodEnd } },
  _sum: { totalCost: true },
});
const cogsRegistrado = Number(salidaVentaAgg._sum.totalCost ?? 0)
                     - Number(devolucionVentaAgg._sum.totalCost ?? 0);

const faltanteAgg = await prisma.inventoryMovement.aggregate({
  where: { tenantId, movementType: 'AJUSTE_FISICO_FALTANTE', movementDate: { gte: periodStart, lte: periodEnd } },
  _sum: { totalCost: true },
});
const sobranteAgg = await prisma.inventoryMovement.aggregate({
  where: { tenantId, movementType: 'AJUSTE_FISICO_SOBRANTE', movementDate: { gte: periodStart, lte: periodEnd } },
  _sum: { totalCost: true },
});
const faltantes = Number(faltanteAgg._sum.totalCost ?? 0);
const sobrantes = Number(sobranteAgg._sum.totalCost ?? 0);
const ajusteNeto = faltantes - sobrantes;
const diferencia = costoDeLoVendido - cogsRegistrado - ajusteNeto;
```

---

## 4. Layout hoja "Estado de Costo de Venta"

3 columnas: A (label ancho, 50ch), B (sub-valor, 18ch), C (valor principal, 18ch).

| Row | A | B | C |
|---|---|---|---|
| 1 | **ESTADO DE COSTO DE VENTA** *(merged A1:C1, púrpura)* | | |
| 2 | Empresa: {nombre} \| NIT: {nit} \| NRC: {nrc} *(merged A2:C2, grey)* | | |
| 3 | Período: {start} a {end} *(merged A3:C3, grey)* | | |
| 4 | *(spacer)* | | |
| 5 | Inventario Inicial | | {invInicial} |
| 6 | *(spacer)* | | |
| 7 | Compras Brutas del período | {comprasBrutas} | |
| 8 | (−) Devoluciones sobre compras | {devoluciones} | |
| 9 | (−) Descuentos sobre compras | {descuentos} | |
| 10 | (=) Compras Netas | | {comprasNetas} |
| 11 | *(spacer)* | | |
| 12 | (=) Mercadería Disponible para la Venta | | {mercaderiaDisponible} |
| 13 | *(spacer)* | | |
| 14 | (−) Inventario Final | | {invFinal} |
| 15 | *(spacer)* | | |
| 16 | **(=) COSTO DE LO VENDIDO (por fórmula)** | | **{costoDeLoVendido}** *(totals yellow)* |
| 17 | *(spacer)* | | |
| 18 | **Reconciliación con COGS Registrado** *(section header)* | | |
| 19 | COGS por fórmula (fila 16) | | {cogsFormula} |
| 20 | COGS registrado en asientos (SALIDA_VENTA neto) | | {cogsRegistrado} |
| 21 | *(spacer)* | | |
| 22 | Ajustes físicos del período: | | |
| 23 | &nbsp;&nbsp;&nbsp;&nbsp;(−) Faltantes / Mermas | {faltantes} | |
| 24 | &nbsp;&nbsp;&nbsp;&nbsp;(+) Sobrantes | {sobrantes} | |
| 25 | (=) Ajuste neto (faltantes − sobrantes) | | {ajusteNeto} |
| 26 | *(spacer)* | | |
| 27 | **Diferencia (fila 19 − fila 20 − fila 25)** | | **{diferencia}** *(green if 0, else red+yellow)* |
| 28 | *(spacer)* | | |
| 29 | *Nota: Devoluciones sobre compras se registrarán cuando se implemente NCE emitida a proveedor. Actualmente muestran $0.00.* *(merged A29:C29, italic, small)* | | |

**Styling:**
- Row 1: bold 14pt blanco sobre púrpura `FF7C3AED`, merged, center.
- Rows 2-3: bold grey `FFF0F0F0`, merged, center.
- Rows 5-16: alternating fill `FFFAFAFA` en filas pares.
- Row 16 "COSTO DE LO VENDIDO (por fórmula)": bold, fondo amarillo `FFFFF9C4`.
- Row 18: bold grey section header, no fill data row below.
- Rows 19-25: alternating fill.
- Row 27 "Diferencia":
  - Si `|diferencia| < 0.005`: bold, fondo verde `FFC8E6C9`.
  - Si no: bold, fondo amarillo + texto rojo `FFC00000`.
- Row 29: italic 10pt.

**Column widths:** 50, 18, 18.

**Formato numérico:** todos los valores `#,##0.00;(#,##0.00)`.

---

## 5. Edge cases + error handling

| Caso | Comportamiento |
|---|---|
| Período sin movimientos | Inv. inicial = último balance histórico anterior a `periodStart`; Inv. final = igual (no hay cambio). COGS = 0. Todos los otros totales = 0. Diferencia = 0. Excel válido. |
| Tenant no existe | `NotFoundException('Tenant {tenantId} not found')` |
| `endDate < startDate` | `BadRequestException('endDate debe ser posterior a startDate')` |
| Tenant sin ningún movimiento histórico | invInicial = 0, invFinal = 0. COGS = 0. Excel válido. |
| Múltiples movimientos en la misma fecha | Desempate por `correlativo DESC` (field ya existe). |
| `diferencia ≠ 0` | Se muestra en rojo como alerta visual. NO es un error — es informativo. |
| Decimales Prisma | `Number(...)` para convertir Decimal/string → number, mismo patrón Kardex/IVA. |

---

## 6. Tests — `cogs-statement-report.service.spec.ts`

Siguiendo patrón Kardex/IVA: 8 casos TDD red con verificación buffer via `ExcelJS.xlsx.load()`.

**Mock pattern:** manual `mockPrisma()` con `inventoryMovement.findMany`, `inventoryMovement.aggregate`, `purchase.aggregate`, `tenant.findUnique`. Decimal fields simulados como strings.

**Test cases:**

1. **Happy path** — período con 2 items, 3 compras, 5 ventas, 1 merma. Verifica cada celda:
   - Inv inicial (sum de pre-movs)
   - Compras brutas, netas, mercadería disponible
   - Inv final (sum de últimos movs ≤ endDate)
   - COGS fórmula
   - COGS registrado (ventas netas de devoluciones)
   - Faltantes = 1 merma; Sobrantes = 0
   - Ajuste neto = faltantes
   - Diferencia = 0

2. **Solo compras** — solo `ENTRADA_COMPRA` en período, sin ventas ni ajustes. Verifica:
   - Compras > 0
   - COGS fórmula = 0 (todas aumentan inv)
   - COGS registrado = 0
   - Diferencia = 0

3. **Solo ventas** — solo `SALIDA_VENTA` en período. Inv inicial > 0 (histórico), compras = 0. Verifica:
   - Compras = 0
   - Inv final < Inv inicial
   - COGS fórmula > 0
   - COGS registrado > 0
   - Diferencia = 0

4. **Con merma** — período con ventas + `AJUSTE_FISICO_FALTANTE`. Verifica:
   - Línea "Faltantes" muestra monto
   - COGS fórmula > COGS registrado
   - Diferencia = 0 (ajuste neto cubre el gap)

5. **Con sobrante** — período con ventas + `AJUSTE_FISICO_SOBRANTE`. Verifica:
   - Línea "Sobrantes" muestra monto
   - Ajuste neto = negativo
   - Diferencia = 0

6. **Con devolución de venta** — `SALIDA_VENTA` + `ENTRADA_DEVOLUCION_VENTA`. Verifica:
   - COGS registrado = ventas − devoluciones
   - Diferencia = 0

7. **Período vacío / sin movimientos** — Excel válido. invInicial = invFinal del histórico. COGS = 0. Diferencia = 0. Fila 27 fondo verde.

8. **Error paths** — Tenant null → `NotFoundException`. `endDate < startDate` → `BadRequestException`.

---

## 7. Archivos afectados

**Crear:**
- `apps/api/src/modules/reports/services/cogs-statement-report.service.ts` (~380 LOC)
- `apps/api/src/modules/reports/services/cogs-statement-report.service.spec.ts` (~320 LOC)

**Modificar:**
- `apps/api/src/modules/reports/reports.module.ts` — agregar `CogsStatementReportService` a `providers` + `exports`.

Sin schema changes. Sin nuevas dependencias.

---

## 8. Criterios de aceptación

- [ ] 8/8 unit tests verdes.
- [ ] Regresión: 285 baseline (Fase 3b) + 8 nuevos = 293 passing, sin regresiones.
- [ ] `tsc --noEmit` limpio (filtrando pre-existing `test-fixtures.ts`).
- [ ] `CogsStatementReportService` registrado en `reports.module.ts`.
- [ ] Método público único `generateCogsStatementExcel(tenantId, start, end): Buffer`.
- [ ] Excel abre correctamente en Excel/LibreOffice.
- [ ] `loadCogsStatementData()` pure, testable independiente del Excel.
- [ ] Evidence file `outputs/EXECUTION_EVIDENCE_PHASE_3C.md`.
- [ ] PR abierto contra `main`.

---

## 9. Referencias

- `outputs/VALIDATION_RESEARCH.md` §B.6 — NIIF PYMES Sección 13 (Promedio Ponderado móvil).
- `outputs/2026-04-17-fase-3a-kardex-report-design.md` — patrón base.
- `outputs/2026-04-17-fase-3b-iva-declaracion-report-design.md` — patrón más reciente.
- `apps/api/src/modules/reports/services/iva-declaracion-report.service.ts` — implementación de referencia.
- `apps/api/src/modules/dte/services/dte-cogs.service.ts` — origen de `SALIDA_VENTA` y `ENTRADA_DEVOLUCION_VENTA`.
- `apps/api/src/modules/purchases/services/purchase-reception.service.ts` — origen de `ENTRADA_COMPRA`.
