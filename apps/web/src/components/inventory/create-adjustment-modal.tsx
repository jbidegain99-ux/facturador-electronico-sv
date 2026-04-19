'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { apiFetch } from '@/lib/api';
import {
  ADJUSTMENT_SUBTYPES,
  ADJUSTMENT_SUBTYPE_LABELS,
  type AdjustmentSubtype,
  type CreateAdjustmentInput,
  type InventoryAdjustment,
  type InventoryItemDetail,
} from '@/types/inventory';

interface Props {
  open: boolean;
  onClose: () => void;
  catalogItemId?: string;
  onSuccess: () => void;
}

function firstDayOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CreateAdjustmentModal({ open, onClose, catalogItemId, onSuccess }: Props) {
  const toast = useToast();
  const [itemDetail, setItemDetail] = React.useState<InventoryItemDetail | null>(null);
  const [subtype, setSubtype] = React.useState<AdjustmentSubtype>('MERMA');
  const [quantity, setQuantity] = React.useState<string>('');
  const [unitCost, setUnitCost] = React.useState<string>('');
  const [movementDate, setMovementDate] = React.useState(today());
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const isEntrada = subtype === 'AJUSTE_SOBRANTE';

  React.useEffect(() => {
    if (open) {
      setItemDetail(null);
      setSubtype('MERMA');
      setQuantity('');
      setUnitCost('');
      setMovementDate(today());
      setNotes('');
    }
  }, [open]);

  React.useEffect(() => {
    if (!catalogItemId || !open) {
      setItemDetail(null);
      return;
    }
    (async () => {
      try {
        const result = await apiFetch<InventoryItemDetail>(`/inventory/${catalogItemId}`);
        setItemDetail(result);
        if (!isEntrada) setUnitCost(result.currentAvgCost.toFixed(4));
      } catch {
        setItemDetail(null);
      }
    })();
  }, [catalogItemId, open, isEntrada]);

  React.useEffect(() => {
    if (!isEntrada && itemDetail) {
      setUnitCost(itemDetail.currentAvgCost.toFixed(4));
    } else if (isEntrada) {
      setUnitCost('');
    }
  }, [subtype, itemDetail, isEntrada]);

  const totalCost = React.useMemo(() => {
    const q = parseFloat(quantity) || 0;
    const c = parseFloat(unitCost) || 0;
    return q * c;
  }, [quantity, unitCost]);

  const canSubmit = Boolean(
    catalogItemId &&
    quantity && parseFloat(quantity) > 0 &&
    (!isEntrada || (unitCost && parseFloat(unitCost) > 0)) &&
    movementDate &&
    !submitting,
  );

  const handleSubmit = async () => {
    if (!catalogItemId) return;
    setSubmitting(true);
    try {
      const payload: CreateAdjustmentInput = {
        catalogItemId,
        subtype,
        quantity: parseFloat(quantity),
        movementDate,
        notes: notes || undefined,
      };
      if (isEntrada) payload.unitCost = parseFloat(unitCost);

      await apiFetch<InventoryAdjustment>('/inventory/adjustments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success('Ajuste registrado');
      onSuccess();
      onClose();
    } catch (e) {
      const err = e as { status?: number; data?: { code?: string; message?: string; available?: number } };
      if (err.data?.code === 'INSUFFICIENT_STOCK') {
        toast.error(`Stock insuficiente. Máximo: ${err.data.available ?? 0}`);
      } else if (err.data?.code === 'NOT_TRACKED') {
        toast.error('El ítem no tiene inventario activado');
      } else if (err.data?.code === 'FUTURE_DATE' || err.data?.code === 'DATE_BEFORE_MONTH_START') {
        toast.error('Fecha inválida');
      } else if (err.data?.code === 'MISSING_UNIT_COST') {
        toast.error('Costo unitario requerido');
      } else {
        toast.error('Error creando ajuste');
      }
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo ajuste de inventario</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {itemDetail && (
            <div className="rounded-md border p-3 text-sm">
              <p className="font-mono text-xs text-gray-500">{itemDetail.code}</p>
              <p className="font-medium">{itemDetail.description ?? '—'}</p>
              <p className="text-xs text-gray-600 mt-1">
                Stock: <strong>{itemDetail.currentQty.toFixed(4)}</strong> ·
                Costo prom.: <strong>${itemDetail.currentAvgCost.toFixed(4)}</strong>
              </p>
            </div>
          )}

          <div>
            <Label>Tipo de ajuste</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {ADJUSTMENT_SUBTYPES.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="subtype"
                    value={s}
                    checked={subtype === s}
                    onChange={() => setSubtype(s)}
                  />
                  {ADJUSTMENT_SUBTYPE_LABELS[s]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              id="quantity"
              type="number"
              step="0.0001"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.0000"
            />
          </div>

          <div>
            <Label htmlFor="unitCost">Costo unitario</Label>
            <Input
              id="unitCost"
              type="number"
              step="0.0001"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              disabled={!isEntrada}
              placeholder={isEntrada ? 'Ingresá el costo' : 'Costo promedio actual'}
            />
            {!isEntrada && (
              <p className="text-xs text-gray-500 mt-1">Salidas usan el costo promedio actual</p>
            )}
          </div>

          <div>
            <Label htmlFor="movementDate">Fecha</Label>
            <Input
              id="movementDate"
              type="date"
              min={firstDayOfMonth()}
              max={today()}
              value={movementDate}
              onChange={(e) => setMovementDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Nota (opcional)</Label>
            <Textarea
              id="notes"
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {quantity && unitCost && parseFloat(quantity) > 0 && (
            <div className="rounded-md bg-gray-50 p-3 text-xs">
              <p className="text-gray-600">
                Costo total: <strong>${totalCost.toFixed(2)}</strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Guardando…' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
