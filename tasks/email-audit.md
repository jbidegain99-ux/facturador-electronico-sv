# Auditoría de Correo Electrónico - Facturador SV

**Fecha:** 2026-02-15

---

## 1. Infraestructura de Email Existente (100% Completa)

### Módulo: `apps/api/src/modules/email-config/`

El sistema ya tiene una infraestructura completa de email multi-tenant, multi-proveedor:

#### Modelos Prisma
| Modelo | Descripción |
|--------|-------------|
| `TenantEmailConfig` | Config principal por tenant (proveedor, credenciales encriptadas, estado) |
| `EmailHealthCheck` | Historial de health checks por tenant |
| `EmailSendLog` | Log de envíos (status: PENDING→SENT→DELIVERED→OPENED→BOUNCED→FAILED) |
| `EmailConfigRequest` | Tickets de soporte para configuración de email |
| `EmailConfigMessage` | Mensajes dentro de tickets de soporte email |

#### 9 Adaptadores de Proveedores
| Adaptador | Archivo | Método de Auth |
|-----------|---------|---------------|
| SendGrid | `adapters/sendgrid.adapter.ts` | API Key |
| Mailgun | `adapters/mailgun.adapter.ts` | API Key |
| Amazon SES | `adapters/amazon-ses.adapter.ts` | SMTP/IAM |
| **Microsoft 365** | `adapters/microsoft365.adapter.ts` | **OAuth2 (Graph API)** |
| Google Workspace | `adapters/google-workspace.adapter.ts` | OAuth2 |
| Postmark | `adapters/postmark.adapter.ts` | API Key |
| Brevo | `adapters/brevo.adapter.ts` | API Key |
| Mailtrap | `adapters/mailtrap.adapter.ts` | SMTP |
| SMTP Genérico | `adapters/smtp-generic.adapter.ts` | SMTP Basic |

#### Servicios
- **EmailConfigService** - CRUD de configuraciones, test de conexión, envío de prueba
- **EmailHealthService** - Monitoreo periódico de salud
- **EmailAssistanceService** - Sistema de soporte para configuración
- **EncryptionService** - AES-256-GCM para credenciales (usa `ENCRYPTION_KEY` env var)
- **EmailAdapterFactory** - Factory pattern para crear adaptadores dinámicamente

#### Endpoints Existentes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/email-config` | Obtener config del tenant |
| POST | `/email-config` | Crear/actualizar config |
| PATCH | `/email-config` | Actualizar config |
| DELETE | `/email-config` | Eliminar config |
| POST | `/email-config/test-connection` | Probar conexión |
| POST | `/email-config/send-test` | Enviar email de prueba |
| PATCH | `/email-config/activate` | Activar/desactivar |
| GET | `/email-config/logs` | Logs de envío |
| GET | `/email-config/health` | Estado de salud |
| POST | `/email-config/request-assistance` | Solicitar asistencia |
| GET/POST | `/email-config/requests/*` | Gestión de tickets |

#### Frontend
- Página de configuración: `apps/web/src/app/(dashboard)/configuracion/email/page.tsx`
- Componentes: `apps/web/src/components/email-config/`
  - `provider-selector.tsx` - Selector de proveedor
  - `provider-forms.tsx` - Formularios por proveedor
  - `connection-status.tsx` - Estado de conexión
  - `assistance-modal.tsx` - Modal de asistencia
- Admin: `apps/web/src/components/admin/tenant-email-config.tsx`

---

## 2. Lugares donde se NECESITA enviar correo (NO implementado)

### 2.1 Envío de DTE (Facturas, Créditos Fiscales, Notas)
- **Estado:** NO implementado
- **Ubicación esperada:** `apps/api/src/modules/dte/`
- **Necesita:** Enviar PDF del DTE como adjunto al correo del cliente
- **Campo disponible:** `Cliente.correo` en Prisma schema

### 2.2 Envío de Cotizaciones
- **Estado:** STUB (solo logea, no envía)
- **Archivo:** `apps/api/src/modules/quotes/quote-email.service.ts` (52 líneas)
- **Métodos stub:**
  - `sendQuoteToClient()` - Enviar PDF de cotización + link de aprobación
  - `notifyQuoteApproval()` - Notificar emisor de aprobación
  - `notifyQuoteRejection()` - Notificar emisor de rechazo
  - `sendReminder()` - Recordatorio de cotización pendiente
- **Campos en Quote:** `clienteEmail`, `emailSentAt`, `emailDelivered`, `remindersSent`, `lastReminderAt`

### 2.3 Reset de Contraseña
- **Estado:** Frontend existe, backend NO
- **Frontend:** `apps/web/src/app/(auth)/forgot-password/page.tsx`
- **Backend:** NO hay endpoint `/auth/forgot-password`
- **Necesita:** Generar token temporal, enviar link por email

### 2.4 Verificación de Email
- **Estado:** NO implementado
- **Necesita:** Verificación de email al registrar usuario
- **Campo disponible:** `User.email` (unique)

### 2.5 Notificaciones de Tickets de Soporte
- **Estado:** NO implementado
- **Módulo:** `apps/api/src/modules/support/`
- **Tipos de ticket:** EMAIL_CONFIG, TECHNICAL, BILLING, GENERAL, ONBOARDING
- **Necesita:** Notificar a admin y al tenant de nuevos comentarios/actualizaciones

### 2.6 Notificaciones de Onboarding
- **Estado:** Modelo existe, envío NO
- **Schema:** `OnboardingCommunication` con tipo EMAIL
- **Necesita:** Enviar actualizaciones de estado de onboarding

### 2.7 Notificaciones de Sistema
- **Estado:** Solo in-app, NO email
- **Módulo:** `apps/api/src/modules/notifications/`
- **Tipos:** SYSTEM_ANNOUNCEMENT, MAINTENANCE, NEW_FEATURE, PLAN_LIMIT_WARNING, etc.
- **Oportunidad:** Enviar notificaciones críticas por email además de in-app

---

## 3. Variables de Entorno Relacionadas con Correo

### Actuales en Producción
| Variable | Valor | Notas |
|----------|-------|-------|
| `ENCRYPTION_KEY` | `e2ec...26a8` | Para encriptar credenciales de email en DB |

### En `.env.example` (comentadas)
```
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER="apikey"
SMTP_PASSWORD="SG.xxx"
SMTP_FROM_EMAIL="noreply@facturoelectronicosv.com"
SMTP_FROM_NAME="Facturador Electrónico SV"
```

### Necesarias para Microsoft Graph (Fase 5)
```
AZURE_MAIL_TENANT_ID=340b2ae3-5342-46aa-b5b5-956583cc715f
AZURE_MAIL_CLIENT_ID=<se genera en Fase 5.1>
AZURE_MAIL_CLIENT_SECRET=<se genera en Fase 5.1>
AZURE_MAIL_FROM=facturas@republicode.com
AZURE_MAIL_FROM_NAME=Facturador Electrónico SV
```

---

## 4. Recomendación de Arquitectura para Correo

### Lo que YA existe
La infraestructura multi-proveedor está **100% completa**. El adaptador de Microsoft 365 (`microsoft365.adapter.ts`) ya soporta Graph API con OAuth2. Solo falta:

### Lo que FALTA implementar

1. **Servicio de correo "default" (Republicode)**
   - Crear lógica de fallback: si tenant no tiene email config → usar credenciales de Republicode (env vars)
   - El adaptador Microsoft365 ya existe, solo hay que instanciarlo con las credenciales de env vars

2. **Integrar email real en los módulos que lo necesitan:**
   - DTE → adjuntar PDF y enviar
   - Quotes → conectar el stub con EmailAdapterFactory
   - Auth → implementar forgot-password endpoint
   - Support → notificaciones de tickets
   - Onboarding → comunicaciones por email

3. **Dependencias faltantes para Microsoft Graph directo:**
   ```bash
   npm install @azure/identity @microsoft/microsoft-graph-client
   ```
   Nota: El adaptador MS365 actual usa fetch directo a Graph API, no el SDK. Esto es viable pero el SDK es más robusto.

### Flujo recomendado
```
Módulo (DTE/Quotes/Auth)
  → EmailSenderService (nuevo, centralizado)
    → TenantEmailConfig existe? → usar config del tenant (vía AdapterFactory)
    → No existe? → usar MS365 con facturas@republicode.com (env vars)
```

---

## 5. Resumen

| Componente | Estado |
|------------|--------|
| Infraestructura email multi-proveedor | ✅ 100% |
| 9 adaptadores de proveedor | ✅ 100% |
| Encriptación de credenciales | ✅ 100% |
| Health monitoring | ✅ 100% |
| UI de configuración (tenant + admin) | ✅ 100% |
| Envío real de DTEs por email | ❌ 0% |
| Envío real de cotizaciones por email | ❌ 0% (stub) |
| Reset de contraseña | ❌ 0% |
| Verificación de email | ❌ 0% |
| Notificaciones por email | ❌ 0% |
| Fallback a Republicode shared mailbox | ❌ 0% |
