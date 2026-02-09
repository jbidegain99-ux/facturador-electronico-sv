import { Response } from 'express';
import { BackupsService } from './backups.service';
export declare class BackupsController {
    private readonly backupsService;
    constructor(backupsService: BackupsService);
    getStats(): Promise<import("./backups.service").BackupStats>;
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
    generateFullBackup(res: Response): Promise<void>;
    generateTenantBackup(tenantId: string, res: Response): Promise<void>;
    previewFullBackup(): Promise<{
        metadata: {
            createdAt: string;
            version: string;
            type: "full" | "tenant";
            tenantId?: string;
        };
        summary: {
            totalTenants: number;
            timestamp: string;
        };
    }>;
    previewTenantBackup(tenantId: string): Promise<{
        metadata: {
            createdAt: string;
            version: string;
            type: "full" | "tenant";
            tenantId?: string;
        };
        summary: {
            tenantName: any;
            usersCount: any;
            clientesCount: any;
            dtesCount: any;
            hasOnboarding: boolean;
            hasEmailConfig: boolean;
            timestamp: string;
        };
    }>;
}
//# sourceMappingURL=backups.controller.d.ts.map