'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NuevaFacturaPage;
const React = __importStar(require("react"));
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const cliente_search_1 = require("@/components/facturas/cliente-search");
const items_table_1 = require("@/components/facturas/items-table");
const totales_card_1 = require("@/components/facturas/totales-card");
const factura_preview_1 = require("@/components/facturas/factura-preview");
const nuevo_cliente_modal_1 = require("@/components/facturas/nuevo-cliente-modal");
const plantillas_panel_1 = require("@/components/facturas/plantillas-panel");
const favoritos_panel_1 = require("@/components/facturas/favoritos-panel");
const templates_1 = require("@/store/templates");
const use_keyboard_shortcuts_1 = require("@/hooks/use-keyboard-shortcuts");
const toast_1 = require("@/components/ui/toast");
const utils_1 = require("@/lib/utils");
// Auto-save key
const DRAFT_KEY = 'factura-draft';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds
const initialState = {
    tipoDte: '01',
    cliente: null,
    items: [],
    condicionPago: '01',
};
function NuevaFacturaPage() {
    const router = (0, navigation_1.useRouter)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const { useTemplate, useFavorite } = (0, templates_1.useTemplatesStore)();
    const toast = (0, toast_1.useToast)();
    // Form state
    const [formState, setFormState] = React.useState(initialState);
    const [errors, setErrors] = React.useState({});
    // UI state
    const [isEmitting, setIsEmitting] = React.useState(false);
    const [showPreview, setShowPreview] = React.useState(false);
    const [showNuevoCliente, setShowNuevoCliente] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [successData, setSuccessData] = React.useState(null);
    const [hasDraft, setHasDraft] = React.useState(false);
    const [showSaveTemplate, setShowSaveTemplate] = React.useState(false);
    const { tipoDte, cliente, items, condicionPago } = formState;
    // Load draft on mount
    React.useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                if (draft.items?.length > 0 || draft.cliente) {
                    setHasDraft(true);
                }
            }
            catch {
                // Ignore invalid draft
            }
        }
    }, []);
    // Auto-save draft
    React.useEffect(() => {
        const hasContent = items.length > 0 || cliente !== null;
        if (!hasContent)
            return;
        const interval = setInterval(() => {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(formState));
        }, AUTOSAVE_INTERVAL);
        return () => clearInterval(interval);
    }, [formState, items.length, cliente]);
    // Keyboard shortcuts
    (0, use_keyboard_shortcuts_1.useKeyboardShortcuts)({
        'mod+enter': () => {
            if (canEmit())
                handleEmit();
        },
        'mod+s': () => handleSaveDraft(),
        'mod+p': () => setShowPreview(true),
        'mod+t': () => {
            if (items.length > 0)
                setShowSaveTemplate(true);
        },
        'escape': () => {
            setShowPreview(false);
            setShowNuevoCliente(false);
            setShowSaveTemplate(false);
        },
    }, { enabled: !isEmitting });
    // Update form state helpers
    const updateForm = (key, value) => {
        setFormState((prev) => ({ ...prev, [key]: value }));
        // Clear related errors
        if (errors[key]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };
    // Load draft
    const handleLoadDraft = () => {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                setFormState(draft);
                setHasDraft(false);
                toast.success('Borrador recuperado correctamente');
            }
            catch {
                toast.error('Error al recuperar el borrador');
            }
        }
    };
    // Discard draft
    const handleDiscardDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
        toast.info('Borrador descartado');
    };
    // Save draft manually
    const handleSaveDraft = () => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formState));
        toast.success('Borrador guardado correctamente');
    };
    // Handle template selection
    const handleSelectTemplate = (template) => {
        const usedTemplate = useTemplate(template.id);
        if (!usedTemplate)
            return;
        // Generate IDs for items
        const newItems = usedTemplate.items.map((item, index) => ({
            ...item,
            id: `item-${Date.now()}-${index}`,
        }));
        setFormState({
            tipoDte: usedTemplate.tipoDte,
            cliente: usedTemplate.cliente,
            items: newItems,
            condicionPago: usedTemplate.condicionPago,
        });
        toast.success(`Plantilla "${template.name}" aplicada`);
    };
    // Handle favorite selection - adds item to the invoice
    const handleSelectFavorite = (favorite) => {
        useFavorite(favorite.id);
        const cantidad = 1;
        const precioUnitario = favorite.precioUnitario;
        const subtotal = cantidad * precioUnitario;
        const iva = favorite.esGravado ? subtotal * 0.13 : 0;
        const newItem = {
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
        toast.success(`"${favorite.descripcion}" agregado a la factura`);
    };
    // Handle duplicate from URL params (coming from invoice list)
    React.useEffect(() => {
        const duplicateId = searchParams.get('duplicate');
        if (duplicateId) {
            loadInvoiceForDuplicate(duplicateId);
        }
    }, [searchParams]);
    const loadInvoiceForDuplicate = async (dteId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token)
                return;
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dte/${dteId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok)
                return;
            const dte = await response.json();
            // Parse the original JSON to extract items and other data
            if (dte.jsonOriginal) {
                try {
                    const originalData = JSON.parse(dte.jsonOriginal);
                    const cuerpo = originalData.cuerpoDocumento || [];
                    const duplicatedItems = cuerpo.map((item, index) => ({
                        id: `item-${Date.now()}-${index}`,
                        codigo: item.codigo || '',
                        descripcion: item.descripcion,
                        cantidad: item.cantidad,
                        precioUnitario: item.precioUni,
                        esGravado: item.ventaGravada > 0,
                        esExento: item.ventaExenta > 0,
                        descuento: item.montoDescu || 0,
                        subtotal: item.ventaGravada || item.ventaExenta || 0,
                        iva: item.ivaItem || 0,
                        total: (item.ventaGravada || 0) + (item.ivaItem || 0),
                    }));
                    setFormState({
                        tipoDte: dte.tipoDte,
                        cliente: null, // Don't copy client for duplicates (they should select)
                        items: duplicatedItems,
                        condicionPago: '01',
                    });
                    toast.success('Factura duplicada - selecciona un cliente para continuar');
                }
                catch {
                    toast.error('Error al cargar los datos de la factura');
                }
            }
        }
        catch {
            toast.error('No se pudo cargar la factura para duplicar');
        }
    };
    // Validation
    const validateForm = () => {
        const newErrors = {};
        // CCF requires cliente with NIT and NRC
        if (tipoDte === '03') {
            if (!cliente) {
                newErrors.cliente = 'Selecciona un cliente para Crédito Fiscal';
            }
            else if (!cliente.nrc) {
                newErrors.cliente = 'El cliente debe tener NRC para Crédito Fiscal';
            }
        }
        // Must have at least one item
        if (items.length === 0) {
            newErrors.items = 'Agrega al menos un item a la factura';
        }
        // Check for items with zero price
        const invalidItems = items.filter((i) => i.precioUnitario <= 0);
        if (invalidItems.length > 0) {
            newErrors.items = 'Todos los items deben tener precio mayor a 0';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const canEmit = () => {
        if (items.length === 0)
            return false;
        if (tipoDte === '03' && (!cliente || !cliente.nrc))
            return false;
        return true;
    };
    // Calculate totals
    const getSubtotal = () => items.reduce((sum, i) => sum + i.subtotal, 0);
    const getTotalIva = () => items.reduce((sum, i) => sum + i.iva, 0);
    const getTotal = () => items.reduce((sum, i) => sum + i.total, 0);
    // Emit invoice
    const handleEmit = async () => {
        if (!validateForm()) {
            // Shake animation could be added here
            return;
        }
        setIsEmitting(true);
        setErrors({});
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay sesión activa. Por favor inicia sesión nuevamente.');
            }
            // Build DTE data structure
            const dteData = {
                tipoDte,
                data: {
                    identificacion: {
                        version: tipoDte === '01' ? 1 : 3,
                        ambiente: '00', // Test environment
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
                        totalIva: getTotalIva(),
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
                throw new Error(errorData.message || 'Error al crear el DTE');
            }
            const createdDte = await response.json();
            // Success!
            setSuccessData({
                id: createdDte.id,
                numeroControl: createdDte.numeroControl || createdDte.codigoGeneracion,
            });
            setShowSuccess(true);
            setShowPreview(false);
            // Clear draft
            localStorage.removeItem(DRAFT_KEY);
            // Confetti effect
            try {
                const confetti = (await import('canvas-confetti')).default;
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#8b5cf6', '#06b6d4', '#22c55e'],
                });
            }
            catch {
                // Confetti not critical
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al emitir la factura';
            setErrors({ submit: errorMessage });
            toast.error(errorMessage);
        }
        finally {
            setIsEmitting(false);
        }
    };
    // Handle cliente created
    const handleClienteCreated = (newCliente) => {
        updateForm('cliente', newCliente);
        setShowNuevoCliente(false);
        toast.success(`Cliente "${newCliente.nombre}" creado y seleccionado`);
    };
    // Reset form for new invoice
    const handleNewInvoice = () => {
        setFormState(initialState);
        setShowSuccess(false);
        setSuccessData(null);
        setErrors({});
    };
    // Go to invoice detail
    const handleViewInvoice = () => {
        if (successData?.id) {
            router.push(`/facturas/${successData.id}`);
        }
    };
    // Success view
    if (showSuccess && successData) {
        return (<div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto animate-in fade-in-50 zoom-in-95 duration-500">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <lucide_react_1.CheckCircle2 className="w-10 h-10 text-green-500"/>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Factura Emitida</h1>
            <p className="text-muted-foreground">
              Tu documento ha sido procesado exitosamente
            </p>
          </div>

          <div className="glass-card p-4 text-left">
            <div className="text-sm text-muted-foreground mb-1">Numero de Control</div>
            <code className="text-xs text-primary break-all">{successData.numeroControl}</code>
          </div>

          <div className="flex gap-3 justify-center">
            <button_1.Button variant="ghost" onClick={handleNewInvoice} className="btn-secondary">
              <lucide_react_1.Sparkles className="w-4 h-4 mr-2"/>
              Nueva Factura
            </button_1.Button>
            <button_1.Button onClick={handleViewInvoice} className="btn-primary">
              Ver Detalle
            </button_1.Button>
          </div>
        </div>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button_1.Button variant="ghost" size="sm" onClick={() => router.push('/facturas')} className="text-muted-foreground hover:text-white">
            <lucide_react_1.ArrowLeft className="w-4 h-4 mr-1"/>
            Volver
          </button_1.Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <lucide_react_1.FileText className="w-6 h-6 text-primary"/>
              Nueva Factura
            </h1>
            <p className="text-sm text-muted-foreground">
              Crea y emite documentos tributarios electronicos
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button_1.Button variant="ghost" size="sm" onClick={() => setShowPreview(true)} disabled={items.length === 0} className="hidden sm:flex">
            <lucide_react_1.Eye className="w-4 h-4 mr-1"/>
            Preview
          </button_1.Button>
          <button_1.Button onClick={handleEmit} disabled={!canEmit() || isEmitting} className="btn-primary">
            {isEmitting ? (<>
                <lucide_react_1.Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                Emitiendo...
              </>) : (<>
                <lucide_react_1.Send className="w-4 h-4 mr-2"/>
                Emitir
              </>)}
          </button_1.Button>
        </div>
      </div>

      {/* Draft recovery */}
      {hasDraft && (<div className="glass-card p-4 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <lucide_react_1.Save className="w-5 h-5 text-warning"/>
            <div>
              <p className="text-sm font-medium text-white">Tienes un borrador guardado</p>
              <p className="text-xs text-muted-foreground">
                Se guardo automaticamente antes de salir
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button_1.Button variant="ghost" size="sm" onClick={handleDiscardDraft}>
              Descartar
            </button_1.Button>
            <button_1.Button size="sm" onClick={handleLoadDraft} className="btn-primary">
              Recuperar
            </button_1.Button>
          </div>
        </div>)}

      {/* Error banner */}
      {errors.submit && (<div className="glass-card p-4 border-destructive/50 animate-in shake">
          <p className="text-sm text-destructive">{errors.submit}</p>
        </div>)}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tipo DTE selector */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Tipo de Documento:
              </label>
              <div className="flex gap-2">
                <button onClick={() => updateForm('tipoDte', '01')} className={(0, utils_1.cn)('px-4 py-2 rounded-lg text-sm font-medium transition-all', tipoDte === '01'
            ? 'bg-primary text-white'
            : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white')}>
                  Factura (01)
                </button>
                <button onClick={() => updateForm('tipoDte', '03')} className={(0, utils_1.cn)('px-4 py-2 rounded-lg text-sm font-medium transition-all', tipoDte === '03'
            ? 'bg-secondary text-white'
            : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white')}>
                  Credito Fiscal (03)
                </button>
              </div>
            </div>
          </div>

          {/* Cliente section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Cliente / Receptor
              </h2>
              {tipoDte === '03' && !cliente && (<span className="text-xs text-destructive">* Requerido para CCF</span>)}
            </div>

            <cliente_search_1.ClienteSearch value={cliente} onChange={(c) => updateForm('cliente', c)} onCreateNew={() => setShowNuevoCliente(true)} tipoDte={tipoDte}/>

            {errors.cliente && (<p className="text-xs text-destructive">{errors.cliente}</p>)}
          </div>

          {/* Items section */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Items de la Factura
            </h2>

            <items_table_1.ItemsTable items={items} onChange={(newItems) => updateForm('items', newItems)}/>

            {errors.items && (<p className="text-xs text-destructive">{errors.items}</p>)}
          </div>
        </div>

        {/* Right column - Summary */}
        <div className="space-y-6">
          {/* Templates Panel */}
          <plantillas_panel_1.PlantillasPanel onSelectTemplate={handleSelectTemplate}/>

          {/* Favorites Panel */}
          <favoritos_panel_1.FavoritosPanel onSelectFavorite={handleSelectFavorite}/>

          {/* Totales */}
          <totales_card_1.TotalesCard items={items} condicionPago={condicionPago} onCondicionPagoChange={(value) => updateForm('condicionPago', value)}/>

          {/* Actions */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Acciones
            </h3>

            <div className="space-y-2">
              <button_1.Button variant="ghost" className="w-full justify-start text-left" onClick={() => setShowPreview(true)} disabled={items.length === 0}>
                <lucide_react_1.Eye className="w-4 h-4 mr-3"/>
                Vista previa
              </button_1.Button>

              <button_1.Button variant="ghost" className="w-full justify-start text-left" onClick={handleSaveDraft} disabled={items.length === 0 && !cliente}>
                <lucide_react_1.Save className="w-4 h-4 mr-3"/>
                Guardar borrador
              </button_1.Button>

              <button_1.Button variant="ghost" className="w-full justify-start text-left" onClick={() => setShowSaveTemplate(true)} disabled={items.length === 0}>
                <lucide_react_1.Files className="w-4 h-4 mr-3"/>
                Guardar como plantilla
              </button_1.Button>

              <button_1.Button className="w-full btn-primary justify-start" onClick={handleEmit} disabled={!canEmit() || isEmitting}>
                {isEmitting ? (<>
                    <lucide_react_1.Loader2 className="w-4 h-4 mr-3 animate-spin"/>
                    Emitiendo...
                  </>) : (<>
                    <lucide_react_1.Send className="w-4 h-4 mr-3"/>
                    Emitir factura
                  </>)}
              </button_1.Button>
            </div>
          </div>

          {/* Keyboard shortcuts */}
          <div className="glass-card p-4 hidden lg:block">
            <div className="flex items-center gap-2 mb-3">
              <lucide_react_1.Keyboard className="w-4 h-4 text-muted-foreground"/>
              <span className="text-sm font-medium text-muted-foreground">
                Atajos de teclado
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Emitir factura</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">
                  {(0, use_keyboard_shortcuts_1.getShortcutDisplay)('mod+enter')}
                </kbd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Guardar borrador</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">
                  {(0, use_keyboard_shortcuts_1.getShortcutDisplay)('mod+s')}
                </kbd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Vista previa</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">
                  {(0, use_keyboard_shortcuts_1.getShortcutDisplay)('mod+p')}
                </kbd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Guardar plantilla</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">
                  {(0, use_keyboard_shortcuts_1.getShortcutDisplay)('mod+t')}
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <factura_preview_1.FacturaPreview open={showPreview} onClose={() => setShowPreview(false)} onEmit={handleEmit} data={{
            tipoDte,
            cliente,
            items,
            condicionPago,
        }} isEmitting={isEmitting}/>

      <nuevo_cliente_modal_1.NuevoClienteModal open={showNuevoCliente} onClose={() => setShowNuevoCliente(false)} onCreated={handleClienteCreated} tipoDte={tipoDte}/>

      <plantillas_panel_1.GuardarPlantillaModal open={showSaveTemplate} onOpenChange={setShowSaveTemplate} tipoDte={tipoDte} items={items} condicionPago={condicionPago} cliente={cliente || undefined}/>
    </div>);
}
