# EXECUTION_EVIDENCE — Phase 2B: Expand Data Intents

## Summary

- **Original intents:** 8 (INVOICE_COUNT, OVERDUE_INVOICES, REVENUE_SUMMARY, CLIENT_COUNT, TOP_PRODUCTS, MONTHLY_SUMMARY, QUOTE_STATUS, DTE_BREAKDOWN)
- **New intents added:** 11 (TOP_CLIENTS, MONTH_COMPARISON, CLIENT_INVOICES, NEW_CLIENTS, RECENT_INVOICES_TODAY, LATEST_INVOICES, CLIENT_PRODUCTS, TAX_SUMMARY, CLIENT_QUOTES, BRANCH_BREAKDOWN, SALES_PROJECTION)
- **Schema-derived bonus intents:** 3 (PLAN_USAGE, RECURRING_TEMPLATES, HACIENDA_REJECTIONS)
- **Total intents:** 22

## Files Modified

| File | Changes |
|------|---------|
| `apps/api/src/modules/chat/chat-intent.ts` | 22 DataIntent types, `params.clientName` in ClassifiedIntent, `extractClient` flag on rules, `extractClientName()` function, "hoy"/"esta semana" time ranges |
| `apps/api/src/modules/chat/chat-data.service.ts` | 14 new fetch methods (11 phase 2B + 3 bonus), all scoped by tenantId |
| `apps/web/src/lib/chat-suggestions.ts` | Updated dashboard, facturas, clientes, reportes, configuracion suggestions |

## Classifier Test Results

| Mensaje | Intent Esperado | Match? |
|---------|----------------|--------|
| "a quien le facturo mas" | TOP_CLIENTS | ✅ |
| "mejores clientes" | TOP_CLIENTS | ✅ |
| "como me fue comparado con el mes pasado" | MONTH_COMPARISON | ✅ |
| "cuanto le facture a Wellnest" | CLIENT_INVOICES (clientName: Wellnest) | ✅ |
| "clientes nuevos del mes" | NEW_CLIENTS | ✅ |
| "facturas de hoy" | RECENT_INVOICES_TODAY | ✅ |
| "ultimas 5 facturas" | LATEST_INVOICES | ✅ |
| "que productos le vendo a IBEX" | CLIENT_PRODUCTS (clientName: IBEX) | ✅ |
| "cuanto de iva facture" | TAX_SUMMARY | ✅ |
| "cotizaciones de Wellnest" | CLIENT_QUOTES (clientName: Wellnest) | ✅ |
| "ventas por sucursal" | BRANCH_BREAKDOWN | ✅ |
| "a este ritmo cuanto voy a facturar" | SALES_PROJECTION | ✅ |
| "cuanto de mi plan he usado" | PLAN_USAGE | ✅ |
| "facturas recurrentes" | RECURRING_TEMPLATES | ✅ |
| "facturas rechazadas por hacienda" | HACIENDA_REJECTIONS | ✅ |
| "como crear un CCF" | null | ✅ |
| "hola" | null | ✅ |

## Schema-Derived Bonus Intents

### Implemented (3)

| Intent | Model(s) Used | Justification |
|--------|--------------|---------------|
| `PLAN_USAGE` | Tenant, User, Cliente, Plan | Users need to know quota usage before hitting limits |
| `RECURRING_TEMPLATES` | RecurringInvoiceTemplate, Cliente | Shows active recurring invoices and next run dates |
| `HACIENDA_REJECTIONS` | DTE (estado=RECHAZADO, descripcionMh) | Users need to know which documents failed MH validation |

### Considered but NOT implemented

| Intent Idea | Why Not |
|-------------|---------|
| CashFlow / bank reconciliation | No CashFlow model in schema |
| User count / roles | Low chat value — visible in settings |
| Webhook delivery status | Too technical for chat users |
| Import job status | Ephemeral — only useful during active imports |

## Build Output

```
API: npx tsc --noEmit → 0 errors
Web: npx tsc --noEmit → 0 errors (pre-existing e2e type issues only)
```
