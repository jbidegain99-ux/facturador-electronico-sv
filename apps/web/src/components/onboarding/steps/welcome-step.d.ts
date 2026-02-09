import * as React from 'react';
import { AssistanceLevel } from '@/types/onboarding';
interface WelcomeStepProps {
    onStart: (level: AssistanceLevel) => void;
    loading?: boolean;
}
export declare function WelcomeStep({ onStart, loading }: WelcomeStepProps): React.JSX.Element;
export {};
//# sourceMappingURL=welcome-step.d.ts.map