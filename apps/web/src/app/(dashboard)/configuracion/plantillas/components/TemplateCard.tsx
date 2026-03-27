'use client';

import { Check, Palette, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { InvoiceTemplate } from '../lib/constants';

interface TemplateCardProps {
  template: InvoiceTemplate;
  isActive: boolean;
  canCustomize: boolean;
  onSetDefault: () => void;
  onCustomize: () => void;
  loading?: boolean;
}

const TEMPLATE_COLORS: Record<string, string> = {
  clasica: '#7C3AED',
  moderna: '#2563EB',
  compacta: '#059669',
};

export function TemplateCard({
  template,
  isActive,
  canCustomize,
  onSetDefault,
  onCustomize,
  loading,
}: TemplateCardProps) {
  const accentColor = TEMPLATE_COLORS[template.slug] || template.config?.colors?.primary || '#7C3AED';

  return (
    <Card className={`relative overflow-hidden transition-all ${isActive ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}>
      {isActive && (
        <div className="absolute top-3 right-3 z-10">
          <span className="flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full">
            <Check className="w-3 h-3" />
            Activa
          </span>
        </div>
      )}

      {/* Thumbnail placeholder */}
      <div
        className="h-40 flex items-center justify-center relative"
        style={{ background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)` }}
      >
        <div className="w-24 h-32 bg-white rounded shadow-md border flex flex-col p-2 gap-1">
          <div className="h-2 rounded-full" style={{ background: accentColor, width: '60%' }} />
          <div className="h-1 bg-gray-200 rounded-full w-full" />
          <div className="h-1 bg-gray-200 rounded-full w-3/4" />
          <div className="flex-1 mt-1">
            <div className="h-1 bg-gray-100 rounded-full w-full mb-0.5" />
            <div className="h-1 bg-gray-100 rounded-full w-full mb-0.5" />
            <div className="h-1 bg-gray-100 rounded-full w-full mb-0.5" />
          </div>
          <div className="h-1.5 rounded-full mt-auto" style={{ background: accentColor, width: '40%', marginLeft: 'auto' }} />
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <FileText className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accentColor }} />
          <div>
            <h3 className="font-semibold text-sm">{template.name}</h3>
            {template.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {template.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          {!isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSetDefault}
              disabled={loading}
              className="flex-1 text-xs"
            >
              Usar esta
            </Button>
          )}
          <Button
            variant={canCustomize ? 'default' : 'secondary'}
            size="sm"
            onClick={onCustomize}
            disabled={loading || !canCustomize}
            className="flex-1 text-xs gap-1"
          >
            <Palette className="w-3 h-3" />
            Personalizar
          </Button>
        </div>

        {!canCustomize && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Requiere Plan Professional
          </p>
        )}
      </CardContent>
    </Card>
  );
}
