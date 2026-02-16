# FACTURADOR ELECTRÓNICO SV - TODO MASTER

**ÚLTIMA ACTUALIZACIÓN:** 2026-02-09
**FASE ACTUAL:** Fase 1 (Fase 0 completada ✅)
**DEPLOY ACTUAL:** API v17, Web v26
**ESTADO:** Producción funcional

## ✅ FASE 0 - COMPLETADA (2026-02-08)
- 14/14 Issues QA resueltos
- Bug API duplicada corregido (45 archivos)
- Deploy v17 exitoso
- Login funcional en producción
- Scripts de testing automatizados

---

**Fecha inicio:** 7 de febrero de 2026  
**Proyecto:** Facturador Electrónico SV - Republicode  
**Desarrollador:** Jose  
**Ubicación:** \\wsl.localhost\Ubuntu-22.04\home\jose\facturador-electronico-sv

---

## 📋 FASE 0: Issues de QA (URGENTE - 2-3 días)
**Prioridad:** CRÍTICA  
**Objetivo:** Resolver los 14 issues reportados por QA antes de iniciar nuevas features

### ✅ Checklist Pre-inicio
- [ ] Revisar schema Prisma actual (`api/prisma/schema.prisma`)
- [ ] Verificar configuración de Redis/BullMQ existente
- [ ] Backup de base de datos Azure SQL
- [ ] Crear rama `fix/qa-issues-batch-1`
- [ ] Ejecutar `git pull origin main` para sincronizar

---

## 🔴 Issues Prioritarios (Alta - Resolver Primero)

### ✓ Issue #4: Máscaras en campos NIT, NRC y Teléfono
**Prioridad:** Media → **ALTA** (afecta validación de datos)  
**Módulo:** `web/` - Registro de Empresas  
**Descripción:** Los campos tienen placeholder de máscara pero no la aplican  
**Archivos afectados:**
- `web/app/(auth)/register/page.tsx` o similar
- Componentes de Input (probablemente shadcn/ui)

**Tareas:**
- [ ] Instalar `react-input-mask` o usar `imask` para máscaras
- [ ] Aplicar máscara NIT: `0000-000000-000-0` (14 dígitos)
- [ ] Aplicar máscara NRC: `000000-0` (6-7 dígitos + verificador)
- [ ] Aplicar máscara Teléfono: `0000-0000` (8 dígitos fijos + móviles)
- [ ] Validar que no se puedan ingresar más caracteres de los permitidos
- [ ] Testing: Probar con datos válidos e inválidos

**Criterios de aceptación:**
- ✓ Máscaras visuales funcionan mientras el usuario escribe
- ✓ No se permiten valores más largos que el formato
- ✓ El valor almacenado está limpio (sin guiones) en el backend

---

### ✓ Issue #5: Mensajes de campos obligatorios
**Prioridad:** Media  
**Módulo:** `web/` - Registro de Empresas  
**Descripción:** Solo muestra un tooltip nativo del navegador para el primer campo obligatorio

**Tareas:**
- [ ] Implementar validación con `react-hook-form` + `zod`
- [ ] Configurar `mode: 'onBlur'` para validar al salir del campo
- [ ] Agregar componente `<FormMessage>` de shadcn/ui debajo de cada input
- [ ] Mostrar todos los errores simultáneamente (no solo el primero)
- [ ] Estilizar mensajes en rojo con texto claro

**Código de referencia:**
```tsx
<FormField
  control={form.control}
  name="razonSocial"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Razón Social *</FormLabel>
      <FormControl>
        <Input {...field} maxLength={200} />
      </FormControl>
      <FormMessage /> {/* Esto muestra el error */}
    </FormItem>
  )}
/>
```

**Criterios de aceptación:**
- ✓ Errores aparecen debajo del campo correspondiente en rojo
- ✓ Se validan todos los campos antes de enviar
- ✓ Mensajes personalizados en español

---

### ✓ Issue #6: Longitud de campo Razón Social (Internal Server Error)
**Prioridad:** ALTA (causa crash del backend)  
**Módulo:** `api/` + `web/`  
**Descripción:** Campos de texto sin límite generan error 500 al registrar

**Tareas Backend (`api/`):**
- [ ] Revisar DTOs de validación en `api/src/tenant/dto/register-tenant.dto.ts`
- [ ] Agregar decoradores `@MaxLength()` de `class-validator`:
  - Razón Social: 200 caracteres
  - Nombre Comercial: 200 caracteres
  - Correo empresa: 100 caracteres
  - Dirección: 500 caracteres
  - Nombre completo admin: 200 caracteres
  - Correo admin: 100 caracteres
  - Contraseñas: 128 caracteres
- [ ] Validar en Prisma schema que los campos `@db.VarChar(N)` coincidan
- [ ] Agregar test unitario que verifique validación

**Tareas Frontend (`web/`):**
- [ ] Agregar `maxLength` prop a todos los inputs
- [ ] Mostrar contador de caracteres con `<FormDescription>`:
  ```tsx
  <FormDescription className="text-xs text-muted-foreground">
    {field.value?.length || 0}/200 caracteres
  </FormDescription>
  ```
- [ ] Estilizar contador en rojo cuando esté cerca del límite (>90%)

**Criterios de aceptación:**
- ✓ Backend rechaza valores muy largos con mensaje claro
- ✓ Frontend no permite escribir más allá del límite
- ✓ Contador visible para campos críticos

---

### ✓ Issue #7: Color de letras en dropdown Municipio
**Prioridad:** ALTA (UX crítico - usuarios no ven opciones)  
**Módulo:** `web/` - Registro de Empresas  
**Descripción:** Dropdown de municipios tiene texto invisible hasta hover

**Tareas:**
- [ ] Localizar componente Select de shadcn/ui usado para Municipio
- [ ] Revisar CSS en `globals.css` o tema de shadcn
- [ ] Buscar reglas que establezcan `color: transparent` o similar
- [ ] Cambiar a `color: hsl(var(--foreground))` en `SelectItem`
- [ ] Probar en modo light y dark para verificar contraste
- [ ] Aplicar mismo fix a dropdown de Departamento si aplica

**Archivo probable:**
```css
/* web/app/globals.css o components/ui/select.tsx */
[data-radix-select-item] {
  color: hsl(var(--foreground)); /* Asegurar visibilidad */
}
```

**Criterios de aceptación:**
- ✓ Opciones del dropdown visibles sin necesidad de hover
- ✓ Contraste adecuado en light y dark mode

---

### ✓ Issue #9: Correo de empresa igual a correo de admin
**Prioridad:** ALTA (lógica de negocio crítica)  
**Módulo:** `api/` - Validación de registro  
**Descripción:** Permite registrar mismo email para empresa y usuario admin

**Tareas Backend:**
- [ ] Crear validador custom en DTO:
  ```typescript
  @Validate(EmailsCannotMatchValidator)
  correoEmpresa: string;
  ```
- [ ] Implementar `EmailsCannotMatchValidator` que compare ambos emails
- [ ] Retornar error 400 con mensaje: "El correo de la empresa debe ser diferente al del administrador"
- [ ] Agregar test case que verifique esta regla

**Tareas Frontend:**
- [ ] Agregar validación en schema de Zod:
  ```typescript
  .refine((data) => data.correoEmpresa !== data.correoAdmin, {
    message: "El correo de la empresa no puede ser el mismo que el del administrador",
    path: ["correoAdmin"]
  })
  ```
- [ ] Mostrar error debajo del campo correspondiente

**Criterios de aceptación:**
- ✓ Backend rechaza registro si emails coinciden
- ✓ Frontend valida antes de enviar y muestra error claro
- ✓ Usuario entiende que debe usar emails distintos

---

### ✓ Issue #14: No bloquea cuenta después de 5 intentos fallidos
**Prioridad:** ALTA (seguridad crítica)  
**Módulo:** `api/` - Autenticación  
**Descripción:** Sistema no implementa bloqueo de cuenta por intentos fallidos

**Tareas Backend:**
- [ ] Agregar campos a modelo `User` en Prisma:
  ```prisma
  failedLoginAttempts Int @default(0)
  accountLockedUntil  DateTime?
  lastFailedLoginAt   DateTime?
  ```
- [ ] Ejecutar migración: `npx prisma migrate dev --name add-login-security`
- [ ] Modificar lógica de login en `api/src/auth/auth.service.ts`:
  - Incrementar `failedLoginAttempts` en cada fallo
  - Si llega a 5, establecer `accountLockedUntil = now() + 15 minutos`
  - Resetear contador a 0 en login exitoso
- [ ] Validar `accountLockedUntil` antes de permitir login
- [ ] Retornar error específico: "Cuenta bloqueada temporalmente por seguridad. Intente en 15 minutos"

**Tareas Frontend:**
- [ ] Manejar error de cuenta bloqueada con diseño especial
- [ ] Mostrar diálogo con:
  - Ícono de candado
  - Mensaje: "Cuenta bloqueada temporalmente"
  - Explicación: "Por seguridad, tu cuenta ha sido bloqueada por 15 minutos después de 5 intentos fallidos"
  - Link: "¿Olvidaste tu contraseña?" → ruta de recuperación
  - Timer countdown mostrando minutos restantes (opcional)

**Criterios de aceptación:**
- ✓ Cuenta se bloquea automáticamente después de 5 intentos fallidos
- ✓ Bloqueo dura exactamente 15 minutos
- ✓ Usuario recibe mensaje claro y opción de recuperar contraseña
- ✓ Contador se resetea después del desbloqueo automático

---

## 🟡 Issues Medianos (Resolver después de los ALTA)

### ✓ Issue #3: Ortografía en formularios
**Prioridad:** Baja → Media (profesionalismo)  
**Módulo:** `web/` - Registro de Empresas  
**Descripción:** Múltiples campos sin tildes

**Correcciones necesarias:**
- [ ] "Razon" → "Razón"
- [ ] "Economica" → "Económica"
- [ ] "Telefono" → "Teléfono"
- [ ] "Direccion" → "Dirección"
- [ ] "Electronico" → "Electrónico"
- [ ] "Contrasena" → "Contraseña"

**Búsqueda global:**
```bash
cd web/
grep -r "Razon Social" --include="*.tsx" --include="*.ts"
# Reemplazar en todos los archivos encontrados
```

**Criterios de aceptación:**
- ✓ Todos los labels tienen ortografía correcta
- ✓ Placeholders también corregidos
- ✓ Mensajes de validación en español correcto

---

### ✓ Issue #8: Mensajes de advertencia de contraseñas
**Prioridad:** Media  
**Módulo:** `web/` - Registro de Empresas  
**Descripción:** Error de contraseñas no coincidentes aparece arriba del formulario

**Tareas:**
- [ ] Remover toast/alert global para este error
- [ ] Implementar validación en tiempo real con `react-hook-form`:
  ```typescript
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"]
  })
  ```
- [ ] Mostrar error debajo del campo "Confirmar Contraseña"
- [ ] Agregar validación visual: ícono ✓ verde cuando coinciden

**Criterios de aceptación:**
- ✓ Error aparece inmediatamente debajo del campo
- ✓ Usuario no necesita scroll para ver el error
- ✓ Validación en tiempo real al escribir

---

### ✓ Issue #10: Opción de configuración de usuario
**Prioridad:** Media (feature enhancement)  
**Módulo:** `web/` - Portal del tenant  
**Descripción:** Botón "Configuración" no hace nada útil

**Tareas:**
- [ ] Crear nueva ruta: `web/app/(dashboard)/profile/page.tsx`
- [ ] Diseñar página de perfil con secciones:
  - Información personal (nombre, email) - solo lectura
  - Cambiar contraseña (formulario con validación)
  - Preferencias (tema, idioma, notificaciones)
  - Sesiones activas (opcional)
- [ ] Cambiar label del dropdown: "Configuración" → "Mi Perfil"
- [ ] Cambiar ícono a uno de usuario/perfil (lucide-react: `User`, `UserCog`)
- [ ] Implementar endpoint backend `PATCH /api/users/me` para actualizar perfil

**Criterios de aceptación:**
- ✓ Click en "Mi Perfil" navega a página funcional
- ✓ Usuario puede cambiar su contraseña
- ✓ Cambios se persisten correctamente

---

### ✓ Issue #11: Mensajes en campo de correo electrónico
**Prioridad:** Baja (mejora de UX)  
**Módulo:** `web/` - Registro de Empresas  
**Descripción:** Mensajes de error genéricos para validación de email

**Tareas:**
- [ ] Diferenciar mensajes de error:
  - Email mal formado: "Formato de correo inválido"
  - Email ya registrado: "Este correo ya está registrado en otra cuenta"
- [ ] Backend debe retornar error específico para email duplicado
- [ ] Frontend debe parsear el error y mostrar mensaje correcto
- [ ] Agregar validación de formato con regex mejorado

**Criterios de aceptación:**
- ✓ Mensajes de error son específicos y claros
- ✓ Usuario sabe exactamente cuál es el problema

---

### ✓ Issue #12: Ortografía en inicio de sesión
**Prioridad:** Baja  
**Módulo:** `web/` - Login (Tenants)  
**Descripción:** Mismo problema de tildes

**Correcciones:**
- [ ] "Sesion" → "Sesión"
- [ ] "electronico" → "electrónico"
- [ ] "Contrasena" → "Contraseña"
- [ ] "No tienes cuenta?" → "¿No tienes cuenta?"

---

### ✓ Issue #13: Opción de reset de contraseña en login
**Prioridad:** ALTA (funcionalidad crítica faltante)  
**Módulo:** `api/` + `web/` - Autenticación  
**Descripción:** No existe flujo de recuperación de contraseña

**Tareas Backend:**
- [ ] Crear endpoint `POST /api/auth/forgot-password`
  - Recibe email
  - Genera token de recuperación (UUID) con expiración de 1 hora
  - Almacena en tabla `PasswordResetToken`
  - Envía email con link de reset
- [ ] Crear endpoint `POST /api/auth/reset-password`
  - Recibe token + nueva contraseña
  - Valida token no expirado
  - Actualiza contraseña
  - Invalida token usado

**Tareas Frontend:**
- [ ] Crear ruta `web/app/(auth)/forgot-password/page.tsx`
- [ ] Crear ruta `web/app/(auth)/reset-password/[token]/page.tsx`
- [ ] En login, agregar link debajo de contraseña: "¿Olvidaste tu contraseña?"
- [ ] Diseñar flujo completo con mensajes de confirmación

**Migración Prisma:**
```prisma
model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique @default(uuid())
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

**Criterios de aceptación:**
- ✓ Usuario puede solicitar reset desde login
- ✓ Recibe email con link funcional
- ✓ Puede establecer nueva contraseña
- ✓ Token se invalida después de uso o expiración

---

## 🟢 Issues Menores (Resolver al final si hay tiempo)

### ✓ Issue #1: Botón para mostrar contraseña
**Prioridad:** Baja  
**Módulo:** `web/` - Login  
**Descripción:** Falta toggle de visibilidad en campos password

**Tareas:**
- [ ] Agregar componente `PasswordInput` con toggle eye icon
- [ ] Usar lucide-react: `Eye` / `EyeOff`
- [ ] Reemplazar todos los `<Input type="password">` por `<PasswordInput>`

---

### ✓ Issue #2: Título de registro no muy visible
**Prioridad:** Baja (diseño)  
**Módulo:** `web/` - Registro  
**Descripción:** Título con bajo contraste

**Tareas:**
- [ ] Aumentar font-weight a `font-semibold` o `font-bold`
- [ ] Aumentar tamaño a `text-3xl` o agregar más padding
- [ ] Considerar agregar color de accent: `text-primary`

---

## 📊 Resumen de Issues por Prioridad

| Prioridad | Cantidad | Issues |
|-----------|----------|--------|
| 🔴 ALTA | 6 | #4, #6, #7, #9, #13, #14 |
| 🟡 MEDIA | 4 | #3, #5, #8, #10, #11 |
| 🟢 BAJA | 4 | #1, #2, #12 |

---

## 🎯 Plan de Ejecución FASE 0

### Sprint 1 (Día 1-2): Issues ALTA
1. Issue #6: Longitud campos (fix backend + frontend)
2. Issue #14: Bloqueo de cuenta (seguridad)
3. Issue #9: Validación emails distintos
4. Issue #4: Máscaras de input

### Sprint 2 (Día 2-3): Issues MEDIA + ALTA restantes
5. Issue #7: Color dropdown
6. Issue #13: Reset de contraseña (feature completa)
7. Issue #5: Mensajes campos obligatorios
8. Issue #8: Mensaje contraseñas no coinciden

### Sprint 3 (Día 3 - si hay tiempo): Issues BAJA
9. Issue #3, #12: Ortografía
10. Issue #10: Página de perfil
11. Issue #11: Mensajes email específicos
12. Issue #1, #2: Detalles UI

---

## ✅ Checklist Pre-Deploy FASE 0
- [ ] Todos los issues ALTA resueltos y probados
- [ ] Migración de Prisma ejecutada en desarrollo
- [ ] Tests unitarios críticos pasando
- [ ] Build exitoso de `api/` y `web/`
- [ ] Testing manual de todos los flujos modificados
- [ ] Actualizar documentación de cambios
- [ ] Crear PR con descripción detallada
- [ ] Deploy a staging para QA final
- [ ] Aprobación de QA (jgomez)
- [ ] Deploy a producción

---

## 📦 FASE 1: Catálogo de Inventarios + Migración de Datos (5-7 días)

### Objetivo
Implementar sistema completo de gestión de productos/servicios con catálogo, precios multinivel, y wizard de migración de datos históricos.

### Pre-requisitos
- [ ] Revisar schema Prisma actual
- [ ] Verificar si existen tablas relacionadas a productos/clientes
- [ ] Crear rama `feature/catalog-inventory`

### Día 1-2: Backend - Modelos y API

#### Migración Prisma
- [ ] Crear modelos completos (ver esquema en documento de investigación):
  - `CatalogItem` (productos/servicios)
  - `Category` (categorías jerárquicas)
  - `TaxProfile` (perfiles fiscales)
  - `UnitOfMeasure` (unidades de medida con códigos DTE)
  - `PriceList` (listas de precios)
  - `PriceListEntry` (precios por lista)
  - `VolumeDiscountTier` (descuentos por volumen)
- [ ] Ejecutar `npx prisma migrate dev --name add-catalog-system`
- [ ] Seed inicial con datos de catálogos MH (CAT-011, CAT-014, CAT-015)

#### Controladores y Servicios NestJS
- [ ] `CatalogItemController` con endpoints CRUD
- [ ] `CatalogItemService` con lógica de negocio
- [ ] Endpoint de búsqueda: `GET /catalog-items/search?q={query}&limit=20`
- [ ] Endpoint de favoritos: `POST /catalog-items/:id/favorite`
- [ ] Endpoint de recientes: `GET /catalog-items/recent`
- [ ] Implementar DTOs de validación con `class-validator`

### Día 2-3: Frontend - UI de Catálogo

#### Página de gestión de catálogo
- [ ] Crear ruta: `web/app/(dashboard)/catalog/page.tsx`
- [ ] Diseñar tabla con shadcn/ui DataTable
- [ ] Implementar filtros: categoría, tipo (producto/servicio), activo/inactivo
- [ ] Agregar modales para crear/editar ítems
- [ ] Formulario con validación completa (código, nombre, precio, IVA, etc.)

#### Combobox de selección rápida
- [ ] Crear componente `<CatalogItemCombobox>` con shadcn Command
- [ ] Integrar Fuse.js para búsqueda fuzzy client-side
- [ ] Implementar secciones: Favoritos / Recientes / Todos
- [ ] Agregar indicador visual de tipo (producto vs servicio)
- [ ] Opción "Crear nuevo" inline al final del dropdown
- [ ] Auto-completar descripción, precio y unidad al seleccionar

### Día 4-5: Wizard de Migración de Datos

#### Backend - Import Service
- [ ] Instalar dependencias: `papaparse`, `xlsx`
- [ ] Crear `DataImportService` con lógica de:
  - Parsing de CSV/Excel
  - Validación de NIT/DUI/NRC salvadoreños
  - Deduplicación fuzzy (multi-capa)
  - Importación en lotes con transacciones
- [ ] Crear cola BullMQ: `data-import-queue`
- [ ] Endpoints:
  - `POST /import/upload` (upload a Azure Blob)
  - `POST /import/validate` (validación sin guardar)
  - `POST /import/execute` (importación real)
  - `GET /import/jobs/:id/status` (progreso)

#### Frontend - Import Wizard
- [ ] Instalar `react-spreadsheet-import`
- [ ] Crear ruta: `web/app/(dashboard)/import/page.tsx`
- [ ] Implementar 8 pasos del wizard:
  1. Selección de entidad (Clientes, Productos, Facturas históricas)
  2. Upload de archivo
  3. Preview de datos crudos
  4. Mapeo de columnas (auto-detect)
  5. Validación con preview de errores
  6. Resolución de duplicados (UI para merge/skip)
  7. Ejecución con progress bar via WebSocket
  8. Resumen con descarga de CSV de errores
- [ ] Integrar WebSocket para actualizaciones de progreso en tiempo real

### Día 6-7: Testing y Refinamiento
- [ ] Tests unitarios de servicios críticos
- [ ] Tests E2E del flujo de creación de ítem
- [ ] Tests E2E del wizard de importación (happy path)
- [ ] Optimización de queries N+1
- [ ] Documentación de API con Swagger

---

## 📦 FASE 2: Facturación Recurrente + Módulo Contable (5-7 días)

### Día 1-2: Setup de BullMQ y Facturación Recurrente

#### Infraestructura
- [ ] Verificar Redis instalado y corriendo: `redis-cli ping`
- [ ] Si no existe, instalar: `sudo apt install redis-server`
- [ ] Configurar Redis en Docker Compose (si usas)
- [ ] Instalar `@nestjs/bull` y `bull`
- [ ] Configurar BullModule en `api/src/app.module.ts`

#### Modelos Prisma
- [ ] Crear modelo `RecurringInvoiceTemplate` con:
  - Configuración de scheduling (interval, anchor day, policy)
  - Estado (ACTIVE, PAUSED, SUSPENDED_ERROR, CANCELLED)
  - Tracking de errores y fallos consecutivos
  - Relación a cliente y líneas de ítem
- [ ] Crear modelo `RecurringInvoiceHistory` (log de facturas generadas)
- [ ] Migración: `npx prisma migrate dev --name add-recurring-invoicing`

#### Colas y Procesadores BullMQ
- [ ] Crear `recurring-invoice-generation.queue.ts`
- [ ] Crear `RecurringInvoiceProcessor` con lógica de:
  - Generación de factura desde template
  - Normalización de día 31 (último del mes)
  - Retry con backoff exponencial
  - Suspensión automática tras 3 fallos
- [ ] Crear cron job que ejecuta diariamente a las 00:01 UTC
- [ ] Implementar notificaciones pre-generación (opcional)

### Día 3-4: UI de Facturación Recurrente

#### Gestión de Templates
- [ ] Crear ruta: `web/app/(dashboard)/recurring-invoices/page.tsx`
- [ ] Tabla con templates activos/pausados
- [ ] Formulario de creación:
  - Selección de cliente
  - Configuración de intervalo (mensual, semanal, etc.)
  - Día de anclaje con selector visual
  - Modo de generación (AUTO_SEND vs AUTO_DRAFT)
- [ ] Acciones: Pausar, Reanudar, Editar, Cancelar
- [ ] Historial de facturas generadas por template

### Día 5-6: Módulo Contable Básico

#### Modelos Prisma
- [ ] Crear modelo `AccountingAccount` (catálogo de cuentas)
- [ ] Crear modelo `JournalEntry` (partidas contables)
- [ ] Crear modelo `JournalEntryLine` (líneas de partida)
- [ ] Crear modelo `AccountMappingRule` (reglas de cuentas por operación)
- [ ] Migración: `npx prisma migrate dev --name add-accounting-module`
- [ ] Seed con plan de cuentas salvadoreño base (NIIF PYMES)

#### Generación Automática de Partidas
- [ ] Crear `AccountingService` con métodos:
  - `generateJournalEntryFromInvoice()`
  - `generateJournalEntryFromPayment()`
  - `generateJournalEntryFromCreditNote()`
- [ ] Implementar reglas automáticas según investigación:
  - Factura venta: D: CxC, C: Ingresos + IVA Débito
  - Pago recibido: D: Efectivo, C: CxC
  - Nota crédito: Reversa de factura
- [ ] Hook en eventos de factura/pago para generar partidas

#### UI de Reportes Contables
- [ ] Crear ruta: `web/app/(dashboard)/accounting/page.tsx`
- [ ] Vista de Libro Diario (tabla paginada)
- [ ] Vista de Libro Mayor por cuenta
- [ ] Exportación a Excel con `exceljs`
- [ ] Filtros por rango de fecha y período fiscal

### Día 7: Testing
- [ ] Tests de generación de factura recurrente
- [ ] Tests de generación de partidas contables
- [ ] Verificar que débitos = créditos siempre
- [ ] Tests de exportación a Excel

---

## 📦 FASE 3: Cotizaciones + Webhooks (5-7 días)

### Día 1-3: Sistema de Cotizaciones

#### Backend - Modelos y Máquina de Estados
- [ ] Instalar `xstate` (v5) para máquina de estados
- [ ] Crear modelos Prisma:
  - `Quote` (con versionamiento: `quoteGroupId`, `version`, `isLatestVersion`)
  - `QuoteLineItem` (con `isAccepted`, `acceptedQuantity` para aprobación parcial)
  - `QuoteStatusHistory` (audit trail)
- [ ] Implementar máquina de estados XState con transiciones válidas
- [ ] Crear `QuoteService` con métodos:
  - `createQuote()`
  - `createNewVersion()` (clonación)
  - `transitionStatus()` (con validación de estados)
  - `convertToInvoice()` (copia a factura)
  - `generateApprovalToken()` (UUID para portal)

#### Frontend - Gestión de Cotizaciones
- [ ] Crear ruta: `web/app/(dashboard)/quotes/page.tsx`
- [ ] Formulario similar a facturas con estados visuales
- [ ] Vista de historial de versiones (navegación v1, v2, v3...)
- [ ] Diff visual entre versiones (opcional)
- [ ] Botón "Convertir a Factura" con confirmación

#### Portal de Aprobación de Cliente
- [ ] Crear ruta pública: `web/app/quote/approve/[token]/page.tsx`
- [ ] Diseño con branding de la empresa emisora
- [ ] Detalle de cotización con totales
- [ ] Checkboxes por line item para aprobación parcial
- [ ] Inputs para ajustar cantidad aceptada
- [ ] Botones: Aceptar / Rechazar / Solicitar Cambios
- [ ] Envío de email de notificación al emisor

### Día 4-6: Sistema de Webhooks

#### Backend - Arquitectura de Webhooks
- [ ] Crear modelos Prisma:
  - `WebhookEndpoint` (configuración por tenant)
  - `WebhookEvent` (log inmutable con idempotency key)
  - `WebhookDelivery` (tracking de entregas)
- [ ] Crear `WebhookService` con:
  - Generación de firma HMAC-SHA256
  - Fan-out a múltiples endpoints
  - Payload con partidas contables embebidas
- [ ] Crear cola BullMQ: `webhook-delivery-queue`
- [ ] Crear `WebhookDeliveryProcessor` con:
  - Reintentos exponenciales (10 intentos, ~8 horas)
  - Circuit breaker después de 3 días de fallos
  - Dead letter queue
- [ ] Endpoints:
  - CRUD de endpoints: `POST /webhooks/endpoints`
  - Listado de eventos: `GET /webhooks/events`
  - Detalles de delivery: `GET /webhooks/deliveries/:id`
  - Replay manual: `POST /webhooks/deliveries/:id/retry`

#### Frontend - Dashboard de Webhooks
- [ ] Crear ruta: `web/app/(dashboard)/webhooks/page.tsx`
- [ ] CRUD de endpoints con formulario de:
  - URL destino
  - Eventos suscritos (checkboxes)
  - Secret para firma (generado automáticamente)
  - Estado: activo/inactivo
- [ ] Log de eventos recientes (tabla paginada)
- [ ] Inspector de delivery individual (request/response por intento)
- [ ] Gráfico de salud por endpoint (tasa de éxito)
- [ ] Vista de dead letter queue con botón de replay
- [ ] Rotación de secrets con período de gracia

### Día 7: Testing y Documentación
- [ ] Tests de conversión cotización → factura
- [ ] Tests de firma HMAC y verificación
- [ ] Tests de retry logic con mocks
- [ ] Documentación de payloads webhook en Swagger
- [ ] Guía para consumidores de webhooks

---

## 📚 Documentación a Generar

- [ ] `ARCHITECTURE.md` con diagramas de componentes
- [ ] `API.md` con especificación de endpoints
- [ ] `WEBHOOKS.md` con guía de integración para consumidores
- [ ] `DEPLOYMENT.md` actualizado con nuevas dependencias (Redis)
- [ ] Actualizar `README.md` con nuevas features

---

## 🚀 Despliegue Final

### Pre-Deploy Checklist
- [ ] Todas las migraciones Prisma ejecutadas en staging
- [ ] Variables de entorno configuradas (Redis URL, secrets)
- [ ] Tests E2E críticos pasando
- [ ] Build de producción exitoso
- [ ] Revisión de código completa
- [ ] Backup completo de base de datos

### Deploy a Producción
- [ ] Ejecutar migraciones en producción
- [ ] Deploy de `api/` a Azure App Service
- [ ] Deploy de `web/` a Azure Static Web Apps (o App Service)
- [ ] Verificar Redis accesible desde API
- [ ] Ejecutar smoke tests en producción
- [ ] Monitorear logs por 24 horas

---

## 🎓 Lecciones Aprendidas
**Se actualizará conforme avancemos**

1. [Por definir]

---

## 📞 Contactos y Recursos

**QA:** jgomez - Republicode  
**Documentación MH:** [Portal Hacienda SV](https://www.mh.gob.sv/factura-electronica/)  
**Investigación base:** Ver artefacto completo generado

---

**Última actualización:** 9 de febrero de 2026
**Estado:** ✅ FASE 0 completada, producción estabilizada

---

## Completed — 2026-02-09
- [x] Sprint 1: Pagination in /clientes (backend + frontend)
- [x] Sprint 2: Recurring Invoices UI (graceful degradation)
- [x] Production bug fixes (auth, infinite loops, crashes)
- [x] Form validations (NIT, DUI, NRC, phone, email)
- [x] Tenant name display in header
- [x] Error handling hardening (19 files)

## Completed — 2026-02-16 (Post-Migration Sprint Part 1)
- [x] 1.1: DB cleanup script created (apps/api/prisma/cleanup-junk-tenants.ts)
- [x] 1.2: CORS hardened (localhost filtered in production), HTTPS CLI commands ready
- [x] 1.3: MH token persistence in HaciendaEnvironmentConfig (DB read/write + memory cache)
- [x] 1.4: Fix admin support ticket detail page (SelectItem empty value + JSON.parse safety)
- [x] 1.5: EmailSendLog recording in DefaultEmailService + schema updated (tenantId, configId optional)
- [x] 1.6: Deleted dte.service.ts.backup, moved prompt-migracion to tasks/
- [x] Deploy workflows updated to Docker build+push (done 2026-02-16 pre-sprint)
- [x] Email delivery fixed (client_credentials flow + dummy refresh token)
- [x] Quote approval fixed (approvedQuantity Decimal→Number, FRONTEND_URL configured)

## Next Up
- [ ] Run cleanup script against production DB
- [ ] Run `prisma db push` to apply EmailSendLog schema changes
- [ ] Run Azure CLI: httpsOnly=true + CORS cleanup
- [ ] Deploy API + Web with Part 1 changes
- [ ] Part 2-7 of post-migration sprint (see prompt-post-migracion.md)
