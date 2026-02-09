import { AuditLogsService } from './audit-logs.service';
import { AuditAction, AuditModule } from './dto';
export declare class AuditLogsController {
    private readonly auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    findAll(page: number, limit: number, userId?: string, tenantId?: string, action?: AuditAction, module?: AuditModule, entityType?: string, entityId?: string, success?: string, startDate?: string, endDate?: string, search?: string): Promise<{
        data: {
            id: string;
            description: string;
            userId: string | null;
            userEmail: string | null;
            userName: string | null;
            userRole: string | null;
            tenantId: string | null;
            tenantNombre: string | null;
            action: string;
            module: string;
            entityType: string | null;
            entityId: string | null;
            oldValue: string | null;
            newValue: string | null;
            metadata: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            requestPath: string | null;
            requestMethod: string | null;
            success: boolean;
            errorMessage: string | null;
            createdAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStats(tenantId?: string, days?: number): Promise<{
        total: number;
        byAction: {
            action: string;
            count: number;
        }[];
        byModule: {
            module: string;
            count: number;
        }[];
        successRate: number;
        failureRate: number;
        recentActivity: {
            id: string;
            description: string;
            userName: string | null;
            tenantNombre: string | null;
            action: string;
            module: string;
            success: boolean;
            createdAt: Date;
        }[];
    }>;
    getTimeline(tenantId?: string, days?: number): Promise<{
        date: string;
        count: number;
    }[]>;
    getTenantActivity(tenantId: string, limit: number): Promise<{
        id: string;
        description: string;
        userId: string | null;
        userEmail: string | null;
        userName: string | null;
        userRole: string | null;
        tenantId: string | null;
        tenantNombre: string | null;
        action: string;
        module: string;
        entityType: string | null;
        entityId: string | null;
        oldValue: string | null;
        newValue: string | null;
        metadata: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        requestPath: string | null;
        requestMethod: string | null;
        success: boolean;
        errorMessage: string | null;
        createdAt: Date;
    }[]>;
    getUserActivity(userId: string, limit: number): Promise<{
        id: string;
        description: string;
        userId: string | null;
        userEmail: string | null;
        userName: string | null;
        userRole: string | null;
        tenantId: string | null;
        tenantNombre: string | null;
        action: string;
        module: string;
        entityType: string | null;
        entityId: string | null;
        oldValue: string | null;
        newValue: string | null;
        metadata: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        requestPath: string | null;
        requestMethod: string | null;
        success: boolean;
        errorMessage: string | null;
        createdAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        description: string;
        userId: string | null;
        userEmail: string | null;
        userName: string | null;
        userRole: string | null;
        tenantId: string | null;
        tenantNombre: string | null;
        action: string;
        module: string;
        entityType: string | null;
        entityId: string | null;
        oldValue: string | null;
        newValue: string | null;
        metadata: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        requestPath: string | null;
        requestMethod: string | null;
        success: boolean;
        errorMessage: string | null;
        createdAt: Date;
    } | null>;
    cleanup(daysToKeep: number): Promise<{
        deleted: number;
    }>;
}
//# sourceMappingURL=audit-logs.controller.d.ts.map