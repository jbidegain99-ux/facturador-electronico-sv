import { CommunicationType, CommunicationDirection, OnboardingStep } from '../types/onboarding.types';
export declare class AddCommunicationDto {
    type: CommunicationType;
    subject?: string;
    content: string;
    attachments?: string[];
    relatedStep?: OnboardingStep;
}
export declare class CommunicationDto {
    id: string;
    type: CommunicationType;
    direction: CommunicationDirection;
    subject?: string;
    content: string;
    attachments?: string[];
    relatedStep?: OnboardingStep;
    sentBy?: string;
    sentAt: Date;
    readAt?: Date;
}
export declare class CommunicationListDto {
    communications: CommunicationDto[];
    total: number;
    unreadCount: number;
}
//# sourceMappingURL=communication.dto.d.ts.map