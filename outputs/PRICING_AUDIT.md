# Inventario Completo de Features por Plan - Facturosv.com

**Fecha:** 2026-03-24
**Autor:** Auditoría automatizada (Claude Code)
**Fuente:** Código base `/home/jose/facturador-electronico-sv`

---

## 1. Estructura Actual de Planes

> **HALLAZGO CRITICO:** El prompt original menciona 4 planes (Gratuito $0, Básico $25, Profesional $65, Empresarial Custom).
> En realidad, el código define **3 planes canónicos** sin plan gratuito:

| Plan | Código | Precio Mensual | Precio Anual | Estado |
|------|--------|---------------|-------------|--------|
| Starter | `STARTER` | $15 | $150 | Activo (default) |
| Professional | `PROFESSIONAL` | $65 | $650 | Activo |
| Enterprise | `ENTERPRISE` | $199 | $2,388 | Activo |

**Fuente:** `apps/api/src/common/plan-features.ts:72-133`

### Aliases Legacy (normalización automática)

| Legacy Code | Se Mapea A |
|-------------|-----------|
| `BASIC` | STARTER |
| `DEMO` | STARTER |
| `TRIAL` | STARTER |
| `PRO` | PROFESSIONAL |
| `PROFESIONAL` | PROFESSIONAL |
| `EMPRESARIAL` | ENTERPRISE |

**Fuente:** `apps/api/src/common/plan-features.ts:139-146`

---

## 2. Catálogo de Features por Plan

### 2.1 Features Booleanos (On/Off)

| Feature Code | Descripción | STARTER | PROFESSIONAL | ENTERPRISE |
|-------------|-------------|---------|-------------|-----------|
| `invoicing` | Facturación electrónica (todos los tipos DTE) | ✅ | ✅ | ✅ |
| `accounting` | Módulo contable (catálogo de cuentas, partidas, libro diario) | ✅ | ✅ | ✅ |
| `catalog` | Catálogo de productos/servicios | ✅ | ✅ | ✅ |
| `recurring_invoices` | Facturas recurrentes (plantillas) | ✅ | ✅ | ✅ |
| `quotes_b2b` | Cotizaciones B2B con portal de aprobación | ❌ | ✅ | ✅ |
| `webhooks` | Endpoints de webhooks | ❌ | ✅ | ✅ |
| `api_full` | Acceso completo a API | ❌ | ✅ | ✅ |
| `advanced_reports` | Reportes avanzados (balance, estado de resultados, libro mayor) | ❌ | ✅ | ✅ |
| `ticket_support` | Soporte por tickets | ✅ | ✅ | ✅ |
| `phone_support` | Soporte telefónico | ❌ | ❌ | ✅ |
| `logo_branding` | Logo y branding personalizado | ❌ | ✅ | ✅ |

### 2.2 Límites Cuantitativos

| Límite | STARTER | PROFESSIONAL | ENTERPRISE |
|--------|---------|-------------|-----------|
| DTEs por mes | 300 | 2,000 | Ilimitado |
| Clientes máx. | 100 | 500 | Ilimitado |
| Usuarios máx. | 3 | 10 | Ilimitado |
| Almacenamiento | 1 GB | 10 GB | Ilimitado |
| Ítems catálogo | 300 | 1,000 | Ilimitado |

### 2.3 Soporte por Plan

| Config | STARTER | PROFESSIONAL | ENTERPRISE |
|--------|---------|-------------|-----------|
| Tickets | ✅ | ✅ | ✅ |
| Tiempo respuesta (hrs) | 72 | 24* | 4* |
| Soporte telefónico | ❌ | ❌ | ✅ |
| Account Manager | ❌ | ❌ | ✅ |

*Configurables en `PlanSupportConfig` en BD*

---

## 3. Mapeo de Features a Código

### 3.1 Guard de Features (Enforcement Central)

**Archivo:** `apps/api/src/modules/plans/guards/plan-feature.guard.ts`
- Implementa `CanActivate`
- Lee metadata `@RequireFeature()` del controlador
- Obtiene plan code del tenant
- Llama `PlanFeaturesService.checkFeatureAccess()`
- Lanza `ForbiddenException` si no tiene acceso
- Registra intento denegado en `TenantFeatureUsage`

**Decorator:** `apps/api/src/modules/plans/decorators/require-feature.decorator.ts:6`
```typescript
export const RequireFeature = (feature: FeatureCode) =>
  SetMetadata(FEATURE_REQUIRED_KEY, feature);
```

### 3.2 Módulo por Módulo

---

#### CONTABILIDAD (`apps/api/src/modules/accounting/`)

| Endpoint | Método | Feature Requerido | Línea |
|----------|--------|------------------|-------|
| `/accounting/config` | GET/PATCH | `accounting` | Controller class-level |
| `/accounting/mappings` | GET/POST/DELETE | `accounting` | Controller class-level |
| `/accounting/accounts` | GET/POST/PATCH | `accounting` | Controller class-level |
| `/accounting/journal-entries` | GET/POST | `accounting` | Controller class-level |
| `/accounting/journal-entries/:id/post` | POST | `accounting` | Controller class-level |
| `/accounting/journal-entries/:id/void` | POST | `accounting` | Controller class-level |
| `/accounting/reports/trial-balance` | GET | **`advanced_reports`** | Line ~367 |
| `/accounting/reports/balance-sheet` | GET | **`advanced_reports`** | Line ~381 |
| `/accounting/reports/income-statement` | GET | **`advanced_reports`** | Line ~394 |
| `/accounting/reports/general-ledger` | GET | **`advanced_reports`** | Line ~410 |
| `/accounting/simulate-invoice` | POST | `accounting` | Controller class-level |
| `/accounting/dashboard` | GET | `accounting` | Controller class-level |

**Guards:** `@UseGuards(PlanFeatureGuard)` + `@RequireFeature('accounting')` a nivel de clase (línea 35-36)
**Reportes:** Override con `@RequireFeature('advanced_reports')` individual

**Frontend:**
- `apps/web/src/app/(dashboard)/contabilidad/page.tsx:175-194` — UpsellBanner si `!features.accounting`
- Subpáginas (cuentas, libro-diario, libro-mayor, balance, resultados) — `router.replace('/contabilidad')` si no tiene feature

---

#### COTIZACIONES B2B (`apps/api/src/modules/quotes/`)

| Endpoint | Método | Feature Requerido | Nota |
|----------|--------|------------------|------|
| `/quotes` (CRUD) | ALL | `quotes_b2b` | Class-level guard |
| `/quotes/:id/send` | POST | `quotes_b2b` | Enviar cotización |
| `/quotes/:id/approve` | POST | `quotes_b2b` | Aprobar |
| `/quotes/:id/convert` | POST | `quotes_b2b` | Convertir a factura |
| `/quotes/:id/create-version` | POST | `quotes_b2b` | Crear nueva versión |
| `/quotes/public/*` | GET/POST | **Ninguno** | Portal público de aprobación (sin auth) |

**Guards:** `@UseGuards(PlanFeatureGuard)` + `@RequireFeature('quotes_b2b')` (línea 82-83)
**Frontend:** No encontrado gating específico en sidebar (posiblemente oculto si no hay feature)

---

#### WEBHOOKS (`apps/api/src/modules/webhooks/`)

| Endpoint | Método | Feature Requerido |
|----------|--------|------------------|
| `/webhooks/endpoints` | GET/POST/PUT/DELETE | `webhooks` |
| `/webhooks/deliveries` | GET | `webhooks` |
| `/webhooks/deliveries/:id/retry` | POST | `webhooks` |

**Guards:** `@UseGuards(PlanFeatureGuard)` + `@RequireFeature('webhooks')` en ambos controllers
**Frontend:** Sidebar muestra badge "PRO" en `/webhooks` (`sidebar.tsx:37`)

---

#### FACTURAS RECURRENTES (`apps/api/src/modules/recurring-invoices/`)

| Endpoint | Método | Feature Requerido |
|----------|--------|------------------|
| `/recurring-invoices` | POST | `recurring_invoices` (runtime check) |
| `/recurring-invoices/:id` | PUT/DELETE | `recurring_invoices` |
| `/recurring-invoices/:id/activate` | POST | `recurring_invoices` |
| `/recurring-invoices` (list) | GET | **Ninguno** |

**Enforcement:** Service method `ensureRecurringAccess(tenantId)` (línea 39) - runtime check, no decorator
**Frontend:** `apps/web/src/app/(dashboard)/facturas/recurrentes/page.tsx:245-248` — `RecurrentesUpsell()` si `!features.recurringInvoices`

---

#### LOGO/BRANDING (`apps/api/src/modules/tenants/`)

| Endpoint | Método | Feature Requerido |
|----------|--------|------------------|
| `/tenants/me/logo` | POST | `logo_branding` |

**Guard:** `@UseGuards(AuthGuard('jwt'), PlanFeatureGuard)` (línea 414)
**Validación:** PNG, JPG, WebP, SVG. Max 2MB.

---

#### REPORTES (`apps/api/src/modules/reports/`)

| Endpoint | Método | Feature Requerido |
|----------|--------|------------------|
| `/reports/by-type` | GET | **Ninguno** |
| `/reports/by-period` | GET | **Ninguno** |
| `/reports/retenciones` | GET | **Ninguno** |
| `/reports/exports` | GET | **Ninguno** |

**HALLAZGO:** Los reportes básicos del módulo `/reports/` NO tienen gating. Solo los reportes financieros del módulo `/accounting/reports/*` están protegidos con `advanced_reports`.

---

#### CATÁLOGO DE PRODUCTOS (`apps/api/src/modules/catalog-items/`)

| Validación | Archivo | Línea |
|-----------|---------|-------|
| `checkPlanLimit(tenantId, count)` | `catalog-items.service.ts` | 80-92 |
| Límite ítems (STARTER=300, PRO=1000, ENT=∞) | `plan-features.ts` | 170 |

**No usa @RequireFeature** - usa validación de límites cuantitativos directamente en service.

---

#### CLIENTES (`apps/api/src/modules/clientes/`)

**Enforcement:** `PlanFeaturesService.checkCustomerLimitExceeded()` (plan-features.service.ts:103)
**No tiene @RequireFeature** - solo límites cuantitativos

---

#### DTE/FACTURACIÓN (`apps/api/src/modules/dte/`)

**Enforcement:** `PlanFeaturesService.checkDTELimitExceeded()` (plan-features.service.ts:96)
**Demo mode:** `isDemoMode(tenant)` para DEMO/TRIAL
**NO hay restricción por tipo de DTE** — todos los tipos están disponibles en todos los planes

---

#### MÓDULOS SIN GATING DE PLAN

| Módulo | Ruta | Protección |
|--------|------|-----------|
| Cash Flow | `/cash-flow/*` | Solo JWT auth |
| Payments | `/payments/*` | Solo JWT auth |
| Sucursales | `/sucursales/*` | Solo JWT auth |
| Dashboard | `/dashboard/*` | Solo JWT auth |
| Notifications | `/notifications/*` | Solo JWT auth |
| Support Tickets | `/support-tickets/*` | Solo JWT auth |
| Reportes básicos | `/reports/*` | Solo JWT auth |

---

## 4. Frontend Feature Gating

### 4.1 Hook Principal

**Archivo:** `apps/web/src/hooks/use-plan-features.ts`
- Cache de 5 minutos a nivel de módulo
- Endpoints: `/plans/features` + `/plans/tenant/features`
- Normaliza plan codes con aliases

### 4.2 Componentes de Gating

| Componente | Archivo | Función |
|-----------|---------|---------|
| `FeatureGate` | `components/plan-features/FeatureGate.tsx` | Wrapper condicional (muestra children o FeatureLocked) |
| `FeatureLocked` | `components/plan-features/FeatureLocked.tsx` | UI de feature bloqueado con CTA upgrade |
| `UpsellBanner` | `components/ui/upsell-banner.tsx` | Banner de upsell con lista de beneficios |

### 4.3 Sidebar Navigation

**Archivo:** `apps/web/src/components/layout/sidebar.tsx:31-45`

Items con badge "PRO":
- `/facturas/recurrentes` — `proBadge: true`
- `/contabilidad` — `proBadge: true`
- `/webhooks` — `proBadge: true`

Badge se muestra cuando `!features.recurringInvoices` (línea 50-51)

### 4.4 Plan Configuration Page

**Archivo:** `apps/web/src/app/(dashboard)/configuracion/plan/page.tsx`
- Muestra uso actual vs límites (DTEs, clientes)
- Barras de progreso con colores (verde <70%, amarillo 70-90%, rojo >=90%)
- Lista de features habilitados/deshabilitados
- CTA "Actualizar" si no es Enterprise → `ventas@republicode.com`

---

## 5. Modelo de Datos (Prisma)

### Tablas Relevantes

| Tabla | Propósito | Archivo | Líneas |
|-------|----------|---------|--------|
| `Plan` | Definición de planes | `schema.prisma` | 780-815 |
| `PlanFeature` | Features por plan (DB-driven) | `schema.prisma` | 817-828 |
| `PlanSupportConfig` | Config de soporte por plan | `schema.prisma` | 830-843 |
| `TenantFeatureUsage` | Tracking de uso por feature | `schema.prisma` | 845-857 |
| `Tenant` (campos plan) | Plan asignado + límites override | `schema.prisma` | 11-102 |

### Campos de Tenant Relevantes

```prisma
plan              String    @default("TRIAL")
planId            String?
planStatus        String    @default("ACTIVE")
planExpiry        DateTime?
maxDtesPerMonth   Int       @default(50)
maxUsers          Int       @default(5)
maxClientes       Int       @default(100)
dtesUsedThisMonth Int       @default(0)
monthResetDate    DateTime?
```

**Nota:** El Tenant tiene campos `maxDtesPerMonth`, `maxUsers`, `maxClientes` que pueden overridear los del Plan. Esto permite personalización por tenant.

---

## 6. API Endpoints para Gestión de Planes

### Admin (`/admin/plans`) — Requiere SuperAdminGuard

| Método | Endpoint | Descripción |
|--------|----------|------------|
| GET | `/admin/plans` | Listar planes con stats |
| POST | `/admin/plans` | Crear plan |
| PUT | `/admin/plans/:id` | Actualizar plan |
| DELETE | `/admin/plans/:id` | Eliminar plan |
| POST | `/admin/plans/seed` | Seed planes por defecto |
| POST | `/admin/plans/tenant/:tenantId/assign` | Asignar plan a tenant |
| GET | `/admin/plans/tenant/:tenantId/usage` | Ver uso de tenant |

### Usuario (`/plans`) — Requiere JWT

| Método | Endpoint | Descripción |
|--------|----------|------------|
| GET | `/plans/active` | Planes disponibles |
| GET | `/plans/my-usage` | Mi uso actual |
| GET | `/plans/features` | Mis features habilitados |
| GET | `/plans/current` | Mi plan completo + uso |
| GET | `/plans/tenant/features` | Features de mi tenant |
| GET | `/plans/tenant/support` | Config de soporte de mi plan |
