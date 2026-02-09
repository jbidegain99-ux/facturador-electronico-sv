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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RecurrenteDetallePage;
const React = __importStar(require("react"));
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const select_1 = require("@/components/ui/select");
const table_1 = require("@/components/ui/table");
const toast_1 = require("@/components/ui/toast");
const confirm_dialog_1 = require("@/components/ui/confirm-dialog");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const STATUS_LABELS = {
    ACTIVE: 'Activo',
    PAUSED: 'Pausado',
    SUSPENDED_ERROR: 'Suspendido',
    CANCELLED: 'Cancelado',
};
const STATUS_COLORS = {
    ACTIVE: 'bg-green-100 text-green-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    SUSPENDED_ERROR: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
};
const INTERVAL_LABELS = {
    DAILY: 'Diario',
    WEEKLY: 'Semanal',
    MONTHLY: 'Mensual',
    YEARLY: 'Anual',
};
const HISTORY_STATUS_COLORS = {
    SUCCESS: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    SKIPPED: 'bg-yellow-100 text-yellow-800',
};
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
function RecurrenteDetallePage() {
    const router = (0, navigation_1.useRouter)();
    const params = (0, navigation_1.useParams)();
    const id = params.id;
    const toast = (0, toast_1.useToast)();
    const toastRef = React.useRef(toast);
    toastRef.current = toast;
    const { confirm, ConfirmDialog } = (0, confirm_dialog_1.useConfirm)();
    const [template, setTemplate] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [fetchError, setFetchError] = React.useState(null);
    const [saving, setSaving] = React.useState(false);
    const [editing, setEditing] = React.useState(false);
    // Editable fields
    const [nombre, setNombre] = React.useState('');
    const [descripcion, setDescripcion] = React.useState('');
    const [mode, setMode] = React.useState('');
    const [autoTransmit, setAutoTransmit] = React.useState(false);
    const [notas, setNotas] = React.useState('');
    const [items, setItems] = React.useState([]);
    const [endDate, setEndDate] = React.useState('');
    const fetchTemplate = React.useCallback(async () => {
        setFetchError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-invoices/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) {
                if (res.status === 404) {
                    setFetchError('Template no encontrado o servicio no disponible.');
                    return;
                }
                throw new Error(`Error al cargar template (${res.status})`);
            }
            const data = await res.json();
            setTemplate(data);
            // Set editable values
            setNombre(data.nombre);
            setDescripcion(data.descripcion || '');
            setMode(data.mode);
            setAutoTransmit(data.autoTransmit);
            setNotas(data.notas || '');
            setEndDate(data.endDate ? data.endDate.split('T')[0] : '');
            try {
                setItems(JSON.parse(data.items));
            }
            catch {
                setItems([]);
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Error al cargar template';
            setFetchError(message);
            toastRef.current.error(message);
        }
        finally {
            setLoading(false);
        }
    }, [id]);
    React.useEffect(() => {
        fetchTemplate();
    }, [fetchTemplate]);
    const handleAction = async (action) => {
        if (action === 'cancel') {
            const ok = await confirm({
                title: 'Cancelar Template',
                description: 'Esta accion es irreversible. El template no generara mas facturas.',
                confirmText: 'Cancelar Template',
                variant: 'destructive',
            });
            if (!ok)
                return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-invoices/${id}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Error al ejecutar accion');
            }
            toast.success(`Accion ejecutada`);
            fetchTemplate();
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error');
        }
    };
    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const body = {
                nombre,
                descripcion: descripcion || undefined,
                mode,
                autoTransmit,
                notas: notas || undefined,
                items,
                endDate: endDate || undefined,
            };
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-invoices/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Error al guardar');
            }
            toast.success('Template actualizado');
            setEditing(false);
            fetchTemplate();
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al guardar');
        }
        finally {
            setSaving(false);
        }
    };
    const addItem = () => {
        setItems([...items, { descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0 }]);
    };
    const removeItem = (index) => {
        if (items.length <= 1)
            return;
        setItems(items.filter((_, i) => i !== index));
    };
    const updateItem = (index, field, value) => {
        const updated = [...items];
        if (field === 'descripcion') {
            updated[index] = { ...updated[index], [field]: value };
        }
        else {
            updated[index] = { ...updated[index], [field]: Number(value) || 0 };
        }
        setItems(updated);
    };
    if (loading) {
        return (<div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"/>
      </div>);
    }
    if (fetchError || !template) {
        return (<div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <link_1.default href="/facturas/recurrentes">
            <button_1.Button variant="ghost" size="icon">
              <lucide_react_1.ArrowLeft className="h-5 w-5"/>
            </button_1.Button>
          </link_1.default>
          <div>
            <h1 className="text-2xl font-bold">Template no disponible</h1>
            <p className="text-muted-foreground mt-1">
              {fetchError || 'No se pudo cargar el template.'}
            </p>
          </div>
        </div>
      </div>);
    }
    return (<div className="space-y-6 max-w-4xl">
      <ConfirmDialog />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <link_1.default href="/facturas/recurrentes">
            <button_1.Button variant="ghost" size="icon">
              <lucide_react_1.ArrowLeft className="h-5 w-5"/>
            </button_1.Button>
          </link_1.default>
          <div>
            <h1 className="text-2xl font-bold">{template.nombre}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[template.status] || 'bg-gray-100 text-gray-800'}`}>
                {STATUS_LABELS[template.status] || template.status}
              </span>
              <span className="text-sm text-muted-foreground">
                {INTERVAL_LABELS[template.interval]} | {template.cliente.nombre}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {template.status === 'ACTIVE' && (<>
              <button_1.Button variant="outline" size="sm" onClick={() => handleAction('trigger')}>
                <lucide_react_1.Zap className="mr-1 h-4 w-4"/>
                Ejecutar Ahora
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" onClick={() => handleAction('pause')}>
                <lucide_react_1.Pause className="mr-1 h-4 w-4"/>
                Pausar
              </button_1.Button>
            </>)}
          {(template.status === 'PAUSED' || template.status === 'SUSPENDED_ERROR') && (<button_1.Button variant="outline" size="sm" onClick={() => handleAction('resume')}>
              <lucide_react_1.Play className="mr-1 h-4 w-4"/>
              Reanudar
            </button_1.Button>)}
          {template.status !== 'CANCELLED' && (<button_1.Button variant="destructive" size="sm" onClick={() => handleAction('cancel')}>
              <lucide_react_1.XCircle className="mr-1 h-4 w-4"/>
              Cancelar
            </button_1.Button>)}
          {!editing && template.status !== 'CANCELLED' && (<button_1.Button size="sm" onClick={() => setEditing(true)}>Editar</button_1.Button>)}
        </div>
      </div>

      {/* Error banner */}
      {template.lastError && (<card_1.Card className="border-destructive">
          <card_1.CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">
              Error ({template.consecutiveFailures} fallo{template.consecutiveFailures > 1 ? 's' : ''} consecutivo{template.consecutiveFailures > 1 ? 's' : ''}):
            </p>
            <p className="text-sm text-muted-foreground mt-1">{template.lastError}</p>
          </card_1.CardContent>
        </card_1.Card>)}

      {/* Detail / Edit */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="text-lg">Configuracion</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          {editing ? (<div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label_1.Label>Nombre</label_1.Label>
                  <input_1.Input value={nombre} onChange={(e) => setNombre(e.target.value)}/>
                </div>
                <div className="space-y-2">
                  <label_1.Label>Modo</label_1.Label>
                  <select_1.Select value={mode} onValueChange={setMode}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue />
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="AUTO_DRAFT">Crear Borrador</select_1.SelectItem>
                      <select_1.SelectItem value="AUTO_SEND">Crear y Firmar</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
              </div>

              <div className="space-y-2">
                <label_1.Label>Descripcion</label_1.Label>
                <input_1.Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)}/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label_1.Label>Fecha Fin (opcional)</label_1.Label>
                  <input_1.Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}/>
                </div>
                {mode === 'AUTO_SEND' && (<div className="space-y-2 flex items-end">
                    <label_1.Label className="flex items-center gap-2">
                      <input type="checkbox" checked={autoTransmit} onChange={(e) => setAutoTransmit(e.target.checked)} className="h-4 w-4 rounded border-gray-300"/>
                      Transmitir a Hacienda
                    </label_1.Label>
                  </div>)}
              </div>

              <div className="space-y-2">
                <label_1.Label>Notas</label_1.Label>
                <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y" rows={2}/>
              </div>

              {/* Editable items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label_1.Label>Items</label_1.Label>
                  <button_1.Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <lucide_react_1.Plus className="mr-1 h-3 w-3"/>
                    Agregar
                  </button_1.Button>
                </div>
                {items.map((item, index) => (<div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <input_1.Input value={item.descripcion} onChange={(e) => updateItem(index, 'descripcion', e.target.value)} placeholder="Descripcion"/>
                    </div>
                    <div className="col-span-2">
                      <input_1.Input type="number" min="0.01" step="0.01" value={item.cantidad || ''} onChange={(e) => updateItem(index, 'cantidad', e.target.value)}/>
                    </div>
                    <div className="col-span-2">
                      <input_1.Input type="number" min="0" step="0.01" value={item.precioUnitario || ''} onChange={(e) => updateItem(index, 'precioUnitario', e.target.value)}/>
                    </div>
                    <div className="col-span-2">
                      <input_1.Input type="number" min="0" step="0.01" value={item.descuento || ''} onChange={(e) => updateItem(index, 'descuento', e.target.value)}/>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button_1.Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)} disabled={items.length <= 1}>
                        <lucide_react_1.Trash2 className="h-4 w-4"/>
                      </button_1.Button>
                    </div>
                  </div>))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button_1.Button variant="outline" onClick={() => { setEditing(false); fetchTemplate(); }}>
                  Cancelar
                </button_1.Button>
                <button_1.Button onClick={handleSave} disabled={saving}>
                  <lucide_react_1.Save className="mr-1 h-4 w-4"/>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button_1.Button>
              </div>
            </div>) : (<div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente:</span>
                <p className="font-medium">{template.cliente.nombre}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo DTE:</span>
                <p className="font-medium">{template.tipoDte === '01' ? 'Factura' : 'Credito Fiscal'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Frecuencia:</span>
                <p className="font-medium">
                  {INTERVAL_LABELS[template.interval]}
                  {template.interval === 'WEEKLY' && template.dayOfWeek != null && ` (${DIAS_SEMANA[template.dayOfWeek]})`}
                  {(template.interval === 'MONTHLY' || template.interval === 'YEARLY') && template.anchorDay && ` (dia ${template.anchorDay})`}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Modo:</span>
                <p className="font-medium">
                  {template.mode === 'AUTO_DRAFT' ? 'Crear Borrador' : 'Crear y Firmar'}
                  {template.autoTransmit && ' + Transmitir'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Proxima Ejecucion:</span>
                <p className="font-medium">
                  {template.status === 'ACTIVE' ? (0, utils_1.formatDate)(template.nextRunDate) : '-'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Ultima Ejecucion:</span>
                <p className="font-medium">
                  {template.lastRunDate ? (0, utils_1.formatDate)(template.lastRunDate) : 'Nunca'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Inicio:</span>
                <p className="font-medium">{(0, utils_1.formatDate)(template.startDate)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fin:</span>
                <p className="font-medium">{template.endDate ? (0, utils_1.formatDate)(template.endDate) : 'Sin fin'}</p>
              </div>
              {template.descripcion && (<div className="col-span-2">
                  <span className="text-muted-foreground">Descripcion:</span>
                  <p className="font-medium">{template.descripcion}</p>
                </div>)}
              {template.notas && (<div className="col-span-2">
                  <span className="text-muted-foreground">Notas:</span>
                  <p className="font-medium">{template.notas}</p>
                </div>)}

              {/* Items table */}
              <div className="col-span-2 mt-2">
                <span className="text-muted-foreground">Items:</span>
                <div className="mt-2 border rounded-md">
                  <table_1.Table>
                    <table_1.TableHeader>
                      <table_1.TableRow>
                        <table_1.TableHead>Descripcion</table_1.TableHead>
                        <table_1.TableHead className="text-right">Cant.</table_1.TableHead>
                        <table_1.TableHead className="text-right">Precio</table_1.TableHead>
                        <table_1.TableHead className="text-right">Desc.</table_1.TableHead>
                        <table_1.TableHead className="text-right">Subtotal</table_1.TableHead>
                      </table_1.TableRow>
                    </table_1.TableHeader>
                    <table_1.TableBody>
                      {(() => {
                try {
                    const parsedItems = JSON.parse(template.items);
                    return parsedItems.map((item, i) => (<table_1.TableRow key={i}>
                              <table_1.TableCell>{item.descripcion}</table_1.TableCell>
                              <table_1.TableCell className="text-right">{item.cantidad}</table_1.TableCell>
                              <table_1.TableCell className="text-right">${item.precioUnitario.toFixed(2)}</table_1.TableCell>
                              <table_1.TableCell className="text-right">${item.descuento.toFixed(2)}</table_1.TableCell>
                              <table_1.TableCell className="text-right font-medium">
                                ${(item.cantidad * item.precioUnitario - item.descuento).toFixed(2)}
                              </table_1.TableCell>
                            </table_1.TableRow>));
                }
                catch {
                    return (<table_1.TableRow>
                              <table_1.TableCell colSpan={5} className="text-center text-muted-foreground">
                                Error al leer items
                              </table_1.TableCell>
                            </table_1.TableRow>);
                }
            })()}
                    </table_1.TableBody>
                  </table_1.Table>
                </div>
              </div>
            </div>)}
        </card_1.CardContent>
      </card_1.Card>

      {/* Recent History */}
      <card_1.Card>
        <card_1.CardHeader>
          <div className="flex items-center justify-between">
            <card_1.CardTitle className="text-lg flex items-center gap-2">
              <lucide_react_1.History className="h-5 w-5"/>
              Historial Reciente
            </card_1.CardTitle>
            <link_1.default href={`/facturas/recurrentes/${id}/historial`}>
              <button_1.Button variant="outline" size="sm">
                Ver Todo ({template._count.history})
              </button_1.Button>
            </link_1.default>
          </div>
        </card_1.CardHeader>
        <card_1.CardContent className="p-0">
          {template.history.length === 0 ? (<div className="text-center py-8 text-muted-foreground text-sm">
              No hay ejecuciones registradas
            </div>) : (<table_1.Table>
              <table_1.TableHeader>
                <table_1.TableRow>
                  <table_1.TableHead>Fecha</table_1.TableHead>
                  <table_1.TableHead>Estado</table_1.TableHead>
                  <table_1.TableHead>DTE</table_1.TableHead>
                  <table_1.TableHead>Error</table_1.TableHead>
                </table_1.TableRow>
              </table_1.TableHeader>
              <table_1.TableBody>
                {template.history.map((h) => (<table_1.TableRow key={h.id}>
                    <table_1.TableCell className="text-sm">{(0, utils_1.formatDate)(h.runDate)}</table_1.TableCell>
                    <table_1.TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${HISTORY_STATUS_COLORS[h.status] || 'bg-gray-100 text-gray-800'}`}>
                        {h.status}
                      </span>
                    </table_1.TableCell>
                    <table_1.TableCell>
                      {h.dteId ? (<link_1.default href={`/facturas`} className="text-primary hover:underline text-sm">
                          Ver DTE
                        </link_1.default>) : ('-')}
                    </table_1.TableCell>
                    <table_1.TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {h.error || '-'}
                    </table_1.TableCell>
                  </table_1.TableRow>))}
              </table_1.TableBody>
            </table_1.Table>)}
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
