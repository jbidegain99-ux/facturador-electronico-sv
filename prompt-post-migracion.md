# Sprint Post-Migración: Auditoría + Mejoras + Nuevos Features

## CONTEXTO

La migración al tenant Republicode se completó exitosamente. Los correos por Microsoft Graph están funcionando. Ahora necesitamos estabilizar, limpiar, y avanzar con mejoras.

**Infraestructura actual (Republicode):**
- API App Service: facturador-api-sv (Docker container)
- Web App Service: facturador-web-sv (Docker container)  
- SQL Server: facturador-rc-sql
- Database: facturadordb (Azure SQL Basic, 2GB)
- ACR: republicodeacr
- Resource Group: facturador-sv-rg
- Email: Microsoft Graph API desde shared mailbox facturas@republicode.com

---

## PARTE 1: FIXES CRÍTICOS (hacer primero)

### 1.1 Limpiar datos basura de la BD
- 10 de 12 tenants son datos de prueba/QA corruptos
- Conservar SOLO: el tenant real de Republicode y 1 tenant demo limpio
- Limpiar usuarios asociados a tenants eliminados
- Verificar integridad referencial después de limpiar

### 1.2 Seguridad inmediata
- Habilitar HTTPS only en ambos App Services:
  ```bash
  az webapp update --name facturador-api-sv --resource-group facturador-sv-rg --set httpsOnly=true
  az webapp update --name facturador-web-sv --resource-group facturador-sv-rg --set httpsOnly=true
  ```
- Quitar `localhost:3000` de la lista de CORS del API
- Revisar y limpiar cualquier otra referencia a localhost en app settings

### 1.3 Token de Ministerio de Hacienda
- Actualmente el token MH se guarda solo en memoria y se pierde en cada restart
- Implementar persistencia del token MH en la base de datos (tabla o campo en tenant)
- Al iniciar, verificar si hay token válido en BD antes de pedir uno nuevo

### 1.4 Fix: Pantalla de detalle de tickets de soporte (Super Admin)
- La pantalla de detalle de tickets en `/admin/support/[id]` da error al abrirla
- Investigar el error en logs y consola del navegador
- Resolver el problema - puede ser un campo faltante, relación rota, o problema de routing

### 1.5 Email Send Log
- La tabla EmailSendLog existe pero está vacía - el servicio de envío no está registrando
- Asegurarse de que cada envío (exitoso o fallido) se registre en esta tabla
- Campos mínimos: tenantId, to, subject, status, error (si falló), sentAt

### 1.6 TODOs en el código
- Buscar todos los TODOs/FIXMEs críticos: `grep -rn "TODO\|FIXME\|HACK" --include="*.ts" --include="*.tsx" src/ apps/`
- Resolver los que sean críticos para producción
- Eliminar `dte.service.ts.backup` del repo

---

## PARTE 2: INTERNACIONALIZACIÓN (i18n) - VERSIÓN EN INGLÉS

### Objetivo
Tener el sistema completo en español (default) e inglés. Hay empresarios expats en El Salvador que necesitan la versión en inglés.

### Implementación recomendada
1. **Usar `next-intl` o `next-i18next`** para el frontend (Next.js 14 App Router compatible)
2. **Estructura de archivos de traducción:**
   ```
   apps/web/messages/
   ├── es.json    # Español (default)
   └── en.json    # English
   ```
3. **Organizar por módulos:**
   ```json
   {
     "common": { "save": "Guardar", "cancel": "Cancelar", ... },
     "auth": { "login": "Iniciar Sesión", "register": "Registrarse", ... },
     "invoices": { "create": "Crear Factura", "client": "Cliente", ... },
     "quotes": { "title": "Cotizaciones", "newQuote": "Nueva Cotización", ... },
     "accounting": { ... },
     "admin": { ... },
     "settings": { ... }
   }
   ```
4. **Selector de idioma:** Agregar un toggle/dropdown en el header o settings del usuario
5. **Persistir preferencia:** Guardar el idioma preferido del usuario en la BD o localStorage
6. **Backend:** Los mensajes de error del API también deben respetar el idioma (header Accept-Language o preferencia del usuario)
7. **NO traducir:** Términos fiscales oficiales de El Salvador (DTE, CCF, Nota de Crédito, etc.) - estos se mantienen en español por ser términos legales
8. **PDFs:** Los documentos fiscales (facturas, CCF) siempre en español por requisito legal. Las cotizaciones y reportes internos sí pueden estar en el idioma del usuario.

### Alcance
- Todas las pantallas del sistema (admin, tenant, portal público de cotizaciones)
- Mensajes de error y validación
- Emails enviados (usar el idioma del destinatario cuando sea posible)
- Menús, labels, botones, tooltips, placeholders

---

## PARTE 3: CONFIGURACIÓN DE EMAIL DESDE SUPER ADMIN

### Objetivo
El Super Admin necesita poder configurar el cliente de correo para tenants que lo soliciten por ticket de soporte (clientes no técnicos).

### Implementación
1. **Reutilizar la UI existente** de configuración de email que ya existe en el lado del tenant (`/configuracion/email`)
2. **Crear nueva ruta en Super Admin:** `/admin/tenants/[id]/email-config`
3. **El formulario debe ser idéntico** al que ve el tenant, pero operando en contexto del tenant seleccionado
4. **Endpoint nuevo en API:**
   ```
   GET    /api/v1/admin/tenants/:id/email-config     → Ver config actual
   POST   /api/v1/admin/tenants/:id/email-config     → Guardar/actualizar config
   POST   /api/v1/admin/tenants/:id/email-config/test → Enviar correo de prueba
   ```
5. **Permisos:** Solo SUPER_ADMIN puede acceder estos endpoints
6. **Incluir en la vista de detalle del tenant** un resumen del estado de email y link a configurar

---

## PARTE 4: ONBOARDING CON HACIENDA DESDE SUPER ADMIN

### Objetivo
El Super Admin necesita poder ejecutar el proceso de conexión con Hacienda para los tenants, tanto para:
- **Nuevos tenants** que están haciendo el proceso por primera vez (los 13 pasos completos)
- **Tenants migrando** que ya tienen certificados y credenciales y solo necesitan configurarlos

### Implementación
1. **Reutilizar el wizard de onboarding existente** que ya existe en el lado del tenant
2. **Crear nueva ruta en Super Admin:** `/admin/tenants/[id]/hacienda-config`
3. **El wizard debe ser idéntico** al del tenant pero operando en contexto del tenant seleccionado
4. **Endpoints nuevos o reutilizados:**
   ```
   GET    /api/v1/admin/tenants/:id/hacienda-status   → Estado actual de conexión con MH
   POST   /api/v1/admin/tenants/:id/hacienda-config   → Guardar credenciales MH
   POST   /api/v1/admin/tenants/:id/hacienda-test     → Probar conexión con MH
   POST   /api/v1/admin/tenants/:id/upload-certificate → Subir certificado .p12
   ```
5. **Dos modos:**
   - **Setup completo:** Wizard paso a paso con los 13 pasos de Hacienda
   - **Migración rápida:** Formulario simplificado para subir certificado + credenciales directamente
6. **Permisos:** Solo SUPER_ADMIN
7. **Mostrar en detalle del tenant:** Estado de conexión con Hacienda (conectado/desconectado, ambiente pruebas/producción, certificado vigente/expirado)

---

## PARTE 5: FIX DETALLE DE TICKETS DE SOPORTE

### Problema
La pantalla de detalle de tickets de soporte (`/admin/support/[id]`) da error al abrirla.

### Investigación requerida
1. Abrir la consola del navegador y capturar el error exacto
2. Revisar los logs del API: `az webapp log tail --name facturador-api-sv --resource-group facturador-sv-rg`
3. Posibles causas:
   - Campo faltante en la respuesta del API que el frontend espera
   - Relación rota en Prisma (ticket sin tenant, sin comments, etc.)
   - Error de routing en Next.js (catch-all interfiriendo)
   - Error en el componente de detalle (accediendo a propiedad de null)
4. Resolver el error y verificar que se puede:
   - Ver detalle del ticket
   - Cambiar estado (PENDING → ASSIGNED → IN_PROGRESS → COMPLETED)
   - Asignar responsable
   - Agregar comentarios

---

## PARTE 6: REDISEÑO DEL FLUJO DE APROBACIÓN DE COTIZACIONES

### Problema actual
El flujo actual permite al cliente aprobar directamente sin que el tenant valide cambios. Si el cliente modifica items, la cotización aparece como aprobada sin que el tenant lo revise.

### Nuevo flujo correcto

```
TENANT                          CLIENTE                         SISTEMA
──────                          ───────                         ───────
1. Crea cotización 
   (2 items, $500 total)
   → Click "Enviar"
                                                                → Email al cliente con link
                                                                → Estado: SENT

                                2. Abre link del portal
                                   Ve los 2 items
                                   Quita 1 item
                                   → Click "Solicitar cambio"
                                                                → Mensaje: "Su cambio será 
                                                                  enviado para actualizar 
                                                                  su cotización"
                                                                → Estado: CHANGES_REQUESTED
                                                                → Notificación al tenant

3. Ve notificación: 
   "Cliente solicitó cambios"
   Revisa los cambios del cliente
   Ajusta la cotización 
   (quita el item, recalcula)
   → Click "Reenviar"
                                                                → Email al cliente con link 
                                                                  actualizado
                                                                → Estado: REVISED → SENT

                                4. Abre link actualizado
                                   Ve cotización con 1 item
                                   → Puede APROBAR o RECHAZAR
                                   → Si aprueba:
                                                                → Estado: APPROVED
                                                                → Email al tenant confirmando
                                                                → Email al cliente confirmando

                                   → Si quiere más cambios:
                                   (repite desde paso 2)
```

### Estados del flujo
```
DRAFT → SENT → CHANGES_REQUESTED → REVISED → SENT → APPROVED
                                                   → REJECTED
```

- **DRAFT**: Cotización creada pero no enviada
- **SENT**: Enviada al cliente, esperando respuesta
- **CHANGES_REQUESTED**: Cliente solicitó modificaciones (el cliente NO puede aprobar en este estado, solo solicitar cambios o rechazar)
- **REVISED**: Tenant revisó los cambios y actualizó la cotización
- **APPROVED**: Cliente aprobó la versión final
- **REJECTED**: Cliente rechazó definitivamente

### Cambios en el Portal Público del Cliente

1. **Cuando el cliente abre el link**, ve los items con la opción de:
   - **Marcar items que quiere quitar** (checkbox o botón "Quitar" por item)
   - **Agregar notas/comentarios** explicando qué cambios quiere
   - **Botón "Solicitar Cambios"** → NO "Aprobar parcialmente". El mensaje debe decir: *"Sus cambios serán enviados al proveedor para actualizar su cotización. Recibirá una nueva versión para su aprobación."*
   - **Botón "Aprobar Todo"** → Solo si no hizo cambios. Aprueba la cotización tal cual.
   - **Botón "Rechazar"** → Rechaza con motivo obligatorio

2. **Después de solicitar cambios**, el portal debe mostrar:
   - Mensaje: *"Cambios enviados. Recibirá una cotización actualizada pronto."*
   - El link queda inactivo hasta que el tenant envíe la versión revisada

3. **Cuando el tenant reenvía**, el cliente recibe nuevo email con la cotización actualizada

### Cambios en el Panel del Tenant

1. **Lista de cotizaciones** debe mostrar claramente el estado `CHANGES_REQUESTED` con badge amarillo/naranja
2. **Al abrir una cotización con cambios solicitados**, el tenant debe ver:
   - Qué items el cliente quiere quitar (resaltados en rojo)
   - Los comentarios/notas del cliente
   - Botón "Aplicar Cambios y Reenviar" o editar manualmente y reenviar
3. **El tenant NO puede marcar como aprobada manualmente** - solo el cliente puede aprobar desde el portal

### Cambios en el Backend

1. **Nuevo estado en el enum/campo de status:** Agregar `CHANGES_REQUESTED` y `REVISED`
2. **Endpoint para solicitar cambios (público, sin auth):**
   ```
   POST /api/v1/public/quotes/:token/request-changes
   Body: { 
     removedItems: [lineItemId1, lineItemId2],
     comments: "Solo necesito el servicio X, no el Y"
   }
   ```
3. **Endpoint para reenviar (auth requerido, tenant):**
   ```
   POST /api/v1/quotes/:id/resend
   → Recalcula totales, genera nuevo PDF, envía email, cambia estado a SENT
   ```
4. **Modificar endpoint de aprobación** para que solo funcione si el estado actual es `SENT` (no `CHANGES_REQUESTED`)
5. **Guardar historial** de cada cambio en `quote_status_history` con los items removidos y comentarios
6. **Emails:**
   - Al cliente cuando se envía/reenvía cotización
   - Al tenant cuando cliente solicita cambios
   - A ambos cuando se aprueba o rechaza

### Regla de negocio clave
**El cliente NUNCA puede aprobar una cotización que tiene cambios pendientes.** Si el cliente hizo cambios, DEBE esperar a que el tenant los revise y reenvíe. Solo entonces puede aprobar.

---

## PARTE 7: DISEÑO HTML DE EMAIL TEMPLATES

### Objetivo
Crear templates de correo profesionales y on-brand para todos los emails que envía el sistema. Actualmente los correos son plain text o HTML básico sin diseño.

### Guía de marca Republicode/Facturo
- **Tema oscuro** con acentos en purple/violet (#7C3AED, #8B5CF6, #A78BFA)
- **Gradientes** purple-to-violet en headers
- **Glassmorphism** sutil en cards/containers
- **Fuente:** Inter o sistema (Arial como fallback para email)
- **Logo:** Incluir logo de Facturo en el header de cada email
- **Footer:** Republicode S.A. de C.V. | El Salvador | Links útiles

### Templates a crear

#### 1. Envío de Cotización al Cliente
```
┌─────────────────────────────────────────────────┐
│  [Logo Facturo]              Cotización #COT-001 │
│  ─────────────── gradient header ──────────────  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Hola [Nombre del Cliente],                      │
│                                                  │
│  [Nombre Empresa] le ha enviado una cotización.  │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Resumen                                  │   │
│  │  Fecha: 16/02/2026                        │   │
│  │  Items: 3                                 │   │
│  │  Subtotal: $450.00                        │   │
│  │  IVA (13%): $58.50                        │   │
│  │  Total: $508.50                           │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Detalle de Items                         │   │
│  │  • Servicio A ........... $200.00         │   │
│  │  • Producto B x2 ........ $250.00         │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│        [ Ver y Aprobar Cotización ]              │
│        (botón purple con gradiente)              │
│                                                  │
│  Este enlace es válido por 30 días.              │
│                                                  │
├─────────────────────────────────────────────────┤
│  Facturo by Republicode S.A. de C.V.            │
│  Facturación Electrónica | El Salvador           │
└─────────────────────────────────────────────────┘
```

#### 2. Cotización Actualizada (después de cambios)
- Mismo layout que el #1 pero con:
- Header: "Cotización Actualizada #COT-001"
- Mensaje: "[Empresa] ha actualizado su cotización según los cambios que solicitó."
- Resaltar qué cambió respecto a la versión anterior (items removidos, precios ajustados)
- Botón: "Ver Cotización Actualizada"

#### 3. Notificación de Cambios Solicitados (al tenant)
- Header: "El cliente solicitó cambios"
- Mostrar qué items el cliente quiere quitar
- Mostrar comentarios del cliente
- Botón: "Revisar y Actualizar Cotización"

#### 4. Cotización Aprobada (al tenant)
- Header: "¡Cotización Aprobada!"
- Diseño celebratorio (checkmark verde, mensaje positivo)
- Resumen de lo aprobado
- Botón: "Convertir a Factura"

#### 5. Cotización Aprobada (al cliente)
- Header: "Confirmación de Aprobación"
- Mensaje: "Su cotización ha sido aprobada exitosamente."
- Resumen de lo aprobado
- Nota: "El proveedor procederá con la facturación."

#### 6. Cotización Rechazada (al tenant)
- Header: "Cotización Rechazada"
- Mostrar motivo del rechazo
- Botón: "Ver Detalles"

#### 7. Envío de Factura/DTE al Cliente
- Header: "Factura Electrónica #DTE-XXXX"
- Datos fiscales del emisor y receptor
- Resumen de items y totales
- Adjunto: PDF de la factura (como attachment, no inline)
- Sello de verificación: "Documento Tributario Electrónico validado por el Ministerio de Hacienda"
- Código de generación y sello de recepción

#### 8. Recordatorio de Cotización Pendiente (al cliente)
- Header: "Recordatorio: Cotización pendiente de revisión"
- Tono amable, no agresivo
- Resumen breve
- Botón: "Ver Cotización"

### Requisitos técnicos de los templates
1. **HTML compatible con email clients** (Outlook, Gmail, Apple Mail, Yahoo):
   - Usar tablas para layout (no flexbox/grid)
   - CSS inline (no external stylesheets)
   - No usar CSS variables
   - Ancho máximo 600px
   - Imágenes con URLs absolutas
2. **Responsive:** Debe verse bien en móvil (media queries básicos soportados por la mayoría)
3. **Dark mode aware:** Incluir meta tags para dark mode en email clients que lo soporten
4. **Modular:** Crear un template base/layout reutilizable con header y footer, y que cada template solo defina el contenido central
5. **Variables con Handlebars o template literals:** Usar placeholders como `{{clientName}}`, `{{quoteNumber}}`, `{{total}}` etc. que el backend sustituya al enviar
6. **Testear rendering** en al menos Gmail y Outlook
7. **Accesibilidad:** Alt text en imágenes, buen contraste, estructura semántica con roles

### Ubicación en el código
```
apps/api/src/modules/email/templates/
├── layout.hbs              # Template base (header + footer)
├── quote-sent.hbs          # Cotización enviada
├── quote-updated.hbs       # Cotización actualizada
├── quote-changes.hbs       # Cambios solicitados (al tenant)
├── quote-approved-tenant.hbs
├── quote-approved-client.hbs
├── quote-rejected.hbs
├── invoice-sent.hbs        # Factura/DTE enviada
├── quote-reminder.hbs      # Recordatorio
└── styles.ts               # Colores, fuentes, constantes de estilo
```

---

## ORDEN DE EJECUCIÓN (actualizado)

1. **Primero:** Parte 1 (fixes críticos) - seguridad y estabilidad
2. **Segundo:** Parte 5 (fix tickets) + Parte 6 (rediseño flujo cotizaciones) - bugs y flujo crítico
3. **Tercero:** Parte 7 (email templates) - se necesita para que el flujo de cotizaciones se vea profesional
4. **Cuarto:** Parte 3 (email desde admin) + Parte 4 (hacienda desde admin) - reutilizan componentes existentes
5. **Quinto:** Parte 2 (i18n) - es el más grande y toca todo el sistema

---

## REGLAS DE TRABAJO

- Lee tasks/todo.md y tasks/lessons.md antes de empezar
- Actualiza tasks/todo.md con el plan antes de codificar
- Verifica que compila sin errores antes de marcar algo como completo
- Haz build de Docker local y prueba antes de push
- Un commit por feature/fix completado
- Al terminar cada parte, reporta qué archivos modificaste y evidencia de que funciona
