import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, UpdateNotificationDto } from './dto';
export declare class NotificationsAdminController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(includeInactive?: string): Promise<({
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
    getStats(): Promise<{
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
    create(dto: CreateNotificationDto, req: any): Promise<{
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
    deactivate(id: string): Promise<{
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
    activate(id: string): Promise<{
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
export declare class NotificationsUserController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getMyNotifications(req: any): Promise<{
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
    getUnreadCount(req: any): Promise<{
        count: number;
    }>;
    dismiss(id: string, req: any): Promise<{
        id: string;
        userId: string;
        notificationId: string;
        dismissedAt: Date;
    }>;
    dismissAll(req: any): Promise<{
        dismissed: number;
    }>;
}
//# sourceMappingURL=notifications.controller.d.ts.map