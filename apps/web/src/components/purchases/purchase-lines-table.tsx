'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CatalogSearch } from '@/components/facturas/catalog-search';
import { CuentaSearch } from '@/components/purchases/cuenta-search';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import type { PurchaseLine } from '@/types/purchase';
import type { CatalogItem } from '@/components/facturas/catalog-search';
import type { AccountingAccount } from './nueva-cuenta-modal';

interface Props {
  lineas: PurchaseLine[];
  onChange: (lineas: PurchaseLine[]) => void;
  errors?: Record<number, string>;
}

function computeLineTotal(l: PurchaseLine): number {
  if (l.tipo === 'servicio') {
    return (l.monto ?? 0) * (1 - (l.descuentoPct ?? 0) / 100);
  }
  const bruto = (l.cantidad ?? 0) * (l.precioUnit ?? 0);
  return bruto * (1 - (l.descuentoPct ?? 0) / 100);
}

function newBienLine(): PurchaseLine {
  return {
    tipo: 'bien',
    descripcion: '',
    cantidad: 1,
    precioUnit: 0,
    descuentoPct: 0,
    ivaAplica: true,
    totalLinea: 0,
  };
}

function newServicioLine(): PurchaseLine {
  return {
    tipo: 'servicio',
    descripcion: '',
    monto: 0,
    descuentoPct: 0,
    ivaAplica: true,
    totalLinea: 0,
  };
}

export function PurchaseLinesTable({ lineas, onChange, errors }: Props) {
  const addBien = React.useCallback(() => {
    onChange([...lineas, newBienLine()]);
  }, [lineas, onChange]);

  const addServicio = React.useCallback(() => {
    onChange([...lineas, newServicioLine()]);
  }, [lineas, onChange]);

  const remove = React.useCallback((i: number) => {
    onChange(lineas.filter((_, idx) => idx !== i));
  }, [lineas, onChange]);

  const update = React.useCallback((i: number, patch: Partial<PurchaseLine>) => {
    onChange(
      lineas.map((l, idx) => {
        if (idx !== i) return l;
        const merged = { ...l, ...patch };
        merged.totalLinea = computeLineTotal(merged);
        return merged;
      })
    );
  }, [lineas, onChange]);

  const toggleTipo = React.useCallback((i: number) => {
    const curr = lineas[i];
    const newTipo: PurchaseLine['tipo'] = curr.tipo === 'bien' ? 'servicio' : 'bien';
    const base = {
      tipo: newTipo,
      descripcion: curr.descripcion,
      descuentoPct: curr.descuentoPct,
      ivaAplica: curr.ivaAplica,
    };
    const cleaned: PurchaseLine =
      newTipo === 'bien'
        ? { ...base, cantidad: 1, precioUnit: 0, totalLinea: 0 }
        : { ...base, monto: 0, totalLinea: 0 };
    onChange(lineas.map((l, idx) => (idx === i ? cleaned : l)));
  }, [lineas, onChange]);

  const handleItemSelect = React.useCallback((i: number, item: CatalogItem) => {
    update(i, {
      itemId: item.id,
      descripcion: item.name,
      precioUnit: item.basePrice,
      totalLinea: computeLineTotal({ ...lineas[i], itemId: item.id, descripcion: item.name, precioUnit: item.basePrice }),
    });
  }, [lineas, update]);

  const handleCuentaSelect = React.useCallback((i: number, cuenta: AccountingAccount) => {
    update(i, { cuentaContableId: cuenta.id });
  }, [update]);

  useKeyboardShortcuts({
    'alt+b': addBien,
    'alt+s': addServicio,
  });

  return (
    <div className="space-y-3">
      {/* Desktop column headers */}
      <div className="hidden md:grid md:grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2 py-1 border-b border-border">
        <div className="col-span-1">Tipo</div>
        <div className="col-span-3">Item / Descripcion</div>
        <div className="col-span-1 text-center">Qty</div>
        <div className="col-span-2">Precio / Monto</div>
        <div className="col-span-1 text-center">Desc%</div>
        <div className="col-span-1 text-center">IVA</div>
        <div className="col-span-2 text-right">Total</div>
        <div className="col-span-1"></div>
      </div>

      {/* Lines */}
      {lineas.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
          No hay lineas. Agrega una linea de bien o servicio.
        </div>
      )}

      {lineas.map((l, i) => (
        <div
          key={i}
          className="border border-border rounded-lg p-3 space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-2 md:items-start"
        >
          {/* Toggle tipo */}
          <div className="md:col-span-1 flex md:block items-center gap-2">
            <span className="md:hidden text-xs text-muted-foreground font-medium w-20">Tipo:</span>
            <button
              type="button"
              onClick={() => toggleTipo(i)}
              className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors whitespace-nowrap"
              title="Cambiar entre bien y servicio"
            >
              {l.tipo === 'bien' ? '📦 Bien' : '🔧 Svc'}
            </button>
          </div>

          {/* Item/desc + cuenta (servicio) */}
          <div className="md:col-span-3 space-y-1.5">
            <div className="md:hidden text-xs text-muted-foreground font-medium">
              {l.tipo === 'bien' ? 'Item:' : 'Descripcion:'}
            </div>
            {l.tipo === 'bien' ? (
              <CatalogSearch
                onSelect={(item) => handleItemSelect(i, item)}
                disabled={false}
              />
            ) : (
              <Input
                value={l.descripcion}
                onChange={(e) => update(i, { descripcion: e.target.value })}
                placeholder="Descripcion del servicio"
                className="text-sm"
              />
            )}
            {l.tipo === 'servicio' && (
              <CuentaSearch
                onSelect={(cuenta) => handleCuentaSelect(i, cuenta)}
                selected={l.cuentaContableId}
                placeholder="Cuenta contable del servicio"
              />
            )}
            {l.tipo === 'bien' && l.descripcion && (
              <p className="text-xs text-muted-foreground truncate pl-1">{l.descripcion}</p>
            )}
          </div>

          {/* Cantidad */}
          <div className="md:col-span-1">
            <div className="md:hidden text-xs text-muted-foreground font-medium mb-1">Qty:</div>
            {l.tipo === 'bien' ? (
              <Input
                type="number"
                min="0"
                step="1"
                value={l.cantidad ?? 0}
                onChange={(e) => update(i, { cantidad: Number(e.target.value) })}
                className="text-sm text-center"
              />
            ) : (
              <div className="text-xs text-muted-foreground text-center pt-2">—</div>
            )}
          </div>

          {/* Precio / Monto */}
          <div className="md:col-span-2">
            <div className="md:hidden text-xs text-muted-foreground font-medium mb-1">
              {l.tipo === 'bien' ? 'Precio unit:' : 'Monto:'}
            </div>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={l.tipo === 'bien' ? (l.precioUnit ?? 0) : (l.monto ?? 0)}
              onChange={(e) =>
                update(
                  i,
                  l.tipo === 'bien'
                    ? { precioUnit: Number(e.target.value) }
                    : { monto: Number(e.target.value) }
                )
              }
              className="text-sm"
            />
          </div>

          {/* Descuento % */}
          <div className="md:col-span-1">
            <div className="md:hidden text-xs text-muted-foreground font-medium mb-1">Desc%:</div>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={l.descuentoPct}
              onChange={(e) => update(i, { descuentoPct: Number(e.target.value) })}
              className="text-sm text-center"
            />
          </div>

          {/* IVA */}
          <div className="md:col-span-1 flex items-center md:justify-center gap-2 md:gap-0 md:pt-2">
            <div className="md:hidden text-xs text-muted-foreground font-medium">IVA:</div>
            <Checkbox
              checked={l.ivaAplica}
              onCheckedChange={(v) => update(i, { ivaAplica: !!v })}
            />
          </div>

          {/* Total */}
          <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2 md:pt-2">
            <div className="md:hidden text-xs text-muted-foreground font-medium">Total:</div>
            <span className="font-mono text-sm font-medium">
              ${l.totalLinea.toFixed(2)}
            </span>
          </div>

          {/* Delete */}
          <div className="md:col-span-1 flex justify-end md:justify-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(i)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Row error */}
          {errors?.[i] && (
            <div className="md:col-span-12 text-xs text-destructive px-1">{errors[i]}</div>
          )}
        </div>
      ))}

      {/* Add buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={addBien}>
          <Plus className="w-4 h-4 mr-1" />
          Linea bien
          <kbd className="ml-2 text-xs opacity-50 hidden sm:inline">Alt+B</kbd>
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addServicio}>
          <Plus className="w-4 h-4 mr-1" />
          Linea servicio
          <kbd className="ml-2 text-xs opacity-50 hidden sm:inline">Alt+S</kbd>
        </Button>
      </div>
    </div>
  );
}
