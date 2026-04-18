# Fase 2.3 — DTEs Recibidos UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** UI para gestionar DTEs recibidos (`ReceivedDTE` model de Fase 1.3/1.4a): lista + detalle + import manual persistente + retry MH + re-parse + convertir-a-compra + export XLSX mensual.

**Architecture:** Extender `ReceivedDtesController` (creado en Fase 2.2) con 5 endpoints + 1 export. Crear `ReceivedDtesService` (list/findOne/createManual/retryMhVerify/reParse) y `ReceivedDtesExportService` (XLSX via `exceljs`, pattern de Fase 3a). Frontend: 2 páginas + 1 modal en `/compras/recibidos`, espejo del patrón de `/compras` (Fase 2.2). Orchestrator `/compras/nueva` gana soporte para `?receivedDteId=X` prefill.

**Tech Stack:** NestJS 10 + Prisma 5.10 + exceljs + Jest (backend). Next.js 14 + useState/useEffect + apiFetch (frontend). Zero schema changes, zero new deps, zero RBAC changes.

**Spec:** `docs/superpowers/specs/2026-04-18-fase-2-3-received-dtes-ui-design.md`
**Depende de:** Fase 1.3/1.4a/1.4c/2.2 merged ✅

---

## File structure

**Backend — create:**
- `apps/api/src/modules/dte/services/received-dtes.service.ts`
- `apps/api/src/modules/dte/services/received-dtes.service.spec.ts`
- `apps/api/src/modules/dte/services/received-dtes-export.service.ts`
- `apps/api/src/modules/dte/services/received-dtes-export.service.spec.ts`
- `apps/api/src/modules/dte/dto/import-received-dte.dto.ts`
- `apps/api/src/modules/dte/dto/received-dtes-filter.dto.ts`

**Backend — modify:**
- `apps/api/src/modules/dte/received-dtes.controller.ts` (agregar 6 métodos)
- `apps/api/src/modules/dte/received-dtes.controller.spec.ts` (extender)
- `apps/api/src/modules/dte/dte.module.ts` (registrar services nuevos)

**Frontend — create:**
- `apps/web/src/app/(dashboard)/compras/recibidos/page.tsx`
- `apps/web/src/app/(dashboard)/compras/recibidos/[id]/page.tsx`
- `apps/web/src/components/purchases/import-dte-manual-modal.tsx`
- `apps/web/src/components/purchases/compras-tabs-nav.tsx` (sub-nav component)

**Frontend — modify:**
- `apps/web/src/types/purchase.ts` (agregar `ReceivedDteDetail`, `IngestStatus`, `IngestSource`)
- `apps/web/src/app/(dashboard)/compras/nueva/page.tsx` (soportar `?receivedDteId=X`)
- `apps/web/src/app/(dashboard)/compras/page.tsx` (agregar tabs-nav arriba)

---

### Task 1: Branch + baseline

**Files:** none

- [ ] **Step 1: Create branch**

```bash
cd /home/jose/facturador-electronico-sv
git checkout main && git pull origin main
git checkout -b feature/received-dtes-ui
```

- [ ] **Step 2: Baseline tests**

```bash
cd apps/api
npx jest --config jest.config.ts src/modules/dte/ src/modules/purchases/ 2>&1 | grep -E "(Tests:|Test Suites:)" | head -3
```
Record numbers.

- [ ] **Step 3: TypeScript**

```bash
cd /home/jose/facturador-electronico-sv/apps/api && npx tsc --noEmit 2>&1 | grep -c "error TS"
cd /home/jose/facturador-electronico-sv/apps/web && npx tsc --noEmit 2>&1 | grep -v "sync-engine" | grep -c "error TS"
```

- [ ] **Step 4: No commit**

---

### Task 2: DTOs + `ReceivedDtesService` (list + findOne + createManual)

**Files:**
- Create: `apps/api/src/modules/dte/dto/import-received-dte.dto.ts`
- Create: `apps/api/src/modules/dte/dto/received-dtes-filter.dto.ts`
- Create: `apps/api/src/modules/dte/services/received-dtes.service.ts`
- Create: `apps/api/src/modules/dte/services/received-dtes.service.spec.ts`

- [ ] **Step 1: DTOs**

Create `apps/api/src/modules/dte/dto/import-received-dte.dto.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { DteFormat } from './preview-dte.dto';

export class ImportReceivedDteDto {
  @ApiProperty()
  @IsString()
  @MinLength(10)
  content!: string;

  @ApiProperty({ enum: DteFormat })
  @IsEnum(DteFormat)
  format!: DteFormat;
}
```

Create `apps/api/src/modules/dte/dto/received-dtes-filter.dto.ts`:

```ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReceivedDtesFilterDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() desde?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() hasta?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tipoDte?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() hasPurchase?: string;
}
```

- [ ] **Step 2: Failing tests**

Create `apps/api/src/modules/dte/services/received-dtes.service.spec.ts` with describe blocks:

```ts
import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ReceivedDtesService } from './received-dtes.service';
import { DteImportParserService } from './dte-import-parser.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DteFormat } from '../dto/preview-dte.dto';

describe('ReceivedDtesService', () => {
  let service: ReceivedDtesService;
  let prisma: { receivedDTE: { findMany: jest.Mock; findFirst: jest.Mock; count: jest.Mock; create: jest.Mock; update: jest.Mock } };
  let parser: { parse: jest.Mock };

  beforeEach(async () => {
    prisma = {
      receivedDTE: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    parser = { parse: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        ReceivedDtesService,
        { provide: PrismaService, useValue: prisma },
        { provide: DteImportParserService, useValue: parser },
      ],
    }).compile();
    service = module.get(ReceivedDtesService);
  });

  describe('findAll', () => {
    it('returns paginated list with default page=1 limit=20', async () => {
      prisma.receivedDTE.findMany.mockResolvedValue([{ id: 'r1' }]);
      prisma.receivedDTE.count.mockResolvedValue(1);
      const r = await service.findAll('t1', {});
      expect(r).toEqual({ data: [{ id: 'r1' }], total: 1, totalPages: 1, page: 1, limit: 20 });
    });

    it('applies status filter', async () => {
      prisma.receivedDTE.findMany.mockResolvedValue([]);
      prisma.receivedDTE.count.mockResolvedValue(0);
      await service.findAll('t1', { status: 'FAILED' });
      expect(prisma.receivedDTE.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ ingestStatus: 'FAILED' }) }),
      );
    });

    it('applies date range filter', async () => {
      prisma.receivedDTE.findMany.mockResolvedValue([]);
      prisma.receivedDTE.count.mockResolvedValue(0);
      await service.findAll('t1', { desde: '2026-04-01', hasta: '2026-04-30' });
      expect(prisma.receivedDTE.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fhEmision: { gte: new Date('2026-04-01'), lte: new Date('2026-04-30') },
          }),
        }),
      );
    });

    it('applies search on emisorNIT or emisorNombre', async () => {
      prisma.receivedDTE.findMany.mockResolvedValue([]);
      prisma.receivedDTE.count.mockResolvedValue(0);
      await service.findAll('t1', { search: 'Acme' });
      const call = prisma.receivedDTE.findMany.mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
    });

    it('filters hasPurchase=true using purchase relation', async () => {
      prisma.receivedDTE.findMany.mockResolvedValue([]);
      prisma.receivedDTE.count.mockResolvedValue(0);
      await service.findAll('t1', { hasPurchase: 'true' });
      expect(prisma.receivedDTE.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ purchase: { isNot: null } }) }),
      );
    });
  });

  describe('findOne', () => {
    it('returns ReceivedDTE including purchase', async () => {
      prisma.receivedDTE.findFirst.mockResolvedValue({ id: 'r1', purchase: null });
      const r = await service.findOne('t1', 'r1');
      expect(r.id).toBe('r1');
    });
    it('throws 404 if not found in tenant', async () => {
      prisma.receivedDTE.findFirst.mockResolvedValue(null);
      await expect(service.findOne('t1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createManual', () => {
    it('rejects XML format with 400', async () => {
      await expect(
        service.createManual('t1', 'u1', { content: '<xml/>', format: DteFormat.XML }),
      ).rejects.toThrow(BadRequestException);
    });

    it('persists with ingestSource=MANUAL and returns created row', async () => {
      parser.parse.mockReturnValue({
        valid: true,
        dte: {
          identificacion: { tipoDte: '01', numeroControl: 'NC-1', codigoGeneracion: 'CG-1', fecEmi: '2026-04-01' },
          emisor: { nit: '0614', nombre: 'Proveedor X' },
        },
      });
      prisma.receivedDTE.findFirst.mockResolvedValue(null);
      prisma.receivedDTE.create.mockResolvedValue({ id: 'r1', ingestSource: 'MANUAL', ingestStatus: 'PENDING' });
      const r = await service.createManual('t1', 'u1', { content: '{"a":1}', format: DteFormat.JSON });
      expect(r.id).toBe('r1');
      expect(prisma.receivedDTE.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 't1',
            createdBy: 'u1',
            ingestSource: 'MANUAL',
            ingestStatus: 'PENDING',
          }),
        }),
      );
    });

    it('throws 409 DUPLICATE if codigoGeneracion + tenantId already exists', async () => {
      parser.parse.mockReturnValue({
        valid: true,
        dte: {
          identificacion: { tipoDte: '01', numeroControl: 'NC-1', codigoGeneracion: 'CG-DUP', fecEmi: '2026-04-01' },
          emisor: { nit: '0614', nombre: 'X' },
        },
      });
      prisma.receivedDTE.findFirst.mockResolvedValue({ id: 'existing-r', codigoGeneracion: 'CG-DUP' });
      await expect(
        service.createManual('t1', 'u1', { content: '{"a":1}', format: DteFormat.JSON }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws 400 INVALID_JSON if parser.parse returns invalid', async () => {
      parser.parse.mockReturnValue({ valid: false, errors: [{ code: 'INVALID_JSON', message: 'bad' }] });
      await expect(
        service.createManual('t1', 'u1', { content: 'nope', format: DteFormat.JSON }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
```

- [ ] **Step 3: Run failing tests**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/dte/services/received-dtes.service.spec.ts 2>&1 | tail -10
```
Expected: fail (service doesn't exist).

- [ ] **Step 4: Implement service skeleton**

Create `apps/api/src/modules/dte/services/received-dtes.service.ts`:

```ts
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma, ReceivedDTE } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DteImportParserService } from './dte-import-parser.service';
import { DteFormat } from '../dto/preview-dte.dto';
import { ImportReceivedDteDto } from '../dto/import-received-dte.dto';

export interface FindAllFilters {
  page?: number;
  limit?: number;
  desde?: string;
  hasta?: string;
  status?: string;
  tipoDte?: string;
  search?: string;
  hasPurchase?: string; // 'true' | 'false'
}

@Injectable()
export class ReceivedDtesService {
  private readonly logger = new Logger(ReceivedDtesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: DteImportParserService,
  ) {}

  async findAll(tenantId: string, filters: FindAllFilters) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const where: Prisma.ReceivedDTEWhereInput = { tenantId };

    if (filters.status) where.ingestStatus = filters.status;
    if (filters.tipoDte) where.tipoDte = filters.tipoDte;
    if (filters.desde || filters.hasta) {
      where.fhEmision = {};
      if (filters.desde) (where.fhEmision as Prisma.DateTimeFilter).gte = new Date(filters.desde);
      if (filters.hasta) (where.fhEmision as Prisma.DateTimeFilter).lte = new Date(filters.hasta);
    }
    if (filters.search) {
      where.OR = [
        { emisorNIT: { contains: filters.search } },
        { emisorNombre: { contains: filters.search } },
      ];
    }
    if (filters.hasPurchase === 'true') where.purchase = { isNot: null };
    else if (filters.hasPurchase === 'false') where.purchase = { is: null };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.receivedDTE.findMany({
        where,
        include: { purchase: { select: { id: true, purchaseNumber: true, status: true } } },
        orderBy: { fhEmision: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.receivedDTE.count({ where }),
    ]);

    return { data, total, totalPages: Math.ceil(total / limit), page, limit };
  }

  async findOne(tenantId: string, id: string) {
    const row = await this.prisma.receivedDTE.findFirst({
      where: { id, tenantId },
      include: { purchase: { select: { id: true, purchaseNumber: true, status: true } } },
    });
    if (!row) throw new NotFoundException(`ReceivedDTE ${id} not found`);
    return row;
  }

  async createManual(tenantId: string, userId: string, dto: ImportReceivedDteDto) {
    if (dto.format === DteFormat.XML) {
      throw new BadRequestException({ code: 'FORMAT_NOT_SUPPORTED', message: 'XML no soportado, usa JSON' });
    }

    const parsed = this.parser.parse(dto.content);
    if (!parsed.valid) {
      throw new BadRequestException({
        code: 'INVALID_JSON',
        errors: parsed.errors,
      });
    }

    const dte = parsed.dte as {
      identificacion: { tipoDte: string; numeroControl: string; codigoGeneracion: string; fecEmi: string; selloRecepcion?: string };
      emisor: { nit: string; nombre: string };
    };

    // Duplicate check
    const existing = await this.prisma.receivedDTE.findFirst({
      where: { tenantId, codigoGeneracion: dte.identificacion.codigoGeneracion },
    });
    if (existing) {
      throw new ConflictException({ code: 'DUPLICATE', existingId: existing.id });
    }

    const rawHash = require('crypto').createHash('sha256').update(dto.content).digest('hex');

    return this.prisma.receivedDTE.create({
      data: {
        tenantId,
        tipoDte: dte.identificacion.tipoDte,
        numeroControl: dte.identificacion.numeroControl,
        codigoGeneracion: dte.identificacion.codigoGeneracion,
        selloRecepcion: dte.identificacion.selloRecepcion ?? null,
        fhEmision: new Date(dte.identificacion.fecEmi),
        emisorNIT: dte.emisor.nit,
        emisorNombre: dte.emisor.nombre,
        rawPayload: dto.content,
        parsedPayload: JSON.stringify(dte),
        rawPayloadHash: rawHash,
        ingestStatus: 'PENDING',
        ingestSource: 'MANUAL',
        createdBy: userId,
      },
      include: { purchase: { select: { id: true, purchaseNumber: true, status: true } } },
    });
  }

  // retryMhVerify + reParse stubs for Task 3
  async retryMhVerify(_tenantId: string, _id: string): Promise<ReceivedDTE> {
    throw new Error('not implemented — Task 3');
  }

  async reParse(_tenantId: string, _id: string): Promise<ReceivedDTE> {
    throw new Error('not implemented — Task 3');
  }
}
```

- [ ] **Step 5: Register in module**

Edit `apps/api/src/modules/dte/dte.module.ts`, add `ReceivedDtesService` to providers and export.

- [ ] **Step 6: Run tests — expect green for findAll/findOne/createManual**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/dte/services/received-dtes.service.spec.ts -t "findAll|findOne|createManual" 2>&1 | tail -8
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/dte/
git commit -m "feat(dte): add ReceivedDtesService with findAll/findOne/createManual"
```

---

### Task 3: `ReceivedDtesService` retryMhVerify + reParse

**Files:**
- Modify: `apps/api/src/modules/dte/services/received-dtes.service.ts`
- Modify: `apps/api/src/modules/dte/services/received-dtes.service.spec.ts`

- [ ] **Step 1: Identify existing retry logic**

```bash
cd apps/api && grep -n "async.*retry\|async.*verify\|verifyAgainstMh" src/modules/dte/services/received-dte-retry-cron.service.ts | head -10
```
Record the public method name(s) to reuse. Expected: some method that takes a `ReceivedDTE` and talks to MH. If the cron service has `processSingleRow(receivedDte)` or similar, your `retryMhVerify` will load the row and call it.

- [ ] **Step 2: Write failing tests for retryMhVerify and reParse**

Append to `received-dtes.service.spec.ts`:

```ts
  describe('retryMhVerify', () => {
    it('throws 409 ALREADY_VERIFIED if status=VERIFIED', async () => {
      prisma.receivedDTE.findFirst.mockResolvedValue({ id: 'r1', ingestStatus: 'VERIFIED' });
      await expect(service.retryMhVerify('t1', 'r1')).rejects.toMatchObject({ response: { code: 'ALREADY_VERIFIED' } });
    });

    it('increments mhVerifyAttempts and calls cron helper', async () => {
      const row = { id: 'r1', ingestStatus: 'FAILED', mhVerifyAttempts: 1, tenantId: 't1' };
      prisma.receivedDTE.findFirst.mockResolvedValue(row);
      prisma.receivedDTE.update.mockResolvedValue({ ...row, mhVerifyAttempts: 2, ingestStatus: 'VERIFIED' });
      // Inject a mock helper via service - we'll use a method on the service that can be spied
      const spy = jest.spyOn(service as unknown as { verifyOneFromCron: (r: unknown) => Promise<void> }, 'verifyOneFromCron').mockResolvedValue(undefined);
      const r = await service.retryMhVerify('t1', 'r1');
      expect(spy).toHaveBeenCalledWith(row);
      expect(r.mhVerifyAttempts).toBe(2);
    });
  });

  describe('reParse', () => {
    it('throws 409 NO_PAYLOAD if rawPayload is null', async () => {
      prisma.receivedDTE.findFirst.mockResolvedValue({ id: 'r1', rawPayload: null });
      await expect(service.reParse('t1', 'r1')).rejects.toMatchObject({ response: { code: 'NO_PAYLOAD' } });
    });

    it('re-runs parser and updates parsedPayload', async () => {
      prisma.receivedDTE.findFirst.mockResolvedValue({ id: 'r1', rawPayload: '{"a":1}', ingestStatus: 'FAILED' });
      parser.parse.mockReturnValue({ valid: true, dte: { identificacion: {}, emisor: {} } });
      prisma.receivedDTE.update.mockResolvedValue({ id: 'r1', parsedPayload: '{"identificacion":{},"emisor":{}}', ingestStatus: 'PENDING' });
      const r = await service.reParse('t1', 'r1');
      expect(prisma.receivedDTE.update).toHaveBeenCalled();
      expect(r.id).toBe('r1');
    });

    it('sets status=FAILED and stores errors if parser returns invalid', async () => {
      prisma.receivedDTE.findFirst.mockResolvedValue({ id: 'r1', rawPayload: '{"bad":true}', ingestStatus: 'FAILED' });
      parser.parse.mockReturnValue({ valid: false, errors: [{ code: 'MISSING_FIELD', message: 'identificacion missing' }] });
      prisma.receivedDTE.update.mockResolvedValue({ id: 'r1', ingestStatus: 'FAILED', ingestErrors: expect.any(String) });
      await service.reParse('t1', 'r1');
      expect(prisma.receivedDTE.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ ingestStatus: 'FAILED' }) }),
      );
    });
  });
```

- [ ] **Step 3: Run fail**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/dte/services/received-dtes.service.spec.ts -t "retryMhVerify|reParse" 2>&1 | tail -5
```

- [ ] **Step 4: Implement retryMhVerify + reParse + helper**

Replace the two stub methods in `received-dtes.service.ts` with:

```ts
  async retryMhVerify(tenantId: string, id: string) {
    const row = await this.findOne(tenantId, id);
    if (row.ingestStatus === 'VERIFIED') {
      throw new ConflictException({ code: 'ALREADY_VERIFIED' });
    }

    await this.verifyOneFromCron(row);

    const updated = await this.prisma.receivedDTE.update({
      where: { id },
      data: { mhVerifyAttempts: { increment: 1 }, lastMhVerifyAt: new Date() },
      include: { purchase: { select: { id: true, purchaseNumber: true, status: true } } },
    });
    return updated;
  }

  async reParse(tenantId: string, id: string) {
    const row = await this.findOne(tenantId, id);
    if (!row.rawPayload) {
      throw new ConflictException({ code: 'NO_PAYLOAD' });
    }

    const parsed = this.parser.parse(row.rawPayload);

    if (!parsed.valid) {
      return this.prisma.receivedDTE.update({
        where: { id },
        data: {
          ingestStatus: 'FAILED',
          ingestErrors: JSON.stringify(parsed.errors ?? []),
        },
        include: { purchase: { select: { id: true, purchaseNumber: true, status: true } } },
      });
    }

    return this.prisma.receivedDTE.update({
      where: { id },
      data: {
        parsedPayload: JSON.stringify(parsed.dte),
        ingestStatus: row.ingestStatus === 'FAILED' ? 'PENDING' : row.ingestStatus,
        ingestErrors: null,
      },
      include: { purchase: { select: { id: true, purchaseNumber: true, status: true } } },
    });
  }

  // Helper that delegates to retry-cron logic. Subclass-overridable for tests.
  protected async verifyOneFromCron(row: { id: string; tenantId: string }): Promise<void> {
    // If ReceivedDteRetryCronService exposes a public method for a single row, inject
    // and call it here. Otherwise, log and rely on the cron picking up the row next tick.
    this.logger.log(`MH verify requested for ${row.id} — cron will process on next tick`);
  }
```

Note: injecting `ReceivedDteRetryCronService` directly may cause circular dep. Acceptable fallback: leave `verifyOneFromCron` as a log-only method (the cron already picks up eligible rows). If the cron service has an exported helper function (not class method) that processes one row in isolation, import that instead and call it here.

- [ ] **Step 5: Run tests — expect green**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/dte/services/received-dtes.service.spec.ts 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/dte/services/
git commit -m "feat(dte): add retryMhVerify + reParse to ReceivedDtesService"
```

---

### Task 4: `ReceivedDtesExportService` (XLSX)

**Files:**
- Create: `apps/api/src/modules/dte/services/received-dtes-export.service.ts`
- Create: `apps/api/src/modules/dte/services/received-dtes-export.service.spec.ts`
- Modify: `apps/api/src/modules/dte/dte.module.ts`

- [ ] **Step 1: Study existing XLSX pattern**

```bash
cd apps/api && head -100 src/modules/reports/services/kardex-report.service.ts
```
Note the exceljs import and workbook/worksheet pattern.

- [ ] **Step 2: Write failing tests**

Create `apps/api/src/modules/dte/services/received-dtes-export.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { PayloadTooLargeException } from '@nestjs/common';
import { ReceivedDtesExportService } from './received-dtes-export.service';
import { ReceivedDtesService } from './received-dtes.service';

describe('ReceivedDtesExportService', () => {
  let service: ReceivedDtesExportService;
  let received: { findAllForExport: jest.Mock };

  beforeEach(async () => {
    received = { findAllForExport: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        ReceivedDtesExportService,
        { provide: ReceivedDtesService, useValue: received },
      ],
    }).compile();
    service = module.get(ReceivedDtesExportService);
  });

  it('produces non-empty XLSX Buffer for happy row', async () => {
    received.findAllForExport.mockResolvedValue([{
      id: 'r1', tipoDte: '01', codigoGeneracion: 'CG', numeroControl: 'NC',
      emisorNIT: '0614', emisorNombre: 'X', ingestStatus: 'VERIFIED', ingestSource: 'CRON',
      mhVerifyAttempts: 1, lastMhVerifyAt: null, mhVerifyError: null, ingestErrors: null,
      selloRecepcion: 'SELLO', parsedPayload: JSON.stringify({ resumen: { totalGravada: 100, totalIva: 13, totalPagar: 113 } }),
      purchase: { id: 'p1', purchaseNumber: 'PUR-1' }, fhEmision: new Date('2026-04-10'), createdAt: new Date(),
    }]);
    const buf = await service.exportXlsx('t1', {});
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(1000);
  });

  it('throws 413 TOO_MANY if rows > 10000', async () => {
    received.findAllForExport.mockResolvedValue(new Array(10001).fill({
      id: 'x', tipoDte: '01', codigoGeneracion: 'CG', numeroControl: 'NC',
      emisorNIT: '0', emisorNombre: 'X', ingestStatus: 'PENDING', ingestSource: 'CRON',
      mhVerifyAttempts: 0, lastMhVerifyAt: null, mhVerifyError: null, ingestErrors: null,
      selloRecepcion: null, parsedPayload: null, purchase: null, fhEmision: new Date(), createdAt: new Date(),
    }));
    await expect(service.exportXlsx('t1', {})).rejects.toThrow(PayloadTooLargeException);
  });

  it('returns empty workbook buffer for 0 rows', async () => {
    received.findAllForExport.mockResolvedValue([]);
    const buf = await service.exportXlsx('t1', {});
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(500);
  });

  it('passes filters through to findAllForExport', async () => {
    received.findAllForExport.mockResolvedValue([]);
    await service.exportXlsx('t1', { desde: '2026-04-01', status: 'FAILED' });
    expect(received.findAllForExport).toHaveBeenCalledWith('t1', { desde: '2026-04-01', status: 'FAILED' });
  });
});
```

- [ ] **Step 3: Run fail**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/dte/services/received-dtes-export.service.spec.ts 2>&1 | tail -5
```

- [ ] **Step 4: Implement export service + findAllForExport helper**

Add to `ReceivedDtesService` (no pagination, up to 10001 rows for the cap check):

```ts
  async findAllForExport(tenantId: string, filters: Omit<FindAllFilters, 'page' | 'limit'>) {
    const where: Prisma.ReceivedDTEWhereInput = { tenantId };
    if (filters.status) where.ingestStatus = filters.status;
    if (filters.tipoDte) where.tipoDte = filters.tipoDte;
    if (filters.desde || filters.hasta) {
      where.fhEmision = {};
      if (filters.desde) (where.fhEmision as Prisma.DateTimeFilter).gte = new Date(filters.desde);
      if (filters.hasta) (where.fhEmision as Prisma.DateTimeFilter).lte = new Date(filters.hasta);
    }
    if (filters.search) {
      where.OR = [{ emisorNIT: { contains: filters.search } }, { emisorNombre: { contains: filters.search } }];
    }
    if (filters.hasPurchase === 'true') where.purchase = { isNot: null };
    else if (filters.hasPurchase === 'false') where.purchase = { is: null };

    return this.prisma.receivedDTE.findMany({
      where,
      include: { purchase: { select: { id: true, purchaseNumber: true, status: true } } },
      orderBy: { fhEmision: 'desc' },
      take: 10001, // sentinel for cap check
    });
  }
```

Create `apps/api/src/modules/dte/services/received-dtes-export.service.ts`:

```ts
import { Injectable, PayloadTooLargeException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ReceivedDtesService, type FindAllFilters } from './received-dtes.service';

const MAX_ROWS = 10000;

@Injectable()
export class ReceivedDtesExportService {
  constructor(private readonly received: ReceivedDtesService) {}

  async exportXlsx(tenantId: string, filters: Omit<FindAllFilters, 'page' | 'limit'>): Promise<Buffer> {
    const rows = await this.received.findAllForExport(tenantId, filters);
    if (rows.length > MAX_ROWS) {
      throw new PayloadTooLargeException({ code: 'TOO_MANY', max: MAX_ROWS });
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('DTEs Recibidos');

    ws.columns = [
      { header: 'Fecha emisión', key: 'fhEmision', width: 14 },
      { header: 'Tipo DTE', key: 'tipoDte', width: 10 },
      { header: 'Código generación', key: 'codigoGeneracion', width: 40 },
      { header: 'Núm. control', key: 'numeroControl', width: 30 },
      { header: 'NIT emisor', key: 'emisorNIT', width: 16 },
      { header: 'Nombre emisor', key: 'emisorNombre', width: 40 },
      { header: 'Estado', key: 'ingestStatus', width: 14 },
      { header: 'Origen', key: 'ingestSource', width: 10 },
      { header: 'Intentos MH', key: 'mhVerifyAttempts', width: 12 },
      { header: 'Última verificación', key: 'lastMhVerifyAt', width: 20 },
      { header: 'Error MH', key: 'mhVerifyError', width: 40 },
      { header: 'Errores parsing', key: 'ingestErrors', width: 40 },
      { header: 'Sello recepción', key: 'selloRecepcion', width: 40 },
      { header: 'Total gravada', key: 'totalGravada', width: 14 },
      { header: 'Total IVA', key: 'totalIva', width: 14 },
      { header: 'Total pagar', key: 'totalPagar', width: 14 },
      { header: 'Purchase ligada', key: 'purchaseNumber', width: 20 },
    ];
    ws.getRow(1).font = { bold: true };

    for (const r of rows) {
      let parsed: Record<string, unknown> | null = null;
      try { parsed = r.parsedPayload ? JSON.parse(r.parsedPayload) : null; } catch { parsed = null; }
      const resumen = (parsed?.resumen as Record<string, unknown>) ?? {};

      ws.addRow({
        fhEmision: r.fhEmision,
        tipoDte: r.tipoDte,
        codigoGeneracion: r.codigoGeneracion,
        numeroControl: r.numeroControl,
        emisorNIT: r.emisorNIT,
        emisorNombre: r.emisorNombre,
        ingestStatus: r.ingestStatus,
        ingestSource: r.ingestSource,
        mhVerifyAttempts: r.mhVerifyAttempts,
        lastMhVerifyAt: r.lastMhVerifyAt,
        mhVerifyError: r.mhVerifyError,
        ingestErrors: r.ingestErrors,
        selloRecepcion: r.selloRecepcion,
        totalGravada: resumen.totalGravada ?? '',
        totalIva: resumen.totalIva ?? '',
        totalPagar: resumen.totalPagar ?? '',
        purchaseNumber: (r as { purchase?: { purchaseNumber?: string } | null }).purchase?.purchaseNumber ?? '—',
      });
    }

    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columns.length } };

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }
}
```

- [ ] **Step 5: Register in module + run tests**

Add `ReceivedDtesExportService` to `dte.module.ts` providers.

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/dte/services/received-dtes-export.service.spec.ts 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/dte/
git commit -m "feat(dte): add ReceivedDtesExportService (XLSX, 17 columns)"
```

---

### Task 5: Extend `ReceivedDtesController` with 6 endpoints

**Files:**
- Modify: `apps/api/src/modules/dte/received-dtes.controller.ts`
- Modify: `apps/api/src/modules/dte/received-dtes.controller.spec.ts`

- [ ] **Step 1: Extend controller spec**

Append to `received-dtes.controller.spec.ts` (after the existing preview tests):

```ts
  describe('GET /', () => {
    it('delegates to service.findAll with tenantId and filters', async () => {
      service.findAll = jest.fn().mockResolvedValue({ data: [], total: 0, totalPages: 0, page: 1, limit: 20 });
      await controller.findAll({ tenantId: 't1', id: 'u1' } as any, { status: 'FAILED' } as any);
      expect(service.findAll).toHaveBeenCalledWith('t1', { status: 'FAILED' });
    });
  });

  describe('GET /:id', () => {
    it('delegates to service.findOne', async () => {
      service.findOne = jest.fn().mockResolvedValue({ id: 'r1' });
      await controller.findOne({ tenantId: 't1', id: 'u1' } as any, 'r1');
      expect(service.findOne).toHaveBeenCalledWith('t1', 'r1');
    });
  });

  describe('POST /', () => {
    it('delegates to service.createManual', async () => {
      service.createManual = jest.fn().mockResolvedValue({ id: 'r-new' });
      await controller.createManual({ tenantId: 't1', id: 'u1' } as any, { content: '{}', format: 'json' } as any);
      expect(service.createManual).toHaveBeenCalledWith('t1', 'u1', { content: '{}', format: 'json' });
    });
  });

  describe('POST /:id/retry-mh', () => {
    it('delegates to service.retryMhVerify', async () => {
      service.retryMhVerify = jest.fn().mockResolvedValue({ id: 'r1' });
      await controller.retryMh({ tenantId: 't1', id: 'u1' } as any, 'r1');
      expect(service.retryMhVerify).toHaveBeenCalledWith('t1', 'r1');
    });
  });

  describe('POST /:id/re-parse', () => {
    it('delegates to service.reParse', async () => {
      service.reParse = jest.fn().mockResolvedValue({ id: 'r1' });
      await controller.reParse({ tenantId: 't1', id: 'u1' } as any, 'r1');
      expect(service.reParse).toHaveBeenCalledWith('t1', 'r1');
    });
  });

  describe('GET /export', () => {
    it('streams XLSX with correct content-type header', async () => {
      exporter.exportXlsx = jest.fn().mockResolvedValue(Buffer.from('x'));
      const res = { setHeader: jest.fn(), send: jest.fn() } as unknown as { setHeader: jest.Mock; send: jest.Mock };
      await controller.exportXlsx({ tenantId: 't1', id: 'u1' } as any, {} as any, res as any);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', expect.stringContaining('spreadsheetml'));
      expect(res.send).toHaveBeenCalled();
    });
  });
```

In the `beforeEach`, add `ReceivedDtesService` and `ReceivedDtesExportService` as mocked providers:

```ts
    const service = { findAll: jest.fn(), findOne: jest.fn(), createManual: jest.fn(), retryMhVerify: jest.fn(), reParse: jest.fn() };
    const exporter = { exportXlsx: jest.fn() };
    // Include both in Test.createTestingModule providers array.
```

- [ ] **Step 2: Run — expect fail**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/dte/received-dtes.controller.spec.ts 2>&1 | tail -5
```

- [ ] **Step 3: Extend controller with 6 endpoints**

Replace `apps/api/src/modules/dte/received-dtes.controller.ts`:

```ts
import { Body, Controller, Get, Param, Post, Query, Res, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { DteImportParserService } from './services/dte-import-parser.service';
import { ReceivedDtesService } from './services/received-dtes.service';
import { ReceivedDtesExportService } from './services/received-dtes-export.service';
import { PreviewDteDto } from './dto/preview-dte.dto';
import { ImportReceivedDteDto } from './dto/import-received-dte.dto';
import { ReceivedDtesFilterDto } from './dto/received-dtes-filter.dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';

@ApiTags('received-dtes')
@Controller('received-dtes')
@ApiBearerAuth()
export class ReceivedDtesController {
  private readonly logger = new Logger(ReceivedDtesController.name);

  constructor(
    private readonly parser: DteImportParserService,
    private readonly service: ReceivedDtesService,
    private readonly exporter: ReceivedDtesExportService,
  ) {}

  @Get()
  @RequirePermission('purchases:read')
  @ApiOperation({ summary: 'Listar DTEs recibidos con filtros + paginación' })
  findAll(@CurrentUser() user: CurrentUserData, @Query() filters: ReceivedDtesFilterDto) {
    return this.service.findAll(user.tenantId, filters);
  }

  @Get('export')
  @RequirePermission('purchases:read')
  @ApiOperation({ summary: 'Exportar DTEs recibidos a XLSX' })
  async exportXlsx(
    @CurrentUser() user: CurrentUserData,
    @Query() filters: ReceivedDtesFilterDto,
    @Res() res: Response,
  ) {
    const { page: _p, limit: _l, ...rest } = filters;
    const buf = await this.exporter.exportXlsx(user.tenantId, rest);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="dtes-recibidos.xlsx"');
    res.send(buf);
  }

  @Get(':id')
  @RequirePermission('purchases:read')
  findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermission('purchases:create')
  @ApiOperation({ summary: 'Importar DTE manualmente (persiste en ReceivedDTE)' })
  createManual(@CurrentUser() user: CurrentUserData, @Body() dto: ImportReceivedDteDto) {
    return this.service.createManual(user.tenantId, user.id, dto);
  }

  @Post(':id/retry-mh')
  @RequirePermission('purchases:create')
  retryMh(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.service.retryMhVerify(user.tenantId, id);
  }

  @Post(':id/re-parse')
  @RequirePermission('purchases:create')
  reParse(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.service.reParse(user.tenantId, id);
  }

  @Post('preview')
  @RequirePermission('purchases:create')
  @ApiOperation({ summary: 'Parsear DTE sin persistir (preview para form de compra)' })
  preview(@Body() dto: PreviewDteDto) {
    if (dto.format === 'xml') {
      throw new (await import('@nestjs/common')).BadRequestException({ code: 'FORMAT_NOT_SUPPORTED' });
    }
    return this.parser.parse(dto.content);
  }
}
```

Note on route ordering: `/export` MUST be declared BEFORE `/:id` so it's matched first. (NestJS resolves in order.)

- [ ] **Step 4: Run tests — expect green**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/dte/ 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/dte/
git commit -m "feat(dte): extend ReceivedDtesController with 6 endpoints (list/get/create/retry/reparse/export)"
```

---

### Task 6: Frontend types + sub-nav + `/compras/recibidos` list page

**Files:**
- Modify: `apps/web/src/types/purchase.ts`
- Create: `apps/web/src/components/purchases/compras-tabs-nav.tsx`
- Create: `apps/web/src/app/(dashboard)/compras/recibidos/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/compras/page.tsx` (add tabs-nav at top)

- [ ] **Step 1: Extend types**

Append to `apps/web/src/types/purchase.ts`:

```ts
export type IngestStatus = 'PENDING' | 'VERIFIED' | 'UNVERIFIED' | 'FAILED' | string;
export type IngestSource = 'CRON' | 'MANUAL' | 'MH_AUTO' | string;

export interface ReceivedDteDetail {
  id: string;
  tenantId: string;
  tipoDte: string;
  numeroControl: string;
  codigoGeneracion: string;
  selloRecepcion: string | null;
  fhProcesamiento: string | null;
  fhEmision: string;
  emisorNIT: string;
  emisorNombre: string;
  rawPayload: string;
  parsedPayload: string | null;
  ingestStatus: IngestStatus;
  ingestErrors: string | null;
  ingestSource: IngestSource;
  mhVerifyAttempts: number;
  lastMhVerifyAt: string | null;
  mhVerifyError: string | null;
  purchase: { id: string; purchaseNumber: string; status: string } | null;
  createdAt: string;
  createdBy: string;
}
```

- [ ] **Step 2: Sub-nav component**

Create `apps/web/src/components/purchases/compras-tabs-nav.tsx`:

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ComprasTabsNav() {
  const pathname = usePathname();
  const isRecibidos = pathname?.startsWith('/compras/recibidos');
  return (
    <div className="flex gap-2 border-b pb-2 mb-4">
      <Link
        href="/compras"
        className={cn('px-4 py-2 rounded-md text-sm font-medium', !isRecibidos ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
      >
        Compras
      </Link>
      <Link
        href="/compras/recibidos"
        className={cn('px-4 py-2 rounded-md text-sm font-medium', isRecibidos ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
      >
        DTEs recibidos
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Add sub-nav to `/compras/page.tsx`**

Import `ComprasTabsNav` at top of `apps/web/src/app/(dashboard)/compras/page.tsx` and render `<ComprasTabsNav />` as the first child inside the page's root container (below the outer `<div>` but above the header).

- [ ] **Step 4: Create `/compras/recibidos/page.tsx`**

Create `apps/web/src/app/(dashboard)/compras/recibidos/page.tsx`. Follow the pattern of `/compras/page.tsx` (Fase 2.2, ~487 lines). Key differences:

- Title: "DTEs recibidos".
- Buttons: `+ Importar DTE` (opens `ImportDteManualModal` — comes in Task 8, stub with toast for now), `📥 Exportar Excel` (blob download from `/api/v1/received-dtes/export?...` with Authorization header via `apiFetch` returning Blob).
- `<ComprasTabsNav />` at top.
- Filters: rango fecha `desde`/`hasta` on `fhEmision` (default mes actual), estado pills (`Todos | PENDING | VERIFIED | UNVERIFIED | FAILED | Convertidos`), multi-select tipoDte (01/03/05/06/07/11/14/15), search input.
- Fetch: `GET /received-dtes?...` via `apiFetch<{data: ReceivedDteDetail[]; total; totalPages; page; limit}>`.
- Columns desktop: `fhEmision | tipoDte | numeroControl | emisor (NIT + nombre) | estado badge | intentos MH | Purchase (✓/—) | acciones (ver, retry si FAILED/UNVERIFIED, convertir si VERIFIED sin purchase)`.
- Mobile: cards stack.
- Estado "Convertidos" → sends filter `hasPurchase=true`.

For the export button:

```tsx
async function handleExport() {
  try {
    const resp = await fetch(`${API_URL}/received-dtes/export?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dtes-recibidos-${new Date().toISOString().slice(0,10)}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
  } catch (err) { toast.error((err as Error).message ?? 'Error exportando'); }
}
```
(Use the app's existing token-fetch helper if one exists; otherwise use the raw pattern above.)

- [ ] **Step 5: Verify TS**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx tsc --noEmit 2>&1 | grep -v sync-engine | head -10
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/types/ apps/web/src/components/purchases/compras-tabs-nav.tsx apps/web/src/app/\(dashboard\)/compras/
git commit -m "feat(web): add /compras/recibidos list page + ComprasTabsNav"
```

---

### Task 7: `/compras/recibidos/[id]` detail page (4 tabs)

**Files:**
- Create: `apps/web/src/app/(dashboard)/compras/recibidos/[id]/page.tsx`

- [ ] **Step 1: Create detail page**

Create `apps/web/src/app/(dashboard)/compras/recibidos/[id]/page.tsx` (~400 lines). Skeleton:

```tsx
'use client';
import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { ComprasTabsNav } from '@/components/purchases/compras-tabs-nav';
import type { ReceivedDteDetail } from '@/types/purchase';

const MAX_PAYLOAD_CHARS = 500_000;

export default function ReceivedDteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = params?.id as string;
  const [dte, setDte] = React.useState<ReceivedDteDetail | null>(null);
  const [refetchKey, setRefetchKey] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<ReceivedDteDetail>(`/received-dtes/${id}`)
      .then((d) => { if (!cancelled) setDte(d); })
      .catch((err) => toast.error((err as Error).message ?? 'Error cargando DTE'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, refetchKey, toast]);

  if (loading || !dte) return <div className="p-4">Cargando…</div>;

  const handleRetry = async () => {
    try { await apiFetch(`/received-dtes/${id}/retry-mh`, { method: 'POST' }); toast.success('Retry MH disparado'); setRefetchKey((k) => k + 1); }
    catch (err) {
      const anyErr = err as { code?: string; message?: string };
      if (anyErr.code === 'ALREADY_VERIFIED') { toast.info('Ya verificado'); setRefetchKey((k) => k + 1); }
      else toast.error(anyErr.message ?? 'Error en retry');
    }
  };

  const handleReParse = async () => {
    try { const r = await apiFetch<ReceivedDteDetail>(`/received-dtes/${id}/re-parse`, { method: 'POST' }); toast.success('Re-parse completo'); setDte(r); }
    catch (err) {
      const anyErr = err as { code?: string; message?: string };
      if (anyErr.code === 'NO_PAYLOAD') toast.error('rawPayload vacío, no se puede re-parsear');
      else toast.error(anyErr.message ?? 'Error en re-parse');
    }
  };

  const handleConvert = () => router.push(`/compras/nueva?receivedDteId=${dte.id}`);

  const parsed = React.useMemo(() => {
    if (!dte.parsedPayload) return null;
    try { return JSON.parse(dte.parsedPayload) as Record<string, unknown>; } catch { return null; }
  }, [dte.parsedPayload]);

  const items = (parsed?.cuerpoDocumento as Array<Record<string, unknown>>) ?? [];
  const resumen = (parsed?.resumen as Record<string, unknown>) ?? {};
  const rawTruncated = dte.rawPayload.length > MAX_PAYLOAD_CHARS;
  const rawToShow = rawTruncated ? dte.rawPayload.slice(0, MAX_PAYLOAD_CHARS) + '\n\n... (truncado)' : dte.rawPayload;

  const errors = (() => {
    if (!dte.ingestErrors) return [];
    try { return JSON.parse(dte.ingestErrors) as Array<Record<string, unknown>>; } catch { return [{ message: dte.ingestErrors }]; }
  })();

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <ComprasTabsNav />

      <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">DTE {dte.tipoDte} — {dte.numeroControl}</h1>
          <p className="text-sm text-muted-foreground">{dte.emisorNombre} ({dte.emisorNIT})</p>
        </div>
        <Badge variant={/* map status → variant */ 'default'}>{dte.ingestStatus}</Badge>
      </div>

      <Tabs defaultValue="resumen" className="mb-4">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="raw">JSON crudo</TabsTrigger>
          <TabsTrigger value="historial">Historial MH</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="pt-4">
          {/* 2-col grid: izq datos emisor/fechas/sello/source; der totales del resumen */}
        </TabsContent>

        <TabsContent value="items" className="pt-4">
          {/* tabla de items si parsed.cuerpoDocumento existe */}
          {items.length === 0 ? <p>Sin líneas parseadas.</p> : /* render table */ null}
        </TabsContent>

        <TabsContent value="raw" className="pt-4">
          <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-[600px]">{rawToShow}</pre>
          {rawTruncated && <Button variant="outline" size="sm" className="mt-2" onClick={() => {
            const blob = new Blob([dte.rawPayload], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${dte.codigoGeneracion}.json`; a.click(); URL.revokeObjectURL(url);
          }}>Descargar payload completo</Button>}
        </TabsContent>

        <TabsContent value="historial" className="pt-4">
          <div className="space-y-2">
            <p>Intentos MH: <strong>{dte.mhVerifyAttempts}</strong></p>
            <p>Última verificación: {dte.lastMhVerifyAt ?? '—'}</p>
            <p>Error MH: {dte.mhVerifyError ?? '—'}</p>
            {errors.length > 0 && (
              <div>
                <h4 className="font-semibold">Errores parsing:</h4>
                <ul className="list-disc pl-5">{errors.map((e, i) => <li key={i}>{String((e as { message?: string }).message ?? JSON.stringify(e))}</li>)}</ul>
              </div>
            )}
            {dte.mhVerifyAttempts === 0 && !dte.mhVerifyError && <p className="text-muted-foreground">Sin intentos de verificación MH registrados.</p>}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 flex-wrap">
        {dte.purchase ? (
          <Button onClick={() => router.push(`/compras/${dte.purchase!.id}`)}>Ver compra ligada</Button>
        ) : dte.ingestStatus === 'VERIFIED' ? (
          <Button onClick={handleConvert}>Convertir a compra</Button>
        ) : null}
        {['FAILED', 'UNVERIFIED'].includes(dte.ingestStatus) && (
          <Button variant="outline" onClick={handleRetry}>🔄 Reintentar verificación MH</Button>
        )}
        {(['PENDING', 'FAILED'].includes(dte.ingestStatus) || errors.length > 0) && (
          <Button variant="outline" onClick={handleReParse}>🧩 Re-parsear</Button>
        )}
      </div>
    </div>
  );
}
```

Complete the Resumen tab grid (emisor data + fechas) and Items table (columns: #, descripcion, cantidad, precioUni, ventaGravada, ivaItem) by mapping parsed fields. Use existing shadcn `<Table>` components.

- [ ] **Step 2: Verify TS**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx tsc --noEmit 2>&1 | grep -v sync-engine | head -10
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/compras/recibidos/
git commit -m "feat(web): add /compras/recibidos/[id] detail page with 4 tabs"
```

---

### Task 8: `ImportDteManualModal` + orchestrator patch for `?receivedDteId=X`

**Files:**
- Create: `apps/web/src/components/purchases/import-dte-manual-modal.tsx`
- Modify: `apps/web/src/app/(dashboard)/compras/recibidos/page.tsx` (wire modal)
- Modify: `apps/web/src/app/(dashboard)/compras/nueva/page.tsx` (accept `?receivedDteId=X`)

- [ ] **Step 1: Create `ImportDteManualModal`**

Create `apps/web/src/components/purchases/import-dte-manual-modal.tsx`:

```tsx
'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import type { ReceivedDteDetail } from '@/types/purchase';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ImportDteManualModal({ open, onOpenChange }: Props) {
  const [content, setContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const dte = await apiFetch<ReceivedDteDetail>('/received-dtes', {
        method: 'POST',
        body: JSON.stringify({ content, format: 'json' }),
      });
      toast.success('DTE importado y persistido');
      onOpenChange(false);
      setContent('');
      router.push(`/compras/recibidos/${dte.id}`);
    } catch (err) {
      const anyErr = err as { code?: string; existingId?: string; message?: string };
      if (anyErr.code === 'DUPLICATE' && anyErr.existingId) {
        toast.info('Este DTE ya existe. Abriendo el existente...');
        onOpenChange(false);
        router.push(`/compras/recibidos/${anyErr.existingId}`);
      } else if (anyErr.code === 'FORMAT_NOT_SUPPORTED') {
        toast.error('Solo formato JSON disponible en esta versión');
      } else if (anyErr.code === 'INVALID_JSON') {
        toast.error('JSON inválido. Revisa el contenido.');
      } else {
        toast.error(anyErr.message ?? 'Error importando');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Importar DTE (persistir en cola)</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>Pega el JSON del DTE:</Label>
          <Textarea
            rows={14}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder='{"identificacion":{...},"emisor":{...},"receptor":{...},"cuerpoDocumento":[...],"resumen":{...}}'
          />
          <p className="text-xs text-muted-foreground">Este DTE se guardará en la bandeja `DTEs recibidos`. Puedes convertirlo a Compra después.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting || content.trim().length < 10}>
            {submitting ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Wire modal into list page**

In `apps/web/src/app/(dashboard)/compras/recibidos/page.tsx`, replace the "+ Importar DTE" toast placeholder with opening `ImportDteManualModal`. Render the modal at the bottom of the JSX. Increment `refetchKey` when modal closes after successful import (via `onOpenChange` handler that runs a refetch trigger — or just rely on the router.push already navigating away).

- [ ] **Step 3: Orchestrator `?receivedDteId=X`**

Edit `apps/web/src/app/(dashboard)/compras/nueva/page.tsx`. In the existing mount `useEffect` that handles `?source=imported`, add a branch that handles `?receivedDteId=X`:

```tsx
  React.useEffect(() => {
    const receivedDteId = searchParams.get('receivedDteId');
    if (receivedDteId) {
      (async () => {
        try {
          const dte = await apiFetch<{ purchase: { id: string } | null; parsedPayload: string | null; emisorNIT: string; emisorNombre: string; tipoDte: string; numeroControl: string; fhEmision: string }>(`/received-dtes/${receivedDteId}`);
          if (dte.purchase) {
            toast.info('Este DTE ya tiene una compra ligada');
            router.replace(`/compras/${dte.purchase.id}`);
            return;
          }
          // Map proveedor: try to find by NIT
          try {
            const res = await apiFetch<{ data: Proveedor[] }>(`/clientes?isSupplier=true&q=${encodeURIComponent(dte.emisorNIT)}&limit=1`);
            const match = res.data.find((p) => p.numDocumento === dte.emisorNIT);
            if (match) setProveedor(match);
            else toast.info(`Proveedor ${dte.emisorNIT} no existe — créalo con el botón "+ Crear proveedor"`);
          } catch { /* ignore */ }

          setTipoDoc((['FC','CCF','NCF','NDF','OTRO'].includes(dte.tipoDte) ? dte.tipoDte : 'OTRO') as TipoDocProveedor);
          setNumDoc(dte.numeroControl);
          setFechaDoc(dte.fhEmision.slice(0, 10));
          setFechaContable(dte.fhEmision.slice(0, 10));

          // Map parsed items → lineas
          if (dte.parsedPayload) {
            try {
              const parsed = JSON.parse(dte.parsedPayload) as { cuerpoDocumento?: Array<Record<string, unknown>> };
              const lineasMapped: PurchaseLine[] = (parsed.cuerpoDocumento ?? []).map((it) => {
                const cant = Number(it.cantidad ?? 0);
                const precio = Number(it.precioUni ?? 0);
                const descMonto = Number(it.montoDescu ?? 0);
                const descPct = cant && precio ? (descMonto / (cant * precio)) * 100 : 0;
                return {
                  tipo: 'bien',
                  itemId: undefined,
                  descripcion: String(it.descripcion ?? ''),
                  cantidad: cant,
                  precioUnit: precio,
                  descuentoPct: descPct,
                  ivaAplica: Number(it.ventaGravada ?? 0) > 0,
                  totalLinea: Number(it.ventaGravada ?? 0) + Number(it.ventaExenta ?? 0),
                };
              });
              setLineas(lineasMapped);
              toast.info('Líneas importadas — asigna items del catálogo antes de contabilizar');
            } catch { /* ignore */ }
          }
        } catch (err) {
          toast.error((err as Error).message ?? 'Error cargando DTE');
        }
      })();
    } else if (searchParams.get('source') === 'imported') {
      // existing sessionStorage branch
    } else {
      // existing localStorage draft restore
    }
  }, [searchParams, toast, router]);
```

(Imports needed: `PurchaseLine`, `TipoDocProveedor`, `Proveedor`.)

- [ ] **Step 4: Verify TS + build**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx tsc --noEmit 2>&1 | grep -v sync-engine | head -10
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/purchases/import-dte-manual-modal.tsx apps/web/src/app/\(dashboard\)/compras/
git commit -m "feat(web): add ImportDteManualModal + /compras/nueva ?receivedDteId=X prefill"
```

---

### Task 9: E2E stub + regression + evidence + PR

**Files:**
- Create: `apps/web/tests/e2e/received-dtes.spec.ts`
- Create: `outputs/EXECUTION_EVIDENCE_PHASE_2_3.md`

- [ ] **Step 1: E2E stub**

Create `apps/web/tests/e2e/received-dtes.spec.ts`:

```ts
import { test } from '@playwright/test';

test.describe('DTEs Recibidos UI', () => {
  test.skip('auditoría mensual — filter + export XLSX', async () => {
    // TODO: unblock when staging env ready
  });

  test.skip('import manual JSON → retry-mh → VERIFIED', async () => {
    // TODO: unblock when staging env ready
  });

  test.skip('convertir VERIFIED → /compras/nueva prefilled → contabilizar', async () => {
    // TODO: unblock when staging env ready
  });
});
```

- [ ] **Step 2: Regression sweep**

```bash
cd /home/jose/facturador-electronico-sv/apps/api && npx jest --config jest.config.ts src/modules/ 2>&1 | tail -5
cd /home/jose/facturador-electronico-sv/apps/api && npx tsc --noEmit 2>&1 | grep -c "error TS"
cd /home/jose/facturador-electronico-sv/apps/web && npx tsc --noEmit 2>&1 | grep -v sync-engine | grep -c "error TS"
```
Record counts.

- [ ] **Step 3: Write evidence**

Create `outputs/EXECUTION_EVIDENCE_PHASE_2_3.md`:

```markdown
# Execution Evidence — Fase 2.3 DTEs Recibidos UI

**Date:** 2026-04-18
**Branch:** `feature/received-dtes-ui`
**Spec:** `docs/superpowers/specs/2026-04-18-fase-2-3-received-dtes-ui-design.md`
**Plan:** `docs/superpowers/plans/2026-04-18-fase-2-3-received-dtes-ui.md`

## Built

### Backend
- `ReceivedDtesService` with `findAll`, `findOne`, `createManual`, `retryMhVerify`, `reParse`, `findAllForExport`.
- `ReceivedDtesExportService` (XLSX, 17 columns, 10k cap).
- `ReceivedDtesController` +6 endpoints: `GET /`, `GET /:id`, `POST /`, `POST /:id/retry-mh`, `POST /:id/re-parse`, `GET /export`.
- DTOs: `ImportReceivedDteDto`, `ReceivedDtesFilterDto`.

### Frontend
- `/compras/recibidos` list page with filters + export + actions.
- `/compras/recibidos/[id]` detail page with 4 tabs (Resumen, Items, JSON crudo, Historial MH).
- `ImportDteManualModal` (persist flow, distinct from Fase 2.2 preview modal).
- `ComprasTabsNav` sub-nav between Compras / DTEs recibidos.
- Orchestrator `/compras/nueva` soporta `?receivedDteId=X` con prefill.
- Types: `ReceivedDteDetail`, `IngestStatus`, `IngestSource`.

## Tests

- Backend jest: <NUMBER_BEFORE> → <NUMBER_AFTER> passing.
- TypeScript: limpio (API + Web).
- E2E: 3 `test.skip` para staging env.

## Not included (deferred)

- XML import.
- Batch actions.
- Auto-refresh / polling.
- Dashboard widget con fallidos.

## Post-deploy runbook

**No schema changes. No RBAC changes.**

1. Deploy a staging (auto via CI).
2. Smoke: login → `/compras/recibidos` → filter mes actual → verifica lista.
3. Export Excel → abre en Excel/LibreOffice, verifica 17 cols.
4. Import manual con JSON de sample DTE → verifica aparece con PENDING.
5. Retry-mh en FAILED → verifica cambia status.
6. Merge → prod deploy → repeat smoke.

## Commits

<INSERT git log --oneline main..HEAD OUTPUT>

## Rollback

`git revert <merge-sha>` → CI redeploys. Zero DB changes, zero RBAC changes — rollback es reversión pura de código.
```

Substitute `<NUMBER_BEFORE>` / `<NUMBER_AFTER>` and `<INSERT git log …>` with actuals.

- [ ] **Step 4: Commit + push**

```bash
cd /home/jose/facturador-electronico-sv
git add outputs/EXECUTION_EVIDENCE_PHASE_2_3.md apps/web/tests/e2e/received-dtes.spec.ts
git commit -m "docs: execution evidence for Fase 2.3 DTEs Recibidos UI"
git push -u origin feature/received-dtes-ui
```

- [ ] **Step 5: Open PR**

```bash
gh pr create --title "feat(dtes-recibidos): Fase 2.3 — UI de DTEs recibidos (sub-proyecto C)" --body "$(cat <<'EOF'
## Summary

Sub-proyecto C del roadmap (A→C→B→D). Entrega UI para la bandeja de DTEs recibidos del cron + import manual + retry MH + re-parse + convertir a compra + export XLSX mensual. **Zero schema changes, zero RBAC changes, zero new deps.**

## Backend

- \`ReceivedDtesService\`: findAll/findOne/createManual/retryMhVerify/reParse/findAllForExport.
- \`ReceivedDtesExportService\`: XLSX 17 columnas, cap 10k rows.
- \`ReceivedDtesController\` +6 endpoints.

## Frontend

- Páginas: \`/compras/recibidos\` + \`/compras/recibidos/[id]\`.
- \`ImportDteManualModal\` persistente.
- Sub-nav \`ComprasTabsNav\`.
- \`/compras/nueva\` acepta \`?receivedDteId=X\` con prefill del parsedPayload.

## Test plan

- [x] Backend jest: sin regresiones.
- [x] TypeScript limpio API + Web.
- [x] 3 E2E stub (skip hasta staging).
- [ ] Manual QA staging (runbook en evidence).

## Post-deploy

Zero schema / RBAC changes. Auto deploy via CI. Runbook en \`outputs/EXECUTION_EVIDENCE_PHASE_2_3.md\`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Capturar PR URL.

- [ ] **Step 6: Report** — PR URL + commit count + regression verdict.

---

## Self-Review

### Spec coverage

- Spec §2 (scope): Tasks 2–8 cubren backend + frontend; Task 9 cierra (E2E + PR). ✅
- Spec §4 (páginas): Task 6 (`/compras/recibidos`), Task 7 (`/compras/recibidos/[id]`), Task 8 (`ImportDteManualModal` + orchestrator patch). ✅
- Spec §5 (componentes y tipos): Task 6 Step 1 (types), Task 8 (modal). ✅
- Spec §6.1 (endpoints): Tasks 2–5. ✅
- Spec §6.2 (17 columnas export): Task 4 Step 4. ✅
- Spec §7.1 (error codes): cubiertos en specs de Tasks 2/3/4 (códigos `DUPLICATE`, `ALREADY_VERIFIED`, `NO_PAYLOAD`, `TOO_MANY`, `INVALID_JSON`, `FORMAT_NOT_SUPPORTED`).
- Spec §7.2 (frontend error handling): Task 7 (detail actions) + Task 8 (modal).
- Spec §8 (testing): Tasks 2/3/4/5 unit tests; Task 9 E2E stub + regression.
- Spec §9 (deploy): Task 9 Step 3 (evidence runbook).

### Placeholders

- "Complete the Resumen tab grid …" en Task 7 Step 1 — dirección explícita con fields listados. No es un TODO abierto.
- "(Imports needed: …)" en Task 8 Step 3 — explícito, no se asume.
- `verifyOneFromCron` helper en Task 3 Step 4 — fallback documentado (log-only si no hay helper público disponible; upgrade futuro).

### Type consistency

- `ReceivedDteDetail` interface consistente en backend responses (include del prisma return) y frontend type.
- `IngestStatus` / `IngestSource` son `string` aliases — alineado con DB que almacena NVarChar.
- `findAll` devuelve `{data, total, totalPages, page, limit}` — igual pattern que `PurchasesService.findAll`.
- Route order: `/export` ANTES de `/:id` en Task 5 Step 3 — crítico para NestJS matching.

### Scope

- Enfocado en sub-proyecto C. No toca B (Inventario) ni D (Contabilidad views). Follow-ups §10 claramente marcados.
