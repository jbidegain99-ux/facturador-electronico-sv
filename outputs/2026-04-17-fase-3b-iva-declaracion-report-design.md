# Fase 3b — F07 Declaración IVA Excel Export

**Date:** 2026-04-17
**Phase:** 3b (segunda sub-fase de Fase 3 — Reportes fiscales)
**Status:** Design approved — ready for plan
**Depende de:** Fases 1.2–1.6 + 3a merged en `main` ✅
**Branch:** `feature/iva-declaracion-report`

---

## 1. Objetivo

Generar un Excel mensual de soporte para la **Declaración IVA Formulario F07** del lado de **ventas emitidas**. El contador lee el resumen y transcribe los montos al portal MH "Servicios en Línea DGII". Scope acotado a DTEs emitidos (tipos 01, 03, 05, 06, 11); compras recibidas y retenciones practicadas quedan fuera de este PR.

### Scope IN

- Tipos DTE emitidos cubiertos: **01 FCF**, **03 CCFE**, **05 NCE**, **06 NDE**, **11 FEXE**.
- Regla de fecha: **Neto estricto** — suma DTEs aceptados en el período + resta anulaciones cuya `fechaAnulacion` cae en el período (incluyendo DTEs emitidos en periodos previos).
- Output: archivo `.xlsx` con **2 hojas** — Resumen F07 + Detalle DTE.
- Estilo visual consistente con Kardex (header púrpura `FF7C3AED`, totales amarillo).

### Scope OUT (deferred)

- **14 FSEE emitido** (es una compra, no venta — irá en reporte de compras).
- **07 CRE emitido** (retenciones practicadas, casillas 169/170/171) — para "Gran Contribuyente"; agregar en Fase 3b-extendida.
- **15 CDE** (donaciones) — casilla especial rara en PYME.
- **Casillas oficiales F07** (mapeo 1:1 contra portal MH) — requiere Manual de Anexos F07 v14, pendiente por descargar (documentado en `VALIDATION_RESEARCH.md` §B.3). Nuestro reporte usa numeración interna 1–6 + leyenda *"Consultar Manual Anexos F07 v14 para casillas oficiales"*.
- **Compras recibidas (casillas 66, 161, 162, 163)** → Fase 3b-extendida.
- **Controller HTTP `/api/reports/iva`** → Fase 2 (frontend).
- **RBAC permissions gate** → Fase 2 cuando se cree el controller.
- **PDF / CSV alternativos** → post-MVP.

---

## 2. Arquitectura

Nuevo service en `apps/api/src/modules/reports/services/iva-declaracion-report.service.ts`. Mismo patrón que `KardexReportService`:

- Un método público principal: `generateIvaDeclaracionExcel(tenantId, periodStart, periodEnd): Promise<Buffer>`.
- Un método "loader" público puro: `loadIvaDeclaracionData(tenantId, periodStart, periodEnd): Promise<IvaDeclaracionData>` — devuelve estructura tipada (meta + rows + totals) separada del building Excel.
- Helpers privados para construir cada hoja.
- Registrado como provider + export en `reports.module.ts`.
- Zero schema changes, zero new deps.

### Interfaces públicas

```typescript
export interface IvaDeclaracionMeta {
  tenant: { nombre: string; nit: string; nrc: string };
  periodo: { startDate: Date; endDate: Date };
}

export interface IvaDeclaracionDetalleRow {
  fechaRecepcion: Date | null;
  fechaAnulacion: Date | null;
  tipoDte: string;        // '01','03','05','06','11'
  nombreTipo: string;     // 'Factura', 'CCFE', etc.
  numeroControl: string;
  codigoGeneracion: string;
  clienteNit: string | null;
  clienteNombre: string | null;
  estado: 'ACEPTADO' | 'ANULADO';
  gravada: number;
  iva: number;
  total: number;
  observacion: string;    // 'Aceptado' | 'Anulado en período' | 'Aceptado y anulado fuera de período'
}

export interface IvaDeclaracionTotals {
  // Por categoría
  ventasInternasGravadas: { cantDocs: number; base: number; iva: number };
  exportaciones:          { cantDocs: number; monto: number };
  ajustesNotasCredito:    { cantDocs: number; base: number; iva: number };
  ajustesNotasDebito:     { cantDocs: number; base: number; iva: number };
  anulacionesEnPeriodo:   { cantDocs: number; base: number; iva: number };

  // Totales finales
  totalGravadoNeto: number;      // gravadas + ND - NC - anulaciones(gravada)
  totalIvaDebitoAPagar: number;  // IVA gravadas + IVA ND - IVA NC - IVA anulaciones
  totalExportaciones: number;
}

export interface IvaDeclaracionData {
  meta: IvaDeclaracionMeta;
  detalle: IvaDeclaracionDetalleRow[];
  totals: IvaDeclaracionTotals;
}
```

---

## 3. Flujo de datos

### Paso 1 — cargar DTEs aceptados del período

```typescript
const aceptados = await prisma.dTE.findMany({
  where: {
    tenantId,
    estado: 'ACEPTADO',
    fechaRecepcion: { gte: periodStart, lte: periodEnd },
    tipoDte: { in: ['01', '03', '05', '06', '11'] },
    // Excluir DTEs anulados dentro del mismo período (se contarán en el paso 2)
    // Excluir DTEs anulados posterior al período (se cuentan aquí; la anulación irá al periodo de anulación)
    OR: [
      { fechaAnulacion: null },
      { fechaAnulacion: { gt: periodEnd } },
    ],
  },
  include: { cliente: { select: { numDocumento: true, nombre: true } } },
  orderBy: { fechaRecepcion: 'asc' },
});
```

### Paso 2 — cargar anulaciones del período

```typescript
const anuladosEnPeriodo = await prisma.dTE.findMany({
  where: {
    tenantId,
    estado: 'ANULADO',
    fechaAnulacion: { gte: periodStart, lte: periodEnd },
    tipoDte: { in: ['01', '03', '05', '06', '11'] },
  },
  include: { cliente: { select: { numDocumento: true, nombre: true } } },
  orderBy: { fechaAnulacion: 'asc' },
});
```

### Paso 3 — clasificar y totalizar

```
Para cada DTE en aceptados:
  si tipoDte en ('01','03'): ventasInternasGravadas += (base, iva, count)
  si tipoDte === '05':        ajustesNotasCredito += (base, iva, count)
  si tipoDte === '06':        ajustesNotasDebito += (base, iva, count)
  si tipoDte === '11':        exportaciones += (monto = totalPagar, count)

Para cada DTE en anuladosEnPeriodo:
  anulacionesEnPeriodo += (base, iva, count)   // sin importar tipo

totalGravadoNeto      = ventasInternasGravadas.base
                       + ajustesNotasDebito.base
                       - ajustesNotasCredito.base
                       - anulacionesEnPeriodo.base
totalIvaDebitoAPagar  = ventasInternasGravadas.iva
                       + ajustesNotasDebito.iva
                       - ajustesNotasCredito.iva
                       - anulacionesEnPeriodo.iva
totalExportaciones    = exportaciones.monto
```

### Paso 4 — construir filas de detalle

Unión de `aceptados` + `anuladosEnPeriodo` ordenados por fecha efectiva (fechaRecepcion para aceptados, fechaAnulacion para anulados). Cada fila populada con:
- `observacion`:
  - Aceptado del período sin anular → `"Aceptado"`
  - Anulado durante el período → `"Anulado en período"`
  - Aceptado en el período y anulado fuera (query 1 con `fechaAnulacion > endDate`) → `"Aceptado y anulado fuera de período"`

### Paso 5 — escribir workbook con 2 hojas

---

## 4. Hoja 1 — "Resumen F07"

**Estructura (columnas A–D):**

| Row | A | B | C | D |
|---|---|---|---|---|
| 1 | **DECLARACIÓN IVA F07 — {MES-AÑO}** *(merged A1:D1, púrpura)* | | | |
| 2 | Empresa: {nombre} \| NIT: {nit} \| NRC: {nrc} *(merged A2:D2, grey)* | | | |
| 3 | Período: {start YYYY-MM-DD} a {end YYYY-MM-DD} *(merged A3:D3, grey)* | | | |
| 4 | *(spacer)* | | | |
| 5 | **Casilla** | **Concepto** | **Cant. Docs** | **Monto (USD)** |
| 6 | 1 | Ventas Internas Gravadas (01 + 03 aceptados) — Base | {N} | {base} |
| 7 | 2 | Débito Fiscal 13% (IVA de fila 1) | — | {iva} |
| 8 | 3 | Exportaciones (11 aceptados) — Monto | {N} | {exportaciones} |
| 9 | 4 | Ajustes — Notas de Crédito (05) — Base | {N} | ({base NC}) |
| 10 | 5 | Ajustes — Notas de Débito (06) — Base | {N} | {base ND} |
| 11 | 6 | Disminución — DTEs anulados en período — Base | {N} | ({base anul}) |
| 12 | *(spacer)* | | | |
| 13 | **TOTAL** | **TOTAL GRAVADO NETO** | | {totalGravadoNeto} |
| 14 | **TOTAL** | **TOTAL IVA DÉBITO A PAGAR** | | {totalIvaDebito} |
| 15 | **TOTAL** | **TOTAL EXPORTACIONES** | | {totalExportaciones} |
| 16 | *(spacer)* | | | |
| 17 | *Nota: Casillas 1-6 son numeración interna del reporte. Consultar Manual Anexos F07 v14 para casillas oficiales del portal MH.* *(merged A17:D17, italic, small)* | | | |

**Styling:**
- Row 1 banner: bold 14pt blanco sobre púrpura `FF7C3AED`, merged, center.
- Rows 2-3: bold grey `FFF0F0F0`, merged, center.
- Row 5 headers: bold grey `FFE0E0E0`, center.
- Rows 6-11: alternating fill `FFFAFAFA` en filas pares. Montos negativos (NC fila 9 + anulaciones fila 11) formateados con paréntesis y color rojo `FFC00000`.
- Rows 13-15 totales: bold, fondo amarillo `FFFFF9C4`.
- Row 17 nota: italic 10pt.

**Column widths:** 10, 55, 14, 18.

---

## 5. Hoja 2 — "Detalle DTE"

**Columnas (A–M):**

| Col | Header |
|---|---|
| A | Fecha Recepción |
| B | Fecha Anulación |
| C | Tipo |
| D | Nombre Tipo |
| E | Número Control |
| F | Código Generación |
| G | Cliente NIT |
| H | Cliente Nombre |
| I | Estado |
| J | Gravada |
| K | IVA |
| L | Total |
| M | Observación |

**Column widths:** 12, 12, 8, 14, 22, 38, 18, 30, 12, 14, 14, 14, 30.

**Rows:**
- Row 1 banner púrpura "Detalle DTE — {período}" *(merged A1:M1)*.
- Row 2 empresa *(merged A2:M2, grey)*.
- Row 3 spacer.
- Row 4 column headers bold grey.
- Row 5..N data rows — una por cada DTE (aceptado sin anulación en período + anulado en período + aceptado en período con anulación fuera). Ordenado por fecha efectiva ASC.
- Si no hay filas, row 5 merged A5:M5 con mensaje italic "Sin movimientos en el período".

**Formato numérico:** fechas `dd/mm/yyyy`, decimales `0.00`.

**Styling:** alternating rows `FFFAFAFA`. Anuladas (col I = 'ANULADO') con texto rojo suave `FFC00000`.

---

## 6. Edge cases + error handling

| Caso | Comportamiento |
|---|---|
| Período sin DTEs aceptados ni anulados | Excel válido con totales en 0 y hoja 2 mostrando "Sin movimientos" |
| Tenant no existe | `NotFoundException('Tenant {tenantId} not found')` |
| `endDate < startDate` | `BadRequestException('endDate debe ser posterior a startDate')` |
| DTE con `totalGravada` o `totalIva` null | Tratado como 0, visible en hoja 2 con valor original |
| DTE tipo 01 FCF | Confía en `totalGravada` + `totalIva` del DB (MEMORY `project_dte_tipo01_iva_rule.md` confirma) |
| Cliente null (DTE sin clienteId) | NIT/Nombre se muestran como string vacío en hoja 2 |
| Decimales Prisma | `Number(dte.totalGravada)` — mismo patrón que `reports.service.ts` |
| **Anulación de NC (05) o ND (06)** — raro (<1%) | MVP los trata como disminución igual que cualquier anulación. Matemáticamente, anular una NC debería *sumar* al gravado. El contador debe revisar manualmente si el mes tiene anulaciones de tipo 05/06. Corrección precisa queda para Fase 3b-extendida. |

Sin manejo especial para:
- DTEs rechazados por MH (`estado = 'RECHAZADO'`) — excluidos de ambas queries, no aparecen en reporte (no generan débito fiscal).
- DTEs con `estado = 'PENDIENTE'` — excluidos (aún no aceptados por MH, no son fiscalmente reales).

---

## 7. Tests — `iva-declaracion-report.service.spec.ts`

Siguiendo patrón Kardex: 8 casos TDD red con verificación de buffer via `ExcelJS.xlsx.load()`.

**Mock pattern:** manual `mockPrisma()` con `dTE.findMany` y `tenant.findUnique`. `Decimal` fields simulados como strings ("100.00").

**Test cases:**

1. **Happy path** — período con 3 FCF (tipo 01) + 2 CCFE (03) + 1 NCE (05) + 1 NDE (06) + 1 FEXE (11), todos aceptados, sin anulaciones. Verifica:
   - Hoja 1 totales: base gravada correcta, IVA correcto, exportaciones correcto, NC/ND reflejados.
   - Hoja 2: 8 filas de detalle, ordenadas por fecha.

2. **Solo FCF** — período con solo tipo 01. Verifica: hoja 1 muestra gravada = N, IVA = 0.13×N, exportaciones = 0, NC/ND en 0.

3. **Anulación cross-period** — 1 DTE **tipo 03 CCFE** emitido antes del período (fechaRecepcion en marzo), anulado dentro del período (fechaAnulacion en abril). Verifica:
   - Aparece en fila "Disminución — DTEs anulados" como negativo.
   - Aparece en hoja 2 con observación "Anulado en período".
   - NO aparece en "Ventas Internas Gravadas" (su aceptación fue en marzo, no en abril).
   - (El test usa tipo 03 deliberadamente para evitar la edge case de anular 05 NC documentada en §6.)

4. **Anulación posterior al período** — DTE emitido y aceptado en el período, anulado después del endDate. Verifica:
   - Cuenta en "Ventas Internas Gravadas" (aceptación en período).
   - Observación en hoja 2: "Aceptado y anulado fuera de período".

5. **Período vacío** — sin DTEs. Verifica:
   - Hoja 1 con totales en 0.
   - Hoja 2 mensaje "Sin movimientos en el período".
   - No lanza excepción.

6. **Tenant no existe** → `NotFoundException`.

7. **endDate < startDate** → `BadRequestException`.

8. **Tipos fuera de scope** — período con DTEs tipo 04 NRE y 07 CRE además de 01 FCF. Verifica: reporte solo incluye el 01; 04 y 07 no afectan totales ni aparecen en hoja 2.

---

## 8. Archivos afectados

**Crear:**
- `apps/api/src/modules/reports/services/iva-declaracion-report.service.ts` (~340 LOC)
- `apps/api/src/modules/reports/services/iva-declaracion-report.service.spec.ts` (~330 LOC)

**Modificar:**
- `apps/api/src/modules/reports/reports.module.ts` — agregar `IvaDeclaracionReportService` a `providers` + `exports`.

Sin schema changes. Sin nuevas dependencias.

---

## 9. Criterios de aceptación

- [ ] 8/8 unit tests verdes.
- [ ] Regresión: tests actuales del módulo `reports` + módulos consumidores no afectados (>277 passing, baseline post-3a).
- [ ] `tsc --noEmit` limpio (filtrando pre-existing errors en `test-fixtures.ts`).
- [ ] `IvaDeclaracionReportService` registrado en `reports.module.ts`.
- [ ] Método público único `generateIvaDeclaracionExcel(tenantId, start, end): Buffer`.
- [ ] Excel abre correctamente en LibreOffice/Excel (verificado via `ExcelJS.xlsx.load` en tests).
- [ ] `loadIvaDeclaracionData()` pure, testable independiente del Excel building.
- [ ] Evidence file `outputs/EXECUTION_EVIDENCE_PHASE_3B.md`.
- [ ] PR abierto contra `main`.

---

## 10. Referencias

- `outputs/VALIDATION_RESEARCH.md` §B.3 — casillas F07 y bloqueante Manual Anexos v14.
- `outputs/2026-04-17-fase-3a-kardex-report-design.md` — patrón arquitectural a replicar.
- `apps/api/src/modules/reports/services/kardex-report.service.ts` — implementación de referencia para styling Excel + helpers.
- `apps/api/src/modules/reports/reports.service.ts` — patrón existente de queries sobre `DTE` y uso de `TIPO_DTE_NAMES`.
- MEMORY `project_dte_tipo01_iva_rule.md` — tipo 01 FCF desglosa IVA correctamente.
