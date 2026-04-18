# Execution Evidence — Fase 2.3 DTEs Recibidos UI

**Date:** 2026-04-18
**Branch:** `feature/received-dtes-ui`
**Spec:** `docs/superpowers/specs/2026-04-18-fase-2-3-received-dtes-ui-design.md`
**Plan:** `docs/superpowers/plans/2026-04-18-fase-2-3-received-dtes-ui.md`

## Built

### Backend
- `ReceivedDtesService` with `findAll`, `findOne`, `createManual`, `retryMhVerify`, `reParse`, `findAllForExport`.
- `ReceivedDtesExportService` (XLSX, 17 columns, 10k cap).
- `ReceivedDtesController` +6 endpoints: `GET /`, `GET /:id`, `POST /`, `POST /:id/retry-mh`, `POST /:id/re-parse`, `GET /export`.
- DTOs: `ImportReceivedDteDto`, `ReceivedDtesFilterDto`.

### Frontend
- `/compras/recibidos` list page with filters + export + actions.
- `/compras/recibidos/[id]` detail page with 4 tabs (Resumen, Items, JSON crudo, Historial MH).
- `ImportDteManualModal` (persist flow, distinct from Fase 2.2 preview modal).
- `ComprasTabsNav` sub-nav between Compras / DTEs recibidos.
- Orchestrator `/compras/nueva` soporta `?receivedDteId=X` con prefill desde `parsedPayload`.
- Types: `ReceivedDteDetail`, `IngestStatus`, `IngestSource`.

## Tests

- **Backend jest (`src/modules/`):** 50 suites passing / 4 failing, 667 tests passing / 19 failing.
  - The 4 failing suites (`clientes.controller.spec`, `dte.service.spec`) are **pre-existing on `main`**, not touched by this branch:
    - `clientes.controller.spec`: drift from commit `235ccf1` (added `isSupplier` filter signature without updating the mock assertion).
    - `dte.service.spec`: drift from commit `60ce202` (service extraction added `DteNormalizationService` dep not registered in `RootTestModule`).
  - `git log main..HEAD -- <those files>` confirms they are untouched by this branch.
- **New unit tests (added by this branch):**
  - `received-dtes.service.spec.ts`
  - `received-dtes-export.service.spec.ts`
  - `received-dtes.controller.spec.ts` (extended)
- **TypeScript:** API `npx tsc --noEmit` → 0 errors. Web `npx tsc --noEmit` (excluding sync-engine) → 0 errors.
- **E2E:** 3 `test.skip` stubs in `apps/web/tests/e2e/received-dtes.spec.ts` (unblock when staging ready).

## Not included (deferred)

- XML import.
- Batch actions.
- Auto-refresh / polling.
- Dashboard widget con fallidos.

## Post-deploy runbook

**No schema changes. No RBAC changes. No new deps.**

1. Deploy a staging (auto via CI).
2. Smoke: login → `/compras/recibidos` → filter mes actual → verifica lista.
3. Export Excel → abre en Excel/LibreOffice, verifica 17 cols.
4. Import manual con JSON de sample DTE → verifica aparece con PENDING.
5. Retry-mh en FAILED → verifica cambia status.
6. Merge → prod deploy → repeat smoke.

## Commits

```
c809e9b feat(web): add ImportDteManualModal + /compras/nueva ?receivedDteId=X prefill
0b3991a feat(web): add /compras/recibidos/[id] detail page with 4 tabs
91d7f81 feat(web): add /compras/recibidos list page + ComprasTabsNav
e5d113f feat(dte): extend ReceivedDtesController with 6 endpoints (list/get/create/retry/reparse/export)
fd3dcc5 feat(dte): add ReceivedDtesExportService (XLSX, 17 columns)
c336612 feat(dte): add retryMhVerify + reParse to ReceivedDtesService
ea0a999 feat(dte): add ReceivedDtesService with findAll/findOne/createManual
```

16 files changed, +2166 / −8.

## Rollback

`git revert <merge-sha>` → CI redeploys. Zero DB changes, zero RBAC changes — rollback es reversión pura de código.
