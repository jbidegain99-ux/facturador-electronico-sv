# Portal de aprobacion del cliente

Cuando usted envia una cotizacion, el cliente recibe un correo electronico con un enlace al portal de aprobacion. Este portal es una pagina publica que **no requiere inicio de sesion ni cuenta en Facturosv**.

La URL tiene el formato: `https://facturosv.com/approve/[token]`

Cada cotizacion genera un token unico e irrepetible.

---

## Vista del portal

Al abrir el enlace, el cliente visualiza:

- Datos del emisor (su empresa)
- Numero de cotizacion (`COT-YYYY-XXXX`)
- Fecha de emision y fecha de vencimiento
- Lista detallada de items con cantidades, precios unitarios, descuentos y subtotales
- Total general
- Terminos y condiciones (si se incluyeron)
- Notas (si se incluyeron)
- Botones de accion: **Aprobar**, **Rechazar**, **Solicitar cambios**

---

## Flujo de aprobacion

### Aprobar la cotizacion

1. El cliente hace clic en **Aprobar**.
2. Se le solicita ingresar su **nombre completo** y **correo electronico** como confirmacion (ambos campos son obligatorios).
3. Al confirmar, la cotizacion cambia a estado `APPROVED`.
4. Se envian notificaciones por correo:
   - Al cliente: confirmacion de aprobacion con resumen.
   - Al usuario del tenant que creo la cotizacion: aviso de que la cotizacion fue aprobada.

### Rechazar la cotizacion

1. El cliente hace clic en **Rechazar**.
2. Se le solicita ingresar un **motivo de rechazo** (campo obligatorio).
3. Al confirmar, la cotizacion cambia a estado `REJECTED`.
4. Se envia una notificacion al usuario del tenant con el motivo del rechazo.

### Solicitar cambios

1. El cliente hace clic en **Solicitar cambios**.
2. Se muestra la lista de items con casillas de seleccion.
3. El cliente **selecciona los items que desea eliminar** de la cotizacion.
4. Opcionalmente, puede agregar un comentario explicando los cambios deseados.
5. Al confirmar, la cotizacion cambia a estado `CHANGES_REQUESTED`.
6. Se envia una notificacion al usuario del tenant con el detalle de los items que el cliente desea remover.

---

## Aprobacion parcial

Cuando el cliente solicita cambios y usted crea una nueva version eliminando solo los items indicados, el cliente puede aprobar esa version. Si la version aprobada contiene menos items que la cotizacion original, el estado resultante es `PARTIALLY_APPROVED`.

Una cotizacion con estado `PARTIALLY_APPROVED` puede convertirse a factura de la misma manera que una cotizacion completamente aprobada.

---

## Versionamiento

Las cotizaciones en Facturosv utilizan un sistema de versionamiento para mantener trazabilidad completa.

### Como funciona

- Cada cotizacion tiene un campo `version` (comienza en 1) y pertenece a un `quoteGroupId` que agrupa todas las versiones de una misma cotizacion.
- Cuando el cliente solicita cambios o rechaza una cotizacion, usted puede crear una **nueva version**.
- La nueva version:
  - Incrementa el numero de `version`.
  - Mantiene el mismo `quoteGroupId`.
  - Almacena una referencia a la version anterior en `previousVersionId`.
  - Se marca como `isLatestVersion = true` (la version anterior se marca como `false`).
  - Inicia en estado `DRAFT`, lista para editar y reenviar.

### Crear una nueva version

1. Abra la cotizacion con estado `REJECTED`, `CHANGES_REQUESTED` o `EXPIRED`.
2. Haga clic en **Crear nueva version**.
3. Se crea un borrador con los datos de la version anterior, ya ajustados segun las solicitudes del cliente (por ejemplo, sin los items que pidio eliminar).
4. Edite lo que considere necesario.
5. Envie la nueva version al cliente.

El cliente recibira un nuevo enlace de aprobacion. Las versiones anteriores permanecen como registro historico y ya no son modificables.

### Historial de versiones

En la vista de detalle de cualquier cotizacion, puede consultar el historial completo de versiones dentro del mismo grupo, incluyendo el estado y la fecha de cada una.

---

## Conversion a factura electronica

Una cotizacion aprobada o parcialmente aprobada puede convertirse en una factura electronica (DTE tipo 01) de forma automatica.

### Pasos

1. Abra la cotizacion con estado `APPROVED` o `PARTIALLY_APPROVED`.
2. Haga clic en **Convertir a factura**.
3. El sistema genera automaticamente el DTE tipo 01 con:
   - Los datos del cliente de la cotizacion.
   - Los items aprobados (cantidades, precios, descuentos, tipo de item).
   - La normalizacion requerida por Hacienda (direccion, totalLetras, pagos, decimales).
4. La factura se crea y se envia a Hacienda para su procesamiento.
5. La cotizacion cambia a estado `CONVERTED`.
6. Desde la cotizacion convertida, puede acceder directamente a la factura generada.

> Solo las cotizaciones en estado `APPROVED` o `PARTIALLY_APPROVED` pueden convertirse. Si la cotizacion esta en otro estado, el boton de conversion no estara disponible.

---

## Notificaciones por correo electronico

El sistema envia notificaciones automaticas en los siguientes eventos:

| Evento                  | Destinatario              | Contenido                                           |
|-------------------------|---------------------------|-----------------------------------------------------|
| Cotizacion enviada      | Cliente                   | Resumen de la cotizacion + enlace de aprobacion     |
| Cotizacion aprobada     | Cliente + usuario tenant  | Confirmacion de aprobacion                          |
| Cotizacion rechazada    | Usuario tenant            | Motivo del rechazo                                  |
| Cambios solicitados     | Usuario tenant            | Items a remover y comentarios del cliente            |
| Recordatorio            | Cliente                   | Aviso de vencimiento proximo (3 dias antes)         |

### Recordatorios automaticos

- Se envian **3 dias antes** de la fecha de vencimiento.
- Maximo **2 recordatorios** por cotizacion.
- Se procesan diariamente a las **9:00 AM**.

---

## Siguiente paso

Si tiene problemas con alguna funcionalidad, consulte la [guia de solucion de problemas](troubleshooting.md).
