export declare class CatalogoItemDto {
    codigo: string;
    valor: string;
    descripcion?: string;
    parentCodigo?: string;
    orden?: number;
    metadata?: string;
}
export declare class SyncCatalogoDto {
    items: CatalogoItemDto[];
    version?: string;
}
export declare class CreateCatalogoDto {
    codigo: string;
    nombre: string;
    descripcion?: string;
}
export declare class UpdateCatalogoDto {
    nombre?: string;
    descripcion?: string;
    version?: string;
    isActive?: boolean;
}
//# sourceMappingURL=sync-catalogo.dto.d.ts.map