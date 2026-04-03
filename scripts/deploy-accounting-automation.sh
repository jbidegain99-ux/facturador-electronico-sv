#!/bin/bash
set -e # Exit on error

# ============================================================================
# DEPLOYMENT SCRIPT - Automatizacion DTE -> Partida Contable
# ============================================================================
# Uso: ./scripts/deploy-accounting-automation.sh
#
# Prerequisitos:
#   - Azure CLI instalado y autenticado (az login)
#   - Docker instalado y corriendo
#   - Variables de entorno o valores por defecto configurados
#   - Schema de Azure SQL verificado (ver scripts/verify-azure-sql-schema.sql)
# ============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Defaults from existing deploy script (override with env vars)
ACR_NAME="${ACR_NAME:-republicodeacr}"
RESOURCE_GROUP="${RESOURCE_GROUP:-facturador-sv-rg}"
API_APP_NAME="${API_APP_NAME:-facturador-api-sv}"
WEB_APP_NAME="${WEB_APP_NAME:-facturador-web-sv}"
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

echo -e "${BLUE}"
echo "============================================"
echo "  DEPLOYMENT: Automatizacion Contable"
echo "  Commit: $GIT_SHA"
echo "  $(date)"
echo "============================================"
echo -e "${NC}"

# ============================================================================
# FASE 1: PRE-DEPLOYMENT CHECKS
# ============================================================================

echo -e "${YELLOW}[Fase 1/5] Verificaciones Pre-Deployment${NC}"

# Check 1: Prisma generate
echo "  Verificando Prisma..."
npx prisma generate --schema=apps/api/prisma/schema.prisma > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "  ${RED}ERROR: prisma generate fallo${NC}"
    exit 1
fi
echo -e "  ${GREEN}Prisma OK${NC}"

# Check 2: Tests
echo "  Ejecutando tests..."
npx jest --config apps/api/jest.config.ts --silent 2>&1 | tail -3
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo -e "  ${RED}ERROR: Tests fallaron${NC}"
    exit 1
fi
echo -e "  ${GREEN}Tests OK${NC}"

# Check 3: API Build
echo "  Build API..."
npx turbo build --filter=@facturador/api > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "  ${RED}ERROR: API build fallo${NC}"
    exit 1
fi
echo -e "  ${GREEN}API build OK${NC}"

# Check 4: Web Build
echo "  Build Web..."
npx turbo build --filter=@facturador/web > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "  ${RED}ERROR: Web build fallo${NC}"
    exit 1
fi
echo -e "  ${GREEN}Web build OK${NC}"

# ============================================================================
# PAUSA: VERIFICAR SCHEMA EN AZURE SQL
# ============================================================================

echo ""
echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}  PAUSA OBLIGATORIA: Verificar Schema${NC}"
echo -e "${YELLOW}============================================${NC}"
echo ""
echo "Antes de continuar, verifica el schema en Azure SQL:"
echo ""
echo "  1. Abrir Azure Portal -> SQL Database -> Query Editor"
echo "  2. Ejecutar: scripts/verify-azure-sql-schema.sql"
echo "  3. Confirmar que las 3 columnas existen:"
echo "     - Tenant.autoJournalEnabled"
echo "     - Tenant.autoJournalTrigger"
echo "     - account_mapping_rules.mappingConfig"
echo ""
echo -e "Has verificado el schema en Azure SQL? ${BLUE}(y/n)${NC}"
read -r SCHEMA_VERIFIED

if [ "$SCHEMA_VERIFIED" != "y" ]; then
    echo -e "${RED}Deployment cancelado. Verifica el schema primero.${NC}"
    exit 1
fi

echo -e "${GREEN}Schema verificado.${NC}"
echo ""

# ============================================================================
# FASE 2: BUILD DOCKER IMAGES
# ============================================================================

echo -e "${YELLOW}[Fase 2/5] Build Docker Images${NC}"

API_TAG="${ACR_NAME}.azurecr.io/facturador-api:${GIT_SHA}"
WEB_TAG="${ACR_NAME}.azurecr.io/facturador-web:${GIT_SHA}"
API_TAG_LATEST="${ACR_NAME}.azurecr.io/facturador-api:latest"
WEB_TAG_LATEST="${ACR_NAME}.azurecr.io/facturador-web:latest"

echo "  Building API image ($GIT_SHA)..."
docker build -t "$API_TAG" -t "$API_TAG_LATEST" -f apps/api/Dockerfile .
echo -e "  ${GREEN}API image built${NC}"

echo "  Building Web image ($GIT_SHA)..."
docker build -t "$WEB_TAG" -t "$WEB_TAG_LATEST" -f apps/web/Dockerfile .
echo -e "  ${GREEN}Web image built${NC}"

# ============================================================================
# FASE 3: PUSH TO ACR
# ============================================================================

echo -e "${YELLOW}[Fase 3/5] Push to Azure Container Registry${NC}"

echo "  Logging in to ACR..."
az acr login --name "$ACR_NAME" > /dev/null 2>&1
echo -e "  ${GREEN}ACR login OK${NC}"

echo "  Pushing API..."
docker push "$API_TAG" > /dev/null 2>&1
docker push "$API_TAG_LATEST" > /dev/null 2>&1
echo -e "  ${GREEN}API pushed ($GIT_SHA)${NC}"

echo "  Pushing Web..."
docker push "$WEB_TAG" > /dev/null 2>&1
docker push "$WEB_TAG_LATEST" > /dev/null 2>&1
echo -e "  ${GREEN}Web pushed ($GIT_SHA)${NC}"

# ============================================================================
# FASE 4: DEPLOY TO APP SERVICES
# ============================================================================

echo -e "${YELLOW}[Fase 4/5] Deploy to Azure App Services${NC}"

echo "  Setting API container image to $GIT_SHA..."
az webapp config container set \
    --name "$API_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --docker-custom-image-name "$API_TAG" > /dev/null 2>&1
echo -e "  ${GREEN}API image set${NC}"

echo "  Setting Web container image to $GIT_SHA..."
az webapp config container set \
    --name "$WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --docker-custom-image-name "$WEB_TAG" > /dev/null 2>&1
echo -e "  ${GREEN}Web image set${NC}"

echo "  Restarting services..."
az webapp restart --name "$API_APP_NAME" --resource-group "$RESOURCE_GROUP" > /dev/null 2>&1 &
az webapp restart --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" > /dev/null 2>&1 &
wait
echo -e "  ${GREEN}Services restarted${NC}"

# ============================================================================
# FASE 5: POST-DEPLOYMENT VERIFICATION
# ============================================================================

echo -e "${YELLOW}[Fase 5/5] Post-Deployment Verification${NC}"

echo "  Esperando 30s para que servicios arranquen..."
sleep 30

# Check API
API_STATE=$(az webapp show --name "$API_APP_NAME" --resource-group "$RESOURCE_GROUP" --query state -o tsv 2>/dev/null)
if [ "$API_STATE" = "Running" ]; then
    echo -e "  ${GREEN}API: Running${NC}"
else
    echo -e "  ${RED}API: $API_STATE (revisar logs)${NC}"
    echo "  az webapp log tail --name $API_APP_NAME --resource-group $RESOURCE_GROUP"
fi

# Check Web
WEB_STATE=$(az webapp show --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --query state -o tsv 2>/dev/null)
if [ "$WEB_STATE" = "Running" ]; then
    echo -e "  ${GREEN}Web: Running${NC}"
else
    echo -e "  ${RED}Web: $WEB_STATE (revisar logs)${NC}"
    echo "  az webapp log tail --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP"
fi

# ============================================================================
# DONE
# ============================================================================

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETADO${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  Commit:  $GIT_SHA"
echo "  API:     $API_APP_NAME ($API_TAG)"
echo "  Web:     $WEB_APP_NAME ($WEB_TAG)"
echo ""
echo "  Proximos pasos:"
echo "    1. Verificar logs: az webapp log tail --name $API_APP_NAME --resource-group $RESOURCE_GROUP"
echo "    2. Seed mapeos para tenant beta:"
echo "       curl -X POST https://$API_APP_NAME.azurewebsites.net/accounting/mappings/seed \\"
echo "         -H 'Authorization: Bearer <token>'"
echo "    3. Activar automatizacion para tenant:"
echo "       curl -X PATCH https://$API_APP_NAME.azurewebsites.net/accounting/config \\"
echo "         -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' \\"
echo "         -d '{\"autoJournalEnabled\": true, \"autoJournalTrigger\": \"ON_APPROVED\"}'"
echo "    4. Seguir checklist: docs/deployment-checklist.md"
echo ""
