import * as React from 'react';
import type { Cliente } from '@/types';
interface ClienteSearchProps {
    value: Cliente | null;
    onChange: (cliente: Cliente | null) => void;
    onCreateNew: () => void;
    disabled?: boolean;
    tipoDte?: '01' | '03';
}
export declare function ClienteSearch({ value, onChange, onCreateNew, disabled, tipoDte, }: ClienteSearchProps): React.JSX.Element;
export {};
//# sourceMappingURL=cliente-search.d.ts.map