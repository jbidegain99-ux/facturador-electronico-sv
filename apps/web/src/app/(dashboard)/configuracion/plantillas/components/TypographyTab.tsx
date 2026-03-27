'use client';

import { ALLOWED_FONTS, type TemplateConfig } from '../lib/constants';

interface TypographyTabProps {
  config: TemplateConfig;
  onFontChange: (key: 'heading' | 'body', value: string) => void;
}

export function TypographyTab({ config, onFontChange }: TypographyTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium block mb-2">Fuente de Títulos</label>
        <select
          value={config.fonts.heading}
          onChange={(e) => onFontChange('heading', e.target.value)}
          className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm"
        >
          {ALLOWED_FONTS.map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">Fuente de Cuerpo</label>
        <select
          value={config.fonts.body}
          onChange={(e) => onFontChange('body', e.target.value)}
          className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm"
        >
          {ALLOWED_FONTS.map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>

      {/* Preview del par tipográfico */}
      <div className="border border-border rounded-lg p-4 bg-white dark:bg-gray-900">
        <p className="text-xs text-muted-foreground mb-2">Vista previa</p>
        <p
          className="text-lg font-bold mb-1"
          style={{ fontFamily: `'${config.fonts.heading}', sans-serif` }}
        >
          Título de ejemplo
        </p>
        <p
          className="text-sm text-muted-foreground"
          style={{ fontFamily: `'${config.fonts.body}', sans-serif` }}
        >
          Este es un ejemplo del texto del cuerpo del documento con la fuente seleccionada.
        </p>
      </div>
    </div>
  );
}
