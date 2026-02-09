import * as React from 'react';
import type { ItemFactura } from '@/types';
interface TotalesCardProps {
    items: ItemFactura[];
    condicionPago: string;
    onCondicionPagoChange: (value: string) => void;
    disabled?: boolean;
}
export declare function TotalesCard({ items, condicionPago, onCondicionPagoChange, disabled, }: TotalesCardProps): React.JSX.Element;
export {};
//# sourceMappingURL=totales-card.d.ts.map