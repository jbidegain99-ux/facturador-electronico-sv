import { PrismaService } from '../../prisma/prisma.service';
export interface BackupStats {
    totalTenants: number;
    totalUsers: number;
    totalDtes: number;
    totalClientes: number;
    lastBackupDate: string | null;
    systemStatus: 'healthy' | 'warning' | 'error';
}
export interface TenantBackupData {
    tenant: any;
    users: any[];
    clientes: any[];
    dtes: any[];
    onboarding: any | null;
    emailConfig: any | null;
}
export interface SystemBackupData {
    metadata: {
        createdAt: string;
        version: string;
        type: 'full' | 'tenant';
        tenantId?: string;
    };
    data: TenantBackupData[] | TenantBackupData;
}
export declare class BackupsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getBackupStats(): Promise<BackupStats>;
    generateFullBackup(): Promise<SystemBackupData>;
    generateTenantBackup(tenantId: string): Promise<SystemBackupData>;
    getDataSummary(): Promise<{
        counts: {
            tenants: number;
            users: number;
            dtes: number;
            clientes: number;
        };
        dtesByStatus: {
            status: string;
            count: number;
        }[];
        tenantsByPlan: {
            plan: string;
            count: number;
        }[];
        estimatedSizeKB: number;
        estimatedSizeMB: number;
    }>;
}
//# sourceMappingURL=backups.service.d.ts.map