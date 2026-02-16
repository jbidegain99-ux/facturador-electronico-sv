'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DTEStatusBadge } from '@/components/dte/dte-status-badge';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { HaciendaConfigBanner, useHaciendaStatus } from '@/components/HaciendaConfigBanner';
import { formatCurrency, formatDate, getTipoDteName } from '@/lib/utils';
import { Plus, Search, Download, Eye, Ban, Copy, FileText, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DTEStatus, TipoDte } from '@/types';
import { useTranslations } from 'next-intl';
import { Pagination } from '@/components/ui/pagination';
import { PageSizeSelector } from '@/components/ui/page-size-selector';

interface DTE {
  id: string;
  numeroControl: string;
  codigoGeneracion: string;
  tipoDte: TipoDte;
  estado: DTEStatus;
  totalPagar: number | { toNumber: () => number };
  selloRecepcion?: string;
  createdAt: string;
  cliente?: {
    nombre: string;
    numDocumento: string;
  };
}

interface DTEResponse {
  data: DTE[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function FacturasPage() {
  const t = useTranslations('invoices');
  const tCommon = useTranslations('common');
  const tStatuses = useTranslations('statuses');
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const { isConfigured: isHaciendaConfigured, isLoading: isLoadingHacienda, demoMode } = useHaciendaStatus();

  // Can create invoices if Hacienda is configured OR in demo mode
  const canCreateInvoice = isHaciendaConfigured || demoMode;
  const showHaciendaBanner = !isLoadingHacienda && !isHaciendaConfigured && !demoMode;

  const [search, setSearch] = React.useState('');
  const [filterTipo, setFilterTipo] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [sortBy, setSortBy] = React.useState<string>('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [dtes, setDtes] = React.useState<DTE[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDTEs = React.useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError(tCommon('noSession'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      if (filterTipo !== 'all') params.set('tipoDte', filterTipo);
      if (filterStatus !== 'all') params.set('estado', filterStatus);
      if (search) params.set('search', search);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dte?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || t('loadError'));
      }

      const data = await res.json();
      // Defensive: handle both {data: [...], total, ...} and plain array responses
      const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const parsedTotal = Number(data?.total);
      const parsedTotalPages = Number(data?.totalPages);
      setDtes(items);
      setTotal(!isNaN(parsedTotal) ? parsedTotal : items.length);
      setTotalPages(!isNaN(parsedTotalPages) && parsedTotalPages >= 1 ? parsedTotalPages : 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching DTEs:', err);
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterTipo, filterStatus, search, sortBy, sortOrder]);

  // Fetch on mount and when filters change
  React.useEffect(() => {
    fetchDTEs();
  }, [fetchDTEs]);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filterTipo, filterStatus]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'createdAt' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const handleDownload = async (dteId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dte/${dteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(t('downloadError'));

      const data = await res.json();
      const jsonStr = JSON.stringify(data.jsonOriginal || data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DTE-${data.codigoGeneracion}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('downloadSuccess'));
    } catch (err) {
      console.error('Error downloading DTE:', err);
      toast.error(t('downloadError'));
    }
  };

  const handleDownloadPdf = async (dte: DTE) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dte/${dte.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(t('pdfError'));

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DTE-${dte.numeroControl || dte.codigoGeneracion}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('pdfSuccess'));
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error(t('pdfError'));
    }
  };

  const handleAnular = async (dte: DTE) => {
    const confirmed = await confirm({
      title: t('voidDocument'),
      description: t('voidConfirm', { controlNumber: dte.numeroControl }),
      confirmText: t('yesVoid'),
      cancelText: tCommon('cancel'),
      variant: 'destructive',
    });

    if (!confirmed) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dte/${dte.id}/anular`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(t('voidError'));

      toast.success(t('voidSuccess'));
      fetchDTEs(); // Refresh the list
    } catch (err) {
      console.error('Error anulando DTE:', err);
      toast.error(t('voidError'));
    }
  };

  const getTotalPagar = (dte: DTE): number => {
    if (typeof dte.totalPagar === 'number') return dte.totalPagar;
    if (typeof dte.totalPagar === 'string') return parseFloat(dte.totalPagar) || 0;
    if (dte.totalPagar && typeof dte.totalPagar.toNumber === 'function') {
      return dte.totalPagar.toNumber();
    }
    // Handle Prisma Decimal object format
    if (dte.totalPagar && typeof dte.totalPagar === 'object') {
      const val = (dte.totalPagar as any).toString?.() || (dte.totalPagar as any).value;
      return parseFloat(val) || 0;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Hacienda Configuration Banner */}
      {showHaciendaBanner && (
        <HaciendaConfigBanner variant="prominent" className="mb-2" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        {canCreateInvoice ? (
          <Link href="/facturas/nueva">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('newInvoice')}
            </Button>
          </Link>
        ) : (
          <Button disabled title={t('configureFirst')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('newInvoice')}
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
          <Button variant="link" className="ml-2 text-red-700" onClick={fetchDTEs}>
            {tCommon('retry')}
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tCommon('filter')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo DTE" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTypes')}</SelectItem>
                <SelectItem value="01">{t('invoice')}</SelectItem>
                <SelectItem value="03">Credito Fiscal</SelectItem>
                <SelectItem value="05">Nota de Credito</SelectItem>
                <SelectItem value="06">Nota de Debito</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                <SelectItem value="PENDIENTE">{tStatuses('pending')}</SelectItem>
                <SelectItem value="FIRMADO">{tStatuses('signed')}</SelectItem>
                <SelectItem value="PROCESADO">{tStatuses('processed')}</SelectItem>
                <SelectItem value="RECHAZADO">{tStatuses('rejected')}</SelectItem>
                <SelectItem value="ANULADO">{tStatuses('voided')}</SelectItem>
              </SelectContent>
            </Select>
            <PageSizeSelector value={limit} onChange={handleLimitChange} />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <SkeletonTable rows={10} />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        className="flex items-center hover:text-foreground transition-colors"
                        onClick={() => handleSort('createdAt')}
                      >
                        {tCommon('date')}
                        {getSortIcon('createdAt')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center hover:text-foreground transition-colors"
                        onClick={() => handleSort('numeroControl')}
                      >
                        {t('controlNumber')}
                        {getSortIcon('numeroControl')}
                      </button>
                    </TableHead>
                    <TableHead>{tCommon('type')}</TableHead>
                    <TableHead>{t('client')}</TableHead>
                    <TableHead className="text-right">
                      <button
                        className="flex items-center justify-end hover:text-foreground transition-colors ml-auto"
                        onClick={() => handleSort('totalPagar')}
                      >
                        {tCommon('total')}
                        {getSortIcon('totalPagar')}
                      </button>
                    </TableHead>
                    <TableHead>{tCommon('status')}</TableHead>
                    <TableHead className="text-right">{tCommon('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dtes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {search || filterTipo !== 'all' || filterStatus !== 'all'
                          ? t('noDocsFilter')
                          : t('noDocs')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    dtes.map((dte) => (
                      <TableRow key={dte.id}>
                        <TableCell className="font-medium">
                          {formatDate(dte.createdAt)}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {dte.numeroControl}
                          </code>
                        </TableCell>
                        <TableCell>{getTipoDteName(dte.tipoDte)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {dte.cliente?.nombre || t('noClient')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {dte.cliente?.numDocumento || '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(getTotalPagar(dte))}
                        </TableCell>
                        <TableCell>
                          <DTEStatusBadge status={dte.estado} size="sm" />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/facturas/${dte.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title={t('viewDetail')}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/facturas/nueva?duplicate=${dte.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title={t('duplicate')}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDownloadPdf(dte)}
                              title={t('downloadPdf')}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDownload(dte.id)}
                              title={t('downloadJson')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {dte.estado === 'PROCESADO' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                title={t('void')}
                                onClick={() => handleAnular(dte)}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                showing={dtes.length}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog />
    </div>
  );
}
