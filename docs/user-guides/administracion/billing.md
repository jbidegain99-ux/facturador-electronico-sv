# Plan y Facturación

## Planes Disponibles

| Característica | FREE | STARTER | PROFESSIONAL | ENTERPRISE |
|---------------|------|---------|--------------|------------|
| **Precio mensual** | $0 | $19 | $65 | $199 |
| **Precio anual** | $0 | $190 | $650 | $2,388 |
| **DTEs/mes** | 10 | 300 | 2,000 | Ilimitado |
| **Usuarios** | 1 | 3 | 10 | Ilimitado |
| **Clientes** | 10 | 100 | 500 | Ilimitado |
| **Sucursales** | 1 | 1 | 5 | Ilimitado |
| **Catálogo** | 50 | 300 | 1,000 | Ilimitado |
| **Almacenamiento** | 0.5 GB | 1 GB | 10 GB | Ilimitado |

## Funcionalidades por Plan

| Función | FREE | STARTER | PROFESSIONAL | ENTERPRISE |
|---------|:----:|:-------:|:------------:|:----------:|
| Facturación básica | ✓ | ✓ | ✓ | ✓ |
| Catálogo de productos | ✓ | ✓ | ✓ | ✓ |
| Soporte por tickets | ✓ | ✓ | ✓ | ✓ |
| Contabilidad | — | ✓ | ✓ | ✓ |
| Facturas recurrentes | — | ✓ | ✓ | ✓ |
| Logo en facturas | — | ✓ | ✓ | ✓ |
| Cotizaciones B2B | — | — | ✓ | ✓ |
| Reportes avanzados | — | — | ✓ | ✓ |
| Correo externo | — | — | ✓ | ✓ |
| Ayuda Hacienda | — | — | ✓ | ✓ |
| Webhooks | — | — | — | ✓ |
| API REST completa | — | — | — | ✓ |
| Soporte telefónico | — | — | — | ✓ |
| Account manager | — | — | — | ✓ |

---

## Ver Tu Plan Actual

1. Ve a **Configuración > Plan**
2. Verás:
   - Nombre del plan actual
   - Funcionalidades habilitadas
   - Límites y uso actual

---

## Ver Uso Actual

En **Configuración > Plan** puedes ver el consumo de tu plan:

| Métrica | Descripción |
|---------|-------------|
| DTEs este mes | Cuántas facturas has emitido vs. tu límite |
| Clientes | Total de clientes registrados vs. límite |
| Sucursales | Sucursales activas vs. límite |
| Productos | Ítems en catálogo vs. límite |

El contador de DTEs se reinicia el primer día de cada mes.

---

## Cambiar de Plan

### Upgrade (Subir de plan)

1. Ve a **Configuración > Plan**
2. Revisa los planes disponibles
3. Selecciona el plan deseado
4. Confirma el cambio
5. Las nuevas funcionalidades se activan inmediatamente
6. Los nuevos límites se aplican al instante

**Al hacer upgrade:**
- Acceso inmediato a nuevas funcionalidades
- Límites aumentados al instante
- Datos existentes se conservan
- Proporcional del mes restante

### Downgrade (Bajar de plan)

1. Ve a **Configuración > Plan**
2. Selecciona un plan inferior
3. Revisa las funcionalidades que perderás
4. Confirma el cambio

**Al hacer downgrade:**
- Las funcionalidades del plan superior se desactivan
- Los datos existentes se conservan (no se eliminan)
- Si excedes límites del nuevo plan, no podrás crear nuevos recursos hasta estar dentro del límite
- Ejemplo: Si tenías 5 sucursales y bajas a STARTER (1 sucursal), las existentes se mantienen pero no podrás crear más

---

## Advertencias de Límite

El sistema te notifica cuando estás cerca de alcanzar los límites de tu plan:

- **PLAN_LIMIT_WARNING:** Cuando llegas al 80% del límite de DTEs/mes
- **PLAN_EXPIRED:** Cuando tu plan expira (si aplica)

Estas notificaciones aparecen en el ícono de campana en el header.

---

## SLA por Plan

El Service Level Agreement (acuerdo de nivel de servicio) define los tiempos de respuesta de soporte:

| Plan | Respuesta | Resolución |
|------|-----------|------------|
| FREE | Mejor esfuerzo | Mejor esfuerzo |
| STARTER | 24 horas | 48 horas |
| PROFESSIONAL | 12 horas | 24 horas |
| ENTERPRISE | 2 horas | 8 horas |

- **Respuesta:** Tiempo máximo para la primera respuesta a tu ticket
- **Resolución:** Tiempo máximo para resolver el problema

---

## Preguntas Frecuentes sobre Billing

### ¿Puedo probar antes de pagar?
Sí. El plan FREE permite usar Facturosv con límites reducidos (10 DTEs/mes) sin costo y sin límite de tiempo.

### ¿Qué pasa si alcanzo el límite de DTEs?
No podrás crear nuevas facturas hasta el próximo mes o hasta que hagas upgrade a un plan superior.

### ¿Los datos se borran si bajo de plan?
No. Todos tus datos (facturas, clientes, contabilidad) se conservan. Solo se restringen las funcionalidades y límites.

### ¿Puedo cancelar en cualquier momento?
Sí. Puedes bajar al plan FREE en cualquier momento. Tus datos se conservan.

### ¿El plan anual tiene descuento?
Sí. El plan anual equivale a ~10 meses de pago mensual (2 meses gratis).
