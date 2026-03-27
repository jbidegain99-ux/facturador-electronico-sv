import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTenantDto) {
    // Check if NIT already exists
    const existingByNit = await this.prisma.tenant.findUnique({
      where: { nit: data.nit },
    });
    if (existingByNit) {
      throw new ConflictException('Ya existe una empresa con este NIT');
    }

    // Check if email already exists
    const existingByEmail = await this.prisma.tenant.findFirst({
      where: { correo: data.correo.toLowerCase().trim() },
    });
    if (existingByEmail) {
      throw new ConflictException('Ya existe una empresa registrada con este correo electrónico');
    }

    try {
      return await this.prisma.tenant.create({
        data: {
          nombre: data.nombre,
          nit: data.nit,
          nrc: data.nrc,
          actividadEcon: data.actividadEcon,
          telefono: data.telefono,
          correo: data.correo.toLowerCase().trim(),
          nombreComercial: data.nombreComercial || null,
          direccion: JSON.stringify(data.direccion),
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una empresa con este NIT o correo electrónico');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.tenant.findMany();
  }

  async findOne(id: string) {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async findByNit(nit: string) {
    return this.prisma.tenant.findUnique({ where: { nit } });
  }

  async update(id: string, data: Partial<CreateTenantDto>) {
    // If correo is being updated, check uniqueness
    if (data.correo) {
      const normalizedEmail = data.correo.toLowerCase().trim();
      const existingByEmail = await this.prisma.tenant.findFirst({
        where: {
          correo: normalizedEmail,
          NOT: { id },
        },
      });
      if (existingByEmail) {
        throw new ConflictException('Ya existe una empresa registrada con este correo electrónico');
      }
      data.correo = normalizedEmail;
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.direccion) {
      updateData.direccion = JSON.stringify(data.direccion);
    }

    try {
      return await this.prisma.tenant.update({ where: { id }, data: updateData });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una empresa con este NIT o correo electrónico');
      }
      throw error;
    }
  }
}
