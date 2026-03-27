'use client';

import * as React from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [hexInput, setHexInput] = React.useState(value);

  React.useEffect(() => {
    setHexInput(value);
  }, [value]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setHexInput(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      onChange(v);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent shrink-0"
      />
      <div className="flex-1 min-w-0">
        <label className="text-xs text-muted-foreground block mb-1">{label}</label>
        <input
          type="text"
          value={hexInput}
          onChange={handleHexChange}
          className="w-full text-xs bg-muted/50 border border-border rounded px-2 py-1 font-mono"
          maxLength={7}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
