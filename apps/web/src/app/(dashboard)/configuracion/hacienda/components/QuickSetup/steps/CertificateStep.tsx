'use client';

import * as React from 'react';
import { FileKey2, Upload, Eye, EyeOff, CheckCircle, AlertCircle, X, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface CertificateDetection {
  type: 'MH_XML' | 'PKCS12' | 'PEM' | 'DER';
  requiresPassword: boolean;
  preview: {
    nit: string | null;
    organizationName: string;
    validTo: string;
  } | null;
}

interface CertificateStepProps {
  certificate: File | null;
  certificatePassword: string;
  onSubmit: (certificate: File, password: string) => void;
  onBack: () => void;
}

export function CertificateStep({
  certificate: initialCertificate,
  certificatePassword: initialPassword,
  onSubmit,
  onBack,
}: CertificateStepProps) {
  const [certificate, setCertificate] = React.useState<File | null>(initialCertificate);
  const [password, setPassword] = React.useState(initialPassword);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [detection, setDetection] = React.useState<CertificateDetection | null>(null);
  const [detecting, setDetecting] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const allowedExtensions = ['.p12', '.pfx', '.crt', '.cer', '.pem', '.xml'];
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExt)) {
      setError('El archivo debe ser un certificado .p12, .pfx, .crt, .cer, .pem o .xml');
      return false;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('El archivo no puede exceder 5MB');
      return false;
    }

    setError(null);
    return true;
  };

  const detectType = React.useCallback(async (file: File) => {
    setDetecting(true);
    setDetection(null);
    try {
      const formData = new FormData();
      formData.append('certificate', file);

      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/hacienda/certificates/detect-type`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (res.ok) {
        const data: CertificateDetection = await res.json();
        setDetection(data);
        // If no password required, clear password
        if (!data.requiresPassword) {
          setPassword('');
        }
      }
    } catch {
      // Detection failed - default to requiring password
    } finally {
      setDetecting(false);
    }
  }, []);

  const handleFileSelected = React.useCallback(
    (file: File) => {
      if (validateFile(file)) {
        setCertificate(file);
        detectType(file);
      }
    },
    [detectType],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const requiresPassword = detection ? detection.requiresPassword : true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!certificate) {
      setError('Debes seleccionar un archivo de certificado');
      return;
    }

    if (requiresPassword && !password) {
      setError('Debes ingresar la contrasena del certificado');
      return;
    }

    onSubmit(certificate, requiresPassword ? password : '');
  };

  const removeCertificate = () => {
    setCertificate(null);
    setDetection(null);
    setPassword('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isReady = certificate && (!requiresPassword || password.length > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Sube tu Certificado Digital</h3>
        <p className="text-muted-foreground">
          El certificado que recibiste del Ministerio de Hacienda (.p12, .pfx, .crt, .cer, .pem o .xml)
        </p>
      </div>

      {/* File Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer',
          'bg-muted/30 border-border',
          isDragging && 'border-primary bg-primary/5',
          certificate && 'border-green-500/50 bg-green-500/5'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".p12,.pfx,.crt,.cer,.pem,.xml"
          onChange={handleFileChange}
          className="hidden"
        />

        {certificate ? (
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              {detecting ? (
                <Loader2 className="h-6 w-6 text-green-400 animate-spin" />
              ) : (
                <CheckCircle className="h-6 w-6 text-green-400" />
              )}
            </div>
            <div className="text-left">
              <p className="font-medium text-green-400">{certificate.name}</p>
              <p className="text-sm text-muted-foreground">
                {(certificate.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-4"
              onClick={(e) => {
                e.stopPropagation();
                removeCertificate();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileKey2 className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium">
                Arrastra tu archivo aqui o{' '}
                <span className="text-primary">haz clic para seleccionar</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Archivos .p12, .pfx, .crt, .cer, .pem o .xml (max 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MH XML Detection Banner */}
      {detection && !detection.requiresPassword && (
        <Alert className="bg-green-500/10 border-green-500/30">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          <AlertDescription>
            <strong className="text-green-400">Certificado XML del MH detectado</strong>
            {' '}&mdash; no requiere contrasena.
            {detection.preview && (
              <span className="block text-sm text-muted-foreground mt-1">
                NIT: {detection.preview.nit || 'N/A'}
                {' | '}
                {detection.preview.organizationName}
                {detection.preview.validTo && (
                  <>
                    {' | Valido hasta: '}
                    {new Date(detection.preview.validTo).toLocaleDateString()}
                  </>
                )}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Password Field - only shown when required */}
      {requiresPassword && certificate && !detecting && (
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label htmlFor="certificatePassword">Contrasena del Certificado</Label>
              <div className="relative">
                <Input
                  id="certificatePassword"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa la contrasena de tu certificado"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Esta es la contrasena que usaste al descargar el certificado desde el portal de Hacienda
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert className="bg-muted/50 border-border">
        <FileKey2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Tu certificado sera almacenado de forma segura y encriptada.
          La contrasena nunca se guarda en texto plano.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          Atras
        </Button>
        <Button
          type="submit"
          disabled={!isReady || detecting}
        >
          Continuar
        </Button>
      </div>
    </form>
  );
}
