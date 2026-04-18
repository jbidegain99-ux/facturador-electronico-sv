# Execution Evidence — Fase 3b: F07 Declaración IVA Excel Export

**Date:** 2026-04-17
**Branch:** `feature/iva-declaracion-report`
**Status:** ✅ COMPLETE
**Spec:** `outputs/2026-04-17-fase-3b-iva-declaracion-report-design.md`
**Plan:** `docs/superpowers/plans/2026-04-17-fase-3b-iva-declaracion-report.md`

## Built

- **New service:** `IvaDeclaracionReportService` at `apps/api/src/modules/reports/services/`
  - `generateIvaDeclaracionExcel(tenantId, periodStart, periodEnd): Promise<Buffer>` — único método público
  - `loadIvaDeclaracionData(...)` — pure data loader
- **Scope ventas emitidas:** tipos 01 FCF + 03 CCFE + 05 NCE + 06 NDE + 11 FEXE
- **Regla "Neto estricto":** suma aceptados con `fechaRecepcion` en período + resta anulaciones con `fechaAnulacion` en período (incluso de DTEs emitidos en periodos previos)
- **Excel 2 hojas:**
  - Hoja 1 "Resumen F07" — 6 casillas internas (Ventas Gravadas, Débito Fiscal 13%, Exportaciones, NC, ND, Anulaciones) + 3 totales
  - Hoja 2 "Detalle DTE" — 13 columnas por DTE (aceptado o anulado en período) ordenado por fecha ASC
- **Styling consistente con Kardex** — banner púrpura Facturo, alternating rows, totales amarillo, negativos en rojo
- **Error handling:** `NotFoundException` (tenant inexistente), `BadRequestException` (endDate < startDate), empty period → Excel válido con totales 0

## Tests

- `iva-declaracion-report.service.spec.ts` — **8/8 pass** (happy path, solo FCF, anulación cross-period, anulación post-período, período vacío, 404, 400, scope filter)
- Buffer content verificado via `ExcelJS.xlsx.load(buffer)` — aserciones a nivel celda en ambas hojas
- Full regression: 285 passing (baseline 277 + 8 nuevos), sin regresiones
- TypeScript compila limpio

## Not included (deferred)

- **Compras recibidas** (CCFE recibido, FSEE recibido, anticipos 161/162/163) → Fase 3b-extendida
- **07 CRE emitido** (retenciones practicadas por agente retenedor) → Fase 3b-extendida
- **Mapeo oficial casillas F07** (requiere Manual Anexos F07 v14 — bloqueante documentado en `VALIDATION_RESEARCH.md` §B.3)
- **Anulación de NC/ND** — MVP los trata como disminución simple (edge case <1% frecuencia); corrección precisa → Fase 3b-extendida
- **Controller HTTP `/api/reports/iva`** → Fase 2
- **RBAC permissions gate** → Fase 2
- **PDF / CSV alternativos** → post-MVP
- **Azure Blob Storage upload + retención** → post-MVP

## Commits

```
cc5b963 feat(reports): register IvaDeclaracionReportService in module
e149553 feat(reports): add IvaDeclaracionReportService with 2-sheet F07 export
8c4743c test(reports): add IvaDeclaracionReportService spec with 8 cases (TDD red)
eee9905 docs(spec): add Fase 3b F07 Declaración IVA Excel export design
```

## Next

- PR review + merge
- **Fase 3c:** Estado de Costo de Venta (quarterly/annual report)
- **Fase 3d+3e:** PhysicalCount + F983 XML (solo si Wellnest llega a 2,753 SMM threshold)
- Después Fase 3: **Fase 2** — Controllers + frontend
