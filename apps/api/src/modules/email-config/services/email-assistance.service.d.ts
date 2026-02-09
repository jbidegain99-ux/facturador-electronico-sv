import { PrismaService } from '../../../prisma/prisma.service';
import { RequestStatus, MessageSender, EmailConfigRequest } from '../types/email.types';
import { CreateEmailAssistanceRequestDto, UpdateEmailAssistanceRequestDto, AddMessageDto } from '../dto';
export declare class EmailAssistanceService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    /**
     * Create an assistance request from a tenant
     */
    createRequest(tenantId: string, dto: CreateEmailAssistanceRequestDto): Promise<EmailConfigRequest>;
    /**
     * Get all requests for a tenant
     */
    getTenantRequests(tenantId: string): Promise<({
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
    /**
     * Get a specific request
     */
    getRequest(requestId: string, tenantId?: string): Promise<{
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
    /**
     * Get all pending requests (for admin)
     */
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
    /**
     * Update request status (admin only)
     */
    updateRequest(requestId: string, dto: UpdateEmailAssistanceRequestDto): Promise<EmailConfigRequest>;
    /**
     * Add a message to a request
     */
    addMessage(requestId: string, senderType: MessageSender, senderId: string | undefined, dto: AddMessageDto): Promise<{
        id: string;
        message: string;
        createdAt: Date;
        attachments: string | null;
        senderType: string;
        senderId: string | null;
        requestId: string;
    }>;
    /**
     * Get request statistics (for admin dashboard)
     */
    getRequestStats(): Promise<{
        pending: number;
        inProgress: number;
        waitingClient: number;
        completed: number;
        cancelled: number;
        total: number;
    }>;
}
//# sourceMappingURL=email-assistance.service.d.ts.map