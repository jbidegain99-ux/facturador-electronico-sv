# Solucion de Problemas - Integraciones

Esta guia cubre los problemas mas comunes al configurar y usar las integraciones de Facturosv, junto con sus soluciones.

---

## 1. Correo externo: "Error de autenticacion" al probar conexion

**Sintomas:** Al hacer clic en "Probar conexion" con un proveedor de correo, aparece un error de autenticacion.

**Causas y soluciones:**

- **API Key incorrecta:** Verifique que copio la clave completa, sin espacios al inicio o final. Regenere la clave si es necesario.
- **Gmail sin contrasena de aplicacion:** Si usa Google Workspace o Gmail, debe generar una contrasena de aplicacion. La contrasena normal de su cuenta no funciona con SMTP. Vea la seccion [Gmail](./correos-externos.md#google-workspace--gmail).
- **2FA no habilitado en Gmail:** Las contrasenas de aplicacion requieren que la verificacion en dos pasos este activa.
- **Credenciales de Office 365 expiradas:** Los secretos de cliente en Azure AD tienen fecha de expiracion. Verifique en el portal de Azure que el secreto no haya expirado y genere uno nuevo si es necesario.

---

## 2. Correo externo: los correos llegan a la carpeta de spam

**Sintomas:** Los correos se envian exitosamente pero los destinatarios los encuentran en spam.

**Soluciones:**

- **Configure registros SPF, DKIM y DMARC** en el DNS de su dominio. La mayoria de proveedores (SendGrid, Mailgun, Postmark) proporcionan instrucciones especificas.
- **Verifique su dominio remitente** en el panel del proveedor de correo. Enviar desde un dominio no verificado reduce drasticamente la entregabilidad.
- **Evite contenido que active filtros de spam:** exceso de mayusculas, muchos enlaces, o enviar a listas muy grandes sin historial.
- **Revise la reputacion de su dominio** usando herramientas como [mail-tester.com](https://www.mail-tester.com).

---

## 3. Hacienda: "Error 401" o "Unauthorized" al probar conexion

**Sintomas:** La prueba de conexion con Hacienda falla con error 401 o "No autorizado".

**Soluciones:**

- **Credenciales incorrectas:** Verifique que el usuario y contrasena de la API de Hacienda son correctos. Estas credenciales son diferentes a las del portal web de Hacienda.
- **Token en cache expirado:** Si cambio sus credenciales en el portal de Hacienda, Facturosv puede estar usando un token en cache. Vaya a la configuracion de Hacienda y haga clic en **Guardar** nuevamente para forzar la renovacion del token.
- **Cuerpo de respuesta vacio:** La API de Hacienda retorna un cuerpo vacio en errores 401/403. Si ve un error sin mensaje descriptivo, el problema casi siempre es de credenciales.
- **Entorno incorrecto:** Verifique que esta usando las credenciales del entorno correcto (TEST vs. PRODUCTION).

---

## 4. Hacienda: "Error de firma" o "Certificado invalido"

**Sintomas:** Los DTEs se crean pero fallan al firmar o transmitir, con un error relacionado al certificado.

**Soluciones:**

- **Certificado no cargado en el portal de Hacienda:** Despues de generar un certificado nuevo en el portal de Hacienda, debe hacer clic en **Cargar Certificado** para registrarlo. Solo descargarlo no es suficiente.
- **Contrasena del certificado incorrecta:** Verifique que la contrasena ingresada es la que definio al generar el certificado.
- **Formato .crt de Hacienda:** Los archivos `.crt` de Hacienda son XML con etiqueta `<CertificadoMH>`, no certificados X.509 estandar. Facturosv los maneja correctamente, pero si intenta abrirlos con herramientas estandar de certificados, no funcionaran.
- **Certificado expirado:** Los certificados tienen fecha de vencimiento. Genere uno nuevo en el portal de Hacienda si el actual esta vencido.

---

## 5. Hacienda: DTEs rechazados con errores de formato

**Sintomas:** Los DTEs se transmiten pero Hacienda los rechaza con errores de validacion de formato.

**Soluciones:**

- **Direccion del receptor en formato incorrecto:** La direccion debe ser un objeto con campos `departamento`, `municipio` y `complemento`, no una cadena de texto. Facturosv normaliza esto automaticamente, pero si usa la API REST, asegurese de enviar el formato correcto.
- **NRC con guion:** El NRC debe enviarse sin guion a Hacienda (solo digitos). Facturosv maneja la conversion automaticamente.
- **Decimales sin redondear:** Todos los montos deben tener exactamente 2 decimales. Facturosv redondea automaticamente, pero verifique los datos si usa la API.
- **Campo totalLetras incorrecto:** Facturosv genera este campo automaticamente. Si usa la API, no es necesario enviarlo.

---

## 6. Webhooks: el endpoint no recibe eventos

**Sintomas:** Configuro un webhook pero su servidor no recibe ninguna notificacion.

**Soluciones:**

- **URL no accesible:** Verifique que su URL es publica y accesible desde internet. Facturosv no puede enviar webhooks a URLs de redes privadas (localhost, 192.168.x.x, 10.x.x.x).
- **HTTPS requerido:** Los webhooks solo se envian a URLs con HTTPS. URLs con HTTP no son aceptadas.
- **Firewall bloqueando:** Verifique que su firewall o WAF no esta bloqueando las solicitudes entrantes de Facturosv.
- **Eventos no seleccionados:** Verifique que selecciono los eventos correctos al crear el endpoint.
- **Use el ping de prueba:** Envie un ping de prueba desde la configuracion del webhook para diagnosticar el problema.

---

## 7. Webhooks: eventos en estado DEAD_LETTER

**Sintomas:** Los eventos aparecen como DEAD_LETTER en el historial de entregas.

**Causas:**

- Su servidor no respondio a tiempo (timeout de 30 segundos).
- Su servidor respondio con un codigo de error (4xx o 5xx) en los 5 reintentos.
- Su servidor estuvo caido durante el periodo de reintentos.

**Soluciones:**

- Revise los logs de su servidor para identificar el error.
- Verifique que su endpoint responde con un codigo `2xx` rapidamente. Si necesita hacer procesamiento pesado, responda `200` inmediatamente y procese de forma asincrona.
- Haga clic en **Reenviar** para intentar la entrega nuevamente despues de resolver el problema.
- Considere aumentar el numero maximo de reintentos en la configuracion del endpoint.

---

## 8. API REST: "Error 429 Too Many Requests"

**Sintomas:** La API retorna error 429 y sus solicitudes son rechazadas.

**Soluciones:**

- **Esta excediendo el limite de solicitudes.** El plan Enterprise permite 60 solicitudes por minuto y 1,000 por hora.
- Implemente **espera exponencial (exponential backoff)**: cuando reciba un 429, espere antes de reintentar. Consulte el encabezado `X-RateLimit-Reset` para saber cuando se reinicia el contador.
- **Optimice sus llamadas:** En lugar de consultar la API frecuentemente, use webhooks para ser notificado de cambios.
- Si necesita limites mas altos, contacte al equipo de soporte.

---

## 9. API REST: "Error 401 Unauthorized" con token valido

**Sintomas:** Su token funciono previamente pero ahora retorna 401.

**Soluciones:**

- **Token revocado:** Verifique en **Configuracion > API REST > Claves activas** que su token no haya sido revocado por otro administrador.
- **Token expirado:** Los tokens JWT pueden tener fecha de expiracion. Genere un nuevo token si es necesario.
- **Encabezado incorrecto:** Verifique que el encabezado es exactamente `Authorization: Bearer <token>` (con el prefijo "Bearer " y un espacio antes del token). Esto es diferente a la API de Hacienda que no usa el prefijo Bearer.
- **Plan degradado:** Si su cuenta fue degradada de Enterprise a otro plan, el acceso a la API REST se desactiva.

---

## 10. General: la integracion muestra estado UNKNOWN

**Sintomas:** Una integracion muestra el estado de salud como UNKNOWN.

**Soluciones:**

- **Primera configuracion:** Es normal que el estado sea UNKNOWN inmediatamente despues de configurar una integracion. Espere unos minutos para que el sistema ejecute la primera verificacion.
- **Pruebe la conexion manualmente:** Haga clic en **Probar conexion** para forzar una verificacion inmediata.
- **Credenciales incompletas:** Verifique que todos los campos requeridos esten completos. Una configuracion parcialmente guardada puede quedar en estado UNKNOWN.

---

## Obtener ayuda adicional

Si su problema no esta listado aqui:

1. Revise la guia especifica de la integracion que esta usando.
2. Use la funcion **Necesito ayuda** dentro del formulario de configuracion.
3. Contacte al equipo de soporte a traves de **Ayuda > Contactar soporte** en el menu de Facturosv.
