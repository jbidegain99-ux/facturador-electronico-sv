import { AccountingService } from './accounting.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService, MockPrismaClient } from '../../test/helpers/mock-prisma';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EL_SALVADOR_CHART_OF_ACCOUNTS } from './chart-of-accounts.data';

describe('AccountingService', () => {
  let service: AccountingService;
  let prisma: MockPrismaClient;

  const tenantId = 'tenant-1';

  const mockAccount = {
    id: 'acc-1',
    tenantId,
    code: '1101.01',
    name: 'Efectivo en Caja',
    level: 4,
    accountType: 'ASSET',
    normalBalance: 'DEBIT',
    allowsPosting: true,
    isActive: true,
    isSystem: true,
    currentBalance: 0,
    description: null,
    parentId: 'acc-parent',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAccount2 = {
    ...mockAccount,
    id: 'acc-2',
    code: '2101.01',
    name: 'Proveedores',
    accountType: 'LIABILITY',
    normalBalance: 'CREDIT',
  };

  beforeEach(() => {
    prisma = createMockPrismaService();
    service = new AccountingService(prisma as unknown as PrismaService);
  });

  // ================================================================
  // CHART OF ACCOUNTS - SEED
  // ================================================================

  describe('seedChartOfAccounts', () => {
    it('should seed accounts when none exist', async () => {
      prisma.accountingAccount.count.mockResolvedValue(0);
      let createCallIndex = 0;
      prisma.accountingAccount.create.mockImplementation(() => {
        createCallIndex++;
        return Promise.resolve({ id: `acc-${createCallIndex}` });
      });
      prisma.accountingAccount.update.mockResolvedValue({});

      const result = await service.seedChartOfAccounts(tenantId);

      expect(result.created).toBe(EL_SALVADOR_CHART_OF_ACCOUNTS.length);
      expect(prisma.accountingAccount.create).toHaveBeenCalledTimes(
        EL_SALVADOR_CHART_OF_ACCOUNTS.length,
      );
    });

    it('should skip seeding when accounts already exist', async () => {
      prisma.accountingAccount.count.mockResolvedValue(50);

      const result = await service.seedChartOfAccounts(tenantId);

      expect(result.created).toBe(0);
      expect(prisma.accountingAccount.create).not.toHaveBeenCalled();
    });
  });

  // ================================================================
  // CHART OF ACCOUNTS - CRUD
  // ================================================================

  describe('getChartOfAccounts', () => {
    it('should return tree structure', async () => {
      const parent = { ...mockAccount, id: 'parent-1', code: '11', parentId: null, level: 2 };
      const child = { ...mockAccount, id: 'child-1', code: '1101', parentId: 'parent-1', level: 3 };
      prisma.accountingAccount.findMany.mockResolvedValue([parent, child]);

      const result = await service.getChartOfAccounts(tenantId);

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children![0].id).toBe('child-1');
    });
  });

  describe('getAccountsList', () => {
    it('should return flat list of active accounts', async () => {
      prisma.accountingAccount.findMany.mockResolvedValue([mockAccount]);

      const result = await service.getAccountsList(tenantId);

      expect(result).toHaveLength(1);
      expect(prisma.accountingAccount.findMany).toHaveBeenCalledWith({
        where: { tenantId, isActive: true },
        orderBy: { code: 'asc' },
      });
    });
  });

  describe('getPostableAccounts', () => {
    it('should return only postable accounts', async () => {
      prisma.accountingAccount.findMany.mockResolvedValue([mockAccount]);

      const result = await service.getPostableAccounts(tenantId);

      expect(result).toHaveLength(1);
      expect(prisma.accountingAccount.findMany).toHaveBeenCalledWith({
        where: { tenantId, isActive: true, allowsPosting: true },
        orderBy: { code: 'asc' },
      });
    });
  });

  describe('createAccount', () => {
    it('should create a new account', async () => {
      prisma.accountingAccount.findUnique.mockResolvedValue(null);
      prisma.accountingAccount.create.mockResolvedValue(mockAccount);

      const result = await service.createAccount(tenantId, {
        code: '1101.01',
        name: 'Efectivo en Caja',
        level: 4,
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        allowsPosting: true,
      });

      expect(result).toEqual(mockAccount);
      expect(prisma.accountingAccount.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if code already exists', async () => {
      prisma.accountingAccount.findUnique.mockResolvedValue(mockAccount);

      await expect(
        service.createAccount(tenantId, {
          code: '1101.01',
          name: 'Duplicate',
          level: 4,
          accountType: 'ASSET',
          normalBalance: 'DEBIT',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if parent does not exist', async () => {
      prisma.accountingAccount.findUnique.mockResolvedValue(null);
      prisma.accountingAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.createAccount(tenantId, {
          code: '1101.02',
          name: 'New Sub',
          level: 4,
          accountType: 'ASSET',
          normalBalance: 'DEBIT',
          parentId: 'non-existent',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAccount', () => {
    it('should update an existing account', async () => {
      prisma.accountingAccount.findFirst.mockResolvedValue(mockAccount);
      const updated = { ...mockAccount, name: 'Updated Name' };
      prisma.accountingAccount.update.mockResolvedValue(updated);

      const result = await service.updateAccount(tenantId, 'acc-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException if account not found', async () => {
      prisma.accountingAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAccount(tenantId, 'non-existent', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate code', async () => {
      prisma.accountingAccount.findFirst.mockResolvedValue(mockAccount);
      prisma.accountingAccount.findUnique.mockResolvedValue({ ...mockAccount, id: 'other' });

      await expect(
        service.updateAccount(tenantId, 'acc-1', { code: '2101.01' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('toggleAccountActive', () => {
    it('should toggle account active status', async () => {
      prisma.accountingAccount.findFirst.mockResolvedValue({ ...mockAccount, isActive: true });
      prisma.journalEntryLine.count.mockResolvedValue(0);
      prisma.accountingAccount.update.mockResolvedValue({ ...mockAccount, isActive: false });

      const result = await service.toggleAccountActive(tenantId, 'acc-1');

      expect(result.isActive).toBe(false);
      expect(prisma.accountingAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      prisma.accountingAccount.findFirst.mockResolvedValue(null);

      await expect(service.toggleAccountActive(tenantId, 'x')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if account has posted entries', async () => {
      prisma.accountingAccount.findFirst.mockResolvedValue({ ...mockAccount, isActive: true });
      prisma.journalEntryLine.count.mockResolvedValue(5);

      await expect(
        service.toggleAccountActive(tenantId, 'acc-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ================================================================
  // JOURNAL ENTRIES
  // ================================================================

  describe('createJournalEntry', () => {
    const validDto = {
      entryDate: '2025-06-15',
      description: 'Test Entry',
      lines: [
        { accountId: 'acc-1', description: 'Debit line', debit: 100, credit: 0 },
        { accountId: 'acc-2', description: 'Credit line', debit: 0, credit: 100 },
      ],
    };

    beforeEach(() => {
      prisma.accountingAccount.findMany.mockResolvedValue([mockAccount, mockAccount2]);
      prisma.journalEntry.findFirst.mockResolvedValue(null); // for generateEntryNumber
      prisma.journalEntry.create.mockResolvedValue({
        id: 'entry-1',
        tenantId,
        entryNumber: 'PDA-2025-000001',
        entryDate: new Date('2025-06-15'),
        description: 'Test Entry',
        status: 'DRAFT',
        entryType: 'MANUAL',
        totalDebit: 100,
        totalCredit: 100,
        lines: [
          { id: 'line-1', accountId: 'acc-1', description: 'Debit line', debit: 100, credit: 0, lineNumber: 1, account: { id: 'acc-1', code: '1101.01', name: 'Efectivo en Caja' } },
          { id: 'line-2', accountId: 'acc-2', description: 'Credit line', debit: 0, credit: 100, lineNumber: 2, account: { id: 'acc-2', code: '2101.01', name: 'Proveedores' } },
        ],
      });
    });

    it('should create a balanced journal entry', async () => {
      const result = await service.createJournalEntry(tenantId, validDto, 'user-1');

      expect(result.entryNumber).toBe('PDA-2025-000001');
      expect(prisma.journalEntry.create).toHaveBeenCalled();
    });

    it('should reject unbalanced entry', async () => {
      await expect(
        service.createJournalEntry(tenantId, {
          entryDate: '2025-06-15',
          description: 'Bad entry',
          lines: [
            { accountId: 'acc-1', description: 'Debit', debit: 100, credit: 0 },
            { accountId: 'acc-2', description: 'Credit', debit: 0, credit: 50 },
          ],
        }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject entry with zero amounts', async () => {
      await expect(
        service.createJournalEntry(tenantId, {
          entryDate: '2025-06-15',
          description: 'Zero entry',
          lines: [
            { accountId: 'acc-1', description: 'Zero', debit: 0, credit: 0 },
            { accountId: 'acc-2', description: 'Zero', debit: 0, credit: 0 },
          ],
        }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject line with both debit and credit', async () => {
      await expect(
        service.createJournalEntry(tenantId, {
          entryDate: '2025-06-15',
          description: 'Both',
          lines: [
            { accountId: 'acc-1', description: 'Both', debit: 100, credit: 50 },
            { accountId: 'acc-2', description: 'Credit', debit: 0, credit: 50 },
          ],
        }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if account does not allow posting', async () => {
      prisma.accountingAccount.findMany.mockResolvedValue([
        { ...mockAccount, allowsPosting: false },
        mockAccount2,
      ]);

      await expect(
        service.createJournalEntry(tenantId, validDto, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if account is inactive', async () => {
      prisma.accountingAccount.findMany.mockResolvedValue([
        { ...mockAccount, isActive: false },
        mockAccount2,
      ]);

      await expect(
        service.createJournalEntry(tenantId, validDto, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getJournalEntries', () => {
    it('should return paginated entries', async () => {
      const mockEntries = [{ id: 'entry-1', entryNumber: 'PDA-2025-000001' }];
      prisma.journalEntry.findMany.mockResolvedValue(mockEntries);
      prisma.journalEntry.count.mockResolvedValue(1);

      const result = await service.getJournalEntries(tenantId, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should apply status filter', async () => {
      prisma.journalEntry.findMany.mockResolvedValue([]);
      prisma.journalEntry.count.mockResolvedValue(0);

      await service.getJournalEntries(tenantId, { status: 'POSTED' });

      expect(prisma.journalEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId, status: 'POSTED' }),
        }),
      );
    });
  });

  describe('getJournalEntry', () => {
    it('should return entry with lines', async () => {
      const entry = {
        id: 'entry-1',
        tenantId,
        entryNumber: 'PDA-2025-000001',
        status: 'DRAFT',
        lines: [],
      };
      prisma.journalEntry.findFirst.mockResolvedValue(entry);

      const result = await service.getJournalEntry(tenantId, 'entry-1');

      expect(result.id).toBe('entry-1');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.journalEntry.findFirst.mockResolvedValue(null);

      await expect(
        service.getJournalEntry(tenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('postJournalEntry', () => {
    const draftEntry = {
      id: 'entry-1',
      tenantId,
      entryNumber: 'PDA-2025-000001',
      status: 'DRAFT',
      lines: [
        { id: 'line-1', accountId: 'acc-1', debit: 100, credit: 0, account: { id: 'acc-1', code: '1101.01', name: 'Efectivo' } },
        { id: 'line-2', accountId: 'acc-2', debit: 0, credit: 100, account: { id: 'acc-2', code: '2101.01', name: 'Proveedores' } },
      ],
    };

    it('should post a DRAFT entry and update balances', async () => {
      prisma.journalEntry.findFirst.mockResolvedValue(draftEntry);
      prisma.accountingAccount.findUnique
        .mockResolvedValueOnce(mockAccount)   // debit account
        .mockResolvedValueOnce(mockAccount2); // credit account
      prisma.accountingAccount.update.mockResolvedValue({});
      prisma.journalEntry.update.mockResolvedValue({
        ...draftEntry,
        status: 'POSTED',
        lines: draftEntry.lines,
      });

      const result = await service.postJournalEntry(tenantId, 'entry-1', 'user-1');

      expect(result.status).toBe('POSTED');
      // DEBIT account: normalBalance=DEBIT, so debit-credit = +100
      expect(prisma.accountingAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { currentBalance: { increment: 100 } },
      });
      // CREDIT account: normalBalance=CREDIT, so credit-debit = +100
      expect(prisma.accountingAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-2' },
        data: { currentBalance: { increment: 100 } },
      });
    });

    it('should reject posting non-DRAFT entry', async () => {
      prisma.journalEntry.findFirst.mockResolvedValue({
        ...draftEntry,
        status: 'POSTED',
      });

      await expect(
        service.postJournalEntry(tenantId, 'entry-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('voidJournalEntry', () => {
    const postedEntry = {
      id: 'entry-1',
      tenantId,
      entryNumber: 'PDA-2025-000001',
      status: 'POSTED',
      lines: [
        { id: 'line-1', accountId: 'acc-1', debit: 100, credit: 0, account: { id: 'acc-1', code: '1101.01', name: 'Efectivo' } },
        { id: 'line-2', accountId: 'acc-2', debit: 0, credit: 100, account: { id: 'acc-2', code: '2101.01', name: 'Proveedores' } },
      ],
    };

    it('should void a POSTED entry and reverse balances', async () => {
      prisma.journalEntry.findFirst.mockResolvedValue(postedEntry);
      prisma.accountingAccount.findUnique
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce(mockAccount2);
      prisma.accountingAccount.update.mockResolvedValue({});
      prisma.journalEntry.update.mockResolvedValue({
        ...postedEntry,
        status: 'VOIDED',
        lines: postedEntry.lines,
      });

      const result = await service.voidJournalEntry(tenantId, 'entry-1', 'user-1', 'Error found');

      expect(result.status).toBe('VOIDED');
      // Reversed: DEBIT account gets -(debit-credit) = -100
      expect(prisma.accountingAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { currentBalance: { increment: -100 } },
      });
      // Reversed: CREDIT account gets -(credit-debit) = -100
      expect(prisma.accountingAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-2' },
        data: { currentBalance: { increment: -100 } },
      });
    });

    it('should reject voiding non-POSTED entry', async () => {
      prisma.journalEntry.findFirst.mockResolvedValue({
        ...postedEntry,
        status: 'DRAFT',
      });

      await expect(
        service.voidJournalEntry(tenantId, 'entry-1', 'user-1', 'reason'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ================================================================
  // REPORTS
  // ================================================================

  describe('getTrialBalance', () => {
    it('should return trial balance with correct totals', async () => {
      prisma.accountingAccount.findMany.mockResolvedValue([
        { ...mockAccount, currentBalance: 500 },
        { ...mockAccount2, currentBalance: 300 },
      ]);

      const result = await service.getTrialBalance(tenantId);

      expect(result.rows).toHaveLength(2);
      expect(result.totalDebits).toBe(500);  // DEBIT account positive balance
      expect(result.totalCredits).toBe(300); // CREDIT account positive balance
    });

    it('should skip zero-balance accounts', async () => {
      prisma.accountingAccount.findMany.mockResolvedValue([
        { ...mockAccount, currentBalance: 0 },
      ]);

      const result = await service.getTrialBalance(tenantId);

      expect(result.rows).toHaveLength(0);
    });
  });

  describe('getBalanceSheet', () => {
    it('should categorize accounts by type', async () => {
      prisma.accountingAccount.findMany.mockResolvedValue([
        { ...mockAccount, currentBalance: 1000, accountType: 'ASSET' },
        { ...mockAccount2, currentBalance: 500, accountType: 'LIABILITY' },
        { ...mockAccount, id: 'acc-3', code: '3101', currentBalance: 500, accountType: 'EQUITY', normalBalance: 'CREDIT' },
      ]);

      const result = await service.getBalanceSheet(tenantId);

      expect(result.totalAssets).toBe(1000);
      expect(result.totalLiabilities).toBe(500);
      expect(result.totalEquity).toBe(500);
    });
  });

  describe('getIncomeStatement', () => {
    it('should calculate net income', async () => {
      prisma.accountingAccount.findMany.mockResolvedValue([
        { ...mockAccount, code: '4101', accountType: 'INCOME', normalBalance: 'CREDIT', currentBalance: 2000 },
        { ...mockAccount, code: '5101', accountType: 'EXPENSE', normalBalance: 'DEBIT', currentBalance: 800 },
      ]);

      const result = await service.getIncomeStatement(tenantId);

      expect(result.totalIncome).toBe(2000);
      expect(result.totalExpenses).toBe(800);
      expect(result.netIncome).toBe(1200);
    });
  });

  describe('getGeneralLedger', () => {
    it('should return ledger entries with running balance', async () => {
      prisma.accountingAccount.findFirst.mockResolvedValue(mockAccount);
      prisma.journalEntryLine.findMany.mockResolvedValue([
        {
          id: 'line-1',
          accountId: 'acc-1',
          debit: 500,
          credit: 0,
          description: 'Initial deposit',
          entry: { entryNumber: 'PDA-2025-000001', entryDate: new Date('2025-01-15'), description: 'Opening' },
        },
        {
          id: 'line-2',
          accountId: 'acc-1',
          debit: 0,
          credit: 200,
          description: 'Payment',
          entry: { entryNumber: 'PDA-2025-000002', entryDate: new Date('2025-01-20'), description: 'Payment' },
        },
      ]);

      const result = await service.getGeneralLedger(tenantId, 'acc-1');

      expect(result.account.code).toBe('1101.01');
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].runningBalance).toBe(500);  // +500 debit
      expect(result.entries[1].runningBalance).toBe(300);  // -200 credit
      expect(result.closingBalance).toBe(300);
    });

    it('should throw NotFoundException for invalid account', async () => {
      prisma.accountingAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.getGeneralLedger(tenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDashboardSummary', () => {
    it('should aggregate balances by account type', async () => {
      prisma.accountingAccount.findMany.mockResolvedValue([
        { accountType: 'ASSET', currentBalance: 1000 },
        { accountType: 'ASSET', currentBalance: 500 },
        { accountType: 'LIABILITY', currentBalance: 300 },
        { accountType: 'EQUITY', currentBalance: 200 },
        { accountType: 'INCOME', currentBalance: 800 },
        { accountType: 'EXPENSE', currentBalance: 400 },
      ]);
      prisma.journalEntry.count.mockResolvedValue(15);

      const result = await service.getDashboardSummary(tenantId);

      expect(result.totalAssets).toBe(1500);
      expect(result.totalLiabilities).toBe(300);
      expect(result.totalEquity).toBe(200);
      expect(result.monthlyIncome).toBe(800);
      expect(result.monthlyExpenses).toBe(400);
      expect(result.netIncome).toBe(400);
      expect(result.accountCount).toBe(6);
      expect(result.journalEntryCount).toBe(15);
    });
  });
});
