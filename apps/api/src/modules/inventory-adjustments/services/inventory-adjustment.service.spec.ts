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
    inventoryMovement: { aggregate: jest.Mock; create: jest.Mock; findMany: jest.Mock; count: jest.Mock; update: jest.Mock };
    tenant: { findUnique: jest.Mock };
    accountingAccount: { findUnique: jest.Mock; findFirst: jest.Mock };
  };
  let accounting: { createAndPostJournalEntry: jest.Mock; createJournalEntry: jest.Mock; postJournalEntry: jest.Mock };
  let planFeatures: { checkFeatureAccess: jest.Mock };

  const tenantId = 't1';
  const userId = 'u1';
  const catalogItemId = 'c1';

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (fn) => fn(prisma)),
      catalogItem: { findFirst: jest.fn() },
      inventoryState: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
      inventoryMovement: { aggregate: jest.fn(), create: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn() },
      tenant: { findUnique: jest.fn() },
      accountingAccount: { findUnique: jest.fn(), findFirst: jest.fn() },
    };
    accounting = {
      createAndPostJournalEntry: jest.fn(),
      createJournalEntry: jest.fn(),
      postJournalEntry: jest.fn(),
    };
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
    prisma.catalogItem.findFirst.mockResolvedValue({ id: catalogItemId, tenantId, trackInventory, code: 'P-001' });
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
      expect(Number(call.data.totalCost)).toBe(10);
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
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'FREE' });
      planFeatures.checkFeatureAccess.mockResolvedValue(false);

      const result = await service.createAdjustment(tenantId, userId, input);
      expect(result.journalEntryId).toBeNull();
    });

    it('posts journal entry when feature ON and accounts found', async () => {
      mockItem(); mockState(10, 5); mockCorrelativo(); mockMovementCreated({ movementType: 'SALIDA_MERMA' });
      prisma.inventoryState.update.mockResolvedValue({});
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'PRO' });
      planFeatures.checkFeatureAccess.mockResolvedValue(true);

      prisma.accountingAccount.findUnique
        .mockResolvedValueOnce({ id: 'acc-5105', isActive: true, allowsPosting: true })
        .mockResolvedValueOnce({ id: 'acc-110401', isActive: true, allowsPosting: true });

      accounting.createJournalEntry.mockResolvedValue({ id: 'je1' });
      accounting.postJournalEntry.mockResolvedValue({ id: 'je1' });
      prisma.inventoryMovement.update.mockResolvedValue({});

      const result = await service.createAdjustment(tenantId, userId, input);
      expect(accounting.createJournalEntry).toHaveBeenCalled();
      expect(accounting.postJournalEntry).toHaveBeenCalled();
      expect(result.journalEntryId).toBe('je1');
    });

    it('gracefully handles accounting failure (account missing) — movement saved, journalEntryId null', async () => {
      mockItem(); mockState(); mockCorrelativo(); mockMovementCreated();
      prisma.inventoryState.update.mockResolvedValue({});
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'PRO' });
      planFeatures.checkFeatureAccess.mockResolvedValue(true);

      prisma.accountingAccount.findUnique.mockResolvedValue(null);
      prisma.accountingAccount.findFirst.mockResolvedValue(null);

      const result = await service.createAdjustment(tenantId, userId, input);
      expect(accounting.createJournalEntry).not.toHaveBeenCalled();
      expect(result.journalEntryId).toBeNull();
    });
  });

  describe('createAdjustment — skipDateValidation flag', () => {
    it('skipDateValidation=true allows movementDate before current month', async () => {
      mockItem(); mockState(10, 5); mockCorrelativo(); mockMovementCreated();
      prisma.inventoryState.update.mockResolvedValue({});
      prisma.tenant.findUnique.mockResolvedValue({ plan: 'FREE' });
      planFeatures.checkFeatureAccess.mockResolvedValue(false);

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

    it('translates subtype filter to movementType', async () => {
      prisma.inventoryMovement.findMany.mockResolvedValue([]);
      prisma.inventoryMovement.count.mockResolvedValue(0);
      await service.listAdjustments(tenantId, { subtype: 'MERMA' });
      const call = prisma.inventoryMovement.findMany.mock.calls[0][0];
      expect(call.where.movementType).toBe('SALIDA_MERMA');
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
});
