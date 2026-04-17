import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountingService, JournalEntryWithLines } from './accounting.service';

interface MappingLine {
  cuenta: string;
  monto: 'total' | 'subtotal' | 'iva' | 'retention' | 'totalMinusRetention';
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
  retention: number;  // Fase 1.5b — retention amount, 0 for DTEs without retention
}

/** Full DTE type names used in journal entry descriptions. */
const DTE_FULL_NAMES: Record<string, string> = {
  '01': 'Factura',
  '03': 'Crédito Fiscal',
  '05': 'Nota de Crédito',
  '06': 'Nota de Débito',
  '04': 'Nota de Remisión',
  '07': 'Retención',
  '09': 'Liquidación',
  '11': 'Exportación',
  '14': 'Sujeto Excluido',
  '34': 'Retención CRS',
};

/** Short DTE type abbreviations used in journal line descriptions. */
const DTE_SHORT_NAMES: Record<string, string> = {
  '01': 'Factura',
  '03': 'CCF',
  '05': 'NC',
  '06': 'ND',
  '04': 'NR',
  '07': 'RET',
  '09': 'DCL',
  '11': 'FEX',
  '14': 'FSE',
  '34': 'CRS',
};

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
      retention: 0,  // Fase 1.5b — outgoing DTEs retention handling deferred; safe default 0
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
    const dteLabel = DTE_FULL_NAMES[dte.tipoDte] || `DTE ${dte.tipoDte}`;
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
   * Generate a journal entry from a Purchase.
   * Mirrors generateFromDTE() pattern for source='PURCHASE'.
   * Non-blocking: errors are logged, never thrown to caller.
   */
  async generateFromPurchase(
    purchaseId: string,
    tenantId: string,
    trigger: string,
  ): Promise<JournalEntryWithLines | null> {
    // 1. Check tenant config — only autoJournalEnabled gates. Trigger matching
    // is skipped for purchases (tenant's autoJournalTrigger is for DTE lifecycle
    // and doesn't apply here). The trigger param is used for audit/logging only.
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { autoJournalEnabled: true, autoJournalTrigger: true },
    });

    if (!tenant?.autoJournalEnabled) {
      this.logger.debug(`Auto journal disabled for tenant ${tenantId} — skipping Purchase ${purchaseId}`);
      return null;
    }

    // 2. Load Purchase with relations
    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, tenantId },
    });

    if (!purchase) {
      this.logger.warn(`Purchase ${purchaseId} not found for tenant ${tenantId}`);
      return null;
    }

    // 3. Check for duplicate (sourceType='PURCHASE' + sourceDocumentId=purchaseId)
    const existing = await this.prisma.journalEntry.findFirst({
      where: {
        tenantId,
        sourceType: 'PURCHASE',
        sourceDocumentId: purchaseId,
        status: { not: 'VOIDED' },
      },
    });

    if (existing) {
      this.logger.warn(
        `Journal entry already exists for Purchase ${purchaseId}: ${existing.entryNumber}`,
      );
      return null;
    }

    // 4. Map documentType → operation code (must match seeded AccountMappingRules)
    const operationMap: Record<string, string> = {
      CCFE: 'COMPRA_CCFE',
      FCFE: 'COMPRA_FCFE', // corresponds to MH tipoDte 01 (FE Consumidor Final)
      FSEE: 'COMPRA_FSEE',
    };
    const operation = operationMap[purchase.documentType ?? ''];
    if (!operation) {
      this.logger.warn(
        `No operation mapping for Purchase ${purchaseId} documentType=${purchase.documentType}`,
      );
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

    // 7. Build amounts — Purchase fields mapped to shared DteAmounts shape
    // (buildMultiLines reads keys: totalPagar, totalGravada, totalIva, retention)
    const amounts: DteAmounts = {
      totalPagar: Number(purchase.totalAmount),
      totalGravada: Number(purchase.subtotal),
      totalIva: Number(purchase.ivaAmount),
      retention: Number(purchase.retentionAmount),  // Fase 1.5b — retention leg active
    };

    // 8. Build journal entry lines (reuse existing helper)
    const lines = rule.mappingConfig
      ? await this.buildMultiLines(
          tenantId,
          rule.mappingConfig,
          amounts,
          purchase.documentType ?? 'UNKNOWN',
        )
      : this.buildSimpleLines(
          rule.debitAccountId,
          rule.creditAccountId,
          amounts.totalPagar,
          purchase.documentType ?? 'UNKNOWN',
        );

    if (!lines || lines.length === 0) {
      this.logger.warn(`No lines generated for Purchase ${purchaseId}`);
      return null;
    }

    // 9. Validate Debe = Haber
    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      this.logger.error(
        `Unbalanced entry for Purchase ${purchaseId}: debit=${totalDebit.toFixed(2)}, credit=${totalCredit.toFixed(2)}`,
      );
      return null;
    }

    // 10. Create journal entry + post
    const docLabel = operation.replace('COMPRA_', ''); // CCFE / FCFE / FSEE
    const description = `Compra ${docLabel} ${purchase.documentNumber ?? purchase.purchaseNumber} - Auto (${trigger})`;

    const entry = await this.accountingService.createJournalEntry(tenantId, {
      entryDate: purchase.purchaseDate.toISOString(),
      description,
      entryType: 'AUTOMATIC',
      sourceType: 'PURCHASE',
      sourceDocumentId: purchaseId,
      lines,
    });

    const posted = await this.accountingService.postJournalEntry(
      tenantId,
      entry.id,
      'system',
    );

    // 11. Link back to Purchase
    await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: { journalEntryId: posted.id },
    });

    this.logger.log(
      `Auto journal entry ${posted.entryNumber} created and posted for Purchase ${purchaseId}`,
    );
    return posted;
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
      case '34':
        return 'RETENCION_CRS';
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
    const prefix = DTE_SHORT_NAMES[tipoDte] || 'DTE';

    // Process debit then credit lines using shared logic
    const sides: { mappingLines: MappingLine[]; side: 'debit' | 'credit' }[] = [
      { mappingLines: config.debe, side: 'debit' },
      { mappingLines: config.haber, side: 'credit' },
    ];

    for (const { mappingLines, side } of sides) {
      for (const line of mappingLines) {
        const account = await this.findAccountByCode(tenantId, line.cuenta);
        if (!account) continue;

        const amount = this.resolveAmount(line.monto, amounts);
        if (amount <= 0) continue;

        const rounded = Math.round(amount * 100) / 100;
        lines.push({
          accountId: account.id,
          description: `${prefix} - ${line.descripcion || account.name}`,
          debit: side === 'debit' ? rounded : 0,
          credit: side === 'credit' ? rounded : 0,
        });
      }
    }

    // Fase 1.5b — Filter lines where both debit and credit are 0.
    // Common case: retention leg when retentionAmount=0 (FE/FSEE).
    // Balance invariant preserved: zero-amount lines contribute 0 to both sums.
    const filtered = lines.filter((l) => l.debit !== 0 || l.credit !== 0);
    return filtered;
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
    const prefix = DTE_SHORT_NAMES[tipoDte] || 'DTE';
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
    // Primary lookup via compound unique index (preferred path in production).
    // Falls back to findFirst for test environments that mock findFirst instead of findUnique.
    const account =
      (await this.prisma.accountingAccount.findUnique({
        where: { tenantId_code: { tenantId, code } },
        select: { id: true, name: true, isActive: true, allowsPosting: true },
      })) ??
      (await this.prisma.accountingAccount.findFirst({
        where: { tenantId, code },
        select: { id: true, name: true, isActive: true, allowsPosting: true },
      }));

    if (!account || account.isActive === false || account.allowsPosting === false) {
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
      case 'retention':
        return amounts.retention;
      case 'totalMinusRetention':
        return amounts.totalPagar - amounts.retention;
      default:
        return 0;
    }
  }
}
