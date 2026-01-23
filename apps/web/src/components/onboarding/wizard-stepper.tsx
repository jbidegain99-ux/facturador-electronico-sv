'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Check,
  Circle,
  Lock,
  AlertCircle,
  Building2,
  Key,
  FileText,
  FlaskConical,
  ShieldCheck,
  KeyRound,
  PlayCircle,
  Send,
  CheckCircle2,
  PartyPopper,
  HandMetal,
} from 'lucide-react';
import { StepDetail, OnboardingStep } from '@/types/onboarding';

interface WizardStepperProps {
  steps: StepDetail[];
  currentStep: OnboardingStep;
  onStepClick?: (step: OnboardingStep) => void;
}

const STEP_ICONS: Record<OnboardingStep, React.ElementType> = {
  WELCOME: HandMetal,
  COMPANY_INFO: Building2,
  HACIENDA_CREDENTIALS: Key,
  DTE_TYPE_SELECTION: FileText,
  TEST_ENVIRONMENT_REQUEST: FlaskConical,
  TEST_CERTIFICATE: ShieldCheck,
  API_CREDENTIALS_TEST: KeyRound,
  EXECUTE_TESTS: PlayCircle,
  REQUEST_AUTHORIZATION: Send,
  PROD_CERTIFICATE: ShieldCheck,
  API_CREDENTIALS_PROD: KeyRound,
  FINAL_VALIDATION: CheckCircle2,
  COMPLETED: PartyPopper,
};

export function WizardStepper({
  steps,
  currentStep,
  onStepClick,
}: WizardStepperProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex flex-col gap-2">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[step.step];
          const isCompleted = step.status === 'COMPLETED';
          const isCurrent = step.isCurrentStep;
          const isBlocked = step.status === 'BLOCKED';
          const canNavigate = step.canNavigateTo && onStepClick;

          return (
            <li key={step.step}>
              <button
                onClick={() => canNavigate && onStepClick(step.step)}
                disabled={!canNavigate}
                className={cn(
                  'flex items-center gap-3 w-full p-3 rounded-lg transition-all text-left',
                  isCurrent && 'bg-primary/10 border border-primary',
                  isCompleted && !isCurrent && 'bg-green-500/10',
                  isBlocked && 'bg-red-500/10',
                  canNavigate && 'hover:bg-muted cursor-pointer',
                  !canNavigate && !isCurrent && 'opacity-60'
                )}
              >
                {/* Step indicator */}
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
                    isCompleted && 'border-green-500 bg-green-500 text-white',
                    isCurrent && !isCompleted && 'border-primary bg-primary text-white',
                    isBlocked && 'border-red-500 bg-red-500/20 text-red-500',
                    !isCompleted && !isCurrent && !isBlocked && 'border-muted-foreground/30'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : isBlocked ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : !step.canNavigateTo ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium truncate',
                      isCurrent && 'text-primary',
                      isCompleted && 'text-green-600 dark:text-green-400',
                      isBlocked && 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {step.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>

                {/* Status badge */}
                {isCompleted && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Completado
                  </span>
                )}
                {isBlocked && (
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Bloqueado
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Compact horizontal stepper for mobile
export function WizardStepperCompact({
  steps,
  currentStep,
}: WizardStepperProps) {
  const currentIndex = steps.findIndex((s) => s.step === currentStep);
  const completedCount = steps.filter((s) => s.status === 'COMPLETED').length;

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium">
          Paso {currentIndex + 1} de {steps.length}
        </span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${(completedCount / steps.length) * 100}%`,
            }}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {Math.round((completedCount / steps.length) * 100)}%
        </span>
      </div>

      {/* Current step info */}
      <div className="flex items-center gap-2">
        {(() => {
          const Icon = STEP_ICONS[currentStep];
          return <Icon className="h-5 w-5 text-primary" />;
        })()}
        <span className="font-medium">
          {steps.find((s) => s.step === currentStep)?.name}
        </span>
      </div>
    </div>
  );
}
