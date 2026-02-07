'use client';

import { useCallback } from 'react';

interface MaskedInputProps {
  mask: string; // e.g. "9999-999999-999-9" where 9 = digit
  value: string;
  onValueChange: (masked: string) => void;
  id?: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function MaskedInput({
  mask,
  value,
  onValueChange,
  id,
  name,
  required,
  placeholder,
  className,
}: MaskedInputProps) {
  const applyMask = useCallback(
    (raw: string): string => {
      const digits = raw.replace(/\D/g, '');
      let result = '';
      let digitIndex = 0;

      for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
        if (mask[i] === '9') {
          result += digits[digitIndex];
          digitIndex++;
        } else {
          result += mask[i];
          // If the current digit matches a separator position, skip
        }
      }

      return result;
    },
    [mask],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value);
    onValueChange(masked);
  };

  return (
    <input
      type="text"
      id={id}
      name={name}
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      className={className}
    />
  );
}
