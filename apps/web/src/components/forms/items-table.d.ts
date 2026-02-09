import * as React from 'react';
import { ItemFactura } from '@/types';
interface ItemsTableProps {
    items: ItemFactura[];
    onAddItem: (item: ItemFactura) => void;
    onUpdateItem: (id: string, item: Partial<ItemFactura>) => void;
    onRemoveItem: (id: string) => void;
    ivaRate?: number;
}
export declare function ItemsTable({ items, onAddItem, onUpdateItem, onRemoveItem, ivaRate, }: ItemsTableProps): React.JSX.Element;
export {};
//# sourceMappingURL=items-table.d.ts.map