import * as React from 'react';
interface OnboardingStatus {
    hasCompanyData: boolean;
    hasCertificate: boolean;
    hasTestedConnection: boolean;
    hasFirstInvoice: boolean;
}
interface OnboardingChecklistProps {
    status: OnboardingStatus;
    onDismiss?: () => void;
    className?: string;
}
export declare function OnboardingChecklist({ status, onDismiss, className, }: OnboardingChecklistProps): React.JSX.Element | null;
export declare function useOnboardingStatus(): {
    status: OnboardingStatus;
    isLoading: boolean;
};
export {};
//# sourceMappingURL=onboarding-checklist.d.ts.map