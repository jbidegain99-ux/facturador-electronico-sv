# Migración Facturador → Tenant Republicode

**Fecha inicio:** 2026-02-15
**Estado:** En progreso

---

## Fase 1: Auditoría ✅
- [x] Auditar recursos del tenant actual (SIGET)
- [x] Guardar audit en `tasks/audit-actual.json`
- [x] Auditar código para puntos de envío de correo
- [x] Documentar en `tasks/email-audit.md`

### Hallazgos Clave:
- ACR real: `facturadorsvacr` (no `republicodeacr`)
- App Service Plan compartido en RG `ExternalBot` (asp-rag-bot, B1)
- API desplegada en v36 (última disponible: v47)
- Web desplegada en v40 (es la última)
- DB: `facturadordb` en `facturador-sql-sv`, tier Basic (5 DTU, 2GB)
- Infraestructura de email multi-proveedor ya 100% completa
- Falta: envío real de DTEs, quotes, password reset, notificaciones

## Fase 2: Exportación DB
- [ ] Exportar .bacpac de la base actual
- [ ] Verificar integridad del backup

## Fase 3: Infraestructura Nueva (Tenant Republicode)
- [ ] Login en tenant Republicode (340b2ae3-5342-46aa-b5b5-956583cc715f)
- [ ] Crear resource group `facturador-sv-rg`
- [ ] Crear ACR (nuevo nombre necesario si `facturadorsvacr` existe)
- [ ] Crear SQL Server
- [ ] Configurar firewall SQL (AllowAzureServices + admin IP)
- [ ] Crear base de datos (tier Basic)
- [ ] Importar .bacpac
- [ ] Crear App Service Plan (B1 Linux)
- [ ] Crear API App Service
- [ ] Crear Web App Service
- [ ] Configurar container registry en App Services
- [ ] Configurar TODAS las app settings (copiar de audit)
- [ ] Generar nuevo JWT_SECRET seguro
- [ ] Actualizar CORS_ORIGIN con nuevo hostname web
- [ ] Actualizar NEXT_PUBLIC_API_URL con nuevo hostname api

## Fase 4: Docker Images
- [ ] Importar imágenes desde `facturadorsvacr` al nuevo ACR
- [ ] Verificar imágenes en nuevo ACR

## Fase 5: Correo (Microsoft Graph)
- [x] Crear App Registration en Azure AD (Republicode) → `Facturador-Email-Service`
- [x] Asignar permiso Mail.Send (Application)
- [x] Admin consent para permisos
- [ ] Verificar shared mailbox `facturas@republicode.com` (requiere Exchange Online)
- [x] Configurar env vars de email en API App Service
- [x] Implementar DefaultEmailService (client_credentials flow + fallback)
- [x] Conectar QuoteEmailService con DefaultEmailService (ya no es stub)
- [ ] Implementar endpoint /auth/forgot-password
- [ ] Verificar envío de correo de prueba

### Credenciales Email (App Registration):
- App ID: `b2b0e1b4-d8d6-469a-a0aa-8236663ce174`
- Tenant: `340b2ae3-5342-46aa-b5b5-956583cc715f`

## Fase 6: Verificación
- [ ] Verificar datos en DB nueva (350+ clientes)
- [ ] Verificar API health
- [ ] Verificar frontend carga
- [ ] Login funciona
- [ ] Listar clientes (verifica DB)
- [ ] Crear DTE de prueba
- [ ] Conexión con Hacienda funciona
- [ ] Cotizaciones funcionan

## Fase 7: Switch y Limpieza
- [ ] Definir estrategia de nombres de App Services
- [ ] Actualizar todas las referencias de URLs
- [ ] Eliminar recursos del tenant viejo (cuando confirmado)
