'use client';

import { useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { DollarSign, FileText, Users, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalInvoicesThisMonth: number;
  totalInvoicesLastMonth: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  totalClients: number;
  newClientsThisMonth: number;
  totalCatalogItems: number;
  invoicesByStatus: Record<string, number>;
  revenueByDay: Array<{ date: string; amount: number }>;
  topClients: Array<{ name: string; totalInvoices: number; totalRevenue: number }>;
  recentInvoices: Array<{
    id: string;
    numeroControl: string;
    tipoDte: string;
    clientName: string;
    total: number;
    status: string;
    date: string;
  }>;
}

interface StatCardsMobileProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

const CACHE_KEY = 'dashboard-stats';

export function StatCardsMobile({ stats, isLoading }: StatCardsMobileProps) {
  const { isOnline } = useOnlineStatus();

  // Cache stats to Dexie when we get new data
  useEffect(() => {
    if (stats) {
      db.appCache.put({ key: CACHE_KEY, value: JSON.stringify(stats) }).catch(() => {});
    }
  }, [stats]);

  // Read cached stats for offline
  const cachedEntry = useLiveQuery(() => db.appCache.get(CACHE_KEY), []);
  const cachedStats: DashboardStats | null = cachedEntry?.value
    ? JSON.parse(cachedEntry.value)
    : null;

  const displayStats = stats || cachedStats;

  const cards = [
    {
      label: 'Facturas',
      value: displayStats?.totalInvoicesThisMonth?.toString() ?? '\u2014',
      icon: FileText,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Ingresos',
      value: displayStats
        ? `$${displayStats.revenueThisMonth.toFixed(2)}`
        : '\u2014',
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Clientes',
      value: displayStats?.totalClients?.toString() ?? '\u2014',
      icon: Users,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-500/10',
    },
    {
      label: 'Productos',
      value: displayStats?.totalCatalogItems?.toString() ?? '\u2014',
      icon: Package,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="md:hidden">
      {!isOnline && cachedStats && (
        <p className="text-xs text-muted-foreground mb-2 px-1">
          Datos en cach\u00e9 — \u00faltima actualizaci\u00f3n disponible
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-3"
          >
            {isLoading && !cachedStats ? (
              <div className="space-y-2">
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                <div className="h-6 w-20 animate-pulse rounded bg-muted" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-md',
                      card.bg,
                    )}
                  >
                    <card.icon className={cn('h-3.5 w-3.5', card.color)} />
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {card.label}
                  </span>
                </div>
                <p className={cn('text-lg font-bold', card.color)}>
                  {card.value}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
