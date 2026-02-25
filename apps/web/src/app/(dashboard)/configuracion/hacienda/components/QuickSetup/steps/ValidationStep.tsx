'use client';

import * as React from 'react';
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  FileKey2,
  Key,
  Server,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { QuickSetupData } from '../QuickSetupWizard';

interface ValidationStepProps {
  data: QuickSetupData;
  onBack: () => void;
  onComplete: () => void;
}

interface ValidationResult {
  success: boolean;
  message: string;
  data?: {
    environment: 'TEST' | 'PRODUCTION';
    certificate: {
      valid: boolean;
      nit: string | null;
      expiresAt: string;
      subject: string;
      daysUntilExpiry: number;
    };
    authentication: {
      valid: boolean;
      tokenExpiresAt: string;
    };
  };
  errors?: { field: string; message: string }[];
}

type ValidationPhase = 'idle' | 'uploading' | 'validating-cert' | 'validating-auth' | 'saving' | 'complete' | 'error';

export function ValidationStep({ data, onBack, onComplete }: ValidationStepProps) {
  const [phase, setPhase] = React.useState<ValidationPhase>('idle');
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState<ValidationResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const startValidation = async () => {
    setPhase('uploading');
    setProgress(10);
    setError(null);
    setResult(null);

    try {
      // Simulate phases for better UX
      await new Promise((r) => setTimeout(r, 500));
      setPhase('validating-cert');
      setProgress(30);

      await new Promise((r) => setTimeout(r, 500));
      setPhase('validating-auth');
      setProgress(50);

      // Prepare form data
      const formData = new FormData();
      formData.append('certificate', data.certificate!);
      if (data.certificatePassword) {
        formData.append('certificatePassword', data.certificatePassword);
      }
      formData.append('environment', data.environment!);
      formData.append('apiUser', data.apiUser);
      formData.append('apiPassword', data.apiPassword);

      setProgress(70);
      setPhase('saving');

      // Call quick-setup endpoint
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hacienda/quick-setup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const response: ValidationResult = await res.json();

      setProgress(100);

      if (response.success) {
        setPhase('complete');
        setResult(response);
      } else {
        setPhase('error');
        setError(response.errors?.[0]?.message || response.message || 'Error desconocido');
      }
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Error de conexion');
    }
  };

  // Auto-start validation when component mounts
  React.useEffect(() => {
    startValidation();
  }, []);

  const phaseLabels: Record<ValidationPhase, string> = {
    idle: 'Preparando...',
    uploading: 'Subiendo certificado...',
    'validating-cert': 'Validando certificado...',
    'validating-auth': 'Verificando credenciales con Hacienda...',
    saving: 'Guardando configuracion...',
    complete: 'Configuracion completada!',
    error: 'Error en la configuracion',
  };

  if (phase === 'complete' && result?.success) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-green-400">Configuracion Exitosa!</h3>
            <p className="text-muted-foreground mt-2">
              Tu ambiente de{' '}
              <span
                className={
                  result.data?.environment === 'TEST' ? 'text-amber-400' : 'text-emerald-400'
                }
              >
                {result.data?.environment === 'TEST' ? 'Pruebas' : 'Produccion'}
              </span>{' '}
              ha sido configurado correctamente.
            </p>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid gap-4">
          {/* Certificate Info */}
          <Card variant="glass" className="border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <FileKey2 className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Certificado Validado</p>
                  <p className="text-sm text-muted-foreground">
                    NIT: {result.data?.certificate.nit || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expira en {result.data?.certificate.daysUntilExpiry} dias
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Auth Info */}
          <Card variant="glass" className="border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Key className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Autenticacion Exitosa</p>
                  <p className="text-sm text-muted-foreground">
                    Token valido hasta:{' '}
                    {result.data?.authentication.tokenExpiresAt
                      ? new Date(result.data.authentication.tokenExpiresAt).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Alert className="bg-primary/10 border-primary/30">
          <Server className="h-4 w-4" />
          <AlertDescription>
            <strong>Siguiente paso:</strong> Ahora puedes ir al Centro de Pruebas para ejecutar
            las pruebas tecnicas requeridas por Hacienda, o comenzar a crear facturas si ya
            tienes autorizacion.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-4">
          <Button onClick={onComplete}>
            Continuar al Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Error Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30">
            <XCircle className="h-10 w-10 text-red-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-red-400">Error de Configuracion</h3>
            <p className="text-muted-foreground mt-2">
              No pudimos completar la configuracion. Por favor verifica los datos e intenta de nuevo.
            </p>
          </div>
        </div>

        {/* Error Details */}
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>

        {/* Troubleshooting */}
        <Card variant="glass">
          <CardContent className="p-4 space-y-3">
            <p className="font-medium">Posibles soluciones:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                Verifica que la contrasena del certificado sea correcta
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                Asegurate que el certificado no haya expirado
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                Confirma que el usuario y contrasena de API sean correctos
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">4.</span>
                Verifica que el ambiente seleccionado coincida con tus credenciales
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onBack}>
            Volver y Corregir
          </Button>
          <Button onClick={startValidation}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/20 border border-purple-500/30">
          <Loader2 className="h-10 w-10 text-purple-400 animate-spin" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">Validando Configuracion</h3>
          <p className="text-muted-foreground mt-2">{phaseLabels[phase]}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-center text-sm text-muted-foreground">{progress}%</p>
      </div>

      {/* Steps Progress */}
      <Card variant="glass">
        <CardContent className="p-4 space-y-3">
          <ValidationPhaseItem
            label="Subir certificado"
            status={phase === 'uploading' ? 'active' : progress >= 10 ? 'complete' : 'pending'}
          />
          <ValidationPhaseItem
            label="Validar certificado"
            status={phase === 'validating-cert' ? 'active' : progress >= 30 ? 'complete' : 'pending'}
          />
          <ValidationPhaseItem
            label="Verificar credenciales con Hacienda"
            status={phase === 'validating-auth' ? 'active' : progress >= 50 ? 'complete' : 'pending'}
          />
          <ValidationPhaseItem
            label="Guardar configuracion"
            status={phase === 'saving' ? 'active' : progress >= 70 ? 'complete' : 'pending'}
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface ValidationPhaseItemProps {
  label: string;
  status: 'pending' | 'active' | 'complete';
}

function ValidationPhaseItem({ label, status }: ValidationPhaseItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center',
          status === 'complete' && 'bg-green-500',
          status === 'active' && 'bg-primary',
          status === 'pending' && 'bg-muted'
        )}
      >
        {status === 'complete' ? (
          <CheckCircle className="h-4 w-4 text-white" />
        ) : status === 'active' ? (
          <Loader2 className="h-4 w-4 text-white animate-spin" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
        )}
      </div>
      <span
        className={cn(
          'text-sm',
          status === 'complete' && 'text-green-500',
          status === 'active' && 'text-primary',
          status === 'pending' && 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </div>
  );
}
