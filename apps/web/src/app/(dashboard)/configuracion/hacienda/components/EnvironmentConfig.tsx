'use client';

import * as React from 'react';
import {
  Upload,
  Key,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Shield,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import type { HaciendaEnvironment, EnvironmentConfigData } from '../types';

interface EnvironmentConfigProps {
  environment: HaciendaEnvironment;
  config: EnvironmentConfigData | null;
  disabled?: boolean;
  disabledMessage?: string;
  onConfigured: () => void;
}

export function EnvironmentConfig({
  environment,
  config,
  disabled = false,
  disabledMessage,
  onConfigured,
}: EnvironmentConfigProps) {
  const toast = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form state
  const [apiUser, setApiUser] = React.useState('');
  const [apiPassword, setApiPassword] = React.useState('');
  const [certificatePassword, setCertificatePassword] = React.useState('');
  const [certificateFile, setCertificateFile] = React.useState<File | null>(null);

  // UI state
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [renewing, setRenewing] = React.useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file extension
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext !== 'p12' && ext !== 'pfx') {
        toast.error('El archivo debe ser .p12 o .pfx');
        return;
      }
      setCertificateFile(file);
    }
  };

  const handleSave = async () => {
    if (!apiUser || !apiPassword || !certificatePassword) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    if (!certificateFile && !config?.isConfigured) {
      toast.error('Seleccione el archivo de certificado');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('apiUser', apiUser);
      formData.append('apiPassword', apiPassword);
      formData.append('certificatePassword', certificatePassword);
      if (certificateFile) {
        formData.append('certificate', certificateFile);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/hacienda/config/${environment}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Configuración guardada');
        onConfigured();
        // Clear form
        setApiPassword('');
        setCertificatePassword('');
        setCertificateFile(null);
      } else {
        throw new Error(data.message || 'Error al guardar');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/hacienda/config/test-connection`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ environment }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Conexión exitosa');
        onConfigured();
      } else {
        throw new Error(data.message || 'Error de conexión');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error de conexión');
    } finally {
      setTesting(false);
    }
  };

  const handleRenewToken = async () => {
    setRenewing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/hacienda/config/renew-token`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ environment }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success('Token renovado exitosamente');
        onConfigured();
      } else {
        throw new Error(data.message || 'Error al renovar token');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al renovar');
    } finally {
      setRenewing(false);
    }
  };

  if (disabled) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground max-w-md">
            {disabledMessage || 'Esta configuración no está disponible actualmente'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isEnvironmentTest = environment === 'TEST';
  const environmentLabel = isEnvironmentTest ? 'Pruebas' : 'Producción';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Certificate Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Certificado Digital
            </CardTitle>
            <CardDescription>
              Cargue el certificado .p12 o .pfx proporcionado por Hacienda para el ambiente de {environmentLabel.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config?.certificateInfo ? (
              <Alert className="bg-emerald-500/10 border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="ml-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Certificado cargado: {config.certificateInfo.fileName}</span>
                    <span className="text-sm text-muted-foreground">
                      NIT: {config.certificateInfo.nit || 'N/A'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Válido hasta: {new Date(config.certificateInfo.validUntil).toLocaleDateString()}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="certificate">
                {config?.certificateInfo ? 'Reemplazar certificado' : 'Seleccionar certificado'}
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  ref={fileInputRef}
                  id="certificate"
                  type="file"
                  accept=".p12,.pfx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar archivo
                </Button>
                {certificateFile && (
                  <span className="text-sm text-muted-foreground">
                    {certificateFile.name}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certPassword">Contraseña del certificado</Label>
              <Input
                id="certPassword"
                type="password"
                value={certificatePassword}
                onChange={(e) => setCertificatePassword(e.target.value)}
                placeholder="Ingrese la contraseña del certificado"
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {/* API Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Credenciales de API
            </CardTitle>
            <CardDescription>
              Ingrese las credenciales de API proporcionadas por Hacienda para autenticación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiUser">Usuario de API</Label>
              <Input
                id="apiUser"
                type="text"
                value={apiUser}
                onChange={(e) => setApiUser(e.target.value)}
                placeholder="NIT sin guiones (ej: 06141234567890)"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Generalmente es el NIT del contribuyente sin guiones
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiPassword">Contraseña de API</Label>
              <Input
                id="apiPassword"
                type="password"
                value={apiPassword}
                onChange={(e) => setApiPassword(e.target.value)}
                placeholder="Contraseña asignada por Hacienda"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Debe tener entre 13-25 caracteres, incluir letras, números y caracteres especiales
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  Guardar configuración
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Conexión</CardTitle>
            <CardDescription>
              Verifique la conexión con Hacienda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {config?.isValidated ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium">
                  {config?.isValidated ? 'Conectado' : 'Sin validar'}
                </span>
              </div>
              {config?.isValidated && config.tokenExpiry && (
                <span className="text-xs text-muted-foreground">
                  Expira: {new Date(config.tokenExpiry).toLocaleString()}
                </span>
              )}
            </div>

            {config?.lastValidationError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="ml-2 text-sm">
                  {config.lastValidationError}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleTestConnection}
              disabled={!config?.isConfigured || testing}
              variant="outline"
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Probando...
                </>
              ) : (
                <>
                  Probar conexión
                </>
              )}
            </Button>

            {config?.isValidated && (
              <Button
                onClick={handleRenewToken}
                disabled={renewing}
                variant="ghost"
                className="w-full"
              >
                {renewing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Renovando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Renovar token
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Los tokens de {isEnvironmentTest ? 'pruebas' : 'producción'} tienen validez de{' '}
                <strong>{isEnvironmentTest ? '48' : '24'} horas</strong>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Sus credenciales se almacenan de forma encriptada y segura
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
