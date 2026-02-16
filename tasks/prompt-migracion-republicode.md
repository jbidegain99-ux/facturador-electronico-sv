# Migración Completa: Facturador Electrónico SV → Tenant Republicode Azure

## Contexto General

Estamos migrando toda la infraestructura de Facturador Electrónico SV desde el tenant actual de Azure hacia el tenant de Republicode S.A. de C.V. El sistema es una plataforma SaaS de facturación electrónica para El Salvador que integra con el Ministerio de Hacienda para generar, firmar digitalmente y transmitir DTEs.

**Stack tecnológico:**
- Backend: NestJS + Prisma ORM
- Frontend: Next.js 14 + shadcn/ui + Tailwind CSS
- Base de datos: Azure SQL Database
- Hosting: Azure App Services con Docker containers
- Registry: Azure Container Registry (republicodeacr)
- Resource Group actual: facturador-sv-rg

**Versiones actuales en producción:** API v32, Web v39

---

## FASE 1: Investigación y Plan (PLAN MODE)

### 1.1 Auditoría del Tenant Actual

Antes de tocar NADA, investiga y documenta la infraestructura actual:

```bash
# Autenticarse en el tenant ACTUAL
az login --tenant <TENANT_ACTUAL_ID>
az account set --subscription <SUBSCRIPTION_ACTUAL_ID>
```

Ejecuta estos comandos y documenta los resultados en `tasks/todo.md`:

```bash
# Listar TODOS los recursos del resource group
az resource list --resource-group facturador-sv-rg --output table

# Detalles del SQL Server y Database
az sql server list --resource-group facturador-sv-rg --output json
az sql db list --server <SERVER_NAME> --resource-group facturador-sv-rg --output json

# Detalles del Container Registry
az acr show --name republicodeacr --output json
az acr repository list --name republicodeacr --output json

# Detalles de los App Services
az webapp list --resource-group facturador-sv-rg --output json

# App Settings de cada App Service (CRÍTICO - contiene env vars)
az webapp config appsettings list --name <API_APP_NAME> --resource-group facturador-sv-rg --output json
az webapp config appsettings list --name <WEB_APP_NAME> --resource-group facturador-sv-rg --output json

# Connection strings
az webapp config connection-string list --name <API_APP_NAME> --resource-group facturador-sv-rg --output json

# Docker container settings
az webapp config container show --name <API_APP_NAME> --resource-group facturador-sv-rg --output json
az webapp config container show --name <WEB_APP_NAME> --resource-group facturador-sv-rg --output json

# Networking rules (firewall del SQL, etc.)
az sql server firewall-rule list --server <SERVER_NAME> --resource-group facturador-sv-rg --output json

# Service Plans
az appservice plan list --resource-group facturador-sv-rg --output json
```

**Guarda TODO en un archivo `tasks/audit-actual.json`** para referencia.

### 1.2 Auditoría del Código - Puntos de Envío de Correo

Investiga el código fuente completo para encontrar TODOS los lugares donde se necesita buzón de correo. Busca en el backend (NestJS) y frontend:

```bash
# Buscar todas las referencias a email/correo/smtp/mail en el código
grep -rn "email\|mail\|smtp\|sendgrid\|nodemailer\|transporter\|correo" --include="*.ts" --include="*.tsx" --include="*.env*" --include="*.json" src/ apps/ packages/ libs/

# Buscar módulos o servicios de email
find . -name "*mail*" -o -name "*email*" -o -name "*notification*" | grep -v node_modules

# Buscar en el schema de Prisma campos de email
grep -n "email\|correo\|mail" prisma/schema.prisma

# Buscar variables de entorno relacionadas con correo
grep -rn "MAIL\|SMTP\|EMAIL\|SENDGRID" --include="*.env*" --include="*.ts" .
```

**Documenta en `tasks/email-audit.md`** con esta estructura:
- Lugares donde ya se envía correo (si los hay)
- Lugares donde se NECESITARÁ enviar correo:
  - Envío de facturas DTE al cliente
  - Envío de cotizaciones para aprobación
  - Notificaciones de aprobación/rechazo de cotizaciones
  - Notificaciones de sistema (nuevo usuario, reset password, etc.)
  - Reportes programados
  - Cualquier otro punto que encuentres
- Variables de entorno necesarias para la configuración de correo
- Recomendación de arquitectura para el servicio de correo

---

## FASE 2: Exportación de Base de Datos

### 2.1 Exportar la base de datos actual como .bacpac

```bash
# Exportar la base de datos a un .bacpac en storage
# Opción 1: Usando az sql db export
az sql db export \
  --admin-user <ADMIN_USER> \
  --admin-password <ADMIN_PASSWORD> \
  --auth-type SQL \
  --name <DB_NAME> \
  --server <SERVER_NAME> \
  --resource-group facturador-sv-rg \
  --storage-key-type StorageAccessKey \
  --storage-key <STORAGE_KEY> \
  --storage-uri https://<STORAGE_ACCOUNT>.blob.core.windows.net/<CONTAINER>/facturador-backup.bacpac

# Opción 2: Si no hay storage account, usar SqlPackage localmente
# Descargar SqlPackage si no está instalado
# sqlpackage /Action:Export /SourceServerName:<SERVER>.database.windows.net /SourceDatabaseName:<DB_NAME> /SourceUser:<USER> /SourcePassword:<PASS> /TargetFile:./facturador-backup.bacpac
```

### 2.2 Verificar integridad del backup

```bash
# Verificar que el .bacpac se generó correctamente
ls -la facturador-backup.bacpac
# Debería tener un tamaño razonable (revisar que no sea 0 bytes)
```

---

## FASE 3: Construcción de Infraestructura en Tenant Republicode

### 3.1 Autenticarse en el nuevo tenant

```bash
az login --tenant <REPUBLICODE_TENANT_ID>
az account set --subscription <REPUBLICODE_SUBSCRIPTION_ID>
```

### 3.2 Crear el Resource Group

```bash
az group create --name facturador-sv-rg --location "Central US"
# Usar la misma región que el tenant actual o la más cercana a El Salvador
```

### 3.3 Crear Azure Container Registry

```bash
az acr create \
  --name republicodeacr \
  --resource-group facturador-sv-rg \
  --sku Basic \
  --admin-enabled true

# Obtener credenciales
az acr credential show --name republicodeacr
```

### 3.4 Crear Azure SQL Server y Database

```bash
# Crear el SQL Server
az sql server create \
  --name <SAME_OR_NEW_SERVER_NAME> \
  --resource-group facturador-sv-rg \
  --location "Central US" \
  --admin-user <ADMIN_USER> \
  --admin-password <SECURE_PASSWORD>

# Configurar firewall - permitir servicios de Azure
az sql server firewall-rule create \
  --server <SERVER_NAME> \
  --resource-group facturador-sv-rg \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Agregar tu IP para administración
az sql server firewall-rule create \
  --server <SERVER_NAME> \
  --resource-group facturador-sv-rg \
  --name AdminAccess \
  --start-ip-address <TU_IP> \
  --end-ip-address <TU_IP>

# Crear la base de datos
az sql db create \
  --name <DB_NAME> \
  --server <SERVER_NAME> \
  --resource-group facturador-sv-rg \
  --service-objective S0 \
  --backup-storage-redundancy Local
```

### 3.5 Importar la Base de Datos

```bash
# Importar el .bacpac
az sql db import \
  --admin-user <ADMIN_USER> \
  --admin-password <ADMIN_PASSWORD> \
  --auth-type SQL \
  --name <DB_NAME> \
  --server <SERVER_NAME> \
  --resource-group facturador-sv-rg \
  --storage-key-type StorageAccessKey \
  --storage-key <STORAGE_KEY> \
  --storage-uri https://<STORAGE_ACCOUNT>.blob.core.windows.net/<CONTAINER>/facturador-backup.bacpac
```

### 3.6 Crear App Service Plan

```bash
az appservice plan create \
  --name <PLAN_NAME> \
  --resource-group facturador-sv-rg \
  --sku B1 \
  --is-linux
# Usar el mismo SKU que el actual
```

### 3.7 Crear App Services (API y Web)

```bash
# API App Service
az webapp create \
  --name <API_APP_NAME> \
  --resource-group facturador-sv-rg \
  --plan <PLAN_NAME> \
  --deployment-container-image-name republicodeacr.azurecr.io/facturador-api:latest

# Web App Service
az webapp create \
  --name <WEB_APP_NAME> \
  --resource-group facturador-sv-rg \
  --plan <PLAN_NAME> \
  --deployment-container-image-name republicodeacr.azurecr.io/facturador-web:latest
```

### 3.8 Configurar Container Registry en App Services

```bash
# Conectar ACR a los App Services
az webapp config container set \
  --name <API_APP_NAME> \
  --resource-group facturador-sv-rg \
  --container-image-name republicodeacr.azurecr.io/facturador-api:latest \
  --container-registry-url https://republicodeacr.azurecr.io \
  --container-registry-user <ACR_USER> \
  --container-registry-password <ACR_PASSWORD>

az webapp config container set \
  --name <WEB_APP_NAME> \
  --resource-group facturador-sv-rg \
  --container-image-name republicodeacr.azurecr.io/facturador-web:latest \
  --container-registry-url https://republicodeacr.azurecr.io \
  --container-registry-user <ACR_USER> \
  --container-registry-password <ACR_PASSWORD>
```

### 3.9 Configurar App Settings (Variables de Entorno)

**CRÍTICO:** Copiar TODAS las app settings del tenant actual al nuevo, actualizando:
- Connection string de la base de datos (nuevo servidor SQL)
- URLs de los App Services si cambiaron
- Cualquier referencia al tenant anterior

```bash
# Para API - configurar TODAS las env vars
az webapp config appsettings set \
  --name <API_APP_NAME> \
  --resource-group facturador-sv-rg \
  --settings \
    DATABASE_URL="sqlserver://<NEW_SERVER>.database.windows.net:1433;database=<DB_NAME>;user=<USER>;password=<PASS>;encrypt=true;trustServerCertificate=false" \
    # ... COPIAR TODAS las demás settings del audit
    
# Para Web
az webapp config appsettings set \
  --name <WEB_APP_NAME> \
  --resource-group facturador-sv-rg \
  --settings \
    NEXT_PUBLIC_API_URL="https://<API_APP_NAME>.azurewebsites.net" \
    # ... COPIAR TODAS las demás settings del audit
```

---

## FASE 4: Push de Imágenes Docker al Nuevo ACR

```bash
# Login al ACR nuevo
az acr login --name republicodeacr

# Opción A: Si tienes las imágenes localmente, tag y push
docker tag facturador-api:latest republicodeacr.azurecr.io/facturador-api:latest
docker tag facturador-web:latest republicodeacr.azurecr.io/facturador-web:latest
docker push republicodeacr.azurecr.io/facturador-api:latest
docker push republicodeacr.azurecr.io/facturador-web:latest

# Opción B: Importar directamente desde el ACR viejo
az acr import \
  --name republicodeacr \
  --source <OLD_ACR>.azurecr.io/facturador-api:latest \
  --username <OLD_ACR_USER> \
  --password <OLD_ACR_PASSWORD>

az acr import \
  --name republicodeacr \
  --source <OLD_ACR>.azurecr.io/facturador-web:latest \
  --username <OLD_ACR_USER> \
  --password <OLD_ACR_PASSWORD>
```

---

## FASE 5: Configuración de Correo Electrónico (Microsoft Graph API)

Usaremos Microsoft Graph API con OAuth2 (client_credentials flow) para enviar correos desde un **shared mailbox** `facturas@republicode.com`. Esto es más seguro que SMTP y no requiere contraseña del buzón.

### 5.1 Crear App Registration en Azure AD (Tenant Republicode)

```bash
# Asegurarse de estar en el tenant de Republicode
az login --tenant 340b2ae3-5342-46aa-b5b5-956583cc715f
az account set --subscription 7bb76e3c-f26a-4250-b888-3ab008fb9532

# Crear la App Registration
az ad app create \
  --display-name "Facturador-Email-Service" \
  --sign-in-audience "AzureADMyOrg"

# Guardar el Application (client) ID que devuelve → AZURE_MAIL_CLIENT_ID

# Crear un client secret
az ad app credential reset \
  --id <APP_ID> \
  --display-name "facturador-email-secret" \
  --years 2

# Guardar el password que devuelve → AZURE_MAIL_CLIENT_SECRET
```

### 5.2 Asignar Permisos de Microsoft Graph

La app necesita el permiso `Mail.Send` de tipo **Application** (no delegated) para enviar como el shared mailbox:

```bash
# Obtener el Service Principal de Microsoft Graph
GRAPH_SP_ID=$(az ad sp list --filter "displayName eq 'Microsoft Graph'" --query "[0].id" -o tsv)

# El permission ID para Mail.Send (Application) es: b633e1c5-b582-4048-a93e-9f11b44c7e96
az ad app permission add \
  --id <APP_ID> \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions b633e1c5-b582-4048-a93e-9f11b44c7e96=Role

# IMPORTANTE: Otorgar admin consent (requiere Global Admin)
az ad app permission admin-consent --id <APP_ID>
```

**Si el admin consent falla por permisos, pedirle al usuario que:**
1. Vaya a Azure Portal → Microsoft Entra ID → App registrations → Facturador-Email-Service
2. API permissions → Grant admin consent for Republicode

### 5.3 Verificar/Crear el Shared Mailbox

**NOTA: Esto puede requerir intervención manual del usuario si Claude Code no tiene acceso a Exchange Online PowerShell.**

Verificar que `facturas@republicode.com` existe como shared mailbox. Si no:

```powershell
# En Exchange Online PowerShell (el usuario puede necesitar hacer esto manualmente)
Connect-ExchangeOnline
New-Mailbox -Shared -Name "Facturas Republicode" -DisplayName "Facturas Republicode" -Alias facturas
# O si ya existe como buzón regular, convertir a shared:
# Set-Mailbox -Identity facturas@republicode.com -Type Shared
```

**Pedirle al usuario que confirme que el shared mailbox existe y está activo.**

### 5.4 (Opcional pero recomendado) Restringir el envío solo al shared mailbox

Para seguridad, crear una Application Access Policy que limite la app a enviar SOLO desde facturas@republicode.com:

```powershell
# El usuario necesita ejecutar esto en Exchange Online PowerShell
# Crear un mail-enabled security group con el shared mailbox
New-DistributionGroup -Name "Facturador-Mail-Senders" -Type Security -Members facturas@republicode.com

# Crear la policy de acceso
New-ApplicationAccessPolicy \
  -AppId <APP_ID> \
  -PolicyScopeGroupId Facturador-Mail-Senders \
  -AccessRight RestrictAccess \
  -Description "Restrict Facturador to send only from facturas@republicode.com"
```

**Si esto no se puede hacer automáticamente, pedirle al usuario los pasos manuales.**

### 5.5 Configurar Variables de Entorno en el App Service

```bash
az webapp config appsettings set \
  --name <API_APP_NAME> \
  --resource-group facturador-sv-rg \
  --settings \
    AZURE_MAIL_TENANT_ID="340b2ae3-5342-46aa-b5b5-956583cc715f" \
    AZURE_MAIL_CLIENT_ID="<APP_ID_DEL_PASO_5.1>" \
    AZURE_MAIL_CLIENT_SECRET="<SECRET_DEL_PASO_5.1>" \
    AZURE_MAIL_FROM="facturas@republicode.com" \
    AZURE_MAIL_FROM_NAME="Facturador Electrónico SV"
```

### 5.6 Implementar Servicio de Email con Microsoft Graph en NestJS

Crear/actualizar el servicio de email en el backend para usar Microsoft Graph:

```typescript
// Ejemplo de la lógica que debe implementar:
// 1. Obtener token OAuth2 usando client_credentials flow:
//    POST https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token
//    grant_type=client_credentials&client_id=...&client_secret=...&scope=https://graph.microsoft.com/.default

// 2. Enviar correo via Graph API:
//    POST https://graph.microsoft.com/v1.0/users/facturas@republicode.com/sendMail
//    Headers: Authorization: Bearer {token}
//    Body: { message: { subject, body, toRecipients, attachments } }

// Paquete recomendado: @azure/identity + @microsoft/microsoft-graph-client
// O directamente con fetch/axios al endpoint de Graph
```

**Dependencias a instalar:**
```bash
npm install @azure/identity @microsoft/microsoft-graph-client
```

### 5.7 Lógica de Correo Default por Tenant

Implementar en el backend la lógica donde:
- Si un tenant tiene configurado su propio correo para envío (con sus propias credenciales Graph) → usar ese
- Si un tenant NO tiene correo configurado → usar `facturas@republicode.com` como default (shared mailbox de Republicode)

Esto requiere:
1. Un campo en la tabla de tenants/empresas para almacenar credenciales de correo propias (client_id, client_secret, tenant_id, mailbox)
2. Un servicio de email que resuelva qué credenciales usar basado en el tenant
3. El fallback a las variables de entorno de Republicode

### 5.8 Lugares donde se Necesita Envío de Correo

Basado en la auditoría de la Fase 1.2, configurar el correo en todos los módulos identificados. Como mínimo:

1. **Envío de DTE (facturas, créditos fiscales, notas de crédito/débito)** → PDF del DTE como adjunto
2. **Envío de cotizaciones para aprobación del cliente** → PDF de cotización + link de aprobación
3. **Notificaciones de aprobación/rechazo de cotizaciones** → notificación al emisor
4. **Reset de contraseña / verificación de email** → link de reset/verificación
5. **Notificaciones de sistema** → alertas, recordatorios, etc.

Todos envían desde `facturas@republicode.com` por default (o el correo configurado del tenant).

---

## FASE 6: Verificación y Testing

### 6.1 Verificar Base de Datos

```bash
# Conectar al nuevo SQL y verificar datos
# Usar Azure Portal Query Editor o sqlcmd
sqlcmd -S <NEW_SERVER>.database.windows.net -d <DB_NAME> -U <USER> -P <PASS> -Q "SELECT COUNT(*) FROM [dbo].[Client]"
# Debe mostrar 350+ registros (los clientes migrados)

# Verificar tablas críticas
sqlcmd -S <NEW_SERVER>.database.windows.net -d <DB_NAME> -U <USER> -P <PASS> -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_NAME"
```

### 6.2 Verificar App Services

```bash
# Verificar que los containers están corriendo
az webapp log tail --name <API_APP_NAME> --resource-group facturador-sv-rg

# Health check del API
curl https://<API_APP_NAME>.azurewebsites.net/health

# Verificar que el frontend carga
curl -I https://<WEB_APP_NAME>.azurewebsites.net
```

### 6.3 Verificar Imágenes en ACR

```bash
az acr repository list --name republicodeacr
az acr repository show-tags --name republicodeacr --repository facturador-api
az acr repository show-tags --name republicodeacr --repository facturador-web
```

### 6.4 Test funcional básico

- [ ] Frontend carga correctamente
- [ ] Login funciona
- [ ] Se pueden listar clientes (verifica conexión DB)
- [ ] Se puede crear un DTE de prueba
- [ ] La conexión con Hacienda funciona (si hay endpoint de test)
- [ ] Las cotizaciones se pueden crear y enviar para aprobación

---

## FASE 7: Switch DNS y Limpieza

### 7.1 Actualizar DNS (si aplica)

Como actualmente usan los dominios default `.azurewebsites.net`, los nombres de los App Services son el "dominio". Si se mantienen los mismos nombres, no hay cambio de DNS necesario (los nombres de App Service son globalmente únicos, así que si el viejo existe hay que eliminarlo primero o usar nombres temporales).

**Estrategia recomendada:**
1. Crear los App Services en el nuevo tenant con nombres TEMPORALES
2. Verificar que todo funciona
3. Eliminar los App Services del tenant viejo (libera los nombres)
4. Renombrar o recrear en el nuevo tenant con los nombres originales
5. O simplemente usar los nuevos nombres y actualizar todas las referencias

### 7.2 Limpieza del Tenant Anterior

Una vez confirmado que todo funciona en el nuevo tenant:

```bash
# Cambiar al tenant viejo
az login --tenant <TENANT_ACTUAL_ID>
az account set --subscription <SUBSCRIPTION_ACTUAL_ID>

# Eliminar recursos (SOLO después de confirmar que todo funciona)
# az group delete --name facturador-sv-rg --yes --no-wait
```

---

## Task Management

Escribe el plan detallado en `tasks/todo.md` con checkboxes:

```markdown
# Migración Facturador → Tenant Republicode

## Fase 1: Auditoría
- [ ] Auditar recursos del tenant actual
- [ ] Guardar audit en tasks/audit-actual.json
- [ ] Auditar código para puntos de envío de correo
- [ ] Documentar en tasks/email-audit.md

## Fase 2: Exportación DB
- [ ] Exportar .bacpac de la base actual
- [ ] Verificar integridad del backup

## Fase 3: Infraestructura Nueva
- [ ] Crear resource group
- [ ] Crear ACR
- [ ] Crear SQL Server
- [ ] Configurar firewall SQL
- [ ] Crear base de datos
- [ ] Importar .bacpac
- [ ] Crear App Service Plan
- [ ] Crear API App Service
- [ ] Crear Web App Service
- [ ] Configurar container registry en App Services
- [ ] Configurar TODAS las app settings

## Fase 4: Docker Images
- [ ] Push/importar imágenes al nuevo ACR
- [ ] Verificar imágenes en ACR

## Fase 5: Correo
- [ ] Configurar SMTP con facturas@republicode.com
- [ ] Verificar envío de correo de prueba
- [ ] Implementar lógica de correo default por tenant

## Fase 6: Verificación
- [ ] Verificar datos en DB nueva
- [ ] Verificar API health
- [ ] Verificar frontend
- [ ] Test funcional completo

## Fase 7: Switch y Limpieza
- [ ] Estrategia de nombres de App Services
- [ ] Eliminar recursos del tenant viejo (cuando confirmado)
```

---

## Credenciales y IDs (COMPLETAR ANTES DE EJECUTAR)

```
# Tenant Actual (SIGET)
TENANT_ACTUAL_ID=15984c6f-3b2c-46f2-b6e4-534470f605f7
SUBSCRIPTION_ACTUAL_ID=faba21c7-960a-4f6f-927b-45114044ec79

# Tenant Republicode (nuevo)
REPUBLICODE_TENANT_ID=340b2ae3-5342-46aa-b5b5-956583cc715f
REPUBLICODE_SUBSCRIPTION_ID=7bb76e3c-f26a-4250-b888-3ab008fb9532

# SQL Admin
SQL_ADMIN_USER=sqladmin
SQL_ADMIN_PASSWORD=FacturadorRC2026@!

# Microsoft Graph Email (se generan automáticamente en Fase 5.1)
# AZURE_MAIL_CLIENT_ID → se obtiene al crear la App Registration
# AZURE_MAIL_CLIENT_SECRET → se obtiene al crear el client secret
# AZURE_MAIL_TENANT_ID=340b2ae3-5342-46aa-b5b5-956583cc715f (Republicode)
```

---

## Notas Importantes

1. **No hacer nada sin auditar primero.** La Fase 1 es obligatoria antes de cualquier acción.
2. **El downtime aceptable es de 1-2 horas**, así que hay margen para hacer las cosas bien.
3. **Los nombres de recursos deben ser los mismos** (facturador-sv-rg, republicodeacr, etc.). Ojo con los nombres de App Services que son globalmente únicos.
4. **Microsoft Graph API**: La app registration se crea automáticamente. Si el admin consent falla, el usuario debe otorgarlo manualmente desde el portal de Azure. El shared mailbox `facturas@republicode.com` debe existir previamente en M365.
5. **La base tiene 350+ clientes migrados** - verificar el conteo después de la importación.
6. **Prisma ORM**: Después de migrar, verificar que el schema de Prisma coincide con la DB importada. Si hay discrepancias, ejecutar `npx prisma db push` o `npx prisma migrate deploy` según corresponda.
