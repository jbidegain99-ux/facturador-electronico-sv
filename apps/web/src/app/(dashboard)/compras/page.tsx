'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Download,
  Eye,
  Pencil,
  CreditCard,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ProveedorSearch } from '@/components/purchases/proveedor-search';
import { ComprasTabsNav } from '@/components/purchases/compras-tabs-nav';
import type { Purchase, PurchaseStatus, Proveedor } from '@/types/purchase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchasesResponse {
  data: Purchase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BadgeVariant = 'secondary' | 'default' | 'success' | 'destructive';

const STATUS_BADGE: Record<PurchaseStatus, { variant: BadgeVariant; label: string }> = {
  DRAFT:    { variant: 'secondary',   label: 'Borrador' },
  POSTED:   { variant: 'default',     label: 'Registrada' },
  PAID:     { variant: 'success',     label: 'Pagada' },
  ANULADA:  { variant: 'destructive', label: 'Anulada' },
};

const ALL_STATUSES: PurchaseStatus[] = ['DRAFT', 'POSTED', 'PAID', 'ANULADA'];

const PAGE_SIZE = 20;

/** Default date range: 1st of current month → today */
function defaultDateRange(): { desde: string; hasta: string } {
  const now = new Date();
  const desde = new Date(now.getFullYear(), now.getMonth(), 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { desde: fmt(desde), hasta: fmt(now) };
}

function toNumber(v: number | { toNumber?: () => number } | unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === 'function') {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

// ─── Status Badge Component ───────────────────────────────────────────────────

function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  const cfg = STATUS_BADGE[status] ?? { variant: 'secondary' as BadgeVariant, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComprasPage() {
  const router = useRouter();
  const toast = useToast();

  const { desde: defaultDesde, hasta: defaultHasta } = React.useMemo(defaultDateRange, []);

  // ── State ──
  const [purchases, setPurchases]     = React.useState<Purchase[]>([]);
  const [total, setTotal]             = React.useState(0);
  const [totalPages, setTotalPages]   = React.useState(1);
  const [loading, setLoading]         = React.useState(true);
  const [loadError, setLoadError]     = React.useState<string | null>(null);

  // Filters
  const [selectedProveedor, setSelectedProveedor] = React.useState<Proveedor | undefined>(undefined);
  const [filterEstado, setFilterEstado]   = React.useState<PurchaseStatus | 'all'>('all');
  const [desde, setDesde]                 = React.useState(defaultDesde);
  const [hasta, setHasta]                 = React.useState(defaultHasta);
  const [page, setPage]                   = React.useState(1);

  // ── Fetch ──
  const fetchPurchases = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(PAGE_SIZE),
      });
      if (selectedProveedor) params.set('proveedorId', selectedProveedor.id);
      if (filterEstado !== 'all') params.set('estado', filterEstado);
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);

      const data = await apiFetch<PurchasesResponse>(`/purchases?${params}`);
      const items = Array.isArray(data?.data) ? data.data : [];
      setPurchases(items);
      setTotal(Number(data?.total) || items.length);
      setTotalPages(Number(data?.totalPages) >= 1 ? Number(data.totalPages) : 1);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error al cargar compras');
    } finally {
      setLoading(false);
    }
  }, [page, selectedProveedor, filterEstado, desde, hasta]);

  React.useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [selectedProveedor, filterEstado, desde, hasta]);

  // ── Handlers ──
  const handleClearProveedor = () => setSelectedProveedor(undefined);

  const handleImportDte = () => {
    toast.info('Importar DTE disponible proxímamente');
  };

  // ── Render ──
  return (
    <div className="space-y-6 p-4 md:p-6 relative pb-24 md:pb-6">

      {/* ── Sub-nav ─────────────────────────────────────────────────────── */}
      <ComprasTabsNav />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Compras</h1>
              {!loading && (
                <Badge variant="secondary" className="text-xs">
                  {total}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Cargando...' : `${total} compras en el período`}
            </p>
          </div>
        </div>

        {/* Action buttons — desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="outline" onClick={handleImportDte} className="gap-2">
            <Download className="w-4 h-4" />
            Importar DTE
          </Button>
          <Button onClick={() => router.push('/compras/nueva')} className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva compra manual
          </Button>
        </div>
      </div>

      {/* ── Filters toolbar ─────────────────────────────────────────────── */}
      <Card className="sticky top-0 z-10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          {/* Proveedor search */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ProveedorSearch
                selected={selectedProveedor}
                onSelect={(p) => setSelectedProveedor(p)}
              />
            </div>
            {selectedProveedor && (
              <Button variant="ghost" size="sm" onClick={handleClearProveedor} className="shrink-0">
                Limpiar
              </Button>
            )}
          </div>

          {/* Estado pills + date range */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Estado pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterEstado('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterEstado === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Todos
              </button>
              {ALL_STATUSES.map((s) => {
                const cfg = STATUS_BADGE[s];
                const isActive = filterEstado === s;
                return (
                  <button
                    key={s}
                    onClick={() => setFilterEstado(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2 sm:ml-auto">
              <Input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-[140px] text-sm"
                aria-label="Desde"
              />
              <span className="text-muted-foreground text-sm">—</span>
              <Input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-[140px] text-sm"
                aria-label="Hasta"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {loadError && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <p>{loadError}</p>
          <Button variant="outline" size="sm" onClick={fetchPurchases}>
            Reintentar
          </Button>
        </div>
      )}

      {/* ── Table (desktop) ─────────────────────────────────────────────── */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <SkeletonTable rows={8} />
            </div>
          ) : purchases.length === 0 ? (
            /* Empty state */
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <ShoppingCart className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-lg font-medium text-muted-foreground">No hay compras registradas</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Registra tu primera compra para comenzar
                </p>
              </div>
              <Button onClick={() => router.push('/compras/nueva')} className="gap-2">
                <Plus className="w-4 h-4" />
                Registra tu primera compra
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]"># Control / Doc</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">IVA</TableHead>
                      <TableHead className="text-right">Retenciones</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right w-[120px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((p) => {
                      const retenciones = toNumber(p.ivaRetenido) + toNumber(p.isrRetenido);
                      const isDraft  = p.estado === 'DRAFT';
                      const canPay   = p.estado === 'POSTED' && toNumber(p.saldoPendiente) > 0;

                      return (
                        <TableRow key={p.id} className="group">
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                              {p.numDocumentoProveedor || p.id.slice(0, 8)}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium truncate max-w-[200px]">
                                {p.proveedor?.nombre ?? '—'}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {p.tipoDoc}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(p.fechaDoc)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(toNumber(p.subtotal))}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {formatCurrency(toNumber(p.iva))}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {retenciones > 0
                              ? formatCurrency(retenciones)
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">
                            {formatCurrency(toNumber(p.total))}
                          </TableCell>
                          <TableCell>
                            <PurchaseStatusBadge status={p.estado} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              {/* Ver */}
                              <Link href={`/compras/${p.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalle">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {/* Editar — solo DRAFT */}
                              {isDraft && (
                                <Link href={`/compras/${p.id}/editar`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                              {/* Pagar — POSTED con saldo */}
                              {canPay && (
                                <Link href={`/compras/${p.id}?pagar=1`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" title="Pagar">
                                    <CreditCard className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                showing={purchases.length}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Mobile cards ─────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <Card>
            <CardContent className="p-6">
              <SkeletonTable rows={5} />
            </CardContent>
          </Card>
        ) : purchases.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                <ShoppingCart className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">No hay compras registradas</p>
              <p className="text-sm text-muted-foreground">Registra tu primera compra para comenzar</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {purchases.map((p) => (
              <Link key={p.id} href={`/compras/${p.id}`}>
                <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {p.proveedor?.nombre ?? '—'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {p.tipoDoc} · {p.numDocumentoProveedor || p.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(p.fechaDoc)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <p className="font-bold tabular-nums">
                          {formatCurrency(toNumber(p.total))}
                        </p>
                        <PurchaseStatusBadge status={p.estado} />
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground self-center shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {/* Mobile pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1 || loading}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages || loading}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── FAB — mobile only ────────────────────────────────────────────── */}
      <button
        onClick={() => router.push('/compras/nueva')}
        className="sm:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Nueva compra"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
