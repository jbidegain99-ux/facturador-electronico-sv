import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { InventoryFilterDto } from '../dto/inventory-filter.dto';

export type StockStatus = 'OK' | 'BELOW_REORDER' | 'OUT_OF_STOCK';

export interface InventoryItem {
  catalogItemId: string;
  code: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  currentQty: number;
  currentAvgCost: number;
  totalValue: number;
  reorderLevel: number | null;
  lastMovementAt: string | null;
  status: StockStatus;
}

export interface KardexRow {
  id: string;
  movementDate: string;
  correlativo: number;
  movementType: string;
  qtyIn: number;
  qtyOut: number;
  unitCost: number;
  totalCost: number;
  balanceQty: number;
  balanceAvgCost: number;
  balanceValue: number;
  documentType: string | null;
  documentNumber: string | null;
  notes: string | null;
}

export interface InventoryAlerts {
  belowReorderCount: number;
  outOfStockCount: number;
}

export interface TopBelowReorderItem {
  catalogItemId: string;
  code: string;
  description: string;
  currentQty: number;
  reorderLevel: number | null;
  status: StockStatus;
}

const MAX_RANGE_MS = 366 * 24 * 60 * 60 * 1000; // 12 months (leap-safe)

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, filters: InventoryFilterDto) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

    const catalogItemWhere: Prisma.CatalogItemWhereInput = { type: 'BIEN' };
    if (filters.categoryId) catalogItemWhere.categoryId = filters.categoryId;
    if (filters.search) {
      catalogItemWhere.OR = [
        { code: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    const where: Prisma.InventoryStateWhereInput = {
      tenantId,
      catalogItem: catalogItemWhere,
    };

    const orderBy = this.buildOrderBy(filters.sortBy, filters.sortOrder);

    const [states, total] = await Promise.all([
      this.prisma.inventoryState.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          catalogItem: {
            select: { code: true, description: true, type: true, categoryId: true, category: { select: { name: true } } },
          },
        },
      }),
      this.prisma.inventoryState.count({ where }),
    ]);

    let data: InventoryItem[] = states.map((s) => this.toItem(s));

    if (filters.status) {
      data = data.filter((d) => d.status === filters.status);
    }

    return {
      data,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      page,
      limit,
    };
  }

  async findOne(tenantId: string, catalogItemId: string): Promise<InventoryItem> {
    const state = await this.prisma.inventoryState.findFirst({
      where: { tenantId, catalogItemId, catalogItem: { type: 'BIEN' } },
      include: {
        catalogItem: {
          select: { code: true, description: true, type: true, categoryId: true, category: { select: { name: true } } },
        },
      },
    });
    if (!state) {
      throw new NotFoundException({
        message: 'Este ítem aún no tiene movimientos de inventario',
        code: 'NO_INVENTORY_STATE',
      });
    }
    return this.toItem(state);
  }

  async getKardex(
    tenantId: string,
    catalogItemId: string,
    startDate: string,
    endDate: string,
    movementType?: string,
  ): Promise<KardexRow[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    if (end.getTime() < start.getTime()) {
      throw new BadRequestException('endDate debe ser posterior a startDate');
    }
    if (end.getTime() - start.getTime() > MAX_RANGE_MS) {
      throw new BadRequestException('Rango máximo 12 meses');
    }

    const where: Prisma.InventoryMovementWhereInput = {
      tenantId,
      catalogItemId,
      movementDate: { gte: start, lte: end },
    };
    if (movementType) where.movementType = movementType;

    const rows = await this.prisma.inventoryMovement.findMany({
      where,
      orderBy: [{ movementDate: 'asc' }, { correlativo: 'asc' }],
    });

    return rows.map((r) => ({
      id: r.id,
      movementDate: r.movementDate.toISOString(),
      correlativo: r.correlativo,
      movementType: r.movementType,
      qtyIn: Number(r.qtyIn.toString()),
      qtyOut: Number(r.qtyOut.toString()),
      unitCost: Number(r.unitCost.toString()),
      totalCost: Number(r.totalCost.toString()),
      balanceQty: Number(r.balanceQty.toString()),
      balanceAvgCost: Number(r.balanceAvgCost.toString()),
      balanceValue: Number(r.balanceValue.toString()),
      documentType: r.documentType,
      documentNumber: r.documentNumber,
      notes: r.notes,
    }));
  }

  private buildOrderBy(sortBy?: string, sortOrder?: 'asc' | 'desc'): Prisma.InventoryStateOrderByWithRelationInput {
    const order = sortOrder ?? 'asc';
    switch (sortBy) {
      case 'code':
        return { catalogItem: { code: order } };
      case 'description':
        return { catalogItem: { description: order } };
      case 'currentQty':
        return { currentQty: order };
      case 'totalValue':
        return { totalValue: order };
      case 'lastMovementAt':
        return { lastMovementAt: order };
      default:
        return { catalogItem: { code: 'asc' } };
    }
  }

  private toItem(state: {
    catalogItemId: string;
    currentQty: { toString(): string };
    currentAvgCost: { toString(): string };
    totalValue: { toString(): string };
    reorderLevel: { toString(): string } | null;
    lastMovementAt: Date | null;
    catalogItem: { code: string; description: string | null; categoryId: string | null; category: { name: string } | null };
  }): InventoryItem {
    const currentQty = Number(state.currentQty.toString());
    const reorderLevel = state.reorderLevel ? Number(state.reorderLevel.toString()) : null;
    let status: StockStatus = 'OK';
    if (currentQty <= 0) status = 'OUT_OF_STOCK';
    else if (reorderLevel !== null && currentQty <= reorderLevel) status = 'BELOW_REORDER';

    return {
      catalogItemId: state.catalogItemId,
      code: state.catalogItem.code,
      description: state.catalogItem.description ?? null,
      categoryId: state.catalogItem.categoryId,
      categoryName: state.catalogItem.category?.name ?? null,
      currentQty,
      currentAvgCost: Number(state.currentAvgCost.toString()),
      totalValue: Number(state.totalValue.toString()),
      reorderLevel,
      lastMovementAt: state.lastMovementAt ? state.lastMovementAt.toISOString() : null,
      status,
    };
  }
}
