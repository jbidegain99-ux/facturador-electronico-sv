'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ClipboardList,
  Plus,
  Search,
  Pencil,
  Trash2,
  Send,
  Eye,
  ArrowRight,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import { PageSizeSelector } from '@/components/ui/page-size-selector';
import { formatCurrency } from '@/lib/utils';

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
}

interface QuotesResponse {
  data: Quote[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Status config ────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: '', label: 'Todas' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'SENT', label: 'Enviadas' },
  { value: 'APPROVED', label: 'Aprobadas' },
  { value: 'CONVERTED', label: 'Convertidas' },
];

interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  DRAFT: { label: 'Borrador', variant: 'secondary', className: 'bg-gray-600/20 text-gray-400 border-gray-600/30' },
  SENT: { label: 'Enviada', variant: 'default', className: 'bg-blue-600/20 text-blue-400 border-blue-600/30' },
  APPROVED: { label: 'Aprobada', variant: 'default', className: 'bg-green-600/20 text-green-400 border-green-600/30' },
  REJECTED: { label: 'Rechazada', variant: 'destructive', className: 'bg-red-600/20 text-red-400 border-red-600/30' },
  EXPIRED: { label: 'Expirada', variant: 'outline', className: 'bg-amber-600/20 text-amber-400 border-amber-600/30' },
  CONVERTED: { label: 'Convertida', variant: 'default', className: 'bg-purple-600/20 text-purple-400 border-purple-600/30' },
  CANCELLED: { label: 'Cancelada', variant: 'secondary', className: 'bg-gray-700/20 text-gray-500 border-gray-700/30' },
};

function QuoteStatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-SV', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ── Component ────────────────────────────────────────────────────────

export default function CotizacionesPage() {
  const router = useRouter();
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  // State
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  // Filters
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [sortBy, setSortBy] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  // Action state
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<Quote | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────

  const fetchQuotes = React.useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No hay sesion activa');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`${apiUrl}/quotes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Error al cargar cotizaciones');
      }

      const data: QuotesResponse = await res.json().catch(() => ({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      }));

      const items = Array.isArray(data?.data) ? data.data : [];
      const parsedTotal = Number(data?.total);
      const parsedPages = Number(data?.totalPages);

      setQuotes(items);
      setTotal(!isNaN(parsedTotal) ? parsedTotal : items.length);
      setTotalPages(!isNaN(parsedPages) && parsedPages >= 1 ? parsedPages : 1);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, limit, sortBy, sortOrder]);

  React.useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Debounced search reset
  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // ── Actions ────────────────────────────────────────────────────────

  const handleAction = async (
    quoteId: string,
    action: string,
    body?: Record<string, unknown>,
  ) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(quoteId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/quotes/${quoteId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { message?: string }).message || `Error al ${action}`,
        );
      }

      toastRef.current.success('Accion realizada correctamente');
      fetchQuotes();
    } catch (err) {
      toastRef.current.error(
        err instanceof Error ? err.message : 'Error desconocido',
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(deleteConfirm.id);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/quotes/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { message?: string }).message || 'Error al eliminar',
        );
      }

      setDeleteConfirm(null);
      toastRef.current.success('Cotizacion eliminada');
      fetchQuotes();
    } catch (err) {
      toastRef.current.error(
        err instanceof Error ? err.message : 'Error desconocido',
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvert = async (quoteId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(quoteId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/quotes/${quoteId}/convert`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { message?: string }).message ||
            'Error al convertir',
        );
      }

      const result = await res.json().catch(() => ({}));
      toastRef.current.success('Cotizacion convertida a factura');

      if ((result as { invoice?: { id?: string } }).invoice?.id) {
        router.push(
          `/facturas/${(result as { invoice: { id: string } }).invoice.id}`,
        );
      } else {
        fetchQuotes();
      }
    } catch (err) {
      toastRef.current.error(
        err instanceof Error ? err.message : 'Error desconocido',
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ── Sort handler ───────────────────────────────────────────────────

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  function SortIcon({ field }: { field: string }) {
    if (sortBy !== field) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1 text-primary" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1 text-primary" />
    );
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Cotizaciones
          </h1>
          <p className="text-muted-foreground text-sm">
            Gestiona tus cotizaciones y conviertelas en facturas
          </p>
        </div>
        <Button
          onClick={() => router.push('/cotizaciones/nueva')}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cotizacion
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === tab.value
                ? 'bg-primary text-white'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + page size */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por numero o cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <PageSizeSelector value={limit} onChange={handleLimitChange} />
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
          <Button
            variant="link"
            className="ml-2 text-red-700"
            onClick={fetchQuotes}
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable rows={5} />
          ) : quotes.length === 0 ? (
            <div className="py-16 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {search || statusFilter
                  ? 'No se encontraron cotizaciones con esos filtros'
                  : 'No tienes cotizaciones aun'}
              </p>
              {!search && !statusFilter && (
                <Button
                  className="mt-4 btn-primary"
                  onClick={() => router.push('/cotizaciones/nueva')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primera cotizacion
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('quoteNumber')}
                  >
                    <span className="flex items-center">
                      Numero <SortIcon field="quoteNumber" />
                    </span>
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('issueDate')}
                  >
                    <span className="flex items-center">
                      Fecha <SortIcon field="issueDate" />
                    </span>
                  </TableHead>
                  <TableHead>Valida hasta</TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => handleSort('total')}
                  >
                    <span className="flex items-center justify-end">
                      Total <SortIcon field="total" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('status')}
                  >
                    <span className="flex items-center">
                      Estado <SortIcon field="status" />
                    </span>
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow
                    key={quote.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/cotizaciones/${quote.id}`)}
                  >
                    <TableCell className="font-medium text-primary">
                      {quote.quoteNumber}
                    </TableCell>
                    <TableCell>
                      {quote.client?.nombre || 'Sin cliente'}
                    </TableCell>
                    <TableCell>{formatDate(quote.issueDate)}</TableCell>
                    <TableCell>{formatDate(quote.validUntil)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(quote.total))}
                    </TableCell>
                    <TableCell>
                      <QuoteStatusBadge status={quote.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {quote.status === 'DRAFT' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                router.push(
                                  `/cotizaciones/nueva?edit=${quote.id}`,
                                )
                              }
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-400 hover:text-blue-300"
                              onClick={() =>
                                handleAction(quote.id, 'send')
                              }
                              disabled={actionLoading === quote.id}
                              title="Enviar"
                            >
                              {actionLoading === quote.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-300"
                              onClick={() => setDeleteConfirm(quote)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {quote.status === 'SENT' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              router.push(`/cotizaciones/${quote.id}`)
                            }
                            title="Ver"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {quote.status === 'APPROVED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-400 hover:text-purple-300"
                            onClick={() => handleConvert(quote.id)}
                            disabled={actionLoading === quote.id}
                            title="Convertir a factura"
                          >
                            {actionLoading === quote.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <ArrowRight className="h-4 w-4 mr-1" />
                            )}
                            Facturar
                          </Button>
                        )}
                        {quote.status === 'CONVERTED' &&
                          quote.convertedToInvoiceId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary"
                              onClick={() =>
                                router.push(
                                  `/facturas/${quote.convertedToInvoiceId}`,
                                )
                              }
                              title="Ver factura"
                            >
                              Ver Factura
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          )}
                        {(quote.status === 'REJECTED' ||
                          quote.status === 'EXPIRED' ||
                          quote.status === 'CANCELLED') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              router.push(`/cotizaciones/${quote.id}`)
                            }
                            title="Ver"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && quotes.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          showing={quotes.length}
          onPageChange={setPage}
        />
      )}

      {/* Delete confirm dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Cotizacion</DialogTitle>
            <DialogDescription>
              Estas seguro de que deseas eliminar la cotizacion{' '}
              <strong>{deleteConfirm?.quoteNumber}</strong>? Esta accion no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading === deleteConfirm?.id}
            >
              {actionLoading === deleteConfirm?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
