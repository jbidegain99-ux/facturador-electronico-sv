'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import type { Purchase } from '@/types/purchase';

// ── Types ─────────────────────────────────────────────────────────────

interface RecepcionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: Purchase;
  onReceived: (p: Purchase) => void;
}

interface Sucursal {
  id: string;
  nombre: string;
  codigo: string;
}

interface LineaRecepcion {
  lineaId: string;
  descripcion: string;
  cantidadOrdenada: number;
  cantidadRecibida: string;
  sucursalId: string;
  observaciones: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Component ─────────────────────────────────────────────────────────

export function RecepcionModal({
  open,
  onOpenChange,
  purchase,
  onReceived,
}: RecepcionModalProps) {
  const toast = useToast();

  const bienLineas = React.useMemo(
    () => purchase.lineas.filter((l) => l.tipo === 'bien'),
    [purchase.lineas]
  );

  const [fechaRecepcion, setFechaRecepcion] = React.useState(todayIso());
  const [lineas, setLineas] = React.useState<LineaRecepcion[]>([]);
  const [sucursales, setSucursales] = React.useState<Sucursal[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingSucursales, setLoadingSucursales] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Initialize lineas when modal opens
  React.useEffect(() => {
    if (open) {
      setFechaRecepcion(todayIso());
      setLineas(
        bienLineas.map((l) => ({
          lineaId: l.id ?? '',
          descripcion: l.descripcion,
          cantidadOrdenada: l.cantidad ?? 1,
          cantidadRecibida: String(l.cantidad ?? 1),
          sucursalId: '',
          observaciones: '',
        }))
      );
      setErrors({});
    }
  }, [open, bienLineas]);

  // Load sucursales on mount
  React.useEffect(() => {
    if (!open) return;
    setLoadingSucursales(true);
    apiFetch<Sucursal[]>('/inventory/sucursales')
      .then((data) => setSucursales(Array.isArray(data) ? data : []))
      .catch(() => setSucursales([]))
      .finally(() => setLoadingSucursales(false));
  }, [open]);

  const updateLinea = (index: number, field: keyof LineaRecepcion, value: string) => {
    setLineas((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`${index}-${field}`];
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fechaRecepcion) {
      newErrors.fechaRecepcion = 'La fecha de recepción es obligatoria';
    }

    lineas.forEach((l, i) => {
      const qty = parseFloat(l.cantidadRecibida);
      if (isNaN(qty) || qty <= 0) {
        newErrors[`${i}-cantidadRecibida`] = 'Cantidad debe ser mayor a 0';
      } else if (qty > l.cantidadOrdenada) {
        newErrors[`${i}-cantidadRecibida`] = `No puede superar la cantidad ordenada (${l.cantidadOrdenada})`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const body = {
        fechaRecepcion,
        lineas: lineas.map((l) => {
          const entry: Record<string, unknown> = {
            lineaId: l.lineaId,
            cantidadRecibida: parseFloat(l.cantidadRecibida),
          };
          if (l.sucursalId) entry.sucursalId = l.sucursalId;
          if (l.observaciones.trim()) entry.observaciones = l.observaciones.trim();
          return entry;
        }),
      };

      const updated = await apiFetch<Purchase>(`/purchases/${purchase.id}/receive`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      toast.success('Recepción registrada exitosamente');
      onOpenChange(false);
      onReceived(updated);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message ?? 'Error al registrar la recepción');
    } finally {
      setLoading(false);
    }
  };

  if (bienLineas.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar recepción</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Esta compra no contiene líneas de tipo &quot;bien&quot;. Solo se reciben bienes físicos.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar recepción de mercancía</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* Fecha de recepción */}
          <div className="space-y-1.5">
            <Label htmlFor="fechaRecepcion">Fecha de recepción</Label>
            <Input
              id="fechaRecepcion"
              type="date"
              value={fechaRecepcion}
              onChange={(e) => {
                setFechaRecepcion(e.target.value);
                setErrors((prev) => { const n = { ...prev }; delete n.fechaRecepcion; return n; });
              }}
            />
            {errors.fechaRecepcion && (
              <p className="text-xs text-destructive">{errors.fechaRecepcion}</p>
            )}
          </div>

          {/* Lines */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Líneas de bienes</h3>

            {lineas.map((linea, index) => (
              <div
                key={linea.lineaId || index}
                className="border border-border rounded-lg p-4 space-y-3"
              >
                <p className="text-sm font-medium truncate">{linea.descripcion}</p>
                <p className="text-xs text-muted-foreground">
                  Cantidad ordenada: {linea.cantidadOrdenada}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Cantidad recibida */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`qty-${index}`}>Cantidad recibida</Label>
                    <Input
                      id={`qty-${index}`}
                      type="number"
                      step="0.001"
                      min="0.001"
                      max={linea.cantidadOrdenada}
                      value={linea.cantidadRecibida}
                      onChange={(e) => updateLinea(index, 'cantidadRecibida', e.target.value)}
                    />
                    {errors[`${index}-cantidadRecibida`] && (
                      <p className="text-xs text-destructive">
                        {errors[`${index}-cantidadRecibida`]}
                      </p>
                    )}
                  </div>

                  {/* Sucursal */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`suc-${index}`}>
                      Sucursal{' '}
                      <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
                    </Label>
                    {loadingSucursales ? (
                      <div className="flex items-center gap-2 h-10 px-3 border border-input rounded-md text-sm text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Cargando...
                      </div>
                    ) : sucursales.length > 0 ? (
                      <select
                        id={`suc-${index}`}
                        value={linea.sucursalId}
                        onChange={(e) => updateLinea(index, 'sucursalId', e.target.value)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="">Sin sucursal específica</option>
                        {sucursales.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.codigo} — {s.nombre}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={`suc-${index}`}
                        type="text"
                        placeholder="ID de sucursal (opcional)"
                        value={linea.sucursalId}
                        onChange={(e) => updateLinea(index, 'sucursalId', e.target.value)}
                      />
                    )}
                  </div>
                </div>

                {/* Observaciones */}
                <div className="space-y-1.5">
                  <Label htmlFor={`obs-${index}`}>
                    Observaciones{' '}
                    <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
                  </Label>
                  <Input
                    id={`obs-${index}`}
                    type="text"
                    placeholder="Notas sobre la recepción de este ítem..."
                    value={linea.observaciones}
                    onChange={(e) => updateLinea(index, 'observaciones', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar recepción
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
