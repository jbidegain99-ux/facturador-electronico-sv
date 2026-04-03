# Verificacion Issues 1-20: Log Detallado

**Fecha:** 2026-03-23
**Metodo:** Analisis estatico de codigo fuente (codebase review)

---

## Issue 1: Boton visibilidad contrasena en login
**Estado:** RESUELTO

**Cambios encontrados:**
- **Archivo:** `apps/web/src/app/(auth)/login/page.tsx`
- **Linea 7:** Importa iconos `Eye` y `EyeOff` de `lucide-react`
- **Linea 23:** Estado `showPassword` con `useState(false)`
- **Lineas 156-176:** Input password con boton toggle funcional
- **Lineas 168-174:** Boton con icono eye/eye-off que alterna tipo input entre `text` y `password`

**Evidencia:** Componente completamente implementado con hover effects y accesibilidad.

---

## Issue 2: Titulo registro empresas no visible
**Estado:** RESUELTO

**Cambios encontrados:**
- **Archivo:** `apps/web/src/app/(auth)/register/page.tsx`, lineas 556-558
- **Titulo:** `{t('registerTitle')}` renderizado en `<h2>` con clases `text-xl sm:text-2xl font-bold`
- **Traduccion:** `messages/es.json` linea 79: `"registerTitle": "Registrar Empresa"`
- **Subtitulo:** linea 80: `"registerSubtitle": "Complete los datos de su empresa para comenzar a facturar"`

---

## Issue 3: Ortografia en formulario (tildes)
**Estado:** RESUELTO

**Cambios encontrados:**
- **Archivo:** `apps/web/messages/es.json`
- Todas las palabras con tildes correctas:
  - `Razon Social` -> correcto en linea 126
  - `Actividad Economica` -> correcto en linea 128
  - `Telefono` -> correcto en linea 51
  - `Direccion` -> correcto en linea 52
  - `Correo Electronico` -> correcto en linea 50
  - `Contrasena` -> correcto en linea 82
- **Implementacion:** Todos los labels usan `useTranslations()` en vez de strings hardcodeados

---

## Issue 4: Mascaras NIT, NRC, Telefono
**Estado:** RESUELTO

**Cambios encontrados:**
- **Componente:** `apps/web/src/components/ui/masked-input.tsx`
- **NIT mask:** `9999-999999-999-9` en `register/page.tsx:613` y `company-info-step.tsx:354`
- **NRC mask:** `999999-9` en `register/page.tsx:628` y `company-info-step.tsx:371`
- **Telefono mask:** `9999-9999` en `register/page.tsx:677` y `company-info-step.tsx:471`
- **Backend validation:** `register.dto.ts`
  - NIT regex: `/^\d{4}-\d{6}-\d{3}-\d$/` (linea 34)
  - NRC regex: `/^\d{1,6}-\d$/` (linea 41)
  - Telefono regex: `/^\d{4}-\d{4}$/` (linea 58)

---

## Issue 5: Mensajes campos obligatorios (todos a la vez)
**Estado:** PARCIALMENTE RESUELTO

**Cambios encontrados:**
- **Archivo:** `apps/web/src/app/(auth)/register/page.tsx`, lineas 462-475
- **Implementado:** Validacion especifica para:
  - `adminPasswordConfirm` - contrasenas no coinciden (linea 465)
  - `adminEmail` - correo empresa = correo admin (linea 472)
- **Faltante:** No hay loop de validacion que muestre TODOS los errores de campos vacios simultaneamente
- **Mitigacion:** HTML5 `required` attributes + backend validation completa con class-validator

---

## Issue 6: Longitud campo Razon Social
**Estado:** RESUELTO

**Cambios encontrados:**
- **Registro:** `register/page.tsx` linea 588: `maxLength={200}` con CharCounter
- **Onboarding:** `company-info-step.tsx` linea 392: `maxLength={250}` con CharCounter (lineas 401-403)
- **Backend:** `register.dto.ts` linea 27: `@MaxLength(200)`
- **Nota:** Discrepancia 200 vs 250 entre registro y onboarding

---

## Issue 7: Color letras dropdown Municipio
**Estado:** RESUELTO

**Cambios encontrados:**
- **Archivo:** `apps/web/src/app/(auth)/register/page.tsx`, linea 740
- **CSS aplicado:** `text-foreground bg-background` asegura contraste visible
- **Disabled state:** `disabled:bg-muted` para estados deshabilitados

---

## Issue 8: Mensajes advertencia contrasenas
**Estado:** RESUELTO

**Cambios encontrados:**
- **Archivo:** `apps/web/src/app/(auth)/register/page.tsx`, lineas 834-858
- **Error display:** `{fieldErrors.adminPasswordConfirm && <p className="text-sm text-destructive mt-1">...</p>}`
- **Traduccion:** `messages/es.json` linea 103: `"passwordMismatch": "Las contrasenas no coinciden"`
- **Ubicacion:** Error aparece directamente debajo del campo "Confirmar Contrasena"

---

## Issue 9: Correo empresa = correo admin
**Estado:** RESUELTO

**Cambios encontrados:**
- **Frontend:** `register/page.tsx` lineas 470-475: Compara `formData.correo` con `formData.adminEmail` (case-insensitive, trimmed)
- **Backend:** `auth.service.ts` lineas 186-189: `ConflictException` si `tenant.correo === user.email`
- **Traduccion:** `messages/es.json` linea 104: `"El correo de la empresa y el correo del administrador deben ser diferentes"`
- **Doble validacion:** Frontend + Backend

---

## Issue 10: Opcion configuracion usuario
**Estado:** RESUELTO

**Cambios encontrados:**
- **Archivo:** `apps/web/src/components/layout/header.tsx`, lineas 322-328
- **Opciones en dropdown:**
  - "Mi Perfil" -> `/perfil` (linea 322)
  - "Configuracion" -> `/configuracion` (linea 326)
- **Pagina perfil:** `apps/web/src/app/(dashboard)/perfil/page.tsx` - muestra info usuario + cambio contrasena
- **Pagina config:** `apps/web/src/app/(dashboard)/configuracion/page.tsx` - configuracion tenant completa

---

## Issue 11: Mensajes campo correo
**Estado:** RESUELTO

**Cambios encontrados:**
- Mensajes de error se muestran inline debajo de los campos usando `<p className="text-sm text-destructive mt-1">`
- Validacion de formato email en frontend y backend
- No se usan alerts/toasts para errores de campo individual

---

## Issue 12: Ortografia en inicio sesion
**Estado:** RESUELTO

**Cambios encontrados:**
- **Archivo:** `apps/web/messages/es.json`
- Todas las palabras correctamente escritas:
  - "Iniciar Sesion" (linea 75)
  - "Correo electronico" (linea 81)
  - "Contrasena" (linea 82)
  - "No tienes cuenta?" (linea 86)
  - "Cerrar Sesion" (linea 76)
- **Uso:** Login page usa `useTranslations('auth')` para cargar traducciones

---

## Issue 13: Reset contrasena en login
**Estado:** RESUELTO

**Cambios encontrados:**
- **Link en login:** `login/page.tsx` lineas 152-154: Link a `/forgot-password`
- **Pagina forgot:** `apps/web/src/app/(auth)/forgot-password/page.tsx` - formulario email + confirmacion
- **Pagina reset:** `apps/web/src/app/(auth)/reset-password/[token]/page.tsx` - nueva contrasena con token
- **API endpoints:**
  - `POST /auth/forgot-password` (auth.controller.ts lineas 81-88, con throttling)
  - `POST /auth/reset-password` (auth.controller.ts lineas 91-98)
- **Flujo completo:** Email -> Token -> Reset -> Auto-redirect a login

---

## Issue 14: No bloquea cuenta tras 5 intentos
**Estado:** RESUELTO

**Cambios encontrados:**
- **Backend:** `auth.service.ts` lineas 37-107
- **Schema Prisma:**
  - `failedLoginAttempts Int @default(0)`
  - `accountLockedUntil DateTime?`
- **Logica:**
  - Threshold: 5 intentos (linea 60)
  - Duracion bloqueo: 15 minutos (linea 61)
  - Mensaje: `"Cuenta bloqueada por 15 minutos debido a multiples intentos fallidos"`
  - Reset a 0 en login exitoso (lineas 95-105)
- **Frontend:** Login page linea 123 detecta error 'bloqueada' y muestra warning amber
- **Rate limiting adicional:** 5/seg, 10/min, 50/hora en endpoint login

---

## Issue 15: Mascaras NIT/NRC/Tel en tenant config
**Estado:** RESUELTO

**Cambios encontrados:**
- **Archivo:** `apps/web/src/app/(dashboard)/configuracion/page.tsx`
- NRC validacion: patron `/^\d{1,7}(-\d)?$/` (linea 14-15)
- Telefono validacion: patron `/^\d{4}-\d{4}$/` (linea 15)
- Mismas mascaras que en registro (Issue 4)

---

## Issue 16: Campo Actividad Economica dropdown buscable
**Estado:** RESUELTO

**Cambios encontrados:**
- **Archivo:** `apps/web/src/components/onboarding/steps/company-info-step.tsx`, lineas 85-235
- **Componente:** `ActivitySearchDropdown` dedicado
- **Caracteristicas:**
  - Busqueda por codigo o descripcion (lineas 101-109)
  - Dropdown portal-based (linea 178)
  - Catalogo de 83 actividades economicas (lineas 20-83)
  - Filtrado dinamico y seleccion

---

## Issue 17: DTEs seleccionados no se guardan
**Estado:** RESUELTO

**Cambios encontrados:**
- **Archivo:** `apps/web/src/components/onboarding/steps/dte-selection-step.tsx`, lineas 79-92
- `useEffect` persiste tipos DTE seleccionados al navegar
- Estado inicial usa `selectedTypes` como dependencia
- Tipos mantenidos a traves del state del wizard padre

---

## Issue 18: Datos no guardados al dar "Anterior"
**Estado:** RESUELTO

**Cambios encontrados:**
- **Archivo:** `apps/web/src/components/onboarding/hacienda-wizard.tsx`, lineas 277-287
- `handleGoToStep` navega y recarga datos del servidor
- CompanyInfoStep (lineas 260-273) tiene `useEffect` para restaurar datos
- HaciendaCredentialsStep permite skip si credenciales ya existen (lineas 80-82)

---

## Issue 19: Archivos no mostrados al dar "Anterior"
**Estado:** RESUELTO

**Cambios encontrados:**
- **Archivo:** `apps/web/src/components/onboarding/hacienda-wizard.tsx`, lineas 372-381
- CertificateStep recibe prop `hasCertificate` del estado padre
- Estado del certificado persiste a traves del state management central del wizard
- No requiere re-upload si certificado ya existe

---

## Issue 20: No acceso a apartados completados
**Estado:** RESUELTO

**Cambios encontrados:**
- **Archivo:** `apps/web/src/components/onboarding/wizard-stepper.tsx`, lineas 59-65
- `canNavigate` determina si step es clickeable
- Steps con status 'COMPLETED' o 'IN_PROGRESS' son navegables
- Navegacion no secuencial habilitada para secciones completadas
