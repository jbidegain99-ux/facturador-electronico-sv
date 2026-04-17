# Execution Evidence — Fase 1.5a: Purchase Reception Workflow + Kardex

**Date:** 2026-04-17
**Branch:** `feature/reception-workflow`
**Status:** ✅ COMPLETE
**Spec:** `outputs/2026-04-17-fase-1-5a-reception-workflow-design.md`
**Plan:** `docs/superpowers/plans/2026-04-17-fase-1-5a-reception-workflow.md`

## Built

- **New service:** `PurchaseReceptionService` at `apps/api/src/modules/purchases/services/`
  - Public `receive(tenantId, purchaseId, { receivedBy, receiptDate? }): Promise<PurchaseWithReception>`
  - Idempotent if `status='RECEIVED'`, throws PreconditionFailed for other non-DRAFT states
  - Atomic `prisma.$transaction` wrapping all side-effects
- **Pure function:** `computeWeightedAverage(currentQty, currentAvgCost, incomingQty, incomingUnitCost)` exported
- **Kardex generation:** per-line `InventoryMovement` (movementType=ENTRADA_COMPRA) with per-`(tenantId, catalogItemId)` correlativo. Lines without catalog match OR with `trackInventory=false` skipped silently.
- **State update:** upsert `InventoryState` con promedio ponderado móvil + `totalValue = qty * avgCost`
- **Backlink:** `InventoryMovement.journalEntryId = Purchase.journalEntryId` (asiento generado en Fase 1.4b)

## Tests

- `purchase-reception.service.spec.ts` — **11/11 pass** (4 pure function + 6 service + 1 not-found)
- Full regression: **236/236 pass** (baseline 225 + 11 new)
- TypeScript compiles clean (pre-existing `isCustomer` filtered)

## Not included (deferred)

- Partial reception (receive N de M unidades por línea) → Fase 1.5c
- Return / Cancel / Reverse reception → Fase 1.5d o post-MVP
- Retention IVA asiento leg extension → Fase 1.5b (paralelizable con esto)
- Concurrent-safe correlativo retry on P2002 unique violation → post-MVP
- `supplierNationality` detection (hoy hardcoded 'SV') → Fase 2 UI
- Controller HTTP / frontend "Recibir" button → Fase 2
- Asiento COGS on Sale (usa InventoryState.currentAvgCost) → Fase 1.6 o post-MVP

## Commits

```
520c51f feat(purchases): register PurchaseReceptionService in module
fa722eb feat(purchases): add PurchaseReceptionService with Kardex + weighted avg
df95d84 test(purchases): add PurchaseReceptionService spec with 11 cases (TDD red)
8a96254 docs(spec): add Fase 1.5a reception workflow + Kardex design
```

## Next

- PR review + merge
- Fase 1.5b: retention IVA asiento leg extension (extend `monto` enum, update mapping rules)
