import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountingService } from '../../accounting/accounting.service';
import { PlanFeaturesService } from '../../plans/services/plan-features.service';
import { CreateAdjustmentDto, AdjustmentSubtype } from '../dto/create-adjustment.dto';
import { DEFAULT_MAPPINGS } from '../../accounting/default-mappings.data';

const SUBTYPE_TO_MOVEMENT_TYPE: Record<AdjustmentSubtype, string> = {
  ROBO: 'SALIDA_ROBO',
  MERMA: 'SALIDA_MERMA',
  DONACION: 'SALIDA_DONACION',
  AUTOCONSUMO: 'SALIDA_AUTOCONSUMO',
  AJUSTE_FALTANTE: 'SALIDA_AJUSTE',
  AJUSTE_SOBRANTE: 'ENTRADA_AJUSTE',
};

const SUBTYPE_TO_OPERATION: Record<AdjustmentSubtype, string> = {
  ROBO: 'AJUSTE_ROBO',
  MERMA: 'AJUSTE_MERMA',
  DONACION: 'AJUSTE_DONACION',
  AUTOCONSUMO: 'AJUSTE_AUTOCONSUMO',
  AJUSTE_FALTANTE: 'AJUSTE_FISICO_FALTANTE',
  AJUSTE_SOBRANTE: 'AJUSTE_FISICO_SOBRANTE',
};

const ENTRADA_SUBTYPES: AdjustmentSubtype[] = ['AJUSTE_SOBRANTE'];

interface MovementRow {
  id: string;
  correlativo: number;
  movementType: string;
  movementDate: Date;
  qtyIn: { toString(): string };
  qtyOut: { toString(): string };
  unitCost: { toString(): string };
  totalCost: { toString(): string };
  balanceQty: { toString(): string };
  balanceAvgCost: { toString(): string };
  balanceValue: { toString(): string };
  journalEntryId: string | null;
  notes: string | null;
}

interface InventoryStateRow {
  id: string;
  tenantId: string;
  catalogItemId: string;
  currentQty: { toString(): string };
  currentAvgCost: { toString(): string };
  totalValue: { toString(): string };
  reorderLevel: number | null;
  lastMovementAt: Date | null;
}

interface CatalogItemRow {
  id: string;
  tenantId: string;
  trackInventory: boolean;
  code: string;
}

interface TxClient {
  inventoryState: {
    findFirst(args: { where: { tenantId: string; catalogItemId: string } }): Promise<InventoryStateRow | null>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
  };
  inventoryMovement: {
    aggregate(args: {
      where: { tenantId: string; catalogItemId: string };
      _max: { correlativo: boolean };
    }): Promise<{ _max: { correlativo: number | null } }>;
    create(args: { data: Record<string, unknown> }): Promise<MovementRow>;
  };
}

@Injectable()
export class InventoryAdjustmentService {
  private readonly logger = new Logger(InventoryAdjustmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
    private readonly planFeatures: PlanFeaturesService,
  ) {}

  async createAdjustment(
    tenantId: string,
    userId: string,
    dto: CreateAdjustmentDto,
  ): Promise<ReturnType<typeof this.toResponse>> {
    const item = (await this.prisma.catalogItem.findFirst({
      where: { id: dto.catalogItemId, tenantId },
    })) as CatalogItemRow | null;

    if (!item) {
      throw new BadRequestException({ code: 'ITEM_NOT_FOUND', message: 'Ítem no encontrado' });
    }
    if (!item.trackInventory) {
      throw new BadRequestException({ code: 'NOT_TRACKED', message: 'El ítem no tiene inventario activado' });
    }

    this.validateDate(dto.movementDate);

    const isEntrada = ENTRADA_SUBTYPES.includes(dto.subtype);
    const movementType = SUBTYPE_TO_MOVEMENT_TYPE[dto.subtype];

    const result = await this.prisma.$transaction(async (tx) => {
      const typedTx = tx as unknown as TxClient;

      const state = await typedTx.inventoryState.findFirst({
        where: { tenantId, catalogItemId: dto.catalogItemId },
      });

      if (!isEntrada) {
        const availableQty = state ? Number(state.currentQty.toString()) : 0;
        if (availableQty < dto.quantity) {
          throw new BadRequestException({
            code: 'INSUFFICIENT_STOCK',
            message: 'Stock insuficiente',
            available: availableQty,
          });
        }
      } else if (!dto.unitCost) {
        throw new BadRequestException({
          code: 'MISSING_UNIT_COST',
          message: 'AJUSTE_SOBRANTE requiere unitCost',
        });
      }

      const maxAgg = await typedTx.inventoryMovement.aggregate({
        where: { tenantId, catalogItemId: dto.catalogItemId },
        _max: { correlativo: true },
      });
      const correlativo = (maxAgg._max.correlativo ?? 0) + 1;

      const currentQty = state ? Number(state.currentQty.toString()) : 0;
      const currentAvgCost = state ? Number(state.currentAvgCost.toString()) : 0;

      let unitCost: number;
      let newQty: number;
      let newAvgCost: number;
      let qtyIn = 0;
      let qtyOut = 0;

      if (isEntrada) {
        unitCost = dto.unitCost!;
        qtyIn = dto.quantity;
        newQty = currentQty + dto.quantity;
        newAvgCost =
          newQty === 0
            ? unitCost
            : (currentQty * currentAvgCost + dto.quantity * unitCost) / newQty;
      } else {
        unitCost = currentAvgCost;
        qtyOut = dto.quantity;
        newQty = currentQty - dto.quantity;
        newAvgCost = currentAvgCost;
      }

      const totalCost = dto.quantity * unitCost;
      const newValue = newQty * newAvgCost;

      const movement = await typedTx.inventoryMovement.create({
        data: {
          tenantId,
          catalogItemId: dto.catalogItemId,
          movementDate: new Date(dto.movementDate),
          correlativo,
          movementType,
          qtyIn,
          qtyOut,
          unitCost,
          totalCost,
          balanceQty: newQty,
          balanceAvgCost: newAvgCost,
          balanceValue: newValue,
          sourceType: 'MANUAL_ADJUSTMENT',
          sourceId: userId,
          notes: dto.notes ?? null,
          createdBy: userId,
        },
      });

      if (state) {
        await typedTx.inventoryState.update({
          where: { id: state.id },
          data: {
            currentQty: newQty,
            currentAvgCost: newAvgCost,
            totalValue: newValue,
            lastMovementAt: new Date(dto.movementDate),
          },
        });
      } else {
        await typedTx.inventoryState.create({
          data: {
            tenantId,
            catalogItemId: dto.catalogItemId,
            currentQty: newQty,
            currentAvgCost: newAvgCost,
            totalValue: newValue,
            lastMovementAt: new Date(dto.movementDate),
          },
        });
      }

      return this.toResponse(movement);
    });

    // Post journal entry if accounting feature is enabled for the tenant's plan.
    // Failure MUST NOT rollback the movement — always return result on error.
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });
    if (!tenant) return result;

    const hasAccounting = await this.planFeatures.checkFeatureAccess(tenant.plan, 'accounting');
    if (!hasAccounting) return result;

    try {
      const operation = SUBTYPE_TO_OPERATION[dto.subtype];
      const mapping = DEFAULT_MAPPINGS.find((m) => m.operation === operation);
      if (!mapping) {
        this.logger.warn(`No accounting mapping for operation ${operation}`);
        return result;
      }

      const [debitAccount, creditAccount] = await Promise.all([
        this.findAccountByCode(tenantId, mapping.debitCode),
        this.findAccountByCode(tenantId, mapping.creditCode),
      ]);

      if (!debitAccount || !creditAccount) {
        this.logger.warn(
          `Movement ${result.id} saved but journal entry skipped: missing account for ${operation} ` +
            `(debit=${mapping.debitCode}, credit=${mapping.creditCode})`,
        );
        return result;
      }

      const entry = await this.accounting.createJournalEntry(tenantId, {
        entryDate: new Date(dto.movementDate).toISOString(),
        description: `Ajuste ${dto.subtype} — ${item.code ?? dto.catalogItemId}`,
        entryType: 'ADJUSTMENT',
        sourceType: 'INVENTORY_ADJUSTMENT',
        sourceDocumentId: result.id,
        lines: [
          {
            accountId: debitAccount.id,
            description: mapping.mappingConfig.debe[0]?.descripcion ?? 'Debe',
            debit: result.totalCost,
            credit: 0,
          },
          {
            accountId: creditAccount.id,
            description: mapping.mappingConfig.haber[0]?.descripcion ?? 'Haber',
            debit: 0,
            credit: result.totalCost,
          },
        ],
      });
      await this.accounting.postJournalEntry(tenantId, entry.id, userId);

      await this.prisma.inventoryMovement.update({
        where: { id: result.id },
        data: { journalEntryId: entry.id },
      });

      return { ...result, journalEntryId: entry.id };
    } catch (err) {
      this.logger.warn(
        `Movement ${result.id} saved but journal entry failed: ${(err as Error).message}`,
      );
      return result;
    }
  }

  private async findAccountByCode(
    tenantId: string,
    code: string,
  ): Promise<{ id: string; isActive: boolean; allowsPosting: boolean } | null> {
    const account =
      (await this.prisma.accountingAccount.findUnique({
        where: { tenantId_code: { tenantId, code } },
        select: { id: true, isActive: true, allowsPosting: true },
      })) ??
      (await this.prisma.accountingAccount.findFirst({
        where: { tenantId, code },
        select: { id: true, isActive: true, allowsPosting: true },
      }));

    if (!account || account.isActive === false || account.allowsPosting === false) {
      return null;
    }
    return account;
  }

  private validateDate(isoDate: string): void {
    const date = new Date(isoDate);
    const now = new Date();
    if (date.getTime() > now.getTime()) {
      throw new BadRequestException({ code: 'FUTURE_DATE', message: 'Fecha no puede ser futura' });
    }
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    if (date.getTime() < monthStart.getTime()) {
      throw new BadRequestException({
        code: 'DATE_BEFORE_MONTH_START',
        message: 'Fecha debe ser dentro del mes actual',
      });
    }
  }

  private toResponse(m: MovementRow): {
    id: string;
    correlativo: number;
    movementType: string;
    movementDate: string;
    qtyIn: number;
    qtyOut: number;
    unitCost: number;
    totalCost: number;
    balanceQty: number;
    balanceAvgCost: number;
    balanceValue: number;
    journalEntryId: string | null;
    notes: string | null;
  } {
    return {
      id: m.id,
      correlativo: m.correlativo,
      movementType: m.movementType,
      movementDate: m.movementDate.toISOString(),
      qtyIn: Number(m.qtyIn.toString()),
      qtyOut: Number(m.qtyOut.toString()),
      unitCost: Number(m.unitCost.toString()),
      totalCost: Number(m.totalCost.toString()),
      balanceQty: Number(m.balanceQty.toString()),
      balanceAvgCost: Number(m.balanceAvgCost.toString()),
      balanceValue: Number(m.balanceValue.toString()),
      journalEntryId: m.journalEntryId,
      notes: m.notes,
    };
  }
}
