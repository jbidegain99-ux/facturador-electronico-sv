export declare class DireccionDto {
    departamento: string;
    municipio: string;
    complemento: string;
}
export declare class TenantRegistroDto {
    nombre: string;
    nit: string;
    nrc: string;
    actividadEcon: string;
    descActividad?: string;
    telefono: string;
    correo: string;
    nombreComercial?: string;
    direccion: DireccionDto;
}
export declare class UserRegistroDto {
    nombre: string;
    email: string;
    password: string;
}
export declare class RegisterDto {
    tenant: TenantRegistroDto;
    user: UserRegistroDto;
}
//# sourceMappingURL=register.dto.d.ts.map