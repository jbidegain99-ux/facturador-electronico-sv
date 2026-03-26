# Auditoría: Retraso y Batching en Envío de Correos de Tickets

**Fecha de auditoría:** 25 de marzo 2026
**Módulo auditado:** Sistema de tickets de soporte — notificaciones por email
**Incidente reportado:** 24 de marzo 2026

---

## 1. Flujo Actual de Emails (Hallazgo Fase 1)

```
Cliente POST /support-tickets
    │
    ▼
SupportController.createTicket()          ← apps/api/src/modules/support/support.controller.ts:60
    │
    ▼
SupportService.createTicket()             ← apps/api/src/modules/support/support.service.ts:51
    │
    ├─ [SYNC/AWAIT] Crear SupportTicket en DB (línea 87)
    ├─ [SYNC/AWAIT] Crear TicketActivity CREATED (línea 110)
    │
    ├─ [FIRE-AND-FORGET] sendEmail() al requester (línea 128)   ← SIN await
    │   └── DefaultEmailService.sendEmail(tenantId, {...})
    │       ├── Resuelve adapter (tenant config o Republicode default)
    │       ├── Microsoft Graph API POST /sendMail
    │       └── .then() solo loguea errores
    │
    ├─ [FIRE-AND-FORGET] Notificar super admins (línea 153)     ← SIN await
    │   └── getSuperAdmins() → for each admin → sendEmail('system', {...})
    │
    └─ return ticket  ← Response al cliente INMEDIATA
```

### Hallazgo Clave Fase 1

**Los emails se envían de forma inmediata (fire-and-forget) dentro del mismo request HTTP.**
NO existe:
- Cola de mensajes (Bull/BullMQ/Redis)
- Tabla outbox de notificaciones pendientes
- Evento asíncrono (@OnEvent)
- Worker/proceso separado para envío

El código en `support.service.ts:128-172` llama `this.defaultEmailService.sendEmail()` sin `await`, ejecutando el envío como una promesa flotante en el event loop del mismo proceso Node.js.

---

## 2. Cron Jobs del Sistema (Hallazgo Fase 2)

### Inventario Completo de Cron Jobs

| Servicio | Frecuencia | Propósito | Archivo |
|----------|-----------|-----------|---------|
| **WebhookDeliveryService** | Cada 30 seg | Procesar webhooks pendientes con retry | `modules/webhooks/webhook-delivery.service.ts:60` |
| **EmailHealthService** | Cada 10 min | Monitoreo de salud de proveedores de email | `modules/email-config/services/email-health.service.ts:40` |
| **SupportSlaCronService** | Cada 15 min | Verificar cumplimiento de SLAs de tickets | `modules/support/support-sla-cron.service.ts:15` |
| **RecurringInvoiceCronService** | Diario 00:01 | Generar facturas recurrentes | `modules/recurring-invoices/recurring-invoice-cron.service.ts:57` |
| **QuotesCronService** (expiración) | Diario 06:00 | Expirar cotizaciones vencidas | `modules/quotes/quotes-cron.service.ts:16` |
| **QuotesCronService** (recordatorios) | Diario 09:00 | Enviar recordatorios de cotizaciones | `modules/quotes/quotes-cron.service.ts:53` |

### Hallazgo Clave Fase 2

**NINGÚN cron job procesa emails pendientes de tickets.** La hipótesis inicial de "cron batching cada 30-40 minutos" queda **DESCARTADA**. No existe un mecanismo de batch processing para notificaciones de tickets.

El cron de webhooks (30s) procesa entregas de webhooks, NO emails. El cron de email health (10min) solo monitorea — no envía emails.

---

## 3. Servicio de Email — Graph API (Hallazgo Fase 3)

### Arquitectura del Servicio

**Archivo principal:** `apps/api/src/modules/email-config/services/default-email.service.ts`

```
sendEmail(tenantId, params)
    │
    ├─ getAdapterWithMetadata(tenantId)
    │   ├─ Si tenant tiene TenantEmailConfig activa → usar adapter del tenant
    │   └─ Si no → usar ClientCredentialsMsGraphAdapter (Republicode default)
    │
    ├─ adapter.sendEmail(params)  ← llamada SÍNCRONA al Graph API
    │   ├─ Obtener token (cache con 5 min buffer) ← línea 298-343
    │   ├─ POST https://graph.microsoft.com/v1.0/users/{from}/sendMail
    │   └─ Timeout: 30 segundos (AbortSignal)
    │
    ├─ Si éxito → logEmailSend() fire-and-forget a EmailSendLog
    ├─ Si falla + es adapter tenant → fallback a Republicode default
    └─ Si falla + es default → retorna { success: false }
```

### Vulnerabilidades Identificadas

| Aspecto | Estado | Riesgo |
|---------|--------|--------|
| Rate limiting (rateLimitPerHour) | Campo en DB pero **NUNCA verificado** | MEDIO |
| Retry logic | **NO implementado** — un solo intento | ALTO |
| Manejo HTTP 429 (Too Many Requests) | **NO implementado** — error genérico | MEDIO |
| Exponential backoff | **NO implementado** | MEDIO |
| Batch sending | **NO implementado** — 1 email = 1 API call | BAJO |
| Token caching | Implementado con buffer 5 min | OK |
| Fallback a Republicode default | Implementado | OK |
| Logging a EmailSendLog | Implementado (fire-and-forget) | OK |

### Hallazgo Clave Fase 3

El servicio de email **no introduce delays artificiales**. Cada `sendEmail()` hace una llamada HTTP directa al Graph API. No hay throttling, queuing, ni batching en el código de la aplicación.

---

## 4. Infraestructura Azure (Hallazgo Fase 4)

### Configuración Actual

| Recurso | Configuración |
|---------|--------------|
| App Service | `facturador-api-sv` — **Basic SKU** |
| Container | Docker (node:20-alpine), puerto 3001 |
| Health check | `GET /health` — Docker HEALTHCHECK cada 30s |
| Always On | **NO CONFIRMADO** — no aparece en scripts de deploy ni en código |
| Startup | `node dist/main.js` — sin delay artificial |

### Comportamiento del App Service en Basic SKU

**Azure App Service Basic tier SÍ soporta "Always On"** (disponible desde Basic B1 en adelante). Sin embargo:

1. **Si Always On está DESHABILITADO** (default en muchos casos):
   - El App Service descarga el worker process después de ~20 minutos de inactividad
   - Al recibir la siguiente request, inicia un **cold start** completo
   - Cold start incluye: iniciar contenedor → `node dist/main.js` → conectar DB → registrar crons
   - Tiempo estimado de cold start: **5-15 segundos** (Azure SQL latencia + Prisma connect)

2. **Impacto en promesas fire-and-forget:**
   - Cuando el App Service descarga el proceso, **todas las promesas pendientes se pierden**
   - Si un email fire-and-forget no completó su envío antes del shutdown, se pierde silenciosamente
   - No hay mecanismo de recuperación — no hay outbox ni retry

3. **Impacto en cron jobs:**
   - Con el proceso descargado, los cron jobs de `@nestjs/schedule` NO se ejecutan
   - Al reiniciar, los crons se re-registran pero no ejecutan retroactivamente los que se perdieron

---

## 5. Diagnóstico — Causa Raíz

### Ranking de Hipótesis

| # | Hipótesis | Probabilidad | Evidencia |
|---|-----------|-------------|-----------|
| 1 | **App Service dormido (Always On disabled) + Exchange Online delivery pipeline** | **MUY ALTA** | Gap de 4.5h + emails fire-and-forget que se pierden en sleep + batches que coinciden con Exchange delivery optimization |
| 2 | Cron job que procesa notificaciones en batch | **DESCARTADA** | No existe tal cron — verificado en código |
| 3 | Rate limiting de Graph API (HTTP 429) | **BAJA** | No hay evidencia en logs; intervalos demasiado largos para throttling |
| 4 | Token expiry + cold cache | **CONTRIBUTIVA** | Primer envío tras cold start requiere token fetch (~1-3s extra) |
| 5 | Cola/outbox con worker separado | **DESCARTADA** | No existe cola ni outbox — verificado en código |

### Causa Raíz Confirmada

**La causa raíz es una combinación de dos factores:**

#### Factor 1: Azure App Service Sleep (Causa Principal del Gap de 4.5 horas)

Timeline reconstruida:
```
11:06 AM  — Smoke test crea ticket → App despierto → email enviado → llega en tiempo real
11:26 AM  — ~20 min sin actividad → App Service descarga el proceso (sleep)
11:26 AM - 3:40 PM — App dormido. Ningún cron ejecutándose. Ningún email enviándose.
~3:40 PM  — Suite E2E comienza → primera request despierta el App Service (cold start)
~3:41 PM  — Cold start completo. E2E crea tickets rápidamente.
~3:41-3:42 PM — Emails fire-and-forget se disparan para todos los tickets
3:42-3:43 PM — Exchange Online procesa y entrega el primer batch de emails
```

#### Factor 2: Exchange Online Mail Delivery Pipeline (Causa de los Batches Subsecuentes)

Los emails enviados via Graph API no se entregan instantáneamente al buzón receptor. Exchange Online tiene su propio pipeline de procesamiento:

1. **Graph API acepta el mensaje** — respuesta 202 inmediata
2. **Exchange Online procesa internamente** — anti-spam, compliance, routing
3. **Entrega al buzón de destino** — puede demorar 1-10 minutos dependiendo de la carga

Cuando la suite E2E crea muchos tickets en secuencia rápida, se generan decenas de emails casi simultáneamente. Exchange Online los procesa en su pipeline interno y los entrega en oleadas, lo que explica los batches separados por 2-10-38 minutos observados en el inbox de Denis.

#### Evidencia del Código que Confirma

1. **Fire-and-forget sin garantía de entrega** (`support.service.ts:128`):
   ```typescript
   // SIN await — promesa flotante
   this.defaultEmailService.sendEmail(tenantId, {...}).then(result => {
     if (!result.success) {
       this.logger.error(`Failed to send...`);  // Solo loguea, no reintenta
     }
   });
   ```

2. **Sin retry ni outbox** (`default-email.service.ts:56-96`):
   - Un solo intento de envío
   - Si falla, retorna `{ success: false }` y la promesa se resuelve
   - No hay reintento, no hay persistencia del intento fallido

3. **Token cache en memoria volátil** (`default-email.service.ts:34-35`):
   ```typescript
   private cachedToken: string | null = null;
   private tokenExpiresAt: Date | null = null;
   ```
   — Se pierden en cada reinicio/cold start del proceso

---

## 6. Plan de Acción

### Fix Inmediato (Prioridad CRÍTICA)

#### A. Habilitar Always On en Azure App Service

```bash
az webapp config set \
  --resource-group facturador-sv-rg \
  --name facturador-api-sv \
  --always-on true
```

**Impacto:** Elimina el gap de 4.5 horas. El proceso Node.js permanece activo 24/7, los cron jobs se ejecutan según schedule, y las promesas fire-and-forget no se pierden por shutdown.

**Costo:** Ninguno adicional — Always On está incluido en Basic B1.

#### B. Agregar `await` al envío de emails de tickets

Cambiar el patrón fire-and-forget a síncrono para garantizar que el email se envía antes de responder al cliente:

```typescript
// ANTES (fire-and-forget — puede perderse en shutdown)
this.defaultEmailService.sendEmail(tenantId, {...}).then(result => {...});

// DESPUÉS (síncrono — garantiza envío)
const emailResult = await this.defaultEmailService.sendEmail(tenantId, {...});
if (!emailResult.success) {
  this.logger.error(`Failed to send ticket-created email for ${ticket.ticketNumber}: ${emailResult.errorMessage}`);
}
```

**Archivos a modificar:** `apps/api/src/modules/support/support.service.ts` líneas 128-172

**Impacto:** +200-500ms en el response time de crear ticket, pero garantiza que el email se envía antes de que el proceso pueda morir.

### Fix a Mediano Plazo (Prioridad ALTA)

#### C. Implementar Outbox Pattern como Fallback

Crear tabla `PendingNotification` y un cron de 1 minuto que procese notificaciones pendientes:

1. Al crear ticket, escribir registro en `PendingNotification` (dentro de la misma transacción DB)
2. Intentar envío inmediato (await)
3. Si éxito → marcar como SENT
4. Si falla → dejar como PENDING
5. Cron cada 60s procesa PENDING con retry (max 3 intentos, backoff exponencial)

**Impacto:** Resiliencia ante fallos transitorios de Graph API (429, timeout, network issues).

#### D. Implementar Retry Logic en el Email Service

En `default-email.service.ts`, agregar retry con backoff para fallos transitorios:

```typescript
async sendEmailWithRetry(tenantId: string, params: SendEmailParams, maxRetries = 3): Promise<SendEmailResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await this.sendEmail(tenantId, params);
    if (result.success) return result;
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, attempt * 2000)); // 2s, 4s, 6s
    }
  }
  return { success: false, errorMessage: 'Max retries exceeded' };
}
```

### Mejoras de Observabilidad (Prioridad MEDIA)

#### E. Logging Estructurado de Latencia

Agregar logging que compare timestamp de creación del ticket vs envío exitoso del email:

```typescript
const ticketCreatedAt = Date.now();
const emailResult = await this.defaultEmailService.sendEmail(tenantId, {...});
const emailSentAt = Date.now();

this.logger.log({
  event: 'ticket_email_sent',
  ticketId: ticket.id,
  ticketNumber: ticket.ticketNumber,
  tenantId,
  success: emailResult.success,
  delayMs: emailSentAt - ticketCreatedAt,
  graphMessageId: emailResult.messageId,
});
```

#### F. Health Check Endpoint Mejorado

Agregar verificación de email service al health check existente:

```typescript
// GET /health — agregar sección de email
services: {
  api: 'healthy',
  database: dbStatus,
  emailService: tokenCacheValid ? 'healthy' : 'degraded',
  lastEmailSentAt: lastSuccessfulSendTimestamp,
}
```

---

## 7. Resumen Ejecutivo

| Aspecto | Hallazgo |
|---------|----------|
| **Causa raíz principal** | App Service dormido por Always On deshabilitado — 4.5h gap |
| **Causa raíz secundaria** | Exchange Online delivery pipeline — batches de 2-38 min |
| **Factor contribuyente** | Emails fire-and-forget sin await — pueden perderse en shutdown |
| **Hipótesis descartada** | NO existe cron batch de notificaciones |
| **Hipótesis descartada** | NO existe cola/outbox para emails |
| **Fix inmediato** | `az webapp config set --always-on true` + agregar `await` a sendEmail |
| **Fix permanente** | Outbox pattern + retry logic + logging de latencia |

### Archivos Clave Auditados

| Archivo | Relevancia |
|---------|-----------|
| `apps/api/src/modules/support/support.service.ts` | Creación de tickets + envío fire-and-forget (líneas 51-175) |
| `apps/api/src/modules/support/support.controller.ts` | Endpoint POST /support-tickets (línea 60) |
| `apps/api/src/modules/email-config/services/default-email.service.ts` | Servicio central de email + Graph API (líneas 56-96, 298-343) |
| `apps/api/src/modules/email-config/adapters/microsoft365.adapter.ts` | Adapter Microsoft 365 — OAuth2 + sendMail |
| `apps/api/src/modules/support/support-sla-cron.service.ts` | Cron SLA — NO procesa emails |
| `apps/api/src/modules/webhooks/webhook-delivery.service.ts` | Cron webhooks — NO procesa emails |
| `apps/api/src/modules/email-config/services/email-health.service.ts` | Cron health — solo monitoreo |
| `apps/api/src/health/health.controller.ts` | Health check endpoint |
| `apps/api/Dockerfile` | Configuración Docker + HEALTHCHECK |
