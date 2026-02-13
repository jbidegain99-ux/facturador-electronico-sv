# Cotizaciones Advanced - Deployment Commands

## Pre-requisites
- Azure SQL Database access (Azure Portal Query Editor)
- Docker installed locally
- Azure Container Registry access (facturadoracr.azurecr.io)
- Azure Web App access

---

## Step 1: Execute Database Migration

1. Open **Azure Portal** > SQL Database > **Query Editor**
2. Copy and paste the contents of `scripts/quotes-final-migration.sql`
3. Click **Run**
4. Verify output shows "MIGRATION COMPLETED SUCCESSFULLY"
5. Look for `+ Added tipoItem (THE FIX)` in the output

---

## Step 2: Verify Migration

1. Still in Azure Portal Query Editor
2. Copy and paste the contents of `scripts/verify-migration.sql`
3. Click **Run**
4. Verify: `RESULT: ALL CRITICAL CHECKS PASSED`
5. Confirm: `PASS` count, zero `FAIL` count

If any FAIL results appear, **DO NOT proceed** with deployment.

---

## Step 3: Build API Docker Image

```bash
# From project root
cd /home/jose/facturador-electronico-sv

# Build the API image (includes prisma generate)
docker build -t facturadoracr.azurecr.io/api:v28 -f apps/api/Dockerfile .
```

The Dockerfile already includes:
- `npx prisma generate` (regenerates client from schema.prisma)
- `npm run build` (compiles TypeScript)

---

## Step 4: Push to Azure Container Registry

```bash
# Login to ACR (if not already logged in)
az acr login --name facturadoracr

# Push the image
docker push facturadoracr.azurecr.io/api:v28
```

---

## Step 5: Deploy to Azure Web App

```bash
# Update the API web app to use the new image
az webapp config container set \
  --name facturador-api \
  --resource-group facturador-rg \
  --container-image-name facturadoracr.azurecr.io/api:v28

# Restart the web app
az webapp restart --name facturador-api --resource-group facturador-rg
```

---

## Step 6: Verify Deployment

### 6a. Health Check
```bash
curl https://facturador-api.azurewebsites.net/health
# Expected: {"status":"ok",...}
```

### 6b. Test Quotes API (requires valid JWT token)
```bash
# List quotes
curl -H "Authorization: Bearer $TOKEN" \
  https://facturador-api.azurewebsites.net/api/v1/quotes

# Expected: 200 with { data: [...], total: N, page: 1, limit: 20, totalPages: N }
```

### 6c. Test Quote Creation
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clienteId": "<valid-client-id>",
    "validUntil": "2026-03-15",
    "items": [{
      "description": "Test item",
      "quantity": 2,
      "unitPrice": 10.00,
      "discount": 0,
      "tipoItem": 1
    }]
  }' \
  https://facturador-api.azurewebsites.net/api/v1/quotes

# Expected: 201 with full quote object including lineItems with tipoItem
```

### 6d. Test Public Approval Endpoint
```bash
# Get a quote's approval token from DB or API response
curl https://facturador-api.azurewebsites.net/api/v1/quotes/public/approve/<token>

# Expected: 200 with quote details (no auth required)
```

### 6e. Test Frontend
1. Open the web app
2. Navigate to **Cotizaciones** > **Nueva Cotizacion**
3. Create a quote with at least one item
4. Verify it saves without errors
5. Click **Enviar** to send the quote
6. Open the approval URL in an incognito window
7. Verify the approval portal loads correctly

---

## Rollback Plan

If anything goes wrong:

```bash
# Rollback to previous API version
az webapp config container set \
  --name facturador-api \
  --resource-group facturador-rg \
  --container-image-name facturadoracr.azurecr.io/api:v25

az webapp restart --name facturador-api --resource-group facturador-rg
```

Database changes are additive (new columns only), so rolling back the API is safe.
The v25 API will simply ignore the new columns.

---

## Version Compatibility Matrix

| API Version | Web Version | Status | Notes |
|-------------|-------------|--------|-------|
| v25         | v37         | Working | Legacy Spanish field names |
| v25         | v39         | Broken  | Web sends English, API expects Spanish |
| v28         | v39         | Target  | Both use English field names |

---

## Environment Variables

No new environment variables required for this deployment.
The only optional one is:

```
FRONTEND_URL=https://your-web-app-url.com
```

This is used to generate the approval portal URL (`/approve/{token}`).
If not set, the approval URL will not be included in the quote data.
