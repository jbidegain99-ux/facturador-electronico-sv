import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountingService, JournalEntryWithLines } from './accounting.service';

interface MappingLine {
  cuenta: string;
  monto: 'total' | 'subtotal' | 'iva';
  descripcion?: string;
}

interface MappingConfig {
  debe: MappingLine[];
  haber: MappingLine[];
}

interface DteAmounts {
  totalPagar: number;
  totalGravada: number;
  totalIva: number;
}

@Injectable()
export class AccountingAutomationService {
  private readonly logger = new Logger(AccountingAutomationService.name);

  constructor(
    private prisma: PrismaService,
    private accountingService: AccountingService,
  ) {}

  /**
   * Generate a journal entry from a DTE.
   * Fire-and-forget pattern: errors are logged, never thrown to caller.
   */
  async generateFromDTE(
    dteId: string,
    tenantId: string,
    trigger: string,
  ): Promise<JournalEntryWithLines | null> {
    // 1. Check tenant config
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { autoJournalEnabled: true, autoJournalTrigger: true },
    });

    if (!tenant?.autoJournalEnabled) {
      return null;
    }

    if (tenant.autoJournalTrigger !== trigger) {
      return null;
    }

    // 2. Get DTE with full data
    const dte = await this.prisma.dTE.findFirst({
      where: { id: dteId, tenantId },
    });

    if (!dte) {
      this.logger.warn(`DTE ${dteId} not found for tenant ${tenantId}`);
      return null;
    }

    // 3. Check for duplicate (sourceType='DTE' + sourceDocumentId=dteId)
    const existing = await this.prisma.journalEntry.findFirst({
      where: {
        tenantId,
        sourceType: 'DTE',
        sourceDocumentId: dteId,
        status: { not: 'VOIDED' },
      },
    });

    if (existing) {
      this.logger.warn(`Journal entry already exists for DTE ${dteId}: ${existing.entryNumber}`);
      return null;
    }

    // 4. Determine operation type
    const operation = this.determineOperation(dte.tipoDte, dte.jsonOriginal);
    if (!operation) {
      this.logger.warn(`Cannot determine operation for DTE ${dteId} (tipoDte=${dte.tipoDte})`);
      return null;
    }

    // 5. Find active mapping rule
    const rule = await this.prisma.accountMappingRule.findFirst({
      where: { tenantId, operation, isActive: true },
      include: {
        debitAccount: { select: { id: true, code: true, name: true } },
        creditAccount: { select: { id: true, code: true, name: true } },
      },
    });

    if (!rule) {
      this.logger.warn(`No mapping rule found for operation ${operation} in tenant ${tenantId}`);
      return null;
    }

    const amounts: DteAmounts = {
      totalPagar: Number(dte.totalPagar),
      totalGravada: Number(dte.totalGravada),
      totalIva: Number(dte.totalIva),
    };

    // 6. Build journal entry lines
    const lines = rule.mappingConfig
      ? await this.buildMultiLines(tenantId, rule.mappingConfig, amounts, dte.tipoDte)
      : this.buildSimpleLines(rule.debitAccountId, rule.creditAccountId, amounts.totalPagar, dte.tipoDte);

    if (!lines || lines.length === 0) {
      this.logger.warn(`No lines generated for DTE ${dteId}`);
      return null;
    }

    // 7. Validate Debe = Haber
    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      this.logger.error(
        `Unbalanced entry for DTE ${dteId}: debit=${totalDebit.toFixed(2)}, credit=${totalCredit.toFixed(2)}`,
      );
      return null;
    }

    // 8. Create journal entry and post it
    const tipoDteNames: Record<string, string> = {
      '01': 'Factura',
      '03': 'Crédito Fiscal',
      '05': 'Nota de Crédito',
      '06': 'Nota de Débito',
      '04': 'Nota de Remisión',
      '07': 'Retención',
      '09': 'Liquidación',
      '11': 'Exportación',
      '14': 'Sujeto Excluido',
    };
    const dteLabel = tipoDteNames[dte.tipoDte] || `DTE ${dte.tipoDte}`;
    const description = `${dteLabel} ${dte.numeroControl} - Auto`;

    const entry = await this.accountingService.createJournalEntry(
      tenantId,
      {
        entryDate: new Date().toISOString(),
        description,
        entryType: 'AUTOMATIC',
        sourceType: 'DTE',
        sourceDocumentId: dteId,
        lines,
      },
    );

    // 9. Post the entry (DRAFT → POSTED)
    const posted = await this.accountingService.postJournalEntry(
      tenantId,
      entry.id,
      'system',
    );

    this.logger.log(`Auto journal entry ${posted.entryNumber} created and posted for DTE ${dteId}`);
    return posted;
  }

  /**
   * Reverse a journal entry when a DTE is voided.
   */
  async reverseFromDTE(dteId: string, tenantId: string): Promise<JournalEntryWithLines | null> {
    const entry = await this.prisma.journalEntry.findFirst({
      where: {
        tenantId,
        sourceType: 'DTE',
        sourceDocumentId: dteId,
        status: 'POSTED',
      },
    });

    if (!entry) {
      this.logger.warn(`No posted journal entry found for DTE ${dteId} to reverse`);
      return null;
    }

    const voided = await this.accountingService.voidJournalEntry(
      tenantId,
      entry.id,
      'system',
      'Anulación de DTE',
    );

    this.logger.log(`Journal entry ${voided.entryNumber} voided for DTE ${dteId} annulment`);
    return voided;
  }

  /**
   * Determine the accounting operation based on tipoDte and condicionOperacion.
   */
  private determineOperation(tipoDte: string, jsonOriginal: string): string | null {
    switch (tipoDte) {
      case '01': {
        // Factura: check condicionOperacion from jsonOriginal
        const condicion = this.extractCondicionOperacion(jsonOriginal);
        return condicion === 2 ? 'VENTA_CREDITO' : 'VENTA_CONTADO';
      }
      case '03':
        return 'CREDITO_FISCAL';
      case '05':
        return 'NOTA_CREDITO';
      case '06':
        return 'NOTA_DEBITO';
      case '04':
        return 'NOTA_REMISION';
      case '07':
        return 'RETENCION';
      case '09':
        return 'LIQUIDACION';
      case '11':
        return 'EXPORTACION';
      case '14':
        return 'SUJETO_EXCLUIDO';
      default:
        return null;
    }
  }

  private extractCondicionOperacion(jsonOriginal: string): number {
    try {
      const parsed = JSON.parse(jsonOriginal);
      return Number(parsed?.identificacion?.condicionOperacion) || 1;
    } catch {
      return 1; // Default to contado
    }
  }

  /**
   * Build multi-line entry from mappingConfig JSON.
   */
  private async buildMultiLines(
    tenantId: string,
    mappingConfigJson: string,
    amounts: DteAmounts,
    tipoDte: string,
  ): Promise<{ accountId: string; description: string; debit: number; credit: number }[]> {
    let config: MappingConfig;
    try {
      config = JSON.parse(mappingConfigJson);
    } catch {
      this.logger.error('Invalid mappingConfig JSON');
      return [];
    }

    const lines: { accountId: string; description: string; debit: number; credit: number }[] = [];

    const tipoDteNames: Record<string, string> = {
      '01': 'Factura',
      '03': 'CCF',
      '05': 'NC',
      '06': 'ND',
      '04': 'NR',
      '07': 'RET',
      '09': 'DCL',
      '11': 'FEX',
      '14': 'FSE',
    };
    const prefix = tipoDteNames[tipoDte] || 'DTE';

    // Process debit lines
    for (const line of config.debe) {
      const account = await this.findAccountByCode(tenantId, line.cuenta);
      if (!account) continue;

      const amount = this.resolveAmount(line.monto, amounts);
      if (amount <= 0) continue;

      lines.push({
        accountId: account.id,
        description: `${prefix} - ${line.descripcion || account.name}`,
        debit: Math.round(amount * 100) / 100,
        credit: 0,
      });
    }

    // Process credit lines
    for (const line of config.haber) {
      const account = await this.findAccountByCode(tenantId, line.cuenta);
      if (!account) continue;

      const amount = this.resolveAmount(line.monto, amounts);
      if (amount <= 0) continue;

      lines.push({
        accountId: account.id,
        description: `${prefix} - ${line.descripcion || account.name}`,
        debit: 0,
        credit: Math.round(amount * 100) / 100,
      });
    }

    return lines;
  }

  /**
   * Build simple 2-line entry from debitAccountId/creditAccountId.
   */
  private buildSimpleLines(
    debitAccountId: string,
    creditAccountId: string,
    totalPagar: number,
    tipoDte: string,
  ): { accountId: string; description: string; debit: number; credit: number }[] {
    const tipoDteNames: Record<string, string> = {
      '01': 'Factura',
      '03': 'CCF',
      '05': 'NC',
      '06': 'ND',
      '04': 'NR',
      '07': 'RET',
      '09': 'DCL',
      '11': 'FEX',
      '14': 'FSE',
    };
    const prefix = tipoDteNames[tipoDte] || 'DTE';
    const amount = Math.round(totalPagar * 100) / 100;

    return [
      {
        accountId: debitAccountId,
        description: `${prefix} - Débito`,
        debit: amount,
        credit: 0,
      },
      {
        accountId: creditAccountId,
        description: `${prefix} - Crédito`,
        debit: 0,
        credit: amount,
      },
    ];
  }

  private async findAccountByCode(
    tenantId: string,
    code: string,
  ): Promise<{ id: string; name: string } | null> {
    const account = await this.prisma.accountingAccount.findUnique({
      where: { tenantId_code: { tenantId, code } },
      select: { id: true, name: true, isActive: true, allowsPosting: true },
    });

    if (!account || !account.isActive || !account.allowsPosting) {
      this.logger.warn(`Account ${code} not found or not postable for tenant ${tenantId}`);
      return null;
    }

    return account;
  }

  private resolveAmount(montoKey: string, amounts: DteAmounts): number {
    switch (montoKey) {
      case 'total':
        return amounts.totalPagar;
      case 'subtotal':
        return amounts.totalGravada;
      case 'iva':
        return amounts.totalIva;
      default:
        return 0;
    }
  }
}
