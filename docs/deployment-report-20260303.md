# Deployment Report - Automatizacion Contabilidad

**Fecha:** 2026-03-03
**Modulo:** Automatizacion DTE -> Partida Contable

---

## Pre-Deployment Completado

### Validaciones
- [x] Node.js v20.19.5
- [x] Docker v28.4.0
- [x] Prisma Client generado (v5.22.0)
- [x] Tests de contabilidad: 12/12 passing
- [x] Tests totales: 175/175 passing (11 suites)
- [x] Build API: OK (NestJS)
- [x] Build Web: OK (Next.js, 48 paginas)
- [x] Schema Azure SQL verificado (3 columnas + 4 tablas)

---

## Docker Builds Completados

| Imagen | Tag | Tamano |
|--------|-----|--------|
| `republicodeacr.azurecr.io/facturador-api` | v33 | 501 MB |
| `republicodeacr.azurecr.io/facturador-web` | v40 | 186 MB |

**Nota:** En `republicodeacr` las versiones anteriores van hasta v53 (API) y v48 (Web).
Si prefieres usar tags incrementales, edita `scripts/deploy-to-azure.sh` cambiando a v54/v49.

---

## Archivos Generados

| Archivo | Proposito |
|---------|-----------|
| `scripts/deploy-to-azure.sh` | Script de deployment completo (push + deploy + verify) |
| `scripts/post-deployment-tests.md` | Guia de 7 tests post-deployment |
| `scripts/deploy-accounting-automation.sh` | Script alternativo (usa git SHA como tag) |
| `scripts/verify-azure-sql-schema.sql` | Verificacion de schema (ya ejecutado) |
| `docs/deployment-checklist.md` | Checklist completo de deployment |

---

## Proximos Pasos para el Usuario

### PASO 1: Autenticarse en Azure

```bash
az login
```

### PASO 2: Ejecutar Script de Deployment

```bash
cd ~/facturador-electronico-sv
./scripts/deploy-to-azure.sh
```

**Duracion estimada:** 3-5 minutos

### PASO 3: Verificar Logs

```bash
az webapp log tail --name facturador-api-sv --resource-group facturador-sv-rg | grep -i "accounting\|error"
```

Buscar:
- "Nest application successfully started"
- "AccountingAutomationService" inicializado
- Sin errores de schema

### PASO 4: Testing Post-Deployment

Seguir guia: `scripts/post-deployment-tests.md`

1. Obtener JWT token desde la app
2. Ejecutar 7 tests documentados
3. Seed de mapeos predeterminados
4. Activar automatizacion para tenant beta

### PASO 5: Activacion Beta

Si todos los tests pasan:
- Activar automatizacion para tenant Republicode
- Crear factura de prueba ($100, contado)
- Verificar partida generada automaticamente (3 lineas, Debe = Haber)
- Monitorear logs por 24h

---

## Rollback Plan

Si algo falla:

```bash
# 1. Desactivar automatizacion globalmente (Azure SQL Query Editor):
UPDATE Tenant SET autoJournalEnabled = 0;

# 2. Revertir API a version anterior:
az webapp config container set \
  --name facturador-api-sv \
  --resource-group facturador-sv-rg \
  --docker-custom-image-name republicodeacr.azurecr.io/facturador-api:v52

az webapp restart --name facturador-api-sv --resource-group facturador-sv-rg

# 3. Revertir Web a version anterior (si necesario):
az webapp config container set \
  --name facturador-web-sv \
  --resource-group facturador-sv-rg \
  --docker-custom-image-name republicodeacr.azurecr.io/facturador-web:v48

az webapp restart --name facturador-web-sv --resource-group facturador-sv-rg
```

---

## Status

| Fase | Estado |
|------|--------|
| Pre-Deployment | COMPLETADO |
| Schema Azure SQL | VERIFICADO |
| Docker Builds | COMPLETADO |
| Push to ACR | PENDIENTE (requiere az login) |
| Deploy App Services | PENDIENTE (requiere az login) |
| Post-Deploy Testing | PENDIENTE |

**Siguiente accion:** Usuario ejecuta `./scripts/deploy-to-azure.sh`
