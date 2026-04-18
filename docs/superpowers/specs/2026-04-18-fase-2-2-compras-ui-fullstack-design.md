# Fase 2.2 — Compras UI (full-stack) — Sub-proyecto A1

**Date:** 2026-04-18
**Phase:** 2.2 (Compras UI + backend completion, wave 1 de Sub-proyecto A)
**Status:** Design — awaiting user review before plan
**Depende de:** Fase 1.4b (purchase-mapper), 1.5a (reception-workflow), 1.5b (retention-asiento), 1.6 (COGS on sale) — **todas mergeadas y en prod**.

---

## 1. Context

Las Fases 1.3–1.6 construyeron el backend de compras, inventario y contabilidad automática: `PurchasesService`, `PurchaseReceptionService`, mapping rules con retenciones, COGS on sale, DTE import parser. **Ningún endpoint HTTP** fue expuesto, y **ninguna página web** fue creada. El módulo de compras solo existe como servicios internos.

Este spec cubre la **primera ola (A1)** del Sub-proyecto A (Compras UI): compras de **bienes + servicios** locales (Factura / CCF / NCF / NDF / tipo 03). Activos fijos (A2) e importaciones DUCA (A3) quedan fuera.

### Decisiones de diseño (aprobadas en brainstorm)

| # | Decisión |
|---|---|
| 1 | Input: **manual + import DTE** (dos botones claros en `/compras`). |
| 2 | Flujo recepción: **una pantalla por default**, checkbox "Recibiré después" → DRAFT. |
| 3 | Tipo línea: **bien** (inventario + Kardex) o **servicio** (gasto, sin stock), toggle por línea. |
| 4 | Proveedores: **página `/proveedores` dedicada**, CRUD completo, filtra `isSupplier=true`. |
| 5 | Items + cuentas: **inline create** en modales desde el picker. |
| 6 | Retenciones: **auto-detectar** desde flags del proveedor + editable. |
| 7 | Pagos: captura en el mismo form (contado → cuenta + fecha; crédito → vencimiento). |
| 8 | Estados: `DRAFT → POSTED → PAID`, con `ANULADA` para reverso. |
| 9 | UX: desktop + mobile (MobileWizard), shortcuts de teclado, autosave localStorage. |

---

## 2. Scope

### In scope

**Backend (nuevo):**
- `PurchasesController` con 8 endpoints (list, get, create, update, delete, post, pay, anular, receive).
- `ReceivedDtesController` o endpoint en `DteController` con `POST /received-dtes/preview`.
- Extensión `PurchasesService`: métodos `pay()`, `anular()`, `receiveLate()`.
- Schema: 3 campos nuevos en `Cliente` (`esGranContribuyente`, `retieneISR`, `cuentaCxPDefaultId`).
- 8 permisos RBAC nuevos + asignación a roles default.

**Frontend (nuevo):**
- Rutas: `/compras`, `/compras/nueva`, `/compras/[id]`, `/proveedores`, `/proveedores/[id]`.
- Componentes: `PurchaseFormHeader`, `PurchaseLinesTable`, `PurchaseSummaryPanel`, `ProveedorSearch`, `NuevoProveedorModal`, `NuevoItemModal`, `NuevaCuentaModal`, `ImportDteModal`, `PagoModal`, `RecepcionModal`.
- Tipos compartidos: `apps/web/src/types/purchase.ts`.
- Entrada del sidebar: nueva sección "Compras" (icono ShoppingCart).

### Out of scope

- **Activos fijos** (A2 en backlog): no líneas de tipo `activo` en v1.
- **Importaciones DUCA/DI** (A3 en backlog): sin campos aduanales, sin DAI, sin flete.
- **Pagos parciales**: `PAID` es total. Pagos parciales → v2 (módulo de pagos dedicado).
- **Adjuntos (PDF/imagen factura proveedor)**: placeholder visual en `/compras/[id]`, pero no upload funcional en A1.
- **Notas de crédito/débito de compra**: quedan para A1b.
- **Feature gating**: `compras` no se agrega a `plan-features.ts` en A1 (core, todos los planes lo ven). Si se desea gate en el futuro, PR aparte.

---

## 3. Architecture

### 3.1 Patrón espejo del factura editor

El editor de factura (`/facturas/nueva/page.tsx`, 432 líneas) es el patrón a clonar. Componentes análogos:

| Factura (existente) | Compra (nuevo) |
|---|---|
| `InvoiceFormHeader` | `PurchaseFormHeader` |
| `ItemsTable` | `PurchaseLinesTable` |
| `InvoiceSummaryPanel` | `PurchaseSummaryPanel` |
| `ClienteSearch` | `ProveedorSearch` |
| `NuevoClienteModal` | `NuevoProveedorModal` |
| `PaymentMethodModal` | `PaymentMethodModal` (reuso) |
| `MobileWizard` | `MobileWizard` (reuso) |
| `useKeyboardShortcuts` hook | reuso |
| `useOnlineStatus` + `syncQueue` | reuso (offline support) |

### 3.2 Stack

- **Backend:** NestJS 10 + Prisma 5.10 + Jest.
- **Frontend:** Next.js 14 App Router (client components), `useState` + `apiFetch` (mismo patrón que factura), SWR para listas, Zod en modelos de validación.
- **Sin nuevas dependencias.**

### 3.3 Boundaries

- Backend changes son additive-only (nuevas columnas con default `false`, nuevos endpoints, nuevo controller). No tocan código existente salvo registrar el nuevo controller en el módulo.
- Frontend no modifica pages existentes excepto `sidebar.tsx` (agregar entry "Compras" + "Proveedores").

---

## 4. Páginas y layouts

### 4.1 `/compras` (lista)

**Header:**
- Título + contador total.
- Botón `+ Nueva compra manual` (primario, abre `/compras/nueva`).
- Botón `📥 Importar DTE` (secundario, abre `ImportDteModal`).

**Filtros** (toolbar sticky):
- `ProveedorSearch` (autocompletar, clear).
- Estado: pills `Todos | DRAFT | POSTED | PAID | ANULADA`.
- Rango de fecha: date picker `desde`/`hasta` (default: mes actual).

**Tabla (desktop):**
- Columnas: `# control proveedor | proveedor | fecha doc | subtotal | IVA | retenciones | total | estado (badge) | acciones`.
- Acciones por fila: `👁️ ver` (siempre), `✏️ editar` (solo DRAFT), `💰 pagar` (solo POSTED no-PAID).
- Paginación server-side (20 por página).
- Empty state: imagen + CTA "Registra tu primera compra".

**Mobile:**
- Cards apiladas con: proveedor, total, estado, chevron → detalle.
- FAB bottom-right "+ Nueva" (icon ShoppingCart + Plus).
- Filtros en drawer/sheet.

### 4.2 `/compras/nueva`

**Desktop — 2-col layout:**
- **Izquierda (scroll):**
  - `PurchaseFormHeader`: proveedor (ProveedorSearch), fecha doc, fecha contable, tipo doc proveedor (select FC/CCF/NCF/NDF/OTRO), núm control proveedor, sucursal (si aplica).
  - `PurchaseLinesTable`: grid editable (ver §5.1).
  - Botones: `+ Línea bien` (Alt+B), `+ Línea servicio` (Alt+S).
  - Checkbox: **"Recibiré después"** (solo aparece si hay ≥1 línea bien; default off).
- **Derecha (sticky):**
  - `PurchaseSummaryPanel`: subtotal gravado, subtotal exento, IVA 13%, IVA retenido 1% (checkbox auto), ISR retenido % (auto), total.
  - Sección de pago:
    - Radio: `Contado | Crédito`
    - Si contado: `cuenta (caja/banco) picker`, `fecha pago` (default hoy).
    - Si crédito: `fecha vencimiento` (default +30 días).
  - Botones: `Guardar borrador` (DRAFT), `Contabilizar` (POSTED; + PAID si contado).

**Mobile — MobileWizard 4 pasos:**
1. Proveedor + fecha + tipo doc.
2. Líneas.
3. Retenciones + pago.
4. Confirmar (preview resumen).

### 4.3 `/compras/[id]` (detalle)

**Read-only si `POSTED`/`PAID`/`ANULADA`; editable si `DRAFT`.**

**Tabs:**
- `Resumen`: datos header + tabla líneas + totales + retenciones.
- `Asiento`: preview del asiento en Libro Diario (si POSTED/PAID).
- `Recepción`: detalle Kardex si tiene movimiento (si POSTED con recepción).
- `Adjuntos`: placeholder (v2).

**Acciones contextuales:**
- `DRAFT`: `Contabilizar`, `Eliminar`.
- `POSTED` (crédito sin pagar): `Registrar pago`, `Anular`.
- `POSTED` (contado ya pagado): `Anular`.
- `PAID`: `Anular`.
- `ANULADA`: solo ver.

### 4.4 `/proveedores`

- Lista similar a `/clientes`: search + filter + tabla + pagination.
- Columnas: nombre, NIT, NRC, teléfono, gran contribuyente (badge), retiene ISR (badge), #compras.
- Acciones: ver, editar, eliminar (si no tiene compras).
- `+ Nuevo proveedor` → `NuevoProveedorModal` (mismo componente reusado).

### 4.5 `/proveedores/[id]`

- Form de edición (mismo que NuevoProveedorModal pero como page).
- Historial de compras del proveedor (tabla resumida).

---

## 5. Componentes (contratos)

### 5.1 `PurchaseLinesTable`

```tsx
type PurchaseLine =
  | {
      tipo: 'bien';
      itemId: string;         // FK CatalogItem, required
      descripcion: string;    // override opcional
      cantidad: number;
      precioUnit: number;
      descuento: number;      // %
      ivaAplica: boolean;
      totalLinea: number;     // derived
    }
  | {
      tipo: 'servicio';
      descripcion: string;
      cuentaContableId: string; // FK CuentaContable, required
      monto: number;
      ivaAplica: boolean;
      totalLinea: number;     // = monto
    };
```

- **Columnas bien:** `[tipo toggle] [item picker] [desc] [qty] [precio] [desc%] [iva] [total] [🗑]`
- **Columnas servicio:** `[tipo toggle] [desc] [cuenta picker] [monto] [iva] [total] [🗑]`
- Cambiar toggle "tipo" limpia los campos del otro tipo.
- **Atajos:** `Alt+B` nueva bien, `Alt+S` nueva servicio, `Alt+Del` eliminar fila, `Enter`/`Tab` siguiente campo.
- Validación inline por campo con Zod.

### 5.2 `ProveedorSearch`

```tsx
interface Props {
  onSelect: (proveedor: Proveedor) => void;
  selected?: Proveedor;
}
```
- Input con autocomplete.
- Llama `GET /clientes?isSupplier=true&q=...&limit=10` con debounce 300ms.
- Primera opción siempre: **"+ Crear proveedor nuevo"** → abre `NuevoProveedorModal`.
- Al seleccionar invoca `onSelect` y cierra dropdown.

### 5.3 `NuevoProveedorModal`

Form mini con Zod schema:
```ts
nombre: string (required)
tipoDocumento: enum [13, 36, 02, 03] // DUI, NIT, Pasaporte, Carné Residente
numDocumento: string (required)
nrc: string?
correo: email?
telefono: string?
direccion: { departamento, municipio, complemento }
esGranContribuyente: boolean (default false)
retieneISR: boolean (default false)
cuentaCxPDefaultId: string? // picker de cuenta
```
- Submit: `POST /clientes` con `isSupplier: true, isCustomer: false`.
- Sobre éxito: devuelve el `Proveedor` creado al padre y cierra.

### 5.4 `NuevoItemModal` / `NuevaCuentaModal`

- Mini-forms inline desde pickers de línea.
- `NuevoItemModal`: SKU, nombre, unidad de medida, cuenta de inventario, costo inicial (opcional).
  - POST `/catalog-items`.
- `NuevaCuentaModal`: código cuenta, nombre, tipo (ingreso/gasto/activo/pasivo).
  - POST `/accounting/cuentas` (verificar que existe; si no, fuera de scope de A1 — user va a `/contabilidad/cuentas` directo).

### 5.5 `ImportDteModal`

Flujo:
1. User pega JSON o sube archivo `.json`/`.xml`.
2. `POST /received-dtes/preview` con body `{ content, format: 'json' | 'xml' }`.
3. Backend parsea con `ReceivedDteParserService` (Fase 1.3) sin persistir.
4. Preview UI: proveedor detectado (crea si no existe?), líneas normalizadas, totales, retenciones.
5. `[Confirmar y editar]` → navega a `/compras/nueva` con state serializado en React Context/store.
6. Form se rellena y user puede ajustar antes de contabilizar.

### 5.6 `PurchaseSummaryPanel`

Props:
```tsx
interface Props {
  lines: PurchaseLine[];
  proveedor?: Proveedor;
  formaPago: 'contado' | 'credito';
  cuentaPagoId?: string;
  fechaPago?: Date;
  fechaVencimiento?: Date;
  onPagoChange: (...) => void;
  onSave: (estado: 'DRAFT' | 'POSTED') => void;
}
```
- Calcula en real-time: subtotal gravado/exento, IVA 13%, IVA retenido 1% (si `proveedor.esGranContribuyente`), ISR retenido (si `proveedor.retieneISR`), total.
- Retenciones son checkboxes editables (override sobre auto-detect).
- Radio contado/crédito + campos condicionales.
- Botones "Guardar borrador" y "Contabilizar" (si `formaPago==='contado'` → POSTED+PAID atómicamente).

### 5.7 `PagoModal`

Input:
```ts
fechaPago: Date
cuentaSalidaId: string (picker caja/banco)
monto: number (default = saldo pendiente)
referencia: string?
```
- Submit: `POST /purchases/:id/pay`.
- On success: cierra modal, refetch detalle, muestra PAID.

### 5.8 `RecepcionModal`

Para compras POSTED sin recepción (checkbox "Recibiré después" fue marcado al contabilizar).
Input:
```ts
fechaRecepcion: Date
lineas: { lineId, cantidadRecibida, sucursalId, observaciones? }[]
```
- Submit: `POST /purchases/:id/receive` con el payload.
- Backend crea InventoryMovement (Fase 1.5a) y ajusta Kardex + weighted avg.

### 5.9 Tipos compartidos nuevos

`apps/web/src/types/purchase.ts`:
```ts
export type PurchaseStatus = 'DRAFT' | 'POSTED' | 'PAID' | 'ANULADA';
export type TipoDocProveedor = 'FC' | 'CCF' | 'NCF' | 'NDF' | 'OTRO';
export type FormaPago = 'contado' | 'credito';

export interface Proveedor extends Cliente {
  isSupplier: true;
  esGranContribuyente: boolean;
  retieneISR: boolean;
  cuentaCxPDefaultId: string | null;
}

export interface Purchase {
  id: string;
  tenantId: string;
  proveedorId: string;
  proveedor?: Proveedor;
  tipoDoc: TipoDocProveedor;
  numDocumentoProveedor: string;
  fechaDoc: string;
  fechaContable: string;
  estado: PurchaseStatus;
  lineas: PurchaseLine[];
  subtotal: number;
  iva: number;
  ivaRetenido: number;
  isrRetenido: number;
  total: number;
  formaPago: FormaPago;
  cuentaPagoId?: string;
  fechaPago?: string;
  fechaVencimiento?: string;
  saldoPendiente: number;
  asientoId?: string;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseLine = /* unión bien | servicio — ver §5.1 */;
```

---

## 6. Data flow

### 6.1 Schema changes

Migración additive (safe, no data loss):

```prisma
model Cliente {
  // ...existentes
  esGranContribuyente  Boolean @default(false)
  retieneISR           Boolean @default(false)
  cuentaCxPDefaultId   String?
  cuentaCxPDefault     CuentaContable? @relation("CuentaCxPDefault", fields: [cuentaCxPDefaultId], references: [id])
}
```

Aplicación: `prisma db push` post-merge, sin backfill (todos default `false`).

### 6.2 Endpoints backend

**`PurchasesController` (nuevo):**

| Método + path | Entrada | Salida | Permiso | Estados permitidos |
|---|---|---|---|---|
| `POST /purchases` | `CreatePurchaseDto` | `Purchase` | `purchases:create` | — |
| `GET /purchases` | query: `page, limit, proveedorId?, estado?, desde?, hasta?` | `{ data: Purchase[], total, totalPages }` | `purchases:read` | — |
| `GET /purchases/:id` | — | `Purchase` con `lineas`, `asiento`, `recepcion` | `purchases:read` | — |
| `PATCH /purchases/:id` | `UpdatePurchaseDto` | `Purchase` | `purchases:update` | DRAFT only |
| `DELETE /purchases/:id` | — | `{ success: true }` | `purchases:delete` | DRAFT only |
| `POST /purchases/:id/post` | `{ formaPago, cuentaPagoId?, fechaPago?, fechaVencimiento? }` | `Purchase` | `purchases:post` | DRAFT → POSTED / PAID |
| `POST /purchases/:id/pay` | `{ fechaPago, cuentaSalidaId, monto, referencia? }` | `Purchase` | `purchases:pay` | POSTED → PAID |
| `POST /purchases/:id/anular` | `{ motivo }` | `Purchase` | `purchases:anular` | POSTED/PAID → ANULADA |
| `POST /purchases/:id/receive` | `{ fechaRecepcion, lineas }` | `Purchase + movimientos` | `purchases:receive` | POSTED sin recepción |

**`ReceivedDtesController` (nuevo):**

| Método + path | Entrada | Salida |
|---|---|---|
| `POST /received-dtes/preview` | `{ content: string, format: 'json' \| 'xml' }` | `{ proveedor, lineas, totales, retenciones, warnings? }` |

Este endpoint NO persiste nada — solo parsea y normaliza.

**`ClientesController` — cambios:**
- Verificar `GET /clientes` soporta `?isSupplier=true`. Si no, agregar filtro.
- Verificar `PATCH /clientes/:id`. Si no existe, agregar.
- Actualizar `CreateClienteDto` y `UpdateClienteDto` para aceptar los 3 campos nuevos.

### 6.3 RBAC

8 permisos nuevos en `PermissionSeeder`:
- `purchases:read`
- `purchases:create`
- `purchases:update`
- `purchases:delete`
- `purchases:post`
- `purchases:pay`
- `purchases:anular`
- `purchases:receive`

Asignación default a roles:
- `OWNER`: todos.
- `ADMIN`: todos.
- `ACCOUNTANT`: todos salvo `delete`.
- `CASHIER`: solo `read`, `create`, `pay`.
- `VIEWER`: solo `read`.

### 6.4 Frontend data flow

**Alta manual happy path:**
```
/compras/nueva
  → ProveedorSearch: GET /clientes?isSupplier=true&q=X
  → (opcional) NuevoProveedorModal: POST /clientes
  → PurchaseLinesTable:
      bien: CatalogSearch → GET /catalog-items?q=
      servicio: CuentaSearch → GET /accounting/cuentas?q=
  → PurchaseSummaryPanel: auto-calcula retenciones
  → Contabilizar: POST /purchases { estado: 'POSTED', ... }
  → redirect /compras/[id]
```

**Import DTE:**
```
ImportDteModal
  → POST /received-dtes/preview
  → user confirma
  → navigate /compras/nueva con state en memory
  → form prefilled → flujo normal
```

**Pago tardío:**
```
/compras/[id] POSTED
  → "Registrar pago" → PagoModal
  → POST /purchases/:id/pay
  → refetch → muestra PAID
```

### 6.5 Cache / optimistic

- **SWR** para `/compras` list; `mutate()` tras cada acción.
- **Autosave localStorage** en `/compras/nueva`: clave `purchase-draft-{tenantId}`, cada 5s, limpia al submit exitoso.
- **Invalidate** tras POST/PAY/ANULAR: `cash-flow`, `accounting/libro-diario`, `inventory/kardex`.

---

## 7. Edge cases y errors

### 7.1 Backend

| Escenario | Status | Body |
|---|---|---|
| Mapping rule faltante al POST | 409 | `{ code: 'MAPPING_MISSING', detalle, link: '/contabilidad/mappings' }` + compra queda DRAFT |
| Proveedor `esGranContribuyente` pero falta cuenta IVA Retenido | 422 | `{ code: 'CUENTA_RETENCION_MISSING', campo: 'ivaRetenido' }` |
| Duplicado (`numDocProveedor + proveedorId + tenantId`) | 409 | `{ code: 'DUPLICATE', purchaseId: <existing> }` |
| Anular con Kardex ya consumido por ventas | 409 | `{ code: 'KARDEX_CONSUMED', ventas: [...] }` |
| Import DTE tipo no soportado | 400 | `{ code: 'TIPO_NO_SOPORTADO', tipoDetectado }` |
| Pago > saldo pendiente | 422 | `{ code: 'PAGO_EXCEDE_SALDO', saldo }` |
| Edit en POSTED/PAID/ANULADA | 409 | `{ code: 'STATE_IMMUTABLE', estado }` |
| Sin permiso | 403 | `{ code: 'FORBIDDEN', missing: [...] }` |

### 7.2 Frontend

| Escenario | Manejo |
|---|---|
| Offline + "Guardar borrador" | Encolar en `syncQueue`, badge "pendiente sync". |
| Offline + "Contabilizar" | Bloquear botón + toast "requiere conexión". |
| Cerrar tab con cambios | `useBeforeUnload` confirmación nativa; localStorage autosave mitiga. |
| Retención auto pero override manual | Checkbox en `PurchaseSummaryPanel` siempre wins sobre auto. |
| 409 duplicado | Toast con botón "Ver compra existente" → redirect. |
| 422 mapping faltante | Banner rojo en panel + link a `/contabilidad/mappings`. Botón "Contabilizar" disabled hasta resolver. |
| Validación Zod cliente | Mensajes por campo + highlight rojo. |
| Item del catálogo eliminado durante DRAFT abierto | Warning en línea afectada + permitir re-seleccionar. |

### 7.3 Seguridad

- Todos los endpoints detrás de `JwtAuthGuard` + `TenantGuard`.
- `@RequirePermission('purchases:...')` por endpoint.
- No feature gating en A1 (core módulo).

---

## 8. Testing

### 8.1 Backend (TDD red primero, patrón Fase 1.x)

**Specs nuevos:**
- `purchases.controller.spec.ts` — 8 endpoints × {happy, unauthorized, wrong state, validation} = ~20-25 casos.
- `received-dtes-preview.spec.ts` — 4-5 casos (JSON válido, XML válido, tipo no soportado, formato inválido).

**Extender specs existentes:**
- `purchases.service.spec.ts`:
  - `pay()` — 4 casos.
  - `anular()` — 5 casos (happy, sin asientos, Kardex consumido, COGS bloqueante, permisos).
  - `receiveLate()` — 3 casos.

**Integration e2e (SuperTest):**
- 1 test que recorre DRAFT → POSTED → PAID → ANULADA verificando asientos contables y Kardex rows.

**Migration smoke:**
- Verificar `prisma db push` aplica 3 columnas nuevas sin data loss.

### 8.2 Frontend (pragmatic)

**Component tests (Jest + RTL, si patrón existente lo permite):**
- `PurchaseLinesTable` — toggle bien/servicio limpia campos, validación por fila, atajos teclado.
- `PurchaseSummaryPanel` — cálculo retenciones auto + override.
- `ProveedorSearch` + `NuevoProveedorModal` — create inline flow.
- `ImportDteModal` — preview → confirm → state prefill.

**No testeamos:**
- `/compras` lista (SWR trivial).
- `/proveedores` CRUD (modales ya probados).
- `/compras/[id]` tabs (view-mostly).

### 8.3 E2E (Playwright MCP)

3 flujos:
1. **Happy manual:** login → `/compras/nueva` → crear proveedor inline → 2 líneas (bien + servicio) → contado → contabilizar → verificar `/contabilidad/libro-diario`.
2. **Import DTE:** subir fixture JSON → preview → confirmar → ajustar → contabilizar.
3. **Anular con constraint:** crear → contabilizar → anular → verificar 409 si Kardex consumido por venta.

### 8.4 Manual QA

- [ ] Tenant de cada plan: sidebar muestra "Compras" y "Proveedores".
- [ ] Crear compra contado → ver asiento en Libro Diario.
- [ ] Crear compra crédito → marcar pagada → verifica PAID + asiento de pago.
- [ ] Recepción tardía → `RecepcionModal` → verifica Kardex.
- [ ] Anular compra → confirma reverso contable + devolución Kardex.
- [ ] Mobile: crear compra completa sin bugs layout (MobileWizard 4 pasos).
- [ ] Offline: guardar borrador sin conexión + reconectar → sync automático.

### 8.5 Coverage targets

- Backend: 85%+ en `purchases.*` y `received-dtes-preview`.
- Frontend: 60%+ en componentes clave (no chase UI trivia).

---

## 9. Deployment

### 9.1 Order of operations

1. Merge PR.
2. CI build + deploy API + Web (auto en push to main).
3. `prisma db push` contra prod — aplica 3 columnas nuevas sin data loss.
4. Smoke test: login prod → `/compras` → crear compra test → verificar asiento.
5. Monitor logs 24h.

### 9.2 Rollback

- `git revert <merge-sha>` → CI redeploya.
- Columnas DB quedan; no afectan runtime previo (additive).
- Permisos RBAC nuevos quedan; no afectan usuarios existentes (solo los que los usan).

### 9.3 Post-deploy runbook

- Actualizar doc de roles/permisos si existe.
- Comunicación interna: "Nueva sección 'Compras' + 'Proveedores' en sidebar. Training breve." 
- Monitorear 402/403 por si algún permiso fue mal asignado.

---

## 10. Follow-ups

Post-A1 backlog:

- **A2 — Activos fijos:** líneas tipo `activo`, depreciación, registro AF. Brainstorm aparte.
- **A3 — Importaciones DUCA/DI:** campos pólizas aduanales, flete, DAI. Brainstorm aparte.
- **A1b — Adjuntos:** upload PDF/imagen de factura proveedor al Blob store. PR chica.
- **A1c — Pagos parciales:** módulo `/pagos` dedicado. Expande `PAID` a `PARTIAL | PAID`. Spec aparte.
- **Sub-proyecto C — DTEs Recibidos:** UI para el cron de import + retry manual.
- **Sub-proyecto B — Inventario / Kardex visual:** lista items + movimientos en vivo + conteos físicos.
- **Sub-proyecto D — Contabilidad vistas nuevas:** `/contabilidad/retenciones`, cierre mensual.

---

## Self-review (inline)

- **Placeholders:** ninguno.
- **Internal consistency:** §4.1-4.5 coherentes con §5.x contratos y §6.2 endpoints. Estados `DRAFT/POSTED/PAID/ANULADA` consistentes en todo el doc.
- **Scope:** enfocado en A1 (bienes+servicios locales). A2/A3/A1b/A1c explícitamente fuera.
- **Ambiguity:** `ANULADA` se explicitó (decisión implícita en pregunta 9; se agregó para integridad contable, justificado en §5.5-estados y §7.1).
