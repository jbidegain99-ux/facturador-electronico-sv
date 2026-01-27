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
  ArrowRight,
  ArrowLeft,
  Loader2,
  Upload,
  ShieldCheck,
  KeyRound,
  Send,
  CheckCircle2,
  FlaskConical,
  PartyPopper,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OnboardingStep, CertificateForm, ApiCredentialsForm } from '@/types/onboarding';

// ============================================================================
// CERTIFICATE UPLOAD STEP
// ============================================================================

type CertificateUploadMode = 'combined' | 'separate';

interface CertificateStepProps {
  type: 'test' | 'prod';
  hasCertificate?: boolean;
  onSubmit: (data: CertificateForm) => void;
  onBack: () => void;
  loading?: boolean;
}

export function CertificateStep({
  type,
  hasCertificate,
  onSubmit,
  onBack,
  loading,
}: CertificateStepProps) {
  const [uploadMode, setUploadMode] = React.useState<CertificateUploadMode>('combined');
  const [formData, setFormData] = React.useState<CertificateForm>({
    certificate: '',
    password: '',
    expiryDate: '',
  });
  // For separate file upload
  const [privateKey, setPrivateKey] = React.useState<string>('');
  const [privateKeyFileName, setPrivateKeyFileName] = React.useState<string>('');

  const [fileName, setFileName] = React.useState<string>('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  const isTest = type === 'test';
  const title = isTest ? 'Certificado de Pruebas' : 'Certificado de Producción';
  const description = isTest
    ? 'Suba su certificado digital para el ambiente de pruebas'
    : 'Suba su certificado digital para el ambiente de producción';

  const handleCombinedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    if (!fileNameLower.endsWith('.p12') && !fileNameLower.endsWith('.pfx')) {
      setError('Para el modo combinado, el archivo debe ser .p12 o .pfx');
      return;
    }

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setFormData((prev) => ({ ...prev, certificate: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleCertificateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    const validExtensions = ['.crt', '.cer', '.pem'];
    const isValid = validExtensions.some(ext => fileNameLower.endsWith(ext));

    if (!isValid) {
      setError('El certificado debe ser .crt, .cer o .pem');
      return;
    }

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setFormData((prev) => ({ ...prev, certificate: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handlePrivateKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    const validExtensions = ['.key', '.pem'];
    const isValid = validExtensions.some(ext => fileNameLower.endsWith(ext));

    if (!isValid) {
      setError('La llave privada debe ser .key o .pem');
      return;
    }

    setPrivateKeyFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setPrivateKey(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleModeChange = (mode: CertificateUploadMode) => {
    setUploadMode(mode);
    // Reset form when switching modes
    setFormData({ certificate: '', password: '', expiryDate: '' });
    setPrivateKey('');
    setFileName('');
    setPrivateKeyFileName('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.certificate) {
      setError('Debe seleccionar un archivo de certificado');
      return;
    }

    if (uploadMode === 'combined' && !formData.password) {
      setError('Debe ingresar la contraseña del certificado');
      return;
    }

    if (uploadMode === 'separate' && !privateKey) {
      setError('Debe seleccionar el archivo de llave privada');
      return;
    }

    // Include private key in the form data for separate mode
    const submitData = uploadMode === 'separate'
      ? { ...formData, privateKey, uploadMode: 'separate' as const }
      : { ...formData, uploadMode: 'combined' as const };

    onSubmit(submitData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>

      {hasCertificate && (
        <Alert className="border-green-500 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Ya tiene un certificado configurado. Puede actualizarlo si lo desea.
          </AlertDescription>
        </Alert>
      )}

      {/* Upload mode selector */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Certificado</CardTitle>
          <CardDescription>
            Seleccione cómo desea cargar su certificado digital
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleModeChange('combined')}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                uploadMode === 'combined'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="font-medium mb-1">Archivo combinado (.p12 / .pfx)</div>
              <div className="text-sm text-muted-foreground">
                Contiene certificado y llave privada en un solo archivo
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('separate')}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                uploadMode === 'separate'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="font-medium mb-1">Archivos separados</div>
              <div className="text-sm text-muted-foreground">
                Certificado (.crt/.cer/.pem) + Llave privada (.key/.pem)
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {uploadMode === 'combined' ? 'Archivo del Certificado' : 'Archivos del Certificado'}
            </CardTitle>
            <CardDescription>
              {uploadMode === 'combined'
                ? 'Seleccione el archivo .p12 o .pfx de su certificado digital'
                : 'Seleccione el certificado público y la llave privada'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadMode === 'combined' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="certificate">
                    Certificado (.p12 / .pfx) <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="certificate"
                      type="file"
                      accept=".p12,.pfx,application/x-pkcs12"
                      onChange={handleCombinedFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('certificate')?.click()}
                      className="w-full justify-start"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {fileName || 'Seleccionar archivo...'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certPassword">
                    Contraseña del Certificado <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="certPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="••••••••"
                      className="pr-10"
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
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="publicCert">
                    Certificado Público (.crt / .cer / .pem) <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="publicCert"
                      type="file"
                      accept=".crt,.cer,.pem,application/x-x509-ca-cert,application/x-pem-file"
                      onChange={handleCertificateFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('publicCert')?.click()}
                      className="w-full justify-start"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {fileName || 'Seleccionar certificado...'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privateKey">
                    Llave Privada (.key / .pem) <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="privateKey"
                      type="file"
                      accept=".key,.pem"
                      onChange={handlePrivateKeyFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('privateKey')?.click()}
                      className="w-full justify-start"
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      {privateKeyFileName || 'Seleccionar llave privada...'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyPassword">
                    Contraseña de la Llave (si está encriptada)
                  </Label>
                  <div className="relative">
                    <Input
                      id="keyPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="Dejar vacío si no tiene contraseña"
                      className="pr-10"
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
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Fecha de Expiración (opcional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
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

// ============================================================================
// API CREDENTIALS STEP
// ============================================================================

interface ApiCredentialsStepProps {
  type: 'test' | 'prod';
  hasCredentials?: boolean;
  onSubmit: (data: ApiCredentialsForm) => void;
  onBack: () => void;
  loading?: boolean;
}

export function ApiCredentialsStep({
  type,
  hasCredentials,
  onSubmit,
  onBack,
  loading,
}: ApiCredentialsStepProps) {
  const [formData, setFormData] = React.useState<ApiCredentialsForm>({
    apiPassword: '',
    environmentUrl: '',
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  const isTest = type === 'test';
  const title = isTest
    ? 'Credenciales API de Pruebas'
    : 'Credenciales API de Producción';
  const defaultUrl = isTest
    ? 'https://apitest.dtes.mh.gob.sv'
    : 'https://api.dtes.mh.gob.sv';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.apiPassword || formData.apiPassword.length < 8) {
      setError('La contraseña API debe tener al menos 8 caracteres');
      return;
    }

    onSubmit({
      ...formData,
      environmentUrl: formData.environmentUrl || defaultUrl,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">
            Configure las credenciales para conectarse a la API del MH
          </p>
        </div>
      </div>

      {hasCredentials && (
        <Alert className="border-green-500 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Ya tiene credenciales configuradas. Puede actualizarlas si lo desea.
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          La contraseña API es diferente a la contraseña de Servicios en Línea.
          Es proporcionada por Hacienda específicamente para la API de DTE.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Credenciales de API</CardTitle>
            <CardDescription>
              Ingrese la contraseña API proporcionada por Hacienda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiPassword">
                Contraseña API <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="apiPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.apiPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      apiPassword: e.target.value,
                    }))
                  }
                  placeholder="••••••••••••"
                  className="pr-10"
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="environmentUrl">URL del Ambiente (opcional)</Label>
              <Input
                id="environmentUrl"
                type="url"
                value={formData.environmentUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    environmentUrl: e.target.value,
                  }))
                }
                placeholder={defaultUrl}
              />
              <p className="text-xs text-muted-foreground">
                Dejar vacío para usar la URL por defecto: {defaultUrl}
              </p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
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

// ============================================================================
// WAITING STEP (Test Environment Request, Request Authorization)
// ============================================================================

interface WaitingStepProps {
  type: 'test-environment' | 'authorization';
  onProceed: () => void;
  onBack: () => void;
  loading?: boolean;
}

export function WaitingStep({
  type,
  onProceed,
  onBack,
  loading,
}: WaitingStepProps) {
  const isTestEnv = type === 'test-environment';

  const title = isTestEnv
    ? 'Solicitar Ambiente de Pruebas'
    : 'Solicitar Autorización';

  const description = isTestEnv
    ? 'Solicite acceso al ambiente de pruebas del Ministerio de Hacienda'
    : 'Envíe su solicitud de autorización como emisor de DTE';

  const Icon = isTestEnv ? FlaskConical : Send;

  const steps = isTestEnv
    ? [
        'Ingrese a Servicios en Línea del MH',
        'Navegue a "Facturación Electrónica" > "Ambiente de Pruebas"',
        'Complete el formulario de solicitud',
        'Espere la aprobación (generalmente inmediata)',
      ]
    : [
        'Complete todas las pruebas técnicas requeridas',
        'Ingrese a Servicios en Línea del MH',
        'Navegue a "Facturación Electrónica" > "Solicitud de Autorización"',
        'Adjunte la documentación requerida',
        'Espere la aprobación de Hacienda',
      ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pasos a Seguir</CardTitle>
          <CardDescription>
            Siga estos pasos en el portal del Ministerio de Hacienda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p>
              Este paso requiere que realice acciones en el portal del Ministerio
              de Hacienda.
            </p>
            <a
              href="https://portaldgii.mh.gob.sv/ssc/login"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Ir a Servicios en Línea del MH
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </AlertDescription>
      </Alert>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        <Button onClick={onProceed} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              Ya lo completé, continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// FINAL VALIDATION / COMPLETED STEP
// ============================================================================

interface CompletedStepProps {
  type: 'validation' | 'completed';
  onFinish?: () => void;
  onBack?: () => void;
  loading?: boolean;
}

export function CompletedStep({
  type,
  onFinish,
  onBack,
  loading,
}: CompletedStepProps) {
  const isValidation = type === 'validation';

  if (isValidation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Validación Final</h2>
            <p className="text-muted-foreground">
              Verifique que toda la configuración esté correcta
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Verificación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                'Datos de empresa correctos',
                'Credenciales de Hacienda configuradas',
                'Tipos de DTE seleccionados',
                'Certificado de producción cargado',
                'Credenciales API de producción configuradas',
                'Pruebas técnicas completadas',
                'Autorización aprobada por Hacienda',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <Button onClick={onFinish} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finalizando...
              </>
            ) : (
              <>
                Finalizar Proceso
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Completed
  return (
    <div className="space-y-8 text-center">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 mx-auto">
        <PartyPopper className="h-12 w-12 text-green-500" />
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
          ¡Felicitaciones!
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Ha completado exitosamente el proceso de habilitación como emisor de
          documentos tributarios electrónicos.
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Emisor autorizado por Hacienda</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Ambiente de producción configurado</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Listo para emitir DTE</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" onClick={onFinish}>
        Ir al Dashboard
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}
