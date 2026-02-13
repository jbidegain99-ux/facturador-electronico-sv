import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { QueryCatalogItemDto } from './dto/query-catalog-item.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response';
import { getPlanFeatures } from '../../common/plan-features';
import { CatalogItem, CatalogCategory } from '@prisma/client';

const ALLOWED_SORT_FIELDS: Record<string, string> = {
  name: 'name',
  code: 'code',
  basePrice: 'basePrice',
  usageCount: 'usageCount',
  createdAt: 'createdAt',
  type: 'type',
};

export interface ImportRowError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  errors: ImportRowError[];
}

export interface CatalogItemRow {
  code: string;
  name: string;
  description?: string;
  type?: string;
  basePrice: number;
  costPrice?: number;
  tipoItem?: number;
  uniMedida?: number;
  tributo?: string;
  taxRate?: number;
  categoryId?: string;
}

type CatalogItemWithCategory = CatalogItem & {
  category?: CatalogCategory | null;
};

@Injectable()
export class CatalogItemsService {
  private readonly logger = new Logger(CatalogItemsService.name);

  constructor(private prisma: PrismaService) {}

  // =========================================================================
  // PLAN GATING
  // =========================================================================

  async getTenantPlanCode(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });
    return tenant?.plan ?? 'DEMO';
  }

  async countItems(tenantId: string): Promise<number> {
    return this.prisma.catalogItem.count({ where: { tenantId } });
  }

  async checkPlanLimit(tenantId: string, additionalItems: number = 1): Promise<void> {
    const planCode = await this.getTenantPlanCode(tenantId);
    const features = getPlanFeatures(planCode);

    if (features.maxCatalogItems === -1) return; // unlimited

    const currentCount = await this.countItems(tenantId);
    if (currentCount + additionalItems > features.maxCatalogItems) {
      throw new ForbiddenException(
        `Has alcanzado el limite de ${features.maxCatalogItems} items en tu plan. Actualiza tu plan para agregar mas productos.`,
      );
    }
  }

  async getPlanLimitInfo(tenantId: string): Promise<{ current: number; max: number; planCode: string }> {
    const planCode = await this.getTenantPlanCode(tenantId);
    const features = getPlanFeatures(planCode);
    const current = await this.countItems(tenantId);
    return { current, max: features.maxCatalogItems, planCode };
  }

  // =========================================================================
  // CATALOG ITEMS CRUD
  // =========================================================================

  async create(
    tenantId: string,
    dto: CreateCatalogItemDto,
  ): Promise<CatalogItem> {
    await this.checkPlanLimit(tenantId);

    const existing = await this.prisma.catalogItem.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un item con el codigo "${dto.code}"`,
      );
    }

    this.logger.log(
      `Creating catalog item "${dto.name}" (${dto.code}) for tenant ${tenantId}`,
    );

    return this.prisma.catalogItem.create({
      data: {
        tenantId,
        type: dto.type,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        tipoItem: dto.tipoItem ?? 1,
        basePrice: dto.basePrice,
        costPrice: dto.costPrice,
        uniMedida: dto.uniMedida ?? 99,
        tributo: dto.tributo ?? '20',
        taxRate: dto.taxRate ?? 13.0,
        categoryId: dto.categoryId ?? null,
      },
    });
  }

  async findAll(
    tenantId: string,
    query: QueryCatalogItemDto,
  ): Promise<PaginatedResponse<CatalogItemWithCategory>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Math.max(1, Number(query.limit) || 20), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };

    if (query.type) {
      where.type = query.type;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    } else {
      where.isActive = true;
    }

    if (query.isFavorite === 'true') {
      where.isFavorite = true;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { code: { contains: query.search } },
      ];
    }

    const sortField = ALLOWED_SORT_FIELDS[query.sortBy || ''] || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const [data, total] = await Promise.all([
      this.prisma.catalogItem.findMany({
        where,
        include: { category: true },
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.catalogItem.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(tenantId: string, id: string): Promise<CatalogItem> {
    const item = await this.prisma.catalogItem.findFirst({
      where: { id, tenantId },
      include: { category: true },
    });

    if (!item) {
      throw new NotFoundException('Item de catalogo no encontrado');
    }

    return item;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCatalogItemDto,
  ): Promise<CatalogItem> {
    const item = await this.findOne(tenantId, id);

    if (dto.code !== undefined && dto.code !== item.code) {
      const existing = await this.prisma.catalogItem.findUnique({
        where: { tenantId_code: { tenantId, code: dto.code } },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un item con el codigo "${dto.code}"`,
        );
      }
    }

    this.logger.log(`Updating catalog item ${id} for tenant ${tenantId}`);

    const data: Record<string, unknown> = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.tipoItem !== undefined) data.tipoItem = dto.tipoItem;
    if (dto.basePrice !== undefined) data.basePrice = dto.basePrice;
    if (dto.costPrice !== undefined) data.costPrice = dto.costPrice;
    if (dto.uniMedida !== undefined) data.uniMedida = dto.uniMedida;
    if (dto.tributo !== undefined) data.tributo = dto.tributo;
    if (dto.taxRate !== undefined) data.taxRate = dto.taxRate;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId || null;

    return this.prisma.catalogItem.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async remove(tenantId: string, id: string): Promise<{ message: string }> {
    await this.findOne(tenantId, id);

    this.logger.log(`Deleting catalog item ${id} for tenant ${tenantId}`);

    await this.prisma.catalogItem.delete({ where: { id } });

    return { message: 'Item eliminado correctamente' };
  }

  async toggleFavorite(tenantId: string, id: string): Promise<CatalogItem> {
    const item = await this.findOne(tenantId, id);

    return this.prisma.catalogItem.update({
      where: { id },
      data: { isFavorite: !item.isFavorite },
    });
  }

  async search(
    tenantId: string,
    q: string,
    limit: number = 20,
  ): Promise<CatalogItem[]> {
    const take = Math.min(Math.max(1, limit), 50);

    return this.prisma.catalogItem.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { name: { contains: q } },
          { code: { contains: q } },
        ],
      },
      include: { category: true },
      orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
      take,
    });
  }

  async getRecent(tenantId: string): Promise<CatalogItem[]> {
    return this.prisma.catalogItem.findMany({
      where: {
        tenantId,
        isActive: true,
        lastUsedAt: { not: null },
      },
      orderBy: { lastUsedAt: 'desc' },
      take: 10,
    });
  }

  async getFavorites(tenantId: string): Promise<CatalogItem[]> {
    return this.prisma.catalogItem.findMany({
      where: {
        tenantId,
        isActive: true,
        isFavorite: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // =========================================================================
  // CATEGORIES CRUD
  // =========================================================================

  async getCategories(tenantId: string): Promise<CatalogCategory[]> {
    return this.prisma.catalogCategory.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { items: true } } },
    });
  }

  async createCategory(
    tenantId: string,
    dto: CreateCategoryDto,
  ): Promise<CatalogCategory> {
    const existing = await this.prisma.catalogCategory.findUnique({
      where: { tenantId_name: { tenantId, name: dto.name } },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe una categoria con el nombre "${dto.name}"`,
      );
    }

    this.logger.log(`Creating category "${dto.name}" for tenant ${tenantId}`);

    return this.prisma.catalogCategory.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateCategory(
    tenantId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CatalogCategory> {
    const category = await this.prisma.catalogCategory.findFirst({
      where: { id, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Categoria no encontrada');
    }

    if (dto.name !== undefined && dto.name !== category.name) {
      const existing = await this.prisma.catalogCategory.findUnique({
        where: { tenantId_name: { tenantId, name: dto.name } },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe una categoria con el nombre "${dto.name}"`,
        );
      }
    }

    this.logger.log(`Updating category ${id} for tenant ${tenantId}`);

    return this.prisma.catalogCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async deleteCategory(tenantId: string, id: string): Promise<{ message: string }> {
    const category = await this.prisma.catalogCategory.findFirst({
      where: { id, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Categoria no encontrada');
    }

    // Unlink items from this category (set categoryId to null)
    await this.prisma.catalogItem.updateMany({
      where: { categoryId: id, tenantId },
      data: { categoryId: null },
    });

    await this.prisma.catalogCategory.delete({ where: { id } });

    this.logger.log(`Deleted category ${id} for tenant ${tenantId}`);

    return { message: 'Categoria eliminada correctamente' };
  }

  // =========================================================================
  // IMPORT / EXPORT
  // =========================================================================

  async importItems(
    tenantId: string,
    rows: CatalogItemRow[],
  ): Promise<ImportResult> {
    const result: ImportResult = { total: rows.length, created: 0, updated: 0, errors: [] };

    // Check plan limit for net new items
    const planCode = await this.getTenantPlanCode(tenantId);
    const features = getPlanFeatures(planCode);
    if (features.maxCatalogItems !== -1) {
      const existingCount = await this.countItems(tenantId);
      // Count codes that already exist (updates don't count towards limit)
      const existingCodes = new Set<string>();
      for (const row of rows) {
        if (row.code) {
          const found = await this.prisma.catalogItem.findUnique({
            where: { tenantId_code: { tenantId, code: row.code } },
            select: { code: true },
          });
          if (found) existingCodes.add(row.code);
        }
      }
      const newItemCount = rows.filter(r => r.code && !existingCodes.has(r.code)).length;
      if (existingCount + newItemCount > features.maxCatalogItems) {
        throw new ForbiddenException(
          `La importacion excede el limite de ${features.maxCatalogItems} items de tu plan. Tienes ${existingCount} items y estas intentando agregar ${newItemCount} nuevos.`,
        );
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      // Validate required fields
      if (!row.code || typeof row.code !== 'string' || row.code.trim().length === 0) {
        result.errors.push({ row: rowNum, field: 'code', message: 'Codigo es requerido' });
        continue;
      }
      if (!row.name || typeof row.name !== 'string' || row.name.trim().length === 0) {
        result.errors.push({ row: rowNum, field: 'name', message: 'Nombre es requerido' });
        continue;
      }
      if (row.basePrice === undefined || row.basePrice === null || isNaN(Number(row.basePrice)) || Number(row.basePrice) < 0) {
        result.errors.push({ row: rowNum, field: 'basePrice', message: 'Precio base invalido (debe ser >= 0)' });
        continue;
      }

      const code = row.code.trim().slice(0, 50);
      const name = row.name.trim().slice(0, 200);
      const type = row.type === 'SERVICE' ? 'SERVICE' : 'PRODUCT';
      const basePrice = Number(row.basePrice);
      const costPrice = row.costPrice !== undefined && row.costPrice !== null ? Number(row.costPrice) : undefined;
      const taxRate = row.taxRate !== undefined ? Number(row.taxRate) : 13.0;
      const tipoItem = row.tipoItem !== undefined ? Number(row.tipoItem) : 1;
      const uniMedida = row.uniMedida !== undefined ? Number(row.uniMedida) : 99;
      const tributo = row.tributo || '20';

      try {
        const existing = await this.prisma.catalogItem.findUnique({
          where: { tenantId_code: { tenantId, code } },
        });

        if (existing) {
          await this.prisma.catalogItem.update({
            where: { id: existing.id },
            data: {
              name,
              description: row.description?.trim().slice(0, 500),
              type,
              basePrice,
              ...(costPrice !== undefined && { costPrice }),
              taxRate,
              tipoItem,
              uniMedida,
              tributo,
              ...(row.categoryId && { categoryId: row.categoryId }),
            },
          });
          result.updated++;
        } else {
          await this.prisma.catalogItem.create({
            data: {
              tenantId,
              code,
              name,
              description: row.description?.trim().slice(0, 500),
              type,
              basePrice,
              costPrice: costPrice ?? null,
              taxRate,
              tipoItem,
              uniMedida,
              tributo,
              categoryId: row.categoryId ?? null,
            },
          });
          result.created++;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        result.errors.push({ row: rowNum, field: 'general', message });
      }
    }

    this.logger.log(
      `Import for tenant ${tenantId}: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`,
    );

    return result;
  }

  async exportItems(tenantId: string): Promise<CatalogItemWithCategory[]> {
    return this.prisma.catalogItem.findMany({
      where: { tenantId, isActive: true },
      include: { category: true },
      orderBy: [{ code: 'asc' }],
    });
  }
}
