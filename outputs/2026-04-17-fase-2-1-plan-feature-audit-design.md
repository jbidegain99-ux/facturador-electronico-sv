# Fase 2.1 — Plan Feature Gating Audit

**Date:** 2026-04-17
**Phase:** 2.1 (audit + realineamiento de feature gating cross-module)
**Status:** Audit report — approved matrix, ready for implementation plan
**Branch (este PR):** `feature/plan-feature-audit`
**Depende de:** Fase 2 merged ✅

---

## 1. Propósito

Alinear el feature gating actual con la intención declarada por el dueño del producto:

> "Módulo contable solo accesible desde Enterprise ($199). Inventario completo desde Pro ($65). Contabilidad full en Enterprise y advanced reports también."

**Este documento es solo auditoría** — no modifica código. Produce:
- Gap analysis entre estado actual e intención.
- Matriz objetivo aprobada.
- Inventario concreto de cambios (file:line).
- Checklist de implementación ejecutable en PR separada.

---

## 2. Estado actual

### 2.1 Feature codes (13 totales)

Definidos en `apps/api/src/common/plan-features.ts:17-30`:

`invoicing`, `accounting`, `catalog`, `recurring_invoices`, `quotes_b2b`, `webhooks`, `api_full`, `advanced_reports`, `ticket_support`, `phone_support`, `logo_branding`, `external_email`, `hacienda_setup_support`.

### 2.2 Matriz actual (`PLAN_CONFIGS`)

| Feature | FREE | STARTER ($19) | PROFESSIONAL ($65) | ENTERPRISE ($199) |
|---|:-:|:-:|:-:|:-:|
| invoicing | ✅ | ✅ | ✅ | ✅ |
| **accounting** | ❌ | ✅ | ✅ | ✅ |
| catalog | ✅ | ✅ | ✅ | ✅ |
| recurring_invoices | ❌ | ✅ | ✅ | ✅ |
| quotes_b2b | ❌ | ❌ | ✅ | ✅ |
| webhooks | ❌ | ❌ | ❌ | ✅ |
| api_full | ❌ | ❌ | ❌ | ✅ |
| **advanced_reports** | ❌ | ❌ | ✅ | ✅ |
| ticket_support | ✅ | ✅ | ✅ | ✅ |
| phone_support | ❌ | ❌ | ❌ | ✅ |
| logo_branding | ❌ | ✅ | ✅ | ✅ |
| external_email | ❌ | ❌ | ✅ | ✅ |
| hacienda_setup_support | ❌ | ❌ | ✅ | ✅ |

### 2.3 Usos en código (inventario)

**Decoradores `@RequireFeature` (16 usos):**

| File:Line | Feature code |
|---|---|
| `apps/api/src/modules/reports/reports.controller.ts:253` | `advanced_reports` (kardex/item) |
| `apps/api/src/modules/reports/reports.controller.ts:285` | `advanced_reports` (kardex/book) |
| `apps/api/src/modules/reports/reports.controller.ts:308` | `advanced_reports` (iva-declaracion) |
| `apps/api/src/modules/reports/reports.controller.ts:328` | `advanced_reports` (cogs-statement) |
| `apps/api/src/modules/quotes/quotes.controller.ts:85` | `quotes_b2b` |
| `apps/api/src/modules/accounting/accounting.controller.ts:37` | `accounting` (controller-level) |
| `apps/api/src/modules/accounting/accounting.controller.ts:383` | `advanced_reports` |
| `apps/api/src/modules/accounting/accounting.controller.ts:398` | `advanced_reports` |
| `apps/api/src/modules/accounting/accounting.controller.ts:412` | `advanced_reports` |
| `apps/api/src/modules/accounting/accounting.controller.ts:429` | `advanced_reports` |
| `apps/api/src/modules/webhooks/controllers/webhook-deliveries.controller.ts:25` | `webhooks` |
| `apps/api/src/modules/webhooks/controllers/webhook-endpoints.controller.ts:48` | `webhooks` |
| `apps/api/src/modules/tenants/tenants.controller.ts:449` | `logo_branding` |
| `apps/api/src/modules/email-config/email-config.controller.ts:45` | `external_email` |

**Service-level checks (6 files):**
- `apps/api/src/modules/catalog-items/catalog-items.service.ts`
- `apps/api/src/modules/sucursales/sucursales.service.ts`
- `apps/api/src/modules/recurring-invoices/recurring-invoices.controller.ts:43`
- `apps/api/src/modules/plans/services/plan-support.service.ts`
- `apps/api/src/modules/plans/services/plan-features.service.ts`
- `apps/api/src/modules/plans/plans.service.ts`

**Frontend consumers:**
- `apps/web/src/hooks/use-plan-features.ts:22-34` — `FeatureCode` union type con los 13 codes.
- `apps/web/src/components/plan-features/` — componentes UI que consumen features.
- `apps/web/src/app/(super-admin)/admin/planes/` — super-admin UI para gestión de planes.
- `apps/web/src/app/(dashboard)/configuracion/plan/` — tenant UI para ver plan.
- `apps/web/src/app/page.tsx` — landing page pricing.
- `apps/web/src/components/admin/tenant-plan-manager.tsx`.

**Tests:**
- `apps/api/src/modules/plans/guards/plan-feature.guard.spec.ts`
- `apps/api/src/modules/plans/services/plan-features.service.spec.ts`
- `apps/api/src/modules/plans/__tests__/plan-feature.guard.spec.ts`
- `apps/api/src/modules/plans/__tests__/plan-features.service.spec.ts`
- `apps/api/src/modules/reports/reports.controller.spec.ts` (8 tests — no ejerce gates, dependen de guard override en Test module).

---

## 3. Gaps identificados

### 3.1 `accounting` demasiado disponible

**Actual:** `accounting: true` en STARTER, PROFESSIONAL, ENTERPRISE.
**Esperado:** `accounting: true` solo en ENTERPRISE.
**Impacto:** Hoy clientes pagando $19 (Starter) y $65 (Pro) tienen acceso al módulo contable completo. Debería ser exclusivo de $199.

### 3.2 `advanced_reports` atrapa reportes de inventario y contabilidad en el mismo gate

**Actual:** los 4 endpoints de reportes fiscales (Kardex, Kardex Book, IVA F07, COGS Statement) usan `@RequireFeature('advanced_reports')`. Ese feature está en Pro+.
**Problema:** Kardex es un reporte de inventario (debe estar en Pro junto a catálogo/inventario). IVA F07 + COGS son reportes contables/fiscales (deben estar en Enterprise).
**Esperado:** dividir los 4 endpoints en 2 gates distintos.

---

## 4. Matriz objetivo (aprobada)

### 4.1 Cambios a feature codes

**Modificar 2 existentes:**
- `accounting` — mover de Starter+ → **Enterprise only**.
- `advanced_reports` — mover de Pro+ → **Enterprise only**. Queda como "reportes avanzados contables/fiscales".

**Agregar 1 nuevo:**
- `inventory_reports` — nuevo feature code, Pro+. Gate para Kardex (reporte de inventario según Art. 142-A Código Tributario).

**Sin cambios a los otros 11 features.**

### 4.2 Matriz final

| Feature | FREE | STARTER ($19) | PROFESSIONAL ($65) | ENTERPRISE ($199) |
|---|:-:|:-:|:-:|:-:|
| invoicing | ✅ | ✅ | ✅ | ✅ |
| catalog | ✅ | ✅ | ✅ | ✅ |
| ticket_support | ✅ | ✅ | ✅ | ✅ |
| recurring_invoices | ❌ | ✅ | ✅ | ✅ |
| logo_branding | ❌ | ✅ | ✅ | ✅ |
| hacienda_setup_support | ❌ | ❌ | ✅ | ✅ |
| external_email | ❌ | ❌ | ✅ | ✅ |
| quotes_b2b | ❌ | ❌ | ✅ | ✅ |
| **inventory_reports** (nuevo) | ❌ | ❌ | ✅ | ✅ |
| phone_support | ❌ | ❌ | ❌ | ✅ |
| webhooks | ❌ | ❌ | ❌ | ✅ |
| api_full | ❌ | ❌ | ❌ | ✅ |
| **accounting** | ❌ | ~~✅~~ → ❌ | ~~✅~~ → ❌ | ✅ |
| **advanced_reports** | ❌ | ❌ | ~~✅~~ → ❌ | ✅ |

---

## 5. Inventario de cambios por archivo

### 5.1 Backend (`apps/api/src/`)

**`common/plan-features.ts`:**
- Línea 17-30: extender `FeatureCode` type union agregando `'inventory_reports'`.
- Línea 32-46: agregar `'inventory_reports'` a `ALL_FEATURE_CODES`.
- Líneas 106-126 (STARTER.features): cambiar `accounting: true` → `accounting: false`.
- Líneas 128-149 (PROFESSIONAL.features): cambiar `accounting: true` → `accounting: false`, `advanced_reports: true` → `advanced_reports: false`. Agregar `inventory_reports: true`.
- Líneas 150-171 (ENTERPRISE.features): agregar `inventory_reports: true`.
- Línea 90-104 (FREE.features): agregar `inventory_reports: false`.

**`modules/reports/reports.controller.ts`:**
- Línea 253 (`getKardexItem`): cambiar `@RequireFeature('advanced_reports')` → `@RequireFeature('inventory_reports')`.
- Línea 285 (`getKardexBook`): cambiar `@RequireFeature('advanced_reports')` → `@RequireFeature('inventory_reports')`.
- Línea 308 (`getIvaDeclaracion`): sin cambio (queda en `advanced_reports`, ahora Enterprise-only).
- Línea 328 (`getCogsStatement`): sin cambio (queda en `advanced_reports`, ahora Enterprise-only).

**`modules/accounting/accounting.controller.ts`:**
- Línea 37 (controller-level `@RequireFeature('accounting')`): sin cambio al nombre del decorador (sigue `accounting`), pero el comportamiento cambia porque el feature ahora solo se cumple en Enterprise.
- Líneas 383, 398, 412, 429: sin cambio (siguen en `advanced_reports`, ahora Enterprise-only).

**DB seed / migration:**
- Si existen filas en tabla `PlanFeature` para cada combinación `planCode × featureCode`, necesitamos insertar filas para `inventory_reports` (4 filas: uno por plan) y actualizar las filas de `accounting` y `advanced_reports` según la nueva matriz.
- Verificar existencia de tabla y filas: `SELECT * FROM PlanFeature` vía Prisma (revisar `apps/api/prisma/schema.prisma` para modelo `PlanFeature`).
- Si tabla existe, crear migration script tipo `migrations/YYYYMMDD-realign-plan-features.ts` o seed script que haga upsert.

### 5.2 Frontend (`apps/web/src/`)

**`hooks/use-plan-features.ts`:**
- Línea 22-34: agregar `'inventory_reports'` al `FeatureCode` union type.
- Extender `PlanFeatures` interface si hay un campo boolean correspondiente (por defecto ya se deriva del feature code).

**`app/page.tsx` (landing pricing section):**
- Buscar el texto actual de Professional (que probablemente menciona "contabilidad" o "reportes avanzados") y actualizar para decir "Inventario completo + Kardex".
- Buscar el texto actual de Enterprise y asegurar que enfatice "Contabilidad completa + Reportes fiscales + API".
- Línea estimada: alrededor de la sección pricing (verificar file completo).

**`app/(super-admin)/admin/planes/page.tsx`:**
- Mostrar la nueva feature `inventory_reports` en la UI de edición de planes.

**`app/(dashboard)/configuracion/plan/page.tsx`:**
- Si muestra lista de features del plan actual, agregar `inventory_reports` a la lista.

**`components/plan-features/`:**
- Cualquier componente que muestre feature por nombre amigable — agregar label ES para `inventory_reports` (p.ej. "Reportes de inventario (Kardex)").

**`components/admin/tenant-plan-manager.tsx`:**
- Revisar si hay checkboxes/toggles por feature code. Si es data-driven (via hook), el cambio se propaga automáticamente. Si hardcoded, agregar.

### 5.3 Tests a actualizar

**`apps/api/src/modules/plans/services/plan-features.service.spec.ts`:**
- Cualquier test que asuma `accounting: true` en Starter/Pro — actualizar assertions.
- Agregar tests para `inventory_reports` (Pro+ tiene, Free/Starter no).

**`apps/api/src/modules/plans/__tests__/plan-features.service.spec.ts`:**
- Mismas actualizaciones que arriba.

**`apps/api/src/modules/plans/guards/plan-feature.guard.spec.ts`:**
- Si hay tests que mockean un tenant con plan PROFESSIONAL + verifican `advanced_reports`, actualizar.

**`apps/api/src/modules/plans/__tests__/plan-feature.guard.spec.ts`:**
- Igual.

**`apps/api/src/modules/reports/reports.controller.spec.ts` (Fase 2):**
- No requiere actualización — los tests overriding el guard no ejercen el feature check real. Los endpoints cambian de `advanced_reports` a `inventory_reports` en 2 casos pero el override elimina el check.

---

## 6. Impacto a customers actuales

**Directiva del producto owner:** hard cutoff, sin grandfathering. Tenants que pierdan acceso deben upgrade o dejar de usar el feature.

**Acciones recomendadas antes del deploy:**

1. **Query preparación** (se puede correr sin aprobar nada):
   ```sql
   -- Tenants que pierden acceso a accounting
   SELECT t.id, t.nombre, t.nit, t.planCode
   FROM Tenant t
   WHERE t.planCode IN ('STARTER', 'PROFESSIONAL', 'BASIC', 'PRO', 'PROFESIONAL');

   -- De esos, cuáles están usando accounting activamente (tienen JournalEntries)
   SELECT DISTINCT t.id, t.nombre, COUNT(je.id) as journal_entries_count
   FROM Tenant t
   JOIN JournalEntry je ON je.tenantId = t.id
   WHERE t.planCode IN ('STARTER', 'PROFESSIONAL', 'BASIC', 'PRO', 'PROFESIONAL')
   GROUP BY t.id, t.nombre;
   ```

2. **Comunicación** (opcional): si hay clientes activos, email informando el cambio con opción de upgrade a Enterprise.

3. **Deploy:** se pushea `plan-features.ts` y los decoradores en la misma PR. Una vez deployed, los clientes Pro que accedan a endpoints `@RequireFeature('accounting')` o `@RequireFeature('advanced_reports')` reciben HTTP 402 (o 403 según guard behavior).

4. **Monitor post-deploy:** revisar logs de 402/403 por 24-48h para detectar clientes que golpean las nuevas gates.

---

## 7. Plan de implementación (PR siguiente)

Un solo PR, ~6 tareas:

1. **Update `plan-features.ts`** — modificar matriz + agregar `inventory_reports`.
2. **Update `reports.controller.ts`** — cambiar 2 decoradores de Kardex a `inventory_reports`.
3. **Update frontend type** — agregar `'inventory_reports'` al `FeatureCode` union en `use-plan-features.ts`.
4. **Update tests** — actualizar assertions en `plan-features.service.spec.ts` y relacionados. Agregar tests para `inventory_reports`.
5. **DB seed/migration** — si hay tabla `PlanFeature` en DB, upsert rows según nueva matriz. Si no, skip.
6. **Landing page + admin UI** — actualizar texto pricing y labels de features. Si preferís, spawn como PR separada después.

**Regla de oro:** cero grandfathering, sin flags por-tenant. Todo plan-based.

---

## 8. Rollback plan

Si algo sale mal post-deploy:

1. **Revert commit:** `git revert <SHA>` y `npm run deploy` (revierte `plan-features.ts` a estado previo).
2. **Data:** no hay schema changes, así que no hay migration a revertir. Los PlanFeature rows agregados pueden quedarse (no afectan el comportamiento del guard si `plan-features.ts` vuelve a la config anterior).
3. **Comunicación:** si algún cliente golpeó error, notificar individual.
4. **Monitoring:** alertar en el dashboard de errores si hay más de N 402/403 en X minutos post-deploy.

---

## 9. Criterios de aceptación del implementation PR

- [ ] `plan-features.ts` muestra la matriz final aprobada en §4.2.
- [ ] `inventory_reports` agregado a todos los lugares donde se enumeran features (type union backend, type union frontend, ALL_FEATURE_CODES, seed si aplica).
- [ ] Kardex endpoints (`/reports/kardex/item/:id` y `/reports/kardex/book`) usan `@RequireFeature('inventory_reports')`.
- [ ] IVA F07 y COGS Statement endpoints siguen con `@RequireFeature('advanced_reports')`.
- [ ] `accounting` controller sigue gated con `@RequireFeature('accounting')` (ahora Enterprise-only por la config).
- [ ] Tests actualizados: assertions de feature availability reflejan nueva matriz.
- [ ] Regresión: baseline post-Fase 2 (301 passing) + N tests nuevos/modificados, sin regresiones.
- [ ] TypeScript compila limpio.
- [ ] Frontend pricing page refleja la nueva oferta por plan.
- [ ] Admin UI muestra `inventory_reports` editable.
- [ ] Manual QA: probar cada gate con los 4 planes posibles.

---

## 10. Referencias

- `apps/api/src/common/plan-features.ts` — config actual.
- `outputs/2026-04-17-fase-2-reports-api-frontend-design.md` §1 — cómo Fase 2 asumió `advanced_reports` para todos los reportes.
- Memoria `user_role`: "modulo contable solo se pueda acceder desde la subscripcion enterprise $200 al mes y el inventario completo desde la pro $65".
- Memoria: "contabilidad quede full en enterprise y advanced reports tambien".
