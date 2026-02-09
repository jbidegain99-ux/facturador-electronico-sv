import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationDto, UpdateNotificationDto } from './dto';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(includeInactive?: boolean): Promise<({
        _count: {
            dismissals: number;
        };
    } & {
        id: string;
        type: string;
        title: string;
        message: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        priority: string;
        expiresAt: Date | null;
        target: string;
        targetTenantId: string | null;
        targetUserId: string | null;
        targetPlanIds: string | null;
        startsAt: Date;
        isDismissable: boolean;
        showOnce: boolean;
        actionUrl: string | null;
        actionLabel: string | null;
        createdById: string | null;
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            dismissals: number;
        };
    } & {
        id: string;
        type: string;
        title: string;
        message: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        priority: string;
        expiresAt: Date | null;
        target: string;
        targetTenantId: string | null;
        targetUserId: string | null;
        targetPlanIds: string | null;
        startsAt: Date;
        isDismissable: boolean;
        showOnce: boolean;
        actionUrl: string | null;
        actionLabel: string | null;
        createdById: string | null;
    }>;
    create(dto: CreateNotificationDto, createdById?: string): Promise<{
        id: string;
        type: string;
        title: string;
        message: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        priority: string;
        expiresAt: Date | null;
        target: string;
        targetTenantId: string | null;
        targetUserId: string | null;
        targetPlanIds: string | null;
        startsAt: Date;
        isDismissable: boolean;
        showOnce: boolean;
        actionUrl: string | null;
        actionLabel: string | null;
        createdById: string | null;
    }>;
    update(id: string, dto: UpdateNotificationDto): Promise<{
        id: string;
        type: string;
        title: string;
        message: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        priority: string;
        expiresAt: Date | null;
        target: string;
        targetTenantId: string | null;
        targetUserId: string | null;
        targetPlanIds: string | null;
        startsAt: Date;
        isDismissable: boolean;
        showOnce: boolean;
        actionUrl: string | null;
        actionLabel: string | null;
        createdById: string | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        type: string;
        title: string;
        message: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        priority: string;
        expiresAt: Date | null;
        target: string;
        targetTenantId: string | null;
        targetUserId: string | null;
        targetPlanIds: string | null;
        startsAt: Date;
        isDismissable: boolean;
        showOnce: boolean;
        actionUrl: string | null;
        actionLabel: string | null;
        createdById: string | null;
    }>;
    getActiveNotificationsForUser(userId: string, tenantId?: string, planId?: string): Promise<{
        id: string;
        type: string;
        title: string;
        message: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        priority: string;
        expiresAt: Date | null;
        target: string;
        targetTenantId: string | null;
        targetUserId: string | null;
        targetPlanIds: string | null;
        startsAt: Date;
        isDismissable: boolean;
        showOnce: boolean;
        actionUrl: string | null;
        actionLabel: string | null;
        createdById: string | null;
    }[]>;
    getUnreadCount(userId: string, tenantId?: string, planId?: string): Promise<number>;
    dismissNotification(notificationId: string, userId: string): Promise<{
        id: string;
        userId: string;
        notificationId: string;
        dismissedAt: Date;
    }>;
    dismissAllForUser(userId: string): Promise<{
        dismissed: number;
    }>;
    getNotificationStats(): Promise<{
        total: number;
        active: number;
        byType: {
            type: string;
            count: number;
        }[];
        byPriority: {
            priority: string;
            count: number;
        }[];
    }>;
    createPlanLimitWarning(tenantId: string, planNombre: string, limitType: string, usage: number, max: number): Promise<{
        id: string;
        type: string;
        title: string;
        message: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        priority: string;
        expiresAt: Date | null;
        target: string;
        targetTenantId: string | null;
        targetUserId: string | null;
        targetPlanIds: string | null;
        startsAt: Date;
        isDismissable: boolean;
        showOnce: boolean;
        actionUrl: string | null;
        actionLabel: string | null;
        createdById: string | null;
    }>;
}
//# sourceMappingURL=notifications.service.d.ts.map