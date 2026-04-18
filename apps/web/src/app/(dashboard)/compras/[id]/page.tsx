'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  ShoppingCart,
  Trash2,
  CreditCard,
  PackageCheck,
  XCircle,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PagoModal } from '@/components/purchases/pago-modal';
import { RecepcionModal } from '@/components/purchases/recepcion-modal';
import type { Purchase, PurchaseStatus } from '@/types/purchase';

// ── Types ─────────────────────────────────────────────────────────────

interface JournalLine {
  id: string;
  cuentaCodigo: string;
  cuentaNombre: string;
  debe: number;
  haber: number;
}

interface JournalEntry {
  id: string;
  fecha: string;
  descripcion: string;
  lineas: JournalLine[];
}

interface InventoryMovement {
  id: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  cantidad: number;
  itemNombre?: string;
  sucursalNombre?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

type BadgeVariant = 'secondary' | 'default' | 'success' | 'destructive';

const STATUS_BADGE: Record<PurchaseStatus, { variant: BadgeVariant; label: string }> = {
  DRAFT:   { variant: 'secondary',   label: 'Borrador' },
  POSTED:  { variant: 'default',     label: 'Registrada' },
  PAID:    { variant: 'success',     label: 'Pagada' },
  ANULADA: { variant: 'destructive', label: 'Anulada' },
};

function toNumber(v: number | string | unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v) || 0;
  return 0;
}

// ── Sub-components ────────────────────────────────────────────────────

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
      <p className="text-sm font-medium">{value ?? '—'}</p>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────

function ResumenTab({ purchase }: { purchase: Purchase }) {
  const retenciones = toNumber(purchase.ivaRetenido) + toNumber(purchase.isrRetenido);

  return (
    <div className="space-y-6">
      {/* Proveedor info */}
      <Card>
        <CardContent className="p-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoRow label="Proveedor" value={purchase.proveedor?.nombre} />
          <InfoRow label="Tipo doc." value={purchase.tipoDoc} />
          <InfoRow label="Nro. documento" value={purchase.numDocumentoProveedor} />
          <InfoRow label="Fecha documento" value={purchase.fechaDoc ? formatDate(purchase.fechaDoc) : '—'} />
          <InfoRow label="Fecha contable" value={purchase.fechaContable ? formatDate(purchase.fechaContable) : '—'} />
          <InfoRow
            label="Vencimiento"
            value={purchase.fechaVencimiento ? formatDate(purchase.fechaVencimiento) : '—'}
          />
        </CardContent>
      </Card>

      {/* Lines table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">P. Unit.</TableHead>
                  <TableHead className="text-right">Desc. %</TableHead>
                  <TableHead className="text-right">IVA</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.lineas.map((l, i) => (
                  <TableRow key={l.id ?? i}>
                    <TableCell className="max-w-[200px] truncate">{l.descripcion}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {l.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {l.tipo === 'bien' ? (l.cantidad ?? '—') : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {l.tipo === 'bien' && l.precioUnit != null
                        ? formatCurrency(toNumber(l.precioUnit))
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {toNumber(l.descuentoPct) > 0 ? `${l.descuentoPct}%` : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs">
                        {l.ivaAplica ? 'Sí' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(toNumber(l.totalLinea))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2 max-w-xs ml-auto text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(toNumber(purchase.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA (13%)</span>
              <span className="tabular-nums">{formatCurrency(toNumber(purchase.iva))}</span>
            </div>
            {retenciones > 0 && (
              <>
                {toNumber(purchase.ivaRetenido) > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>IVA retenido</span>
                    <span className="tabular-nums">-{formatCurrency(toNumber(purchase.ivaRetenido))}</span>
                  </div>
                )}
                {toNumber(purchase.isrRetenido) > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>ISR retenido</span>
                    <span className="tabular-nums">-{formatCurrency(toNumber(purchase.isrRetenido))}</span>
                  </div>
                )}
              </>
            )}
            <div className="h-px bg-border" />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(toNumber(purchase.total))}</span>
            </div>
            {toNumber(purchase.saldoPendiente) > 0 && (
              <div className="flex justify-between text-destructive font-medium">
                <span>Saldo pendiente</span>
                <span className="tabular-nums">{formatCurrency(toNumber(purchase.saldoPendiente))}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AsientoTab({ purchase }: { purchase: Purchase }) {
  const [entry, setEntry] = React.useState<JournalEntry | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchEntry = React.useCallback(async () => {
    if (!purchase.asientoId) return;
    setLoading(true);
    try {
      const data = await apiFetch<JournalEntry>(
        `/accounting/journal-entries/${purchase.asientoId}`
      );
      setEntry(data);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message ?? 'Error al cargar el asiento');
    } finally {
      setLoading(false);
    }
  }, [purchase.asientoId]);

  React.useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  if (!purchase.asientoId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Esta compra no tiene asiento contable registrado.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando asiento...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-destructive text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!entry) return null;

  const totalDebe = entry.lineas.reduce((s, l) => s + toNumber(l.debe), 0);
  const totalHaber = entry.lineas.reduce((s, l) => s + toNumber(l.haber), 0);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div>
            <SectionLabel>Descripción</SectionLabel>
            <p className="font-medium">{entry.descripcion}</p>
          </div>
          <div className="text-right">
            <SectionLabel>Fecha</SectionLabel>
            <p className="font-medium">{formatDate(entry.fecha)}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuenta</TableHead>
                <TableHead className="text-right">Debe</TableHead>
                <TableHead className="text-right">Haber</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.lineas.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground mr-2">
                      {l.cuentaCodigo}
                    </span>
                    {l.cuentaNombre}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {toNumber(l.debe) > 0 ? formatCurrency(toNumber(l.debe)) : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {toNumber(l.haber) > 0 ? formatCurrency(toNumber(l.haber)) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end gap-8 text-sm font-semibold border-t border-border pt-3">
          <span>Total Debe: {formatCurrency(totalDebe)}</span>
          <span>Total Haber: {formatCurrency(totalHaber)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function RecepcionTab({ purchase }: { purchase: Purchase }) {
  const [movements, setMovements] = React.useState<InventoryMovement[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);

  const fetchMovements = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<InventoryMovement[]>(
        `/inventory/movements?purchaseId=${purchase.id}`
      );
      setMovements(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const apiErr = err as { status?: number };
      if (apiErr?.status === 404) {
        setNotFound(true);
      } else {
        setMovements([]);
      }
    } finally {
      setLoading(false);
    }
  }, [purchase.id]);

  React.useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando movimientos...
        </CardContent>
      </Card>
    );
  }

  if (notFound || movements.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <PackageCheck className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">Recepción pendiente</p>
          <p className="text-xs text-muted-foreground mt-1">
            Aún no se han registrado movimientos de inventario para esta compra.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Ítem</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Sucursal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">{formatDate(m.fecha)}</TableCell>
                  <TableCell className="text-sm">{m.itemNombre ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.descripcion}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{m.cantidad}</TableCell>
                  <TableCell className="text-sm">{m.sucursalNombre ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function CompraDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  const [purchase, setPurchase] = React.useState<Purchase | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // Modal state
  const [pagoOpen, setPagoOpen] = React.useState(false);
  const [recepcionOpen, setRecepcionOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [anularOpen, setAnularOpen] = React.useState(false);

  // Load purchase
  const fetchPurchase = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await apiFetch<Purchase>(`/purchases/${id}`);
      setPurchase(data);
      setFetchError(null);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setFetchError(apiErr?.message ?? 'Error al cargar la compra');
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchPurchase();
  }, [fetchPurchase]);

  // ── Action handlers ───────────────────────────────────────────────

  const handleDelete = async () => {
    if (!purchase) return;
    try {
      await apiFetch(`/purchases/${purchase.id}`, { method: 'DELETE' });
      toast.success('Compra eliminada');
      router.push('/compras');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message ?? 'Error al eliminar la compra');
      throw err; // ConfirmDialog catches and keeps modal open
    }
  };

  const handleAnular = async () => {
    if (!purchase) return;
    try {
      const updated = await apiFetch<Purchase>(`/purchases/${purchase.id}/anular`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast.success('Compra anulada');
      setPurchase(updated);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message ?? 'Error al anular la compra');
      throw err;
    }
  };

  const handlePost = async () => {
    if (!purchase) return;
    try {
      const updated = await apiFetch<Purchase>(`/purchases/${purchase.id}/post`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast.success('Compra contabilizada');
      setPurchase(updated);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message ?? 'Error al contabilizar');
    }
  };

  // ── Render ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Cargando compra...</span>
      </div>
    );
  }

  if (fetchError || !purchase) {
    return (
      <div className="p-6 space-y-4">
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <p>{fetchError ?? 'Compra no encontrada'}</p>
          <Button variant="outline" size="sm" onClick={fetchPurchase}>
            Reintentar
          </Button>
        </div>
        <Link href="/compras">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a compras
          </Button>
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_BADGE[purchase.estado] ?? {
    variant: 'secondary' as BadgeVariant,
    label: purchase.estado,
  };

  const saldo = toNumber(purchase.saldoPendiente);
  const isDraft = purchase.estado === 'DRAFT';
  const isPosted = purchase.estado === 'POSTED';
  const isPaid = purchase.estado === 'PAID';
  const isAnulada = purchase.estado === 'ANULADA';

  const canPay = isPosted && saldo > 0;
  const canAnular = (isPosted || isPaid) && !isAnulada;
  const canReceive = (isPosted || isPaid) && !isAnulada;

  return (
    <div className="space-y-6 p-4 md:p-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/compras">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-0.5">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-blue-500" />
              </div>
              <h1 className="text-xl font-bold">
                Compra {purchase.numDocumentoProveedor || purchase.id.slice(0, 8)}
              </h1>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 ml-11">
              {purchase.proveedor?.nombre ?? '—'} ·{' '}
              {purchase.fechaDoc ? formatDate(purchase.fechaDoc) : '—'}
            </p>
          </div>
        </div>

        {/* Actions */}
        {!isAnulada && (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            {isDraft && (
              <>
                <Button
                  variant="default"
                  className="gap-2"
                  onClick={handlePost}
                >
                  <BookOpen className="w-4 h-4" />
                  Contabilizar
                </Button>
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </Button>
              </>
            )}

            {canPay && (
              <Button
                variant="default"
                className="gap-2"
                onClick={() => setPagoOpen(true)}
              >
                <CreditCard className="w-4 h-4" />
                Registrar pago
              </Button>
            )}

            {canReceive && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setRecepcionOpen(true)}
              >
                <PackageCheck className="w-4 h-4" />
                Registrar recepción
              </Button>
            )}

            {canAnular && (
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => setAnularOpen(true)}
              >
                <XCircle className="w-4 h-4" />
                Anular
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <Tabs defaultValue="resumen">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="asiento">Asiento</TabsTrigger>
          <TabsTrigger value="recepcion">Recepción</TabsTrigger>
          <TabsTrigger value="adjuntos">Adjuntos</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4">
          <ResumenTab purchase={purchase} />
        </TabsContent>

        <TabsContent value="asiento" className="mt-4">
          <AsientoTab purchase={purchase} />
        </TabsContent>

        <TabsContent value="recepcion" className="mt-4">
          <RecepcionTab purchase={purchase} />
        </TabsContent>

        <TabsContent value="adjuntos" className="mt-4">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm">Disponible próximamente.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Modals ─────────────────────────────────────────────────── */}

      {pagoOpen && (
        <PagoModal
          open={pagoOpen}
          onOpenChange={setPagoOpen}
          purchase={purchase}
          onPaid={(updated) => setPurchase(updated)}
        />
      )}

      {recepcionOpen && (
        <RecepcionModal
          open={recepcionOpen}
          onOpenChange={setRecepcionOpen}
          purchase={purchase}
          onReceived={(updated) => setPurchase(updated)}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar compra"
        description="Esta acción es irreversible. ¿Deseas eliminar esta compra?"
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={anularOpen}
        onOpenChange={setAnularOpen}
        title="Anular compra"
        description="Al anular esta compra se revertirá el asiento contable si existe. ¿Deseas continuar?"
        confirmText="Anular"
        variant="destructive"
        onConfirm={handleAnular}
      />
    </div>
  );
}
