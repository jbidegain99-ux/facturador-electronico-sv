// apps/api/src/modules/purchases/services/purchase-reception.service.ts

import {
  Injectable,
  Logger,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import type {
  Purchase,
  PurchaseLineItem,
  InventoryMovement,
  InventoryState,
  CatalogItem,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

// =========================================================================
// Public helpers
// =========================================================================

/**
 * Standard moving weighted average cost.
 * - Empty/negative current state → new avgCost = incoming unit cost (first entry)
 * - Otherwise → (currentQty * currentAvgCost + incomingQty * incomingUnitCost) / newQty
 *
 * Pure — exported for tests. Callers round via toFixed(4) or toFixed(2) when persisting.
 */
export function computeWeightedAverage(
  currentQty: number,
  currentAvgCost: number,
  incomingQty: number,
  incomingUnitCost: number,
): { newQty: number; newAvgCost: number; newValue: number } {
  const newQty = currentQty + incomingQty;

  if (currentQty <= 0) {
    const newAvgCost = incomingUnitCost;
    const newValue = newQty * newAvgCost;
    return { newQty, newAvgCost, newValue };
  }

  const totalValueBefore = currentQty * currentAvgCost;
  const totalValueIncoming = incomingQty * incomingUnitCost;
  const newAvgCost = (totalValueBefore + totalValueIncoming) / newQty;
  const newValue = newQty * newAvgCost;

  return { newQty, newAvgCost, newValue };
}

// =========================================================================
// Types
// =========================================================================

export interface ReceiveOptions {
  receivedBy: string;
  receiptDate?: Date;
}

export type PurchaseWithReception = Purchase & {
  lineItems: PurchaseLineItem[];
  inventoryMovementsCreated: InventoryMovement[];
  inventoryStatesUpdated: InventoryState[];
};

type LineWithCatalog = PurchaseLineItem & {
  catalogItem: CatalogItem | null;
};

// =========================================================================
// Service
// =========================================================================

@Injectable()
export class PurchaseReceptionService {
  private readonly logger = new Logger(PurchaseReceptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async receive(
    tenantId: string,
    purchaseId: string,
    options: ReceiveOptions,
  ): Promise<PurchaseWithReception> {
    // 1. Load Purchase with relations
    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, tenantId },
      include: {
        lineItems: { include: { catalogItem: true } },
        supplier: true,
      },
    });

    if (!purchase) {
      throw new NotFoundException(`Purchase ${purchaseId} not found for tenant ${tenantId}`);
    }

    // 2. Idempotent return if already RECEIVED
    if (purchase.status === 'RECEIVED') {
      this.logger.debug(`Purchase ${purchaseId} already RECEIVED — returning existing`);
      const existingMovements = await this.prisma.inventoryMovement.findMany({
        where: { tenantId, sourceType: 'PURCHASE', sourceId: purchaseId },
      });
      return {
        ...purchase,
        inventoryMovementsCreated: existingMovements,
        inventoryStatesUpdated: [],
      } as PurchaseWithReception;
    }

    // 3. Status must be DRAFT
    if (purchase.status !== 'DRAFT') {
      throw new PreconditionFailedException(
        `Cannot receive Purchase in status ${purchase.status}`,
      );
    }

    const receiptDate = options.receiptDate ?? new Date();

    // 4. Classify lines — trackable vs skipped
    const linesTyped = purchase.lineItems as LineWithCatalog[];
    const trackableLines = linesTyped.filter(
      (l) => l.catalogItemId && l.catalogItem && l.catalogItem.trackInventory === true,
    );

    // 5. Group trackable lines by catalogItemId
    const lineGroups = new Map<string, LineWithCatalog[]>();
    for (const line of trackableLines) {
      const key = line.catalogItemId!;
      if (!lineGroups.has(key)) lineGroups.set(key, []);
      lineGroups.get(key)!.push(line);
    }

    // 6. Transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const createdMovements: InventoryMovement[] = [];
      const updatedStates: InventoryState[] = [];

      // 6a. Per catalogItem group — compute running weighted avg
      for (const [catalogItemId, groupLines] of lineGroups.entries()) {
        const currentState = await tx.inventoryState.findUnique({
          where: { catalogItemId },
        });

        let runningQty = Number(currentState?.currentQty ?? 0);
        let runningAvgCost = Number(currentState?.currentAvgCost ?? 0);

        const maxResult = await tx.inventoryMovement.aggregate({
          where: { tenantId, catalogItemId },
          _max: { correlativo: true },
        });
        let nextCorrelativo = (maxResult._max.correlativo ?? 0) + 1;

        for (const line of groupLines) {
          const incomingQty = Number(line.quantity);
          const incomingUnitCost = Number(line.unitCostPosted ?? line.unitPrice);
          const wa = computeWeightedAverage(
            runningQty,
            runningAvgCost,
            incomingQty,
            incomingUnitCost,
          );
          const totalCost = incomingQty * incomingUnitCost;

          const movement = await tx.inventoryMovement.create({
            data: {
              tenantId,
              catalogItemId,
              movementDate: receiptDate,
              correlativo: nextCorrelativo++,
              movementType: 'ENTRADA_COMPRA',
              qtyIn: incomingQty.toFixed(4),
              qtyOut: '0.0000',
              unitCost: incomingUnitCost.toFixed(4),
              totalCost: totalCost.toFixed(2),
              balanceQty: wa.newQty.toFixed(4),
              balanceAvgCost: wa.newAvgCost.toFixed(4),
              balanceValue: wa.newValue.toFixed(2),
              documentType: purchase.documentType,
              documentNumber: purchase.documentNumber,
              supplierId: purchase.supplierId,
              supplierNationality: 'SV',
              sourceType: 'PURCHASE',
              sourceId: purchase.id,
              purchaseLineItemId: line.id,
              notes: null,
              createdBy: options.receivedBy,
              journalEntryId: purchase.journalEntryId,
            },
          });
          createdMovements.push(movement);

          runningQty = wa.newQty;
          runningAvgCost = wa.newAvgCost;
        }

        // Upsert final state for this catalogItem
        const finalState = await tx.inventoryState.upsert({
          where: { catalogItemId },
          create: {
            tenantId,
            catalogItemId,
            currentQty: runningQty.toFixed(4),
            currentAvgCost: runningAvgCost.toFixed(4),
            totalValue: (runningQty * runningAvgCost).toFixed(2),
            lastMovementAt: receiptDate,
          },
          update: {
            currentQty: runningQty.toFixed(4),
            currentAvgCost: runningAvgCost.toFixed(4),
            totalValue: (runningQty * runningAvgCost).toFixed(2),
            lastMovementAt: receiptDate,
          },
        });
        updatedStates.push(finalState);
      }

      // 6b. Update every line (trackable + skipped) → qtyReceived + receiptStatus
      for (const line of linesTyped) {
        await tx.purchaseLineItem.update({
          where: { id: line.id },
          data: {
            qtyReceived: String(line.quantity),
            receiptStatus: 'COMPLETE',
          },
        });
      }

      // 6c. Update Purchase → RECEIVED
      const updatedPurchase = await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          status: 'RECEIVED',
          receiptDate,
          receivedBy: options.receivedBy,
        },
        include: { lineItems: true },
      });

      return { updatedPurchase, createdMovements, updatedStates };
    });

    return {
      ...result.updatedPurchase,
      inventoryMovementsCreated: result.createdMovements,
      inventoryStatesUpdated: result.updatedStates,
    } as PurchaseWithReception;
  }
}
