import { DteType, TestResult } from '../types/onboarding.types';
export declare class ExecuteTestDto {
    dteType: DteType;
    testData?: Record<string, unknown>;
}
export declare class ExecuteEventTestDto {
    eventType: 'ANULACION' | 'CONTINGENCIA' | 'INVALIDACION';
    relatedDteId?: string;
    eventData?: Record<string, unknown>;
}
export declare class TestResultDto {
    success: boolean;
    dteType?: DteType;
    eventType?: string;
    message: string;
    responseCode?: string;
    selloRecibido?: string;
    codigoGeneracion?: string;
    errors?: string[];
    timestamp: Date;
}
export declare class TestProgressSummaryDto {
    totalTestsRequired: number;
    totalTestsCompleted: number;
    percentComplete: number;
    dteProgress: {
        dteType: DteType;
        name: string;
        required: number;
        completed: number;
        isComplete: boolean;
    }[];
    eventProgress: {
        eventType: string;
        name: string;
        required: number;
        completed: number;
        isComplete: boolean;
    }[];
    canRequestAuthorization: boolean;
    lastTestAt?: Date;
    lastTestResult?: TestResult;
}
//# sourceMappingURL=test-execution.dto.d.ts.map