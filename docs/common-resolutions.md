# Resoluciones Comunes - Facturosv.com

Documento de referencia para el equipo de soporte técnico. Contiene las resoluciones más frecuentes organizadas por módulo.

**Última actualización:** 2026-03-24
**Versión:** 1.0

---

## Tabla de Contenidos

1. [Facturación](#facturación)
2. [Hacienda / Transmisión](#hacienda--transmisión)
3. [Correos](#correos)
4. [Contabilidad](#contabilidad)
5. [Cotizaciones](#cotizaciones)
6. [General](#general)

---

## Facturación

### Resolución #1: No puede crear factura — límite de DTEs alcanzado

**Síntoma:** El usuario intenta crear una factura y recibe el mensaje "Has alcanzado el límite de DTEs de tu plan".
**Causa:** El plan contratado tiene un límite mensual de DTEs y el usuario ya consumió la totalidad de su cuota.
**Solución:**
1. Verificar en el panel de administración la cantidad de DTEs emitidos en el período actual.
2. Confirmar que el límite corresponde al plan vigente del tenant.
3. Ofrecer al usuario la opción de actualizar a un plan superior desde **Configuración > Facturación > Cambiar plan**.
4. Una vez actualizado el plan, el nuevo límite se aplica de inmediato y el usuario puede continuar facturando.
**Prevención:** Configurar alertas automáticas cuando el consumo de DTEs alcance el 80% del límite mensual. Revisar periódicamente el plan contratado según el volumen de facturación del negocio.
**Ticket de origen:** #TKT-20260115-0012

---

### Resolución #2: Factura tiene datos incorrectos y no se puede editar

**Síntoma:** El usuario reporta que una factura tiene datos erróneos (monto, cliente, ítems) y solicita editarla.
**Causa:** Las facturas que ya fueron transmitidas a Hacienda (estado PROCESADO o ACEPTADO) no pueden ser modificadas, ya que el DTE fue firmado digitalmente y registrado ante el Ministerio de Hacienda.
**Solución:**
1. Verificar el estado del DTE en el sistema.
2. Si el estado es PROCESADO o ACEPTADO, explicar al usuario que la factura ya fue registrada ante Hacienda y no admite edición.
3. Proceder a anular la factura desde **Facturas > [Factura] > Anular**.
4. Crear una nueva factura con los datos correctos.
5. Si el DTE aún no fue transmitido (estado BORRADOR o FIRMADO), sí es posible editarlo directamente.
**Prevención:** Revisar cuidadosamente todos los datos de la factura antes de transmitirla. Utilizar la vista previa del PDF para verificar montos y datos del receptor.
**Ticket de origen:** #TKT-20260122-0034

---

### Resolución #3: DTEs no aparecen en el listado de facturas

**Síntoma:** El usuario indica que no puede encontrar facturas que sabe que existen en el sistema.
**Causa:** Hay un filtro activo en la vista de facturas (por fecha, estado, tipo de DTE o sucursal) que excluye los documentos buscados.
**Solución:**
1. Verificar los filtros activos en la barra superior del listado de facturas.
2. Hacer clic en "Limpiar filtros" para restablecer la vista completa.
3. Si el usuario busca facturas de un período específico, ajustar el rango de fechas para incluir el período correcto.
4. Verificar que el usuario tiene permisos para ver facturas de todas las sucursales (si aplica).
**Prevención:** Informar al usuario sobre el comportamiento de los filtros persistentes. Considerar mostrar un indicador visual más prominente cuando hay filtros activos.
**Ticket de origen:** #TKT-20260128-0019

---

### Resolución #4: Error al crear factura tipo 03 (Comprobante de Crédito Fiscal)

**Síntoma:** Al intentar crear un CCF (tipo 03), el sistema muestra un error de validación relacionado con los datos del receptor.
**Causa:** El Comprobante de Crédito Fiscal requiere obligatoriamente que el receptor tenga NIT y NRC registrados. El cliente seleccionado no tiene estos campos completos.
**Solución:**
1. Ir a **Clientes > [Cliente]** y verificar que los campos NIT y NRC estén completos.
2. El NRC debe ingresarse como dígitos sin guión (ej. `3674750`). El sistema formatea automáticamente la visualización con guión (`367475-0`).
3. Verificar que el NIT tenga el formato correcto: `XXXX-XXXXXX-XXX-X`.
4. Asegurarse de que la dirección del cliente esté completa con departamento, municipio y complemento.
5. Guardar los cambios en el cliente e intentar crear la factura nuevamente.
**Prevención:** Al registrar clientes contribuyentes, siempre completar NIT, NRC y dirección completa desde el inicio. Utilizar la validación de datos al momento del registro.
**Ticket de origen:** #TKT-20260130-0041

---

### Resolución #5: Factura aparece como duplicada

**Síntoma:** El usuario intenta crear una factura y el sistema indica que ya existe una factura con el mismo código de generación, o el usuario ve dos registros aparentemente iguales.
**Causa:** La factura ya fue transmitida previamente a Hacienda. Esto puede ocurrir si el usuario hizo doble clic en el botón de envío o si hubo un timeout que hizo creer que la transmisión falló cuando en realidad fue exitosa.
**Solución:**
1. Buscar el código de generación del DTE en **Facturas > Buscar** usando el UUID.
2. Verificar en el historial de transmisiones si el DTE fue aceptado por Hacienda.
3. Si ya fue aceptado, no crear una nueva factura; utilizar la existente.
4. Si hay dos registros locales para el mismo DTE, marcar el duplicado como descartado y conservar el que tiene sello de recepción de Hacienda.
**Prevención:** Deshabilitar el botón de envío después del primer clic para evitar doble transmisión. Implementar verificación de idempotencia por código de generación antes de transmitir.
**Ticket de origen:** #TKT-20260203-0008

---

### Resolución #6: Monto total de la factura no coincide con lo esperado

**Síntoma:** El usuario reporta que el total de la factura es mayor al esperado; por ejemplo, ingresa un precio de $100.00 y el total aparece como $113.00.
**Causa:** El IVA del 13% se calcula y suma automáticamente sobre los precios unitarios ingresados. El usuario ingresó precios con IVA incluido, pero el sistema los interpretó como precios sin IVA.
**Solución:**
1. Explicar al usuario que los precios deben ingresarse **sin IVA** (precio neto).
2. Si el precio final deseado es $113.00, el precio unitario a ingresar es $100.00 (el sistema sumará $13.00 de IVA).
3. Para facturas tipo 01 (Factura de Consumidor Final), el IVA va incluido en el precio mostrado al consumidor.
4. Para facturas tipo 03 (CCF), el IVA se desglosa por separado en el resumen.
5. Corregir los precios unitarios y regenerar la factura.
**Prevención:** Capacitar a los usuarios sobre la diferencia entre precio con IVA y sin IVA según el tipo de DTE. Incluir una nota visible en el formulario indicando que los precios son sin IVA.
**Ticket de origen:** #TKT-20260205-0022

---

### Resolución #7: Número de control incorrecto en la factura

**Síntoma:** El número de control generado no corresponde a la sucursal o punto de venta esperado (ej. aparece `DTE-01-0001-000000000000001` cuando debería ser `DTE-01-0002-...`).
**Causa:** La sucursal o el punto de venta asociado al usuario o a la factura está mal configurado. El número de control se compone del tipo de DTE, código de sucursal y código de punto de venta.
**Solución:**
1. Ir a **Configuración > Sucursales** y verificar que los códigos de sucursal estén correctos.
2. Verificar en **Configuración > Puntos de Venta** que el punto de venta asignado tenga el código esperado.
3. Confirmar que el usuario esté operando desde la sucursal correcta en la sesión actual.
4. Si el número de control ya fue generado incorrectamente y la factura no fue transmitida, eliminar el borrador y crear uno nuevo desde la sucursal correcta.
5. Si ya fue transmitida, anular la factura y emitir una nueva desde la sucursal correcta.
**Prevención:** Configurar correctamente las sucursales y puntos de venta antes de comenzar a facturar. Asignar usuarios a sus sucursales correspondientes.
**Ticket de origen:** #TKT-20260208-0015

---

### Resolución #8: PDF de la factura no se genera

**Síntoma:** El usuario hace clic en "Descargar PDF" o "Ver PDF" y no se descarga ningún archivo, o aparece un error genérico.
**Causa:** Error temporal en el servicio de generación de PDF, generalmente por sobrecarga del servidor o timeout en la renderización del documento.
**Solución:**
1. Solicitar al usuario que recargue la página y vuelva a intentar la descarga.
2. Si persiste, verificar en los logs del servidor si hay errores relacionados con el servicio de generación de PDF.
3. Comprobar que la factura tenga todos los datos requeridos para la plantilla PDF (logo, datos del emisor, datos del receptor).
4. Si el logo del emisor es un archivo corrupto o en formato no soportado, puede causar fallo en la generación. Verificar que sea PNG o JPG.
5. Si el problema persiste, reiniciar el servicio API.
**Prevención:** Validar los archivos de logo al momento de subirlos (formato y tamaño). Implementar reintentos automáticos en la generación de PDF.
**Ticket de origen:** #TKT-20260210-0033

---

### Resolución #9: Factura recurrente no se ejecutó

**Síntoma:** El usuario configuró una factura recurrente (plantilla de facturación automática) y no se generó la factura en la fecha programada.
**Causa:** La plantilla de facturación recurrente fue suspendida automáticamente después de 3 fallos consecutivos de ejecución. Los fallos pueden deberse a datos incompletos del cliente, límite de DTEs alcanzado o errores de conexión con Hacienda.
**Solución:**
1. Ir a **Facturas > Recurrentes** y localizar la plantilla.
2. Verificar el estado: si muestra "Suspendida", revisar el historial de ejecución para identificar la causa de los fallos.
3. Corregir la causa raíz (actualizar datos del cliente, verificar límite de DTEs, etc.).
4. Reactivar la plantilla haciendo clic en "Reactivar".
5. Opcionalmente, ejecutar manualmente la factura pendiente si es necesario.
**Prevención:** Monitorear las notificaciones de fallos en plantillas recurrentes. Revisar periódicamente el estado de las plantillas activas. Mantener actualizados los datos de los clientes asociados a facturación recurrente.
**Ticket de origen:** #TKT-20260212-0027

---

### Resolución #10: No puede anular una factura

**Síntoma:** El usuario intenta anular una factura y el botón de anulación no está disponible o aparece un error indicando que no se puede anular.
**Causa:** Solo se pueden anular facturas que estén en estado PROCESADO, FIRMADO o PENDIENTE. Las facturas en estado ANULADO (ya anuladas), RECHAZADO o BORRADOR no admiten anulación.
**Solución:**
1. Verificar el estado actual de la factura.
2. Si está en BORRADOR, simplemente eliminarla en lugar de anularla.
3. Si está en RECHAZADO por Hacienda, no requiere anulación ya que nunca fue aceptada.
4. Si está en PROCESADO o ACEPTADO, proceder con la anulación desde **Facturas > [Factura] > Anular**.
5. La anulación genera un DTE de invalidación que también debe transmitirse a Hacienda.
**Prevención:** Documentar claramente los estados y las acciones disponibles en cada uno. Capacitar a los usuarios sobre el flujo de vida de un DTE.
**Ticket de origen:** #TKT-20260215-0009

---

## Hacienda / Transmisión

### Resolución #11: Transmisión rechazada — "Factura duplicada"

**Síntoma:** Al transmitir un DTE a Hacienda, se recibe un rechazo con el mensaje "Factura duplicada" o "Código de generación ya existe".
**Causa:** Un DTE con el mismo código de generación (UUID) ya fue transmitido y aceptado por Hacienda previamente. Esto ocurre cuando se reintenta una transmisión que ya fue exitosa.
**Solución:**
1. Copiar el código de generación (UUID) del DTE rechazado.
2. Buscar en el sistema si existe otro registro con el mismo código de generación que tenga estado ACEPTADO.
3. Si existe, actualizar el registro local para reflejar el estado correcto (ACEPTADO) con el sello de recepción de Hacienda.
4. Si no se encuentra localmente, consultar directamente en el portal de Hacienda con las credenciales del contribuyente para verificar el estado del DTE.
5. No generar un nuevo DTE con diferente código de generación para los mismos datos, ya que duplicaría la factura fiscalmente.
**Prevención:** Implementar verificación del estado en Hacienda antes de retransmitir. No reintentar transmisiones sin verificar primero si la original fue exitosa.
**Ticket de origen:** #TKT-20260118-0045

---

### Resolución #12: Error 401 — "Token inválido" al transmitir

**Síntoma:** La transmisión a Hacienda falla con código HTTP 401 y el cuerpo de la respuesta está vacío.
**Causa:** El token de autenticación con el Ministerio de Hacienda expiró o las credenciales (NIT, contraseña MH) fueron cambiadas en el portal de Hacienda sin actualizar el sistema.
**Solución:**
1. Verificar que las credenciales de Hacienda estén correctas en **Configuración > Hacienda**.
2. Renovar el token manualmente desde **Configuración > Hacienda > Renovar token**.
3. **Importante:** El header de autorización debe enviar el token sin el prefijo "Bearer ". El sistema ya maneja esto, pero si se modificó manualmente alguna configuración, verificar.
4. Si se cambiaron las credenciales en el portal de Hacienda, actualizar en el sistema y luego limpiar tanto el cache de token en la base de datos como reiniciar el servicio API para limpiar el cache en memoria.
5. Reintentar la transmisión.
**Prevención:** Monitorear la expiración de tokens de Hacienda. Tras cualquier cambio de credenciales en el portal MH, actualizar inmediatamente en el sistema.
**Ticket de origen:** #TKT-20260120-0018

---

### Resolución #13: Certificado de firma no se acepta

**Síntoma:** Al intentar firmar un DTE, el sistema muestra un error indicando que el certificado no es válido o no puede ser leído.
**Causa:** El formato del certificado no es el esperado. Hacienda utiliza archivos `.crt` en formato XML (`<CertificadoMH>`), que no son certificados X.509 estándar. También puede ocurrir si se intenta usar un archivo `.p12`/`.pfx` sin la contraseña correcta.
**Solución:**
1. Verificar el tipo de archivo del certificado subido.
2. Si es un archivo `.crt` de Hacienda, confirmar que es el formato XML de MH con la estructura `<CertificadoMH>` que contiene las claves pública y privada embebidas.
3. Si se generó un nuevo certificado en el portal de Hacienda, verificar que también se haya ejecutado el paso "Cargar Certificado" para registrarlo. Solo descargarlo no es suficiente.
4. Subir nuevamente el certificado desde **Configuración > Hacienda > Certificado**.
5. Verificar que la contraseña del certificado sea correcta.
**Prevención:** Documentar el proceso completo de renovación de certificados MH: generar, descargar Y cargar. Guardar una copia de respaldo del certificado en un lugar seguro.
**Ticket de origen:** #TKT-20260125-0031

---

### Resolución #14: "No se puede conectar con Hacienda"

**Síntoma:** Todas las transmisiones fallan con error de conexión. El sistema muestra "No se puede conectar con el servicio de Hacienda" o "ECONNREFUSED".
**Causa:** Las credenciales de API de Hacienda son incorrectas y el servicio rechaza la conexión, o el servicio de Hacienda está temporalmente fuera de línea (mantenimiento o caída).
**Solución:**
1. Verificar el estado del servicio de Hacienda consultando a otros usuarios o el portal oficial del MH.
2. Si el servicio está activo, verificar las credenciales del contribuyente en **Configuración > Hacienda**.
3. Verificar que la URL del ambiente sea correcta (pruebas vs. producción).
4. Comprobar que el servidor de la aplicación tenga acceso a internet y que no haya reglas de firewall bloqueando la conexión saliente.
5. Si el servicio MH está caído, esperar e intentar más tarde. Los DTEs pendientes se transmitirán automáticamente cuando el servicio se restablezca.
**Prevención:** Implementar monitoreo del estado de conectividad con Hacienda. Configurar reintentos automáticos con backoff exponencial para manejar interrupciones temporales.
**Ticket de origen:** #TKT-20260201-0005

---

### Resolución #15: DTE aceptado pero no aparece en sistema MH

**Síntoma:** El sistema muestra que el DTE fue aceptado por Hacienda (tiene sello de recepción), pero al consultar el portal del Ministerio de Hacienda, la factura no aparece.
**Causa:** Existe una latencia normal entre la aceptación del DTE por el API de Hacienda y su aparición en el portal web del MH. Este proceso puede tomar entre 5 y 10 minutos, y en horas pico puede extenderse.
**Solución:**
1. Verificar que el DTE tenga sello de recepción válido en el sistema.
2. Esperar entre 5 y 10 minutos y volver a consultar en el portal de Hacienda.
3. Si después de 30 minutos no aparece, verificar el sello de recepción y el código de generación.
4. Como último recurso, contactar al soporte del Ministerio de Hacienda con el código de generación y el sello de recepción como evidencia.
**Prevención:** Informar a los usuarios sobre la latencia normal del portal MH. No confundir la ausencia temporal en el portal con un rechazo.
**Ticket de origen:** #TKT-20260204-0014

---

### Resolución #16: Error "NRC inválido" al transmitir

**Síntoma:** La transmisión de un CCF (tipo 03) es rechazada por Hacienda con el error "NRC inválido" o "Formato de NRC no válido".
**Causa:** El NRC del receptor se envió con guión (ej. `367475-0`) cuando Hacienda espera solo dígitos sin guión (ej. `3674750`). El validador de Hacienda acepta el patrón `^[0-9]{1,8}$`.
**Solución:**
1. Ir a **Clientes > [Cliente]** y verificar el campo NRC.
2. El sistema almacena el NRC como dígitos sin guión. Si se ingresó manualmente con guión, corregirlo.
3. El campo `nrcDisplay` se usa solo para la visualización al usuario (formato `XXXXXX-X`).
4. Guardar los cambios y retransmitir el DTE.
**Prevención:** La validación del formulario de clientes debe aceptar el NRC con o sin guión y normalizar automáticamente al formato sin guión para almacenamiento. Verificar que la normalización esté activa.
**Ticket de origen:** #TKT-20260207-0029

---

### Resolución #17: Transmisión extremadamente lenta

**Síntoma:** Las transmisiones a Hacienda tardan más de 30 segundos o el usuario percibe que el sistema está lento al facturar.
**Causa:** El servicio de Hacienda experimenta alta demanda, especialmente en fechas de cierre fiscal, fin de mes o durante el horario pico (8:00-12:00). Esto es un comportamiento normal del servicio externo.
**Solución:**
1. Verificar que la lentitud sea específica de la transmisión a Hacienda y no del sistema en general.
2. Explicar al usuario que la latencia proviene del servicio externo de Hacienda.
3. **No reenviar** la transmisión mientras esté en proceso, ya que puede causar duplicados.
4. Si la transmisión supera el timeout (60 segundos), el sistema la marcará como pendiente y reintentará automáticamente.
5. Verificar el estado real del DTE antes de asumir que falló.
**Prevención:** Configurar timeouts adecuados. Implementar cola de transmisión asíncrona para que el usuario no quede bloqueado esperando la respuesta de Hacienda. No permitir reenvíos manuales mientras haya una transmisión en curso.
**Ticket de origen:** #TKT-20260209-0037

---

### Resolución #18: Error al cambiar de ambiente (pruebas a producción)

**Síntoma:** Al cambiar el ambiente de Hacienda de pruebas a producción (o viceversa), las transmisiones fallan con errores de autenticación o certificado inválido.
**Causa:** Cada ambiente de Hacienda (pruebas y producción) requiere un certificado digital diferente. El certificado de pruebas no funciona en producción y viceversa. Además, las URLs de los endpoints son diferentes.
**Solución:**
1. Verificar en **Configuración > Hacienda** que el ambiente seleccionado sea el correcto.
2. Subir el certificado correspondiente al ambiente deseado (certificado de pruebas para pruebas, certificado de producción para producción).
3. Verificar que las credenciales (NIT, contraseña) sean las correctas para el ambiente.
4. Limpiar el cache de tokens (los tokens de un ambiente no sirven para otro).
5. Reiniciar el servicio API para limpiar el cache en memoria.
6. Realizar una transmisión de prueba para verificar la conectividad.
**Prevención:** Documentar claramente los certificados y credenciales de cada ambiente. No mezclar configuraciones entre ambientes. Mantener un checklist de cambio de ambiente.
**Ticket de origen:** #TKT-20260213-0021

---

## Correos

### Resolución #19: Cliente no recibe la factura por correo

**Síntoma:** El usuario envía una factura por correo electrónico al cliente, pero este reporta que nunca la recibió.
**Causa:** El correo puede haber sido filtrado como spam por el proveedor del destinatario, el correo del receptor está mal escrito, o el envío falló silenciosamente.
**Solución:**
1. Verificar en **Facturas > [Factura] > Historial de correos** si el envío fue exitoso o falló.
2. Confirmar que la dirección de correo del receptor sea correcta (revisar errores tipográficos comunes: `gmial.com`, `gmal.com`, etc.).
3. Solicitar al cliente que revise la carpeta de spam/correo no deseado.
4. Si el envío falló, revisar los logs para identificar el error específico.
5. Reenviar la factura desde **Facturas > [Factura] > Reenviar correo**.
**Prevención:** Validar el formato de correo electrónico al registrar clientes. Configurar registros SPF, DKIM y DMARC en el dominio de envío para mejorar la entregabilidad.
**Ticket de origen:** #TKT-20260119-0026

---

### Resolución #20: Gmail rechaza con "contraseña incorrecta"

**Síntoma:** Al configurar el envío de correos con una cuenta de Gmail, el sistema muestra "Authentication failed" o "Invalid credentials" a pesar de que la contraseña es correcta.
**Causa:** Gmail no permite autenticación con contraseña normal para aplicaciones de terceros. Se requiere una "Contraseña de aplicación" (App Password) que solo está disponible cuando la autenticación en dos pasos (2FA) está activada en la cuenta de Google.
**Solución:**
1. Indicar al usuario que active la verificación en dos pasos en su cuenta de Google: **Cuenta Google > Seguridad > Verificación en dos pasos**.
2. Una vez activada la 2FA, ir a **Cuenta Google > Seguridad > Contraseñas de aplicaciones**.
3. Generar una contraseña de aplicación para "Correo" y "Otro (nombre personalizado)".
4. Usar esa contraseña de 16 caracteres (sin espacios) en la configuración SMTP de Facturosv.
5. Configurar: servidor `smtp.gmail.com`, puerto `587`, TLS activado.
**Prevención:** Incluir instrucciones paso a paso para la configuración de Gmail en la documentación del usuario. Recomendar proveedores de correo transaccional como alternativa más confiable.
**Ticket de origen:** #TKT-20260123-0042

---

### Resolución #21: Error al conectar correo de Office 365

**Síntoma:** La configuración de correo con Microsoft Office 365 / Outlook falla con error de autenticación, a pesar de usar credenciales correctas.
**Causa:** Microsoft desactivó la autenticación básica (usuario/contraseña) para SMTP en Office 365. Se requiere autenticación OAuth2 para conectarse al servicio de correo.
**Solución:**
1. Verificar que el tenant de Office 365 tenga habilitada la autenticación SMTP: **Admin Center > Settings > Org Settings > Modern Authentication**.
2. Si la empresa requiere SMTP básico, el administrador de Office 365 debe habilitar SMTP AUTH para el buzón específico desde PowerShell: `Set-CASMailbox -Identity user@domain.com -SmtpClientAuthenticationDisabled $false`.
3. Como alternativa recomendada, configurar un servicio de correo transaccional (SendGrid, Mailgun) que soporte autenticación estándar.
4. Verificar: servidor `smtp.office365.com`, puerto `587`, STARTTLS activado.
**Prevención:** Recomendar servicios de correo transaccional para entornos empresariales. Documentar los requisitos específicos de Office 365 en la guía de configuración.
**Ticket de origen:** #TKT-20260127-0011

---

### Resolución #22: Correos de facturas llegan a la carpeta de spam

**Síntoma:** Los clientes reportan que los correos con las facturas adjuntas llegan consistentemente a la carpeta de spam o correo no deseado.
**Causa:** El dominio o la IP desde la que se envían los correos no tiene correctamente configurados los registros de autenticación de correo (SPF, DKIM, DMARC), o se está utilizando un servicio de correo genérico sin reputación establecida.
**Solución:**
1. Verificar la configuración DNS del dominio de envío: debe tener registros SPF, DKIM y DMARC correctos.
2. Si se usa un dominio genérico (gmail.com, outlook.com), considerar migrar a un servicio de correo transaccional profesional como SendGrid, Mailgun o Amazon SES.
3. Configurar el servicio transaccional en **Configuración > Correo > Proveedor SMTP**.
4. Realizar pruebas de envío a diferentes proveedores (Gmail, Outlook, Yahoo) para verificar la entregabilidad.
5. Evitar adjuntos excesivamente grandes que puedan activar filtros de spam.
**Prevención:** Usar un servicio de correo transaccional profesional desde el inicio. Configurar correctamente SPF, DKIM y DMARC para el dominio del emisor.
**Ticket de origen:** #TKT-20260202-0038

---

### Resolución #23: Límite de correos alcanzado

**Síntoma:** El sistema muestra "Límite de envío de correos alcanzado" y no permite enviar más facturas por correo electrónico.
**Causa:** Se alcanzó el rate limit configurado para el envío de correos. Este límite existe para proteger la reputación del dominio y cumplir con las restricciones del proveedor SMTP (ej. Gmail permite ~500 correos/día, SendGrid varía por plan).
**Solución:**
1. Verificar el límite actual en **Configuración > Correo > Límite de envío**.
2. Verificar cuántos correos se han enviado en el período actual.
3. Si se necesita un volumen mayor, ajustar el rate limit en la configuración (si el plan del proveedor SMTP lo permite).
4. Para envíos masivos, considerar migrar a un proveedor transaccional con mayor capacidad.
5. Los correos pendientes se encolarán y se enviarán automáticamente cuando se restablezca el límite.
**Prevención:** Dimensionar el proveedor de correo según el volumen de facturación esperado. Configurar alertas cuando el consumo alcance el 80% del límite diario.
**Ticket de origen:** #TKT-20260206-0016

---

### Resolución #24: Error "Connection timed out" al enviar correos

**Síntoma:** Al intentar enviar una factura por correo, el sistema muestra "Connection timed out" o "ETIMEDOUT" después de varios segundos de espera.
**Causa:** El puerto SMTP configurado está bloqueado por el firewall del servidor o del proveedor de hosting. Los puertos comunes son 25, 465 y 587, y algunos proveedores de nube bloquean el puerto 25 por defecto.
**Solución:**
1. Verificar la configuración SMTP en **Configuración > Correo**: servidor, puerto y tipo de seguridad.
2. Probar con el puerto 587 (STARTTLS) que es el más comúnmente aceptado.
3. Si el puerto 587 no funciona, probar con el puerto 465 (SSL/TLS directo).
4. Verificar que el firewall del servidor permita conexiones salientes al puerto configurado.
5. En Azure App Service, verificar que no haya restricciones de red (VNet) que bloqueen el tráfico SMTP saliente.
6. Como alternativa, usar un servicio de correo transaccional que ofrezca API HTTP en lugar de SMTP.
**Prevención:** Verificar la conectividad SMTP durante la configuración inicial. Documentar los puertos requeridos para el equipo de infraestructura.
**Ticket de origen:** #TKT-20260211-0024

---

## Contabilidad

### Resolución #25: Partidas contables no se postean automáticamente

**Síntoma:** Las facturas se crean y transmiten correctamente, pero no generan partidas contables automáticas. El libro diario permanece vacío.
**Causa:** La función de posteo automático de partidas contables está desactivada en la configuración del tenant. Esta función está desactivada por defecto y debe activarse manualmente.
**Solución:**
1. Ir a **Configuración > Contabilidad > Automatización**.
2. Activar la opción "Posteo automático de partidas".
3. Verificar que existan reglas de mapeo configuradas para cada tipo de DTE (01, 03, 05, etc.) en **Configuración > Contabilidad > Reglas de mapeo**.
4. Verificar que el catálogo de cuentas esté inicializado.
5. Las facturas creadas antes de activar esta función no generarán partidas retroactivamente; se deben crear manualmente si es necesario.
**Prevención:** Incluir la activación del posteo automático en el checklist de onboarding de nuevos clientes. Verificar que el catálogo de cuentas y las reglas de mapeo estén configurados antes de activar la función.
**Ticket de origen:** #TKT-20260126-0007

---

### Resolución #26: Balance general no cuadra

**Síntoma:** El balance general muestra una diferencia entre el total de débitos y el total de créditos. El reporte indica un desbalance.
**Causa:** Existe al menos una partida contable donde la suma de débitos no es igual a la suma de créditos. Esto puede ocurrir por ingreso manual de partidas con errores o por un redondeo incorrecto en partidas automáticas.
**Solución:**
1. Ir a **Contabilidad > Libro diario** y revisar las partidas del período afectado.
2. Filtrar las partidas que tengan desbalance (la columna de diferencia mostrará un valor distinto de cero).
3. Identificar la partida con error y corregir los montos para que débitos = créditos.
4. Si la partida ya fue posteada, crear una partida de ajuste para corregir la diferencia.
5. Regenerar el balance general para verificar que el desbalance fue corregido.
**Prevención:** El sistema valida que débitos = créditos antes de guardar una partida. No desactivar esta validación. Revisar periódicamente el balance para detectar desbalances tempranamente.
**Ticket de origen:** #TKT-20260131-0020

---

### Resolución #27: No puede postear una partida contable

**Síntoma:** Al intentar postear una partida contable, el sistema muestra un error indicando que la operación no está permitida.
**Causa:** Una o más cuentas utilizadas en la partida están inactivas o configuradas como cuentas de agrupación (no permiten posteo directo). Solo las cuentas de detalle activas admiten posteo.
**Solución:**
1. Identificar las cuentas usadas en la partida.
2. Ir a **Contabilidad > Catálogo de cuentas** y verificar el estado de cada cuenta.
3. Si una cuenta está inactiva, activarla haciendo clic en **Activar** (si la política contable lo permite).
4. Si la cuenta es de tipo agrupación (cuenta padre), seleccionar una subcuenta de detalle para la partida.
5. Guardar los cambios y reintentar el posteo.
**Prevención:** Al crear partidas, el sistema debe validar que todas las cuentas sean de detalle y estén activas antes de permitir el guardado. Revisar el catálogo de cuentas periódicamente.
**Ticket de origen:** #TKT-20260203-0035

---

### Resolución #28: Reportes contables no incluyen datos recientes

**Síntoma:** El usuario genera un reporte contable (balance, estado de resultados, libro mayor) y no aparecen las partidas más recientes.
**Causa:** El filtro de fecha del reporte no incluye el período donde se encuentran las partidas recientes. Por defecto, algunos reportes muestran el mes anterior o el último período cerrado.
**Solución:**
1. Verificar el rango de fechas seleccionado en el filtro del reporte.
2. Ajustar la fecha final para incluir el período actual (ej. fecha de hoy).
3. Si las partidas son del período actual y el reporte solo muestra períodos cerrados, verificar si hay un filtro de "solo períodos cerrados" activo.
4. Regenerar el reporte con el rango de fechas correcto.
5. Verificar que las partidas estén en estado "Posteado" (las partidas en borrador no aparecen en reportes).
**Prevención:** Configurar el rango de fechas por defecto de los reportes para incluir el período actual. Mostrar claramente las fechas del reporte en el encabezado.
**Ticket de origen:** #TKT-20260208-0043

---

### Resolución #29: Mapeo incorrecto — DTE se postea a cuenta equivocada

**Síntoma:** Las partidas automáticas generadas por facturación se registran en cuentas contables incorrectas (ej. ventas gravadas se postean a ventas exentas, o el IVA se registra en una cuenta diferente).
**Causa:** Las reglas de mapeo entre tipos de DTE y cuentas contables están mal configuradas. Cada tipo de DTE (01, 03, 05, etc.) tiene una regla que define a qué cuentas se debitan y acreditan los diferentes conceptos.
**Solución:**
1. Ir a **Configuración > Contabilidad > Reglas de mapeo**.
2. Localizar la regla del tipo de DTE afectado.
3. Ajustar las cuentas de destino para cada concepto: ventas, IVA débito fiscal, cuentas por cobrar, etc.
4. Guardar la regla actualizada.
5. Las partidas generadas anteriormente con el mapeo incorrecto deben corregirse manualmente o eliminarse y regenerarse.
**Prevención:** Revisar las reglas de mapeo con el contador del cliente durante el onboarding. Realizar pruebas con facturas de prueba antes de activar el posteo automático en producción.
**Ticket de origen:** #TKT-20260214-0010

---

### Resolución #30: Error "Cuenta no encontrada" al generar partida automática

**Síntoma:** Al crear una factura con posteo automático activado, el sistema muestra "Cuenta contable no encontrada" y no genera la partida.
**Causa:** El catálogo de cuentas no ha sido inicializado para el tenant, o las cuentas referenciadas en las reglas de mapeo fueron eliminadas o no existen en el catálogo actual.
**Solución:**
1. Ir a **Contabilidad > Catálogo de cuentas** y verificar si hay cuentas registradas.
2. Si el catálogo está vacío, inicializarlo desde **Configuración > Contabilidad > Sembrar catálogo NIIF** para cargar el catálogo estándar basado en NIIF para PYMES.
3. Si el catálogo existe pero faltan cuentas específicas, crearlas manualmente según las necesidades del cliente.
4. Actualizar las reglas de mapeo en **Configuración > Contabilidad > Reglas de mapeo** para que referencien cuentas válidas del catálogo.
5. Reintentar la generación de la partida.
**Prevención:** Sembrar el catálogo de cuentas como parte del proceso de onboarding. Validar que las reglas de mapeo referencien cuentas existentes antes de activar el posteo automático.
**Ticket de origen:** #TKT-20260216-0032

---

## Cotizaciones

### Resolución #31: Cliente no puede aprobar la cotización

**Síntoma:** El cliente hace clic en el enlace de aprobación de la cotización y recibe un mensaje de error indicando que el enlace no es válido o ha expirado.
**Causa:** Los enlaces de aprobación de cotizaciones tienen una fecha de expiración. Si el cliente intenta aprobar después de la fecha de vencimiento configurada en la cotización, el enlace ya no es válido.
**Solución:**
1. Verificar la fecha de vencimiento de la cotización en **Cotizaciones > [Cotización]**.
2. Si la cotización venció, el usuario interno puede extender la fecha de vencimiento desde la vista de detalle.
3. Reenviar la cotización al cliente con el enlace actualizado desde **Cotizaciones > [Cotización] > Reenviar**.
4. Confirmar con el cliente que el nuevo enlace funciona correctamente.
**Prevención:** Configurar fechas de vencimiento razonables según el ciclo de ventas del negocio. Activar recordatorios automáticos para cotizaciones próximas a vencer.
**Ticket de origen:** #TKT-20260129-0013

---

### Resolución #32: Portal de aprobación de cotización no carga

**Síntoma:** El cliente accede al enlace de la cotización y la página se muestra en blanco, con error, o muestra un mensaje genérico de "cotización no disponible".
**Causa:** La cotización ya fue procesada (aprobada, rechazada o expirada) y el portal no permite acciones adicionales sobre ella. También puede ocurrir si el UUID del enlace fue alterado.
**Solución:**
1. Verificar el estado actual de la cotización en el sistema.
2. Si ya fue aprobada, informar al cliente que la cotización ya fue procesada exitosamente.
3. Si fue rechazada, el cliente debe solicitar una nueva cotización.
4. Si fue expirada, el usuario interno puede crear una nueva versión de la cotización.
5. Si el enlace está corrupto (UUID alterado), reenviar el enlace correcto al cliente.
**Prevención:** Mostrar un mensaje claro en el portal cuando la cotización ya fue procesada, indicando su estado actual. Incluir información de contacto para que el cliente pueda comunicarse si tiene dudas.
**Ticket de origen:** #TKT-20260133-0025

---

### Resolución #33: No puede convertir cotización a factura

**Síntoma:** El usuario intenta convertir una cotización aprobada a factura y el botón "Convertir a factura" no está disponible o muestra un error.
**Causa:** Solo las cotizaciones en estado APPROVED o PARTIALLY_APPROVED pueden convertirse a factura. Si la cotización está en estado DRAFT, SENT, REJECTED o EXPIRED, la conversión no está habilitada.
**Solución:**
1. Verificar el estado de la cotización en **Cotizaciones > [Cotización]**.
2. Si está en DRAFT o SENT, esperar a que el cliente la apruebe a través del portal.
3. Si está en REJECTED, crear una nueva cotización con los ajustes necesarios.
4. Si está en EXPIRED, crear una nueva versión con fecha de vencimiento actualizada.
5. Si está en APPROVED o PARTIALLY_APPROVED y el botón no aparece, verificar que el usuario tenga permisos de creación de facturas.
**Prevención:** Documentar el flujo completo de cotización a factura para los usuarios. Mostrar claramente el estado de la cotización y las acciones disponibles en cada estado.
**Ticket de origen:** #TKT-20260206-0039

---

### Resolución #34: Se muestra versión anterior de la cotización

**Síntoma:** El cliente reporta que la cotización que ve en el portal tiene precios o ítems desactualizados, a pesar de que el usuario ya creó una versión actualizada.
**Causa:** Cuando se crea una nueva versión de una cotización, se genera un nuevo enlace de aprobación. El cliente sigue accediendo al enlace de la versión anterior, que muestra los datos originales.
**Solución:**
1. Verificar en **Cotizaciones > [Cotización]** que exista una versión más reciente.
2. Copiar el enlace de la versión actualizada.
3. Enviar al cliente el nuevo enlace desde **Cotizaciones > [Cotización más reciente] > Compartir enlace**.
4. Opcionalmente, invalidar la versión anterior para evitar confusión.
**Prevención:** Al crear una nueva versión, el sistema debería invalidar automáticamente las versiones anteriores y notificar al cliente con el enlace actualizado. Comunicar proactivamente al cliente cuando hay cambios en la cotización.
**Ticket de origen:** #TKT-20260210-0017

---

## General

### Resolución #35: Cuenta bloqueada por intentos fallidos de inicio de sesión

**Síntoma:** El usuario no puede iniciar sesión y recibe el mensaje "Cuenta bloqueada temporalmente. Intente de nuevo más tarde".
**Causa:** Se realizaron 5 intentos consecutivos de inicio de sesión con contraseña incorrecta. Como medida de seguridad, la cuenta se bloquea temporalmente por 15 minutos.
**Solución:**
1. Informar al usuario que debe esperar 15 minutos desde el último intento fallido.
2. Después de 15 minutos, intentar iniciar sesión con la contraseña correcta.
3. Si el usuario olvidó su contraseña, utilizar la opción "Olvidé mi contraseña" para restablecerla.
4. Si el problema persiste después del desbloqueo, un administrador puede desbloquear la cuenta manualmente desde **Administración > Usuarios > [Usuario] > Desbloquear**.
**Prevención:** Recomendar a los usuarios que utilicen un gestor de contraseñas. Implementar recuperación de contraseña por correo electrónico antes de agotar los intentos.
**Ticket de origen:** #TKT-20260117-0003

---

### Resolución #36: No puede cambiar de plan de suscripción

**Síntoma:** El usuario intenta cambiar su plan desde la configuración y no ve la opción o recibe un error al intentar hacerlo.
**Causa:** Solo los usuarios con rol de administrador del tenant pueden modificar el plan de suscripción. Los usuarios con roles de operador o visor no tienen acceso a esta funcionalidad.
**Solución:**
1. Verificar el rol del usuario en **Administración > Usuarios**.
2. Si el usuario no es administrador, solicitar al administrador del tenant que realice el cambio de plan.
3. El administrador debe ir a **Configuración > Facturación > Planes** para ver las opciones disponibles.
4. Seleccionar el nuevo plan y confirmar el cambio.
5. Si la empresa no tiene un administrador activo, contactar al equipo de soporte de Facturosv para asistencia.
**Prevención:** Asegurar que cada tenant tenga al menos dos usuarios con rol de administrador como respaldo. Documentar quién es el administrador de cada cuenta empresarial.
**Ticket de origen:** #TKT-20260121-0028

---

### Resolución #37: Importación de clientes falla

**Síntoma:** El usuario intenta importar clientes desde un archivo CSV y el sistema muestra errores de validación o el proceso falla sin importar ningún registro.
**Causa:** El formato del archivo CSV no cumple con la estructura esperada. Errores comunes incluyen: delimitador incorrecto (punto y coma en lugar de coma), campos obligatorios faltantes (nombre, tipo de documento, número de documento), codificación de caracteres incorrecta (debe ser UTF-8), o formato de dirección incorrecto.
**Solución:**
1. Descargar la plantilla CSV de ejemplo desde **Clientes > Importar > Descargar plantilla**.
2. Verificar que el archivo del usuario tenga las columnas requeridas: `nombre`, `tipoDocumento`, `numDocumento`, `correo`, `telefono`, `departamento`, `municipio`, `complemento`.
3. Verificar que el delimitador sea coma (`,`) y la codificación sea UTF-8.
4. Verificar que no haya filas vacías ni caracteres especiales no soportados.
5. Corregir el archivo y reintentar la importación.
**Prevención:** Proporcionar la plantilla CSV con datos de ejemplo. Incluir validación detallada que indique exactamente qué filas y columnas tienen errores.
**Ticket de origen:** #TKT-20260124-0036

---

### Resolución #38: Logo no se muestra en el PDF de la factura

**Síntoma:** El PDF de la factura se genera correctamente pero el espacio del logo aparece vacío o con un ícono de imagen rota.
**Causa:** El archivo del logo subido está en un formato no soportado por el generador de PDF (ej. SVG, WebP, BMP) o el archivo está corrupto. El sistema soporta formatos PNG y JPG/JPEG.
**Solución:**
1. Ir a **Configuración > Empresa > Logo** y verificar el archivo subido.
2. Descargar el logo actual para verificar que no esté corrupto.
3. Si el formato no es PNG o JPG, convertir la imagen al formato correcto usando cualquier editor de imágenes.
4. Subir el nuevo archivo de logo en formato PNG o JPG.
5. Recomendaciones: resolución mínima de 200x200 píxeles, tamaño máximo 2 MB, fondo transparente (solo PNG).
6. Generar un PDF de prueba para verificar que el logo se muestra correctamente.
**Prevención:** Validar el formato del archivo al momento de subir el logo y rechazar formatos no soportados con un mensaje claro. Mostrar una vista previa del logo antes de guardar.
**Ticket de origen:** #TKT-20260204-0040

---

### Resolución #39: Sesión expira frecuentemente

**Síntoma:** El usuario reporta que su sesión se cierra automáticamente con demasiada frecuencia, obligándolo a iniciar sesión repetidamente durante el día.
**Causa:** El token JWT de autenticación tiene una duración de 8 horas. Después de ese período, el token expira y el usuario debe autenticarse nuevamente. Esto es un comportamiento de seguridad esperado.
**Solución:**
1. Explicar al usuario que la expiración de sesión cada 8 horas es una medida de seguridad estándar.
2. Si la sesión expira antes de las 8 horas, verificar que el usuario no esté accediendo desde múltiples dispositivos o navegadores (cada inicio de sesión no invalida tokens anteriores, pero puede causar confusión).
3. Verificar que el reloj del dispositivo del usuario esté sincronizado (un reloj adelantado puede causar expiración prematura del token).
4. Si la expiración frecuente impacta significativamente la productividad, evaluar ajustar la duración del token en la configuración del servidor (variable de entorno `JWT_EXPIRATION`).
**Prevención:** Implementar refresh tokens para extender la sesión automáticamente sin intervención del usuario. Mostrar un aviso 5 minutos antes de la expiración para que el usuario pueda renovar la sesión.
**Ticket de origen:** #TKT-20260219-0006

---

> **Nota para el equipo de soporte:** Este documento se actualiza periódicamente con nuevas resoluciones. Si encuentra un caso que no está cubierto, documentarlo siguiendo el formato establecido y enviarlo al equipo de desarrollo para su inclusión.
