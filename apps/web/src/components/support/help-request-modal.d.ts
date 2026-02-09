interface HelpRequestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultType?: 'EMAIL_CONFIG' | 'TECHNICAL' | 'BILLING' | 'GENERAL' | 'ONBOARDING';
    contextData?: Record<string, any>;
}
export declare function HelpRequestModal({ open, onOpenChange, defaultType, contextData, }: HelpRequestModalProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=help-request-modal.d.ts.map