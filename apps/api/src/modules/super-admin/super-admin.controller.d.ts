import { SuperAdminService } from './super-admin.service';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';
export declare class SuperAdminBootstrapController {
    private readonly superAdminService;
    constructor(superAdminService: SuperAdminService);
    checkBootstrapStatus(): Promise<{
        hasAdmin: boolean;
        canBootstrap: boolean;
    }>;
    bootstrapSuperAdmin(data: {
        email: string;
        password: string;
        nombre: string;
    }): Promise<{
        message: string;
        admin: {
            id: string;
            nombre: string;
            email: string;
            createdAt: Date;
            rol: string;
        };
    }>;
}
export declare class SuperAdminController {
    private readonly superAdminService;
    constructor(superAdminService: SuperAdminService);
    getDashboardStats(): Promise<{
        totalTenants: number;
        activeTenants: number;
        suspendedTenants: number;
        trialTenants: number;
        totalUsers: number;
        totalDtes: number;
        dtesThisMonth: number;
        dtesByStatus: {
            status: string;
            count: number;
        }[];
        tenantsByPlan: {
            plan: string;
            count: number;
        }[];
        last7Days: {
            date: string | undefined;
            count: number;
        }[];
    }>;
    getRecentActivity(limit?: string): Promise<{
        recentDtes: ({
            tenant: {
                nombre: string;
                nit: string;
            };
        } & {
            id: string;
            tenantId: string;
            createdAt: Date;
            clienteId: string | null;
            totalGravada: import("@prisma/client/runtime/library").Decimal;
            totalIva: import("@prisma/client/runtime/library").Decimal;
            totalPagar: import("@prisma/client/runtime/library").Decimal;
            tipoDte: string;
            codigoGeneracion: string;
            numeroControl: string;
            jsonOriginal: string;
            jsonFirmado: string | null;
            estado: string;
            selloRecepcion: string | null;
            fechaRecepcion: Date | null;
            codigoMh: string | null;
            descripcionMh: string | null;
            intentosEnvio: number;
        })[];
        recentTenants: {
            id: string;
            plan: string;
            nombre: string;
            nit: string;
            createdAt: Date;
        }[];
    }>;
    getAllTenants(page?: string, limit?: string, search?: string, plan?: string, status?: string): Promise<{
        data: ({
            _count: {
                usuarios: number;
                dtes: number;
            };
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
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getTenantById(id: string): Promise<{
        dteStats: {
            status: string;
            count: number;
        }[];
        dtesLast30Days: number;
        _count: {
            dtes: number;
            clientes: number;
        };
        usuarios: {
            id: string;
            nombre: string;
            email: string;
            createdAt: Date;
            rol: string;
        }[];
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
    updateTenantPlan(id: string, data: {
        plan?: string;
        planStatus?: string;
        planExpiry?: Date;
        maxDtesPerMonth?: number;
        adminNotes?: string;
    }, user: CurrentUserData): Promise<{
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
    suspendTenant(id: string, data: {
        reason?: string;
    }, user: CurrentUserData): Promise<{
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
    activateTenant(id: string, user: CurrentUserData): Promise<{
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
    deleteTenant(id: string, user: CurrentUserData): Promise<{
        message: string;
    }>;
    getAllSuperAdmins(): Promise<{
        id: string;
        nombre: string;
        email: string;
        createdAt: Date;
    }[]>;
    createSuperAdmin(data: {
        email: string;
        password: string;
        nombre: string;
    }, user: CurrentUserData): Promise<{
        id: string;
        nombre: string;
        email: string;
        createdAt: Date;
        rol: string;
    }>;
}
//# sourceMappingURL=super-admin.controller.d.ts.map