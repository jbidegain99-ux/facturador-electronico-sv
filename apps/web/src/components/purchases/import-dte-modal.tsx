'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

// ── Types ────────────────────────────────────────────────────────────

interface PreviewProveedor {
  numDocumento: string;
  nombre: string;
}

interface PreviewLinea {
  descripcion: string;
  cantidad: number;
  precioUnit: number;
  ivaAplica: boolean;
}

interface PreviewTotales {
  subtotal: number;
  iva: number;
  total: number;
}

export interface DtePreviewResult {
  valid: boolean;
  proveedor: PreviewProveedor;
  lineas: PreviewLinea[];
  totales: PreviewTotales;
  warnings?: string[];
  errors?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DteFormat = 'json' | 'xml';

// ── Component ─────────────────────────────────────────────────────────

export function ImportDteModal({ open, onOpenChange }: Props) {
  const [content, setContent] = React.useState('');
  const [format, setFormat] = React.useState<DteFormat>('json');
  const [preview, setPreview] = React.useState<DtePreviewResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const toast = useToast();

  // Reset state when modal closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setContent('');
      setPreview(null);
      setLoading(false);
    }
    onOpenChange(open);
  };

  const handleParse = async () => {
    if (content.length < 10) return;
    setLoading(true);
    try {
      const result = await apiFetch<DtePreviewResult>('/received-dtes/preview', {
        method: 'POST',
        body: JSON.stringify({ content, format }),
      });

      if (!result.valid) {
        const errorList = result.errors?.join(', ') ?? 'Contenido inválido';
        toast.error(`DTE inválido: ${errorList}`);
        return;
      }

      setPreview(result);
    } catch (err: unknown) {
      const apiErr = err as { message?: string; data?: { code?: string } };
      if (apiErr?.data?.code === 'FORMAT_NOT_SUPPORTED') {
        toast.error('Formato XML no soportado aún. Por favor usa JSON.');
      } else {
        toast.error(apiErr?.message ?? 'Error al parsear el DTE');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!preview) return;
    sessionStorage.setItem('dte-import-prefill', JSON.stringify(preview));
    handleOpenChange(false);
    router.push('/compras/nueva?source=imported');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar DTE recibido</DialogTitle>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-4">
            {/* Format selector */}
            <div className="space-y-1.5">
              <Label>Formato</Label>
              <div className="flex gap-3">
                {(['json', 'xml'] as DteFormat[]).map((f) => (
                  <label
                    key={f}
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <input
                      type="radio"
                      name="format"
                      value={f}
                      checked={format === f}
                      onChange={() => setFormat(f)}
                      className="accent-primary"
                    />
                    {f.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            {/* Content textarea */}
            <div className="space-y-1.5">
              <Label>Contenido del DTE</Label>
              <Textarea
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Pega el contenido del DTE aquí (JSON o XML)..."
                className="font-mono text-xs"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleParse}
                disabled={loading || content.length < 10}
              >
                {loading ? 'Analizando...' : 'Analizar DTE'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview summary */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                    Proveedor
                  </p>
                  <p className="font-medium">{preview.proveedor.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {preview.proveedor.numDocumento}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                    Líneas
                  </p>
                  <p className="font-medium">{preview.lineas.length} líneas</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">${preview.totales.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA</span>
                  <span className="font-mono">${preview.totales.iva.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="font-mono">${preview.totales.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Lines preview */}
            {preview.lineas.length > 0 && (
              <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                {preview.lineas.map((l, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-1 border-b border-border/50 last:border-0"
                  >
                    <span className="truncate flex-1 pr-4 text-muted-foreground">
                      {l.descripcion}
                    </span>
                    <span className="text-xs text-muted-foreground mr-4 whitespace-nowrap">
                      {l.cantidad} × ${l.precioUnit.toFixed(2)}
                    </span>
                    <span className="font-mono text-xs whitespace-nowrap">
                      ${(l.cantidad * l.precioUnit).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {preview.warnings && preview.warnings.length > 0 && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-medium text-amber-800 mb-1">Advertencias:</p>
                <ul className="text-xs text-amber-700 space-y-0.5">
                  {preview.warnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setPreview(null)}>
                Cambiar contenido
              </Button>
              <Button onClick={handleConfirm}>
                Confirmar e ir al formulario
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
