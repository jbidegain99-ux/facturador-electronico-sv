import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SyncCatalogoDto, CreateCatalogoDto, UpdateCatalogoDto, CatalogoItemDto } from './dto';

@Injectable()
export class CatalogosAdminService {
  constructor(private prisma: PrismaService) {}

  // ============ CATALOGO CRUD ============
  async getAllCatalogos() {
    const catalogos = await this.prisma.catalogo.findMany({
      orderBy: { codigo: 'asc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return catalogos.map((cat) => ({
      ...cat,
      totalItems: cat._count.items,
    }));
  }

  async getCatalogoByCodigo(codigo: string) {
    const catalogo = await this.prisma.catalogo.findUnique({
      where: { codigo },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!catalogo) {
      throw new NotFoundException(`Catalogo ${codigo} no encontrado`);
    }

    return {
      ...catalogo,
      totalItems: catalogo._count.items,
    };
  }

  async createCatalogo(data: CreateCatalogoDto) {
    const existing = await this.prisma.catalogo.findUnique({
      where: { codigo: data.codigo },
    });

    if (existing) {
      throw new ConflictException(`Ya existe un catalogo con codigo ${data.codigo}`);
    }

    return this.prisma.catalogo.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
      },
    });
  }

  async updateCatalogo(codigo: string, data: UpdateCatalogoDto) {
    const catalogo = await this.prisma.catalogo.findUnique({
      where: { codigo },
    });

    if (!catalogo) {
      throw new NotFoundException(`Catalogo ${codigo} no encontrado`);
    }

    return this.prisma.catalogo.update({
      where: { codigo },
      data,
    });
  }

  // ============ CATALOGO ITEMS ============
  async getCatalogoItems(
    codigo: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      parentCodigo?: string;
    },
  ) {
    const { page = 1, limit = 50, search, parentCodigo } = params;
    const skip = (page - 1) * limit;

    const catalogo = await this.prisma.catalogo.findUnique({
      where: { codigo },
    });

    if (!catalogo) {
      throw new NotFoundException(`Catalogo ${codigo} no encontrado`);
    }

    const where: any = {
      catalogoId: catalogo.id,
    };

    if (search) {
      where.OR = [
        { codigo: { contains: search } },
        { valor: { contains: search } },
      ];
    }

    if (parentCodigo) {
      where.parentCodigo = parentCodigo;
    }

    const [items, total] = await Promise.all([
      this.prisma.catalogoItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ orden: 'asc' }, { codigo: 'asc' }],
      }),
      this.prisma.catalogoItem.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============ SYNC CATALOGO ============
  async syncCatalogo(codigo: string, data: SyncCatalogoDto) {
    const catalogo = await this.prisma.catalogo.findUnique({
      where: { codigo },
    });

    if (!catalogo) {
      throw new NotFoundException(`Catalogo ${codigo} no encontrado`);
    }

    // Use transaction to replace all items
    await this.prisma.$transaction(async (tx) => {
      // Delete all existing items
      await tx.catalogoItem.deleteMany({
        where: { catalogoId: catalogo.id },
      });

      // Insert new items
      if (data.items.length > 0) {
        await tx.catalogoItem.createMany({
          data: data.items.map((item, index) => ({
            catalogoId: catalogo.id,
            codigo: item.codigo,
            valor: item.valor,
            descripcion: item.descripcion,
            parentCodigo: item.parentCodigo,
            orden: item.orden ?? index,
            metadata: item.metadata,
          })),
        });
      }

      // Update catalogo metadata
      await tx.catalogo.update({
        where: { id: catalogo.id },
        data: {
          totalItems: data.items.length,
          lastSyncAt: new Date(),
          version: data.version || catalogo.version,
        },
      });
    });

    return this.getCatalogoByCodigo(codigo);
  }

  // ============ EXPORT CATALOGO ============
  async exportCatalogo(codigo: string) {
    const catalogo = await this.prisma.catalogo.findUnique({
      where: { codigo },
      include: {
        items: {
          orderBy: [{ orden: 'asc' }, { codigo: 'asc' }],
        },
      },
    });

    if (!catalogo) {
      throw new NotFoundException(`Catalogo ${codigo} no encontrado`);
    }

    return {
      codigo: catalogo.codigo,
      nombre: catalogo.nombre,
      descripcion: catalogo.descripcion,
      version: catalogo.version,
      exportedAt: new Date().toISOString(),
      items: catalogo.items.map((item) => ({
        codigo: item.codigo,
        valor: item.valor,
        descripcion: item.descripcion,
        parentCodigo: item.parentCodigo,
        orden: item.orden,
        metadata: item.metadata ? JSON.parse(item.metadata) : null,
      })),
    };
  }

  // ============ PUBLIC ENDPOINTS (for forms) ============
  async getPublicCatalogoItems(codigo: string, parentCodigo?: string) {
    const catalogo = await this.prisma.catalogo.findUnique({
      where: { codigo, isActive: true },
    });

    if (!catalogo) {
      throw new NotFoundException(`Catalogo ${codigo} no encontrado`);
    }

    const where: any = {
      catalogoId: catalogo.id,
      isActive: true,
    };

    if (parentCodigo) {
      where.parentCodigo = parentCodigo;
    }

    return this.prisma.catalogoItem.findMany({
      where,
      orderBy: [{ orden: 'asc' }, { valor: 'asc' }],
      select: {
        codigo: true,
        valor: true,
        descripcion: true,
        parentCodigo: true,
      },
    });
  }

  // ============ SEED INITIAL CATALOGOS ============
  async seedInitialCatalogos() {
    const catalogos = [
      { codigo: 'CAT-002', nombre: 'Tipos de Documento Tributario', descripcion: 'Tipos de documentos tributarios electronicos (DTE)' },
      { codigo: 'CAT-003', nombre: 'Tipos de Contingencia', descripcion: 'Motivos de contingencia para emision de DTE' },
      { codigo: 'CAT-005', nombre: 'Condiciones de Operacion', descripcion: 'Condiciones de la operacion comercial' },
      { codigo: 'CAT-007', nombre: 'Formas de Pago', descripcion: 'Metodos de pago aceptados' },
      { codigo: 'CAT-011', nombre: 'Tipos de Item', descripcion: 'Clasificacion de items en documentos' },
      { codigo: 'CAT-012', nombre: 'Departamentos', descripcion: 'Departamentos de El Salvador' },
      { codigo: 'CAT-013', nombre: 'Municipios', descripcion: 'Municipios de El Salvador' },
      { codigo: 'CAT-014', nombre: 'Unidades de Medida', descripcion: 'Unidades de medida para items' },
      { codigo: 'CAT-019', nombre: 'Actividades Economicas', descripcion: 'Clasificacion de actividades economicas' },
      { codigo: 'CAT-022', nombre: 'Tipos de Documento de Identificacion', descripcion: 'Documentos de identificacion personal' },
    ];

    const results = [];
    for (const cat of catalogos) {
      const existing = await this.prisma.catalogo.findUnique({
        where: { codigo: cat.codigo },
      });

      if (!existing) {
        const created = await this.prisma.catalogo.create({ data: cat });
        results.push({ ...created, status: 'created' });
      } else {
        results.push({ ...existing, status: 'exists' });
      }
    }

    return results;
  }

  // ============ SEED DEPARTAMENTOS Y MUNICIPIOS ============
  async seedDepartamentosYMunicipios() {
    const departamentos = [
      { codigo: '01', valor: 'Ahuachapan' },
      { codigo: '02', valor: 'Santa Ana' },
      { codigo: '03', valor: 'Sonsonate' },
      { codigo: '04', valor: 'Chalatenango' },
      { codigo: '05', valor: 'La Libertad' },
      { codigo: '06', valor: 'San Salvador' },
      { codigo: '07', valor: 'Cuscatlan' },
      { codigo: '08', valor: 'La Paz' },
      { codigo: '09', valor: 'Cabanas' },
      { codigo: '10', valor: 'San Vicente' },
      { codigo: '11', valor: 'Usulutan' },
      { codigo: '12', valor: 'San Miguel' },
      { codigo: '13', valor: 'Morazan' },
      { codigo: '14', valor: 'La Union' },
    ];

    // First, ensure CAT-012 exists
    let catDep = await this.prisma.catalogo.findUnique({ where: { codigo: 'CAT-012' } });
    if (!catDep) {
      catDep = await this.prisma.catalogo.create({
        data: { codigo: 'CAT-012', nombre: 'Departamentos', descripcion: 'Departamentos de El Salvador' },
      });
    }

    // Sync departamentos
    await this.syncCatalogo('CAT-012', { items: departamentos });

    return { message: 'Departamentos sincronizados', count: departamentos.length };
  }
}
