import * as React from 'react';
import { TestProgressSummary, DteType } from '@/types/onboarding';
interface ExecuteTestsStepProps {
    testProgress?: TestProgressSummary;
    onExecuteTest: (dteType: DteType) => Promise<void>;
    onExecuteEventTest: (eventType: string) => Promise<void>;
    onRefresh: () => void;
    onNext: () => void;
    onBack: () => void;
    loading?: boolean;
    executingTest?: boolean;
}
export declare function ExecuteTestsStep({ testProgress, onExecuteTest, onExecuteEventTest, onRefresh, onNext, onBack, loading, executingTest, }: ExecuteTestsStepProps): React.JSX.Element;
export {};
//# sourceMappingURL=execute-tests-step.d.ts.map