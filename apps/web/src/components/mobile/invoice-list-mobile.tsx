'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { useApi } from '@/hooks/use-api';
import { apiFetch } from '@/lib/api';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '@/store';
import { FileText, RefreshCw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface InvoiceItem {
  id: string;
  codigoGeneracion: string;
  tipoDte: string;
  estado: string;
  totalPagar: number;
  receptorNombre?: string;
  createdAt: string;
}

interface InvoiceResponse {
  data: InvoiceItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PROCESADO: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'Procesado' },
  RECHAZADO: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', label: 'Rechazado' },
  PENDIENTE: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', label: 'Pendiente' },
  OFFLINE_PENDING: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', label: 'Offline' },
  ANULADO: { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Anulado' },
};

export function InvoiceListMobile() {
  const { isOnline } = useOnlineStatus();
  const tenant = useAppStore((s) => s.tenant);

  const { data: onlineData, isLoading, refetch } = useApi<InvoiceResponse>(
    isOnline ? '/dte?limit=50&sort=createdAt:desc' : null,
    () => apiFetch<InvoiceResponse>('/dte?limit=50&sortBy=createdAt&sortOrder=desc'),
  );

  const offlineInvoices = useLiveQuery(
    () => tenant?.id
      ? db.invoices
          .where('tenantId')
          .equals(tenant.id)
          .reverse()
          .sortBy('createdAt')
      : [],
    [tenant?.id],
  );

  const onlineInvoices = onlineData?.data || [];

  const invoices: InvoiceItem[] = isOnline ? onlineInvoices : (offlineInvoices || []).map(inv => ({
    id: inv.serverId || `local_${inv.localId}`,
    codigoGeneracion: inv.codigoGeneracion,
    tipoDte: inv.tipoDte,
    estado: inv.estado,
    totalPagar: inv.totalPagar,
    receptorNombre: inv.receptorNombre,
    createdAt: inv.createdAt,
  }));

  return (
    <div className="space-y-2">
      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-600 dark:text-yellow-400">
          <WifiOff className="h-3.5 w-3.5" />
          Mostrando datos guardados localmente
        </div>
      )}

      {/* Refresh button */}
      {isOnline && (
        <button
          onClick={() => refetch()}
          className="flex w-full items-center justify-center gap-2 py-2 text-xs text-muted-foreground active:text-foreground"
        >
          <RefreshCw className="h-3 w-3" />
          Actualizar
        </button>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {/* Invoice cards */}
      {invoices.map((inv) => {
        const status = STATUS_STYLES[inv.estado] || STATUS_STYLES.PENDIENTE;
        return (
          <Link
            key={inv.codigoGeneracion || inv.id}
            href={`/es/facturas/${inv.id}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 active:bg-accent/50 transition-colors"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {inv.receptorNombre || 'Sin cliente'}
              </p>
              <p className="text-xs text-muted-foreground">
                ${Number(inv.totalPagar).toFixed(2)}
              </p>
            </div>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', status.bg, status.text)}>
              {status.label}
            </span>
          </Link>
        );
      })}

      {/* Empty state */}
      {invoices.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">No hay facturas recientes</p>
          <p className="text-xs mt-1">Crea tu primera factura con el boton +</p>
        </div>
      )}
    </div>
  );
}
