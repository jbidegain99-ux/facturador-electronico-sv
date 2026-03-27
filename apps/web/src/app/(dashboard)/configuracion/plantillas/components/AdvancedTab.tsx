'use client';

import type { TemplateConfig } from '../lib/constants';

interface AdvancedTabProps {
  config: TemplateConfig;
  onPageSettingsChange: (settings: Partial<TemplateConfig['pageSettings']>) => void;
}

export function AdvancedTab({ config, onPageSettingsChange }: AdvancedTabProps) {
  return (
    <div className="space-y-6">
      {/* Page size */}
      <div>
        <h4 className="text-sm font-medium mb-3">Tamaño de Página</h4>
        <div className="flex gap-2">
          {([
            { value: 'letter' as const, label: 'Carta', desc: '8.5 × 11 in' },
            { value: 'a4' as const, label: 'A4', desc: '210 × 297 mm' },
          ]).map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => onPageSettingsChange({ size: value })}
              className={`flex-1 p-3 rounded-lg border text-left transition-colors ${
                config.pageSettings.size === value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-sm font-medium block">{label}</span>
              <span className="text-xs text-muted-foreground">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Margins */}
      <div>
        <h4 className="text-sm font-medium mb-3">Márgenes (mm)</h4>
        <div className="grid grid-cols-2 gap-3">
          {([
            { key: 'top', label: 'Superior' },
            { key: 'right', label: 'Derecho' },
            { key: 'bottom', label: 'Inferior' },
            { key: 'left', label: 'Izquierdo' },
          ] as const).map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground block mb-1">{label}</label>
              <input
                type="number"
                min={5}
                max={50}
                value={config.pageSettings.margins[key]}
                onChange={(e) => {
                  const val = Math.min(50, Math.max(5, Number(e.target.value) || 5));
                  onPageSettingsChange({
                    margins: { ...config.pageSettings.margins, [key]: val },
                  });
                }}
                className="w-full bg-muted/50 border border-border rounded-md px-3 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Los márgenes afectan el área de impresión del documento (5-50mm).
        </p>
      </div>
    </div>
  );
}
