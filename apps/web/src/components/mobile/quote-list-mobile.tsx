'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { useApi } from '@/hooks/use-api';
import { apiFetch } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { ClipboardList, RefreshCw, WifiOff, Pencil, Eye, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

// ── Types ────────────────────────────────────────────────────────────

interface QuoteClient {
  id: string;
  nombre: string;
  numDocumento: string;
}

interface Quote {
  id: string;
  quoteNumber: string;
  clienteId: string;
  client?: QuoteClient | null;
  issueDate: string;
  validUntil: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  convertedToInvoiceId?: string | null;
  version?: number;
}

interface QuotesResponse {
  data: Quote[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Status styles ────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; labelKey: string }> = {
  DRAFT:              { bg: 'bg-gray-500/10',    text: 'text-gray-500 dark:text-gray-400',     labelKey: 'statusDraft' },
  SENT:               { bg: 'bg-blue-500/10',    text: 'text-blue-600 dark:text-blue-400',     labelKey: 'statusSent' },
  APPROVED:           { bg: 'bg-green-500/10',   text: 'text-green-600 dark:text-green-400',   labelKey: 'statusApproved' },
  PARTIALLY_APPROVED: { bg: 'bg-orange-500/10',  text: 'text-orange-600 dark:text-orange-400', labelKey: 'statusPartial' },
  REJECTED:           { bg: 'bg-red-500/10',     text: 'text-red-600 dark:text-red-400',       labelKey: 'statusRejected' },
  CONVERTED:          { bg: 'bg-purple-500/10',  text: 'text-purple-600 dark:text-purple-400', labelKey: 'statusConverted' },
  CHANGES_REQUESTED:  { bg: 'bg-orange-500/10',  text: 'text-orange-600 dark:text-orange-400', labelKey: 'statusChangesRequested' },
  EXPIRED:            { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',   labelKey: 'statusExpired' },
  CANCELLED:          { bg: 'bg-gray-500/10',    text: 'text-gray-500 dark:text-gray-400',     labelKey: 'statusCancelled' },
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// ── Component ────────────────────────────────────────────────────────

export function QuoteListMobile() {
  const { isOnline } = useOnlineStatus();
  const router = useRouter();
  const t = useTranslations('quotes');

  const { data, isLoading, refetch } = useApi<QuotesResponse>(
    isOnline ? '/quotes?limit=50&sortBy=createdAt&sortOrder=desc' : null,
    () => apiFetch<QuotesResponse>('/quotes?limit=50&sortBy=createdAt&sortOrder=desc'),
  );

  const quotes = isOnline ? (data?.data || []) : [];

  return (
    <div className="md:hidden space-y-2">
      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-600 dark:text-yellow-400">
          <WifiOff className="h-3.5 w-3.5" />
          {t('offlineNoQuotes') ?? 'Las cotizaciones no estan disponibles sin conexion'}
        </div>
      )}

      {/* Refresh button */}
      {isOnline && (
        <button
          onClick={() => refetch()}
          className="flex w-full items-center justify-center gap-2 py-2 text-xs text-muted-foreground active:text-foreground"
        >
          <RefreshCw className="h-3 w-3" />
          {t('refresh') ?? 'Actualizar'}
        </button>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {/* Quote cards */}
      {quotes.map((quote) => {
        const status = STATUS_STYLES[quote.status] || STATUS_STYLES.DRAFT;
        return (
          <div
            key={quote.id}
            className="rounded-lg border border-border bg-card p-3 space-y-2 active:bg-accent/50 transition-colors"
            onClick={() => router.push(`/cotizaciones/${quote.id}`)}
          >
            {/* Top row: client name + status badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {quote.client?.nombre || t('client')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {quote.quoteNumber}
                  {quote.version != null && quote.version > 1 && (
                    <span className="ml-1 text-[10px] font-semibold text-muted-foreground">v{quote.version}</span>
                  )}
                </p>
              </div>
              <Badge className={cn('shrink-0 text-[10px] px-2 py-0.5', status.bg, status.text, 'border-0')}>
                {t(status.labelKey)}
              </Badge>
            </div>

            {/* Bottom row: total, date, action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">
                  {formatCurrency(Number(quote.total))}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(quote.issueDate)}
                </span>
              </div>

              {/* Quick action per status */}
              <div onClick={(e) => e.stopPropagation()}>
                {quote.status === 'DRAFT' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => router.push(`/cotizaciones/nueva?edit=${quote.id}`)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    {t('edit') ?? 'Editar'}
                  </Button>
                )}
                {quote.status === 'SENT' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => router.push(`/cotizaciones/${quote.id}`)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {t('viewLink') ?? 'Ver'}
                  </Button>
                )}
                {(quote.status === 'APPROVED' || quote.status === 'PARTIALLY_APPROVED') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-purple-500"
                    onClick={() => router.push(`/cotizaciones/${quote.id}`)}
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    {t('convertToInvoice')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {quotes.length === 0 && !isLoading && isOnline && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <ClipboardList className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">{t('noQuotes')}</p>
          <Button
            className="mt-4 btn-primary"
            size="sm"
            onClick={() => router.push('/cotizaciones/nueva')}
          >
            {t('createFirst')}
          </Button>
        </div>
      )}

      {/* Offline empty state */}
      {!isOnline && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <WifiOff className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">{t('offlineNoQuotes') ?? 'Sin conexion'}</p>
          <p className="text-xs mt-1">{t('offlineNoQuotesDesc') ?? 'Las cotizaciones se mostraran cuando vuelvas a estar en linea'}</p>
        </div>
      )}
    </div>
  );
}
