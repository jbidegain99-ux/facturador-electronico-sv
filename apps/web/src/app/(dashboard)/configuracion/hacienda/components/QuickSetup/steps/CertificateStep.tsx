'use client';

import * as React from 'react';
import { FileKey2, Upload, Eye, EyeOff, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

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

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const allowedExtensions = ['.p12', '.pfx'];
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExt)) {
      setError('El archivo debe ser un certificado .p12 o .pfx');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setCertificate(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setCertificate(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!certificate) {
      setError('Debes seleccionar un archivo de certificado');
      return;
    }

    if (!password) {
      setError('Debes ingresar la contrasena del certificado');
      return;
    }

    if (password.length < 1) {
      setError('La contrasena no puede estar vacia');
      return;
    }

    onSubmit(certificate, password);
  };

  const removeCertificate = () => {
    setCertificate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Sube tu Certificado Digital</h3>
        <p className="text-muted-foreground">
          El certificado .p12 o .pfx que recibiste del Ministerio de Hacienda
        </p>
      </div>

      {/* File Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer',
          'bg-slate-900/30 border-slate-700',
          isDragging && 'border-purple-500 bg-purple-500/5',
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
          accept=".p12,.pfx"
          onChange={handleFileChange}
          className="hidden"
        />

        {certificate ? (
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-400" />
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
            <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <FileKey2 className="h-8 w-8 text-purple-400" />
            </div>
            <div className="text-center">
              <p className="font-medium">
                Arrastra tu archivo aqui o{' '}
                <span className="text-purple-400">haz clic para seleccionar</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Archivos .p12 o .pfx (max 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Password Field */}
      <Card className="bg-slate-900/50 border-white/10">
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
              Esta es la contrasena que usaste al descargar el certificado desde el portal de Hacienda
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

      {/* Info Alert */}
      <Alert className="bg-slate-800/50 border-slate-700">
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
          className="bg-purple-600 hover:bg-purple-700"
          disabled={!certificate || !password}
        >
          Continuar
        </Button>
      </div>
    </form>
  );
}
