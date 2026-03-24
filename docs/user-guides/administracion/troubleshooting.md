# Troubleshooting — Administración

## 1. No puedo agregar más usuarios

**Síntoma:** El botón "Agregar usuario" no aparece o muestra error de límite.

**Causa:** Alcanzaste el límite de usuarios de tu plan.

**Solución:**
1. Ve a **Configuración > Plan** y verifica tu límite actual
2. Límites: FREE=1, STARTER=3, PROFESSIONAL=10, ENTERPRISE=ilimitado
3. Si necesitas más usuarios, haz upgrade a un plan superior
4. Alternativamente, desactiva usuarios que ya no necesiten acceso

---

## 2. No puedo crear más sucursales

**Síntoma:** Error "Límite de sucursales alcanzado" al intentar agregar sucursal.

**Causa:** Tu plan tiene un número máximo de sucursales.

**Solución:**
1. Límites: FREE/STARTER=1 sucursal, PROFESSIONAL=5, ENTERPRISE=ilimitado
2. Verifica cuántas sucursales activas tienes en **Configuración > Sucursales**
3. Si necesitas más, haz upgrade a un plan superior

---

## 3. El logo no aparece en las facturas PDF

**Síntoma:** El PDF de factura se genera sin logo.

**Causas posibles:**
- No has subido un logo (ve a Configuración > Datos de Empresa)
- El formato del logo no es compatible (usa PNG o JPG)
- El archivo es demasiado grande
- Tu plan es FREE (logo requiere STARTER+)

**Solución:**
1. Verifica que tengas plan STARTER o superior
2. Ve a **Configuración > Datos de Empresa**
3. Sube un logo en formato PNG o JPG
4. Genera un nuevo PDF para verificar

---

## 4. Cuenta bloqueada por intentos fallidos

**Síntoma:** Mensaje "Cuenta bloqueada" al intentar iniciar sesión.

**Causa:** 5 intentos fallidos consecutivos activan el bloqueo de 15 minutos.

**Solución:**
1. Espera 15 minutos
2. Intenta de nuevo con las credenciales correctas
3. Si no recuerdas tu contraseña, usa **¿Olvidaste tu contraseña?**
4. El enlace de recuperación llega a tu correo registrado

---

## 5. No recibí el correo de verificación

**Síntoma:** Después de registrarte, no llega el correo de verificación.

**Solución:**
1. Revisa tu carpeta de **spam/correo no deseado**
2. Verifica que el correo ingresado sea correcto
3. Ve a la página de login y haz clic en **Reenviar verificación**
4. Espera 2-3 minutos (puede haber latencia)
5. Si persiste, contacta soporte con tu email de registro

---

## 6. La importación de clientes falla

**Síntoma:** Error al importar archivo CSV de clientes.

**Causas posibles:**
- Formato CSV incorrecto
- Campos requeridos faltantes
- Datos duplicados

**Solución:**
1. Verifica que tu CSV tenga los campos requeridos:
   - `tipoDocumento` (36=NIT, 13=DUI, etc.)
   - `numDocumento` (número sin guiones)
   - `nombre` (razón social)
   - `direccion` (dirección completa)
2. Verifica la codificación del archivo (UTF-8 recomendado)
3. Revisa el reporte de errores que muestra fila y campo con problema
4. Corrige y reintenta

---

## 7. No puedo cambiar de plan

**Síntoma:** No encuentras la opción de cambio de plan o da error.

**Solución:**
1. Ve a **Configuración > Plan**
2. Solo el usuario con rol ADMIN puede cambiar el plan
3. Si eres FACTURADOR, contacta al administrador de tu empresa
4. Si el problema persiste, crea un ticket de soporte tipo BILLING

---

## 8. Las notificaciones no aparecen

**Síntoma:** No ves notificaciones nuevas a pesar de tener actividad.

**Solución:**
1. Verifica el ícono de campana en el header
2. Revisa que no hayas descartado (dismiss) las notificaciones
3. Algunas notificaciones se muestran una sola vez por usuario
4. Las notificaciones tienen fecha de expiración — si pasó, ya no se muestran
5. Recarga la página para verificar
