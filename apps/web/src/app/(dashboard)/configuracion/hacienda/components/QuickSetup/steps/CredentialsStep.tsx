'use client';

import * as React from 'react';
import { Key, Eye, EyeOff, AlertCircle, ExternalLink, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import type { HaciendaEnvironment } from '../../../types';

interface CredentialsStepProps {
  apiUser: string;
  apiPassword: string;
  environment: HaciendaEnvironment;
  onSubmit: (user: string, password: string) => void;
  onBack: () => void;
}

export function CredentialsStep({
  apiUser: initialUser,
  apiPassword: initialPassword,
  environment,
  onSubmit,
  onBack,
}: CredentialsStepProps) {
  const [apiUser, setApiUser] = React.useState(initialUser);
  const [apiPassword, setApiPassword] = React.useState(initialPassword);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [validating, setValidating] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!apiUser.trim()) {
      setError('El usuario de API es requerido');
      return;
    }

    if (!apiPassword) {
      setError('La contrasena de API es requerida');
      return;
    }

    if (apiPassword.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres');
      return;
    }

    // Optional: validate credentials before proceeding
    setValidating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/hacienda/validate-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          apiUser: apiUser.trim(),
          apiPassword,
          environment,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || 'Credenciales invalidas');
        setValidating(false);
        return;
      }

      // Credentials are valid, proceed
      onSubmit(apiUser.trim(), apiPassword);
    } catch (err) {
      setError('Error al validar credenciales. Intenta nuevamente.');
    } finally {
      setValidating(false);
    }
  };

  const portalUrl =
    environment === 'PRODUCTION'
      ? 'https://portaldgii.mh.gob.sv/ssc/login'
      : 'https://portaldgii.mh.gob.sv/ssc/login';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Credenciales de API</h3>
        <p className="text-muted-foreground">
          Ingresa las credenciales de API para el ambiente de{' '}
          <span className={environment === 'TEST' ? 'text-amber-400' : 'text-emerald-400'}>
            {environment === 'TEST' ? 'Pruebas' : 'Produccion'}
          </span>
        </p>
      </div>

      {/* Form Card */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5 text-purple-400" />
            Credenciales de Hacienda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API User */}
          <div className="space-y-2">
            <Label htmlFor="apiUser">Usuario de API (NIT)</Label>
            <Input
              id="apiUser"
              type="text"
              value={apiUser}
              onChange={(e) => setApiUser(e.target.value)}
              placeholder="06141234567890"
              className="bg-slate-800/50"
            />
            <p className="text-xs text-muted-foreground">
              Generalmente es tu NIT sin guiones (14 digitos)
            </p>
          </div>

          {/* API Password */}
          <div className="space-y-2">
            <Label htmlFor="apiPassword">Contrasena de API</Label>
            <div className="relative">
              <Input
                id="apiPassword"
                type={showPassword ? 'text' : 'password'}
                value={apiPassword}
                onChange={(e) => setApiPassword(e.target.value)}
                placeholder="Tu contrasena de API"
                className="pr-10 bg-slate-800/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Esta contrasena se genera en el portal de Hacienda (minimo 8 caracteres)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Help Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <ExternalLink className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">No tienes tus credenciales de API?</p>
              <p className="text-xs text-muted-foreground">
                Puedes obtener o regenerar tus credenciales desde el portal de Hacienda.
              </p>
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
              >
                Ir al portal de Hacienda
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Note */}
      <Alert className="bg-slate-800/50 border-slate-700">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Seguridad:</strong> Tus credenciales se almacenan de forma encriptada (AES-256).
          Nunca compartimos tu informacion con terceros.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={onBack} disabled={validating}>
          Atras
        </Button>
        <Button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700"
          disabled={!apiUser || !apiPassword || validating}
        >
          {validating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Validando...
            </>
          ) : (
            'Continuar'
          )}
        </Button>
      </div>
    </form>
  );
}
