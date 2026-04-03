# Recomendaciones de Pricing - Facturosv.com

**Fecha:** 2026-03-24
**Estado:** Propuesta (sin implementar)

---

## 1. Feature Relocation Matrix

### Features mal ubicados actualmente

| Feature | Plan Actual | Plan Recomendado | Razón | Impacto |
|---------|------------|-----------------|-------|---------|
| Contabilidad completa | STARTER ($15) | PROFESSIONAL ($65) | Feature premium que justifica upgrade. Darla en $15 destruye valor de Pro | Justifica $65, aumenta conversión Starter→Pro |
| Facturas recurrentes | STARTER ($15) | STARTER (mantener) | Feature commodity para retención. Bajo costo de soporte | Mantener para retención |
| Reportes básicos (ventas) | Sin gating | STARTER | Deberían estar disponibles en todos los planes | Ya están accesibles |
| Reportes avanzados (contables) | PROFESSIONAL | PROFESSIONAL (mantener) | Correcto, requiere módulo contable | — |
| Webhooks | PROFESSIONAL | ENTERPRISE | Alta complejidad infra, rate limiting. Diferencia Enterprise | Justifica Enterprise $199 |
| API completa | PROFESSIONAL | PROFESSIONAL (mantener) | Necesario para integraciones PYMEs | — |
| Cotizaciones B2B | PROFESSIONAL | PROFESSIONAL (mantener) | Feature de alto valor, bien posicionado | — |
| Logo/Branding | PROFESSIONAL | STARTER | Bajo costo, aumenta adopción y profesionalismo | Mejora retención Starter |
| Soporte telefónico | ENTERPRISE | ENTERPRISE (mantener) | Alto costo operativo, correcto | — |
| Cash Flow | Sin gating | PROFESSIONAL | Feature de valor, no debería ser gratis | Justifica Pro |
| Multi-sucursal | Sin límite | Limitar: STARTER=1, PRO=5, ENT=∞ | Complejidad de datos crece con branches | Nueva palanca de upgrade |

### Features que FALTAN y dónde agregarlos

| Feature | Plan Sugerido | Prioridad | Justificación |
|---------|-------------|-----------|---------------|
| Plan Gratuito (trial) | FREE (nuevo) | **CRITICA** | Funnel de adquisición. 10 DTEs/mes, 1 usuario |
| Límite de sucursales | STARTER=1, PRO=5 | **ALTA** | Monetizar multi-branch |
| SSO/SAML | ENTERPRISE | **MEDIA** | Standard B2B, diferencia Enterprise |
| API Key management + rate limiting | PROFESSIONAL | **ALTA** | `api_full` flag existe pero no hay implementación |
| Data export (CSV/Excel) | PROFESSIONAL | **MEDIA** | Valor para decisiones de negocio |
| Auditoría/compliance reports | ENTERPRISE | **BAJA** | Compliance para empresas reguladas |
| Whitelabel / custom domain | ENTERPRISE | **BAJA** | Para revendedores o agencias |
| SLA garantizado (99.9%) | ENTERPRISE | **MEDIA** | Diferenciación Enterprise |

---

## 2. Propuestas de Estructura de Precios

### Opción A: Mantener 3 tiers + Agregar Free (RECOMENDADA)

```
FREE ($0/mes)
├── 10 DTEs/mes (cualquier tipo)
├── 1 usuario
├── 10 clientes
├── 1 sucursal
├── Facturación básica
├── Sin contabilidad
├── Sin reportes
├── Sin soporte (solo docs/FAQ)
└── Badge "Powered by Facturosv"

STARTER ($19/mes → subir de $15)
├── 300 DTEs/mes
├── 3 usuarios
├── 100 clientes
├── 1 sucursal
├── Facturación completa (todos los tipos)
├── Facturas recurrentes
├── Catálogo de productos (300 items)
├── Logo/Branding personalizado ← MOVER AQUÍ
├── Reportes básicos (ventas, retenciones)
├── Soporte por tickets (72h SLA)
└── 1 GB storage

PROFESSIONAL ($65/mes → mantener)
├── 2,000 DTEs/mes
├── 10 usuarios
├── 500 clientes
├── 5 sucursales ← NUEVO LÍMITE
├── Todo lo de Starter +
├── Contabilidad completa ← MOVER AQUÍ (desde Starter)
├── Cotizaciones B2B + portal aprobación
├── Reportes avanzados (balance, resultados, libro mayor)
├── Cash Flow dashboard ← NUEVO GATING
├── API completa
├── Export CSV/Excel ← NUEVO
├── Soporte por tickets (24h SLA)
└── 10 GB storage

ENTERPRISE ($199/mes → mantener, o custom para >$300)
├── Ilimitado en todo
├── Sucursales ilimitadas
├── Todo lo de Professional +
├── Webhooks ← MOVER AQUÍ (desde Professional)
├── SSO/SAML ← NUEVO (cuando se implemente)
├── Soporte telefónico
├── Account Manager dedicado
├── SLA 99.9% garantizado
├── Auditoría/compliance reports
└── Storage ilimitado
```

**Impacto en revenue:**
- Free → Starter conversion ~5-10% = funnel de adquisición
- Starter $15→$19 = +27% en revenue por tenant Starter
- Mover contabilidad a Pro = más conversiones Starter→Pro
- Mover webhooks a Enterprise = justifica mejor el $199

---

### Opción B: 4 Tiers (agregar "Business" intermedio)

```
FREE ($0/mes) — igual que Opción A

STARTER ($15/mes — mantener precio)
├── 200 DTEs/mes (reducir de 300)
├── 2 usuarios (reducir de 3)
├── 50 clientes (reducir de 100)
├── 1 sucursal
├── Facturación básica
├── Sin contabilidad
├── Reportes básicos
├── Soporte por tickets (72h)
└── 500 MB storage

BUSINESS ($35/mes — NUEVO)
├── 1,000 DTEs/mes
├── 5 usuarios
├── 200 clientes
├── 3 sucursales
├── Facturación + recurrentes
├── Contabilidad completa
├── Catálogo extendido (500 items)
├── Logo/Branding
├── Soporte por tickets (48h)
└── 5 GB storage

PROFESSIONAL ($75/mes — subir de $65)
├── 3,000 DTEs/mes
├── 15 usuarios
├── 1,000 clientes
├── 10 sucursales
├── Todo lo de Business +
├── Cotizaciones B2B + portal
├── Reportes avanzados
├── Cash Flow
├── API completa
├── Export CSV/Excel
├── Soporte por tickets (24h)
└── 20 GB storage

ENTERPRISE ($249/mes — subir de $199)
├── Ilimitado
├── Todo lo de Pro +
├── Webhooks
├── SSO/SAML
├── Soporte telefónico + Account Manager
├── SLA 99.9%
└── Storage ilimitado
```

**Ventaja:** Más opciones de segmentación, captura PYMEs medianas
**Desventaja:** Más complejidad de gestión, más confusión para el usuario

---

### Opción C: Usage-Based (Futuro — largo plazo)

```
Base ($25/mes incluye):
├── 1 usuario
├── 1 sucursal
├── 100 DTEs/mes
├── 50 clientes
├── Facturación + reportes básicos

Add-ons:
├── +$0.05 por DTE adicional (después de 100)
├── +$5/mes por usuario adicional
├── +$10/mes por sucursal adicional
├── +$15/mes módulo Contabilidad
├── +$15/mes módulo Cotizaciones B2B
├── +$20/mes API + Webhooks
├── +$10/mes Reportes Avanzados

Tope: $199/mes = todo ilimitado (Enterprise equivalent)
```

**Ventaja:** Pricing granular, cada cliente paga por lo que usa
**Desventaja:** Requiere billing engine complejo, difícil de comunicar, no recomendado para mercado SV actual

---

## 3. Recomendación Final

### Implementar Opción A (3 tiers + Free)

**Razones:**
1. **Menor complejidad** — Solo 1 tier nuevo (FREE), no requiere rewrite de billing
2. **Mayor impacto** — Mover contabilidad a Pro genera upgrades inmediatos
3. **Mercado SV** — 4+ opciones confunden a PYMEs salvadoreñas
4. **Funnel claro:** Free → Starter → Professional → Enterprise

### Prioridad de implementación:

| Paso | Acción | Esfuerzo | Impacto |
|------|--------|----------|---------|
| 1 | Crear plan FREE en `plan-features.ts` | 2h | Alto — funnel de adquisición |
| 2 | Mover `accounting` de STARTER features a PROFESSIONAL | 1h | Alto — justifica upgrade |
| 3 | Agregar gating a Cash Flow (`@RequireFeature`) | 1h | Medio — nueva palanca |
| 4 | Implementar límite de sucursales por plan | 4h | Medio — nueva palanca |
| 5 | Mover `webhooks` a ENTERPRISE-only | 30min | Medio — justifica Enterprise |
| 6 | Mover `logo_branding` a STARTER | 30min | Bajo — mejora retención |
| 7 | Subir precio STARTER $15→$19 | Config | Medio — +27% revenue/tenant |
| 8 | Actualizar pricing page / marketing | 2h | Alto — comunicar cambios |

### Timeline sugerido:
- **Semana 1:** Pasos 1-3 (plan FREE + reubicación de features)
- **Semana 2:** Pasos 4-6 (nuevos gatings + ajustes)
- **Semana 3:** Pasos 7-8 (precios + comunicación)
- **Grandfathering:** Tenants existentes mantienen features actuales por 90 días

---

## 4. Evaluación de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Tenants STARTER pierden contabilidad | Alta | Alto | Grandfathering 90 días + notificación |
| Free tier genera soporte sin revenue | Media | Medio | Sin soporte en Free, solo docs |
| Pocos Enterprise sign-ups por débil diferenciación | Alta | Alto | Agregar webhooks exclusivo + SSO roadmap |
| Competidores ofrecen gratis (ContaPortable) | Alta | Medio | Free tier + mejor UX como diferenciador |
| Confusión por cambio de nombres (Básico→Starter) | Media | Bajo | Comunicación clara, aliases legacy ya existen |

---

## 5. Métricas de Éxito

Medir después de 90 días de implementación:

| Métrica | Target |
|---------|--------|
| Free→Starter conversion rate | >5% |
| Starter→Professional upgrade rate | >10% (vs actual) |
| Enterprise churn | <5%/trimestre |
| Revenue por tenant promedio | +15% |
| Nuevos signups (Free) | +200%/mes |
| NPS post-cambio | >40 |
