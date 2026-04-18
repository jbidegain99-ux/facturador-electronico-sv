'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Eye,
  RefreshCw,
  ArrowRightLeft,
  Download,
  Plus,
  Inbox,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { apiFetch, apiRawFetch } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ComprasTabsNav } from '@/components/purchases/compras-tabs-nav';
import type { ReceivedDteDetail, IngestStatus } from '@/types/purchase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReceivedDtesResponse {
  data: ReceivedDteDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type FilterEstado = IngestStatus | 'all' | 'Convertidos';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const TIPO_DTE_OPTIONS = ['01', '03', '05', '06', '07', '11', '14', '15'] as const;

const ESTADO_PILLS: { value: FilterEstado; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'VERIFIED', label: 'VERIFIED' },
  { value: 'UNVERIFIED', label: 'UNVERIFIED' },
  { value: 'FAILED', label: 'FAILED' },
  { value: 'Convertidos', label: 'Convertidos' },
];

type BadgeVariant = 'secondary' | 'default' | 'destructive' | 'outline';

const STATUS_BADGE: Record<string, { variant: BadgeVariant; label: string }> = {
  PENDING:    { variant: 'secondary',   label: 'PENDING' },
  VERIFIED:   { variant: 'default',     label: 'VERIFIED' },
  UNVERIFIED: { variant: 'outline',     label: 'UNVERIFIED' },
  FAILED:     { variant: 'destructive', label: 'FAILED' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultDateRange(): { desde: string; hasta: string } {
  const now = new Date();
  const desde = new Date(now.getFullYear(), now.getMonth(), 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { desde: fmt(desde), hasta: fmt(now) };
}

function IngestStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? { variant: 'secondary' as BadgeVariant, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecibidosPage() {
  const toast = useToast();

  const { desde: defaultDesde, hasta: defaultHasta } = React.useMemo(defaultDateRange, []);

  // ── State ──
  const [dtes, setDtes]               = React.useState<ReceivedDteDetail[]>([]);
  const [total, setTotal]             = React.useState(0);
  const [totalPages, setTotalPages]   = React.useState(1);
  const [loading, setLoading]         = React.useState(true);
  const [loadError, setLoadError]     = React.useState<string | null>(null);
  const [exporting, setExporting]     = React.useState(false);

  // Filters
  const [filterEstado, setFilterEstado] = React.useState<FilterEstado>('all');
  const [tipoDte, setTipoDte]           = React.useState<string>('all');
  const [search, setSearch]             = React.useState('');
  const [desde, setDesde]               = React.useState(defaultDesde);
  const [hasta, setHasta]               = React.useState(defaultHasta);
  const [page, setPage]                 = React.useState(1);

  // ── Build params ──
  const buildParams = React.useCallback(() => {
    const params = new URLSearchParams({
      page:  String(page),
      limit: String(PAGE_SIZE),
    });
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    if (filterEstado === 'Convertidos') {
      params.set('hasPurchase', 'true');
    } else if (filterEstado !== 'all') {
      params.set('status', filterEstado);
    }
    if (tipoDte && tipoDte !== 'all') params.set('tipoDte', tipoDte);
    if (search.trim()) params.set('search', search.trim());
    return params;
  }, [page, desde, hasta, filterEstado, tipoDte, search]);

  // ── Fetch ──
  const fetchDtes = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = buildParams();
      const data = await apiFetch<ReceivedDtesResponse>(`/received-dtes?${params}`);
      const items = Array.isArray(data?.data) ? data.data : [];
      setDtes(items);
      setTotal(Number(data?.total) || items.length);
      setTotalPages(Number(data?.totalPages) >= 1 ? Number(data.totalPages) : 1);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error al cargar DTEs recibidos');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  React.useEffect(() => {
    fetchDtes();
  }, [fetchDtes]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filterEstado, tipoDte, search, desde, hasta]);

  // ── Export ──
  const handleExport = async () => {
    try {
      setExporting(true);
      // Build export params without page/limit
      const exportParams = new URLSearchParams();
      if (desde) exportParams.set('desde', desde);
      if (hasta) exportParams.set('hasta', hasta);
      if (filterEstado === 'Convertidos') {
        exportParams.set('hasPurchase', 'true');
      } else if (filterEstado !== 'all') {
        exportParams.set('status', filterEstado);
      }
      if (tipoDte && tipoDte !== 'all') exportParams.set('tipoDte', tipoDte);
      if (search.trim()) exportParams.set('search', search.trim());

      const resp = await apiRawFetch(`/received-dtes/export?${exportParams}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dtes-recibidos-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error((err instanceof Error ? err.message : null) ?? 'Error exportando');
    } finally {
      setExporting(false);
    }
  };

  // ── Import stub ──
  const handleImport = () => {
    toast.info('Próximamente');
  };

  // ── Retry ──
  const handleRetry = async (id: string) => {
    try {
      await apiFetch(`/received-dtes/${id}/retry-mh`, { method: 'POST' });
      toast.success('Retry MH disparado');
      fetchDtes();
    } catch (err) {
      toast.error((err instanceof Error ? err.message : null) ?? 'Error en retry');
    }
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
            <Inbox className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">DTEs recibidos</h1>
              {!loading && (
                <Badge variant="secondary" className="text-xs">
                  {total}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Cargando...' : `${total} DTEs en el período`}
            </p>
          </div>
        </div>

        {/* Action buttons — desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="outline" onClick={handleImport} className="gap-2">
            <Plus className="w-4 h-4" />
            Importar DTE
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={exporting} className="gap-2">
            <Download className="w-4 h-4" />
            {exporting ? 'Exportando...' : 'Exportar Excel'}
          </Button>
        </div>
      </div>

      {/* ── Filters toolbar ─────────────────────────────────────────────── */}
      <Card className="sticky top-0 z-10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar por NIT o nombre emisor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm"
            />
            <Select value={tipoDte} onValueChange={setTipoDte}>
              <SelectTrigger className="w-[130px] text-sm">
                <SelectValue placeholder="Tipo DTE" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos tipos</SelectItem>
                {TIPO_DTE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    Tipo {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado pills + date range */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Estado pills */}
            <div className="flex flex-wrap gap-1.5">
              {ESTADO_PILLS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilterEstado(value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterEstado === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {label}
                </button>
              ))}
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
          <Button variant="outline" size="sm" onClick={fetchDtes}>
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
          ) : dtes.length === 0 ? (
            /* Empty state */
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Inbox className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-lg font-medium text-muted-foreground">
                  No hay DTEs recibidos en este rango
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Espera al cron o importa manualmente.
                </p>
              </div>
              <Button variant="outline" onClick={handleImport} className="gap-2">
                <Plus className="w-4 h-4" />
                Importar DTE
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Fecha emisión</TableHead>
                      <TableHead className="w-[80px]">Tipo</TableHead>
                      <TableHead>Núm. control</TableHead>
                      <TableHead>Emisor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-center w-[100px]">Intentos MH</TableHead>
                      <TableHead className="text-center w-[80px]">Compra</TableHead>
                      <TableHead className="text-right w-[130px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dtes.map((d) => {
                      const canRetry = d.ingestStatus === 'FAILED' || d.ingestStatus === 'UNVERIFIED';
                      const canConvert = d.ingestStatus === 'VERIFIED' && !d.purchase;

                      return (
                        <TableRow key={d.id} className="group">
                          <TableCell className="text-sm">
                            {formatDate(d.fhEmision)}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                              {d.tipoDte}
                            </code>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                              {d.numeroControl}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium truncate max-w-[200px]">
                                {d.emisorNombre}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {d.emisorNIT}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <IngestStatusBadge status={d.ingestStatus} />
                          </TableCell>
                          <TableCell className="text-center tabular-nums text-sm">
                            {d.mhVerifyAttempts}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {d.purchase ? (
                              <span className="text-green-600 font-semibold">✓</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              {/* Ver */}
                              <Link href={`/compras/recibidos/${d.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalle">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {/* Retry MH */}
                              {canRetry && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-amber-600"
                                  title="Retry MH"
                                  onClick={() => handleRetry(d.id)}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                              {/* Convertir a compra */}
                              {canConvert && (
                                <Link href={`/compras/nueva?receivedDteId=${d.id}`}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-blue-600"
                                    title="Convertir a compra"
                                  >
                                    <ArrowRightLeft className="h-4 w-4" />
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
                showing={dtes.length}
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
        ) : dtes.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Inbox className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">
                No hay DTEs recibidos en este rango
              </p>
              <p className="text-sm text-muted-foreground">
                Espera al cron o importa manualmente.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {dtes.map((d) => (
              <Link key={d.id} href={`/compras/recibidos/${d.id}`}>
                <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{d.emisorNombre}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          Tipo {d.tipoDte} · {d.emisorNIT}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(d.fhEmision)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <IngestStatusBadge status={d.ingestStatus} />
                        {d.purchase && (
                          <span className="text-xs text-green-600 font-medium">Convertido</span>
                        )}
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

      {/* ── Mobile action buttons ────────────────────────────────────────── */}
      <div className="sm:hidden flex gap-2 fixed bottom-6 right-6 z-50">
        <button
          onClick={handleImport}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          aria-label="Importar DTE"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
