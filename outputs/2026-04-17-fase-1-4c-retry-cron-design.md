# Fase 1.4c — ReceivedDTE Retry Cron (design spec)

**Fecha:** 2026-04-17
**Fase:** 1.4c (tercera y última sub-fase dentro de Fase 1.4)
**Depende de:** PRs #89, #90, #91, #92 merged a main ✅
**Plan:** se genera después vía `superpowers:writing-plans`

**Propósito:** background cron service que re-verifica `ReceivedDTE` con `ingestStatus ∈ {VERIFY_TIMEOUT_RETRY, VERIFY_5XX_RETRY, VERIFY_AUTH_RETRY}` contra la API MH. Cierra el loop de Fase 1.4a (que persistió el DTE con retry state esperando que MH volviera disponible). Usa exponential backoff + max 6 attempts antes de flag permanente `UNVERIFIED`.

---

## 0. Decisiones locked

| # | Decisión | Elegido |
|---|---|---|
| D1 | Retry timing strategy | **B:** exponential backoff 5/10/20/40/80/160 min, max 6 attempts. AUTH retry especial: siempre 5 min. Cron corre cada 5 min. |
| D2 | Batch cap per cron run | 50 DTEs máximo por invocación. Resto espera al próximo run. |
| D3 | Concurrency per tenant | Hasta 5 verify calls paralelos via Promise.allSettled + semáforo. |
| D4 | Final `UNVERIFIED` status | Manual recovery only. Fase 2 UI tendrá botón "retry now" que resetea attempts. No auto-resurrección. |
| D5 | Multi-node coordination | Single-node asumido. Optimistic concurrency con `WHERE attempts = X` en UPDATE para safety limitada. Multi-node lock → post-MVP. |
| D6 | Status mapping on verify success | Reusar `MH_TO_INGEST` de Fase 1.4a (export desde `DteImportService`). DRY. |

---

## 1. Alcance (IN / OUT)

**IN Fase 1.4c:**
- `ReceivedDteRetryCronService` en `apps/api/src/modules/dte/services/`
- `@Cron('*/5 * * * *')` decorator → handler method `handleRetryBatch()`
- Pure function `nextRetryGapMinutes(attempts, status)` exportada
- Method `retryOne(receivedDteId)` expuesto para tests + futura UI "retry now"
- New valid `ingestStatus` value: `'UNVERIFIED'` (contrato aplicación, no schema change)
- Export de `MH_TO_INGEST` desde `DteImportService` para reuso
- Unit tests (~12 casos)

**OUT (diferido):**
- Alertas / notificaciones por email cuando DTE llega a UNVERIFIED → **Fase 2+ notificaciones**
- Reset UX en UI ("retry now" button que resetea attempts=0) → **Fase 2 UI**
- Métricas / Sentry events sobre RETRY_5XX persistente → **Fase 2+ observability**
- Multi-node lock (`sp_getapplock` / Redis) → **post-MVP**
- Per-tenant configurable retry strategy → **post-MVP**
- Auto-creación de Purchase cuando DTE pasa a VERIFIED via retry → **NO** (user invoca `PurchasesService.createFromReceivedDte()` manualmente cuando ve el estado en UI)

---

## 2. Módulo + archivos

**Create:**
- `apps/api/src/modules/dte/services/received-dte-retry-cron.service.ts`
- `apps/api/src/modules/dte/services/received-dte-retry-cron.service.spec.ts`

**Modify:**
- `apps/api/src/modules/dte/services/dte-import.service.ts` — **export** `MH_TO_INGEST` constant para reuso
- `apps/api/src/modules/dte/dte.module.ts` — registrar nuevo service como provider

**No schema changes.** El valor `'UNVERIFIED'` es un nuevo string válido para `ingestStatus` — el campo sigue siendo `String @db.NVarChar(20)` (no Prisma enum) — zero migration. Existing index `@@index([tenantId, ingestStatus, lastMhVerifyAt])` (creado en Fase 1.4a) sirve para el query del cron sin modificación.

---

## 3. Contratos públicos

```typescript
// received-dte-retry-cron.service.ts

import { Cron } from '@nestjs/schedule';
import type { MhVerifyStatus } from './mh-dte-consulta.service';

/** Pure function — minutes to wait before next retry for this attempt count + status */
export function nextRetryGapMinutes(
  attempts: number,
  status: 'VERIFY_TIMEOUT_RETRY' | 'VERIFY_5XX_RETRY' | 'VERIFY_AUTH_RETRY',
): number;

export const MAX_ATTEMPTS = 6;

export interface RetryBatchReport {
  scannedCount: number;       // candidates cargados de DB
  skippedGapCount: number;    // skipped por nextGap no elapsed
  skippedAuthCount: number;   // skipped por token failure del tenant
  retriedCount: number;       // verify invocado
  verifiedCount: number;      // terminó en VERIFIED
  terminalCount: number;      // terminó en FAILED_* / STRUCTURAL_OK
  finalizedCount: number;     // hit max attempts → UNVERIFIED
  stillRetryingCount: number; // sigue en RETRY_*, attempts++
  errorCount: number;         // exceptions inesperadas (log + continue)
  durationMs: number;
}

export interface RetryResult {
  receivedDteId: string;
  previousStatus: string;
  newStatus: string;
  previousAttempts: number;
  newAttempts: number;
  optimisticLockConflict?: boolean;  // true si UPDATE no matchó (otro proceso avanzó)
}

@Injectable()
export class ReceivedDteRetryCronService {
  @Cron('*/5 * * * *', { name: 'received-dte-retry' })
  async handleRetryBatch(): Promise<RetryBatchReport>;

  async retryOne(receivedDteId: string): Promise<RetryResult>;
}
```

**Exceptions:**
- `retryOne(id)` con id inexistente → `NotFoundException`
- `retryOne(id)` con DTE en status NO-retry (VERIFIED/FAILED_*/STRUCTURAL_OK/UNVERIFIED) → `PreconditionFailedException` ("DTE is not in a retry state")

---

## 4. `nextRetryGapMinutes()` — backoff function

Pura, sin state, fácil de testear:

```typescript
export function nextRetryGapMinutes(
  attempts: number,
  status: 'VERIFY_TIMEOUT_RETRY' | 'VERIFY_5XX_RETRY' | 'VERIFY_AUTH_RETRY',
): number {
  // AUTH: token expired/rejected. Not a network backoff — fix is re-auth.
  // Always 5 min (allow MhAuthService cache + refresh cycle to complete).
  if (status === 'VERIFY_AUTH_RETRY') return 5;

  // TIMEOUT / 5XX: exponential backoff
  // attempts=1 → 5 min; attempts=2 → 10 min; ...; attempts=6 → 160 min (cap)
  const gap = 5 * Math.pow(2, Math.max(0, attempts - 1));
  return Math.min(gap, 160);
}
```

Matriz:

| attempts | TIMEOUT / 5XX | AUTH |
|---|---|---|
| 1 | 5 min | 5 min |
| 2 | 10 min | 5 min |
| 3 | 20 min | 5 min |
| 4 | 40 min | 5 min |
| 5 | 80 min | 5 min |
| 6 | 160 min | 5 min |

Cumulative coverage (TIMEOUT/5XX): 5 + 10 + 20 + 40 + 80 + 160 = **315 min ≈ 5.25 horas** de MH downtime cubierto antes de UNVERIFIED.

---

## 5. Core algorithm (`handleRetryBatch`)

```
INPUT: (invoked by @Cron every 5 min)

1. Query candidates — single findMany:
   findMany({
     where: {
       ingestStatus: { in: ['VERIFY_TIMEOUT_RETRY', 'VERIFY_5XX_RETRY', 'VERIFY_AUTH_RETRY'] },
       mhVerifyAttempts: { lt: MAX_ATTEMPTS },
     },
     orderBy: { lastMhVerifyAt: 'asc' },  // oldest first
     take: 50,  // batch cap
   });
   → scannedCount = candidates.length

2. In-memory filter by gap:
   retryable = candidates.filter(c => {
     const gapMs = nextRetryGapMinutes(c.mhVerifyAttempts, c.ingestStatus) * 60_000;
     const elapsed = Date.now() - (c.lastMhVerifyAt?.getTime() ?? 0);
     return elapsed >= gapMs;
   });
   → skippedGapCount = scannedCount - retryable.length

3. Group retryable by tenantId:
   groups = Map<tenantId, ReceivedDTE[]>

4. Por cada group (secuencial entre tenants, concurrente dentro):
   4a. Resolve MH auth (una sola vez por tenant):
       const auth = await resolveMhAuth(tenantId)  // reuso pattern de Fase 1.4a
       - If tenant/config missing o getToken throws:
         - skippedAuthCount += group.length
         - Log warning: "Tenant X has no valid MH auth, skipping N retries"
         - continue next tenant (no update on DTEs, próximo cron reintenta)
   
   4b. Process group concurrently (max 5 at a time):
       - Semáforo con array chunking: process 5 at a time until done
       - For each DTE:
         try {
           const verifyResult = await consulta.verify({
             codigoGeneracion: dte.codigoGeneracion,
             ambiente: auth.ambiente,
             mhToken: auth.token,
             timeoutMs: 5000,
           });
           retriedCount += 1
           await this.applyVerifyResult(dte, verifyResult, report)
         } catch (err) {
           errorCount += 1
           logger.error(`Retry failed for DTE ${dte.id}: ${err.message}`)
         }

5. Log summary + return report

Performance expectation: 50 DTEs × 5 concurrent × ~200ms avg = ~2 sec per batch.
```

### `applyVerifyResult()` helper

```
INPUT: dte (current state), verifyResult (MhVerifyResult), report (mutable counters)

1. Compute newAttempts = dte.mhVerifyAttempts + 1

2. Compute newStatus based on verifyResult.status:
   switch (verifyResult.status) {
     case 'VERIFIED':
       newStatus = 'VERIFIED'; verifiedCount++; break;
     case 'HARD_FAIL_NOT_FOUND':
       newStatus = 'FAILED_MH_NOT_FOUND'; terminalCount++; break;
     case 'HARD_FAIL_MISMATCH':
       newStatus = 'STRUCTURAL_OK'; terminalCount++; break;
     case 'RETRY_TIMEOUT':
     case 'RETRY_5XX':
     case 'RETRY_AUTH':
     case 'UNKNOWN_ERROR':
       if (newAttempts >= MAX_ATTEMPTS) {
         newStatus = 'UNVERIFIED';
         finalizedCount++;
         mhVerifyError = 'Max retry attempts reached. Manual intervention required.';
       } else {
         newStatus = MH_TO_INGEST[verifyResult.status];  // maintain RETRY_* variant
         stillRetryingCount++;
       }
   }

3. UPDATE with optimistic concurrency:
   prisma.receivedDTE.updateMany({
     where: {
       id: dte.id,
       mhVerifyAttempts: dte.mhVerifyAttempts,  // lock: must still match previous count
     },
     data: {
       ingestStatus: newStatus,
       mhVerifyAttempts: newAttempts,
       lastMhVerifyAt: new Date(),
       mhVerifyError: verifyResult.errorMessage ?? null,
       // If VERIFIED, propagate sello + fh:
       ...(newStatus === 'VERIFIED' && verifyResult.mhSelloRecepcion
           ? { selloRecepcion: verifyResult.mhSelloRecepcion }
           : {}),
       ...(newStatus === 'VERIFIED' && verifyResult.mhFhProcesamiento
           ? { fhProcesamiento: verifyResult.mhFhProcesamiento }
           : {}),
     },
   });

4. If updateMany returned count=0 → another process updated this DTE first. Log warning.
```

---

## 6. `retryOne(receivedDteId)` — manual entry

```
1. Load ReceivedDTE by id
   if not found → NotFoundException

2. Validate status is retry-eligible:
   if status not in ['VERIFY_TIMEOUT_RETRY', 'VERIFY_5XX_RETRY', 'VERIFY_AUTH_RETRY']
     → PreconditionFailedException

3. Resolve MH auth for this tenant (same helper as handleRetryBatch)
   if auth fails → throw (manual caller needs to know)

4. verify + applyVerifyResult (same logic as batch)

5. Return RetryResult { previousStatus, newStatus, previousAttempts, newAttempts }
```

**NO** verifica gap elapsed — manual retry es inmediato (Fase 2 UI "retry now" user action).

**NO** resetea `mhVerifyAttempts`. Si UI quiere full reset, lo hace en una query separada antes de llamar `retryOne`.

---

## 7. Testing (~12 casos unit)

**Pure function** `nextRetryGapMinutes()` (3):
1. `attempts=1, status=TIMEOUT → 5`
2. `attempts=6, status=5XX → 160` (cap)
3. `attempts=5, status=AUTH → 5` (override)

**`retryOne()` con mocks** (6):
4. Happy: status=RETRY_TIMEOUT, verify→VERIFIED → newStatus=VERIFIED, attempts++, selloRecepcion set
5. Max hit: attempts=5, verify→RETRY_TIMEOUT → newStatus=UNVERIFIED, attempts=6, mhVerifyError set
6. Terminal NOT_FOUND: verify→HARD_FAIL_NOT_FOUND → newStatus=FAILED_MH_NOT_FOUND
7. Terminal MISMATCH: verify→HARD_FAIL_MISMATCH → newStatus=STRUCTURAL_OK
8. AUTH still auth: verify→RETRY_AUTH → newStatus stays VERIFY_AUTH_RETRY, attempts++
9. Not-found DTE id → NotFoundException
10. DTE in non-retry status (e.g. VERIFIED) → PreconditionFailedException

**`handleRetryBatch()` con mocks** (3):
11. Batch cap: 60 candidates in DB mock → findMany's `take: 50` honored → only 50 processed. Report: scannedCount=50.
12. Gap filter: 5 candidates, 2 with lastMhVerifyAt too recent → skippedGapCount=2, retriedCount=3
13. Multi-tenant: 2 tenants con 2 y 3 DTEs respectively → `mhAuth.getToken` llamado 2 veces (una por tenant), 5 `verify` calls total, report agregado correcto

**Mocks:** patrón de Fase 1.4a/1.4b (manual mock de Prisma, MhDteConsultaService, MhAuthService).

---

## 8. Open decisions — diferidas

| # | Item | Futuro |
|---|---|---|
| O1 | Multi-node coordination (`sp_getapplock` / Redis mutex) | Post-MVP cuando escalemos a > 1 Azure App Service instance |
| O2 | Fase 2 UI "reset & retry" botón que hace `attempts=0` + llama `retryOne` | Fase 2 |
| O3 | Per-tenant configurable retry strategy (intervals/maxAttempts) | Post-MVP |
| O4 | Observability — Sentry events para RETRY_5XX persistente, métricas Prometheus-style | Fase 2+ |
| O5 | Notificación email al tenant cuando DTEs llegan a UNVERIFIED | Fase 2+ |
| O6 | Auto-crear Purchase cuando DTE pasa a VERIFIED via retry | **NO** — user invoca manual en Fase 2 UI |

---

## 9. Checklist de aprobación

- [ ] §1 alcance — solo retry cron + util function, sin Purchase auto-create ni alertas
- [ ] §2 módulo — extensión del `dte` module, no schema changes
- [ ] §3 contratos — `handleRetryBatch()`, `retryOne()`, `nextRetryGapMinutes()`
- [ ] §4 backoff function — exponential 5/10/20/40/80/160 min, AUTH override a 5 min
- [ ] §5 algorithm — query, gap filter, tenant group, concurrency 5, optimistic UPDATE
- [ ] §6 `retryOne` — manual entry sin gap check ni attempts reset
- [ ] §7 tests — 12 casos (3 pure + 6 retryOne + 3 handleRetryBatch)

Una vez aprobado, invoco `superpowers:writing-plans` para plan tarea-por-tarea.
