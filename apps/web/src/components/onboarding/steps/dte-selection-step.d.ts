import * as React from 'react';
import { DteType, DteTypeSelection } from '@/types/onboarding';
interface DteSelectionStepProps {
    selectedTypes?: DteTypeSelection[];
    onSubmit: (types: {
        dteType: DteType;
        isRequired: boolean;
    }[]) => void;
    onBack: () => void;
    loading?: boolean;
}
export declare function DteSelectionStep({ selectedTypes, onSubmit, onBack, loading, }: DteSelectionStepProps): React.JSX.Element;
export {};
//# sourceMappingURL=dte-selection-step.d.ts.map