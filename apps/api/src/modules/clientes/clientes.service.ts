import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  private readonly logger = new Logger(ClientesService.name);

  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createClienteDto: CreateClienteDto) {
    this.logger.log(`Creating cliente for tenant ${tenantId}`);

    // Check if client with same document already exists for this tenant
    const existingCliente = await this.prisma.cliente.findUnique({
      where: {
        tenantId_numDocumento: {
          tenantId,
          numDocumento: createClienteDto.numDocumento,
        },
      },
    });

    if (existingCliente) {
      this.logger.warn(`Cliente with document ${createClienteDto.numDocumento} already exists for tenant ${tenantId}`);
      throw new ConflictException('Ya existe un cliente con este numero de documento');
    }

    const cliente = await this.prisma.cliente.create({
      data: {
        tenantId,
        tipoDocumento: createClienteDto.tipoDocumento,
        numDocumento: createClienteDto.numDocumento,
        nombre: createClienteDto.nombre,
        nrc: createClienteDto.nrc,
        correo: createClienteDto.correo,
        telefono: createClienteDto.telefono,
        direccion: JSON.stringify(createClienteDto.direccion || {}),
      },
    });

    this.logger.log(`Cliente ${cliente.id} created successfully`);
    return cliente;
  }

  async findAll(tenantId: string, search?: string) {
    this.logger.log(`Finding all clientes for tenant ${tenantId}, search: ${search || 'none'}`);

    const where: any = { tenantId };

    if (search) {
      // SQL Server uses collation for case sensitivity, remove 'mode: insensitive'
      where.OR = [
        { nombre: { contains: search } },
        { numDocumento: { contains: search } },
        { correo: { contains: search } },
      ];
    }

    const clientes = await this.prisma.cliente.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });

    this.logger.log(`Found ${clientes.length} clientes`);
    return clientes;
  }

  async findOne(tenantId: string, id: string) {
    this.logger.log(`Finding cliente ${id} for tenant ${tenantId}`);

    const cliente = await this.prisma.cliente.findFirst({
      where: { id, tenantId },
    });

    if (!cliente) {
      this.logger.warn(`Cliente ${id} not found for tenant ${tenantId}`);
      throw new NotFoundException('Cliente no encontrado');
    }

    return cliente;
  }

  async update(tenantId: string, id: string, updateClienteDto: UpdateClienteDto) {
    this.logger.log(`Updating cliente ${id} for tenant ${tenantId}`);

    // Verify cliente belongs to tenant
    const existingCliente = await this.findOne(tenantId, id);

    // If changing document number, check it doesn't conflict
    if (updateClienteDto.numDocumento && updateClienteDto.numDocumento !== existingCliente.numDocumento) {
      const conflictingCliente = await this.prisma.cliente.findUnique({
        where: {
          tenantId_numDocumento: {
            tenantId,
            numDocumento: updateClienteDto.numDocumento,
          },
        },
      });

      if (conflictingCliente && conflictingCliente.id !== id) {
        throw new ConflictException('Ya existe un cliente con este numero de documento');
      }
    }

    const updateData: any = { ...updateClienteDto };
    if (updateClienteDto.direccion) {
      updateData.direccion = JSON.stringify(updateClienteDto.direccion);
    }

    const cliente = await this.prisma.cliente.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Cliente ${id} updated successfully`);
    return cliente;
  }

  async remove(tenantId: string, id: string) {
    this.logger.log(`Removing cliente ${id} for tenant ${tenantId}`);

    // Verify cliente belongs to tenant
    await this.findOne(tenantId, id);

    // Check if cliente has associated DTEs
    const dtesCount = await this.prisma.dTE.count({
      where: { clienteId: id },
    });

    if (dtesCount > 0) {
      this.logger.warn(`Cannot delete cliente ${id} - has ${dtesCount} associated DTEs`);
      throw new ConflictException(`No se puede eliminar el cliente porque tiene ${dtesCount} documento(s) asociado(s)`);
    }

    await this.prisma.cliente.delete({
      where: { id },
    });

    this.logger.log(`Cliente ${id} deleted successfully`);
    return { message: 'Cliente eliminado exitosamente' };
  }
}
