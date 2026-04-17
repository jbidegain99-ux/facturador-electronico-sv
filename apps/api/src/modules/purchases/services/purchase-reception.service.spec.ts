// apps/api/src/modules/purchases/services/purchase-reception.service.spec.ts

import { NotFoundException, PreconditionFailedException } from '@nestjs/common';
import {
  PurchaseReceptionService,
  computeWeightedAverage,
} from './purchase-reception.service';
import { PrismaService } from '../../../prisma/prisma.service';

// =========================================================================
// Mocks
// =========================================================================

type PrismaMock = {
  purchase: { findFirst: jest.Mock; update: jest.Mock };
  purchaseLineItem: { update: jest.Mock };
  inventoryMovement: { create: jest.Mock; aggregate: jest.Mock; findMany: jest.Mock };
  inventoryState: { findUnique: jest.Mock; upsert: jest.Mock };
  $transaction: jest.Mock;
};

function mockPrisma(): PrismaMock {
  const p: PrismaMock = {
    purchase: { findFirst: jest.fn(), update: jest.fn() },
    purchaseLineItem: { update: jest.fn() },
    inventoryMovement: {
      create: jest.fn().mockImplementation(({ data }) => ({ id: `mov-${Math.random()}`, ...data })),
      aggregate: jest.fn().mockResolvedValue({ _max: { correlativo: null } }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    inventoryState: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockImplementation(({ create }) => ({ id: `state-${Math.random()}`, ...create })),
    },
    $transaction: jest.fn(async (fn) => fn(p)), // pass-through
  };
  return p;
}

function makePurchase(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pur-1',
    tenantId: 'tenant-1',
    status: 'DRAFT',
    documentType: 'CCFE',
    documentNumber: 'DTE-03-AB12CD34-000000000000001',
    supplierId: 'sup-1',
    journalEntryId: 'entry-1',
    receiptDate: null,
    receivedBy: null,
    purchaseDate: new Date('2026-04-15'),
    supplier: { id: 'sup-1', nombre: 'Proveedor Test' },
    lineItems: [
      {
        id: 'line-1',
        tenantId: 'tenant-1',
        lineNumber: 1,
        catalogItemId: 'cat-1',
        description: 'Producto A',
        quantity: '10.0000',
        unitPrice: '10.0000',
        unitCostPosted: '10.0000',
        taxCode: '20',
        taxAmount: '13.00',
        lineTotal: '113.00',
        qtyExpected: '10.0000',
        qtyReceived: '0',
        receiptStatus: 'PENDING',
        catalogItem: { id: 'cat-1', code: 'ITEM-A', trackInventory: true },
      },
    ],
    ...overrides,
  };
}

const baseOptions = { receivedBy: 'user-1' };

// =========================================================================
// Pure function tests
// =========================================================================

describe('computeWeightedAverage', () => {
  it('1. empty state returns incoming values as new', () => {
    const result = computeWeightedAverage(0, 0, 10, 15.5);
    expect(result.newQty).toBe(10);
    expect(result.newAvgCost).toBe(15.5);
    expect(result.newValue).toBe(155);
  });

  it('2. same unit cost keeps avgCost unchanged', () => {
    const result = computeWeightedAverage(10, 20, 5, 20);
    expect(result.newQty).toBe(15);
    expect(result.newAvgCost).toBe(20);
    expect(result.newValue).toBe(300);
  });

  it('3. different unit cost produces weighted average', () => {
    const result = computeWeightedAverage(10, 20, 5, 30);
    // (10*20 + 5*30) / 15 = 350/15 ≈ 23.333...
    expect(result.newQty).toBe(15);
    expect(result.newAvgCost).toBeCloseTo(23.3333, 4);
    expect(result.newValue).toBeCloseTo(350, 2);
  });

  it('4. negative qty treated as first entry (reset)', () => {
    const result = computeWeightedAverage(-1, 99, 5, 10);
    expect(result.newQty).toBe(4);
    expect(result.newAvgCost).toBe(10);
    expect(result.newValue).toBe(40);
  });
});

// =========================================================================
// Service.receive() tests
// =========================================================================

describe('PurchaseReceptionService.receive', () => {
  it('5. happy CCFE — creates Movement, upserts State, marks line COMPLETE, Purchase RECEIVED', async () => {
    const prisma = mockPrisma();
    (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(makePurchase());
    (prisma.purchase.update as jest.Mock).mockResolvedValue({ ...makePurchase(), status: 'RECEIVED' });
    (prisma.purchaseLineItem.update as jest.Mock).mockResolvedValue({});
    const service = new PurchaseReceptionService(prisma as unknown as PrismaService);

    const result = await service.receive('tenant-1', 'pur-1', baseOptions);

    expect(prisma.inventoryMovement.create).toHaveBeenCalledTimes(1);
    const createCall = (prisma.inventoryMovement.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.movementType).toBe('ENTRADA_COMPRA');
    expect(createCall.data.qtyIn).toBe('10.0000');
    expect(createCall.data.qtyOut).toBe('0.0000');
    expect(createCall.data.correlativo).toBe(1);
    expect(createCall.data.sourceType).toBe('PURCHASE');
    expect(createCall.data.sourceId).toBe('pur-1');
    expect(createCall.data.journalEntryId).toBe('entry-1');

    expect(prisma.inventoryState.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.purchaseLineItem.update).toHaveBeenCalledTimes(1);
    const lineUpdate = (prisma.purchaseLineItem.update as jest.Mock).mock.calls[0][0];
    expect(lineUpdate.data.receiptStatus).toBe('COMPLETE');
    expect(lineUpdate.data.qtyReceived).toBe('10.0000');

    expect(prisma.purchase.update).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('RECEIVED');
  });

  it('6. idempotency — status=RECEIVED returns purchase without creating movements', async () => {
    const prisma = mockPrisma();
    const receivedPurchase = makePurchase({ status: 'RECEIVED' });
    (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(receivedPurchase);
    const service = new PurchaseReceptionService(prisma as unknown as PrismaService);

    const result = await service.receive('tenant-1', 'pur-1', baseOptions);

    expect(result.status).toBe('RECEIVED');
    expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    expect(prisma.purchase.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('7. wrong status CANCELLED → PreconditionFailedException', async () => {
    const prisma = mockPrisma();
    (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(makePurchase({ status: 'CANCELLED' }));
    const service = new PurchaseReceptionService(prisma as unknown as PrismaService);

    await expect(service.receive('tenant-1', 'pur-1', baseOptions)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('8. line without catalogItemId — skip Kardex, still mark COMPLETE', async () => {
    const prisma = mockPrisma();
    const p = makePurchase({
      lineItems: [
        {
          ...makePurchase().lineItems[0],
          catalogItemId: null,
          catalogItem: null,
        },
      ],
    });
    (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(p);
    (prisma.purchase.update as jest.Mock).mockResolvedValue({ ...p, status: 'RECEIVED' });
    const service = new PurchaseReceptionService(prisma as unknown as PrismaService);

    const result = await service.receive('tenant-1', 'pur-1', baseOptions);

    expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    expect(prisma.inventoryState.upsert).not.toHaveBeenCalled();
    expect(prisma.purchaseLineItem.update).toHaveBeenCalledTimes(1);
    const lineUpdate = (prisma.purchaseLineItem.update as jest.Mock).mock.calls[0][0];
    expect(lineUpdate.data.receiptStatus).toBe('COMPLETE');
    expect(result.status).toBe('RECEIVED');
  });

  it('9. line with catalogItem.trackInventory=false — skip Kardex, still mark COMPLETE', async () => {
    const prisma = mockPrisma();
    const p = makePurchase({
      lineItems: [
        {
          ...makePurchase().lineItems[0],
          catalogItem: { id: 'cat-1', code: 'SERVICE-A', trackInventory: false },
        },
      ],
    });
    (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(p);
    (prisma.purchase.update as jest.Mock).mockResolvedValue({ ...p, status: 'RECEIVED' });
    const service = new PurchaseReceptionService(prisma as unknown as PrismaService);

    await service.receive('tenant-1', 'pur-1', baseOptions);

    expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    expect(prisma.inventoryState.upsert).not.toHaveBeenCalled();
  });

  it('10. multi-line same catalogItem — 2 Movements with consecutive correlativos, running weighted avg', async () => {
    const prisma = mockPrisma();
    const twoLinesSameItem = makePurchase({
      lineItems: [
        {
          id: 'line-1', tenantId: 'tenant-1', lineNumber: 1,
          catalogItemId: 'cat-1', description: 'A', quantity: '10.0000',
          unitPrice: '10.0000', unitCostPosted: '10.0000', taxCode: '20',
          taxAmount: '13.00', lineTotal: '113.00', qtyExpected: '10.0000',
          qtyReceived: '0', receiptStatus: 'PENDING',
          catalogItem: { id: 'cat-1', code: 'ITEM-A', trackInventory: true },
        },
        {
          id: 'line-2', tenantId: 'tenant-1', lineNumber: 2,
          catalogItemId: 'cat-1', description: 'A again', quantity: '5.0000',
          unitPrice: '20.0000', unitCostPosted: '20.0000', taxCode: '20',
          taxAmount: '13.00', lineTotal: '113.00', qtyExpected: '5.0000',
          qtyReceived: '0', receiptStatus: 'PENDING',
          catalogItem: { id: 'cat-1', code: 'ITEM-A', trackInventory: true },
        },
      ],
    });
    (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(twoLinesSameItem);
    (prisma.inventoryMovement.aggregate as jest.Mock).mockResolvedValue({ _max: { correlativo: 5 } }); // existing max 5
    (prisma.purchase.update as jest.Mock).mockResolvedValue({ ...twoLinesSameItem, status: 'RECEIVED' });
    const service = new PurchaseReceptionService(prisma as unknown as PrismaService);

    await service.receive('tenant-1', 'pur-1', baseOptions);

    expect(prisma.inventoryMovement.create).toHaveBeenCalledTimes(2);
    const calls = (prisma.inventoryMovement.create as jest.Mock).mock.calls;
    expect(calls[0][0].data.correlativo).toBe(6);  // MAX(5) + 1
    expect(calls[1][0].data.correlativo).toBe(7);  // next
    // First line: qty 10 @ 10 → newAvg 10 → balanceAvgCost '10.0000'
    expect(calls[0][0].data.balanceAvgCost).toBe('10.0000');
    expect(calls[0][0].data.balanceQty).toBe('10.0000');
    // Second line: 10 @ 10 + 5 @ 20 → (100 + 100) / 15 = 13.3333
    expect(calls[1][0].data.balanceQty).toBe('15.0000');
    expect(calls[1][0].data.balanceAvgCost).toBe('13.3333');

    expect(prisma.inventoryState.upsert).toHaveBeenCalledTimes(1); // one upsert per catalogItem, final state
  });

  it('returns NotFoundException when Purchase does not exist', async () => {
    const prisma = mockPrisma();
    (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(null);
    const service = new PurchaseReceptionService(prisma as unknown as PrismaService);

    await expect(service.receive('tenant-1', 'missing', baseOptions)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
