# Troubleshooting — Hacienda (Ministerio de Hacienda)

## Error: Conector de Hacienda muestra error de autenticación

**Síntoma:**
Ves error "Token inválido o expirado" o error 401/403 al intentar transmitir.

**Causas posibles:**

### 1. Token expirado
Los tokens de Hacienda tienen vigencia limitada (24h en producción, 48h en pruebas).

**Solución:**
1. Ve a **Configuración > Hacienda**
2. Haz clic en **Renovar token**
3. Verifica que aparezca nuevo token con fecha de expiración futura
4. Reintenta la transmisión

### 2. Credenciales cambiadas en portal MH
Si cambiaste tu contraseña en el portal de Hacienda, debes actualizarla también en Facturosv.

**Solución:**
1. Ve a **Configuración > Hacienda**
2. Actualiza la contraseña
3. Prueba la conexión
4. El sistema renovará el token automáticamente

### 3. Caché de token obsoleto
El token se guarda en caché (memoria + base de datos) para eficiencia.

**Solución:**
1. Renueva el token manualmente desde Configuración > Hacienda
2. Si persiste, contacta soporte — puede ser necesario limpiar caché del servidor

> **Nota técnica:** La respuesta de MH en errores 401/403 puede tener body vacío. El sistema lee la respuesta como texto primero, luego intenta parsear JSON.

---

## Error: Transmisión rechazada por Hacienda

**Síntoma:**
La factura cambia a estado RECHAZADO con mensaje de error de Hacienda.

**Causas posibles:**

### 1. "Factura duplicada" o "Código de generación ya existe"
Ya existe un DTE con el mismo código de generación en Hacienda.

**Solución:**
1. No reenvíes la misma factura — ya fue registrada
2. Consulta el estado del DTE original: puede que se haya procesado en un intento anterior
3. Si necesitas crear una nueva factura, el sistema generará un nuevo código de generación automáticamente

### 2. "NRC inválido" o error de formato
El NRC tiene formato incorrecto.

**Solución:**
1. El NRC debe ser solo dígitos (sin guion): `3674750`, no `367475-0`
2. Validación MH acepta: `^[0-9]{1,8}$`
3. Ve a **Clientes** y corrige el NRC del receptor
4. Crea una nueva factura con los datos corregidos

### 3. "Dirección inválida"
La dirección del receptor no tiene el formato correcto.

**Solución:**
1. La dirección debe ser un objeto con: departamento (01-14), municipio, complemento
2. No debe ser texto plano tipo "San Salvador, El Salvador"
3. Ve a **Clientes** y verifica que la dirección esté correctamente estructurada

### 4. Error de validación de montos
Montos con más de 2 decimales o cálculos inconsistentes.

**Solución:**
1. Verifica que los precios tengan máximo 2 decimales
2. El sistema redondea automáticamente, pero los datos de entrada deben ser consistentes
3. Verifica que totalGravada + totalExenta + totalNoSuj = subTotal

**¿Aún hay problema?**
→ Crea un ticket TECHNICAL adjuntando el código de generación y el mensaje de error exacto de Hacienda

---

## Error: Certificado digital no se acepta

**Síntoma:**
Error al subir o usar el certificado digital en la configuración de Hacienda.

**Causas posibles:**

### 1. Formato incorrecto
Facturosv soporta: .p12, .pfx, .crt (XML de MH), .cer, .pem

**Solución:**
1. Los archivos .crt del Ministerio de Hacienda son formato XML (`<CertificadoMH>`), NO son X.509 estándar
2. Los archivos .p12 y .pfx requieren contraseña
3. Los archivos .crt XML de MH no requieren contraseña

### 2. Certificado no "cargado" en portal MH
Generaste el certificado pero no lo registraste.

**Solución:**
1. Inicia sesión en el portal de Hacienda
2. Ve a la sección de certificados
3. No basta con **descargar** el certificado — debes **"Cargar Certificado"** para registrarlo
4. Después de cargarlo, vuelve a configurar en Facturosv

### 3. Certificado expirado
**Solución:**
1. Verifica la fecha de validez del certificado
2. Si expiró, genera uno nuevo en el portal de Hacienda
3. Recuerda cargar (registrar) el nuevo certificado
4. Sube el nuevo archivo en Facturosv

### 4. Certificado de ambiente incorrecto
El certificado de pruebas no funciona en producción y viceversa.

**Solución:**
1. Cada ambiente (TEST/PRODUCTION) requiere su propio certificado
2. Ve a **Configuración > Hacienda** y selecciona el ambiente correcto
3. Sube el certificado correspondiente a cada ambiente

---

## Error: DTE aceptado pero no aparece en portal de Hacienda

**Síntoma:**
Facturosv muestra estado PROCESADO con sello de recepción, pero al consultar en el portal de Hacienda no aparece el DTE.

**Causas posibles:**

### 1. Latencia normal del sistema MH
Hacienda puede tardar en reflejar DTEs en su portal web.

**Solución:**
1. Espera 5-15 minutos — es normal una demora entre la API y el portal web
2. El sello de recepción es la prueba oficial de que fue aceptado
3. Guarda el sello como comprobante

### 2. Ambiente incorrecto
Estás buscando en producción pero transmitiste en pruebas, o viceversa.

**Solución:**
1. Verifica el campo `ambiente` en el detalle del DTE:
   - `00` = Pruebas (no aparecerá en portal de producción)
   - `01` = Producción
2. Consulta en el portal de Hacienda correspondiente al ambiente

### 3. Modo Demo activo
En modo demo, las transmisiones son simuladas y NO se envían a Hacienda.

**Solución:**
1. Los sellos que empiezan con `DEMO` son ficticios
2. Ve a **Configuración** y desactiva el modo demo
3. Retransmite la factura en modo real

**¿Aún hay problema?**
→ Proporciona el código de generación y sello de recepción al crear un ticket TECHNICAL
