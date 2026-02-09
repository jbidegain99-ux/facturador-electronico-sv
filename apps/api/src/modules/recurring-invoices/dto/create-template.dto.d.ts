export declare class TemplateItemDto {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
}
export declare class CreateTemplateDto {
    nombre: string;
    descripcion?: string;
    clienteId: string;
    tipoDte?: string;
    interval: string;
    anchorDay?: number;
    dayOfWeek?: number;
    mode?: string;
    autoTransmit?: boolean;
    items: TemplateItemDto[];
    notas?: string;
    startDate: string;
    endDate?: string;
}
//# sourceMappingURL=create-template.dto.d.ts.map