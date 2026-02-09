export declare enum AuditAction {
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    VIEW = "VIEW",
    EXPORT = "EXPORT",
    IMPORT = "IMPORT",
    UPLOAD = "UPLOAD",
    DOWNLOAD = "DOWNLOAD",
    SEND = "SEND",
    SIGN = "SIGN",
    TRANSMIT = "TRANSMIT",
    CONFIG_CHANGE = "CONFIG_CHANGE"
}
export declare enum AuditModule {
    AUTH = "AUTH",
    TENANT = "TENANT",
    USER = "USER",
    DTE = "DTE",
    CLIENTE = "CLIENTE",
    CERTIFICATE = "CERTIFICATE",
    EMAIL_CONFIG = "EMAIL_CONFIG",
    SETTINGS = "SETTINGS",
    SUPPORT = "SUPPORT",
    ADMIN = "ADMIN"
}
export declare class CreateAuditLogDto {
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
    oldValue?: string;
    newValue?: string;
    metadata?: string;
    ipAddress?: string;
    userAgent?: string;
    requestPath?: string;
    requestMethod?: string;
    success?: boolean;
    errorMessage?: string;
}
export declare class AuditLogFilterDto {
    userId?: string;
    tenantId?: string;
    action?: AuditAction;
    module?: AuditModule;
    entityType?: string;
    entityId?: string;
    success?: boolean;
    startDate?: string;
    endDate?: string;
    search?: string;
}
//# sourceMappingURL=audit-log.dto.d.ts.map