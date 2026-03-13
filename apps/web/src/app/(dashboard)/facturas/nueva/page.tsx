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
import { useTranslations } from 'next-intl';
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
interface SucursalOption {
  id: string;
  nombre: string;
  codEstableMH: string;
  puntosVenta?: PuntoVentaOption[];
}

interface PuntoVentaOption {
  id: string;
  nombre: string;
  codPuntoVentaMH: string;
}

type CreatableTipoDte = '01' | '03' | '04' | '05' | '06' | '07' | '09' | '11' | '14' | '34';

const DTE_TYPE_OPTIONS: { value: CreatableTipoDte; label: string; group: string }[] = [
  { value: '01', label: 'Factura', group: 'Facturación' },
  { value: '03', label: 'Crédito Fiscal (CCF)', group: 'Facturación' },
  { value: '11', label: 'Factura de Exportación', group: 'Facturación' },
  { value: '14', label: 'Sujeto Excluido', group: 'Facturación' },
  { value: '04', label: 'Nota de Remisión', group: 'Notas' },
  { value: '05', label: 'Nota de Crédito', group: 'Notas' },
  { value: '06', label: 'Nota de Débito', group: 'Notas' },
  { value: '07', label: 'Comprobante de Retención', group: 'Retención' },
  { value: '34', label: 'Retención CRS', group: 'Retención' },
  { value: '09', label: 'Documento de Liquidación', group: 'Liquidación' },
];

/** Types that require a receptor with NRC (NIT-based) */
const REQUIRES_NRC: CreatableTipoDte[] = ['03', '04', '05', '06', '07'];
/** Types that require documentoRelacionado */
const REQUIRES_DOC_RELACIONADO: CreatableTipoDte[] = ['04', '05', '06'];
/** Types that use the standard items + IVA flow */
const STANDARD_ITEMS_TYPES: CreatableTipoDte[] = ['01', '03', '04', '05', '06', '11', '14'];

interface FacturaFormState {
  tipoDte: CreatableTipoDte;
  cliente: Cliente | null;
  items: ItemFactura[];
  condicionPago: string;
  sucursalId: string;
  puntoVentaId: string;
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
  sucursalId: '',
  puntoVentaId: '',
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
  const t = useTranslations('invoices');
  const tCommon = useTranslations('common');
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

  // ── Sucursales state ───────────────────────────────────────────────
  const [sucursales, setSucursales] = React.useState<SucursalOption[]>([]);
  const [puntosVenta, setPuntosVenta] = React.useState<PuntoVentaOption[]>([]);

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

  const { tipoDte, cliente, items, condicionPago, sucursalId, puntoVentaId } = formState;

  // ── Load sucursales on mount ───────────────────────────────────────
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/sucursales`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setSucursales(list);
        // Auto-select the principal sucursal if only one
        if (list.length === 1) {
          setFormState(prev => ({ ...prev, sucursalId: list[0].id }));
        } else {
          const principal = list.find((s: SucursalOption & { esPrincipal?: boolean }) => s.esPrincipal);
          if (principal) {
            setFormState(prev => ({ ...prev, sucursalId: principal.id }));
          }
        }
      })
      .catch(() => { /* non-critical */ });
  }, []);

  // ── Load puntos de venta when sucursal changes ─────────────────────
  React.useEffect(() => {
    if (!sucursalId) {
      setPuntosVenta([]);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/sucursales/${sucursalId}/puntos-venta`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setPuntosVenta(list);
        // Auto-select if only one PV
        if (list.length === 1) {
          setFormState(prev => ({ ...prev, puntoVentaId: list[0].id }));
        } else if (list.length > 0 && !list.some((pv: PuntoVentaOption) => pv.id === puntoVentaId)) {
          setFormState(prev => ({ ...prev, puntoVentaId: '' }));
        }
      })
      .catch(() => { /* non-critical */ });
  }, [sucursalId]);

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
        toastRef.current.success(t('draftRecovered'));
      } catch {
        toastRef.current.error(t('draftRecoverError'));
      }
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    toastRef.current.info(t('draftDiscarded'));
  };

  const handleSaveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formState));
    toastRef.current.success(t('draftSaved'));
  };

  // ── Template handler ─────────────────────────────────────────────
  const handleSelectTemplate = (template: InvoiceTemplate) => {
    const usedTemplate = useTemplate(template.id);
    if (!usedTemplate) return;

    const newItems: ItemFactura[] = usedTemplate.items.map((item, index) => ({
      ...item,
      id: `item-${Date.now()}-${index}`,
    }));

    setFormState(prev => ({
      ...prev,
      tipoDte: (usedTemplate.tipoDte || '01') as CreatableTipoDte,
      cliente: usedTemplate.cliente as Cliente | null,
      items: newItems,
      condicionPago: usedTemplate.condicionPago,
    }));

    toastRef.current.success(t('templateApplied', { name: template.name }));
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
    toastRef.current.success(t('favoriteAdded', { name: favorite.descripcion }));
  };

  // ── Catalog item handler ─────────────────────────────────────────
  const handleCatalogSelect = (catalogItem: CatalogItem) => {
    const cantidad = 1;
    const precioUnitario = Number(catalogItem.basePrice);
    const subtotal = cantidad * precioUnitario;
    // Use catalog item's tributo to determine if gravado (20=IVA, 10=Exento, 30=NoSujeto)
    const esGravado = !catalogItem.tributo || catalogItem.tributo === '20';
    const taxRate = catalogItem.taxRate ?? 13;
    const iva = esGravado ? subtotal * (taxRate / 100) : 0;
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
    toastRef.current.success(t('catalogItemAdded', { name: catalogItem.name }));
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

          setFormState(prev => ({
            ...prev,
            tipoDte: dte.tipoDte as CreatableTipoDte,
            cliente: null,
            items: duplicatedItems,
            condicionPago: '01',
          }));
          toastRef.current.success(t('duplicateMsg'));
        } catch {
          toastRef.current.error(t('loadDuplicateError'));
        }
      }
    } catch {
      toastRef.current.error(t('cantLoadDuplicate'));
    }
  };

  // ── Validation ───────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (REQUIRES_NRC.includes(tipoDte)) {
      if (!cliente) {
        newErrors.cliente = t('selectClientCcf');
      } else if (!cliente.nrc) {
        newErrors.cliente = t('clientNeedNrc');
      }
    }

    if (items.length === 0) {
      newErrors.items = t('addItems');
    }

    const invalidItems = items.filter((i) => i.precioUnitario <= 0);
    if (invalidItems.length > 0) {
      newErrors.items = t('itemsPriceZero');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canEmit = () => {
    if (items.length === 0) return false;
    if (REQUIRES_NRC.includes(tipoDte) && (!cliente || !cliente.nrc)) return false;
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
        throw new Error(t('noSessionLogin'));
      }

      const getSubtotal = () => items.reduce((sum, i) => sum + i.subtotal, 0);
      const getTotalIvaCalc = () => items.reduce((sum, i) => sum + i.iva, 0);
      const getTotal = () => items.reduce((sum, i) => sum + i.total, 0);

      // Build DTE data — IDENTICAL structure to original
      const dteData = {
        tipoDte,
        sucursalId: sucursalId || undefined,
        puntoVentaId: puntoVentaId || undefined,
        data: {
          identificacion: {
            version: { '01': 1, '03': 3, '04': 3, '05': 3, '06': 3, '07': 3, '09': 1, '11': 1, '14': 1, '34': 1 }[tipoDte] || 1,
            ambiente: '00', // Backend overrides with tenant's actual HaciendaConfig
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
            ventaExenta: item.esExento ? item.subtotal : 0,
            ventaGravada: item.esGravado ? item.subtotal : 0,
            tributos: item.esGravado ? ['20'] : null,
            psv: 0,
            noGravado: 0,
            ivaItem: item.iva,
          })),
          resumen: {
            totalNoSuj: 0,
            totalExenta: items.filter(i => i.esExento).reduce((sum, i) => sum + i.subtotal, 0),
            totalGravada: items.filter(i => i.esGravado).reduce((sum, i) => sum + i.subtotal, 0),
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
          : t('unknownError');
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
    toastRef.current.success(t('clientCreated', { name: newCliente.nombre }));
  };

  // ── Post-success handlers ────────────────────────────────────────
  const handleNewInvoice = () => {
    setFormState(prev => ({ ...initialState, sucursalId: prev.sucursalId, puntoVentaId: prev.puntoVentaId }));
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
              {t('invoiceEmitted')}
            </h1>
            <p className="text-muted-foreground">
              {t('invoiceEmittedDesc')}
            </p>
          </div>

          <div className="glass-card p-4 text-left">
            <div className="text-sm text-muted-foreground mb-1">
              {t('controlNumber')}
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
              {t('newInvoiceBtn')}
            </Button>
            <Button onClick={handleViewInvoice} className="btn-primary">
              {t('seeDetail')}
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
            {tCommon('back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              {t('createTitle')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('createSubtitle')}
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
              {t('emitting')}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {t('emit')}
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
              {t('typeLabel')}
            </label>
            <Select
              value={tipoDte}
              onValueChange={(v) => updateForm('tipoDte', v as CreatableTipoDte)}
            >
              <SelectTrigger className="w-[260px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DTE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.value} - {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-8 w-px bg-border" />

          {/* Condicion de pago */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {t('conditionLabel')}
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

          {/* Sucursal / Punto de Venta selectors */}
          {sucursales.length > 0 && (
            <>
              <div className="hidden sm:block h-8 w-px bg-border" />

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Sucursal
                </label>
                <Select
                  value={sucursalId}
                  onValueChange={(v) => {
                    setFormState(prev => ({ ...prev, sucursalId: v, puntoVentaId: '' }));
                  }}
                >
                  <SelectTrigger className="w-[180px] input-rc">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre} ({s.codEstableMH})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {puntosVenta.length > 0 && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Punto de Venta
                  </label>
                  <Select
                    value={puntoVentaId}
                    onValueChange={(v) => updateForm('puntoVentaId', v)}
                  >
                    <SelectTrigger className="w-[180px] input-rc">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {puntosVenta.map((pv) => (
                        <SelectItem key={pv.id} value={pv.id}>
                          {pv.nombre} ({pv.codPuntoVentaMH})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Draft recovery ──────────────────────────────────────── */}
      {hasDraft && (
        <div className="glass-card p-4 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <Save className="w-5 h-5 text-warning" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('hasDraft')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('draftAutoSave')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleDiscardDraft}>
              {t('discard')}
            </Button>
            <Button
              size="sm"
              onClick={handleLoadDraft}
              className="btn-primary"
            >
              {t('recover')}
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
                {t('clientSection')}
              </h2>
              {REQUIRES_NRC.includes(tipoDte) && !cliente && (
                <span className="text-xs text-destructive">
                  * {t('requiredForCcf')}
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
              {t('itemsSection')}
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
                <h3 className="font-semibold text-foreground">{t('summary')}</h3>
                {items.length > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('subtotalLabel')}</span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(subtotalGravado)}
                  </span>
                </div>

                {totalDescuentos > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('discountsLabel')}</span>
                    <span className="text-warning font-medium">
                      -{formatCurrency(totalDescuentos)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('ivaLabel')}</span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(totalIva)}
                  </span>
                </div>

                <div className="h-px bg-primary/30" />

                <div className="flex justify-between items-center pt-1">
                  <span className="text-lg font-semibold text-foreground">
                    {t('totalLabel')}
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
                    {t('emitting')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {t('emitInvoice')}
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
                  {t('preview')}
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 justify-center"
                  onClick={handleSaveDraft}
                  disabled={items.length === 0 && !cliente}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t('draft')}
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full justify-center text-muted-foreground"
                onClick={() => setShowSaveTemplate(true)}
                disabled={items.length === 0}
              >
                <Files className="w-4 h-4 mr-2" />
                {t('saveTemplate')}
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
                {t('emit')}
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">
                  {getShortcutDisplay('mod+s')}
                </kbd>{' '}
                {t('draft')}
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">
                  {getShortcutDisplay('mod+p')}
                </kbd>{' '}
                {t('preview')}
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
