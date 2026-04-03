# Testing Post-Deployment - Automatizacion Contabilidad

## Prerequisitos

Obtener JWT token y Tenant ID:

```bash
# Login en la app web y obtener de localStorage, o usar endpoint de login
TOKEN="tu-jwt-token-aqui"
TENANT_ID="tu-tenant-id-aqui"
API_URL="https://facturador-api-sv.azurewebsites.net"
```

---

## Test 1: Health Check

```bash
curl -s "$API_URL/health"
```

**Esperado:** HTTP 200, respuesta JSON con status OK

**Status:** [ ] PASS / [ ] FAIL

---

## Test 2: Endpoint de Configuracion

```bash
curl -X GET "$API_URL/accounting/config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

**Esperado:**
```json
{
  "autoJournalEnabled": false,
  "autoJournalTrigger": "ON_APPROVED",
  "accountMappings": []
}
```

**Status:** [ ] PASS / [ ] FAIL

---

## Test 3: Seed de Mapeos Predeterminados

```bash
curl -X POST "$API_URL/accounting/mappings/seed" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

**Esperado:**
```json
{
  "message": "6 mapeos predeterminados creados"
}
```

**Status:** [ ] PASS / [ ] FAIL

---

## Test 4: Listar Mapeos Creados

```bash
curl -X GET "$API_URL/accounting/mappings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

**Esperado:** Array con 6 objetos (VENTA_CONTADO, VENTA_CREDITO, CREDITO_FISCAL_CONTADO, CREDITO_FISCAL_CREDITO, NOTA_CREDITO, NOTA_DEBITO)

**Status:** [ ] PASS / [ ] FAIL

---

## Test 5: Verificar en Base de Datos

En Azure Portal > SQL Query Editor:

```sql
SELECT
    id,
    transactionType,
    LEFT(mappingConfig, 50) as preview
FROM account_mapping_rules
WHERE tenantId = 'TU-TENANT-ID';

-- Esperado: 6 filas
```

**Status:** [ ] PASS / [ ] FAIL

---

## Test 6: Activar Automatizacion (Beta)

```bash
curl -X PATCH "$API_URL/accounting/config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "autoJournalEnabled": true,
    "autoJournalTrigger": "ON_APPROVED"
  }'
```

**Esperado:**
```json
{
  "id": "...",
  "autoJournalEnabled": true,
  "autoJournalTrigger": "ON_APPROVED"
}
```

**Status:** [ ] PASS / [ ] FAIL

---

## Test 7: End-to-End (Crear Factura > Verificar Partida)

**Paso 1:** Crear factura de $100 (contado) desde UI

**Paso 2:** Aprobar con Hacienda

**Paso 3:** Verificar partida generada en Azure SQL:

```sql
SELECT
    je.id,
    je.entryType,
    a.code,
    a.name,
    el.debit,
    el.credit
FROM journal_entries je
JOIN journal_entry_lines el ON je.id = el.journalEntryId
JOIN accounting_accounts a ON el.accountId = a.id
WHERE je.dteId = 'TU-DTE-ID'
ORDER BY a.code;

-- Esperado: 3 lineas
-- 110101 | Debe: 100.00 | Haber: 0.00
-- 4101   | Debe: 0.00   | Haber: 88.50
-- 210201 | Debe: 0.00   | Haber: 11.50
```

**Status:** [ ] PASS / [ ] FAIL

---

## Resumen

| Test | Descripcion | Status |
|------|-------------|--------|
| 1 | Health Check | [ ] |
| 2 | Config Endpoint | [ ] |
| 3 | Seed Mapeos | [ ] |
| 4 | List Mapeos | [ ] |
| 5 | DB Verification | [ ] |
| 6 | Activar Auto | [ ] |
| 7 | E2E Factura | [ ] |

**Deployment Status:** [ ] EXITOSO / [ ] CON ERRORES

---

## Rollback

Si algo falla:

```bash
# Desactivar automatizacion globalmente (Azure SQL):
UPDATE Tenant SET autoJournalEnabled = 0;

# Revertir a version anterior:
az webapp config container set \
  --name facturador-api-sv \
  --resource-group facturador-sv-rg \
  --docker-custom-image-name republicodeacr.azurecr.io/facturador-api:v52

az webapp restart --name facturador-api-sv --resource-group facturador-sv-rg
```
