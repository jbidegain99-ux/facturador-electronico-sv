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
});
