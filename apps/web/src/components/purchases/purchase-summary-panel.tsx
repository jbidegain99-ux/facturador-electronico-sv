'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CuentaSearch } from './cuenta-search';
import type { PurchaseLine, Proveedor, FormaPago } from '@/types/purchase';

interface Props {
  lineas: PurchaseLine[];
  proveedor?: Proveedor;
  ivaRetenidoOverride: boolean | null; // null = auto from proveedor
  onIvaRetenidoChange: (v: boolean | null) => void;
  isrRetenidoPct: number | null; // null = auto from proveedor
  onIsrChange: (v: number | null) => void;
  formaPago: FormaPago;
  onFormaPagoChange: (v: FormaPago) => void;
  cuentaPagoId?: string;
  onCuentaPagoChange: (id: string) => void;
  fechaPago?: string;
  onFechaPagoChange: (v: string) => void;
  fechaVencimiento?: string;
  onFechaVencimientoChange: (v: string) => void;
  onSaveDraft: () => void;
  onPost: () => void;
  saving: boolean;
}

function Row({ label, value, negative = false }: { label: string; value: number; negative?: boolean }) {
  if (value === 0) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">
        {negative ? '-' : ''}${Math.abs(value).toFixed(2)}
      </span>
    </div>
  );
}

export function PurchaseSummaryPanel({
  lineas,
  proveedor,
  ivaRetenidoOverride,
  onIvaRetenidoChange,
  isrRetenidoPct,
  onIsrChange,
  formaPago,
  onFormaPagoChange,
  cuentaPagoId,
  onCuentaPagoChange,
  fechaPago,
  onFechaPagoChange,
  fechaVencimiento,
  onFechaVencimientoChange,
  onSaveDraft,
  onPost,
  saving,
}: Props) {
  // Compute totals live
  const subtotalGravado = lineas
    .filter((l) => l.ivaAplica)
    .reduce((s, l) => s + l.totalLinea, 0);
  const subtotalExento = lineas
    .filter((l) => !l.ivaAplica)
    .reduce((s, l) => s + l.totalLinea, 0);
  const subtotal = subtotalGravado + subtotalExento;
  const iva = subtotalGravado * 0.13;

  // IVA retenido — auto if gran contribuyente, overridable
  const ivaRetenidoAuto = !!proveedor?.esGranContribuyente;
  const ivaRetenidoActivo = ivaRetenidoOverride ?? ivaRetenidoAuto;
  const ivaRetenido = ivaRetenidoActivo ? subtotalGravado * 0.01 : 0;

  // ISR retenido — auto if retieneISR, overridable
  const isrAuto = proveedor?.retieneISR ? 10 : 0;
  const isrPct = isrRetenidoPct ?? isrAuto;
  const isrRetenido = subtotalGravado * (isrPct / 100);

  const total = subtotal + iva - ivaRetenido - isrRetenido;

  const hasLines = lineas.length > 0;

  return (
    <Card className="p-4 space-y-4 sticky top-4">
      <h3 className="font-semibold text-base">Resumen</h3>

      {/* Totals */}
      <div className="space-y-1.5">
        <Row label="Subtotal gravado" value={subtotalGravado} />
        <Row label="Subtotal exento" value={subtotalExento} />
        <Row label="IVA 13%" value={iva} />
      </div>

      {/* IVA retenido toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="iva-ret"
            checked={ivaRetenidoActivo}
            onCheckedChange={(v) => {
              // If toggling matches the auto value, reset to null (auto); otherwise set override
              const newVal = !!v;
              onIvaRetenidoChange(newVal === ivaRetenidoAuto ? null : newVal);
            }}
          />
          <Label htmlFor="iva-ret" className="text-sm cursor-pointer">
            IVA retenido 1%
            {ivaRetenidoAuto && (
              <span className="ml-1 text-xs text-amber-600">(auto — Gran Contrib.)</span>
            )}
          </Label>
        </div>
        <span className="font-mono text-sm text-destructive">
          {ivaRetenido > 0 ? `-$${ivaRetenido.toFixed(2)}` : '$0.00'}
        </span>
      </div>

      {/* ISR retenido */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Label className="text-sm whitespace-nowrap">ISR ret.%</Label>
          {proveedor?.retieneISR && (
            <span className="text-xs text-amber-600 whitespace-nowrap">(auto)</span>
          )}
          <Input
            type="number"
            min="0"
            max="100"
            step="0.5"
            className="w-20 text-sm"
            value={isrPct}
            onChange={(e) => {
              const val = Number(e.target.value);
              onIsrChange(val === isrAuto ? null : val);
            }}
          />
        </div>
        <span className="font-mono text-sm text-destructive">
          {isrRetenido > 0 ? `-$${isrRetenido.toFixed(2)}` : '$0.00'}
        </span>
      </div>

      <hr className="border-border" />

      {/* Total */}
      <div className="flex justify-between font-bold text-lg">
        <span>Total</span>
        <span className="font-mono">${total.toFixed(2)}</span>
      </div>

      <hr className="border-border" />

      {/* Forma de pago */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Forma de pago</Label>
        <RadioGroup
          value={formaPago}
          onValueChange={(v) => onFormaPagoChange(v as FormaPago)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="contado" id="fp-contado" />
            <Label htmlFor="fp-contado" className="cursor-pointer text-sm">
              Contado
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="credito" id="fp-credito" />
            <Label htmlFor="fp-credito" className="cursor-pointer text-sm">
              Credito
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Contado fields */}
      {formaPago === 'contado' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Cuenta caja / banco</Label>
            <CuentaSearch
              onSelect={(c) => onCuentaPagoChange(c.id)}
              selected={cuentaPagoId}
              placeholder="Cuenta caja o banco..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Fecha de pago</Label>
            <Input
              type="date"
              value={fechaPago ?? ''}
              onChange={(e) => onFechaPagoChange(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Credito fields */}
      {formaPago === 'credito' && (
        <div className="space-y-1.5">
          <Label className="text-sm">Fecha de vencimiento</Label>
          <Input
            type="date"
            value={fechaVencimiento ?? ''}
            onChange={(e) => onFechaVencimientoChange(e.target.value)}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onSaveDraft}
          disabled={saving || !hasLines}
        >
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
          Guardar borrador
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={onPost}
          disabled={saving || !hasLines}
        >
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
          Contabilizar
        </Button>
      </div>
    </Card>
  );
}
