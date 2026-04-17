import { Injectable, Logger } from '@nestjs/common';
import type { InventoryMovement, InventoryState, JournalEntry, DTE } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountingService } from '../../accounting/accounting.service';

// =========================================================================
// Public types
// =========================================================================

export interface MatchedLine {
  jsonLineIndex: number;
  catalogItem: {
    id: string;
    code: string;
    trackInventory: boolean;
  };
  quantity: number;
  unitPriceFromDte: number;
  descriptionFromDte: string;
  matchSource: 'quote' | 'codigo';
}

export interface CogsGenerationResult {
  dteId: string;
  linesMatched: number;
  linesSkipped: number;
  linesTracked: number;
  inventoryMovementsCreated: InventoryMovement[];
  inventoryStatesUpdated: InventoryState[];
  journalEntry: JournalEntry | null;
  totalCogs: number;
  warnings: string[];
  isDuplicate?: boolean;
}

export interface CogsReversalResult {
  dteId: string;
  inventoryMovementsReversed: number;
  inventoryStatesRestored: number;
  journalEntryVoided: string | null;
  warnings: string[];
}

// =========================================================================
// Service
// =========================================================================

@Injectable()
export class DteCogsService {
  private readonly logger = new Logger(DteCogsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingService: AccountingService,
  ) {}

  async generateCogsFromDte(
    dteId: string,
    tenantId: string,
    trigger: string,
  ): Promise<CogsGenerationResult> {
    const warnings: string[] = [];

    // 1. Load DTE
    const dte = await this.prisma.dTE.findFirst({ where: { id: dteId, tenantId } });
    if (!dte) {
      return this.emptyResult(dteId, [`DTE ${dteId} not found for tenant ${tenantId}`]);
    }

    // 2. Idempotency check
    const existingMovements = await this.prisma.inventoryMovement.findMany({
      where: { tenantId, sourceType: 'DTE', sourceId: dteId },
    });
    if (existingMovements.length > 0) {
      const existingEntry = await this.prisma.journalEntry.findFirst({
        where: { tenantId, sourceType: 'DTE_COGS', sourceDocumentId: dteId },
      });
      this.logger.debug(`COGS already generated for DTE ${dteId} — returning existing`);
      return {
        dteId,
        linesMatched: existingMovements.length,
        linesSkipped: 0,
        linesTracked: existingMovements.length,
        inventoryMovementsCreated: existingMovements,
        inventoryStatesUpdated: [],
        journalEntry: existingEntry,
        totalCogs: existingMovements.reduce((s, m) => s + Number(m.totalCost), 0),
        warnings: [],
        isDuplicate: true,
      };
    }

    // 3. Match lines
    const { matched, warnings: matchWarnings } = await this.matchDteLinesToCatalog(dte);
    warnings.push(...matchWarnings);

    const trackable: MatchedLine[] = [];
    for (const m of matched) {
      if (m.catalogItem.trackInventory) {
        trackable.push(m);
      } else {
        warnings.push(`Line ${m.jsonLineIndex + 1}: catalog ${m.catalogItem.code} has trackInventory=false — skipping Kardex`);
      }
    }

    if (trackable.length === 0) {
      return {
        dteId,
        linesMatched: matched.length,
        linesSkipped: matched.length,
        linesTracked: 0,
        inventoryMovementsCreated: [],
        inventoryStatesUpdated: [],
        journalEntry: null,
        totalCogs: 0,
        warnings,
      };
    }

    // 4. Group by catalogItemId
    const groups = new Map<string, MatchedLine[]>();
    for (const line of trackable) {
      const key = line.catalogItem.id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(line);
    }

    // 5. Transaction: movements + state updates
    let totalCogs = 0;
    const { createdMovements, updatedStates } = await this.prisma.$transaction(async (tx) => {
      const createdMovs: InventoryMovement[] = [];
      const updatedStts: InventoryState[] = [];

      for (const [catalogItemId, groupLines] of groups.entries()) {
        const currentState = await tx.inventoryState.findUnique({ where: { catalogItemId } });
        let runningQty = Number(currentState?.currentQty ?? 0);
        const runningAvgCost = Number(currentState?.currentAvgCost ?? 0);

        const maxResult = await tx.inventoryMovement.aggregate({
          where: { tenantId, catalogItemId },
          _max: { correlativo: true },
        });
        let nextCorrelativo = (maxResult._max.correlativo ?? 0) + 1;

        for (const line of groupLines) {
          const unitCost = runningAvgCost;
          const totalCostLine = line.quantity * unitCost;
          const newQty = runningQty - line.quantity;
          const newValue = newQty * runningAvgCost;

          if (newQty < 0) {
            warnings.push(
              `Stock negative on ${line.catalogItem.code}: was ${runningQty.toFixed(4)}, sold ${line.quantity.toFixed(4)}, new balance ${newQty.toFixed(4)}`,
            );
          }

          const movement = await tx.inventoryMovement.create({
            data: {
              tenantId,
              catalogItemId: line.catalogItem.id,
              movementDate: new Date(),
              correlativo: nextCorrelativo++,
              movementType: 'SALIDA_VENTA',
              qtyIn: '0.0000',
              qtyOut: line.quantity.toFixed(4),
              unitCost: unitCost.toFixed(4),
              totalCost: totalCostLine.toFixed(2),
              balanceQty: newQty.toFixed(4),
              balanceAvgCost: runningAvgCost.toFixed(4),  // unchanged on sale
              balanceValue: newValue.toFixed(2),
              documentType: dte.tipoDte,
              documentNumber: dte.numeroControl,
              supplierId: null,
              sourceType: 'DTE',
              sourceId: dte.id,
              notes: `Matched via ${line.matchSource}`,
              createdBy: 'system-cogs',
              journalEntryId: null,
            },
          });
          createdMovs.push(movement);
          totalCogs += totalCostLine;
          runningQty = newQty;
        }

        const finalState = await tx.inventoryState.upsert({
          where: { catalogItemId },
          create: {
            tenantId,
            catalogItemId,
            currentQty: runningQty.toFixed(4),
            currentAvgCost: runningAvgCost.toFixed(4),
            totalValue: (runningQty * runningAvgCost).toFixed(2),
            lastMovementAt: new Date(),
          },
          update: {
            currentQty: runningQty.toFixed(4),
            totalValue: (runningQty * runningAvgCost).toFixed(2),
            lastMovementAt: new Date(),
          },
        });
        updatedStts.push(finalState);
      }

      return { createdMovements: createdMovs, updatedStates: updatedStts };
    });

    // 6. Create COGS asiento (outside txn to simplify)
    if (totalCogs <= 0) {
      return {
        dteId,
        linesMatched: matched.length,
        linesSkipped: matched.length - trackable.length,
        linesTracked: trackable.length,
        inventoryMovementsCreated: createdMovements,
        inventoryStatesUpdated: updatedStates,
        journalEntry: null,
        totalCogs: 0,
        warnings,
      };
    }

    const cogsAccount = await this.prisma.accountingAccount.findFirst({
      where: { tenantId, code: '5101' },
    });
    const inventoryAccount = await this.prisma.accountingAccount.findFirst({
      where: { tenantId, code: '110401' },
    });

    if (!cogsAccount || !inventoryAccount) {
      warnings.push('Missing accounting accounts 5101/110401 — cannot create COGS asiento');
      return {
        dteId,
        linesMatched: matched.length,
        linesSkipped: matched.length - trackable.length,
        linesTracked: trackable.length,
        inventoryMovementsCreated: createdMovements,
        inventoryStatesUpdated: updatedStates,
        journalEntry: null,
        totalCogs,
        warnings,
      };
    }

    const entry = await this.accountingService.createJournalEntry(tenantId, {
      entryDate: new Date().toISOString(),
      description: `COGS - DTE ${dte.tipoDte} ${dte.numeroControl}`,
      entryType: 'AUTOMATIC',
      sourceType: 'DTE_COGS',
      sourceDocumentId: dteId,
      lines: [
        { accountId: cogsAccount.id, description: `COGS ${dte.numeroControl}`, debit: totalCogs, credit: 0 },
        { accountId: inventoryAccount.id, description: `Inventario ${dte.numeroControl}`, debit: 0, credit: totalCogs },
      ],
    });
    const posted = await this.accountingService.postJournalEntry(tenantId, entry.id, 'system');

    // 7. Link InventoryMovements to the created entry
    await this.prisma.inventoryMovement.updateMany({
      where: { tenantId, sourceId: dteId, journalEntryId: null },
      data: { journalEntryId: posted.id },
    });

    this.logger.log(
      `COGS generated for DTE ${dteId}: ${createdMovements.length} movements, total ${totalCogs.toFixed(2)}, entry ${posted.id} (trigger=${trigger})`,
    );

    return {
      dteId,
      linesMatched: matched.length,
      linesSkipped: matched.length - trackable.length,
      linesTracked: trackable.length,
      inventoryMovementsCreated: createdMovements,
      inventoryStatesUpdated: updatedStates,
      journalEntry: posted,
      totalCogs,
      warnings,
    };
  }

  async reverseCogsFromDte(
    dteId: string,
    tenantId: string,
  ): Promise<CogsReversalResult> {
    const warnings: string[] = [];

    // 1. Find COGS JournalEntry
    const entry = await this.prisma.journalEntry.findFirst({
      where: { tenantId, sourceType: 'DTE_COGS', sourceDocumentId: dteId, status: 'POSTED' },
    });
    if (!entry) {
      return { dteId, inventoryMovementsReversed: 0, inventoryStatesRestored: 0, journalEntryVoided: null, warnings: ['No POSTED COGS entry found — nothing to reverse'] };
    }

    // 2. Find SALIDA_VENTA movements
    const movements = await this.prisma.inventoryMovement.findMany({
      where: { tenantId, sourceType: 'DTE', sourceId: dteId, movementType: 'SALIDA_VENTA' },
    });
    if (movements.length === 0) {
      warnings.push('COGS entry exists but no SALIDA_VENTA movements — unusual state');
    }

    // 3. Transaction: compensating movements + state restore
    const restoredCatalogItems = new Set<string>();
    await this.prisma.$transaction(async (tx) => {
      for (const mov of movements) {
        const currentState = await tx.inventoryState.findUnique({ where: { catalogItemId: mov.catalogItemId } });
        const runningQty = Number(currentState?.currentQty ?? 0) + Number(mov.qtyOut);
        const avgCost = Number(mov.balanceAvgCost);

        const maxResult = await tx.inventoryMovement.aggregate({
          where: { tenantId, catalogItemId: mov.catalogItemId },
          _max: { correlativo: true },
        });
        const nextCorrelativo = (maxResult._max.correlativo ?? 0) + 1;

        await tx.inventoryMovement.create({
          data: {
            tenantId,
            catalogItemId: mov.catalogItemId,
            movementDate: new Date(),
            correlativo: nextCorrelativo,
            movementType: 'ENTRADA_DEVOLUCION_VENTA',
            qtyIn: mov.qtyOut,
            qtyOut: '0.0000',
            unitCost: mov.unitCost,
            totalCost: mov.totalCost,
            balanceQty: runningQty.toFixed(4),
            balanceAvgCost: mov.balanceAvgCost,
            balanceValue: (runningQty * avgCost).toFixed(2),
            documentType: mov.documentType,
            documentNumber: mov.documentNumber,
            supplierId: null,
            sourceType: 'DTE',
            sourceId: dteId,
            notes: `Reversal of movement ${mov.id}`,
            createdBy: 'system-cogs-reversal',
            journalEntryId: null,
          },
        });

        // Restore InventoryState
        await tx.inventoryState.update({
          where: { catalogItemId: mov.catalogItemId },
          data: {
            currentQty: runningQty.toFixed(4),
            totalValue: (runningQty * avgCost).toFixed(2),
            lastMovementAt: new Date(),
          },
        });
        restoredCatalogItems.add(mov.catalogItemId);
      }
    });

    // 4. Void the COGS asiento
    await this.accountingService.voidJournalEntry(tenantId, entry.id, 'system', 'DTE anulado — reversing COGS');

    this.logger.log(`COGS reversed for DTE ${dteId}: ${movements.length} movements restored, entry ${entry.id} voided`);

    return {
      dteId,
      inventoryMovementsReversed: movements.length,
      inventoryStatesRestored: restoredCatalogItems.size,
      journalEntryVoided: entry.id,
      warnings,
    };
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  private async matchDteLinesToCatalog(
    dte: DTE,
  ): Promise<{ matched: MatchedLine[]; warnings: string[] }> {
    const warnings: string[] = [];
    let json: { cuerpoDocumento?: Array<Record<string, unknown>> };
    try {
      json = JSON.parse(dte.jsonOriginal);
    } catch {
      warnings.push(`DTE ${dte.id} has invalid jsonOriginal — cannot match lines`);
      return { matched: [], warnings };
    }
    const cuerpo = json.cuerpoDocumento ?? [];
    const matched: MatchedLine[] = [];

    // Try Quote walk-back first
    const quote = await this.prisma.quote.findFirst({
      where: { tenantId: dte.tenantId, convertedToInvoiceId: dte.id },
      include: { lineItems: true },
    });

    if (quote && quote.lineItems.length > 0) {
      for (let i = 0; i < cuerpo.length; i++) {
        const dteLine = cuerpo[i];
        const quoteLine = (quote.lineItems as Array<{ catalogItemId?: string | null }>)[i];
        if (quoteLine?.catalogItemId) {
          const catItem = await this.prisma.catalogItem.findUnique({
            where: { id: quoteLine.catalogItemId },
          });
          if (catItem) {
            matched.push({
              jsonLineIndex: i,
              catalogItem: { id: catItem.id, code: catItem.code, trackInventory: catItem.trackInventory },
              quantity: Number(dteLine.cantidad ?? 0),
              unitPriceFromDte: Number(dteLine.precioUni ?? 0),
              descriptionFromDte: String(dteLine.descripcion ?? ''),
              matchSource: 'quote',
            });
            continue;
          }
        }
        const byCodigo = await this.matchByCodigo(dteLine, dte.tenantId, i);
        if (byCodigo) matched.push(byCodigo);
        else warnings.push(`Line ${i + 1}: no catalog match via quote nor codigo`);
      }
    } else {
      for (let i = 0; i < cuerpo.length; i++) {
        const byCodigo = await this.matchByCodigo(cuerpo[i], dte.tenantId, i);
        if (byCodigo) matched.push(byCodigo);
        else warnings.push(`Line ${i + 1}: no catalog match via codigo (and no quote linked)`);
      }
    }

    return { matched, warnings };
  }

  private async matchByCodigo(
    dteLine: Record<string, unknown>,
    tenantId: string,
    jsonLineIndex: number,
  ): Promise<MatchedLine | null> {
    const codigo = dteLine.codigo ? String(dteLine.codigo) : null;
    if (!codigo) return null;
    const catItem = await this.prisma.catalogItem.findUnique({
      where: { tenantId_code: { tenantId, code: codigo } },
    });
    if (!catItem) return null;
    return {
      jsonLineIndex,
      catalogItem: { id: catItem.id, code: catItem.code, trackInventory: catItem.trackInventory },
      quantity: Number(dteLine.cantidad ?? 0),
      unitPriceFromDte: Number(dteLine.precioUni ?? 0),
      descriptionFromDte: String(dteLine.descripcion ?? ''),
      matchSource: 'codigo',
    };
  }

  private emptyResult(dteId: string, warnings: string[]): CogsGenerationResult {
    return {
      dteId,
      linesMatched: 0,
      linesSkipped: 0,
      linesTracked: 0,
      inventoryMovementsCreated: [],
      inventoryStatesUpdated: [],
      journalEntry: null,
      totalCogs: 0,
      warnings,
    };
  }
}
