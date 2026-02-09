import * as React from 'react';
import { CompanyInfoForm, OnboardingState } from '@/types/onboarding';
interface CompanyInfoStepProps {
    data?: Partial<OnboardingState>;
    onSubmit: (data: CompanyInfoForm) => void;
    onBack: () => void;
    loading?: boolean;
}
export declare function CompanyInfoStep({ data, onSubmit, onBack, loading, }: CompanyInfoStepProps): React.JSX.Element;
export {};
//# sourceMappingURL=company-info-step.d.ts.map