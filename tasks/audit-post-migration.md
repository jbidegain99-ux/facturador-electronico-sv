# Auditoría Post-Migración - Facturador Electrónico SV

**Fecha:** 2026-02-16
**Autor:** Claude Code (auditoría automatizada)

---

## 1. INFRAESTRUCTURA AZURE (facturador-sv-rg)

### Recursos Activos

| Recurso | Tipo | Región | Estado |
|---------|------|--------|--------|
| republicodeacr | Container Registry | eastus2 | OK |
| facturador-rc-sql | SQL Server | eastus2 | OK |
| facturadordb | SQL Database (Basic, 2GB) | eastus2 | Online |
| facturador-plan | App Service Plan | centralus | OK |
| facturador-api-sv | Web App (Linux Container) | centralus | Running |
| facturador-web-sv | Web App (Linux Container) | centralus | Running |

### ACR Repositories

| Repo | Último Tag | Versiones |
|------|-----------|-----------|
| facturador-api | latest | v48-v51 + latest |
| facturador-web | latest | v42-v44 + latest + 1 commit SHA |

### Hallazgos de Infraestructura

- **HTTPS no forzado** en ambas apps (`httpsOnly: false`). Las requests HTTP no redirigen a HTTPS.
- **CORS incluye localhost** (`http://localhost:3000`) - aceptable para dev pero revisar para producción.
- **MH_API_ENV = test** - Hacienda está en modo pruebas, no producción.
- **Database tier = Basic (2GB)** - suficiente por ahora, monitorear crecimiento.
- **Workflows de deploy actualizados** - Ahora usan Docker build+push en vez de zip deploy (corregido hoy).

---

## 2. VARIABLES DE ENTORNO

### API (facturador-api-sv) - 18 variables

| Variable | Estado | Notas |
|----------|--------|-------|
| DATABASE_URL | ✅ Configurada | Apunta a facturador-rc-sql |
| JWT_SECRET | ✅ Configurada | 64 chars hex |
| ENCRYPTION_KEY | ✅ Configurada | 64 chars hex |
| CORS_ORIGIN | ✅ Configurada | `https://facturador-web-sv.azurewebsites.net,http://localhost:3000` |
| MH_API_ENV | ✅ Configurada | `test` |
| PORT / WEBSITES_PORT | ✅ 3001 | |
| AZURE_MAIL_TENANT_ID | ✅ Configurada | `340b2ae3-...` |
| AZURE_MAIL_CLIENT_ID | ✅ Configurada | `b2b0e1b4-...` |
| AZURE_MAIL_CLIENT_SECRET | ✅ Configurada | 40 chars |
| AZURE_MAIL_FROM | ✅ Configurada | `facturas@republicode.com` |
| AZURE_MAIL_FROM_NAME | ✅ Configurada | `Facturador Electrónico SV` |
| FRONTEND_URL | ✅ Configurada | `https://facturador-web-sv.azurewebsites.net` (agregada hoy) |
| DOCKER_REGISTRY_* | ✅ Configurada | ACR credentials |

### Web (facturador-web-sv) - 8 variables

| Variable | Estado | Notas |
|----------|--------|-------|
| NEXT_PUBLIC_API_URL | ✅ Configurada | `https://facturador-api-sv.azurewebsites.net/api/v1` |
| PORT / WEBSITES_PORT | ✅ 3000 | |
| DOCKER_REGISTRY_* | ✅ Configurada | ACR credentials |

### Variables Faltantes

| Variable | Impacto |
|----------|---------|
| `NODE_ENV` (API) | No configurada explícitamente (Docker lo pone en `production`) |
| `PASSWORD_RESET_URL` | No existe - password reset podría no funcionar |

---

## 3. CORREO ELECTRÓNICO (Microsoft Graph)

### App Registration

- **Nombre:** Facturador-Email-Service
- **Permiso:** `Mail.Send` (Application) con admin consent ✅
- **Buzón:** `facturas@republicode.com`

### Test de Envío Real

| Paso | Resultado |
|------|-----------|
| Obtener token client_credentials | ✅ Token obtenido |
| Verificar buzón (GET /users/facturas@...) | ⚠️ 403 (esperado - no tiene User.Read.All) |
| Enviar email de prueba | ✅ HTTP 202 Accepted |

**El correo funciona correctamente.** Se envió email de prueba a jbidegain@republicode.com.

### Bugs Corregidos Hoy

1. `ClientCredentialsMsGraphAdapter` no podía obtener tokens (override de `getValidAccessToken` no funcionaba por ser `private`). Fix: dummy refresh token.
2. Deploy workflows usaban zip deploy que no funcionaba con Docker containers. Fix: Docker build+push.
3. `FRONTEND_URL` no estaba configurada - links de aprobación de cotizaciones no tenían dominio.
4. `approvedQuantity` de cotizaciones se enviaba como string (Prisma Decimal) en vez de number. Fix: `Number()` conversion.

---

## 4. BASE DE DATOS

### Conteo de Registros

| Tabla | Registros | Notas |
|-------|-----------|-------|
| Tenant | 12 | 1 producción + 11 de prueba |
| User | 14 | 2 SUPER_ADMIN + 12 ADMIN |
| Cliente | 359 | Importados vía CSV |
| CatalogItem | 4 | Productos/servicios |
| DTE | 25 | Facturas emitidas |
| quotes | 18 | Cotizaciones |
| quote_line_items | 19 | |
| Plan | 5 | Planes de suscripción |
| RecurringInvoiceTemplate | 5 | Templates de factura recurrente |
| ImportJob | 3 | Jobs de importación CSV |
| SupportTicket | 3 | Tickets de soporte |
| HaciendaConfig | 2 | Configs de MH |
| AuditLog | 186 | Registros de auditoría |
| DTELog | 25 | Logs de transmisión |
| TenantEmailConfig | 0 | Ningún tenant tiene config propia |
| EmailSendLog | 0 | No se registran envíos |

**Total tablas: 40**

### Tenants

| Nombre | NIT | Tipo |
|--------|-----|------|
| Republicode S.A. de C.V. | 0614-180723-106-0 | ✅ Producción |
| Prueba QA 2 - NIT | 0700-210296-101-1 | 🧪 Prueba (NIT válido) |
| The Hosting Capital (x3) | varios | 🧪 Prueba (3 registros duplicados) |
| Prueba / PQA2 / etc. (x7) | datos basura | 🧪 Prueba (datos corruptos) |

### Usuarios

| Email | Rol | Notas |
|-------|-----|-------|
| facturas@republicode.com | ADMIN | ✅ Usuario principal |
| admin@facturador.sv | SUPER_ADMIN | ✅ Admin del sistema |
| dgarcia@republicode.com | SUPER_ADMIN | ✅ Admin del sistema |
| Otros 11 usuarios | ADMIN | 🧪 Usuarios de prueba |

### Problemas de Datos

1. **Tenants basura**: 10 de 12 tenants son de prueba con datos corruptos (nombres repetidos, NITs inválidos como `7878788787`, `111111...`).
2. **3 tenants "The Hosting Capital"** con NITs diferentes - duplicados de prueba.
3. **Tenant "PEUEBA QA2"** tiene nombre repetido ~75 veces en un campo (posible bug de input).
4. **EmailSendLog vacío** - no se está registrando el historial de envíos de email.

---

## 5. CÓDIGO - TODOs y Pendientes

### TODOs Críticos en el Código

| Archivo | Línea | Descripción | Impacto |
|---------|-------|-------------|---------|
| `mh-auth.service.ts` | 57 | `TODO: Implement database persistence` - Token se guarda solo en memoria | 🔴 Alto - tokens perdidos en restart |
| `dte.service.ts` | 596 | `TODO: Get from tenant config` - Número de establecimiento hardcodeado | 🟡 Medio |
| `tenants.controller.ts` | 208 | `TODO: Validate certificate with password` | 🟡 Medio |
| `tenants.controller.ts` | 288 | `TODO: Actually test connection with MH` - Simula éxito | 🟡 Medio |
| `test-execution.service.ts` | 309 | `TODO: Implement actual Hacienda API call` - Simula 90% éxito | 🟡 Medio |

### Archivos a Limpiar

| Archivo | Acción |
|---------|--------|
| `apps/api/src/modules/dte/dte.service.ts.backup` | Eliminar (27KB backup viejo) |
| `prompt-migracion-republicode.md` | Mover a `tasks/` o eliminar |

### Stubs / Features Incompletas

1. **DTE Email con PDF** - Infraestructura existe pero los DTEs solo envían email al transmitir a Hacienda (no se puede probar sin DTE real)
2. **Algunos tipos de DTE** no implementados (throw en transmitter.controller.ts)
3. **EmailSendLog** - No se está registrando ningún envío de email en la tabla de logs

---

## 6. CI/CD WORKFLOWS

| Workflow | Trigger | Estado |
|----------|---------|--------|
| `deploy-api.yml` | push main (apps/api/**) | ✅ Actualizado a Docker build+push |
| `deploy-web.yml` | push main (apps/web/**) | ✅ Actualizado a Docker build+push |
| `test-api.yml` | push/PR (apps/api/**) | ✅ Operativo (89 tests) |
| `test-e2e.yml` | workflow_dispatch | ✅ Operativo (Playwright) |

---

## 7. TENANT SIGET (Infraestructura Vieja)

No se encontraron recursos del tenant antiguo en `facturador-sv-rg`. Todo parece estar consolidado en la infraestructura de Republicode. Verificar si hay otro resource group con recursos legacy que deba ser eliminado.

---

## RESUMEN EJECUTIVO

### ✅ Funcionando Correctamente

1. Ambas apps corriendo (API + Web) como Docker containers
2. Base de datos Online (Azure SQL Basic)
3. ACR con imágenes actualizadas
4. Microsoft Graph email funcional (client_credentials flow)
5. CI/CD pipelines actualizados (Docker build+push)
6. CORS, JWT, Encryption configurados
7. Cotizaciones con email + link de aprobación
8. 89 tests unitarios + E2E con Playwright

### 🔴 Problemas Encontrados

1. **10 tenants basura** en la BD (datos corruptos de pruebas)
2. **HTTPS no forzado** en ambas apps
3. **Token de MH solo en memoria** - se pierde en cada restart
4. **EmailSendLog vacío** - no hay historial de emails enviados
5. **Algunos TODOs críticos** sin implementar (conexión MH, validación certificado)

### 🟡 Pendientes del Backlog

1. Limpiar tenants/usuarios de prueba de la BD
2. Implementar persistencia de token MH en BD
3. Habilitar `httpsOnly: true` en ambas apps
4. Quitar `http://localhost:3000` de CORS para producción
5. Cambiar `MH_API_ENV` de `test` a `prod` cuando esté listo
6. Registrar envíos en EmailSendLog
7. Eliminar archivo `.backup` del repo
8. Implementar validación de certificado digital
9. Implementar test real de conexión con MH

### Recomendaciones de Siguientes Pasos

1. **Inmediato**: Limpiar datos de prueba de la BD (tenants basura, usuarios test)
2. **Inmediato**: Habilitar HTTPS only en ambas apps
3. **Corto plazo**: Implementar persistencia de token MH
4. **Corto plazo**: Agregar logging de emails enviados (EmailSendLog)
5. **Mediano plazo**: Pasar MH_API_ENV a producción + validar con Hacienda real
6. **Mediano plazo**: Implementar tipos de DTE faltantes
7. **Largo plazo**: Considerar upgrade de DB tier si crece el uso
