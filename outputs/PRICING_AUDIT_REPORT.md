# Pricing Audit Report - Facturosv.com

**Fecha:** 2026-03-24
**Preparado por:** Auditoría automatizada (Claude Code)
**Para:** Jose (Republicode) + equipo

---

## Executive Summary

### Estructura Actual
- **3 planes** (no 4 como se pensaba): STARTER ($15), PROFESSIONAL ($65), ENTERPRISE ($199)
- **No existe plan gratuito** — DEMO/TRIAL mapean a STARTER con límites completos
- **11 feature codes** controlados por `PlanFeatureGuard` + `@RequireFeature()` decorator
- **Enforcement dual:** Backend (API guard) + Frontend (UpsellBanner/FeatureGate)

### Hallazgos Clave

1. **Contabilidad en STARTER ($15)** — Feature premium regalado. Debería estar en Professional.
2. **Enterprise débilmente diferenciado** — Solo phone_support es exclusivo. Webhooks y API están en Pro.
3. **6 módulos sin gating** — Cash Flow, Reportes, Sucursales, Payments, Support, Notifications abiertos para todos.
4. **No hay restricción por tipo DTE** — Todos los planes pueden emitir cualquier tipo (01-34).
5. **No existe plan FREE** — Sin funnel de adquisición gratuito.
6. **Inconsistencia frontend** — Sidebar muestra "PRO" badge en recurrentes, pero backend permite recurrentes en STARTER.

### Recomendación
**Opción A: 3 tiers + FREE.** Agregar plan gratuito (10 DTEs/mes), mover contabilidad a Professional, mover webhooks a Enterprise, subir Starter a $19. Ver `PRICING_RECOMMENDATIONS.md` para detalle completo.

---

## Detailed Findings

### 1. Feature Inventory
Ver: [`PRICING_AUDIT.md`](./PRICING_AUDIT.md)

**Resumen rápido:**

| Feature | STARTER $15 | PRO $65 | ENTERPRISE $199 |
|---------|:-----------:|:-------:|:---------------:|
| Facturación (todos los tipos DTE) | ✅ | ✅ | ✅ |
| Contabilidad (cuentas, partidas) | ✅ ⚠️ | ✅ | ✅ |
| Catálogo productos | ✅ (300) | ✅ (1000) | ✅ (∞) |
| Facturas recurrentes | ✅ | ✅ | ✅ |
| Cotizaciones B2B + portal | ❌ | ✅ | ✅ |
| Webhooks | ❌ | ✅ | ✅ |
| API completa | ❌ | ✅ | ✅ |
| Reportes avanzados | ❌ | ✅ | ✅ |
| Logo/Branding | ❌ | ✅ | ✅ |
| Soporte tickets | ✅ (72h) | ✅ (24h) | ✅ (4h) |
| Soporte telefónico | ❌ | ❌ | ✅ |
| Account Manager | ❌ | ❌ | ✅ |
| Cash Flow | ✅* | ✅* | ✅* |
| Reportes básicos | ✅* | ✅* | ✅* |
| Multi-sucursal | ✅* (sin límite) | ✅* (sin límite) | ✅* (sin límite) |

*Sin gating en código — abierto a todos los planes*

### 2. Code Audit Results
Ver: [`EXECUTION_EVIDENCE.md`](./EXECUTION_EVIDENCE.md)

**Archivos clave de enforcement:**
- `apps/api/src/common/plan-features.ts` — Fuente de verdad de planes
- `apps/api/src/modules/plans/guards/plan-feature.guard.ts` — Guard central
- `apps/api/src/modules/plans/services/plan-features.service.ts` — Lógica de límites
- `apps/web/src/hooks/use-plan-features.ts` — Hook frontend

### 3. Pricing Analysis
Ver: [`PRICING_ANALYSIS.md`](./PRICING_ANALYSIS.md)

**Resumen:**
- Salto Starter→Pro es 333% ($15→$65) — necesita plan intermedio o ajuste
- Enterprise solo tiene 1 feature exclusivo (phone_support)
- Break-even estimado: ~17-30 tenants
- Contabilidad en STARTER destruye valor de Professional

### 4. Reordering Recommendations
Ver: [`PRICING_RECOMMENDATIONS.md`](./PRICING_RECOMMENDATIONS.md)

**Resumen de Opción A (recomendada):**
- Crear plan FREE ($0, 10 DTEs/mes, sin contabilidad)
- Mover contabilidad de STARTER a PROFESSIONAL
- Mover webhooks de PROFESSIONAL a ENTERPRISE
- Mover logo/branding de PROFESSIONAL a STARTER
- Subir STARTER de $15 a $19
- Implementar límite de sucursales por plan

### 5. Risk Assessment

| Riesgo | Severidad | Mitigación |
|--------|----------|-----------|
| Tenants STARTER pierden contabilidad | **Alta** | Grandfathering 90 días |
| No hay funnel gratuito | **Alta** | Implementar FREE tier ASAP |
| Enterprise no justifica $199 | **Alta** | Agregar webhooks exclusivo + SSO roadmap |
| Inconsistencia frontend/backend (recurrentes) | **Media** | Verificar BD PlanFeature vs PLAN_CONFIGS |
| 6 módulos sin gating | **Media** | Priorizar Cash Flow y Sucursales |
| Sin API key management implementado | **Media** | Flag `api_full` existe, falta implementación |

### 6. Next Steps

**Inmediato (esta semana):**
1. Decidir si contabilidad en STARTER es intencional o error
2. Verificar PlanFeature data en BD de producción vs PLAN_CONFIGS
3. Decidir entre Opción A, B, o C

**Corto plazo (2-3 semanas):**
4. Implementar plan FREE
5. Reubicar features según opción elegida
6. Agregar gating a Cash Flow y Sucursales
7. Actualizar pricing page y marketing

**Largo plazo (1-3 meses):**
8. Implementar API key management + rate limiting
9. Evaluar SSO/SAML para Enterprise
10. Considerar add-ons (usuarios, sucursales extras)
11. Implementar billing/payments integration

---

## Appendices

- **A:** [`PRICING_AUDIT.md`](./PRICING_AUDIT.md) — Inventario completo de features con código fuente
- **B:** [`PRICING_ANALYSIS.md`](./PRICING_ANALYSIS.md) — Análisis de elasticidad y costo Azure
- **C:** [`PRICING_RECOMMENDATIONS.md`](./PRICING_RECOMMENDATIONS.md) — Propuestas de reordenamiento (3 opciones)
- **D:** [`PRICING_EXECUTION_EVIDENCE.md`](./PRICING_EXECUTION_EVIDENCE.md) — Archivos revisados, snippets, limitaciones
