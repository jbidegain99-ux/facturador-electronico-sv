'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calculator, Send, Eye, Save, Files, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { Cliente, ItemFactura } from '@/types';
import { PlantillasPanel, GuardarPlantillaModal } from '@/components/facturas/plantillas-panel';
import { FavoritosPanel } from '@/components/facturas/favoritos-panel';
import type { InvoiceTemplate, FavoriteItem } from '@/store/templates';
import { getShortcutDisplay } from '@/hooks/use-keyboard-shortcuts';

interface InvoiceSummaryPanelProps {
  items: ItemFactura[];
  tipoDte: string;
  condicionPago: string;
  cliente: Cliente | null;
  subtotalGravado: number;
  totalDescuentos: number;
  totalIva: number;
  totalPagar: number;
  isEmitting: boolean;
  canEmit: boolean;
  onEmit: () => void;
  onPreview: () => void;
  onSaveDraft: () => void;
  onSaveTemplate: () => void;
  showSaveTemplate: boolean;
  setShowSaveTemplate: (v: boolean) => void;
  onSelectTemplate: (template: InvoiceTemplate) => void;
  onSelectFavorite: (favorite: FavoriteItem) => void;
  t: (key: string) => string;
}

export function InvoiceSummaryPanel({
  items,
  tipoDte,
  condicionPago,
  cliente,
  subtotalGravado,
  totalDescuentos,
  totalIva,
  totalPagar,
  isEmitting,
  canEmit,
  onEmit,
  onPreview,
  onSaveDraft,
  onSaveTemplate,
  showSaveTemplate,
  setShowSaveTemplate,
  onSelectTemplate,
  onSelectFavorite,
  t,
}: InvoiceSummaryPanelProps) {
  return (
    <div className="lg:col-span-2">
      <div className="lg:sticky lg:top-20 space-y-4">
        {/* Summary panel */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Calculator className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">{t('summary')}</h3>
            {items.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('subtotalLabel')}</span>
              <span className="text-foreground font-medium">{formatCurrency(subtotalGravado)}</span>
            </div>
            {totalDescuentos > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('discountsLabel')}</span>
                <span className="text-warning font-medium">-{formatCurrency(totalDescuentos)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('ivaLabel')}</span>
              <span className="text-foreground font-medium">{formatCurrency(totalIva)}</span>
            </div>
            <div className="h-px bg-primary/30" />
            <div className="flex justify-between items-center pt-1">
              <span className="text-lg font-semibold text-foreground">{t('totalLabel')}</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(totalPagar)}</span>
            </div>
          </div>
        </div>

        {/* Actions panel */}
        <div className="glass-card p-4 space-y-2">
          <Button className="w-full btn-primary justify-center" onClick={onEmit} disabled={!canEmit || isEmitting}>
            {isEmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('emitting')}</>) : (<><Send className="w-4 h-4 mr-2" />{t('emitInvoice')}</>)}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1 justify-center" onClick={onPreview} disabled={items.length === 0}>
              <Eye className="w-4 h-4 mr-2" />{t('preview')}
            </Button>
            <Button variant="ghost" className="flex-1 justify-center" onClick={onSaveDraft} disabled={items.length === 0 && !cliente}>
              <Save className="w-4 h-4 mr-2" />{t('draft')}
            </Button>
          </div>
          <Button variant="ghost" className="w-full justify-center text-muted-foreground" onClick={onSaveTemplate} disabled={items.length === 0}>
            <Files className="w-4 h-4 mr-2" />{t('saveTemplate')}
          </Button>
        </div>

        {/* Templates */}
        <PlantillasPanel onSelectTemplate={onSelectTemplate} />

        {/* Favorites */}
        <FavoritosPanel onSelectFavorite={onSelectFavorite} />

        {/* Keyboard hint */}
        <div className="hidden lg:flex items-center justify-center gap-4 text-xs text-muted-foreground py-2">
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">{getShortcutDisplay('mod+enter')}</kbd> {t('emit')}</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">{getShortcutDisplay('mod+s')}</kbd> {t('draft')}</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">{getShortcutDisplay('mod+p')}</kbd> {t('preview')}</span>
        </div>
      </div>

      {/* Save template modal */}
      <GuardarPlantillaModal
        open={showSaveTemplate}
        onOpenChange={setShowSaveTemplate}
        tipoDte={tipoDte}
        items={items}
        condicionPago={condicionPago}
        cliente={cliente || undefined}
      />
    </div>
  );
}
