# Fase 2.6 — Physical Count Implementation Plan (B.3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir al usuario registrar el conteo físico anual de inventario (una sesión por año fiscal por tenant) con captura online inline + CSV upload, revisar el resumen de variances, y finalizar — lo que genera automáticamente `AJUSTE_FISICO_FALTANTE` / `AJUSTE_FISICO_SOBRANTE` vía el `InventoryAdjustmentService` de B.2.

**Architecture:** Nuevo módulo backend `physical-counts` con 2 services (CRUD + CSV parser) + controller con 7 endpoints. Extensión no-breaking de `InventoryAdjustmentService` (flag `skipDateValidation` en 4° parámetro opcional). Frontend: 2 páginas nuevas (list + detail) bajo `/inventario/conteo`. Reusa schema existente `PhysicalCount` + `PhysicalCountDetail`. Zero schema changes. Reusa permission `inventory:adjust` y feature flag `inventory_reports`.

**Tech Stack:** NestJS 10 + Prisma 5.10 + papaparse (nueva dep para CSV) + Jest + manual Prisma mock. Next.js 15 App Router + Tailwind + shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-04-19-fase-2-6-physical-count-design.md`
**Depende de:** Fases 1.2–2.5 merged a main ✅

---

## File structure

**Create (backend):**
- `apps/api/src/modules/physical-counts/physical-counts.module.ts`
- `apps/api/src/modules/physical-counts/physical-counts.controller.ts`
- `apps/api/src/modules/physical-counts/physical-counts.controller.spec.ts`
- `apps/api/src/modules/physical-counts/services/physical-count.service.ts`
- `apps/api/src/modules/physical-counts/services/physical-count.service.spec.ts`
- `apps/api/src/modules/physical-counts/services/physical-count-csv.service.ts`
- `apps/api/src/modules/physical-counts/services/physical-count-csv.service.spec.ts`
- `apps/api/src/modules/physical-counts/dto/create-physical-count.dto.ts`
- `apps/api/src/modules/physical-counts/dto/update-detail.dto.ts`
- `apps/api/src/modules/physical-counts/dto/list-counts.dto.ts`
- `apps/api/src/modules/physical-counts/dto/finalize.dto.ts`
- `apps/api/src/modules/physical-counts/dto/cancel.dto.ts`

**Create (frontend):**
- `apps/web/src/app/(dashboard)/inventario/conteo/page.tsx`
- `apps/web/src/app/(dashboard)/inventario/conteo/[id]/page.tsx`
- `apps/web/src/components/inventory/finalize-confirm-modal.tsx`
- `apps/web/src/components/inventory/csv-upload-button.tsx`
- `outputs/EXECUTION_EVIDENCE_PHASE_2_6.md`

**Modify (backend):**
- `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.ts` — añadir 4° param opcional `options?: { skipDateValidation?: boolean }`.
- `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts` — añadir 2 tests (flag honored, default rejects).
- `apps/api/src/app.module.ts` — registrar `PhysicalCountsModule`.
- `apps/api/package.json` — añadir `papaparse` dep.

**Modify (frontend):**
- `apps/web/src/types/inventory.ts` — añadir types `PhysicalCountStatus`, `PhysicalCount`, `PhysicalCountDetail`, `PhysicalCountSummary`, `CsvUploadResult`, etc.
- `apps/web/src/app/(dashboard)/inventario/page.tsx` — añadir botón `Conteo físico →` en header.
- `apps/web/tests/e2e/inventory.spec.ts` — añadir 1 `test.skip`.

No schema changes.

---

### Task 1: Branch + baseline + worktree

**Files:** none (setup only).

- [ ] **Step 1: Create worktree + branch**

```bash
cd /home/jose/facturador-electronico-sv
git fetch origin main
git worktree add .worktrees/physical-count -b feature/physical-count origin/main
cd .worktrees/physical-count
git branch --show-current
```
Expected: `feature/physical-count`.

- [ ] **Step 2: Verify prereqs (Fase 2.5 merged)**

```bash
test -d apps/api/src/modules/inventory-adjustments/services && echo "B.2 module OK"
grep -q "createAdjustment" apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.ts && echo "createAdjustment OK"
grep -q "model PhysicalCount " apps/api/prisma/schema.prisma && echo "PhysicalCount schema OK"
grep -q "model PhysicalCountDetail" apps/api/prisma/schema.prisma && echo "PhysicalCountDetail schema OK"
grep -q "AJUSTE_FISICO_FALTANTE" apps/api/src/modules/accounting/default-mappings.data.ts && echo "FALTANTE mapping OK"
grep -q "AJUSTE_FISICO_SOBRANTE" apps/api/src/modules/accounting/default-mappings.data.ts && echo "SOBRANTE mapping OK"
grep -q "inventory:adjust" apps/api/src/modules/rbac/services/rbac.service.ts && echo "inventory:adjust perm OK"
```
Expected: 7 OK. Else → BLOCKED.

- [ ] **Step 3: Install papaparse**

```bash
cd apps/api && npm install papaparse && npm install -D @types/papaparse
```
Verify `package.json` added both. Commit from Step 7 will include the install.

- [ ] **Step 4: Baseline test count**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx jest --config jest.config.ts src/modules/ 2>&1 | grep -E "(Tests:|Test Suites:)" | head -2
```
Record baseline.

- [ ] **Step 5: Typecheck baseline**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx tsc --noEmit 2>&1 | grep -c "error TS"
```
Record count (~25 pre-existing expected).

- [ ] **Step 6: No commit yet** — papaparse install goes with Task 6 commit (where it's first used).

- [ ] **Step 7: Roll back node_modules change if not already tracked**

The `npm install` above modified `package.json` + `package-lock.json`. Stash them for Task 6:

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count
git stash push -m "papaparse install — for Task 6" -- apps/api/package.json apps/api/package-lock.json
```

You'll `git stash pop` at Task 6.

---

### Task 2: Extend `InventoryAdjustmentService` with `skipDateValidation`

**Files:**
- Modify: `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.ts`
- Modify: `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts`

- [ ] **Step 1: Append 2 spec cases (TDD red)**

Open the existing spec file. Find the `describe('createAdjustment — salidas', ...)` block. After it (still inside the top-level `describe('InventoryAdjustmentService', ...)`), append:

```typescript
  describe('createAdjustment — skipDateValidation flag', () => {
    it('skipDateValidation=true allows movementDate before current month', async () => {
      mockItem(); mockState(10, 5); mockCorrelativo(); mockMovementCreated();
      prisma.inventoryState.update.mockResolvedValue({});
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'FREE' });
      planFeatures.checkFeatureAccess.mockResolvedValue(false);

      // Date from 3 months ago — would normally reject with DATE_BEFORE_MONTH_START
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 3);
      const dateStr = pastDate.toISOString().slice(0, 10);

      const input = {
        catalogItemId: 'c1',
        subtype: 'MERMA' as const,
        quantity: 2,
        movementDate: dateStr,
      };

      await expect(
        service.createAdjustment(tenantId, userId, input, { skipDateValidation: true }),
      ).resolves.toBeDefined();
    });

    it('without flag, still rejects past dates as DATE_BEFORE_MONTH_START', async () => {
      mockItem();
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 3);
      const dateStr = pastDate.toISOString().slice(0, 10);

      const input = {
        catalogItemId: 'c1',
        subtype: 'MERMA' as const,
        quantity: 2,
        movementDate: dateStr,
      };

      await expect(
        service.createAdjustment(tenantId, userId, input),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'DATE_BEFORE_MONTH_START' }),
      });
    });
  });
```

- [ ] **Step 2: Run → RED**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx jest --config jest.config.ts src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts 2>&1 | tail -8
```
Expected: the first new test FAILS (flag doesn't exist yet); the second should still pass.

- [ ] **Step 3: Modify service signature**

Open `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.ts`. Find the `createAdjustment` method signature (around line 90). Change:

```typescript
  async createAdjustment(tenantId: string, userId: string, dto: CreateAdjustmentDto) {
```

to:

```typescript
  async createAdjustment(
    tenantId: string,
    userId: string,
    dto: CreateAdjustmentDto,
    options?: { skipDateValidation?: boolean },
  ) {
```

Find the line `this.validateDate(dto.movementDate);` (around line 105). Change to:

```typescript
    if (!options?.skipDateValidation) {
      this.validateDate(dto.movementDate);
    }
```

- [ ] **Step 4: Run → GREEN**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx jest --config jest.config.ts src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts 2>&1 | tail -8
```
Expected: all tests pass (28 = previous 26 + 2 new).

- [ ] **Step 5: Typecheck**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx tsc --noEmit 2>&1 | grep -E "inventory-adjustments" | head -5
```
Expected: empty.

- [ ] **Step 6: Commit**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count
git add apps/api/src/modules/inventory-adjustments/services/
git commit -m "feat(inventory-adjustments): add skipDateValidation option for physical count flow"
```

---

### Task 3: DTOs

**Files:**
- Create: `apps/api/src/modules/physical-counts/dto/create-physical-count.dto.ts`
- Create: `apps/api/src/modules/physical-counts/dto/update-detail.dto.ts`
- Create: `apps/api/src/modules/physical-counts/dto/list-counts.dto.ts`
- Create: `apps/api/src/modules/physical-counts/dto/finalize.dto.ts`
- Create: `apps/api/src/modules/physical-counts/dto/cancel.dto.ts`

- [ ] **Step 1: Create `CreatePhysicalCountDto`**

```typescript
// apps/api/src/modules/physical-counts/dto/create-physical-count.dto.ts
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePhysicalCountDto {
  @IsDateString()
  countDate!: string;

  @Type(() => Number) @IsInt() @Min(2000) @Max(2100)
  fiscalYear!: number;

  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;
}
```

- [ ] **Step 2: Create `UpdateDetailDto`**

```typescript
// apps/api/src/modules/physical-counts/dto/update-detail.dto.ts
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDetailDto {
  @IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0) @Type(() => Number)
  countedQty?: number | null;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0) @Type(() => Number)
  unitCost?: number;

  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}
```

**Note:** `countedQty` can be `null` explicitly (reset). `@IsOptional()` accepts both `undefined` and `null`.

- [ ] **Step 3: Create `ListCountsDto`**

```typescript
// apps/api/src/modules/physical-counts/dto/list-counts.dto.ts
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const PHYSICAL_COUNT_STATUSES = ['DRAFT', 'FINALIZED', 'CANCELLED'] as const;
export type PhysicalCountStatus = (typeof PHYSICAL_COUNT_STATUSES)[number];

export class ListCountsDto {
  @IsOptional() @IsIn(PHYSICAL_COUNT_STATUSES)
  status?: PhysicalCountStatus;

  @IsOptional() @Type(() => Number) @IsInt() @Min(2000) @Max(2100)
  fiscalYear?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;
}
```

- [ ] **Step 4: Create `FinalizeDto`**

```typescript
// apps/api/src/modules/physical-counts/dto/finalize.dto.ts
import { Equals } from 'class-validator';

export class FinalizeDto {
  @Equals(true)
  confirm!: boolean;
}
```

- [ ] **Step 5: Create `CancelDto`**

```typescript
// apps/api/src/modules/physical-counts/dto/cancel.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelDto {
  @IsOptional() @IsString() @MaxLength(500)
  reason?: string;
}
```

- [ ] **Step 6: Typecheck**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx tsc --noEmit 2>&1 | grep "physical-counts" | head -5
```
Expected: empty.

- [ ] **Step 7: Commit**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count
git add apps/api/src/modules/physical-counts/dto/
git commit -m "feat(physical-counts): add DTOs (create, update-detail, list, finalize, cancel)"
```

---

### Task 4: `PhysicalCountService` — create + findAll + findOne

**Files:**
- Create: `apps/api/src/modules/physical-counts/services/physical-count.service.ts`
- Create: `apps/api/src/modules/physical-counts/services/physical-count.service.spec.ts`

- [ ] **Step 1: Write spec (TDD red)**

```typescript
// apps/api/src/modules/physical-counts/services/physical-count.service.spec.ts
import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PhysicalCountService } from './physical-count.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { InventoryAdjustmentService } from '../../inventory-adjustments/services/inventory-adjustment.service';

describe('PhysicalCountService', () => {
  let service: PhysicalCountService;
  let prisma: {
    $transaction: jest.Mock;
    catalogItem: { findMany: jest.Mock };
    inventoryState: { findMany: jest.Mock };
    physicalCount: {
      findFirst: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock;
      create: jest.Mock; update: jest.Mock; count: jest.Mock;
    };
    physicalCountDetail: {
      createMany: jest.Mock; findMany: jest.Mock; update: jest.Mock;
      findFirst: jest.Mock; count: jest.Mock; groupBy: jest.Mock; aggregate: jest.Mock;
    };
  };
  let adjustmentService: { createAdjustment: jest.Mock };

  const tenantId = 't1';
  const userId = 'u1';

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (fn) => fn(prisma)),
      catalogItem: { findMany: jest.fn() },
      inventoryState: { findMany: jest.fn() },
      physicalCount: {
        findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(),
        create: jest.fn(), update: jest.fn(), count: jest.fn(),
      },
      physicalCountDetail: {
        createMany: jest.fn(), findMany: jest.fn(), update: jest.fn(),
        findFirst: jest.fn(), count: jest.fn(), groupBy: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _sum: { totalValue: 0 } }),
      },
    };
    adjustmentService = { createAdjustment: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        PhysicalCountService,
        { provide: PrismaService, useValue: prisma },
        { provide: InventoryAdjustmentService, useValue: adjustmentService },
      ],
    }).compile();
    service = module.get(PhysicalCountService);
  });

  describe('create', () => {
    const validInput = {
      countDate: new Date().toISOString().slice(0, 10),
      fiscalYear: 2026,
      notes: 'Conteo anual',
    };

    it('throws 409 if count already exists for (tenantId, fiscalYear)', async () => {
      prisma.physicalCount.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.create(tenantId, userId, validInput)).rejects.toThrow(ConflictException);
    });

    it('throws 400 if countDate is in the future', async () => {
      prisma.physicalCount.findFirst.mockResolvedValue(null);
      const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
      await expect(
        service.create(tenantId, userId, { ...validInput, countDate: tomorrow }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'INVALID_COUNT_DATE' }),
      });
    });

    it('snapshots systemQty + unitCost from InventoryState for each trackInventory item', async () => {
      prisma.physicalCount.findFirst.mockResolvedValue(null);
      prisma.catalogItem.findMany.mockResolvedValue([
        { id: 'c1', code: 'P-001' },
        { id: 'c2', code: 'P-002' },
      ]);
      prisma.inventoryState.findMany.mockResolvedValue([
        { catalogItemId: 'c1',
          currentQty: { toString: () => '10.0000' },
          currentAvgCost: { toString: () => '5.0000' } },
      ]);
      prisma.physicalCount.create.mockResolvedValue({ id: 'pc1', fiscalYear: 2026, status: 'DRAFT' });
      prisma.physicalCountDetail.createMany.mockResolvedValue({ count: 2 });

      const r = await service.create(tenantId, userId, validInput);

      const call = prisma.physicalCountDetail.createMany.mock.calls[0][0];
      expect(call.data).toHaveLength(2);
      // c1 has state
      expect(call.data[0]).toMatchObject({
        catalogItemId: 'c1',
        systemQty: 10,
        unitCost: 5,
        countedQty: null,
        variance: 0,
      });
      // c2 has no state → defaults 0/0
      expect(call.data[1]).toMatchObject({
        catalogItemId: 'c2',
        systemQty: 0,
        unitCost: 0,
        countedQty: null,
      });
      expect(r.id).toBe('pc1');
      expect(r.totalDetails).toBe(2);
    });

    it('filters to trackInventory=true AND isActive=true', async () => {
      prisma.physicalCount.findFirst.mockResolvedValue(null);
      prisma.catalogItem.findMany.mockResolvedValue([]);
      prisma.inventoryState.findMany.mockResolvedValue([]);
      prisma.physicalCount.create.mockResolvedValue({ id: 'pc1', fiscalYear: 2026, status: 'DRAFT' });
      prisma.physicalCountDetail.createMany.mockResolvedValue({ count: 0 });

      await service.create(tenantId, userId, validInput);
      const call = prisma.catalogItem.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe(tenantId);
      expect(call.where.trackInventory).toBe(true);
      expect(call.where.isActive).toBe(true);
    });
  });

  describe('findAll', () => {
    it('returns paginated list with summary computed per count', async () => {
      prisma.physicalCount.findMany.mockResolvedValue([
        { id: 'pc1', fiscalYear: 2026, countDate: new Date('2026-04-19'), status: 'DRAFT',
          notes: null, finalizedAt: null, finalizedBy: null, createdAt: new Date(), createdBy: 'u1' },
      ]);
      prisma.physicalCount.count.mockResolvedValue(1);
      prisma.physicalCountDetail.count
        .mockResolvedValueOnce(10) // totalLines
        .mockResolvedValueOnce(7); // countedLines
      prisma.physicalCountDetail.aggregate.mockResolvedValue({ _sum: { totalValue: { toString: () => '-45.20' } } });
      // adjustedLines = 0 for DRAFT
      prisma.physicalCountDetail.count.mockResolvedValueOnce(0);

      const r = await service.findAll(tenantId, {});
      expect(r.data).toHaveLength(1);
      expect(r.data[0].summary).toMatchObject({
        totalLines: 10, countedLines: 7, pendingLines: 3,
      });
    });

    it('applies status + fiscalYear filters', async () => {
      prisma.physicalCount.findMany.mockResolvedValue([]);
      prisma.physicalCount.count.mockResolvedValue(0);
      await service.findAll(tenantId, { status: 'DRAFT', fiscalYear: 2026 });
      const call = prisma.physicalCount.findMany.mock.calls[0][0];
      expect(call.where.status).toBe('DRAFT');
      expect(call.where.fiscalYear).toBe(2026);
    });
  });

  describe('findOne', () => {
    it('returns count + paginated details', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({ id: 'pc1', tenantId, fiscalYear: 2026, status: 'DRAFT' });
      prisma.physicalCountDetail.findMany.mockResolvedValue([
        { id: 'd1', catalogItemId: 'c1', systemQty: { toString: () => '10' },
          countedQty: null, variance: { toString: () => '0' },
          unitCost: { toString: () => '5' }, totalValue: { toString: () => '0' },
          adjustmentMovementId: null, notes: null,
          catalogItem: { code: 'P-001', description: 'Prod 1' } },
      ]);
      prisma.physicalCountDetail.count.mockResolvedValue(1);

      const r = await service.findOne(tenantId, 'pc1', {});
      expect(r.id).toBe('pc1');
      expect(r.details.data).toHaveLength(1);
      expect(r.details.data[0].code).toBe('P-001');
    });

    it('throws 404 when count not found for tenant', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue(null);
      await expect(service.findOne(tenantId, 'missing', {})).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when count belongs to different tenant', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({ id: 'pc1', tenantId: 'other' });
      await expect(service.findOne(tenantId, 'pc1', {})).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 2: Verify RED**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx jest --config jest.config.ts src/modules/physical-counts/services/physical-count.service.spec.ts 2>&1 | tail -6
```
Expected: module not found.

- [ ] **Step 3: Implement service**

```typescript
// apps/api/src/modules/physical-counts/services/physical-count.service.ts
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { InventoryAdjustmentService } from '../../inventory-adjustments/services/inventory-adjustment.service';
import { CreatePhysicalCountDto } from '../dto/create-physical-count.dto';
import { ListCountsDto } from '../dto/list-counts.dto';

export interface PhysicalCountSummary {
  totalLines: number;
  countedLines: number;
  pendingLines: number;
  adjustedLines: number;
  varianceNet: number;
}

export interface PhysicalCountWithSummary {
  id: string;
  fiscalYear: number;
  countDate: string;
  status: string;
  notes: string | null;
  finalizedAt: string | null;
  finalizedBy: string | null;
  createdAt: string;
  createdBy: string;
  summary: PhysicalCountSummary;
}

interface DetailRow {
  id: string;
  catalogItemId: string;
  systemQty: { toString(): string };
  countedQty: { toString(): string } | null;
  variance: { toString(): string };
  unitCost: { toString(): string };
  totalValue: { toString(): string };
  adjustmentMovementId: string | null;
  notes: string | null;
  catalogItem: { code: string; description: string | null };
}

@Injectable()
export class PhysicalCountService {
  private readonly logger = new Logger(PhysicalCountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adjustmentService: InventoryAdjustmentService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreatePhysicalCountDto) {
    const existing = await this.prisma.physicalCount.findFirst({
      where: { tenantId, fiscalYear: dto.fiscalYear },
    });
    if (existing) {
      throw new ConflictException({
        code: 'DUPLICATE_FISCAL_YEAR',
        message: `Ya existe un conteo para el año ${dto.fiscalYear}`,
      });
    }

    const date = new Date(dto.countDate);
    if (date.getTime() > Date.now()) {
      throw new BadRequestException({
        code: 'INVALID_COUNT_DATE',
        message: 'La fecha de conteo no puede ser futura',
      });
    }

    const items = await this.prisma.catalogItem.findMany({
      where: { tenantId, trackInventory: true, isActive: true },
      select: { id: true, code: true },
    });
    const states = await this.prisma.inventoryState.findMany({
      where: { tenantId, catalogItemId: { in: items.map((i) => i.id) } },
      select: { catalogItemId: true, currentQty: true, currentAvgCost: true },
    });
    const stateByItem = new Map(states.map((s) => [s.catalogItemId, s]));

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.physicalCount.create({
        data: {
          tenantId,
          countDate: date,
          fiscalYear: dto.fiscalYear,
          status: 'DRAFT',
          notes: dto.notes ?? null,
          createdBy: userId,
        },
      });

      if (items.length > 0) {
        await tx.physicalCountDetail.createMany({
          data: items.map((item) => {
            const state = stateByItem.get(item.id);
            const systemQty = state ? Number(state.currentQty.toString()) : 0;
            const unitCost = state ? Number(state.currentAvgCost.toString()) : 0;
            return {
              physicalCountId: count.id,
              tenantId,
              catalogItemId: item.id,
              systemQty,
              countedQty: null,
              variance: 0,
              unitCost,
              totalValue: 0,
            };
          }),
        });
      }

      return {
        id: count.id,
        fiscalYear: count.fiscalYear,
        countDate: count.countDate.toISOString().slice(0, 10),
        status: count.status,
        notes: count.notes,
        totalDetails: items.length,
      };
    });
  }

  async findAll(tenantId: string, filters: ListCountsDto) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

    const where: Prisma.PhysicalCountWhereInput = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.fiscalYear) where.fiscalYear = filters.fiscalYear;

    const [rows, total] = await Promise.all([
      this.prisma.physicalCount.findMany({
        where,
        orderBy: { fiscalYear: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.physicalCount.count({ where }),
    ]);

    const data: PhysicalCountWithSummary[] = [];
    for (const count of rows) {
      data.push({
        id: count.id,
        fiscalYear: count.fiscalYear,
        countDate: count.countDate.toISOString().slice(0, 10),
        status: count.status,
        notes: count.notes,
        finalizedAt: count.finalizedAt ? count.finalizedAt.toISOString() : null,
        finalizedBy: count.finalizedBy,
        createdAt: count.createdAt.toISOString(),
        createdBy: count.createdBy,
        summary: await this.computeSummary(count.id),
      });
    }

    return {
      data,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      page,
      limit,
    };
  }

  async findOne(tenantId: string, id: string, filters: { search?: string; page?: number; limit?: number }) {
    const count = await this.prisma.physicalCount.findUnique({ where: { id } });
    if (!count || count.tenantId !== tenantId) {
      throw new NotFoundException({ code: 'COUNT_NOT_FOUND', message: 'Conteo no encontrado' });
    }

    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(500, Math.max(1, filters.limit ?? 200));

    const detailWhere: Prisma.PhysicalCountDetailWhereInput = { physicalCountId: id };
    if (filters.search) {
      detailWhere.catalogItem = {
        OR: [
          { code: { contains: filters.search } },
          { description: { contains: filters.search } },
        ],
      };
    }

    const [details, detailTotal] = await Promise.all([
      this.prisma.physicalCountDetail.findMany({
        where: detailWhere,
        include: { catalogItem: { select: { code: true, description: true } } },
        orderBy: { catalogItem: { code: 'asc' } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.physicalCountDetail.count({ where: detailWhere }),
    ]);

    return {
      id: count.id,
      fiscalYear: count.fiscalYear,
      countDate: count.countDate.toISOString().slice(0, 10),
      status: count.status,
      notes: count.notes,
      finalizedAt: count.finalizedAt ? count.finalizedAt.toISOString() : null,
      finalizedBy: count.finalizedBy,
      createdAt: count.createdAt.toISOString(),
      createdBy: count.createdBy,
      summary: await this.computeSummary(count.id),
      details: {
        data: (details as unknown as DetailRow[]).map((d) => this.mapDetail(d)),
        total: detailTotal,
        totalPages: Math.ceil(detailTotal / limit) || 1,
        page,
        limit,
      },
    };
  }

  private async computeSummary(countId: string): Promise<PhysicalCountSummary> {
    const [totalLines, countedLines, adjustedLines, sumAgg] = await Promise.all([
      this.prisma.physicalCountDetail.count({ where: { physicalCountId: countId } }),
      this.prisma.physicalCountDetail.count({
        where: { physicalCountId: countId, countedQty: { not: null } },
      }),
      this.prisma.physicalCountDetail.count({
        where: { physicalCountId: countId, adjustmentMovementId: { not: null } },
      }),
      this.prisma.physicalCountDetail.aggregate({
        where: { physicalCountId: countId, countedQty: { not: null } },
        _sum: { totalValue: true },
      }),
    ]);
    const varianceNet = sumAgg._sum.totalValue ? Number(sumAgg._sum.totalValue.toString()) : 0;

    return {
      totalLines,
      countedLines,
      pendingLines: totalLines - countedLines,
      adjustedLines,
      varianceNet,
    };
  }

  private mapDetail(d: DetailRow) {
    return {
      id: d.id,
      catalogItemId: d.catalogItemId,
      code: d.catalogItem.code,
      description: d.catalogItem.description,
      systemQty: Number(d.systemQty.toString()),
      countedQty: d.countedQty ? Number(d.countedQty.toString()) : null,
      variance: Number(d.variance.toString()),
      unitCost: Number(d.unitCost.toString()),
      totalValue: Number(d.totalValue.toString()),
      adjustmentMovementId: d.adjustmentMovementId,
      notes: d.notes,
    };
  }
}
```

- [ ] **Step 4: Verify GREEN**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx jest --config jest.config.ts src/modules/physical-counts/services/physical-count.service.spec.ts 2>&1 | tail -6
```
Expected: ~9 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count
git add apps/api/src/modules/physical-counts/
git commit -m "feat(physical-counts): add PhysicalCountService with create/findAll/findOne"
```

---

### Task 5: Service — `updateDetail` + `cancel`

**Files:**
- Modify: `apps/api/src/modules/physical-counts/services/physical-count.service.ts` — append 2 methods.
- Modify: `apps/api/src/modules/physical-counts/services/physical-count.service.spec.ts` — append 2 describe blocks.

- [ ] **Step 1: Append spec cases**

Append to the spec file (before final `});`):

```typescript
  describe('updateDetail', () => {
    const countId = 'pc1';
    const detailId = 'd1';

    const mockDraft = () => {
      prisma.physicalCount.findUnique.mockResolvedValue({ id: countId, tenantId, status: 'DRAFT' });
      prisma.physicalCountDetail.findFirst.mockResolvedValue({
        id: detailId, physicalCountId: countId, tenantId,
        systemQty: { toString: () => '10' },
        countedQty: null,
        unitCost: { toString: () => '5' },
      });
    };

    it('recalculates variance + totalValue on countedQty change', async () => {
      mockDraft();
      prisma.physicalCountDetail.update.mockResolvedValue({});
      await service.updateDetail(tenantId, countId, detailId, { countedQty: 8 });
      const call = prisma.physicalCountDetail.update.mock.calls[0][0];
      expect(Number(call.data.variance)).toBe(-2);
      expect(Number(call.data.totalValue)).toBe(-10); // -2 * 5
    });

    it('rejects update if count is not DRAFT', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({ id: countId, tenantId, status: 'FINALIZED' });
      await expect(
        service.updateDetail(tenantId, countId, detailId, { countedQty: 8 }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'COUNT_NOT_EDITABLE' }),
      });
    });

    it('allows unitCost override when resulting variance > 0', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({ id: countId, tenantId, status: 'DRAFT' });
      prisma.physicalCountDetail.findFirst.mockResolvedValue({
        id: detailId, physicalCountId: countId, tenantId,
        systemQty: { toString: () => '10' },
        countedQty: null,
        unitCost: { toString: () => '5' },
      });
      prisma.physicalCountDetail.update.mockResolvedValue({});
      await service.updateDetail(tenantId, countId, detailId, { countedQty: 15, unitCost: 7 });
      const call = prisma.physicalCountDetail.update.mock.calls[0][0];
      expect(Number(call.data.unitCost)).toBe(7);
      expect(Number(call.data.totalValue)).toBe(35); // 5 * 7
    });

    it('ignores unitCost when variance <= 0', async () => {
      mockDraft();
      prisma.physicalCountDetail.update.mockResolvedValue({});
      await service.updateDetail(tenantId, countId, detailId, { countedQty: 8, unitCost: 99 });
      const call = prisma.physicalCountDetail.update.mock.calls[0][0];
      // unitCost should NOT be in data (or remain at 5)
      expect(call.data.unitCost).toBeUndefined();
    });

    it('resets variance=0, totalValue=0 when countedQty=null', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({ id: countId, tenantId, status: 'DRAFT' });
      prisma.physicalCountDetail.findFirst.mockResolvedValue({
        id: detailId, physicalCountId: countId, tenantId,
        systemQty: { toString: () => '10' },
        countedQty: { toString: () => '7' },
        unitCost: { toString: () => '5' },
      });
      prisma.physicalCountDetail.update.mockResolvedValue({});
      await service.updateDetail(tenantId, countId, detailId, { countedQty: null });
      const call = prisma.physicalCountDetail.update.mock.calls[0][0];
      expect(call.data.countedQty).toBeNull();
      expect(Number(call.data.variance)).toBe(0);
      expect(Number(call.data.totalValue)).toBe(0);
    });
  });

  describe('cancel', () => {
    it('changes status to CANCELLED + appends reason to notes', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({
        id: 'pc1', tenantId, status: 'DRAFT', notes: 'Original',
      });
      prisma.physicalCount.update.mockResolvedValue({});
      await service.cancel(tenantId, 'pc1', { reason: 'Mal año fiscal' });
      const call = prisma.physicalCount.update.mock.calls[0][0];
      expect(call.data.status).toBe('CANCELLED');
      expect(call.data.notes).toContain('Cancelled: Mal año fiscal');
    });

    it('rejects cancel if not DRAFT', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({ id: 'pc1', tenantId, status: 'FINALIZED' });
      await expect(service.cancel(tenantId, 'pc1', {})).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'NOT_DRAFT' }),
      });
    });
  });
```

- [ ] **Step 2: Verify RED**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx jest --config jest.config.ts src/modules/physical-counts/services/physical-count.service.spec.ts 2>&1 | tail -6
```
Expected: methods not defined.

- [ ] **Step 3: Implement methods**

Append to `physical-count.service.ts` class body:

```typescript
  async updateDetail(
    tenantId: string,
    countId: string,
    detailId: string,
    dto: import('../dto/update-detail.dto').UpdateDetailDto,
  ) {
    const count = await this.prisma.physicalCount.findUnique({ where: { id: countId } });
    if (!count || count.tenantId !== tenantId) {
      throw new NotFoundException({ code: 'COUNT_NOT_FOUND', message: 'Conteo no encontrado' });
    }
    if (count.status !== 'DRAFT') {
      throw new BadRequestException({
        code: 'COUNT_NOT_EDITABLE',
        message: 'Solo se puede editar un conteo en estado DRAFT',
      });
    }

    const detail = await this.prisma.physicalCountDetail.findFirst({
      where: { id: detailId, physicalCountId: countId, tenantId },
    });
    if (!detail) {
      throw new NotFoundException({ code: 'DETAIL_NOT_FOUND', message: 'Línea no encontrada' });
    }

    const data: Prisma.PhysicalCountDetailUpdateInput = {};

    // countedQty explicit (including null)
    const hasCountedQty = Object.prototype.hasOwnProperty.call(dto, 'countedQty');
    const systemQty = Number(detail.systemQty.toString());
    const currentUnitCost = Number(detail.unitCost.toString());

    let effectiveCountedQty: number | null = null;
    if (hasCountedQty) {
      if (dto.countedQty === null || dto.countedQty === undefined) {
        data.countedQty = null;
        data.variance = 0;
        data.totalValue = 0;
      } else {
        effectiveCountedQty = dto.countedQty;
        data.countedQty = dto.countedQty;
      }
    } else if (detail.countedQty) {
      effectiveCountedQty = Number(detail.countedQty.toString());
    }

    if (effectiveCountedQty !== null) {
      const variance = effectiveCountedQty - systemQty;
      data.variance = variance;

      // unitCost override only allowed when variance > 0
      let effectiveUnitCost = currentUnitCost;
      if (variance > 0 && dto.unitCost !== undefined) {
        effectiveUnitCost = dto.unitCost;
        data.unitCost = dto.unitCost;
      } else if (dto.unitCost !== undefined && variance <= 0) {
        this.logger.warn(`Ignoring unitCost override for detail ${detailId}: variance (${variance}) is not positive`);
      }
      data.totalValue = variance * effectiveUnitCost;
    }

    if (dto.notes !== undefined) data.notes = dto.notes;

    await this.prisma.physicalCountDetail.update({
      where: { id: detailId },
      data,
    });

    const updated = await this.prisma.physicalCountDetail.findFirst({
      where: { id: detailId },
      include: { catalogItem: { select: { code: true, description: true } } },
    });
    return this.mapDetail(updated as unknown as DetailRow);
  }

  async cancel(tenantId: string, countId: string, dto: import('../dto/cancel.dto').CancelDto) {
    const count = await this.prisma.physicalCount.findUnique({ where: { id: countId } });
    if (!count || count.tenantId !== tenantId) {
      throw new NotFoundException({ code: 'COUNT_NOT_FOUND', message: 'Conteo no encontrado' });
    }
    if (count.status !== 'DRAFT') {
      throw new ConflictException({ code: 'NOT_DRAFT', message: 'Solo conteos en DRAFT se pueden cancelar' });
    }

    const newNotes = count.notes
      ? `${count.notes}\nCancelled: ${dto.reason ?? 'Sin razón'}`
      : `Cancelled: ${dto.reason ?? 'Sin razón'}`;

    await this.prisma.physicalCount.update({
      where: { id: countId },
      data: { status: 'CANCELLED', notes: newNotes },
    });

    return { id: countId, status: 'CANCELLED' };
  }
```

- [ ] **Step 4: Verify GREEN**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx jest --config jest.config.ts src/modules/physical-counts/services/physical-count.service.spec.ts 2>&1 | tail -6
```
Expected: ~16 tests pass (9 + 7 new).

- [ ] **Step 5: Commit**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count
git add apps/api/src/modules/physical-counts/services/
git commit -m "feat(physical-counts): add updateDetail + cancel"
```

---

### Task 6: `PhysicalCountCsvService` + `uploadCsv` integration

**Files:**
- Create: `apps/api/src/modules/physical-counts/services/physical-count-csv.service.ts`
- Create: `apps/api/src/modules/physical-counts/services/physical-count-csv.service.spec.ts`
- Modify: `apps/api/src/modules/physical-counts/services/physical-count.service.ts` — add `uploadCsv` method that uses the CSV service.
- Modify: `apps/api/src/modules/physical-counts/services/physical-count.service.spec.ts` — append describe block.

- [ ] **Step 1: Pop papaparse install stash**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count
git stash pop
```

Verify `apps/api/package.json` now has `papaparse` + `@types/papaparse`.

- [ ] **Step 2: Write CSV service spec**

```typescript
// apps/api/src/modules/physical-counts/services/physical-count-csv.service.spec.ts
import { Test } from '@nestjs/testing';
import { PhysicalCountCsvService } from './physical-count-csv.service';

describe('PhysicalCountCsvService', () => {
  let service: PhysicalCountCsvService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PhysicalCountCsvService],
    }).compile();
    service = module.get(PhysicalCountCsvService);
  });

  it('parses valid CSV with correct header', () => {
    const csv = `code,description,systemQty,countedQty,notes
P-001,Prod 1,10.0000,8.0000,reconteo ok
P-002,Prod 2,5.0000,7.0000,
`;
    const r = service.parse(csv);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0]).toEqual({
      rowNumber: 2, code: 'P-001', countedQty: 8, notes: 'reconteo ok',
    });
    expect(r.rows[1]).toEqual({
      rowNumber: 3, code: 'P-002', countedQty: 7, notes: '',
    });
    expect(r.errors).toHaveLength(0);
  });

  it('trims + uppercases code', () => {
    const csv = `code,description,systemQty,countedQty,notes
  p-001  ,Prod 1,10,8,
`;
    const r = service.parse(csv);
    expect(r.rows[0].code).toBe('P-001');
  });

  it('handles UTF-8 BOM', () => {
    const csv = '\uFEFFcode,description,systemQty,countedQty,notes\nP-001,Prod 1,10,8,\n';
    const r = service.parse(csv);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].code).toBe('P-001');
  });

  it('reports error on invalid countedQty (non-numeric)', () => {
    const csv = `code,description,systemQty,countedQty,notes
P-001,Prod 1,10,abc,
`;
    const r = service.parse(csv);
    expect(r.rows).toHaveLength(0);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({ rowNumber: 2, code: 'P-001', reason: 'INVALID_QTY' });
  });

  it('skips rows with empty countedQty without error', () => {
    const csv = `code,description,systemQty,countedQty,notes
P-001,Prod 1,10,,
`;
    const r = service.parse(csv);
    expect(r.rows).toHaveLength(0);
    expect(r.errors).toHaveLength(0);
    expect(r.skipped).toBe(1);
  });

  it('reports error on empty code', () => {
    const csv = `code,description,systemQty,countedQty,notes
,Prod X,10,5,
`;
    const r = service.parse(csv);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({ rowNumber: 2, reason: 'EMPTY_CODE' });
  });

  it('rejects CSV without required header columns', () => {
    const csv = `wrongcol\nvalue\n`;
    const r = service.parse(csv);
    expect(r.errors[0]).toMatchObject({ reason: 'INVALID_HEADER' });
  });
});
```

- [ ] **Step 3: Verify RED**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx jest --config jest.config.ts src/modules/physical-counts/services/physical-count-csv.service.spec.ts 2>&1 | tail -6
```
Expected: module not found.

- [ ] **Step 4: Implement CSV service**

```typescript
// apps/api/src/modules/physical-counts/services/physical-count-csv.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as Papa from 'papaparse';

export interface CsvRow {
  rowNumber: number;
  code: string;
  countedQty: number;
  notes: string;
}

export interface CsvError {
  rowNumber: number;
  code?: string;
  reason: 'INVALID_HEADER' | 'EMPTY_CODE' | 'INVALID_QTY';
}

export interface CsvParseResult {
  rows: CsvRow[];
  errors: CsvError[];
  skipped: number;
}

const REQUIRED_COLUMNS = ['code', 'description', 'systemQty', 'countedQty', 'notes'];
const MAX_ROWS = 10000;

@Injectable()
export class PhysicalCountCsvService {
  private readonly logger = new Logger(PhysicalCountCsvService.name);

  parse(csv: string): CsvParseResult {
    const clean = csv.replace(/^\uFEFF/, ''); // strip BOM
    const parsed = Papa.parse<Record<string, string>>(clean, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    const headers = parsed.meta.fields ?? [];
    if (!REQUIRED_COLUMNS.every((c) => headers.includes(c.toLowerCase()))) {
      return {
        rows: [],
        errors: [{ rowNumber: 1, reason: 'INVALID_HEADER' }],
        skipped: 0,
      };
    }

    const rows: CsvRow[] = [];
    const errors: CsvError[] = [];
    let skipped = 0;

    parsed.data.slice(0, MAX_ROWS).forEach((raw, idx) => {
      const rowNumber = idx + 2; // +2 = 1 for header, 1 for 0-index
      const code = String(raw.code ?? '').trim().toUpperCase();
      const countedQtyStr = String(raw.countedqty ?? raw.countedQty ?? '').trim();
      const notes = String(raw.notes ?? '').trim();

      if (!code) {
        errors.push({ rowNumber, reason: 'EMPTY_CODE' });
        return;
      }
      if (countedQtyStr === '') {
        skipped++;
        return;
      }
      const qty = parseFloat(countedQtyStr);
      if (!Number.isFinite(qty) || qty < 0) {
        errors.push({ rowNumber, code, reason: 'INVALID_QTY' });
        return;
      }

      rows.push({ rowNumber, code, countedQty: qty, notes });
    });

    return { rows, errors, skipped };
  }
}
```

- [ ] **Step 5: Append `uploadCsv` spec cases to `physical-count.service.spec.ts`**

Before the final `});` of the top-level describe:

```typescript
  describe('uploadCsv', () => {
    const countId = 'pc1';

    it('matches details by code case-insensitive + updates countedQty', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({ id: countId, tenantId, status: 'DRAFT' });
      prisma.physicalCountDetail.findMany.mockResolvedValue([
        { id: 'd1', physicalCountId: countId, tenantId, catalogItemId: 'c1',
          systemQty: { toString: () => '10' },
          unitCost: { toString: () => '5' },
          catalogItem: { code: 'P-001' } },
      ]);
      prisma.physicalCountDetail.update.mockResolvedValue({});

      const csv = `code,description,systemQty,countedQty,notes
p-001,Prod 1,10,8,ok
`;
      const r = await service.uploadCsv(tenantId, countId, csv);
      expect(r.matched).toBe(1);
      expect(r.errors).toHaveLength(0);
      expect(prisma.physicalCountDetail.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'd1' },
          data: expect.objectContaining({
            countedQty: 8,
            variance: -2,
            totalValue: -10,
          }),
        }),
      );
    });

    it('reports NOT_IN_COUNT error for codes not in the count', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({ id: countId, tenantId, status: 'DRAFT' });
      prisma.physicalCountDetail.findMany.mockResolvedValue([]);

      const csv = `code,description,systemQty,countedQty,notes
Z-999,Missing,10,8,
`;
      const r = await service.uploadCsv(tenantId, countId, csv);
      expect(r.matched).toBe(0);
      expect(r.errors[0]).toMatchObject({ code: 'Z-999', reason: 'NOT_IN_COUNT' });
    });

    it('rejects if count is not DRAFT', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({ id: countId, tenantId, status: 'FINALIZED' });
      const csv = `code,description,systemQty,countedQty,notes\nP-001,,10,8,\n`;
      await expect(service.uploadCsv(tenantId, countId, csv)).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'COUNT_NOT_EDITABLE' }),
      });
    });
  });
```

Update the describe's `beforeEach` — add the CSV service mock/provider:

Replace the `Test.createTestingModule` providers block to include the CSV service (or inject a new provider). Since `PhysicalCountService` needs to USE the CSV service, you'll inject it in the real implementation (Step 7). For the spec, add the provider:

In `beforeEach`, add `import { PhysicalCountCsvService } from './physical-count-csv.service';` at top.
Replace the providers block to:

```typescript
    const module = await Test.createTestingModule({
      providers: [
        PhysicalCountService,
        PhysicalCountCsvService, // real impl is OK for testing integration
        { provide: PrismaService, useValue: prisma },
        { provide: InventoryAdjustmentService, useValue: adjustmentService },
      ],
    }).compile();
```

- [ ] **Step 6: Verify RED**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx jest --config jest.config.ts src/modules/physical-counts/ 2>&1 | tail -6
```
Expected: `uploadCsv` tests fail (method missing).

- [ ] **Step 7: Add `uploadCsv` to `PhysicalCountService`**

Add import at top of `physical-count.service.ts`:

```typescript
import { PhysicalCountCsvService } from './physical-count-csv.service';
```

Modify constructor:

```typescript
  constructor(
    private readonly prisma: PrismaService,
    private readonly adjustmentService: InventoryAdjustmentService,
    private readonly csvService: PhysicalCountCsvService,
  ) {}
```

Append method to class:

```typescript
  async uploadCsv(
    tenantId: string,
    countId: string,
    csv: string,
  ): Promise<{ totalRows: number; matched: number; skipped: number; errors: Array<{ rowNumber: number; code?: string; reason: string }> }> {
    const count = await this.prisma.physicalCount.findUnique({ where: { id: countId } });
    if (!count || count.tenantId !== tenantId) {
      throw new NotFoundException({ code: 'COUNT_NOT_FOUND', message: 'Conteo no encontrado' });
    }
    if (count.status !== 'DRAFT') {
      throw new BadRequestException({
        code: 'COUNT_NOT_EDITABLE',
        message: 'Solo se puede actualizar un conteo en estado DRAFT',
      });
    }

    const parsed = this.csvService.parse(csv);
    const totalRows = parsed.rows.length + parsed.errors.length + parsed.skipped;

    if (parsed.rows.length === 0) {
      return {
        totalRows,
        matched: 0,
        skipped: parsed.skipped,
        errors: parsed.errors,
      };
    }

    const codes = parsed.rows.map((r) => r.code);
    const details = await this.prisma.physicalCountDetail.findMany({
      where: {
        physicalCountId: countId,
        catalogItem: { code: { in: codes } },
      },
      include: { catalogItem: { select: { code: true } } },
    });
    type DetailRowForUpload = {
      id: string; systemQty: { toString(): string }; unitCost: { toString(): string };
      catalogItem: { code: string };
    };
    const typedDetails = details as unknown as DetailRowForUpload[];
    const detailByCode = new Map(typedDetails.map((d) => [d.catalogItem.code.toUpperCase(), d]));

    const errors = [...parsed.errors];
    let matched = 0;

    for (const row of parsed.rows) {
      const detail = detailByCode.get(row.code);
      if (!detail) {
        errors.push({ rowNumber: row.rowNumber, code: row.code, reason: 'NOT_IN_COUNT' });
        continue;
      }
      const systemQty = Number(detail.systemQty.toString());
      const unitCost = Number(detail.unitCost.toString());
      const variance = row.countedQty - systemQty;
      const totalValue = variance * unitCost;

      await this.prisma.physicalCountDetail.update({
        where: { id: detail.id },
        data: {
          countedQty: row.countedQty,
          variance,
          totalValue,
          notes: row.notes || undefined,
        },
      });
      matched++;
    }

    return { totalRows, matched, skipped: parsed.skipped, errors };
  }
```

- [ ] **Step 8: Create `PhysicalCountsModule` placeholder (CSV service needs to be registered)**

Don't register yet — Task 9 creates the full module. For now, the spec file gets `PhysicalCountCsvService` as a direct provider.

- [ ] **Step 9: Verify GREEN**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx jest --config jest.config.ts src/modules/physical-counts/ 2>&1 | tail -6
```
Expected: all pass (~23 tests).

- [ ] **Step 10: Commit (includes papaparse install)**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count
git add apps/api/package.json apps/api/package-lock.json apps/api/src/modules/physical-counts/
git commit -m "feat(physical-counts): add CSV service + uploadCsv integration (papaparse)"
```

---

### Task 7: Service — `finalize`

**Files:**
- Modify: `apps/api/src/modules/physical-counts/services/physical-count.service.ts` — add `finalize` method.
- Modify: `apps/api/src/modules/physical-counts/services/physical-count.service.spec.ts` — append describe block.

- [ ] **Step 1: Append spec cases**

```typescript
  describe('finalize', () => {
    const countId = 'pc1';

    it('creates FALTANTE adjustment for variance < 0', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({
        id: countId, tenantId, status: 'DRAFT',
        countDate: new Date('2026-04-19'), fiscalYear: 2026,
      });
      prisma.physicalCountDetail.findMany.mockResolvedValue([
        { id: 'd1', catalogItemId: 'c1',
          systemQty: { toString: () => '10' },
          countedQty: { toString: () => '8' },
          variance: { toString: () => '-2' },
          unitCost: { toString: () => '5' },
          notes: null },
      ]);
      adjustmentService.createAdjustment.mockResolvedValue({ id: 'm1' });
      prisma.physicalCountDetail.update.mockResolvedValue({});
      prisma.physicalCount.update.mockResolvedValue({});

      const r = await service.finalize(tenantId, userId, countId);

      expect(adjustmentService.createAdjustment).toHaveBeenCalledWith(
        tenantId,
        userId,
        expect.objectContaining({
          catalogItemId: 'c1',
          subtype: 'AJUSTE_FALTANTE',
          quantity: 2,
          movementDate: '2026-04-19',
        }),
        { skipDateValidation: true },
      );
      expect(r.adjustmentsGenerated).toBe(1);
    });

    it('creates SOBRANTE adjustment with unitCost for variance > 0', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({
        id: countId, tenantId, status: 'DRAFT',
        countDate: new Date('2026-04-19'), fiscalYear: 2026,
      });
      prisma.physicalCountDetail.findMany.mockResolvedValue([
        { id: 'd1', catalogItemId: 'c1',
          systemQty: { toString: () => '5' },
          countedQty: { toString: () => '8' },
          variance: { toString: () => '3' },
          unitCost: { toString: () => '7' },
          notes: null },
      ]);
      adjustmentService.createAdjustment.mockResolvedValue({ id: 'm1' });
      prisma.physicalCountDetail.update.mockResolvedValue({});
      prisma.physicalCount.update.mockResolvedValue({});

      await service.finalize(tenantId, userId, countId);

      const call = adjustmentService.createAdjustment.mock.calls[0];
      expect(call[2]).toMatchObject({
        subtype: 'AJUSTE_SOBRANTE',
        quantity: 3,
        unitCost: 7,
      });
    });

    it('links adjustmentMovementId on each detail', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({
        id: countId, tenantId, status: 'DRAFT',
        countDate: new Date('2026-04-19'), fiscalYear: 2026,
      });
      prisma.physicalCountDetail.findMany.mockResolvedValue([
        { id: 'd1', catalogItemId: 'c1',
          systemQty: { toString: () => '10' },
          countedQty: { toString: () => '8' },
          variance: { toString: () => '-2' },
          unitCost: { toString: () => '5' },
          notes: null },
      ]);
      adjustmentService.createAdjustment.mockResolvedValue({ id: 'mov-abc' });
      prisma.physicalCountDetail.update.mockResolvedValue({});
      prisma.physicalCount.update.mockResolvedValue({});

      await service.finalize(tenantId, userId, countId);

      expect(prisma.physicalCountDetail.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'd1' },
          data: { adjustmentMovementId: 'mov-abc' },
        }),
      );
    });

    it('sets count status=FINALIZED with finalizedAt + finalizedBy', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({
        id: countId, tenantId, status: 'DRAFT',
        countDate: new Date('2026-04-19'), fiscalYear: 2026,
      });
      prisma.physicalCountDetail.findMany.mockResolvedValue([]);
      prisma.physicalCount.update.mockResolvedValue({});

      await service.finalize(tenantId, userId, countId);

      const call = prisma.physicalCount.update.mock.calls[0][0];
      expect(call.data.status).toBe('FINALIZED');
      expect(call.data.finalizedBy).toBe(userId);
      expect(call.data.finalizedAt).toBeInstanceOf(Date);
    });

    it('rejects if count is not DRAFT', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({ id: countId, tenantId, status: 'FINALIZED' });
      await expect(service.finalize(tenantId, userId, countId)).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'NOT_DRAFT' }),
      });
    });

    it('skips details with countedQty=null or variance=0', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({
        id: countId, tenantId, status: 'DRAFT',
        countDate: new Date('2026-04-19'), fiscalYear: 2026,
      });
      // findMany is called with filter — should already exclude these, but test that caller builds correct where
      prisma.physicalCountDetail.findMany.mockResolvedValue([]);
      prisma.physicalCount.update.mockResolvedValue({});

      await service.finalize(tenantId, userId, countId);

      const call = prisma.physicalCountDetail.findMany.mock.calls[0][0];
      expect(call.where).toMatchObject({
        physicalCountId: countId,
        countedQty: { not: null },
        NOT: { variance: 0 },
      });
    });
  });
```

- [ ] **Step 2: Verify RED**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx jest --config jest.config.ts src/modules/physical-counts/ 2>&1 | tail -6
```
Expected: `finalize` tests fail.

- [ ] **Step 3: Implement `finalize`**

Append to `physical-count.service.ts` class body:

```typescript
  async finalize(
    tenantId: string,
    userId: string,
    countId: string,
  ): Promise<{ id: string; status: string; adjustmentsGenerated: number; pendingLines: number; zeroVarianceLines: number }> {
    const count = await this.prisma.physicalCount.findUnique({ where: { id: countId } });
    if (!count || count.tenantId !== tenantId) {
      throw new NotFoundException({ code: 'COUNT_NOT_FOUND', message: 'Conteo no encontrado' });
    }
    if (count.status !== 'DRAFT') {
      throw new ConflictException({ code: 'NOT_DRAFT', message: 'Solo conteos en DRAFT se pueden finalizar' });
    }

    const movementDate = count.countDate.toISOString().slice(0, 10);

    return this.prisma.$transaction(async (tx) => {
      type TxDetail = {
        id: string; catalogItemId: string;
        systemQty: { toString(): string };
        countedQty: { toString(): string } | null;
        variance: { toString(): string };
        unitCost: { toString(): string };
        notes: string | null;
      };

      const details = (await tx.physicalCountDetail.findMany({
        where: {
          physicalCountId: countId,
          countedQty: { not: null },
          NOT: { variance: 0 },
        },
      })) as unknown as TxDetail[];

      let adjustmentsGenerated = 0;
      for (const detail of details) {
        const variance = Number(detail.variance.toString());
        const unitCost = Number(detail.unitCost.toString());
        const subtype = variance < 0 ? 'AJUSTE_FALTANTE' : 'AJUSTE_SOBRANTE';
        const notes = `Conteo físico ${count.fiscalYear}${detail.notes ? ` — ${detail.notes}` : ''}`;

        const movement = await this.adjustmentService.createAdjustment(
          tenantId,
          userId,
          {
            catalogItemId: detail.catalogItemId,
            subtype,
            quantity: Math.abs(variance),
            unitCost: subtype === 'AJUSTE_SOBRANTE' ? unitCost : undefined,
            movementDate,
            notes,
          },
          { skipDateValidation: true },
        );

        await tx.physicalCountDetail.update({
          where: { id: detail.id },
          data: { adjustmentMovementId: movement.id },
        });
        adjustmentsGenerated++;
      }

      await tx.physicalCount.update({
        where: { id: countId },
        data: { status: 'FINALIZED', finalizedAt: new Date(), finalizedBy: userId },
      });

      const [pendingLines, zeroVarianceLines] = await Promise.all([
        tx.physicalCountDetail.count({
          where: { physicalCountId: countId, countedQty: null },
        }),
        tx.physicalCountDetail.count({
          where: { physicalCountId: countId, countedQty: { not: null }, variance: 0 },
        }),
      ]);

      return {
        id: countId,
        status: 'FINALIZED',
        adjustmentsGenerated,
        pendingLines,
        zeroVarianceLines,
      };
    });
  }
```

- [ ] **Step 4: Verify GREEN**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx jest --config jest.config.ts src/modules/physical-counts/ 2>&1 | tail -6
```
Expected: all pass (~29 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count
git add apps/api/src/modules/physical-counts/services/
git commit -m "feat(physical-counts): add finalize with adjustment generation + linking"
```

---

### Task 8: Controller + module + AppModule

**Files:**
- Create: `apps/api/src/modules/physical-counts/physical-counts.controller.ts`
- Create: `apps/api/src/modules/physical-counts/physical-counts.controller.spec.ts`
- Create: `apps/api/src/modules/physical-counts/physical-counts.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write controller spec**

```typescript
// apps/api/src/modules/physical-counts/physical-counts.controller.spec.ts
import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PhysicalCountsController } from './physical-counts.controller';
import { PhysicalCountService } from './services/physical-count.service';
import { PlanFeatureGuard } from '../plans/guards/plan-feature.guard';

describe('PhysicalCountsController', () => {
  let controller: PhysicalCountsController;
  let service: {
    create: jest.Mock; findAll: jest.Mock; findOne: jest.Mock;
    updateDetail: jest.Mock; uploadCsv: jest.Mock; finalize: jest.Mock;
    cancel: jest.Mock; getCsvTemplate: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(), findAll: jest.fn(), findOne: jest.fn(),
      updateDetail: jest.fn(), uploadCsv: jest.fn(), finalize: jest.fn(),
      cancel: jest.fn(), getCsvTemplate: jest.fn(),
    };
    const module = await Test.createTestingModule({
      controllers: [PhysicalCountsController],
      providers: [{ provide: PhysicalCountService, useValue: service }],
    })
      .overrideGuard(PlanFeatureGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get(PhysicalCountsController);
  });

  const user = (tenantId: string | null = 't1'): CurrentUserData => ({
    id: 'u1', email: 'u1@t.com', tenantId, rol: 'GERENTE',
  });

  it('POST creates count with tenant + user', async () => {
    service.create.mockResolvedValue({ id: 'pc1' });
    await controller.create(user(), { countDate: '2026-04-19', fiscalYear: 2026 });
    expect(service.create).toHaveBeenCalledWith('t1', 'u1', { countDate: '2026-04-19', fiscalYear: 2026 });
  });

  it('POST throws ForbiddenException when no tenant', async () => {
    await expect(
      controller.create(user(null), { countDate: '2026-04-19', fiscalYear: 2026 }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('GET list forwards filters', async () => {
    service.findAll.mockResolvedValue({ data: [], total: 0, totalPages: 1, page: 1, limit: 20 });
    await controller.list(user(), { status: 'DRAFT' });
    expect(service.findAll).toHaveBeenCalledWith('t1', { status: 'DRAFT' });
  });

  it('GET one forwards id + filters', async () => {
    service.findOne.mockResolvedValue({ id: 'pc1' });
    await controller.findOne(user(), 'pc1', { search: 'abc' });
    expect(service.findOne).toHaveBeenCalledWith('t1', 'pc1', { search: 'abc' });
  });

  it('PATCH detail forwards countId + detailId + dto', async () => {
    service.updateDetail.mockResolvedValue({ id: 'd1' });
    await controller.updateDetail(user(), 'pc1', 'd1', { countedQty: 5 });
    expect(service.updateDetail).toHaveBeenCalledWith('t1', 'pc1', 'd1', { countedQty: 5 });
  });

  it('POST finalize forwards countId + userId', async () => {
    service.finalize.mockResolvedValue({ id: 'pc1', status: 'FINALIZED' });
    await controller.finalize(user(), 'pc1', { confirm: true });
    expect(service.finalize).toHaveBeenCalledWith('t1', 'u1', 'pc1');
  });

  it('POST cancel forwards reason', async () => {
    service.cancel.mockResolvedValue({ id: 'pc1', status: 'CANCELLED' });
    await controller.cancel(user(), 'pc1', { reason: 'oops' });
    expect(service.cancel).toHaveBeenCalledWith('t1', 'pc1', { reason: 'oops' });
  });
});
```

- [ ] **Step 2: Verify RED**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx jest --config jest.config.ts src/modules/physical-counts/physical-counts.controller.spec.ts 2>&1 | tail -6
```
Expected: module not found.

- [ ] **Step 3: Implement controller**

```typescript
// apps/api/src/modules/physical-counts/physical-counts.controller.ts
import {
  Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Res,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PlanFeatureGuard } from '../plans/guards/plan-feature.guard';
import { RequireFeature } from '../plans/decorators/require-feature.decorator';
import { PhysicalCountService } from './services/physical-count.service';
import { CreatePhysicalCountDto } from './dto/create-physical-count.dto';
import { ListCountsDto } from './dto/list-counts.dto';
import { UpdateDetailDto } from './dto/update-detail.dto';
import { FinalizeDto } from './dto/finalize.dto';
import { CancelDto } from './dto/cancel.dto';

interface MulterFile {
  buffer: Buffer;
  size: number;
  originalname: string;
}

const MAX_CSV_SIZE = 5 * 1024 * 1024; // 5MB

@ApiTags('physical-counts')
@Controller('physical-counts')
@ApiBearerAuth()
@UseGuards(PlanFeatureGuard)
@RequireFeature('inventory_reports')
export class PhysicalCountsController {
  constructor(private readonly service: PhysicalCountService) {}

  @Post()
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Crear conteo físico anual (DRAFT)' })
  async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreatePhysicalCountDto) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.create(user.tenantId, user.id, dto);
  }

  @Get()
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Listar conteos del tenant' })
  async list(@CurrentUser() user: CurrentUserData, @Query() filters: ListCountsDto) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.findAll(user.tenantId, filters);
  }

  @Get(':id')
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Detalle de conteo + líneas' })
  async findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Query() filters: { search?: string; page?: number; limit?: number },
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.findOne(user.tenantId, id, filters);
  }

  @Patch(':id/details/:detailId')
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Actualizar una línea del conteo' })
  async updateDetail(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Param('detailId') detailId: string,
    @Body() dto: UpdateDetailDto,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.updateDetail(user.tenantId, id, detailId, dto);
  }

  @Post(':id/upload-csv')
  @RequirePermission('inventory:adjust')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_CSV_SIZE } }))
  @ApiOperation({ summary: 'Subir CSV con countedQty' })
  async uploadCsv(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @UploadedFile() file: MulterFile,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    if (!file) {
      throw new ForbiddenException('File required');
    }
    const csv = file.buffer.toString('utf8');
    return this.service.uploadCsv(user.tenantId, id, csv);
  }

  @Post(':id/finalize')
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Finalizar conteo (genera ajustes)' })
  async finalize(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() _dto: FinalizeDto,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.finalize(user.tenantId, user.id, id);
  }

  @Post(':id/cancel')
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Cancelar conteo en DRAFT' })
  async cancel(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: CancelDto,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.cancel(user.tenantId, id, dto);
  }

  @Get(':id/csv-template')
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Descargar plantilla CSV del conteo' })
  async getCsvTemplate(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    const csv = await this.service.getCsvTemplate(user.tenantId, id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="conteo_template.csv"`);
    res.send(csv);
  }
}
```

- [ ] **Step 4: Add `getCsvTemplate` to service**

Append to `physical-count.service.ts` class:

```typescript
  async getCsvTemplate(tenantId: string, countId: string): Promise<string> {
    const count = await this.prisma.physicalCount.findUnique({ where: { id: countId } });
    if (!count || count.tenantId !== tenantId) {
      throw new NotFoundException({ code: 'COUNT_NOT_FOUND', message: 'Conteo no encontrado' });
    }

    interface TemplateRow {
      catalogItem: { code: string; description: string | null };
      systemQty: { toString(): string };
    }
    const details = (await this.prisma.physicalCountDetail.findMany({
      where: { physicalCountId: countId },
      include: { catalogItem: { select: { code: true, description: true } } },
      orderBy: { catalogItem: { code: 'asc' } },
    })) as unknown as TemplateRow[];

    const escape = (s: string | null | undefined): string => {
      const v = s ?? '';
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    };

    const header = 'code,description,systemQty,countedQty,notes\n';
    const rows = details
      .map((d) => `${escape(d.catalogItem.code)},${escape(d.catalogItem.description)},${Number(d.systemQty.toString()).toFixed(4)},,`)
      .join('\n');
    return header + rows + '\n';
  }
```

- [ ] **Step 5: Create module**

```typescript
// apps/api/src/modules/physical-counts/physical-counts.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlansModule } from '../plans/plans.module';
import { InventoryAdjustmentsModule } from '../inventory-adjustments/inventory-adjustments.module';
import { PhysicalCountsController } from './physical-counts.controller';
import { PhysicalCountService } from './services/physical-count.service';
import { PhysicalCountCsvService } from './services/physical-count-csv.service';

@Module({
  imports: [PrismaModule, PlansModule, InventoryAdjustmentsModule],
  controllers: [PhysicalCountsController],
  providers: [PhysicalCountService, PhysicalCountCsvService],
  exports: [PhysicalCountService],
})
export class PhysicalCountsModule {}
```

- [ ] **Step 6: Register in AppModule**

Modify `apps/api/src/app.module.ts`:

1. Add import near other module imports:
   ```typescript
   import { PhysicalCountsModule } from './modules/physical-counts/physical-counts.module';
   ```
2. Add `PhysicalCountsModule,` to the `imports: [...]` array (near `InventoryAdjustmentsModule`).

Verify:
```bash
grep -n "PhysicalCountsModule" apps/api/src/app.module.ts
```
Expected: 2 matches.

- [ ] **Step 7: Verify**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx jest --config jest.config.ts src/modules/physical-counts/ 2>&1 | tail -6
```
Expected: all pass (~36 tests).

```bash
npx tsc --noEmit 2>&1 | grep "physical-counts" | head -5
```
Expected: empty.

- [ ] **Step 8: Commit**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count
git add apps/api/src/modules/physical-counts/ apps/api/src/app.module.ts
git commit -m "feat(physical-counts): add controller + module + register + csv-template"
```

---

### Task 9: Frontend — types + list page

**Files:**
- Modify: `apps/web/src/types/inventory.ts` — append.
- Create: `apps/web/src/app/(dashboard)/inventario/conteo/page.tsx`

- [ ] **Step 1: Append types**

Append to `apps/web/src/types/inventory.ts`:

```typescript
export const PHYSICAL_COUNT_STATUSES = ['DRAFT', 'FINALIZED', 'CANCELLED'] as const;
export type PhysicalCountStatus = (typeof PHYSICAL_COUNT_STATUSES)[number];

export interface PhysicalCountSummary {
  totalLines: number;
  countedLines: number;
  pendingLines: number;
  adjustedLines: number;
  varianceNet: number;
}

export interface PhysicalCount {
  id: string;
  fiscalYear: number;
  countDate: string;
  status: PhysicalCountStatus;
  notes: string | null;
  finalizedAt: string | null;
  finalizedBy: string | null;
  createdAt: string;
  createdBy: string;
  summary: PhysicalCountSummary;
}

export interface PhysicalCountDetail {
  id: string;
  catalogItemId: string;
  code: string;
  description: string | null;
  systemQty: number;
  countedQty: number | null;
  variance: number;
  unitCost: number;
  totalValue: number;
  adjustmentMovementId: string | null;
  notes: string | null;
}

export interface PhysicalCountFull extends PhysicalCount {
  details: {
    data: PhysicalCountDetail[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export interface PhysicalCountListResponse {
  data: PhysicalCount[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface CsvUploadResult {
  totalRows: number;
  matched: number;
  skipped: number;
  errors: Array<{ rowNumber: number; code?: string; reason: string }>;
}

export interface FinalizeResult {
  id: string;
  status: 'FINALIZED';
  adjustmentsGenerated: number;
  pendingLines: number;
  zeroVarianceLines: number;
}
```

- [ ] **Step 2: Create list page**

```tsx
// apps/web/src/app/(dashboard)/inventario/conteo/page.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ClipboardCheck, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { apiFetch } from '@/lib/api';
import type { PhysicalCount, PhysicalCountListResponse, PhysicalCountStatus } from '@/types/inventory';

const STATUS_BADGE: Record<PhysicalCountStatus, { label: string; className: string }> = {
  DRAFT: { label: 'En progreso', className: 'bg-amber-100 text-amber-800' },
  FINALIZED: { label: 'Finalizado', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700' },
};

export default function ConteoListPage() {
  const router = useRouter();
  const toast = useToast();
  const [counts, setCounts] = React.useState<PhysicalCount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);

  const currentYear = new Date().getFullYear();
  const hasDraftThisYear = counts.some((c) => c.fiscalYear === currentYear && c.status === 'DRAFT');

  const fetchCounts = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch<PhysicalCountListResponse>('/physical-counts?limit=20');
      setCounts(result.data);
    } catch (e) {
      toast.error('Error cargando conteos');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const result = await apiFetch<{ id: string }>('/physical-counts', {
        method: 'POST',
        body: JSON.stringify({ countDate: today, fiscalYear: currentYear }),
      });
      toast.success('Conteo iniciado');
      router.push(`/inventario/conteo/${result.id}`);
    } catch (e) {
      const err = e as { data?: { code?: string; message?: string } };
      if (err.data?.code === 'DUPLICATE_FISCAL_YEAR') {
        toast.error('Ya existe un conteo para este año');
      } else {
        toast.error('Error creando conteo');
      }
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/inventario">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a inventario
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6" /> Conteo físico
        </h1>
        <Button onClick={handleCreate} disabled={creating || hasDraftThisYear}>
          <Plus className="h-4 w-4 mr-2" />
          {hasDraftThisYear
            ? `Conteo ${currentYear} ya iniciado`
            : `Iniciar conteo ${currentYear}`}
        </Button>
      </div>

      {loading && <p className="text-center text-gray-500 py-8">Cargando…</p>}
      {!loading && counts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No hay conteos físicos. Iniciá el primero con el botón arriba.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {counts.map((c) => {
          const badge = STATUS_BADGE[c.status];
          return (
            <Link key={c.id} href={`/inventario/conteo/${c.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Conteo físico {c.fiscalYear}</h2>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Fecha: {c.countDate} · Iniciado por {c.createdBy}
                  </p>
                  <p className="text-sm text-gray-700">
                    {c.summary.totalLines} ítems · {c.summary.countedLines} contados · {c.summary.pendingLines} pendientes
                  </p>
                  {c.status === 'FINALIZED' && (
                    <p className="text-sm">
                      <strong>{c.summary.adjustedLines}</strong> ajustes · valor neto{' '}
                      <strong className={c.summary.varianceNet < 0 ? 'text-red-600' : 'text-green-700'}>
                        ${c.summary.varianceNet.toFixed(2)}
                      </strong>
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/web
npx tsc --noEmit 2>&1 | grep -E "conteo|physical-count|types/inventory" | head -5
```
Expected: empty (only pre-existing lucide-react noise).

- [ ] **Step 4: Commit**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count
git add apps/web/src/types/inventory.ts "apps/web/src/app/(dashboard)/inventario/conteo/page.tsx"
git commit -m "feat(web): add physical count list page + types"
```

---

### Task 10: Frontend — detail page (DRAFT editable + read-only)

**Files:**
- Create: `apps/web/src/app/(dashboard)/inventario/conteo/[id]/page.tsx`

- [ ] **Step 1: Implement detail page**

```tsx
// apps/web/src/app/(dashboard)/inventario/conteo/[id]/page.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, Upload, CheckCircle, XCircle, Search } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { API_URL, apiFetch, apiRawFetch } from '@/lib/api';
import { downloadReport } from '@/lib/download-report';
import type {
  PhysicalCountFull, PhysicalCountDetail, PhysicalCountStatus,
  CsvUploadResult, FinalizeResult,
} from '@/types/inventory';

const STATUS_BADGE: Record<PhysicalCountStatus, { label: string; className: string }> = {
  DRAFT: { label: 'En progreso', className: 'bg-amber-100 text-amber-800' },
  FINALIZED: { label: 'Finalizado', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700' },
};

export default function ConteoDetailPage() {
  const params = useParams<{ id: string }>();
  const countId = params.id;
  const router = useRouter();
  const toast = useToast();

  const [count, setCount] = React.useState<PhysicalCountFull | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [searchDebounced, setSearchDebounced] = React.useState('');
  const [showFinalize, setShowFinalize] = React.useState(false);
  const [finalizing, setFinalizing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCount = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (searchDebounced) params.set('search', searchDebounced);
      const result = await apiFetch<PhysicalCountFull>(`/physical-counts/${countId}?${params.toString()}`);
      setCount(result);
    } catch (e) {
      toast.error('Error cargando conteo');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [countId, searchDebounced, toast]);

  React.useEffect(() => { fetchCount(); }, [fetchCount]);

  const handleCountedChange = React.useCallback(
    async (detailId: string, value: string) => {
      const qty = value === '' ? null : parseFloat(value);
      try {
        await apiFetch(`/physical-counts/${countId}/details/${detailId}`, {
          method: 'PATCH',
          body: JSON.stringify({ countedQty: qty }),
        });
        await fetchCount();
      } catch {
        toast.error('Error guardando');
      }
    },
    [countId, fetchCount, toast],
  );

  const handleUnitCostChange = React.useCallback(
    async (detailId: string, value: string) => {
      const cost = parseFloat(value);
      if (!Number.isFinite(cost)) return;
      try {
        await apiFetch(`/physical-counts/${countId}/details/${detailId}`, {
          method: 'PATCH',
          body: JSON.stringify({ unitCost: cost }),
        });
        await fetchCount();
      } catch {
        toast.error('Error guardando costo');
      }
    },
    [countId, fetchCount, toast],
  );

  const handleDownloadTemplate = async () => {
    try {
      await downloadReport(
        `${API_URL}/physical-counts/${countId}/csv-template`,
        `conteo_${count?.fiscalYear ?? ''}_template.csv`,
      );
    } catch (e) {
      toast.error('Error descargando plantilla');
      console.error(e);
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiRawFetch(`/physical-counts/${countId}/upload-csv`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = (await res.json()) as CsvUploadResult;
      if (result.errors.length > 0) {
        toast.error(`CSV: ${result.matched} actualizados, ${result.errors.length} errores`);
      } else {
        toast.success(`CSV: ${result.matched} ítems actualizados`);
      }
      await fetchCount();
    } catch (e) {
      toast.error('Error subiendo CSV');
      console.error(e);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Cancelar este conteo? No se podrá reanudar.')) return;
    try {
      await apiFetch(`/physical-counts/${countId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast.success('Conteo cancelado');
      router.push('/inventario/conteo');
    } catch (e) {
      toast.error('Error cancelando');
      console.error(e);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      const result = await apiFetch<FinalizeResult>(`/physical-counts/${countId}/finalize`, {
        method: 'POST',
        body: JSON.stringify({ confirm: true }),
      });
      toast.success(`Conteo finalizado · ${result.adjustmentsGenerated} ajustes generados`);
      await fetchCount();
      setShowFinalize(false);
    } catch (e) {
      const err = e as { data?: { code?: string; message?: string } };
      toast.error(err.data?.message ?? 'Error finalizando conteo');
      console.error(e);
    } finally {
      setFinalizing(false);
    }
  };

  if (loading || !count) {
    return <p className="text-center text-gray-500 py-8">Cargando…</p>;
  }

  const isDraft = count.status === 'DRAFT';
  const badge = STATUS_BADGE[count.status];
  const faltantes = count.details.data.filter((d) => (d.variance ?? 0) < 0);
  const sobrantes = count.details.data.filter((d) => (d.variance ?? 0) > 0);
  const faltantesValue = faltantes.reduce((s, d) => s + d.totalValue, 0);
  const sobrantesValue = sobrantes.reduce((s, d) => s + d.totalValue, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/inventario/conteo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">Conteo físico {count.fiscalYear}</h1>
              <p className="text-sm text-gray-600">Fecha: {count.countDate}</p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><p className="text-gray-500">Total ítems</p><p className="font-semibold">{count.summary.totalLines}</p></div>
            <div><p className="text-gray-500">Contados</p><p className="font-semibold">{count.summary.countedLines}</p></div>
            <div><p className="text-gray-500">Pendientes</p><p className="font-semibold">{count.summary.pendingLines}</p></div>
            <div>
              <p className="text-gray-500">Valor variance neto</p>
              <p className={`font-semibold ${count.summary.varianceNet < 0 ? 'text-red-600' : 'text-green-700'}`}>
                ${count.summary.varianceNet.toFixed(2)}
              </p>
            </div>
          </div>

          {isDraft && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-1" /> Plantilla CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" /> Subir CSV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = '';
                }}
              />
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <XCircle className="h-4 w-4 mr-1" /> Cancelar conteo
              </Button>
              <Button size="sm" onClick={() => setShowFinalize(true)}>
                <CheckCircle className="h-4 w-4 mr-1" /> Finalizar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por código o descripción…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Código</th>
                  <th className="text-left p-2">Descripción</th>
                  <th className="text-right p-2">Sistema</th>
                  <th className="text-right p-2">Contado</th>
                  <th className="text-right p-2">Variance</th>
                  <th className="text-right p-2">Costo un.</th>
                  <th className="text-left p-2">Movement</th>
                </tr>
              </thead>
              <tbody>
                {count.details.data.map((d) => (
                  <tr key={d.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 font-mono">{d.code}</td>
                    <td className="p-2">{d.description ?? '—'}</td>
                    <td className="p-2 text-right">{d.systemQty.toFixed(4)}</td>
                    <td className="p-2 text-right">
                      {isDraft ? (
                        <Input
                          type="number"
                          step="0.0001"
                          min="0"
                          defaultValue={d.countedQty !== null ? d.countedQty.toFixed(4) : ''}
                          className="w-24 text-right"
                          onBlur={(e) => handleCountedChange(d.id, e.target.value)}
                        />
                      ) : d.countedQty !== null ? d.countedQty.toFixed(4) : '—'}
                    </td>
                    <td className={`p-2 text-right ${d.variance < 0 ? 'text-red-600' : d.variance > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                      {d.countedQty === null ? '—' : d.variance.toFixed(4)}
                    </td>
                    <td className="p-2 text-right">
                      {isDraft && d.variance > 0 ? (
                        <Input
                          type="number"
                          step="0.0001"
                          min="0"
                          defaultValue={d.unitCost.toFixed(4)}
                          className="w-24 text-right"
                          onBlur={(e) => handleUnitCostChange(d.id, e.target.value)}
                        />
                      ) : `$${d.unitCost.toFixed(4)}`}
                    </td>
                    <td className="p-2 text-xs text-gray-600">
                      {d.adjustmentMovementId ? (
                        <Link href={`/inventario/${d.catalogItemId}`} className="text-blue-600 hover:underline">
                          Ver kardex →
                        </Link>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            Mostrando {count.details.data.length} de {count.details.total}.
          </p>
        </CardContent>
      </Card>

      {showFinalize && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold">Finalizar conteo {count.fiscalYear}</h2>
              <div className="text-sm space-y-2">
                <p>Se generarán <strong>{faltantes.length + sobrantes.length}</strong> ajustes:</p>
                <ul className="list-disc ml-5 text-gray-700">
                  <li>Faltantes: {faltantes.length} ítems · ${faltantesValue.toFixed(2)}</li>
                  <li>Sobrantes: {sobrantes.length} ítems · ${sobrantesValue.toFixed(2)}</li>
                </ul>
                <p>Valor neto: <strong>${(faltantesValue + sobrantesValue).toFixed(2)}</strong></p>
                {count.summary.pendingLines > 0 && (
                  <p className="text-amber-700">
                    ⚠️ {count.summary.pendingLines} ítems sin contar — no se ajustarán.
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowFinalize(false)} disabled={finalizing}>
                  Volver
                </Button>
                <Button onClick={handleFinalize} disabled={finalizing}>
                  {finalizing ? 'Finalizando…' : 'Confirmar y finalizar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/web
npx tsc --noEmit 2>&1 | grep -E "conteo" | head -10
```
Expected: only lucide-react pre-existing noise.

- [ ] **Step 3: Commit**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count
git add "apps/web/src/app/(dashboard)/inventario/conteo/[id]/page.tsx"
git commit -m "feat(web): add physical count detail page (editable + read-only + finalize modal)"
```

---

### Task 11: Wire button in `/inventario` header

**Files:**
- Modify: `apps/web/src/app/(dashboard)/inventario/page.tsx`

- [ ] **Step 1: Add button**

Open `apps/web/src/app/(dashboard)/inventario/page.tsx`. In the header (right next to or before the `Exportar XLSX` button), add:

```tsx
<Button asChild variant="outline">
  <Link href="/inventario/conteo">
    <ClipboardCheck className="h-4 w-4 mr-2" /> Conteo físico
  </Link>
</Button>
```

Add imports if missing:
- `import Link from 'next/link';` (already there from Task 6 of Fase 2.4).
- `import { ClipboardCheck } from 'lucide-react';` (add to the existing lucide-react import line).

If the `Button asChild` pattern doesn't work with the project's shadcn setup, use:
```tsx
<Link href="/inventario/conteo">
  <Button variant="outline">
    <ClipboardCheck className="h-4 w-4 mr-2" /> Conteo físico
  </Button>
</Link>
```

- [ ] **Step 2: Typecheck**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/web
npx tsc --noEmit 2>&1 | grep -E "inventario/page" | head -5
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count
git add "apps/web/src/app/(dashboard)/inventario/page.tsx"
git commit -m "feat(web): add Conteo físico button to inventory list header"
```

---

### Task 12: E2E stub + regression + evidence + push + PR

**Files:**
- Modify: `apps/web/tests/e2e/inventory.spec.ts` — append.
- Create: `outputs/EXECUTION_EVIDENCE_PHASE_2_6.md`

- [ ] **Step 1: E2E stub**

Append to `apps/web/tests/e2e/inventory.spec.ts` before final `});`:

```typescript
  test.skip('iniciar conteo físico + finalizar con diferencias', async () => {
    // TODO: unblock when staging env ready
  });
```

- [ ] **Step 2: Regression sweep**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx jest --config jest.config.ts src/modules/ 2>&1 | grep -E "(Tests:|Test Suites:)" | head -2
```
Record numbers.

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/api
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count/apps/web
npx tsc --noEmit 2>&1 | grep -v sync-engine | grep -c "error TS"
```

Expected: +~38 tests (service + csv + controller + B.2 extension = 2), 0 new tsc.

- [ ] **Step 3: Write evidence doc**

```markdown
# Execution Evidence — Fase 2.6 Physical Count (B.3)

**Date:** <TODAY>
**Branch:** `feature/physical-count`
**Spec:** `docs/superpowers/specs/2026-04-19-fase-2-6-physical-count-design.md`
**Plan:** `docs/superpowers/plans/2026-04-19-fase-2-6-physical-count.md`

## Built

### Backend
- `PhysicalCountService`: create (populate details from catalog + state snapshot), findAll (with summary per count), findOne (paginated details + search), updateDetail (recalc variance + totalValue), uploadCsv (merge by code), finalize (generates AJUSTE_FISICO_FALTANTE/SOBRANTE via B.2 service + skipDateValidation), cancel, getCsvTemplate.
- `PhysicalCountCsvService`: parse with papaparse, trim + uppercase codes, BOM handling, row-level error collection.
- `PhysicalCountsController` with 8 endpoints bajo `/physical-counts`.
- `PhysicalCountsModule` registrado en AppModule. Importa PrismaModule + PlansModule + InventoryAdjustmentsModule.
- 5 DTOs nuevos (create/update-detail/list/finalize/cancel).
- Extensión no-breaking de `InventoryAdjustmentService`: 4° param opcional `{ skipDateValidation }`.

### Frontend
- Tipos + list page `/inventario/conteo` con cards por año fiscal + botón "Iniciar conteo".
- Detail page `/inventario/conteo/[id]`: tabla inline editable en DRAFT + modal de finalize + read-only para FINALIZED/CANCELLED.
- Upload CSV desde hidden file input + download plantilla CSV via `downloadReport`.
- Botón "Conteo físico" en header de `/inventario`.

## Tests

| Métrica | Baseline | Final | Delta |
|---------|----------|-------|-------|
| Jest tests pass | <FILL> | <FILL> | +~38 |
| API tsc errors | <FILL> | <FILL> | 0 nuevos |
| Web tsc errors | <FILL> | <FILL> | 0 nuevos |

Nuevos: PhysicalCountService spec (~21), PhysicalCountCsvService spec (~7), PhysicalCountsController spec (~7), B.2 flag (+2) = ~37.

## Not included (follow-up)
- Reporte exportable del conteo (PDF / Excel resumen).
- Múltiples conteos por año (parciales por sección / mensuales).
- Reversión de conteo FINALIZED (política: inmutable, compensás con ajustes B.2).

## Post-deploy runbook
**Zero schema changes.** Seed de cuentas contables de B.2 ya cubre las necesarias.

1. Merge → CI deploy staging.
2. Login rol GERENTE → `/inventario` → botón "Conteo físico".
3. `+ Iniciar conteo 2026` → verifica que crea detail por cada ítem trackInventory.
4. Llenar algunos countedQty inline (PATCH silencioso).
5. Descargar plantilla CSV, editar, subir → verificar matched/errors.
6. Cliquear "Finalizar" → revisar modal → confirmar.
7. Verificar `/inventario/[id]/kardex` muestra los movements generados con fecha = countDate.
8. Con `accounting` ON, verificar asientos generados en `/contabilidad`.
9. Smoke prod post-merge.

## Rollback
`git revert <merge-sha>`. Zero schema changes. Conteos creados quedan en DB sin UI. Movements generados NO se revierten (misma política que B.2).

## Commits
<INSERT git log --oneline origin/main..HEAD>
```

Replace `<TODAY>` (2026-04-19), `<FILL>`, `<INSERT...>` with actuals.

- [ ] **Step 4: Commit**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/physical-count
git add apps/web/tests/e2e/inventory.spec.ts outputs/EXECUTION_EVIDENCE_PHASE_2_6.md
git commit -m "docs: execution evidence for Fase 2.6 Physical Count (B.3)"
```

- [ ] **Step 5: Push + open PR**

```bash
git push -u origin feature/physical-count 2>&1 | tail -5
```

```bash
gh pr create --title "feat(inventory): Fase 2.6 — Physical count (B.3)" --body "$(cat <<'EOF'
## Summary

Sub-proyecto B.3: conteo físico anual — cierra el sub-proyecto B de inventario. Una sesión por año fiscal, captura online inline + CSV upload intercambiables, al finalizar genera automáticamente \`AJUSTE_FISICO_FALTANTE\` / \`AJUSTE_FISICO_SOBRANTE\` vía el \`InventoryAdjustmentService\` de B.2.

**Zero schema changes.** Reusa el seed contable de B.2.

## Backend

- \`PhysicalCountService\` con create/findAll/findOne/updateDetail/uploadCsv/finalize/cancel/getCsvTemplate.
- \`PhysicalCountCsvService\` (papaparse).
- \`PhysicalCountsController\` con 8 endpoints bajo \`/physical-counts\`.
- Extensión no-breaking de \`InventoryAdjustmentService\`: 4° param opcional \`{ skipDateValidation }\` (para permitir dating del conteo antes del mes actual).
- Reusa permiso \`inventory:adjust\` + feature flag \`inventory_reports\`.

## Frontend

- \`/inventario/conteo\` list page (cards por año fiscal).
- \`/inventario/conteo/[id]\` detail page (tabla inline editable + CSV upload/download + modal finalize).
- Botón "Conteo físico" en header de \`/inventario\`.

## Test plan

- [x] Jest: +~38 tests, sin regresiones.
- [x] TypeScript: 0 errores nuevos.
- [x] E2E stub skip.
- [ ] QA staging.
- [ ] QA prod.

Detalles en \`outputs/EXECUTION_EVIDENCE_PHASE_2_6.md\`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Capture PR URL.

- [ ] **Step 6: Report** — PR URL + regression verdict.

---

## Self-Review

### Spec coverage

| Spec section | Task |
|--------------|------|
| §1 Goal | Tasks 2–11 cover backend + frontend |
| §2 Architecture (module, CSV service, 2 pages) | Tasks 4–8 (backend), 9–11 (frontend) |
| §3 Data model (reuse existing) | Task 4 (create populates details), Task 5 (update), Task 7 (finalize populates adjustmentMovementId) |
| §4 API — POST, GET, GET/:id, PATCH detail, upload CSV, finalize, cancel, csv-template | Tasks 4 (create/findAll/findOne), 5 (updateDetail/cancel), 6 (uploadCsv), 7 (finalize), 8 (controller + csv-template) |
| §5 B.2 extension | Task 2 |
| §6 UI layout | Tasks 9 (list), 10 (detail), 11 (button) |
| §7 RBAC | Already done by B.2; controller uses `inventory:adjust` (Task 8) |
| §8 Error handling (feature off, stock insuf, etc.) | Task 4–7 cover error codes; controller surfaces; frontend Task 10 handles toasts |
| §9 Testing | Tasks 4–8 (backend specs), Task 12 (regression + E2E stub) |
| §10 Post-deploy | Task 12 (runbook in evidence) |

### Placeholder scan

No TBD/TODO in plan except evidence template placeholders (`<TODAY>`, `<FILL>`) which are intentional.

### Type consistency

- `AdjustmentSubtype` from B.2 used consistently (Task 7 service passes `AJUSTE_FALTANTE` / `AJUSTE_SOBRANTE`).
- `PhysicalCountStatus` defined in Task 3 DTO, used in Task 9 types + Task 10 rendering.
- `UpdateDetailDto`, `ListCountsDto`, `FinalizeDto`, `CancelDto` defined in Task 3, used in Tasks 5/8.
- `CsvParseResult`, `CsvUploadResult`, `FinalizeResult` types consistent backend→frontend.
- Error codes (`COUNT_NOT_FOUND`, `COUNT_NOT_EDITABLE`, `NOT_DRAFT`, `DUPLICATE_FISCAL_YEAR`, `INVALID_COUNT_DATE`, `NOT_IN_COUNT`, `INVALID_QTY`, `EMPTY_CODE`, `INVALID_HEADER`) match between service throws and frontend error handling.
