# Seguridad

## Autenticación

### Inicio de Sesión

Facturosv utiliza autenticación basada en JWT (JSON Web Token):

1. Ingresa tu correo y contraseña en `/login`
2. El sistema valida credenciales y genera un token JWT
3. El token incluye: ID de usuario, email, tenant, rol
4. Se almacena en `localStorage` del navegador

### Bloqueo por Intentos Fallidos

Para proteger tu cuenta contra acceso no autorizado:

- **Máximo de intentos:** 5 intentos fallidos consecutivos
- **Duración del bloqueo:** 15 minutos
- **Desbloqueo automático:** Después de 15 minutos puedes intentar de nuevo
- **Contador se resetea:** Al iniciar sesión exitosamente

Si tu cuenta se bloquea:
1. Espera 15 minutos
2. Intenta de nuevo con las credenciales correctas
3. Si olvidaste tu contraseña, usa "Olvidé mi contraseña"

---

## Verificación de Correo

Al registrarte, debes verificar tu correo electrónico:

1. Se envía un enlace de verificación a tu email
2. Haz clic en el enlace para confirmar tu cuenta
3. El enlace tiene fecha de expiración
4. Si no lo recibes, puedes solicitar reenvío desde la página de login

> **Nota:** No podrás iniciar sesión hasta verificar tu correo.

---

## Cambio de Contraseña

Para cambiar tu contraseña:

1. Inicia sesión en tu cuenta
2. Ve a **Perfil** (icono de usuario en la esquina)
3. Selecciona **Cambiar contraseña**
4. Ingresa tu contraseña actual
5. Ingresa y confirma la nueva contraseña
6. Haz clic en **Guardar**

### Requisitos de contraseña
- Mínimo 8 caracteres recomendados
- Combina letras, números y caracteres especiales

---

## Recuperación de Contraseña

Si olvidaste tu contraseña:

1. Ve a la página de login
2. Haz clic en **¿Olvidaste tu contraseña?**
3. Ingresa tu correo electrónico
4. Recibirás un enlace de recuperación por email
5. Haz clic en el enlace
6. Ingresa tu nueva contraseña
7. Confirma y guarda

> El enlace de recuperación tiene fecha de expiración. Si expira, solicita uno nuevo.

---

## Roles de Usuario

Facturosv tiene 3 roles con diferentes niveles de acceso:

### ADMIN (Administrador del Tenant)
- Acceso completo a todas las funciones del tenant
- Gestión de usuarios (crear, editar, desactivar)
- Configuración de empresa, sucursales, integraciones
- Gestión de plan y billing
- Creación y gestión de facturas, contabilidad, cotizaciones

### FACTURADOR (Usuario Regular)
- Rol por defecto al crear un usuario
- Crear y gestionar facturas
- Acceso al catálogo de productos y clientes
- Ver reportes (si el plan lo permite)
- Crear tickets de soporte

### SUPER_ADMIN (Super Administrador)
- Acceso a nivel plataforma (no tenant)
- Panel de administración en `/admin`
- Gestión de todos los tenants
- Asignación de planes
- Monitoreo del sistema
- Gestión de tickets de soporte (asignación, respuesta)

---

## Aislamiento de Datos (Multi-tenancy)

Cada empresa (tenant) opera en un espacio completamente aislado:

- **Datos separados:** Facturas, clientes, cuentas contables, configuración — todo está aislado por tenant
- **Sin acceso cruzado:** Un usuario de Empresa A nunca puede ver datos de Empresa B
- **Filtrado automático:** Todas las consultas incluyen filtro de `tenantId`
- **Eliminación en cascada:** Al eliminar un tenant, se eliminan todos sus datos

---

## Registro de Auditoría

El sistema registra acciones importantes para seguridad y cumplimiento:

### Acciones registradas
- Inicios de sesión exitosos y fallidos
- Creación, edición y eliminación de recursos (DTEs, clientes, productos)
- Cambios de configuración
- Transmisiones a Hacienda
- Exportaciones de datos

### Información capturada
- Usuario que realizó la acción
- Fecha y hora
- Dirección IP
- Navegador (User-Agent)
- Valores anteriores y nuevos (para ediciones)

### Módulos auditados
AUTH, TENANT, USER, DTE, CLIENTE, CERTIFICATE, EMAIL_CONFIG, SETTINGS, SUPPORT, ADMIN

---

## Buenas Prácticas de Seguridad

1. **No compartas credenciales** — Cada usuario debe tener su propia cuenta
2. **Usa contraseñas fuertes** — Mínimo 8 caracteres, mezcla de tipos
3. **Cambia tu contraseña regularmente** — Cada 3-6 meses recomendado
4. **Cierra sesión en equipos compartidos** — No dejes tu sesión abierta
5. **Revisa la actividad** — Reporta accesos sospechosos al administrador
6. **Protege credenciales de Hacienda** — No las compartas por medios inseguros
