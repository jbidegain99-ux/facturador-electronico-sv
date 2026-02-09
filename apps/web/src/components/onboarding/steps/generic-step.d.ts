import * as React from 'react';
import { CertificateForm, ApiCredentialsForm } from '@/types/onboarding';
interface CertificateStepProps {
    type: 'test' | 'prod';
    hasCertificate?: boolean;
    onSubmit: (data: CertificateForm) => void;
    onBack: () => void;
    loading?: boolean;
}
export declare function CertificateStep({ type, hasCertificate, onSubmit, onBack, loading, }: CertificateStepProps): React.JSX.Element;
interface ApiCredentialsStepProps {
    type: 'test' | 'prod';
    hasCredentials?: boolean;
    onSubmit: (data: ApiCredentialsForm) => void;
    onBack: () => void;
    loading?: boolean;
}
export declare function ApiCredentialsStep({ type, hasCredentials, onSubmit, onBack, loading, }: ApiCredentialsStepProps): React.JSX.Element;
interface WaitingStepProps {
    type: 'test-environment' | 'authorization';
    onProceed: () => void;
    onBack: () => void;
    loading?: boolean;
}
export declare function WaitingStep({ type, onProceed, onBack, loading, }: WaitingStepProps): React.JSX.Element;
interface CompletedStepProps {
    type: 'validation' | 'completed';
    onFinish?: () => void;
    onBack?: () => void;
    loading?: boolean;
}
export declare function CompletedStep({ type, onFinish, onBack, loading, }: CompletedStepProps): React.JSX.Element;
export {};
//# sourceMappingURL=generic-step.d.ts.map