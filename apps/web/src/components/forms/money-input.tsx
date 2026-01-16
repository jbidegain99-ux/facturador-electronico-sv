'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
}

export function MoneyInput({
  value,
  onChange,
  currency = '$',
  className,
  ...props
}: MoneyInputProps) {
  const [displayValue, setDisplayValue] = React.useState(value.toFixed(2));

  React.useEffect(() => {
    setDisplayValue(value.toFixed(2));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, '');
    setDisplayValue(rawValue);

    const numValue = parseFloat(rawValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    const numValue = parseFloat(displayValue);
    if (!isNaN(numValue)) {
      setDisplayValue(numValue.toFixed(2));
      onChange(numValue);
    } else {
      setDisplayValue('0.00');
      onChange(0);
    }
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {currency}
      </span>
      <Input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn('pl-7 text-right', className)}
        {...props}
      />
    </div>
  );
}
