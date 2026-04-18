# Execution Evidence — Fase 2: Reports HTTP API + Frontend

**Date:** 2026-04-17
**Branch:** `feature/reports-api-frontend`
**Status:** ✅ COMPLETE
**Spec:** `outputs/2026-04-17-fase-2-reports-api-frontend-design.md`
**Plan:** `docs/superpowers/plans/2026-04-17-fase-2-reports-api-frontend.md`

## Built

### Backend
- **4 nuevos endpoints** en `ReportsController`:
  - `GET /reports/kardex/item/:catalogItemId` — Kardex Art. 142-A single-item
  - `GET /reports/kardex/book` — Kardex multi-item book
  - `GET /reports/iva-declaracion` — F07 Declaración IVA
  - `GET /reports/cogs-statement` — Estado Costo Venta
- **Todos con `@RequirePermission('report:export')` + `@RequireFeature('advanced_reports')`**
- **Stream xlsx** via helper `streamXlsx` con Content-Type + Content-Disposition + Content-Length correctos
- **Filename builders** por reporte (kardex-{code}-{YYYYMMDD}, kardex-libro-{YYYYMM}, iva-f07-{YYYYMM}, estado-costo-venta-{YYYY})
- **Lookup de catalogItem** en controller para validar tenant match + obtener code para filename (NotFoundException 404 si no match)
- **Swagger docs** completos (`@ApiOperation`, `@ApiQuery`, `@ApiParam`)

### Frontend
- **Helper `apps/web/src/lib/download-report.ts`** con `DownloadReportError` class para structured error handling
- **Nuevo tab "Fiscales"** en `/reportes` con 3 cards:
  - Kardex — single/book + date range
  - Declaración IVA F07 — presets mes-actual/anterior/personalizado
  - Estado Costo Venta — presets año-actual/anterior/trimestre-actual/personalizado
- **Cookie-based auth** (`credentials: 'include'`) consistente con el resto del dashboard
- **Error handling UI**: toasts diferenciados por 402 (plan), 403 (permiso), 404 (no encontrado), 400 (rango), 500 (genérico)
- **Adaptation:** usa `addToast` del hook existente (no `toast`) matching el API del proyecto

## Tests

- `reports.controller.spec.ts` (nuevo archivo, 234 lines) — **8/8 pass**:
  1. Kardex item happy path + filename regex
  2. Kardex item catalogItemId no existe → 404
  3. Kardex item tenant mismatch → 404
  4. Kardex item endDate<startDate → 400 (short-circuit, service not called)
  5. Kardex item sin tenant → 403
  6. Kardex book happy path
  7. IVA declaración happy path
  8. COGS statement happy path
- Full regression: 293 baseline + 8 nuevos = **301 passing**, sin regresiones
- TypeScript compila limpio (API y Web)

## Not included (deferred)

- **Tests unitarios frontend** — consistente con resto de `reportes/page.tsx` (no test suite pre-existente)
- **Background generation / async jobs** — reportes síncronos <3s para Wellnest-scale
- **Azure Blob Storage retention** — post-MVP para historial de reportes
- **Email delivery** — post-MVP
- **PDF export alternativo** — post-MVP
- **Compras recibidas en F07** (Fase 3b-extendida) — requiere Manual Anexos F07 v14
- **PhysicalCount + F983 XML** (Fase 3d/3e) — solo para tenants ≥2,753 SMM

## Commits

```
9898a77 feat(web): add Fiscales tab with 3 report download cards
be1d125 feat(web): add downloadReport helper for xlsx exports
f2013e6 feat(reports): add 4 fiscal endpoints (kardex, iva, cogs-statement)
0d6b5e2 test(reports): add controller spec for fiscal endpoints (TDD red)
7cee03c docs(spec): add Fase 2 Reports HTTP API + Frontend design
```

**Total commits on branch:** 5
**Test status:** 301 passing (293 baseline + 8 nuevos)
**Regressions:** 0

## Next

- PR review + merge
- Manual QA en staging con tenant PROFESSIONAL
- Posibles siguientes fases:
  - Fase 3b-extendida: compras recibidas + casillas 66/161/162/163 en F07
  - Fase 3d+3e: PhysicalCount + F983 XML (solo si cliente llega al umbral)
  - Inventory/purchases management UI (más amplio)
