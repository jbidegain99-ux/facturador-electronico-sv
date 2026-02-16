'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { PageSizeSelector } from '@/components/ui/page-size-selector';
import { formatDate } from '@/lib/utils';
import { usePlanFeatures } from '@/hooks/use-plan-features';
import { UpsellBanner } from '@/components/ui/upsell-banner';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Search,
  Pause,
  Play,
  XCircle,
  Eye,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Repeat,
} from 'lucide-react';

interface RecurringTemplate {
  id: string;
  nombre: string;
  tipoDte: string;
  interval: string;
  mode: string;
  autoTransmit: boolean;
  status: string;
  nextRunDate: string;
  lastRunDate: string | null;
  consecutiveFailures: number;
  createdAt: string;
  cliente: {
    id: string;
    nombre: string;
    numDocumento: string;
  };
  _count: {
    history: number;
  };
}

interface TemplateResponse {
  data: RecurringTemplate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  SUSPENDED_ERROR: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

function RecurrentesUpsell() {
  const t = useTranslations('recurring');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Repeat className="h-6 w-6" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('subtitle')}
        </p>
      </div>

      <UpsellBanner
        title={t('upsellTitle')}
        description={t('upsellDesc')}
        features={[
          t('upsellFeature1'),
          t('upsellFeature2'),
          t('upsellFeature3'),
          t('upsellFeature4'),
        ]}
      />
    </div>
  );
}

export default function RecurrentesPage() {
  const t = useTranslations('recurring');
  const tCommon = useTranslations('common');
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;
  const { confirm, ConfirmDialog } = useConfirm();
  const { features, loading: planLoading } = usePlanFeatures();

  const STATUS_LABELS: Record<string, string> = {
    ACTIVE: t('statusActive'),
    PAUSED: t('statusPaused'),
    SUSPENDED_ERROR: t('statusSuspended'),
    CANCELLED: t('statusCancelled'),
  };

  const INTERVAL_LABELS: Record<string, string> = {
    DAILY: t('freqDaily'),
    WEEKLY: t('freqWeekly'),
    MONTHLY: t('freqMonthly'),
    YEARLY: t('freqYearly'),
  };

  const TABS = [
    { key: '', label: t('allTab') },
    { key: 'ACTIVE', label: t('activeTab') },
    { key: 'PAUSED', label: t('pausedTab') },
    { key: 'CANCELLED', label: t('cancelledTab') },
  ];

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [sortBy, setSortBy] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [templates, setTemplates] = React.useState<RecurringTemplate[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const fetchTemplates = React.useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recurring-invoices?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) {
        if (res.status === 404) {
          setFetchError(t('serviceUnavailable'));
          return;
        }
        throw new Error(`Error (${res.status})`);
      }

      const data: TemplateResponse = await res.json();
      setTemplates(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar facturas recurrentes';
      setFetchError(message);
      toastRef.current.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, sortBy, sortOrder]);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleAction = async (id: string, action: 'pause' | 'resume' | 'cancel' | 'trigger') => {
    const successLabels: Record<string, string> = {
      pause: t('pauseSuccess'),
      resume: t('resumeSuccess'),
      cancel: t('cancelSuccess'),
      trigger: t('executeSuccess'),
    };

    if (action === 'cancel') {
      const ok = await confirm({
        title: t('cancelTemplate'),
        description: t('cancelConfirm'),
        confirmText: t('cancelTemplate'),
        variant: 'destructive',
      });
      if (!ok) return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recurring-invoices/${id}/${action}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || tCommon('error'));
      }

      toast.success(successLabels[action]);
      fetchTemplates();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon('error'));
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Show upsell banner if plan doesn't support recurring invoices
  if (!planLoading && !features.recurringInvoices) {
    return <RecurrentesUpsell />;
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Repeat className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        {!fetchError && (
          <Link href="/facturas/recurrentes/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('newTemplate')}
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              statusFilter === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Templates</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 w-64"
                />
              </div>
              <PageSizeSelector value={limit} onChange={handleLimitChange} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable rows={5} />
          ) : fetchError ? (
            <div className="text-center py-12">
              <Repeat className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">{fetchError}</p>
              <Button variant="outline" className="mt-4" onClick={fetchTemplates}>
                {tCommon('retry')}
              </Button>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <Repeat className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">{t('noTemplates')}</p>
              <Link href="/facturas/recurrentes/nuevo">
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('createFirst')}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('nombre')}
                    >
                      <div className="flex items-center">
                        {t('templateName')} {getSortIcon('nombre')}
                      </div>
                    </TableHead>
                    <TableHead>{tCommon('name')}</TableHead>
                    <TableHead>{tCommon('type')}</TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('nextRunDate')}
                    >
                      <div className="flex items-center">
                        {t('nextExecution')} {getSortIcon('nextRunDate')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        {tCommon('status')} {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead>{t('executions')}</TableHead>
                    <TableHead className="text-right">{tCommon('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((tmpl) => (
                    <TableRow key={tmpl.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/facturas/recurrentes/${tmpl.id}`}
                          className="hover:underline text-primary"
                        >
                          {tmpl.nombre}
                        </Link>
                      </TableCell>
                      <TableCell>{tmpl.cliente.nombre}</TableCell>
                      <TableCell>{INTERVAL_LABELS[tmpl.interval] || tmpl.interval}</TableCell>
                      <TableCell>
                        {tmpl.status === 'ACTIVE'
                          ? formatDate(tmpl.nextRunDate)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_COLORS[tmpl.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {STATUS_LABELS[tmpl.status] || tmpl.status}
                        </span>
                      </TableCell>
                      <TableCell>{tmpl._count.history}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/facturas/recurrentes/${tmpl.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title={t('viewDetail')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {tmpl.status === 'ACTIVE' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleAction(tmpl.id, 'trigger')}
                                title={t('executeNow')}
                              >
                                <Zap className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleAction(tmpl.id, 'pause')}
                                title={t('pause')}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {(tmpl.status === 'PAUSED' || tmpl.status === 'SUSPENDED_ERROR') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleAction(tmpl.id, 'resume')}
                              title={t('resume')}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {tmpl.status !== 'CANCELLED' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleAction(tmpl.id, 'cancel')}
                              title={tCommon('cancel')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                showing={templates.length}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
