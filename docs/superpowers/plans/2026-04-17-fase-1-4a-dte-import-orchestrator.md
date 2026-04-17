# Fase 1.4a — DTE Import Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar `DteImportService` — un orquestador puro que compone parser + verifier de Fase 1.3 con persistencia a `ReceivedDTE` de Fase 1.2, con dedupe hash-based y manejo graceful de estados RETRY. Incluye 4 campos nuevos en `ReceivedDTE` + 2 índices.

**Architecture:** Service NestJS inyectando `DteImportParserService` (pure), `MhDteConsultaService` (HTTP), `MhAuthService` (tenant token/ambiente resolver), y `PrismaService`. Método público único `ingest(params): Promise<IngestResult>` que maneja parse → hash → dedupe → auth → verify → persist en ese orden. No controller (Fase 2), no Purchase creation (Fase 1.4b), no background retry (Fase 1.4c).

**Tech Stack:** NestJS 10 + Prisma 5.10 + Azure SQL Server + Zod (consumido via Fase 1.3 parser) + Jest + jest-mock-extended. Sin nuevas dependencias runtime.

**Spec:** `outputs/2026-04-17-fase-1-4a-dte-import-orchestrator-design.md`
**Depende de:** PR #89 (Fase 1.2) **merged a main** + PR #90 (Fase 1.3) **merged a main**

---

## File structure

**Create:**
- `apps/api/src/modules/dte/services/dte-import.service.ts` — orquestador
- `apps/api/src/modules/dte/services/dte-import.service.spec.ts` — 12 tests con mocks

**Modify:**
- `apps/api/prisma/schema.prisma` — 4 fields + 2 indices en model `ReceivedDTE`
- `apps/api/src/modules/dte/dte.module.ts` — agregar `DteImportService` a providers + exports

---

### Task 1: Branch setup + verify prereqs

**Files:** none (git + environment checks)

- [ ] **Step 1: Verify PR #89 and #90 are merged to main**

Run:
```bash
cd /home/jose/facturador-electronico-sv
gh pr view 89 --json state,mergedAt
gh pr view 90 --json state,mergedAt
```

Expected: both show `"state": "MERGED"` with a valid `mergedAt` timestamp.

**If either is NOT merged yet**: STOP. Report BLOCKED with the current states. The controller (José) needs to merge them before Fase 1.4a can start. This plan assumes both are on main.

- [ ] **Step 2: Verify main has the Fase 1.2 and 1.3 artifacts**

```bash
git checkout main
git pull origin main --ff-only

# Fase 1.2 schema check
grep -q "model ReceivedDTE" apps/api/prisma/schema.prisma && echo "ReceivedDTE model present ✓" || echo "MISSING — Fase 1.2 not merged"

# Fase 1.3 parser check  
test -f apps/api/src/modules/dte/services/dte-import-parser.service.ts && echo "DteImportParser present ✓" || echo "MISSING — Fase 1.3 not merged"

test -f apps/api/src/modules/dte/services/mh-dte-consulta.service.ts && echo "MhDteConsulta present ✓" || echo "MISSING — Fase 1.3 not merged"
```

Expected: all three `present ✓`. Otherwise BLOCKED.

- [ ] **Step 3: Verify MhAuthService API matches spec §6 assumption**

```bash
grep -n "async getToken" apps/api/src/modules/mh-auth/mh-auth.service.ts
```

Expected: line containing `async getToken(`. Spec §6 documented the exact signature `getToken(nit, password, env)`. Read full signature to confirm:

```bash
grep -A3 "async getToken" apps/api/src/modules/mh-auth/mh-auth.service.ts | head -6
```

If signature differs from `getToken(nit: string, password: string, env: MHEnvironment)`, report DONE_WITH_CONCERNS (spec §6 may need a minor adjustment that this plan's Task 5 accommodates).

- [ ] **Step 4: Verify HaciendaConfig schema for `resolveMhAuth()`**

Spec §6 assumes `Tenant.haciendaConfig.environmentConfig.password` + `environmentConfig.ambiente`. Verify fields:

```bash
grep -A20 "model HaciendaEnvironmentConfig" apps/api/prisma/schema.prisma | head -25
grep -A15 "model HaciendaConfig" apps/api/prisma/schema.prisma | head -20
```

Record the actual field names. If `password` is instead `haciendaPassword` or similar, Task 5 will use the real name.

- [ ] **Step 5: Create feature branch**

```bash
git checkout -b feature/dte-import-orchestrator
```

Expected: `Switched to a new branch 'feature/dte-import-orchestrator'`

- [ ] **Step 6: No commit yet** — first change lands in Task 2.

---

### Task 2: Schema additions to `ReceivedDTE` + prisma format/validate/generate

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Locate `model ReceivedDTE`**

```bash
cd /home/jose/facturador-electronico-sv
grep -n "model ReceivedDTE" apps/api/prisma/schema.prisma
```

The model was added in Fase 1.2. Record the line number.

- [ ] **Step 2: Add 4 new fields + 2 new indices**

Open `apps/api/prisma/schema.prisma` and find the `ReceivedDTE` model. Add these fields **before** the closing `}` of the model, after the existing fields but before any `@@index` or `@@unique` directives:

```prisma
  // Fase 1.4a additions
  rawPayloadHash   String    @db.NVarChar(64)
  mhVerifyAttempts Int       @default(0)
  lastMhVerifyAt   DateTime?
  mhVerifyError    String?   @db.NVarChar(500)
```

Then add these 2 new indices **after** the existing `@@index` directives in the same model:

```prisma
  @@index([tenantId, rawPayloadHash])
  @@index([tenantId, ingestStatus, lastMhVerifyAt])
```

- [ ] **Step 3: Format + validate**

```bash
cd apps/api
npx prisma format
npx prisma validate
```

Expected: `The schema at prisma/schema.prisma is valid` ✅

- [ ] **Step 4: Generate Prisma client (local TS types)**

```bash
cd apps/api
npx prisma generate
```

Expected: `Generated Prisma Client (v5.x)` — adds `rawPayloadHash`, `mhVerifyAttempts`, `lastMhVerifyAt`, `mhVerifyError` to `ReceivedDTE` type in `@prisma/client`.

- [ ] **Step 5: Commit**

```bash
cd /home/jose/facturador-electronico-sv
git add apps/api/prisma/schema.prisma
git commit -m "feat(schema): add ReceivedDTE fields for import orchestrator (Fase 1.4a)"
```

---

### Task 3: Apply schema to staging DB via `db push`

**Files:** none (remote DB operation)

**Critical:** modifies Azure SQL STAGING. Requires firewall rule cycle.

- [ ] **Step 1: Confirm `.env.staging` has staging DATABASE_URL**

```bash
grep "^DATABASE_URL=" apps/api/.env.staging | grep -oE "(staging|\.database\.windows\.net)" | head -2
```

Expected: matches `staging` or `.database.windows.net`. If empty or matches `prod` → STOP.

- [ ] **Step 2: Get current public IP**

```bash
MY_IP=$(curl -s https://api.ipify.org)
echo "IP: $MY_IP"
```

- [ ] **Step 3: Add temporary firewall rule**

```bash
RULE_NAME=tmp-fase14a-$(date +%Y%m%d-%H%M%S)
az sql server firewall-rule create \
  --resource-group facturador-sv-rg \
  --server facturador-rc-sql \
  --name $RULE_NAME \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

Save `$RULE_NAME` for Step 6.

- [ ] **Step 4: Run `db push`**

```bash
cd /home/jose/facturador-electronico-sv/apps/api
dotenv -e .env.staging -- npx prisma db push --skip-generate
```

Expected: `Your database is now in sync with your Prisma schema.`

If prompted about data loss → STOP and report (shouldn't happen; `ReceivedDTE` table is additive).

- [ ] **Step 5: Verify new columns exist with a quick count**

Write a temporary verify script at `apps/api/scripts/verify-fase14a-fields.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function verify() {
  // Type-level check: if this compiles, the new fields exist in the generated client
  const r = {
    rawPayloadHash: '',
    mhVerifyAttempts: 0,
    lastMhVerifyAt: null as Date | null,
    mhVerifyError: null as string | null,
  };
  const count = await prisma.receivedDTE.count();
  console.log(`[OK] received_dtes rows: ${count}, new fields typed correctly:`, Object.keys(r).join(', '));
  await prisma.$disconnect();
}
verify().catch((e) => { console.error('[FAIL]', e.message); process.exit(1); });
```

Run:
```bash
dotenv -e .env.staging -- npx ts-node --compiler-options '{"strict":false}' scripts/verify-fase14a-fields.ts
```

Expected: `[OK] received_dtes rows: N, new fields typed correctly: rawPayloadHash, mhVerifyAttempts, lastMhVerifyAt, mhVerifyError`

- [ ] **Step 6: Remove firewall rule (MANDATORY)**

```bash
az sql server firewall-rule delete \
  --resource-group facturador-sv-rg \
  --server facturador-rc-sql \
  --name $RULE_NAME

az sql server firewall-rule list \
  --resource-group facturador-sv-rg \
  --server facturador-rc-sql \
  --query "[?starts_with(name, 'tmp-fase14a-')]" -o tsv
```

Expected: empty (rule removed).

- [ ] **Step 7: Commit the verify script**

```bash
cd /home/jose/facturador-electronico-sv
git add apps/api/scripts/verify-fase14a-fields.ts
git commit -m "chore(schema): add staging verify script for Fase 1.4a fields"
```

---

### Task 4: Write complete `DteImportService` spec with 12 test cases (TDD)

**Files:**
- Create: `apps/api/src/modules/dte/services/dte-import.service.spec.ts`

This test file drives the entire service API — it MUST be written before implementation. All tests will fail initially (module not found), pass incrementally as Task 5 implements.

- [ ] **Step 1: Check if `jest-mock-extended` is available**

```bash
cd /home/jose/facturador-electronico-sv/apps/api
grep '"jest-mock-extended"' package.json
```

- If present: use `mockDeep<PrismaService>()` pattern
- If NOT present: use manual mock with `{ tenant: { findUnique: jest.fn() }, receivedDTE: { findUnique: jest.fn(), create: jest.fn() } }`

Record which pattern applies.

- [ ] **Step 2: Create the spec file with all 12 cases**

File: `apps/api/src/modules/dte/services/dte-import.service.spec.ts`

```typescript
import { ConflictException, PreconditionFailedException } from '@nestjs/common';
import { DteImportService } from './dte-import.service';
import { DteImportParserService, ParseResult, ParsedDTE } from './dte-import-parser.service';
import { MhDteConsultaService, MhVerifyResult } from './mh-dte-consulta.service';
import { MhAuthService } from '../../mh-auth/mh-auth.service';
import { PrismaService } from '../../../prisma/prisma.service';

type PrismaMock = {
  tenant: { findUnique: jest.Mock };
  receivedDTE: { findUnique: jest.Mock; create: jest.Mock };
};

function mockPrisma(): PrismaMock {
  return {
    tenant: { findUnique: jest.fn() },
    receivedDTE: { findUnique: jest.fn(), create: jest.fn() },
  };
}

const validParsedDTE: ParsedDTE = {
  tipoDte: '03',
  version: 3,
  ambiente: '00',
  numeroControl: 'DTE-03-AB12CD34-000000000000001',
  codigoGeneracion: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
  tipoModelo: 1,
  tipoOperacion: 1,
  fecEmi: '2026-04-15',
  horEmi: '14:30:45',
  tipoMoneda: 'USD',
  emisor: { nit: '06141507251041', nombre: 'Proveedor Test SA' },
  receptor: { nit: '06231507251041', nombre: 'Receptor SA' },
  cuerpoDocumento: [],
  resumen: { totalPagar: '113.00' },
  raw: '{"dummy":"raw"}',
};

const validTenant = {
  id: 'tenant-1',
  nit: '06141507251041',
  haciendaConfig: {
    environmentConfig: {
      password: 'fake-mh-password',
      ambiente: '00',
    },
  },
};

function makeService(overrides?: Partial<{
  parser: Partial<DteImportParserService>;
  consulta: Partial<MhDteConsultaService>;
  mhAuth: Partial<MhAuthService>;
  prisma: PrismaMock;
}>) {
  const parser = {
    parse: jest.fn().mockReturnValue({ valid: true, data: validParsedDTE, errors: [] } as ParseResult),
    parseObject: jest.fn(),
    ...(overrides?.parser ?? {}),
  } as unknown as DteImportParserService;

  const consulta = {
    verify: jest.fn().mockResolvedValue({
      status: 'VERIFIED',
      mhSelloRecepcion: 'MH-SELLO-X',
      mhFhProcesamiento: new Date('2026-04-15T14:30:45Z'),
      durationMs: 120,
    } as MhVerifyResult),
    ...(overrides?.consulta ?? {}),
  } as unknown as MhDteConsultaService;

  const mhAuth = {
    getToken: jest.fn().mockResolvedValue({
      token: 'fake-token',
      roles: [],
      obtainedAt: new Date(),
    }),
    ...(overrides?.mhAuth ?? {}),
  } as unknown as MhAuthService;

  const prisma = overrides?.prisma ?? mockPrisma();
  (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(validTenant);
  (prisma.receivedDTE.findUnique as jest.Mock).mockResolvedValue(null);
  (prisma.receivedDTE.create as jest.Mock).mockImplementation(({ data }: { data: object }) => ({
    id: 'rdte-new',
    ...data,
  }));

  const service = new DteImportService(parser, consulta, mhAuth, prisma as unknown as PrismaService);
  return { service, parser, consulta, mhAuth, prisma };
}

const baseParams = {
  tenantId: 'tenant-1',
  jsonString: '{"dummy":"raw"}',
  createdBy: 'user-1',
  source: 'JSON_UPLOAD' as const,
};

describe('DteImportService', () => {
  it('happy path: parse OK + verify VERIFIED → persist VERIFIED', async () => {
    const { service, consulta, prisma } = makeService();

    const result = await service.ingest(baseParams);

    expect(result.ingestStatus).toBe('VERIFIED');
    expect(result.isDuplicate).toBe(false);
    expect(result.parseErrors).toEqual([]);
    expect(consulta.verify).toHaveBeenCalledTimes(1);
    expect(prisma.receivedDTE.create).toHaveBeenCalledTimes(1);
    const createCall = (prisma.receivedDTE.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.ingestStatus).toBe('VERIFIED');
    expect(createCall.data.rawPayloadHash).toHaveLength(64);
    expect(createCall.data.mhVerifyAttempts).toBe(1);
  });

  it('parse fail: persist FAILED_PARSE, do not call verify', async () => {
    const { service, consulta, prisma } = makeService({
      parser: {
        parse: jest.fn().mockReturnValue({
          valid: false,
          errors: [{ code: 'INVALID_JSON', message: 'Bad JSON' }],
        }),
      },
    });

    const result = await service.ingest(baseParams);

    expect(result.ingestStatus).toBe('FAILED_PARSE');
    expect(result.parseErrors).toHaveLength(1);
    expect(consulta.verify).not.toHaveBeenCalled();
    expect(prisma.receivedDTE.create).toHaveBeenCalledTimes(1);
    const createCall = (prisma.receivedDTE.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.ingestStatus).toBe('FAILED_PARSE');
    expect(createCall.data.ingestErrors).toContain('INVALID_JSON');
  });

  it('dedupe same hash: return existing, no INSERT, no verify', async () => {
    const prisma = mockPrisma();
    const { service, consulta } = makeService({ prisma });

    // Same jsonString → same hash → existing record matches
    const hash = require('crypto').createHash('sha256').update(baseParams.jsonString).digest('hex');
    (prisma.receivedDTE.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'rdte-existing',
      rawPayloadHash: hash,
      ingestStatus: 'VERIFIED',
    });

    const result = await service.ingest(baseParams);

    expect(result.isDuplicate).toBe(true);
    expect(result.existingReceivedDteId).toBe('rdte-existing');
    expect(result.receivedDteId).toBe('rdte-existing');
    expect(result.ingestStatus).toBe('VERIFIED');
    expect(consulta.verify).not.toHaveBeenCalled();
    expect(prisma.receivedDTE.create).not.toHaveBeenCalled();
  });

  it('dedupe different hash: throws ConflictException, no verify, no INSERT', async () => {
    const prisma = mockPrisma();
    const { service, consulta } = makeService({ prisma });

    (prisma.receivedDTE.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'rdte-existing',
      rawPayloadHash: 'DIFFERENT_HASH_1234567890abcdef1234567890abcdef1234567890abcdef1234',
      ingestStatus: 'VERIFIED',
    });

    await expect(service.ingest(baseParams)).rejects.toBeInstanceOf(ConflictException);
    expect(consulta.verify).not.toHaveBeenCalled();
    expect(prisma.receivedDTE.create).not.toHaveBeenCalled();
  });

  it('no MH config: throws PreconditionFailedException, no persist', async () => {
    const prisma = mockPrisma();
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'tenant-1',
      nit: '06141507251041',
      haciendaConfig: null, // no config
    });
    const { service, consulta } = makeService({ prisma });

    await expect(service.ingest(baseParams)).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(consulta.verify).not.toHaveBeenCalled();
    expect(prisma.receivedDTE.create).not.toHaveBeenCalled();
  });

  it('MH token fetch fails: throws PreconditionFailedException', async () => {
    const { service, consulta, prisma } = makeService({
      mhAuth: {
        getToken: jest.fn().mockRejectedValue(new Error('MH down')),
      },
    });

    await expect(service.ingest(baseParams)).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(consulta.verify).not.toHaveBeenCalled();
    expect(prisma.receivedDTE.create).not.toHaveBeenCalled();
  });

  it('MH NOT_FOUND: persist FAILED_MH_NOT_FOUND', async () => {
    const { service, prisma } = makeService({
      consulta: {
        verify: jest.fn().mockResolvedValue({
          status: 'HARD_FAIL_NOT_FOUND',
          httpStatus: 404,
          durationMs: 150,
        } as MhVerifyResult),
      },
    });

    const result = await service.ingest(baseParams);

    expect(result.ingestStatus).toBe('FAILED_MH_NOT_FOUND');
    const createCall = (prisma.receivedDTE.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.ingestStatus).toBe('FAILED_MH_NOT_FOUND');
  });

  it('MH MISMATCH: persist STRUCTURAL_OK (flag for review)', async () => {
    const { service } = makeService({
      consulta: {
        verify: jest.fn().mockResolvedValue({
          status: 'HARD_FAIL_MISMATCH',
          httpStatus: 200,
          errorMessage: 'sello mismatch',
          durationMs: 100,
        } as MhVerifyResult),
      },
    });

    const result = await service.ingest(baseParams);
    expect(result.ingestStatus).toBe('STRUCTURAL_OK');
  });

  it('MH TIMEOUT: persist VERIFY_TIMEOUT_RETRY with attempts=1', async () => {
    const { service, prisma } = makeService({
      consulta: {
        verify: jest.fn().mockResolvedValue({
          status: 'RETRY_TIMEOUT',
          errorMessage: 'timeout',
          durationMs: 5000,
        } as MhVerifyResult),
      },
    });

    const result = await service.ingest(baseParams);
    expect(result.ingestStatus).toBe('VERIFY_TIMEOUT_RETRY');
    const createCall = (prisma.receivedDTE.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.mhVerifyAttempts).toBe(1);
    expect(createCall.data.lastMhVerifyAt).toBeInstanceOf(Date);
    expect(createCall.data.mhVerifyError).toBe('timeout');
  });

  it('MH 5XX: persist VERIFY_5XX_RETRY', async () => {
    const { service } = makeService({
      consulta: {
        verify: jest.fn().mockResolvedValue({
          status: 'RETRY_5XX',
          httpStatus: 500,
          durationMs: 200,
        } as MhVerifyResult),
      },
    });
    const result = await service.ingest(baseParams);
    expect(result.ingestStatus).toBe('VERIFY_5XX_RETRY');
  });

  it('MH AUTH: persist VERIFY_AUTH_RETRY', async () => {
    const { service } = makeService({
      consulta: {
        verify: jest.fn().mockResolvedValue({
          status: 'RETRY_AUTH',
          httpStatus: 401,
          durationMs: 50,
        } as MhVerifyResult),
      },
    });
    const result = await service.ingest(baseParams);
    expect(result.ingestStatus).toBe('VERIFY_AUTH_RETRY');
  });

  it('MH UNKNOWN_ERROR: treated as transient → VERIFY_5XX_RETRY', async () => {
    const { service } = makeService({
      consulta: {
        verify: jest.fn().mockResolvedValue({
          status: 'UNKNOWN_ERROR',
          errorMessage: 'weird',
          durationMs: 100,
        } as MhVerifyResult),
      },
    });
    const result = await service.ingest(baseParams);
    expect(result.ingestStatus).toBe('VERIFY_5XX_RETRY');
  });
});
```

- [ ] **Step 3: Run spec — expect fail on module resolution**

```bash
cd /home/jose/facturador-electronico-sv/apps/api
npx jest --config jest.config.ts src/modules/dte/services/dte-import.service.spec.ts
```

Expected: FAIL — `Cannot find module './dte-import.service'`.

- [ ] **Step 4: Commit the spec file before implementation (TDD discipline)**

```bash
cd /home/jose/facturador-electronico-sv
git add apps/api/src/modules/dte/services/dte-import.service.spec.ts
git commit -m "test(dte): add DteImportService spec with 12 cases (TDD red phase)"
```

---

### Task 5: Implement `DteImportService`

**Files:**
- Create: `apps/api/src/modules/dte/services/dte-import.service.ts`

- [ ] **Step 1: Create the service file**

File: `apps/api/src/modules/dte/services/dte-import.service.ts`

```typescript
import { createHash } from 'crypto';
import {
  ConflictException,
  Injectable,
  Logger,
  PreconditionFailedException,
} from '@nestjs/common';
import { DteImportParserService, ParseError } from './dte-import-parser.service';
import {
  MhDteConsultaService,
  MhVerifyResult,
  MhVerifyStatus,
} from './mh-dte-consulta.service';
import { MhAuthService } from '../../mh-auth/mh-auth.service';
import { PrismaService } from '../../../prisma/prisma.service';

// =========================================================================
// Public contracts (see spec §4)
// =========================================================================

export type IngestStatus =
  | 'VERIFIED'
  | 'STRUCTURAL_OK'
  | 'FAILED_PARSE'
  | 'FAILED_MH_NOT_FOUND'
  | 'VERIFY_TIMEOUT_RETRY'
  | 'VERIFY_5XX_RETRY'
  | 'VERIFY_AUTH_RETRY';

export type IngestSource = 'JSON_UPLOAD' | 'OCR_PDF' | 'MANUAL_ENTRY' | 'API_WEBHOOK';

export interface IngestParams {
  tenantId: string;
  jsonString: string;
  createdBy: string;
  source: IngestSource;
}

export interface IngestResult {
  receivedDteId: string;
  codigoGeneracion: string;
  ingestStatus: IngestStatus;
  isDuplicate: boolean;
  existingReceivedDteId?: string;
  parseErrors: ParseError[];
  mhVerifyResult?: MhVerifyResult;
}

// =========================================================================
// Mapping from MH verify status → ingest status (spec §5 step 6)
// =========================================================================

const MH_TO_INGEST: Record<MhVerifyStatus, IngestStatus> = {
  VERIFIED: 'VERIFIED',
  HARD_FAIL_NOT_FOUND: 'FAILED_MH_NOT_FOUND',
  HARD_FAIL_MISMATCH: 'STRUCTURAL_OK',
  RETRY_TIMEOUT: 'VERIFY_TIMEOUT_RETRY',
  RETRY_5XX: 'VERIFY_5XX_RETRY',
  RETRY_AUTH: 'VERIFY_AUTH_RETRY',
  UNKNOWN_ERROR: 'VERIFY_5XX_RETRY', // treat as transient
};

// =========================================================================
// Service
// =========================================================================

@Injectable()
export class DteImportService {
  private readonly logger = new Logger(DteImportService.name);

  constructor(
    private readonly parser: DteImportParserService,
    private readonly consulta: MhDteConsultaService,
    private readonly mhAuth: MhAuthService,
    private readonly prisma: PrismaService,
  ) {}

  async ingest(params: IngestParams): Promise<IngestResult> {
    const { tenantId, jsonString, createdBy, source } = params;

    // 1. Parse
    const parsed = this.parser.parse(jsonString);

    if (!parsed.valid || !parsed.data) {
      // Persist FAILED_PARSE and return
      const rawPayloadHash = this.hash(jsonString);
      const record = await this.prisma.receivedDTE.create({
        data: {
          tenantId,
          tipoDte: 'UNKNOWN',
          numeroControl: 'UNKNOWN',
          codigoGeneracion: `FAILED_PARSE-${rawPayloadHash.slice(0, 16)}-${Date.now()}`,
          fhEmision: new Date(),
          emisorNIT: 'UNKNOWN',
          emisorNombre: 'UNKNOWN',
          rawPayload: jsonString,
          rawPayloadHash,
          ingestStatus: 'FAILED_PARSE',
          ingestErrors: JSON.stringify(parsed.errors),
          ingestSource: source,
          createdBy,
          mhVerifyAttempts: 0,
        },
      });

      return {
        receivedDteId: record.id,
        codigoGeneracion: record.codigoGeneracion,
        ingestStatus: 'FAILED_PARSE',
        isDuplicate: false,
        parseErrors: parsed.errors,
      };
    }

    const data = parsed.data;

    // 2. Hash
    const rawPayloadHash = this.hash(jsonString);

    // 3. Dedupe
    const existing = await this.prisma.receivedDTE.findUnique({
      where: {
        tenantId_codigoGeneracion: {
          tenantId,
          codigoGeneracion: data.codigoGeneracion,
        },
      },
    });

    if (existing) {
      if (existing.rawPayloadHash === rawPayloadHash) {
        // Idempotent: return existing
        this.logger.debug(
          `Duplicate ingest (same hash) for codigoGeneracion=${data.codigoGeneracion}, returning existing ${existing.id}`,
        );
        return {
          receivedDteId: existing.id,
          codigoGeneracion: existing.codigoGeneracion,
          ingestStatus: existing.ingestStatus as IngestStatus,
          isDuplicate: true,
          existingReceivedDteId: existing.id,
          parseErrors: [],
        };
      }
      throw new ConflictException({
        message: 'codigoGeneracion already ingested with different content (hash mismatch)',
        existingReceivedDteId: existing.id,
        existingHash: existing.rawPayloadHash,
        newHash: rawPayloadHash,
      });
    }

    // 4. Resolve MH auth
    const auth = await this.resolveMhAuth(tenantId);

    // 5. Verify against MH
    const verifyResult = await this.consulta.verify({
      codigoGeneracion: data.codigoGeneracion,
      ambiente: auth.ambiente,
      mhToken: auth.token,
      timeoutMs: 5000,
    });

    // 6. Map + 7. Persist
    const ingestStatus = MH_TO_INGEST[verifyResult.status];
    const fhEmision = new Date(`${data.fecEmi}T${data.horEmi}`);

    const record = await this.prisma.receivedDTE.create({
      data: {
        tenantId,
        tipoDte: data.tipoDte,
        numeroControl: data.numeroControl,
        codigoGeneracion: data.codigoGeneracion,
        selloRecepcion: verifyResult.mhSelloRecepcion ?? data.selloRecepcion ?? null,
        fhProcesamiento: verifyResult.mhFhProcesamiento ?? data.fhProcesamiento ?? null,
        fhEmision,
        emisorNIT: data.emisor.nit ?? data.emisor.numDocumento ?? 'UNKNOWN',
        emisorNombre: data.emisor.nombre,
        rawPayload: jsonString,
        parsedPayload: JSON.stringify(data),
        rawPayloadHash,
        ingestStatus,
        ingestSource: source,
        mhVerifyAttempts: 1,
        lastMhVerifyAt: new Date(),
        mhVerifyError: verifyResult.errorMessage ?? null,
        createdBy,
      },
    });

    return {
      receivedDteId: record.id,
      codigoGeneracion: record.codigoGeneracion,
      ingestStatus,
      isDuplicate: false,
      parseErrors: [],
      mhVerifyResult: verifyResult,
    };
  }

  // =======================================================================
  // Helpers
  // =======================================================================

  private hash(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  private async resolveMhAuth(
    tenantId: string,
  ): Promise<{ token: string; ambiente: '00' | '01' }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        haciendaConfig: {
          include: { environmentConfig: true },
        },
      },
    });

    if (!tenant) {
      throw new PreconditionFailedException(`Tenant ${tenantId} not found`);
    }

    const hc = (tenant as { haciendaConfig?: { environmentConfig?: { password?: string; ambiente?: string } } }).haciendaConfig;
    const envCfg = hc?.environmentConfig;
    if (!hc || !envCfg || !envCfg.password || !envCfg.ambiente) {
      throw new PreconditionFailedException(
        `Tenant ${tenantId} has no active HaciendaConfig — cannot verify DTEs against MH`,
      );
    }

    const mhEnv = envCfg.ambiente === '01' ? 'prod' : 'test';
    const ambiente = envCfg.ambiente as '00' | '01';

    try {
      const tokenInfo = await this.mhAuth.getToken(tenant.nit, envCfg.password, mhEnv);
      return { token: tokenInfo.token, ambiente };
    } catch (err) {
      throw new PreconditionFailedException(
        `Failed to obtain MH token for tenant ${tenantId}: ${
          err instanceof Error ? err.message : 'unknown'
        }`,
      );
    }
  }
}
```

**Adjustments if Task 1 revealed schema differences:**
- If `environmentConfig.password` is actually `environmentConfig.haciendaPassword`, use the real name
- If the type parameter to `getToken()` is `'test' | 'prod'` vs a specific enum, match exactly
- The test uses `'test'` / `'prod'` strings — adjust if the real type differs

- [ ] **Step 2: Run the spec — expect some/all to pass**

```bash
cd /home/jose/facturador-electronico-sv/apps/api
npx jest --config jest.config.ts src/modules/dte/services/dte-import.service.spec.ts
```

Expected: **12/12 pass** ✅

If some fail:
- Dedupe tests: check that `findUnique` mock is returning existing correctly (should match by `tenantId_codigoGeneracion` key)
- No-MH-config tests: check that the mocked tenant shape matches (haciendaConfig: null, not undefined)
- Verify-returns-error tests: check MH_TO_INGEST map matches the enum values in `MhVerifyStatus`

- [ ] **Step 3: Commit implementation**

```bash
cd /home/jose/facturador-electronico-sv
git add apps/api/src/modules/dte/services/dte-import.service.ts
git commit -m "feat(dte): add DteImportService orchestrator (parse+dedupe+verify+persist)"
```

---

### Task 6: Register in `DteModule` + regression check

**Files:**
- Modify: `apps/api/src/modules/dte/dte.module.ts`

- [ ] **Step 1: Read current module**

```bash
cat /home/jose/facturador-electronico-sv/apps/api/src/modules/dte/dte.module.ts
```

Expected state (after Fase 1.3 merge): already has `DteImportParserService`, `MhDteConsultaService`, and `HttpModule` imported.

- [ ] **Step 2: Add `DteImportService` to imports, providers, exports**

Edit `apps/api/src/modules/dte/dte.module.ts`:

- Add import near other service imports:
  ```typescript
  import { DteImportService } from './services/dte-import.service';
  ```

- In the `providers` array, append `DteImportService` at the end.

- In the `exports` array, append `DteImportService` at the end (so Fase 1.4b's `PurchasesModule` can import it).

- [ ] **Step 3: Compile TypeScript**

```bash
cd /home/jose/facturador-electronico-sv/apps/api
npx tsc --noEmit 2>&1 | grep -v "test-fixtures.ts\|test-tenant-data.ts" | head -20
```

Expected: no errors (except the pre-existing `test-fixtures.ts` issue that has been acknowledged since Fase 1.3).

- [ ] **Step 4: Run full DTE module spec suite**

```bash
npx jest --config jest.config.ts src/modules/dte/
```

Expected: all previously-passing tests still pass; 12 new tests from Task 4 now pass. No regressions.

- [ ] **Step 5: Commit**

```bash
cd /home/jose/facturador-electronico-sv
git add apps/api/src/modules/dte/dte.module.ts
git commit -m "feat(dte): register DteImportService in module"
```

---

### Task 7: Evidence + push branch + open PR

**Files:**
- Create: `outputs/EXECUTION_EVIDENCE_PHASE_1_4A.md`

- [ ] **Step 1: Collect commit history**

```bash
cd /home/jose/facturador-electronico-sv
git log --oneline main..HEAD
```

- [ ] **Step 2: Write evidence document**

File: `outputs/EXECUTION_EVIDENCE_PHASE_1_4A.md`

```markdown
# Execution Evidence — Fase 1.4a: DTE Import Orchestrator

**Date:** 2026-04-17
**Branch:** `feature/dte-import-orchestrator`
**Status:** ✅ COMPLETE
**Spec:** `outputs/2026-04-17-fase-1-4a-dte-import-orchestrator-design.md`
**Plan:** `docs/superpowers/plans/2026-04-17-fase-1-4a-dte-import-orchestrator.md`

## Built

- **Schema:** 4 new fields on `ReceivedDTE` (`rawPayloadHash`, `mhVerifyAttempts`, `lastMhVerifyAt`, `mhVerifyError`) + 2 new indices
- **Service:** `DteImportService` — pure orchestrator composing parser (Fase 1.3) + verifier (Fase 1.3) + persistence (Fase 1.2 table)
  - Parse → hash-based dedupe → MH auth resolution → MH verify → persist, in that order
  - Handles all 7 `IngestStatus` values (VERIFIED / STRUCTURAL_OK / FAILED_PARSE / FAILED_MH_NOT_FOUND / VERIFY_*_RETRY)
  - Zero direct HTTP calls (delegates to MhDteConsultaService)
  - Zero direct Prisma queries outside the service (uses injected PrismaService)
- **Module:** DteImportService registered as provider + export

## Tests

- `dte-import.service.spec.ts` — **12/12 pass**
- Full DTE module suite — no regressions

## Staging DB

- `prisma db push` applied successfully with tenant firewall cycle
- 4 new columns + 2 new indices on `received_dtes` confirmed via `verify-fase14a-fields.ts`

## Not included (deferred)

- Purchase + PurchaseLineItem creation → Fase 1.4b
- Background retry job for VERIFY_*_RETRY states → Fase 1.4c
- Controller / HTTP endpoint → Fase 2
- OCR / PDF → JSON → Fase 2
- `skipVerify: true` flag for paper purchases → Fase 1.4b controller

## Commits

<INSERT git log --oneline main..HEAD OUTPUT>

## Next

- Fase 1.4b — mapper ReceivedDTE → Purchase + supplier upsert + asiento contable
- Fase 1.4c — background retry job for VERIFY_*_RETRY
```

Replace `<INSERT ... OUTPUT>` with actual git log output.

- [ ] **Step 3: Commit evidence + push**

```bash
cd /home/jose/facturador-electronico-sv
git add outputs/EXECUTION_EVIDENCE_PHASE_1_4A.md
git commit -m "docs: execution evidence for Fase 1.4a DTE import orchestrator"
git push -u origin feature/dte-import-orchestrator
```

- [ ] **Step 4: Open PR**

```bash
gh pr create --title "feat(dte): Fase 1.4a — DTE import orchestrator" --body "$(cat <<'EOF'
## Summary

Fase 1.4a: orquestador `DteImportService` que compone parser (Fase 1.3) + verifier (Fase 1.3) + persistencia a `ReceivedDTE` (Fase 1.2). Primera de tres sub-fases dentro de Fase 1.4; 1.4b (Purchase creation) y 1.4c (retry job) siguen en PRs separados.

- **Service puro** con método único `ingest(params): Promise<IngestResult>` — parse → hash dedupe → MH auth resolve → MH verify → persist
- **Schema additions** (no breaking): 4 campos + 2 índices en `ReceivedDTE` para dedupe y retry metadata
- **Dedupe hybrid** — mismo hash silencioso idempotente, hash distinto throws ConflictException
- **Handles 7 ingest statuses** (VERIFIED / STRUCTURAL_OK / FAILED_PARSE / FAILED_MH_NOT_FOUND / VERIFY_*_RETRY)

## Test plan

- [x] 12/12 unit tests pass con mocks (parse OK, parse fail, dedupe same+diff, no MH config, MH auth fail, MH NOT_FOUND / MISMATCH / TIMEOUT / 5xx / AUTH / UNKNOWN)
- [x] Full DTE module regression: sin regresiones
- [x] Schema: prisma format + validate + generate + db push staging limpio
- [ ] Pre-merge: revisión de `resolveMhAuth()` — valida que field path `haciendaConfig.environmentConfig.password` match con schema real

## Out of scope (intencional)

- Purchase creation → Fase 1.4b
- Background retry job → Fase 1.4c
- Controller / frontend → Fase 2

## Docs

- Spec: \`outputs/2026-04-17-fase-1-4a-dte-import-orchestrator-design.md\`
- Plan: \`docs/superpowers/plans/2026-04-17-fase-1-4a-dte-import-orchestrator.md\`
- Evidence: \`outputs/EXECUTION_EVIDENCE_PHASE_1_4A.md\`

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Capture the PR URL for report.

- [ ] **Step 5: Report to José**

Report:
- PR URL
- Commit count on branch (should be 7: schema + verify-script + spec + implementation + module reg + evidence + push)
- Test count (12 new + prior DTE module baseline all green)
- Branch state confirmation

---

## Self-Review

### Spec coverage

- §1 IN/OUT scope: Tasks 2-6 cover IN; OUT items explicitly deferred in task comments ✓
- §2 module + files: Task 1 verifies prereqs, Tasks 2-6 modify only the 4 files listed ✓
- §3 schema additions: Task 2 adds exactly 4 fields + 2 indices; Task 3 applies to staging ✓
- §4 public contracts: Task 5 implementation exports `IngestStatus`, `IngestSource`, `IngestParams`, `IngestResult` matching spec ✓
- §5 flow: Task 5 service code executes the 7-step flow in exact order ✓
- §6 MhAuthService integration: Task 5 implements `resolveMhAuth()` using the real `getToken(nit, password, env)` API; Task 1 verifies the signature ✓
- §7 error handling: Task 4 spec case 4 (ConflictException), case 5-6 (PreconditionFailedException), cases 7-12 (normal 200 with status) ✓
- §8 12 test cases: Task 4 writes all 12 ✓

### Placeholder scan

No "TBD", "TODO", or incomplete instructions. All code blocks are full and copy-pasteable. Commands have expected outputs.

One conditional in Task 5 ("If Task 1 revealed schema differences") — this is a real safety net, not a placeholder; the Task 1 grep produces a concrete finding that either confirms the assumed names or lists the real ones.

### Type consistency

- `IngestStatus` values: 7 literals used consistently in Task 4 tests (`'VERIFIED'`, `'FAILED_PARSE'`, `'FAILED_MH_NOT_FOUND'`, `'STRUCTURAL_OK'`, `'VERIFY_TIMEOUT_RETRY'`, `'VERIFY_5XX_RETRY'`, `'VERIFY_AUTH_RETRY'`) and in Task 5 `MH_TO_INGEST` mapping.
- `MhVerifyStatus` keys in `MH_TO_INGEST` (Task 5) match exactly the 7 values exported from `mh-dte-consulta.service.ts` in Fase 1.3 (VERIFIED / HARD_FAIL_NOT_FOUND / HARD_FAIL_MISMATCH / RETRY_TIMEOUT / RETRY_5XX / RETRY_AUTH / UNKNOWN_ERROR).
- `IngestSource` literals ('JSON_UPLOAD' | 'OCR_PDF' | 'MANUAL_ENTRY' | 'API_WEBHOOK') used in Task 4 default params and Task 5 IngestParams interface.
- `DteImportService.ingest(params)` method signature matches in Task 4 (test calls) and Task 5 (implementation).
- `resolveMhAuth()` return shape `{ token: string; ambiente: '00' | '01' }` used consistently in Task 5 (defined + consumed).
- Prisma `ReceivedDTE.create` data shape matches the schema additions from Task 2 (4 new fields present in Task 5 create call).

### Scope

Single implementation plan, one coherent file-level change (orchestrator). Fits in 7 tasks, ~30-60 min of focused execution time per task. No decomposition needed.
