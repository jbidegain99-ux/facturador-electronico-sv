#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}     TESTS AUTOMATIZADOS - QA REPORT${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd apps/web

# Ejecutar todos los tests del QA report
echo -e "${YELLOW}Ejecutando tests de QA...${NC}"
echo ""

npx playwright test tests/qa-report/ --reporter=list

TEST_RESULT=$?

echo ""
if [ $TEST_RESULT -eq 0 ]; then
  echo -e "${GREEN}✅ Todos los tests pasaron exitosamente${NC}"
  echo ""
  echo -e "${BLUE}Generando reporte HTML...${NC}"
  npx playwright test tests/qa-report/ --reporter=html
  echo -e "${GREEN}✅ Reporte generado en: apps/web/playwright-report/index.html${NC}"
else
  echo -e "${RED}❌ Algunos tests fallaron${NC}"
  exit 1
fi

cd ../..
