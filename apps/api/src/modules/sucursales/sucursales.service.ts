import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanFeaturesService } from '../plans/services/plan-features.service';

interface CreateSucursalDto {
  nombre: string;
  codEstableMH?: string;
  codEstable?: string;
  tipoEstablecimiento?: string;
  direccion: string;
  departamento?: string;
  municipio?: string;
  telefono?: string;
  correo?: string;
  esPrincipal?: boolean;
}

interface UpdateSucursalDto {
  nombre?: string;
  codEstableMH?: string;
  codEstable?: string;
  tipoEstablecimiento?: string;
  direccion?: string;
  departamento?: string;
  municipio?: string;
  telefono?: string;
  correo?: string;
  esPrincipal?: boolean;
  activa?: boolean;
}

interface CreatePuntoVentaDto {
  nombre: string;
  codPuntoVentaMH?: string;
  codPuntoVenta?: string;
}

interface UpdatePuntoVentaDto {
  nombre?: string;
  codPuntoVentaMH?: string;
  codPuntoVenta?: string;
  activo?: boolean;
}

@Injectable()
export class SucursalesService {
  constructor(
    private prisma: PrismaService,
    private planFeaturesService: PlanFeaturesService,
  ) {}

  // ===== SUCURSALES =====

  async findAll(tenantId: string) {
    return this.prisma.sucursal.findMany({
      where: { tenantId },
      include: { puntosVenta: true },
      orderBy: [{ esPrincipal: 'desc' }, { nombre: 'asc' }],
    });
  }

  async findOne(id: string, tenantId: string) {
    const sucursal = await this.prisma.sucursal.findFirst({
      where: { id, tenantId },
      include: { puntosVenta: true },
    });
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');
    return sucursal;
  }

  async create(tenantId: string, dto: CreateSucursalDto) {
    // Check branch limit before creating
    const branchCount = await this.prisma.sucursal.count({ where: { tenantId } });
    const limitExceeded = await this.planFeaturesService.checkBranchLimitExceeded(tenantId, branchCount);
    if (limitExceeded) {
      throw new ForbiddenException(
        'Has alcanzado el limite de sucursales para tu plan. Actualiza tu plan para crear mas.',
      );
    }

    // If this is marked as principal, unset other principals
    if (dto.esPrincipal) {
      await this.prisma.sucursal.updateMany({
        where: { tenantId, esPrincipal: true },
        data: { esPrincipal: false },
      });
    }

    const sucursal = await this.prisma.sucursal.create({
      data: {
        tenantId,
        nombre: dto.nombre,
        codEstableMH: dto.codEstableMH || null,
        codEstable: dto.codEstable || null,
        tipoEstablecimiento: dto.tipoEstablecimiento || '02',
        direccion: dto.direccion,
        departamento: dto.departamento || null,
        municipio: dto.municipio || null,
        telefono: dto.telefono || null,
        correo: dto.correo || null,
        esPrincipal: dto.esPrincipal ?? false,
      },
      include: { puntosVenta: true },
    });

    // Auto-create default punto de venta
    await this.prisma.puntoVenta.create({
      data: {
        sucursalId: sucursal.id,
        nombre: 'Punto de Venta Principal',
        codPuntoVentaMH: 'P001',
        codPuntoVenta: 'P001',
      },
    });

    return this.findOne(sucursal.id, tenantId);
  }

  async update(id: string, tenantId: string, dto: UpdateSucursalDto) {
    const sucursal = await this.findOne(id, tenantId);

    if (dto.esPrincipal) {
      await this.prisma.sucursal.updateMany({
        where: { tenantId, esPrincipal: true, id: { not: id } },
        data: { esPrincipal: false },
      });
    }

    return this.prisma.sucursal.update({
      where: { id: sucursal.id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.codEstableMH !== undefined && { codEstableMH: dto.codEstableMH }),
        ...(dto.codEstable !== undefined && { codEstable: dto.codEstable }),
        ...(dto.tipoEstablecimiento !== undefined && { tipoEstablecimiento: dto.tipoEstablecimiento }),
        ...(dto.direccion !== undefined && { direccion: dto.direccion }),
        ...(dto.departamento !== undefined && { departamento: dto.departamento }),
        ...(dto.municipio !== undefined && { municipio: dto.municipio }),
        ...(dto.telefono !== undefined && { telefono: dto.telefono }),
        ...(dto.correo !== undefined && { correo: dto.correo }),
        ...(dto.esPrincipal !== undefined && { esPrincipal: dto.esPrincipal }),
        ...(dto.activa !== undefined && { activa: dto.activa }),
      },
      include: { puntosVenta: true },
    });
  }

  async remove(id: string, tenantId: string) {
    const sucursal = await this.findOne(id, tenantId);

    // Check if there are DTEs associated
    const dteCount = await this.prisma.dTE.count({ where: { sucursalId: id } });
    if (dteCount > 0) {
      throw new BadRequestException(`No se puede eliminar: ${dteCount} DTEs asociados a esta sucursal`);
    }

    // Delete puntos de venta first
    await this.prisma.puntoVenta.deleteMany({ where: { sucursalId: id } });
    return this.prisma.sucursal.delete({ where: { id: sucursal.id } });
  }

  /** Get the default sucursal for a tenant (esPrincipal or first active) */
  async getDefaultSucursal(tenantId: string) {
    return this.prisma.sucursal.findFirst({
      where: { tenantId, activa: true },
      orderBy: [{ esPrincipal: 'desc' }, { createdAt: 'asc' }],
      include: { puntosVenta: { where: { activo: true }, orderBy: { createdAt: 'asc' }, take: 1 } },
    });
  }

  /** Get codEstablecimiento string (M###P###) for numero de control */
  async getCodEstablecimiento(tenantId: string, sucursalId?: string, puntoVentaId?: string): Promise<string> {
    let codEstableMH = 'M001';
    let codPuntoVentaMH = 'P001';

    if (sucursalId) {
      const sucursal = await this.prisma.sucursal.findFirst({
        where: { id: sucursalId, tenantId },
      });
      if (sucursal?.codEstableMH) codEstableMH = sucursal.codEstableMH;
    } else {
      // Try tenant defaults
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { codEstableMH: true, codPuntoVentaMH: true },
      });
      if (tenant?.codEstableMH) codEstableMH = tenant.codEstableMH;
      if (tenant?.codPuntoVentaMH) codPuntoVentaMH = tenant.codPuntoVentaMH;

      // Or try default sucursal
      if (!tenant?.codEstableMH) {
        const defaultSuc = await this.getDefaultSucursal(tenantId);
        if (defaultSuc?.codEstableMH) codEstableMH = defaultSuc.codEstableMH;
        if (defaultSuc?.puntosVenta?.[0]?.codPuntoVentaMH) {
          codPuntoVentaMH = defaultSuc.puntosVenta[0].codPuntoVentaMH;
        }
      }
    }

    if (puntoVentaId) {
      const pv = await this.prisma.puntoVenta.findUnique({ where: { id: puntoVentaId } });
      if (pv?.codPuntoVentaMH) codPuntoVentaMH = pv.codPuntoVentaMH;
    }

    return `${codEstableMH}${codPuntoVentaMH}`;
  }

  // ===== PUNTOS DE VENTA =====

  async findPuntosVenta(sucursalId: string, tenantId: string) {
    // Verify sucursal belongs to tenant
    await this.findOne(sucursalId, tenantId);
    return this.prisma.puntoVenta.findMany({
      where: { sucursalId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createPuntoVenta(sucursalId: string, tenantId: string, dto: CreatePuntoVentaDto) {
    await this.findOne(sucursalId, tenantId);
    return this.prisma.puntoVenta.create({
      data: {
        sucursalId,
        nombre: dto.nombre,
        codPuntoVentaMH: dto.codPuntoVentaMH || null,
        codPuntoVenta: dto.codPuntoVenta || null,
      },
    });
  }

  async updatePuntoVenta(pvId: string, tenantId: string, dto: UpdatePuntoVentaDto) {
    const pv = await this.prisma.puntoVenta.findUnique({
      where: { id: pvId },
      include: { sucursal: true },
    });
    if (!pv || pv.sucursal.tenantId !== tenantId) {
      throw new NotFoundException('Punto de venta no encontrado');
    }
    return this.prisma.puntoVenta.update({
      where: { id: pvId },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.codPuntoVentaMH !== undefined && { codPuntoVentaMH: dto.codPuntoVentaMH }),
        ...(dto.codPuntoVenta !== undefined && { codPuntoVenta: dto.codPuntoVenta }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });
  }

  async removePuntoVenta(pvId: string, tenantId: string) {
    const pv = await this.prisma.puntoVenta.findUnique({
      where: { id: pvId },
      include: { sucursal: true },
    });
    if (!pv || pv.sucursal.tenantId !== tenantId) {
      throw new NotFoundException('Punto de venta no encontrado');
    }
    const dteCount = await this.prisma.dTE.count({ where: { puntoVentaId: pvId } });
    if (dteCount > 0) {
      throw new BadRequestException(`No se puede eliminar: ${dteCount} DTEs asociados a este punto de venta`);
    }
    return this.prisma.puntoVenta.delete({ where: { id: pvId } });
  }
}
