import { Response } from 'express';
import { CatalogosAdminService } from './catalogos-admin.service';
import { SyncCatalogoDto, CreateCatalogoDto, UpdateCatalogoDto } from './dto';
export declare class CatalogosAdminController {
    private readonly catalogosService;
    constructor(catalogosService: CatalogosAdminService);
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
    seedCatalogos(): Promise<{
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
    seedDepartamentos(): Promise<{
        message: string;
        count: number;
    }>;
    getCatalogo(codigo: string): Promise<{
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
    getCatalogoItems(codigo: string, page?: string, limit?: string, search?: string, parentCodigo?: string): Promise<{
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
    exportCatalogo(codigo: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
export declare class CatalogosPublicController {
    private readonly catalogosService;
    constructor(catalogosService: CatalogosAdminService);
    getPublicItems(codigo: string, parentCodigo?: string): Promise<{
        codigo: string;
        descripcion: string | null;
        valor: string;
        parentCodigo: string | null;
    }[]>;
}
//# sourceMappingURL=catalogos-admin.controller.d.ts.map