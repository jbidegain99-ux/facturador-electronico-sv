import * as React from 'react';
import type { StockStatus } from '@/types/inventory';

const CONFIG: Record<StockStatus, { label: string; className: string }> = {
  OK: { label: 'OK', className: 'bg-green-100 text-green-800' },
  BELOW_REORDER: { label: 'Bajo mínimo', className: 'bg-amber-100 text-amber-800' },
  OUT_OF_STOCK: { label: 'Sin stock', className: 'bg-red-100 text-red-800' },
};

export function StockStatusBadge({ status }: { status: StockStatus }) {
  const c = CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}
