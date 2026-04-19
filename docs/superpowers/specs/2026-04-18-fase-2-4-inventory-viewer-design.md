# Fase 2.4 — Inventory Viewer + Alerts (Sub-proyecto B.1)

**Date:** 2026-04-18
**Sub-proyecto:** B.1 (primera entrega del sub-proyecto B = Inventario, decompuesto en B.1 visor/alertas, B.2 ajustes manuales, B.3 conteo físico)

## 1. Goal

Exponer al usuario el inventario que el backend ya computa (`InventoryState`, `InventoryMovement`). Entregar:

- Stock list con filtros + export XLSX.
- Kardex viewer por ítem.
- Alertas "bajo mínimo" en dashboard widget + sidebar badge.

**Zero schema changes. Zero new deps. Zero RBAC changes.** Reusa modelos, permisos y feature flag existentes.

## 2. Scope

**In:**

- Nuevo módulo API `inventory` (service + controller + export service).
- Páginas web `/inventario` y `/inventario/[catalogItemId]`.
- Widget dashboard `LowStockAlertCard`.
- Sidebar badge en item "Inventario".
- Tests backend (service, export, controller). E2E stubs.

**Out (deferred a B.2 / B.3):**

- Ajustes manuales (entrada/salida con subtipos).
- Conteo físico anual (online + CSV).
- Polling / auto-refresh de alertas.
- Notificaciones por email.
- Gráfico de stock en el tiempo.

## 3. Precondiciones (ya mergeado a main)

- Schema: `InventoryState` (currentQty, currentAvgCost, totalValue, reorderLevel, lastMovementAt) + `InventoryMovement` (movementDate, correlativo, movementType, qtyIn/Out, unitCost, totalCost, balanceQty, balanceAvgCost, balanceValue, documentType, documentNumber, supplierId, sourceType, sourceId, notes).
- Services que pueblan inventario: `PurchaseReceptionService` (entradas), `DteCogsService` (salidas).
- `KardexReportService` con query de movimientos (se reusa para export XLSX del kardex).
- RBAC: `catalog:read`, `report:export`. Feature flag: `inventory_reports`.

## 4. Arquitectura backend

**Ubicación:** `apps/api/src/modules/inventory/`.

**Archivos nuevos:**

```
inventory/
├── inventory.module.ts
├── inventory.controller.ts
├── inventory.controller.spec.ts
├── services/
│   ├── inventory.service.ts
│   ├── inventory.service.spec.ts
│   ├── inventory-export.service.ts
│   └── inventory-export.service.spec.ts
└── dto/
    ├── inventory-filter.dto.ts
    └── kardex-filter.dto.ts
```

### 4.1 `InventoryService`

Métodos (todos read-only, tenant-scoped):

- `findAll(tenantId, filters, pagination)`:
  - Query: `InventoryState` + join `CatalogItem` + `category`.
  - Filtra por `CatalogItem.type = 'BIEN'` (hardcoded; servicios no son stockable).
  - Filtros aceptados: `search` (code / description), `categoryId`, `status` (`OK` | `BELOW_REORDER` | `OUT_OF_STOCK`), `sortBy`, `sortOrder`.
  - Cómputo de `status` (en-memory post-query o via CASE en Prisma raw):
    - `currentQty <= 0` → `OUT_OF_STOCK`
    - `reorderLevel != null && currentQty <= reorderLevel` → `BELOW_REORDER`
    - else → `OK`
  - Retorna `{ data: InventoryItem[], total, totalPages, page, limit }`.

- `findOne(tenantId, catalogItemId)`:
  - Query por `InventoryState` con `catalogItemId`. Verifica `tenantId` match.
  - Si no hay `InventoryState` → throw `NotFoundException('Este ítem aún no tiene movimientos de inventario')`.
  - Retorna header del detalle (mismos campos que `findAll` + `categoryName`).

- `getKardex(tenantId, catalogItemId, startDate, endDate, movementType?)`:
  - Valida rango: `endDate >= startDate`, rango ≤ 12 meses (regla consistente con endpoints existentes).
  - Query `InventoryMovement` filtrado por `catalogItemId + tenantId + movementDate BETWEEN start AND end`.
  - Si `movementType` provisto, filtra también.
  - Order by `movementDate ASC, correlativo ASC`.
  - Retorna `KardexRow[]`.

- `getAlerts(tenantId)`:
  - Dos counts en una transaction:
    - `belowReorderCount` = count `InventoryState` WHERE `reorderLevel != null AND currentQty <= reorderLevel AND currentQty > 0`.
    - `outOfStockCount` = count `InventoryState` WHERE `currentQty <= 0`.
  - Retorna `{ belowReorderCount, outOfStockCount }`.

- `getTopBelowReorder(tenantId, limit = 5)`:
  - Query `InventoryState` + join `CatalogItem` WHERE below-reorder o out-of-stock.
  - Order by `(reorderLevel - currentQty) DESC` (mayor déficit primero).
  - Take limit. Retorna proyección `{catalogItemId, code, description, currentQty, reorderLevel, status}[]`.

### 4.2 `InventoryExportService`

- `exportStockList(tenantId, filters)`:
  - Reusa `InventoryService.findAll` con `limit=10000` cap.
  - Genera XLSX usando `exceljs` (ya en deps via Fase 1.3 / kardex).
  - Columnas: `Código`, `Descripción`, `Categoría`, `Stock actual`, `Costo promedio`, `Valor total`, `Reorder level`, `Último movimiento`, `Estado`.
  - Filename: `inventario_snapshot_YYYY-MM-DD.xlsx`.
- **Export de kardex por ítem:** NO duplicar código. Frontend llama directo al endpoint existente `/reports/kardex/item/:catalogItemId`.

### 4.3 `InventoryController`

Todos los endpoints con `@RequireFeature('inventory_reports')`.

| Método + Ruta | Permiso | Retorno |
|---|---|---|
| `GET /inventory` | `catalog:read` | `{data, total, totalPages, page, limit}` |
| `GET /inventory/export` | `report:export` | XLSX stream |
| `GET /inventory/alerts` | `catalog:read` | `{belowReorderCount, outOfStockCount}` |
| `GET /inventory/alerts/top?limit=5` | `catalog:read` | `TopBelowReorderItem[]` |
| `GET /inventory/:catalogItemId` | `catalog:read` | `InventoryItemDetail` |
| `GET /inventory/:catalogItemId/kardex?startDate&endDate&movementType` | `catalog:read` | `KardexRow[]` |

**Route order crítico:** `/export`, `/alerts`, `/alerts/top` ANTES de `/:catalogItemId` en NestJS para evitar matching conflict.

### 4.4 DTOs

- `InventoryFilterDto` — `search?`, `categoryId?`, `status?`, `sortBy?`, `sortOrder?`, `page?`, `limit?`.
- `KardexFilterDto` — `startDate` (required), `endDate` (required), `movementType?`.

## 5. Arquitectura frontend

**Ubicación:** `apps/web/src/app/(dashboard)/inventario/`.

### 5.1 Páginas

- `inventario/page.tsx` — stock list:
  - Filtros: search (debounced), categoryId (select cargado de `/catalog/categories`), status (OK / BELOW_REORDER / OUT_OF_STOCK), sort headers.
  - Paginación: 20 / 50 / 100.
  - Banner top: "`N` ítems bajo mínimo · `M` sin stock" (mostrar solo si counts > 0, link directo a filter).
  - Acciones: `Export XLSX` (descarga `/inventory/export` con filtros actuales).
  - Click en fila → `/inventario/[catalogItemId]`.
  - Empty state: "No hay items con movimientos de inventario todavía" + link a `/catalogo`.

- `inventario/[catalogItemId]/page.tsx` — detalle + kardex:
  - Header: código, descripción, categoría, stock actual + `StockStatusBadge`, costo promedio, valor total, reorder level, último movimiento.
  - Botón "← Volver a inventario".
  - Sección kardex:
    - Filtros: fecha desde / hasta (default mes actual), movementType (dropdown con opciones únicas vistas en data).
    - Tabla `KardexTable`: fecha, correlativo, tipo, qty in, qty out, unit cost, total cost, balance qty, balance avg cost, balance value, documento (tipo + número), notas.
    - Botón "Descargar Excel" → `/reports/kardex/item/:id?startDate&endDate` (endpoint existente, filename autogenerado).
    - Empty state kardex: "Sin movimientos en el rango seleccionado".

### 5.2 Componentes

`apps/web/src/components/inventory/`:

- `stock-status-badge.tsx` — `OK` (verde), `BELOW_REORDER` (ámbar), `OUT_OF_STOCK` (rojo). Texto en español: "OK", "Bajo mínimo", "Sin stock".
- `kardex-table.tsx` — props `rows: KardexRow[]`. Responsive, con formato correcto de decimales (qty 4 decimales, costos 4, valor 2). Vacío = muestra "Sin movimientos".
- `low-stock-alert-card.tsx` — fetch `/inventory/alerts/top?limit=5`. Muestra: título "Inventario bajo mínimo", count total, top 5, link "Ver todos →". Si alerts = 0 → retorna `null` (oculto).

### 5.3 Modificaciones

- `apps/web/src/app/(dashboard)/dashboard/page.tsx` — inserta `<LowStockAlertCard />` en grid de cards (posición: después de cards de facturación, antes de cotizaciones).
- `apps/web/src/components/layout/sidebar.tsx` — nuevo item "Inventario" (icono `Package`, ruta `/inventario`). Badge rojo con `belowReorderCount + outOfStockCount` si > 0 (fetch único `/inventory/alerts` al mount del sidebar).

### 5.4 Types (`apps/web/src/types/inventory.ts`)

```ts
export type StockStatus = 'OK' | 'BELOW_REORDER' | 'OUT_OF_STOCK';

export interface InventoryItem {
  catalogItemId: string;
  code: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  currentQty: number;
  currentAvgCost: number;
  totalValue: number;
  reorderLevel: number | null;
  lastMovementAt: string | null;
  status: StockStatus;
}

export interface InventoryItemDetail extends InventoryItem {}

export interface KardexRow {
  id: string;
  movementDate: string;
  correlativo: number;
  movementType: string;
  qtyIn: number;
  qtyOut: number;
  unitCost: number;
  totalCost: number;
  balanceQty: number;
  balanceAvgCost: number;
  balanceValue: number;
  documentType: string | null;
  documentNumber: string | null;
  notes: string | null;
}

export interface InventoryAlerts {
  belowReorderCount: number;
  outOfStockCount: number;
}

export interface TopBelowReorderItem {
  catalogItemId: string;
  code: string;
  description: string;
  currentQty: number;
  reorderLevel: number | null;
  status: StockStatus;
}
```

## 6. Error handling + edge cases

- **Item sin `InventoryState`:** no aparece en list; `/inventario/[id]` responde 404 con `{message: "Este ítem aún no tiene movimientos de inventario", code: "NO_INVENTORY_STATE"}`.
- **CatalogItem tipo SERVICIO:** excluido del list + detalle (filtro hardcodeado `type = 'BIEN'`).
- **`reorderLevel` null:** nunca `BELOW_REORDER`; solo `OUT_OF_STOCK` si `currentQty <= 0`.
- **Kardex rango inválido:** 400 `{message: "endDate debe ser posterior a startDate"}` o `{message: "Rango máximo 12 meses"}`.
- **Feature flag off:** 403 `{code: "FEATURE_DISABLED", feature: "inventory_reports"}` — frontend muestra CTA upgrade (pattern existente).
- **Export XLSX con 0 rows:** archivo con headers vacío (no error).
- **Tenant sin items:** list empty state con link a `/catalogo`.
- **Alerts endpoints:** retornan `{belowReorderCount: 0, outOfStockCount: 0}` si no hay matches; nunca 404.

## 7. Testing

### 7.1 Backend unit tests

- `inventory.service.spec.ts`:
  - `findAll` — filtros (search, category, status), paginación, sort, excluye SERVICIO.
  - `findOne` — happy, 404 sin state, cross-tenant blocked.
  - `getKardex` — rango válido, rango inválido (end < start, > 12 meses), filtro movementType, orden correcto.
  - `getAlerts` — counts correctos, excluye SERVICIO, null reorderLevel no cuenta.
  - `getTopBelowReorder` — orden por déficit, limit respect.
- `inventory-export.service.spec.ts`:
  - XLSX con data, XLSX vacío, headers correctos (9 columnas), filename con fecha.
- `inventory.controller.spec.ts`:
  - Routing + RBAC (3 endpoints `catalog:read`, 1 endpoint `report:export`), feature gate check, `tenantId` propagation.

### 7.2 Frontend

Sin unit tests (patrón Fase 2.2 / 2.3). Validación por:

- `tsc --noEmit` limpio.
- Build sin warnings.
- 3 E2E stubs (`tests/e2e/inventory.spec.ts`):
  - `test.skip('stock list filters + export XLSX')`.
  - `test.skip('abrir detalle + ver kardex con rango')`.
  - `test.skip('dashboard widget click → /inventario?filter=below-reorder')`.

### 7.3 Regression

- `npx jest --config jest.config.ts src/modules/` — sin regresiones nuevas (baseline: 2 suites pre-existentes ya fallando en main, ver evidence de Fase 2.3).
- `tsc --noEmit` API + Web — 0 errores.

## 8. Post-deploy runbook

**Zero schema changes. Zero RBAC changes. Zero new deps.**

1. Merge → CI auto-deploy a staging.
2. Smoke: login → `/inventario` → verifica lista carga con items.
3. Click ítem → verifica detalle + tabla kardex.
4. Cambiar rango fechas del kardex → verifica data filtrada.
5. Export XLSX stock list → abre en Excel, verifica 9 cols.
6. Dashboard → verifica `LowStockAlertCard` si hay items bajo mínimo.
7. Sidebar → verifica badge.
8. Merge a prod → repeat smoke.

## 9. Rollback

`git revert <merge-sha>` → CI redeploys. Zero DB changes → rollback es reversión pura de código.

## 10. Follow-ups (sub-proyectos B.2, B.3)

- **B.2 — Ajustes manuales:** entrada/salida manual con subtipos (`MERMA`, `CONSUMO_INTERNO`, `DONACION`, `ROBO`, `DAÑO`, `CORRECCION` para salidas; `ENTRADA_DONACION`, `ENTRADA_RECLASIFICACION`, `ENTRADA_CORRECCION` para entradas). Nuevas `AccountMappingRule` seeded. Asiento automático por subtipo. Nuevo service `InventoryAdjustmentsService`.
- **B.3 — Conteo físico anual:** sesión única por `fiscalYear`, captura online + upload CSV, finalización genera ajustes + asientos. Usa `PhysicalCount` / `PhysicalCountDetail` (schema ya existente) y mappings `AJUSTE_FISICO_FALTANTE` / `AJUSTE_FISICO_SOBRANTE` (ya seeded).

## 11. Open questions

Ninguna. Decisiones cerradas:

- Navegación: top-level `/inventario/*` (no bajo `/catalogo`).
- Conteo + ajustes: diferidos a B.2 / B.3.
- Alerts surface: dashboard widget + inline + sidebar badge.
- Permisos: reuso de `catalog:read` + `report:export`, feature gate `inventory_reports`.
- Tipos SERVICIO excluidos.
