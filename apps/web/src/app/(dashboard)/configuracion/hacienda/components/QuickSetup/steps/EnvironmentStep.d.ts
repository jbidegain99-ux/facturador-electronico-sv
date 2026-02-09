import * as React from 'react';
import type { HaciendaEnvironment } from '../../../types';
interface EnvironmentStepProps {
    environment: HaciendaEnvironment | null;
    onSelect: (env: HaciendaEnvironment) => void;
}
export declare function EnvironmentStep({ environment, onSelect }: EnvironmentStepProps): React.JSX.Element;
export {};
//# sourceMappingURL=EnvironmentStep.d.ts.map