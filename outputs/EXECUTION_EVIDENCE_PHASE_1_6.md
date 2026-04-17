# Execution Evidence — Fase 1.6: COGS on Sale

**Date:** 2026-04-17
**Branch:** `feature/cogs-on-sale`
**Status:** ✅ COMPLETE
**Spec:** `outputs/2026-04-17-fase-1-6-cogs-on-sale-design.md`
**Plan:** `docs/superpowers/plans/2026-04-17-fase-1-6-cogs-on-sale.md`

## Built

- **New service:** `DteCogsService` at `apps/api/src/modules/dte/services/`
  - `generateCogsFromDte(dteId, tenantId, trigger)` — creates SALIDA_VENTA movements + decrements InventoryState (avgCost unchanged, moving avg) + generates 2-line COGS asiento (Debit 5101 / Credit 110401)
  - `reverseCogsFromDte(dteId, tenantId)` — creates ENTRADA_DEVOLUCION_VENTA compensating + voids COGS asiento + restores stock
- **Hybrid matcher** — quote walk-back first (via `Quote.convertedToInvoiceId`), codigo fallback, skip+warn for unmatched
- **Idempotent** via `sourceType='DTE', sourceId=dteId` dedupe
- **Negative stock tolerant** + warning in result
- **Non-blocking hooks** in `DteLifecycleService.triggerCogsEntry/Reversal` — fire-and-forget `.catch()` pattern mirroring existing `triggerAccountingEntry`
  - 4 call sites for `triggerCogsEntry` (approval/transmission paths)
  - 1 call site for `triggerCogsReversal` (anulación path)
- **@Optional() injection** — avoids circular deps, same pattern as `accountingAutomation?`

## Adjustment vs plan

- Plan assumed `Quote.dteId` field but schema actually has `Quote.convertedToInvoiceId String?`. Matcher updated accordingly. Tests pass unchanged (mocks don't validate column names).

## Tests

- `dte-cogs.service.spec.ts` — **10/10 pass** (3 matcher + 5 generate + 2 reverse)
- Full regression: **252/252 pass** (baseline 242 + 10 new)
- TypeScript compiles clean (pre-existing `isCustomer` filtered)

## Not included (deferred)

- Schema change: normalize `DTELineItem` with FK CatalogItem → post-MVP
- UI alerts for negative stock → Fase 2
- Manual stock adjustment flow → Fase 2
- COGS granular per line in JournalEntry → post-MVP
- Historical backfill for DTEs emitted pre-merge → post-MVP
- Preservation improvements in Quote→DTE catalogItemId chain → post-MVP

## Commits

```
0c05114 feat(dte): register DteCogsService in module
593e28b feat(dte): hook DteCogsService into DteLifecycleService non-blocking
e80184d feat(dte): add DteCogsService with generate + reverse + hybrid matcher
d10332b test(dte): add DteCogsService spec with 10 cases (TDD red)
74b98f4 docs(spec): add Fase 1.6 COGS on sale design
```

## Next

- PR review + merge → cierra ciclo completo compra → stock → venta → COGS
- Siguiente fase (priorizada por user): **Fase 3 — Reportes fiscales** (Kardex Art. 142-A, F07, F983, Estado Costo Venta)
