# Evidencia de Ejecución - Auditoría de Pricing

**Fecha:** 2026-03-24
**Método:** Análisis estático de código (sin acceso a BD de producción)

---

## 1. Archivos Revisados

### Core Plan System
| Archivo | Líneas | Contenido |
|---------|--------|----------|
| `apps/api/prisma/schema.prisma` | 780-857 | Modelos Plan, PlanFeature, PlanSupportConfig, TenantFeatureUsage |
| `apps/api/src/common/plan-features.ts` | 1-186 | PlanCode enum, FeatureCode type, PLAN_CONFIGS (3 planes), aliases, getPlanFeatures() |
| `apps/api/src/modules/plans/plans.service.ts` | 1-357 | CRUD de planes, assignPlanToTenant, getTenantUsage, checkLimit, seedDefaultPlans |
| `apps/api/src/modules/plans/services/plan-features.service.ts` | 1-140 | checkFeatureAccess, checkDTELimitExceeded, checkCustomerLimitExceeded, getTenantUsageInfo |
| `apps/api/src/modules/plans/services/plan-support.service.ts` | 1-71 | SupportConfig interface, getSupportConfig, getTicketResponseTime |
| `apps/api/src/modules/plans/guards/plan-feature.guard.ts` | completo | PlanFeatureGuard (CanActivate), reads @RequireFeature metadata |
| `apps/api/src/modules/plans/decorators/require-feature.decorator.ts` | completo | @RequireFeature(feature) decorator |
| `apps/api/src/modules/plans/plans.controller.ts` | completo | Admin + User endpoints para planes |
| `apps/api/src/modules/plans/dto/plan.dto.ts` | completo | CreatePlanDto, UpdatePlanDto, AssignPlanDto |

### Módulos con Feature Gating
| Archivo | Guard/Feature |
|---------|--------------|
| `apps/api/src/modules/accounting/accounting.controller.ts` | `@RequireFeature('accounting')` class-level + `@RequireFeature('advanced_reports')` en reportes |
| `apps/api/src/modules/quotes/quotes.controller.ts` | `@RequireFeature('quotes_b2b')` class-level (línea 82-83) |
| `apps/api/src/modules/webhooks/webhook-endpoints.controller.ts` | `@RequireFeature('webhooks')` class-level |
| `apps/api/src/modules/webhooks/webhook-deliveries.controller.ts` | `@RequireFeature('webhooks')` class-level |
| `apps/api/src/modules/recurring-invoices/recurring-invoices.controller.ts` | Runtime check `ensureRecurringAccess()` (línea 39) |
| `apps/api/src/modules/tenants/tenants.controller.ts` | `@RequireFeature('logo_branding')` en POST `/tenants/me/logo` (línea 414-416) |
| `apps/api/src/modules/catalog-items/catalog-items.service.ts` | `checkPlanLimit()` (línea 80-92) |

### Módulos SIN Feature Gating (verificados)
| Archivo | Verificación |
|---------|-------------|
| `apps/api/src/modules/cash-flow/cash-flow.controller.ts` | Sin @RequireFeature, solo JwtAuthGuard |
| `apps/api/src/modules/payments/payments.controller.ts` | Sin @RequireFeature, solo JwtAuthGuard |
| `apps/api/src/modules/sucursales/sucursales.controller.ts` | Sin @RequireFeature, sin límite de branches |
| `apps/api/src/modules/reports/reports.controller.ts` | Sin @RequireFeature, reportes básicos abiertos |
| `apps/api/src/modules/support/support.controller.ts` | Sin @RequireFeature, todos crean tickets |
| `apps/api/src/modules/notifications/notifications.controller.ts` | Sin plan gating, solo auth + admin guards |

### Frontend Feature Gating
| Archivo | Contenido |
|---------|----------|
| `apps/web/src/hooks/use-plan-features.ts` | Hook principal: PlanFeatures interface, FeatureCode type, cache 5min, aliases |
| `apps/web/src/hooks/use-plan-support.ts` | PlanSupportConfig interface, defaults STARTER |
| `apps/web/src/components/plan-features/FeatureGate.tsx` | Wrapper condicional: children vs FeatureLocked |
| `apps/web/src/components/plan-features/FeatureLocked.tsx` | UI locked con CTA → `/configuracion/plan` |
| `apps/web/src/components/ui/upsell-banner.tsx` | Banner upsell purple con lista de benefits |
| `apps/web/src/components/layout/sidebar.tsx` | Items con proBadge: recurrentes, contabilidad, webhooks |
| `apps/web/src/app/(dashboard)/configuracion/plan/page.tsx` | Plan config page: usage bars, features list, upgrade CTA |
| `apps/web/src/app/(dashboard)/facturas/recurrentes/page.tsx` | UpsellBanner si !features.recurringInvoices (línea 245) |
| `apps/web/src/app/(dashboard)/contabilidad/page.tsx` | UpsellBanner si !features.accounting (línea 175) |
| `apps/web/src/app/(dashboard)/contabilidad/cuentas/page.tsx` | router.replace si !features.accounting (línea 199) |
| `apps/web/src/app/(dashboard)/soporte/page.tsx` | SLA display condicional, SLA status indicators |

---

## 2. Búsquedas Realizadas

| Búsqueda | Patrón | Resultados |
|----------|--------|-----------|
| Feature guards en API | `@RequireFeature` | 6 archivos (accounting, quotes, webhooks x2, recurring, tenants) |
| Plan codes | `PlanCode`, `STARTER`, `PROFESSIONAL`, `ENTERPRISE` | Definidos en plan-features.ts |
| Legacy aliases | `BASIC`, `DEMO`, `TRIAL`, `GRATUITO`, `FREE` | GRATUITO/FREE no existe en código activo |
| Frontend gating | `features.accounting`, `features.recurringInvoices` | 15+ archivos |
| Límites | `checkLimit`, `checkDTELimit`, `checkCustomerLimit` | 4 archivos |
| Pricing | `precioMensual`, `monthly`, `price` | plan-features.ts, schema.prisma |

---

## 3. Code Snippets Clave

### Plan Configs (Fuente de verdad)
```typescript
// apps/api/src/common/plan-features.ts:72-133
STARTER:      { monthly: 15,  yearly: 150,  dtes: 300,   customers: 100, users: 3,  storage: 1 }
PROFESSIONAL: { monthly: 65,  yearly: 650,  dtes: 2000,  customers: 500, users: 10, storage: 10 }
ENTERPRISE:   { monthly: 199, yearly: 2388, dtes: -1,    customers: -1,  users: -1, storage: -1 }
```

### Feature Guard Check
```typescript
// apps/api/src/modules/plans/guards/plan-feature.guard.ts
const featureRequired = this.reflector.get<FeatureCode>(FEATURE_REQUIRED_KEY, context.getHandler());
const hasAccess = await this.planFeaturesService.checkFeatureAccess(planCode, featureRequired);
if (!hasAccess) throw new ForbiddenException(`Tu plan actual (${planCode}) no incluye...`);
```

### Catalog Limit Check
```typescript
// apps/api/src/modules/catalog-items/catalog-items.service.ts:80-92
const maxItems = config.limits.dtes === -1 ? -1 : Math.min(config.limits.dtes, 1000);
if (maxItems !== -1 && currentCount + additionalItems > maxItems) {
  throw new ForbiddenException(`Límite de ítems alcanzado`);
}
```

### Frontend Gating Pattern
```typescript
// apps/web/src/app/(dashboard)/contabilidad/page.tsx:175-194
if (!planLoading && !features.accounting) {
  return <UpsellBanner title={t('upsellTitle')} features={[...]} />;
}
```

---

## 4. Limitaciones del Análisis

1. **Sin acceso a BD de producción** — No se verificaron datos reales de PlanFeature ni PlanSupportConfig
2. **Sin acceso a analytics** — No se puede confirmar distribución actual de tenants por plan
3. **Sin acceso a billing** — No se verificó si hay sistema de cobro activo
4. **Prompts legacy** — Archivos como `ACCOUNTING_MODULE_PROMPT.md` mencionan planes FREE/BASIC que ya no existen en código
5. **Override por tenant** — Los campos en Tenant pueden overridear PLAN_CONFIGS. El análisis se basa en config hardcoded.
