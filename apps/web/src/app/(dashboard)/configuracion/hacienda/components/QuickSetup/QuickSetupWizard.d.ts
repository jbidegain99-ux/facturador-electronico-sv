import * as React from 'react';
import type { HaciendaEnvironment } from '../../types';
export interface QuickSetupData {
    environment: HaciendaEnvironment | null;
    certificate: File | null;
    certificatePassword: string;
    apiUser: string;
    apiPassword: string;
}
interface QuickSetupWizardProps {
    onBack: () => void;
    onComplete: () => void;
}
export declare function QuickSetupWizard({ onBack, onComplete }: QuickSetupWizardProps): React.JSX.Element;
export {};
//# sourceMappingURL=QuickSetupWizard.d.ts.map