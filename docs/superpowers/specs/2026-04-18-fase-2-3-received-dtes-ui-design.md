# Fase 2.3 — DTEs Recibidos UI — Sub-proyecto C

**Date:** 2026-04-18
**Phase:** 2.3 (UI para gestión de DTEs recibidos del cron + import manual)
**Status:** Design — awaiting user review before plan
**Depende de:** Fase 1.3 (parser), 1.4a (orchestrator cron), 1.4c (retry cron), 2.2 (Compras UI + `ReceivedDtesController.preview` endpoint) — **todas merged en main**.

---

## 1. Context

Las Fases 1.3–1.4c construyeron el pipeline de DTEs recibidos: parser (`DteImportParserService`), orchestrator cron que consulta MH, retry cron para `VERIFY_*_RETRY` statuses, y el modelo `ReceivedDTE` en DB. Fase 2.2 expuso `POST /received-dtes/preview` (sin persistir) usado por el modal de import desde `/compras/nueva`.

**Lo que falta:** UI para monitorear, auditar mensualmente, y accionar sobre `ReceivedDTE` rows — reintentar verify MH, re-parsear, importar manualmente (persistente), convertir a compra manualmente.

### Decisiones de brainstorm

| # | Decisión |
|---|---|
| 1 | Scope: full monitoring + retry + manual import + convert |
| 2 | Uso primario: auditoría mensual (no dashboard en tiempo real) |
| 3 | Ubicación: sub-ruta de Compras (`/compras/recibidos`), perm `purchases:read` |
| 4 | Detalle: datos + JSON parseado (items) + JSON crudo + logs de retry MH |
| 5 | Import manual: endpoint nuevo que PERSISTE (distinto de `/preview` de 2.2) |
| 6 | Convertir: redirect a `/compras/nueva?receivedDteId=X` con form pre-llenado |
| 7 | Export: Excel rico con 17 columnas (errores + link a Purchase incluidos) |

---

## 2. Scope

### In scope

**Backend (nuevo):**
- Extender `ReceivedDtesController` con 5 endpoints nuevos + 1 export.
- `ReceivedDtesService` nuevos métodos: `findAll`, `findOne`, `createManual`, `retryMhVerify`, `reParse`.
- `ReceivedDtesExportService` (XLSX via `exceljs`, pattern de Fase 3a/3b/3c).

**Frontend (nuevo):**
- 2 páginas: `/compras/recibidos`, `/compras/recibidos/[id]`.
- 1 modal: `ImportDteManualModal` (persist).
- Sub-nav tabs entre `/compras` y `/compras/recibidos`.
- Modificar orchestrator `/compras/nueva` para aceptar `?receivedDteId=X` (prefill fetch).
- Types: extender `purchase.ts` con `ReceivedDteDetail` interface.

### Out of scope

- **Schema changes:** cero. El modelo `ReceivedDTE` existente cubre todo.
- **XML import:** rechazado con 400 `FORMAT_NOT_SUPPORTED` (igual que `/preview` de 2.2). Futuro si se necesita.
- **Batch actions:** no se puede "retry todos" — fila por fila. User chose auditoría mensual, volumen bajo.
- **Streaming XLSX export:** cap a 10k rows. Si excede → 413 con hint de filtrar.
- **Auto-refresh / polling:** sin websockets ni polling. Refresh manual con botón.
- **Dashboard / charts:** no hay pie/bar charts; user explícitamente eligió list + detail + export (approach A).
- **RBAC cambios:** reutiliza `purchases:read`/`:create` de Fase 2.2. No permisos nuevos.

---

## 3. Architecture

### 3.1 Backend

Extender `ReceivedDtesController` (creado en Fase 2.2). Agregar `ReceivedDtesService` (crear si no existe; si existe como parte del orchestrator cron, extenderlo).

Relación con pipeline existente:
- Orchestrator cron (Fase 1.4a) sigue corriendo en paralelo, crea rows con `ingestSource='CRON'`.
- Manual UI crea rows con `ingestSource='MANUAL'`.
- Retry cron (Fase 1.4c) procesa rows con `ingestStatus` retryable — nuestro `retryMhVerify` es on-demand, reutiliza esa lógica vía helper compartido o invocación directa del service.

### 3.2 Frontend

Dos páginas nuevas + 1 modal. Patrón espejo de `/compras` list + `/compras/[id]` detail (hechos en Fase 2.2).

Sub-nav:
```
[ Compras ] [ DTEs recibidos ]   (segmented buttons arriba en ambas pages)
```

Click cambia entre `/compras` y `/compras/recibidos` preservando filtros comunes (fecha) vía `URLSearchParams`.

### 3.3 Stack

- Backend: NestJS + Prisma (sin cambios de dependencias; `exceljs` ya instalado por Fase 3a).
- Frontend: Next.js App Router, `useState + useEffect` (no SWR), `apiFetch`.

---

## 4. Páginas y layouts

### 4.1 `/compras/recibidos` (list)

**Header:**
- Sub-nav: `[ Compras | DTEs recibidos ]` (activo: DTEs recibidos).
- Título "DTEs recibidos" + total count.
- Botón `+ Importar DTE` (abre `ImportDteManualModal`, persiste).
- Botón `📥 Exportar Excel` (descarga con filtros activos).

**Filtros sticky:**
- Rango fecha `desde` / `hasta` (default: inicio del mes actual → hoy) sobre `fhEmision`.
- Estado pills: `Todos | PENDING | VERIFIED | UNVERIFIED | FAILED | Convertidos (has purchase)`.
- Multi-select tipoDte: 01/03/05/06/07/11/14/15.
- Search input (emisor NIT o nombre parcial).

**Tabla desktop:**
- Columnas: `fhEmision | tipoDte | numeroControl | emisor (NIT + nombre) | estado badge | intentos MH | Purchase ligada (✓/—) | acciones`.
- Badges: PENDING gris, VERIFIED verde, UNVERIFIED amarillo, FAILED rojo.
- Acciones por fila:
  - `👁️ ver` (siempre) → `/compras/recibidos/[id]`.
  - `🔄 retry MH` (si FAILED o UNVERIFIED).
  - `🧩 convertir` (si VERIFIED sin purchase ligada).
- Paginación 20/página server-side.

**Mobile:** cards apiladas (emisor + tipoDte + fecha + estado badge + chevron).
**Empty state:** "No hay DTEs recibidos en este rango. Espera al cron o importa manualmente."

### 4.2 `/compras/recibidos/[id]` (detail)

**Header:**
- "DTE {tipoDte} — {numeroControl}" + estado badge.
- Acción contextual: si `purchase` existe, botón "Ver compra ligada" → `/compras/{purchaseId}`. Si no y VERIFIED, botón "Convertir a compra".

**Tabs (shadcn Tabs):**
1. **Resumen** — 2-col grid:
   - Izq: emisor (NIT + nombre), fecha emisión, fecha procesamiento, sello recepción, código generación, `ingestSource`.
   - Der: totales parseados (si parsedPayload disponible): totalGravada, totalIva, totalPagar, items count.
2. **Items** — tabla de líneas desde `parsedPayload.cuerpoDocumento[]` (numItem, descripcion, cantidad, precioUni, ventaGravada, ivaItem). Si `parsedPayload` null → "No disponible (DTE aún no parseado)".
3. **JSON crudo** — `<pre>` con `rawPayload`. Si >500KB, truncado + botón "Descargar payload completo".
4. **Historial MH** — lista cronológica: `mhVerifyAttempts` count, `lastMhVerifyAt`, `mhVerifyError`, `ingestErrors` (JSON parseado a lista). Si 0 intentos → "Sin verificaciones aún".

**Acciones contextuales en header o action bar:**
- FAILED / UNVERIFIED: `🔄 Reintentar verificación MH` → `POST /:id/retry-mh`.
- PENDING / con parser errors: `🧩 Re-parsear` → `POST /:id/re-parse`.
- VERIFIED sin purchase: `Convertir a compra` → redirect.

### 4.3 `ImportDteManualModal`

Props:
```ts
{ open; onOpenChange; onImported: (dte: ReceivedDteDetail) => void }
```

Form:
- `format` select: JSON (por ahora; XML deshabilitado con tooltip "pronto").
- `content` textarea grande o upload `.json`.
- Botón "Importar" → `POST /received-dtes` → on success redirect `/compras/recibidos/{newId}`.

### 4.4 Cambio en `/compras/nueva` (orchestrator existente)

Agregar en `useEffect` de hidratación:
- Si `searchParams.get('receivedDteId')`: fetch `/received-dtes/X` → mapear `parsedPayload` → setState (proveedor, tipoDoc, numDoc, lineas). Conservar behavior existente de `?source=imported` (sessionStorage).
- Si el DTE ya tiene `purchase` ligada → toast "Este DTE ya tiene Compra registrada" + redirect a `/compras/{purchaseId}`.

---

## 5. Componentes (contratos)

### 5.1 TypeScript types (frontend)

Extender `apps/web/src/types/purchase.ts`:

```ts
export type IngestStatus = 'PENDING' | 'VERIFIED' | 'UNVERIFIED' | 'FAILED' | string;
export type IngestSource = 'CRON' | 'MANUAL' | 'MH_AUTO' | string;

export interface ReceivedDteDetail {
  id: string;
  tenantId: string;
  tipoDte: string;
  numeroControl: string;
  codigoGeneracion: string;
  selloRecepcion: string | null;
  fhProcesamiento: string | null;
  fhEmision: string;
  emisorNIT: string;
  emisorNombre: string;
  rawPayload: string;
  parsedPayload: string | null;
  ingestStatus: IngestStatus;
  ingestErrors: string | null;
  ingestSource: IngestSource;
  mhVerifyAttempts: number;
  lastMhVerifyAt: string | null;
  mhVerifyError: string | null;
  purchase: { id: string; purchaseNumber: string; status: string } | null;
  createdAt: string;
  createdBy: string;
}
```

### 5.2 Backend service signatures

```ts
class ReceivedDtesService {
  async findAll(tenantId: string, filters: {
    page?: number; limit?: number;
    desde?: string; hasta?: string;
    status?: IngestStatus;
    tipoDte?: string;
    search?: string;
    hasPurchase?: boolean;  // para filtro "Convertidos"
  }): Promise<{ data: ReceivedDteDetail[]; total: number; totalPages: number; page: number; limit: number }>;

  async findOne(tenantId: string, id: string): Promise<ReceivedDteDetail>;

  async createManual(
    tenantId: string,
    userId: string,
    dto: { content: string; format: 'json' | 'xml' },
  ): Promise<ReceivedDteDetail>;

  async retryMhVerify(tenantId: string, id: string): Promise<ReceivedDteDetail>;

  async reParse(tenantId: string, id: string): Promise<ReceivedDteDetail>;
}

class ReceivedDtesExportService {
  async exportXlsx(
    tenantId: string,
    filters: /* same as findAll excepto page/limit */,
  ): Promise<Buffer>;
}
```

### 5.3 Mapeo parsedPayload → PurchaseLine

Función client-side en `/compras/nueva/page.tsx`:

```ts
function mapReceivedDteToPurchaseLines(parsed: unknown): PurchaseLine[] {
  const items = (parsed as { cuerpoDocumento?: Array<Record<string, unknown>> })?.cuerpoDocumento ?? [];
  return items.map((it, idx) => ({
    tipo: 'bien',
    itemId: undefined,
    descripcion: String(it.descripcion ?? ''),
    cantidad: Number(it.cantidad ?? 0),
    precioUnit: Number(it.precioUni ?? 0),
    descuentoPct: it.montoDescu && it.cantidad && it.precioUni
      ? (Number(it.montoDescu) / (Number(it.cantidad) * Number(it.precioUni))) * 100
      : 0,
    ivaAplica: Number(it.ventaGravada ?? 0) > 0,
    totalLinea: Number(it.ventaGravada ?? 0) + Number(it.ventaExenta ?? 0),
  }));
}
```

Warning banner en `/compras/nueva` cuando `receivedDteId` presente: "Líneas importadas desde DTE — asigna items del catálogo antes de contabilizar."

---

## 6. Data flow

### 6.1 Endpoints (extender `ReceivedDtesController`)

| Método | Path | Perm | Notas |
|---|---|---|---|
| `GET` | `/received-dtes` | `purchases:read` | paginated, filters |
| `GET` | `/received-dtes/:id` | `purchases:read` | include purchase |
| `POST` | `/received-dtes` | `purchases:create` | manual, `ingestSource='MANUAL'` |
| `POST` | `/received-dtes/:id/retry-mh` | `purchases:create` | invoca MH verify, incrementa attempts |
| `POST` | `/received-dtes/:id/re-parse` | `purchases:create` | re-ejecuta parser sobre rawPayload |
| `GET` | `/received-dtes/export` | `purchases:read` | XLSX stream (Buffer + `Content-Type` `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) |
| `POST` | `/received-dtes/preview` | `purchases:create` | **YA EXISTE** de Fase 2.2; sin cambios |

### 6.2 Export XLSX columnas (17)

| # | Col | Source |
|---|---|---|
| 1 | Fecha emisión | `fhEmision` (formato `YYYY-MM-DD`) |
| 2 | Tipo DTE | `tipoDte` |
| 3 | Código generación | `codigoGeneracion` |
| 4 | Núm. control | `numeroControl` |
| 5 | NIT emisor | `emisorNIT` |
| 6 | Nombre emisor | `emisorNombre` |
| 7 | Estado | `ingestStatus` |
| 8 | Origen | `ingestSource` |
| 9 | Intentos MH | `mhVerifyAttempts` |
| 10 | Última verificación | `lastMhVerifyAt` |
| 11 | Error MH | `mhVerifyError` |
| 12 | Errores parsing | `ingestErrors` (JSON.parse y tomar primer mensaje, o raw) |
| 13 | Sello recepción | `selloRecepcion` |
| 14 | Total gravada | `parsedPayload.resumen.totalGravada` (si null → vacío) |
| 15 | Total IVA | `parsedPayload.resumen.totalIva` |
| 16 | Total pagar | `parsedPayload.resumen.totalPagar` |
| 17 | Purchase ligada | `purchase?.purchaseNumber ?? '—'` |

Header row bold + autofilter. Column widths auto (60-80 chars max).

### 6.3 Frontend flows

**Auditoría mensual:**
```
/compras/recibidos
  → fetch /received-dtes?desde=2026-04-01&hasta=2026-04-30
  → revisar lista
  → export → download XLSX
```

**Resolver fallido:**
```
/compras/recibidos (filter FAILED)
  → click DTE → detail
  → tab Historial MH revela error
  → acción según error:
     - MH caída: retry-mh más tarde
     - Parser falló: re-parse (si hubo cambio en parser)
     - Data corrupta: no recoverable, crear Purchase manual desde /compras/nueva
```

**Import manual:**
```
/compras/recibidos
  → "+ Importar DTE" → modal → pega JSON → Import
  → POST /received-dtes → 201 Created → redirect /compras/recibidos/{newId}
  → estado PENDING (orchestrator lo procesará, o user hace retry-mh)
```

**Convertir:**
```
/compras/recibidos/[id] (VERIFIED, sin purchase)
  → "Convertir a compra" → redirect /compras/nueva?receivedDteId={id}
  → form hidrata con fetch /received-dtes/{id}
  → user asigna items catálogo + contabiliza
  → /compras/[newPurchaseId]
```

### 6.4 Cache / refresh

SIN SWR. Pattern: `useState + useCallback + useEffect` con `refetchKey` que se incrementa tras cualquier acción. Cada página fetcha 1-2 veces en su ciclo de vida.

---

## 7. Edge cases y errors

### 7.1 Backend

| Escenario | Status | Body |
|---|---|---|
| `POST /received-dtes` JSON malformado | 400 | `{ code: 'INVALID_JSON' }` |
| `POST /received-dtes` formato XML | 400 | `{ code: 'FORMAT_NOT_SUPPORTED' }` |
| Duplicado (codigoGeneracion + tenantId) | 409 | `{ code: 'DUPLICATE', existingId }` |
| `GET /:id` no existe / otro tenant | 404 | — |
| `POST /:id/retry-mh` VERIFIED | 409 | `{ code: 'ALREADY_VERIFIED' }` |
| `POST /:id/re-parse` rawPayload null | 409 | `{ code: 'NO_PAYLOAD' }` |
| `GET /export` >10000 rows | 413 | `{ code: 'TOO_MANY', max: 10000 }` |
| MH API down en retry-mh | 503 | `{ code: 'MH_UNAVAILABLE', mhError }` + persistir `mhVerifyError` |

### 7.2 Frontend

| Escenario | Manejo |
|---|---|
| Export 413 | Toast con hint de acotar filtros |
| Import duplicado (409) | Toast + botón "Ver existente" → redirect |
| Retry VERIFIED (409) | Refresh silencioso + toast "Ya verificado" |
| Re-parse sin cambios | Toast "Sin cambios en parsedPayload" |
| `?receivedDteId=X` con purchase ligada | Toast + redirect a `/compras/{purchaseId}` |
| Proveedor DTE no existe en Clientes | Modal "Crear proveedor {NIT}?" al mapear (abre `NuevoProveedorModal` pre-llenado con NIT/nombre) |
| rawPayload >500KB | Truncar en UI + botón descarga |
| Historial MH vacío | "Sin intentos de verificación MH registrados." |

### 7.3 Seguridad

- Todos los endpoints: `JwtAuthGuard` + `TenantGuard` + `@RequirePermission`.
- `rawPayload` nunca se renderiza como HTML — solo `<pre>` o download (mitigación XSS).
- Export: cap 10k para evitar DoS.

---

## 8. Testing

### 8.1 Backend — TDD

**Specs nuevos/extendidos:**
- `received-dtes.service.spec.ts` (crear o extender): 18 casos (5 findAll + 2 findOne + 4 createManual + 4 retryMhVerify + 3 reParse).
- `received-dtes.controller.spec.ts` (extender de Fase 2.2): 12 casos (2 por endpoint nuevo).
- `received-dtes-export.service.spec.ts`: 4 casos (happy, filters, too many, empty).

**Integration e2e:** 1 test opcional — manual import → retry → re-parse → export → verifica buffer.

### 8.2 Frontend — pragmatic

- `ImportDteManualModal` — submit happy + error 409.
- `/compras/recibidos/[id]` tabs — render correcto de Resumen, Items, JSON crudo, Historial.

No testeamos list page (pattern ya probado en /compras) ni export button (descarga trivial).

### 8.3 E2E (Playwright stub)

3 flujos `test.skip` hasta staging env:
1. Auditoría mensual: filter mes → export.
2. Import manual → retry-mh → verified.
3. Convertir VERIFIED → /compras/nueva pre-llenado → contabilizar.

### 8.4 Manual QA

- [ ] Tenant con cron activo: lista muestra VERIFIED con purchase ligada.
- [ ] Import manual JSON válido: aparece PENDING.
- [ ] Retry-mh FAILED → VERIFIED tras éxito MH.
- [ ] Re-parse: parsedPayload se actualiza si parser evolucionó.
- [ ] Export Excel: abrir en Excel, verificar 17 cols + sample rows.
- [ ] Convertir VERIFIED sin purchase: form pre-llenado → contabilizar → purchase visible.

### 8.5 Coverage targets

- Backend: 85%+ en `received-dtes.service.ts` y `received-dtes-export.service.ts`.
- Frontend: 50%+ en modal + detail tabs.

---

## 9. Deployment

### 9.1 Order of operations

1. Merge PR.
2. CI build + deploy (automático).
3. **No schema changes** — no `prisma db push` necesario.
4. **No RBAC changes** — no seed-rbac re-run necesario.
5. Smoke test: login → `/compras/recibidos` → verificar lista + export.
6. Monitor logs 24h por 500s inesperados en `/received-dtes/*`.

### 9.2 Rollback

`git revert <merge-sha>` → CI redeploys. Zero DB changes que revertir.

### 9.3 Post-deploy

- Comunicación interna: "Nueva sub-tab 'DTEs recibidos' en Compras. Export mensual disponible."
- Documentar en runbook: uso del retry-mh vs depender del cron.

---

## 10. Follow-ups

- **Batch actions (retry todos los FAILED de una)** — si volumen crece.
- **XML import support** — requiere conversor XML→JSON antes de parser.
- **Auto-refresh con polling** — si flujo pasa de auditoría mensual a monitoreo diario.
- **Dashboard widget** ("N DTEs fallidos últimas 24h") en `/dashboard`.
- **Sub-proyecto B — Inventario/Kardex UI** (siguiente en orden A→C→**B**→D).
- **Sub-proyecto D — Contabilidad views** (retenciones, cierre mensual).

---

## Self-review (inline)

- **Placeholders:** ninguno.
- **Consistency:** estados `PENDING/VERIFIED/UNVERIFIED/FAILED` consistentes. Endpoints `/received-dtes/*` alineados con `ReceivedDtesController` de Fase 2.2.
- **Scope:** enfocado en C — no toca B (inventario) ni D (contabilidad). Reutiliza todo de 2.2 (controller, perm, DTO).
- **Ambiguity:** "Convertidos" como filtro explicitado = `hasPurchase=true`.
