# Fase 1.4a — DTE Import Orchestrator (design spec)

**Fecha:** 2026-04-17
**Fase:** 1.4a (primera de tres sub-fases dentro de Fase 1.4)
**Depende de:** PR #89 (Fase 1.2 schema) **merged** + PR #90 (Fase 1.3 parser) **merged**
**Plan:** se genera después vía `superpowers:writing-plans`

**Propósito:** construir el orquestador `DteImportService` que compone el parser puro (Fase 1.3) + el verifier MH (Fase 1.3) + persistencia al `ReceivedDTE` (schema de Fase 1.2). No crea `Purchase` (eso es Fase 1.4b), no corre retries en background (Fase 1.4c). Cierra el loop "JSON entrante → fila en DB con `ingestStatus` correcto, dedupe hash-based, metadata para retry".

---

## 0. Decisiones locked

| # | Decisión | Elegido |
|---|---|---|
| D1 | Sub-alcance dentro de Fase 1.4 | **A:** split en 1.4a + 1.4b + 1.4c (este doc es 1.4a únicamente) |
| D2 | Dedupe en `codigoGeneracion` ya existente | **C:** hybrid hash-compare — mismo hash=idempotente silencioso, hash distinto=ConflictException |
| D3 | Persistencia en casos RETRY (timeout / 5xx / auth) | **A:** persistir con `VERIFY_*_RETRY` + retornar resultado completo al caller; retry lo hace 1.4c async |

---

## 1. Alcance (IN / OUT)

**IN para Fase 1.4a:**
- `DteImportService` con método público `ingest(params)` → `IngestResult`
- 4 campos nuevos en `ReceivedDTE`: `rawPayloadHash`, `mhVerifyAttempts`, `lastMhVerifyAt`, `mhVerifyError`
- 2 nuevos índices en `ReceivedDTE` para dedupe + retry lookups
- `IngestStatus` enum-like type definiendo los 7 estados válidos
- Mapeo `MhVerifyStatus` → `IngestStatus`
- Unit tests con mocks de parser / verifier / MhAuthService / Prisma
- Registro del service en `DteModule` (providers + exports)

**OUT (diferido):**
- Creación de `Purchase` + `PurchaseLineItem` desde ReceivedDTE → **Fase 1.4b**
- Supplier upsert (Cliente con `isSupplier=true`) → Fase 1.4b
- Catálogo matching por `codigo` → Fase 1.4b
- Asiento contable automático vía `AccountingAutomationService.generateFromPurchase()` → Fase 1.4b
- Background retry job para `VERIFY_*_RETRY` → **Fase 1.4c**
- Controller HTTP / endpoint upload → **Fase 2 (frontend)**
- OCR / PDF → JSON → Fase 2
- `skipVerify: true` flag (compras en papel / contingencia) → Fase 1.4b (controller-level)
- Webhook entrante (proveedor push) → post-MVP

---

## 2. Módulo + archivos

```
apps/api/src/modules/dte/
├── services/
│   ├── dte-import-parser.service.ts   (existente — Fase 1.3)
│   ├── mh-dte-consulta.service.ts     (existente — Fase 1.3)
│   ├── dte-import.service.ts          ← NUEVO (Fase 1.4a)
│   └── dte-import.service.spec.ts     ← NUEVO
├── dte.module.ts                      — agregar provider + exports
└── ... (resto intacto)

apps/api/prisma/
└── schema.prisma                       — 4 campos + 2 índices nuevos en model ReceivedDTE
```

**Por qué esta ubicación:**
- Parser + verifier ya viven en `dte/services/` → el orquestador que los compone sigue el mismo patrón y comparte módulo.
- Fase 1.4b creará `PurchasesModule` que importará `DteModule` (exporting `DteImportService`) — separación natural entre "ingest de DTE" (dte) y "crear Purchase" (purchases).

---

## 3. Schema additions

```prisma
model ReceivedDTE {
  // ... campos existentes (Fase 1.2) ...

  // Fase 1.4a additions
  rawPayloadHash   String    @db.NVarChar(64)   // SHA256 hex — 64 chars
  mhVerifyAttempts Int       @default(0)
  lastMhVerifyAt   DateTime?
  mhVerifyError    String?   @db.NVarChar(500)  // último error de MH verify (debug)

  @@unique([tenantId, codigoGeneracion])         // existente Fase 1.2
  @@index([tenantId, ingestStatus])              // existente
  @@index([tenantId, emisorNIT])                 // existente
  @@index([tenantId, rawPayloadHash])            // NUEVO — dedupe lookup
  @@index([tenantId, ingestStatus, lastMhVerifyAt]) // NUEVO — retry job (1.4c) lookup
}
```

**Migración:** tabla `received_dtes` en staging está vacía (verificado en Fase 1.2 smoke tests) → `db push` aplica sin backfill. `rawPayloadHash` NOT NULL seguro.

**Si Fase 1.2 aún no mergeó a main cuando esto arranque**, el plan debe incluir un paso de espera o branching adecuado — ver §11.

---

## 4. Contratos públicos

```typescript
// apps/api/src/modules/dte/services/dte-import.service.ts

import { DteImportParserService, ParseError } from './dte-import-parser.service';
import { MhDteConsultaService, MhVerifyResult, MhVerifyStatus } from './mh-dte-consulta.service';

/** Estados finales tras ingest() */
export type IngestStatus =
  | 'VERIFIED'                // parse OK + MH confirmó (estado feliz)
  | 'STRUCTURAL_OK'           // parse OK, pero MH verify=HARD_FAIL_MISMATCH — flag manual review
  | 'FAILED_PARSE'            // parse rechazó (errores estructurales)
  | 'FAILED_MH_NOT_FOUND'     // MH dice el DTE no existe — fraude/typo, bloquea Purchase
  | 'VERIFY_TIMEOUT_RETRY'    // MH no respondió — 1.4c reintentará
  | 'VERIFY_5XX_RETRY'        // MH server error — 1.4c reintentará
  | 'VERIFY_AUTH_RETRY';      // token rechazado — 1.4c refrescará + reintentará

/** Fuente de ingesta (audit trail) */
export type IngestSource = 'JSON_UPLOAD' | 'OCR_PDF' | 'MANUAL_ENTRY' | 'API_WEBHOOK';

export interface IngestParams {
  tenantId: string;
  jsonString: string;            // raw DTE JSON sent by supplier
  createdBy: string;             // userId for audit
  source: IngestSource;
}

export interface IngestResult {
  receivedDteId: string;              // id del row en ReceivedDTE
  codigoGeneracion: string;
  ingestStatus: IngestStatus;
  isDuplicate: boolean;               // true si hash matchea registro existente
  existingReceivedDteId?: string;     // sólo presente si isDuplicate=true
  parseErrors: ParseError[];          // vacío si parse OK
  mhVerifyResult?: MhVerifyResult;    // undefined si parse falló (nunca llamamos MH)
}

@Injectable()
export class DteImportService {
  ingest(params: IngestParams): Promise<IngestResult>;
}
```

---

## 5. Flujo del `ingest()`

```
INPUT: { tenantId, jsonString, createdBy, source }

1. Parse
   result = parser.parse(jsonString)
   ├─ result.valid === false:
   │   ├─ Persist ReceivedDTE con: tipoDte='UNKNOWN' (o skip NOT NULL), emisorNIT='UNKNOWN',
   │   │   rawPayload, rawPayloadHash (de jsonString), ingestStatus='FAILED_PARSE',
   │   │   ingestErrors=JSON.stringify(result.errors), ingestSource, createdBy
   │   └─ return { receivedDteId, FAILED_PARSE, parseErrors, isDuplicate: false }
   └─ result.valid === true: continuar con result.data = ParsedDTE

2. Hash
   rawPayloadHash = crypto.createHash('sha256').update(jsonString).digest('hex')

3. Dedupe
   existing = prisma.receivedDTE.findUnique({
     where: { tenantId_codigoGeneracion: { tenantId, codigoGeneracion: data.codigoGeneracion } }
   })
   ├─ existing === null → continuar a paso 4
   ├─ existing exists && existing.rawPayloadHash === rawPayloadHash →
   │   return { receivedDteId: existing.id, existing.ingestStatus,
   │            isDuplicate: true, existingReceivedDteId: existing.id,
   │            parseErrors: [], mhVerifyResult: undefined }
   └─ existing exists && hashes differ →
      throw new ConflictException({
        message: 'codigoGeneracion already ingested with different content',
        existingReceivedDteId: existing.id,
        existingHash: existing.rawPayloadHash,
        newHash: rawPayloadHash,
      })

4. Resolve MH token + ambiente
   try:
     const haciendaConfig = await mhAuth.getHaciendaConfig(tenantId)  // includes ambiente
     const mhToken = await mhAuth.getActiveToken(tenantId)             // handles refresh internally
   catch (err: any):
     // No MH config / tenant not configured for MH
     throw new PreconditionFailedException(`Tenant ${tenantId} has no active MH config: ${err.message}`)

5. Verify against MH
   verifyResult = await consulta.verify({
     codigoGeneracion: data.codigoGeneracion,
     ambiente: haciendaConfig.ambiente,
     mhToken,
     timeoutMs: 5000,
   })

6. Map MhVerifyStatus → IngestStatus (lookup table)
   MhVerifyStatus          → IngestStatus
   ─────────────────────────────────────────
   VERIFIED                → VERIFIED
   HARD_FAIL_NOT_FOUND     → FAILED_MH_NOT_FOUND
   HARD_FAIL_MISMATCH      → STRUCTURAL_OK     (flag: needs manual review)
   RETRY_TIMEOUT           → VERIFY_TIMEOUT_RETRY
   RETRY_5XX               → VERIFY_5XX_RETRY
   RETRY_AUTH              → VERIFY_AUTH_RETRY
   UNKNOWN_ERROR           → VERIFY_5XX_RETRY  (treat as transient)

7. Persist ReceivedDTE (atomic — single INSERT)
   prisma.receivedDTE.create({
     data: {
       tenantId,
       tipoDte: data.tipoDte,
       numeroControl: data.numeroControl,
       codigoGeneracion: data.codigoGeneracion,
       selloRecepcion: verifyResult.mhSelloRecepcion ?? data.selloRecepcion,
       fhProcesamiento: verifyResult.mhFhProcesamiento ?? data.fhProcesamiento,
       fhEmision: parseIsoDateTime(data.fecEmi, data.horEmi),
       emisorNIT: data.emisor.nit ?? data.emisor.numDocumento ?? 'UNKNOWN',
       emisorNombre: data.emisor.nombre,
       rawPayload: jsonString,
       parsedPayload: JSON.stringify(data),
       rawPayloadHash,
       ingestStatus,
       ingestErrors: null,   // parse OK, no errors
       ingestSource: params.source,
       mhVerifyAttempts: 1,  // first attempt is this call
       lastMhVerifyAt: new Date(),
       mhVerifyError: verifyResult.errorMessage ?? null,
       createdBy: params.createdBy,
     }
   })

8. Return IngestResult
```

**Transacción:** no envolvemos todo en `prisma.$transaction` porque (a) HTTP call a MH puede tardar hasta 5s y bloquea DB locks, (b) operaciones son idempotentes (dedupe en paso 3 protege contra doble-INSERT). El único riesgo es: MH verify pasa, pero DB INSERT falla. En ese caso el cliente ve un error HTTP y reintenta; el próximo intento dedupe-skippea si el DTE fue insertado (improbable) o reingesta limpio (probable). Aceptable.

**Helper** `parseIsoDateTime(fecEmi, horEmi)`: concatena `YYYY-MM-DDTHH:MM:SS.000Z` y retorna `new Date()`. Local a este service.

---

## 6. Integración con `MhAuthService` y resolución del token

**API real existente (verificada):**

```typescript
class MhAuthService {
  // NIT del emisor (tenant), password de MH API, env ('test' | 'prod')
  async getToken(nit: string, password: string, env: MHEnvironment): Promise<TokenInfo>;
  // TokenInfo = { token: string; roles: string[]; obtainedAt: Date }
  // Cachea automáticamente (memoria + DB) y refresca si el token está por vencer.
}
```

**No existe** un helper tipo `getActiveTokenForTenant(tenantId)`. El orquestador resuelve la cadena manualmente con una sola query Prisma:

```typescript
// Dentro de DteImportService.ingest():

async function resolveMhAuth(tenantId: string): Promise<{ token: string; ambiente: '00' | '01' }> {
  const tenant = await this.prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      haciendaConfig: {
        include: { environmentConfig: true },  // tiene password + env
      },
    },
  });

  if (!tenant) {
    throw new PreconditionFailedException(`Tenant ${tenantId} not found`);
  }

  const hc = tenant.haciendaConfig;
  const envCfg = hc?.environmentConfig;
  if (!hc || !envCfg || !envCfg.password) {
    throw new PreconditionFailedException(
      `Tenant ${tenantId} has no active HaciendaConfig — cannot verify DTEs against MH`,
    );
  }

  const mhEnv = envCfg.ambiente === '01' ? 'prod' : 'test';  // MHEnvironment type
  const ambiente = envCfg.ambiente as '00' | '01';

  try {
    const tokenInfo = await this.mhAuth.getToken(tenant.nit, envCfg.password, mhEnv);
    return { token: tokenInfo.token, ambiente };
  } catch (err) {
    throw new PreconditionFailedException(
      `Failed to obtain MH token for tenant ${tenantId}: ${err instanceof Error ? err.message : 'unknown'}`,
    );
  }
}
```

**Notas:**
- La estructura exacta de `HaciendaConfig` y `HaciendaEnvironmentConfig` se verificará en el plan Task 1 (leer `schema.prisma` y ajustar `findUnique` si los nombres de campos difieren — p.ej. puede ser `haciendaPassword` en `environmentConfig` en lugar de `password`).
- El plan **debería evaluar** si conviene extraer esta función como un **método nuevo en `MhAuthService.getActiveAuthForTenant(tenantId)`** (reutilizable) vs. dejarla local al `DteImportService`. Recomendación: dejarla local en Fase 1.4a — si un tercer consumidor aparece, la promocionamos. YAGNI ruthless.
- El `getToken()` de `MhAuthService` ya maneja cache + refresh internamente. No duplicamos esa lógica.

---

## 7. Error handling

| Escenario | Resultado | HTTP equivalent (si Fase 2 expone controller) |
|---|---|---|
| JSON malformado → parse FAILED_PARSE | Persist con errors; return normal | 200 OK (con `ingestStatus=FAILED_PARSE`) |
| Dedupe mismo hash | Return existing silencioso | 200 OK (con `isDuplicate=true`) |
| Dedupe hash distinto | `ConflictException` (NestJS 409) | 409 Conflict |
| No MH config en tenant | `PreconditionFailedException` (NestJS 412) | 412 Precondition Failed |
| MH NOT_FOUND | Persist con FAILED_MH_NOT_FOUND; return normal | 200 OK (con `ingestStatus=FAILED_MH_NOT_FOUND`) |
| MH timeout / 5xx / auth | Persist con VERIFY_*_RETRY; return normal | 200 OK (con warning, retry en background) |
| DB INSERT falla (network, constraint) | Propaga error Prisma | 500 (Fase 2 maneja) |

**NO hacemos:** rollback de INSERT si la operación upstream falla — no hay upstream después del INSERT. El INSERT es el último paso.

---

## 8. Tests (~12 casos unit)

**Archivo:** `apps/api/src/modules/dte/services/dte-import.service.spec.ts`

**Mocks:**
- `DteImportParserService` → controlable: `parse()` devuelve `{valid:true, data:ParsedDTE}` o `{valid:false, errors:[...]}`
- `MhDteConsultaService` → controlable: `verify()` devuelve cada `MhVerifyStatus`
- `MhAuthService` → controlable: `getActiveToken()` / `getHaciendaConfig()` éxito o throws
- `PrismaService` → usar `createMockPrismaService()` helper del proyecto (ya existe, patrón usado en accounting tests)

**Casos:**

1. **Happy path** — parse OK + verify VERIFIED → `ingestStatus=VERIFIED`, row persisted con `mhSelloRecepcion`
2. **Parse fail** — parser returns `{valid:false}` → persist con `FAILED_PARSE`, verify NO fue llamado
3. **Dedupe same hash** — parse OK, findUnique returns existing con mismo hash → return existing, no INSERT
4. **Dedupe different hash** — existing con hash distinto → `ConflictException` thrown, no verify llamado
5. **No MH config** — `mhAuth.getHaciendaConfig()` throws → `PreconditionFailedException`, no persist
6. **MH token refresh falla** — `mhAuth.getActiveToken()` throws → `PreconditionFailedException`, no persist
7. **MH NOT_FOUND** — verify returns HARD_FAIL_NOT_FOUND → persist con `FAILED_MH_NOT_FOUND`
8. **MH MISMATCH** — verify returns HARD_FAIL_MISMATCH → persist con `STRUCTURAL_OK`
9. **MH TIMEOUT** — verify returns RETRY_TIMEOUT → persist con `VERIFY_TIMEOUT_RETRY` + `mhVerifyAttempts=1` + `lastMhVerifyAt` populated
10. **MH 5XX** — verify returns RETRY_5XX → persist con `VERIFY_5XX_RETRY`
11. **MH AUTH** — verify returns RETRY_AUTH → persist con `VERIFY_AUTH_RETRY`
12. **MH UNKNOWN_ERROR** — verify returns UNKNOWN_ERROR → persist con `VERIFY_5XX_RETRY` (treated as transient)

**Coverage target:** 90%+ en `dte-import.service.ts`.

**NO hacemos en Fase 1.4a:**
- Integration tests contra Prisma real (eso queda para Fase 1.4b donde ya importamos un tenant seed)
- E2E tests (Fase 2 lo cubre con controller tests)

---

## 9. Checklist de aprobación (José)

- [ ] §1 alcance IN/OUT — parser+verifier ya existen; orquestador puro; sin persist Purchase ni retry job
- [ ] §3 schema additions — 4 campos + 2 índices; migración limpia con tabla vacía en staging
- [ ] §4 contratos `IngestParams` / `IngestResult` / `IngestStatus`
- [ ] §5 flujo — dedupe antes de MH call, persist atomic con resultado final
- [ ] §6 integración con `MhAuthService` — el plan **debe verificar los nombres exactos** en Task 1
- [ ] §7 error handling — ConflictException (hash distinto), PreconditionFailed (no MH config), normal 200 con status para el resto
- [ ] §8 tests — 12 casos unit con mocks, sin hitting Prisma real

Una vez aprobado, invoco `superpowers:writing-plans` para el plan tarea-por-tarea (probable: 8-10 tareas).

---

## 10. Open decisions — diferidas

| # | Decisión | Se resuelve en |
|---|---|---|
| O1 | `skipVerify=true` flag para compras en papel / contingencia | Fase 1.4b (controller-level, agrega a IngestParams) |
| O2 | Límite de tamaño en `rawPayload` (DTEs muy grandes) | Fase 2 (frontend upload) |
| O3 | Webhook entrante push de DTEs (MH → nosotros directamente) | Post-MVP |
| O4 | Retry intervals + max attempts antes de flag UNVERIFIED permanente | Fase 1.4c (background job) |
| O5 | Manual "reverify now" button/action | Fase 2 + Fase 1.4c |

---

## 11. Branch strategy

Fase 1.4a depende de PR #89 y PR #90 mergeados.

**Opción preferida:** esperar a que ambos merguen a `main`, luego branch `feature/dte-import-orchestrator` desde `main`. Limpio, sin conflictos.

**Si no podemos esperar:** crear branch basado en `feature/purchases-inventory-schema` (Fase 1.2) con cherry-pick de los commits de `feature/dte-import-parser` (Fase 1.3). Más riesgoso — cuando las 2 PRs original merguen a main, el branch de 1.4a necesita rebase sobre main y posiblemente re-apply. El plan de Fase 1.4a debe preguntar al controlador cuál escenario aplica antes de arrancar Task 1.
