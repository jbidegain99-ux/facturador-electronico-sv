import * as React from 'react';
import { type DteTypeCode, type HaciendaTestType } from '../../types';
interface TestExecutorProps {
    dteType: DteTypeCode;
    testType: HaciendaTestType;
    onClose: () => void;
    onComplete: () => void;
}
export declare function TestExecutor({ dteType, testType, onClose, onComplete, }: TestExecutorProps): React.JSX.Element;
export {};
//# sourceMappingURL=TestExecutor.d.ts.map