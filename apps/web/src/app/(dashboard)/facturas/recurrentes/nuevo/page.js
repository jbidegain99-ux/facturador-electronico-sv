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
exports.default = NuevoRecurrentePage;
const React = __importStar(require("react"));
const navigation_1 = require("next/navigation");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const select_1 = require("@/components/ui/select");
const toast_1 = require("@/components/ui/toast");
const cliente_search_1 = require("@/components/facturas/cliente-search");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const DIAS_SEMANA = [
    { value: '0', label: 'Domingo' },
    { value: '1', label: 'Lunes' },
    { value: '2', label: 'Martes' },
    { value: '3', label: 'Miercoles' },
    { value: '4', label: 'Jueves' },
    { value: '5', label: 'Viernes' },
    { value: '6', label: 'Sabado' },
];
function NuevoRecurrentePage() {
    const router = (0, navigation_1.useRouter)();
    const toast = (0, toast_1.useToast)();
    const [saving, setSaving] = React.useState(false);
    const [nombre, setNombre] = React.useState('');
    const [descripcion, setDescripcion] = React.useState('');
    const [cliente, setCliente] = React.useState(null);
    const [tipoDte, setTipoDte] = React.useState('01');
    const [interval, setInterval] = React.useState('MONTHLY');
    const [anchorDay, setAnchorDay] = React.useState('1');
    const [dayOfWeek, setDayOfWeek] = React.useState('1');
    const [mode, setMode] = React.useState('AUTO_DRAFT');
    const [autoTransmit, setAutoTransmit] = React.useState(false);
    const [startDate, setStartDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = React.useState('');
    const [notas, setNotas] = React.useState('');
    const [items, setItems] = React.useState([
        { descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0 },
    ]);
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
    const totalEstimado = items.reduce((sum, item) => {
        return sum + item.cantidad * item.precioUnitario - item.descuento;
    }, 0);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!cliente) {
            toast.error('Seleccione un cliente');
            return;
        }
        if (!nombre.trim()) {
            toast.error('Ingrese un nombre para el template');
            return;
        }
        if (items.some((i) => !i.descripcion.trim())) {
            toast.error('Todos los items deben tener descripcion');
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const body = {
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || undefined,
                clienteId: cliente.id,
                tipoDte,
                interval,
                mode,
                autoTransmit,
                items,
                startDate,
                notas: notas.trim() || undefined,
            };
            if (interval === 'MONTHLY' || interval === 'YEARLY') {
                body.anchorDay = parseInt(anchorDay, 10);
            }
            if (interval === 'WEEKLY') {
                body.dayOfWeek = parseInt(dayOfWeek, 10);
            }
            if (endDate) {
                body.endDate = endDate;
            }
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-invoices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Error al crear template');
            }
            toast.success('Template creado exitosamente');
            router.push('/facturas/recurrentes');
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al crear template');
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <link_1.default href="/facturas/recurrentes">
          <button_1.Button variant="ghost" size="icon">
            <lucide_react_1.ArrowLeft className="h-5 w-5"/>
          </button_1.Button>
        </link_1.default>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Template Recurrente</h1>
          <p className="text-muted-foreground">
            Configure la generacion automatica de facturas
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info basica */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="text-lg">Informacion Basica</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label_1.Label htmlFor="nombre">Nombre del Template *</label_1.Label>
                <input_1.Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Mensualidad Servicio Web" required/>
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="tipoDte">Tipo de DTE</label_1.Label>
                <select_1.Select value={tipoDte} onValueChange={setTipoDte}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue />
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="01">01 - Factura</select_1.SelectItem>
                    <select_1.SelectItem value="03">03 - Credito Fiscal</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </div>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="descripcion">Descripcion</label_1.Label>
              <input_1.Input id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripcion opcional del template"/>
            </div>

            <div className="space-y-2">
              <label_1.Label>Cliente *</label_1.Label>
              <cliente_search_1.ClienteSearch value={cliente} onChange={setCliente} onCreateNew={() => router.push('/clientes')} tipoDte={tipoDte}/>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Recurrencia */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="text-lg">Configuracion de Recurrencia</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label_1.Label>Frecuencia *</label_1.Label>
                <select_1.Select value={interval} onValueChange={setInterval}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue />
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="DAILY">Diario</select_1.SelectItem>
                    <select_1.SelectItem value="WEEKLY">Semanal</select_1.SelectItem>
                    <select_1.SelectItem value="MONTHLY">Mensual</select_1.SelectItem>
                    <select_1.SelectItem value="YEARLY">Anual</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              {interval === 'WEEKLY' && (<div className="space-y-2">
                  <label_1.Label>Dia de la Semana</label_1.Label>
                  <select_1.Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue />
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      {DIAS_SEMANA.map((d) => (<select_1.SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </select_1.SelectItem>))}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>)}

              {(interval === 'MONTHLY' || interval === 'YEARLY') && (<div className="space-y-2">
                  <label_1.Label>Dia del Mes</label_1.Label>
                  <select_1.Select value={anchorDay} onValueChange={setAnchorDay}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue />
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      {Array.from({ length: 31 }, (_, i) => (<select_1.SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1}
                        </select_1.SelectItem>))}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label_1.Label htmlFor="startDate">Fecha de Inicio *</label_1.Label>
                <input_1.Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required/>
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="endDate">Fecha de Fin (opcional)</label_1.Label>
                <input_1.Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Modo */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="text-lg">Modo de Ejecucion</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <p className="text-xs text-muted-foreground">
                  {mode === 'AUTO_DRAFT'
            ? 'Se creara un borrador que debera firmar manualmente'
            : 'Se creara y firmara automaticamente'}
                </p>
              </div>
              {mode === 'AUTO_SEND' && (<div className="space-y-2">
                  <label_1.Label className="flex items-center gap-2">
                    <input type="checkbox" checked={autoTransmit} onChange={(e) => setAutoTransmit(e.target.checked)} className="h-4 w-4 rounded border-gray-300"/>
                    Transmitir a Hacienda automaticamente
                  </label_1.Label>
                  <p className="text-xs text-muted-foreground">
                    Al activar, las facturas se enviaran a Hacienda sin intervencion manual
                  </p>
                </div>)}
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Items */}
        <card_1.Card>
          <card_1.CardHeader>
            <div className="flex items-center justify-between">
              <card_1.CardTitle className="text-lg">Items de la Factura</card_1.CardTitle>
              <button_1.Button type="button" variant="outline" size="sm" onClick={addItem}>
                <lucide_react_1.Plus className="mr-1 h-4 w-4"/>
                Agregar Item
              </button_1.Button>
            </div>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-1">
                <div className="col-span-5">Descripcion</div>
                <div className="col-span-2">Cantidad</div>
                <div className="col-span-2">Precio Unit.</div>
                <div className="col-span-2">Descuento</div>
                <div className="col-span-1"></div>
              </div>

              {items.map((item, index) => (<div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input_1.Input value={item.descripcion} onChange={(e) => updateItem(index, 'descripcion', e.target.value)} placeholder="Descripcion del item"/>
                  </div>
                  <div className="col-span-2">
                    <input_1.Input type="number" min="0.01" step="0.01" value={item.cantidad || ''} onChange={(e) => updateItem(index, 'cantidad', e.target.value)}/>
                  </div>
                  <div className="col-span-2">
                    <input_1.Input type="number" min="0" step="0.01" value={item.precioUnitario || ''} onChange={(e) => updateItem(index, 'precioUnitario', e.target.value)} placeholder="$0.00"/>
                  </div>
                  <div className="col-span-2">
                    <input_1.Input type="number" min="0" step="0.01" value={item.descuento || ''} onChange={(e) => updateItem(index, 'descuento', e.target.value)} placeholder="$0.00"/>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button_1.Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)} disabled={items.length <= 1}>
                      <lucide_react_1.Trash2 className="h-4 w-4"/>
                    </button_1.Button>
                  </div>
                </div>))}

              {/* Total estimado */}
              <div className="flex justify-end border-t pt-3 pr-12">
                <div className="text-sm">
                  <span className="text-muted-foreground mr-2">Subtotal estimado:</span>
                  <span className="font-semibold">${totalEstimado.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Notas */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="text-lg">Notas</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas opcionales que se incluiran en cada factura generada" className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y" rows={3}/>
          </card_1.CardContent>
        </card_1.Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <link_1.default href="/facturas/recurrentes">
            <button_1.Button type="button" variant="outline">Cancelar</button_1.Button>
          </link_1.default>
          <button_1.Button type="submit" disabled={saving}>
            <lucide_react_1.Save className="mr-2 h-4 w-4"/>
            {saving ? 'Guardando...' : 'Crear Template'}
          </button_1.Button>
        </div>
      </form>
    </div>);
}
