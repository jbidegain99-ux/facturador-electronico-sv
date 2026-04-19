# Fase 2.5 — Ajustes Manuales de Inventario (Sub-proyecto B.2)

**Date:** 2026-04-19
**Sub-proyecto:** B.2 (segundo entregable del sub-proyecto B = Inventario; sigue a B.1 Inventory Viewer ya mergeado).
**Depende de:** Fases 1.2–1.6 (InventoryState + InventoryMovement + AccountingService), Fase 2.1 (plan feature `inventory_reports`), Fase 2.4 (InventoryModule backend + `/inventario` UI).

---

## 1. Goal

Permitir al usuario registrar movimientos de inventario manuales fuera del flujo de compras/ventas. Cubre 6 subtipos:

- **Salidas:** ROBO, MERMA, DONACION, AUTOCONSUMO, AJUSTE_FALTANTE.
- **Entradas:** AJUSTE_SOBRANTE.

Cada movimiento:
- Actualiza `InventoryState` (currentQty, currentAvgCost, totalValue).
- Crea un registro en `InventoryMovement` con `sourceType = 'MANUAL_ADJUSTMENT'`.
- Si el tenant tiene feature `accounting` ON, genera un `JournalEntry` con las cuentas mapeadas por subtipo.

Fuera de alcance:
- Generación de DTE fiscal (Comprobante de Donación tipo 15, autofactura tipo 14) — diferido a un sub-proyecto posterior.
- Reversión o edición de ajustes creados — política "inmutable, compensás con ajuste opuesto".
- Conteo físico con CSV — es B.3, proyecto separado.

## 2. Architecture

**Backend:** nuevo módulo `inventory-adjustments` separado de `inventory` (que es read-only por diseño).

- `InventoryAdjustmentService` — crea movement + actualiza state en transacción + (opcionalmente) postea asiento.
- `InventoryAdjustmentController` — 2 endpoints:
  - `POST /inventory/adjustments` (crea)
  - `GET /inventory/adjustments` (lista histórica)
- `CreateAdjustmentDto` + `ListAdjustmentsDto`.
- Module importa `PrismaModule`, `PlansModule`, `AccountingModule`.
- Registrado en `AppModule`.

**Frontend:** un único componente modal reusable:
- `CreateAdjustmentModal` (`apps/web/src/components/inventory/`) con props `{ open, onClose, catalogItemId?, onSuccess }`.
- Triggers:
  - Botón `+ Nuevo ajuste` en header de `/inventario` (abre modal con combobox de ítems).
  - Botón `+ Ajuste` en `/inventario/[catalogItemId]` (abre modal con ítem pre-seleccionado).

**Zero schema changes.** Reusa `InventoryState`, `InventoryMovement`, `JournalEntry` existentes.

## 3. Data model — movement types + accounting

`InventoryMovement.movementType` (valores nuevos):

| Subtipo UI | `movementType` | Dirección | Accounting operation |
|------------|----------------|-----------|----------------------|
| Robo | `SALIDA_ROBO` | Salida | `AJUSTE_ROBO` (nuevo) |
| Merma | `SALIDA_MERMA` | Salida | `AJUSTE_MERMA` (nuevo) |
| Donación | `SALIDA_DONACION` | Salida | `AJUSTE_DONACION` (nuevo) |
| Autoconsumo | `SALIDA_AUTOCONSUMO` | Salida | `AJUSTE_AUTOCONSUMO` (nuevo) |
| Ajuste faltante | `SALIDA_AJUSTE` | Salida | `AJUSTE_FISICO_FALTANTE` (reuso existente) |
| Ajuste sobrante | `ENTRADA_AJUSTE` | Entrada | `AJUSTE_FISICO_SOBRANTE` (reuso existente) |

Campos comunes en el movimiento:
- `sourceType = 'MANUAL_ADJUSTMENT'`
- `sourceId = user.id` (el "source" lógico de un ajuste manual es el usuario que lo creó — evita schema hacks y mantiene `sourceId` non-null sin self-reference circular)
- `createdBy = user.id` (redundante con `sourceId` pero consistente con el resto de movements)
- `supplierId = null`, `supplierNationality = null`
- `documentType = null`, `documentNumber = null`
- `correlativo`: siguiente entero libre para `(tenantId, catalogItemId)` — mismo patrón que compras/ventas.

**Mappings contables nuevos en `default-mappings.data.ts`:**

| Operation | Debe | Haber |
|-----------|------|-------|
| `AJUSTE_ROBO` | `5104` Pérdida por robo | `110401` Inventario Mercadería |
| `AJUSTE_MERMA` | `5105` Merma inventario | `110401` Inventario Mercadería |
| `AJUSTE_DONACION` | `5106` Donaciones | `110401` Inventario Mercadería |
| `AJUSTE_AUTOCONSUMO` | `5107` Gasto autoconsumo | `110401` Inventario Mercadería |

`monto: 'total'` (el asiento se pasa el costo total del movimiento: `quantity * unitCost`).

**Seed de cuentas:** las 4 cuentas nuevas (5104, 5105, 5106, 5107) se agregan al seed del catálogo contable por defecto. Si un tenant existente no las tiene, `AccountingService.post()` falla por cuenta inexistente — el service de adjustments captura el error, loguea un warning, guarda el movimiento sin `journalEntryId`, y el usuario ve toast "Movimiento registrado. Asiento contable pendiente — cuenta XXXX no existe."

## 4. API surface

### POST /inventory/adjustments

**Permisos:** `inventory:adjust` (nuevo). **Feature gate:** `inventory_reports`.

**Request body (`CreateAdjustmentDto`):**

```typescript
{
  catalogItemId: string;  // cuid
  subtype: 'ROBO' | 'MERMA' | 'DONACION' | 'AUTOCONSUMO' | 'AJUSTE_FALTANTE' | 'AJUSTE_SOBRANTE';
  quantity: number;       // > 0, Decimal(15,4)
  unitCost?: number;      // requerido sólo si subtype = 'AJUSTE_SOBRANTE'; ignorado en los demás
  movementDate: string;   // ISO date, >= día 1 del mes actual, <= hoy
  notes?: string;         // max 500 chars
}
```

**Validaciones (backend):**

1. DTO valida con `class-validator`.
2. `CatalogItem` existe para el tenant y `trackInventory = true` → si no, 400 `NOT_TRACKED`.
3. `movementDate`:
   - Parse. Si > hoy → 400 `FUTURE_DATE`.
   - Si < día 1 del mes actual (UTC) → 400 `DATE_BEFORE_MONTH_START`.
4. Para subtipos de salida: leer `InventoryState`. Si no existe o `currentQty < quantity` → 400 `INSUFFICIENT_STOCK { available: N }`.
5. Para `AJUSTE_SOBRANTE`:
   - `unitCost` obligatorio > 0 (sino 400 `MISSING_UNIT_COST`).
   - Si `InventoryState` no existe, se crea con este movimiento.

**Transacción Prisma (service):**

1. Leer `InventoryState` (lock opcional via `FOR UPDATE`, pero Prisma MSSQL no expone esto limpiamente — usamos transacción estándar; race raro en práctica y el constraint `@@unique([tenantId, catalogItemId, correlativo])` impide duplicados de correlativo).
2. Calcular nuevo balance:
   - Salida: `balanceQty = currentQty - quantity`, `balanceAvgCost = currentAvgCost` (invariante), `balanceValue = balanceQty * balanceAvgCost`.
   - Entrada (AJUSTE_SOBRANTE): weighted average — `newQty = currentQty + quantity`, `newAvgCost = (currentQty*currentAvgCost + quantity*unitCost) / newQty`, `newValue = newQty * newAvgCost`.
3. Determinar `unitCost` del movimiento:
   - Salida: `currentAvgCost`.
   - AJUSTE_SOBRANTE: el `unitCost` del request.
4. `correlativo = (max correlativo para (tenant, item)) + 1`.
5. Crear `InventoryMovement`.
6. `UPDATE InventoryState SET currentQty=..., currentAvgCost=..., totalValue=..., lastMovementAt=movementDate`.
7. Si feature `accounting` ON:
   - Invocar `AccountingService.postEntry(...)` con la operation + costo total.
   - Si éxito, actualizar `InventoryMovement.journalEntryId` con el id del asiento.
   - Si falla (cuenta inexistente), loguear warning. No rollback del movimiento (el inventario se actualiza de todas formas).

**Response `200`:**

```typescript
{
  id: string;               // InventoryMovement.id
  movementType: string;     // 'SALIDA_ROBO' | ...
  qtyIn: number; qtyOut: number;
  unitCost: number; totalCost: number;
  balanceQty: number; balanceAvgCost: number; balanceValue: number;
  movementDate: string;     // ISO
  correlativo: number;
  journalEntryId: string | null;
  notes: string | null;
}
```

### GET /inventory/adjustments

**Permisos:** `catalog:read`. **Feature gate:** `inventory_reports`.

**Query params (`ListAdjustmentsDto`):**

- `catalogItemId?`
- `subtype?` (una de las 6)
- `startDate?` / `endDate?` (ISO)
- `page?` (default 1), `limit?` (default 20, max 100)

**Filtro hardcoded:** `sourceType = 'MANUAL_ADJUSTMENT'` siempre aplicado.

**Response:** `{ data: InventoryMovement[], total, totalPages, page, limit }` — mismo shape que `/inventory` de 2.4.

## 5. UI — `CreateAdjustmentModal`

**Props:** `{ open: boolean; onClose: () => void; catalogItemId?: string; onSuccess: () => void }`.

**Layout:**

- Si `catalogItemId` viene en props: encabezado muestra código + descripción + stock actual + costo promedio (fetch `GET /inventory/:catalogItemId`). Sin selector de ítem.
- Si no: combobox que busca en `/catalog-items?trackInventory=true&search=...` con debounce 300ms.
- Radio group con los 6 subtipos (labels: "Robo", "Merma", "Donación", "Autoconsumo", "Ajuste faltante", "Ajuste sobrante").
- `Input type="number"` para cantidad (4 decimales).
- `Input` para `unitCost`:
  - Disabled por defecto mostrando `currentAvgCost`.
  - Habilitado y editable solo si `subtype === 'AJUSTE_SOBRANTE'`.
- `Input type="date"` para `movementDate`, default hoy. Validación client-side: `min` = día 1 del mes, `max` = hoy.
- `Textarea` para `notes` (maxLength 500).
- **Preview contable:** si el tenant tiene `accounting` ON, muestra 2 líneas Debe/Haber con cuentas y monto calculado client-side (`quantity * unitCost`). Mappings se traen 1 sola vez al abrir modal (cache en estado local).
- Botones: `Cancelar` y `Confirmar`.
- Submit deshabilitado mientras validaciones client-side fallan o durante request.
- Error 400 del server → toast rojo con mensaje traducido del código (`INSUFFICIENT_STOCK` → "Stock insuficiente, máximo N disponibles").
- Success → toast verde + `onSuccess()` + cerrar modal.

**Triggers en páginas existentes:**

- `/inventario` header: botón `+ Nuevo ajuste` (ícono `Plus`) al lado del `Exportar XLSX`. Abre `<CreateAdjustmentModal />` sin `catalogItemId`. `onSuccess` → refetch del stock list + alerts.
- `/inventario/[catalogItemId]` header: botón `+ Ajuste` al lado del `StockStatusBadge`. Abre con `catalogItemId` pre-seleccionado. `onSuccess` → refetch del item + kardex + alerts del sidebar.

## 6. RBAC

**Nuevo permiso:** `inventory:adjust`.

- Se añade al array de permissions en `rbac.service.ts`.
- Roles que lo reciben por default: `OWNER`, `ACCOUNTANT`.
- Roles sin este permiso: `CASHIER`, `ANALYST`, `VIEWER`.
- Tenants ya creados: script idempotente (`apps/api/scripts/seed-inventory-adjust-perm.ts`) que se corre una vez post-deploy y agrega `inventory:adjust` a los roles `OWNER`/`ACCOUNTANT` de cada tenant existente + crea las cuentas contables 5104-5107 en los tenants con catálogo estándar.

## 7. Error handling + edge cases

- **Feature flag `inventory_reports` OFF** → 403 `FEATURE_DISABLED` en ambos endpoints. UI oculta botones o muestra CTA upgrade (reusar componente existente).
- **Sin permiso `inventory:adjust`** → botón "+ Nuevo ajuste" oculto en UI (check via `usePermissions`). 403 server-side si alguien llama la API igual.
- **`CatalogItem.trackInventory = false`** → combobox lo filtra out. Si se intenta igual, 400 `NOT_TRACKED`.
- **Salida con stock insuficiente** → 400 `INSUFFICIENT_STOCK { available: N }`. Modal muestra "Máximo: N unidades disponibles" debajo del input de cantidad.
- **Fecha futura** → 400 `FUTURE_DATE`. Client-side previene con `max` en `<input type="date">`.
- **Fecha anterior al mes actual** → 400 `DATE_BEFORE_MONTH_START`. Client-side previene con `min`.
- **Concurrencia (race en stock)** → `$transaction` minimiza ventana. Si dos ajustes concurrentes consumen el mismo stock y el segundo llega con el state ya actualizado, la validación `currentQty < quantity` dispara 409 (conflict) — el UI muestra "Stock actualizado, reintentá".
- **`AJUSTE_SOBRANTE` sin `InventoryState` previo** → service crea el state con `currentQty = quantity`, `currentAvgCost = unitCost`, `totalValue = quantity * unitCost`, `lastMovementAt = movementDate`.
- **Tenant sin feature `accounting`** → solo crea `InventoryMovement`. `journalEntryId = null`. Sin error.
- **Tenant con `accounting` pero cuenta contable faltante** (ej: 5104 no existe porque el tenant usó un catálogo custom) → warning log + movimiento guardado sin `journalEntryId`. Toast: "Movimiento registrado. Asiento contable pendiente — agrega la cuenta 5104."
- **`quantity = 0`** → 400 por validación `@IsPositive`.
- **`quantity` con más de 4 decimales** → trimmed a 4 (Prisma Decimal(15,4)).

## 8. Testing

**Backend unit tests (jest + manual Prisma mock, patrón Fase 2.4):**

`inventory-adjustment.service.spec.ts` (~16 tests):
- Crea movement correctamente para cada uno de los 6 subtipos (direcciones + movementType + operation).
- Actualiza `InventoryState` con weighted average para `AJUSTE_SOBRANTE`.
- Actualiza `InventoryState` dejando `currentAvgCost` invariante para salidas.
- Crea `InventoryState` si no existe (solo válido para `AJUSTE_SOBRANTE`).
- Rechaza `SALIDA_*` si no hay state (→ `INSUFFICIENT_STOCK`).
- Rechaza si `quantity > currentQty` (→ `INSUFFICIENT_STOCK { available }`).
- Rechaza si `CatalogItem.trackInventory = false` (→ `NOT_TRACKED`).
- Rechaza fecha futura / anterior al mes.
- Con feature `accounting` OFF: `journalEntryId = null`.
- Con feature `accounting` ON: llama `AccountingService.postEntry` con la operation correcta.
- Si `AccountingService.postEntry` lanza (cuenta faltante): movimiento se guarda, `journalEntryId = null`, warning logueado.
- `sourceType = 'MANUAL_ADJUSTMENT'`, `sourceId = <movement.id>`.
- `correlativo` = max + 1 para (tenant, item).

`inventory-adjustment.controller.spec.ts` (~5 tests):
- POST calls service con tenantId + user.id + body.
- GET calls service con tenantId + filtros.
- Ambos tiran `ForbiddenException` si `user.tenantId` null.
- Decoradores `@RequirePermission('inventory:adjust')` (POST), `@RequirePermission('catalog:read')` (GET), `@RequireFeature('inventory_reports')`, `@UseGuards(PlanFeatureGuard)`.
- Spec usa `.overrideGuard(PlanFeatureGuard)` (patrón establecido).

**Frontend:** sin unit tests (match con patrón 2.4). Validación via tsc + 1 E2E stub (`test.skip`) para "crear ajuste desde detalle de ítem".

**Regression sweep final** (mismo patrón 2.4):
- `npx jest src/modules/` (API) → conteo de tests debe ser baseline + ~21 nuevos.
- `tsc --noEmit` API + Web → 0 errores nuevos.

## 9. Post-deploy runbook

**Zero schema changes. Requiere seed de cuentas contables (5104–5107) + agregar permiso `inventory:adjust` al seed RBAC.**

Pasos post-deploy:
1. Merge → CI auto-deploy staging.
2. Si es primer deploy de este módulo, correr seed updater:
   - `npx ts-node apps/api/scripts/seed-inventory-adjust-perm.ts` (script nuevo a crear en el plan).
   - Este script agrega `inventory:adjust` a los roles `OWNER` y `ACCOUNTANT` de cada tenant existente y crea las cuentas 5104-5107 en el catálogo contable por defecto si no existen.
3. Login con OWNER → `/inventario` → botón `+ Nuevo ajuste` visible.
4. Crear un ajuste MERMA de 1 unidad → verificar kardex del ítem refleja el movimiento.
5. Con tenant que tiene accounting ON → verificar asiento generado en `/contabilidad`.
6. Probar `INSUFFICIENT_STOCK` intentando robar más de lo disponible.
7. Smoke en prod post-merge.

## 10. Rollback

`git revert <merge-sha>`. Zero schema changes → reversión pura. Los `InventoryMovement` creados vía ajustes quedan en la DB (con `sourceType = 'MANUAL_ADJUSTMENT'`) pero sin UI que los muestre. Si hay que limpiar: script SQL opcional `DELETE FROM inventory_movements WHERE sourceType = 'MANUAL_ADJUSTMENT' AND createdAt >= <deploy_time>`. El permiso `inventory:adjust` queda en los roles pero sin efecto.
