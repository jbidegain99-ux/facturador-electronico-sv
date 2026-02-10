import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { QueryCatalogItemDto } from './dto/query-catalog-item.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response';
import { CatalogItem } from '@prisma/client';

const ALLOWED_SORT_FIELDS: Record<string, string> = {
  name: 'name',
  code: 'code',
  basePrice: 'basePrice',
  usageCount: 'usageCount',
  createdAt: 'createdAt',
  type: 'type',
};

@Injectable()
export class CatalogItemsService {
  private readonly logger = new Logger(CatalogItemsService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string,
    dto: CreateCatalogItemDto,
  ): Promise<CatalogItem> {
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
      },
    });
  }

  async findAll(
    tenantId: string,
    query: QueryCatalogItemDto,
  ): Promise<PaginatedResponse<CatalogItem>> {
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

    return this.prisma.catalogItem.update({
      where: { id },
      data,
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
}
