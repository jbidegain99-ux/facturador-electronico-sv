import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { QueryJournalDto } from './dto/query-journal.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response';
import { AccountingAccount, JournalEntry } from '@prisma/client';
import { EL_SALVADOR_CHART_OF_ACCOUNTS } from './chart-of-accounts.data';

export interface AccountWithChildren extends AccountingAccount {
  children?: AccountWithChildren[];
  parent?: AccountingAccount | null;
}

export interface JournalEntryWithLines extends JournalEntry {
  lines: {
    id: string;
    accountId: string;
    description: string;
    debit: unknown;
    credit: unknown;
    lineNumber: number;
    account: { id: string; code: string; name: string };
  }[];
}

export interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  accountType: string;
  debitBalance: number;
  creditBalance: number;
}

export interface BalanceSheetSection {
  title: string;
  accounts: { code: string; name: string; balance: number }[];
  total: number;
}

export interface IncomeStatementSection {
  title: string;
  accounts: { code: string; name: string; balance: number }[];
  total: number;
}

export interface LedgerEntry {
  date: Date;
  entryNumber: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(private prisma: PrismaService) {}

  // ================================================================
  // PLAN DE CUENTAS (Chart of Accounts)
  // ================================================================

  async seedChartOfAccounts(tenantId: string): Promise<{ created: number }> {
    const existing = await this.prisma.accountingAccount.count({
      where: { tenantId },
    });

    if (existing > 0) {
      this.logger.log(`Tenant ${tenantId} already has ${existing} accounts, skipping seed`);
      return { created: 0 };
    }

    this.logger.log(`Seeding chart of accounts for tenant ${tenantId}...`);

    // First pass: create all accounts without parentId
    const accountMap = new Map<string, string>(); // code -> id

    for (const entry of EL_SALVADOR_CHART_OF_ACCOUNTS) {
      const account = await this.prisma.accountingAccount.create({
        data: {
          tenantId,
          code: entry.code,
          name: entry.name,
          level: entry.level,
          accountType: entry.accountType,
          normalBalance: entry.normalBalance,
          allowsPosting: entry.allowsPosting,
          isSystem: true,
          isActive: true,
        },
      });
      accountMap.set(entry.code, account.id);
    }

    // Second pass: set parent relationships
    for (const entry of EL_SALVADOR_CHART_OF_ACCOUNTS) {
      if (entry.parentCode) {
        const accountId = accountMap.get(entry.code);
        const parentId = accountMap.get(entry.parentCode);
        if (accountId && parentId) {
          await this.prisma.accountingAccount.update({
            where: { id: accountId },
            data: { parentId },
          });
        }
      }
    }

    const count = EL_SALVADOR_CHART_OF_ACCOUNTS.length;
    this.logger.log(`Seeded ${count} accounts for tenant ${tenantId}`);
    return { created: count };
  }

  async getChartOfAccounts(tenantId: string): Promise<AccountWithChildren[]> {
    const accounts = await this.prisma.accountingAccount.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });

    // Build tree structure
    const accountMap = new Map<string, AccountWithChildren>();
    const roots: AccountWithChildren[] = [];

    for (const account of accounts) {
      accountMap.set(account.id, { ...account, children: [] });
    }

    for (const account of accounts) {
      const node = accountMap.get(account.id)!;
      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          parent.children!.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async getAccountsList(tenantId: string): Promise<AccountingAccount[]> {
    return this.prisma.accountingAccount.findMany({
      where: { tenantId, isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async getPostableAccounts(tenantId: string): Promise<AccountingAccount[]> {
    return this.prisma.accountingAccount.findMany({
      where: { tenantId, isActive: true, allowsPosting: true },
      orderBy: { code: 'asc' },
    });
  }

  async createAccount(tenantId: string, dto: CreateAccountDto): Promise<AccountingAccount> {
    const existing = await this.prisma.accountingAccount.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });

    if (existing) {
      throw new ConflictException(`Ya existe una cuenta con código "${dto.code}"`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.accountingAccount.findFirst({
        where: { id: dto.parentId, tenantId },
      });
      if (!parent) {
        throw new NotFoundException('Cuenta padre no encontrada');
      }
    }

    return this.prisma.accountingAccount.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        parentId: dto.parentId,
        level: dto.level,
        accountType: dto.accountType,
        normalBalance: dto.normalBalance,
        allowsPosting: dto.allowsPosting ?? true,
        description: dto.description,
        isSystem: false,
      },
    });
  }

  async updateAccount(
    tenantId: string,
    id: string,
    dto: UpdateAccountDto,
  ): Promise<AccountingAccount> {
    const account = await this.prisma.accountingAccount.findFirst({
      where: { id, tenantId },
    });

    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    if (dto.code && dto.code !== account.code) {
      const existing = await this.prisma.accountingAccount.findUnique({
        where: { tenantId_code: { tenantId, code: dto.code } },
      });
      if (existing) {
        throw new ConflictException(`Ya existe una cuenta con código "${dto.code}"`);
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.allowsPosting !== undefined) data.allowsPosting = dto.allowsPosting;
    if (dto.accountType !== undefined) data.accountType = dto.accountType;
    if (dto.normalBalance !== undefined) data.normalBalance = dto.normalBalance;

    return this.prisma.accountingAccount.update({
      where: { id },
      data,
    });
  }

  async toggleAccountActive(tenantId: string, id: string): Promise<AccountingAccount> {
    const account = await this.prisma.accountingAccount.findFirst({
      where: { id, tenantId },
    });

    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    // Don't allow deactivating accounts with posted journal entries
    if (account.isActive) {
      const lineCount = await this.prisma.journalEntryLine.count({
        where: {
          accountId: id,
          entry: { status: 'POSTED' },
        },
      });
      if (lineCount > 0) {
        throw new BadRequestException(
          'No se puede desactivar una cuenta con partidas contabilizadas',
        );
      }
    }

    return this.prisma.accountingAccount.update({
      where: { id },
      data: { isActive: !account.isActive },
    });
  }

  // ================================================================
  // JOURNAL ENTRIES (Partidas Contables)
  // ================================================================

  async createJournalEntry(
    tenantId: string,
    dto: CreateJournalEntryDto,
    userId?: string,
  ): Promise<JournalEntryWithLines> {
    // Validate balance: total debits must equal total credits
    const totalDebit = dto.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = dto.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `La partida no cuadra: débitos ($${totalDebit.toFixed(2)}) ≠ créditos ($${totalCredit.toFixed(2)})`,
      );
    }

    if (totalDebit === 0) {
      throw new BadRequestException('La partida debe tener al menos un movimiento');
    }

    // Validate each line has either debit or credit, not both
    for (const line of dto.lines) {
      if (line.debit > 0 && line.credit > 0) {
        throw new BadRequestException(
          'Cada línea debe tener débito o crédito, no ambos',
        );
      }
      if (line.debit === 0 && line.credit === 0) {
        throw new BadRequestException(
          'Cada línea debe tener un monto en débito o crédito',
        );
      }
    }

    // Validate all accounts exist and allow posting
    const accountIds = dto.lines.map(l => l.accountId);
    const accounts = await this.prisma.accountingAccount.findMany({
      where: { id: { in: accountIds }, tenantId },
    });

    if (accounts.length !== new Set(accountIds).size) {
      throw new BadRequestException('Una o más cuentas no existen');
    }

    for (const account of accounts) {
      if (!account.allowsPosting) {
        throw new BadRequestException(
          `La cuenta "${account.code} - ${account.name}" no permite movimientos directos`,
        );
      }
      if (!account.isActive) {
        throw new BadRequestException(
          `La cuenta "${account.code} - ${account.name}" está desactivada`,
        );
      }
    }

    // Generate entry number
    const entryDate = new Date(dto.entryDate);
    const entryNumber = await this.generateEntryNumber(tenantId, entryDate);

    const fiscalYear = entryDate.getFullYear();
    const fiscalMonth = entryDate.getMonth() + 1;

    const entry = await this.prisma.journalEntry.create({
      data: {
        tenantId,
        entryNumber,
        entryDate,
        description: dto.description,
        entryType: dto.entryType || 'MANUAL',
        sourceType: dto.sourceType,
        sourceDocumentId: dto.sourceDocumentId,
        totalDebit,
        totalCredit,
        fiscalYear,
        fiscalMonth,
        postedBy: userId,
        lines: {
          create: dto.lines.map((line, index) => ({
            accountId: line.accountId,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
            lineNumber: index + 1,
          })),
        },
      },
      include: {
        lines: {
          include: { account: { select: { id: true, code: true, name: true } } },
          orderBy: { lineNumber: 'asc' },
        },
      },
    });

    this.logger.log(`Journal entry ${entryNumber} created for tenant ${tenantId}`);
    return entry as JournalEntryWithLines;
  }

  async getJournalEntries(
    tenantId: string,
    query: QueryJournalDto,
  ): Promise<PaginatedResponse<JournalEntry>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Math.max(1, Number(query.limit) || 20), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };

    if (query.status) where.status = query.status;
    if (query.entryType) where.entryType = query.entryType;

    if (query.dateFrom || query.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (query.dateFrom) dateFilter.gte = new Date(query.dateFrom);
      if (query.dateTo) dateFilter.lte = new Date(query.dateTo);
      where.entryDate = dateFilter;
    }

    if (query.search) {
      where.OR = [
        { entryNumber: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        include: {
          lines: {
            include: { account: { select: { id: true, code: true, name: true } } },
            orderBy: { lineNumber: 'asc' },
          },
        },
        orderBy: { entryDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getJournalEntry(tenantId: string, id: string): Promise<JournalEntryWithLines> {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, tenantId },
      include: {
        lines: {
          include: { account: { select: { id: true, code: true, name: true } } },
          orderBy: { lineNumber: 'asc' },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Partida contable no encontrada');
    }

    return entry as JournalEntryWithLines;
  }

  async postJournalEntry(
    tenantId: string,
    id: string,
    userId: string,
  ): Promise<JournalEntryWithLines> {
    const entry = await this.getJournalEntry(tenantId, id);

    if (entry.status !== 'DRAFT') {
      throw new BadRequestException(
        `Solo se pueden contabilizar partidas en estado BORRADOR (actual: ${entry.status})`,
      );
    }

    // Use transaction to ensure atomicity of balance updates + status change
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update account balances
      for (const line of entry.lines) {
        const debit = Number(line.debit);
        const credit = Number(line.credit);

        const account = await tx.accountingAccount.findUnique({
          where: { id: line.accountId },
        });
        if (!account) continue;

        // Calculate balance change based on normal balance
        let balanceChange: number;
        if (account.normalBalance === 'DEBIT') {
          balanceChange = debit - credit;
        } else {
          balanceChange = credit - debit;
        }

        await tx.accountingAccount.update({
          where: { id: line.accountId },
          data: {
            currentBalance: { increment: balanceChange },
          },
        });
      }

      return tx.journalEntry.update({
        where: { id },
        data: {
          status: 'POSTED',
          postedAt: new Date(),
          postedBy: userId,
        },
        include: {
          lines: {
            include: { account: { select: { id: true, code: true, name: true } } },
            orderBy: { lineNumber: 'asc' },
          },
        },
      });
    });

    this.logger.log(`Journal entry ${entry.entryNumber} posted by ${userId}`);
    return updated as JournalEntryWithLines;
  }

  async voidJournalEntry(
    tenantId: string,
    id: string,
    userId: string,
    reason: string,
  ): Promise<JournalEntryWithLines> {
    const entry = await this.getJournalEntry(tenantId, id);

    if (entry.status !== 'POSTED') {
      throw new BadRequestException(
        `Solo se pueden anular partidas contabilizadas (actual: ${entry.status})`,
      );
    }

    // Use transaction to ensure atomicity of balance reversals + status change
    const updated = await this.prisma.$transaction(async (tx) => {
      // Reverse account balances
      for (const line of entry.lines) {
        const debit = Number(line.debit);
        const credit = Number(line.credit);

        const account = await tx.accountingAccount.findUnique({
          where: { id: line.accountId },
        });
        if (!account) continue;

        let balanceChange: number;
        if (account.normalBalance === 'DEBIT') {
          balanceChange = -(debit - credit); // Reverse
        } else {
          balanceChange = -(credit - debit); // Reverse
        }

        await tx.accountingAccount.update({
          where: { id: line.accountId },
          data: {
            currentBalance: { increment: balanceChange },
          },
        });
      }

      return tx.journalEntry.update({
        where: { id },
        data: {
          status: 'VOIDED',
          voidedAt: new Date(),
          voidedBy: userId,
          voidReason: reason,
        },
        include: {
          lines: {
            include: { account: { select: { id: true, code: true, name: true } } },
            orderBy: { lineNumber: 'asc' },
          },
        },
      });
    });

    this.logger.log(`Journal entry ${entry.entryNumber} voided by ${userId}: ${reason}`);
    return updated as JournalEntryWithLines;
  }

  // ================================================================
  // REPORTS
  // ================================================================

  async getTrialBalance(tenantId: string, asOfDate?: string): Promise<{
    rows: TrialBalanceRow[];
    totalDebits: number;
    totalCredits: number;
  }> {
    // Get all active accounts with balances
    const accounts = await this.prisma.accountingAccount.findMany({
      where: { tenantId, isActive: true, allowsPosting: true },
      orderBy: { code: 'asc' },
    });

    const rows: TrialBalanceRow[] = [];
    let totalDebits = 0;
    let totalCredits = 0;

    for (const account of accounts) {
      const balance = Number(account.currentBalance);
      if (balance === 0) continue;

      let debitBalance = 0;
      let creditBalance = 0;

      if (account.normalBalance === 'DEBIT') {
        if (balance >= 0) debitBalance = balance;
        else creditBalance = Math.abs(balance);
      } else {
        if (balance >= 0) creditBalance = balance;
        else debitBalance = Math.abs(balance);
      }

      rows.push({
        accountId: account.id,
        code: account.code,
        name: account.name,
        accountType: account.accountType,
        debitBalance,
        creditBalance,
      });

      totalDebits += debitBalance;
      totalCredits += creditBalance;
    }

    return {
      rows,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
    };
  }

  async getBalanceSheet(tenantId: string): Promise<{
    assets: BalanceSheetSection[];
    liabilities: BalanceSheetSection[];
    equity: BalanceSheetSection[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  }> {
    const accounts = await this.prisma.accountingAccount.findMany({
      where: {
        tenantId,
        isActive: true,
        allowsPosting: true,
        accountType: { in: ['ASSET', 'LIABILITY', 'EQUITY'] },
      },
      orderBy: { code: 'asc' },
    });

    const buildSection = (type: string): BalanceSheetSection[] => {
      const typeAccounts = accounts.filter(a => a.accountType === type);
      if (typeAccounts.length === 0) return [];

      const entries = typeAccounts
        .map(a => ({
          code: a.code,
          name: a.name,
          balance: Number(a.currentBalance),
        }))
        .filter(a => a.balance !== 0);

      if (entries.length === 0) return [];

      const total = entries.reduce((sum, a) => sum + a.balance, 0);
      const titles: Record<string, string> = {
        ASSET: 'Activos',
        LIABILITY: 'Pasivos',
        EQUITY: 'Patrimonio',
      };

      return [{ title: titles[type] || type, accounts: entries, total: Math.round(total * 100) / 100 }];
    };

    const assets = buildSection('ASSET');
    const liabilities = buildSection('LIABILITY');
    const equity = buildSection('EQUITY');

    return {
      assets,
      liabilities,
      equity,
      totalAssets: assets.reduce((s, sec) => s + sec.total, 0),
      totalLiabilities: liabilities.reduce((s, sec) => s + sec.total, 0),
      totalEquity: equity.reduce((s, sec) => s + sec.total, 0),
    };
  }

  async getIncomeStatement(
    tenantId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<{
    income: IncomeStatementSection[];
    expenses: IncomeStatementSection[];
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
  }> {
    const accounts = await this.prisma.accountingAccount.findMany({
      where: {
        tenantId,
        isActive: true,
        allowsPosting: true,
        accountType: { in: ['INCOME', 'EXPENSE'] },
      },
      orderBy: { code: 'asc' },
    });

    const buildSection = (type: string): IncomeStatementSection[] => {
      const typeAccounts = accounts.filter(a => a.accountType === type);
      if (typeAccounts.length === 0) return [];

      const entries = typeAccounts
        .map(a => ({
          code: a.code,
          name: a.name,
          balance: Number(a.currentBalance),
        }))
        .filter(a => a.balance !== 0);

      if (entries.length === 0) return [];

      const total = entries.reduce((sum, a) => sum + a.balance, 0);
      return [{ title: type === 'INCOME' ? 'Ingresos' : 'Gastos', accounts: entries, total: Math.round(total * 100) / 100 }];
    };

    const income = buildSection('INCOME');
    const expenses = buildSection('EXPENSE');
    const totalIncome = income.reduce((s, sec) => s + sec.total, 0);
    const totalExpenses = expenses.reduce((s, sec) => s + sec.total, 0);

    return {
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netIncome: Math.round((totalIncome - totalExpenses) * 100) / 100,
    };
  }

  async getGeneralLedger(
    tenantId: string,
    accountId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<{
    account: { id: string; code: string; name: string; normalBalance: string };
    entries: LedgerEntry[];
    openingBalance: number;
    closingBalance: number;
  }> {
    const account = await this.prisma.accountingAccount.findFirst({
      where: { id: accountId, tenantId },
    });

    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    const where: Record<string, unknown> = {
      accountId,
      entry: { tenantId, status: 'POSTED' },
    };

    if (dateFrom || dateTo) {
      const entryFilter: Record<string, unknown> = { tenantId, status: 'POSTED' };
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      entryFilter.entryDate = dateFilter;
      where.entry = entryFilter;
    }

    const lines = await this.prisma.journalEntryLine.findMany({
      where,
      include: {
        entry: {
          select: { entryNumber: true, entryDate: true, description: true },
        },
      },
      orderBy: { entry: { entryDate: 'asc' } },
    });

    let runningBalance = 0;
    const entries: LedgerEntry[] = lines.map(line => {
      const debit = Number(line.debit);
      const credit = Number(line.credit);

      if (account.normalBalance === 'DEBIT') {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      return {
        date: line.entry.entryDate,
        entryNumber: line.entry.entryNumber,
        description: line.description,
        debit,
        credit,
        runningBalance: Math.round(runningBalance * 100) / 100,
      };
    });

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        normalBalance: account.normalBalance,
      },
      entries,
      openingBalance: 0,
      closingBalance: entries.length > 0
        ? entries[entries.length - 1].runningBalance
        : 0,
    };
  }

  async getDashboardSummary(tenantId: string): Promise<{
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netIncome: number;
    accountCount: number;
    journalEntryCount: number;
  }> {
    const [accounts, journalEntryCount] = await Promise.all([
      this.prisma.accountingAccount.findMany({
        where: { tenantId, isActive: true, allowsPosting: true },
        select: { accountType: true, currentBalance: true },
      }),
      this.prisma.journalEntry.count({
        where: { tenantId, status: 'POSTED' },
      }),
    ]);

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const account of accounts) {
      const balance = Number(account.currentBalance);
      switch (account.accountType) {
        case 'ASSET': totalAssets += balance; break;
        case 'LIABILITY': totalLiabilities += balance; break;
        case 'EQUITY': totalEquity += balance; break;
        case 'INCOME': totalIncome += balance; break;
        case 'EXPENSE': totalExpenses += balance; break;
      }
    }

    return {
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      totalEquity: Math.round(totalEquity * 100) / 100,
      monthlyIncome: Math.round(totalIncome * 100) / 100,
      monthlyExpenses: Math.round(totalExpenses * 100) / 100,
      netIncome: Math.round((totalIncome - totalExpenses) * 100) / 100,
      accountCount: accounts.length,
      journalEntryCount,
    };
  }

  // ================================================================
  // HELPERS
  // ================================================================

  private async generateEntryNumber(tenantId: string, date: Date): Promise<string> {
    const year = date.getFullYear();
    const prefix = `PDA-${year}`;

    const lastEntry = await this.prisma.journalEntry.findFirst({
      where: {
        tenantId,
        entryNumber: { startsWith: prefix },
      },
      orderBy: { entryNumber: 'desc' },
    });

    let seq = 1;
    if (lastEntry) {
      const parts = lastEntry.entryNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}-${String(seq).padStart(6, '0')}`;
  }
}
