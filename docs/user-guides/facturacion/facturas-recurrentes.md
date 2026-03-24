# Facturas recurrentes

Facturosv.com permite automatizar la emision periodica de facturas mediante plantillas de facturacion recurrente. Esta funcionalidad es ideal para suscripciones, rentas, servicios mensuales y cualquier cobro que se repita en intervalos regulares.

## Como funcionan

Una factura recurrente es una **plantilla** que define los datos de un DTE (receptor, items, condiciones) junto con una programacion de emision. El sistema genera automaticamente el documento segun el intervalo configurado.

### Flujo de una factura recurrente

1. Usted crea una plantilla con los datos del documento y la programacion.
2. El sistema evalua periodicamente las plantillas activas.
3. Cuando llega la fecha programada, el sistema genera un nuevo DTE basado en la plantilla.
4. Segun el modo configurado, el documento se guarda como borrador o se envia automaticamente al MH.
5. El ciclo se repite hasta que usted pause o cancele la plantilla.

## Crear una plantilla recurrente

### Paso 1: Acceder a facturas recurrentes

1. Navegue a **Facturacion > Recurrentes** en el menu lateral.
2. Haga clic en **Nueva factura recurrente**.

### Paso 2: Configurar los datos del documento

Complete los mismos datos que al crear una factura normal:

- **Tipo de DTE**: seleccione el tipo de documento (generalmente 01 o 03).
- **Receptor**: seleccione o cree el cliente.
- **Items**: agregue los productos o servicios.
- **Condicion de pago**: seleccione la condicion.

### Paso 3: Configurar la programacion

| Campo | Descripcion | Opciones |
|-------|-------------|----------|
| **Intervalo** | Frecuencia de emision del documento. | DAILY, WEEKLY, MONTHLY, YEARLY |
| **Modo** | Que hace el sistema al generar el documento. | AUTO_DRAFT, AUTO_SEND |
| **Dia ancla** | Dia del mes en que se emite (solo para MONTHLY). | 1-31 |
| **Fecha de inicio** | Cuando comienza la programacion. | Fecha |
| **Fecha de fin** (opcional) | Cuando termina la programacion. | Fecha o indefinido |

### Intervalos disponibles

| Intervalo | Descripcion | Ejemplo |
|-----------|-------------|---------|
| **DAILY** | Se emite todos los dias. | Servicios de parqueo diario. |
| **WEEKLY** | Se emite cada semana, el mismo dia de la semana. | Reporte semanal de servicios. |
| **MONTHLY** | Se emite cada mes, en el dia ancla configurado. | Renta mensual, suscripciones. |
| **YEARLY** | Se emite una vez al ano. | Renovacion anual de licencia. |

### Modos de emision

| Modo | Descripcion |
|------|-------------|
| **AUTO_DRAFT** | El sistema genera el documento como borrador (estado PENDIENTE). Usted debe revisarlo y transmitirlo manualmente. Util cuando los montos pueden variar o necesita verificar datos antes de enviar. |
| **AUTO_SEND** | El sistema genera el documento, lo firma y lo transmite automaticamente al MH. Ideal para cobros fijos que no cambian. |

### Dia ancla (para intervalo MONTHLY)

El dia ancla (`anchorDay`) define en que dia del mes se genera el documento.

- Si configura `anchorDay = 15`, el documento se genera el dia 15 de cada mes.
- Si configura `anchorDay = 1`, se genera el primer dia de cada mes.
- Si el dia ancla es mayor que los dias del mes (por ejemplo, 31 en febrero), el sistema genera el documento el ultimo dia de ese mes.

## Suspension automatica por fallos

El sistema implementa un mecanismo de seguridad para evitar la generacion de documentos que fallan repetidamente.

**Regla**: Si una plantilla recurrente falla **3 veces consecutivas**, el sistema la **suspende automaticamente**.

Motivos comunes de fallo:
- El receptor fue eliminado o desactivado.
- Las credenciales del MH expiraron.
- Un item o producto ya no existe.
- Error de validacion en los datos.

Cuando una plantilla se suspende:
1. Se detiene la generacion automatica.
2. El sistema registra el motivo de la suspension.
3. Usted recibe una notificacion.
4. Debe corregir el problema y reanudar manualmente la plantilla.

## Gestionar plantillas recurrentes

### Ver plantillas

En **Facturacion > Recurrentes**, vera el listado de todas las plantillas con su estado:

| Estado | Significado |
|--------|-------------|
| **Activa** | La plantilla esta generando documentos segun la programacion. |
| **Pausada** | La plantilla esta detenida temporalmente. No genera documentos. |
| **Suspendida** | El sistema detuvo la plantilla por fallos consecutivos. |
| **Cancelada** | La plantilla fue cancelada permanentemente. |

### Pausar una plantilla

1. Abra la plantilla recurrente.
2. Haga clic en **Pausar**.
3. La plantilla dejara de generar documentos hasta que la reanude.

Util cuando:
- El cliente tiene un periodo de inactividad.
- Necesita ajustar los datos antes de continuar.
- Quiere detener temporalmente la facturacion.

### Reanudar una plantilla

1. Abra la plantilla pausada o suspendida.
2. Si fue suspendida por fallos, corrija el problema primero.
3. Haga clic en **Reanudar**.
4. La plantilla vuelve a estado activo y retoma la programacion.

### Cancelar una plantilla

1. Abra la plantilla recurrente.
2. Haga clic en **Cancelar**.
3. Confirme la accion.

> **Importante**: La cancelacion es permanente. Si necesita la misma facturacion recurrente en el futuro, debera crear una nueva plantilla.

### Ver historial de emision

Cada plantilla recurrente mantiene un historial de todos los documentos generados:

1. Abra la plantilla recurrente.
2. Navegue a la seccion **Historial**.
3. Vera la lista de documentos generados con:
   - Fecha de generacion.
   - Numero de control del DTE generado.
   - Estado del documento (PROCESADO, ERROR, etc.).
   - Enlace al documento generado.

## Ejemplos de uso

### Renta mensual

- **Intervalo**: MONTHLY
- **Dia ancla**: 1 (primer dia del mes)
- **Modo**: AUTO_SEND
- **Items**: "Renta oficina local 3B - Marzo 2026" / $500.00 / Gravado

### Suscripcion de software

- **Intervalo**: MONTHLY
- **Dia ancla**: 15
- **Modo**: AUTO_DRAFT (para revisar antes de enviar)
- **Items**: "Licencia software ERP - Mensualidad" / $150.00 / Gravado

### Mantenimiento anual

- **Intervalo**: YEARLY
- **Modo**: AUTO_SEND
- **Items**: "Contrato mantenimiento preventivo anual" / $1,200.00 / Gravado

## Buenas practicas

1. **Use AUTO_DRAFT para montos variables**: Si el monto puede cambiar entre periodos, use AUTO_DRAFT para revisar y ajustar antes de transmitir.
2. **Use AUTO_SEND para montos fijos**: Si el cobro es siempre el mismo, AUTO_SEND ahorra tiempo.
3. **Revise las plantillas suspendidas**: Atienda las suspensiones lo antes posible para evitar interrupciones en la facturacion.
4. **Establezca una fecha de fin**: Para contratos con plazo definido, configure la fecha de fin para evitar emitir documentos despues de que termine el contrato.
5. **Actualice los datos del receptor**: Si el cliente cambia de direccion o datos fiscales, actualice el registro del cliente. Las futuras facturas recurrentes usaran los datos actualizados.
