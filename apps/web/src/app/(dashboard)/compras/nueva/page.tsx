'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { PurchaseFormHeader } from '@/components/purchases/purchase-form-header';
import { PurchaseLinesTable } from '@/components/purchases/purchase-lines-table';
import { PurchaseSummaryPanel } from '@/components/purchases/purchase-summary-panel';
import { MobileWizard } from '@/components/mobile/mobile-wizard';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import type {
  Purchase,
  PurchaseLine,
  Proveedor,
  FormaPago,
  TipoDocProveedor,
} from '@/types/purchase';
import type { DtePreviewResult } from '@/components/purchases/import-dte-modal';

// ── Constants ─────────────────────────────────────────────────────────

const LS_KEY = 'purchase-draft';
const AUTOSAVE_INTERVAL_MS = 5000;

// ── Draft shape ───────────────────────────────────────────────────────

interface PurchaseDraft {
  proveedor?: Proveedor;
  tipoDoc: TipoDocProveedor;
  numDoc: string;
  fechaDoc: string;
  fechaContable: string;
  lineas: PurchaseLine[];
  recibirDespues: boolean;
  ivaRetenidoOverride: boolean | null;
  isrRetenidoPct: number | null;
  formaPago: FormaPago;
  cuentaPagoId?: string;
  fechaPago?: string;
  fechaVencimiento?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function initialDraft(): PurchaseDraft {
  return {
    proveedor: undefined,
    tipoDoc: 'CCF',
    numDoc: '',
    fechaDoc: todayIso(),
    fechaContable: todayIso(),
    lineas: [],
    recibirDespues: false,
    ivaRetenidoOverride: null,
    isrRetenidoPct: null,
    formaPago: 'credito',
    cuentaPagoId: undefined,
    fechaPago: undefined,
    fechaVencimiento: undefined,
  };
}

function mapPreviewToLineas(preview: DtePreviewResult): PurchaseLine[] {
  return preview.lineas.map((l) => ({
    tipo: 'bien' as const,
    descripcion: l.descripcion,
    cantidad: l.cantidad,
    precioUnit: l.precioUnit,
    descuentoPct: 0,
    ivaAplica: l.ivaAplica,
    totalLinea: l.cantidad * l.precioUnit,
  }));
}

// ── Validation ────────────────────────────────────────────────────────

interface ValidationError {
  message: string;
}

function validateDraft(draft: PurchaseDraft): ValidationError | null {
  if (!draft.proveedor) {
    return { message: 'Debes seleccionar un proveedor.' };
  }
  if (!draft.numDoc.trim()) {
    return { message: 'El número de documento es requerido.' };
  }
  if (draft.lineas.length === 0) {
    return { message: 'Debes agregar al menos una línea.' };
  }
  for (let i = 0; i < draft.lineas.length; i++) {
    const l = draft.lineas[i];
    if (l.tipo === 'bien') {
      if (!l.itemId) return { message: `Línea ${i + 1}: debes seleccionar un ítem.` };
      if ((l.cantidad ?? 0) <= 0) return { message: `Línea ${i + 1}: cantidad debe ser mayor a 0.` };
      if ((l.precioUnit ?? 0) <= 0) return { message: `Línea ${i + 1}: precio debe ser mayor a 0.` };
    } else {
      if (!l.cuentaContableId) return { message: `Línea ${i + 1}: debes seleccionar una cuenta contable.` };
      if ((l.monto ?? 0) <= 0) return { message: `Línea ${i + 1}: monto debe ser mayor a 0.` };
    }
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════
export default function NuevaCompraPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // ── State ─────────────────────────────────────────────────────────
  const [proveedor, setProveedor] = React.useState<Proveedor | undefined>();
  const [tipoDoc, setTipoDoc] = React.useState<TipoDocProveedor>('CCF');
  const [numDoc, setNumDoc] = React.useState('');
  const [fechaDoc, setFechaDoc] = React.useState(todayIso);
  const [fechaContable, setFechaContable] = React.useState(todayIso);
  const [lineas, setLineas] = React.useState<PurchaseLine[]>([]);
  const [recibirDespues, setRecibirDespues] = React.useState(false);
  const [ivaRetenidoOverride, setIvaRetenidoOverride] = React.useState<boolean | null>(null);
  const [isrRetenidoPct, setIsrRetenidoPct] = React.useState<number | null>(null);
  const [formaPago, setFormaPago] = React.useState<FormaPago>('credito');
  const [cuentaPagoId, setCuentaPagoId] = React.useState<string | undefined>();
  const [fechaPago, setFechaPago] = React.useState<string | undefined>();
  const [fechaVencimiento, setFechaVencimiento] = React.useState<string | undefined>();
  const [saving, setSaving] = React.useState(false);
  const [mobileStep, setMobileStep] = React.useState(0);
  const [hydrated, setHydrated] = React.useState(false);

  // ── Hydration on mount ────────────────────────────────────────────
  React.useEffect(() => {
    const source = searchParams.get('source');

    if (source === 'imported') {
      // Restore from sessionStorage (DTE import)
      try {
        const raw = sessionStorage.getItem('dte-import-prefill');
        if (raw) {
          const data = JSON.parse(raw) as DtePreviewResult;
          sessionStorage.removeItem('dte-import-prefill');
          const mappedLineas = mapPreviewToLineas(data);
          setLineas(mappedLineas);
          // Proveedor lookup by numDocumento would require an API call;
          // leave blank for user to confirm/select.
          toast.info(
            `DTE importado: ${mappedLineas.length} líneas. Selecciona el proveedor y ajusta los datos.`,
          );
        }
      } catch {
        toast.error('No se pudo restaurar el DTE importado.');
      }
    } else {
      // Restore from localStorage draft
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
          const draft = JSON.parse(raw) as PurchaseDraft;
          if (draft.proveedor) setProveedor(draft.proveedor);
          setTipoDoc(draft.tipoDoc ?? 'CCF');
          setNumDoc(draft.numDoc ?? '');
          setFechaDoc(draft.fechaDoc ?? todayIso());
          setFechaContable(draft.fechaContable ?? todayIso());
          setLineas(draft.lineas ?? []);
          setRecibirDespues(draft.recibirDespues ?? false);
          setIvaRetenidoOverride(draft.ivaRetenidoOverride ?? null);
          setIsrRetenidoPct(draft.isrRetenidoPct ?? null);
          setFormaPago(draft.formaPago ?? 'credito');
          setCuentaPagoId(draft.cuentaPagoId);
          setFechaPago(draft.fechaPago);
          setFechaVencimiento(draft.fechaVencimiento);
          toast.info('Borrador restaurado.');
        }
      } catch {
        // Non-critical — ignore corrupt drafts
      }
    }

    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Autosave every 5s ─────────────────────────────────────────────
  React.useEffect(() => {
    if (!hydrated) return;

    const draft: PurchaseDraft = {
      proveedor,
      tipoDoc,
      numDoc,
      fechaDoc,
      fechaContable,
      lineas,
      recibirDespues,
      ivaRetenidoOverride,
      isrRetenidoPct,
      formaPago,
      cuentaPagoId,
      fechaPago,
      fechaVencimiento,
    };

    const interval = setInterval(() => {
      localStorage.setItem(LS_KEY, JSON.stringify(draft));
    }, AUTOSAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [
    hydrated,
    proveedor,
    tipoDoc,
    numDoc,
    fechaDoc,
    fechaContable,
    lineas,
    recibirDespues,
    ivaRetenidoOverride,
    isrRetenidoPct,
    formaPago,
    cuentaPagoId,
    fechaPago,
    fechaVencimiento,
  ]);

  // ── Submit flow ───────────────────────────────────────────────────
  const save = React.useCallback(
    async (estado: 'DRAFT' | 'POSTED') => {
      const draft: PurchaseDraft = {
        proveedor,
        tipoDoc,
        numDoc,
        fechaDoc,
        fechaContable,
        lineas,
        recibirDespues,
        ivaRetenidoOverride,
        isrRetenidoPct,
        formaPago,
        cuentaPagoId,
        fechaPago,
        fechaVencimiento,
      };

      const validationErr = validateDraft(draft);
      if (validationErr) {
        toast.error(validationErr.message);
        return;
      }

      setSaving(true);
      try {
        const finalEstado = recibirDespues ? 'DRAFT' : estado;

        const payload = {
          proveedorId: proveedor!.id,
          tipoDoc,
          numDocumentoProveedor: numDoc,
          fechaDoc,
          fechaContable,
          lineas,
          estadoInicial: finalEstado,
          ivaRetenidoOverride: ivaRetenidoOverride ?? undefined,
          isrRetenidoPct: isrRetenidoPct ?? undefined,
          formaPago: finalEstado === 'POSTED' ? formaPago : undefined,
          cuentaPagoId,
          fechaPago,
          fechaVencimiento,
          recibirDespues,
        };

        const purchase = await apiFetch<Purchase>('/purchases', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        localStorage.removeItem(LS_KEY);
        toast.success(
          finalEstado === 'POSTED' ? 'Compra contabilizada exitosamente.' : 'Borrador guardado.',
        );
        router.push(`/compras/${purchase.id}`);
      } catch (err: unknown) {
        const apiErr = err as { message?: string; data?: { code?: string; purchaseId?: string } };
        const code = apiErr?.data?.code;

        if (code === 'MAPPING_MISSING') {
          toast.error(
            'Falta configurar el mapping contable para esta operación.',
          );
        } else if (code === 'DUPLICATE') {
          const dupId = apiErr?.data?.purchaseId;
          toast.error(
            dupId
              ? `Ya existe una compra con ese número de documento.`
              : 'Ya existe una compra con ese número de documento.',
          );
        } else {
          toast.error(apiErr?.message ?? 'Error al guardar la compra.');
        }
      } finally {
        setSaving(false);
      }
    },
    [
      proveedor,
      tipoDoc,
      numDoc,
      fechaDoc,
      fechaContable,
      lineas,
      recibirDespues,
      ivaRetenidoOverride,
      isrRetenidoPct,
      formaPago,
      cuentaPagoId,
      fechaPago,
      fechaVencimiento,
      router,
      toast,
    ],
  );

  // ── Derived ───────────────────────────────────────────────────────
  const hasBienLines = lineas.some((l) => l.tipo === 'bien');

  // ── Shared sections for mobile wizard ─────────────────────────────

  const headerSection = (
    <PurchaseFormHeader
      proveedor={proveedor}
      onProveedorChange={setProveedor}
      tipoDoc={tipoDoc}
      onTipoDocChange={setTipoDoc}
      numDoc={numDoc}
      onNumDocChange={setNumDoc}
      fechaDoc={fechaDoc}
      onFechaDocChange={setFechaDoc}
      fechaContable={fechaContable}
      onFechaContableChange={setFechaContable}
    />
  );

  const lineasSection = (
    <div className="space-y-4">
      <PurchaseLinesTable lineas={lineas} onChange={setLineas} />
      {hasBienLines && (
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="recibir-despues"
            checked={recibirDespues}
            onCheckedChange={(v) => setRecibirDespues(!!v)}
          />
          <Label htmlFor="recibir-despues" className="cursor-pointer text-sm">
            Recibiré la mercancía después (permanece en DRAFT)
          </Label>
        </div>
      )}
    </div>
  );

  const summarySection = (
    <PurchaseSummaryPanel
      lineas={lineas}
      proveedor={proveedor}
      ivaRetenidoOverride={ivaRetenidoOverride}
      onIvaRetenidoChange={setIvaRetenidoOverride}
      isrRetenidoPct={isrRetenidoPct}
      onIsrChange={setIsrRetenidoPct}
      formaPago={formaPago}
      onFormaPagoChange={setFormaPago}
      cuentaPagoId={cuentaPagoId}
      onCuentaPagoChange={setCuentaPagoId}
      fechaPago={fechaPago}
      onFechaPagoChange={setFechaPago}
      fechaVencimiento={fechaVencimiento}
      onFechaVencimientoChange={setFechaVencimiento}
      onSaveDraft={() => save('DRAFT')}
      onPost={() => save(recibirDespues ? 'DRAFT' : 'POSTED')}
      saving={saving}
    />
  );

  const confirmSection = (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <h3 className="font-semibold text-sm">Resumen de la compra</h3>
        {proveedor && (
          <div>
            <p className="text-xs text-muted-foreground">Proveedor</p>
            <p className="text-sm font-medium">{proveedor.nombre}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Documento</p>
          <p className="text-sm font-medium">{tipoDoc} — {numDoc || '(sin número)'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Líneas</p>
          <p className="text-sm font-medium">{lineas.length} línea(s)</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Fecha doc.</p>
          <p className="text-sm font-medium">{fechaDoc}</p>
        </div>
      </div>

      {saving && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Guardando...</span>
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Mobile Wizard — hidden on md+ ── */}
      <MobileWizard
        steps={[
          { label: 'Proveedor', content: headerSection },
          { label: 'Líneas', content: lineasSection },
          { label: 'Pago', content: summarySection },
          { label: 'Confirmar', content: confirmSection },
        ]}
        currentStep={mobileStep}
        onStepChange={setMobileStep}
        onSubmit={() => save(recibirDespues ? 'DRAFT' : 'POSTED')}
        submitLabel={recibirDespues ? 'Guardar borrador' : 'Contabilizar'}
        isSubmitting={saving}
      />

      {/* ── Desktop layout — hidden on mobile ── */}
      <div className="hidden md:block space-y-4 p-4">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/compras')}
            className="h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold">Nueva compra</h1>
        </div>

        {/* 2-column layout: left 2/3 + right 1/3 sticky */}
        <div className="grid grid-cols-3 gap-6 items-start">
          {/* Left column */}
          <div className="col-span-2 space-y-6">
            {/* Header fields */}
            <div className="rounded-lg border border-border bg-card p-4">
              {headerSection}
            </div>

            {/* Lines */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Líneas de compra
              </h2>
              <PurchaseLinesTable lineas={lineas} onChange={setLineas} />
            </div>

            {/* "Recibiré después" checkbox — only when ≥1 bien line */}
            {hasBienLines && (
              <div className="flex items-center gap-2 px-1">
                <Checkbox
                  id="recibir-despues-desktop"
                  checked={recibirDespues}
                  onCheckedChange={(v) => setRecibirDespues(!!v)}
                />
                <Label
                  htmlFor="recibir-despues-desktop"
                  className="cursor-pointer text-sm"
                >
                  Recibiré la mercancía después — la compra permanecerá como borrador hasta registrar recepción
                </Label>
              </div>
            )}
          </div>

          {/* Right column — sticky summary */}
          <div className="col-span-1">
            <PurchaseSummaryPanel
              lineas={lineas}
              proveedor={proveedor}
              ivaRetenidoOverride={ivaRetenidoOverride}
              onIvaRetenidoChange={setIvaRetenidoOverride}
              isrRetenidoPct={isrRetenidoPct}
              onIsrChange={setIsrRetenidoPct}
              formaPago={formaPago}
              onFormaPagoChange={setFormaPago}
              cuentaPagoId={cuentaPagoId}
              onCuentaPagoChange={setCuentaPagoId}
              fechaPago={fechaPago}
              onFechaPagoChange={setFechaPago}
              fechaVencimiento={fechaVencimiento}
              onFechaVencimientoChange={setFechaVencimiento}
              onSaveDraft={() => save('DRAFT')}
              onPost={() => save(recibirDespues ? 'DRAFT' : 'POSTED')}
              saving={saving}
            />
          </div>
        </div>
      </div>
    </>
  );
}
