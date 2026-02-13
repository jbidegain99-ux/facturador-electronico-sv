'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ClipboardList,
  ArrowLeft,
  Save,
  Send,
  Loader2,
  Calculator,
  Calendar,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ClienteSearch } from '@/components/facturas/cliente-search';
import { CatalogSearch } from '@/components/facturas/catalog-search';
import type { CatalogItem } from '@/components/facturas/catalog-search';
import { ItemsTable } from '@/components/facturas/items-table';
import { NuevoClienteModal } from '@/components/facturas/nuevo-cliente-modal';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils';
import type { Cliente, ItemFactura } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────

function defaultValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

// ── Component ────────────────────────────────────────────────────────

export default function NuevaCotizacionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  const editId = searchParams.get('edit');

  // ── Form state ─────────────────────────────────────────────────────
  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [clienteEmail, setClienteEmail] = React.useState('');
  const [items, setItems] = React.useState<ItemFactura[]>([]);
  const [validUntil, setValidUntil] = React.useState(defaultValidUntil());
  const [terms, setTerms] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // ── UI state ───────────────────────────────────────────────────────
  const [saving, setSaving] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [loadingEdit, setLoadingEdit] = React.useState(!!editId);
  const [showNuevoCliente, setShowNuevoCliente] = React.useState(false);

  // ── Computed totals ────────────────────────────────────────────────
  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const totalDescuentos = items.reduce((sum, i) => sum + i.descuento, 0);
  const totalIva = items.reduce((sum, i) => sum + i.iva, 0);
  const totalPagar = items.reduce((sum, i) => sum + i.total, 0);

  // ── Load quote for editing ─────────────────────────────────────────
  React.useEffect(() => {
    if (!editId) return;

    const loadQuote = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/quotes/${editId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          toastRef.current.error('No se pudo cargar la cotizacion');
          router.push('/cotizaciones');
          return;
        }

        const quote = await res.json();

        // Set client
        if (quote.client) {
          setCliente(quote.client as Cliente);
          const c = quote.client as Cliente;
          if (c.correo) setClienteEmail(c.correo);
        }

        // Set clienteEmail override if stored on quote
        if (typeof quote.clienteEmail === 'string' && quote.clienteEmail) {
          setClienteEmail(quote.clienteEmail as string);
        }

        // Prefer structured lineItems, fall back to legacy JSON
        const rawLineItems = Array.isArray(quote.lineItems) && quote.lineItems.length > 0
          ? quote.lineItems
          : null;

        if (rawLineItems) {
          // Map from API lineItem format to frontend ItemFactura format
          const parsedItems: ItemFactura[] = rawLineItems.map(
            (item: Record<string, unknown>, index: number) => {
              const cantidad = Number(item.quantity) || 1;
              const precioUnitario = Number(item.unitPrice) || 0;
              const descuento = Number(item.discount) || 0;
              const sub = cantidad * precioUnitario - descuento;
              const iva = sub * 0.13;
              return {
                id: `item-${Date.now()}-${index}`,
                codigo: (item.itemCode as string) || '',
                descripcion: (item.description as string) || '',
                cantidad,
                precioUnitario,
                esGravado: (item.tipoItem as number) !== 2,
                esExento: (item.tipoItem as number) === 2,
                descuento,
                subtotal: sub,
                iva,
                total: sub + iva,
              };
            },
          );
          setItems(parsedItems);
        } else {
          // Legacy JSON path
          const rawItems = typeof quote.items === 'string'
            ? JSON.parse(quote.items)
            : quote.items;

          if (Array.isArray(rawItems)) {
            const parsedItems: ItemFactura[] = rawItems.map(
              (item: Record<string, unknown>, index: number) => {
                const cantidad = Number(item.cantidad) || 1;
                const precioUnitario = Number(item.precioUnitario) || 0;
                const descuento = Number(item.descuento) || 0;
                const sub = cantidad * precioUnitario - descuento;
                const iva = sub * 0.13;
                return {
                  id: `item-${Date.now()}-${index}`,
                  codigo: (item.codigo as string) || '',
                  descripcion: (item.descripcion as string) || '',
                  cantidad,
                  precioUnitario,
                  esGravado: true,
                  esExento: false,
                  descuento,
                  subtotal: sub,
                  iva,
                  total: sub + iva,
                };
              },
            );
            setItems(parsedItems);
          }
        }

        // Set other fields
        if (quote.validUntil) {
          setValidUntil(
            new Date(quote.validUntil as string)
              .toISOString()
              .split('T')[0],
          );
        }
        setTerms((quote.terms as string) || '');
        setNotes((quote.notes as string) || '');
      } catch (err) {
        console.error('Error loading quote:', err);
        toastRef.current.error('Error al cargar la cotizacion');
      } finally {
        setLoadingEdit(false);
      }
    };

    loadQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // ── Client selection handler (auto-populates email) ───────────────
  const handleClienteChange = (c: Cliente | null) => {
    setCliente(c);
    if (c?.correo) {
      setClienteEmail(c.correo);
    } else if (!c) {
      setClienteEmail('');
    }
  };

  // ── Catalog item handler ───────────────────────────────────────────
  const handleCatalogSelect = (catalogItem: CatalogItem) => {
    const cantidad = 1;
    const precioUnitario = Number(catalogItem.basePrice);
    const sub = cantidad * precioUnitario;
    const esGravado = catalogItem.tipoItem !== 2;
    const iva = esGravado ? sub * 0.13 : 0;

    const newItem: ItemFactura = {
      id: `item-${Date.now()}`,
      codigo: catalogItem.code,
      descripcion: catalogItem.name,
      cantidad,
      precioUnitario,
      esGravado,
      esExento: !esGravado,
      descuento: 0,
      subtotal: sub,
      iva,
      total: sub + iva,
    };

    setItems((prev) => [...prev, newItem]);
    toastRef.current.success(`"${catalogItem.name}" agregado`);
  };

  // ── Validation ─────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!cliente) newErrors.cliente = 'Selecciona un cliente';
    if (items.length === 0) newErrors.items = 'Agrega al menos un item';
    if (!validUntil) newErrors.validUntil = 'Fecha de validez requerida';

    const invalidItems = items.filter((i) => i.precioUnitario <= 0);
    if (invalidItems.length > 0) {
      newErrors.items = 'Todos los items deben tener precio mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Save (draft) ───────────────────────────────────────────────────
  const handleSave = async (andSend = false) => {
    if (!validate()) return;

    const setLoading = andSend ? setSending : setSaving;
    setLoading(true);
    setErrors({});

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay sesion activa');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const payload = {
        clienteId: cliente!.id,
        clienteEmail: clienteEmail || undefined,
        validUntil: new Date(validUntil).toISOString(),
        items: items.map((i) => ({
          description: i.descripcion,
          quantity: i.cantidad,
          unitPrice: i.precioUnitario,
          discount: i.descuento,
          tipoItem: i.esGravado ? 1 : 2,
          itemCode: i.codigo || undefined,
        })),
        terms: terms || undefined,
        notes: notes || undefined,
      };

      let quoteId = editId;

      if (editId) {
        // Update existing
        const res = await fetch(`${apiUrl}/quotes/${editId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            (errData as { message?: string }).message ||
              'Error al actualizar',
          );
        }
      } else {
        // Create new
        const res = await fetch(`${apiUrl}/quotes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            (errData as { message?: string }).message ||
              'Error al crear cotizacion',
          );
        }

        const created = await res.json();
        quoteId = (created as { id: string }).id;
      }

      // If andSend, transition to SENT
      if (andSend && quoteId) {
        const sendRes = await fetch(`${apiUrl}/quotes/${quoteId}/send`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!sendRes.ok) {
          toastRef.current.warning(
            'Cotizacion guardada pero no se pudo enviar',
          );
          router.push(`/cotizaciones/${quoteId}`);
          return;
        }
      }

      toastRef.current.success(
        andSend
          ? 'Cotizacion enviada'
          : editId
            ? 'Cotizacion actualizada'
            : 'Cotizacion creada',
      );
      router.push(quoteId ? `/cotizaciones/${quoteId}` : '/cotizaciones');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error desconocido';
      setErrors({ submit: msg });
      toastRef.current.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Client created handler ─────────────────────────────────────────
  const handleClienteCreated = (newCliente: Cliente) => {
    setCliente(newCliente);
    if (newCliente.correo) setClienteEmail(newCliente.correo);
    setShowNuevoCliente(false);
    toastRef.current.success(
      `Cliente "${newCliente.nombre}" creado y seleccionado`,
    );
  };

  // ── Loading ────────────────────────────────────────────────────────
  if (loadingEdit) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/cotizaciones')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              {editId ? 'Editar Cotizacion' : 'Nueva Cotizacion'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {editId
                ? 'Modifica los datos de la cotizacion'
                : 'Crea una cotizacion para enviar a tu cliente'}
            </p>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {errors.submit && (
        <div className="glass-card p-4 border-destructive/50 animate-in shake">
          <p className="text-sm text-destructive">{errors.submit}</p>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Valid until */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Valida hasta:
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.validUntil && (
                <span className="text-xs text-destructive">
                  {errors.validUntil}
                </span>
              )}
            </div>
          </div>

          {/* Client */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Cliente
            </h2>
            <ClienteSearch
              value={cliente}
              onChange={handleClienteChange}
              onCreateNew={() => setShowNuevoCliente(true)}
              tipoDte="01"
            />
            {errors.cliente && (
              <p className="text-xs text-destructive">{errors.cliente}</p>
            )}

            {/* Client email (auto-populated, overridable) */}
            {cliente && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  type="email"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="text-sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Email para aprobacion
                </span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Items de la Cotizacion
            </h2>
            <CatalogSearch onSelect={handleCatalogSelect} />
            <ItemsTable items={items} onChange={setItems} />
            {errors.items && (
              <p className="text-xs text-destructive">{errors.items}</p>
            )}
          </div>

          {/* Notes (internal) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Notas internas (no visibles al cliente)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas internas sobre esta cotizacion..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        {/* Right column (2/5) — sticky */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20 space-y-4">
            {/* Summary */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <Calculator className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Resumen</h3>
                {items.length > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {totalDescuentos > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Descuentos:
                    </span>
                    <span className="text-warning font-medium">
                      -{formatCurrency(totalDescuentos)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (13%):</span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(totalIva)}
                  </span>
                </div>

                <div className="h-px bg-primary/30" />

                <div className="flex justify-between items-center pt-1">
                  <span className="text-lg font-semibold text-foreground">
                    TOTAL:
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(totalPagar)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="glass-card p-4 space-y-2">
              <Button
                className="w-full btn-primary justify-center"
                onClick={() => handleSave(true)}
                disabled={
                  saving ||
                  sending ||
                  !cliente ||
                  items.length === 0
                }
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Guardar y Enviar
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-center"
                onClick={() => handleSave(false)}
                disabled={
                  saving ||
                  sending ||
                  !cliente ||
                  items.length === 0
                }
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Borrador
                  </>
                )}
              </Button>
            </div>

            {/* Terms */}
            <div className="glass-card p-4 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Terminos y Condiciones
              </label>
              <Textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Condiciones de pago, garantias, etc."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NuevoClienteModal
        open={showNuevoCliente}
        onClose={() => setShowNuevoCliente(false)}
        onCreated={handleClienteCreated}
        tipoDte="01"
      />
    </div>
  );
}
