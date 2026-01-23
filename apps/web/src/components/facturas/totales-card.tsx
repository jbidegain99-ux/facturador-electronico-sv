'use client';

import * as React from 'react';
import { Calculator } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatCurrency } from '@/lib/utils';
import type { ItemFactura } from '@/types';

interface TotalesCardProps {
  items: ItemFactura[];
  condicionPago: string;
  onCondicionPagoChange: (value: string) => void;
  disabled?: boolean;
}

const CONDICIONES_PAGO = [
  { value: '01', label: 'Contado' },
  { value: '02', label: 'A crédito' },
  { value: '03', label: 'Otro' },
];

export function TotalesCard({
  items,
  condicionPago,
  onCondicionPagoChange,
  disabled = false,
}: TotalesCardProps) {
  // Calculate totals
  const subtotalGravado = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDescuentos = items.reduce((sum, item) => sum + item.descuento, 0);
  const subtotalNeto = subtotalGravado;
  const totalIva = items.reduce((sum, item) => sum + item.iva, 0);
  const totalPagar = items.reduce((sum, item) => sum + item.total, 0);

  const [prevTotal, setPrevTotal] = React.useState(totalPagar);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Animate when total changes
  React.useEffect(() => {
    if (totalPagar !== prevTotal) {
      setIsAnimating(true);
      setPrevTotal(totalPagar);
      const timeout = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [totalPagar, prevTotal]);

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <Calculator className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-white">Resumen</h3>
      </div>

      {/* Totals breakdown */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal (gravado):</span>
          <span className="text-white font-medium">{formatCurrency(subtotalGravado)}</span>
        </div>

        {totalDescuentos > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Descuentos:</span>
            <span className="text-warning font-medium">-{formatCurrency(totalDescuentos)}</span>
          </div>
        )}

        <div className="h-px bg-border" />

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sub-total:</span>
          <span className="text-white font-medium">{formatCurrency(subtotalNeto)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">IVA (13%):</span>
          <span className="text-white font-medium">{formatCurrency(totalIva)}</span>
        </div>

        <div className="h-px bg-primary/30" />

        {/* Total to pay */}
        <div className="flex justify-between items-center pt-1">
          <span className="text-lg font-semibold text-white">TOTAL A PAGAR:</span>
          <span
            className={cn(
              'text-2xl font-bold text-primary transition-all duration-300',
              isAnimating && 'scale-110'
            )}
          >
            {formatCurrency(totalPagar)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Payment condition */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Condicion de pago:</label>
        <Select value={condicionPago} onValueChange={onCondicionPagoChange} disabled={disabled}>
          <SelectTrigger className="w-full input-rc">
            <SelectValue placeholder="Seleccionar condicion" />
          </SelectTrigger>
          <SelectContent className="bg-[#12121a] border-border">
            {CONDICIONES_PAGO.map((condicion) => (
              <SelectItem
                key={condicion.value}
                value={condicion.value}
                className="text-white hover:bg-primary/20 focus:bg-primary/20"
              >
                {condicion.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items count */}
      {items.length > 0 && (
        <div className="pt-2 text-center">
          <span className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'} en la factura
          </span>
        </div>
      )}
    </div>
  );
}
