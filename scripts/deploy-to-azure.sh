#!/bin/bash
set -e

# ============================================
# DEPLOYMENT SCRIPT - AUTOMATIZACION CONTABILIDAD
# Ejecutar DESPUES de hacer builds de Docker
# ============================================
# Uso: ./scripts/deploy-to-azure.sh
#
# Prerequisitos:
#   - Docker images ya construidas localmente
#   - Azure CLI instalado (az login se ejecuta aqui)
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables (nombres reales de Azure)
ACR_NAME="republicodeacr"
API_IMAGE="republicodeacr.azurecr.io/facturador-api:v55"
WEB_IMAGE="republicodeacr.azurecr.io/facturador-web:v50"
RESOURCE_GROUP="facturador-sv-rg"
API_WEBAPP="facturador-api-sv"
WEB_WEBAPP="facturador-web-sv"
API_URL="https://facturador-api-sv.azurewebsites.net"
WEB_URL="https://facturador-web-sv.azurewebsites.net"

echo -e "${BLUE}"
echo "============================================"
echo "  DEPLOYMENT: Automatizacion Contable"
echo "  API: $API_IMAGE"
echo "  Web: $WEB_IMAGE"
echo "  $(date)"
echo "============================================"
echo -e "${NC}"

# ============================================
# PASO 1: Verificar imagenes Docker locales
# ============================================

echo -e "${YELLOW}[1/5] Verificando imagenes Docker locales...${NC}"

if ! docker image inspect "$API_IMAGE" > /dev/null 2>&1; then
    echo -e "  ${RED}ERROR: Imagen $API_IMAGE no encontrada${NC}"
    echo "  Ejecuta primero: docker build -f apps/api/Dockerfile -t $API_IMAGE ."
    exit 1
fi
echo -e "  ${GREEN}API image OK${NC}"

if ! docker image inspect "$WEB_IMAGE" > /dev/null 2>&1; then
    echo -e "  ${RED}ERROR: Imagen $WEB_IMAGE no encontrada${NC}"
    echo "  Ejecuta primero: docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=$API_URL -t $WEB_IMAGE ."
    exit 1
fi
echo -e "  ${GREEN}Web image OK${NC}"
echo ""

# ============================================
# PASO 2: LOGIN A AZURE CONTAINER REGISTRY
# ============================================

echo -e "${YELLOW}[2/5] Login a Azure Container Registry...${NC}"
az acr login --name $ACR_NAME

if [ $? -ne 0 ]; then
    echo -e "  ${RED}ERROR: ACR login fallo${NC}"
    echo "  Ejecuta primero: az login"
    exit 1
fi
echo -e "  ${GREEN}ACR login OK${NC}"
echo ""

# ============================================
# PASO 3: PUSH DE IMAGENES
# ============================================

echo -e "${YELLOW}[3/5] Pushing imagenes a ACR...${NC}"

echo "  Pushing API..."
docker push "$API_IMAGE"
if [ $? -ne 0 ]; then
    echo -e "  ${RED}ERROR: Push de API fallo${NC}"
    exit 1
fi
echo -e "  ${GREEN}API pushed${NC}"

echo "  Pushing Web..."
docker push "$WEB_IMAGE"
if [ $? -ne 0 ]; then
    echo -e "  ${RED}ERROR: Push de Web fallo${NC}"
    exit 1
fi
echo -e "  ${GREEN}Web pushed${NC}"
echo ""

# ============================================
# PASO 4: UPDATE APP SERVICES
# ============================================

echo -e "${YELLOW}[4/5] Updating Azure App Services...${NC}"

echo "  Setting API container image..."
az webapp config container set \
    --name $API_WEBAPP \
    --resource-group $RESOURCE_GROUP \
    --docker-custom-image-name "$API_IMAGE" > /dev/null 2>&1
echo -e "  ${GREEN}API image set${NC}"

echo "  Setting Web container image..."
az webapp config container set \
    --name $WEB_WEBAPP \
    --resource-group $RESOURCE_GROUP \
    --docker-custom-image-name "$WEB_IMAGE" > /dev/null 2>&1
echo -e "  ${GREEN}Web image set${NC}"

echo "  Restarting services..."
az webapp restart --name $API_WEBAPP --resource-group $RESOURCE_GROUP > /dev/null 2>&1 &
az webapp restart --name $WEB_WEBAPP --resource-group $RESOURCE_GROUP > /dev/null 2>&1 &
wait
echo -e "  ${GREEN}Services restarted${NC}"
echo ""

# ============================================
# PASO 5: VERIFICACION
# ============================================

echo -e "${YELLOW}[5/5] Verificacion post-deployment...${NC}"
echo "  Esperando 30s para que servicios arranquen..."
sleep 30

# Check API state
API_STATE=$(az webapp show --name $API_WEBAPP --resource-group $RESOURCE_GROUP --query state -o tsv 2>/dev/null)
if [ "$API_STATE" = "Running" ]; then
    echo -e "  ${GREEN}API status: Running${NC}"
else
    echo -e "  ${RED}API status: $API_STATE${NC}"
fi

# Check Web state
WEB_STATE=$(az webapp show --name $WEB_WEBAPP --resource-group $RESOURCE_GROUP --query state -o tsv 2>/dev/null)
if [ "$WEB_STATE" = "Running" ]; then
    echo -e "  ${GREEN}Web status: Running${NC}"
else
    echo -e "  ${RED}Web status: $WEB_STATE${NC}"
fi

# Health checks via curl
echo ""
echo "  Health checks:"
API_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" --max-time 10 2>/dev/null || echo "TIMEOUT")
echo "  API /health: HTTP $API_HTTP"

WEB_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL" --max-time 10 2>/dev/null || echo "TIMEOUT")
echo "  Web /: HTTP $WEB_HTTP"

echo ""

if [ "$API_STATE" = "Running" ] && [ "$WEB_STATE" = "Running" ]; then
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  DEPLOYMENT COMPLETADO EXITOSAMENTE${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo "Proximos pasos:"
    echo "  1. Ver logs: az webapp log tail --name $API_WEBAPP --resource-group $RESOURCE_GROUP"
    echo "  2. Seguir guia de testing: scripts/post-deployment-tests.md"
    echo "  3. Seed mapeos: POST $API_URL/accounting/mappings/seed"
    echo "  4. Activar automatizacion para tenant beta"
else
    echo -e "${RED}============================================${NC}"
    echo -e "${RED}  ADVERTENCIA: Servicios no estan Running${NC}"
    echo -e "${RED}============================================${NC}"
    echo ""
    echo "Diagnostico:"
    echo "  az webapp log tail --name $API_WEBAPP --resource-group $RESOURCE_GROUP"
    echo "  az webapp log tail --name $WEB_WEBAPP --resource-group $RESOURCE_GROUP"
fi
echo ""
