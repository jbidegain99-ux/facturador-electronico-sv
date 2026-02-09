import * as React from 'react';
import { EmailRequestType, EmailProvider } from '@/types/email-config';
interface AssistanceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: AssistanceFormData) => Promise<void>;
}
export interface AssistanceFormData {
    requestType: EmailRequestType;
    desiredProvider?: EmailProvider;
    currentProvider?: string;
    accountEmail?: string;
    additionalNotes?: string;
}
export declare function AssistanceModal({ open, onOpenChange, onSubmit, }: AssistanceModalProps): React.JSX.Element;
export declare function AssistanceButton({ onClick }: {
    onClick: () => void;
}): React.JSX.Element;
export {};
//# sourceMappingURL=assistance-modal.d.ts.map