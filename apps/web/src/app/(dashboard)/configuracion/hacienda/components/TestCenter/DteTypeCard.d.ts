import * as React from 'react';
import type { TestProgressByDte, DteTypeCode, HaciendaTestType } from '../../types';
interface DteTypeCardProps {
    progress: TestProgressByDte;
    onExecuteTest: (dteType: DteTypeCode, testType: HaciendaTestType) => void;
}
export declare function DteTypeCard({ progress, onExecuteTest }: DteTypeCardProps): React.JSX.Element;
export {};
//# sourceMappingURL=DteTypeCard.d.ts.map