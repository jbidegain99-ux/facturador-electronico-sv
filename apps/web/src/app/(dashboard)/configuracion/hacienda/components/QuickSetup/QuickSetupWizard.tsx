'use client';

import * as React from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EnvironmentStep } from './steps/EnvironmentStep';
import { CertificateStep } from './steps/CertificateStep';
import { CredentialsStep } from './steps/CredentialsStep';
import { ValidationStep } from './steps/ValidationStep';
import type { HaciendaEnvironment } from '../../types';

export interface QuickSetupData {
  environment: HaciendaEnvironment | null;
  certificate: File | null;
  certificatePassword: string;
  apiUser: string;
  apiPassword: string;
}

interface QuickSetupWizardProps {
  onBack: () => void;
  onComplete: () => void;
}

const steps = [
  { id: 1, title: 'Ambiente', description: 'Selecciona el ambiente' },
  { id: 2, title: 'Certificado', description: 'Sube tu archivo .p12' },
  { id: 3, title: 'Credenciales', description: 'Ingresa usuario y password' },
  { id: 4, title: 'Validar', description: 'Verificar configuracion' },
];

export function QuickSetupWizard({ onBack, onComplete }: QuickSetupWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [data, setData] = React.useState<QuickSetupData>({
    environment: null,
    certificate: null,
    certificatePassword: '',
    apiUser: '',
    apiPassword: '',
  });

  const updateData = React.useCallback((updates: Partial<QuickSetupData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleNext = React.useCallback(() => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const handlePrev = React.useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      onBack();
    }
  }, [currentStep, onBack]);

  const goToStep = React.useCallback((step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  }, [currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <EnvironmentStep
            environment={data.environment}
            onSelect={(env) => {
              updateData({ environment: env });
              handleNext();
            }}
          />
        );
      case 2:
        return (
          <CertificateStep
            certificate={data.certificate}
            certificatePassword={data.certificatePassword}
            onSubmit={(cert, password) => {
              updateData({ certificate: cert, certificatePassword: password });
              handleNext();
            }}
            onBack={handlePrev}
          />
        );
      case 3:
        return (
          <CredentialsStep
            apiUser={data.apiUser}
            apiPassword={data.apiPassword}
            environment={data.environment!}
            onSubmit={(user, password) => {
              updateData({ apiUser: user, apiPassword: password });
              handleNext();
            }}
            onBack={handlePrev}
          />
        );
      case 4:
        return (
          <ValidationStep
            data={data}
            onBack={handlePrev}
            onComplete={onComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Configuracion Rapida</h2>
          <p className="text-muted-foreground">
            Configura tu ambiente de Hacienda en minutos
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between px-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => goToStep(step.id)}
              disabled={step.id >= currentStep}
              className={cn(
                'flex items-center gap-3 transition-all',
                step.id < currentStep && 'cursor-pointer',
                step.id >= currentStep && 'cursor-default'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all',
                  step.id < currentStep && 'bg-green-500 text-white',
                  step.id === currentStep && 'bg-purple-600 text-white ring-4 ring-purple-600/20',
                  step.id > currentStep && 'bg-slate-700 text-slate-400'
                )}
              >
                {step.id < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <div className="hidden md:block text-left">
                <p
                  className={cn(
                    'text-sm font-medium',
                    step.id === currentStep ? 'text-white' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 md:mx-4',
                  step.id < currentStep ? 'bg-green-500' : 'bg-slate-700'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">{renderStep()}</div>
    </div>
  );
}
