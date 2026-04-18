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
import { CuentaSearch } from './cuenta-search';
import type { AccountingAccount } from './nueva-cuenta-modal';
import type { Purchase } from '@/types/purchase';

// ── Types ─────────────────────────────────────────────────────────────

interface PagoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: Purchase;
  onPaid: (p: Purchase) => void;
}

interface PagoFormState {
  fechaPago: string;
  cuentaSalidaId: string;
  monto: string;
  referencia: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(v: number | string | unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v) || 0;
  return 0;
}

// ── Component ─────────────────────────────────────────────────────────

export function PagoModal({ open, onOpenChange, purchase, onPaid }: PagoModalProps) {
  const toast = useToast();

  const saldoPendiente = toNumber(purchase.saldoPendiente);

  const [form, setForm] = React.useState<PagoFormState>({
    fechaPago: todayIso(),
    cuentaSalidaId: '',
    monto: saldoPendiente.toFixed(2),
    referencia: '',
  });
  const [selectedCuenta, setSelectedCuenta] = React.useState<AccountingAccount | null>(null);
  const [errors, setErrors] = React.useState<Partial<Record<keyof PagoFormState, string>>>({});
  const [loading, setLoading] = React.useState(false);

  // Reset when modal opens
  React.useEffect(() => {
    if (open) {
      setForm({
        fechaPago: todayIso(),
        cuentaSalidaId: '',
        monto: toNumber(purchase.saldoPendiente).toFixed(2),
        referencia: '',
      });
      setSelectedCuenta(null);
      setErrors({});
    }
  }, [open, purchase.saldoPendiente]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PagoFormState, string>> = {};

    if (!form.cuentaSalidaId) {
      newErrors.cuentaSalidaId = 'Selecciona una cuenta de salida';
    }

    const monto = parseFloat(form.monto);
    if (isNaN(monto) || monto <= 0) {
      newErrors.monto = 'El monto debe ser mayor a 0';
    } else if (monto > saldoPendiente + 0.001) {
      newErrors.monto = `El monto no puede superar el saldo pendiente ($${saldoPendiente.toFixed(2)})`;
    }

    if (!form.fechaPago) {
      newErrors.fechaPago = 'La fecha de pago es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCuentaSelect = (cuenta: AccountingAccount) => {
    setSelectedCuenta(cuenta);
    setForm((prev) => ({ ...prev, cuentaSalidaId: cuenta.id }));
    setErrors((prev) => ({ ...prev, cuentaSalidaId: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        fechaPago: form.fechaPago,
        cuentaSalidaId: form.cuentaSalidaId,
        monto: parseFloat(form.monto),
      };
      if (form.referencia.trim()) {
        body.referencia = form.referencia.trim();
      }

      const updated = await apiFetch<Purchase>(`/purchases/${purchase.id}/pay`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      toast.success('Pago registrado exitosamente');
      onOpenChange(false);
      onPaid(updated);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message ?? 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Fecha de pago */}
          <div className="space-y-1.5">
            <Label htmlFor="fechaPago">Fecha de pago</Label>
            <Input
              id="fechaPago"
              type="date"
              value={form.fechaPago}
              onChange={(e) => setForm((prev) => ({ ...prev, fechaPago: e.target.value }))}
            />
            {errors.fechaPago && (
              <p className="text-xs text-destructive">{errors.fechaPago}</p>
            )}
          </div>

          {/* Cuenta de salida */}
          <div className="space-y-1.5">
            <Label>Cuenta caja/banco</Label>
            <CuentaSearch
              onSelect={handleCuentaSelect}
              selected={selectedCuenta?.id}
              placeholder="Cuenta caja/banco"
            />
            {errors.cuentaSalidaId && (
              <p className="text-xs text-destructive">{errors.cuentaSalidaId}</p>
            )}
          </div>

          {/* Monto */}
          <div className="space-y-1.5">
            <Label htmlFor="monto">
              Monto{' '}
              <span className="text-muted-foreground font-normal text-xs">
                (saldo pendiente: ${saldoPendiente.toFixed(2)})
              </span>
            </Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0.01"
              max={saldoPendiente}
              value={form.monto}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, monto: e.target.value }));
                setErrors((prev) => ({ ...prev, monto: undefined }));
              }}
            />
            {errors.monto && (
              <p className="text-xs text-destructive">{errors.monto}</p>
            )}
          </div>

          {/* Referencia */}
          <div className="space-y-1.5">
            <Label htmlFor="referencia">
              Referencia{' '}
              <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
            </Label>
            <Input
              id="referencia"
              type="text"
              placeholder="Número de transferencia, cheque, etc."
              value={form.referencia}
              onChange={(e) => setForm((prev) => ({ ...prev, referencia: e.target.value }))}
            />
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
              Registrar pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
