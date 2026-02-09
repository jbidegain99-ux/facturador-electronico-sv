import { EmailProvider, EmailRequestType, RequestStatus } from '../types/email.types';
export declare class CreateEmailAssistanceRequestDto {
    requestType: EmailRequestType;
    desiredProvider?: EmailProvider;
    currentProvider?: string;
    accountEmail?: string;
    additionalNotes?: string;
}
export declare class UpdateEmailAssistanceRequestDto {
    status?: RequestStatus;
    assignedTo?: string;
}
export declare class AddMessageDto {
    message: string;
    attachments?: string[];
}
//# sourceMappingURL=email-assistance-request.dto.d.ts.map