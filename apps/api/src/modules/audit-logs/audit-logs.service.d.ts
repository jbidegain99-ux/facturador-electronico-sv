import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogFilterDto, AuditAction, AuditModule } from './dto';
interface LogOptions {
    userId?: string;
    userEmail?: string;
    userName?: string;
    userRole?: string;
    tenantId?: string;
    tenantNombre?: string;
    action: AuditAction;
    module: AuditModule;
    description: string;
    entityType?: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    requestPath?: string;
    requestMethod?: string;
    success?: boolean;
    errorMessage?: string;
}
export declare class AuditLogsService {
    private prisma;
    constructor(prisma: PrismaService);
    log(options: LogOptions): Promise<{
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
    }>;
    findAll(filters: AuditLogFilterDto, page?: number, limit?: number): Promise<{
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
    getActivityTimeline(tenantId?: string, days?: number): Promise<{
        date: string;
        count: number;
    }[]>;
    getTenantActivity(tenantId: string, limit?: number): Promise<{
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
    getUserActivity(userId: string, limit?: number): Promise<{
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
    cleanOldLogs(daysToKeep?: number): Promise<{
        deleted: number;
    }>;
}
export {};
//# sourceMappingURL=audit-logs.service.d.ts.map