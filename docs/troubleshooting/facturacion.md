# Troubleshooting — Facturación

## Error: No puedo crear factura

**Síntoma:**
Intentas crear una factura pero ves un error o el botón está deshabilitado.

**Causas posibles:**

### 1. Límite de DTEs alcanzado
Tu plan tiene un máximo de DTEs por mes. Al alcanzarlo, no puedes crear más facturas.
- FREE: 10 DTEs/mes
- STARTER: 300 DTEs/mes
- PROFESSIONAL: 2,000 DTEs/mes
- ENTERPRISE: ilimitado

**Solución:**
1. Ve a **Configuración > Plan** y verifica tu uso actual
2. Si alcanzaste el límite, espera al próximo mes (se reinicia el día 1)
3. O haz upgrade a un plan superior para más DTEs

### 2. Datos de cliente incompletos
Para ciertos tipos de DTE, el receptor requiere datos fiscales completos.

**Solución:**
1. Para CCF (tipo 03): el cliente necesita NIT y NRC
2. Para Nota de Crédito (05) y Nota de Débito (06): necesitas un documento relacionado
3. Ve a **Clientes** y completa los datos faltantes del receptor

### 3. Sucursal no configurada
Necesitas al menos una sucursal activa con punto de venta para generar el número de control.

**Solución:**
1. Ve a **Configuración > Sucursales**
2. Verifica que exista al menos una sucursal activa
3. Verifica que la sucursal tenga un punto de venta asignado (por defecto: P001)

### 4. Error técnico del navegador
Rara vez, un error en caché del navegador puede causar problemas.

**Solución:**
1. Recarga la página (F5 o Ctrl+R)
2. Limpia caché del navegador
3. Intenta en modo incógnito
4. Intenta en un navegador diferente

**¿Aún hay problema?**
→ Crea un ticket de soporte en **Soporte > Nuevo ticket** con tipo TECHNICAL

---

## Error: La factura no se transmite a Hacienda

**Síntoma:**
La factura queda en estado PENDIENTE o FIRMADO, pero no pasa a PROCESADO.

**Causas posibles:**

### 1. Credenciales de Hacienda no configuradas
No has configurado la conexión con el Ministerio de Hacienda.

**Solución:**
1. Ve a **Configuración > Hacienda**
2. Ingresa credenciales MH (NIT, contraseña)
3. Sube certificado digital (.p12, .pfx o .crt)
4. Prueba la conexión

### 2. Token de Hacienda expirado
El token de autenticación MH tiene vigencia limitada (24-48h).

**Solución:**
1. Ve a **Configuración > Hacienda**
2. Haz clic en **Renovar token**
3. Si persiste, verifica que tus credenciales MH sigan vigentes en el portal de Hacienda

### 3. Certificado incorrecto o expirado
El certificado digital puede ser inválido o haber expirado.

**Solución:**
1. Verifica la fecha de expiración de tu certificado
2. Si usas archivo .crt de MH, recuerda que es formato XML (no X.509 estándar)
3. Si generaste un nuevo certificado en el portal MH, debes también **"Cargar Certificado"** para registrarlo
4. Sube un certificado nuevo si el actual expiró

### 4. Servicio de Hacienda no disponible
Ocasionalmente los servidores de Hacienda están en mantenimiento.

**Solución:**
1. Espera 15-30 minutos y reintenta
2. No reenvíes la misma factura múltiples veces (puede causar error de duplicado)
3. Verifica el estado del servicio MH

### 5. Datos del DTE inválidos
Hacienda rechaza DTEs con datos que no cumplen validaciones.

**Solución:**
1. Revisa el campo `lastError` en el detalle de la factura
2. Errores comunes:
   - NRC con formato incorrecto (debe ser solo dígitos, sin guion)
   - Dirección del receptor como texto plano (debe ser objeto JSON)
   - Montos con más de 2 decimales
3. Corrige los datos y crea una factura nueva

**¿Aún hay problema?**
→ Crea un ticket TECHNICAL adjuntando el código de generación del DTE

---

## Error: ¿Cómo anulo una factura ya transmitida?

**Síntoma:**
Necesitas cancelar una factura que ya fue aprobada por Hacienda (estado PROCESADO).

**Procedimiento:**

### Anulación de factura PROCESADO

1. Abre la factura en el listado
2. Haz clic en el botón **Anular** (ícono de prohibición rojo)
3. Ingresa el motivo de anulación (mínimo 10 caracteres)
4. Confirma la anulación
5. El sistema envía la solicitud de anulación a Hacienda
6. Hacienda devuelve un sello de anulación como confirmación
7. La factura pasa a estado ANULADO

**Importante:**
- Solo puedes anular facturas en estado PENDIENTE, FIRMADO o PROCESADO
- No puedes anular una factura que ya fue anulada
- Si la factura tiene una partida contable automática, esta se revierte automáticamente
- Guarda el sello de anulación como comprobante

---

## Error: Factura tiene datos incorrectos

**Síntoma:**
Notas un error en una factura (cliente equivocado, monto incorrecto, etc.).

**Solución según estado:**

### Si está en PENDIENTE
- La factura aún no ha sido firmada ni transmitida
- Puedes anularla y crear una nueva con datos correctos

### Si está en FIRMADO
- Ya fue firmada pero no transmitida
- Puedes anularla y crear una nueva

### Si está en PROCESADO
- Ya fue aceptada por Hacienda — no se puede editar
- **Opción 1:** Anular y crear nueva factura
- **Opción 2:** Crear una Nota de Crédito (tipo 05) que referencie la factura original, para revertir el monto

**Nota:** Los DTEs transmitidos nunca se pueden editar. El mecanismo correcto es anular + recrear, o usar notas de crédito/débito para ajustes.

---

## Error: PDF de factura no se genera correctamente

**Síntoma:**
El PDF no se descarga, aparece en blanco, o faltan datos.

**Causas posibles:**

### 1. Error temporal
**Solución:** Recarga la página y vuelve a intentar descargar

### 2. Logo no configurado
El espacio de logo aparece vacío pero el PDF se genera correctamente.
**Solución:** Sube un logo en **Configuración > Datos de Empresa** (requiere STARTER+)

### 3. Datos del emisor incompletos
**Solución:** Verifica que todos los datos de empresa estén completos (nombre, NIT, NRC, dirección, teléfono, correo)

### 4. Navegador bloquea descarga
**Solución:** Verifica que tu navegador no esté bloqueando pop-ups o descargas automáticas

**¿Aún hay problema?**
→ Intenta descargar el JSON del DTE como alternativa, y crea un ticket TECHNICAL
