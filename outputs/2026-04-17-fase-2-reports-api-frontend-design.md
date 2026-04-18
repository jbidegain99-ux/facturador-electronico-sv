# Fase 2 — Reports HTTP API + Frontend Design

**Date:** 2026-04-17
**Phase:** 2 (wrapper: Controllers + UI para los 3 reportes existentes)
**Status:** Design approved — ready for plan
**Depende de:** Fases 3a + 3b + 3c merged en `main` ✅
**Branch:** `feature/reports-api-frontend`

---

## 1. Objetivo

Exponer los 3 services de reportes (Kardex, IVA F07, Estado Costo Venta) como endpoints HTTP y construir UI para consumirlos desde el dashboard. Hoy los services existen pero solo son invocables vía scripts — Wellnest necesita poder descargar los reportes desde el navegador.

### Scope IN

- **4 endpoints HTTP** en `ReportsController` existente:
  - `GET /reports/kardex/item/:catalogItemId?startDate=&endDate=` — Kardex single-item
  - `GET /reports/kardex/book?startDate=&endDate=` — Kardex multi-item book
  - `GET /reports/iva-declaracion?startDate=&endDate=` — F07 IVA Excel
  - `GET /reports/cogs-statement?startDate=&endDate=` — Estado Costo Venta Excel
- RBAC: `@RequirePermission('report:export')` en los 4 endpoints.
- Plan gating: `@RequireFeature('advanced_reports')` en los 4 endpoints.
- Streaming de `Buffer` con `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` + `Content-Disposition: attachment; filename="..."`.
- **UI:** nuevo tab "Fiscales" en `/reportes` con 3 cards (una por reporte), cada una con formulario + botón descarga.
- **Helper compartido** `apps/web/src/lib/download-report.ts` para encapsular fetch + blob + download link.
- Swagger `@ApiOperation` + `@ApiQuery` en los 4 endpoints.
- **Tests backend:** 6 tests nuevos en `reports.controller.spec.ts` (happy paths + forbidden + bad request).

### Scope OUT (deferred)

- **Tests frontend** — consistente con resto de `reportes/page.tsx` que no tiene test suite. Validación manual por browser.
- **Background generation / async jobs** — todos los reportes son síncronos (se generan en <3s para Wellnest-scale).
- **Azure Blob Storage retention** → post-MVP cuando queramos historial de reportes generados.
- **Email delivery** — post-MVP.
- **PDF export alternativo** — post-MVP.
- **Compras recibidas en F07** (Fase 3b-extendida) — independiente de este PR.
- **PhysicalCount + F983 XML** (Fase 3d/3e) — solo aplicable a tenants ≥2,753 SMM.
- **Modificar los 3 services existentes** — ya están probados y completos; este PR es puramente wrapper.

---

## 2. Arquitectura

**Backend:** extender `ReportsController` (NO crear módulo nuevo). Los 3 services ya están registrados como providers en `ReportsModule` (Fases 3a/3b/3c). Solo inyectamos en el controller y exponemos endpoints.

**Frontend:** extender `apps/web/src/app/(dashboard)/reportes/page.tsx` agregando:
- Nuevo `<TabsTrigger value="fiscales">` en el `<TabsList>` existente.
- Nuevo `<TabsContent value="fiscales">` con 3 `<Card>`s, una por reporte.
- Uso del helper compartido `downloadReport(url, filename, token)`.

**Zero schema changes. Zero new backend deps. Zero new frontend deps.**

---

## 3. Endpoints backend

### 3.1 Kardex single-item

```
GET /reports/kardex/item/:catalogItemId
Query: startDate (ISO), endDate (ISO)
Decorators: @RequirePermission('report:export'), @RequireFeature('advanced_reports')
Response: xlsx Buffer, Content-Disposition attachment, filename="kardex-{itemCode}-{YYYYMMDD}.xlsx"
```

Controller extrae tenant via `ensureTenant()`, valida `startDate <= endDate` (BadRequestException si no), llama `kardexReportService.generateKardexExcel(tenantId, catalogItemId, start, end)`, escribe buffer al Response.

### 3.2 Kardex book

```
GET /reports/kardex/book
Query: startDate, endDate
Decorators: same as 3.1
Response: xlsx Buffer, filename="kardex-libro-{YYYYMM}.xlsx"
```

Llama `kardexReportService.generateKardexBookExcel(tenantId, start, end)`.

### 3.3 IVA Declaración F07

```
GET /reports/iva-declaracion
Query: startDate, endDate
Decorators: same
Response: xlsx Buffer, filename="iva-f07-{YYYYMM}.xlsx"
```

Llama `ivaDeclaracionReportService.generateIvaDeclaracionExcel(tenantId, start, end)`.

El service internamente lanza `BadRequestException` si `endDate < startDate` — el controller no duplica la validación.

### 3.4 Estado Costo Venta

```
GET /reports/cogs-statement
Query: startDate, endDate
Decorators: same
Response: xlsx Buffer, filename="estado-costo-venta-{YYYY}.xlsx"
```

Llama `cogsStatementReportService.generateCogsStatementExcel(tenantId, start, end)`.

### 3.5 Helper común en controller

Extraer método privado `streamXlsx(res: Response, buffer: Buffer, filename: string): void` que setea headers y envía buffer. Usado por los 4 endpoints.

```typescript
private streamXlsx(res: Response, buffer: Buffer, filename: string): void {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length.toString());
  res.end(buffer);
}
```

### 3.6 Filename builders

Helpers privados en controller:

```typescript
private buildKardexItemFilename(itemCode: string, endDate: Date): string {
  const dateStr = endDate.toISOString().slice(0, 10).replace(/-/g, '');
  return `kardex-${itemCode}-${dateStr}.xlsx`;
}
private buildKardexBookFilename(endDate: Date): string {
  const monthStr = endDate.toISOString().slice(0, 7).replace('-', '');
  return `kardex-libro-${monthStr}.xlsx`;
}
private buildIvaFilename(endDate: Date): string {
  const monthStr = endDate.toISOString().slice(0, 7).replace('-', '');
  return `iva-f07-${monthStr}.xlsx`;
}
private buildCogsFilename(endDate: Date): string {
  const yearStr = endDate.toISOString().slice(0, 4);
  return `estado-costo-venta-${yearStr}.xlsx`;
}
```

Para Kardex single-item necesitamos `catalogItem.code` — el controller hace un lookup ligero vía `prisma.catalogItem.findUnique({ where: { id: catalogItemId }, select: { code: true, tenantId: true } })` para:
1. Validar tenant match (si no coincide o null → 404).
2. Usar `code` en el filename.

Este lookup no se lo delegamos al service porque el service YA hace el lookup completo para los datos del reporte; la duplicación es ~2ms y simplifica el control flow.

Alternativa: el service podría devolver `{ buffer, itemCode }` pero eso rompe la interfaz `Promise<Buffer>` ya establecida. Preferimos el lookup adicional en controller.

---

## 4. UI — tab "Fiscales" en `/reportes`

### 4.1 Estructura

Dentro del `<Tabs>` existente (`apps/web/src/app/(dashboard)/reportes/page.tsx`):

```tsx
<TabsList>
  {/* tabs existentes */}
  <TabsTrigger value="fiscales">Fiscales</TabsTrigger>
</TabsList>

<TabsContent value="fiscales">
  <div className="grid gap-6">
    <KardexCard />
    <IvaDeclaracionCard />
    <CogsStatementCard />
  </div>
</TabsContent>
```

Las 3 cards se definen inline en el mismo archivo como componentes locales (consistente con el estilo existente del file) o como funciones helpers. YAGNI — no extraer a archivos separados salvo que alguna crezca >80 LOC.

### 4.2 KardexCard

**Form fields:**
- Radio/Select "Tipo": `"single"` (default) vs `"book"`.
- Si `single`: Select "Producto" poblado con `GET /catalog-items?trackInventory=true` (lista filtrada a items con inventario activo).
- `<Input type="date">` startDate, `<Input type="date">` endDate (default: último mes).
- Botón "Descargar Excel" — disabled si falta dato requerido.

**On submit:**
- `single` → `downloadReport(\`${API_URL}/reports/kardex/item/${itemId}?startDate=${s}&endDate=${e}\`, 'kardex.xlsx', token)`.
- `book` → `downloadReport(\`${API_URL}/reports/kardex/book?startDate=${s}&endDate=${e}\`, 'kardex-libro.xlsx', token)`.
- Loading state: `<Loader2 className="animate-spin">` dentro del botón; `disabled` true mientras descarga.

### 4.3 IvaDeclaracionCard

**Form fields:**
- Select "Período": opciones `"mes-actual"`, `"mes-anterior"`, `"personalizado"` (default: mes-actual).
- Si `personalizado`: date range picker (2 `<Input type="date">`).
- Si preset: startDate/endDate calculados al momento del submit.
- Botón "Descargar Excel".

**On submit:**
- Calcular start/end según selección.
- `downloadReport(\`${API_URL}/reports/iva-declaracion?startDate=${s}&endDate=${e}\`, \`iva-f07-${yearMonth}.xlsx\`, token)`.

### 4.4 CogsStatementCard

**Form fields:**
- Select "Período": `"anio-actual"`, `"anio-anterior"`, `"trimestre-actual"`, `"personalizado"`.
- Botón "Descargar Excel".

**On submit:**
- `downloadReport(\`${API_URL}/reports/cogs-statement?startDate=${s}&endDate=${e}\`, \`estado-costo-venta-${year}.xlsx\`, token)`.

### 4.5 Helper `downloadReport`

Nuevo archivo `apps/web/src/lib/download-report.ts`:

```typescript
export async function downloadReport(
  url: string,
  filename: string,
  token: string,
): Promise<void> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    throw new DownloadReportError(res.status, text || res.statusText);
  }
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objUrl);
}

export class DownloadReportError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'DownloadReportError';
  }
}
```

### 4.6 Error handling UI

En cada card, al catch:

```typescript
if (err instanceof DownloadReportError) {
  if (err.status === 402) toast({ title: 'Plan requerido', description: 'Este reporte requiere plan Professional o superior.', variant: 'destructive' });
  else if (err.status === 403) toast({ title: 'Sin permiso', description: 'No tienes permiso para exportar reportes.', variant: 'destructive' });
  else if (err.status === 404) toast({ title: 'No encontrado', description: 'Producto o tenant no encontrado.', variant: 'destructive' });
  else if (err.status === 400) toast({ title: 'Datos inválidos', description: err.message, variant: 'destructive' });
  else toast({ title: 'Error', description: 'Error al generar reporte. Intenta nuevamente.', variant: 'destructive' });
} else {
  toast({ title: 'Error de red', description: 'No se pudo conectar con el servidor.', variant: 'destructive' });
}
```

---

## 5. Edge cases

| Caso | Backend | Frontend |
|---|---|---|
| `catalogItemId` inexistente o de otro tenant | Controller lookup devuelve null → `NotFoundException` 404 | Toast "Producto no encontrado" |
| `startDate > endDate` en Kardex single-item | Controller lanza `BadRequestException` 400 | Toast con mensaje |
| `startDate > endDate` en Kardex book | Controller lanza `BadRequestException` 400 | Toast |
| `startDate > endDate` en IVA/COGS | Service ya lanza `BadRequestException` 400 | Toast |
| Fechas inválidas / no ISO | `parseDateRange()` existente lanza 400 | Toast |
| Sin tenant en JWT | `ensureTenant()` lanza 403 | Toast |
| Plan sin `advanced_reports` | `PlanFeatureGuard` 402 | Toast con CTA "Ver planes" |
| Sin permiso `report:export` | `RbacGuard` 403 | Toast |
| Sin items con `trackInventory` | — | Mensaje inline "No hay productos con inventario activo" |
| 500 del service (raro) | Nest default error handler 500 | Toast genérico |
| Red / fetch falla | — | Toast "Error de red" |

---

## 6. Tests

### 6.1 Backend — 6 tests nuevos en `reports.controller.spec.ts`

Siguiendo patrón existente (mock Prisma + services via ValueProvider):

1. **`GET /reports/kardex/item/:id` happy path** — mock de `kardexReportService.generateKardexExcel` devuelve Buffer; mock de `prisma.catalogItem.findUnique` devuelve item válido con tenantId match. Controller llama service + setea headers xlsx + envía buffer. Verifica: `res.setHeader` llamado con Content-Type xlsx, Content-Disposition con filename, `res.end(buffer)` llamado.

2. **`GET /reports/kardex/book` happy path** — mock devuelve Buffer, verifica headers + end.

3. **`GET /reports/iva-declaracion` happy path** — mock devuelve Buffer, verifica headers.

4. **`GET /reports/cogs-statement` happy path** — mock devuelve Buffer, verifica headers.

5. **Sin tenant → 403** — llamar endpoint con `user.tenantId = null` → espera `ForbiddenException`.

6. **Kardex item con `endDate < startDate` → 400** — llamar controller con rango inválido → espera `BadRequestException`, service NO llamado.

### 6.2 Frontend — no tests unitarios

Consistente con el resto de `reportes/page.tsx`. Validación manual:
1. Login como usuario con plan PROFESSIONAL.
2. Navegar a `/reportes` → click tab "Fiscales".
3. Probar cada una de las 3 cards con fechas válidas → verificar descarga y que el xlsx abre correctamente.
4. Probar con plan FREE → esperar toast "Plan requerido".
5. Probar con rango inválido → esperar toast "Datos inválidos".

---

## 7. Archivos afectados

**Crear:**
- `apps/web/src/lib/download-report.ts` (~25 LOC)

**Modificar:**
- `apps/api/src/modules/reports/reports.controller.ts` — 4 endpoints nuevos + 4 filename helpers + `streamXlsx` helper (~120 LOC nuevos).
- `apps/api/src/modules/reports/reports.controller.spec.ts` — 6 tests nuevos (~180 LOC nuevos).
- `apps/web/src/app/(dashboard)/reportes/page.tsx` — 1 tab trigger + 1 tab content con 3 cards + handlers (~260 LOC nuevos).

Sin schema changes. Sin dependencias nuevas.

---

## 8. Criterios de aceptación

- [ ] 4 endpoints responden xlsx válido (200) con headers correctos (Content-Type, Content-Disposition).
- [ ] Los 4 endpoints tienen `@RequirePermission('report:export')` + `@RequireFeature('advanced_reports')` aplicados.
- [ ] Los 4 endpoints aparecen en Swagger (`/api/docs`).
- [ ] UI: tab "Fiscales" funcional con 3 cards.
- [ ] Descarga: cada reporte genera xlsx abrible en Excel/LibreOffice.
- [ ] RBAC: usuario sin `report:export` recibe 403 + toast.
- [ ] Plan gating: usuario FREE recibe 402 + toast con CTA upgrade.
- [ ] Tests: baseline 293 + 6 nuevos = **299 passing**, sin regresiones.
- [ ] TypeScript compila limpio (filtrando pre-existing `test-fixtures.ts`).
- [ ] Manual QA: verificación browser contra tenant PROFESSIONAL.

---

## 9. Referencias

- `apps/api/src/modules/reports/reports.controller.ts` — controller existente (patrón a seguir).
- `apps/api/src/common/plan-features.ts` — feature codes incluye `advanced_reports`.
- `apps/api/src/modules/plans/decorators/require-feature.decorator.ts` — decorator existente.
- `apps/api/src/modules/rbac/decorators/require-permission.decorator.ts` — decorator existente.
- `apps/web/src/app/(dashboard)/reportes/page.tsx` — dashboard existente (extender, no reemplazar).
- `outputs/2026-04-17-fase-3a-kardex-report-design.md`, `...3b-iva-declaracion-report-design.md`, `...3c-cogs-statement-report-design.md` — specs de los services que estamos wrappeando.
