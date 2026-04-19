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
});
