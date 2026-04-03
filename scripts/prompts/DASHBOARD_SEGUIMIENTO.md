# DASHBOARD DE SEGUIMIENTO — Facturosv.com Backlog

**Última actualización**: [Hoy]  
**Status**: 🟡 SIN INICIAR  
**Timeline**: 8 semanas | Equipos: 2-3 devs  

---

## 📈 OVERVIEW DE PROGRESO

### Puntuación General
```
INICIO:          68/100  🔴 ALTO RIESGO
TARGET POST-1:   82/100  🟠 MEDIO-BAJO
TARGET POST-2:   86/100  🟠 MEDIO-BAJO
TARGET POST-3:   90/100  🟢 BAJO
TARGET FINAL:    95/100  🟢 BAJO

PROGRESO: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
```

### Puntos de Historia Completados
```
Sprint 1: 0 / 28 puntos  (0%)   ░░░░░░░░░░░░░░░░░░░░
Sprint 2: 0 / 25 puntos  (0%)   ░░░░░░░░░░░░░░░░░░░░
Sprint 3: 0 / 28 puntos  (0%)   ░░░░░░░░░░░░░░░░░░░░
Sprint 4: 0 / 21 puntos  (0%)   ░░░░░░░░░░░░░░░░░░░░
────────────────────────────────────────────────────
TOTAL:   0 / 102 puntos  (0%)   ░░░░░░░░░░░░░░░░░░░░
```

---

## 🔴 SPRINT 1: BLOQUEANTES DE SEGURIDAD (Semana 1-2)

**Timeline**: 10 días | **Puntos**: 28 | **Status**: 🟡 PENDIENTE

### Tareas

| # | Tarea | Asignado | Puntos | Status | Blockers |
|---|-------|----------|--------|--------|----------|
| 1.1 | TransmitterController @UseGuards | [ ] | 3 | ⬜ | — |
| 1.2 | SignerController @UseGuards | [ ] | 3 | ⬜ | Bloq. por 1.1 |
| 1.3 | Rate Limiting (@nestjs/throttler) | [ ] | 5 | ⬜ | — |
| 1.4 | Tests Cross-Tenant Isolation | [ ] | 8 | ⬜ | Bloq. por 1.1-1.3 |
| 1.5 | JWT tenantId Validation | [ ] | 2 | ⬜ | — |
| 1.6 | E2E Tests Controllers | [ ] | 5 | ⬜ | Bloq. por 1.1-1.2 |
| 1.7 | Documentación Sprint 1 | [ ] | 2 | ⬜ | — |

**Hitos**:
- [ ] Día 2: 1.1 + 1.2 completado (rate limiting controllers protegidos)
- [ ] Día 5: 1.3 completado (rate limiting en prod)
- [ ] Día 8: Tests multi-tenant completados
- [ ] Día 10: Merge a main, documentación final

**Criterios de Éxito Sprint 1**:
- [ ] 0 endpoints sin autenticación
- [ ] 0 IDOR vulnerabilities
- [ ] 20+ tests de aislamiento pasando
- [ ] Puntuación de seguridad: 9/10 (mejora de 6/10)
- [ ] Todos los tests CI/CD pasando

---

## 🟠 SPRINT 2: PERFORMANCE & RELIABILITY (Semana 3-4)

**Timeline**: 10 días | **Puntos**: 25 | **Status**: 🟡 PENDIENTE

### Tareas

| # | Tarea | Asignado | Puntos | Status | Dependencias |
|---|-------|----------|--------|--------|--------------|
| 2.1 | Fix N+1 Accounting | [ ] | 5 | ⬜ | — |
| 2.2 | Índices Compuestos DB | [ ] | 3 | ⬜ | — |
| 2.3 | Connection Pooling Config | [ ] | 2 | ⬜ | — |
| 2.4 | Structured Logging (Pino) | [ ] | 5 | ⬜ | — |
| 2.5 | npm audit en CI | [ ] | 2 | ⬜ | — |
| 2.6 | Service Tests (Auth, Signer, Transmitter) | [ ] | 8 | ⬜ | Bloq. por Sprint 1 |

**Hitos**:
- [ ] Día 2: N+1 fixed, índices en Azure SQL
- [ ] Día 4: Logging estructurado en prod
- [ ] Día 7: Service tests completados
- [ ] Día 10: Merge a main

**Criterios de Éxito Sprint 2**:
- [ ] Query latency: p95 < 500ms (verified con k6)
- [ ] Connection pool: 50 conexiones configuradas
- [ ] Test coverage: 50%+ global (mejora de 22%)
- [ ] 0 npm audit issues en CI

---

## 🟡 SPRINT 3: RELIABILITY & ASYNC (Semana 5-6)

**Timeline**: 12 días | **Puntos**: 28 | **Status**: 🟡 PENDIENTE

### Tareas

| # | Tarea | Asignado | Puntos | Status | Dependencias |
|---|-------|----------|--------|--------|--------------|
| 3.1 | DTE Async + BullMQ | [ ] | 8 | ⬜ | Bloq. por Sprint 2 |
| 3.2 | Row-Level Security (Azure SQL) | [ ] | 5 | ⬜ | — |
| 3.3 | httpOnly Cookies (XSS mitigation) | [ ] | 5 | ⬜ | — |
| 3.4 | Non-root Docker (API) | [ ] | 2 | ⬜ | — |
| 3.5 | Refactorizar Servicios >1000 líneas | [ ] | 8 | ⬜ | Bloq. por Sprint 2 |

**Hitos**:
- [ ] Día 3: DTE async + retry logic funcionando
- [ ] Día 6: RLS en Azure SQL validado
- [ ] Día 9: Services refactorizados
- [ ] Día 12: Merge a main

**Criterios de Éxito Sprint 3**:
- [ ] HTTP response time para finalize: < 100ms (mejora de 5s)
- [ ] DTE retransmisión con exponential backoff
- [ ] RLS bloquea queries incorrectas
- [ ] Docker non-root UID 1001

---

## 🟡 SPRINT 4: TECH DEBT & POLISH (Semana 7-8)

**Timeline**: 8 días | **Puntos**: 21 | **Status**: 🟡 PENDIENTE

### Tareas

| # | Tarea | Asignado | Puntos | Status | Dependencias |
|---|-------|----------|--------|--------|--------------|
| 4.1 | ESLint Configuración | [ ] | 3 | ⬜ | — |
| 4.2 | Eliminar todos 'any' (37 → 0) | [ ] | 5 | ⬜ | Bloq. por Sprint 2 |
| 4.3 | Coverage 80%+ Global | [ ] | 5 | ⬜ | Bloq. por Sprint 3 |
| 4.4 | Documentación Completa | [ ] | 3 | ⬜ | — |
| 4.5 | Performance Testing (k6) | [ ] | 5 | ⬜ | Bloq. por Sprint 3 |

**Hitos**:
- [ ] Día 2: ESLint + 'any' eliminados
- [ ] Día 4: Coverage 80%+
- [ ] Día 6: k6 load tests completados
- [ ] Día 8: Merge a main, release ready

**Criterios de Éxito Sprint 4**:
- [ ] 0 ESLint errors
- [ ] 0 declaraciones de 'any'
- [ ] Coverage global: 80%+ (mejora de 35%)
- [ ] k6 test: 100 users concurrentes, p95 < 500ms
- [ ] 7+ docs completas

---

## 📋 DETAILED TASK CHECKLIST

### Sprint 1.1 — TransmitterController @UseGuards

**Fecha estimada**: Día 1-2  
**Status**: ⬜ TODO  

Subtareas:
- [ ] Agregar @UseGuards(JwtAuthGuard) a controlador
- [ ] Validar tenantId en servicio
- [ ] Tests: auth fail, wrong tenant, success
- [ ] Code review
- [ ] Merge a develop

Commits esperados:
```
✅ feat(security): protect transmitter with jwt auth guard
✅ test(transmitter): add auth validation tests
```

---

### Sprint 1.2 — SignerController @UseGuards

**Fecha estimada**: Día 2-3  
**Status**: ⬜ TODO  

Subtareas:
- [ ] Actualizar schema: agregra Certificate.tenantId
- [ ] Migración Prisma: `prisma migrate dev`
- [ ] Agregar @UseGuards(JwtAuthGuard)
- [ ] Cambiar servicio para tenant-scoped
- [ ] Tests: auth fail, per-tenant, success
- [ ] Code review

Commits esperados:
```
✅ feat(db): add per-tenant certificate support
✅ feat(security): protect signer with jwt auth guard
```

---

### Sprint 1.3 — Rate Limiting

**Fecha estimada**: Día 3-5  
**Status**: ⬜ TODO  

Subtareas:
- [ ] `npm install @nestjs/throttler @nestjs/cache-manager`
- [ ] Configurar ThrottlerModule en AppModule
- [ ] Aplicar decorators a endpoints críticos
- [ ] Tests: alcanzar límite, reset, headers
- [ ] Load test para validar rate limiting
- [ ] Code review

Commits esperados:
```
✅ feat(security): implement rate limiting with throttler
✅ test(throttler): add rate limit validation tests
```

---

### Sprint 1.4 — Tests Cross-Tenant

**Fecha estimada**: Día 6-8  
**Status**: ⬜ TODO  

Subtareas:
- [ ] Crear `test/multi-tenant-isolation.spec.ts`
- [ ] Setup: 2 tenants, datos en cada uno
- [ ] Tests DTE access control (5+)
- [ ] Tests Client access control (5+)
- [ ] Tests Auth & tokens (3+)
- [ ] Tests Quotes (2+)
- [ ] Tests Accounting (2+)
- [ ] Ejecutar y validar pase 20/20
- [ ] Code review

Commits esperados:
```
✅ test(e2e): add comprehensive multi-tenant isolation tests
```

---

### (Continúa para cada tarea...)

---

## 🔍 MÉTRICAS POR SPRINT

### Sprint 1
```
Puntos completados:    0 / 28
% Completado:          0%
Issues resueltos:      0
Tests nuevos:          0/20+
Bugs encontrados:      0
```

### Sprint 2
```
Puntos completados:    0 / 25
% Completado:          0%
Performance gain:      0%
Coverage improvement:  0% (22% → ?)
```

### Sprint 3
```
Puntos completados:    0 / 28
% Completado:          0%
Async endpoints:       0 / 1 implementado
```

### Sprint 4
```
Puntos completados:    0 / 21
% Completado:          0%
Test coverage:         0% (35% → ?)
Code quality:          0 ESLint errors
```

---

## 🎯 GATES DE QUALITY

### Pre-Sprint 1
```
✅ Auditoría completada
✅ Backlog priorizado
✅ Equipo onboarded
⬜ Sprint 1 iniciado
```

### Pre-Sprint 2
```
⬜ Sprint 1 completado 100%
⬜ 0 CRÍTICOs pendientes
⬜ Seguridad validada
⬜ Sprint 2 iniciado
```

### Pre-Sprint 3
```
⬜ Sprint 2 completado 100%
⬜ Performance validada (k6 test)
⬜ Tests coverage >= 50%
⬜ Sprint 3 iniciado
```

### Pre-Sprint 4
```
⬜ Sprint 3 completado 100%
⬜ RLS en prod validado
⬜ Async processing tested
⬜ Sprint 4 iniciado
```

### Pre-Launch
```
⬜ Sprint 4 completado 100%
⬜ Coverage >= 80%
⬜ 0 ESLint errors
⬜ Load test: 100 users, p95 < 500ms
⬜ Documentación completa
⬜ Security review final
⬜ 🚀 READY FOR PRODUCTION
```

---

## 📊 RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|-----------|
| Retrasos en dependencias de Sprint 1 | MEDIA | ALTO | Start en paralelo donde sea posible |
| Bugs encontrados en testing | MEDIA | MEDIO | Extended testing, pair programming |
| Azure SQL RLS complejidad | BAJA | MEDIO | Consultor DBA si es necesario |
| Performance no cumple SLOs | BAJA | ALTO | Load testing weekly |

---

## 📅 CALENDAR VIEW

```
SEMANA 1
┌─────────────────────────────┐
│ Lun 10  │ Mar 11 │ Mié 12 │ Jue 13 │ Vie 14
│ Sprint 1 inicio (1.1-1.2)
└─────────────────────────────┘

SEMANA 2
┌─────────────────────────────┐
│ Lun 17  │ Mar 18 │ Mié 19 │ Jue 20 │ Vie 21
│ Sprint 1 fin (1.3-1.7)
│ Sprint 1 code review & merge
└─────────────────────────────┘

SEMANA 3
┌─────────────────────────────┐
│ Lun 24  │ Mar 25 │ Mié 26 │ Jue 27 │ Vie 28
│ Sprint 2 inicio (2.1-2.3)
└─────────────────────────────┘

... (continúa)

SEMANA 8 (Final)
┌─────────────────────────────┐
│ Lun 14  │ Mar 15 │ Mié 16 │ Jue 17 │ Vie 18 (abril)
│ Sprint 4 fin, release final
│ 🎉 LAUNCH READY
└─────────────────────────────┘
```

---

## 💬 NOTAS DE SEGUIMIENTO

### [Escribir después de cada sprint]

**POST-SPRINT 1 (Día 10)**:
```
[ ] Completado: SÍ / NO
[ ] Puntos: X / 28
[ ] Issues: [ ]
[ ] Bloqueadores: [ ]
[ ] Notas:
```

**POST-SPRINT 2 (Día 20)**:
```
[ ] Completado: SÍ / NO
[ ] Puntos: X / 25
[ ] Performance: p95 latency = ?ms
[ ] Coverage: ?% (target 50%+)
```

**POST-SPRINT 3 (Día 32)**:
```
[ ] Completado: SÍ / NO
[ ] Puntos: X / 28
[ ] DTE async transmission: working?
[ ] RLS validado: YES / NO
```

**POST-SPRINT 4 (Día 40 — FINAL)**:
```
[ ] Completado: SÍ / NO
[ ] Puntos: X / 21
[ ] Coverage: ?% (target 80%+)
[ ] Load test results: ?
[ ] LAUNCH APPROVED: YES / NO
```

---

## 🚀 DEPLOYMENT CHECKLIST

**Antes de lanzar a producción**:
- [ ] Todos 4 sprints completados
- [ ] Puntuación >= 92/100
- [ ] 0 CRÍTICOS pendientes
- [ ] Coverage >= 80%
- [ ] Load test: 100 users, p95 < 500ms
- [ ] Security review final: PASSED
- [ ] Documentación completada
- [ ] Team training completado
- [ ] Rollback plan definido
- [ ] Monitoring/alerting configurado

**Post-deployment (primeros 7 días)**:
- [ ] Error rate < 0.1%
- [ ] Uptime >= 99.9%
- [ ] Load < 50% capacity
- [ ] Customer support: cero issues de escalabilidad

---

**Generado**: 9 de marzo de 2026  
**Próxima revisión**: Post-Sprint 1 (Día 10)  
**Actualizar este documento**: Semanalmente
