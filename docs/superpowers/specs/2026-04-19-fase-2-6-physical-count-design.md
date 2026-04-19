# Fase 2.6 — Conteo Físico Anual (Sub-proyecto B.3)

**Date:** 2026-04-19
**Sub-proyecto:** B.3 (tercer entregable del sub-proyecto B = Inventario). Cierra el sub-proyecto B después de B.1 (visor, Fase 2.4) y B.2 (ajustes manuales, Fase 2.5).
**Depende de:** Fases 1.2–1.6 (InventoryState + InventoryMovement), Fase 2.1 (feature `inventory_reports`), Fase 2.4 (módulo `inventory` read-only), Fase 2.5 (módulo `inventory-adjustments`).

---

## 1. Goal

Permitir al usuario registrar el conteo físico anual de inventario (una vez por año fiscal por tenant) con dos métodos de captura intercambiables (online inline + CSV upload), revisar el resumen de diferencias, y finalizar — lo que dispara la generación automática de `AJUSTE_FISICO_FALTANTE` / `AJUSTE_FISICO_SOBRANTE` vía el `InventoryAdjustmentService` ya construido en B.2.

Fuera de alcance:
- Múltiples conteos por año (mensuales, parciales por sección/bodega).
- Reversión de un conteo finalizado (inmutable — si el conteo fue erróneo, el usuario compensa con ajustes manuales de B.2).
- Ítems nuevos creados durante la sesión (el usuario debe crearlos en `/catalogo` antes de iniciar el conteo).
- Reporte PDF/Excel del conteo histórico.

## 2. Architecture

**Backend:** nuevo módulo `physical-counts` (separado de `inventory` y `inventory-adjustments`).

- `PhysicalCountService` — CRUD de conteos (crear/listar/detalle/update-detail/cancel/finalize), populate de details al crear, merge de CSV.
- `PhysicalCountCsvService` — parse + validación del CSV upload.
- `PhysicalCountController` — endpoints REST bajo `/physical-counts`.
- DTOs: `CreatePhysicalCountDto`, `UpdateDetailDto`, `ListCountsDto`, `FinalizeDto`, `CancelDto`.
- Module importa `PrismaModule`, `PlansModule`, `InventoryAdjustmentsModule`.
- Registrado en `AppModule`.

**Extensión de B.2**: agregar parámetro opcional `options?: { skipDateValidation?: boolean }` a `InventoryAdjustmentService.createAdjustment`. Solo callers internos lo usan (PhysicalCountService para permitir movementDate anterior al mes actual al finalizar un conteo dated en un período anterior). No se expone en DTO público.

**Zero schema changes.** Reusa `PhysicalCount` + `PhysicalCountDetail` existentes del Prisma schema.

**Frontend:** dos páginas nuevas:
- `apps/web/src/app/(dashboard)/inventario/conteo/page.tsx` — lista histórica de conteos por año fiscal.
- `apps/web/src/app/(dashboard)/inventario/conteo/[id]/page.tsx` — detalle; tabla editable para DRAFT, read-only para FINALIZED / CANCELLED.

Componentes: `FinalizeConfirmModal`, `CsvUploadButton`.

## 3. Data model (schema existente)

**`PhysicalCount`** (header):
- `id`, `tenantId`, `countDate` (fecha física del conteo, set al crear), `fiscalYear` (unique por tenant), `status` (`DRAFT | FINALIZED | CANCELLED`), `notes`, `finalizedAt`, `finalizedBy`, `createdAt`, `createdBy`.

**`PhysicalCountDetail`** (línea):
- `physicalCountId`, `tenantId`, `catalogItemId`, `systemQty`, `countedQty` (nullable durante DRAFT), `variance`, `unitCost`, `totalValue`, `adjustmentMovementId?`, `notes`.

**Semántica durante DRAFT:**

- `systemQty` = snapshot de `InventoryState.currentQty` al momento de crear el conteo. Inmutable.
- `countedQty = null` inicialmente. `null` significa "no contado aún".
- `variance = countedQty - systemQty`. Solo calculado y persistido cuando `countedQty != null`. Si `countedQty = null`, `variance = 0` (placeholder; no se interpreta).
- `unitCost` inicial = `InventoryState.currentAvgCost` al snapshot (0 si no hay state). Editable SOLO para líneas con `variance > 0` (sobrantes); ignorado para faltantes.
- `totalValue = variance * unitCost` recalculado en cada update.

**Semántica post-FINALIZE:**

- `status = 'FINALIZED'`, `finalizedAt`, `finalizedBy` populated.
- Para cada detail con `countedQty != null && variance != 0`: `adjustmentMovementId` apunta al `InventoryMovement` generado.
- Detalles con `countedQty = null` o `variance = 0` quedan sin `adjustmentMovementId` (ítems no contados o sin diferencia).

## 4. API surface

Todos los endpoints bajo `/physical-counts`, clase-level `@UseGuards(PlanFeatureGuard) + @RequireFeature('inventory_reports')`. `@RequirePermission('inventory:adjust')` por endpoint (reuso del perm de B.2 per design decision).

### POST /physical-counts

**Body (`CreatePhysicalCountDto`):**

```typescript
{
  countDate: string;   // ISO YYYY-MM-DD, <= hoy
  fiscalYear: number;  // int, >= 2000, <= año actual + 1
  notes?: string;      // max 1000 chars
}
```

**Validaciones:**
- 409 `DUPLICATE_FISCAL_YEAR` si ya existe `PhysicalCount` para `(tenantId, fiscalYear)`.
- 400 `INVALID_COUNT_DATE` si `countDate > hoy`.
- 400 `INVALID_FISCAL_YEAR` fuera del rango.

**Acción del service** (dentro de `$transaction`):
1. Valida.
2. Lee todos `CatalogItem` con `tenantId + trackInventory=true + isActive=true`.
3. Para cada uno: `InventoryState.findFirst` para obtener `currentQty + currentAvgCost` (0 / 0 si no existe).
4. `PhysicalCount.create` con `status='DRAFT'`, `createdBy=userId`.
5. Bulk `PhysicalCountDetail.createMany` con `systemQty, unitCost, countedQty=null, variance=0, totalValue=0` por ítem.
6. Retorna count + details count.

**Response 201:** `{ id, countDate, fiscalYear, status, ..., totalDetails: N }`.

### GET /physical-counts

**Query:** `status?`, `fiscalYear?`, `page?`, `limit?`.

**Response:**
```typescript
{
  data: [{
    id, countDate, fiscalYear, status, notes, finalizedAt, finalizedBy, createdAt, createdBy,
    summary: { totalLines, countedLines, pendingLines, adjustedLines, varianceNet }
  }],
  total, totalPages, page, limit
}
```

`summary` se computa agregando los details (cached-ish — OK querear para la list; no hay muchos conteos por tenant).

### GET /physical-counts/:id

**Query:** `search?` (filtra details por `catalogItem.code` OR `catalogItem.description`).

**Response:** count header + paginated details (default limit 200 para sesiones grandes). El detail incluye `catalogItem.code + description`.

### PATCH /physical-counts/:id/details/:detailId

**Body (`UpdateDetailDto`):**

```typescript
{
  countedQty?: number | null;   // null permitido (reset "no contado")
  unitCost?: number;             // solo si variance > 0 resultante
  notes?: string;
}
```

**Validaciones:**
- 400 `COUNT_NOT_EDITABLE` si `count.status !== 'DRAFT'`.
- Si `countedQty` pasado: `>= 0`, 4 decimales max.
- Recalcula `variance = countedQty - systemQty` y `totalValue = variance * unitCost`. Si `variance <= 0` e `unitCost` viene en body, se ignora (warning log).
- Si `countedQty = null` explícito, resetea `variance=0, totalValue=0`.

**Response:** detail actualizado.

### POST /physical-counts/:id/upload-csv

**Multipart:** campo `file` (text/csv, max 5MB, max 10000 rows).

**Formato CSV esperado (header exacto):**

```
code,description,systemQty,countedQty,notes
```

**Acción:**
1. Parse (papaparse o similar). Header mandatory, trim whitespace, case-insensitive column names.
2. Para cada fila: trim + upper-case `code`, match contra `CatalogItem.code` del count's tenant (case-insensitive). Si matched, busca `PhysicalCountDetail` correspondiente.
3. Si detail existe: update `countedQty` (parseFloat, reject si NaN) + `notes` (merge si el CSV trae valor). Recalcula `variance + totalValue` con el `unitCost` actual del detail.
4. Si no existe detail (code no está en el count): log en errors con `rowNumber, code, reason: 'NOT_IN_COUNT'`. Skip.
5. Si `countedQty` vacío: skip (no-op, no error).
6. Solo procesa si `count.status = 'DRAFT'`.

**Response:**
```typescript
{
  totalRows: N,
  matched: N,
  skipped: N,
  errors: [{ rowNumber, code, reason }]
}
```

### POST /physical-counts/:id/finalize

**Body:** `{ confirm: true }` (sanity check boolean).

**Validaciones:**
- `count.status = 'DRAFT'` (else 409 `NOT_DRAFT`).
- `confirm === true` (else 400).

**Flow (dentro de `$transaction`):**

```
1. Lock count row (FOR UPDATE).
2. Lee details con `countedQty != null AND variance != 0`.
3. Para cada detail:
   const subtype = detail.variance < 0 ? 'AJUSTE_FALTANTE' : 'AJUSTE_SOBRANTE';
   const movement = await inventoryAdjustmentService.createAdjustment(
     tenantId,
     userId,
     {
       catalogItemId: detail.catalogItemId,
       subtype,
       quantity: Math.abs(detail.variance),
       unitCost: subtype === 'AJUSTE_SOBRANTE' ? detail.unitCost : undefined,
       movementDate: count.countDate.toISOString().slice(0, 10),
       notes: `Conteo físico ${count.fiscalYear}${detail.notes ? ` — ${detail.notes}` : ''}`,
     },
     { skipDateValidation: true }
   );
   await tx.physicalCountDetail.update({
     where: { id: detail.id },
     data: { adjustmentMovementId: movement.id },
   });
4. Update count: status='FINALIZED', finalizedAt=now(), finalizedBy=userId.
5. Retorna count + count de movements generated.
```

**Si cualquier `createAdjustment` lanza:** `$transaction` rollback completo. El conteo queda en DRAFT. Usuario revisa el error en la UI y reintenta.

**Response 200:**
```typescript
{
  id, status: 'FINALIZED', finalizedAt, finalizedBy,
  adjustmentsGenerated: N,
  pendingLines: N,  // details con countedQty null (no ajustados)
  zeroVarianceLines: N  // details con countedQty != null pero variance = 0
}
```

### POST /physical-counts/:id/cancel

**Body:** `{ reason?: string }`.

**Validaciones:** `count.status = 'DRAFT'`. Else 409 `NOT_DRAFT`.

**Acción:** `status = 'CANCELLED'`, append `\nCancelled: ${reason}` a notes.

### GET /physical-counts/:id/csv-template

**Response:** `Content-Type: text/csv`, filename `conteo_${fiscalYear}_template.csv`.

Contenido:
```
code,description,systemQty,countedQty,notes
P-001,Producto 1,10.0000,,
P-002,Producto 2,5.0000,,
...
```

Todas las líneas del count's details. `countedQty` y `notes` vacías para que el usuario llene.

## 5. Extensión de `InventoryAdjustmentService` (B.2)

Cambio pequeño al service existente: 4° param opcional.

```typescript
async createAdjustment(
  tenantId: string,
  userId: string,
  dto: CreateAdjustmentDto,
  options?: { skipDateValidation?: boolean },
) {
  // ... validación item + trackInventory (igual)
  if (!options?.skipDateValidation) {
    this.validateDate(dto.movementDate);
  }
  // ... resto igual
}
```

Agregar 2 tests al spec existente:
- `skipDateValidation=true permite movementDate del mes anterior`.
- `sin flag, sigue rechazando DATE_BEFORE_MONTH_START`.

El DTO público no cambia (no se expone el flag en el body).

## 6. UI — páginas

### `/inventario/conteo` (list)

Layout de tarjetas, una por año fiscal. Cada tarjeta muestra:
- Header: `Conteo físico {fiscalYear}` + badge de status (DRAFT amber / FINALIZED green / CANCELLED gray).
- `countDate` + `createdBy`.
- Summary: `{totalDetails} ítems · {counted} contados · {pending} pendientes` (DRAFT) o `{adjusted} ajustes · valor neto $X` (FINALIZED).
- CTA: `Continuar →` (DRAFT) / `Ver →` (FINALIZED / CANCELLED).

Botón arriba `+ Iniciar conteo {currentFiscalYear}` habilitado solo si no existe conteo DRAFT del año actual.

### `/inventario/conteo/[id]` DRAFT

Header con summary numérico + acciones: `Descargar plantilla CSV`, `Subir CSV`, `Cancelar`, `Finalizar`.

Tabla con columnas: Code · Descripción · Sistema · Contado (input inline numérico, 4 decimales) · Variance (computed, colored red/green) · Costo unitario (input habilitado solo si variance > 0) · Notas.

Barra de búsqueda arriba. Debounce 300ms en cambios de countedQty → `PATCH /details/:id`. Toast silencioso al éxito.

Botón "Finalizar" abre `FinalizeConfirmModal` con resumen:
- Total ítems, contados, pendientes.
- Ajustes a generar: faltantes N · $X, sobrantes N · $Y.
- Valor neto.
- Warning si `pending > 0`: "30 ítems sin contar — no se ajustarán".
- Botones: `Volver`, `Confirmar y finalizar`.

Upload CSV abre file picker → POST. Toast con summary (`N matched, N errors`). Si hay errores, modal con tabla de errores para revisar. Refresh tabla.

### `/inventario/conteo/[id]` read-only (FINALIZED / CANCELLED)

Mismo layout, inputs reemplazados por valores display-only. Columna extra `Movement` con link a `/inventario/[catalogItemId]` (kardex muestra el ajuste generado).

### Navegación

Sin tabs ni sub-items en el sidebar. Acceso via botón `Conteo físico →` en el header de `/inventario`, al lado del botón `Exportar XLSX` existente. Criterio YAGNI: ruta rara (uno por año), no amerita sub-item permanente en sidebar.

## 7. RBAC + feature gate

Reusa:
- **Permiso `inventory:adjust`** (B.2) — protege todas las acciones de conteo. Roles que ya lo tienen: GERENTE, CONTADOR, ADMIN. El usuario que puede ajustar un ítem individual puede también ejecutar conteo anual.
- **Feature flag `inventory_reports`** (existente) — bloquea todos los endpoints en planes sin el feature.

Sin permisos ni feature nuevos.

## 8. Error handling + edge cases

- **Feature OFF** → 403 `FEATURE_DISABLED`. UI oculta la página.
- **Sin permiso** → botones de acción ocultos; 403 server-side.
- **Segundo conteo en el mismo año** → 409 `DUPLICATE_FISCAL_YEAR`. UI muestra "Ya existe conteo {year} — cancelá el actual antes de iniciar otro".
- **Stock insuficiente al finalizar** (otro proceso consumió stock entre snapshot y finalize): el service de B.2 tira `INSUFFICIENT_STOCK`. El `$transaction` rollback. UI muestra "Ítem P-001: stock actual insuficiente para aplicar FALTANTE. Re-contá ese ítem o cancelá el conteo."
- **Cuenta contable faltante** al postear asientos: B.2 tiene graceful failure (movement guardado sin `journalEntryId`, warning log). El conteo finaliza OK. Usuario ve warnings en los movements afectados al visitar su kardex. Remedio: correr `seed-inventory-adjust-perm.ts` o crear cuentas manualmente.
- **CSV con BOM / encoding mixto**: parser configurado para aceptar UTF-8 con/sin BOM. Latin-1 opcional (second attempt si falla UTF-8).
- **CSV demasiado grande**: 400 `FILE_TOO_LARGE` si > 5MB o > 10000 rows.
- **CSV con código duplicado**: última wins, log warning.
- **CSV con código que existe en catálogo pero NO está en el detail** (agregado post-snapshot): skip + log en `errors[]` con reason `NOT_IN_COUNT`.
- **Finalize sin confirm=true**: 400 `CONFIRMATION_REQUIRED`.
- **Finalize con 0 líneas con variance**: OK, conteo queda FINALIZED, `adjustmentsGenerated = 0`.
- **Finalize en conteo ya FINALIZED**: 409 `NOT_DRAFT`.
- **Update detail después de finalize**: 400 `COUNT_NOT_EDITABLE`.
- **Cancel después de finalize**: 409 `NOT_DRAFT`.

## 9. Testing

**Backend (jest + manual Prisma mock):**

`physical-count.service.spec.ts` (~18 tests):
- `create`: genera detail por ítem trackInventory+isActive, snapshot correcto, 409 duplicado.
- `findAll`: paginado, filtros status/fiscalYear, summary correcto.
- `findOne`: header + paginated details, search filter.
- `updateDetail`: recalcula variance/totalValue, rechaza si no DRAFT, ignora unitCost override para variance<=0.
- `uploadCsv`: merge, match case-insensitive, errors por fila (inválida, no matched).
- `finalize`: generates adjustments correctamente (FALTANTE/SOBRANTE), skipDateValidation=true, links adjustmentMovementId, rollback si falla un ítem, status + finalizedAt/By.
- `cancel`: solo DRAFT, append reason.

`physical-count-csv.service.spec.ts` (~6 tests):
- Parse header, trim + case-insensitive.
- Filas inválidas (code vacío, countedQty NaN).
- Match case-insensitive + trim.
- BOM handling.
- Error accumulation.
- File size / row count limits.

`physical-count.controller.spec.ts` (~7 tests): routing + RBAC + feature gate + null tenant por endpoint.

**Extensión de `inventory-adjustment.service.spec.ts`** (+2 tests):
- `skipDateValidation=true` permite movementDate del mes anterior.
- Sin flag, sigue rechazando.

**Frontend:** sin unit tests (match patrón). tsc + 1 E2E stub skip.

**Regression sweep final:** API jest + tsc, Web tsc. Esperado ~33 tests nuevos.

## 10. Post-deploy runbook

**Zero schema changes. Zero seed necesario** (el seed de B.2 ya creó las cuentas 5103-5107; `AJUSTE_FISICO_FALTANTE/SOBRANTE` reusan 5103 / 4105 que ya existen en el catálogo estándar).

Pasos:
1. Merge → CI deploy staging.
2. Login con rol GERENTE o CONTADOR → ir a `/inventario/conteo`.
3. Cliquear `+ Iniciar conteo {año}` → se genera el count + details.
4. En la tabla: llenar algunos `countedQty` inline (debe hacer PATCH silencioso).
5. Descargar plantilla CSV → llenar algunos ítems más en Excel → subir → ver matched/errors summary.
6. Cliquear "Finalizar" → revisar modal → confirmar.
7. Verificar en `/inventario/[id]/kardex` que los movements fueron creados con fecha = countDate.
8. Con tenant `accounting` ON → revisar asientos generados en `/contabilidad`.
9. Smoke prod post-merge.

## 11. Rollback

`git revert <merge-sha>`. Zero schema changes. Conteos creados quedan en DB sin UI; pueden borrarse por SQL si se desea. Movements ya aplicados al inventario NO se revierten automáticamente — si es crítico, correr un script de reverse (no incluido en scope).

## 12. Commits expected

~13 tasks (similar a B.2). Worktree `feature/physical-count`.
