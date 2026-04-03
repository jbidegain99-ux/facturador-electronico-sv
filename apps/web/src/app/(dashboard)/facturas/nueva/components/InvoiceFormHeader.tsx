'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FileText, ArrowLeft, Send, Save, Loader2 } from 'lucide-react';

interface SucursalOption {
  id: string;
  nombre: string;
  codEstableMH: string;
}

interface PuntoVentaOption {
  id: string;
  nombre: string;
  codPuntoVentaMH: string;
}

type CreatableTipoDte = '01' | '03' | '04' | '05' | '06' | '07' | '09' | '11' | '14' | '34';

const DTE_TYPE_OPTIONS: { value: CreatableTipoDte; label: string; group: string }[] = [
  { value: '01', label: 'Factura', group: 'Facturacion' },
  { value: '03', label: 'Credito Fiscal (CCF)', group: 'Facturacion' },
  { value: '11', label: 'Factura de Exportacion', group: 'Facturacion' },
  { value: '14', label: 'Sujeto Excluido', group: 'Facturacion' },
  { value: '04', label: 'Nota de Remision', group: 'Notas' },
  { value: '05', label: 'Nota de Credito', group: 'Notas' },
  { value: '06', label: 'Nota de Debito', group: 'Notas' },
  { value: '07', label: 'Comprobante de Retencion', group: 'Retencion' },
  { value: '34', label: 'Retencion CRS', group: 'Retencion' },
  { value: '09', label: 'Documento de Liquidacion', group: 'Liquidacion' },
];

const CONDICIONES_PAGO = [
  { value: '01', label: 'Contado' },
  { value: '02', label: 'A credito' },
  { value: '03', label: 'Otro' },
];

interface InvoiceFormHeaderProps {
  tipoDte: CreatableTipoDte;
  condicionPago: string;
  sucursalId: string;
  puntoVentaId: string;
  sucursales: SucursalOption[];
  puntosVenta: PuntoVentaOption[];
  isEmitting: boolean;
  canEmit: boolean;
  hasDraft: boolean;
  onTipoDteChange: (v: CreatableTipoDte) => void;
  onCondicionChange: (v: string) => void;
  onSucursalChange: (v: string) => void;
  onPuntoVentaChange: (v: string) => void;
  onBack: () => void;
  onEmit: () => void;
  onLoadDraft: () => void;
  onDiscardDraft: () => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function InvoiceFormHeader({
  tipoDte, condicionPago, sucursalId, puntoVentaId,
  sucursales, puntosVenta,
  isEmitting, canEmit, hasDraft,
  onTipoDteChange, onCondicionChange, onSucursalChange, onPuntoVentaChange,
  onBack, onEmit, onLoadDraft, onDiscardDraft,
  t, tCommon,
}: InvoiceFormHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" />{tCommon('back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />{t('createTitle')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('createSubtitle')}</p>
          </div>
        </div>
        <Button onClick={onEmit} disabled={!canEmit || isEmitting} className="btn-primary hidden sm:flex">
          {isEmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('emitting')}</>) : (<><Send className="w-4 h-4 mr-2" />{t('emit')}</>)}
        </Button>
      </div>

      {/* Top row: Tipo DTE + Condicion */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">{t('typeLabel')}</label>
            <Select value={tipoDte} onValueChange={(v) => onTipoDteChange(v as CreatableTipoDte)}>
              <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(() => {
                  const groups = DTE_TYPE_OPTIONS.reduce((acc, opt) => { if (!acc[opt.group]) acc[opt.group] = []; acc[opt.group].push(opt); return acc; }, {} as Record<string, typeof DTE_TYPE_OPTIONS>);
                  return Object.entries(groups).map(([group, opts]) => (
                    <SelectGroup key={group}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group}</div>
                      {opts.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.value} - {opt.label}</SelectItem>)}
                    </SelectGroup>
                  ));
                })()}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden sm:block h-8 w-px bg-border" />

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">{t('conditionLabel')}</label>
            <Select value={condicionPago} onValueChange={onCondicionChange}>
              <SelectTrigger className="w-[140px] input-rc"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDICIONES_PAGO.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {sucursales.length > 0 && (
            <>
              <div className="hidden sm:block h-8 w-px bg-border" />
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sucursal</label>
                <Select value={sucursalId} onValueChange={onSucursalChange}>
                  <SelectTrigger className="w-[180px] input-rc"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {sucursales.map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre} ({s.codEstableMH})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {puntosVenta.length > 0 && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Punto de Venta</label>
                  <Select value={puntoVentaId} onValueChange={onPuntoVentaChange}>
                    <SelectTrigger className="w-[180px] input-rc"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {puntosVenta.map((pv) => <SelectItem key={pv.id} value={pv.id}>{pv.nombre} ({pv.codPuntoVentaMH})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Draft recovery */}
      {hasDraft && (
        <div className="glass-card p-4 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <Save className="w-5 h-5 text-warning" />
            <div>
              <p className="text-sm font-medium text-foreground">{t('hasDraft')}</p>
              <p className="text-xs text-muted-foreground">{t('draftAutoSave')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onDiscardDraft}>{t('discard')}</Button>
            <Button size="sm" onClick={onLoadDraft} className="btn-primary">{t('recover')}</Button>
          </div>
        </div>
      )}
    </>
  );
}
