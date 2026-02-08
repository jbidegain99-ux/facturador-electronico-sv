'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Rocket,
  Check,
  ChevronRight,
  Building2,
  KeyRound,
  Wifi,
  FileText,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingStatus {
  hasCompanyData: boolean;
  hasCertificate: boolean;
  hasTestedConnection: boolean;
  hasFirstInvoice: boolean;
}

interface OnboardingChecklistProps {
  status: OnboardingStatus;
  onDismiss?: () => void;
  className?: string;
}

export function OnboardingChecklist({
  status,
  onDismiss,
  className,
}: OnboardingChecklistProps) {
  const router = useRouter();

  const steps = [
    {
      id: 'company',
      label: 'Datos de empresa',
      description: 'Registrar informacion de tu empresa',
      completed: status.hasCompanyData,
      action: () => router.push('/configuracion'),
      actionLabel: 'Configurar',
    },
    {
      id: 'certificate',
      label: 'Certificado digital',
      description: 'Subir certificado .p12 del MH',
      completed: status.hasCertificate,
      action: () => router.push('/configuracion?tab=certificado'),
      actionLabel: 'Subir',
    },
    {
      id: 'connection',
      label: 'Conexion con MH',
      description: 'Probar conexion con Hacienda',
      completed: status.hasTestedConnection,
      action: () => router.push('/configuracion?tab=conexion'),
      actionLabel: 'Probar',
    },
    {
      id: 'invoice',
      label: 'Primera factura',
      description: 'Crear tu primera factura de prueba',
      completed: status.hasFirstInvoice,
      action: () => router.push('/facturas/nueva'),
      actionLabel: 'Crear',
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;
  const allCompleted = completedCount === steps.length;

  // Don't show if all completed
  if (allCompleted) {
    return null;
  }

  return (
    <div className={cn('glass-card p-5', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-white">
              Configura tu cuenta ({completedCount}/{steps.length})
            </h3>
            <p className="text-sm text-muted-foreground">
              Completa estos pasos para empezar a facturar
            </p>
          </div>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-muted-foreground hover:text-white -mr-2 -mt-2"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {progress.toFixed(0)}% completado
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const Icon =
            step.id === 'company'
              ? Building2
              : step.id === 'certificate'
              ? KeyRound
              : step.id === 'connection'
              ? Wifi
              : FileText;

          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg transition-colors',
                step.completed
                  ? 'bg-green-500/10'
                  : 'bg-white/5 hover:bg-white/10'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    step.completed
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {step.completed ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      step.completed ? 'text-green-500' : 'text-white'
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>

              {step.completed ? (
                <span className="text-xs text-green-500 font-medium">
                  Completado
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={step.action}
                  className="text-primary hover:text-primary hover:bg-primary/20"
                >
                  {step.actionLabel}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        ¿Necesitas ayuda?{' '}
        <a href="#" className="text-primary hover:underline">
          Ver guia de inicio
        </a>
      </p>
    </div>
  );
}

// Hook to get onboarding status
export function useOnboardingStatus() {
  const [status, setStatus] = React.useState<OnboardingStatus>({
    hasCompanyData: false,
    hasCertificate: false,
    hasTestedConnection: false,
    hasFirstInvoice: false,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchStatus() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tenants/me/onboarding-status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error('Error fetching onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
  }, []);

  return { status, isLoading };
}
