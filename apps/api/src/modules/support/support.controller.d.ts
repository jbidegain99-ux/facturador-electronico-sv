import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
interface CurrentUserData {
    id: string;
    email: string;
    tenantId: string | null;
    rol: string;
}
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    createTicket(user: CurrentUserData, data: CreateTicketDto): Promise<{
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
    getUserTickets(user: CurrentUserData, page?: string, limit?: string): Promise<{
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
    getUserTicketById(user: CurrentUserData, id: string): Promise<{
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
    addUserComment(user: CurrentUserData, id: string, data: CreateCommentDto): Promise<{
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
}
export declare class AdminSupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    getAllTickets(page?: string, limit?: string, status?: string, priority?: string, assignedToId?: string, tenantId?: string, type?: string, search?: string): Promise<{
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
    getSuperAdmins(): Promise<{
        id: string;
        nombre: string;
        email: string;
    }[]>;
    getTicketsByTenant(tenantId: string, limit?: string): Promise<({
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
    getAdminTicketById(id: string): Promise<{
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
    updateTicket(user: CurrentUserData, id: string, data: UpdateTicketDto): Promise<{
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
    addAdminComment(user: CurrentUserData, id: string, data: CreateCommentDto): Promise<{
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
}
export {};
//# sourceMappingURL=support.controller.d.ts.map