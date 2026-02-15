# Migración Facturador → Tenant Republicode

**Fecha inicio:** 2026-02-15
**Estado:** En progreso

---

## Fase 1: Auditoría ✅
- [x] Auditar recursos del tenant actual (SIGET)
- [x] Guardar audit en `tasks/audit-actual.json`
- [x] Auditar código para puntos de envío de correo
- [x] Documentar en `tasks/email-audit.md`

## Fase 2: Exportación DB ✅
- [x] Exportar .bacpac de la base actual
- [x] Verificar integridad del backup

## Fase 3: Infraestructura Nueva (Tenant Republicode) ✅
- [x] Login en tenant Republicode (340b2ae3-5342-46aa-b5b5-956583cc715f)
- [x] Crear resource group `facturador-sv-rg` (eastus2)
- [x] Crear ACR `republicodeacr` (eastus2)
- [x] Crear SQL Server `facturador-rc-sql` (eastus2)
- [x] Configurar firewall SQL (AllowAzureServices + admin IP + App Service outbound IPs)
- [x] Crear base de datos `facturadordb` (tier Basic)
- [x] Importar .bacpac
- [x] Crear App Service Plan `facturador-plan` (B1 Linux, Central US)
- [x] Crear API App Service `facturador-api-sv`
- [x] Crear Web App Service `facturador-web-sv`
- [x] Configurar container registry en App Services
- [x] Configurar TODAS las app settings
- [x] Generar nuevo JWT_SECRET seguro
- [x] Actualizar CORS_ORIGIN con nuevo hostname web
- [x] Actualizar NEXT_PUBLIC_API_URL con nuevo hostname api

## Fase 4: Docker Images ✅
- [x] Importar imágenes desde `facturadorsvacr` al nuevo ACR
- [x] Verificar imágenes en nuevo ACR
- [x] Build y deploy API v50 con cambios de email + forgot-password
- [x] Build y deploy Web v42

## Fase 5: Correo (Microsoft Graph) - Parcial
- [x] Crear App Registration en Azure AD (Republicode) → `Facturador-Email-Service`
- [x] Asignar permiso Mail.Send (Application)
- [x] Admin consent para permisos
- [x] Configurar env vars de email en API App Service
- [x] Implementar DefaultEmailService (client_credentials flow + fallback)
- [x] Conectar QuoteEmailService con DefaultEmailService (ya no es stub)
- [x] Implementar endpoints /auth/forgot-password y /auth/reset-password
- [ ] **Verificar/crear shared mailbox `facturas@republicode.com`** (requiere Exchange Online / M365 admin)
- [ ] **Verificar envío de correo de prueba** (depende del mailbox)

### Credenciales Email (App Registration):
- App ID: `b2b0e1b4-d8d6-469a-a0aa-8236663ce174`
- Tenant: `340b2ae3-5342-46aa-b5b5-956583cc715f`

## Fase 6: Verificación - Parcial
- [x] Verificar API health (401 en login = OK)
- [x] Verificar frontend carga (200)
- [ ] **Verificar datos en DB nueva (350+ clientes)**
- [ ] **Login funciona (con usuario real)**
- [ ] **Listar clientes (verifica DB)**
- [ ] **Crear DTE de prueba**
- [ ] **Conexión con Hacienda funciona**
- [ ] **Cotizaciones funcionan**

## Fase 7: Switch y Limpieza
- [ ] Definir estrategia de nombres de App Services / dominio custom
- [ ] Actualizar todas las referencias de URLs
- [ ] Eliminar recursos del tenant viejo (cuando confirmado)
