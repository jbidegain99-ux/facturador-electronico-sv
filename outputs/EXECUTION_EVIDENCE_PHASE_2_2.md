# Execution Evidence — Fase 2.2: Compras UI Full-Stack (A1)

**Date:** 2026-04-17
**Branch:** `feature/compras-ui-fullstack`
**Spec:** `docs/superpowers/specs/2026-04-18-fase-2-2-compras-ui-fullstack-design.md`
**Plan:** `docs/superpowers/plans/2026-04-18-fase-2-2-compras-ui-fullstack.md`

## Built

### Backend
- Schema: 3 fields en Cliente (esGranContribuyente, retieneISR, cuentaCxPDefaultId).
- DTOs: CreatePurchaseDto, UpdatePurchaseDto, PostPurchaseDto, PayPurchaseDto, AnularPurchaseDto, ReceivePurchaseDto, PurchaseLineDto, PreviewDteDto.
- PurchasesService: createManual, findAll, findOne, update, softDelete, postDraft, pay, anular, receiveLate.
- PurchasesController: 8 endpoints.
- ReceivedDtesController: POST /preview.
- RBAC: 8 permisos nuevos + asignación a 5 roles.

### Frontend
- 5 páginas: /compras, /compras/nueva, /compras/[id], /proveedores, /proveedores/[id].
- 11 componentes nuevos en src/components/purchases/.
- Sidebar: 2 entradas nuevas.

## Tests

- Backend: 624 passing, 21 failed (5 failed suites). Zero regressions vs baseline.
- Frontend TSC: 0 errors.
- API TSC: 0 errors.
- E2E Playwright: 3 flujos (happy manual, import DTE, anular con constraint) marked `test.skip()` pending staging env.

## Not included (deferred to follow-up)

- A2 activos fijos, A3 importaciones DUCA.
- Pagos parciales.
- Upload adjuntos.
- Feature gating (compras es core).

## Post-deploy runbook

1. Deploy a staging.
2. `prisma db push` contra staging DB (agrega 3 cols).
3. QA manual checklist (spec §8.4).
4. Merge a main → CI deploys prod.
5. `prisma db push` contra prod DB.
6. Monitor logs 24h para 402/403 inesperados en purchases:* endpoints.

## Commits

```
9188111 feat(web): add /compras/[id] detail with tabs + PagoModal + RecepcionModal
dced580 feat(web): add /compras/nueva orchestrator + ImportDteModal
fa4be98 feat(web): add purchase form components (header/lines/summary + modals)
80061a8 feat(web): add /compras list page with filters and responsive layout
fd6fe87 feat(web): add Proveedores pages + ProveedorSearch + NuevoProveedorModal
5d82692 feat(rbac): add 8 purchases permissions with role assignments
ed84966 feat(dte): add ReceivedDtesController with preview endpoint
884c4f6 feat(purchases): add PurchasesController with 8 endpoints
17dadf1 feat(purchases): add state transitions (post/pay/anular/receiveLate)
55317d1 feat(purchases): add createManual + findAll/findOne + update/softDelete
7381515 feat(schema): extend Purchase + PurchaseLineItem for full-stack design
235ccf1 feat(purchases): add DTOs + extend ClientesController with isSupplier filter
1a46b63 feat(schema): add gran contribuyente + ISR flags + CxP default account to Cliente
```

## Rollback

`git revert <merge-sha>` → redeploya. Columnas DB quedan (additive, no impacto). Permisos quedan sin efecto si no se usan.
