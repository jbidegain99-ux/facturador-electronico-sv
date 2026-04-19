import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { InventoryAdjustmentService } from '../../inventory-adjustments/services/inventory-adjustment.service';
import { CreatePhysicalCountDto } from '../dto/create-physical-count.dto';
import { ListCountsDto } from '../dto/list-counts.dto';

export interface PhysicalCountSummary {
  totalLines: number;
  countedLines: number;
  pendingLines: number;
  adjustedLines: number;
  varianceNet: number;
}

export interface PhysicalCountWithSummary {
  id: string;
  fiscalYear: number;
  countDate: string;
  status: string;
  notes: string | null;
  finalizedAt: string | null;
  finalizedBy: string | null;
  createdAt: string;
  createdBy: string;
  summary: PhysicalCountSummary;
}

interface DetailRow {
  id: string;
  catalogItemId: string;
  systemQty: { toString(): string };
  countedQty: { toString(): string } | null;
  variance: { toString(): string };
  unitCost: { toString(): string };
  totalValue: { toString(): string };
  adjustmentMovementId: string | null;
  notes: string | null;
  catalogItem: { code: string; description: string | null };
}

@Injectable()
export class PhysicalCountService {
  private readonly logger = new Logger(PhysicalCountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adjustmentService: InventoryAdjustmentService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreatePhysicalCountDto) {
    const existing = await this.prisma.physicalCount.findFirst({
      where: { tenantId, fiscalYear: dto.fiscalYear },
    });
    if (existing) {
      throw new ConflictException({
        code: 'DUPLICATE_FISCAL_YEAR',
        message: `Ya existe un conteo para el año ${dto.fiscalYear}`,
      });
    }

    const date = new Date(dto.countDate);
    if (date.getTime() > Date.now()) {
      throw new BadRequestException({
        code: 'INVALID_COUNT_DATE',
        message: 'La fecha de conteo no puede ser futura',
      });
    }

    const items = await this.prisma.catalogItem.findMany({
      where: { tenantId, trackInventory: true, isActive: true },
      select: { id: true, code: true },
    });
    const states = await this.prisma.inventoryState.findMany({
      where: { tenantId, catalogItemId: { in: items.map((i) => i.id) } },
      select: { catalogItemId: true, currentQty: true, currentAvgCost: true },
    });
    const stateByItem = new Map(states.map((s) => [s.catalogItemId, s]));

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.physicalCount.create({
        data: {
          tenantId,
          countDate: date,
          fiscalYear: dto.fiscalYear,
          status: 'DRAFT',
          notes: dto.notes ?? null,
          createdBy: userId,
        },
      });

      if (items.length > 0) {
        await tx.physicalCountDetail.createMany({
          data: items.map((item) => {
            const state = stateByItem.get(item.id);
            const systemQty = state ? Number(state.currentQty.toString()) : 0;
            const unitCost = state ? Number(state.currentAvgCost.toString()) : 0;
            return {
              physicalCountId: count.id,
              tenantId,
              catalogItemId: item.id,
              systemQty,
              countedQty: null,
              variance: 0,
              unitCost,
              totalValue: 0,
            };
          }),
        });
      }

      return {
        id: count.id,
        fiscalYear: count.fiscalYear,
        countDate: dto.countDate,
        status: count.status,
        notes: count.notes ?? null,
        totalDetails: items.length,
      };
    });
  }

  async findAll(tenantId: string, filters: ListCountsDto) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

    const where: Prisma.PhysicalCountWhereInput = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.fiscalYear) where.fiscalYear = filters.fiscalYear;

    const [rows, total] = await Promise.all([
      this.prisma.physicalCount.findMany({
        where,
        orderBy: { fiscalYear: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.physicalCount.count({ where }),
    ]);

    const data: PhysicalCountWithSummary[] = [];
    for (const count of rows) {
      data.push({
        id: count.id,
        fiscalYear: count.fiscalYear,
        countDate: count.countDate.toISOString().slice(0, 10),
        status: count.status,
        notes: count.notes,
        finalizedAt: count.finalizedAt ? count.finalizedAt.toISOString() : null,
        finalizedBy: count.finalizedBy,
        createdAt: count.createdAt.toISOString(),
        createdBy: count.createdBy,
        summary: await this.computeSummary(count.id),
      });
    }

    return {
      data,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      page,
      limit,
    };
  }

  async findOne(
    tenantId: string,
    id: string,
    filters: { search?: string; page?: number; limit?: number },
  ) {
    const count = await this.prisma.physicalCount.findUnique({ where: { id } });
    if (!count || count.tenantId !== tenantId) {
      throw new NotFoundException({ code: 'COUNT_NOT_FOUND', message: 'Conteo no encontrado' });
    }

    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(500, Math.max(1, filters.limit ?? 200));

    const detailWhere: Prisma.PhysicalCountDetailWhereInput = { physicalCountId: id };
    if (filters.search) {
      detailWhere.catalogItem = {
        OR: [
          { code: { contains: filters.search } },
          { description: { contains: filters.search } },
        ],
      };
    }

    const [details, detailTotal] = await Promise.all([
      this.prisma.physicalCountDetail.findMany({
        where: detailWhere,
        include: { catalogItem: { select: { code: true, description: true } } },
        orderBy: { catalogItem: { code: 'asc' } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.physicalCountDetail.count({ where: detailWhere }),
    ]);

    return {
      id: count.id,
      fiscalYear: count.fiscalYear,
      countDate: count.countDate.toISOString().slice(0, 10),
      status: count.status,
      notes: count.notes,
      finalizedAt: count.finalizedAt ? count.finalizedAt.toISOString() : null,
      finalizedBy: count.finalizedBy,
      createdAt: count.createdAt.toISOString(),
      createdBy: count.createdBy,
      summary: await this.computeSummary(count.id),
      details: {
        data: (details as unknown as DetailRow[]).map((d) => this.mapDetail(d)),
        total: detailTotal,
        totalPages: Math.ceil(detailTotal / limit) || 1,
        page,
        limit,
      },
    };
  }

  async updateDetail(
    tenantId: string,
    countId: string,
    detailId: string,
    dto: import('../dto/update-detail.dto').UpdateDetailDto,
  ) {
    const count = await this.prisma.physicalCount.findUnique({ where: { id: countId } });
    if (!count || count.tenantId !== tenantId) {
      throw new NotFoundException({ code: 'COUNT_NOT_FOUND', message: 'Conteo no encontrado' });
    }
    if (count.status !== 'DRAFT') {
      throw new BadRequestException({
        code: 'COUNT_NOT_EDITABLE',
        message: 'Solo se puede editar un conteo en estado DRAFT',
      });
    }

    const detail = await this.prisma.physicalCountDetail.findFirst({
      where: { id: detailId, physicalCountId: countId, tenantId },
    });
    if (!detail) {
      throw new NotFoundException({ code: 'DETAIL_NOT_FOUND', message: 'Línea no encontrada' });
    }

    const data: Prisma.PhysicalCountDetailUpdateInput = {};

    const hasCountedQty = Object.prototype.hasOwnProperty.call(dto, 'countedQty');
    const systemQty = Number(detail.systemQty.toString());
    const currentUnitCost = Number(detail.unitCost.toString());

    let effectiveCountedQty: number | null = null;
    if (hasCountedQty) {
      if (dto.countedQty === null || dto.countedQty === undefined) {
        data.countedQty = null;
        data.variance = 0;
        data.totalValue = 0;
      } else {
        effectiveCountedQty = dto.countedQty;
        data.countedQty = dto.countedQty;
      }
    } else if (detail.countedQty) {
      effectiveCountedQty = Number(detail.countedQty.toString());
    }

    if (effectiveCountedQty !== null) {
      const variance = effectiveCountedQty - systemQty;
      data.variance = variance;

      let effectiveUnitCost = currentUnitCost;
      if (variance > 0 && dto.unitCost !== undefined) {
        effectiveUnitCost = dto.unitCost;
        data.unitCost = dto.unitCost;
      } else if (dto.unitCost !== undefined && variance <= 0) {
        this.logger.warn(
          `Ignoring unitCost override for detail ${detailId}: variance (${variance}) is not positive`,
        );
      }
      data.totalValue = variance * effectiveUnitCost;
    }

    if (dto.notes !== undefined) data.notes = dto.notes;

    await this.prisma.physicalCountDetail.update({
      where: { id: detailId },
      data,
    });

    const updated = await this.prisma.physicalCountDetail.findFirst({
      where: { id: detailId },
      include: { catalogItem: { select: { code: true, description: true } } },
    });
    return this.mapDetail(updated as unknown as DetailRow);
  }

  async cancel(
    tenantId: string,
    countId: string,
    dto: import('../dto/cancel.dto').CancelDto,
  ) {
    const count = await this.prisma.physicalCount.findUnique({ where: { id: countId } });
    if (!count || count.tenantId !== tenantId) {
      throw new NotFoundException({ code: 'COUNT_NOT_FOUND', message: 'Conteo no encontrado' });
    }
    if (count.status !== 'DRAFT') {
      throw new ConflictException({
        code: 'NOT_DRAFT',
        message: 'Solo conteos en DRAFT se pueden cancelar',
      });
    }

    const newNotes = count.notes
      ? `${count.notes}\nCancelled: ${dto.reason ?? 'Sin razón'}`
      : `Cancelled: ${dto.reason ?? 'Sin razón'}`;

    await this.prisma.physicalCount.update({
      where: { id: countId },
      data: { status: 'CANCELLED', notes: newNotes },
    });

    return { id: countId, status: 'CANCELLED' };
  }

  private async computeSummary(countId: string): Promise<PhysicalCountSummary> {
    const [totalLines, countedLines, adjustedLines, sumAgg] = await Promise.all([
      this.prisma.physicalCountDetail.count({ where: { physicalCountId: countId } }),
      this.prisma.physicalCountDetail.count({
        where: { physicalCountId: countId, countedQty: { not: null } },
      }),
      this.prisma.physicalCountDetail.count({
        where: { physicalCountId: countId, adjustmentMovementId: { not: null } },
      }),
      this.prisma.physicalCountDetail.aggregate({
        where: { physicalCountId: countId, countedQty: { not: null } },
        _sum: { totalValue: true },
      }),
    ]);
    const rawTotal = sumAgg._sum?.totalValue;
    const varianceNet = rawTotal ? Number(rawTotal.toString()) : 0;

    return {
      totalLines,
      countedLines,
      pendingLines: totalLines - countedLines,
      adjustedLines,
      varianceNet,
    };
  }

  private mapDetail(d: DetailRow) {
    return {
      id: d.id,
      catalogItemId: d.catalogItemId,
      code: d.catalogItem.code,
      description: d.catalogItem.description,
      systemQty: Number(d.systemQty.toString()),
      countedQty: d.countedQty ? Number(d.countedQty.toString()) : null,
      variance: Number(d.variance.toString()),
      unitCost: Number(d.unitCost.toString()),
      totalValue: Number(d.totalValue.toString()),
      adjustmentMovementId: d.adjustmentMovementId,
      notes: d.notes,
    };
  }
}
