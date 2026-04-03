'use client';

import { type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStep {
  label: string;
  content: ReactNode;
}

interface MobileWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}

export function MobileWizard({
  steps,
  currentStep,
  onStepChange,
  onSubmit,
  submitLabel = 'Enviar',
  isSubmitting = false,
  className,
}: MobileWizardProps) {
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const currentStepData = steps[currentStep];

  return (
    <div className={cn('flex flex-col md:hidden', className)}>
      {/* Progress bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
        {steps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => onStepChange(idx)}
            className={cn(
              'flex-1 h-1.5 rounded-full transition-colors',
              idx <= currentStep ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Step label */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Paso {currentStep + 1} de {steps.length}
        </p>
        <h2 className="text-lg font-semibold">{currentStepData.label}</h2>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {currentStepData.content}
      </div>

      {/* Navigation footer */}
      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border bg-background px-4 py-3 flex gap-3 md:hidden">
        {!isFirstStep && (
          <button
            onClick={() => onStepChange(currentStep - 1)}
            className="flex items-center gap-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Atrás
          </button>
        )}
        <button
          onClick={isLastStep ? onSubmit : () => onStepChange(currentStep + 1)}
          disabled={isSubmitting}
          className={cn(
            'flex-1 flex items-center justify-center gap-1 rounded-lg px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground',
            isSubmitting && 'opacity-50'
          )}
        >
          {isSubmitting ? (
            'Enviando...'
          ) : isLastStep ? (
            submitLabel
          ) : (
            <>
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
