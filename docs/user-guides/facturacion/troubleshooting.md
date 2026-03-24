# Solucion de problemas - Facturacion

Esta guia cubre los problemas mas comunes que puede encontrar al usar el modulo de facturacion de Facturosv.com y sus soluciones.

---

## 1. El documento queda en estado PENDIENTE y no se transmite

**Sintomas**: Guardo la factura pero el estado permanece en PENDIENTE en lugar de avanzar a PROCESADO.

**Causas posibles**:
- Las credenciales del MH no estan configuradas o son incorrectas.
- El certificado digital no esta cargado en el portal del MH.
- Hay un problema de conectividad con los servidores del MH.

**Solucion**:
1. Vaya a **Configuracion > Empresa > Credenciales de Hacienda** y verifique que el NIT y contrasena esten correctos.
2. Verifique en el portal del MH que su certificado este activo. Recuerde que despues de generar un certificado, debe tambien **cargarlo** usando la opcion "Cargar Certificado".
3. Intente reintentar la transmision desde el detalle del documento.
4. Si cambio credenciales recientemente, puede ser necesario limpiar la cache de tokens.

---

## 2. Error "NRC invalido" al agregar receptor en un CCF

**Sintomas**: Al crear un Comprobante de Credito Fiscal (tipo 03) e ingresar el NRC del receptor, el sistema muestra un error de validacion.

**Causas posibles**:
- El NRC incluye un guion que no debe estar.
- El NRC tiene caracteres no numericos.

**Solucion**:
- Ingrese el NRC como **digitos sin guion**. Por ejemplo, si el NRC es `367475-0`, ingrese `3674750`.
- El sistema acepta entre 1 y 8 digitos (formato `^[0-9]{1,8}$`).
- El guion es solo un formato de presentacion. El sistema mostrara `367475-0` automaticamente al visualizar.

---

## 3. El MH rechaza el documento con error de direccion

**Sintomas**: El MH devuelve un error indicando que la direccion del receptor es invalida.

**Causas posibles**:
- La direccion del cliente esta almacenada como texto plano en lugar de un objeto con departamento, municipio y complemento.
- Falta alguno de los campos requeridos (departamento, municipio o complemento).

**Solucion**:
1. Vaya a **Clientes** y edite el registro del receptor.
2. Asegurese de que la direccion tenga los tres campos completos:
   - **Departamento**: codigo del departamento.
   - **Municipio**: codigo del municipio.
   - **Complemento**: direccion detallada (calle, numero, colonia, etc.).
3. Guarde el cliente y reintente la transmision del documento.

> **Nota tecnica**: El sistema convierte automaticamente la direccion al formato objeto requerido por el MH (`{departamento, municipio, complemento}`). Si la conversion falla, revise los datos del cliente.

---

## 4. El PDF no muestra el logo de la empresa

**Sintomas**: El PDF generado no incluye el logo de la empresa en la cabecera.

**Causas posibles**:
- No se ha cargado un logo en la configuracion de la empresa.
- El archivo del logo tiene un formato no soportado.
- El archivo es demasiado grande.

**Solucion**:
1. Vaya a **Configuracion > Empresa**.
2. Cargue el logo en formato PNG o JPG.
3. Verifique que el archivo no exceda el tamano maximo permitido.
4. Regenere el PDF del documento si ya estaba generado.

---

## 5. No llega el correo con el PDF al receptor

**Sintomas**: El documento se proceso correctamente pero el receptor no recibio el correo con el PDF adjunto.

**Causas posibles**:
- El correo del receptor es incorrecto o no esta configurado.
- El correo llego a la carpeta de spam del receptor.
- Hay un problema temporal con el servicio de correo.

**Solucion**:
1. Verifique que el campo **correo electronico** del receptor este correcto en el registro del cliente.
2. Pida al receptor que revise su carpeta de spam o correo no deseado.
3. Desde el detalle del documento, puede descargar el PDF manualmente y enviarlo por otros medios.
4. Si el problema persiste, contacte soporte tecnico.

---

## 6. Error 401/403 al transmitir - "No autorizado"

**Sintomas**: La transmision falla con un error de autenticacion (401 o 403).

**Causas posibles**:
- La contrasena del MH cambio y no se actualizo en el sistema.
- El token de sesion expiro y no se pudo renovar.
- Las credenciales fueron bloqueadas en el portal del MH.

**Solucion**:
1. Inicie sesion en el portal del MH para verificar que sus credenciales funcionen.
2. Actualice la contrasena en **Configuracion > Empresa > Credenciales de Hacienda**.
3. Si cambio credenciales, es necesario limpiar tanto la cache de tokens en la base de datos como reiniciar la API para limpiar la cache en memoria.
4. Si las credenciales fueron bloqueadas, siga el proceso de recuperacion del portal del MH.

> **Detalle tecnico**: El MH puede devolver un cuerpo de respuesta vacio en errores 401/403. El sistema maneja esto internamente, pero si ve mensajes de error poco descriptivos, esta es la razon.

---

## 7. Los totales de la factura no cuadran

**Sintomas**: Los montos calculados no coinciden con lo esperado o el MH rechaza por error de calculo.

**Causas posibles**:
- Mezcla de items gravados y exentos mal clasificados.
- Problemas de redondeo en los decimales.

**Solucion**:
1. Revise que cada item tenga correctamente marcado si es **gravado** (sujeto a 13% de IVA) o **exento**.
2. El sistema redondea todos los montos a **2 decimales**. Verifique que los precios unitarios ingresados sean correctos.
3. Recuerde:
   - **Total gravado** = suma de subtotales de items gravados.
   - **IVA** = 13% del total gravado.
   - **Total exento** = suma de subtotales de items exentos.
   - **Total a pagar** = total gravado + IVA + total exento.
4. Si el error persiste, intente eliminar y volver a agregar los items.

---

## 8. El borrador no se restaura al volver a la pagina

**Sintomas**: Estaba creando un documento, cerro el navegador y al volver no se ofrecio restaurar el borrador.

**Causas posibles**:
- El borrador se guarda en `localStorage` del navegador. Si cambio de navegador o dispositivo, no estara disponible.
- El `localStorage` fue limpiado (historial, cache, etc.).
- No transcurrieron los 30 segundos necesarios para el primer guardado automatico.

**Solucion**:
- Use siempre el mismo navegador y dispositivo para continuar su trabajo.
- Evite limpiar los datos del sitio mientras tenga borradores pendientes.
- Si necesita cambiar de dispositivo, guarde el documento (aunque sea incompleto) antes de cerrar.

---

## 9. No puedo anular un documento

**Sintomas**: El boton de anulacion no esta disponible o la anulacion falla.

**Causas posibles**:
- El documento esta en estado RECHAZADO, ERROR o ya ANULADO.
- El motivo de anulacion tiene menos de 10 caracteres.
- Si el documento esta en estado PROCESADO, la anulacion con el MH fallo.

**Solucion**:
1. Verifique que el documento este en estado PENDIENTE, FIRMADO o PROCESADO (los unicos estados que permiten anulacion).
2. Asegurese de que el motivo de anulacion tenga **al menos 10 caracteres**. Ejemplo: "Error en datos del cliente, se reemitira documento correcto."
3. Si el documento esta PROCESADO y la anulacion falla, verifique las credenciales del MH y la conectividad.
4. Un documento en estado RECHAZADO o ERROR no necesita anularse porque nunca fue aceptado por el MH.

---

## 10. La factura recurrente se suspendio automaticamente

**Sintomas**: Una plantilla de factura recurrente cambio a estado "Suspendida" sin que usted la detuviera.

**Causas posibles**:
- La plantilla fallo 3 veces consecutivas al generar documentos.
- El receptor fue eliminado o desactivado.
- Las credenciales del MH expiraron.
- Un item referenciado ya no existe.

**Solucion**:
1. Abra la plantilla recurrente suspendida.
2. Revise el historial de emision para identificar el error en los ultimos 3 intentos.
3. Corrija el problema identificado:
   - Si el receptor fue eliminado, actualice la plantilla con un receptor valido.
   - Si las credenciales expiraron, actualizelas en la configuracion.
   - Si un item ya no existe, actualize los items de la plantilla.
4. Una vez corregido, haga clic en **Reanudar** para reactivar la plantilla.

---

## Contacto de soporte

Si su problema no esta cubierto en esta guia o las soluciones no funcionan, contacte al equipo de soporte de Facturosv.com con la siguiente informacion:

- Numero de control del documento afectado (si aplica).
- Captura de pantalla del error.
- Descripcion de los pasos realizados.
- Navegador y sistema operativo utilizados.
