import * as React from 'react';
import type { QuickSetupData } from '../QuickSetupWizard';
interface ValidationStepProps {
    data: QuickSetupData;
    onBack: () => void;
    onComplete: () => void;
}
export declare function ValidationStep({ data, onBack, onComplete }: ValidationStepProps): React.JSX.Element;
export {};
//# sourceMappingURL=ValidationStep.d.ts.map