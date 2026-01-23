'use client';

import * as React from 'react';
import {
  FileText,
  User,
  Building2,
  Calendar,
  Clock,
  Hash,
  X,
  Send,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency, formatDate, getTipoDteName } from '@/lib/utils';
import type { Cliente, ItemFactura } from '@/types';

interface EmisorInfo {
  nombre: string;
  nit: string;
  nrc: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
}

interface FacturaPreviewProps {
  open: boolean;
  onClose: () => void;
  onEmit: () => void;
  data: {
    tipoDte: '01' | '03';
    cliente: Cliente | null;
    items: ItemFactura[];
    condicionPago: string;
    emisor?: EmisorInfo;
  };
  isEmitting: boolean;
}

const CONDICIONES_PAGO: Record<string, string> = {
  '01': 'Contado',
  '02': 'A crédito',
  '03': 'Otro',
};

export function FacturaPreview({
  open,
  onClose,
  onEmit,
  data,
  isEmitting,
}: FacturaPreviewProps) {
  const { tipoDte, cliente, items, condicionPago, emisor } = data;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDescuento = items.reduce((sum, item) => sum + item.descuento, 0);
  const totalIva = items.reduce((sum, item) => sum + item.iva, 0);
  const totalPagar = items.reduce((sum, item) => sum + item.total, 0);

  const fechaActual = new Date();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-[#0f0f1a] border-border">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg text-white">Vista Previa de Factura</DialogTitle>
                <DialogDescription>
                  Revisa los datos antes de emitir
                </DialogDescription>
              </div>
            </div>
            <Badge className={cn(
              tipoDte === '01' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'
            )}>
              {getTipoDteName(tipoDte)}
            </Badge>
          </div>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] py-4 space-y-6">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Fecha:</span>
              </div>
              <p className="text-white font-medium pl-6">{formatDate(fechaActual)}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Hora:</span>
              </div>
              <p className="text-white font-medium pl-6">
                {fechaActual.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="w-4 h-4" />
                <span>Numero de Control:</span>
              </div>
              <p className="text-white font-medium pl-6 font-mono text-xs">
                (Se generara al emitir)
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Condicion:</span>
              </div>
              <p className="text-white font-medium pl-6">
                {CONDICIONES_PAGO[condicionPago] || condicionPago}
              </p>
            </div>
          </div>

          {/* Emisor (if available) */}
          {emisor && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Emisor
                </span>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-white">{emisor.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  NIT: {emisor.nit} | NRC: {emisor.nrc}
                </p>
                {emisor.direccion && (
                  <p className="text-sm text-muted-foreground">{emisor.direccion}</p>
                )}
              </div>
            </div>
          )}

          {/* Receptor/Cliente */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Receptor
              </span>
            </div>
            {cliente ? (
              <div className="space-y-1">
                <p className="font-semibold text-white">{cliente.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {cliente.tipoDocumento === '36' ? 'NIT' : 'DUI'}: {cliente.numDocumento}
                  {cliente.nrc && ` | NRC: ${cliente.nrc}`}
                </p>
                {cliente.correo && (
                  <p className="text-sm text-muted-foreground">{cliente.correo}</p>
                )}
              </div>
            ) : (
              <p className="text-warning">Consumidor Final (sin identificar)</p>
            )}
          </div>

          {/* Items table */}
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-white/5">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Detalle de Items ({items.length})
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Descripcion</th>
                    <th className="px-4 py-2 text-right">Cant.</th>
                    <th className="px-4 py-2 text-right">P. Unit.</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="px-4 py-2 text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-2 text-white">{item.descripcion}</td>
                      <td className="px-4 py-2 text-right text-white">{item.cantidad}</td>
                      <td className="px-4 py-2 text-right text-white">
                        {formatCurrency(item.precioUnitario)}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-white">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="glass-card p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="text-white">{formatCurrency(subtotal)}</span>
              </div>
              {totalDescuento > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Descuentos:</span>
                  <span className="text-warning">-{formatCurrency(totalDescuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (13%):</span>
                <span className="text-white">{formatCurrency(totalIva)}</span>
              </div>
              <div className="h-px bg-primary/30 my-2" />
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-white">TOTAL A PAGAR:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(totalPagar)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border pt-4 gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isEmitting}
            className="btn-secondary"
          >
            Cancelar
          </Button>
          <Button
            onClick={onEmit}
            disabled={isEmitting || items.length === 0}
            className="btn-primary"
          >
            {isEmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Emitiendo...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Emitir Factura
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
