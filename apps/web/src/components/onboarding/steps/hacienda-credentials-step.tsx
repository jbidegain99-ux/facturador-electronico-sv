'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Key,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HaciendaCredentialsForm, OnboardingState } from '@/types/onboarding';

interface HaciendaCredentialsStepProps {
  data?: Partial<OnboardingState>;
  onSubmit: (data: HaciendaCredentialsForm) => void;
  onBack: () => void;
  loading?: boolean;
}

export function HaciendaCredentialsStep({
  data,
  onSubmit,
  onBack,
  loading,
}: HaciendaCredentialsStepProps) {
  const [formData, setFormData] = React.useState<HaciendaCredentialsForm>({
    haciendaUser: '',
    haciendaPassword: '',
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleChange = (field: keyof HaciendaCredentialsForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.haciendaUser) {
      newErrors.haciendaUser = 'El usuario es requerido';
    } else if (formData.haciendaUser.length < 14) {
      newErrors.haciendaUser = 'El usuario debe tener al menos 14 caracteres';
    }

    if (!formData.haciendaPassword) {
      newErrors.haciendaPassword = 'La contraseña es requerida';
    } else if (formData.haciendaPassword.length < 6) {
      newErrors.haciendaPassword =
        'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Key className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Credenciales de Hacienda</h2>
          <p className="text-muted-foreground">
            Configure sus credenciales de Servicios en Línea del MH
          </p>
        </div>
      </div>

      {/* Info alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p>
              <strong>¿Dónde obtengo estas credenciales?</strong>
            </p>
            <p className="text-sm">
              Estas son las credenciales que utiliza para acceder al portal de
              Servicios en Línea del Ministerio de Hacienda. El usuario
              generalmente es su NIT sin guiones.
            </p>
            <a
              href="https://portaldgii.mh.gob.sv/ssc/login"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Ir a Servicios en Línea del MH
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </AlertDescription>
      </Alert>

      {data?.hasHaciendaCredentials && (
        <Alert className="border-green-500 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Ya tiene credenciales configuradas. Puede actualizarlas si lo desea.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Credenciales de Acceso</CardTitle>
            <CardDescription>
              Ingrese sus credenciales de Servicios en Línea del MH
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="haciendaUser">
                Usuario (NIT sin guiones) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="haciendaUser"
                placeholder="00000000000000"
                value={formData.haciendaUser}
                onChange={(e) => handleChange('haciendaUser', e.target.value)}
                className={errors.haciendaUser ? 'border-red-500' : ''}
              />
              {errors.haciendaUser && (
                <p className="text-sm text-red-500">{errors.haciendaUser}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Generalmente es su NIT sin guiones (14 dígitos)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="haciendaPassword">
                Contraseña <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="haciendaPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.haciendaPassword}
                  onChange={(e) =>
                    handleChange('haciendaPassword', e.target.value)
                  }
                  className={errors.haciendaPassword ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.haciendaPassword && (
                <p className="text-sm text-red-500">{errors.haciendaPassword}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Contraseña de Servicios en Línea del MH
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security note */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Sus credenciales están seguras</p>
                <p className="text-sm text-muted-foreground">
                  Sus credenciales se almacenan de forma encriptada (AES-256) y
                  solo se utilizan para realizar operaciones con el Ministerio
                  de Hacienda en su nombre.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
