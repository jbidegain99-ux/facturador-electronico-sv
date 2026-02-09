import * as React from 'react';
interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number;
    onChange: (value: number) => void;
    currency?: string;
}
export declare function MoneyInput({ value, onChange, currency, className, ...props }: MoneyInputProps): React.JSX.Element;
export {};
//# sourceMappingURL=money-input.d.ts.map