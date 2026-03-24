# Solucion de problemas - Cotizaciones

Listado de problemas frecuentes y sus soluciones.

---

## 1. No aparece la opcion de Cotizaciones en el menu

**Causa**: el modulo de cotizaciones esta disponible unicamente en los planes **Professional** y superiores.

**Solucion**: verifique su plan actual en **Configuracion > Suscripcion**. Si su plan es inferior a Professional, debera actualizar su suscripcion para acceder a esta funcionalidad.

---

## 2. El cliente dice que no recibio el correo con la cotizacion

**Causas posibles**:
- El correo llego a la carpeta de spam o correo no deseado.
- La direccion de correo del cliente esta mal escrita en el registro del directorio.

**Solucion**:
1. Verifique la direccion de correo del cliente en el modulo de **Clientes**.
2. Pida al cliente que revise su carpeta de spam.
3. Si todo esta correcto, use la opcion **Reenviar** desde la vista de detalle de la cotizacion.

---

## 3. La cotizacion se marco como vencida antes de lo esperado

**Causa**: el proceso automatico de verificacion de vencimiento se ejecuta diariamente a las 6:00 AM. Las cotizaciones cuya fecha en el campo **Valido hasta** sea anterior a la fecha actual se marcan como `EXPIRED`.

**Solucion**:
- Antes de enviar, verifique que la fecha de vigencia sea correcta. El valor por defecto es de 30 dias.
- Si la cotizacion ya vencio, cree una nueva version con una fecha de vigencia actualizada.

---

## 4. No puedo editar una cotizacion enviada

**Causa**: las cotizaciones en estado `SENT` no se pueden editar directamente para preservar la integridad del documento que el cliente ya recibio.

**Solucion**:
- Si el cliente aun no ha respondido, puede **cancelar** la cotizacion actual y crear una nueva.
- Si el cliente solicito cambios, espere a que la cotizacion cambie a estado `CHANGES_REQUESTED` y luego cree una nueva version.

---

## 5. El boton "Convertir a factura" no aparece o esta deshabilitado

**Causa**: la conversion a factura solo esta disponible para cotizaciones en estado `APPROVED` o `PARTIALLY_APPROVED`.

**Solucion**:
- Verifique que el estado de la cotizacion sea uno de los dos mencionados.
- Si la cotizacion esta en estado `SENT`, espere la respuesta del cliente.
- Si la cotizacion fue rechazada o tiene cambios solicitados, cree una nueva version, envie y espere la aprobacion.

---

## 6. El enlace de aprobacion no funciona para el cliente

**Causas posibles**:
- La cotizacion fue cancelada o ya tiene una version mas reciente (el enlace de versiones anteriores se desactiva).
- La cotizacion ya vencio y el enlace muestra un mensaje de expiracion.

**Solucion**:
1. Verifique el estado actual de la cotizacion en el sistema.
2. Si la cotizacion vencio, cree una nueva version y reenvie.
3. Si existe una version mas reciente, el cliente debe usar el enlace de la ultima version enviada.

---

## 7. La conversion a factura falla con error de validacion

**Causa**: los datos del cliente o de los items pueden no cumplir con los requisitos de Hacienda para un DTE tipo 01. Ejemplos comunes: direccion del cliente incompleta, NRC en formato incorrecto o campos fiscales faltantes.

**Solucion**:
1. Verifique los datos del cliente en el modulo de **Clientes**: NRC (formato numerico sin guion), NIT, direccion completa (departamento, municipio, complemento) y actividad economica.
2. Revise que todos los items tengan tipo de item asignado (1 = Bien, 2 = Servicio).
3. Corrija los datos y vuelva a intentar la conversion.

---

## 8. No se enviaron recordatorios al cliente antes del vencimiento

**Causas posibles**:
- La cotizacion tiene menos de 3 dias de vigencia restante al momento de enviarla (el recordatorio se programa para 3 dias antes del vencimiento).
- Ya se enviaron los 2 recordatorios maximos permitidos.
- La cotizacion fue aprobada, rechazada o cancelada antes de que se activara el recordatorio.

**Solucion**:
- Verifique que la fecha de vigencia permita al menos 3 dias para el envio del recordatorio.
- Si necesita recordar al cliente manualmente, puede usar la opcion **Reenviar** desde la cotizacion.
- Para futuras cotizaciones, considere establecer plazos de vigencia de al menos 7 dias para garantizar que los recordatorios se procesen correctamente.
