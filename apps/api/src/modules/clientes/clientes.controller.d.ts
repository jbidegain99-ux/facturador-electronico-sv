import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { PaginationQueryDto } from '../../common/dto';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';
export declare class ClientesController {
    private clientesService;
    private readonly logger;
    constructor(clientesService: ClientesService);
    create(user: CurrentUserData, createClienteDto: CreateClienteDto): Promise<{
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
    findAll(user: CurrentUserData, query: PaginationQueryDto): Promise<import("../../common/dto").PaginatedResponse<{
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
    }>>;
    findOne(user: CurrentUserData, id: string): Promise<{
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
    update(user: CurrentUserData, id: string, updateClienteDto: UpdateClienteDto): Promise<{
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
    remove(user: CurrentUserData, id: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=clientes.controller.d.ts.map