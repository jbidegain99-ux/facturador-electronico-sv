import { PrismaService } from '../../prisma/prisma.service';
import { SyncCatalogoDto, CreateCatalogoDto, UpdateCatalogoDto } from './dto';
export declare class CatalogosAdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllCatalogos(): Promise<{
        totalItems: number;
        _count: {
            items: number;
        };
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        version: string;
        codigo: string;
        descripcion: string | null;
        isActive: boolean;
        lastSyncAt: Date | null;
    }[]>;
    getCatalogoByCodigo(codigo: string): Promise<{
        totalItems: number;
        _count: {
            items: number;
        };
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        version: string;
        codigo: string;
        descripcion: string | null;
        isActive: boolean;
        lastSyncAt: Date | null;
    }>;
    createCatalogo(data: CreateCatalogoDto): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        version: string;
        codigo: string;
        descripcion: string | null;
        isActive: boolean;
        totalItems: number;
        lastSyncAt: Date | null;
    }>;
    updateCatalogo(codigo: string, data: UpdateCatalogoDto): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        version: string;
        codigo: string;
        descripcion: string | null;
        isActive: boolean;
        totalItems: number;
        lastSyncAt: Date | null;
    }>;
    getCatalogoItems(codigo: string, params: {
        page?: number;
        limit?: number;
        search?: string;
        parentCodigo?: string;
    }): Promise<{
        data: {
            id: string;
            metadata: string | null;
            createdAt: Date;
            updatedAt: Date;
            codigo: string;
            descripcion: string | null;
            valor: string;
            isActive: boolean;
            parentCodigo: string | null;
            orden: number;
            catalogoId: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    syncCatalogo(codigo: string, data: SyncCatalogoDto): Promise<{
        totalItems: number;
        _count: {
            items: number;
        };
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        version: string;
        codigo: string;
        descripcion: string | null;
        isActive: boolean;
        lastSyncAt: Date | null;
    }>;
    exportCatalogo(codigo: string): Promise<{
        codigo: string;
        nombre: string;
        descripcion: string | null;
        version: string;
        exportedAt: string;
        items: {
            codigo: string;
            valor: string;
            descripcion: string | null;
            parentCodigo: string | null;
            orden: number;
            metadata: any;
        }[];
    }>;
    getPublicCatalogoItems(codigo: string, parentCodigo?: string): Promise<{
        codigo: string;
        descripcion: string | null;
        valor: string;
        parentCodigo: string | null;
    }[]>;
    seedInitialCatalogos(): Promise<{
        status: string;
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        version: string;
        codigo: string;
        descripcion: string | null;
        isActive: boolean;
        totalItems: number;
        lastSyncAt: Date | null;
    }[]>;
    seedDepartamentosYMunicipios(): Promise<{
        message: string;
        count: number;
    }>;
}
//# sourceMappingURL=catalogos-admin.service.d.ts.map