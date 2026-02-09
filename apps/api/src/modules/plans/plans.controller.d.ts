import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto, AssignPlanDto } from './dto';
interface CurrentUserData {
    id: string;
    email: string;
    tenantId: string | null;
    rol: string;
}
export declare class PlansAdminController {
    private readonly plansService;
    constructor(plansService: PlansService);
    findAll(): Promise<{
        activeTenantsCount: number;
        totalTenantsCount: number;
        _count: {
            tenants: number;
        };
        id: string;
        nombre: string;
        createdAt: Date;
        maxDtesPerMonth: number;
        maxUsers: number;
        maxClientes: number;
        updatedAt: Date;
        codigo: string;
        descripcion: string | null;
        isActive: boolean;
        orden: number;
        maxStorageMb: number;
        features: string | null;
        precioMensual: import("@prisma/client/runtime/library").Decimal | null;
        precioAnual: import("@prisma/client/runtime/library").Decimal | null;
        isDefault: boolean;
    }[]>;
    findActive(): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        maxDtesPerMonth: number;
        maxUsers: number;
        maxClientes: number;
        updatedAt: Date;
        codigo: string;
        descripcion: string | null;
        isActive: boolean;
        orden: number;
        maxStorageMb: number;
        features: string | null;
        precioMensual: import("@prisma/client/runtime/library").Decimal | null;
        precioAnual: import("@prisma/client/runtime/library").Decimal | null;
        isDefault: boolean;
    }[]>;
    findOne(id: string): Promise<{
        _count: {
            tenants: number;
        };
        tenants: {
            id: string;
            nombre: string;
            nit: string;
            planStatus: string;
        }[];
    } & {
        id: string;
        nombre: string;
        createdAt: Date;
        maxDtesPerMonth: number;
        maxUsers: number;
        maxClientes: number;
        updatedAt: Date;
        codigo: string;
        descripcion: string | null;
        isActive: boolean;
        orden: number;
        maxStorageMb: number;
        features: string | null;
        precioMensual: import("@prisma/client/runtime/library").Decimal | null;
        precioAnual: import("@prisma/client/runtime/library").Decimal | null;
        isDefault: boolean;
    }>;
    create(dto: CreatePlanDto): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        maxDtesPerMonth: number;
        maxUsers: number;
        maxClientes: number;
        updatedAt: Date;
        codigo: string;
        descripcion: string | null;
        isActive: boolean;
        orden: number;
        maxStorageMb: number;
        features: string | null;
        precioMensual: import("@prisma/client/runtime/library").Decimal | null;
        precioAnual: import("@prisma/client/runtime/library").Decimal | null;
        isDefault: boolean;
    }>;
    update(id: string, dto: UpdatePlanDto): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        maxDtesPerMonth: number;
        maxUsers: number;
        maxClientes: number;
        updatedAt: Date;
        codigo: string;
        descripcion: string | null;
        isActive: boolean;
        orden: number;
        maxStorageMb: number;
        features: string | null;
        precioMensual: import("@prisma/client/runtime/library").Decimal | null;
        precioAnual: import("@prisma/client/runtime/library").Decimal | null;
        isDefault: boolean;
    }>;
    delete(id: string): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        maxDtesPerMonth: number;
        maxUsers: number;
        maxClientes: number;
        updatedAt: Date;
        codigo: string;
        descripcion: string | null;
        isActive: boolean;
        orden: number;
        maxStorageMb: number;
        features: string | null;
        precioMensual: import("@prisma/client/runtime/library").Decimal | null;
        precioAnual: import("@prisma/client/runtime/library").Decimal | null;
        isDefault: boolean;
    }>;
    seed(): Promise<{
        action: string;
        plan: {
            id: string;
            nombre: string;
            createdAt: Date;
            maxDtesPerMonth: number;
            maxUsers: number;
            maxClientes: number;
            updatedAt: Date;
            codigo: string;
            descripcion: string | null;
            isActive: boolean;
            orden: number;
            maxStorageMb: number;
            features: string | null;
            precioMensual: import("@prisma/client/runtime/library").Decimal | null;
            precioAnual: import("@prisma/client/runtime/library").Decimal | null;
            isDefault: boolean;
        };
    }[]>;
    assignPlan(tenantId: string, dto: AssignPlanDto): Promise<{
        planRef: {
            id: string;
            nombre: string;
            createdAt: Date;
            maxDtesPerMonth: number;
            maxUsers: number;
            maxClientes: number;
            updatedAt: Date;
            codigo: string;
            descripcion: string | null;
            isActive: boolean;
            orden: number;
            maxStorageMb: number;
            features: string | null;
            precioMensual: import("@prisma/client/runtime/library").Decimal | null;
            precioAnual: import("@prisma/client/runtime/library").Decimal | null;
            isDefault: boolean;
        } | null;
    } & {
        id: string;
        plan: string;
        nombre: string;
        nit: string;
        nrc: string;
        actividadEcon: string;
        telefono: string;
        correo: string;
        nombreComercial: string | null;
        direccion: string;
        createdAt: Date;
        certificatePath: string | null;
        mhToken: string | null;
        mhTokenExpiry: Date | null;
        logoUrl: string | null;
        primaryColor: string | null;
        planId: string | null;
        planStatus: string;
        planExpiry: Date | null;
        maxDtesPerMonth: number;
        maxUsers: number;
        maxClientes: number;
        dtesUsedThisMonth: number;
        monthResetDate: Date | null;
        adminNotes: string | null;
        updatedAt: Date;
    }>;
    removePlan(tenantId: string): Promise<{
        id: string;
        plan: string;
        nombre: string;
        nit: string;
        nrc: string;
        actividadEcon: string;
        telefono: string;
        correo: string;
        nombreComercial: string | null;
        direccion: string;
        createdAt: Date;
        certificatePath: string | null;
        mhToken: string | null;
        mhTokenExpiry: Date | null;
        logoUrl: string | null;
        primaryColor: string | null;
        planId: string | null;
        planStatus: string;
        planExpiry: Date | null;
        maxDtesPerMonth: number;
        maxUsers: number;
        maxClientes: number;
        dtesUsedThisMonth: number;
        monthResetDate: Date | null;
        adminNotes: string | null;
        updatedAt: Date;
    }>;
    getTenantUsage(tenantId: string): Promise<{
        tenantId: string;
        planId: string | null;
        planCodigo: string | null;
        planNombre: string | null;
        usage: {
            dtesThisMonth: number;
            maxDtesPerMonth: number;
            dtesRemaining: number;
            users: number;
            maxUsers: number;
            usersRemaining: number;
            clientes: number;
            maxClientes: number;
            clientesRemaining: number;
        };
        limits: {
            canCreateDte: boolean;
            canAddUser: boolean;
            canAddCliente: boolean;
        };
    }>;
}
export declare class PlansController {
    private readonly plansService;
    constructor(plansService: PlansService);
    findActive(): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        maxDtesPerMonth: number;
        maxUsers: number;
        maxClientes: number;
        updatedAt: Date;
        codigo: string;
        descripcion: string | null;
        isActive: boolean;
        orden: number;
        maxStorageMb: number;
        features: string | null;
        precioMensual: import("@prisma/client/runtime/library").Decimal | null;
        precioAnual: import("@prisma/client/runtime/library").Decimal | null;
        isDefault: boolean;
    }[]>;
    getMyUsage(user: CurrentUserData): Promise<{
        tenantId: string;
        planId: string | null;
        planCodigo: string | null;
        planNombre: string | null;
        usage: {
            dtesThisMonth: number;
            maxDtesPerMonth: number;
            dtesRemaining: number;
            users: number;
            maxUsers: number;
            usersRemaining: number;
            clientes: number;
            maxClientes: number;
            clientesRemaining: number;
        };
        limits: {
            canCreateDte: boolean;
            canAddUser: boolean;
            canAddCliente: boolean;
        };
    }>;
}
export {};
//# sourceMappingURL=plans.controller.d.ts.map