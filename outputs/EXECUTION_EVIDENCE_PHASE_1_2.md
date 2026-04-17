# Execution Evidence — Fase 1.2: Schema Migration (Compras + Inventario MVP)

**Date:** 2026-04-17
**Branch:** `feature/purchases-inventory-schema`
**Status:** ✅ COMPLETE — ready for review & push
**Depends on:** `outputs/PHASE_1_1_SCHEMA_PLAN.md` (approved)
**Plan:** `docs/superpowers/plans/2026-04-17-fase-1-2-schema-migration.md`

---

## Schema changes

**Modified existing models (minimal surface):**
- `CatalogItem.trackInventory: Boolean @default(false)` — per-item inventory opt-in
- `Cliente.isCustomer: Boolean @default(true)` + `Cliente.isSupplier: Boolean @default(false)` — role flags + 2 new indices

**Added 7 new models (all under new INVENTORY MODULE section at end of `schema.prisma`):**
- `InventoryState` — per-item current qty + weighted-average cost snapshot
- `InventoryMovement` — Kardex Art. 142-A movements (with correlativo per item)
- `ReceivedDTE` — DTEs ingested from suppliers (JSON/OCR/manual)
- `Purchase` — purchase document (may link to ReceivedDTE or be fully manual)
- `PurchaseLineItem` — lines of a purchase (cascade delete on parent)
- `PhysicalCount` — annual physical count (F983 inventario físico)
- `PhysicalCountDetail` — per-item counted vs system qty

**Unplanned fix (bundled in Task 11 commit):**
- `DteOperationLog.tenantId` and `DteErrorLog.tenantId`: `NVarChar(50)` → `NVarChar(1000)` to match `Tenant.id` FK default. Pre-existing bug that blocked `db push`. Tables were empty (never pushed to staging). Low-risk widening.

## Seed changes

**Chart of accounts (`apps/api/src/modules/accounting/chart-of-accounts.data.ts`):**
- 3 new accounts added:
  - `110306` IVA Anticipo a Cuenta 2% (ASSET, DEBIT, under 1103)
  - `4105` Sobrantes de Inventario (INCOME, CREDIT, level 3 under 41)
  - `5103` Costo por Ajustes Físicos (EXPENSE, DEBIT, level 3 under 51)
- 5 existing accounts confirmed as reusable (see `outputs/chart-audit-2026-04-17.md`):
  - `110401` Mercadería, `110303` IVA Crédito Fiscal, `210101` Proveedores, `210205` IVA Retenido, `5101` Costo de Mercadería Vendida

**Default mappings (`default-mappings.data.ts`): 7 new operations:**
- `COMPRA_CCFE` — débito Inventario subtotal + IVA Crédito Fiscal / crédito Proveedores
- `COMPRA_FCFE` — débito Inventario total (IVA capitalizado) / crédito Proveedores
- `COMPRA_FSEE` — débito Inventario total / crédito Proveedores (sin IVA)
- `SALIDA_VENTA_COGS` — débito Costo Mercadería / crédito Inventario
- `AJUSTE_FISICO_FALTANTE` — débito Costo Ajustes / crédito Inventario
- `AJUSTE_FISICO_SOBRANTE` — débito Inventario / crédito Sobrantes
- `DEVOLUCION_COMPRA` — débito Proveedores / crédito Inventario

**Deferred (not in this phase, noted as open decision O5):**
- `COMPRA_CON_RETENCION` — requires extending `DefaultMappingLine.monto` enum with `'retention'` value. Target: Fase 1.6 (auto-entries service).

## DB state (Azure SQL staging)

- `prisma db push` executed successfully on staging (Task 11).
- `smoke-inventory-schema.ts` — all 7 new tables exist (counts = 0 initially) ✅
- `smoke-purchase-roundtrip.ts` — created Purchase + 1 line item, read back via `Cliente.purchases` relation, cleaned up ✅
- Temporary firewall rules added/removed cleanly (no leftover open rules).

## Dependencies

- Added: `exceljs@^4.4.0` to `apps/api/package.json` (for future Kardex + F983 Excel generation).
- `verify-exceljs.ts` smoke passes ✅

## Tests

- `chart-of-accounts.purchases.spec.ts` — **8/8 pass**
- `default-mappings.purchases.spec.ts` — **9/9 pass**
- Broader accounting suite: **67/67 pass** (no regressions)

## Files changed

**New files (committed):**
- `apps/api/prisma/schema.prisma.backup-20260417` (backup)
- `apps/api/scripts/verify-schema-types.ts`
- `apps/api/scripts/smoke-inventory-schema.ts`
- `apps/api/scripts/smoke-purchase-roundtrip.ts`
- `apps/api/scripts/verify-exceljs.ts`
- `apps/api/src/modules/accounting/chart-of-accounts.purchases.spec.ts`
- `apps/api/src/modules/accounting/default-mappings.purchases.spec.ts`
- `outputs/chart-audit-2026-04-17.md`
- `outputs/EXECUTION_EVIDENCE_PHASE_1_2.md` (this file)

**Modified files (committed):**
- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/accounting/chart-of-accounts.data.ts`
- `apps/api/src/modules/accounting/default-mappings.data.ts`
- `apps/api/package.json`, `apps/api/package-lock.json`

## Commits

```
44cad00 chore(deps): add exceljs for Kardex + F983 Excel generation
c905233 feat(accounting): add purchases + inventory mapping rules
a7b8c29 feat(accounting): add purchases & inventory accounts to El Salvador chart
962ef14 test(schema): add round-trip smoke test for Purchase + relations
f32cf10 chore(schema): add smoke test for new inventory tables in staging
9d55bc1 chore(schema): add type verification script for new inventory models
087d275 feat(schema): add PhysicalCount + PhysicalCountDetail models for F983
5e929dd feat(schema): add Purchase + PurchaseLineItem models
cb0c7d6 feat(schema): add ReceivedDTE model (inverse relation to Purchase pending)
f9c53cd feat(schema): add InventoryMovement model for Kardex Art.142-A
5b5600e feat(schema): add InventoryState model
35e2db3 feat(schema): add isCustomer/isSupplier flags to Cliente
3e01ee1 feat(schema): add trackInventory flag to CatalogItem
18ddc6b docs(schema): audit chart of accounts before adding purchases accounts
93ec442 chore(schema): backup schema before purchases+inventory migration
```

## Out of scope (intentional)

- **Plan gating migration** (removing `accounting` and `advanced_reports` from STARTER/PRO plans): sub-project with its own plan. Pre-production blocker per spec §6.3.
- **Service / controller / parser / frontend layers**: each gets its own spec + plan + execution cycle (Fases 1.3-1.6, 2, 3, 4).

## Next

- **José action:** review evidence, push branch (`git push -u origin feature/purchases-inventory-schema`), open PR when ready.
- **Next plan:** Fase 1.3 (DTE parser) — JSON ingest of received CCFE/FCFE/FSEE from suppliers.
- **Open decisions tracked in spec §8:** O1 grandfathering, O2 Manual Anexos F07 v14, O3 OCR engine, O4 sobrantes account, O5 retention enum extension, O6 fiscal period lock.
