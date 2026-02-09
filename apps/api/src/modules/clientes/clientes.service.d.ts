import { PrismaService } from '../../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto';
import { Cliente } from '@prisma/client';
export declare class ClientesService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(tenantId: string, createClienteDto: CreateClienteDto): Promise<{
        id: string;
        nombre: string;
        nrc: string | null;
        telefono: string | null;
        correo: string | null;
        direccion: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        tipoDocumento: string;
        numDocumento: string;
    }>;
    findAll(tenantId: string, query?: PaginationQueryDto): Promise<PaginatedResponse<Cliente>>;
    findOne(tenantId: string, id: string): Promise<{
        id: string;
        nombre: string;
        nrc: string | null;
        telefono: string | null;
        correo: string | null;
        direccion: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        tipoDocumento: string;
        numDocumento: string;
    }>;
    update(tenantId: string, id: string, updateClienteDto: UpdateClienteDto): Promise<{
        id: string;
        nombre: string;
        nrc: string | null;
        telefono: string | null;
        correo: string | null;
        direccion: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        tipoDocumento: string;
        numDocumento: string;
    }>;
    remove(tenantId: string, id: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=clientes.service.d.ts.map