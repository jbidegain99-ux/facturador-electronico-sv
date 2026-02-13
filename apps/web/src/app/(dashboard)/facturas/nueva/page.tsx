'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  Eye,
  Save,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  Files,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClienteSearch } from '@/components/facturas/cliente-search';
import { CatalogSearch } from '@/components/facturas/catalog-search';
import type { CatalogItem } from '@/components/facturas/catalog-search';
import { ItemsTable } from '@/components/facturas/items-table';
import { FacturaPreview } from '@/components/facturas/factura-preview';
import { NuevoClienteModal } from '@/components/facturas/nuevo-cliente-modal';
import { PlantillasPanel, GuardarPlantillaModal } from '@/components/facturas/plantillas-panel';
import { FavoritosPanel } from '@/components/facturas/favoritos-panel';
import { useTemplatesStore, InvoiceTemplate, FavoriteItem } from '@/store/templates';
import { useKeyboardShortcuts, getShortcutDisplay } from '@/hooks/use-keyboard-shortcuts';
import { useToast } from '@/components/ui/toast';
import { cn, formatCurrency } from '@/lib/utils';
import type { Cliente, ItemFactura } from '@/types';

// ── Constants ──────────────────────────────────────────────────────
const DRAFT_KEY = 'factura-draft';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

const CONDICIONES_PAGO = [
  { value: '01', label: 'Contado' },
  { value: '02', label: 'A credito' },
  { value: '03', label: 'Otro' },
];

// ── Types ──────────────────────────────────────────────────────────
interface FacturaFormState {
  tipoDte: '01' | '03';
  cliente: Cliente | null;
  items: ItemFactura[];
  condicionPago: string;
}

/** Tracks which invoice items came from the catalog for usage tracking */
interface CatalogItemRef {
  itemId: string;
  catalogId: string;
}

const initialState: FacturaFormState = {
  tipoDte: '01',
  cliente: null,
  items: [],
  condicionPago: '01',
};

// ── Helper: track catalog usage after successful emission ──────────
async function trackCatalogUsage(catalogIds: string[]) {
  if (catalogIds.length === 0) return;
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    // Fire-and-forget PATCH for each catalog item used
    await Promise.allSettled(
      catalogIds.map((id) =>
        fetch(`${apiUrl}/catalog-items/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ lastUsedAt: new Date().toISOString() }),
        })
      )
    );
  } catch {
    // Usage tracking is non-critical
  }
}

// ════════════════════════════════════════════════════════════════════
// Component
// ════════════════════════════════════════════════════════════════════
export default function NuevaFacturaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { useTemplate, useFavorite } = useTemplatesStore();
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  // ── Form state ───────────────────────────────────────────────────
  const [formState, setFormState] = React.useState<FacturaFormState>(initialState);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [catalogRefs, setCatalogRefs] = React.useState<CatalogItemRef[]>([]);

  // ── UI state ─────────────────────────────────────────────────────
  const [isEmitting, setIsEmitting] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [showNuevoCliente, setShowNuevoCliente] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [successData, setSuccessData] = React.useState<{
    id: string;
    numeroControl: string;
  } | null>(null);
  const [hasDraft, setHasDraft] = React.useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = React.useState(false);

  const { tipoDte, cliente, items, condicionPago } = formState;

  // ── Computed totals ──────────────────────────────────────────────
  const subtotalGravado = items.reduce((sum, i) => sum + i.subtotal, 0);
  const totalDescuentos = items.reduce((sum, i) => sum + i.descuento, 0);
  const totalIva = items.reduce((sum, i) => sum + i.iva, 0);
  const totalPagar = items.reduce((sum, i) => sum + i.total, 0);

  // ── Draft: load on mount ─────────────────────────────────────────
  React.useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.items?.length > 0 || draft.cliente) {
          setHasDraft(true);
        }
      } catch {
        // Ignore invalid draft
      }
    }
  }, []);

  // ── Draft: auto-save ─────────────────────────────────────────────
  React.useEffect(() => {
    const hasContent = items.length > 0 || cliente !== null;
    if (!hasContent) return;

    const interval = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formState));
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [formState, items.length, cliente]);

  // ── Keyboard shortcuts ───────────────────────────────────────────
  useKeyboardShortcuts(
    {
      'mod+enter': () => {
        if (canEmit()) handleEmit();
      },
      'mod+s': () => handleSaveDraft(),
      'mod+p': () => setShowPreview(true),
      'mod+t': () => {
        if (items.length > 0) setShowSaveTemplate(true);
      },
      escape: () => {
        setShowPreview(false);
        setShowNuevoCliente(false);
        setShowSaveTemplate(false);
      },
    },
    { enabled: !isEmitting }
  );

  // ── Form helpers ─────────────────────────────────────────────────
  const updateForm = <K extends keyof FacturaFormState>(
    key: K,
    value: FacturaFormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // ── Draft handlers ───────────────────────────────────────────────
  const handleLoadDraft = () => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormState(draft);
        setHasDraft(false);
        toastRef.current.success('Borrador recuperado correctamente');
      } catch {
        toastRef.current.error('Error al recuperar el borrador');
      }
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    toastRef.current.info('Borrador descartado');
  };

  const handleSaveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formState));
    toastRef.current.success('Borrador guardado correctamente');
  };

  // ── Template handler ─────────────────────────────────────────────
  const handleSelectTemplate = (template: InvoiceTemplate) => {
    const usedTemplate = useTemplate(template.id);
    if (!usedTemplate) return;

    const newItems: ItemFactura[] = usedTemplate.items.map((item, index) => ({
      ...item,
      id: `item-${Date.now()}-${index}`,
    }));

    setFormState({
      tipoDte: usedTemplate.tipoDte,
      cliente: usedTemplate.cliente as Cliente | null,
      items: newItems,
      condicionPago: usedTemplate.condicionPago,
    });

    toastRef.current.success(`Plantilla "${template.name}" aplicada`);
  };

  // ── Favorite handler ─────────────────────────────────────────────
  const handleSelectFavorite = (favorite: FavoriteItem) => {
    useFavorite(favorite.id);

    const cantidad = 1;
    const precioUnitario = favorite.precioUnitario;
    const subtotal = cantidad * precioUnitario;
    const iva = favorite.esGravado ? subtotal * 0.13 : 0;

    const newItem: ItemFactura = {
      id: `item-${Date.now()}`,
      codigo: favorite.codigo,
      descripcion: favorite.descripcion,
      cantidad,
      precioUnitario,
      esGravado: favorite.esGravado,
      esExento: !favorite.esGravado,
      descuento: 0,
      subtotal,
      iva,
      total: subtotal + iva,
    };

    updateForm('items', [...items, newItem]);
    toastRef.current.success(`"${favorite.descripcion}" agregado a la factura`);
  };

  // ── Catalog item handler ─────────────────────────────────────────
  const handleCatalogSelect = (catalogItem: CatalogItem) => {
    const cantidad = 1;
    const precioUnitario = Number(catalogItem.basePrice);
    const subtotal = cantidad * precioUnitario;
    const esGravado = catalogItem.tipoItem !== 2;
    const iva = esGravado ? subtotal * 0.13 : 0;
    const itemId = `item-${Date.now()}`;

    const newItem: ItemFactura = {
      id: itemId,
      codigo: catalogItem.code,
      descripcion: catalogItem.name,
      cantidad,
      precioUnitario,
      esGravado,
      esExento: !esGravado,
      descuento: 0,
      subtotal,
      iva,
      total: subtotal + iva,
    };

    updateForm('items', [...items, newItem]);
    setCatalogRefs((prev) => [...prev, { itemId, catalogId: catalogItem.id }]);
    toastRef.current.success(`"${catalogItem.name}" agregado a la factura`);
  };

  // ── Duplicate from URL params ────────────────────────────────────
  React.useEffect(() => {
    const duplicateId = searchParams.get('duplicate');
    if (duplicateId) {
      loadInvoiceForDuplicate(duplicateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadInvoiceForDuplicate = async (dteId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dte/${dteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) return;

      const dte = await response.json();

      if (dte.jsonOriginal) {
        try {
          const originalData = JSON.parse(dte.jsonOriginal);
          const cuerpo = originalData.cuerpoDocumento || [];

          const duplicatedItems: ItemFactura[] = cuerpo.map(
            (item: Record<string, unknown>, index: number) => ({
              id: `item-${Date.now()}-${index}`,
              codigo: item.codigo || '',
              descripcion: item.descripcion as string,
              cantidad: item.cantidad as number,
              precioUnitario: item.precioUni as number,
              esGravado: (item.ventaGravada as number) > 0,
              esExento: (item.ventaExenta as number) > 0,
              descuento: (item.montoDescu as number) || 0,
              subtotal:
                (item.ventaGravada as number) ||
                (item.ventaExenta as number) ||
                0,
              iva: (item.ivaItem as number) || 0,
              total:
                ((item.ventaGravada as number) || 0) +
                ((item.ivaItem as number) || 0),
            })
          );

          setFormState({
            tipoDte: dte.tipoDte as '01' | '03',
            cliente: null,
            items: duplicatedItems,
            condicionPago: '01',
          });
          toastRef.current.success(
            'Factura duplicada - selecciona un cliente para continuar'
          );
        } catch {
          toastRef.current.error('Error al cargar los datos de la factura');
        }
      }
    } catch {
      toastRef.current.error('No se pudo cargar la factura para duplicar');
    }
  };

  // ── Validation ───────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (tipoDte === '03') {
      if (!cliente) {
        newErrors.cliente = 'Selecciona un cliente para Credito Fiscal';
      } else if (!cliente.nrc) {
        newErrors.cliente = 'El cliente debe tener NRC para Credito Fiscal';
      }
    }

    if (items.length === 0) {
      newErrors.items = 'Agrega al menos un item a la factura';
    }

    const invalidItems = items.filter((i) => i.precioUnitario <= 0);
    if (invalidItems.length > 0) {
      newErrors.items = 'Todos los items deben tener precio mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canEmit = () => {
    if (items.length === 0) return false;
    if (tipoDte === '03' && (!cliente || !cliente.nrc)) return false;
    return true;
  };

  // ── Emit invoice ─────────────────────────────────────────────────
  const handleEmit = async () => {
    if (!validateForm()) return;

    setIsEmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(
          'No hay sesion activa. Por favor inicia sesion nuevamente.'
        );
      }

      const getSubtotal = () => items.reduce((sum, i) => sum + i.subtotal, 0);
      const getTotalIvaCalc = () => items.reduce((sum, i) => sum + i.iva, 0);
      const getTotal = () => items.reduce((sum, i) => sum + i.total, 0);

      // Build DTE data — IDENTICAL structure to original
      const dteData = {
        tipoDte,
        data: {
          identificacion: {
            version: tipoDte === '01' ? 1 : 3,
            ambiente: '00',
            tipoDte,
            numeroControl: null,
            codigoGeneracion: null,
            tipoModelo: 1,
            tipoOperacion: 1,
            tipoContingencia: null,
            fecEmi: new Date().toISOString().split('T')[0],
            horEmi: new Date().toTimeString().split(' ')[0],
            tipoMoneda: 'USD',
          },
          receptor: cliente
            ? {
                tipoDocumento: cliente.tipoDocumento || '13',
                numDocumento: cliente.numDocumento || null,
                nrc: cliente.nrc || null,
                nombre: cliente.nombre,
                codActividad: cliente.codActividad || null,
                descActividad: cliente.descActividad || null,
                direccion: cliente.direccion || null,
                telefono: cliente.telefono || null,
                correo: cliente.correo || null,
              }
            : null,
          cuerpoDocumento: items.map((item, index) => ({
            numItem: index + 1,
            tipoItem: 1,
            codigo: item.codigo || null,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            uniMedida: 59,
            precioUni: item.precioUnitario,
            montoDescu: item.descuento,
            ventaNoSuj: 0,
            ventaExenta: 0,
            ventaGravada: item.subtotal,
            tributos: null,
            psv: 0,
            noGravado: 0,
            ivaItem: item.iva,
          })),
          resumen: {
            totalNoSuj: 0,
            totalExenta: 0,
            totalGravada: getSubtotal(),
            subTotalVentas: getSubtotal(),
            descuNoSuj: 0,
            descuExenta: 0,
            descuGravada: items.reduce((sum, i) => sum + i.descuento, 0),
            porcentajeDescuento: 0,
            totalDescu: items.reduce((sum, i) => sum + i.descuento, 0),
            tributos: null,
            subTotal: getSubtotal(),
            ivaRete1: 0,
            reteRenta: 0,
            montoTotalOperacion: getTotal(),
            totalNoGravado: 0,
            totalPagar: getTotal(),
            totalLetras: '',
            totalIva: getTotalIvaCalc(),
            saldoFavor: 0,
            condicionOperacion: parseInt(condicionPago),
            pagos: null,
            numPagoElectronico: null,
          },
        },
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/dte`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dteData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { message?: string }).message || 'Error al crear el DTE'
        );
      }

      const createdDte = await response.json();

      // Track catalog usage (fire-and-forget)
      const usedCatalogIds = catalogRefs
        .filter((ref) => items.some((i) => i.id === ref.itemId))
        .map((ref) => ref.catalogId);
      trackCatalogUsage(usedCatalogIds);

      // Success
      setSuccessData({
        id: createdDte.id,
        numeroControl:
          createdDte.numeroControl || createdDte.codigoGeneracion,
      });
      setShowSuccess(true);
      setShowPreview(false);
      localStorage.removeItem(DRAFT_KEY);

      // Confetti
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#06b6d4', '#22c55e'],
        });
      } catch {
        // Confetti not critical
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido al emitir la factura';
      setErrors({ submit: errorMessage });
      toastRef.current.error(errorMessage);
    } finally {
      setIsEmitting(false);
    }
  };

  // ── Client created handler ───────────────────────────────────────
  const handleClienteCreated = (newCliente: Cliente) => {
    updateForm('cliente', newCliente);
    setShowNuevoCliente(false);
    toastRef.current.success(
      `Cliente "${newCliente.nombre}" creado y seleccionado`
    );
  };

  // ── Post-success handlers ────────────────────────────────────────
  const handleNewInvoice = () => {
    setFormState(initialState);
    setCatalogRefs([]);
    setShowSuccess(false);
    setSuccessData(null);
    setErrors({});
  };

  const handleViewInvoice = () => {
    if (successData?.id) {
      router.push(`/facturas/${successData.id}`);
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // RENDER: Success view
  // ══════════════════════════════════════════════════════════════════
  if (showSuccess && successData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto animate-in fade-in-50 zoom-in-95 duration-500">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Factura Emitida
            </h1>
            <p className="text-muted-foreground">
              Tu documento ha sido procesado exitosamente
            </p>
          </div>

          <div className="glass-card p-4 text-left">
            <div className="text-sm text-muted-foreground mb-1">
              Numero de Control
            </div>
            <code className="text-xs text-primary break-all">
              {successData.numeroControl}
            </code>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              variant="ghost"
              onClick={handleNewInvoice}
              className="btn-secondary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Nueva Factura
            </Button>
            <Button onClick={handleViewInvoice} className="btn-primary">
              Ver Detalle
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // RENDER: Main form
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/facturas')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Nueva Factura
            </h1>
            <p className="text-sm text-muted-foreground">
              Crea y emite documentos tributarios electronicos
            </p>
          </div>
        </div>

        {/* Quick emit button (header) */}
        <Button
          onClick={handleEmit}
          disabled={!canEmit() || isEmitting}
          className="btn-primary hidden sm:flex"
        >
          {isEmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Emitiendo...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Emitir
            </>
          )}
        </Button>
      </div>

      {/* ── Top row: Tipo DTE + Condicion de pago ───────────────── */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Tipo DTE */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Tipo:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateForm('tipoDte', '01')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  tipoDte === '01'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                Factura (01)
              </button>
              <button
                onClick={() => updateForm('tipoDte', '03')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  tipoDte === '03'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                Credito Fiscal (03)
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-8 w-px bg-border" />

          {/* Condicion de pago */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Condicion:
            </label>
            <Select
              value={condicionPago}
              onValueChange={(v) => updateForm('condicionPago', v)}
            >
              <SelectTrigger className="w-[140px] input-rc">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDICIONES_PAGO.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Draft recovery ──────────────────────────────────────── */}
      {hasDraft && (
        <div className="glass-card p-4 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <Save className="w-5 h-5 text-warning" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Tienes un borrador guardado
              </p>
              <p className="text-xs text-muted-foreground">
                Se guardo automaticamente antes de salir
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleDiscardDraft}>
              Descartar
            </Button>
            <Button
              size="sm"
              onClick={handleLoadDraft}
              className="btn-primary"
            >
              Recuperar
            </Button>
          </div>
        </div>
      )}

      {/* ── Error banner ────────────────────────────────────────── */}
      {errors.submit && (
        <div className="glass-card p-4 border-destructive/50 animate-in shake">
          <p className="text-sm text-destructive">{errors.submit}</p>
        </div>
      )}

      {/* ── Two-column layout ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ════ Left column (3/5) ════════════════════════════════ */}
        <div className="lg:col-span-3 space-y-6">
          {/* Client section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Cliente / Receptor
              </h2>
              {tipoDte === '03' && !cliente && (
                <span className="text-xs text-destructive">
                  * Requerido para CCF
                </span>
              )}
            </div>

            <ClienteSearch
              value={cliente}
              onChange={(c) => updateForm('cliente', c)}
              onCreateNew={() => setShowNuevoCliente(true)}
              tipoDte={tipoDte}
            />

            {errors.cliente && (
              <p className="text-xs text-destructive">{errors.cliente}</p>
            )}
          </div>

          {/* Items section */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Items de la Factura
            </h2>

            <CatalogSearch onSelect={handleCatalogSelect} />

            <ItemsTable
              items={items}
              onChange={(newItems) => updateForm('items', newItems)}
            />

            {errors.items && (
              <p className="text-xs text-destructive">{errors.items}</p>
            )}
          </div>
        </div>

        {/* ════ Right column (2/5) — sticky ══════════════════════ */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20 space-y-4">
            {/* ── Summary panel ──────────────────────────────────── */}
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
                    {formatCurrency(subtotalGravado)}
                  </span>
                </div>

                {totalDescuentos > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuentos:</span>
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

            {/* ── Actions panel ──────────────────────────────────── */}
            <div className="glass-card p-4 space-y-2">
              <Button
                className="w-full btn-primary justify-center"
                onClick={handleEmit}
                disabled={!canEmit() || isEmitting}
              >
                {isEmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Emitiendo...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Emitir Factura
                  </>
                )}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 justify-center"
                  onClick={() => setShowPreview(true)}
                  disabled={items.length === 0}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 justify-center"
                  onClick={handleSaveDraft}
                  disabled={items.length === 0 && !cliente}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Borrador
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full justify-center text-muted-foreground"
                onClick={() => setShowSaveTemplate(true)}
                disabled={items.length === 0}
              >
                <Files className="w-4 h-4 mr-2" />
                Guardar como plantilla
              </Button>
            </div>

            {/* ── Templates ──────────────────────────────────────── */}
            <PlantillasPanel onSelectTemplate={handleSelectTemplate} />

            {/* ── Favorites ──────────────────────────────────────── */}
            <FavoritosPanel onSelectFavorite={handleSelectFavorite} />

            {/* ── Keyboard hint ──────────────────────────────────── */}
            <div className="hidden lg:flex items-center justify-center gap-4 text-xs text-muted-foreground py-2">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">
                  {getShortcutDisplay('mod+enter')}
                </kbd>{' '}
                Emitir
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">
                  {getShortcutDisplay('mod+s')}
                </kbd>{' '}
                Borrador
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">
                  {getShortcutDisplay('mod+p')}
                </kbd>{' '}
                Preview
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}
      <FacturaPreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        onEmit={handleEmit}
        data={{ tipoDte, cliente, items, condicionPago }}
        isEmitting={isEmitting}
      />

      <NuevoClienteModal
        open={showNuevoCliente}
        onClose={() => setShowNuevoCliente(false)}
        onCreated={handleClienteCreated}
        tipoDte={tipoDte}
      />

      <GuardarPlantillaModal
        open={showSaveTemplate}
        onOpenChange={setShowSaveTemplate}
        tipoDte={tipoDte}
        items={items}
        condicionPago={condicionPago}
        cliente={cliente || undefined}
      />
    </div>
  );
}
