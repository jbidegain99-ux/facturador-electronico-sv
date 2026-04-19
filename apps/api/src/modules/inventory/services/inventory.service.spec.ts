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
