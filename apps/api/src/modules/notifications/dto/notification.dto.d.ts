export declare enum NotificationType {
    SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT",
    MAINTENANCE = "MAINTENANCE",
    NEW_FEATURE = "NEW_FEATURE",
    PLAN_LIMIT_WARNING = "PLAN_LIMIT_WARNING",
    PLAN_EXPIRED = "PLAN_EXPIRED",
    SECURITY_ALERT = "SECURITY_ALERT",
    GENERAL = "GENERAL"
}
export declare enum NotificationPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare enum NotificationTarget {
    ALL_USERS = "ALL_USERS",
    ALL_TENANTS = "ALL_TENANTS",
    SPECIFIC_TENANT = "SPECIFIC_TENANT",
    SPECIFIC_USER = "SPECIFIC_USER",
    BY_PLAN = "BY_PLAN"
}
export declare class CreateNotificationDto {
    title: string;
    message: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    target?: NotificationTarget;
    targetTenantId?: string;
    targetUserId?: string;
    targetPlanIds?: string;
    startsAt?: string;
    expiresAt?: string;
    isDismissable?: boolean;
    showOnce?: boolean;
    actionUrl?: string;
    actionLabel?: string;
}
export declare class UpdateNotificationDto {
    title?: string;
    message?: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    target?: NotificationTarget;
    targetTenantId?: string;
    targetUserId?: string;
    targetPlanIds?: string;
    startsAt?: string;
    expiresAt?: string;
    isDismissable?: boolean;
    showOnce?: boolean;
    actionUrl?: string;
    actionLabel?: string;
    isActive?: boolean;
}
//# sourceMappingURL=notification.dto.d.ts.map