# Troubleshooting — Correos Electrónicos

## Error: Cliente no recibe la factura por correo

**Síntoma:**
Enviaste una factura por correo pero el cliente dice que no la recibió.

**Causas posibles:**

### 1. Correo del receptor incorrecto
**Solución:**
1. Verifica el campo `correo` del cliente en **Clientes > [nombre del cliente]**
2. Revisa que no tenga errores tipográficos
3. Actualiza el correo y reenvía la factura

### 2. Correo en carpeta de spam
El correo puede haber sido filtrado como spam por el proveedor del destinatario.

**Solución:**
1. Pide al cliente que revise su carpeta de **spam/correo no deseado**
2. Si el correo está ahí, que lo marque como "No es spam"
3. Para reducir la probabilidad de spam:
   - Usa un correo externo profesional (SendGrid, Mailgun) en lugar del correo por defecto
   - Configura registros SPF/DKIM en tu dominio
   - Disponible en plan PROFESSIONAL+

### 3. Falla en el servicio de correo
El envío puede haber fallado silenciosamente.

**Solución:**
1. Ve al detalle de la factura
2. Verifica el log de envío de correo
3. Si muestra error, intenta reenviar con el botón **Enviar por correo**

### 4. Sin correo configurado para el receptor
El DTE no tiene correo del receptor definido.

**Solución:**
1. Al crear la factura, asegúrate de que el cliente tenga correo registrado
2. El sistema envía automáticamente al `receptor.correo` del DTE al transmitir exitosamente

**¿Aún hay problema?**
→ Crea un ticket EMAIL_CONFIG con el ID de la factura y el correo destino

---

## Error: Gmail rechaza conexión "contraseña incorrecta"

**Síntoma:**
Al configurar Gmail como proveedor de correo externo, da error de autenticación.

**Causa:** Gmail no acepta contraseñas normales para aplicaciones de terceros. Necesitas una **contraseña de aplicación** (App Password).

**Solución paso a paso:**

### Paso 1: Habilitar verificación en 2 pasos
1. Ve a [myaccount.google.com/security](https://myaccount.google.com/security)
2. En "Inicio de sesión en Google", activa **Verificación en 2 pasos**
3. Sigue el asistente (necesitarás tu teléfono)

### Paso 2: Generar contraseña de aplicación
1. En la misma página de seguridad, busca **Contraseñas de aplicaciones**
2. Selecciona "Otra (nombre personalizado)"
3. Escribe "Facturosv"
4. Haz clic en **Generar**
5. Copia la contraseña de 16 caracteres que aparece

### Paso 3: Configurar en Facturosv
1. Ve a **Configuración > Email**
2. Selecciona proveedor: **Google Workspace**
3. Método de autenticación: **SMTP Basic**
4. SMTP Host: `smtp.gmail.com`
5. SMTP Port: `587`
6. Email: tu dirección Gmail completa
7. Contraseña: pega la **contraseña de aplicación** (NO tu contraseña normal)
8. Haz clic en **Probar conexión**

> **Importante:** Nunca uses tu contraseña normal de Google. Siempre genera una contraseña de aplicación específica.

---

## Error: Correo externo de Office 365 no conecta

**Síntoma:**
Error al configurar Microsoft 365 / Office 365 como proveedor de correo.

**Causa:** Office 365 requiere OAuth2, no SMTP básico (Microsoft deshabilitó Basic Auth).

**Solución:**

### Opción 1: Usar OAuth2 (recomendado)
1. Ve a **Configuración > Email**
2. Selecciona proveedor: **Microsoft 365**
3. Método de autenticación: **OAuth2**
4. Necesitarás:
   - Client ID de Azure AD
   - Client Secret
   - Tenant ID de Azure AD
5. Sigue el flujo de autorización
6. Prueba la conexión

### Opción 2: Habilitar SMTP AUTH en Microsoft 365
Si tu organización lo permite:
1. En el centro de administración de Microsoft 365
2. Ve a Usuarios > usuario específico > Correo > Administrar apps de correo
3. Habilita "SMTP autenticado"
4. Usa SMTP con:
   - Host: `smtp.office365.com`
   - Puerto: `587`
   - TLS: habilitado

---

## Error: Límite de correos alcanzado

**Síntoma:**
Mensaje "Rate limit exceeded" o los correos dejan de enviarse.

**Causa:** Cada configuración de correo tiene un límite por hora (por defecto: 100 correos/hora).

**Solución:**
1. Ve a **Configuración > Email**
2. Revisa el campo **Límite por hora** (rateLimitPerHour)
3. Ajusta el valor según tus necesidades (máximo: 10,000/hora)
4. Ten en cuenta los límites del proveedor:
   - Gmail gratuito: ~500/día
   - SendGrid free tier: 100/día
   - Proveedores empresariales: consulta tu plan

**Prevención:**
- Usa un proveedor profesional (SendGrid, Mailgun) para alto volumen
- Distribuye envíos a lo largo del día en vez de enviar masivamente
