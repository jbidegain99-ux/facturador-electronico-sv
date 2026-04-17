import { DteCogsService } from './dte-cogs.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountingService } from '../../accounting/accounting.service';

// =========================================================================
// Mocks
// =========================================================================

type PrismaMock = {
  dTE: { findFirst: jest.Mock; findUnique: jest.Mock };
  quote: { findFirst: jest.Mock };
  catalogItem: { findUnique: jest.Mock };
  inventoryMovement: { findMany: jest.Mock; create: jest.Mock; aggregate: jest.Mock; updateMany: jest.Mock };
  inventoryState: { findUnique: jest.Mock; upsert: jest.Mock; update: jest.Mock };
  journalEntry: { findFirst: jest.Mock };
  accountingAccount: { findFirst: jest.Mock };
  $transaction: jest.Mock;
};

function mockPrisma(): PrismaMock {
  const p: PrismaMock = {
    dTE: { findFirst: jest.fn(), findUnique: jest.fn() },
    quote: { findFirst: jest.fn().mockResolvedValue(null) },
    catalogItem: { findUnique: jest.fn() },
    inventoryMovement: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation(({ data }) => ({ id: `mov-${Math.random()}`, ...data })),
      aggregate: jest.fn().mockResolvedValue({ _max: { correlativo: null } }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    inventoryState: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockImplementation(({ create }) => ({ id: `state-${Math.random()}`, ...create })),
      update: jest.fn().mockImplementation(({ data }) => ({ id: 'state-1', ...data })),
    },
    journalEntry: { findFirst: jest.fn().mockResolvedValue(null) },
    accountingAccount: {
      findFirst: jest.fn().mockImplementation(({ where }) => ({ id: `acc-${where.code}`, code: where.code, name: `Cuenta ${where.code}` })),
    },
    $transaction: jest.fn(async (fn) => fn(p)),
  };
  return p;
}

function makeDte(overrides: Record<string, unknown> = {}) {
  const base = {
    id: 'dte-1',
    tenantId: 'tenant-1',
    tipoDte: '03',
    numeroControl: 'DTE-03-AB12CD34-000000000000001',
    codigoGeneracion: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
    totalGravada: '100.00',
    totalIva: '13.00',
    totalPagar: '113.00',
    jsonOriginal: JSON.stringify({
      cuerpoDocumento: [
        { codigo: 'ITEM-001', cantidad: 10, precioUni: 10, descripcion: 'Producto A' },
      ],
    }),
  };
  return { ...base, ...overrides };
}

function makeService(prisma: PrismaMock) {
  const entryCreated = { id: 'entry-cogs-1', entryNumber: 'JE-COGS-1', status: 'DRAFT' };
  const entryPosted = { ...entryCreated, status: 'POSTED' };
  const accountingService = {
    createJournalEntry: jest.fn().mockResolvedValue(entryCreated),
    postJournalEntry: jest.fn().mockResolvedValue(entryPosted),
    voidJournalEntry: jest.fn().mockResolvedValue({ ...entryPosted, status: 'VOIDED' }),
  } as unknown as AccountingService;
  const service = new DteCogsService(prisma as unknown as PrismaService, accountingService);
  return { service, accountingService };
}

// =========================================================================
// Matcher tests (3)
// =========================================================================

describe('DteCogsService — matchDteLinesToCatalog', () => {
  it('1. DTE with quote walk-back → matched via quote', async () => {
    const prisma = mockPrisma();
    (prisma.dTE.findFirst as jest.Mock).mockResolvedValue(makeDte());
    (prisma.quote.findFirst as jest.Mock).mockResolvedValue({
      id: 'quote-1',
      dteId: 'dte-1',
      lineItems: [{ catalogItemId: 'cat-1', quantity: 10 }],
    });
    (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'cat-1', code: 'ITEM-001', trackInventory: true,
    });

    const { service } = makeService(prisma);
    const result = await service.generateCogsFromDte('dte-1', 'tenant-1', 'ON_APPROVED');

    // Assert at least 1 line matched via quote (first movement has notes with 'quote' in match source)
    expect(result.linesMatched).toBeGreaterThan(0);
    expect(prisma.inventoryMovement.create).toHaveBeenCalled();
    const movementCall = (prisma.inventoryMovement.create as jest.Mock).mock.calls[0][0];
    expect(movementCall.data.notes).toContain('quote');
  });

  it('2. DTE without quote, codigo in jsonOriginal → matched via codigo', async () => {
    const prisma = mockPrisma();
    (prisma.dTE.findFirst as jest.Mock).mockResolvedValue(makeDte());
    (prisma.quote.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'cat-1', code: 'ITEM-001', trackInventory: true,
    });

    const { service } = makeService(prisma);
    const result = await service.generateCogsFromDte('dte-1', 'tenant-1', 'ON_APPROVED');

    expect(result.linesMatched).toBeGreaterThan(0);
    const movementCall = (prisma.inventoryMovement.create as jest.Mock).mock.calls[0][0];
    expect(movementCall.data.notes).toContain('codigo');
  });

  it('3. DTE without quote and no matchable codes → warnings populated, empty matched', async () => {
    const prisma = mockPrisma();
    (prisma.dTE.findFirst as jest.Mock).mockResolvedValue(
      makeDte({ jsonOriginal: JSON.stringify({ cuerpoDocumento: [{ descripcion: 'No code' }] }) }),
    );
    (prisma.quote.findFirst as jest.Mock).mockResolvedValue(null);

    const { service } = makeService(prisma);
    const result = await service.generateCogsFromDte('dte-1', 'tenant-1', 'ON_APPROVED');

    expect(result.linesMatched).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.journalEntry).toBeNull();
  });
});

// =========================================================================
// generateCogsFromDte tests (5)
// =========================================================================

describe('DteCogsService.generateCogsFromDte', () => {
  it('4. Happy CCFE — creates Movement, decrements State, creates 2-line COGS asiento', async () => {
    const prisma = mockPrisma();
    (prisma.dTE.findFirst as jest.Mock).mockResolvedValue(makeDte());
    (prisma.quote.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'cat-1', code: 'ITEM-001', trackInventory: true,
    });
    (prisma.inventoryState.findUnique as jest.Mock).mockResolvedValue({
      currentQty: '50.0000',
      currentAvgCost: '7.0000',
      totalValue: '350.00',
    });

    const { service, accountingService } = makeService(prisma);
    const result = await service.generateCogsFromDte('dte-1', 'tenant-1', 'ON_APPROVED');

    expect(result.linesMatched).toBe(1);
    expect(result.linesTracked).toBe(1);

    // 1 InventoryMovement created with correct fields
    expect(prisma.inventoryMovement.create).toHaveBeenCalledTimes(1);
    const movCall = (prisma.inventoryMovement.create as jest.Mock).mock.calls[0][0];
    expect(movCall.data.movementType).toBe('SALIDA_VENTA');
    expect(movCall.data.qtyOut).toBe('10.0000');
    expect(movCall.data.qtyIn).toBe('0.0000');
    expect(movCall.data.unitCost).toBe('7.0000');  // avg cost at sale time
    expect(movCall.data.totalCost).toBe('70.00');
    expect(movCall.data.balanceQty).toBe('40.0000');  // 50 - 10
    expect(movCall.data.balanceAvgCost).toBe('7.0000');  // unchanged on sale
    expect(movCall.data.sourceType).toBe('DTE');
    expect(movCall.data.sourceId).toBe('dte-1');

    // InventoryState decremented
    expect(prisma.inventoryState.upsert).toHaveBeenCalled();
    const stateCall = (prisma.inventoryState.upsert as jest.Mock).mock.calls[0][0];
    expect(stateCall.update.currentQty).toBe('40.0000');

    // COGS asiento with 2 lines
    expect(accountingService.createJournalEntry).toHaveBeenCalled();
    const entryArgs = (accountingService.createJournalEntry as jest.Mock).mock.calls[0][1];
    expect(entryArgs.sourceType).toBe('DTE_COGS');
    expect(entryArgs.sourceDocumentId).toBe('dte-1');
    expect(entryArgs.lines).toHaveLength(2);
    const [debitLine, creditLine] = entryArgs.lines;
    expect(debitLine.debit).toBeCloseTo(70, 2);
    expect(debitLine.credit).toBe(0);
    expect(creditLine.credit).toBeCloseTo(70, 2);
    expect(creditLine.debit).toBe(0);
    expect(result.totalCogs).toBeCloseTo(70, 2);
    expect(result.journalEntry).toBeDefined();
  });

  it('5. Multi-line same catalogItem — consecutive correlativos, running stock correct', async () => {
    const prisma = mockPrisma();
    const multiLineDte = makeDte({
      jsonOriginal: JSON.stringify({
        cuerpoDocumento: [
          { codigo: 'ITEM-001', cantidad: 5, precioUni: 10 },
          { codigo: 'ITEM-001', cantidad: 3, precioUni: 10 },
        ],
      }),
    });
    (prisma.dTE.findFirst as jest.Mock).mockResolvedValue(multiLineDte);
    (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'cat-1', code: 'ITEM-001', trackInventory: true,
    });
    (prisma.inventoryState.findUnique as jest.Mock).mockResolvedValue({
      currentQty: '10.0000',
      currentAvgCost: '8.0000',
    });
    (prisma.inventoryMovement.aggregate as jest.Mock).mockResolvedValue({ _max: { correlativo: 3 } });

    const { service } = makeService(prisma);
    const result = await service.generateCogsFromDte('dte-1', 'tenant-1', 'ON_APPROVED');

    expect(prisma.inventoryMovement.create).toHaveBeenCalledTimes(2);
    const calls = (prisma.inventoryMovement.create as jest.Mock).mock.calls;
    expect(calls[0][0].data.correlativo).toBe(4);
    expect(calls[1][0].data.correlativo).toBe(5);
    expect(calls[0][0].data.balanceQty).toBe('5.0000');   // 10 - 5
    expect(calls[1][0].data.balanceQty).toBe('2.0000');   // 5 - 3
    expect(result.totalCogs).toBeCloseTo(64, 2);          // 5*8 + 3*8
  });

  it('6. Stock goes negative — warning logged, movement still created', async () => {
    const prisma = mockPrisma();
    (prisma.dTE.findFirst as jest.Mock).mockResolvedValue(makeDte());
    (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'cat-1', code: 'ITEM-001', trackInventory: true,
    });
    (prisma.inventoryState.findUnique as jest.Mock).mockResolvedValue({
      currentQty: '3.0000',  // only 3 in stock
      currentAvgCost: '7.0000',
    });

    const { service } = makeService(prisma);
    const result = await service.generateCogsFromDte('dte-1', 'tenant-1', 'ON_APPROVED');

    expect(result.warnings.some((w) => w.toLowerCase().includes('negative'))).toBe(true);
    expect(prisma.inventoryMovement.create).toHaveBeenCalledTimes(1);
    const movCall = (prisma.inventoryMovement.create as jest.Mock).mock.calls[0][0];
    expect(movCall.data.balanceQty).toBe('-7.0000');  // 3 - 10
  });

  it('7. Idempotency — second call returns isDuplicate with existing refs', async () => {
    const prisma = mockPrisma();
    (prisma.dTE.findFirst as jest.Mock).mockResolvedValue(makeDte());
    // Existing movements signal idempotency
    (prisma.inventoryMovement.findMany as jest.Mock).mockResolvedValue([
      { id: 'mov-existing', sourceId: 'dte-1', sourceType: 'DTE' },
    ]);
    (prisma.journalEntry.findFirst as jest.Mock).mockResolvedValue({
      id: 'entry-existing', status: 'POSTED',
    });

    const { service, accountingService } = makeService(prisma);
    const result = await service.generateCogsFromDte('dte-1', 'tenant-1', 'ON_APPROVED');

    expect(result.isDuplicate).toBe(true);
    expect(result.inventoryMovementsCreated).toHaveLength(1);
    expect(result.inventoryMovementsCreated[0].id).toBe('mov-existing');
    expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    expect(accountingService.createJournalEntry).not.toHaveBeenCalled();
  });

  it('8. Catalog match but trackInventory=false → skipped silently, no movement', async () => {
    const prisma = mockPrisma();
    (prisma.dTE.findFirst as jest.Mock).mockResolvedValue(makeDte());
    (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'cat-service-1', code: 'ITEM-001', trackInventory: false,  // service, not inventory
    });

    const { service, accountingService } = makeService(prisma);
    const result = await service.generateCogsFromDte('dte-1', 'tenant-1', 'ON_APPROVED');

    expect(result.linesMatched).toBe(1);
    expect(result.linesTracked).toBe(0);  // skipped
    expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    expect(accountingService.createJournalEntry).not.toHaveBeenCalled();
    expect(result.journalEntry).toBeNull();
    expect(result.warnings.some((w) => w.toLowerCase().includes('trackinventory'))).toBe(true);
  });
});

// =========================================================================
// reverseCogsFromDte tests (2)
// =========================================================================

describe('DteCogsService.reverseCogsFromDte', () => {
  it('9. Happy — reverses SALIDA_VENTA, creates ENTRADA_DEVOLUCION_VENTA, voids asiento', async () => {
    const prisma = mockPrisma();
    (prisma.journalEntry.findFirst as jest.Mock).mockResolvedValue({
      id: 'entry-cogs-1', status: 'POSTED',
    });
    (prisma.inventoryMovement.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'mov-1', tenantId: 'tenant-1', catalogItemId: 'cat-1',
        qtyOut: '10.0000', qtyIn: '0.0000',
        unitCost: '7.0000', totalCost: '70.00',
        balanceAvgCost: '7.0000',
        documentType: '03', documentNumber: 'DTE-03-AB',
        sourceType: 'DTE', sourceId: 'dte-1', movementType: 'SALIDA_VENTA',
      },
    ]);
    (prisma.inventoryState.findUnique as jest.Mock).mockResolvedValue({
      currentQty: '40.0000', currentAvgCost: '7.0000',
    });

    const { service, accountingService } = makeService(prisma);
    const result = await service.reverseCogsFromDte('dte-1', 'tenant-1');

    expect(result.journalEntryVoided).toBe('entry-cogs-1');
    expect(result.inventoryMovementsReversed).toBe(1);
    expect(prisma.inventoryMovement.create).toHaveBeenCalledTimes(1);
    const compCall = (prisma.inventoryMovement.create as jest.Mock).mock.calls[0][0];
    expect(compCall.data.movementType).toBe('ENTRADA_DEVOLUCION_VENTA');
    expect(compCall.data.qtyIn).toBe('10.0000');
    expect(compCall.data.qtyOut).toBe('0.0000');
    expect(accountingService.voidJournalEntry).toHaveBeenCalledWith('tenant-1', 'entry-cogs-1', 'system', expect.any(String));
  });

  it('10. No COGS entry exists → returns empty result, no throw', async () => {
    const prisma = mockPrisma();
    (prisma.journalEntry.findFirst as jest.Mock).mockResolvedValue(null);

    const { service, accountingService } = makeService(prisma);
    const result = await service.reverseCogsFromDte('dte-1', 'tenant-1');

    expect(result.journalEntryVoided).toBeNull();
    expect(result.inventoryMovementsReversed).toBe(0);
    expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    expect(accountingService.voidJournalEntry).not.toHaveBeenCalled();
  });
});
