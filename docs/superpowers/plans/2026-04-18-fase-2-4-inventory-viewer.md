# Fase 2.4 — Inventory Viewer + Alerts Implementation Plan (B.1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir UI read-only de inventario (stock list + kardex viewer + alertas bajo mínimo) sobre los modelos `InventoryState` / `InventoryMovement` ya existentes. Backend nuevo módulo `inventory` con service + export + controller. Frontend nuevas páginas `/inventario` y `/inventario/[id]` + widget dashboard + badge sidebar.

**Architecture:** Módulo `inventory` separado de `catalog-items` y `reports`. Services read-only que reusan Prisma + modelos existentes. Zero schema changes, zero RBAC changes, zero new deps. Reusa perms `catalog:read` + `report:export` y feature flag `inventory_reports`.

**Tech Stack:** NestJS 10 + Prisma 5.10 + exceljs (ya en deps) + Jest + manual Prisma mock pattern. Next.js 15 App Router + Tailwind + shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-04-18-fase-2-4-inventory-viewer-design.md`
**Depende de:** Fases 1.2–1.6, 2.1–2.3 merged a main ✅

---

## File structure

**Create (backend):**
- `apps/api/src/modules/inventory/inventory.module.ts`
- `apps/api/src/modules/inventory/inventory.controller.ts`
- `apps/api/src/modules/inventory/inventory.controller.spec.ts`
- `apps/api/src/modules/inventory/services/inventory.service.ts`
- `apps/api/src/modules/inventory/services/inventory.service.spec.ts`
- `apps/api/src/modules/inventory/services/inventory-export.service.ts`
- `apps/api/src/modules/inventory/services/inventory-export.service.spec.ts`
- `apps/api/src/modules/inventory/dto/inventory-filter.dto.ts`
- `apps/api/src/modules/inventory/dto/kardex-filter.dto.ts`

**Create (frontend):**
- `apps/web/src/types/inventory.ts`
- `apps/web/src/app/(dashboard)/inventario/page.tsx`
- `apps/web/src/app/(dashboard)/inventario/[catalogItemId]/page.tsx`
- `apps/web/src/components/inventory/stock-status-badge.tsx`
- `apps/web/src/components/inventory/kardex-table.tsx`
- `apps/web/src/components/inventory/low-stock-alert-card.tsx`
- `apps/web/tests/e2e/inventory.spec.ts`

**Create (docs):**
- `outputs/EXECUTION_EVIDENCE_PHASE_2_4.md`

**Modify:**
- `apps/api/src/app.module.ts` — register `InventoryModule`.
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` — insert `<LowStockAlertCard />`.
- `apps/web/src/components/layout/sidebar.tsx` — add "Inventario" nav item with badge.

No schema changes. No new migrations. No new dependencies.

---

### Task 1: Branch + baseline + worktree

**Files:** none (setup only).

- [ ] **Step 1: Create worktree + branch**

```bash
cd /home/jose/facturador-electronico-sv
git fetch origin main
git worktree add .worktrees/inventory-viewer -b feature/inventory-viewer origin/main
cd .worktrees/inventory-viewer
git branch --show-current
```
Expected: `feature/inventory-viewer`.

- [ ] **Step 2: Verify prereqs**

```bash
grep -q "model InventoryState" apps/api/prisma/schema.prisma && echo "InventoryState schema OK" || echo "MISSING"
grep -q "model InventoryMovement" apps/api/prisma/schema.prisma && echo "InventoryMovement schema OK" || echo "MISSING"
grep -q "inventory_reports" apps/api/src/common/plan-features.ts && echo "inventory_reports flag OK" || echo "MISSING"
test -f apps/api/src/modules/rbac/decorators/require-permission.decorator.ts && echo "RequirePermission OK" || echo "MISSING"
test -f apps/api/src/modules/plans/decorators/require-feature.decorator.ts && echo "RequireFeature OK" || echo "MISSING"
```
Expected: 5 OK. Else → BLOCKED.

- [ ] **Step 3: Baseline test count**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/ 2>&1 | grep -E "(Tests:|Test Suites:)" | head -2
```
Record baseline (expected: ~2 suites failing pre-existentes — `clientes.controller.spec`, `dte.service.spec` — ver evidence Fase 2.3).

- [ ] **Step 4: No commit** — pure setup.

---

### Task 2: Backend — DTOs + `InventoryService` (findAll / findOne / getKardex)

**Files:**
- Create: `apps/api/src/modules/inventory/dto/inventory-filter.dto.ts`
- Create: `apps/api/src/modules/inventory/dto/kardex-filter.dto.ts`
- Create: `apps/api/src/modules/inventory/services/inventory.service.ts`
- Create: `apps/api/src/modules/inventory/services/inventory.service.spec.ts`

- [ ] **Step 1: Create `InventoryFilterDto`**

File: `apps/api/src/modules/inventory/dto/inventory-filter.dto.ts`

```typescript
import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class InventoryFilterDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  categoryId?: string;

  @IsOptional() @IsIn(['OK', 'BELOW_REORDER', 'OUT_OF_STOCK'])
  status?: 'OK' | 'BELOW_REORDER' | 'OUT_OF_STOCK';

  @IsOptional() @IsIn(['code', 'description', 'currentQty', 'totalValue', 'lastMovementAt'])
  sortBy?: string;

  @IsOptional() @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;
}
```

- [ ] **Step 2: Create `KardexFilterDto`**

File: `apps/api/src/modules/inventory/dto/kardex-filter.dto.ts`

```typescript
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class KardexFilterDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional() @IsString()
  movementType?: string;
}
```

- [ ] **Step 3: Write spec file (TDD red) for `InventoryService.findAll / findOne / getKardex`**

File: `apps/api/src/modules/inventory/services/inventory.service.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: {
    inventoryState: { findMany: jest.Mock; findFirst: jest.Mock; count: jest.Mock };
    inventoryMovement: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      inventoryState: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
      },
      inventoryMovement: {
        findMany: jest.fn(),
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(InventoryService);
  });

  describe('findAll', () => {
    it('returns paginated list with default page=1 limit=20', async () => {
      prisma.inventoryState.findMany.mockResolvedValue([
        {
          id: 's1',
          catalogItemId: 'c1',
          currentQty: { toString: () => '10.0000' },
          currentAvgCost: { toString: () => '5.0000' },
          totalValue: { toString: () => '50.00' },
          reorderLevel: null,
          lastMovementAt: new Date('2026-01-15'),
          catalogItem: {
            code: 'P-001',
            description: 'Prod 1',
            type: 'BIEN',
            categoryId: null,
            category: null,
          },
        },
      ]);
      prisma.inventoryState.count.mockResolvedValue(1);
      const r = await service.findAll('t1', {});
      expect(r.total).toBe(1);
      expect(r.page).toBe(1);
      expect(r.limit).toBe(20);
      expect(r.data[0].code).toBe('P-001');
      expect(r.data[0].status).toBe('OK');
    });

    it('filters CatalogItem.type = BIEN in where clause', async () => {
      prisma.inventoryState.findMany.mockResolvedValue([]);
      prisma.inventoryState.count.mockResolvedValue(0);
      await service.findAll('t1', {});
      expect(prisma.inventoryState.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 't1',
            catalogItem: expect.objectContaining({ type: 'BIEN' }),
          }),
        }),
      );
    });

    it('applies search filter on code OR description', async () => {
      prisma.inventoryState.findMany.mockResolvedValue([]);
      prisma.inventoryState.count.mockResolvedValue(0);
      await service.findAll('t1', { search: 'abc' });
      const call = prisma.inventoryState.findMany.mock.calls[0][0];
      expect(call.where.catalogItem.OR).toEqual([
        { code: { contains: 'abc' } },
        { description: { contains: 'abc' } },
      ]);
    });

    it('applies categoryId filter', async () => {
      prisma.inventoryState.findMany.mockResolvedValue([]);
      prisma.inventoryState.count.mockResolvedValue(0);
      await service.findAll('t1', { categoryId: 'cat-1' });
      const call = prisma.inventoryState.findMany.mock.calls[0][0];
      expect(call.where.catalogItem.categoryId).toBe('cat-1');
    });

    it('computes status OUT_OF_STOCK when currentQty <= 0', async () => {
      prisma.inventoryState.findMany.mockResolvedValue([
        {
          id: 's1', catalogItemId: 'c1',
          currentQty: { toString: () => '0.0000' },
          currentAvgCost: { toString: () => '0.0000' },
          totalValue: { toString: () => '0.00' },
          reorderLevel: { toString: () => '5.0000' },
          lastMovementAt: null,
          catalogItem: { code: 'P', description: 'D', type: 'BIEN', categoryId: null, category: null },
        },
      ]);
      prisma.inventoryState.count.mockResolvedValue(1);
      const r = await service.findAll('t1', {});
      expect(r.data[0].status).toBe('OUT_OF_STOCK');
    });

    it('computes status BELOW_REORDER when currentQty <= reorderLevel and > 0', async () => {
      prisma.inventoryState.findMany.mockResolvedValue([
        {
          id: 's1', catalogItemId: 'c1',
          currentQty: { toString: () => '3.0000' },
          currentAvgCost: { toString: () => '1.0000' },
          totalValue: { toString: () => '3.00' },
          reorderLevel: { toString: () => '5.0000' },
          lastMovementAt: null,
          catalogItem: { code: 'P', description: 'D', type: 'BIEN', categoryId: null, category: null },
        },
      ]);
      prisma.inventoryState.count.mockResolvedValue(1);
      const r = await service.findAll('t1', {});
      expect(r.data[0].status).toBe('BELOW_REORDER');
    });

    it('status OK when reorderLevel null and stock positive', async () => {
      prisma.inventoryState.findMany.mockResolvedValue([
        {
          id: 's1', catalogItemId: 'c1',
          currentQty: { toString: () => '5.0000' },
          currentAvgCost: { toString: () => '1.0000' },
          totalValue: { toString: () => '5.00' },
          reorderLevel: null,
          lastMovementAt: null,
          catalogItem: { code: 'P', description: 'D', type: 'BIEN', categoryId: null, category: null },
        },
      ]);
      prisma.inventoryState.count.mockResolvedValue(1);
      const r = await service.findAll('t1', {});
      expect(r.data[0].status).toBe('OK');
    });

    it('filters by status=OUT_OF_STOCK post-query', async () => {
      prisma.inventoryState.findMany.mockResolvedValue([
        { id: 's1', catalogItemId: 'c1',
          currentQty: { toString: () => '10.0' }, currentAvgCost: { toString: () => '1.0' },
          totalValue: { toString: () => '10.00' }, reorderLevel: null, lastMovementAt: null,
          catalogItem: { code: 'A', description: 'A', type: 'BIEN', categoryId: null, category: null }
        },
        { id: 's2', catalogItemId: 'c2',
          currentQty: { toString: () => '0.0' }, currentAvgCost: { toString: () => '1.0' },
          totalValue: { toString: () => '0.00' }, reorderLevel: null, lastMovementAt: null,
          catalogItem: { code: 'B', description: 'B', type: 'BIEN', categoryId: null, category: null }
        },
      ]);
      prisma.inventoryState.count.mockResolvedValue(2);
      const r = await service.findAll('t1', { status: 'OUT_OF_STOCK' });
      expect(r.data).toHaveLength(1);
      expect(r.data[0].code).toBe('B');
    });
  });

  describe('findOne', () => {
    it('returns detail for existing state', async () => {
      prisma.inventoryState.findFirst.mockResolvedValue({
        id: 's1', catalogItemId: 'c1',
        currentQty: { toString: () => '10.0' }, currentAvgCost: { toString: () => '5.0' },
        totalValue: { toString: () => '50.00' }, reorderLevel: null, lastMovementAt: null,
        catalogItem: { code: 'P', description: 'D', type: 'BIEN', categoryId: null, category: null }
      });
      const r = await service.findOne('t1', 'c1');
      expect(r.catalogItemId).toBe('c1');
      expect(r.code).toBe('P');
    });

    it('throws NotFoundException when no state exists', async () => {
      prisma.inventoryState.findFirst.mockResolvedValue(null);
      await expect(service.findOne('t1', 'c1')).rejects.toThrow(NotFoundException);
    });

    it('scopes to tenantId in query', async () => {
      prisma.inventoryState.findFirst.mockResolvedValue(null);
      await expect(service.findOne('t1', 'c1')).rejects.toThrow();
      expect(prisma.inventoryState.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 't1', catalogItemId: 'c1' }),
        }),
      );
    });
  });

  describe('getKardex', () => {
    it('returns movements ordered by date+correlativo', async () => {
      prisma.inventoryMovement.findMany.mockResolvedValue([
        {
          id: 'm1', movementDate: new Date('2026-01-10'), correlativo: 1,
          movementType: 'ENTRADA_COMPRA',
          qtyIn: { toString: () => '10.0' }, qtyOut: { toString: () => '0.0' },
          unitCost: { toString: () => '5.0' }, totalCost: { toString: () => '50.00' },
          balanceQty: { toString: () => '10.0' }, balanceAvgCost: { toString: () => '5.0' },
          balanceValue: { toString: () => '50.00' },
          documentType: 'CCFE', documentNumber: 'X-1', notes: null,
        },
      ]);
      const r = await service.getKardex('t1', 'c1', '2026-01-01', '2026-01-31');
      expect(r).toHaveLength(1);
      expect(r[0].movementType).toBe('ENTRADA_COMPRA');
      expect(prisma.inventoryMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 't1',
            catalogItemId: 'c1',
            movementDate: { gte: new Date('2026-01-01'), lte: new Date('2026-01-31T23:59:59.999Z') },
          }),
          orderBy: [{ movementDate: 'asc' }, { correlativo: 'asc' }],
        }),
      );
    });

    it('throws BadRequestException when endDate < startDate', async () => {
      await expect(service.getKardex('t1', 'c1', '2026-02-01', '2026-01-31')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when range exceeds 12 months', async () => {
      await expect(service.getKardex('t1', 'c1', '2025-01-01', '2026-06-01')).rejects.toThrow(BadRequestException);
    });

    it('applies movementType filter when provided', async () => {
      prisma.inventoryMovement.findMany.mockResolvedValue([]);
      await service.getKardex('t1', 'c1', '2026-01-01', '2026-01-31', 'SALIDA_VENTA');
      const call = prisma.inventoryMovement.findMany.mock.calls[0][0];
      expect(call.where.movementType).toBe('SALIDA_VENTA');
    });
  });
});
```

- [ ] **Step 4: Run spec to verify it fails**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory/services/inventory.service.spec.ts 2>&1 | tail -8
```
Expected: FAIL `Cannot find module './inventory.service'`.

- [ ] **Step 5: Create `InventoryService` implementation**

File: `apps/api/src/modules/inventory/services/inventory.service.ts`

```typescript
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { InventoryFilterDto } from '../dto/inventory-filter.dto';

export type StockStatus = 'OK' | 'BELOW_REORDER' | 'OUT_OF_STOCK';

export interface InventoryItem {
  catalogItemId: string;
  code: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  currentQty: number;
  currentAvgCost: number;
  totalValue: number;
  reorderLevel: number | null;
  lastMovementAt: string | null;
  status: StockStatus;
}

export interface KardexRow {
  id: string;
  movementDate: string;
  correlativo: number;
  movementType: string;
  qtyIn: number;
  qtyOut: number;
  unitCost: number;
  totalCost: number;
  balanceQty: number;
  balanceAvgCost: number;
  balanceValue: number;
  documentType: string | null;
  documentNumber: string | null;
  notes: string | null;
}

export interface InventoryAlerts {
  belowReorderCount: number;
  outOfStockCount: number;
}

export interface TopBelowReorderItem {
  catalogItemId: string;
  code: string;
  description: string;
  currentQty: number;
  reorderLevel: number | null;
  status: StockStatus;
}

const MAX_RANGE_MS = 366 * 24 * 60 * 60 * 1000; // 12 months (leap-safe)

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, filters: InventoryFilterDto) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

    const catalogItemWhere: Prisma.CatalogItemWhereInput = { type: 'BIEN' };
    if (filters.categoryId) catalogItemWhere.categoryId = filters.categoryId;
    if (filters.search) {
      catalogItemWhere.OR = [
        { code: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    const where: Prisma.InventoryStateWhereInput = {
      tenantId,
      catalogItem: catalogItemWhere,
    };

    const orderBy = this.buildOrderBy(filters.sortBy, filters.sortOrder);

    const [states, total] = await Promise.all([
      this.prisma.inventoryState.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          catalogItem: {
            select: { code: true, description: true, type: true, categoryId: true, category: { select: { name: true } } },
          },
        },
      }),
      this.prisma.inventoryState.count({ where }),
    ]);

    let data: InventoryItem[] = states.map((s) => this.toItem(s));

    if (filters.status) {
      data = data.filter((d) => d.status === filters.status);
    }

    return {
      data,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      page,
      limit,
    };
  }

  async findOne(tenantId: string, catalogItemId: string): Promise<InventoryItem> {
    const state = await this.prisma.inventoryState.findFirst({
      where: { tenantId, catalogItemId, catalogItem: { type: 'BIEN' } },
      include: {
        catalogItem: {
          select: { code: true, description: true, type: true, categoryId: true, category: { select: { name: true } } },
        },
      },
    });
    if (!state) {
      throw new NotFoundException({
        message: 'Este ítem aún no tiene movimientos de inventario',
        code: 'NO_INVENTORY_STATE',
      });
    }
    return this.toItem(state);
  }

  async getKardex(
    tenantId: string,
    catalogItemId: string,
    startDate: string,
    endDate: string,
    movementType?: string,
  ): Promise<KardexRow[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    if (end.getTime() < start.getTime()) {
      throw new BadRequestException('endDate debe ser posterior a startDate');
    }
    if (end.getTime() - start.getTime() > MAX_RANGE_MS) {
      throw new BadRequestException('Rango máximo 12 meses');
    }

    const where: Prisma.InventoryMovementWhereInput = {
      tenantId,
      catalogItemId,
      movementDate: { gte: start, lte: end },
    };
    if (movementType) where.movementType = movementType;

    const rows = await this.prisma.inventoryMovement.findMany({
      where,
      orderBy: [{ movementDate: 'asc' }, { correlativo: 'asc' }],
    });

    return rows.map((r) => ({
      id: r.id,
      movementDate: r.movementDate.toISOString(),
      correlativo: r.correlativo,
      movementType: r.movementType,
      qtyIn: Number(r.qtyIn.toString()),
      qtyOut: Number(r.qtyOut.toString()),
      unitCost: Number(r.unitCost.toString()),
      totalCost: Number(r.totalCost.toString()),
      balanceQty: Number(r.balanceQty.toString()),
      balanceAvgCost: Number(r.balanceAvgCost.toString()),
      balanceValue: Number(r.balanceValue.toString()),
      documentType: r.documentType,
      documentNumber: r.documentNumber,
      notes: r.notes,
    }));
  }

  private buildOrderBy(sortBy?: string, sortOrder?: 'asc' | 'desc'): Prisma.InventoryStateOrderByWithRelationInput {
    const order = sortOrder ?? 'asc';
    switch (sortBy) {
      case 'code':
        return { catalogItem: { code: order } };
      case 'description':
        return { catalogItem: { description: order } };
      case 'currentQty':
        return { currentQty: order };
      case 'totalValue':
        return { totalValue: order };
      case 'lastMovementAt':
        return { lastMovementAt: order };
      default:
        return { catalogItem: { code: 'asc' } };
    }
  }

  private toItem(state: {
    catalogItemId: string;
    currentQty: { toString(): string };
    currentAvgCost: { toString(): string };
    totalValue: { toString(): string };
    reorderLevel: { toString(): string } | null;
    lastMovementAt: Date | null;
    catalogItem: { code: string; description: string; categoryId: string | null; category: { name: string } | null };
  }): InventoryItem {
    const currentQty = Number(state.currentQty.toString());
    const reorderLevel = state.reorderLevel ? Number(state.reorderLevel.toString()) : null;
    let status: StockStatus = 'OK';
    if (currentQty <= 0) status = 'OUT_OF_STOCK';
    else if (reorderLevel !== null && currentQty <= reorderLevel) status = 'BELOW_REORDER';

    return {
      catalogItemId: state.catalogItemId,
      code: state.catalogItem.code,
      description: state.catalogItem.description,
      categoryId: state.catalogItem.categoryId,
      categoryName: state.catalogItem.category?.name ?? null,
      currentQty,
      currentAvgCost: Number(state.currentAvgCost.toString()),
      totalValue: Number(state.totalValue.toString()),
      reorderLevel,
      lastMovementAt: state.lastMovementAt ? state.lastMovementAt.toISOString() : null,
      status,
    };
  }
}
```

- [ ] **Step 6: Run spec to verify it passes**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory/services/inventory.service.spec.ts 2>&1 | tail -6
```
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/inventory/
git commit -m "feat(inventory): add InventoryService with findAll/findOne/getKardex"
```

---

### Task 3: Backend — `InventoryService.getAlerts` + `getTopBelowReorder`

**Files:**
- Modify: `apps/api/src/modules/inventory/services/inventory.service.ts` — append 2 methods.
- Modify: `apps/api/src/modules/inventory/services/inventory.service.spec.ts` — append 2 describe blocks.

- [ ] **Step 1: Append spec cases (TDD red)**

Append to `apps/api/src/modules/inventory/services/inventory.service.spec.ts` (before the final `});` that closes the top-level `describe('InventoryService', ...)`):

```typescript
  describe('getAlerts', () => {
    it('returns below-reorder and out-of-stock counts', async () => {
      prisma.inventoryState.count
        .mockResolvedValueOnce(3) // below
        .mockResolvedValueOnce(2); // out
      const r = await service.getAlerts('t1');
      expect(r).toEqual({ belowReorderCount: 3, outOfStockCount: 2 });
    });

    it('below-reorder excludes out-of-stock items', async () => {
      prisma.inventoryState.count.mockResolvedValue(0);
      await service.getAlerts('t1');
      const belowCall = prisma.inventoryState.count.mock.calls[0][0];
      expect(belowCall.where.currentQty.gt).toBe(0);
      expect(belowCall.where.reorderLevel.not).toBeNull();
    });
  });

  describe('getTopBelowReorder', () => {
    it('returns top N items sorted by deficit desc', async () => {
      prisma.inventoryState.findMany.mockResolvedValue([
        {
          catalogItemId: 'c1',
          currentQty: { toString: () => '0.0' },
          reorderLevel: { toString: () => '5.0' },
          catalogItem: { code: 'A', description: 'A', type: 'BIEN' },
        },
        {
          catalogItemId: 'c2',
          currentQty: { toString: () => '3.0' },
          reorderLevel: { toString: () => '10.0' },
          catalogItem: { code: 'B', description: 'B', type: 'BIEN' },
        },
      ]);
      const r = await service.getTopBelowReorder('t1', 5);
      expect(r).toHaveLength(2);
      expect(r[0].catalogItemId).toBe('c1');
      expect(r[0].status).toBe('OUT_OF_STOCK');
      expect(r[1].status).toBe('BELOW_REORDER');
    });

    it('respects limit default 5', async () => {
      prisma.inventoryState.findMany.mockResolvedValue([]);
      await service.getTopBelowReorder('t1');
      expect(prisma.inventoryState.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });
```

- [ ] **Step 2: Run spec to verify failure**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory/services/inventory.service.spec.ts 2>&1 | tail -6
```
Expected: FAIL `service.getAlerts is not a function` (or similar).

- [ ] **Step 3: Implement `getAlerts` + `getTopBelowReorder`**

Append to `apps/api/src/modules/inventory/services/inventory.service.ts` (before the closing `}` of the class):

```typescript
  async getAlerts(tenantId: string): Promise<InventoryAlerts> {
    const [belowReorderCount, outOfStockCount] = await Promise.all([
      this.prisma.inventoryState.count({
        where: {
          tenantId,
          catalogItem: { type: 'BIEN' },
          reorderLevel: { not: null },
          currentQty: { gt: 0, lte: this.prisma.inventoryState.fields?.reorderLevel ?? undefined },
        } as Prisma.InventoryStateWhereInput,
      }),
      this.prisma.inventoryState.count({
        where: {
          tenantId,
          catalogItem: { type: 'BIEN' },
          currentQty: { lte: 0 },
        },
      }),
    ]);
    return { belowReorderCount, outOfStockCount };
  }

  async getTopBelowReorder(tenantId: string, limit: number = 5): Promise<TopBelowReorderItem[]> {
    const states = await this.prisma.inventoryState.findMany({
      where: {
        tenantId,
        catalogItem: { type: 'BIEN' },
        OR: [
          { currentQty: { lte: 0 } },
          { AND: [{ reorderLevel: { not: null } }, { currentQty: { gt: 0 } }] },
        ],
      },
      include: {
        catalogItem: { select: { code: true, description: true, type: true } },
      },
      take: Math.min(50, Math.max(1, limit)),
    });

    const items: TopBelowReorderItem[] = states
      .map((s) => {
        const currentQty = Number(s.currentQty.toString());
        const reorderLevel = s.reorderLevel ? Number(s.reorderLevel.toString()) : null;
        let status: StockStatus = 'OK';
        if (currentQty <= 0) status = 'OUT_OF_STOCK';
        else if (reorderLevel !== null && currentQty <= reorderLevel) status = 'BELOW_REORDER';
        return {
          catalogItemId: s.catalogItemId,
          code: s.catalogItem.code,
          description: s.catalogItem.description,
          currentQty,
          reorderLevel,
          status,
          deficit: reorderLevel !== null ? reorderLevel - currentQty : Infinity,
        };
      })
      .filter((i) => i.status !== 'OK')
      .sort((a, b) => b.deficit - a.deficit)
      .slice(0, Math.min(50, Math.max(1, limit)))
      .map(({ deficit: _, ...rest }) => rest);

    return items;
  }
```

**NOTE on `getAlerts` below-reorder query:** SQL Server via Prisma doesn't support column-vs-column comparison in `where`. Use raw query fallback:

Replace the `getAlerts` method above with this version (more portable):

```typescript
  async getAlerts(tenantId: string): Promise<InventoryAlerts> {
    const [below, out] = await Promise.all([
      this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) AS count
        FROM inventory_states s
        INNER JOIN catalog_items c ON c.id = s.catalogItemId
        WHERE s.tenantId = ${tenantId}
          AND c.type = 'BIEN'
          AND s.reorderLevel IS NOT NULL
          AND s.currentQty > 0
          AND s.currentQty <= s.reorderLevel
      `,
      this.prisma.inventoryState.count({
        where: {
          tenantId,
          catalogItem: { type: 'BIEN' },
          currentQty: { lte: 0 },
        },
      }),
    ]);
    return {
      belowReorderCount: Number(below[0]?.count ?? 0),
      outOfStockCount: out,
    };
  }
```

Update the test `describe('getAlerts', ...)` accordingly — the mock must cover `$queryRaw`:

```typescript
  describe('getAlerts', () => {
    it('returns below-reorder and out-of-stock counts', async () => {
      (prisma as any).$queryRaw = jest.fn().mockResolvedValue([{ count: BigInt(3) }]);
      prisma.inventoryState.count.mockResolvedValue(2);
      const r = await service.getAlerts('t1');
      expect(r).toEqual({ belowReorderCount: 3, outOfStockCount: 2 });
    });

    it('out-of-stock query uses currentQty lte 0', async () => {
      (prisma as any).$queryRaw = jest.fn().mockResolvedValue([{ count: BigInt(0) }]);
      prisma.inventoryState.count.mockResolvedValue(0);
      await service.getAlerts('t1');
      const call = prisma.inventoryState.count.mock.calls[0][0];
      expect(call.where.currentQty.lte).toBe(0);
    });
  });
```

- [ ] **Step 4: Run spec to verify it passes**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory/services/inventory.service.spec.ts 2>&1 | tail -6
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/inventory/
git commit -m "feat(inventory): add getAlerts + getTopBelowReorder to InventoryService"
```

---

### Task 4: Backend — `InventoryExportService` (XLSX)

**Files:**
- Create: `apps/api/src/modules/inventory/services/inventory-export.service.ts`
- Create: `apps/api/src/modules/inventory/services/inventory-export.service.spec.ts`

- [ ] **Step 1: Write spec file (TDD red)**

File: `apps/api/src/modules/inventory/services/inventory-export.service.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { InventoryExportService } from './inventory-export.service';
import { InventoryService } from './inventory.service';
import * as ExcelJS from 'exceljs';

describe('InventoryExportService', () => {
  let service: InventoryExportService;
  let inventoryService: { findAll: jest.Mock };

  beforeEach(async () => {
    inventoryService = { findAll: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        InventoryExportService,
        { provide: InventoryService, useValue: inventoryService },
      ],
    }).compile();
    service = module.get(InventoryExportService);
  });

  it('generates XLSX buffer with 9 header columns', async () => {
    inventoryService.findAll.mockResolvedValue({
      data: [
        {
          catalogItemId: 'c1',
          code: 'P-001',
          description: 'Producto 1',
          categoryId: null,
          categoryName: null,
          currentQty: 10,
          currentAvgCost: 5,
          totalValue: 50,
          reorderLevel: 2,
          lastMovementAt: '2026-01-15T10:00:00.000Z',
          status: 'OK',
        },
      ],
      total: 1, totalPages: 1, page: 1, limit: 10000,
    });

    const buf = await service.exportStockList('t1', {});
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const sheet = wb.worksheets[0];
    const headerRow = sheet.getRow(1);
    expect(headerRow.getCell(1).value).toBe('Código');
    expect(headerRow.getCell(2).value).toBe('Descripción');
    expect(headerRow.getCell(3).value).toBe('Categoría');
    expect(headerRow.getCell(4).value).toBe('Stock actual');
    expect(headerRow.getCell(5).value).toBe('Costo promedio');
    expect(headerRow.getCell(6).value).toBe('Valor total');
    expect(headerRow.getCell(7).value).toBe('Reorder level');
    expect(headerRow.getCell(8).value).toBe('Último movimiento');
    expect(headerRow.getCell(9).value).toBe('Estado');
    expect(sheet.getRow(2).getCell(1).value).toBe('P-001');
    expect(sheet.getRow(2).getCell(9).value).toBe('OK');
  });

  it('generates XLSX with headers only when no data', async () => {
    inventoryService.findAll.mockResolvedValue({
      data: [], total: 0, totalPages: 1, page: 1, limit: 10000,
    });
    const buf = await service.exportStockList('t1', {});
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const sheet = wb.worksheets[0];
    expect(sheet.rowCount).toBe(1); // headers only
  });

  it('calls InventoryService.findAll with limit 10000 cap', async () => {
    inventoryService.findAll.mockResolvedValue({
      data: [], total: 0, totalPages: 1, page: 1, limit: 10000,
    });
    await service.exportStockList('t1', { search: 'x' });
    expect(inventoryService.findAll).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ search: 'x', limit: 10000, page: 1 }),
    );
  });

  it('maps status to Spanish label in output', async () => {
    inventoryService.findAll.mockResolvedValue({
      data: [
        { catalogItemId: 'c1', code: 'A', description: 'A', categoryId: null, categoryName: null,
          currentQty: 0, currentAvgCost: 0, totalValue: 0, reorderLevel: 5, lastMovementAt: null, status: 'OUT_OF_STOCK' },
        { catalogItemId: 'c2', code: 'B', description: 'B', categoryId: null, categoryName: null,
          currentQty: 2, currentAvgCost: 1, totalValue: 2, reorderLevel: 5, lastMovementAt: null, status: 'BELOW_REORDER' },
      ],
      total: 2, totalPages: 1, page: 1, limit: 10000,
    });
    const buf = await service.exportStockList('t1', {});
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const sheet = wb.worksheets[0];
    expect(sheet.getRow(2).getCell(9).value).toBe('Sin stock');
    expect(sheet.getRow(3).getCell(9).value).toBe('Bajo mínimo');
  });
});
```

- [ ] **Step 2: Run spec to verify it fails**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory/services/inventory-export.service.spec.ts 2>&1 | tail -6
```
Expected: FAIL `Cannot find module './inventory-export.service'`.

- [ ] **Step 3: Implement `InventoryExportService`**

File: `apps/api/src/modules/inventory/services/inventory-export.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { InventoryService, StockStatus } from './inventory.service';
import { InventoryFilterDto } from '../dto/inventory-filter.dto';

const STATUS_LABELS: Record<StockStatus, string> = {
  OK: 'OK',
  BELOW_REORDER: 'Bajo mínimo',
  OUT_OF_STOCK: 'Sin stock',
};

@Injectable()
export class InventoryExportService {
  private readonly logger = new Logger(InventoryExportService.name);

  constructor(private readonly inventoryService: InventoryService) {}

  async exportStockList(tenantId: string, filters: InventoryFilterDto): Promise<Buffer> {
    const { page: _p, limit: _l, ...rest } = filters;
    const result = await this.inventoryService.findAll(tenantId, {
      ...rest,
      page: 1,
      limit: 10000,
    });

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Inventario');

    sheet.addRow([
      'Código',
      'Descripción',
      'Categoría',
      'Stock actual',
      'Costo promedio',
      'Valor total',
      'Reorder level',
      'Último movimiento',
      'Estado',
    ]);
    sheet.getRow(1).font = { bold: true };

    for (const it of result.data) {
      sheet.addRow([
        it.code,
        it.description,
        it.categoryName ?? '',
        it.currentQty,
        it.currentAvgCost,
        it.totalValue,
        it.reorderLevel ?? '',
        it.lastMovementAt ? new Date(it.lastMovementAt) : '',
        STATUS_LABELS[it.status],
      ]);
    }

    sheet.columns.forEach((col) => { col.width = 18; });
    sheet.getColumn(4).numFmt = '#,##0.0000';
    sheet.getColumn(5).numFmt = '#,##0.0000';
    sheet.getColumn(6).numFmt = '#,##0.00';
    sheet.getColumn(7).numFmt = '#,##0.0000';
    sheet.getColumn(8).numFmt = 'yyyy-mm-dd hh:mm';

    const arr = await wb.xlsx.writeBuffer();
    return Buffer.from(arr as ArrayBuffer);
  }
}
```

- [ ] **Step 4: Run spec to verify it passes**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory/services/inventory-export.service.spec.ts 2>&1 | tail -6
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/inventory/
git commit -m "feat(inventory): add InventoryExportService (XLSX, 9 columns)"
```

---

### Task 5: Backend — `InventoryController` + module registration

**Files:**
- Create: `apps/api/src/modules/inventory/inventory.controller.ts`
- Create: `apps/api/src/modules/inventory/inventory.controller.spec.ts`
- Create: `apps/api/src/modules/inventory/inventory.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write controller spec (TDD red)**

File: `apps/api/src/modules/inventory/inventory.controller.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './services/inventory.service';
import { InventoryExportService } from './services/inventory-export.service';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: { findAll: jest.Mock; findOne: jest.Mock; getKardex: jest.Mock; getAlerts: jest.Mock; getTopBelowReorder: jest.Mock };
  let exporter: { exportStockList: jest.Mock };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      getKardex: jest.fn(),
      getAlerts: jest.fn(),
      getTopBelowReorder: jest.fn(),
    };
    exporter = { exportStockList: jest.fn() };
    const module = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        { provide: InventoryService, useValue: service },
        { provide: InventoryExportService, useValue: exporter },
      ],
    }).compile();
    controller = module.get(InventoryController);
  });

  const user = (tenantId: string | null = 't1') => ({ id: 'u1', tenantId, roles: [], permissions: [] }) as any;

  it('findAll calls service with tenantId + filters', async () => {
    service.findAll.mockResolvedValue({ data: [], total: 0, totalPages: 1, page: 1, limit: 20 });
    await controller.findAll(user(), { search: 'x' } as any);
    expect(service.findAll).toHaveBeenCalledWith('t1', { search: 'x' });
  });

  it('findAll throws ForbiddenException when no tenant', async () => {
    await expect(controller.findAll(user(null), {} as any)).rejects.toThrow(ForbiddenException);
  });

  it('findOne calls service with tenantId + id', async () => {
    service.findOne.mockResolvedValue({ catalogItemId: 'c1' });
    await controller.findOne(user(), 'c1');
    expect(service.findOne).toHaveBeenCalledWith('t1', 'c1');
  });

  it('getKardex calls service with date range + optional movementType', async () => {
    service.getKardex.mockResolvedValue([]);
    await controller.getKardex(user(), 'c1', {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      movementType: 'ENTRADA_COMPRA',
    } as any);
    expect(service.getKardex).toHaveBeenCalledWith('t1', 'c1', '2026-01-01', '2026-01-31', 'ENTRADA_COMPRA');
  });

  it('getAlerts calls service with tenantId', async () => {
    service.getAlerts.mockResolvedValue({ belowReorderCount: 0, outOfStockCount: 0 });
    await controller.getAlerts(user());
    expect(service.getAlerts).toHaveBeenCalledWith('t1');
  });

  it('getTopBelowReorder defaults limit to 5', async () => {
    service.getTopBelowReorder.mockResolvedValue([]);
    await controller.getTopBelowReorder(user(), undefined);
    expect(service.getTopBelowReorder).toHaveBeenCalledWith('t1', 5);
  });

  it('export calls exporter and writes XLSX headers', async () => {
    exporter.exportStockList.mockResolvedValue(Buffer.from('xlsx'));
    const res: any = { setHeader: jest.fn(), send: jest.fn() };
    await controller.exportStockList(user(), {} as any, res);
    expect(exporter.exportStockList).toHaveBeenCalledWith('t1', {});
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(res.send).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run spec to verify it fails**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory/inventory.controller.spec.ts 2>&1 | tail -6
```
Expected: FAIL `Cannot find module './inventory.controller'`.

- [ ] **Step 3: Implement `InventoryController`**

File: `apps/api/src/modules/inventory/inventory.controller.ts`

```typescript
import { Controller, Get, Param, Query, Res, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { InventoryService } from './services/inventory.service';
import { InventoryExportService } from './services/inventory-export.service';
import { InventoryFilterDto } from './dto/inventory-filter.dto';
import { KardexFilterDto } from './dto/kardex-filter.dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { RequireFeature } from '../plans/decorators/require-feature.decorator';

@ApiTags('inventory')
@Controller('inventory')
@ApiBearerAuth()
@RequireFeature('inventory_reports')
export class InventoryController {
  constructor(
    private readonly service: InventoryService,
    private readonly exporter: InventoryExportService,
  ) {}

  @Get()
  @RequirePermission('catalog:read')
  @ApiOperation({ summary: 'Listar inventario con filtros + paginación' })
  findAll(@CurrentUser() user: CurrentUserData, @Query() filters: InventoryFilterDto) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.findAll(user.tenantId, filters);
  }

  @Get('export')
  @RequirePermission('report:export')
  @ApiOperation({ summary: 'Exportar snapshot XLSX del inventario' })
  async exportStockList(
    @CurrentUser() user: CurrentUserData,
    @Query() filters: InventoryFilterDto,
    @Res() res: Response,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    const buf = await this.exporter.exportStockList(user.tenantId, filters);
    const filename = `inventario_snapshot_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  }

  @Get('alerts')
  @RequirePermission('catalog:read')
  @ApiOperation({ summary: 'Counts de alertas de inventario (bajo mínimo, sin stock)' })
  getAlerts(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.getAlerts(user.tenantId);
  }

  @Get('alerts/top')
  @RequirePermission('catalog:read')
  @ApiOperation({ summary: 'Top N ítems bajo mínimo / sin stock ordenados por déficit' })
  getTopBelowReorder(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: string,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    const n = limit ? Math.min(50, Math.max(1, parseInt(limit, 10) || 5)) : 5;
    return this.service.getTopBelowReorder(user.tenantId, n);
  }

  @Get(':catalogItemId')
  @RequirePermission('catalog:read')
  @ApiOperation({ summary: 'Obtener detalle de inventario por ítem' })
  findOne(@CurrentUser() user: CurrentUserData, @Param('catalogItemId') catalogItemId: string) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.findOne(user.tenantId, catalogItemId);
  }

  @Get(':catalogItemId/kardex')
  @RequirePermission('catalog:read')
  @ApiOperation({ summary: 'Kardex JSON para un ítem en un rango de fechas' })
  getKardex(
    @CurrentUser() user: CurrentUserData,
    @Param('catalogItemId') catalogItemId: string,
    @Query() filters: KardexFilterDto,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.getKardex(
      user.tenantId,
      catalogItemId,
      filters.startDate,
      filters.endDate,
      filters.movementType,
    );
  }
}
```

**Route order note:** `/export`, `/alerts`, `/alerts/top` DECLARADOS ANTES que `/:catalogItemId`. Crítico para evitar NestJS matching conflict. El orden arriba ya es correcto.

- [ ] **Step 4: Create module**

File: `apps/api/src/modules/inventory/inventory.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './services/inventory.service';
import { InventoryExportService } from './services/inventory-export.service';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryExportService],
  exports: [InventoryService],
})
export class InventoryModule {}
```

- [ ] **Step 5: Register in `app.module.ts`**

Find the imports block of `apps/api/src/modules/` and add:

```typescript
import { InventoryModule } from './modules/inventory/inventory.module';
```

Add `InventoryModule,` to the `imports: [...]` array (near `CatalogModule`).

**Verification:**

```bash
grep -n "InventoryModule" apps/api/src/app.module.ts
```
Expected: 2 matches (import line + entry in imports array).

- [ ] **Step 6: Run specs + build**

```bash
cd apps/api && npx jest --config jest.config.ts src/modules/inventory/ 2>&1 | tail -6
npx tsc --noEmit 2>&1 | grep -c "error TS"
```
Expected: all tests pass, 0 TS errors.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/inventory/ apps/api/src/app.module.ts
git commit -m "feat(inventory): add InventoryController + register module"
```

---

### Task 6: Frontend — types + stock list page `/inventario`

**Files:**
- Create: `apps/web/src/types/inventory.ts`
- Create: `apps/web/src/components/inventory/stock-status-badge.tsx`
- Create: `apps/web/src/app/(dashboard)/inventario/page.tsx`

- [ ] **Step 1: Create types**

File: `apps/web/src/types/inventory.ts`

```typescript
export type StockStatus = 'OK' | 'BELOW_REORDER' | 'OUT_OF_STOCK';

export interface InventoryItem {
  catalogItemId: string;
  code: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  currentQty: number;
  currentAvgCost: number;
  totalValue: number;
  reorderLevel: number | null;
  lastMovementAt: string | null;
  status: StockStatus;
}

export type InventoryItemDetail = InventoryItem;

export interface KardexRow {
  id: string;
  movementDate: string;
  correlativo: number;
  movementType: string;
  qtyIn: number;
  qtyOut: number;
  unitCost: number;
  totalCost: number;
  balanceQty: number;
  balanceAvgCost: number;
  balanceValue: number;
  documentType: string | null;
  documentNumber: string | null;
  notes: string | null;
}

export interface InventoryAlerts {
  belowReorderCount: number;
  outOfStockCount: number;
}

export interface TopBelowReorderItem {
  catalogItemId: string;
  code: string;
  description: string;
  currentQty: number;
  reorderLevel: number | null;
  status: StockStatus;
}

export interface InventoryListResponse {
  data: InventoryItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}
```

- [ ] **Step 2: Create `StockStatusBadge` component**

File: `apps/web/src/components/inventory/stock-status-badge.tsx`

```tsx
import * as React from 'react';
import type { StockStatus } from '@/types/inventory';

const CONFIG: Record<StockStatus, { label: string; className: string }> = {
  OK: { label: 'OK', className: 'bg-green-100 text-green-800' },
  BELOW_REORDER: { label: 'Bajo mínimo', className: 'bg-amber-100 text-amber-800' },
  OUT_OF_STOCK: { label: 'Sin stock', className: 'bg-red-100 text-red-800' },
};

export function StockStatusBadge({ status }: { status: StockStatus }) {
  const c = CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}
```

- [ ] **Step 3: Create stock list page**

File: `apps/web/src/app/(dashboard)/inventario/page.tsx`

```tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Package, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { PageSizeSelector } from '@/components/ui/page-size-selector';
import { API_URL } from '@/lib/api';
import { StockStatusBadge } from '@/components/inventory/stock-status-badge';
import type { InventoryItem, InventoryListResponse, InventoryAlerts, StockStatus } from '@/types/inventory';

export default function InventarioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StockStatus | 'ALL'>(
    (searchParams.get('filter') === 'below-reorder' ? 'BELOW_REORDER' : 'ALL'),
  );
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [sortBy, setSortBy] = React.useState('code');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  const [data, setData] = React.useState<InventoryListResponse | null>(null);
  const [alerts, setAlerts] = React.useState<InventoryAlerts | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`${API_URL}/inventory?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      toast.error('Error cargando inventario');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, statusFilter, toast]);

  const fetchAlerts = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/inventory/alerts`, { credentials: 'include' });
      if (res.ok) setAlerts(await res.json());
    } catch { /* non-fatal */ }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);
  React.useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ sortBy, sortOrder });
      if (search) params.set('search', search);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`${API_URL}/inventory/export?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario_snapshot_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Error exportando XLSX');
      console.error(e);
    }
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6" /> Inventario
        </h1>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" /> Exportar XLSX
        </Button>
      </div>

      {alerts && (alerts.belowReorderCount > 0 || alerts.outOfStockCount > 0) && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-sm">
              <strong>{alerts.belowReorderCount}</strong> ítems bajo mínimo ·{' '}
              <strong>{alerts.outOfStockCount}</strong> sin stock.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por código o descripción…"
                className="pl-8"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StockStatus | 'ALL'); setPage(1); }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value="OK">OK</SelectItem>
                <SelectItem value="BELOW_REORDER">Bajo mínimo</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Sin stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 cursor-pointer" onClick={() => toggleSort('code')}>Código</th>
                  <th className="text-left p-2 cursor-pointer" onClick={() => toggleSort('description')}>Descripción</th>
                  <th className="text-left p-2">Categoría</th>
                  <th className="text-right p-2 cursor-pointer" onClick={() => toggleSort('currentQty')}>Stock</th>
                  <th className="text-right p-2">Costo prom.</th>
                  <th className="text-right p-2 cursor-pointer" onClick={() => toggleSort('totalValue')}>Valor</th>
                  <th className="text-right p-2">Reorder</th>
                  <th className="text-left p-2 cursor-pointer" onClick={() => toggleSort('lastMovementAt')}>Últ. mov.</th>
                  <th className="text-left p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500">Cargando…</td></tr>
                )}
                {!loading && data && data.data.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500">
                    No hay ítems con movimientos de inventario.{' '}
                    <Link href="/catalogo" className="text-blue-600 hover:underline">Ir a Catálogo →</Link>
                  </td></tr>
                )}
                {!loading && data?.data.map((it: InventoryItem) => (
                  <tr key={it.catalogItemId} className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/inventario/${it.catalogItemId}`)}>
                    <td className="p-2 font-mono">{it.code}</td>
                    <td className="p-2">{it.description}</td>
                    <td className="p-2 text-gray-500">{it.categoryName ?? '—'}</td>
                    <td className="p-2 text-right">{it.currentQty.toFixed(4)}</td>
                    <td className="p-2 text-right">${it.currentAvgCost.toFixed(4)}</td>
                    <td className="p-2 text-right">${it.totalValue.toFixed(2)}</td>
                    <td className="p-2 text-right">{it.reorderLevel?.toFixed(4) ?? '—'}</td>
                    <td className="p-2 text-gray-600">
                      {it.lastMovementAt ? new Date(it.lastMovementAt).toLocaleDateString('es-SV') : '—'}
                    </td>
                    <td className="p-2"><StockStatusBadge status={it.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.total > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {data.total} items · Página {data.page} de {data.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <PageSizeSelector value={limit} onChange={(v) => { setLimit(v); setPage(1); }} />
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -v sync-engine | grep -c "error TS"
```
Expected: 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/types/inventory.ts apps/web/src/components/inventory/stock-status-badge.tsx "apps/web/src/app/(dashboard)/inventario/page.tsx"
git commit -m "feat(web): add /inventario list page with filters + export"
```

---

### Task 7: Frontend — detail page + kardex table `/inventario/[catalogItemId]`

**Files:**
- Create: `apps/web/src/components/inventory/kardex-table.tsx`
- Create: `apps/web/src/app/(dashboard)/inventario/[catalogItemId]/page.tsx`

- [ ] **Step 1: Create `KardexTable` component**

File: `apps/web/src/components/inventory/kardex-table.tsx`

```tsx
import * as React from 'react';
import type { KardexRow } from '@/types/inventory';

export function KardexTable({ rows }: { rows: KardexRow[] }) {
  if (rows.length === 0) {
    return <p className="text-center text-gray-500 py-8">Sin movimientos en el rango seleccionado.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2">Fecha</th>
            <th className="text-right p-2">#</th>
            <th className="text-left p-2">Tipo</th>
            <th className="text-right p-2">Qty entrada</th>
            <th className="text-right p-2">Qty salida</th>
            <th className="text-right p-2">Costo unit.</th>
            <th className="text-right p-2">Costo total</th>
            <th className="text-right p-2">Saldo qty</th>
            <th className="text-right p-2">Costo prom.</th>
            <th className="text-right p-2">Saldo valor</th>
            <th className="text-left p-2">Documento</th>
            <th className="text-left p-2">Notas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t hover:bg-gray-50">
              <td className="p-2">{new Date(r.movementDate).toLocaleDateString('es-SV')}</td>
              <td className="p-2 text-right font-mono">{r.correlativo}</td>
              <td className="p-2"><span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{r.movementType}</span></td>
              <td className="p-2 text-right">{r.qtyIn > 0 ? r.qtyIn.toFixed(4) : '—'}</td>
              <td className="p-2 text-right">{r.qtyOut > 0 ? r.qtyOut.toFixed(4) : '—'}</td>
              <td className="p-2 text-right">${r.unitCost.toFixed(4)}</td>
              <td className="p-2 text-right">${r.totalCost.toFixed(2)}</td>
              <td className="p-2 text-right font-medium">{r.balanceQty.toFixed(4)}</td>
              <td className="p-2 text-right">${r.balanceAvgCost.toFixed(4)}</td>
              <td className="p-2 text-right font-medium">${r.balanceValue.toFixed(2)}</td>
              <td className="p-2 text-xs text-gray-600">
                {r.documentType && r.documentNumber ? `${r.documentType} ${r.documentNumber}` : '—'}
              </td>
              <td className="p-2 text-xs text-gray-600">{r.notes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Create detail page**

File: `apps/web/src/app/(dashboard)/inventario/[catalogItemId]/page.tsx`

```tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Package } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { API_URL } from '@/lib/api';
import { StockStatusBadge } from '@/components/inventory/stock-status-badge';
import { KardexTable } from '@/components/inventory/kardex-table';
import type { InventoryItemDetail, KardexRow } from '@/types/inventory';

function firstDayOfMonth() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); }
function today() { return new Date().toISOString().slice(0, 10); }

export default function InventarioDetailPage() {
  const params = useParams<{ catalogItemId: string }>();
  const catalogItemId = params.catalogItemId;
  const toast = useToast();

  const [item, setItem] = React.useState<InventoryItemDetail | null>(null);
  const [kardex, setKardex] = React.useState<KardexRow[] | null>(null);
  const [startDate, setStartDate] = React.useState(firstDayOfMonth());
  const [endDate, setEndDate] = React.useState(today());
  const [movementType, setMovementType] = React.useState<string>('ALL');
  const [loading, setLoading] = React.useState(true);
  const [notFoundMsg, setNotFoundMsg] = React.useState<string | null>(null);

  const fetchItem = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/inventory/${catalogItemId}`, { credentials: 'include' });
      if (res.status === 404) {
        const body = await res.json();
        setNotFoundMsg(body?.message ?? 'Ítem no encontrado');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItem(await res.json());
    } catch (e) {
      toast.error('Error cargando ítem');
      console.error(e);
    }
  }, [catalogItemId, toast]);

  const fetchKardex = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (movementType !== 'ALL') params.set('movementType', movementType);
      const res = await fetch(`${API_URL}/inventory/${catalogItemId}/kardex?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setKardex(await res.json());
    } catch (e) {
      toast.error('Error cargando kardex');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [catalogItemId, startDate, endDate, movementType, toast]);

  React.useEffect(() => { fetchItem(); }, [fetchItem]);
  React.useEffect(() => { if (item) fetchKardex(); }, [fetchKardex, item]);

  const handleExcelDownload = () => {
    const url = `${API_URL}/reports/kardex/item/${catalogItemId}?startDate=${startDate}&endDate=${endDate}`;
    window.open(url, '_blank');
  };

  const movementTypes = React.useMemo(() => {
    if (!kardex) return [];
    return Array.from(new Set(kardex.map((k) => k.movementType))).sort();
  }, [kardex]);

  if (notFoundMsg) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <Package className="h-12 w-12 mx-auto text-gray-400" />
          <p className="text-gray-600">{notFoundMsg}</p>
          <Link href="/inventario">
            <Button variant="outline">← Volver a inventario</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/inventario">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
        </Link>
      </div>

      {item && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono text-sm text-gray-500">{item.code}</p>
                <h1 className="text-xl font-bold">{item.description}</h1>
                <p className="text-sm text-gray-600">{item.categoryName ?? 'Sin categoría'}</p>
              </div>
              <StockStatusBadge status={item.status} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-gray-500">Stock actual</p><p className="font-semibold">{item.currentQty.toFixed(4)}</p></div>
              <div><p className="text-gray-500">Costo promedio</p><p className="font-semibold">${item.currentAvgCost.toFixed(4)}</p></div>
              <div><p className="text-gray-500">Valor total</p><p className="font-semibold">${item.totalValue.toFixed(2)}</p></div>
              <div><p className="text-gray-500">Reorder level</p><p className="font-semibold">{item.reorderLevel?.toFixed(4) ?? '—'}</p></div>
              <div className="col-span-2">
                <p className="text-gray-500">Último movimiento</p>
                <p className="font-semibold">{item.lastMovementAt ? new Date(item.lastMovementAt).toLocaleString('es-SV') : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Kardex</h2>
            <Button variant="outline" size="sm" onClick={handleExcelDownload}>
              <Download className="h-4 w-4 mr-2" /> Descargar Excel
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Desde</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hasta</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo</label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los tipos</SelectItem>
                  {movementTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading && <p className="text-center text-gray-500 py-4">Cargando kardex…</p>}
          {!loading && kardex && <KardexTable rows={kardex} />}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -v sync-engine | grep -c "error TS"
```
Expected: 0.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/inventory/kardex-table.tsx "apps/web/src/app/(dashboard)/inventario/[catalogItemId]/page.tsx"
git commit -m "feat(web): add /inventario/[id] detail page with kardex viewer"
```

---

### Task 8: Frontend — dashboard widget + sidebar badge

**Files:**
- Create: `apps/web/src/components/inventory/low-stock-alert-card.tsx`
- Modify: `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- Modify: `apps/web/src/components/layout/sidebar.tsx`

- [ ] **Step 1: Create `LowStockAlertCard` component**

File: `apps/web/src/components/inventory/low-stock-alert-card.tsx`

```tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Package, ChevronRight } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { StockStatusBadge } from '@/components/inventory/stock-status-badge';
import type { TopBelowReorderItem, InventoryAlerts } from '@/types/inventory';

export function LowStockAlertCard() {
  const [alerts, setAlerts] = React.useState<InventoryAlerts | null>(null);
  const [top, setTop] = React.useState<TopBelowReorderItem[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const [alertsRes, topRes] = await Promise.all([
          fetch(`${API_URL}/inventory/alerts`, { credentials: 'include' }),
          fetch(`${API_URL}/inventory/alerts/top?limit=5`, { credentials: 'include' }),
        ]);
        if (alertsRes.ok) setAlerts(await alertsRes.json());
        if (topRes.ok) setTop(await topRes.json());
      } catch { /* non-fatal */ }
      finally { setLoaded(true); }
    })();
  }, []);

  if (!loaded) return null;
  const total = (alerts?.belowReorderCount ?? 0) + (alerts?.outOfStockCount ?? 0);
  if (total === 0) return null;

  return (
    <Card className="border-amber-300">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold">Inventario bajo mínimo</h3>
          </div>
          <span className="text-2xl font-bold text-amber-700">{total}</span>
        </div>
        <p className="text-xs text-gray-600">
          {alerts?.belowReorderCount ?? 0} bajo mínimo · {alerts?.outOfStockCount ?? 0} sin stock
        </p>
        {top.length > 0 && (
          <ul className="space-y-1 text-sm">
            {top.map((t) => (
              <li key={t.catalogItemId} className="flex items-center justify-between border-t pt-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Package className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span className="font-mono text-xs">{t.code}</span>
                  <span className="truncate text-gray-700">{t.description}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-500">
                    {t.currentQty.toFixed(0)}/{t.reorderLevel?.toFixed(0) ?? '—'}
                  </span>
                  <StockStatusBadge status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link href="/inventario?filter=below-reorder" className="flex items-center justify-end text-sm text-blue-600 hover:underline">
          Ver todos <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Insert `<LowStockAlertCard />` in dashboard**

Read `apps/web/src/app/(dashboard)/dashboard/page.tsx` to find the grid of cards (search for existing `<Card>` usage). Import and insert:

```tsx
import { LowStockAlertCard } from '@/components/inventory/low-stock-alert-card';
```

Place `<LowStockAlertCard />` inside the cards grid, after the invoice-related cards and before cotizaciones (or equivalent location). If there is no grid, wrap in `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">` with existing elements.

**Verification:**

```bash
grep -n "LowStockAlertCard" apps/web/src/app/\(dashboard\)/dashboard/page.tsx
```
Expected: 2 matches (import + JSX).

- [ ] **Step 3: Add sidebar item with badge**

Read `apps/web/src/components/layout/sidebar.tsx`. Add `Inventario` item near Catalogo. Fetch `/inventory/alerts` at mount. Show numeric badge if total > 0.

Strategy:
- Add `import { Package } from 'lucide-react';` (already likely imported elsewhere — reuse).
- Add state `const [invBadge, setInvBadge] = React.useState(0);` inside the component.
- Add effect:

```tsx
React.useEffect(() => {
  fetch(`${API_URL}/inventory/alerts`, { credentials: 'include' })
    .then(r => r.ok ? r.json() : null)
    .then(j => { if (j) setInvBadge((j.belowReorderCount || 0) + (j.outOfStockCount || 0)); })
    .catch(() => {});
}, []);
```

- Add nav item in the existing nav array or JSX list — follow the file's pattern. The nav item JSX should render a badge like:

```tsx
{invBadge > 0 && (
  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{invBadge}</span>
)}
```

(Exact integration depends on the sidebar's existing structure — match the convention of other items that already exist there.)

**Verification:**

```bash
grep -n "/inventario" apps/web/src/components/layout/sidebar.tsx
grep -n "invBadge\|inventory/alerts" apps/web/src/components/layout/sidebar.tsx
```
Expected: at least 1 match per grep.

- [ ] **Step 4: Typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -v sync-engine | grep -c "error TS"
```
Expected: 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/inventory/low-stock-alert-card.tsx "apps/web/src/app/(dashboard)/dashboard/page.tsx" apps/web/src/components/layout/sidebar.tsx
git commit -m "feat(web): add LowStockAlertCard widget + sidebar badge for inventory"
```

---

### Task 9: E2E stub + regression + evidence + PR

**Files:**
- Create: `apps/web/tests/e2e/inventory.spec.ts`
- Create: `outputs/EXECUTION_EVIDENCE_PHASE_2_4.md`

- [ ] **Step 1: E2E stub**

File: `apps/web/tests/e2e/inventory.spec.ts`

```typescript
import { test } from '@playwright/test';

test.describe('Inventario UI', () => {
  test.skip('stock list con filtros + export XLSX', async () => {
    // TODO: unblock when staging env ready
  });

  test.skip('detalle con kardex — cambiar rango de fechas', async () => {
    // TODO: unblock when staging env ready
  });

  test.skip('dashboard widget click → /inventario?filter=below-reorder', async () => {
    // TODO: unblock when staging env ready
  });
});
```

- [ ] **Step 2: Regression sweep**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/inventory-viewer/apps/api && npx jest --config jest.config.ts src/modules/ 2>&1 | tail -5
cd /home/jose/facturador-electronico-sv/.worktrees/inventory-viewer/apps/api && npx tsc --noEmit 2>&1 | grep -c "error TS"
cd /home/jose/facturador-electronico-sv/.worktrees/inventory-viewer/apps/web && npx tsc --noEmit 2>&1 | grep -v sync-engine | grep -c "error TS"
```
Record numbers. Compare jest baseline to Task 1 Step 3 — expected: same 2 pre-existentes pero ahora hay +3 suites nuevas pasando (inventory.service, inventory-export.service, inventory.controller).

- [ ] **Step 3: Write evidence doc**

File: `outputs/EXECUTION_EVIDENCE_PHASE_2_4.md`

```markdown
# Execution Evidence — Fase 2.4 Inventory Viewer + Alerts (B.1)

**Date:** <DATE_TODAY>
**Branch:** `feature/inventory-viewer`
**Spec:** `docs/superpowers/specs/2026-04-18-fase-2-4-inventory-viewer-design.md`
**Plan:** `docs/superpowers/plans/2026-04-18-fase-2-4-inventory-viewer.md`

## Built

### Backend
- `InventoryService`: findAll, findOne, getKardex, getAlerts, getTopBelowReorder (read-only, tenant-scoped, filtra `CatalogItem.type='BIEN'`).
- `InventoryExportService`: XLSX stock list (9 columnas, 10k cap).
- `InventoryController` 6 endpoints:
  - `GET /inventory`, `GET /inventory/export`, `GET /inventory/alerts`, `GET /inventory/alerts/top`, `GET /inventory/:catalogItemId`, `GET /inventory/:catalogItemId/kardex`.
- Module registrado en `app.module.ts`.
- DTOs: `InventoryFilterDto`, `KardexFilterDto`.

### Frontend
- `/inventario` stock list con filtros (search, status), paginación, sort, export XLSX.
- `/inventario/[catalogItemId]` detalle con header + kardex table + filtros de fecha/tipo + link a export Excel del endpoint existente.
- `LowStockAlertCard` en dashboard.
- Sidebar "Inventario" con badge.
- Types en `types/inventory.ts`.

## Tests
- Backend jest: <BEFORE> → <AFTER> passing (3 suites nuevas: inventory.service, inventory-export.service, inventory.controller).
- TypeScript: 0 errores (API + Web).
- E2E: 3 `test.skip` para staging.

## Not included (B.2 / B.3 deferred)
- Ajustes manuales (entrada/salida con subtipos).
- Conteo físico anual (online + CSV).

## Post-deploy runbook
**Zero schema / RBAC / deps changes.**
1. Merge → CI auto-deploy staging.
2. Login → `/inventario` → ver stock list.
3. Click ítem → ver kardex con rango default (mes actual).
4. Export XLSX → abrir en Excel (9 cols).
5. Dashboard → widget bajo mínimo.
6. Sidebar badge.
7. Merge prod → smoke igual.

## Commits
<INSERT git log --oneline main..HEAD OUTPUT>

## Rollback
`git revert <merge-sha>`. Zero DB changes → reversión pura.
```

Substitute `<DATE_TODAY>`, `<BEFORE>`, `<AFTER>`, `<INSERT git log…>` with actuals.

- [ ] **Step 4: Commit + push**

```bash
cd /home/jose/facturador-electronico-sv/.worktrees/inventory-viewer
git add outputs/EXECUTION_EVIDENCE_PHASE_2_4.md apps/web/tests/e2e/inventory.spec.ts
git commit -m "docs: execution evidence for Fase 2.4 Inventory Viewer (B.1)"
git push -u origin feature/inventory-viewer
```

- [ ] **Step 5: Open PR**

```bash
gh pr create --title "feat(inventory): Fase 2.4 — Inventory viewer + alerts (sub-proyecto B.1)" --body "$(cat <<'EOF'
## Summary

Primera entrega del sub-proyecto B (decompuesto en B.1 visor/alertas, B.2 ajustes manuales, B.3 conteo físico). Expone al usuario el inventario ya computado por Fases 1.4–1.6. **Zero schema changes, zero RBAC changes, zero new deps.**

## Backend

- \`InventoryService\`: findAll, findOne, getKardex, getAlerts, getTopBelowReorder.
- \`InventoryExportService\`: XLSX 9 columnas, cap 10k.
- \`InventoryController\` +6 endpoints.
- Reuso de perms \`catalog:read\` + \`report:export\` y feature flag \`inventory_reports\`.

## Frontend

- Páginas: \`/inventario\` + \`/inventario/[catalogItemId]\`.
- Widget \`LowStockAlertCard\` en dashboard.
- Sidebar "Inventario" con badge de alertas.

## Test plan

- [x] Backend jest: sin regresiones (3 suites nuevas).
- [x] TypeScript limpio API + Web.
- [x] 3 E2E stub (skip hasta staging).
- [ ] Manual QA staging (runbook en \`outputs/EXECUTION_EVIDENCE_PHASE_2_4.md\`).

## Post-deploy

Zero schema / RBAC changes. Auto deploy via CI. Runbook en evidence file.

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

- Spec §4.1 (`InventoryService`): Task 2 (findAll/findOne/getKardex) + Task 3 (getAlerts/getTopBelowReorder). ✅
- Spec §4.2 (`InventoryExportService`): Task 4. ✅
- Spec §4.3 (6 endpoints): Task 5 (controller) + Step 5 (module registration). ✅
- Spec §4.4 (DTOs): Task 2 Steps 1–2. ✅
- Spec §5.1 (páginas): Task 6 (list) + Task 7 (detalle). ✅
- Spec §5.2 (componentes): Task 6 Step 2 (StockStatusBadge), Task 7 Step 1 (KardexTable), Task 8 Step 1 (LowStockAlertCard). ✅
- Spec §5.3 (modificaciones): Task 8 Steps 2–3. ✅
- Spec §5.4 (types): Task 6 Step 1. ✅
- Spec §6 (error handling): distribuido — 404 sin state (Task 2 Step 5 findOne), range validations (Task 2 Step 5 getKardex), empty states UI (Task 6 Step 3), 404 UI (Task 7 Step 2). ✅
- Spec §7.1 (backend unit tests): Task 2/3/4/5 specs. ✅
- Spec §7.2 (frontend validación): Task 6/7/8 tsc gates + Task 9 E2E stub. ✅
- Spec §7.3 (regression): Task 9 Step 2. ✅
- Spec §8 (runbook): Task 9 Step 3. ✅

### Placeholders

- `<DATE_TODAY>`, `<BEFORE>`, `<AFTER>`, `<INSERT git log…>` en evidence doc son explícitos — se sustituyen al ejecutar Task 9 Step 3. Son placeholders de runtime, no de plan.
- Task 8 Step 3 (sidebar badge): integración explícita con código de ejemplo + grep verification. Sin TODOs abiertos.

### Type consistency

- `StockStatus` usado en backend (`inventory.service.ts`) y frontend (`types/inventory.ts`) — mismos valores literales `'OK' | 'BELOW_REORDER' | 'OUT_OF_STOCK'`.
- `InventoryItem` / `InventoryListResponse` shapes idénticos backend↔frontend.
- `KardexRow` idéntico backend↔frontend (los `number` del frontend vienen de los `Number(Decimal.toString())` del service).
- Endpoint paths consistentes entre Task 5 (controller) y Task 6/7/8 (frontend fetches).
- Route order: `/export`, `/alerts`, `/alerts/top` antes de `/:catalogItemId` — flaggeado en Task 5 Step 3.

### Scope

- B.1 solamente. B.2 (ajustes manuales) y B.3 (conteo físico) explícitamente diferidos, aparecen solo en follow-ups.
- Zero schema / deps / RBAC changes — reflejado en plan header y en Task 1 prereqs.
