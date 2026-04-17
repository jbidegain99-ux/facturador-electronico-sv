import { AccountingAutomationService } from './accounting-automation.service';
import { AccountingService, JournalEntryWithLines } from './accounting.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService, MockPrismaClient } from '../../test/helpers/mock-prisma';

describe('AccountingAutomationService', () => {
  let service: AccountingAutomationService;
  let accountingService: AccountingService;
  let prisma: MockPrismaClient;

  const tenantId = 'tenant-1';
  const dteId = 'dte-1';

  const mockDte = {
    id: dteId,
    tenantId,
    tipoDte: '01',
    codigoGeneracion: 'uuid-123',
    numeroControl: 'DTE-01-M001P001-000000000000001',
    jsonOriginal: JSON.stringify({
      identificacion: { condicionOperacion: 1 },
    }),
    totalGravada: 100,
    totalIva: 13,
    totalPagar: 113,
    estado: 'PROCESADO',
  };

  const mockCajaAccount = {
    id: 'acc-caja',
    name: 'Caja General',
    code: '110101',
    isActive: true,
    allowsPosting: true,
    normalBalance: 'DEBIT',
  };

  const mockVentasAccount = {
    id: 'acc-ventas',
    name: 'Ventas',
    code: '4101',
    isActive: true,
    allowsPosting: true,
    normalBalance: 'CREDIT',
  };

  const mockIvaAccount = {
    id: 'acc-iva',
    name: 'IVA Débito Fiscal',
    code: '210201',
    isActive: true,
    allowsPosting: true,
    normalBalance: 'CREDIT',
  };

  const mockMappingRule = {
    id: 'rule-1',
    tenantId,
    operation: 'VENTA_CONTADO',
    description: 'Venta al contado',
    debitAccountId: mockCajaAccount.id,
    creditAccountId: mockVentasAccount.id,
    debitAccount: { id: mockCajaAccount.id, code: mockCajaAccount.code, name: mockCajaAccount.name },
    creditAccount: { id: mockVentasAccount.id, code: mockVentasAccount.code, name: mockVentasAccount.name },
    isActive: true,
    mappingConfig: JSON.stringify({
      debe: [{ cuenta: '110101', monto: 'total', descripcion: 'Caja General' }],
      haber: [
        { cuenta: '4101', monto: 'subtotal', descripcion: 'Ventas' },
        { cuenta: '210201', monto: 'iva', descripcion: 'IVA Débito Fiscal' },
      ],
    }),
  };

  const mockJournalEntry: JournalEntryWithLines = {
    id: 'entry-1',
    tenantId,
    entryNumber: 'PDA-2026-000001',
    entryDate: new Date(),
    description: 'Factura DTE-01-M001P001-000000000000001 - Auto',
    status: 'DRAFT',
    entryType: 'AUTOMATIC',
    sourceType: 'DTE',
    sourceDocumentId: dteId,
    totalDebit: 113 as unknown as import('@prisma/client').Prisma.Decimal,
    totalCredit: 113 as unknown as import('@prisma/client').Prisma.Decimal,
    fiscalYear: 2026,
    fiscalMonth: 3,
    postedAt: null,
    postedBy: null,
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lines: [
      { id: 'line-1', accountId: mockCajaAccount.id, description: 'Factura - Caja General', debit: 113, credit: 0, lineNumber: 1, account: { id: mockCajaAccount.id, code: '110101', name: 'Caja General' } },
      { id: 'line-2', accountId: mockVentasAccount.id, description: 'Factura - Ventas', debit: 0, credit: 100, lineNumber: 2, account: { id: mockVentasAccount.id, code: '4101', name: 'Ventas' } },
      { id: 'line-3', accountId: mockIvaAccount.id, description: 'Factura - IVA Débito Fiscal', debit: 0, credit: 13, lineNumber: 3, account: { id: mockIvaAccount.id, code: '210201', name: 'IVA Débito Fiscal' } },
    ],
  };

  const mockPostedEntry: JournalEntryWithLines = {
    ...mockJournalEntry,
    status: 'POSTED',
    postedAt: new Date(),
    postedBy: 'system',
  };

  beforeEach(() => {
    prisma = createMockPrismaService();
    accountingService = new AccountingService(prisma as unknown as PrismaService);

    // Mock accountingService methods we depend on
    jest.spyOn(accountingService, 'createJournalEntry').mockResolvedValue(mockJournalEntry);
    jest.spyOn(accountingService, 'postJournalEntry').mockResolvedValue(mockPostedEntry);
    jest.spyOn(accountingService, 'voidJournalEntry').mockResolvedValue({
      ...mockPostedEntry,
      status: 'VOIDED',
      voidedAt: new Date(),
      voidedBy: 'system',
      voidReason: 'Anulación de DTE',
    });

    service = new AccountingAutomationService(
      prisma as unknown as PrismaService,
      accountingService,
    );
  });

  describe('generateFromDTE', () => {
    /** Set up mocks for the standard "enabled tenant, DTE found, no existing entry" path. */
    function setupEnabledTenantMocks(dteOverride?: Record<string, unknown>) {
      prisma.tenant.findUnique.mockResolvedValue({
        autoJournalEnabled: true,
        autoJournalTrigger: 'ON_APPROVED',
      });
      prisma.dTE.findFirst.mockResolvedValue(dteOverride ?? mockDte);
      prisma.journalEntry.findFirst.mockResolvedValue(null);
    }

    it('should return null if autoJournalEnabled is false', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        autoJournalEnabled: false,
        autoJournalTrigger: 'ON_APPROVED',
      });

      const result = await service.generateFromDTE(dteId, tenantId, 'ON_APPROVED');
      expect(result).toBeNull();
    });

    it('should return null if trigger does not match tenant config', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        autoJournalEnabled: true,
        autoJournalTrigger: 'ON_APPROVED',
      });

      const result = await service.generateFromDTE(dteId, tenantId, 'ON_CREATED');
      expect(result).toBeNull();
    });

    it('should return null if DTE is not found', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        autoJournalEnabled: true,
        autoJournalTrigger: 'ON_APPROVED',
      });
      prisma.dTE.findFirst.mockResolvedValue(null);

      const result = await service.generateFromDTE(dteId, tenantId, 'ON_APPROVED');
      expect(result).toBeNull();
    });

    it('should not generate duplicate entries', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        autoJournalEnabled: true,
        autoJournalTrigger: 'ON_APPROVED',
      });
      prisma.dTE.findFirst.mockResolvedValue(mockDte);
      prisma.journalEntry.findFirst.mockResolvedValue({ id: 'existing-entry', entryNumber: 'PDA-2026-000001' });

      const result = await service.generateFromDTE(dteId, tenantId, 'ON_APPROVED');
      expect(result).toBeNull();
    });

    it('should return null if no mapping rule exists', async () => {
      setupEnabledTenantMocks();
      prisma.accountMappingRule.findFirst.mockResolvedValue(null);

      const result = await service.generateFromDTE(dteId, tenantId, 'ON_APPROVED');
      expect(result).toBeNull();
    });

    it('should generate a 3-line entry for factura contado with mappingConfig', async () => {
      setupEnabledTenantMocks();
      prisma.accountMappingRule.findFirst.mockResolvedValue(mockMappingRule);
      prisma.accountingAccount.findUnique
        .mockResolvedValueOnce(mockCajaAccount)   // 110101 debit
        .mockResolvedValueOnce(mockVentasAccount)  // 4101 credit
        .mockResolvedValueOnce(mockIvaAccount);    // 210201 credit

      const result = await service.generateFromDTE(dteId, tenantId, 'ON_APPROVED');

      expect(result).not.toBeNull();
      expect(accountingService.createJournalEntry).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          entryType: 'AUTOMATIC',
          sourceType: 'DTE',
          sourceDocumentId: dteId,
          lines: expect.arrayContaining([
            expect.objectContaining({ debit: 113, credit: 0 }),
            expect.objectContaining({ debit: 0, credit: 100 }),
            expect.objectContaining({ debit: 0, credit: 13 }),
          ]),
        }),
      );
      expect(accountingService.postJournalEntry).toHaveBeenCalledWith(tenantId, 'entry-1', 'system');
    });

    it('should use simple lines (2) when no mappingConfig', async () => {
      const ruleNoConfig = { ...mockMappingRule, mappingConfig: null };
      setupEnabledTenantMocks();
      prisma.accountMappingRule.findFirst.mockResolvedValue(ruleNoConfig);

      const result = await service.generateFromDTE(dteId, tenantId, 'ON_APPROVED');

      expect(result).not.toBeNull();
      expect(accountingService.createJournalEntry).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          lines: [
            expect.objectContaining({ accountId: mockCajaAccount.id, debit: 113, credit: 0 }),
            expect.objectContaining({ accountId: mockVentasAccount.id, debit: 0, credit: 113 }),
          ],
        }),
      );
    });

    // Data-driven tests for DTE type -> operation mapping
    const operationTests: { tipoDte: string; expectedOp: string; label: string; dteOverride?: Record<string, unknown> }[] = [
      {
        tipoDte: '01',
        expectedOp: 'VENTA_CREDITO',
        label: 'factura with condicionOperacion=2',
        dteOverride: {
          ...mockDte,
          jsonOriginal: JSON.stringify({ identificacion: { condicionOperacion: 2 } }),
        },
      },
      { tipoDte: '05', expectedOp: 'NOTA_CREDITO', label: 'tipoDte=05' },
      { tipoDte: '03', expectedOp: 'CREDITO_FISCAL', label: 'tipoDte=03' },
      { tipoDte: '06', expectedOp: 'NOTA_DEBITO', label: 'tipoDte=06' },
      { tipoDte: '07', expectedOp: 'RETENCION', label: 'tipoDte=07' },
      { tipoDte: '14', expectedOp: 'SUJETO_EXCLUIDO', label: 'tipoDte=14' },
    ];

    it.each(operationTests)(
      'should determine $expectedOp for $label',
      async ({ tipoDte, expectedOp, dteOverride }) => {
        const dte = dteOverride ?? { ...mockDte, tipoDte };
        setupEnabledTenantMocks(dte);
        prisma.accountMappingRule.findFirst.mockResolvedValue(null);

        await service.generateFromDTE(dteId, tenantId, 'ON_APPROVED');

        expect(prisma.accountMappingRule.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ operation: expectedOp }),
          }),
        );
      },
    );
  });

  describe('generateFromPurchase', () => {
    const purchaseId = 'purchase-1';
    const mockPurchase = {
      id: purchaseId,
      tenantId,
      documentType: 'CCFE',
      documentNumber: 'DTE-03-AB12CD34-000000000000001',
      purchaseNumber: 'PUR-tenant-001',
      purchaseDate: new Date('2026-04-15'),
      subtotal: '100.00',
      ivaAmount: '13.00',
      totalAmount: '113.00',
      retentionAmount: '0',
      status: 'DRAFT',
    };

    const mockMappingRule = {
      id: 'rule-ccfe',
      operation: 'COMPRA_CCFE',
      isActive: true,
      debitAccountId: 'acc-inv',
      creditAccountId: 'acc-cxp',
      mappingConfig: JSON.stringify({
        debe: [
          { cuenta: '110401', monto: 'subtotal', descripcion: 'Inventario Mercadería' },
          { cuenta: '110303', monto: 'iva', descripcion: 'IVA Crédito Fiscal' },
        ],
        haber: [
          { cuenta: '210101', monto: 'total', descripcion: 'Proveedores' },
        ],
      }),
      debitAccount: { id: 'acc-inv', code: '110401', name: 'Inventario Mercadería' },
      creditAccount: { id: 'acc-cxp', code: '210101', name: 'Proveedores' },
    };

    beforeEach(() => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
        autoJournalEnabled: true,
        autoJournalTrigger: 'ON_PURCHASE_CREATED',
      });
      (prisma.purchase as unknown as { findFirst: jest.Mock }).findFirst = jest.fn().mockResolvedValue(mockPurchase);
      (prisma.journalEntry.findFirst as jest.Mock).mockResolvedValue(null); // no existing
      (prisma.accountMappingRule.findFirst as jest.Mock).mockResolvedValue(mockMappingRule);
      (prisma.purchase as unknown as { update: jest.Mock }).update = jest.fn().mockResolvedValue(mockPurchase);
    });

    it('creates and posts asiento for CCFE purchase', async () => {
      const result = await service.generateFromPurchase(purchaseId, tenantId, 'ON_PURCHASE_CREATED');

      expect(result).toBeDefined();
      expect(prisma.accountMappingRule.findFirst).toHaveBeenCalledWith({
        where: { tenantId, operation: 'COMPRA_CCFE', isActive: true },
        include: {
          debitAccount: { select: { id: true, code: true, name: true } },
          creditAccount: { select: { id: true, code: true, name: true } },
        },
      });
    });

    it('returns null when no mapping rule exists for operation', async () => {
      (prisma.accountMappingRule.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await service.generateFromPurchase(purchaseId, tenantId, 'ON_PURCHASE_CREATED');
      expect(result).toBeNull();
    });

    it('returns null when Purchase not found', async () => {
      (prisma.purchase as unknown as { findFirst: jest.Mock }).findFirst = jest.fn().mockResolvedValue(null);
      const result = await service.generateFromPurchase('missing-id', tenantId, 'ON_PURCHASE_CREATED');
      expect(result).toBeNull();
    });

    it('returns null when duplicate journal entry already exists for this Purchase', async () => {
      (prisma.journalEntry.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-entry',
        entryNumber: 'JE-001',
        status: 'POSTED',
      });
      const result = await service.generateFromPurchase(purchaseId, tenantId, 'ON_PURCHASE_CREATED');
      expect(result).toBeNull();
    });
  });

  describe('reverseFromDTE', () => {
    it('should void existing posted journal entry on DTE annulment', async () => {
      prisma.journalEntry.findFirst.mockResolvedValue({
        id: 'entry-1',
        status: 'POSTED',
      });

      const result = await service.reverseFromDTE(dteId, tenantId);

      expect(result).not.toBeNull();
      expect(accountingService.voidJournalEntry).toHaveBeenCalledWith(
        tenantId,
        'entry-1',
        'system',
        'Anulación de DTE',
      );
    });

    it('should return null if no posted entry exists', async () => {
      prisma.journalEntry.findFirst.mockResolvedValue(null);

      const result = await service.reverseFromDTE(dteId, tenantId);

      expect(result).toBeNull();
      expect(accountingService.voidJournalEntry).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Fase 1.5b — Retention leg extension
  // =========================================================================

  describe('resolveAmount — retention extensions (Fase 1.5b)', () => {
    // Access private method via bracket notation
    const svcAny = () => service as unknown as { resolveAmount: (key: string, a: { totalPagar: number; totalGravada: number; totalIva: number; retention: number }) => number };

    const amounts = {
      totalPagar: 113,
      totalGravada: 100,
      totalIva: 13,
      retention: 1.3,
    };

    it('1. resolveAmount("retention") returns amounts.retention', () => {
      expect(svcAny().resolveAmount('retention', amounts)).toBe(1.3);
    });

    it('2. resolveAmount("totalMinusRetention") returns totalPagar - retention', () => {
      expect(svcAny().resolveAmount('totalMinusRetention', amounts)).toBeCloseTo(111.7, 4);
    });

    it('3. resolveAmount existing keys unchanged (regression)', () => {
      expect(svcAny().resolveAmount('total', amounts)).toBe(113);
      expect(svcAny().resolveAmount('subtotal', amounts)).toBe(100);
      expect(svcAny().resolveAmount('iva', amounts)).toBe(13);
    });

    it('4. resolveAmount with unknown key returns 0', () => {
      expect(svcAny().resolveAmount('unknown_key', amounts)).toBe(0);
    });
  });

  describe('buildMultiLines — zero-amount filter (Fase 1.5b)', () => {
    it('5. drops lines where debit=0 AND credit=0', async () => {
      // Access private buildMultiLines via bracket notation
      const svcAny = service as unknown as {
        buildMultiLines: (tenantId: string, json: string, amounts: { totalPagar: number; totalGravada: number; totalIva: number; retention: number }, tipoDte: string) => Promise<Array<{ accountId: string; description: string; debit: number; credit: number }>>;
      };

      // Mock accountingAccount lookup to return valid accounts so buildMultiLines completes
      (prisma.accountingAccount.findFirst as jest.Mock).mockImplementation(({ where }: { where: { code: string; tenantId: string } }) => {
        return Promise.resolve({ id: `acc-${where.code}`, code: where.code, name: `Cuenta ${where.code}` });
      });

      // mappingConfig with one line that resolves to retention=0 and should be filtered
      const mappingConfig = JSON.stringify({
        debe: [{ cuenta: '100', monto: 'subtotal', descripcion: 'Inv' }],
        haber: [
          { cuenta: '200', monto: 'totalMinusRetention', descripcion: 'Prov' },
          { cuenta: '300', monto: 'retention', descripcion: 'Ret' },  // resolves to 0
        ],
      });

      const amounts = { totalPagar: 113, totalGravada: 100, totalIva: 13, retention: 0 };
      const lines = await svcAny.buildMultiLines(tenantId, mappingConfig, amounts, '03');

      // Should have 2 lines: Inv (debit 100) + Prov (credit 113). Retention line dropped.
      expect(lines).toHaveLength(2);
      const codes = lines.map((l) => l.accountId);
      expect(codes).toContain('acc-100');
      expect(codes).toContain('acc-200');
      expect(codes).not.toContain('acc-300');
    });
  });

  describe('generateFromPurchase — retention integration (Fase 1.5b)', () => {
    const purchaseId = 'purchase-ret-1';

    const mockPurchaseWithRetention = {
      id: purchaseId,
      tenantId,
      documentType: 'CCFE',
      documentNumber: 'DTE-03-AB12CD34-000000000000001',
      purchaseNumber: 'PUR-tenant-002',
      purchaseDate: new Date('2026-04-15'),
      subtotal: '100.00',
      ivaAmount: '13.00',
      totalAmount: '113.00',
      retentionAmount: '5.00',  // <-- retention > 0
      status: 'DRAFT',
    };

    const mockMappingRuleWithRetention = {
      id: 'rule-ccfe-v2',
      operation: 'COMPRA_CCFE',
      isActive: true,
      debitAccountId: 'acc-inv',
      creditAccountId: 'acc-cxp',
      mappingConfig: JSON.stringify({
        debe: [
          { cuenta: '110401', monto: 'subtotal', descripcion: 'Inventario Mercadería' },
          { cuenta: '110303', monto: 'iva', descripcion: 'IVA Crédito Fiscal' },
        ],
        haber: [
          { cuenta: '210101', monto: 'totalMinusRetention', descripcion: 'Proveedores Locales' },
          { cuenta: '210205', monto: 'retention', descripcion: 'IVA Retenido por Pagar' },
        ],
      }),
      debitAccount: { id: 'acc-inv', code: '110401', name: 'Inventario Mercadería' },
      creditAccount: { id: 'acc-cxp', code: '210101', name: 'Proveedores Locales' },
    };

    it('6. CCFE with retentionAmount=5 — asiento has 4 lines, balance OK', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
        autoJournalEnabled: true,
        autoJournalTrigger: 'ON_PURCHASE_CREATED',
      });
      (prisma.purchase as unknown as { findFirst: jest.Mock }).findFirst = jest.fn().mockResolvedValue(mockPurchaseWithRetention);
      (prisma.journalEntry.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.accountMappingRule.findFirst as jest.Mock).mockResolvedValue(mockMappingRuleWithRetention);
      (prisma.accountingAccount.findFirst as jest.Mock).mockImplementation(({ where }: { where: { code: string } }) => {
        return Promise.resolve({ id: `acc-${where.code}`, code: where.code, name: `Cuenta ${where.code}` });
      });
      (prisma.purchase as unknown as { update: jest.Mock }).update = jest.fn().mockResolvedValue(mockPurchaseWithRetention);

      const result = await service.generateFromPurchase(purchaseId, tenantId, 'ON_PURCHASE_CREATED');

      // createJournalEntry should be called with 4 lines
      const createCall = (accountingService.createJournalEntry as jest.Mock).mock.calls[0];
      const lines = createCall[1].lines;
      expect(lines).toHaveLength(4);

      // Verify balance
      const totalDebit = lines.reduce((s: number, l: { debit: number }) => s + l.debit, 0);
      const totalCredit = lines.reduce((s: number, l: { credit: number }) => s + l.credit, 0);
      expect(totalDebit).toBeCloseTo(113, 2);
      expect(totalCredit).toBeCloseTo(113, 2);

      // Verify retention leg specifically: credit 210205 = 5
      const retentionLine = lines.find((l: { accountId: string }) => l.accountId === 'acc-210205');
      expect(retentionLine).toBeDefined();
      expect(retentionLine.credit).toBeCloseTo(5, 2);
      expect(retentionLine.debit).toBe(0);

      // Verify Proveedores reduced: 113 - 5 = 108
      const proveedoresLine = lines.find((l: { accountId: string }) => l.accountId === 'acc-210101');
      expect(proveedoresLine.credit).toBeCloseTo(108, 2);

      expect(result).toBeDefined();
    });
  });
});
