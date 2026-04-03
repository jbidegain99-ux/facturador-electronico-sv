'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Loader2, KeyRound, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ApiCredentialsForm } from '@/types/onboarding';

interface ApiCredentialsStepProps {
  type: 'test' | 'prod';
  hasCredentials?: boolean;
  savedEnvironmentUrl?: string;
  onSubmit: (data: ApiCredentialsForm) => void;
  onBack: () => void;
  loading?: boolean;
}

export function ApiCredentialsStep({ type, hasCredentials, savedEnvironmentUrl, onSubmit, onBack, loading }: ApiCredentialsStepProps) {
  const [formData, setFormData] = React.useState<ApiCredentialsForm>({ apiPassword: '', environmentUrl: savedEnvironmentUrl || '' });
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => { if (savedEnvironmentUrl) setFormData(prev => ({ ...prev, environmentUrl: savedEnvironmentUrl })); }, [savedEnvironmentUrl]);
  React.useEffect(() => { if (hasCredentials) setError(''); }, [hasCredentials]);

  const isTest = type === 'test';
  const title = isTest ? 'Credenciales API de Pruebas' : 'Credenciales API de Produccion';
  const defaultUrl = isTest ? 'https://apitest.dtes.mh.gob.sv' : 'https://api.dtes.mh.gob.sv';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasCredentials && !formData.apiPassword) { onSubmit({ apiPassword: '', environmentUrl: '', skipUpdate: true } as ApiCredentialsForm); return; }
    if (!formData.apiPassword || formData.apiPassword.length < 8) { setError('La contrasena API debe tener al menos 8 caracteres'); return; }
    onSubmit({ ...formData, environmentUrl: formData.environmentUrl || defaultUrl });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10"><KeyRound className="h-6 w-6 text-primary" /></div>
        <div><h2 className="text-2xl font-bold">{title}</h2><p className="text-muted-foreground">Configure las credenciales para conectarse a la API del MH</p></div>
      </div>

      {hasCredentials && (
        <Card className="border-green-500 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-700 dark:text-green-400">Credenciales API configuradas correctamente</p>
                <p className="text-sm text-muted-foreground mt-1">Su contrasena API ya esta guardada.{formData.environmentUrl && <> URL: <strong>{formData.environmentUrl}</strong>.</>}</p>
                <p className="text-sm text-muted-foreground mt-1">Puede continuar o actualizar las credenciales si lo desea.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>La contrasena API es diferente a la contrasena de Servicios en Linea. Es proporcionada por Hacienda especificamente para la API de DTE.</AlertDescription></Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{hasCredentials ? 'Actualizar Credenciales (opcional)' : 'Credenciales de API'}</CardTitle>
            <CardDescription>{hasCredentials ? 'Ingrese nuevos valores solo si desea actualizar' : 'Ingrese la contrasena API proporcionada por Hacienda'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiPassword">Contrasena API {!hasCredentials && <span className="text-red-500">*</span>}</Label>
              <div className="relative">
                <Input id="apiPassword" type={showPassword ? 'text' : 'password'} value={formData.apiPassword} onChange={(e) => setFormData(prev => ({ ...prev, apiPassword: e.target.value }))} placeholder={hasCredentials ? 'Contrasena guardada - dejar vacio para mantener' : ''} className="pr-10" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="environmentUrl">URL del Ambiente (opcional)</Label>
              <Input id="environmentUrl" type="url" value={formData.environmentUrl} onChange={(e) => setFormData(prev => ({ ...prev, environmentUrl: e.target.value }))} placeholder={defaultUrl} />
              <p className="text-xs text-muted-foreground">Dejar vacio para usar la URL por defecto: {defaultUrl}</p>
            </div>
          </CardContent>
        </Card>

        {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Anterior</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : <>{hasCredentials && !formData.apiPassword ? 'Continuar sin cambios' : 'Continuar'}<ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </div>
      </form>
    </div>
  );
}
