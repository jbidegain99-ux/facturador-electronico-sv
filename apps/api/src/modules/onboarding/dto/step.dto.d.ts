import { OnboardingStep, StepStatus, PerformedBy } from '../types/onboarding.types';
export declare class UpdateStepDto {
    step: OnboardingStep;
    status?: StepStatus;
    stepData?: Record<string, unknown>;
    notes?: string;
    blockerReason?: string;
}
export declare class CompleteStepDto {
    step: OnboardingStep;
    stepData?: Record<string, unknown>;
    notes?: string;
}
export declare class GoToStepDto {
    step: OnboardingStep;
}
export declare class StepDetailDto {
    step: OnboardingStep;
    name: string;
    description: string;
    status: StepStatus;
    order: number;
    isCurrentStep: boolean;
    canNavigateTo: boolean;
    stepData?: Record<string, unknown>;
    notes?: string;
    blockerReason?: string;
    performedBy?: PerformedBy;
    startedAt?: Date;
    completedAt?: Date;
}
export declare class OnboardingProgressDto {
    currentStep: OnboardingStep;
    overallStatus: string;
    completedSteps: number;
    totalSteps: number;
    percentComplete: number;
    steps: StepDetailDto[];
    canProceed: boolean;
    nextAction?: string;
}
//# sourceMappingURL=step.dto.d.ts.map