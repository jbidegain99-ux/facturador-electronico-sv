# Análisis de Precios vs Valor - Facturosv.com

**Fecha:** 2026-03-24
**Contexto:** Auditoría de pricing strategy basada en código

---

## 1. Hallazgo Principal: Discrepancia Plan vs Realidad

El brief original describe 4 planes:
- **Gratuito** $0/mes
- **Básico** $25/mes
- **Profesional** $65/mes
- **Empresarial** Custom

El código implementa **3 planes** diferentes:
- **Starter** $15/mes
- **Professional** $65/mes
- **Enterprise** $199/mes

### Implicaciones:
1. **No existe plan gratuito** — Los aliases DEMO/TRIAL mapean a STARTER (con límites completos de 300 DTEs)
2. **"Básico" no existe** — El alias BASIC mapea a STARTER ($15, no $25)
3. **Enterprise tiene precio fijo** ($199), no es "Custom"
4. **El pricing page/marketing puede estar desactualizado** respecto al código

---

## 2. Elasticidad de Precio por Transición

### Starter → Professional ($15 → $65/mes = +333%)

**Features que se desbloquean:**

| Feature | Valor Percibido | Justificación |
|---------|----------------|---------------|
| Cotizaciones B2B + Portal de Aprobación | **Alto** | Reduce tiempo de cierre, profesionaliza proceso de ventas |
| Webhooks | **Medio-Alto** | Automatización con sistemas externos |
| API Completa | **Alto** | Integración con ERP, e-commerce, etc. |
| Reportes Avanzados (balance, estado de resultados, libro mayor) | **Alto** | Cumplimiento contable, decisiones financieras |
| Logo/Branding personalizado | **Bajo** | Cosmético, nice-to-have |

**Límites que aumentan:**

| Límite | Starter | Professional | Factor |
|--------|---------|-------------|--------|
| DTEs/mes | 300 | 2,000 | 6.7x |
| Clientes | 100 | 500 | 5x |
| Usuarios | 3 | 10 | 3.3x |
| Storage | 1 GB | 10 GB | 10x |
| Ítems catálogo | 300 | 1,000 | 3.3x |

**Análisis:**
- **$50/mes de diferencia** ($600/año) es un salto grande (333%)
- Para PYMEs salvadoreñas, $65/mes es significativo
- El salto se justifica SI el negocio necesita cotizaciones + reportes avanzados
- **Riesgo:** Si solo necesitan más DTEs (>300/mes), no hay opción intermedia
- **Gap identificado:** No hay plan intermedio (~$30-35) para negocios que solo necesitan más volumen

### Professional → Enterprise ($65 → $199/mes = +206%)

**Features ADICIONALES que se desbloquean:**

| Feature | Valor Percibido |
|---------|----------------|
| Soporte telefónico | **Medio** |
| Límites ilimitados | **Alto** para empresas grandes |

**Análisis:**
- **Solo 1 feature adicional visible** (phone_support) + límites ilimitados
- **$134/mes adicionales** ($1,608/año) por soporte telefónico + ilimitado
- **Muy difícil de justificar** — El valor percibido es bajo
- Enterprise necesita más diferenciación

---

## 3. Problemas Identificados

### 3.1 CRITICO: Contabilidad en STARTER — ¿Error o intención?

El feature `accounting` está **habilitado en STARTER** ($15/mes):
```typescript
// plan-features.ts:81
accounting: true,  // STARTER tiene contabilidad
```

Esto incluye:
- Catálogo de cuentas
- Partidas de diario
- Posteo automático de facturas
- Dashboard contable

Solo los **reportes avanzados** (balance, estado de resultados) están restringidos a PROFESSIONAL.

**Pregunta:** ¿Es intencional que el módulo contable completo esté en el plan más barato?
- Si es intencional: Es extremadamente generoso para $15/mes
- Si es error: Debería restringirse a PROFESSIONAL mínimo

### 3.2 CRITICO: Facturas recurrentes en STARTER

```typescript
// plan-features.ts:83
recurring_invoices: true,  // STARTER tiene recurrentes
```

Sin embargo, el sidebar muestra badge "PRO" en la ruta `/facturas/recurrentes`:
```typescript
// sidebar.tsx:31
{ key: 'recurring', href: '/facturas/recurrentes', proBadge: true },
```

Y el frontend muestra UpsellBanner cuando `!features.recurringInvoices`.

**INCONSISTENCIA:** El backend dice STARTER tiene recurrentes, pero el frontend le pone badge PRO. El UpsellBanner se mostraría solo si el feature está deshabilitado en BD (override de PLAN_CONFIGS).

### 3.3 ALTO: No hay restricción por tipo de DTE

El prompt original sugería que Gratuito solo tendría tipos 01, 03 y Básico tendría 01, 03, 05, 06.

**Realidad en código:** No existe ninguna restricción por tipo de DTE. Todos los planes pueden emitir cualquier tipo (01-34). Solo hay límite de cantidad (300/2000/ilimitado).

### 3.4 ALTO: Módulos sin ningún gating

Estos módulos NO tienen restricción por plan:
- **Cash Flow** — Dashboard de flujo de caja
- **Reportes básicos** — Ventas por tipo, período, retenciones
- **Sucursales** — Sin límite de branches en código
- **Support Tickets** — Todos pueden crear tickets (no hay SLA enforcement en API)
- **Payments** — Registro de métodos de pago

### 3.5 MEDIO: Enterprise no se diferencia suficiente

Features **exclusivos** de Enterprise:
1. `phone_support` — Único feature booleano exclusivo
2. Límites ilimitados

Features que **deberían ser Enterprise** pero no lo son:
- Webhooks (está en Professional)
- API completa (está en Professional)
- Reportes avanzados (está en Professional)

### 3.6 BAJO: No existe sistema de API Keys

El feature `api_full` existe como flag pero no se encontró un módulo `api-keys` implementado con rate limiting o gestión de keys.

---

## 4. Comparativa de Valor por Plan

### STARTER ($15/mes = $180/año)

**Lo que obtiene el usuario:**
- 300 DTEs/mes (cualquier tipo)
- 100 clientes
- 3 usuarios
- Contabilidad completa (catálogo cuentas, partidas, posteo automático)
- Facturas recurrentes
- Catálogo de productos (300 ítems)
- Soporte por tickets (72h SLA)
- Reportes básicos

**Costo estimado Azure por tenant:** ~$3-5/mes (proporcional compartido)
**Margen bruto:** ~$10-12/mes (67-80%)
**Evaluación:** ✅ Precio competitivo para El Salvador. PERO demasiado generoso en features para el precio.

### PROFESSIONAL ($65/mes = $780/año)

**Lo que obtiene ADICIONAL al Starter:**
- 2,000 DTEs/mes (+567%)
- 500 clientes (+400%)
- 10 usuarios (+233%)
- Cotizaciones B2B + portal de aprobación
- Webhooks
- API completa
- Reportes avanzados (balance, estado resultados, libro mayor)
- Logo/branding
- 10 GB storage

**Costo estimado Azure por tenant:** ~$8-15/mes
**Margen bruto:** ~$50-57/mes (77-88%)
**Evaluación:** ⚠️ Buen margen, pero el salto de precio (333%) puede alejar PYMEs que solo necesitan más volumen.

### ENTERPRISE ($199/mes = $2,388/año)

**Lo que obtiene ADICIONAL al Professional:**
- Ilimitado en todo
- Soporte telefónico
- Account manager (configurable)

**Costo estimado Azure por tenant:** ~$20-40/mes (depende del volumen)
**Margen bruto:** ~$159-179/mes (80-90%)
**Evaluación:** ❌ Débil diferenciación. Solo 1 feature exclusivo visible. No justifica +$134/mes.

---

## 5. Gaps de Mercado Identificados

### Gap 1: Falta plan intermedio ($25-35/mes)
- Para negocios que necesitan >300 DTEs pero no necesitan cotizaciones B2B ni API
- Propuesta: "Business" con 1,000 DTEs, 200 clientes, 5 usuarios

### Gap 2: Falta plan gratuito / freemium
- No hay manera de probar la plataforma sin pagar
- TRIAL mapea a STARTER pero no hay registro de duración del trial
- Propuesta: Free tier con 10 DTEs/mes, 1 usuario, sin contabilidad

### Gap 3: Enterprise no tiene SSO/SAML
- Standard en B2B SaaS para empresas medianas-grandes
- No implementado en código

### Gap 4: No hay add-ons
- Todo es "paquete completo" por tier
- Un usuario que solo necesita API no puede comprarla sin ir a Professional

### Gap 5: No hay control de sucursales por plan
- El código no limita branches por plan
- Una empresa con STARTER podría crear 20 sucursales

---

## 6. Matriz de Costo Azure Estimado

| Recurso | Costo Mensual | Asignación |
|---------|--------------|-----------|
| App Service (API) | ~$50 | Compartido entre todos los tenants |
| App Service (Web) | ~$30 | Compartido |
| Azure SQL | ~$150 | Compartido (DTU-based) |
| Blob Storage | ~$5-20 | Por tenant (logos, PDFs) |
| Email (Graph API) | ~$0 | Incluido en M365 |
| SSL/Dominio | ~$10 | Fijo |
| **Total infra** | **~$245-260/mes** | — |

### Break-even por número de tenants:

| Tenants | Ingreso STARTER | Ingreso PRO | Ingreso MIX (70/30) |
|---------|----------------|------------|---------------------|
| 10 | $150 | $650 | $300 |
| 20 | $300 | $1,300 | $600 |
| **30** | **$450** | **$1,950** | **$900** ✅ Break-even |
| 50 | $750 | $3,250 | $1,500 |
| 100 | $1,500 | $6,500 | $3,000 |

*Break-even estimado: ~17-30 tenants dependiendo del mix de planes*
