# Execution Evidence — Fase 1.4b: Purchase Mapper + Asiento

**Date:** 2026-04-17
**Branch:** `feature/purchase-mapper`
**Status:** ✅ COMPLETE
**Spec:** `outputs/2026-04-17-fase-1-4b-purchase-mapper-design.md`
**Plan:** `docs/superpowers/plans/2026-04-17-fase-1-4b-purchase-mapper.md`

## Built

### New module
- `PurchasesModule` at `apps/api/src/modules/purchases/`
- `PurchasesService.createFromReceivedDte(tenantId, receivedDteId, options): Promise<PurchaseWithRelations>`
  - Loads ReceivedDTE, validates status + tipoDte (01/03/14 only)
  - Idempotency via `Purchase.receivedDteId @unique`
  - Supplier upsert (flip `isSupplier=true` or create new) — preserves user data
  - Line mapping: catalog match by `code`, unitCostPosted=precioUni, taxCode per bucket
  - Asiento non-blocking via `AccountingAutomationService.generateFromPurchase()`
- Registered in AppModule

### Accounting extension
- New method `AccountingAutomationService.generateFromPurchase(purchaseId, tenantId, trigger)`
- Mirrors `generateFromDTE()` pattern: operation map (CCFE→COMPRA_CCFE, FCFE→COMPRA_FCFE, FSEE→COMPRA_FSEE), mapping rule lookup, balance check, create + post + link back

### Adjustments vs plan
- `ParsedLineItem` not exported from parser module — defined locally in service
- `tenantId` required on `PurchaseLineItem` (denormalized schema field) — added at call site
- `mock-prisma.ts` extended with `purchase` entry for TS type resolution

## Tests

- `purchases.service.spec.ts` — **16/16 pass** (15 named cases + 1 not-found sanity)
- `accounting-automation.service.spec.ts` — **+4 new tests pass** for generateFromPurchase
- Full regression: **212/212 pass** (baseline 192 + 4 accounting + 16 purchases)

## Not included (deferred)

- Reception workflow (Purchase DRAFT → RECEIVED) → Fase 1.5
- Kardex / InventoryMovement → Fase 1.5 (on receipt)
- Retención IVA asiento leg (requires extending `monto` enum with `'retention'`) → Fase 1.5
- NC/ND (05/06) adjustment workflow → Fase 1.4d or post-MVP
- Controller HTTP / frontend → Fase 2

## Commits

```
8a079a6 feat(purchases): register PurchasesModule in AppModule
49a7dca feat(purchases): add PurchasesService.createFromReceivedDte mapper
7f5c07b test(purchases): add PurchasesService.createFromReceivedDte spec (TDD red)
951811a feat(accounting): add generateFromPurchase() mirroring generateFromDTE() pattern
44de92e test(accounting): add generateFromPurchase() spec (TDD red)
c07826b docs(spec): add Fase 1.4b purchase mapper + asiento design
```

## Next

- PR review + merge
- Fase 1.4c: background retry job for `VERIFY_*_RETRY` DTEs
- Fase 1.5: reception workflow + Kardex + retention asiento leg
