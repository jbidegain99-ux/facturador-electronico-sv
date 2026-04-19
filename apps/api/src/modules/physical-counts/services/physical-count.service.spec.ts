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
      expect(call.data[0]).toMatchObject({
        catalogItemId: 'c1',
        systemQty: 10,
        unitCost: 5,
        countedQty: null,
        variance: 0,
      });
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
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(0);
      prisma.physicalCountDetail.aggregate.mockResolvedValue({ _sum: { totalValue: { toString: () => '-45.20' } } });

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
      prisma.physicalCount.findUnique.mockResolvedValue({
        id: 'pc1', tenantId, fiscalYear: 2026, status: 'DRAFT',
        countDate: new Date('2026-04-19'), notes: null,
        finalizedAt: null, finalizedBy: null, createdAt: new Date(), createdBy: 'u1',
      });
      prisma.physicalCountDetail.findMany.mockResolvedValue([
        { id: 'd1', catalogItemId: 'c1',
          systemQty: { toString: () => '10' },
          countedQty: null, variance: { toString: () => '0' },
          unitCost: { toString: () => '5' }, totalValue: { toString: () => '0' },
          adjustmentMovementId: null, notes: null,
          catalogItem: { code: 'P-001', description: 'Prod 1' } },
      ]);
      prisma.physicalCountDetail.count
        .mockResolvedValueOnce(1)  // detail count for pagination
        .mockResolvedValueOnce(1)  // summary totalLines
        .mockResolvedValueOnce(0)  // summary countedLines
        .mockResolvedValueOnce(0); // summary adjustedLines
      prisma.physicalCountDetail.aggregate.mockResolvedValue({ _sum: { totalValue: { toString: () => '0' } } });

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
