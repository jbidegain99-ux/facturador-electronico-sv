'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, RefreshCw, FileSearch, ArrowRightLeft } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { ComprasTabsNav } from '@/components/purchases/compras-tabs-nav';
import type { ReceivedDteDetail } from '@/types/purchase';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PAYLOAD_CHARS = 500_000;

type BadgeVariant = 'secondary' | 'default' | 'destructive' | 'outline';

const STATUS_BADGE_MAP: Record<string, BadgeVariant> = {
  PENDING: 'secondary',
  VERIFIED: 'default',
  UNVERIFIED: 'outline',
  FAILED: 'destructive',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
      {children}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="text-sm font-medium">{value ?? '—'}</div>
    </div>
  );
}

// ─── Resumen tab ──────────────────────────────────────────────────────────────

function ResumenTab({
  dte,
  items,
  resumen,
}: {
  dte: ReceivedDteDetail;
  items: Array<Record<string, unknown>>;
  resumen: Record<string, unknown>;
}) {
  const fhEmisionFormatted = dte.fhEmision
    ? dte.fhEmision.slice(0, 10)
    : '—';

  const fmtAmount = (val: unknown): string => {
    if (val === null || val === undefined) return '—';
    const n = Number(val);
    if (isNaN(n)) return '—';
    return n.toFixed(2);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Left column — emisor / fechas / identificadores */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Datos del emisor
              </h3>
              <InfoRow
                label="Emisor"
                value={
                  <span>
                    {dte.emisorNombre}{' '}
                    <span className="font-mono text-xs text-muted-foreground">
                      ({dte.emisorNIT})
                    </span>
                  </span>
                }
              />
              <InfoRow label="Fecha emisión" value={fhEmisionFormatted} />
              <InfoRow
                label="Fecha procesamiento"
                value={dte.fhProcesamiento ?? '—'}
              />
              <InfoRow
                label="Sello recepción"
                value={
                  dte.selloRecepcion ? (
                    <span className="font-mono text-xs break-all">
                      {dte.selloRecepcion}
                    </span>
                  ) : (
                    '—'
                  )
                }
              />
              <InfoRow
                label="Código generación"
                value={
                  <span className="font-mono text-xs break-all">
                    {dte.codigoGeneracion}
                  </span>
                }
              />
              <InfoRow label="Origen" value={dte.ingestSource} />
            </div>

            {/* Right column — totales */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Totales
              </h3>
              <InfoRow
                label="Total gravada"
                value={
                  <span className="tabular-nums">
                    ${fmtAmount(resumen.totalGravada)}
                  </span>
                }
              />
              <InfoRow
                label="Total IVA"
                value={
                  <span className="tabular-nums">
                    ${fmtAmount(resumen.totalIva)}
                  </span>
                }
              />
              <InfoRow
                label="Total pagar"
                value={
                  <span className="tabular-nums font-semibold">
                    ${fmtAmount(resumen.totalPagar)}
                  </span>
                }
              />
              <InfoRow
                label="Items"
                value={
                  <Badge variant="secondary" className="text-xs">
                    {items.length}
                  </Badge>
                }
              />
              {dte.purchase && (
                <InfoRow
                  label="Compra ligada"
                  value={
                    <Link
                      href={`/compras/${dte.purchase.id}`}
                      className="text-primary underline-offset-2 hover:underline text-sm"
                    >
                      {dte.purchase.purchaseNumber}
                    </Link>
                  }
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Items tab ────────────────────────────────────────────────────────────────

function ItemsTab({ items }: { items: Array<Record<string, unknown>> }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileSearch className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Sin líneas parseadas.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Intenta re-parsear el documento para extraer los ítems.
          </p>
        </CardContent>
      </Card>
    );
  }

  const fmtNum = (val: unknown): string => {
    if (val === null || val === undefined) return '—';
    const n = Number(val);
    if (isNaN(n)) return '—';
    return n.toFixed(2);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right w-24">Cantidad</TableHead>
                <TableHead className="text-right w-28">Precio unit.</TableHead>
                <TableHead className="text-right w-32">Venta gravada</TableHead>
                <TableHead className="text-right w-24">IVA ítem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-center text-sm tabular-nums text-muted-foreground">
                    {item.numItem !== undefined && item.numItem !== null
                      ? String(item.numItem)
                      : String(idx + 1)}
                  </TableCell>
                  <TableCell className="text-sm max-w-[250px]">
                    <p className="truncate" title={String(item.descripcion ?? '')}>
                      {item.descripcion !== undefined && item.descripcion !== null
                        ? String(item.descripcion)
                        : '—'}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {fmtNum(item.cantidad)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {fmtNum(item.precioUni)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-medium">
                    {fmtNum(item.ventaGravada)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {fmtNum(item.ivaItem)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Historial tab ────────────────────────────────────────────────────────────

function HistorialTab({
  dte,
  errors,
}: {
  dte: ReceivedDteDetail;
  errors: Array<Record<string, unknown>>;
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow
            label="Intentos MH"
            value={
              <span className="tabular-nums">{dte.mhVerifyAttempts}</span>
            }
          />
          <InfoRow
            label="Última verificación"
            value={dte.lastMhVerifyAt ?? '—'}
          />
          <InfoRow
            label="Error MH"
            value={
              dte.mhVerifyError ? (
                <span className="text-destructive text-xs">
                  {dte.mhVerifyError}
                </span>
              ) : (
                '—'
              )
            }
          />
          <InfoRow
            label="Creado"
            value={dte.createdAt ? dte.createdAt.slice(0, 10) : '—'}
          />
        </div>

        {errors.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Errores de parsing:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((e, i) => (
                <li key={i} className="text-sm text-destructive">
                  {String(
                    (e as { message?: string }).message ?? JSON.stringify(e)
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {dte.mhVerifyAttempts === 0 && !dte.mhVerifyError && (
          <p className="text-sm text-muted-foreground">
            Sin intentos de verificación MH registrados.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReceivedDteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const id = params?.id as string;

  const [dte, setDte] = React.useState<ReceivedDteDetail | null>(null);
  const [refetchKey, setRefetchKey] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [retrying, setRetrying] = React.useState(false);
  const [reparsing, setReparsing] = React.useState(false);

  // ── Fetch ──
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    apiFetch<ReceivedDteDetail>(`/received-dtes/${id}`)
      .then((d) => {
        if (!cancelled) setDte(d);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const apiErr = err as { message?: string };
          setFetchError(apiErr?.message ?? 'Error cargando DTE');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, refetchKey]);

  // ── Parsed payload ──
  const parsed = React.useMemo<Record<string, unknown> | null>(() => {
    if (!dte?.parsedPayload) return null;
    try {
      return JSON.parse(dte.parsedPayload) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [dte?.parsedPayload]);

  const items =
    (parsed?.cuerpoDocumento as Array<Record<string, unknown>> | undefined) ??
    [];
  const resumen =
    (parsed?.resumen as Record<string, unknown> | undefined) ?? {};

  const rawTruncated = (dte?.rawPayload?.length ?? 0) > MAX_PAYLOAD_CHARS;
  const rawToShow = dte
    ? rawTruncated
      ? dte.rawPayload.slice(0, MAX_PAYLOAD_CHARS) + '\n\n... (truncado)'
      : dte.rawPayload
    : '';

  const errors = React.useMemo<Array<Record<string, unknown>>>(() => {
    if (!dte?.ingestErrors) return [];
    try {
      return JSON.parse(dte.ingestErrors) as Array<Record<string, unknown>>;
    } catch {
      return [{ message: dte.ingestErrors }];
    }
  }, [dte?.ingestErrors]);

  // ── Handlers ──
  const handleRetry = async () => {
    if (!dte) return;
    setRetrying(true);
    try {
      await apiFetch(`/received-dtes/${id}/retry-mh`, { method: 'POST' });
      toast.success('Retry MH disparado');
      setRefetchKey((k) => k + 1);
    } catch (err: unknown) {
      const anyErr = err as { code?: string; message?: string };
      if (anyErr.code === 'ALREADY_VERIFIED') {
        toast.info('Ya verificado');
        setRefetchKey((k) => k + 1);
      } else {
        toast.error(anyErr.message ?? 'Error en retry');
      }
    } finally {
      setRetrying(false);
    }
  };

  const handleReParse = async () => {
    if (!dte) return;
    setReparsing(true);
    try {
      const r = await apiFetch<ReceivedDteDetail>(
        `/received-dtes/${id}/re-parse`,
        { method: 'POST' }
      );
      toast.success('Re-parse completo');
      setDte(r);
    } catch (err: unknown) {
      const anyErr = err as { code?: string; message?: string };
      if (anyErr.code === 'NO_PAYLOAD') {
        toast.error('rawPayload vacío, no se puede re-parsear');
      } else {
        toast.error(anyErr.message ?? 'Error en re-parse');
      }
    } finally {
      setReparsing(false);
    }
  };

  const handleConvert = () => {
    if (!dte) return;
    router.push(`/compras/nueva?receivedDteId=${dte.id}`);
  };

  const handleDownloadRaw = () => {
    if (!dte) return;
    const blob = new Blob([dte.rawPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dte.codigoGeneracion}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Cargando DTE...</span>
      </div>
    );
  }

  // ── Error state ──
  if (fetchError || !dte) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        <ComprasTabsNav />
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <p>{fetchError ?? 'DTE no encontrado'}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefetchKey((k) => k + 1)}
          >
            Reintentar
          </Button>
        </div>
        <Link href="/compras/recibidos">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a DTEs recibidos
          </Button>
        </Link>
      </div>
    );
  }

  // ── Badge variant ──
  const badgeVariant: BadgeVariant =
    STATUS_BADGE_MAP[dte.ingestStatus] ?? 'secondary';

  const canRetry =
    dte.ingestStatus === 'FAILED' || dte.ingestStatus === 'UNVERIFIED';
  const canConvert = dte.ingestStatus === 'VERIFIED' && !dte.purchase;
  const canReParse =
    ['PENDING', 'FAILED'].includes(dte.ingestStatus) || errors.length > 0;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">

      {/* ── Sub-nav ───────────────────────────────────────────────────── */}
      <ComprasTabsNav />

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/compras/recibidos">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-0.5">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">
                DTE {dte.tipoDte} — {dte.numeroControl}
              </h1>
              <Badge variant={badgeVariant}>{dte.ingestStatus}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {dte.emisorNombre}{' '}
              <span className="font-mono">({dte.emisorNIT})</span>
            </p>
          </div>
        </div>

        {/* ── Action buttons ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {dte.purchase ? (
            <Button
              variant="default"
              className="gap-2"
              onClick={() => router.push(`/compras/${dte.purchase!.id}`)}
            >
              <ArrowRightLeft className="w-4 h-4" />
              Ver compra ligada
            </Button>
          ) : canConvert ? (
            <Button variant="default" className="gap-2" onClick={handleConvert}>
              <ArrowRightLeft className="w-4 h-4" />
              Convertir a compra
            </Button>
          ) : null}

          {canRetry && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRetry}
              disabled={retrying}
            >
              <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
              {retrying ? 'Reintentando...' : 'Reintentar verificación MH'}
            </Button>
          )}

          {canReParse && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleReParse}
              disabled={reparsing}
            >
              <FileSearch className="w-4 h-4" />
              {reparsing ? 'Re-parseando...' : 'Re-parsear'}
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <Tabs defaultValue="resumen">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="items">
            Items
            {items.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                {items.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="raw">JSON crudo</TabsTrigger>
          <TabsTrigger value="historial">Historial MH</TabsTrigger>
        </TabsList>

        {/* Resumen */}
        <TabsContent value="resumen" className="mt-4">
          <ResumenTab dte={dte} items={items} resumen={resumen} />
        </TabsContent>

        {/* Items */}
        <TabsContent value="items" className="mt-4">
          <ItemsTab items={items} />
        </TabsContent>

        {/* Raw JSON */}
        <TabsContent value="raw" className="mt-4">
          <Card>
            <CardContent className="p-4 space-y-2">
              <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-[600px] leading-relaxed">
                {rawToShow}
              </pre>
              {rawTruncated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadRaw}
                >
                  Descargar payload completo
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historial MH */}
        <TabsContent value="historial" className="mt-4">
          <HistorialTab dte={dte} errors={errors} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
