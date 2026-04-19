'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Package, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { StockStatusBadge } from '@/components/inventory/stock-status-badge';
import type { TopBelowReorderItem, InventoryAlerts } from '@/types/inventory';

export function LowStockAlertCard() {
  const [alerts, setAlerts] = React.useState<InventoryAlerts | null>(null);
  const [top, setTop] = React.useState<TopBelowReorderItem[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const [alertsResult, topResult] = await Promise.all([
          apiFetch<InventoryAlerts>('/inventory/alerts').catch(() => null),
          apiFetch<TopBelowReorderItem[]>('/inventory/alerts/top?limit=5').catch(() => []),
        ]);
        if (alertsResult) setAlerts(alertsResult);
        setTop(topResult ?? []);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  if (!loaded) return null;
  const total = (alerts?.belowReorderCount ?? 0) + (alerts?.outOfStockCount ?? 0);
  if (total === 0) return null;

  return (
    <Card className="border-amber-300">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold">Inventario bajo mínimo</h3>
          </div>
          <span className="text-2xl font-bold text-amber-700">{total}</span>
        </div>
        <p className="text-xs text-gray-600">
          {alerts?.belowReorderCount ?? 0} bajo mínimo · {alerts?.outOfStockCount ?? 0} sin stock
        </p>
        {top.length > 0 && (
          <ul className="space-y-1 text-sm">
            {top.map((t) => (
              <li key={t.catalogItemId} className="flex items-center justify-between border-t pt-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Package className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span className="font-mono text-xs">{t.code}</span>
                  <span className="truncate text-gray-700">{t.description ?? ''}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-500">
                    {t.currentQty.toFixed(0)}/{t.reorderLevel?.toFixed(0) ?? '—'}
                  </span>
                  <StockStatusBadge status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/inventario?filter=below-reorder"
          className="flex items-center justify-end text-sm text-blue-600 hover:underline"
        >
          Ver todos <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </CardContent>
    </Card>
  );
}
