import * as React from 'react';
import type { HaciendaEnvironment } from '../../../types';
interface CredentialsStepProps {
    apiUser: string;
    apiPassword: string;
    environment: HaciendaEnvironment;
    onSubmit: (user: string, password: string) => void;
    onBack: () => void;
}
export declare function CredentialsStep({ apiUser: initialUser, apiPassword: initialPassword, environment, onSubmit, onBack, }: CredentialsStepProps): React.JSX.Element;
export {};
//# sourceMappingURL=CredentialsStep.d.ts.map