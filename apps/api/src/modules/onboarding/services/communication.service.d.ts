import { PrismaService } from '../../../prisma/prisma.service';
import { AddCommunicationDto } from '../dto';
export declare class OnboardingCommunicationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCommunications(tenantId: string, page?: number, limit?: number): Promise<{
        communications: {
            id: string;
            type: string;
            direction: string;
            subject: string | null;
            content: string;
            attachments: any;
            relatedStep: string | null;
            sentBy: string | null;
            sentAt: Date;
            readAt: Date | null;
        }[];
        total: number;
        unreadCount: number;
        page: number;
        totalPages: number;
    }>;
    addClientCommunication(tenantId: string, dto: AddCommunicationDto, userId: string): Promise<{
        id: string;
        message: string;
    }>;
    addAdminCommunication(onboardingId: string, dto: AddCommunicationDto, userId: string): Promise<{
        id: string;
        message: string;
    }>;
    markAsRead(tenantId: string, communicationId: string): Promise<{
        success: boolean;
    }>;
    markAllAsRead(tenantId: string): Promise<{
        success: boolean;
    }>;
    getAllCommunications(page?: number, limit?: number): Promise<{
        communications: {
            id: string;
            tenantId: string;
            tenantName: string | null;
            type: string;
            direction: string;
            subject: string | null;
            content: string;
            attachments: any;
            relatedStep: string | null;
            sentBy: string | null;
            sentAt: Date;
            readAt: Date | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
}
//# sourceMappingURL=communication.service.d.ts.map