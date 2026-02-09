export declare class CreatePlanDto {
    codigo: string;
    nombre: string;
    descripcion?: string;
    maxDtesPerMonth: number;
    maxUsers: number;
    maxClientes: number;
    maxStorageMb: number;
    features?: string;
    precioMensual?: number;
    precioAnual?: number;
    orden?: number;
    isDefault?: boolean;
}
export declare class UpdatePlanDto {
    nombre?: string;
    descripcion?: string;
    maxDtesPerMonth?: number;
    maxUsers?: number;
    maxClientes?: number;
    maxStorageMb?: number;
    features?: string;
    precioMensual?: number;
    precioAnual?: number;
    orden?: number;
    isActive?: boolean;
    isDefault?: boolean;
}
export declare class AssignPlanDto {
    planId: string;
}
//# sourceMappingURL=plan.dto.d.ts.map