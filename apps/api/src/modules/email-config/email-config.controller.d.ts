import { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { EmailConfigService, EmailHealthService, EmailAssistanceService } from './services';
import { CreateEmailConfigDto, UpdateEmailConfigDto, TestEmailConfigDto, CreateEmailAssistanceRequestDto, UpdateEmailAssistanceRequestDto, AddMessageDto } from './dto';
import { RequestStatus } from './types/email.types';
export declare class EmailConfigController {
    private readonly emailConfigService;
    private readonly emailHealthService;
    private readonly emailAssistanceService;
    constructor(emailConfigService: EmailConfigService, emailHealthService: EmailHealthService, emailAssistanceService: EmailAssistanceService);
    getConfig(user: CurrentUserData): Promise<{
        configured: boolean;
        message: string;
        id?: undefined;
        provider?: undefined;
        authMethod?: undefined;
        isActive?: undefined;
        isVerified?: undefined;
        fromEmail?: undefined;
        fromName?: undefined;
        replyToEmail?: undefined;
        rateLimitPerHour?: undefined;
        configuredBy?: undefined;
        lastTestAt?: undefined;
        verifiedAt?: undefined;
        createdAt?: undefined;
        updatedAt?: undefined;
    } | {
        configured: boolean;
        id: string;
        provider: string;
        authMethod: string;
        isActive: boolean;
        isVerified: boolean;
        fromEmail: string;
        fromName: string;
        replyToEmail: string | null;
        rateLimitPerHour: number | null;
        configuredBy: string;
        lastTestAt: Date | null;
        verifiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        message?: undefined;
    }>;
    createOrUpdateConfig(user: CurrentUserData, dto: CreateEmailConfigDto): Promise<{
        message: string;
        id: string;
        provider: string;
        isActive: boolean;
        isVerified: boolean;
    }>;
    updateConfig(user: CurrentUserData, dto: UpdateEmailConfigDto): Promise<{
        message: string;
        id: string;
        provider: string;
        isActive: boolean;
        isVerified: boolean;
    }>;
    deleteConfig(user: CurrentUserData): Promise<void>;
    testConnection(user: CurrentUserData): Promise<{
        success: boolean;
        responseTimeMs: number;
        message: string;
        errorCode: string | undefined;
    }>;
    sendTestEmail(user: CurrentUserData, dto: TestEmailConfigDto): Promise<{
        success: boolean;
        messageId: string | undefined;
        message: string;
    }>;
    setActive(user: CurrentUserData, body: {
        isActive: boolean;
    }): Promise<{
        message: string;
        isActive: boolean;
    }>;
    getSendLogs(user: CurrentUserData, page?: string, limit?: string): Promise<{
        logs: {
            id: string;
            errorMessage: string | null;
            dteId: string | null;
            status: string;
            subject: string;
            recipientEmail: string;
            configId: string;
            providerMessageId: string | null;
            attemptNumber: number;
            sentAt: Date;
            deliveredAt: Date | null;
            openedAt: Date | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    requestAssistance(user: CurrentUserData, dto: CreateEmailAssistanceRequestDto): Promise<{
        message: string;
        requestId: string;
        status: string;
    }>;
    getMyRequests(user: CurrentUserData): Promise<({
        messages: {
            id: string;
            message: string;
            createdAt: Date;
            attachments: string | null;
            senderType: string;
            senderId: string | null;
            requestId: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        requestType: string;
        desiredProvider: string | null;
        currentProvider: string | null;
        accountEmail: string | null;
        additionalNotes: string | null;
        assignedTo: string | null;
        completedAt: Date | null;
    })[]>;
    getRequest(user: CurrentUserData, id: string): Promise<{
        tenant: {
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
        };
        messages: {
            id: string;
            message: string;
            createdAt: Date;
            attachments: string | null;
            senderType: string;
            senderId: string | null;
            requestId: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        requestType: string;
        desiredProvider: string | null;
        currentProvider: string | null;
        accountEmail: string | null;
        additionalNotes: string | null;
        assignedTo: string | null;
        completedAt: Date | null;
    }>;
    addMessageToRequest(user: CurrentUserData, id: string, dto: AddMessageDto): Promise<{
        id: string;
        message: string;
        createdAt: Date;
        attachments: string | null;
        senderType: string;
        senderId: string | null;
        requestId: string;
    }>;
    getHealth(user: CurrentUserData): Promise<{
        status: "HEALTHY" | "UNHEALTHY";
        responseTimeMs: number;
        error?: undefined;
    } | {
        status: "UNHEALTHY";
        error: string;
        responseTimeMs?: undefined;
    } | {
        status: string;
        message: string;
    }>;
}
export declare class EmailConfigAdminController {
    private readonly emailConfigService;
    private readonly emailHealthService;
    private readonly emailAssistanceService;
    constructor(emailConfigService: EmailConfigService, emailHealthService: EmailHealthService, emailAssistanceService: EmailAssistanceService);
    getAllConfigs(): Promise<import("./services").TenantHealthStatus[]>;
    getHealthDashboard(): Promise<{
        stats: import("./services").HealthDashboardStats;
        tenantsWithIssues: import("./services").TenantHealthStatus[];
    }>;
    forceHealthCheck(tenantId: string): Promise<{
        status: "HEALTHY" | "UNHEALTHY";
        responseTimeMs: number;
        error?: undefined;
    } | {
        status: "UNHEALTHY";
        error: string;
        responseTimeMs?: undefined;
    }>;
    getAllRequests(status?: RequestStatus): Promise<({
        tenant: {
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
        };
        messages: {
            id: string;
            message: string;
            createdAt: Date;
            attachments: string | null;
            senderType: string;
            senderId: string | null;
            requestId: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        requestType: string;
        desiredProvider: string | null;
        currentProvider: string | null;
        accountEmail: string | null;
        additionalNotes: string | null;
        assignedTo: string | null;
        completedAt: Date | null;
    })[]>;
    getRequestStats(): Promise<{
        pending: number;
        inProgress: number;
        waitingClient: number;
        completed: number;
        cancelled: number;
        total: number;
    }>;
    getAdminRequest(id: string): Promise<{
        tenant: {
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
        };
        messages: {
            id: string;
            message: string;
            createdAt: Date;
            attachments: string | null;
            senderType: string;
            senderId: string | null;
            requestId: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        requestType: string;
        desiredProvider: string | null;
        currentProvider: string | null;
        accountEmail: string | null;
        additionalNotes: string | null;
        assignedTo: string | null;
        completedAt: Date | null;
    }>;
    updateRequest(id: string, dto: UpdateEmailAssistanceRequestDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        requestType: string;
        desiredProvider: string | null;
        currentProvider: string | null;
        accountEmail: string | null;
        additionalNotes: string | null;
        assignedTo: string | null;
        completedAt: Date | null;
    }>;
    addAdminMessage(user: CurrentUserData, id: string, dto: AddMessageDto): Promise<{
        id: string;
        message: string;
        createdAt: Date;
        attachments: string | null;
        senderType: string;
        senderId: string | null;
        requestId: string;
    }>;
    configureForTenant(user: CurrentUserData, tenantId: string, dto: CreateEmailConfigDto): Promise<{
        message: string;
        id: string;
        tenantId: string;
        provider: string;
    }>;
    getTenantConfig(tenantId: string): Promise<{
        configured: boolean;
        config: null;
    } | {
        configured: boolean;
        config: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            provider: string;
            authMethod: string;
            isVerified: boolean;
            smtpHost: string | null;
            smtpPort: number | null;
            smtpSecure: boolean | null;
            smtpUser: string | null;
            smtpPassword: string | null;
            apiKey: string | null;
            apiSecret: string | null;
            apiEndpoint: string | null;
            oauth2ClientId: string | null;
            oauth2ClientSecret: string | null;
            oauth2TenantId: string | null;
            oauth2RefreshToken: string | null;
            oauth2AccessToken: string | null;
            oauth2TokenExpiry: Date | null;
            fromEmail: string;
            fromName: string;
            replyToEmail: string | null;
            rateLimitPerHour: number | null;
            retryAttempts: number | null;
            timeoutSeconds: number | null;
            configuredBy: string;
            configuredByUserId: string | null;
            notes: string | null;
            verifiedAt: Date | null;
            lastTestAt: Date | null;
        };
    }>;
    deleteTenantConfig(tenantId: string): Promise<{
        message: string;
    }>;
    testTenantConnection(tenantId: string): Promise<import("./adapters").ConnectionTestResult>;
    sendTestForTenant(tenantId: string, dto: TestEmailConfigDto): Promise<import("./adapters").SendEmailResult>;
}
//# sourceMappingURL=email-config.controller.d.ts.map