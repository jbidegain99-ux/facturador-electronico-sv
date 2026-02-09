# 🤖 PROMPT PARA CLAUDE CODE
## Testing Automatizado - Sprints 1 & 2

---

## 🎯 OBJETIVO DE ESTA SESIÓN

Implementar suite completa de pruebas automatizadas para Facturador Electrónico SV con **estándares profesionales de desarrollo**:

- ✅ **Backend**: Integration tests con Jest + Supertest
- ✅ **Frontend**: E2E tests con Playwright
- ✅ **CI/CD**: GitHub Actions workflows
- ✅ **Scripts**: Automatización de ejecución

**Filosofía**: Tests rápidos, confiables y fáciles de mantener.

---

## 📦 CONTEXTO DEL PROYECTO

### Información General
- **Proyecto**: Facturador Electrónico SV (Republicode)
- **Repositorio**: `https://github.com/jbidegain99-ux/facturador-electronico-sv`
- **Monorepo**: Turborepo con NestJS (backend) + Next.js 14 (frontend)
- **Branch actual**: `main`
- **Ubicación WSL**: `/home/jose/facturador-electronico-sv`

### Estructura Actual
```
facturador-electronico-sv/
├── apps/
│   ├── api/           # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── clientes/
│   │   │   │   ├── dte/
│   │   │   │   └── recurring-invoices/  ← Sprint 2
│   │   │   └── common/
│   │   │       └── dto/
│   │   │           ├── pagination-query.dto.ts  ← Sprint 1
│   │   │           └── paginated-response.ts    ← Sprint 1
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── Dockerfile
│   │
│   └── web/           # Next.js 14 frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── (dashboard)/
│       │   │   │   ├── clientes/
│       │   │   │   ├── facturas/
│       │   │   │   └── facturas/recurrentes/  ← Sprint 2
│       │   │   └── (auth)/
│       │   └── components/
│       │       └── ui/
│       │           ├── pagination.tsx         ← Sprint 1
│       │           └── page-size-selector.tsx ← Sprint 1
│       └── Dockerfile
│
├── .github/
│   └── workflows/
│       └── (vacío - crear aquí)
│
├── scripts/
│   └── (vacío - crear aquí)
│
└── tasks/
    ├── todo.md
    ├── lessons.md
    └── (otros documentos de contexto)
```

### Sprints Implementados

**Sprint 1**: Sistema de Paginación
- Backend: `PaginationQueryDto`, `PaginatedResponse<T>`
- Aplicado en: `/clientes` y `/dte`
- Features: page, limit, search, sortBy, sortOrder

**Sprint 2**: Facturación Recurrente
- Modelos Prisma: `RecurringInvoiceTemplate`, `RecurringInvoiceHistory`
- 9 endpoints REST en `/recurring-invoices`
- BullMQ processor + scheduler (cron diario 01:00 UTC)
- 4 páginas frontend con wizard completo

---

## 🔧 RECURSOS DE INFRAESTRUCTURA

### Azure Resources
- **Resource Group**: `republicode-rg`
- **Container Registry**: `republicodeacr.azurecr.io`
- **API App Service**: `republicode-api`
- **Web App Service**: `republicode-web`
- **Database**: Azure SQL Database (migrado desde Supabase)

### Environment Variables (Producción)
```bash
# Backend (apps/api/.env.production)
DATABASE_URL="sqlserver://republicode-sql-server.database.windows.net:1433;database=republicode-db;user=adminuser;password=XXX;encrypt=true;trustServerCertificate=false"
JWT_SECRET="production-secret-XXX"
REDIS_URL="redis://republicode-redis.redis.cache.windows.net:6380"  # Opcional para scheduler

# Frontend (apps/web/.env.production)
NEXT_PUBLIC_API_URL="https://republicode-api.azurewebsites.net"
```

### Git Workflow
```bash
# 1. Claude Code crea branch
git checkout -b claude/testing-automation-<hash>

# 2. Desarrolla y hace commits incrementales
git add .
git commit -m "test: add backend integration tests setup"

# 3. Push al terminar
git push origin claude/testing-automation-<hash>

# 4. Jose hace merge manual o crea PR
```

### Docker Build & Deploy (Desde WSL)
```bash
# Build API
cd apps/api
docker build -t republicodeacr.azurecr.io/facturador-api:v14 .
docker push republicodeacr.azurecr.io/facturador-api:v14

# Deploy a Azure App Service
az webapp config container set \
  --name republicode-api \
  --resource-group republicode-rg \
  --docker-custom-image-name republicodeacr.azurecr.io/facturador-api:v14

# Similar para Web
cd ../web
docker build -t republicodeacr.azurecr.io/facturador-web:v14 .
# ... (proceso similar)
```

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### Fase 1: Setup de Testing (2-3 horas)

#### Tareas:
1. **Crear estructura de carpetas**:
   ```bash
   apps/api/test/
   apps/api/test/helpers/
   apps/api/test/sprint1/
   apps/api/test/sprint2/
   apps/web/tests/e2e/
   apps/web/tests/e2e/fixtures/
   apps/web/tests/e2e/sprint1/
   apps/web/tests/e2e/sprint2/
   ```

2. **Instalar dependencias**:
   ```bash
   # Backend (apps/api)
   npm install --save-dev supertest @types/supertest
   
   # Frontend (apps/web)
   npm install --save-dev @playwright/test
   npx playwright install chromium
   ```

3. **Crear archivos de configuración**:
   - `apps/api/jest-integration.config.js`
   - `apps/api/test/setup.ts`
   - `apps/web/playwright.config.ts`

4. **Crear helpers**:
   - `apps/api/test/helpers/test-database.helper.ts` (SQLite in-memory)
   - `apps/api/test/helpers/auth.helper.ts` (JWT tokens)

#### Acceptance Criteria:
- [ ] Estructura de carpetas creada
- [ ] Dependencias instaladas sin errores
- [ ] `npm run test:integration` ejecuta (aunque no haya tests aún)
- [ ] `npx playwright test` ejecuta (aunque no haya tests aún)

#### Self Code Review:
- ¿Las rutas de archivos siguen la estructura definida?
- ¿Las dependencias están en `devDependencies`?
- ¿Los archivos de config tienen sintaxis correcta?

---

### Fase 2: Backend Integration Tests (4-6 horas)

#### Tareas:

**Sprint 1 - Paginación**:
1. `apps/api/test/sprint1/clientes-pagination.spec.ts`:
   - GET básico con paginación (10 clientes default)
   - Parámetro `limit` funciona (5, 20, 50)
   - Navegación entre páginas (skip/take correcto)
   - Búsqueda por nombre/NIT
   - Ordenamiento ASC/DESC por nombre
   - Rechazo de sortBy inválido
   - Combinación: búsqueda + sort + paginación

2. `apps/api/test/sprint1/dte-pagination.spec.ts`:
   - Similar a clientes pero con campos de DTE
   - Ordenamiento por fecha, numeroControl, total

**Sprint 2 - Facturación Recurrente**:
3. `apps/api/test/sprint2/recurring-crud.spec.ts`:
   - POST /recurring-invoices (crear template mensual, semanal, diario)
   - GET /recurring-invoices (listar con paginación)
   - GET /recurring-invoices/:id (detalle)
   - PATCH /recurring-invoices/:id (editar)
   - PATCH /recurring-invoices/:id/pause
   - PATCH /recurring-invoices/:id/resume
   - PATCH /recurring-invoices/:id/cancel
   - Validaciones (anchorDay inválido, etc.)

4. `apps/api/test/sprint2/recurring-logic.spec.ts`:
   - `calculateNextRunDate()` para daily/weekly/monthly
   - `getDueTemplates()` solo retorna activos vencidos
   - `recordSuccess()` resetea consecutiveFailures
   - `recordFailure()` incrementa contador
   - Auto-pausa después de 3 fallos consecutivos

5. `apps/api/test/sprint2/processor.spec.ts`:
   - Processor genera DTE correctamente desde template
   - Mode `generate_only` no firma/transmite
   - Mode `auto_transmit` firma y transmite
   - Manejo de errores en generación

6. `apps/api/test/sprint2/scheduler.spec.ts`:
   - Scheduler encola templates vencidos
   - Solo procesa templates activos
   - Actualiza nextRunDate después de enqueue

#### Acceptance Criteria:
- [ ] **Cobertura**: Mínimo 70% de LOC en módulos testeados
- [ ] **Todos los tests pasan** en modo `--coverage`
- [ ] **Velocidad**: Suite completa < 3 minutos
- [ ] **Deterministas**: 0 fallos intermitentes

#### Self Code Review:
- ¿Cada test tiene arrange/act/assert claros?
- ¿Los nombres de tests son descriptivos?
- ¿Limpio la base de datos entre tests?
- ¿Uso `beforeEach` para setup común?
- ¿Los tests son independientes entre sí?

---

### Fase 3: Frontend E2E Tests (4-6 horas)

#### Tareas:

**Sprint 1 - Paginación**:
1. `apps/web/tests/e2e/sprint1/clientes-pagination.spec.ts`:
   - Navegación: First/Prev/Next/Last buttons
   - Cambiar tamaño de página (10/20/50/100)
   - Búsqueda en tiempo real
   - Click en header de columna para ordenar
   - Persistencia de filtros al cambiar página

2. `apps/web/tests/e2e/sprint1/dte-pagination.spec.ts`:
   - Similar a clientes pero para tabla de facturas

**Sprint 2 - Facturación Recurrente**:
3. `apps/web/tests/e2e/sprint2/recurring-create.spec.ts`:
   - Abrir wizard de nueva plantilla
   - Llenar formulario completo
   - Validar campos requeridos
   - Agregar múltiples items
   - Verificar cálculo de "Próxima factura"
   - Submit exitoso y redirección

4. `apps/web/tests/e2e/sprint2/recurring-edit.spec.ts`:
   - Editar template inline desde tabla
   - Pausar/reanudar/cancelar desde botones
   - Ver cambios reflejados inmediatamente

5. `apps/web/tests/e2e/sprint2/recurring-history.spec.ts`:
   - Ver historial de ejecuciones
   - Filtrar por estado (SUCCESS/FAILED/SKIPPED)
   - Paginación en historial

#### Fixtures (Page Objects):
- `apps/web/tests/e2e/fixtures/auth.fixture.ts`
- `apps/web/tests/e2e/fixtures/clientes.fixture.ts`
- `apps/web/tests/e2e/fixtures/recurring.fixture.ts`

#### Acceptance Criteria:
- [ ] **Cobertura**: Flujos críticos de usuario cubiertos
- [ ] **Screenshots**: En caso de fallo, hay screenshot disponible
- [ ] **Video**: Opcionalmente, video del fallo
- [ ] **Velocidad**: Suite E2E < 5 minutos

#### Self Code Review:
- ¿Uso Page Objects para reducir duplicación?
- ¿Los selectores son robustos (getByRole vs getByText)?
- ¿Espero correctamente con `expect().toBeVisible()`?
- ¿Los tests son resilientes a cambios de texto?

---

### Fase 4: Scripts de Automatización (1-2 horas)

#### Tareas:
1. `scripts/test-all.sh`:
   - Ejecuta backend + E2E en secuencia
   - Reporta resultados consolidados
   - Exit code apropiado para CI

2. `scripts/test-backend.sh`:
   - Setup de SQLite temporal
   - Ejecutar migraciones Prisma
   - Ejecutar tests con coverage
   - Limpiar archivos temporales

3. `scripts/test-e2e.sh`:
   - Instalar Playwright browsers si necesario
   - Ejecutar con reporter HTML
   - Mostrar ruta al reporte

#### Acceptance Criteria:
- [ ] Scripts tienen permisos de ejecución (`chmod +x`)
- [ ] Funcionan desde la raíz del proyecto
- [ ] Manejan errores apropiadamente
- [ ] Documentados en README.md

---

### Fase 5: CI/CD con GitHub Actions (2-3 horas)

#### Tareas:
1. `.github/workflows/api-tests.yml`:
   - Trigger: push/PR a `main` con cambios en `apps/api/**`
   - Setup Node.js 20
   - Instalar deps + Prisma generate
   - Ejecutar `npm run test:integration -- --coverage`
   - Upload coverage a Codecov

2. `.github/workflows/e2e-tests.yml`:
   - Trigger: push/PR a `main` con cambios en `apps/web/**`
   - Install Playwright browsers
   - Ejecutar `npx playwright test`
   - Upload artifacts (playwright-report)

#### Acceptance Criteria:
- [ ] Workflows se ejecutan automáticamente en GitHub
- [ ] Reportan status (✅/❌) en PRs
- [ ] Artifacts accesibles en Actions tab
- [ ] No hay secretos hardcodeados

#### Self Code Review:
- ¿Los paths en `on.push.paths` son correctos?
- ¿Las versiones de Node.js coinciden con local?
- ¿Los jobs tienen timeouts razonables?

---

### Fase 6: Documentación (1 hora)

#### Tareas:
1. Actualizar `README.md` con sección "Testing":
   - Cómo ejecutar tests localmente
   - Estructura de carpetas
   - Comandos útiles
   - Cómo agregar nuevos tests

2. Actualizar `tasks/lessons.md` con aprendizajes:
   - Patrones de testing que funcionaron bien
   - Problemas encontrados y soluciones
   - Mejoras futuras

#### Acceptance Criteria:
- [ ] README tiene ejemplos de comandos
- [ ] Lessons.md tiene al menos 3 aprendizajes
- [ ] Código está auto-documentado con comentarios

---

## ✅ DEFINITION OF DONE

Un test está **DONE** cuando cumple TODOS estos criterios:

### Funcionalidad:
- ✅ Cubre el caso de uso descrito en el plan
- ✅ Incluye arrange/act/assert claros
- ✅ Maneja edge cases relevantes (validaciones, errores)

### Calidad:
- ✅ Pasa consistentemente (ejecutado 5 veces sin fallos)
- ✅ Se ejecuta en tiempo razonable (< 5 seg por test)
- ✅ Nombre autodocumentado (describe QUÉ valida)

### Integración:
- ✅ Incluido en suite de CI/CD
- ✅ Documentado en este plan
- ✅ Self code review completado

### Evidencia:
- ✅ Screenshot/log de test passing localmente
- ✅ Coverage report muestra líneas cubiertas
- ✅ Ejecutado tanto en WSL como en CI (si aplica)

---

## 🚨 REGLAS CRÍTICAS A SEGUIR

### 1. NO ROMPER FUNCIONALIDAD EXISTENTE
- ❌ **NUNCA** modificar código de producción sin necesidad
- ❌ **NUNCA** cambiar estructuras de datos existentes
- ✅ Solo agregar archivos nuevos en carpetas `test/` y `tests/`
- ✅ Si hay que modificar código real, hacerlo en commit separado con justificación

### 2. PLAN PRIMERO, CÓDIGO DESPUÉS
- ✅ Antes de escribir tests, crear lista de casos a cubrir
- ✅ Mostrarme el plan y esperar aprobación
- ✅ Implementar tests en orden de prioridad (críticos primero)

### 3. SELF CODE REVIEW OBLIGATORIO
Después de cada fase, revisar:
- [ ] ¿Todos los tests tienen nombres descriptivos?
- [ ] ¿Los tests son independientes entre sí?
- [ ] ¿Limpio recursos correctamente (DB, archivos)?
- [ ] ¿Los selectores E2E son robustos?
- [ ] ¿El código sigue convenciones de NestJS/Playwright?

### 4. VERIFICACIÓN ANTES DE COMPLETAR
- ✅ Ejecutar `npm run test:integration -- --coverage` → debe pasar
- ✅ Ejecutar `npx playwright test` → debe pasar
- ✅ Revisar coverage report → debe ser ≥70%
- ✅ Ejecutar tests 3 veces → 0 fallos intermitentes

### 5. EVIDENCIA DE COMPLETADO
Al terminar cada fase, proveer:
- 📸 Screenshot de tests passing
- 📊 Coverage report (texto o imagen)
- 📝 Lista de archivos creados/modificados
- ✅ Checklist de Definition of Done completado

---

## 🔍 DEBUGGING TIPS

### Si tests de backend fallan:
```bash
# Ver logs detallados
npm run test:integration -- --verbose

# Ejecutar un solo test
npm run test:integration -- -t "debe crear template mensual"

# Detectar handles abiertos (memory leaks)
npm run test:integration -- --detectOpenHandles --forceExit
```

### Si tests E2E fallan:
```bash
# Modo UI interactivo
npx playwright test --ui

# Ver trace de fallo
npx playwright show-trace trace.zip

# Generar código de test (debugging)
npx playwright codegen http://localhost:3000
```

### Si SQLite da problemas:
```bash
# Verificar que DATABASE_URL apunta a SQLite
echo $DATABASE_URL  # Debe ser: file:./test.db

# Limpiar archivos viejos
rm -f apps/api/test.db apps/api/test.db-journal
```

---

## 📊 CHECKLIST DE PROGRESO

### Setup ✅
- [ ] Estructura de carpetas creada
- [ ] Dependencias instaladas
- [ ] Configs de Jest y Playwright creados
- [ ] Helpers de database y auth funcionando

### Backend Tests ✅
- [ ] Sprint 1: clientes-pagination.spec.ts (7 tests)
- [ ] Sprint 1: dte-pagination.spec.ts (6 tests)
- [ ] Sprint 2: recurring-crud.spec.ts (9 tests)
- [ ] Sprint 2: recurring-logic.spec.ts (5 tests)
- [ ] Sprint 2: processor.spec.ts (4 tests)
- [ ] Sprint 2: scheduler.spec.ts (3 tests)
- [ ] **Total**: ~34 tests backend

### E2E Tests ✅
- [ ] Fixtures (Page Objects) creados
- [ ] Sprint 1: clientes-pagination.spec.ts (5 tests)
- [ ] Sprint 1: dte-pagination.spec.ts (4 tests)
- [ ] Sprint 2: recurring-create.spec.ts (5 tests)
- [ ] Sprint 2: recurring-edit.spec.ts (4 tests)
- [ ] Sprint 2: recurring-history.spec.ts (3 tests)
- [ ] **Total**: ~21 tests E2E

### Scripts ✅
- [ ] test-all.sh
- [ ] test-backend.sh
- [ ] test-e2e.sh
- [ ] Permisos de ejecución dados

### CI/CD ✅
- [ ] api-tests.yml creado
- [ ] e2e-tests.yml creado
- [ ] Workflows ejecutados exitosamente en GitHub

### Documentación ✅
- [ ] README.md actualizado
- [ ] tasks/lessons.md actualizado
- [ ] Código comentado apropiadamente

---

## 📚 RECURSOS DE REFERENCIA

### Testing Best Practices:
- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

### Proyecto Actual:
- Plan detallado: Ver archivo `PLAN_TESTING_AUTOMATIZADO.md`
- Esquema Prisma: `apps/api/prisma/schema.prisma`
- Endpoints API: Revisar Swagger en producción

---

## 🎬 METODOLOGÍA DE TRABAJO

### Workflow Requerido:

1. **PLAN PRIMERO**:
   ```
   "Voy a implementar tests para <módulo>. Aquí están los casos:
   1. Test A - verifica X
   2. Test B - verifica Y
   3. Test C - edge case Z
   
   ¿Procedo?"
   ```

2. **IMPLEMENTAR**:
   - Crear archivo de test
   - Escribir tests siguiendo arrange/act/assert
   - Ejecutar localmente

3. **SELF CODE REVIEW**:
   ```
   "Completé <módulo>. Self review:
   ✅ Tests tienen nombres descriptivos
   ✅ Uso beforeEach para setup
   ✅ Limpio recursos en afterEach
   ✅ Tests son independientes
   ✅ Coverage: 85%"
   ```

4. **DEMOSTRAR**:
   - Screenshot de tests passing
   - Coverage report
   - Lista de archivos creados

5. **SIGUIENTE FASE**:
   - Solo continuar cuando fase actual esté DONE
   - No mezclar fases

---

## ⚠️ LIMITACIONES Y CONSIDERACIONES

### Base de Datos:
- ✅ **Local/CI**: SQLite in-memory (rápido)
- ❌ **NO usar**: Azure SQL en tests (lento, costoso)
- ✅ Recrear esquema en cada test con Prisma migrate

### Redis (BullMQ):
- ✅ **Scheduler/Processor tests**: Mockear o usar in-memory queue
- ❌ **NO requerir**: Redis real para tests locales
- ℹ️ Opcional: Tests de integración con Redis en CI (separado)

### Ministerio de Hacienda API:
- ✅ **SIEMPRE mockear** en tests
- ❌ **NUNCA llamar** API real de Hacienda en tests
- ✅ Usar fixtures con respuestas esperadas

### Autenticación:
- ✅ Generar tokens JWT válidos en helpers
- ✅ Usar usuarios de prueba con permisos conocidos
- ❌ No hardcodear tokens (generarlos dinámicamente)

---

## 🚀 COMENZAR IMPLEMENTACIÓN

**Cuando estés listo, responde:**

> "✅ Contexto entendido. Comenzando Fase 1: Setup de Testing.
> 
> Plan de ejecución:
> 1. Crear estructura de carpetas
> 2. Instalar dependencias
> 3. Configurar Jest + Playwright
> 4. Crear helpers
> 
> ¿Procedo?"

**Y luego ejecuta siguiendo el workflow definido arriba.**

---

## 📝 NOTA FINAL PARA CLAUDE CODE

Este prompt está diseñado para que sigas **estándares profesionales**:

- 🎯 **Claridad**: Sabes exactamente qué hacer
- 📋 **Plan primero**: Nunca saltar directo a código
- 🔍 **Self-review**: Evalúas tu propio trabajo
- ✅ **Definition of Done**: Criterios objetivos
- 🚫 **Evitar breaking changes**: No tocar código de producción

**Toma tu tiempo, sigue el proceso, y haz testing de calidad profesional.** 

¡Éxito! 🚀
