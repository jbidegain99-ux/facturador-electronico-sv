# Deployment Checklist: Automatizacion DTE -> Partida Contable

## Resumen de Cambios

| Componente | Cambio |
|-----------|--------|
| Prisma Schema | +2 columnas en Tenant, +1 columna en AccountMappingRule |
| API | Nuevo servicio `AccountingAutomationService`, 6 endpoints nuevos, hooks en DTE |
| Web | Nueva pagina `/contabilidad/configuracion`, columna "Origen" en libro diario |
| Tests | +12 tests nuevos (175 total) |

---

## Fase 1: Pre-Deployment - Schema Verification

### 1.1 Verificar schema actual en Azure SQL

```bash
# Opcion A: Azure Portal -> SQL Database -> Query Editor
# Ejecutar: scripts/verify-azure-sql-schema.sql

# Opcion B: sqlcmd
sqlcmd -S facturador-rc-sql.database.windows.net -d facturadordb -U <admin> -P <password> \
  -i scripts/verify-azure-sql-schema.sql
```

**Columnas requeridas:**

| Tabla | Columna | Tipo | Default |
|-------|---------|------|---------|
| Tenant | autoJournalEnabled | BIT NOT NULL | 0 |
| Tenant | autoJournalTrigger | NVARCHAR(20) NOT NULL | 'ON_APPROVED' |
| account_mapping_rules | mappingConfig | NVARCHAR(MAX) NULL | NULL |

- [ ] Las 3 columnas existen o fueron creadas por el script
- [ ] No hay errores en la ejecucion

### 1.2 Verificar datos existentes

```sql
-- No debe haber datos corruptos en las nuevas columnas
SELECT id, autoJournalEnabled, autoJournalTrigger FROM Tenant;

-- Todos los tenants deben tener autoJournalEnabled=0 (desactivado)
SELECT COUNT(*) AS total_tenants,
       SUM(CASE WHEN autoJournalEnabled = 1 THEN 1 ELSE 0 END) AS auto_enabled
FROM Tenant;
```

- [ ] Todos los tenants tienen `autoJournalEnabled = 0`
- [ ] Todos los tenants tienen `autoJournalTrigger = 'ON_APPROVED'`

---

## Fase 2: Pre-Deployment - Local Verification

### 2.1 Build completo

```bash
npx prisma generate --schema=apps/api/prisma/schema.prisma
npx turbo build --filter=@facturador/api
npx turbo build --filter=@facturador/web
```

- [ ] Prisma generate: sin errores
- [ ] API build: sin errores
- [ ] Web build: sin errores

### 2.2 Tests

```bash
npx jest --config apps/api/jest.config.ts
```

- [ ] 175 tests passing (11 suites)
- [ ] 0 failures

### 2.3 Nuevos endpoints responden localmente

```bash
# Iniciar API localmente
npm run start:dev --prefix apps/api

# Verificar endpoints (usar token valido)
TOKEN="<jwt-token>"
API="http://localhost:3001"

curl -s "$API/accounting/config" -H "Authorization: Bearer $TOKEN" | jq .
curl -s "$API/accounting/mappings" -H "Authorization: Bearer $TOKEN" | jq .
```

- [ ] GET /accounting/config retorna `{ autoJournalEnabled: false, autoJournalTrigger: "ON_APPROVED" }`
- [ ] GET /accounting/mappings retorna `[]`

---

## Fase 3: Deployment

### Opcion A: Script Automatizado (Recomendado)

```bash
./scripts/deploy-accounting-automation.sh
```

El script ejecuta:
1. Verificaciones pre-deployment (Prisma, tests, builds)
2. PAUSA para verificar schema en Azure SQL
3. Build de imagenes Docker
4. Push a Azure Container Registry
5. Deploy a Azure App Services
6. Verificacion post-deployment

### Opcion B: GitHub Actions (CI/CD)

```bash
git push origin main
# Los workflows deploy-api.yml y deploy-web.yml se ejecutan automaticamente
```

### Opcion C: Manual

```bash
# 1. Build y push API
docker build -t republicodeacr.azurecr.io/facturador-api:$(git rev-parse --short HEAD) -f apps/api/Dockerfile .
az acr login --name republicodeacr
docker push republicodeacr.azurecr.io/facturador-api:$(git rev-parse --short HEAD)
az webapp config container set --name facturador-api-sv --resource-group facturador-sv-rg \
  --docker-custom-image-name republicodeacr.azurecr.io/facturador-api:$(git rev-parse --short HEAD)
az webapp restart --name facturador-api-sv --resource-group facturador-sv-rg

# 2. Build y push Web
docker build -t republicodeacr.azurecr.io/facturador-web:$(git rev-parse --short HEAD) -f apps/web/Dockerfile .
docker push republicodeacr.azurecr.io/facturador-web:$(git rev-parse --short HEAD)
az webapp config container set --name facturador-web-sv --resource-group facturador-sv-rg \
  --docker-custom-image-name republicodeacr.azurecr.io/facturador-web:$(git rev-parse --short HEAD)
az webapp restart --name facturador-web-sv --resource-group facturador-sv-rg
```

- [ ] Deployment completado sin errores
- [ ] Ambos servicios en estado "Running"

---

## Fase 4: Post-Deployment Verification

### 4.1 Health checks

```bash
# API
curl -s https://facturador-api-sv.azurewebsites.net/health | jq .

# Web
curl -s -o /dev/null -w "%{http_code}" https://facturador-web-sv.azurewebsites.net/
```

- [ ] API responde 200
- [ ] Web responde 200

### 4.2 Verificar nuevos endpoints en produccion

```bash
TOKEN="<jwt-token>"
API="https://facturador-api-sv.azurewebsites.net"

# Config
curl -s "$API/accounting/config" -H "Authorization: Bearer $TOKEN" | jq .

# Mappings
curl -s "$API/accounting/mappings" -H "Authorization: Bearer $TOKEN" | jq .
```

- [ ] GET /accounting/config retorna datos correctos
- [ ] GET /accounting/mappings retorna array (vacio o con datos)

### 4.3 Seed de mapeos para tenant de prueba

```bash
# Seed mapeos predeterminados
curl -s -X POST "$API/accounting/mappings/seed" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

- [ ] Retorna `{ created: 6, skipped: 0, total: 6 }` (o skipped si ya existen)

### 4.4 Activar automatizacion para tenant beta

```bash
# Activar
curl -s -X PATCH "$API/accounting/config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"autoJournalEnabled": true, "autoJournalTrigger": "ON_APPROVED"}' | jq .
```

- [ ] Retorna `{ autoJournalEnabled: true, autoJournalTrigger: "ON_APPROVED" }`

### 4.5 Test E2E: Crear DTE y verificar partida automatica

1. Crear un DTE de prueba (factura consumidor final, modo demo)
2. Transmitir el DTE (se aprobara automaticamente en demo)
3. Verificar en Libro Diario que aparece partida con badge "Auto (DTE)"

```bash
# Verificar partidas automaticas
curl -s "$API/accounting/journal-entries?entryType=AUTOMATIC" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
```

- [ ] Partida creada automaticamente con status POSTED
- [ ] sourceType = "DTE", sourceDocumentId = ID del DTE
- [ ] Montos correctos (debe = haber)

### 4.6 Test E2E: Anular DTE y verificar reversa

1. Anular el DTE creado en 4.5
2. Verificar que la partida cambio a status VOIDED

```bash
# Verificar partidas anuladas
curl -s "$API/accounting/journal-entries?status=VOIDED" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0].voidReason'
```

- [ ] Partida marcada como VOIDED
- [ ] voidReason = "Anulacion de DTE"

### 4.7 Frontend verification

1. Navegar a `/contabilidad/configuracion`
2. Verificar toggle de automatizacion
3. Verificar tabla de mapeos con 6 operaciones
4. Navegar a `/contabilidad/libro-diario`
5. Verificar columna "Origen" con badges
6. Verificar filtro por tipo de entrada

- [ ] Pagina de configuracion carga correctamente
- [ ] Toggle funciona (activa/desactiva)
- [ ] Selector de trigger funciona
- [ ] Tabla de mapeos muestra las 6 operaciones
- [ ] Libro diario muestra columna "Origen"
- [ ] Filtro por tipo funciona

---

## Fase 5: Rollback Plan

### Si algo falla despues del deploy:

```bash
# 1. Desactivar automatizacion para TODOS los tenants
UPDATE Tenant SET autoJournalEnabled = 0;

# 2. Revertir a imagen anterior
az webapp config container set --name facturador-api-sv --resource-group facturador-sv-rg \
  --docker-custom-image-name republicodeacr.azurecr.io/facturador-api:<previous-sha>
az webapp restart --name facturador-api-sv --resource-group facturador-sv-rg
```

### Si el schema causa problemas:

Las nuevas columnas son backward-compatible:
- `autoJournalEnabled` default `0` (desactivado) - no afecta funcionalidad existente
- `autoJournalTrigger` default `'ON_APPROVED'` - solo se usa si enabled=true
- `mappingConfig` nullable - mapeos existentes siguen usando debitAccountId/creditAccountId

No es necesario eliminar columnas para rollback.

---

## Logs de Referencia

```bash
# Ver logs en tiempo real
az webapp log tail --name facturador-api-sv --resource-group facturador-sv-rg

# Buscar errores de automatizacion
az webapp log tail --name facturador-api-sv --resource-group facturador-sv-rg | grep "Accounting"
```

---

## Aprobacion

| Paso | Responsable | Fecha | OK |
|------|-------------|-------|----|
| Schema verificado | | | [ ] |
| Tests pasando | | | [ ] |
| Deploy completado | | | [ ] |
| Post-deploy verificado | | | [ ] |
| Tenant beta activado | | | [ ] |
