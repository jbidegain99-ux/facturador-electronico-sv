'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PageSizeSelectorProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
}

export function PageSizeSelector({
  value,
  onChange,
  options = [10, 20, 50, 100],
}: PageSizeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground whitespace-nowrap">Mostrar</span>
      <Select
        value={value.toString()}
        onValueChange={(v) => onChange(parseInt(v, 10))}
      >
        <SelectTrigger className="w-[75px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt.toString()}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
