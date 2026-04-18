'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProveedorSearch } from './proveedor-search';
import type { Proveedor, TipoDocProveedor } from '@/types/purchase';

interface Props {
  proveedor?: Proveedor;
  onProveedorChange: (p: Proveedor) => void;
  tipoDoc: TipoDocProveedor;
  onTipoDocChange: (v: TipoDocProveedor) => void;
  numDoc: string;
  onNumDocChange: (v: string) => void;
  fechaDoc: string; // ISO date YYYY-MM-DD
  onFechaDocChange: (v: string) => void;
  fechaContable: string;
  onFechaContableChange: (v: string) => void;
}

const TIPO_DOC_OPTIONS: { value: TipoDocProveedor; label: string }[] = [
  { value: 'FC', label: 'FC — Factura Consumidor' },
  { value: 'CCF', label: 'CCF — Comprobante Crédito Fiscal' },
  { value: 'NCF', label: 'NCF — Nota de Crédito' },
  { value: 'NDF', label: 'NDF — Nota de Débito' },
  { value: 'OTRO', label: 'OTRO' },
];

export function PurchaseFormHeader({
  proveedor,
  onProveedorChange,
  tipoDoc,
  onTipoDocChange,
  numDoc,
  onNumDocChange,
  fechaDoc,
  onFechaDocChange,
  fechaContable,
  onFechaContableChange,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Proveedor */}
      <div className="space-y-2">
        <Label>
          Proveedor <span className="text-destructive">*</span>
        </Label>
        <ProveedorSearch selected={proveedor} onSelect={onProveedorChange} />
      </div>

      {/* Tipo doc + num control */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            Tipo de documento <span className="text-destructive">*</span>
          </Label>
          <Select
            value={tipoDoc}
            onValueChange={(v) => onTipoDocChange(v as TipoDocProveedor)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {TIPO_DOC_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>
            Número de documento <span className="text-destructive">*</span>
          </Label>
          <Input
            value={numDoc}
            onChange={(e) => onNumDocChange(e.target.value)}
            placeholder="Ej. 0001-00000001"
          />
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            Fecha del documento <span className="text-destructive">*</span>
          </Label>
          <Input
            type="date"
            value={fechaDoc}
            onChange={(e) => onFechaDocChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>
            Fecha contable <span className="text-destructive">*</span>
          </Label>
          <Input
            type="date"
            value={fechaContable}
            onChange={(e) => onFechaContableChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
