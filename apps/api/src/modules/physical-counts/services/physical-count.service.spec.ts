import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PhysicalCountService } from './physical-count.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { InventoryAdjustmentService } from '../../inventory-adjustments/services/inventory-adjustment.service';
import { PhysicalCountCsvService } from './physical-count-csv.service';

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
        PhysicalCountCsvService,
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
      prisma.physicalCountDetail.findFirst.mockResolvedValueOnce({
        id: detailId, physicalCountId: countId, tenantId,
        systemQty: { toString: () => '10' },
        countedQty: null,
        unitCost: { toString: () => '5' },
      }).mockResolvedValueOnce({
        id: detailId, catalogItemId: 'c1',
        systemQty: { toString: () => '10' },
        countedQty: { toString: () => '8' },
        variance: { toString: () => '-2' },
        unitCost: { toString: () => '5' },
        totalValue: { toString: () => '-10' },
        adjustmentMovementId: null, notes: null,
        catalogItem: { code: 'P-001', description: 'Prod 1' },
      });
      await service.updateDetail(tenantId, countId, detailId, { countedQty: 8 });
      const call = prisma.physicalCountDetail.update.mock.calls[0][0];
      expect(Number(call.data.variance)).toBe(-2);
      expect(Number(call.data.totalValue)).toBe(-10);
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
      prisma.physicalCountDetail.findFirst
        .mockResolvedValueOnce({
          id: detailId, physicalCountId: countId, tenantId,
          systemQty: { toString: () => '10' },
          countedQty: null,
          unitCost: { toString: () => '5' },
        })
        .mockResolvedValueOnce({
          id: detailId, catalogItemId: 'c1',
          systemQty: { toString: () => '10' },
          countedQty: { toString: () => '15' },
          variance: { toString: () => '5' },
          unitCost: { toString: () => '7' },
          totalValue: { toString: () => '35' },
          adjustmentMovementId: null, notes: null,
          catalogItem: { code: 'P-001', description: null },
        });
      prisma.physicalCountDetail.update.mockResolvedValue({});
      await service.updateDetail(tenantId, countId, detailId, { countedQty: 15, unitCost: 7 });
      const call = prisma.physicalCountDetail.update.mock.calls[0][0];
      expect(Number(call.data.unitCost)).toBe(7);
      expect(Number(call.data.totalValue)).toBe(35);
    });

    it('ignores unitCost when variance <= 0', async () => {
      mockDraft();
      prisma.physicalCountDetail.findFirst
        .mockResolvedValueOnce({
          id: detailId, physicalCountId: countId, tenantId,
          systemQty: { toString: () => '10' },
          countedQty: null,
          unitCost: { toString: () => '5' },
        })
        .mockResolvedValueOnce({
          id: detailId, catalogItemId: 'c1',
          systemQty: { toString: () => '10' },
          countedQty: { toString: () => '8' },
          variance: { toString: () => '-2' },
          unitCost: { toString: () => '5' },
          totalValue: { toString: () => '-10' },
          adjustmentMovementId: null, notes: null,
          catalogItem: { code: 'P-001', description: null },
        });
      prisma.physicalCountDetail.update.mockResolvedValue({});
      await service.updateDetail(tenantId, countId, detailId, { countedQty: 8, unitCost: 99 });
      const call = prisma.physicalCountDetail.update.mock.calls[0][0];
      expect(call.data.unitCost).toBeUndefined();
    });

    it('resets variance=0, totalValue=0 when countedQty=null', async () => {
      prisma.physicalCount.findUnique.mockResolvedValue({ id: countId, tenantId, status: 'DRAFT' });
      prisma.physicalCountDetail.findFirst
        .mockResolvedValueOnce({
          id: detailId, physicalCountId: countId, tenantId,
          systemQty: { toString: () => '10' },
          countedQty: { toString: () => '7' },
          unitCost: { toString: () => '5' },
        })
        .mockResolvedValueOnce({
          id: detailId, catalogItemId: 'c1',
          systemQty: { toString: () => '10' },
          countedQty: null,
          variance: { toString: () => '0' },
          unitCost: { toString: () => '5' },
          totalValue: { toString: () => '0' },
          adjustmentMovementId: null, notes: null,
          catalogItem: { code: 'P-001', description: null },
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
});
