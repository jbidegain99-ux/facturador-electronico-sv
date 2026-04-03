# Auditoria de Codigo — Facturosv.com

## Fecha: 2026-04-02
## Scope: main branch (post-rollback template editor) — API v68, Web v59

---

## Resumen Ejecutivo

| Metrica | API | Web | Total |
|---------|-----|-----|-------|
| Archivos analizados | 270 (.ts) | 328 (.ts/.tsx) | 598 |
| Lineas de codigo | 42,246 | 72,414 | 114,660 |
| Modulos/Paginas | 31 modulos | 62 paginas | — |
| Modelos Prisma | 60 | — | 60 |

| Categoria | Cantidad |
|-----------|----------|
| Issues criticos | 6 |
| Issues importantes | 12 |
| Mejoras recomendadas | 10 |
| Nice-to-have | 6 |

---

## Metricas de Herramientas Automaticas

| Metrica | API | Web |
|---------|-----|-----|
| Codigo duplicado (jscpd) | 218 clones (7.38%) | 165 clones (3.18%) |
| Dependencias circulares (madge) | 1 (dte↔webhooks) | 1 (QuickSetup↔ValidationStep) |
| Errores TypeScript (tsc --noEmit) | 0 | 7 (residuos plantillas + e2e type) |
| Tipos `any` | 41 | 12 |
| `console.log` en produccion | 4 | 12 |
| `next/dynamic` imports | — | 0 |
| `next/image` uso | — | 1 archivo |
| Queries sin tenant filter | 0 | — |
| Secrets hardcodeados | 0 | — |

---

## CRITICO — Riesgo inmediato

### C1. Web Dockerfile: ruta incorrecta del servidor de produccion
- **Archivo:** `apps/web/Dockerfile` linea 63
- **Problema:** `CMD ["node", "apps/web/server.js"]` — con standalone output, server.js esta en la raiz, no bajo `apps/web/`
- **Impacto:** El container podria no arrancar o servir assets incorrectamente
- **Tambien:** Las rutas de `.next/static` y `public/` apuntan a subdirectorios incorrectos (lineas 47-49)
- **Fix:** Corregir a `CMD ["node", "server.js"]` y ajustar COPY paths

### C2. docker-compose usa PostgreSQL pero Prisma schema usa SQL Server
- **Archivo:** `docker-compose.yml` linea 4: `image: postgres:16-alpine`
- **Problema:** Schema Prisma: `provider = "sqlserver"`, pero docker-compose levanta PostgreSQL
- **Impacto:** Desarrollo local no replica produccion. Tests locales pueden pasar pero fallar en prod
- **Fix:** Reemplazar con `mcr.microsoft.com/mssql/server:2022-latest` o documentar la discrepancia

### C3. Archivos grandes trackeados en git (ZIPs y SQL dumps)
- **Archivos encontrados:**
  - `web-deploy.zip`, `apps/web-deploy-20260207-151455.zip`, `apps/web-deploy.zip`
  - `apps/web-full-20260207-153938.zip`, `apps/web/playwright-report.zip`
  - `wellnest_facturas_marzo2026.zip`, `outputs/wellnest_facturas.zip`
  - `FacturadorRepublicode.sql`
- **Impacto:** Repositorio inflado, clones lentos
- **Fix:** `git filter-repo` para limpiar historial + agregar `*.zip`, `*.sql` a `.gitignore`

### C4. Conflicto de versiones nodemailer (v7 root vs v6 API)
- **Root:** `nodemailer: ^7.0.12`
- **API:** `nodemailer: ^6.9.0`
- **Impacto:** Incompatibilidad de API en runtime. v7 tiene breaking changes vs v6
- **Fix:** Alinear a una sola version. Mover dependencia solo al API package

### C5. Errores TypeScript en Web (residuos del rollback de plantillas)
- **7 errores en `tsc --noEmit`:**
  - 4 errores en `.next/types/app/.../plantillas/` — modulos que ya no existen (rollback)
  - 3 errores en `tests/e2e/recurrentes-detail.spec.ts` — tipo `_directives` invalido
- **Impacto:** Build puede fallar silenciosamente; types cache corrupto
- **Fix:** `rm -rf apps/web/.next/types` + fix del spec de e2e

### C6. 5 variables de entorno usadas en codigo pero no documentadas en .env.example
- `CERT_PASSWORD` — password del certificado digital
- `CERT_PATH` — ruta al certificado .p12/.pfx
- `CORS_ORIGINS` — alternativa plural a CORS_ORIGIN
- `DEMO_MODE` — feature flag
- `WELLNEST_WEBHOOK_SECRET` — webhook de integracion terceros
- **Impacto:** Setup failures para nuevos devs o re-deploys
- **Fix:** Agregar a `.env.example` con descripciones

---

## IMPORTANTE — Corto plazo (1-2 sprints)

### I1. `dte.service.ts` tiene 2,505 lineas — archivo mas grande del proyecto
- **Archivo:** `apps/api/src/modules/dte/dte.service.ts`
- **Problema:** Concentra todo el ciclo de vida DTE (creacion, validacion, firma, transmision, anulacion, PDF)
- **Ya existen** servicios separados (dte-builder, dte-validator, transmitter) pero dte.service sigue orquestando demasiado
- **Fix:** Extraer logica restante a servicios dedicados, dejar dte.service como orquestador delgado
- **Esfuerzo:** M (2-3 dias)

### I2. 5 archivos frontend exceden 900 lineas — sin code-splitting
- `catalogo/page.tsx` — **1,629 lineas** (el mas grande)
- `cotizaciones/[id]/page.tsx` — 1,279 lineas
- `approve/[token]/page.tsx` — 1,216 lineas
- `facturas/nueva/page.tsx` — 1,163 lineas
- `onboarding/steps/generic-step.tsx` — 986 lineas
- **0 usos de `next/dynamic`** en todo el frontend
- **Impacto:** Bundle size inflado, renders lentos, mantenibilidad baja
- **Fix:** Dividir en sub-componentes + `next/dynamic` para secciones pesadas
- **Esfuerzo:** L (4-6 dias para los 5)

### I3. Modelo Tenant tiene 45+ campos — necesita normalizacion
- **Mezcla:** datos de suscripcion, branding, onboarding, features, defaults
- **Impacto:** Cada read del Tenant trae 45 campos cuando normalmente solo se necesitan 2-3
- **Tambien afectados:** TenantOnboarding (38 campos), TenantEmailConfig (30 campos)
- **Fix:** Extraer a tablas separadas: TenantBranding, TenantSubscription, TenantDefaults
- **Esfuerzo:** L (requiere migracion de datos)

### I4. 7.38% duplicacion de codigo en API (218 clones detectados)
- **Principales focos:**
  - `accounting/default-mappings.data.ts` — 5 clones de mapeo repetitivo
  - `accounting-automation.service.spec.ts` — 7 clones de test setup
  - `accounting/accounting.controller.ts` — logica duplicada lineas 127-155
  - `audit-logs/audit-logs.service.ts` — patron repetido lineas 119-196
- **Fix:** Extraer helpers comunes, factory functions para tests
- **Esfuerzo:** M (2-3 dias)

### I5. Dependencia circular: dte.module.ts ↔ webhooks.module.ts
- **Detectado por:** madge
- **Impacto:** Riesgo de undefined en runtime por orden de carga
- **Fix:** Extraer interface comun o usar forwardRef/event-based decoupling
- **Esfuerzo:** S (medio dia)

### I6. Dependencia circular Web: QuickSetupWizard ↔ ValidationStep
- **Detectado por:** madge
- **Impacto:** Mismo riesgo de carga circular
- **Fix:** Reorganizar imports o extraer tipos compartidos
- **Esfuerzo:** S (medio dia)

### I7. API Dockerfile: doble npm install + --legacy-peer-deps
- **Lineas 17-21:** `npm install` en root + `npm install --legacy-peer-deps` en apps/api
- **Impacto:** Builds 2x mas lentos de lo necesario. `--legacy-peer-deps` oculta conflictos reales
- **Fix:** Resolver conflictos de peer deps, usar workspace hoisting unico
- **Esfuerzo:** S (medio dia)

### I8. @nestjs/schedule en root (v6) vs API (v4)
- **Problema:** Dependencia duplicada con version mayor diferente
- **Fix:** Eliminar de root package.json (solo API lo necesita)
- **Esfuerzo:** XS

### I9. ESLint deshabilitado en builds de Next.js
- **Archivo:** `apps/web/next.config.js` — `eslint: { ignoreDuringBuilds: true }`
- **Impacto:** Errores de lint llegan a produccion sin ser detectados
- **Fix:** Remover la linea, corregir errores de lint que aparezcan
- **Esfuerzo:** S-M (depende de cuantos errores emerjan)

### I10. 41 tipos `any` en API + 12 en Web
- **API (41 en 11 archivos):** notifications (8), onboarding (8), backups (6), hacienda (6), audit-logs (6), super-admin (3), catalogos-admin (2), otros (2)
- **Web (12 en 6 archivos):** facturas/[id]/page.tsx tiene 7 (el peor)
- **Fix:** Reemplazar con interfaces/tipos discriminados
- **Esfuerzo:** M (2 dias)

### I11. Solo 1 archivo usa `next/image` — imagenes sin optimizar
- **Unico uso:** `app/page.tsx` (homepage)
- **Raw `<img>` tags:** encontrados en `components/settings/logo-upload.tsx`
- **Impacto:** Images no optimizadas para diferentes viewports/formatos
- **Fix:** Reemplazar img con next/image donde aplique
- **Esfuerzo:** S (1 dia)

### I12. .dockerignore incompleto
- **Falta:** `.env`, `.env.local`, `coverage/`, `playwright-report/`, `test-results/`, `.vscode/`, `.idea/`, `*.spec.ts`, `*.test.ts`
- **Impacto:** Imagenes Docker mas grandes de lo necesario, riesgo de incluir secrets
- **Fix:** Ampliar .dockerignore
- **Esfuerzo:** XS

---

## MEJORA — Mediano plazo (3-6 sprints)

### M1. 189 useEffect calls pero solo 110 memos — re-renders innecesarios
- **Peores archivos:**
  - `catalogo/page.tsx` — 1,629 lineas, solo 3 memos
  - `cotizaciones/[id]/page.tsx` — 1,279 lineas, solo 2 memos
  - `approve/[token]/page.tsx` — 1,216 lineas, solo 1 memo
  - `layout.tsx` — 4 useEffect (incluye 11 console.log de debug)
- **Fix:** Audit de renders con React DevTools profiler, agregar React.memo/useMemo/useCallback estrategicamente
- **Esfuerzo:** M (2-3 dias)

### M2. Data fetching sin caching layer estandar
- **Patron actual:** Custom `useApi` hook con cache in-memory de 1 min TTL
- **Problema:** No hay React Query/SWR. Cache invalidation es manual. Cada pagina fetcha independientemente
- **Ejemplo:** `/clientes/page.tsx` y `/facturas/cliente-search.tsx` ambos fetchan clientes por separado
- **Fix:** Migrar a React Query o SWR para caching, dedup, y revalidation automatica
- **Esfuerzo:** L (5-7 dias, refactor gradual)

### M3. Extraer logica comun de Hacienda/DTE a servicios mas granulares
- **Archivos >500 lineas en el dominio DTE/Hacienda:**
  - `dte.service.ts` (2,505), `hacienda.service.ts` (1,167)
  - `test-data-generator.service.ts` (1,346), `dte-builder.service.ts` (1,148)
  - `certificate.service.ts` (690), `dte-validator.service.ts` (678)
  - `transmitter.service.ts` (519), `pdf.service.ts` (517)
- **Total:** ~8,800 lineas en 8 archivos del dominio core
- **Fix:** Refactor progresivo, empezando por dte.service.ts (ver I1)
- **Esfuerzo:** XL

### M4. Modelo TenantEmailConfig deberia usar patron de estrategia
- **30 campos** mezclando SMTP, API keys, OAuth2, provider-specific config
- **Fix:** Tabla base + tabla por proveedor, o JSON discriminado
- **Esfuerzo:** L

### M5. Sin transacciones explicitas en operaciones multi-paso
- **Operaciones riesgosas sin `prisma.$transaction()`:**
  - Creacion DTE + auto-firma + transmision
  - Conversion cotizacion a factura
  - Posting de asientos contables
- **Impacto:** Si falla a mitad, datos quedan inconsistentes
- **Fix:** Envolver en `prisma.$transaction()` las operaciones criticas
- **Esfuerzo:** M (2-3 dias, requiere testing cuidadoso)

### M6. Backup file y legacy code sin limpiar
- `apps/web/src/app/(dashboard)/facturas/nueva/page.old.bak` — 1,163 lineas muertas
- `apps/web/src/components/chat/chat-widget.legacy.tsx` — componente legacy
- **Fix:** Eliminar archivos muertos
- **Esfuerzo:** XS

### M7. 16 console.log de debug en Web (layout.tsx tiene 11)
- **Archivo:** `apps/web/src/app/(dashboard)/layout.tsx` — 11 console.log etiquetados `[Tenant]`
- **Tambien:** `onboarding-hacienda/page.tsx` — 1 console.log
- **Fix:** Reemplazar con logger condicional o eliminar
- **Esfuerzo:** XS

### M8. Version drift de TypeScript en Web
- Root y API: `^5.4.0`
- Web: `^5` (acepta cualquier 5.x)
- **Fix:** Alinear a `^5.4.0`
- **Esfuerzo:** XS

### M9. Next.js config usa `env` object (deprecado en v13+)
- **Archivo:** `apps/web/next.config.js`
- **Problema:** `env: { NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '...' }` — fallback hardcodeado a URL de produccion
- **Riesgo:** Si env var falta, conecta silenciosamente a produccion
- **Fix:** Remover `env` object, usar `NEXT_PUBLIC_*` directamente. Fallar si no esta definida
- **Esfuerzo:** XS

### M10. Duplicacion header ↔ notification-bell en Web
- **jscpd detecto:** 5 clones entre `header.tsx` y `notification-bell.tsx` (80+ lineas duplicadas)
- **Fix:** Extraer componente de notificaciones compartido
- **Esfuerzo:** S

---

## NICE-TO-HAVE — Largo plazo

### N1. Migrar a React Query/SWR para data fetching estandarizado
- El custom `useApi` hook funciona pero carece de: retry logic, background refetch, optimistic updates, devtools
- **Beneficio:** DX mejorada, menos bugs de cache, mejor UX con stale-while-revalidate

### N2. Agregar `next/dynamic` sistematicamente a componentes pesados
- 29 archivos frontend exceden 200 lineas
- Code splitting mejoraria Time to Interactive significativamente

### N3. Actualizar Next.js de 14.1.0 a 15.x
- Version actual es de febrero 2024
- Nuevas features: Turbopack estable, improved caching, React 19 support
- **Prerequisito:** Resolver los 7 errores TS primero

### N4. Implementar rate limiting por feature/tenant
- Solo existe rate limiting global por hora en TenantEmailConfig
- Falta: rate limiting por endpoint, por usuario, por feature
- **Beneficio:** Proteccion contra abuso, fairness entre tenants

### N5. Agregar indexes faltantes sugeridos
- `EmailSendLog: @@index([tenantId, status, sentAt])` — para reportes de fallos
- `TenantFeatureUsage: @@index([tenantId, resetDate])` — para resets de uso

### N6. Resolver `--legacy-peer-deps` en API
- El flag oculta conflictos de peer dependencies
- Resolver los conflictos reales mejoraria estabilidad de builds

---

## Scorecard General

| Area | API | Web | Notas |
|------|-----|-----|-------|
| Seguridad (tenant isolation) | 10/10 | — | Excelente: todas las queries filtran por tenantId |
| Seguridad (secrets) | 10/10 | — | Cero hardcoded secrets, encryption service |
| Separacion controller/service | 9/10 | — | Buena delegacion, minor validation duplication |
| Error handling | 9/10 | — | HttpExceptions especificas, Logger consistente |
| Type safety | 8/10 | 9/10 | API: 41 any, Web: 12 any |
| File organization | 8/10 | 7/10 | API: bien modularizado. Web: archivos demasiado grandes |
| Schema design | 6/10 | — | Tenant/Onboarding/EmailConfig bloated |
| Performance (queries) | 8/10 | — | Indexes bien puestos, includes estrategicos |
| Performance (frontend) | — | 5/10 | 0 dynamic imports, 0 image optimization, cache basico |
| Code duplication | 6/10 | 8/10 | API: 7.38% dup, Web: 3.18% dup |
| Docker/DevOps | 5/10 | 5/10 | Rutas incorrectas, DB mismatch, doble install |
| Documentation (.env) | 7/10 | — | Buena base pero 5 vars sin documentar |

**Score promedio: 7.3/10** — Codebase solido en seguridad y arquitectura core, pero con deuda tecnica acumulada en DevOps, performance frontend, y schema design.

---

## Plan de Refactor Priorizado

| # | Prioridad | Area | Descripcion | Esfuerzo | Impacto |
|---|-----------|------|-------------|----------|---------|
| 1 | CRITICO | Docker | Fix Web Dockerfile paths (server.js, static, public) | XS | Produccion |
| 2 | CRITICO | Docker | Fix docker-compose DB (PostgreSQL→SQL Server) | S | Dev local |
| 3 | CRITICO | Git | Limpiar ZIPs/SQL del repo + .gitignore | S | Repo size |
| 4 | CRITICO | Deps | Alinear nodemailer v6↔v7, mover a API | XS | Runtime |
| 5 | CRITICO | Web | Limpiar cache .next/types + fix e2e spec | XS | Build |
| 6 | CRITICO | Docs | Documentar 5 env vars faltantes | XS | Onboarding |
| 7 | IMPORTANTE | API | Refactor dte.service.ts (2505→~500 lineas) | M | Mantenibilidad |
| 8 | IMPORTANTE | Web | Dividir 5 paginas >900 lineas + next/dynamic | L | Performance |
| 9 | IMPORTANTE | DB | Normalizar Tenant (45→~15 campos) | L | Performance |
| 10 | IMPORTANTE | API | Reducir duplicacion 7.38% (accounting module) | M | Mantenibilidad |
| 11 | IMPORTANTE | API | Fix circular dep dte↔webhooks | S | Estabilidad |
| 12 | IMPORTANTE | Web | Fix circular dep QuickSetup↔Validation | S | Estabilidad |
| 13 | IMPORTANTE | Docker | Optimizar API Dockerfile (quitar doble install) | S | Build speed |
| 14 | IMPORTANTE | Deps | Quitar @nestjs/schedule de root | XS | Limpieza |
| 15 | IMPORTANTE | Web | Habilitar ESLint en builds | S-M | Calidad |
| 16 | IMPORTANTE | Code | Eliminar 53 tipos `any` (41 API + 12 Web) | M | Type safety |
| 17 | IMPORTANTE | Web | Implementar next/image donde aplique | S | Performance |
| 18 | IMPORTANTE | Docker | Completar .dockerignore | XS | Seguridad |
| 19 | MEJORA | Web | Optimizar re-renders (memo audit) | M | UX |
| 20 | MEJORA | Web | Migrar a React Query/SWR | L | DX/UX |
| 21 | MEJORA | API | Servicios DTE mas granulares | XL | Arquitectura |
| 22 | MEJORA | DB | Refactor TenantEmailConfig (estrategia) | L | Arquitectura |
| 23 | MEJORA | API | Agregar prisma.$transaction() criticas | M | Data integrity |
| 24 | MEJORA | Web | Limpiar archivos muertos (.bak, .legacy) | XS | Limpieza |
| 25 | MEJORA | Web | Limpiar 16 console.log debug | XS | Limpieza |
| 26 | MEJORA | Config | Alinear TS version en Web | XS | Consistencia |
| 27 | MEJORA | Config | Fix next.config.js env deprecado | XS | Seguridad |
| 28 | MEJORA | Web | Extraer componente notificaciones (dup header) | S | DRY |

**Leyenda esfuerzo:** XS (<2h), S (medio dia), M (2-3 dias), L (4-7 dias), XL (1-2 semanas)

---

*Generado con Claude Code — auditoria automatizada + revision manual de codigo*
