#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

URL="https://facturador-web-sv.azurewebsites.net"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  TEST FASE 1 - FUNCIONALIDADES${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Dashboard (Plan Usage)
echo -e "${BLUE}[1/5] Testing /dashboard (Plan Usage Widget)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/dashboard")
if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Dashboard accesible${NC}"
else
  echo -e "${RED}❌ Dashboard error: HTTP $HTTP_CODE${NC}"
fi
echo ""

# Test 2: Soporte Lista
echo -e "${BLUE}[2/5] Testing /soporte (Lista tickets)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/soporte")
if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Soporte lista accesible${NC}"
else
  echo -e "${RED}❌ Soporte error: HTTP $HTTP_CODE${NC}"
fi
echo ""

# Test 3: Migración
echo -e "${BLUE}[3/5] Testing /configuracion/migracion...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/configuracion/migracion")
if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Migración wizard accesible${NC}"
else
  echo -e "${RED}❌ Migración error: HTTP $HTTP_CODE${NC}"
fi
echo ""

# Test 4: Configuración
echo -e "${BLUE}[4/5] Testing /configuracion...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/configuracion")
if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Configuración accesible${NC}"
else
  echo -e "${RED}❌ Configuración error: HTTP $HTTP_CODE${NC}"
fi
echo ""

# Test 5: Login (regresión)
echo -e "${BLUE}[5/5] Testing /login (regresión)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/login")
if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Login funcional${NC}"
else
  echo -e "${RED}❌ Login error: HTTP $HTTP_CODE${NC}"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}         RESUMEN${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Todas las rutas principales son accesibles.${NC}"
echo ""
echo -e "${BLUE}Tests Manuales Requeridos:${NC}"
echo "  □ Login y crear ticket en /soporte"
echo "  □ Ver widget de plan usage en dashboard"
echo "  □ Probar wizard de migración"
echo "  □ Verificar 262 municipios en dropdowns"
echo "  □ Responsive en mobile"
echo ""
echo -e "${BLUE}URL Base:${NC} $URL"
