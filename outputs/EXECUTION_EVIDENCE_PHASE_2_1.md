# Execution Evidence — Fase 2.1: Plan Feature Gating Realignment

**Date:** 2026-04-17
**Branch:** `feature/plan-feature-audit`
**Status:** ✅ COMPLETE
**Audit:** `outputs/2026-04-17-fase-2-1-plan-feature-audit-design.md`
**Plan:** `docs/superpowers/plans/2026-04-17-fase-2-1-plan-feature-realignment.md`

## Built

### Matriz realineada

| Feature | FREE | STARTER | PROFESSIONAL | ENTERPRISE |
|---|:-:|:-:|:-:|:-:|
| **accounting** | ❌ | ❌ (era ✅) | ❌ (era ✅) | ✅ |
| **advanced_reports** | ❌ | ❌ | ❌ (era ✅) | ✅ |
| **inventory_reports** (nuevo) | ❌ | ❌ | ✅ | ✅ |

### Cambios concretos

- **`apps/api/src/common/plan-features.ts`**:
  - Extend `FeatureCode` union con `'inventory_reports'`
  - `ALL_FEATURE_CODES` incluye `'inventory_reports'`
  - STARTER.accounting: `true` → `false`
  - PROFESSIONAL.accounting: `true` → `false`, advanced_reports: `true` → `false`, agregado inventory_reports: `true`
  - ENTERPRISE.inventory_reports: `true`
  - FREE.inventory_reports: `false`

- **`apps/api/src/modules/reports/reports.controller.ts`**:
  - `getKardexItem`: `@RequireFeature('advanced_reports')` → `@RequireFeature('inventory_reports')`
  - `getKardexBook`: `@RequireFeature('advanced_reports')` → `@RequireFeature('inventory_reports')`
  - `getIvaDeclaracion`: sin cambio (sigue `advanced_reports`, ahora Enterprise-only)
  - `getCogsStatement`: sin cambio (sigue `advanced_reports`, ahora Enterprise-only)

- **`apps/web/src/hooks/use-plan-features.ts`**: agregar `'inventory_reports'` al `FeatureCode` union.

- **Tests**: 4 specs actualizados; agregados 4 tests para `inventory_reports`.

## Tests

- Full regression: baseline + 4 new = **413 passing**, sin regresiones.
- 4 tests nuevos verifican matriz `inventory_reports` (FREE/STARTER/PRO/ENTERPRISE).
- Tests existentes actualizados para reflejar nueva matriz (`accounting` y `advanced_reports` flags).
- TypeScript compila limpio (API y Web).

## Not included (deferred)

- **Landing page pricing display** (`apps/web/src/app/page.tsx`) — PR separada para comunicar visualmente el cambio.
- **Super-admin `/admin/planes` UI** — si hay hardcoded labels de features, PR separada.
- **Tenant `/configuracion/plan` UI** — si muestra feature list, PR separada.
- **DB seed re-run** — `apps/api/scripts/seed-phase1-plans.ts` lee de `PLAN_CONFIGS`. Debe correrse post-deploy en cada environment (dev/staging/prod) para sincronizar FREE `PlanFeature` rows. Para STARTER/PRO/ENTERPRISE el guard hace fallback a `PLAN_CONFIGS` automáticamente — no requiere seed inmediato, pero es recomendable.

## Post-deploy runbook

1. Deploy este PR a staging.
2. Correr: `cd apps/api && npx ts-node --compiler-options '{"strict":false}' scripts/seed-phase1-plans.ts` contra staging DB para sincronizar `PlanFeature` FREE rows con `inventory_reports: false`.
3. Manual QA en staging con tenants de cada plan (FREE/STARTER/PRO/ENTERPRISE):
   - Pro: debe acceder a Kardex, NO debe acceder a IVA/COGS/contabilidad (402).
   - Enterprise: debe acceder a todo.
4. Si todo OK, merge a main + deploy a prod.
5. Correr seed script contra prod DB.
6. Monitor logs por 24h para detectar 402/403 inesperados.

## Commits

44dc629 test(plans): update feature matrix assertions + add inventory_reports tests
28e7e1e feat(reports): gate Kardex endpoints with inventory_reports feature
ad438ad feat(plans): realign feature matrix - accounting & advanced_reports to Enterprise only
d442150 docs(audit): add Fase 2.1 plan feature gating audit report

## Rollback

Si algo sale mal:
- `git revert <SHA>` y redeploy.
- DB rows no requieren rollback (la nueva `inventory_reports` row queda benigna; los valores no afectan comportamiento si `PLAN_CONFIGS` vuelve a estado anterior).
