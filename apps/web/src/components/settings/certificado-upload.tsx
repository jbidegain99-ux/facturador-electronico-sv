'use client';

import * as React from 'react';
import {
  KeyRound,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatDate } from '@/lib/utils';

interface CertificateInfo {
  filename: string;
  uploadedAt: string;
  expiresAt?: string;
  isValid: boolean;
  subject?: string;
}

interface CertificadoUploadProps {
  currentCert?: CertificateInfo;
  onUploadSuccess?: () => void;
  className?: string;
}

export function CertificadoUpload({
  currentCert,
  onUploadSuccess,
  className,
}: CertificadoUploadProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadedCert, setUploadedCert] = React.useState<CertificateInfo | undefined>(currentCert);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Check if certificate is expiring soon (within 30 days)
  const isExpiringSoon = React.useMemo(() => {
    if (!uploadedCert?.expiresAt) return false;
    const expiryDate = new Date(uploadedCert.expiresAt);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow;
  }, [uploadedCert?.expiresAt]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      if (!fileName.endsWith('.p12') && !fileName.endsWith('.pfx')) {
        if (fileName.endsWith('.cer') || fileName.endsWith('.crt') || fileName.endsWith('.pem')) {
          setError('El archivo debe ser .p12 o .pfx (contiene clave privada). Los archivos .cer, .crt o .pem no incluyen la clave privada necesaria para firmar.');
        } else {
          setError('Formato no soportado. El certificado debe ser .p12 o .pfx');
        }
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fileName = droppedFile.name.toLowerCase();
      if (!fileName.endsWith('.p12') && !fileName.endsWith('.pfx')) {
        if (fileName.endsWith('.cer') || fileName.endsWith('.crt') || fileName.endsWith('.pem')) {
          setError('El archivo debe ser .p12 o .pfx (contiene clave privada). Los archivos .cer, .crt o .pem no incluyen la clave privada necesaria para firmar.');
        } else {
          setError('Formato no soportado. El certificado debe ser .p12 o .pfx');
        }
        return;
      }
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file || !password) {
      setError('Selecciona el archivo y escribe la contrasena');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('certificate', file);
      formData.append('password', password);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tenants/me/certificate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir certificado');
      }

      const result = await response.json();
      setUploadedCert({
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        expiresAt: result.expiresAt,
        isValid: true,
        subject: result.subject,
      });
      setFile(null);
      setPassword('');
      onUploadSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir certificado');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('¿Estas seguro de eliminar el certificado? No podras emitir facturas hasta subir uno nuevo.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tenants/me/certificate`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al eliminar certificado');
      }

      setUploadedCert(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  return (
    <div className={cn('glass-card p-6', className)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <KeyRound className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Certificado Digital</h3>
          <p className="text-sm text-muted-foreground">
            Certificado .p12 para firmar facturas electronicas
          </p>
        </div>
      </div>

      {/* Current certificate info */}
      {uploadedCert && (
        <div
          className={cn(
            'mb-6 p-4 rounded-lg border',
            uploadedCert.isValid && !isExpiringSoon
              ? 'bg-green-500/10 border-green-500/30'
              : isExpiringSoon
              ? 'bg-warning/10 border-warning/30'
              : 'bg-destructive/10 border-destructive/30'
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {uploadedCert.isValid && !isExpiringSoon ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : isExpiringSoon ? (
                <AlertCircle className="w-5 h-5 text-warning" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
              <div>
                <p className="font-medium text-white">{uploadedCert.filename}</p>
                {uploadedCert.subject && (
                  <p className="text-sm text-muted-foreground">{uploadedCert.subject}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Subido</p>
              <p className="text-white">{formatDate(uploadedCert.uploadedAt)}</p>
            </div>
            {uploadedCert.expiresAt && (
              <div>
                <p className="text-muted-foreground">Expira</p>
                <p
                  className={cn(
                    isExpiringSoon ? 'text-warning' : 'text-white'
                  )}
                >
                  {formatDate(uploadedCert.expiresAt)}
                  {isExpiringSoon && ' (pronto)'}
                </p>
              </div>
            )}
          </div>

          {isExpiringSoon && (
            <div className="mt-3 flex items-center gap-2 text-sm text-warning">
              <Calendar className="w-4 h-4" />
              <span>Tu certificado expirara pronto. Considera renovarlo.</span>
            </div>
          )}
        </div>
      )}

      {/* Upload section */}
      {!uploadedCert && (
        <>
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all mb-4',
              file
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50 hover:bg-white/5'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".p12,.pfx,.cer,.crt,.pem,application/x-pkcs12"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <>
                <KeyRound className="w-10 h-10 text-primary mx-auto mb-3" />
                <p className="font-medium text-white">{file.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click para cambiar archivo
                </p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-white">
                  Arrastra tu archivo .p12 o .pfx aqui
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  o haz click para seleccionar (formatos: .p12, .pfx)
                </p>
              </>
            )}
          </div>

          {/* Password input */}
          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium text-muted-foreground">
              Contrasena del certificado
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contrasena"
                className="input-rc pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive mb-4">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload button */}
          <Button
            onClick={handleUpload}
            disabled={!file || !password || isUploading}
            className="w-full btn-primary"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validando y subiendo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Subir Certificado
              </>
            )}
          </Button>
        </>
      )}

      {/* Replace certificate */}
      {uploadedCert && (
        <div className="pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => setUploadedCert(undefined)}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reemplazar certificado
          </Button>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        El certificado se usa para firmar digitalmente tus facturas.
        <br />
        Puedes obtenerlo en{' '}
        <a
          href="https://portaldgii.mh.gob.sv"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          portaldgii.mh.gob.sv
        </a>
      </p>
    </div>
  );
}
