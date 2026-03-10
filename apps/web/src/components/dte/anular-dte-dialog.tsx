'use client';

import * as React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnularDteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
  dteNumeroControl: string;
  dteEstado: string;
  isLoading?: boolean;
}

export function AnularDteDialog({
  open,
  onClose,
  onConfirm,
  dteNumeroControl,
  dteEstado,
  isLoading = false,
}: AnularDteDialogProps) {
  const [motivo, setMotivo] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const requiresMH = dteEstado === 'PROCESADO';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (motivo.trim().length < 10) {
      setError('El motivo debe tener al menos 10 caracteres');
      return;
    }

    try {
      await onConfirm(motivo.trim());
      setMotivo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al anular');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Anular Documento</h3>
            <p className="text-sm text-muted-foreground">{dteNumeroControl}</p>
          </div>
        </div>

        {requiresMH && (
          <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Este documento ya fue procesado por Hacienda. La anulacion sera transmitida al Ministerio de Hacienda.
            </p>
          </div>
        )}

        {!requiresMH && (
          <div className="mb-4 rounded-md border border-blue-500/30 bg-blue-500/10 p-3">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Este documento no ha sido transmitido a Hacienda. Se cancelara localmente.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-1">
            Motivo de anulacion <span className="text-destructive">*</span>
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ingrese el motivo de anulacion (minimo 10 caracteres)"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">{motivo.length}/500 caracteres</p>

          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={isLoading || motivo.trim().length < 10}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anulando...
                </>
              ) : (
                'Confirmar Anulacion'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
