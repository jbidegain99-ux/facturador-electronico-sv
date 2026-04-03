'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface InvoiceSuccessViewProps {
  numeroControl: string;
  onNewInvoice: () => void;
  onViewInvoice: () => void;
  t: (key: string) => string;
}

export function InvoiceSuccessView({
  numeroControl,
  onNewInvoice,
  onViewInvoice,
  t,
}: InvoiceSuccessViewProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto animate-in fade-in-50 zoom-in-95 duration-500">
        <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('invoiceEmitted')}</h1>
          <p className="text-muted-foreground">{t('invoiceEmittedDesc')}</p>
        </div>

        <div className="glass-card p-4 text-left">
          <div className="text-sm text-muted-foreground mb-1">{t('controlNumber')}</div>
          <code className="text-xs text-primary break-all">{numeroControl}</code>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="ghost" onClick={onNewInvoice} className="btn-secondary">
            <Sparkles className="w-4 h-4 mr-2" />{t('newInvoiceBtn')}
          </Button>
          <Button onClick={onViewInvoice} className="btn-primary">{t('seeDetail')}</Button>
        </div>
      </div>
    </div>
  );
}
