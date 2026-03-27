'use client';

import { RotateCcw, AlignLeft, AlignCenter, AlignRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorPicker } from './ColorPicker';
import { COLOR_LABELS, type TemplateConfig } from '../lib/constants';

interface BrandingTabProps {
  config: TemplateConfig;
  onColorChange: (key: string, value: string) => void;
  onLogoPositionChange: (position: 'left' | 'center' | 'right') => void;
  onResetColors: () => void;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

interface ContrastCheck {
  key: string;
  label: string;
  fg: string;
  bg: string;
  minRatio: number;
}

function getContrastWarnings(colors: TemplateConfig['colors']): ContrastCheck[] {
  const checks: ContrastCheck[] = [
    { key: 'text', label: 'Texto principal', fg: colors.text, bg: colors.background, minRatio: 4.5 },
    { key: 'textLight', label: 'Texto secundario', fg: colors.textLight, bg: colors.background, minRatio: 3 },
    { key: 'primary', label: 'Color primario', fg: colors.primary, bg: colors.background, minRatio: 3 },
  ];
  return checks.filter((c) => getContrastRatio(c.fg, c.bg) < c.minRatio);
}

export function BrandingTab({
  config,
  onColorChange,
  onLogoPositionChange,
  onResetColors,
}: BrandingTabProps) {
  const contrastWarnings = getContrastWarnings(config.colors);

  return (
    <div className="space-y-6">
      {/* Colores */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">Colores</h4>
          <Button variant="ghost" size="sm" onClick={onResetColors} className="h-7 text-xs gap-1">
            <RotateCcw className="w-3 h-3" />
            Restaurar
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(COLOR_LABELS).map(([key, label]) => (
            <ColorPicker
              key={key}
              label={label}
              value={(config.colors as Record<string, string>)[key] || '#000000'}
              onChange={(v) => onColorChange(key, v)}
            />
          ))}
        </div>
      </div>

      {/* Contrast warnings */}
      {contrastWarnings.length > 0 && (
        <div className="space-y-1.5">
          {contrastWarnings.map((warning) => (
            <div key={warning.key} className="flex items-center gap-2 text-amber-500 text-xs bg-amber-500/10 px-3 py-2 rounded-md">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {warning.label}: contraste bajo ({getContrastRatio(warning.fg, warning.bg).toFixed(1)}:1) — el texto podría ser difícil de leer
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Posición del logo */}
      <div>
        <h4 className="text-sm font-medium mb-3">Posición del Logo</h4>
        <div className="flex gap-2">
          {([
            { value: 'left' as const, icon: AlignLeft, label: 'Izquierda' },
            { value: 'center' as const, icon: AlignCenter, label: 'Centro' },
            { value: 'right' as const, icon: AlignRight, label: 'Derecha' },
          ]).map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              variant={config.logo.position === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onLogoPositionChange(value)}
              className="flex-1 gap-1.5"
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
