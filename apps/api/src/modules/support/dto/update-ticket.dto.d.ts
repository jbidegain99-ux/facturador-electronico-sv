import { TicketPriority } from './create-ticket.dto';
export declare enum TicketStatus {
    PENDING = "PENDING",
    ASSIGNED = "ASSIGNED",
    IN_PROGRESS = "IN_PROGRESS",
    WAITING_CUSTOMER = "WAITING_CUSTOMER",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED"
}
export declare class UpdateTicketDto {
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedToId?: string;
    resolution?: string;
}
//# sourceMappingURL=update-ticket.dto.d.ts.map