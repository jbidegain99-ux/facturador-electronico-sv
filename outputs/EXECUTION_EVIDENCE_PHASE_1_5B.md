# Execution Evidence — Fase 1.5b: Retention Asiento Leg Extension

**Date:** 2026-04-17  
**Branch:** `feature/retention-asiento`  
**Status:** ✅ COMPLETE  
**Spec:** `outputs/2026-04-17-fase-1-5b-retention-asiento-design.md`  
**Plan:** `docs/superpowers/plans/2026-04-17-fase-1-5b-retention-asiento.md`

## Built

- **Enum extension:** `DefaultMappingLine.monto` accepts `'retention'` and `'totalMinusRetention'` (5 valid values total)
- **DteAmounts field:** `retention: number` added (default 0 in `generateFromDTE`, populated from `purchase.retentionAmount` in `generateFromPurchase`)
- **`resolveAmount()` switch:** 2 new cases (`retention` → amounts.retention, `totalMinusRetention` → totalPagar - retention)
- **`buildMultiLines()` filter:** drops lines where both debit=0 AND credit=0 (retention leg filtered when retention=0)
- **3 mapping rules updated:** COMPRA_CCFE/FCFE/FSEE haber splits Proveedores `totalMinusRetention` + IVA Retenido `retention`
- **Warning removed:** `generateFromPurchase` no longer logs "retention not reflected in asiento" (Fase 1.4b stale warning)

## Tests

- `accounting-automation.service.spec.ts` — **+6 new tests pass** (resolveAmount extensions, buildMultiLines filter, generateFromPurchase with retention=5)
- `default-mappings.purchases.spec.ts` — unchanged (existing assertions only checked debe shape, not haber)
- Full regression: **242/242 pass** (baseline 236 + 6 new)
- TypeScript compiles clean (pre-existing errors in seed-demo.ts filtered)

## Post-merge deploy note

Existing tenants' `AccountMappingRule` rows in DB still use old config (haber with `monto: 'total'`). To apply the new retention leg to live data:

1. Re-run seed for existing tenants via `AccountingService.seedAccountMappings(tenantId)` per tenant, OR
2. Manual SQL UPDATE on `account_mapping_rules.mappingConfig` for the 3 COMPRA_* operations

Wellnest (staging tenant) hasn't used retention scenarios yet — urgency low. Production rollout plan: re-seed during next deploy.

## Not included (deferred)

- Backfill script for existing Purchases with retentionAmount>0 and already-posted asiento → post-MVP
- Percepción IVA 1% (`210204 IVA Percibido`) → post-MVP
- Retención de Renta (no IVA, `210202`) → post-MVP
- UI for manual asiento regeneration → Fase 2
- Retention in outgoing DTEs → post-MVP

## Commits

```
a3a52f6 feat(accounting): split Proveedores/IVA Retenido in COMPRA_* mapping rules
9ccf401 feat(accounting): extend DteAmounts with retention + zero-amount filter
0f59862 test(accounting): add retention asiento leg tests (TDD red)
bbff1a4 docs(spec): add Fase 1.5b retention asiento leg design
```

## Next

- PR review + merge → closes Fase 1.5 completely (1.5a + 1.5b)
- Next phase (TBD): could be Fase 1.6 (COGS on sale via Kardex integration with Ventas module) or Fase 2 (controllers + frontend)
