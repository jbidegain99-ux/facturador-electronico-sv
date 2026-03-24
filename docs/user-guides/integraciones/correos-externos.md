# Correos Externos

Configure un proveedor de correo externo para que los DTEs, cotizaciones y notificaciones se envien desde su propio dominio (por ejemplo, `facturacion@suempresa.com`) en lugar del dominio predeterminado de Facturosv.

## Por que usar correo externo

- **Marca profesional**: Los correos llegan desde su dominio, no desde `noreply@facturosv.com`.
- **Mejor entregabilidad**: Los proveedores especializados tienen mejor reputacion de envio y reducen la probabilidad de caer en spam.
- **Control total**: Defina limites de envio, monitoree estadisticas y gestione rebotes desde su proveedor.
- **Cumplimiento**: Algunas empresas requieren que toda comunicacion salga de servidores controlados internamente.

## Proveedores compatibles

Facturosv soporta 9 proveedores de correo:

| Proveedor | Metodo de autenticacion | Dificultad |
|-----------|------------------------|------------|
| SendGrid | API_KEY | Facil |
| Mailgun | API_KEY | Facil |
| Amazon SES | AWS_IAM | Media |
| Postmark | API_KEY | Facil |
| Brevo (ex-Sendinblue) | API_KEY | Facil |
| Mailtrap | API_KEY | Facil |
| Microsoft 365 | OAUTH2 | Media |
| Google Workspace / Gmail | SMTP_BASIC (App Password) | Media |
| SMTP Generico | SMTP_BASIC | Variable |

## Configuracion general

Todos los proveedores comparten los siguientes campos de configuracion:

| Campo | Descripcion | Requerido |
|-------|-------------|-----------|
| Proveedor | Seleccione de la lista de 9 proveedores | Si |
| Metodo de autenticacion | API_KEY, SMTP_BASIC, OAUTH2 o AWS_IAM | Si |
| Correo remitente (fromEmail) | Direccion desde la que se envian correos | Si |
| Nombre remitente (fromName) | Nombre que aparece como remitente | Si |
| Correo de respuesta (replyToEmail) | Direccion para respuestas (opcional) | No |
| Limite por hora (rateLimitPerHour) | Entre 1 y 10,000. Predeterminado: 100 | No |

---

## SendGrid

SendGrid es uno de los proveedores mas populares y faciles de configurar.

### Paso 1: Crear cuenta y API Key

1. Registrese en [sendgrid.com](https://sendgrid.com).
2. Vaya a **Settings > API Keys**.
3. Haga clic en **Create API Key**.
4. Seleccione **Restricted Access** y habilite unicamente el permiso **Mail Send > Full Access**.
5. Copie la API Key generada (solo se muestra una vez).

### Paso 2: Verificar dominio remitente

1. En SendGrid, vaya a **Settings > Sender Authentication**.
2. Haga clic en **Authenticate Your Domain**.
3. Siga las instrucciones para agregar los registros DNS (CNAME) en su proveedor de dominio.
4. Espere la verificacion (puede tardar hasta 48 horas).

### Paso 3: Configurar en Facturosv

1. Vaya a **Configuracion > Integraciones > Correos Externos**.
2. Seleccione **SendGrid** como proveedor.
3. Metodo de autenticacion: **API_KEY**.
4. Pegue su API Key en el campo correspondiente.
5. Ingrese su correo remitente verificado.
6. Haga clic en **Probar conexion**.
7. Si la prueba es exitosa, haga clic en **Guardar**.

---

## Mailgun

### Paso 1: Obtener credenciales

1. Registrese en [mailgun.com](https://www.mailgun.com).
2. Vaya a **Sending > Domains** y agregue su dominio.
3. Configure los registros DNS indicados por Mailgun.
4. Vaya a **Settings > API Security** y copie su API Key.

### Paso 2: Configurar en Facturosv

1. Seleccione **Mailgun** como proveedor.
2. Metodo de autenticacion: **API_KEY**.
3. Pegue su API Key.
4. Ingrese el correo remitente (debe pertenecer al dominio verificado).
5. Pruebe la conexion y guarde.

---

## Amazon SES

### Paso 1: Configurar IAM

1. En la consola de AWS, vaya a **IAM > Users**.
2. Cree un usuario con acceso programatico.
3. Adjunte la politica `AmazonSESFullAccess` (o una politica personalizada mas restrictiva).
4. Copie el **Access Key ID** y **Secret Access Key**.

### Paso 2: Verificar identidad

1. En **Amazon SES > Verified identities**, agregue y verifique su dominio o direccion de correo.
2. Si su cuenta esta en sandbox, solicite salir del sandbox para enviar a cualquier destinatario.

### Paso 3: Configurar en Facturosv

1. Seleccione **Amazon SES** como proveedor.
2. Metodo de autenticacion: **AWS_IAM**.
3. Ingrese su Access Key ID y Secret Access Key.
4. Seleccione la region de AWS donde configuro SES (por ejemplo, `us-east-1`).
5. Pruebe la conexion y guarde.

---

## Microsoft 365

### Paso 1: Registrar aplicacion en Azure AD

1. Inicie sesion en [portal.azure.com](https://portal.azure.com).
2. Vaya a **Azure Active Directory > App registrations > New registration**.
3. Nombre la aplicacion (por ejemplo, "Facturosv Email").
4. En **Redirect URI**, seleccione **Web** e ingrese: `https://facturosv.com/api/integrations/oauth/callback`.
5. Haga clic en **Register**.

### Paso 2: Configurar permisos

1. En la aplicacion registrada, vaya a **API permissions**.
2. Agregue el permiso **Microsoft Graph > Mail.Send** (tipo delegado).
3. Haga clic en **Grant admin consent**.

### Paso 3: Crear secreto

1. Vaya a **Certificates & secrets > New client secret**.
2. Copie el **Value** del secreto generado (solo se muestra una vez).
3. Anote tambien el **Application (client) ID** y **Directory (tenant) ID** de la pagina principal de la aplicacion.

### Paso 4: Configurar en Facturosv

1. Seleccione **Microsoft 365** como proveedor.
2. Metodo de autenticacion: **OAUTH2**.
3. Ingrese el Client ID, Client Secret y Tenant ID.
4. Ingrese el correo remitente (debe ser un buzon valido en su tenant de Microsoft 365).
5. Haga clic en **Autorizar** para completar el flujo OAuth2.
6. Pruebe la conexion y guarde.

---

## Google Workspace / Gmail

Para Gmail se utiliza una contrasena de aplicacion en lugar de OAuth2. Esto requiere tener la verificacion en dos pasos habilitada.

### Paso 1: Habilitar verificacion en dos pasos (2FA)

1. Inicie sesion en [myaccount.google.com](https://myaccount.google.com).
2. Vaya a **Seguridad > Verificacion en dos pasos**.
3. Siga las instrucciones para activarla (necesitara su telefono).

### Paso 2: Generar contrasena de aplicacion

1. Despues de habilitar 2FA, vuelva a **Seguridad**.
2. Busque **Contrasenas de aplicaciones** (o acceda directamente a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
3. Seleccione la aplicacion: **Correo**.
4. Seleccione el dispositivo: **Otro** e ingrese "Facturosv".
5. Haga clic en **Generar**.
6. Copie la contrasena de 16 caracteres que se muestra (sin espacios).

### Paso 3: Configurar en Facturosv

1. Seleccione **Google Workspace** como proveedor.
2. Metodo de autenticacion: **SMTP_BASIC**.
3. Ingrese su correo de Gmail como usuario SMTP.
4. Pegue la contrasena de aplicacion de 16 caracteres como contrasena SMTP.
5. El servidor SMTP (`smtp.gmail.com`) y puerto (`587`) se configuran automaticamente.
6. Pruebe la conexion y guarde.

> **Importante:** No use su contrasena normal de Google. Siempre use una contrasena de aplicacion. Las contrasenas de aplicacion solo funcionan con 2FA habilitado.

---

## Postmark

### Paso 1: Obtener Server API Token

1. Registrese en [postmarkapp.com](https://postmarkapp.com).
2. Cree un servidor o use el servidor predeterminado.
3. Vaya a **Server > API Tokens** y copie el token.
4. Agregue y verifique su dominio remitente en **Sender Signatures**.

### Paso 2: Configurar en Facturosv

1. Seleccione **Postmark** como proveedor.
2. Metodo de autenticacion: **API_KEY**.
3. Pegue su Server API Token.
4. Ingrese el correo remitente verificado.
5. Pruebe la conexion y guarde.

---

## Brevo (ex-Sendinblue)

### Paso 1: Obtener API Key

1. Registrese en [brevo.com](https://www.brevo.com).
2. Vaya a **Settings > SMTP & API > API Keys**.
3. Haga clic en **Generate a new API Key** y copiela.

### Paso 2: Configurar en Facturosv

1. Seleccione **Brevo** como proveedor.
2. Metodo de autenticacion: **API_KEY**.
3. Pegue su API Key.
4. Ingrese el correo remitente.
5. Pruebe la conexion y guarde.

---

## Mailtrap

Mailtrap es ideal para pruebas en desarrollo, pero tambien ofrece envio en produccion.

### Paso 1: Obtener API Token

1. Registrese en [mailtrap.io](https://mailtrap.io).
2. Vaya a **Sending Domains** y verifique su dominio.
3. Vaya a **Settings > API Tokens** y copie su token.

### Paso 2: Configurar en Facturosv

1. Seleccione **Mailtrap** como proveedor.
2. Metodo de autenticacion: **API_KEY**.
3. Pegue su API Token.
4. Ingrese el correo remitente verificado.
5. Pruebe la conexion y guarde.

---

## SMTP Generico

Use esta opcion para cualquier servidor SMTP que no este en la lista de proveedores predefinidos.

### Configurar en Facturosv

1. Seleccione **SMTP Generico** como proveedor.
2. Metodo de autenticacion: **SMTP_BASIC**.
3. Complete los campos del servidor SMTP:

| Campo | Ejemplo |
|-------|---------|
| Host SMTP | `mail.suempresa.com` |
| Puerto | `587` (TLS) o `465` (SSL) |
| Usuario | `facturacion@suempresa.com` |
| Contrasena | Su contrasena SMTP |

4. Ingrese el correo remitente.
5. Pruebe la conexion y guarde.

> **Puertos comunes:**
> - `587` - STARTTLS (recomendado)
> - `465` - SSL/TLS implicito
> - `25` - Sin cifrado (no recomendado)

---

## Probar la conexion

Despues de configurar cualquier proveedor, Facturosv ofrece dos funciones de prueba:

### Probar conexion

Verifica que las credenciales son validas y que el servidor responde correctamente. No envia ningun correo.

1. Haga clic en **Probar conexion**.
2. Espere el resultado:
   - **Exitoso**: Las credenciales son validas.
   - **Error**: Revise las credenciales y la configuracion del proveedor.

### Enviar correo de prueba

Envia un correo real a una direccion que usted especifique.

1. Haga clic en **Enviar correo de prueba**.
2. Ingrese la direccion de correo destinatario.
3. Verifique que el correo llego a la bandeja de entrada.
4. Revise que el remitente, nombre y formato son correctos.

---

## Limites de envio

El campo **Limite por hora (rateLimitPerHour)** controla cuantos correos puede enviar Facturosv por hora a traves de su proveedor. Esto previene exceder las cuotas de su plan.

| Valor | Descripcion |
|-------|-------------|
| 1 | Minimo permitido |
| 100 | Valor predeterminado |
| 10,000 | Maximo permitido |

**Recomendaciones:**
- Consulte los limites de su plan en el proveedor de correo y configure un valor igual o menor.
- SendGrid gratuito: 100 correos/dia. Configure `rateLimitPerHour` en 10-15.
- Gmail: 500 correos/dia. Configure `rateLimitPerHour` en 50.
- Si necesita enviar mas de 10,000 correos por hora, contacte soporte.

---

## Monitoreo de salud

Facturosv monitorea continuamente el estado de su conexion de correo:

| Estado | Significado |
|--------|-------------|
| **HEALTHY** | La conexion funciona correctamente. |
| **DEGRADED** | La conexion funciona pero con errores intermitentes (por ejemplo, algunos correos rebotan). |
| **UNHEALTHY** | La conexion fallo. Los correos no se estan enviando. Requiere atencion inmediata. |
| **UNKNOWN** | No se ha podido determinar el estado. Generalmente aparece al configurar por primera vez. |

Si el estado cambia a DEGRADED o UNHEALTHY, Facturosv mostrara una alerta en el panel de integraciones.

---

## Asistencia de configuracion

Si tiene dificultades para configurar su proveedor de correo, Facturosv incluye un sistema de asistencia integrado que le guia paso a paso segun el proveedor seleccionado. Acceda a esta funcion haciendo clic en **Necesito ayuda** dentro del formulario de configuracion de correo externo.
