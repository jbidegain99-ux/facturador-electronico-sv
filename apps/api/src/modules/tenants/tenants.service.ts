import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: {
        nombre: data.nombre,
        nit: data.nit,
        nrc: data.nrc,
        actividadEcon: data.actividadEcon,
        telefono: data.telefono,
        correo: data.correo,
        nombreComercial: data.nombreComercial || null,
        direccion: JSON.stringify(data.direccion),
      },
    });
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
    const updateData: any = { ...data };
    if (data.direccion) {
      updateData.direccion = JSON.stringify(data.direccion);
    }
    return this.prisma.tenant.update({ where: { id }, data: updateData });
  }
}
