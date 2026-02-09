import * as React from 'react';
import { HaciendaCredentialsForm, OnboardingState } from '@/types/onboarding';
interface HaciendaCredentialsStepProps {
    data?: Partial<OnboardingState>;
    onSubmit: (data: HaciendaCredentialsForm) => void;
    onBack: () => void;
    loading?: boolean;
}
export declare function HaciendaCredentialsStep({ data, onSubmit, onBack, loading, }: HaciendaCredentialsStepProps): React.JSX.Element;
export {};
//# sourceMappingURL=hacienda-credentials-step.d.ts.map