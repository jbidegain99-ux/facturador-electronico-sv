import * as React from 'react';
import { StepDetail, OnboardingStep } from '@/types/onboarding';
interface WizardStepperProps {
    steps: StepDetail[];
    currentStep: OnboardingStep;
    onStepClick?: (step: OnboardingStep) => void;
}
export declare function WizardStepper({ steps, currentStep, onStepClick, }: WizardStepperProps): React.JSX.Element;
export declare function WizardStepperCompact({ steps, currentStep, }: WizardStepperProps): React.JSX.Element;
export {};
//# sourceMappingURL=wizard-stepper.d.ts.map