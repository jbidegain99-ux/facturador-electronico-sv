declare class DireccionClienteDto {
    departamento: string;
    municipio: string;
    complemento: string;
}
export declare class CreateClienteDto {
    tipoDocumento: string;
    numDocumento: string;
    nombre: string;
    nrc?: string;
    correo?: string;
    telefono?: string;
    direccion: DireccionClienteDto;
    actividadEcon?: string;
    descActividad?: string;
}
export {};
//# sourceMappingURL=create-cliente.dto.d.ts.map