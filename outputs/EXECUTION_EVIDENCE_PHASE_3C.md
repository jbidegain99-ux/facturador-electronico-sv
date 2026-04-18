# Execution Evidence — Fase 3c: Estado de Costo de Venta Excel Export

**Date:** 2026-04-17
**Branch:** `feature/cogs-statement-report`
**Status:** ✅ COMPLETE
**Spec:** `outputs/2026-04-17-fase-3c-cogs-statement-report-design.md`
**Plan:** `docs/superpowers/plans/2026-04-17-fase-3c-cogs-statement-report.md`

## Built

- **New service:** `CogsStatementReportService` at `apps/api/src/modules/reports/services/`
  - `generateCogsStatementExcel(tenantId, periodStart, periodEnd): Promise<Buffer>` — único método público
  - `loadCogsStatementData(...)` — pure data loader
- **Fórmula retailer:** Inv.Inicial + (Compras Brutas − Devoluciones − Descuentos) − Inv.Final = Costo de lo Vendido
- **Reconciliación automática** contra COGS registrado en `InventoryMovement` (SALIDA_VENTA neto de ENTRADA_DEVOLUCION_VENTA) + ajustes físicos (faltantes/sobrantes)
- **Excel 1 hoja** con styling Facturo: banner púrpura, totales amarillo, Diferencia verde si = 0 o rojo+amarillo si ≠ 0
- **Error handling:** `NotFoundException` (tenant), `BadRequestException` (endDate < startDate)
- **Nota explícita en Excel** sobre Devoluciones sobre compras en $0 (deferred)

## Tests

- `cogs-statement-report.service.spec.ts` — **8/8 pass** (happy path, solo compras, solo ventas, merma, sobrante, devolución venta, vacío, errores)
- Buffer content verificado via `ExcelJS.xlsx.load(buffer)` — aserciones celda por celda en 12+ celdas clave por test
- Full regression: 293 passing (baseline 285 + 8 nuevos), sin regresiones
- TypeScript compila limpio

## Not included (deferred)

- **Fórmula manufacturera** (MP + MOD + CIF) → requiere nuevos movement types
- **SALIDA_DEVOLUCION_COMPRA** (devoluciones a proveedores) → Fase 3c-extendida cuando se agregue el flujo NCE emitida a proveedor
- **Controller HTTP `/api/reports/cogs-statement`** → Fase 2
- **RBAC permissions gate** → Fase 2
- **PDF format** → post-MVP
- **Per-product breakdown** → ya existe en Kardex (Fase 3a)

## Commits

```
be76587 feat(reports): register CogsStatementReportService in module
de2dc58 feat(reports): add CogsStatementReportService with reconciliation
4e2669c test(reports): add CogsStatementReportService spec with 8 cases (TDD red)
88da7ad docs(spec): add Fase 3c Estado de Costo de Venta design
```

## Next

- PR review + merge
- **Fase 3d+3e:** PhysicalCount + F983 Inventario Físico XML (solo si Wellnest llega al umbral 2,753 SMM ≈ USD 1,125,434.40 anuales)
- Después Fase 3: **Fase 2** — Controllers + frontend
