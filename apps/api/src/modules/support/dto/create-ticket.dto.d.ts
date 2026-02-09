export declare enum TicketType {
    EMAIL_CONFIG = "EMAIL_CONFIG",
    TECHNICAL = "TECHNICAL",
    BILLING = "BILLING",
    GENERAL = "GENERAL",
    ONBOARDING = "ONBOARDING"
}
export declare enum TicketPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare class CreateTicketDto {
    type: TicketType;
    subject: string;
    description?: string;
    metadata?: string;
    priority?: TicketPriority;
}
//# sourceMappingURL=create-ticket.dto.d.ts.map