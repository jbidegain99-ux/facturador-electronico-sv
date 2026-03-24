# Troubleshooting — General

## Error: Cuenta bloqueada por intentos fallidos

**Síntoma:**
Ves el mensaje "Cuenta bloqueada" o "Demasiados intentos" al iniciar sesión.

**Causa:**
El sistema bloquea la cuenta después de 5 intentos fallidos consecutivos como medida de seguridad. El bloqueo dura 15 minutos.

**Solución:**

### Paso 1: Esperar
1. Espera exactamente 15 minutos desde el último intento
2. El desbloqueo es automático — no necesitas hacer nada

### Paso 2: Verificar credenciales
1. Antes de intentar de nuevo, verifica que estés usando el correo correcto
2. Verifica que no tengas Caps Lock activado
3. Si no recuerdas tu contraseña, usa **¿Olvidaste tu contraseña?** en la página de login

### Paso 3: Recuperar contraseña (si necesario)
1. Haz clic en **¿Olvidaste tu contraseña?**
2. Ingresa tu correo registrado
3. Recibirás un enlace de recuperación
4. Crea una nueva contraseña
5. Inicia sesión con la nueva contraseña

**Prevención:**
- Usa un gestor de contraseñas para no olvidar credenciales
- No compartas tu cuenta — cada usuario debe tener su propia cuenta

---

## Error: No puedo exportar mis datos

**Síntoma:**
Necesitas descargar tus datos (facturas, clientes, reportes) y no encuentras la opción.

**Opciones de exportación disponibles:**

### Facturas (DTEs)
- **PDF individual:** Abre la factura > botón **Descargar PDF**
- **JSON individual:** Abre la factura > botón **Descargar JSON**
- No hay exportación masiva por interfaz; usa la API REST (ENTERPRISE) para consultas programáticas

### Reportes Contables
- Los reportes se visualizan en pantalla
- Puedes usar la función de impresión del navegador (Ctrl+P) para guardar como PDF

### Clientes
- La importación CSV es bidireccional — contacta soporte para exportar

### Datos generales
- Para backup completo de datos, contacta soporte con un ticket tipo GENERAL

---

## Error: ¿Cómo elimino mi cuenta?

**Síntoma:**
Deseas eliminar tu cuenta y todos los datos asociados.

**Procedimiento:**

### Consideraciones previas
- **Los datos se eliminan permanentemente** — facturas, clientes, contabilidad, todo
- Si tienes facturas transmitidas a Hacienda, los registros en MH persisten independientemente
- Recomendamos exportar tus datos antes de eliminar

### Proceso
1. Contacta soporte creando un ticket tipo **GENERAL**
2. Asunto: "Solicitud de eliminación de cuenta"
3. Incluye:
   - Email de la cuenta
   - Nombre de la empresa
   - Confirmación explícita de que deseas eliminar todos los datos
4. Un administrador procesará la solicitud
5. Recibirás confirmación por correo

> **Nota:** La eliminación es un proceso manual por seguridad. No se puede revertir.

---

## Error: La página carga lenta o no responde

**Síntoma:**
La interfaz de Facturosv tarda mucho en cargar o se queda en blanco.

**Causas posibles:**

### 1. Problema de conexión a internet
**Solución:**
1. Verifica tu conexión a internet
2. Intenta cargar otras páginas web
3. Si tu conexión es lenta, espera a que se restaure

### 2. Caché del navegador
**Solución:**
1. Limpia la caché del navegador:
   - Chrome: Ctrl+Shift+Delete > Selecciona "Archivos en caché" > Borrar
   - Firefox: Ctrl+Shift+Delete > "Cache" > OK
2. Recarga con Ctrl+Shift+R (recarga forzada sin caché)

### 3. Navegador no compatible
**Solución:**
1. Usa un navegador moderno actualizado:
   - Chrome (recomendado)
   - Firefox
   - Edge
   - Safari
2. Desactiva extensiones que puedan interferir (ad blockers, etc.)

### 4. Mantenimiento del servidor
**Solución:**
1. Verifica si hay un anuncio de mantenimiento en las notificaciones
2. Espera e intenta más tarde
3. Si persiste más de 30 minutos, crea un ticket de soporte

---

## Error: ¿Cómo contacto a soporte?

**Síntoma:**
Necesitas ayuda y no sabes cómo comunicarte con el equipo de soporte.

**Canales disponibles:**

### 1. Chatbot IA (todos los planes)
- Disponible 24/7
- Respuestas inmediatas a preguntas frecuentes
- Puede guiarte paso a paso en configuraciones

### 2. Tickets de Soporte (todos los planes)
1. Ve a **Soporte** en el menú lateral
2. Haz clic en **Nuevo ticket**
3. Selecciona tipo:
   - **EMAIL_CONFIG** — problemas con correo
   - **TECHNICAL** — errores o funcionalidad
   - **BILLING** — cobros y planes
   - **GENERAL** — consultas generales
   - **ONBOARDING** — configuración inicial
4. Describe tu problema con el mayor detalle posible
5. Adjunta capturas de pantalla si es relevante
6. Haz clic en **Crear ticket**
7. Recibirás un número de ticket (formato: TKT-YYYYMMDD-XXXX)

### 3. Soporte Telefónico (solo ENTERPRISE)
- Disponible para clientes con plan ENTERPRISE
- Horario según SLA del plan

### Tiempos de respuesta (SLA)
| Plan | Primera respuesta | Resolución |
|------|-------------------|------------|
| FREE | Mejor esfuerzo | Mejor esfuerzo |
| STARTER | 24 horas | 48 horas |
| PROFESSIONAL | 12 horas | 24 horas |
| ENTERPRISE | 2 horas | 8 horas |
