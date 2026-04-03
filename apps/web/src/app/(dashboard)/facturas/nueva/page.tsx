'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { API_URL } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ClienteSearch } from '@/components/facturas/cliente-search';
import { CatalogSearch } from '@/components/facturas/catalog-search';
import type { CatalogItem } from '@/components/facturas/catalog-search';
import { ItemsTable } from '@/components/facturas/items-table';
import { FacturaPreview } from '@/components/facturas/factura-preview';
import { NuevoClienteModal } from '@/components/facturas/nuevo-cliente-modal';
import { PaymentMethodModal } from '@/components/facturas/payment-method-modal';
import { useTemplatesStore, InvoiceTemplate, FavoriteItem } from '@/store/templates';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';
import type { Cliente, ItemFactura } from '@/types';
import { InvoiceFormHeader } from './components/InvoiceFormHeader';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useSyncQueueStore } from '@/store/sync-queue';
import { useAppStore } from '@/store';
import { db } from '@/lib/db';
import { MobileWizard } from '@/components/mobile/mobile-wizard';
import { SignaturePad } from '@/components/facturas/signature-pad';
import { useDtePolling } from '@/hooks/use-dte-polling';

const InvoiceSuccessView = dynamic(() => import('./components/InvoiceSuccessView').then(m => ({ default: m.InvoiceSuccessView })), { ssr: false });
const InvoiceSummaryPanel = dynamic(() => import('./components/InvoiceSummaryPanel').then(m => ({ default: m.InvoiceSummaryPanel })));

// ── Constants ──────────────────────────────────────────────────────
const DRAFT_KEY = 'factura-draft';
const AUTOSAVE_INTERVAL = 30000;

type CreatableTipoDte = '01' | '03' | '04' | '05' | '06' | '07' | '09' | '11' | '14' | '34';
const REQUIRES_NRC: CreatableTipoDte[] = ['03', '04', '05', '06', '07'];

interface SucursalOption { id: string; nombre: string; codEstableMH: string; puntosVenta?: PuntoVentaOption[]; }
interface PuntoVentaOption { id: string; nombre: string; codPuntoVentaMH: string; }

interface FacturaFormState {
  tipoDte: CreatableTipoDte;
  cliente: Cliente | null;
  items: ItemFactura[];
  condicionPago: string;
  sucursalId: string;
  puntoVentaId: string;
}

interface CatalogItemRef { itemId: string; catalogId: string; }

const initialState: FacturaFormState = { tipoDte: '01', cliente: null, items: [], condicionPago: '01', sucursalId: '', puntoVentaId: '' };

async function trackCatalogUsage(catalogIds: string[]) {
  if (catalogIds.length === 0) return;
  try { await fetch(`${API_URL}/catalog-items/track-usage`, { credentials: 'include', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: catalogIds }) }); } catch {}
}

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

  const [formState, setFormState] = React.useState<FacturaFormState>(initialState);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [catalogRefs, setCatalogRefs] = React.useState<CatalogItemRef[]>([]);
  const [sucursales, setSucursales] = React.useState<SucursalOption[]>([]);
  const [puntosVenta, setPuntosVenta] = React.useState<PuntoVentaOption[]>([]);
  const [isEmitting, setIsEmitting] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [showNuevoCliente, setShowNuevoCliente] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [successData, setSuccessData] = React.useState<{ id: string; numeroControl: string } | null>(null);
  const [hasDraft, setHasDraft] = React.useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = React.useState(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [mobileStep, setMobileStep] = React.useState(0);
  const [signature, setSignature] = React.useState<string | null>(null);
  const [submittedDteId, setSubmittedDteId] = React.useState<string | null>(null);

  const { isOnline } = useOnlineStatus();
  const addOp = useSyncQueueStore((s) => s.addOp);
  const tenant = useAppStore((s) => s.tenant);
  const { isTerminal: _isTerminal } = useDtePolling(submittedDteId);

  const { tipoDte, cliente, items, condicionPago, sucursalId, puntoVentaId } = formState;

  // ── Load sucursales ─────────────────────────────────────────────
  React.useEffect(() => {
    fetch(`${API_URL}/sucursales`, { credentials: 'include', headers: {} })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setSucursales(list);
        if (list.length === 1) setFormState(prev => ({ ...prev, sucursalId: list[0].id }));
        else { const principal = list.find((s: SucursalOption & { esPrincipal?: boolean }) => s.esPrincipal); if (principal) setFormState(prev => ({ ...prev, sucursalId: principal.id })); }
      }).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (!sucursalId) { setPuntosVenta([]); return; }
    fetch(`${API_URL}/sucursales/${sucursalId}/puntos-venta`, { credentials: 'include', headers: {} })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setPuntosVenta(list);
        if (list.length === 1) setFormState(prev => ({ ...prev, puntoVentaId: list[0].id }));
        else if (list.length > 0 && !list.some((pv: PuntoVentaOption) => pv.id === puntoVentaId)) setFormState(prev => ({ ...prev, puntoVentaId: '' }));
      }).catch(() => {});
  }, [sucursalId]);

  // ── Computed totals ─────────────────────────────────────────────
  const subtotalGravado = items.reduce((sum, i) => sum + i.subtotal, 0);
  const totalDescuentos = items.reduce((sum, i) => sum + i.descuento, 0);
  const totalIva = items.reduce((sum, i) => sum + i.iva, 0);
  const totalPagar = items.reduce((sum, i) => sum + i.total, 0);

  // ── Draft ───────────────────────────────────────────────────────
  React.useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) { try { const d = JSON.parse(saved); if (d.items?.length > 0 || d.cliente) setHasDraft(true); } catch {} }
  }, []);

  React.useEffect(() => {
    if (items.length === 0 && !cliente) return;
    const interval = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formState));
      // Also persist to Dexie for offline resilience
      if (tenant?.id) {
        db.appCache.put({
          key: `factura-draft-${tenant.id}`,
          value: JSON.stringify({
            tipoDte: formState.tipoDte,
            cliente: formState.cliente,
            items: formState.items,
            condicionPago: formState.condicionPago,
          }),
        }).catch(() => {}); // Non-critical
      }
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [formState, items.length, cliente, tenant?.id]);

  useKeyboardShortcuts({ 'mod+enter': () => { if (canEmit()) handleEmit(); }, 'mod+s': () => handleSaveDraft(), 'mod+p': () => setShowPreview(true), 'mod+t': () => { if (items.length > 0) setShowSaveTemplate(true); }, escape: () => { setShowPreview(false); setShowNuevoCliente(false); setShowSaveTemplate(false); } }, { enabled: !isEmitting });

  // ── Helpers ─────────────────────────────────────────────────────
  const updateForm = <K extends keyof FacturaFormState>(key: K, value: FacturaFormState[K]) => {
    setFormState(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleLoadDraft = () => { const s = localStorage.getItem(DRAFT_KEY); if (s) { try { setFormState(JSON.parse(s)); setHasDraft(false); toastRef.current.success(t('draftRecovered')); } catch { toastRef.current.error(t('draftRecoverError')); } } };
  const handleDiscardDraft = () => { localStorage.removeItem(DRAFT_KEY); setHasDraft(false); toastRef.current.info(t('draftDiscarded')); };
  const handleSaveDraft = () => { localStorage.setItem(DRAFT_KEY, JSON.stringify(formState)); toastRef.current.success(t('draftSaved')); };

  const handleSelectTemplate = (template: InvoiceTemplate) => {
    const used = useTemplate(template.id); if (!used) return;
    const newItems: ItemFactura[] = used.items.map((item, i) => ({ ...item, id: `item-${Date.now()}-${i}` }));
    setFormState(prev => ({ ...prev, tipoDte: (used.tipoDte || '01') as CreatableTipoDte, cliente: used.cliente as Cliente | null, items: newItems, condicionPago: used.condicionPago }));
    toastRef.current.success(t('templateApplied', { name: template.name }));
  };

  const handleSelectFavorite = (favorite: FavoriteItem) => {
    useFavorite(favorite.id);
    const subtotal = favorite.precioUnitario;
    const iva = favorite.esGravado ? subtotal * 0.13 : 0;
    updateForm('items', [...items, { id: `item-${Date.now()}`, codigo: favorite.codigo, descripcion: favorite.descripcion, cantidad: 1, precioUnitario: favorite.precioUnitario, esGravado: favorite.esGravado, esExento: !favorite.esGravado, descuento: 0, subtotal, iva, total: subtotal + iva }]);
    toastRef.current.success(t('favoriteAdded', { name: favorite.descripcion }));
  };

  const handleCatalogSelect = (catalogItem: CatalogItem) => {
    const precio = Number(catalogItem.basePrice);
    const esGravado = !catalogItem.tributo || catalogItem.tributo === '20';
    const rate = catalogItem.taxRate ?? 13;
    const iva = esGravado ? precio * (rate / 100) : 0;
    const itemId = `item-${Date.now()}`;
    updateForm('items', [...items, { id: itemId, codigo: catalogItem.code, descripcion: catalogItem.name, cantidad: 1, precioUnitario: precio, esGravado, esExento: !esGravado, descuento: 0, subtotal: precio, iva, total: precio + iva }]);
    setCatalogRefs(prev => [...prev, { itemId, catalogId: catalogItem.id }]);
    toastRef.current.success(t('catalogItemAdded', { name: catalogItem.name }));
  };

  // ── Duplicate from URL ──────────────────────────────────────────
  React.useEffect(() => { const did = searchParams.get('duplicate'); if (did) loadInvoiceForDuplicate(did); }, [searchParams]);

  const loadInvoiceForDuplicate = async (dteId: string) => {
    try {
      const res = await fetch(`${API_URL}/dte/${dteId}`, { credentials: 'include', headers: {} }); if (!res.ok) return;
      const dte = await res.json();
      if (dte.jsonOriginal) {
        const orig = JSON.parse(dte.jsonOriginal);
        const cuerpo = orig.cuerpoDocumento || [];
        const duped: ItemFactura[] = cuerpo.map((item: Record<string, unknown>, i: number) => ({ id: `item-${Date.now()}-${i}`, codigo: item.codigo || '', descripcion: item.descripcion as string, cantidad: item.cantidad as number, precioUnitario: item.precioUni as number, esGravado: (item.ventaGravada as number) > 0, esExento: (item.ventaExenta as number) > 0, descuento: (item.montoDescu as number) || 0, subtotal: (item.ventaGravada as number) || (item.ventaExenta as number) || 0, iva: (item.ivaItem as number) || 0, total: ((item.ventaGravada as number) || 0) + ((item.ivaItem as number) || 0) }));
        setFormState(prev => ({ ...prev, tipoDte: dte.tipoDte as CreatableTipoDte, cliente: null, items: duped, condicionPago: '01' }));
        toastRef.current.success(t('duplicateMsg'));
      }
    } catch { toastRef.current.error(t('cantLoadDuplicate')); }
  };

  // ── Validation ─────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const ne: Record<string, string> = {};
    if (REQUIRES_NRC.includes(tipoDte)) { if (!cliente) ne.cliente = t('selectClientCcf'); else if (!cliente.nrc) ne.cliente = t('clientNeedNrc'); }
    if (items.length === 0) ne.items = t('addItems');
    if (items.some(i => i.precioUnitario <= 0)) ne.items = t('itemsPriceZero');
    setErrors(ne); return Object.keys(ne).length === 0;
  };

  const canEmit = () => items.length > 0 && !(REQUIRES_NRC.includes(tipoDte) && (!cliente || !cliente.nrc));

  // ── Emit ───────────────────────────────────────────────────────
  const handleEmit = async () => {
    if (!validateForm()) return;
    setIsEmitting(true); setErrors({});
    try {
      const getSub = () => items.reduce((s, i) => s + i.subtotal, 0);
      const getIva = () => items.reduce((s, i) => s + i.iva, 0);
      const getTot = () => items.reduce((s, i) => s + i.total, 0);
      const dteData = { tipoDte, sucursalId: sucursalId || undefined, puntoVentaId: puntoVentaId || undefined, data: { identificacion: { version: { '01': 1, '03': 3, '04': 3, '05': 3, '06': 3, '07': 3, '09': 1, '11': 1, '14': 1, '34': 1 }[tipoDte] || 1, ambiente: '00', tipoDte, numeroControl: null, codigoGeneracion: null, tipoModelo: 1, tipoOperacion: 1, tipoContingencia: null, fecEmi: new Date().toISOString().split('T')[0], horEmi: new Date().toTimeString().split(' ')[0], tipoMoneda: 'USD' }, receptor: cliente ? { tipoDocumento: cliente.tipoDocumento || '13', numDocumento: cliente.numDocumento || null, nrc: cliente.nrc || null, nombre: cliente.nombre, codActividad: cliente.codActividad || null, descActividad: cliente.descActividad || null, direccion: cliente.direccion || null, telefono: cliente.telefono || null, correo: cliente.correo || null } : null, cuerpoDocumento: items.map((item, index) => ({ numItem: index + 1, tipoItem: 1, codigo: item.codigo || null, descripcion: item.descripcion, cantidad: item.cantidad, uniMedida: 59, precioUni: item.precioUnitario, montoDescu: item.descuento, ventaNoSuj: 0, ventaExenta: item.esExento ? item.subtotal : 0, ventaGravada: item.esGravado ? item.subtotal : 0, tributos: item.esGravado ? ['20'] : null, psv: 0, noGravado: 0, ivaItem: item.iva })), resumen: { totalNoSuj: 0, totalExenta: items.filter(i => i.esExento).reduce((s, i) => s + i.subtotal, 0), totalGravada: items.filter(i => i.esGravado).reduce((s, i) => s + i.subtotal, 0), subTotalVentas: getSub(), descuNoSuj: 0, descuExenta: 0, descuGravada: items.reduce((s, i) => s + i.descuento, 0), porcentajeDescuento: 0, totalDescu: items.reduce((s, i) => s + i.descuento, 0), tributos: null, subTotal: getSub(), ivaRete1: 0, reteRenta: 0, montoTotalOperacion: getTot(), totalNoGravado: 0, totalPagar: getTot(), totalLetras: '', totalIva: getIva(), saldoFavor: 0, condicionOperacion: parseInt(condicionPago), pagos: null, numPagoElectronico: null } } };

      // ── Offline path: queue to sync engine ──────────────────────
      if (!isOnline) {
        await addOp('CREATE_INVOICE', dteData as unknown as Record<string, unknown>);

        // Save locally to Dexie for offline invoice list
        if (tenant?.id) {
          await db.invoices.add({
            tenantId: tenant.id,
            codigoGeneracion: `offline_${Date.now()}`,
            tipoDte,
            estado: 'OFFLINE_PENDING',
            totalPagar: getTot(),
            receptorNombre: cliente?.nombre,
            receptorDocumento: cliente?.numDocumento,
            createdAt: new Date().toISOString(),
          });
        }

        toastRef.current.success('Factura guardada offline — se enviará al tener conexión');
        localStorage.removeItem(DRAFT_KEY);
        if (tenant?.id) {
          db.appCache.delete(`factura-draft-${tenant.id}`).catch(() => {});
        }
        setFormState(prev => ({ ...initialState, sucursalId: prev.sucursalId, puntoVentaId: prev.puntoVentaId }));
        setCatalogRefs([]);
        setMobileStep(0);
        setIsEmitting(false);
        return;
      }

      // ── Online path: POST to API ───────────────────────────────
      const res = await fetch(`${API_URL}/dte`, { credentials: 'include', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dteData) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as { message?: string }).message || 'Error al crear el DTE'); }
      const created = await res.json();
      trackCatalogUsage(catalogRefs.filter(r => items.some(i => i.id === r.itemId)).map(r => r.catalogId));
      setSuccessData({ id: created.id, numeroControl: created.numeroControl || created.codigoGeneracion });
      setSubmittedDteId(created.id);
      setShowPreview(false); localStorage.removeItem(DRAFT_KEY);
      if (['01', '03', '11', '14'].includes(tipoDte) && condicionPago === '01') setShowPaymentModal(true);
      else setShowSuccess(true);
      try { const confetti = (await import('canvas-confetti')).default; confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#8b5cf6', '#06b6d4', '#22c55e'] }); } catch {}
    } catch (error) { const msg = error instanceof Error ? error.message : t('unknownError'); setErrors({ submit: msg }); toastRef.current.error(msg); }
    finally { setIsEmitting(false); }
  };

  const handleClienteCreated = (c: Cliente) => { updateForm('cliente', c); setShowNuevoCliente(false); toastRef.current.success(t('clientCreated', { name: c.nombre })); };
  const handleNewInvoice = () => { setFormState(prev => ({ ...initialState, sucursalId: prev.sucursalId, puntoVentaId: prev.puntoVentaId })); setCatalogRefs([]); setShowSuccess(false); setSuccessData(null); setErrors({}); };
  const handleViewInvoice = () => { if (successData?.id) router.push(`/facturas/${successData.id}`); };

  // ── Render: Payment modal ──────────────────────────────────────
  if (showPaymentModal && successData) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center"><div className="text-center space-y-4 max-w-md mx-auto"><Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" /><p className="text-muted-foreground">Registrando pago...</p></div></div>
        <PaymentMethodModal open={showPaymentModal} onOpenChange={setShowPaymentModal} dteId={successData.id} onSuccess={() => { setShowPaymentModal(false); setShowSuccess(true); }} onSkip={() => { setShowPaymentModal(false); setShowSuccess(true); }} />
      </>
    );
  }

  // ── Render: Success ────────────────────────────────────────────
  if (showSuccess && successData) {
    return <InvoiceSuccessView numeroControl={successData.numeroControl} onNewInvoice={handleNewInvoice} onViewInvoice={handleViewInvoice} t={t} />;
  }

  // ── Extracted form sections (shared by mobile wizard + desktop) ─
  const clienteSection = (
    <div className="space-y-4">
      <InvoiceFormHeader
        tipoDte={tipoDte} condicionPago={condicionPago} sucursalId={sucursalId} puntoVentaId={puntoVentaId}
        sucursales={sucursales} puntosVenta={puntosVenta}
        isEmitting={isEmitting} canEmit={canEmit()} hasDraft={hasDraft}
        onTipoDteChange={(v) => updateForm('tipoDte', v)} onCondicionChange={(v) => updateForm('condicionPago', v)}
        onSucursalChange={(v) => setFormState(prev => ({ ...prev, sucursalId: v, puntoVentaId: '' }))} onPuntoVentaChange={(v) => updateForm('puntoVentaId', v)}
        onBack={() => router.push('/facturas')} onEmit={handleEmit}
        onLoadDraft={handleLoadDraft} onDiscardDraft={handleDiscardDraft}
        t={t} tCommon={tCommon}
      />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('clientSection')}</h2>
          {REQUIRES_NRC.includes(tipoDte) && !cliente && <span className="text-xs text-destructive">* {t('requiredForCcf')}</span>}
        </div>
        <ClienteSearch value={cliente} onChange={(c) => updateForm('cliente', c)} onCreateNew={() => setShowNuevoCliente(true)} tipoDte={tipoDte} />
        {errors.cliente && <p className="text-xs text-destructive">{errors.cliente}</p>}
      </div>
    </div>
  );

  const itemsSection = (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('itemsSection')}</h2>
      <CatalogSearch onSelect={handleCatalogSelect} />
      <ItemsTable items={items} onChange={(ni) => updateForm('items', ni)} />
      {errors.items && <p className="text-xs text-destructive">{errors.items}</p>}
    </div>
  );

  const summarySection = (
    <InvoiceSummaryPanel
      items={items} tipoDte={tipoDte} condicionPago={condicionPago} cliente={cliente}
      subtotalGravado={subtotalGravado} totalDescuentos={totalDescuentos} totalIva={totalIva} totalPagar={totalPagar}
      isEmitting={isEmitting} canEmit={canEmit()} onEmit={handleEmit}
      onPreview={() => setShowPreview(true)} onSaveDraft={handleSaveDraft}
      onSaveTemplate={() => setShowSaveTemplate(true)}
      showSaveTemplate={showSaveTemplate} setShowSaveTemplate={setShowSaveTemplate}
      onSelectTemplate={handleSelectTemplate} onSelectFavorite={handleSelectFavorite} t={t}
    />
  );

  const confirmSection = (
    <div className="space-y-4">
      {/* Inline summary for mobile confirm step */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">{t('summary')}</h3>
        {cliente && <p className="text-sm text-muted-foreground">{t('clientSection')}: {cliente.nombre}</p>}
        <p className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
        <div className="h-px bg-border" />
        <div className="flex justify-between items-center">
          <span className="font-semibold text-foreground">{t('totalLabel')}</span>
          <span className="text-lg font-bold text-primary">${totalPagar.toFixed(2)}</span>
        </div>
        {!isOnline && (
          <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 text-sm text-warning">
            Sin conexion — la factura se guardara offline y se enviara automaticamente al reconectarse.
          </div>
        )}
      </div>
      {errors.submit && <div className="glass-card p-4 border-destructive/50"><p className="text-sm text-destructive">{errors.submit}</p></div>}
      <SignaturePad onSignatureChange={setSignature} />
    </div>
  );

  // ── Render: Main form ──────────────────────────────────────────
  return (
    <>
      {/* Mobile wizard — visible only on small screens */}
      <MobileWizard
        steps={[
          { label: 'Tipo y Cliente', content: clienteSection },
          { label: 'Productos', content: itemsSection },
          { label: 'Resumen', content: summarySection },
          { label: 'Confirmar', content: confirmSection },
        ]}
        currentStep={mobileStep}
        onStepChange={setMobileStep}
        onSubmit={handleEmit}
        submitLabel={isOnline ? 'Emitir Factura' : 'Guardar Offline'}
        isSubmitting={isEmitting}
      />

      {/* Desktop form — hidden on mobile */}
      <div className="hidden md:block">
        <div className="space-y-4">
          <InvoiceFormHeader
            tipoDte={tipoDte} condicionPago={condicionPago} sucursalId={sucursalId} puntoVentaId={puntoVentaId}
            sucursales={sucursales} puntosVenta={puntosVenta}
            isEmitting={isEmitting} canEmit={canEmit()} hasDraft={hasDraft}
            onTipoDteChange={(v) => updateForm('tipoDte', v)} onCondicionChange={(v) => updateForm('condicionPago', v)}
            onSucursalChange={(v) => setFormState(prev => ({ ...prev, sucursalId: v, puntoVentaId: '' }))} onPuntoVentaChange={(v) => updateForm('puntoVentaId', v)}
            onBack={() => router.push('/facturas')} onEmit={handleEmit}
            onLoadDraft={handleLoadDraft} onDiscardDraft={handleDiscardDraft}
            t={t} tCommon={tCommon}
          />

          {errors.submit && <div className="glass-card p-4 border-destructive/50 animate-in shake"><p className="text-sm text-destructive">{errors.submit}</p></div>}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left column */}
            <div className="lg:col-span-3 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('clientSection')}</h2>
                  {REQUIRES_NRC.includes(tipoDte) && !cliente && <span className="text-xs text-destructive">* {t('requiredForCcf')}</span>}
                </div>
                <ClienteSearch value={cliente} onChange={(c) => updateForm('cliente', c)} onCreateNew={() => setShowNuevoCliente(true)} tipoDte={tipoDte} />
                {errors.cliente && <p className="text-xs text-destructive">{errors.cliente}</p>}
              </div>
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('itemsSection')}</h2>
                <CatalogSearch onSelect={handleCatalogSelect} />
                <ItemsTable items={items} onChange={(ni) => updateForm('items', ni)} />
                {errors.items && <p className="text-xs text-destructive">{errors.items}</p>}
              </div>
            </div>

            {/* Right column */}
            <InvoiceSummaryPanel
              items={items} tipoDte={tipoDte} condicionPago={condicionPago} cliente={cliente}
              subtotalGravado={subtotalGravado} totalDescuentos={totalDescuentos} totalIva={totalIva} totalPagar={totalPagar}
              isEmitting={isEmitting} canEmit={canEmit()} onEmit={handleEmit}
              onPreview={() => setShowPreview(true)} onSaveDraft={handleSaveDraft}
              onSaveTemplate={() => setShowSaveTemplate(true)}
              showSaveTemplate={showSaveTemplate} setShowSaveTemplate={setShowSaveTemplate}
              onSelectTemplate={handleSelectTemplate} onSelectFavorite={handleSelectFavorite} t={t}
            />
          </div>

        </div>
      </div>

      {/* Modals (always rendered regardless of viewport) */}
      <FacturaPreview open={showPreview} onClose={() => setShowPreview(false)} onEmit={handleEmit} data={{ tipoDte, cliente, items, condicionPago }} isEmitting={isEmitting} />
      <NuevoClienteModal open={showNuevoCliente} onClose={() => setShowNuevoCliente(false)} onCreated={handleClienteCreated} tipoDte={tipoDte} />
    </>
  );
}
