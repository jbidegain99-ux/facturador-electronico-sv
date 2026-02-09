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
exports.default = FacturaDetallePage;
const React = __importStar(require("react"));
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const table_1 = require("@/components/ui/table");
const dte_status_badge_1 = require("@/components/dte/dte-status-badge");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const utils_2 = require("@/lib/utils");
const timelineIcons = {
    CREATED: lucide_react_1.Clock,
    SIGNED: lucide_react_1.FileJson,
    TRANSMITTED: lucide_react_1.Send,
    TRANSMISSION_ERROR: lucide_react_1.AlertCircle,
};
function FacturaDetallePage() {
    const params = (0, navigation_1.useParams)();
    const router = (0, navigation_1.useRouter)();
    const [dte, setDte] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [anulando, setAnulando] = React.useState(false);
    const [downloadingPdf, setDownloadingPdf] = React.useState(false);
    const dteId = params.id;
    React.useEffect(() => {
        const fetchDTE = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No hay sesion activa');
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dte/${dteId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (!res.ok) {
                    throw new Error('Error al cargar el documento');
                }
                const data = await res.json();
                setDte(data);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            }
            finally {
                setLoading(false);
            }
        };
        if (dteId) {
            fetchDTE();
        }
    }, [dteId]);
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };
    const handleDownloadJSON = () => {
        if (!dte)
            return;
        try {
            const jsonData = typeof dte.jsonOriginal === 'string'
                ? JSON.parse(dte.jsonOriginal)
                : dte.jsonOriginal;
            const jsonStr = JSON.stringify(jsonData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DTE-${dte.codigoGeneracion}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        catch (err) {
            alert('Error al descargar el JSON');
        }
    };
    const handleDownloadPDF = async () => {
        if (!dte)
            return;
        setDownloadingPdf(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dte/${dteId}/pdf`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                throw new Error('Error al generar el PDF');
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DTE-${dte.numeroControl || dte.codigoGeneracion}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Error al descargar el PDF');
        }
        finally {
            setDownloadingPdf(false);
        }
    };
    const handleAnular = async () => {
        if (!dte || !confirm('¿Estás seguro de que deseas anular este documento?'))
            return;
        setAnulando(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dte/${dteId}/anular`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ motivo: 'Anulacion solicitada por usuario' }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al anular');
            }
            alert('Documento anulado correctamente');
            router.push('/facturas');
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Error al anular el documento');
        }
        finally {
            setAnulando(false);
        }
    };
    const parseNumber = (value) => {
        if (typeof value === 'number')
            return value;
        return parseFloat(value) || 0;
    };
    const getJsonData = () => {
        if (!dte?.jsonOriginal)
            return null;
        try {
            return typeof dte.jsonOriginal === 'string'
                ? JSON.parse(dte.jsonOriginal)
                : dte.jsonOriginal;
        }
        catch {
            return null;
        }
    };
    if (loading) {
        return (<div className="flex items-center justify-center py-12">
        <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
      </div>);
    }
    if (error || !dte) {
        return (<div className="space-y-4">
        <link_1.default href="/facturas">
          <button_1.Button variant="ghost">
            <lucide_react_1.ArrowLeft className="mr-2 h-4 w-4"/>
            Volver
          </button_1.Button>
        </link_1.default>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error || 'Documento no encontrado'}
        </div>
      </div>);
    }
    const jsonData = getJsonData();
    const emisor = jsonData?.emisor || dte.tenant;
    const receptor = jsonData?.receptor || dte.cliente;
    const items = jsonData?.cuerpoDocumento || [];
    const resumen = jsonData?.resumen;
    const identificacion = jsonData?.identificacion;
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <link_1.default href="/facturas">
            <button_1.Button variant="ghost" size="icon">
              <lucide_react_1.ArrowLeft className="h-4 w-4"/>
            </button_1.Button>
          </link_1.default>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {(0, utils_1.getTipoDteName)(dte.tipoDte)}
              </h1>
              <dte_status_badge_1.DTEStatusBadge status={dte.estado}/>
            </div>
            <p className="text-muted-foreground font-mono text-sm">
              {dte.numeroControl}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button_1.Button variant="outline" onClick={handleDownloadPDF} disabled={downloadingPdf}>
            {downloadingPdf ? (<lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>) : (<lucide_react_1.FileText className="mr-2 h-4 w-4"/>)}
            Descargar PDF
          </button_1.Button>
          <button_1.Button variant="outline" onClick={handleDownloadJSON}>
            <lucide_react_1.Download className="mr-2 h-4 w-4"/>
            Descargar JSON
          </button_1.Button>
          {dte.estado === 'PROCESADO' && (<button_1.Button variant="destructive" onClick={handleAnular} disabled={anulando}>
              {anulando ? (<lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>) : (<lucide_react_1.Ban className="mr-2 h-4 w-4"/>)}
              Anular
            </button_1.Button>)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info General */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Informacion General</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Codigo Generacion</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">{dte.codigoGeneracion}</code>
                    <button_1.Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(dte.codigoGeneracion)}>
                      <lucide_react_1.Copy className="h-3 w-3"/>
                    </button_1.Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fecha Emision</p>
                  <p className="font-medium">{(0, utils_1.formatDateTime)(dte.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ambiente</p>
                  <badge_1.Badge variant={identificacion?.ambiente === '01' ? 'default' : 'secondary'}>
                    {identificacion?.ambiente === '01' ? 'Produccion' : 'Pruebas'}
                  </badge_1.Badge>
                </div>
                {dte.selloRecepcion && (<div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Sello Recibido</p>
                    <code className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded break-all">
                      {dte.selloRecepcion}
                    </code>
                  </div>)}
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Emisor y Receptor */}
          <div className="grid gap-6 md:grid-cols-2">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-base">Emisor</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-2 text-sm">
                <p className="font-semibold">{emisor?.nombre || 'N/A'}</p>
                <p className="text-muted-foreground">NIT: {emisor?.nit || 'N/A'}</p>
                {emisor?.nrc && <p className="text-muted-foreground">NRC: {emisor.nrc}</p>}
              </card_1.CardContent>
            </card_1.Card>
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-base">Receptor</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-2 text-sm">
                <p className="font-semibold">{receptor?.nombre || dte.cliente?.nombre || 'N/A'}</p>
                {(receptor?.numDocumento || dte.cliente?.numDocumento) && (<p className="text-muted-foreground">
                    NIT: {receptor?.numDocumento || dte.cliente?.numDocumento}
                  </p>)}
                {(receptor?.nrc || dte.cliente?.nrc) && (<p className="text-muted-foreground">NRC: {receptor?.nrc || dte.cliente?.nrc}</p>)}
                {(receptor?.correo || dte.cliente?.correo) && (<p className="text-muted-foreground">{receptor?.correo || dte.cliente?.correo}</p>)}
              </card_1.CardContent>
            </card_1.Card>
          </div>

          {/* Items */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Detalle de Items</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="p-0">
              <table_1.Table>
                <table_1.TableHeader>
                  <table_1.TableRow>
                    <table_1.TableHead className="w-12">#</table_1.TableHead>
                    <table_1.TableHead>Descripcion</table_1.TableHead>
                    <table_1.TableHead className="text-right">Cant.</table_1.TableHead>
                    <table_1.TableHead className="text-right">Precio</table_1.TableHead>
                    <table_1.TableHead className="text-right">Gravado</table_1.TableHead>
                    <table_1.TableHead className="text-right">IVA</table_1.TableHead>
                  </table_1.TableRow>
                </table_1.TableHeader>
                <table_1.TableBody>
                  {items.length > 0 ? (items.map((item, index) => (<table_1.TableRow key={index}>
                        <table_1.TableCell>{item.numItem || index + 1}</table_1.TableCell>
                        <table_1.TableCell>{item.descripcion}</table_1.TableCell>
                        <table_1.TableCell className="text-right">{item.cantidad}</table_1.TableCell>
                        <table_1.TableCell className="text-right">{(0, utils_1.formatCurrency)(parseNumber(item.precioUni))}</table_1.TableCell>
                        <table_1.TableCell className="text-right">{(0, utils_1.formatCurrency)(parseNumber(item.ventaGravada))}</table_1.TableCell>
                        <table_1.TableCell className="text-right">{(0, utils_1.formatCurrency)(parseNumber(item.ivaItem || 0))}</table_1.TableCell>
                      </table_1.TableRow>))) : (<table_1.TableRow>
                      <table_1.TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay items disponibles
                      </table_1.TableCell>
                    </table_1.TableRow>)}
                </table_1.TableBody>
              </table_1.Table>
            </card_1.CardContent>
          </card_1.Card>

          {/* Resumen */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Resumen</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal Gravado:</span>
                    <span>{(0, utils_1.formatCurrency)(parseNumber(resumen?.totalGravada || dte.totalGravada))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (13%):</span>
                    <span>{(0, utils_1.formatCurrency)(parseNumber(resumen?.totalIva || dte.totalIva))}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total a Pagar:</span>
                    <span>{(0, utils_1.formatCurrency)(parseNumber(resumen?.totalPagar || dte.totalPagar))}</span>
                  </div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        {/* Sidebar - Timeline */}
        <div className="space-y-6">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Timeline</card_1.CardTitle>
              <card_1.CardDescription>Historial de eventos del documento</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                {dte.logs && dte.logs.length > 0 ? (dte.logs.map((log, index) => {
            const Icon = timelineIcons[log.accion] || lucide_react_1.Clock;
            const isLast = index === dte.logs.length - 1;
            return (<div key={log.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={(0, utils_2.cn)('flex h-8 w-8 items-center justify-center rounded-full', log.accion.includes('ERROR')
                    ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                    : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400')}>
                            <Icon className="h-4 w-4"/>
                          </div>
                          {!isLast && <div className="w-0.5 flex-1 bg-border mt-2"/>}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium">{log.accion}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(0, utils_1.formatDateTime)(log.createdAt)}
                          </p>
                        </div>
                      </div>);
        })) : (<p className="text-sm text-muted-foreground">No hay eventos registrados</p>)}
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Descripcion MH */}
          {dte.descripcionMh && (<card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-base">Respuesta MH</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <p className="text-sm text-muted-foreground">{dte.descripcionMh}</p>
              </card_1.CardContent>
            </card_1.Card>)}
        </div>
      </div>
    </div>);
}
