'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  ArrowRight, ArrowLeft, Loader2, Upload, ShieldCheck, KeyRound,
  CheckCircle2, Eye, EyeOff, AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { CertificateForm } from '@/types/onboarding';

type CertificateUploadMode = 'combined' | 'separate';

interface CertificateStepProps {
  type: 'test' | 'prod';
  hasCertificate?: boolean;
  savedCertExpiry?: string;
  onSubmit: (data: CertificateForm) => void;
  onBack: () => void;
  loading?: boolean;
}

export function CertificateStep({
  type, hasCertificate, savedCertExpiry, onSubmit, onBack, loading,
}: CertificateStepProps) {
  const [uploadMode, setUploadMode] = React.useState<CertificateUploadMode>('combined');
  const [formData, setFormData] = React.useState<CertificateForm>({
    certificate: '', password: '',
    expiryDate: savedCertExpiry ? new Date(savedCertExpiry).toISOString().split('T')[0] : '',
  });
  const [privateKey, setPrivateKey] = React.useState<string>('');
  const [privateKeyFileName, setPrivateKeyFileName] = React.useState<string>('');
  const [fileName, setFileName] = React.useState<string>('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    if (hasCertificate) { setFileName(''); setError(''); }
    if (savedCertExpiry) setFormData(prev => ({ ...prev, expiryDate: new Date(savedCertExpiry).toISOString().split('T')[0] }));
  }, [hasCertificate, savedCertExpiry]);

  const isTest = type === 'test';
  const title = isTest ? 'Certificado de Pruebas' : 'Certificado de Produccion';
  const description = isTest ? 'Suba su certificado digital para el ambiente de pruebas' : 'Suba su certificado digital para el ambiente de produccion';

  const handleCombinedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.name.toLowerCase().endsWith('.p12') && !file.name.toLowerCase().endsWith('.pfx')) { setError('Para el modo combinado, el archivo debe ser .p12 o .pfx'); return; }
    setFileName(file.name); setError('');
    const reader = new FileReader();
    reader.onload = () => setFormData(prev => ({ ...prev, certificate: (reader.result as string).split(',')[1] }));
    reader.readAsDataURL(file);
  };

  const handleCertificateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!['.crt', '.cer', '.pem'].some(ext => file.name.toLowerCase().endsWith(ext))) { setError('El certificado debe ser .crt, .cer o .pem'); return; }
    setFileName(file.name); setError('');
    const reader = new FileReader();
    reader.onload = () => setFormData(prev => ({ ...prev, certificate: (reader.result as string).split(',')[1] }));
    reader.readAsDataURL(file);
  };

  const handlePrivateKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!['.key', '.pem'].some(ext => file.name.toLowerCase().endsWith(ext))) { setError('La llave privada debe ser .key o .pem'); return; }
    setPrivateKeyFileName(file.name); setError('');
    const reader = new FileReader();
    reader.onload = () => setPrivateKey((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  };

  const handleModeChange = (mode: CertificateUploadMode) => {
    setUploadMode(mode);
    setFormData({ certificate: '', password: '', expiryDate: '' });
    setPrivateKey(''); setFileName(''); setPrivateKeyFileName(''); setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasCertificate && !formData.certificate) { onSubmit({ certificate: '', password: '', skipUpload: true }); return; }
    if (!formData.certificate) { setError('Debe seleccionar un archivo de certificado'); return; }
    if (uploadMode === 'combined' && !formData.password) { setError('Debe ingresar la contrasena del certificado'); return; }
    if (uploadMode === 'separate' && !privateKey) { setError('Debe seleccionar el archivo de llave privada'); return; }
    const submitData = uploadMode === 'separate' ? { ...formData, privateKey, uploadMode: 'separate' as const } : { ...formData, uploadMode: 'combined' as const };
    onSubmit(submitData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10"><ShieldCheck className="h-6 w-6 text-primary" /></div>
        <div><h2 className="text-2xl font-bold">{title}</h2><p className="text-muted-foreground">{description}</p></div>
      </div>

      {hasCertificate && (
        <Card className="border-green-500 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-700 dark:text-green-400">Certificado configurado correctamente</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Su certificado digital ya esta guardado en el sistema.
                  {formData.expiryDate && <> Expira: <strong>{formData.expiryDate}</strong>.</>}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Puede continuar al siguiente paso o subir un nuevo certificado para reemplazarlo.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{hasCertificate ? 'Reemplazar Certificado (opcional)' : 'Tipo de Certificado'}</CardTitle>
          <CardDescription>{hasCertificate ? 'Solo necesita subir un nuevo archivo si desea reemplazar el certificado actual' : 'Seleccione como desea cargar su certificado digital'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button type="button" onClick={() => handleModeChange('combined')} className={`p-4 rounded-lg border-2 text-left transition-all ${uploadMode === 'combined' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <div className="font-medium mb-1">Archivo combinado (.p12 / .pfx)</div>
              <div className="text-sm text-muted-foreground">Contiene certificado y llave privada en un solo archivo</div>
            </button>
            <button type="button" onClick={() => handleModeChange('separate')} className={`p-4 rounded-lg border-2 text-left transition-all ${uploadMode === 'separate' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <div className="font-medium mb-1">Archivos separados</div>
              <div className="text-sm text-muted-foreground">Certificado (.crt/.cer/.pem) + Llave privada (.key/.pem)</div>
            </button>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{uploadMode === 'combined' ? 'Archivo del Certificado' : 'Archivos del Certificado'}</CardTitle>
            <CardDescription>{hasCertificate ? 'Seleccione un nuevo archivo solo si desea reemplazar el certificado actual' : uploadMode === 'combined' ? 'Seleccione el archivo .p12 o .pfx de su certificado digital' : 'Seleccione el certificado publico y la llave privada'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadMode === 'combined' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="certificate">Certificado (.p12 / .pfx) {!hasCertificate && <span className="text-red-500">*</span>}</Label>
                  <div className="flex items-center gap-2">
                    <Input id="certificate" type="file" accept=".p12,.pfx,application/x-pkcs12" onChange={handleCombinedFileChange} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('certificate')?.click()} className={`w-full justify-start ${hasCertificate && !fileName ? 'border-dashed' : ''}`}>
                      {fileName ? <><Upload className="mr-2 h-4 w-4" />{fileName}</> : hasCertificate ? <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />Certificado guardado - clic para reemplazar</> : <><Upload className="mr-2 h-4 w-4" />Seleccionar archivo...</>}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certPassword">Contrasena del Certificado {!hasCertificate && <span className="text-red-500">*</span>}</Label>
                  <div className="relative">
                    <Input id="certPassword" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder={hasCertificate ? 'Contrasena guardada - dejar vacio para mantener' : ''} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="publicCert">Certificado Publico (.crt / .cer / .pem) {!hasCertificate && <span className="text-red-500">*</span>}</Label>
                  <div className="flex items-center gap-2">
                    <Input id="publicCert" type="file" accept=".crt,.cer,.pem,application/x-x509-ca-cert,application/x-pem-file" onChange={handleCertificateFileChange} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('publicCert')?.click()} className={`w-full justify-start ${hasCertificate && !fileName ? 'border-dashed' : ''}`}>
                      {fileName ? <><Upload className="mr-2 h-4 w-4" />{fileName}</> : hasCertificate ? <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />Certificado guardado - clic para reemplazar</> : <><Upload className="mr-2 h-4 w-4" />Seleccionar certificado...</>}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="privateKey">Llave Privada (.key / .pem) {!hasCertificate && <span className="text-red-500">*</span>}</Label>
                  <div className="flex items-center gap-2">
                    <Input id="privateKey" type="file" accept=".key,.pem" onChange={handlePrivateKeyFileChange} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('privateKey')?.click()} className={`w-full justify-start ${hasCertificate && !privateKeyFileName ? 'border-dashed' : ''}`}>
                      {privateKeyFileName ? <><KeyRound className="mr-2 h-4 w-4" />{privateKeyFileName}</> : hasCertificate ? <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />Llave guardada - clic para reemplazar</> : <><KeyRound className="mr-2 h-4 w-4" />Seleccionar llave privada...</>}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyPassword">Contrasena de la Llave (si esta encriptada)</Label>
                  <div className="relative">
                    <Input id="keyPassword" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder={hasCertificate ? 'Dejar vacio para mantener la actual' : 'Dejar vacio si no tiene contrasena'} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Fecha de Expiracion (opcional)</Label>
              <Input id="expiryDate" type="date" value={formData.expiryDate} onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Anterior</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Subiendo...</> : <>{hasCertificate && !formData.certificate ? 'Continuar sin cambios' : 'Continuar'}<ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </div>
      </form>
    </div>
  );
}
