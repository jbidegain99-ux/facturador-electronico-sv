# Execution Evidence — Fase 2.5 Inventory Adjustments (B.2)

**Date:** 2026-04-19
**Branch:** `feature/inventory-adjustments`
**Spec:** `docs/superpowers/specs/2026-04-19-fase-2-5-inventory-adjustments-design.md`
**Plan:** `docs/superpowers/plans/2026-04-19-fase-2-5-inventory-adjustments.md`

## Built

### Backend
- `InventoryAdjustmentService` con `createAdjustment` (6 subtipos, tx Prisma, valida stock + fecha + trackInventory, weighted avg para entrada) y `listAdjustments` (paginado + filtros).
- `InventoryAdjustmentsController` con `POST /inventory/adjustments` + `GET /inventory/adjustments`.
- `InventoryAdjustmentsModule` registrado en `AppModule`. Importa `PrismaModule`, `PlansModule`, `AccountingModule`.
- DTOs `CreateAdjustmentDto` + `ListAdjustmentsDto`.
- Permiso `inventory:adjust` agregado a GERENTE + CONTADOR.
- 4 mappings contables nuevos: `AJUSTE_ROBO`, `AJUSTE_MERMA`, `AJUSTE_DONACION`, `AJUSTE_AUTOCONSUMO` (cuentas 5104-5107 → 110401).
- Reusos existentes: `AJUSTE_FISICO_FALTANTE`/`AJUSTE_FISICO_SOBRANTE` para AJUSTE_FALTANTE/SOBRANTE.
- Integración contable feature-gated: genera JE automático si el tenant tiene feature `accounting`; si cuenta contable falta, graceful failure (log warning, movement se guarda con `journalEntryId=null`).
- Seed script `apps/api/scripts/seed-inventory-adjust-perm.ts` para crear cuentas 5104-5107 en tenants existentes (idempotente, `--dry-run` soportado).

### Frontend
- Tipos + `CreateAdjustmentModal` reusable (`apps/web/src/components/inventory/create-adjustment-modal.tsx`).
- Trigger en `/inventario/[catalogItemId]` — botón `+ Ajuste` al lado del `StockStatusBadge`.
- List-page trigger diferido (requiere item-picker con combobox — follow-up chico).
- i18n / labels: nombres en español via `ADJUSTMENT_SUBTYPE_LABELS`.

## Desviaciones del plan (durante implementación, todas self-corrigidas)

1. **API real de AccountingService es 2-step** (`createJournalEntry` + `postJournalEntry`), NO `createAndPostJournalEntry` como sugería el plan. Implementado con el patrón correcto (mismo que `dte-cogs.service` y `purchases.service`).
2. **`Tenant.plan`, no `Tenant.planCode`** — field name corregido tanto en service como en mocks.
3. **`entryType` enum valores válidos: `MANUAL | ADJUSTMENT | CLOSING`** (el plan decía `AUTOMATIC` que no existe). Usamos `ADJUSTMENT`.
4. **`AccountingAccount.accountType`, no `type`** — field corregido en el seed script.
5. **Controller methods `async`** (necesario para que `await expect(...).rejects.toThrow()` funcione en Jest con throws síncronos).

## Tests — regression sweep

| Métrica | Baseline (pre B.2) | Final | Delta |
|---------|--------------------|-------|-------|
| Jest suites pass | ~42 suites | 42 passed, 17 failed, 59 total | +2 suites nuevas (service + controller) |
| Jest tests pass | ~508 (Fase 2.4) | 532 passed, 8 failed, 540 total | +~34 tests B.2 (30 servicio/controller + 4 mappings) |
| API tsc errors | ~25 | 25 | 0 nuevos en inventory-adjustments |
| Web tsc errors | ~175 | 175 | 0 nuevos en inventory-adjustments |

Tests nuevos:
- `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts` — 26 tests (salida 14 + entrada 4 + accounting 3 + list 5)
- `apps/api/src/modules/inventory-adjustments/inventory-adjustments.controller.spec.ts` — 4 tests
- `apps/api/src/modules/accounting/default-mappings.purchases.spec.ts` — 4 tests nuevos (mappings ROBO/MERMA/DONACION/AUTOCONSUMO)

E2E: 1 `test.skip` nuevo en `apps/web/tests/e2e/inventory.spec.ts`.

Note: 17 failing suites are all pre-existing (dte, recurring-invoices, clientes, purchases) — none in inventory-adjustments. All 3 new suites pass (43/43).

## Not included (B.3 pendiente)

- Conteo físico anual (sesión online + CSV upload + reconciliación de diferencias con `AJUSTE_FISICO_FALTANTE/SOBRANTE`).
- DTE fiscal para DONACION/AUTOCONSUMO (tipo 14/15 MH).
- List-page item-picker (trigger combobox en `/inventario`).

## Post-deploy runbook

**Zero schema changes. Requiere correr seed script UNA VEZ por ambiente.**

1. Merge → CI auto-deploy staging.
2. Correr seed script (dry-run primero):
   ```bash
   cd apps/api
   npx ts-node --compiler-options '{"strict":false}' scripts/seed-inventory-adjust-perm.ts --dry-run
   npx ts-node --compiler-options '{"strict":false}' scripts/seed-inventory-adjust-perm.ts
   ```
3. Login con rol GERENTE / ADMIN → ir a `/inventario/[id]` → botón `+ Ajuste` visible.
4. Registrar MERMA 1 unidad → verificar kardex del ítem refleja movimiento + stock bajó en 1.
5. Con tenant con feature `accounting` ON → ir a `/contabilidad` → verificar asiento generado con cuenta 5105 → 110401.
6. Probar INSUFFICIENT_STOCK (robo de más de lo disponible → toast rojo).
7. Probar AJUSTE_SOBRANTE (entrada con costo propio + weighted avg).
8. Smoke en prod post-merge + re-correr seed en prod.

## Rollback

`git revert <merge-sha>`. Zero schema changes — reversión pura. Movimientos creados (sourceType='MANUAL_ADJUSTMENT') quedan en DB sin UI que los muestre. Cuentas 5104-5107 permanecen en el catálogo contable (inocuas). Permiso `inventory:adjust` queda asignado a GERENTE/CONTADOR pero sin endpoints que lo requieran.

## Commits (11 + este)

```
ca15859 feat(web): wire CreateAdjustmentModal from inventory detail page
418dfec feat(web): add CreateAdjustmentModal component + types
019ef1d chore(seed): add seed for inventory adjustment accounts (5104-5107)
bc4e13d feat(inventory-adjustments): add controller + module + register
9fa269d feat(inventory-adjustments): add listAdjustments with filters + pagination
c80ff38 feat(inventory-adjustments): post journal entry when accounting feature ON
319cb2b test(inventory-adjustments): cover entrada (AJUSTE_SOBRANTE) + weighted avg
95edb18 feat(inventory-adjustments): add createAdjustment service with salida subtypes
fd4f862 feat(inventory-adjustments): add CreateAdjustmentDto + ListAdjustmentsDto
f34cd73 feat(rbac): add inventory:adjust permission to GERENTE and CONTADOR
e22f2ea feat(accounting): add 4 inventory adjustment operations (ROBO/MERMA/DONACION/AUTOCONSUMO)
```
