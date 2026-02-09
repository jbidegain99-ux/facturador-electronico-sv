import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
export declare class SupportService {
    private prisma;
    constructor(prisma: PrismaService);
    private generateTicketNumber;
    createTicket(tenantId: string, requesterId: string, data: CreateTicketDto): Promise<{
        tenant: {
            nombre: string;
        };
        requester: {
            nombre: string;
            email: string;
        };
    } & {
        id: string;
        type: string;
        description: string | null;
        tenantId: string;
        metadata: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        priority: string;
        subject: string;
        assignedToId: string | null;
        resolution: string | null;
        ticketNumber: string;
        assignedAt: Date | null;
        resolvedAt: Date | null;
        requesterId: string;
    }>;
    getUserTickets(tenantId: string, page?: number, limit?: number): Promise<{
        data: ({
            _count: {
                comments: number;
            };
            assignedTo: {
                nombre: string;
            } | null;
            requester: {
                nombre: string;
                email: string;
            };
        } & {
            id: string;
            type: string;
            description: string | null;
            tenantId: string;
            metadata: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            priority: string;
            subject: string;
            assignedToId: string | null;
            resolution: string | null;
            ticketNumber: string;
            assignedAt: Date | null;
            resolvedAt: Date | null;
            requesterId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUserTicketById(tenantId: string, ticketId: string, userId: string): Promise<{
        tenant: {
            nombre: string;
        };
        assignedTo: {
            nombre: string;
            email: string;
        } | null;
        requester: {
            id: string;
            nombre: string;
            email: string;
        };
        comments: ({
            author: {
                nombre: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            isInternal: boolean;
            ticketId: string;
            authorId: string;
        })[];
        activities: ({
            actor: {
                nombre: string;
            };
        } & {
            id: string;
            action: string;
            oldValue: string | null;
            newValue: string | null;
            createdAt: Date;
            ticketId: string;
            actorId: string;
        })[];
    } & {
        id: string;
        type: string;
        description: string | null;
        tenantId: string;
        metadata: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        priority: string;
        subject: string;
        assignedToId: string | null;
        resolution: string | null;
        ticketNumber: string;
        assignedAt: Date | null;
        resolvedAt: Date | null;
        requesterId: string;
    }>;
    addUserComment(tenantId: string, ticketId: string, userId: string, data: CreateCommentDto): Promise<{
        author: {
            nombre: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        isInternal: boolean;
        ticketId: string;
        authorId: string;
    }>;
    getAllTickets(params: {
        page?: number;
        limit?: number;
        status?: string;
        priority?: string;
        assignedToId?: string;
        tenantId?: string;
        type?: string;
        search?: string;
    }): Promise<{
        data: ({
            tenant: {
                id: string;
                nombre: string;
                nit: string;
            };
            _count: {
                comments: number;
            };
            assignedTo: {
                id: string;
                nombre: string;
            } | null;
            requester: {
                nombre: string;
                email: string;
            };
        } & {
            id: string;
            type: string;
            description: string | null;
            tenantId: string;
            metadata: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            priority: string;
            subject: string;
            assignedToId: string | null;
            resolution: string | null;
            ticketNumber: string;
            assignedAt: Date | null;
            resolvedAt: Date | null;
            requesterId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getTicketStats(): Promise<{
        pending: number;
        assigned: number;
        inProgress: number;
        waitingCustomer: number;
        resolved: number;
        closed: number;
        total: number;
        open: number;
        byPriority: {
            priority: string;
            count: number;
        }[];
        byType: {
            type: string;
            count: number;
        }[];
        avgResolutionHours: number;
    }>;
    getAdminTicketById(ticketId: string): Promise<{
        tenant: {
            id: string;
            nombre: string;
            nit: string;
            correo: string;
        };
        assignedTo: {
            id: string;
            nombre: string;
            email: string;
        } | null;
        requester: {
            id: string;
            nombre: string;
            email: string;
        };
        comments: ({
            author: {
                id: string;
                nombre: string;
                email: string;
                rol: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            isInternal: boolean;
            ticketId: string;
            authorId: string;
        })[];
        activities: ({
            actor: {
                nombre: string;
                email: string;
            };
        } & {
            id: string;
            action: string;
            oldValue: string | null;
            newValue: string | null;
            createdAt: Date;
            ticketId: string;
            actorId: string;
        })[];
    } & {
        id: string;
        type: string;
        description: string | null;
        tenantId: string;
        metadata: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        priority: string;
        subject: string;
        assignedToId: string | null;
        resolution: string | null;
        ticketNumber: string;
        assignedAt: Date | null;
        resolvedAt: Date | null;
        requesterId: string;
    }>;
    updateTicket(ticketId: string, adminId: string, data: UpdateTicketDto): Promise<{
        tenant: {
            nombre: string;
        };
        assignedTo: {
            nombre: string;
            email: string;
        } | null;
        requester: {
            nombre: string;
            email: string;
        };
    } & {
        id: string;
        type: string;
        description: string | null;
        tenantId: string;
        metadata: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        priority: string;
        subject: string;
        assignedToId: string | null;
        resolution: string | null;
        ticketNumber: string;
        assignedAt: Date | null;
        resolvedAt: Date | null;
        requesterId: string;
    }>;
    addAdminComment(ticketId: string, adminId: string, data: CreateCommentDto): Promise<{
        author: {
            nombre: string;
            email: string;
            rol: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        isInternal: boolean;
        ticketId: string;
        authorId: string;
    }>;
    getSuperAdmins(): Promise<{
        id: string;
        nombre: string;
        email: string;
    }[]>;
    getTicketsByTenant(tenantId: string, limit?: number): Promise<({
        assignedTo: {
            nombre: string;
        } | null;
        requester: {
            nombre: string;
        };
    } & {
        id: string;
        type: string;
        description: string | null;
        tenantId: string;
        metadata: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        priority: string;
        subject: string;
        assignedToId: string | null;
        resolution: string | null;
        ticketNumber: string;
        assignedAt: Date | null;
        resolvedAt: Date | null;
        requesterId: string;
    })[]>;
}
//# sourceMappingURL=support.service.d.ts.map