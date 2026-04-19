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
  description: string | null;
  currentQty: number;
  reorderLevel: number | null;
  status: StockStatus;
}

const MAX_RANGE_MS = 367 * 24 * 60 * 60 * 1000; // 12 months + 1 day tolerance for EOD shift

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, filters: InventoryFilterDto) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

    const catalogItemWhere: Prisma.CatalogItemWhereInput = { trackInventory: true };
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
            select: { code: true, description: true, categoryId: true, category: { select: { name: true } } },
          },
        },
      }),
      this.prisma.inventoryState.count({ where }),
    ]);

    const data: InventoryItem[] = states.map((s) => this.toItem(s));

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
      where: { tenantId, catalogItemId, catalogItem: { trackInventory: true } },
      include: {
        catalogItem: {
          select: { code: true, description: true, categoryId: true, category: { select: { name: true } } },
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

  async getAlerts(tenantId: string): Promise<InventoryAlerts> {
    const [below, outOfStockCount] = await Promise.all([
      this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) AS count
        FROM inventory_states s
        INNER JOIN CatalogItem c ON c.id = s.catalogItemId
        WHERE s.tenantId = ${tenantId}
          AND c.trackInventory = 1
          AND s.reorderLevel IS NOT NULL
          AND s.currentQty > 0
          AND s.currentQty <= s.reorderLevel
      `,
      this.prisma.inventoryState.count({
        where: {
          tenantId,
          catalogItem: { trackInventory: true },
          currentQty: { lte: 0 },
        },
      }),
    ]);
    return {
      belowReorderCount: Number(below[0]?.count ?? 0),
      outOfStockCount,
    };
  }

  async getTopBelowReorder(tenantId: string, limit: number = 5): Promise<TopBelowReorderItem[]> {
    const clampedLimit = Math.min(50, Math.max(1, limit));
    const states = await this.prisma.inventoryState.findMany({
      where: {
        tenantId,
        catalogItem: { trackInventory: true },
        OR: [
          { currentQty: { lte: 0 } },
          { AND: [{ reorderLevel: { not: null } }, { currentQty: { gt: 0 } }] },
        ],
      },
      include: {
        catalogItem: { select: { code: true, description: true } },
      },
      take: clampedLimit,
    });

    interface Scored extends TopBelowReorderItem {
      deficit: number;
    }

    const scored: Scored[] = states.map((s) => {
      const currentQty = Number(s.currentQty.toString());
      const reorderLevel = s.reorderLevel ? Number(s.reorderLevel.toString()) : null;
      let status: StockStatus = 'OK';
      if (currentQty <= 0) status = 'OUT_OF_STOCK';
      else if (reorderLevel !== null && currentQty <= reorderLevel) status = 'BELOW_REORDER';
      return {
        catalogItemId: s.catalogItemId,
        code: s.catalogItem.code,
        description: s.catalogItem.description,
        currentQty,
        reorderLevel,
        status,
        deficit: status === 'OUT_OF_STOCK'
          ? Number.POSITIVE_INFINITY
          : reorderLevel !== null
            ? reorderLevel - currentQty
            : Number.POSITIVE_INFINITY,
      };
    });

    return scored
      .filter((i) => i.status !== 'OK')
      .sort((a, b) => b.deficit - a.deficit)
      .slice(0, clampedLimit)
      .map(({ deficit: _deficit, ...rest }) => rest);
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
