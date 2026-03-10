'use client';

import * as React from 'react';
import {
  Image,
  Upload,
  Loader2,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LogoUploadProps {
  currentLogoUrl?: string | null;
  onUploadSuccess?: (logoUrl: string) => void;
  onDeleteSuccess?: () => void;
  className?: string;
}

export function LogoUpload({
  currentLogoUrl,
  onUploadSuccess,
  onDeleteSuccess,
  className,
}: LogoUploadProps) {
  const [logoUrl, setLogoUrl] = React.useState<string | null>(currentLogoUrl ?? null);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setLogoUrl(currentLogoUrl ?? null);
  }, [currentLogoUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Solo archivos PNG, JPG, WebP o SVG');
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      setError('El archivo no debe exceder 2MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(droppedFile);
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tenants/me/logo`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          throw new Error('Esta funcion requiere plan Professional o superior');
        }
        throw new Error(errorData.message || 'Error al subir logo');
      }

      const result = await response.json();
      setLogoUrl(result.logoUrl);
      setFile(null);
      setPreview(null);
      setSuccess('Logo subido exitosamente');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadSuccess?.(result.logoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estas seguro de eliminar el logo?')) return;

    setIsUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tenants/me/logo`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al eliminar logo');
      }

      setLogoUrl(null);
      setPreview(null);
      setFile(null);
      setSuccess('Logo eliminado');
      onDeleteSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn('glass-card p-6', className)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Image className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Logo Empresarial</h3>
          <p className="text-sm text-muted-foreground">
            Tu logo aparecera en las facturas PDF
          </p>
        </div>
      </div>

      {/* Current logo display */}
      {logoUrl && !preview && (
        <div className="mb-6 p-4 rounded-lg border bg-green-500/10 border-green-500/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="font-medium">Logo configurado</p>
                <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded border inline-block">
                  <img
                    src={logoUrl}
                    alt="Logo actual"
                    className="max-w-[200px] max-h-[80px] object-contain"
                  />
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isUploading}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Preview of new file */}
      {preview && (
        <div className="mb-6 p-4 rounded-lg border border-primary/30 bg-primary/5">
          <p className="text-sm font-medium text-muted-foreground mb-2">Vista previa</p>
          <div className="p-3 bg-white dark:bg-gray-900 rounded border inline-block">
            <img
              src={preview}
              alt="Preview"
              className="max-w-[200px] max-h-[80px] object-contain"
            />
          </div>
        </div>
      )}

      {/* Upload area */}
      {!logoUrl && !preview && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all mb-4 border-border hover:border-primary/50 hover:bg-white/5"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">
            Arrastra tu logo aqui
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            o haz click para seleccionar (PNG, JPG, WebP, SVG - max 2MB)
          </p>
        </div>
      )}

      {/* Hidden file input for change */}
      {(logoUrl || preview) && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFileChange}
          className="hidden"
        />
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive mb-4">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Action buttons */}
      {preview && (
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex-1 btn-primary"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Guardar Logo
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setFile(null);
              setPreview(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            disabled={isUploading}
          >
            Cancelar
          </Button>
        </div>
      )}

      {/* Change button when logo exists */}
      {logoUrl && !preview && (
        <div className="pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Cambiar logo
          </Button>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        Recomendamos PNG con fondo transparente. Se escala a 120x50px en facturas.
        <br />
        Disponible en plan Professional y superior.
      </p>
    </div>
  );
}
