# Execution Evidence — Fase 2.4 Inventory Viewer + Alerts (B.1)

**Date:** 2026-04-19
**Branch:** `feature/inventory-viewer`
**Spec:** `docs/superpowers/specs/2026-04-18-fase-2-4-inventory-viewer-design.md`
**Plan:** `docs/superpowers/plans/2026-04-18-fase-2-4-inventory-viewer.md`

## Built

### Backend
- `InventoryService`: `findAll`, `findOne`, `getKardex`, `getAlerts`, `getTopBelowReorder` — read-only, tenant-scoped, filtra por `CatalogItem.trackInventory = true`.
- `InventoryExportService`: XLSX stock list (9 columnas, cap 10k items).
- `InventoryController` con 6 endpoints:
  - `GET /inventory` (list)
  - `GET /inventory/export` (XLSX stream)
  - `GET /inventory/alerts` (counts)
  - `GET /inventory/alerts/top` (top-N critical)
  - `GET /inventory/:catalogItemId` (detail)
  - `GET /inventory/:catalogItemId/kardex` (kardex JSON)
- `InventoryModule` registrado en `AppModule`. Importa `PrismaModule` + `PlansModule`.
- DTOs: `InventoryFilterDto`, `KardexFilterDto` (class-validator).

### Frontend
- `/inventario` — stock list con filtros (búsqueda server-side, estado client-side), paginación, sort, export XLSX, banner alertas.
- `/inventario/[catalogItemId]` — detalle con header de stats + `KardexTable` + filtros fecha/tipo + descarga Excel vía endpoint existente `/reports/kardex/item/...`.
- `LowStockAlertCard` — widget en dashboard (top 5 críticos + click-through a `/inventario?filter=below-reorder`).
- Sidebar — nuevo nav item "Inventario" con badge rojo de alertas en vivo.
- Types compartidos en `apps/web/src/types/inventory.ts`.
- i18n (`nav.inventory` en es.json + en.json).

## Desviaciones del plan original

Aplicadas durante implementación (todas aprobadas en review):

1. **`trackInventory: true` en vez de `type: 'BIEN'`** (Tasks 2, 3, 4, 5). El plan usaba un literal inexistente; el schema de `CatalogItem` define `type` como `PRODUCT | SERVICE` y `trackInventory` es el predicado canónico de inventario (consistente con `purchase-reception.service`, `dte-cogs.service`).
2. **Removido `status` del `InventoryFilterDto` server-side**. Filtrado se hace client-side sobre la página visible. Razón: filtrado post-query rompe la semántica de paginación (`total` / `totalPages` cuentan pre-filtro).
3. **`MAX_RANGE_MS = 367 días`** (no 366) para tolerar el EOD shift en rangos de 12 meses cruzando años bisiestos.
4. **OUT_OF_STOCK = `+Infinity` deficit** en `getTopBelowReorder` para que items sin stock sorteen siempre primero, incluso si el gap numérico es menor que un BELOW_REORDER.
5. **Frontend usa `apiFetch`/`apiRawFetch`/`downloadReport`** (no raw `fetch`), siguiendo el patrón estándar del proyecto.
6. **Sidebar i18n** integrada con `next-intl` (`nav.inventory`: "Inventario" / "Inventory").
7. **`InventoryItem.description: string | null`** para match con schema (`CatalogItem.description String?`).
8. **`.overrideGuard(PlanFeatureGuard)`** en controller spec (patrón estándar de otros controllers feature-gated).

## Tests — regression sweep

| Métrica | Baseline (pre-merge) | Final (post Task 9) | Delta |
|---------|----------------------|---------------------|-------|
| Jest test suites pass | 39/54 | 44/57 | +3 suites nuevas inventory |
| Jest tests pass | 470/475 (5 fails) | 508/508 (0 fails) | +33 nuevos, 0 regresiones |
| API tsc errores | 25 (pre-existentes) | 25 | 0 nuevos en inventory |
| Web tsc errores | ~175 (lucide-react ambient) | 175 | 0 nuevos en inventory |

Tests nuevos (33 totales en 3 suites):
- `apps/api/src/modules/inventory/services/inventory.service.spec.ts` — 21 tests (findAll × 7, findOne × 3, getKardex × 5, getAlerts × 2, getTopBelowReorder × 4)
- `apps/api/src/modules/inventory/services/inventory-export.service.spec.ts` — 4 tests (9-col headers, empty data, findAll contract, Spanish labels)
- `apps/api/src/modules/inventory/inventory.controller.spec.ts` — 8 tests (findAll + no-tenant, findOne, getKardex, getAlerts, getTopBelowReorder default + clamp, exportStockList)

E2E: 3 `test.skip` en `apps/web/tests/e2e/inventory.spec.ts` (pendientes de staging).

## Not included (B.2 / B.3 deferred)

- **B.2:** Ajustes manuales de inventario (entradas/salidas con subtipos: ROBO, MERMA, AJUSTE_INV, DONACION, AUTOCONSUMO).
- **B.3:** Conteo físico anual (sesión online + CSV upload + reconciliación de diferencias).

## Post-deploy runbook

**Zero schema changes / zero RBAC changes / zero new deps.**

1. Merge → CI auto-deploy staging.
2. Login con tenant que tenga inventario (Wellnest p.ej.).
3. Sidebar muestra "Inventario" con badge si hay alertas.
4. Ir a `/inventario` → stock list con filtros + export XLSX (9 cols).
5. Click en un ítem → `/inventario/[id]` con header + kardex (default: mes actual).
6. Cambiar rango fechas → kardex se refresca.
7. Click "Descargar Excel" → XLSX kardex baja (endpoint `/reports/kardex/item/...`).
8. Dashboard → `LowStockAlertCard` con top 5 (si hay alertas).
9. Click "Ver todos" en widget → navega a `/inventario?filter=below-reorder`.
10. Repetir smoke en prod tras merge.

## Commits

```
72ebc35 feat(web): add LowStockAlertCard widget + sidebar inventory badge
a208fbe feat(web): add /inventario/[id] detail page with kardex viewer
a2e374c feat(web): add /inventario list page with filters + export
a3a7087 feat(inventory): add InventoryController + register module
83d0103 feat(inventory): add InventoryExportService (XLSX, 9 columns)
4215799 feat(inventory): add getAlerts + getTopBelowReorder to InventoryService
4b4b9f2 fix(inventory): address code review - trackInventory filter, status/pagination, leap-year range
51d6f29 feat(inventory): add InventoryService with findAll/findOne/getKardex
```

(+ este commit de evidence al final.)

## Rollback

`git revert <merge-sha>` — zero schema/data changes, reversión pura. Usuarios ven la sidebar y dashboard volver al estado pre-merge. `feature_flag inventory_reports` sigue activo pero sin endpoints que lo lean.
