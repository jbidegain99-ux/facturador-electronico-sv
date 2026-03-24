# Gestion de Usuarios

Esta seccion explica como administrar los usuarios de su empresa en Facturosv.

## Roles Disponibles

| Rol | Permisos |
|-----|----------|
| **ADMIN** | Gestion completa: usuarios, configuracion, sucursales, facturacion, reportes |
| **FACTURADOR** | Operativo: emitir DTEs, gestionar clientes, productos y ver reportes basicos |

> Solo un usuario con rol ADMIN puede gestionar otros usuarios.

## Limite de Usuarios por Plan

| Plan | Usuarios Permitidos |
|------|---------------------|
| Free | 1 |
| Starter | 3 |
| Professional | 10 |
| Enterprise | Ilimitados |

Si alcanza el limite de usuarios de su plan, debera actualizar su plan antes de agregar nuevos usuarios.

## Agregar un Usuario

1. Navegar a **Configuracion > Usuarios**
2. Hacer clic en **Agregar Usuario**
3. Completar los campos requeridos:
   - **Nombre completo**
   - **Correo electronico** (sera su identificador de acceso)
   - **Rol** (ADMIN o FACTURADOR)
   - **Sucursal asignada** (opcional, dependiendo de su configuracion)
4. Hacer clic en **Guardar**

El nuevo usuario recibira un correo electronico con instrucciones para verificar su cuenta y establecer su contrasena.

### Verificacion de Correo

- El usuario **debe verificar su correo electronico** antes de poder iniciar sesion
- El enlace de verificacion se envia automaticamente al crear la cuenta
- Si el usuario no recibe el correo, puede reenviar la invitacion desde el listado de usuarios

## Editar un Usuario

1. Ir a **Configuracion > Usuarios**
2. Localizar al usuario en el listado
3. Hacer clic en el boton de edicion
4. Modificar los campos necesarios:
   - Nombre
   - Rol
   - Sucursal asignada
5. Guardar los cambios

> **Nota:** El correo electronico no se puede modificar una vez creada la cuenta.

## Cambiar el Rol de un Usuario

1. Ir a **Configuracion > Usuarios**
2. Seleccionar al usuario
3. Cambiar el campo **Rol** entre ADMIN y FACTURADOR
4. Guardar

**Consideraciones:**
- Debe existir al menos un usuario con rol ADMIN en la empresa
- Al cambiar un usuario de ADMIN a FACTURADOR, perdera acceso a la configuracion de la empresa
- Los cambios de rol toman efecto de inmediato

## Desactivar un Usuario

1. Ir a **Configuracion > Usuarios**
2. Localizar al usuario
3. Hacer clic en **Desactivar**
4. Confirmar la accion

**Que sucede al desactivar un usuario:**
- El usuario no podra iniciar sesion
- Sus DTEs y registros historicos se mantienen intactos
- La licencia de usuario queda disponible para asignar a otro usuario
- Se puede reactivar en cualquier momento

> **Importante:** No se puede eliminar un usuario que tenga DTEs emitidos. En su lugar, use la opcion de desactivar.

## Reactivar un Usuario

1. Ir a **Configuracion > Usuarios**
2. Filtrar por usuarios inactivos
3. Seleccionar al usuario
4. Hacer clic en **Reactivar**

## Buenas Practicas

- **Principio de menor privilegio:** Asigne el rol FACTURADOR a usuarios que solo necesitan emitir documentos
- **Minimo dos ADMIN:** Mantenga al menos dos usuarios ADMIN para evitar quedarse sin acceso administrativo
- **Desactivar en lugar de eliminar:** Siempre desactive usuarios que ya no necesitan acceso; nunca comparta credenciales
- **Revisar periodicamente:** Revise la lista de usuarios activos al menos una vez al mes
