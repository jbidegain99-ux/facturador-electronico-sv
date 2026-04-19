# Fase 2.5 — Inventory Adjustments Implementation Plan (B.2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir al usuario registrar movimientos manuales de inventario (ROBO, MERMA, DONACION, AUTOCONSUMO, AJUSTE_FALTANTE, AJUSTE_SOBRANTE) desde `/inventario` y `/inventario/[id]`, actualizando stock y (si el feature `accounting` está ON) generando asientos contables.

**Architecture:** Nuevo módulo backend `inventory-adjustments` separado del `inventory` (read-only de Fase 2.4). Un único componente modal `CreateAdjustmentModal` reusable en la list page y la detail page. Zero schema changes. Reusa `InventoryState`, `InventoryMovement`, `AccountingService`. Nuevo permiso `inventory:adjust`. 4 mappings contables nuevos + 2 reusos existentes.

**Tech Stack:** NestJS 10 + Prisma 5.10 + Jest + manual Prisma mock pattern. Next.js 15 App Router + Tailwind + shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-04-19-fase-2-5-inventory-adjustments-design.md`
**Depende de:** Fases 1.2–2.4 merged a main ✅

---

## File structure

**Create (backend):**
- `apps/api/src/modules/inventory-adjustments/inventory-adjustments.module.ts`
- `apps/api/src/modules/inventory-adjustments/inventory-adjustments.controller.ts`
- `apps/api/src/modules/inventory-adjustments/inventory-adjustments.controller.spec.ts`
- `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.ts`
- `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts`
- `apps/api/src/modules/inventory-adjustments/dto/create-adjustment.dto.ts`
- `apps/api/src/modules/inventory-adjustments/dto/list-adjustments.dto.ts`
- `apps/api/scripts/seed-inventory-adjust-perm.ts`

**Create (frontend):**
- `apps/web/src/components/inventory/create-adjustment-modal.tsx`
- `outputs/EXECUTION_EVIDENCE_PHASE_2_5.md`

**Modify (backend):**
- `apps/api/src/modules/accounting/default-mappings.data.ts` — añadir 4 mappings (`AJUSTE_ROBO/MERMA/DONACION/AUTOCONSUMO`).
- `apps/api/src/modules/accounting/default-mappings.purchases.spec.ts` — añadir asserts para los 4 nuevos.
- `apps/api/src/modules/rbac/services/rbac.service.ts` — añadir `inventory:adjust` a GERENTE + CONTADOR en `LEGACY_ROLE_PERMISSIONS`.
- `apps/api/src/app.module.ts` — registrar `InventoryAdjustmentsModule`.

**Modify (frontend):**
- `apps/web/src/types/inventory.ts` — añadir tipo `AdjustmentSubtype` + `InventoryAdjustment`.
- `apps/web/src/app/(dashboard)/inventario/page.tsx` — añadir botón "+ Nuevo ajuste" + render del modal.
- `apps/web/src/app/(dashboard)/inventario/[catalogItemId]/page.tsx` — añadir botón "+ Ajuste" + render del modal.
- `apps/web/tests/e2e/inventory.spec.ts` — añadir `test.skip` para create adjustment.

No schema changes. No new dependencies.

---

### Task 1: Branch + baseline + worktree

**Files:** none (setup only).

- [ ] **Step 1: Create worktree + branch**

```bash
cd /home/jose/facturador-electronico-sv
git fetch origin main
git worktree add .worktrees/inventory-adjustments -b feature/inventory-adjustments origin/main
cd .worktrees/inventory-adjustments
git branch --show-current
```
Expected: `feature/inventory-adjustments`.

- [ ] **Step 2: Verify prereqs**

```bash
grep -q "AJUSTE_FISICO_FALTANTE" apps/api/src/modules/accounting/default-mappings.data.ts && echo "accounting mappings OK"
grep -q "model InventoryState" apps/api/prisma/schema.prisma && echo "InventoryState OK"
grep -q "inventory_reports" apps/api/src/common/plan-features.ts && echo "feature flag OK"
grep -q "postJournalEntry" apps/api/src/modules/accounting/accounting.service.ts && echo "postJournalEntry OK"
grep -q "LEGACY_ROLE_PERMISSIONS" apps/api/src/modules/rbac/services/rbac.service.ts && echo "RBAC roles OK"
test -d apps/api/src/modules/inventory && echo "InventoryModule (Fase 2.4) OK"
```
Expected: 6 OK. Else → BLOCKED.

- [ ] **Step 3: Baseline test count**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/ 2>&1 | grep -E "(Tests:|Test Suites:)" | head -2
```
Record baseline.

- [ ] **Step 4: No commit** — pure setup.

---

### Task 2: Accounting mappings — 4 new operations

**Files:**
- Modify: `apps/api/src/modules/accounting/default-mappings.data.ts`
- Modify: `apps/api/src/modules/accounting/default-mappings.purchases.spec.ts`

- [ ] **Step 1: Append spec cases (TDD red) — assert 4 new ops exist**

Append to `apps/api/src/modules/accounting/default-mappings.purchases.spec.ts` (find the existing `describe('default mappings', ...)` or similar and add these `it` blocks inside):

```typescript
it('has AJUSTE_ROBO mapping (debe 5104 / haber 110401)', () => {
  const m = DEFAULT_MAPPINGS.find((x) => x.operation === 'AJUSTE_ROBO');
  expect(m).toBeDefined();
  expect(m?.debitCode).toBe('5104');
  expect(m?.creditCode).toBe('110401');
});

it('has AJUSTE_MERMA mapping (debe 5105 / haber 110401)', () => {
  const m = DEFAULT_MAPPINGS.find((x) => x.operation === 'AJUSTE_MERMA');
  expect(m).toBeDefined();
  expect(m?.debitCode).toBe('5105');
  expect(m?.creditCode).toBe('110401');
});

it('has AJUSTE_DONACION mapping (debe 5106 / haber 110401)', () => {
  const m = DEFAULT_MAPPINGS.find((x) => x.operation === 'AJUSTE_DONACION');
  expect(m).toBeDefined();
  expect(m?.debitCode).toBe('5106');
  expect(m?.creditCode).toBe('110401');
});

it('has AJUSTE_AUTOCONSUMO mapping (debe 5107 / haber 110401)', () => {
  const m = DEFAULT_MAPPINGS.find((x) => x.operation === 'AJUSTE_AUTOCONSUMO');
  expect(m).toBeDefined();
  expect(m?.debitCode).toBe('5107');
  expect(m?.creditCode).toBe('110401');
});
```

If the existing spec file doesn't import `DEFAULT_MAPPINGS`, check the actual export name at the top of `default-mappings.data.ts` and adjust.

- [ ] **Step 2: Run tests → verify RED**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/accounting/default-mappings.purchases.spec.ts 2>&1 | tail -6
```
Expected: FAIL on the 4 new `it` blocks.

- [ ] **Step 3: Add 4 mappings to `default-mappings.data.ts`**

Find the existing `AJUSTE_FISICO_FALTANTE` / `AJUSTE_FISICO_SOBRANTE` entries (lines ~183 and ~197). Append these AFTER `AJUSTE_FISICO_SOBRANTE`:

```typescript
  {
    operation: 'AJUSTE_ROBO',
    description: 'Ajuste por robo de inventario',
    debitCode: '5104',
    creditCode: '110401',
    mappingConfig: {
      debe: [{ cuenta: '5104', monto: 'total', descripcion: 'Pérdida por robo' }],
      haber: [{ cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería' }],
    },
  },
  {
    operation: 'AJUSTE_MERMA',
    description: 'Ajuste por merma / deterioro',
    debitCode: '5105',
    creditCode: '110401',
    mappingConfig: {
      debe: [{ cuenta: '5105', monto: 'total', descripcion: 'Merma inventario' }],
      haber: [{ cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería' }],
    },
  },
  {
    operation: 'AJUSTE_DONACION',
    description: 'Ajuste por donación de inventario',
    debitCode: '5106',
    creditCode: '110401',
    mappingConfig: {
      debe: [{ cuenta: '5106', monto: 'total', descripcion: 'Donaciones' }],
      haber: [{ cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería' }],
    },
  },
  {
    operation: 'AJUSTE_AUTOCONSUMO',
    description: 'Ajuste por autoconsumo',
    debitCode: '5107',
    creditCode: '110401',
    mappingConfig: {
      debe: [{ cuenta: '5107', monto: 'total', descripcion: 'Gasto autoconsumo' }],
      haber: [{ cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería' }],
    },
  },
```

- [ ] **Step 4: Run tests → verify GREEN**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/accounting/default-mappings.purchases.spec.ts 2>&1 | tail -6
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/accounting/default-mappings.data.ts apps/api/src/modules/accounting/default-mappings.purchases.spec.ts
git commit -m "feat(accounting): add 4 inventory adjustment operations (ROBO/MERMA/DONACION/AUTOCONSUMO)"
```

---

### Task 3: RBAC — add `inventory:adjust` permission

**Files:**
- Modify: `apps/api/src/modules/rbac/services/rbac.service.ts`

- [ ] **Step 1: Add permission to GERENTE and CONTADOR in `LEGACY_ROLE_PERMISSIONS`**

Open `apps/api/src/modules/rbac/services/rbac.service.ts`. Find the `LEGACY_ROLE_PERMISSIONS` const (around line 15–40). Add `'inventory:adjust'` to the GERENTE and CONTADOR permission arrays. Example of the final GERENTE entry:

```typescript
  GERENTE: [
    'dte:create', 'dte:read', 'dte:update', 'dte:void', 'dte:transmit', 'dte:export',
    'client:create', 'client:read', 'client:update', 'client:delete',
    'branch:read', 'pos:read', 'pos:update',
    'report:read', 'report:export', 'catalog:read', 'catalog:manage',
    'quote:create', 'quote:read', 'quote:update', 'quote:delete', 'quote:send',
    'user:read',
    'inventory:adjust',
  ],
```

And CONTADOR:

```typescript
  CONTADOR: [
    'dte:read', 'dte:export', 'client:read',
    'report:read', 'report:export',
    'accounting:read', 'accounting:create', 'accounting:approve',
    'catalog:read',
    'inventory:adjust',
  ],
```

FACTURADOR does NOT receive `inventory:adjust`. ADMIN already has `*` so nothing to add.

- [ ] **Step 2: Check if there is a modern role system to update**

```bash
grep -rn "'catalog:manage'\|'catalog:read'" apps/api/src/modules/rbac/ | head -5
```

If you find a `role-permissions.ts` or similar with a modern/enum-based role definition, append `'inventory:adjust'` to the same roles that have `'catalog:manage'`. If you find nothing else, the legacy file is the only source.

- [ ] **Step 3: Typecheck**

```bash
cd apps/api && npx tsc --noEmit 2>&1 | grep -c "error TS"
```
Expected: same count as baseline (no new errors).

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/rbac/
git commit -m "feat(rbac): add inventory:adjust permission to GERENTE and CONTADOR"
```

---

### Task 4: DTOs — `CreateAdjustmentDto` + `ListAdjustmentsDto`

**Files:**
- Create: `apps/api/src/modules/inventory-adjustments/dto/create-adjustment.dto.ts`
- Create: `apps/api/src/modules/inventory-adjustments/dto/list-adjustments.dto.ts`

- [ ] **Step 1: Create `CreateAdjustmentDto`**

File: `apps/api/src/modules/inventory-adjustments/dto/create-adjustment.dto.ts`

```typescript
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const ADJUSTMENT_SUBTYPES = [
  'ROBO',
  'MERMA',
  'DONACION',
  'AUTOCONSUMO',
  'AJUSTE_FALTANTE',
  'AJUSTE_SOBRANTE',
] as const;

export type AdjustmentSubtype = (typeof ADJUSTMENT_SUBTYPES)[number];

export class CreateAdjustmentDto {
  @IsString()
  catalogItemId!: string;

  @IsIn(ADJUSTMENT_SUBTYPES)
  subtype!: AdjustmentSubtype;

  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Type(() => Number)
  quantity!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Type(() => Number)
  unitCost?: number;

  @IsDateString()
  movementDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
```

- [ ] **Step 2: Create `ListAdjustmentsDto`**

File: `apps/api/src/modules/inventory-adjustments/dto/list-adjustments.dto.ts`

```typescript
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ADJUSTMENT_SUBTYPES, AdjustmentSubtype } from './create-adjustment.dto';

export class ListAdjustmentsDto {
  @IsOptional() @IsString()
  catalogItemId?: string;

  @IsOptional() @IsIn(ADJUSTMENT_SUBTYPES)
  subtype?: AdjustmentSubtype;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  endDate?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;
}
```

- [ ] **Step 3: Typecheck**

```bash
cd apps/api && npx tsc --noEmit 2>&1 | grep -E "inventory-adjustments" | head -5
```
Expected: empty.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/inventory-adjustments/dto/
git commit -m "feat(inventory-adjustments): add CreateAdjustmentDto + ListAdjustmentsDto"
```

---

### Task 5: Service — core salida logic (5 subtypes without entrada, without accounting)

**Files:**
- Create: `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.ts`
- Create: `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts`

- [ ] **Step 1: Write spec (TDD red)**

File: `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { InventoryAdjustmentService } from './inventory-adjustment.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountingService } from '../../accounting/accounting.service';
import { PlanFeaturesService } from '../../plans/services/plan-features.service';

describe('InventoryAdjustmentService', () => {
  let service: InventoryAdjustmentService;
  let prisma: {
    $transaction: jest.Mock;
    catalogItem: { findFirst: jest.Mock };
    inventoryState: { findFirst: jest.Mock; update: jest.Mock; create: jest.Mock };
    inventoryMovement: { aggregate: jest.Mock; create: jest.Mock; findMany: jest.Mock; count: jest.Mock };
    tenant: { findUnique: jest.Mock };
  };
  let accounting: { createAndPostJournalEntry: jest.Mock };
  let planFeatures: { checkFeatureAccess: jest.Mock };

  const tenantId = 't1';
  const userId = 'u1';
  const catalogItemId = 'c1';

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (fn) => fn(prisma)),
      catalogItem: { findFirst: jest.fn() },
      inventoryState: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
      inventoryMovement: { aggregate: jest.fn(), create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
      tenant: { findUnique: jest.fn() },
    };
    accounting = { createAndPostJournalEntry: jest.fn() };
    planFeatures = { checkFeatureAccess: jest.fn().mockResolvedValue(false) };

    const module = await Test.createTestingModule({
      providers: [
        InventoryAdjustmentService,
        { provide: PrismaService, useValue: prisma },
        { provide: AccountingService, useValue: accounting },
        { provide: PlanFeaturesService, useValue: planFeatures },
      ],
    }).compile();
    service = module.get(InventoryAdjustmentService);
  });

  const baseSalidaInput = {
    catalogItemId,
    subtype: 'MERMA' as const,
    quantity: 2,
    movementDate: new Date().toISOString().slice(0, 10),
    notes: 'test',
  };

  const mockItem = (trackInventory = true) => {
    prisma.catalogItem.findFirst.mockResolvedValue({ id: catalogItemId, tenantId, trackInventory });
  };
  const mockState = (currentQty = 10, currentAvgCost = 5) => {
    prisma.inventoryState.findFirst.mockResolvedValue({
      id: 's1', tenantId, catalogItemId,
      currentQty: { toString: () => String(currentQty) },
      currentAvgCost: { toString: () => String(currentAvgCost) },
      totalValue: { toString: () => String(currentQty * currentAvgCost) },
      reorderLevel: null,
      lastMovementAt: null,
    });
  };
  const mockCorrelativo = (max = 0) => {
    prisma.inventoryMovement.aggregate.mockResolvedValue({ _max: { correlativo: max } });
  };
  const mockMovementCreated = (overrides = {}) => {
    prisma.inventoryMovement.create.mockResolvedValue({
      id: 'm1', correlativo: 1, qtyIn: { toString: () => '0' }, qtyOut: { toString: () => '2' },
      unitCost: { toString: () => '5' }, totalCost: { toString: () => '10' },
      balanceQty: { toString: () => '8' }, balanceAvgCost: { toString: () => '5' }, balanceValue: { toString: () => '40' },
      movementDate: new Date(baseSalidaInput.movementDate), movementType: 'SALIDA_MERMA',
      journalEntryId: null, notes: 'test',
      ...overrides,
    });
  };

  describe('createAdjustment — salidas', () => {
    it.each([
      ['ROBO', 'SALIDA_ROBO'],
      ['MERMA', 'SALIDA_MERMA'],
      ['DONACION', 'SALIDA_DONACION'],
      ['AUTOCONSUMO', 'SALIDA_AUTOCONSUMO'],
      ['AJUSTE_FALTANTE', 'SALIDA_AJUSTE'],
    ])('maps subtype %s to movementType %s', async (subtype, expectedType) => {
      mockItem(); mockState(); mockCorrelativo(); mockMovementCreated({ movementType: expectedType });
      prisma.inventoryState.update.mockResolvedValue({});
      await service.createAdjustment(tenantId, userId, { ...baseSalidaInput, subtype: subtype as 'MERMA' });
      const call = prisma.inventoryMovement.create.mock.calls[0][0];
      expect(call.data.movementType).toBe(expectedType);
    });

    it('uses currentAvgCost as unitCost for salidas (ignores input unitCost)', async () => {
      mockItem(); mockState(10, 5); mockCorrelativo(); mockMovementCreated();
      prisma.inventoryState.update.mockResolvedValue({});
      await service.createAdjustment(tenantId, userId, { ...baseSalidaInput, unitCost: 999 });
      const call = prisma.inventoryMovement.create.mock.calls[0][0];
      expect(Number(call.data.unitCost)).toBe(5);
      expect(Number(call.data.totalCost)).toBe(10); // 2 * 5
    });

    it('throws INSUFFICIENT_STOCK when quantity > currentQty', async () => {
      mockItem(); mockState(1); mockCorrelativo();
      await expect(
        service.createAdjustment(tenantId, userId, { ...baseSalidaInput, quantity: 2 }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'INSUFFICIENT_STOCK', available: 1 }),
      });
    });

    it('throws INSUFFICIENT_STOCK when no state exists for salida', async () => {
      mockItem();
      prisma.inventoryState.findFirst.mockResolvedValue(null);
      await expect(
        service.createAdjustment(tenantId, userId, baseSalidaInput),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'INSUFFICIENT_STOCK', available: 0 }),
      });
    });

    it('throws NOT_TRACKED if CatalogItem.trackInventory=false', async () => {
      mockItem(false);
      await expect(
        service.createAdjustment(tenantId, userId, baseSalidaInput),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'NOT_TRACKED' }),
      });
    });

    it('throws FUTURE_DATE when movementDate is in the future', async () => {
      mockItem(); mockState(); mockCorrelativo();
      const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
      await expect(
        service.createAdjustment(tenantId, userId, { ...baseSalidaInput, movementDate: tomorrow }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'FUTURE_DATE' }),
      });
    });

    it('throws DATE_BEFORE_MONTH_START when movementDate < month start', async () => {
      mockItem(); mockState(); mockCorrelativo();
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const dateStr = lastMonth.toISOString().slice(0, 10);
      await expect(
        service.createAdjustment(tenantId, userId, { ...baseSalidaInput, movementDate: dateStr }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'DATE_BEFORE_MONTH_START' }),
      });
    });

    it('assigns correlativo = max + 1 for (tenant, item)', async () => {
      mockItem(); mockState(); mockCorrelativo(7); mockMovementCreated();
      prisma.inventoryState.update.mockResolvedValue({});
      await service.createAdjustment(tenantId, userId, baseSalidaInput);
      const call = prisma.inventoryMovement.create.mock.calls[0][0];
      expect(call.data.correlativo).toBe(8);
    });

    it('updates InventoryState.currentQty preserving currentAvgCost', async () => {
      mockItem(); mockState(10, 5); mockCorrelativo(); mockMovementCreated();
      prisma.inventoryState.update.mockResolvedValue({});
      await service.createAdjustment(tenantId, userId, baseSalidaInput);
      const call = prisma.inventoryState.update.mock.calls[0][0];
      expect(Number(call.data.currentQty)).toBe(8);
      expect(Number(call.data.currentAvgCost)).toBe(5);
      expect(Number(call.data.totalValue)).toBe(40);
    });

    it('sourceType=MANUAL_ADJUSTMENT, sourceId=userId, createdBy=userId', async () => {
      mockItem(); mockState(); mockCorrelativo(); mockMovementCreated();
      prisma.inventoryState.update.mockResolvedValue({});
      await service.createAdjustment(tenantId, userId, baseSalidaInput);
      const call = prisma.inventoryMovement.create.mock.calls[0][0];
      expect(call.data.sourceType).toBe('MANUAL_ADJUSTMENT');
      expect(call.data.sourceId).toBe(userId);
      expect(call.data.createdBy).toBe(userId);
    });
  });
});
```

- [ ] **Step 2: Run spec → verify RED**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts 2>&1 | tail -6
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement service**

File: `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.ts`

```typescript
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountingService } from '../../accounting/accounting.service';
import { PlanFeaturesService } from '../../plans/services/plan-features.service';
import { CreateAdjustmentDto, AdjustmentSubtype } from '../dto/create-adjustment.dto';

const SUBTYPE_TO_MOVEMENT_TYPE: Record<AdjustmentSubtype, string> = {
  ROBO: 'SALIDA_ROBO',
  MERMA: 'SALIDA_MERMA',
  DONACION: 'SALIDA_DONACION',
  AUTOCONSUMO: 'SALIDA_AUTOCONSUMO',
  AJUSTE_FALTANTE: 'SALIDA_AJUSTE',
  AJUSTE_SOBRANTE: 'ENTRADA_AJUSTE',
};

const SUBTYPE_TO_OPERATION: Record<AdjustmentSubtype, string> = {
  ROBO: 'AJUSTE_ROBO',
  MERMA: 'AJUSTE_MERMA',
  DONACION: 'AJUSTE_DONACION',
  AUTOCONSUMO: 'AJUSTE_AUTOCONSUMO',
  AJUSTE_FALTANTE: 'AJUSTE_FISICO_FALTANTE',
  AJUSTE_SOBRANTE: 'AJUSTE_FISICO_SOBRANTE',
};

const ENTRADA_SUBTYPES: AdjustmentSubtype[] = ['AJUSTE_SOBRANTE'];

@Injectable()
export class InventoryAdjustmentService {
  private readonly logger = new Logger(InventoryAdjustmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
    private readonly planFeatures: PlanFeaturesService,
  ) {}

  async createAdjustment(tenantId: string, userId: string, dto: CreateAdjustmentDto) {
    // 1. Validate item exists + trackInventory
    const item = await this.prisma.catalogItem.findFirst({
      where: { id: dto.catalogItemId, tenantId },
    });
    if (!item) {
      throw new BadRequestException({ code: 'ITEM_NOT_FOUND', message: 'Ítem no encontrado' });
    }
    if (!item.trackInventory) {
      throw new BadRequestException({ code: 'NOT_TRACKED', message: 'El ítem no tiene inventario activado' });
    }

    // 2. Validate date
    this.validateDate(dto.movementDate);

    const isEntrada = ENTRADA_SUBTYPES.includes(dto.subtype);
    const movementType = SUBTYPE_TO_MOVEMENT_TYPE[dto.subtype];

    // 3. Transaction: lock state, validate qty, create movement, update state
    return this.prisma.$transaction(async (tx) => {
      const state = await tx.inventoryState.findFirst({
        where: { tenantId, catalogItemId: dto.catalogItemId },
      });

      if (!isEntrada) {
        const availableQty = state ? Number(state.currentQty.toString()) : 0;
        if (availableQty < dto.quantity) {
          throw new BadRequestException({
            code: 'INSUFFICIENT_STOCK',
            message: 'Stock insuficiente',
            available: availableQty,
          });
        }
      } else if (!dto.unitCost) {
        throw new BadRequestException({
          code: 'MISSING_UNIT_COST',
          message: 'AJUSTE_SOBRANTE requiere unitCost',
        });
      }

      // 4. Correlativo
      const maxAgg = await tx.inventoryMovement.aggregate({
        where: { tenantId, catalogItemId: dto.catalogItemId },
        _max: { correlativo: true },
      });
      const correlativo = (maxAgg._max.correlativo ?? 0) + 1;

      // 5. Compute unitCost + balances
      const currentQty = state ? Number(state.currentQty.toString()) : 0;
      const currentAvgCost = state ? Number(state.currentAvgCost.toString()) : 0;

      let unitCost: number;
      let newQty: number;
      let newAvgCost: number;
      let qtyIn = 0;
      let qtyOut = 0;

      if (isEntrada) {
        unitCost = dto.unitCost!;
        qtyIn = dto.quantity;
        newQty = currentQty + dto.quantity;
        newAvgCost = newQty === 0
          ? unitCost
          : (currentQty * currentAvgCost + dto.quantity * unitCost) / newQty;
      } else {
        unitCost = currentAvgCost;
        qtyOut = dto.quantity;
        newQty = currentQty - dto.quantity;
        newAvgCost = currentAvgCost; // invariant on salida
      }

      const totalCost = dto.quantity * unitCost;
      const newValue = newQty * newAvgCost;

      // 6. Create movement
      const movement = await tx.inventoryMovement.create({
        data: {
          tenantId,
          catalogItemId: dto.catalogItemId,
          movementDate: new Date(dto.movementDate),
          correlativo,
          movementType,
          qtyIn,
          qtyOut,
          unitCost,
          totalCost,
          balanceQty: newQty,
          balanceAvgCost: newAvgCost,
          balanceValue: newValue,
          sourceType: 'MANUAL_ADJUSTMENT',
          sourceId: userId,
          notes: dto.notes ?? null,
          createdBy: userId,
        },
      });

      // 7. Upsert state
      if (state) {
        await tx.inventoryState.update({
          where: { id: state.id },
          data: {
            currentQty: newQty,
            currentAvgCost: newAvgCost,
            totalValue: newValue,
            lastMovementAt: new Date(dto.movementDate),
          },
        });
      } else {
        await tx.inventoryState.create({
          data: {
            tenantId,
            catalogItemId: dto.catalogItemId,
            currentQty: newQty,
            currentAvgCost: newAvgCost,
            totalValue: newValue,
            lastMovementAt: new Date(dto.movementDate),
          },
        });
      }

      return this.toResponse(movement);
    });
  }

  private validateDate(isoDate: string) {
    const date = new Date(isoDate);
    const now = new Date();
    if (date.getTime() > now.getTime()) {
      throw new BadRequestException({ code: 'FUTURE_DATE', message: 'Fecha no puede ser futura' });
    }
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    if (date.getTime() < monthStart.getTime()) {
      throw new BadRequestException({
        code: 'DATE_BEFORE_MONTH_START',
        message: 'Fecha debe ser dentro del mes actual',
      });
    }
  }

  private toResponse(m: {
    id: string; correlativo: number; movementType: string; movementDate: Date;
    qtyIn: { toString(): string }; qtyOut: { toString(): string };
    unitCost: { toString(): string }; totalCost: { toString(): string };
    balanceQty: { toString(): string }; balanceAvgCost: { toString(): string }; balanceValue: { toString(): string };
    journalEntryId: string | null; notes: string | null;
  }) {
    return {
      id: m.id,
      correlativo: m.correlativo,
      movementType: m.movementType,
      movementDate: m.movementDate.toISOString(),
      qtyIn: Number(m.qtyIn.toString()),
      qtyOut: Number(m.qtyOut.toString()),
      unitCost: Number(m.unitCost.toString()),
      totalCost: Number(m.totalCost.toString()),
      balanceQty: Number(m.balanceQty.toString()),
      balanceAvgCost: Number(m.balanceAvgCost.toString()),
      balanceValue: Number(m.balanceValue.toString()),
      journalEntryId: m.journalEntryId,
      notes: m.notes,
    };
  }
}
```

- [ ] **Step 4: Run spec → verify GREEN**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts 2>&1 | tail -6
```
Expected: all salida tests pass (~10 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/inventory-adjustments/
git commit -m "feat(inventory-adjustments): add createAdjustment service with salida subtypes"
```

---

### Task 6: Service — entrada logic (AJUSTE_SOBRANTE) + weighted average

**Files:**
- Modify: `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts` — append describe block.
- No changes to service code (already implemented in Task 5) — Task 6 verifies the entrada path.

- [ ] **Step 1: Append spec cases**

Append to `inventory-adjustment.service.spec.ts` before the final `});` of the top-level describe:

```typescript
  describe('createAdjustment — entrada (AJUSTE_SOBRANTE)', () => {
    const baseEntradaInput = {
      catalogItemId: 'c1',
      subtype: 'AJUSTE_SOBRANTE' as const,
      quantity: 5,
      unitCost: 4,
      movementDate: new Date().toISOString().slice(0, 10),
    };

    it('maps subtype AJUSTE_SOBRANTE to movementType ENTRADA_AJUSTE', async () => {
      mockItem();
      prisma.inventoryState.findFirst.mockResolvedValue(null);
      mockCorrelativo();
      mockMovementCreated({ movementType: 'ENTRADA_AJUSTE', qtyIn: { toString: () => '5' }, qtyOut: { toString: () => '0' } });
      prisma.inventoryState.create.mockResolvedValue({});
      await service.createAdjustment(tenantId, userId, baseEntradaInput);
      const call = prisma.inventoryMovement.create.mock.calls[0][0];
      expect(call.data.movementType).toBe('ENTRADA_AJUSTE');
      expect(Number(call.data.qtyIn)).toBe(5);
      expect(Number(call.data.qtyOut)).toBe(0);
    });

    it('throws MISSING_UNIT_COST when AJUSTE_SOBRANTE without unitCost', async () => {
      mockItem();
      prisma.inventoryState.findFirst.mockResolvedValue(null);
      const { unitCost: _uc, ...noCost } = baseEntradaInput;
      await expect(
        service.createAdjustment(tenantId, userId, noCost as typeof baseEntradaInput),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'MISSING_UNIT_COST' }),
      });
    });

    it('creates InventoryState when no state exists', async () => {
      mockItem();
      prisma.inventoryState.findFirst.mockResolvedValue(null);
      mockCorrelativo();
      mockMovementCreated();
      prisma.inventoryState.create.mockResolvedValue({});
      await service.createAdjustment(tenantId, userId, baseEntradaInput);
      expect(prisma.inventoryState.create).toHaveBeenCalled();
      const call = prisma.inventoryState.create.mock.calls[0][0];
      expect(Number(call.data.currentQty)).toBe(5);
      expect(Number(call.data.currentAvgCost)).toBe(4);
      expect(Number(call.data.totalValue)).toBe(20);
    });

    it('computes weighted average when state exists', async () => {
      // Existing: 10 units @ $5 (value 50). Adding: 5 units @ $4 (value 20).
      // Expected: 15 units, avg = 70/15 = 4.6666..., value = 70.
      mockItem();
      mockState(10, 5);
      mockCorrelativo();
      mockMovementCreated();
      prisma.inventoryState.update.mockResolvedValue({});
      await service.createAdjustment(tenantId, userId, baseEntradaInput);
      const call = prisma.inventoryState.update.mock.calls[0][0];
      expect(Number(call.data.currentQty)).toBe(15);
      expect(Number(call.data.currentAvgCost)).toBeCloseTo(4.6666, 3);
      expect(Number(call.data.totalValue)).toBeCloseTo(70, 2);
    });
  });
```

- [ ] **Step 2: Run spec → verify GREEN**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts 2>&1 | tail -6
```
Expected: all tests pass (salida + entrada = ~14 tests).

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts
git commit -m "test(inventory-adjustments): cover entrada (AJUSTE_SOBRANTE) + weighted avg"
```

---

### Task 7: Service — accounting integration (feature-gated, graceful failure)

**Files:**
- Modify: `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.ts` — extend `createAdjustment` to post journal entry after movement creation.
- Modify: `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts` — append describe block.

- [ ] **Step 1: Append spec cases (TDD red)**

Append to the spec file (before final `});` of the top-level describe):

```typescript
  describe('createAdjustment — accounting integration', () => {
    const input = {
      catalogItemId: 'c1',
      subtype: 'MERMA' as const,
      quantity: 2,
      movementDate: new Date().toISOString().slice(0, 10),
    };

    it('skips accounting when feature accounting is OFF', async () => {
      mockItem(); mockState(); mockCorrelativo(); mockMovementCreated();
      prisma.inventoryState.update.mockResolvedValue({});
      prisma.tenant.findUnique.mockResolvedValue({ planCode: 'FREE' });
      planFeatures.checkFeatureAccess.mockResolvedValue(false);

      const result = await service.createAdjustment(tenantId, userId, input);
      expect(result.journalEntryId).toBeNull();
      expect(accounting.createAndPostJournalEntry).not.toHaveBeenCalled();
    });

    it('calls AccountingService with the correct operation when feature ON', async () => {
      mockItem(); mockState(10, 5); mockCorrelativo(); mockMovementCreated({ movementType: 'SALIDA_MERMA' });
      prisma.inventoryState.update.mockResolvedValue({});
      prisma.tenant.findUnique.mockResolvedValue({ planCode: 'PRO' });
      planFeatures.checkFeatureAccess.mockResolvedValue(true);
      accounting.createAndPostJournalEntry.mockResolvedValue({ id: 'je1' });

      const result = await service.createAdjustment(tenantId, userId, input);
      expect(accounting.createAndPostJournalEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          userId,
          operation: 'AJUSTE_MERMA',
          total: 10, // 2 * 5
        }),
      );
      expect(result.journalEntryId).toBe('je1');
    });

    it('gracefully handles accounting failure (account missing) — movement saved, journalEntryId null', async () => {
      mockItem(); mockState(); mockCorrelativo(); mockMovementCreated();
      prisma.inventoryState.update.mockResolvedValue({});
      prisma.tenant.findUnique.mockResolvedValue({ planCode: 'PRO' });
      planFeatures.checkFeatureAccess.mockResolvedValue(true);
      accounting.createAndPostJournalEntry.mockRejectedValue(new Error('Account 5105 not found'));

      const result = await service.createAdjustment(tenantId, userId, input);
      expect(result.journalEntryId).toBeNull();
    });
  });
```

- [ ] **Step 2: Run spec → verify RED**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts 2>&1 | tail -6
```
Expected: 3 new tests FAIL (createAndPostJournalEntry mock not wired).

- [ ] **Step 3: Extend service with accounting call**

IMPORTANT: Before implementing, look at `apps/api/src/modules/dte/services/dte-cogs.service.ts` or `apps/api/src/modules/purchases/services/purchase-reception.service.ts` to see how these services invoke `AccountingService` for posting an inventory-related entry. The actual method name on `AccountingService` might be `createAndPostJournalEntry`, `postEntry`, or similar — use whatever signature exists. If the real API differs from the mock, update the spec's mock shape to match.

Modify the `createAdjustment` method in `inventory-adjustment.service.ts`. After the `$transaction` completes successfully (outside the transaction block), add:

```typescript
    const created = await this.prisma.$transaction(async (tx) => {
      // ... existing transaction body ...
      return this.toResponse(movement);
    });

    // 8. Post journal entry if accounting feature ON
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { planCode: true } });
    if (tenant) {
      const hasAccounting = await this.planFeatures.checkFeatureAccess(tenant.planCode, 'accounting');
      if (hasAccounting) {
        try {
          const entry = await this.accounting.createAndPostJournalEntry({
            tenantId,
            userId,
            operation: SUBTYPE_TO_OPERATION[dto.subtype],
            total: created.totalCost,
            date: new Date(dto.movementDate),
            description: `Ajuste ${dto.subtype} — ${item.code ?? item.id}`,
            referenceId: created.id,
            referenceType: 'InventoryMovement',
          });
          // Update movement with journalEntryId (outside transaction — best-effort)
          await this.prisma.inventoryMovement.update({
            where: { id: created.id },
            data: { journalEntryId: entry.id },
          });
          created.journalEntryId = entry.id;
        } catch (err) {
          this.logger.warn(
            `Movement ${created.id} saved but journal entry failed: ${(err as Error).message}. ` +
            `Tenant likely missing account from mapping for ${SUBTYPE_TO_OPERATION[dto.subtype]}.`,
          );
          // Keep journalEntryId = null, don't rollback movement
        }
      }
    }

    return created;
```

If the real `AccountingService` method takes a different shape, adapt the call site AND the spec mocks accordingly. Keep the try/catch + warn pattern.

- [ ] **Step 4: Run spec → verify GREEN**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts 2>&1 | tail -6
```
Expected: all tests pass (~17 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/inventory-adjustments/services/
git commit -m "feat(inventory-adjustments): post journal entry when accounting feature ON"
```

---

### Task 8: Service — `listAdjustments`

**Files:**
- Modify: `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.ts` — add `listAdjustments` method.
- Modify: `apps/api/src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts` — append describe block.

- [ ] **Step 1: Append spec cases**

```typescript
  describe('listAdjustments', () => {
    it('filters by sourceType=MANUAL_ADJUSTMENT and tenantId', async () => {
      prisma.inventoryMovement.findMany.mockResolvedValue([]);
      prisma.inventoryMovement.count.mockResolvedValue(0);
      await service.listAdjustments(tenantId, {});
      const call = prisma.inventoryMovement.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe(tenantId);
      expect(call.where.sourceType).toBe('MANUAL_ADJUSTMENT');
    });

    it('applies catalogItemId filter', async () => {
      prisma.inventoryMovement.findMany.mockResolvedValue([]);
      prisma.inventoryMovement.count.mockResolvedValue(0);
      await service.listAdjustments(tenantId, { catalogItemId: 'c1' });
      const call = prisma.inventoryMovement.findMany.mock.calls[0][0];
      expect(call.where.catalogItemId).toBe('c1');
    });

    it('applies date range filter', async () => {
      prisma.inventoryMovement.findMany.mockResolvedValue([]);
      prisma.inventoryMovement.count.mockResolvedValue(0);
      await service.listAdjustments(tenantId, { startDate: '2026-04-01', endDate: '2026-04-30' });
      const call = prisma.inventoryMovement.findMany.mock.calls[0][0];
      expect(call.where.movementDate.gte).toEqual(new Date('2026-04-01'));
      expect(call.where.movementDate.lte).toEqual(new Date('2026-04-30T23:59:59.999Z'));
    });

    it('returns paginated shape', async () => {
      prisma.inventoryMovement.findMany.mockResolvedValue([]);
      prisma.inventoryMovement.count.mockResolvedValue(5);
      const r = await service.listAdjustments(tenantId, { page: 1, limit: 10 });
      expect(r).toEqual({ data: [], total: 5, totalPages: 1, page: 1, limit: 10 });
    });
  });
```

- [ ] **Step 2: Verify RED**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts 2>&1 | tail -6
```
Expected: 4 new tests FAIL (method missing).

- [ ] **Step 3: Implement `listAdjustments`**

Append to `inventory-adjustment.service.ts` class body:

```typescript
  async listAdjustments(tenantId: string, filters: import('../dto/list-adjustments.dto').ListAdjustmentsDto) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

    const where: Prisma.InventoryMovementWhereInput = {
      tenantId,
      sourceType: 'MANUAL_ADJUSTMENT',
    };
    if (filters.catalogItemId) where.catalogItemId = filters.catalogItemId;
    if (filters.subtype) {
      where.movementType = SUBTYPE_TO_MOVEMENT_TYPE[filters.subtype];
    }
    if (filters.startDate || filters.endDate) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (filters.startDate) dateFilter.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setUTCHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      where.movementDate = dateFilter;
    }

    const [rows, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        orderBy: [{ movementDate: 'desc' }, { correlativo: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.toResponse(r)),
      total,
      totalPages: Math.ceil(total / limit) || 1,
      page,
      limit,
    };
  }
```

- [ ] **Step 4: Verify GREEN**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory-adjustments/services/inventory-adjustment.service.spec.ts 2>&1 | tail -6
```
Expected: all tests pass (~21 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/inventory-adjustments/services/
git commit -m "feat(inventory-adjustments): add listAdjustments with filters + pagination"
```

---

### Task 9: Controller + module + AppModule registration

**Files:**
- Create: `apps/api/src/modules/inventory-adjustments/inventory-adjustments.controller.ts`
- Create: `apps/api/src/modules/inventory-adjustments/inventory-adjustments.controller.spec.ts`
- Create: `apps/api/src/modules/inventory-adjustments/inventory-adjustments.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write controller spec (TDD red)**

File: `apps/api/src/modules/inventory-adjustments/inventory-adjustments.controller.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { InventoryAdjustmentsController } from './inventory-adjustments.controller';
import { InventoryAdjustmentService } from './services/inventory-adjustment.service';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { ListAdjustmentsDto } from './dto/list-adjustments.dto';
import { PlanFeatureGuard } from '../plans/guards/plan-feature.guard';

describe('InventoryAdjustmentsController', () => {
  let controller: InventoryAdjustmentsController;
  let service: { createAdjustment: jest.Mock; listAdjustments: jest.Mock };

  beforeEach(async () => {
    service = { createAdjustment: jest.fn(), listAdjustments: jest.fn() };
    const module = await Test.createTestingModule({
      controllers: [InventoryAdjustmentsController],
      providers: [{ provide: InventoryAdjustmentService, useValue: service }],
    })
      .overrideGuard(PlanFeatureGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get(InventoryAdjustmentsController);
  });

  const user = (tenantId: string | null = 't1'): CurrentUserData => ({
    id: 'u1',
    email: 'u1@t.com',
    tenantId,
    rol: 'GERENTE',
  });

  it('POST calls service with tenantId + userId + dto', async () => {
    service.createAdjustment.mockResolvedValue({ id: 'm1' });
    const dto: CreateAdjustmentDto = {
      catalogItemId: 'c1',
      subtype: 'MERMA',
      quantity: 1,
      movementDate: '2026-04-19',
    };
    await controller.create(user(), dto);
    expect(service.createAdjustment).toHaveBeenCalledWith('t1', 'u1', dto);
  });

  it('POST throws ForbiddenException when no tenant', async () => {
    const dto: CreateAdjustmentDto = {
      catalogItemId: 'c1', subtype: 'MERMA', quantity: 1, movementDate: '2026-04-19',
    };
    await expect(controller.create(user(null), dto)).rejects.toThrow(ForbiddenException);
  });

  it('GET calls service with tenantId + filters', async () => {
    service.listAdjustments.mockResolvedValue({ data: [], total: 0, totalPages: 1, page: 1, limit: 20 });
    const filters: ListAdjustmentsDto = { catalogItemId: 'c1' };
    await controller.list(user(), filters);
    expect(service.listAdjustments).toHaveBeenCalledWith('t1', filters);
  });

  it('GET throws ForbiddenException when no tenant', async () => {
    const filters: ListAdjustmentsDto = {};
    await expect(controller.list(user(null), filters)).rejects.toThrow(ForbiddenException);
  });
});
```

- [ ] **Step 2: Verify RED**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory-adjustments/inventory-adjustments.controller.spec.ts 2>&1 | tail -6
```
Expected: module not found.

- [ ] **Step 3: Implement controller**

File: `apps/api/src/modules/inventory-adjustments/inventory-adjustments.controller.ts`

```typescript
import { Body, Controller, ForbiddenException, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PlanFeatureGuard } from '../plans/guards/plan-feature.guard';
import { RequireFeature } from '../plans/decorators/require-feature.decorator';
import { InventoryAdjustmentService } from './services/inventory-adjustment.service';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { ListAdjustmentsDto } from './dto/list-adjustments.dto';

@ApiTags('inventory-adjustments')
@Controller('inventory/adjustments')
@ApiBearerAuth()
@UseGuards(PlanFeatureGuard)
@RequireFeature('inventory_reports')
export class InventoryAdjustmentsController {
  constructor(private readonly service: InventoryAdjustmentService) {}

  @Post()
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Crear ajuste manual de inventario' })
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateAdjustmentDto) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.createAdjustment(user.tenantId, user.id, dto);
  }

  @Get()
  @RequirePermission('catalog:read')
  @ApiOperation({ summary: 'Listar ajustes manuales' })
  list(@CurrentUser() user: CurrentUserData, @Query() filters: ListAdjustmentsDto) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.listAdjustments(user.tenantId, filters);
  }
}
```

- [ ] **Step 4: Create module**

File: `apps/api/src/modules/inventory-adjustments/inventory-adjustments.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlansModule } from '../plans/plans.module';
import { AccountingModule } from '../accounting/accounting.module';
import { InventoryAdjustmentsController } from './inventory-adjustments.controller';
import { InventoryAdjustmentService } from './services/inventory-adjustment.service';

@Module({
  imports: [PrismaModule, PlansModule, AccountingModule],
  controllers: [InventoryAdjustmentsController],
  providers: [InventoryAdjustmentService],
  exports: [InventoryAdjustmentService],
})
export class InventoryAdjustmentsModule {}
```

If `AccountingModule` is not exported / not available for import, check the real export path and adjust. If `AccountingService` is provided via another mechanism, follow that pattern instead.

- [ ] **Step 5: Register in `AppModule`**

Modify `apps/api/src/app.module.ts`:

1. Add import near other module imports (alphabetical):
   ```typescript
   import { InventoryAdjustmentsModule } from './modules/inventory-adjustments/inventory-adjustments.module';
   ```
2. Add `InventoryAdjustmentsModule,` to the `imports: [...]` array (near `InventoryModule`).

Verify:
```bash
grep -n "InventoryAdjustmentsModule" apps/api/src/app.module.ts
```
Expected: 2 matches.

- [ ] **Step 6: Run all inventory-adjustments specs + tsc**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory-adjustments/ 2>&1 | tail -6
npx tsc --noEmit 2>&1 | grep "inventory-adjustments" | head -5
```
Expected: all pass, no tsc errors in module.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/inventory-adjustments/ apps/api/src/app.module.ts
git commit -m "feat(inventory-adjustments): add controller + module + register"
```

---

### Task 10: Seed script — `inventory:adjust` perm + cuentas 5104–5107

**Files:**
- Create: `apps/api/scripts/seed-inventory-adjust-perm.ts`

- [ ] **Step 1: Look at an existing seed script for pattern**

```bash
ls apps/api/scripts/ | grep -i seed
```

Pick one (e.g., `seed-default-categories.ts` or `seed-accounts.ts`) and mirror its structure: Prisma client init, for-each tenant, idempotent upserts, dry-run support via `--dry-run` flag if that pattern exists.

- [ ] **Step 2: Create `seed-inventory-adjust-perm.ts`**

File: `apps/api/scripts/seed-inventory-adjust-perm.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACCOUNTS_TO_SEED = [
  { code: '5104', name: 'Pérdida por robo', type: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5105', name: 'Merma inventario', type: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5106', name: 'Donaciones', type: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5107', name: 'Gasto autoconsumo', type: 'EXPENSE', normalBalance: 'DEBIT' },
] as const;

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`Running ${dryRun ? '(DRY RUN)' : ''} seed-inventory-adjust-perm`);

  const tenants = await prisma.tenant.findMany({ select: { id: true, nombre: true } });
  console.log(`Found ${tenants.length} tenants`);

  for (const tenant of tenants) {
    console.log(`\n[${tenant.id}] ${tenant.nombre}`);

    // Seed the 4 accounts (idempotent — only create if not exists for this tenant)
    for (const acct of ACCOUNTS_TO_SEED) {
      const existing = await prisma.accountingAccount.findFirst({
        where: { tenantId: tenant.id, code: acct.code },
      });
      if (existing) {
        console.log(`  ✓ ${acct.code} already exists`);
      } else if (!dryRun) {
        await prisma.accountingAccount.create({
          data: {
            tenantId: tenant.id,
            code: acct.code,
            name: acct.name,
            type: acct.type,
            normalBalance: acct.normalBalance,
            isActive: true,
            currentBalance: 0,
          },
        });
        console.log(`  + created ${acct.code} ${acct.name}`);
      } else {
        console.log(`  [dry] would create ${acct.code} ${acct.name}`);
      }
    }
  }

  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

**NOTE:** The RBAC `inventory:adjust` permission was already added to `LEGACY_ROLE_PERMISSIONS` in Task 3 — that's a static definition in code that applies to all tenants automatically (no DB migration needed because permissions are computed from role at request time). So this seed only covers the accounting catalog side. If your RBAC has a DB-backed permission table (not just the legacy in-memory map), extend this script accordingly by checking for `rolePermission` or similar tables.

If the `AccountingAccount` model has additional required fields beyond what's shown above, inspect the schema and fill them in. If `type` is an enum, use the correct enum values.

- [ ] **Step 3: Verify script compiles**

```bash
cd apps/api && npx tsc --noEmit scripts/seed-inventory-adjust-perm.ts 2>&1 | head -10
```
Expected: no errors.

- [ ] **Step 4: Commit (do NOT run the seed yet — it runs post-deploy)**

```bash
git add apps/api/scripts/seed-inventory-adjust-perm.ts
git commit -m "chore(seed): add seed for inventory adjustment accounts (5104-5107)"
```

---

### Task 11: Frontend — types + `CreateAdjustmentModal` component

**Files:**
- Modify: `apps/web/src/types/inventory.ts` — append types.
- Create: `apps/web/src/components/inventory/create-adjustment-modal.tsx`

- [ ] **Step 1: Add types**

Append to `apps/web/src/types/inventory.ts`:

```typescript
export const ADJUSTMENT_SUBTYPES = [
  'ROBO', 'MERMA', 'DONACION', 'AUTOCONSUMO', 'AJUSTE_FALTANTE', 'AJUSTE_SOBRANTE',
] as const;
export type AdjustmentSubtype = (typeof ADJUSTMENT_SUBTYPES)[number];

export const ADJUSTMENT_SUBTYPE_LABELS: Record<AdjustmentSubtype, string> = {
  ROBO: 'Robo',
  MERMA: 'Merma',
  DONACION: 'Donación',
  AUTOCONSUMO: 'Autoconsumo',
  AJUSTE_FALTANTE: 'Ajuste faltante',
  AJUSTE_SOBRANTE: 'Ajuste sobrante',
};

export interface CreateAdjustmentInput {
  catalogItemId: string;
  subtype: AdjustmentSubtype;
  quantity: number;
  unitCost?: number;
  movementDate: string;
  notes?: string;
}

export interface InventoryAdjustment {
  id: string;
  correlativo: number;
  movementType: string;
  movementDate: string;
  qtyIn: number; qtyOut: number;
  unitCost: number; totalCost: number;
  balanceQty: number; balanceAvgCost: number; balanceValue: number;
  journalEntryId: string | null;
  notes: string | null;
}
```

- [ ] **Step 2: Create `CreateAdjustmentModal`**

File: `apps/web/src/components/inventory/create-adjustment-modal.tsx`

```tsx
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { apiFetch } from '@/lib/api';
import {
  ADJUSTMENT_SUBTYPES,
  ADJUSTMENT_SUBTYPE_LABELS,
  type AdjustmentSubtype,
  type CreateAdjustmentInput,
  type InventoryAdjustment,
  type InventoryItemDetail,
} from '@/types/inventory';

interface Props {
  open: boolean;
  onClose: () => void;
  catalogItemId?: string;
  onSuccess: () => void;
}

function firstDayOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CreateAdjustmentModal({ open, onClose, catalogItemId, onSuccess }: Props) {
  const toast = useToast();
  const [selectedItemId, setSelectedItemId] = React.useState<string | undefined>(catalogItemId);
  const [itemDetail, setItemDetail] = React.useState<InventoryItemDetail | null>(null);
  const [subtype, setSubtype] = React.useState<AdjustmentSubtype>('MERMA');
  const [quantity, setQuantity] = React.useState<string>('');
  const [unitCost, setUnitCost] = React.useState<string>('');
  const [movementDate, setMovementDate] = React.useState(today());
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const isEntrada = subtype === 'AJUSTE_SOBRANTE';

  // Reset when modal opens
  React.useEffect(() => {
    if (open) {
      setSelectedItemId(catalogItemId);
      setItemDetail(null);
      setSubtype('MERMA');
      setQuantity('');
      setUnitCost('');
      setMovementDate(today());
      setNotes('');
    }
  }, [open, catalogItemId]);

  // Fetch item detail when ID selected
  React.useEffect(() => {
    if (!selectedItemId) {
      setItemDetail(null);
      return;
    }
    (async () => {
      try {
        const result = await apiFetch<InventoryItemDetail>(`/inventory/${selectedItemId}`);
        setItemDetail(result);
        if (!isEntrada) setUnitCost(result.currentAvgCost.toFixed(4));
      } catch {
        setItemDetail(null);
      }
    })();
  }, [selectedItemId, isEntrada]);

  // Update unitCost displayed when subtype changes
  React.useEffect(() => {
    if (!isEntrada && itemDetail) {
      setUnitCost(itemDetail.currentAvgCost.toFixed(4));
    } else if (isEntrada) {
      setUnitCost('');
    }
  }, [subtype, itemDetail, isEntrada]);

  const totalCost = React.useMemo(() => {
    const q = parseFloat(quantity) || 0;
    const c = parseFloat(unitCost) || 0;
    return q * c;
  }, [quantity, unitCost]);

  const canSubmit = Boolean(
    selectedItemId &&
    quantity && parseFloat(quantity) > 0 &&
    (!isEntrada || (unitCost && parseFloat(unitCost) > 0)) &&
    movementDate &&
    !submitting,
  );

  const handleSubmit = async () => {
    if (!selectedItemId) return;
    setSubmitting(true);
    try {
      const payload: CreateAdjustmentInput = {
        catalogItemId: selectedItemId,
        subtype,
        quantity: parseFloat(quantity),
        movementDate,
        notes: notes || undefined,
      };
      if (isEntrada) payload.unitCost = parseFloat(unitCost);

      await apiFetch<InventoryAdjustment>('/inventory/adjustments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success('Ajuste registrado');
      onSuccess();
      onClose();
    } catch (e) {
      const err = e as { status?: number; data?: { code?: string; message?: string; available?: number } };
      if (err.data?.code === 'INSUFFICIENT_STOCK') {
        toast.error(`Stock insuficiente. Máximo: ${err.data.available ?? 0}`);
      } else if (err.data?.code === 'NOT_TRACKED') {
        toast.error('El ítem no tiene inventario activado');
      } else if (err.data?.code === 'FUTURE_DATE' || err.data?.code === 'DATE_BEFORE_MONTH_START') {
        toast.error('Fecha inválida');
      } else {
        toast.error('Error creando ajuste');
      }
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo ajuste de inventario</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {itemDetail && (
            <div className="rounded-md border p-3 text-sm">
              <p className="font-mono text-xs text-gray-500">{itemDetail.code}</p>
              <p className="font-medium">{itemDetail.description ?? '—'}</p>
              <p className="text-xs text-gray-600 mt-1">
                Stock: <strong>{itemDetail.currentQty.toFixed(4)}</strong> ·
                Costo prom.: <strong>${itemDetail.currentAvgCost.toFixed(4)}</strong>
              </p>
            </div>
          )}

          <div>
            <Label>Tipo de ajuste</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {ADJUSTMENT_SUBTYPES.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="subtype"
                    value={s}
                    checked={subtype === s}
                    onChange={() => setSubtype(s)}
                  />
                  {ADJUSTMENT_SUBTYPE_LABELS[s]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              id="quantity"
              type="number"
              step="0.0001"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.0000"
            />
          </div>

          <div>
            <Label htmlFor="unitCost">Costo unitario</Label>
            <Input
              id="unitCost"
              type="number"
              step="0.0001"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              disabled={!isEntrada}
              placeholder={isEntrada ? 'Ingresá el costo' : 'Costo promedio actual'}
            />
            {!isEntrada && (
              <p className="text-xs text-gray-500 mt-1">Salidas usan el costo promedio actual</p>
            )}
          </div>

          <div>
            <Label htmlFor="movementDate">Fecha</Label>
            <Input
              id="movementDate"
              type="date"
              min={firstDayOfMonth()}
              max={today()}
              value={movementDate}
              onChange={(e) => setMovementDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Nota (opcional)</Label>
            <Textarea
              id="notes"
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {quantity && unitCost && parseFloat(quantity) > 0 && (
            <div className="rounded-md bg-gray-50 p-3 text-xs">
              <p className="text-gray-600">
                Costo total: <strong>${totalCost.toFixed(2)}</strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Guardando…' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**IMPORTANT:** This component assumes `catalogItemId` is always provided (no combobox picker for cross-item selection). For the plain `/inventario` list page, the trigger button prompts the user to first select an item from the list (or we scope B.2 to "adjustment from detail only" for this release). If this is a blocker, see Task 12 — the list page triggers modal only when a row is already present.

If a `<Dialog>` / `<Textarea>` / `<Label>` component doesn't exist under `@/components/ui/`, check the actual available UI primitives and adapt. Many shadcn-style setups have these under `@/components/ui/dialog.tsx`.

- [ ] **Step 3: Typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -E "create-adjustment-modal|types/inventory" | head -5
```
Expected: empty.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/types/inventory.ts apps/web/src/components/inventory/create-adjustment-modal.tsx
git commit -m "feat(web): add CreateAdjustmentModal component + types"
```

---

### Task 12: Integrate modal into `/inventario` list + detail pages

**Files:**
- Modify: `apps/web/src/app/(dashboard)/inventario/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/inventario/[catalogItemId]/page.tsx`

**Scope decision:** Since `CreateAdjustmentModal` as implemented requires `catalogItemId`, the list page's `+ Nuevo ajuste` button opens a smaller "pick an item first" UX: a prompt to search an item using the existing search input, then click a row to open the modal pre-filled. For simplicity, we skip the list-page trigger in this release and only add the detail-page trigger. The combobox picker is deferred to a follow-up (can ship before B.3).

- [ ] **Step 1: Add "Ajuste" button to detail page**

Modify `apps/web/src/app/(dashboard)/inventario/[catalogItemId]/page.tsx`:

1. Add import:
   ```tsx
   import { CreateAdjustmentModal } from '@/components/inventory/create-adjustment-modal';
   ```
2. Add state inside the component:
   ```tsx
   const [adjustmentModalOpen, setAdjustmentModalOpen] = React.useState(false);
   ```
3. Find the `<StockStatusBadge status={item.status} />` in the header and add a `+ Ajuste` button next to it (inside the same flex container). Only show when `item` exists:
   ```tsx
   <div className="flex items-center gap-2">
     <Button size="sm" variant="outline" onClick={() => setAdjustmentModalOpen(true)}>
       <Plus className="h-4 w-4 mr-1" /> Ajuste
     </Button>
     <StockStatusBadge status={item.status} />
   </div>
   ```
4. Add import for `Plus` from `lucide-react` (may already be in the file).
5. Before the closing `</div>` of the outer container, render:
   ```tsx
   {item && (
     <CreateAdjustmentModal
       open={adjustmentModalOpen}
       onClose={() => setAdjustmentModalOpen(false)}
       catalogItemId={catalogItemId}
       onSuccess={() => {
         fetchItem();
         fetchKardex();
       }}
     />
   )}
   ```

- [ ] **Step 2: Optionally add a "+ Nuevo ajuste" button to list page (simple version)**

Modify `apps/web/src/app/(dashboard)/inventario/page.tsx`:

Add a hint row above the table: if no row is selected, the existing flow is that clicking a row navigates to `/inventario/[id]` where the ajuste button lives. Simplest: skip the list-page trigger. Add a comment documenting the decision.

```tsx
{/* Adjustment creation is surfaced on the detail page (/inventario/[id]). Item picker from list deferred. */}
```

- [ ] **Step 3: Typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -E "inventario" | head -10
```
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(dashboard)/inventario/page.tsx" "apps/web/src/app/(dashboard)/inventario/[catalogItemId]/page.tsx"
git commit -m "feat(web): wire CreateAdjustmentModal from inventory detail page"
```

---

### Task 13: E2E stub + regression + evidence + push + PR

**Files:**
- Modify: `apps/web/tests/e2e/inventory.spec.ts` — append test.skip for adjustment creation.
- Create: `outputs/EXECUTION_EVIDENCE_PHASE_2_5.md`

- [ ] **Step 1: Append E2E stub**

Append to `apps/web/tests/e2e/inventory.spec.ts` (before the final `});` of the top-level `test.describe`):

```typescript
  test.skip('crear ajuste MERMA desde /inventario/[id]', async () => {
    // TODO: unblock when staging env ready
  });
```

- [ ] **Step 2: Regression sweep**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/inventory-adjustments/apps/api
npx jest --config jest.config.ts src/modules/ 2>&1 | grep -E "(Tests:|Test Suites:)"
```

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/inventory-adjustments/apps/api
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/inventory-adjustments/apps/web
npx tsc --noEmit 2>&1 | grep -v sync-engine | grep -c "error TS"
```

Record numbers. Compare to Task 1 baseline. Expected: +~25 tests (service 21 + controller 4), 0 new tsc errors.

- [ ] **Step 3: Write evidence doc**

File: `outputs/EXECUTION_EVIDENCE_PHASE_2_5.md`

```markdown
# Execution Evidence — Fase 2.5 Inventory Adjustments (B.2)

**Date:** <TODAY>
**Branch:** `feature/inventory-adjustments`
**Spec:** `docs/superpowers/specs/2026-04-19-fase-2-5-inventory-adjustments-design.md`
**Plan:** `docs/superpowers/plans/2026-04-19-fase-2-5-inventory-adjustments.md`

## Built

### Backend
- `InventoryAdjustmentService` con `createAdjustment` (6 subtipos, tx Prisma, valida stock + fecha + trackInventory) y `listAdjustments` (paginado + filtros).
- `InventoryAdjustmentsController` con `POST /inventory/adjustments` + `GET /inventory/adjustments`.
- `InventoryAdjustmentsModule` registrado en `AppModule`.
- DTOs `CreateAdjustmentDto` + `ListAdjustmentsDto`.
- Permiso `inventory:adjust` agregado a GERENTE + CONTADOR.
- 4 mappings contables nuevos: AJUSTE_ROBO, AJUSTE_MERMA, AJUSTE_DONACION, AJUSTE_AUTOCONSUMO.
- Reusos: AJUSTE_FISICO_FALTANTE + AJUSTE_FISICO_SOBRANTE.
- Seed script `apps/api/scripts/seed-inventory-adjust-perm.ts` para cuentas 5104-5107 en tenants existentes.

### Frontend
- Tipos + `CreateAdjustmentModal` reusable.
- Trigger en `/inventario/[catalogItemId]` con pre-fill del ítem.
- List-page trigger diferido a follow-up (requiere item-picker).

## Tests

| Métrica | Baseline | Final | Delta |
|---------|----------|-------|-------|
| Jest suites pass | <FILL> | <FILL> | +2 (service + controller) |
| Jest tests pass | <FILL> | <FILL> | +~25 |
| API tsc errors | <FILL> | <FILL> | 0 nuevos |
| Web tsc errors | <FILL> | <FILL> | 0 nuevos |

## Post-deploy runbook

1. Merge → CI deploy staging.
2. Correr seed script UNA VEZ por ambiente:
   ```bash
   cd apps/api && npx ts-node scripts/seed-inventory-adjust-perm.ts
   ```
   (primero con `--dry-run` para ver qué cambiaría).
3. Login con rol GERENTE → `/inventario/[id]` → botón `+ Ajuste` visible.
4. Registrar MERMA 1 unidad → verificar kardex refleja movimiento + stock bajó.
5. Con tenant con `accounting` ON → verificar asiento creado en `/contabilidad`.
6. Probar INSUFFICIENT_STOCK.
7. Smoke en prod post-merge + re-correr seed en prod.

## Rollback

`git revert <merge-sha>`. Zero schema changes. Los movimientos creados (`sourceType='MANUAL_ADJUSTMENT'`) quedan en DB sin UI. Cuentas 5104-5107 quedan en el catálogo contable (inocuas). Permiso queda asignado pero sin endpoints que lo requieran.

## Commits

<INSERT git log --oneline origin/main..HEAD OUTPUT>
```

Replace `<TODAY>`, `<FILL>`, `<INSERT...>` placeholders with actuals.

- [ ] **Step 4: Commit evidence + e2e stub**

```bash
git add apps/web/tests/e2e/inventory.spec.ts outputs/EXECUTION_EVIDENCE_PHASE_2_5.md
git commit -m "docs: execution evidence for Fase 2.5 Inventory Adjustments (B.2)"
```

- [ ] **Step 5: Push + open PR**

```bash
git push -u origin feature/inventory-adjustments
gh pr create --title "feat(inventory): Fase 2.5 — Manual inventory adjustments (B.2)" --body "$(cat <<'EOF'
## Summary

Sub-proyecto B.2: ajustes manuales de inventario con 6 subtipos (ROBO, MERMA, DONACION, AUTOCONSUMO, AJUSTE_FALTANTE, AJUSTE_SOBRANTE). Zero schema changes.

## Backend

- `InventoryAdjustmentService` + controller con POST + GET.
- 4 mappings contables nuevos + 2 reusos.
- Permiso \`inventory:adjust\` en GERENTE + CONTADOR.
- Integración AccountingService feature-gated (graceful si cuenta faltante).
- Seed script para cuentas 5104-5107 por tenant.

## Frontend

- \`CreateAdjustmentModal\` reusable.
- Trigger en \`/inventario/[id]\`.
- List-page trigger diferido (requiere item-picker).

## Post-deploy

Correr \`seed-inventory-adjust-perm.ts\` una vez por ambiente tras merge.

## Test plan

- [x] Backend jest: +~25 tests, sin regresiones.
- [x] TypeScript: 0 errores nuevos.
- [x] E2E stub skip.
- [ ] Manual QA staging.

Detalles en \`outputs/EXECUTION_EVIDENCE_PHASE_2_5.md\`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Capture PR URL.

- [ ] **Step 6: Report** — PR URL + commit count + regression verdict.

---

## Self-Review

### Spec coverage

| Spec section | Task |
|--------------|------|
| §2 Architecture (module + modal) | Tasks 4-9 (backend), 11-12 (frontend) |
| §3 Movement types + accounting mappings | Task 2 (mappings), Task 5 (SUBTYPE_TO_MOVEMENT_TYPE), Task 7 (SUBTYPE_TO_OPERATION) |
| §4 POST endpoint + validations | Tasks 4 (DTO), 5 (validations + salida), 6 (entrada), 7 (accounting), 9 (controller) |
| §4 GET endpoint | Task 8 (service), Task 9 (controller) |
| §5 UI modal | Tasks 11 (component), 12 (integration) |
| §6 RBAC `inventory:adjust` | Task 3 |
| §7 Error handling | Task 5 (INSUFFICIENT_STOCK, NOT_TRACKED, FUTURE_DATE, DATE_BEFORE_MONTH_START), Task 6 (MISSING_UNIT_COST), Task 7 (accounting graceful failure) |
| §8 Testing | Tasks 5-8 (service specs), Task 9 (controller spec), Task 13 (E2E stub + regression) |
| §9 Post-deploy runbook | Task 10 (seed script), Task 13 (evidence) |

### Placeholder scan

No "TBD", "TODO" fills except in the evidence template `<TODAY>` / `<FILL>` which are explicitly marked as placeholders to be filled at execution time.

### Type consistency

- `AdjustmentSubtype` defined in `create-adjustment.dto.ts` Task 4, reused in `list-adjustments.dto.ts` Task 4 via import, in service Tasks 5-7 via `SUBTYPE_TO_*` maps, in frontend types Task 11, in modal Task 11.
- `CreateAdjustmentDto` / `ListAdjustmentsDto` shapes consistent between DTO files (Task 4) and controller (Task 9).
- Error code strings (`INSUFFICIENT_STOCK`, `NOT_TRACKED`, `FUTURE_DATE`, `DATE_BEFORE_MONTH_START`, `MISSING_UNIT_COST`, `ITEM_NOT_FOUND`) match between service throws (Tasks 5-7) and frontend error handler (Task 11).
