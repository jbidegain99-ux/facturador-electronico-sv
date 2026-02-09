import * as React from 'react';
import type { ItemFactura } from '@/types';
interface ItemsTableProps {
    items: ItemFactura[];
    onChange: (items: ItemFactura[]) => void;
    disabled?: boolean;
}
export declare function ItemsTable({ items, onChange, disabled }: ItemsTableProps): React.JSX.Element;
export {};
//# sourceMappingURL=items-table.d.ts.map