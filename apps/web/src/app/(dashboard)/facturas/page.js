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
exports.default = FacturasPage;
const React = __importStar(require("react"));
const link_1 = __importDefault(require("next/link"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const table_1 = require("@/components/ui/table");
const select_1 = require("@/components/ui/select");
const dte_status_badge_1 = require("@/components/dte/dte-status-badge");
const skeleton_1 = require("@/components/ui/skeleton");
const toast_1 = require("@/components/ui/toast");
const confirm_dialog_1 = require("@/components/ui/confirm-dialog");
const HaciendaConfigBanner_1 = require("@/components/HaciendaConfigBanner");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const pagination_1 = require("@/components/ui/pagination");
const page_size_selector_1 = require("@/components/ui/page-size-selector");
function FacturasPage() {
    const toast = (0, toast_1.useToast)();
    const { confirm, ConfirmDialog } = (0, confirm_dialog_1.useConfirm)();
    const { isConfigured: isHaciendaConfigured, isLoading: isLoadingHacienda, demoMode } = (0, HaciendaConfigBanner_1.useHaciendaStatus)();
    // Can create invoices if Hacienda is configured OR in demo mode
    const canCreateInvoice = isHaciendaConfigured || demoMode;
    const showHaciendaBanner = !isLoadingHacienda && !isHaciendaConfigured && !demoMode;
    const [search, setSearch] = React.useState('');
    const [filterTipo, setFilterTipo] = React.useState('all');
    const [filterStatus, setFilterStatus] = React.useState('all');
    const [page, setPage] = React.useState(1);
    const [limit, setLimit] = React.useState(20);
    const [sortBy, setSortBy] = React.useState('createdAt');
    const [sortOrder, setSortOrder] = React.useState('desc');
    const [dtes, setDtes] = React.useState([]);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const fetchDTEs = React.useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No hay sesion activa');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', limit.toString());
            params.set('sortBy', sortBy);
            params.set('sortOrder', sortOrder);
            if (filterTipo !== 'all')
                params.set('tipoDte', filterTipo);
            if (filterStatus !== 'all')
                params.set('estado', filterStatus);
            if (search)
                params.set('search', search);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dte?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `Error al cargar facturas (${res.status})`);
            }
            const data = await res.json();
            setDtes(data.data);
            setTotalPages(data.totalPages);
            setTotal(data.total);
            setError(null);
        }
        catch (err) {
            console.error('Error fetching DTEs:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar facturas');
        }
        finally {
            setLoading(false);
        }
    }, [page, limit, filterTipo, filterStatus, search, sortBy, sortOrder]);
    // Fetch on mount and when filters change
    React.useEffect(() => {
        fetchDTEs();
    }, [fetchDTEs]);
    // Debounced search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1); // Reset to first page on search
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);
    // Reset page when filters change
    React.useEffect(() => {
        setPage(1);
    }, [filterTipo, filterStatus]);
    const handleLimitChange = (newLimit) => {
        setLimit(newLimit);
        setPage(1);
    };
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortBy(field);
            setSortOrder(field === 'createdAt' ? 'desc' : 'asc');
        }
        setPage(1);
    };
    const getSortIcon = (field) => {
        if (sortBy !== field)
            return <lucide_react_1.ArrowUpDown className="h-3 w-3 ml-1 opacity-50"/>;
        return sortOrder === 'asc'
            ? <lucide_react_1.ArrowUp className="h-3 w-3 ml-1"/>
            : <lucide_react_1.ArrowDown className="h-3 w-3 ml-1"/>;
    };
    const handleDownload = async (dteId) => {
        const token = localStorage.getItem('token');
        if (!token)
            return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dte/${dteId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!res.ok)
                throw new Error('Error al descargar');
            const data = await res.json();
            const jsonStr = JSON.stringify(data.jsonOriginal || data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DTE-${data.codigoGeneracion}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Documento descargado correctamente');
        }
        catch (err) {
            console.error('Error downloading DTE:', err);
            toast.error('Error al descargar el documento');
        }
    };
    const handleDownloadPdf = async (dte) => {
        const token = localStorage.getItem('token');
        if (!token)
            return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dte/${dte.id}/pdf`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!res.ok)
                throw new Error('Error al generar el PDF');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DTE-${dte.numeroControl || dte.codigoGeneracion}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('PDF descargado correctamente');
        }
        catch (err) {
            console.error('Error downloading PDF:', err);
            toast.error('Error al generar el PDF');
        }
    };
    const handleAnular = async (dte) => {
        const confirmed = await confirm({
            title: 'Anular documento',
            description: `¿Estás seguro que deseas anular el documento ${dte.numeroControl}? Esta acción no se puede deshacer.`,
            confirmText: 'Sí, anular',
            cancelText: 'Cancelar',
            variant: 'destructive',
        });
        if (!confirmed)
            return;
        const token = localStorage.getItem('token');
        if (!token)
            return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dte/${dte.id}/anular`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!res.ok)
                throw new Error('Error al anular el documento');
            toast.success('Documento anulado correctamente');
            fetchDTEs(); // Refresh the list
        }
        catch (err) {
            console.error('Error anulando DTE:', err);
            toast.error('Error al anular el documento');
        }
    };
    const getTotalPagar = (dte) => {
        if (typeof dte.totalPagar === 'number')
            return dte.totalPagar;
        if (typeof dte.totalPagar === 'string')
            return parseFloat(dte.totalPagar) || 0;
        if (dte.totalPagar && typeof dte.totalPagar.toNumber === 'function') {
            return dte.totalPagar.toNumber();
        }
        // Handle Prisma Decimal object format
        if (dte.totalPagar && typeof dte.totalPagar === 'object') {
            const val = dte.totalPagar.toString?.() || dte.totalPagar.value;
            return parseFloat(val) || 0;
        }
        return 0;
    };
    return (<div className="space-y-6">
      {/* Hacienda Configuration Banner */}
      {showHaciendaBanner && (<HaciendaConfigBanner_1.HaciendaConfigBanner variant="prominent" className="mb-2"/>)}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
          <p className="text-muted-foreground">
            Gestiona tus documentos tributarios electronicos
          </p>
        </div>
        {canCreateInvoice ? (<link_1.default href="/facturas/nueva">
            <button_1.Button>
              <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
              Nueva Factura
            </button_1.Button>
          </link_1.default>) : (<button_1.Button disabled title="Configura Hacienda primero">
            <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
            Nueva Factura
          </button_1.Button>)}
      </div>

      {/* Error Message */}
      {error && (<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
          <button_1.Button variant="link" className="ml-2 text-red-700" onClick={fetchDTEs}>
            Reintentar
          </button_1.Button>
        </div>)}

      {/* Filters */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="text-base">Filtros</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <lucide_react_1.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <input_1.Input placeholder="Buscar por numero, cliente o codigo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9"/>
              </div>
            </div>
            <select_1.Select value={filterTipo} onValueChange={setFilterTipo}>
              <select_1.SelectTrigger className="w-[180px]">
                <select_1.SelectValue placeholder="Tipo DTE"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="all">Todos los tipos</select_1.SelectItem>
                <select_1.SelectItem value="01">Factura</select_1.SelectItem>
                <select_1.SelectItem value="03">Credito Fiscal</select_1.SelectItem>
                <select_1.SelectItem value="05">Nota de Credito</select_1.SelectItem>
                <select_1.SelectItem value="06">Nota de Debito</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
            <select_1.Select value={filterStatus} onValueChange={setFilterStatus}>
              <select_1.SelectTrigger className="w-[180px]">
                <select_1.SelectValue placeholder="Estado"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="all">Todos los estados</select_1.SelectItem>
                <select_1.SelectItem value="PENDIENTE">Pendiente</select_1.SelectItem>
                <select_1.SelectItem value="FIRMADO">Firmado</select_1.SelectItem>
                <select_1.SelectItem value="PROCESADO">Procesado</select_1.SelectItem>
                <select_1.SelectItem value="RECHAZADO">Rechazado</select_1.SelectItem>
                <select_1.SelectItem value="ANULADO">Anulado</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
            <page_size_selector_1.PageSizeSelector value={limit} onChange={handleLimitChange}/>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Table */}
      <card_1.Card>
        <card_1.CardContent className="p-0">
          {loading ? (<div className="p-4">
              <skeleton_1.SkeletonTable rows={10}/>
            </div>) : (<>
              <table_1.Table>
                <table_1.TableHeader>
                  <table_1.TableRow>
                    <table_1.TableHead>
                      <button className="flex items-center hover:text-foreground transition-colors" onClick={() => handleSort('createdAt')}>
                        Fecha
                        {getSortIcon('createdAt')}
                      </button>
                    </table_1.TableHead>
                    <table_1.TableHead>
                      <button className="flex items-center hover:text-foreground transition-colors" onClick={() => handleSort('numeroControl')}>
                        Numero Control
                        {getSortIcon('numeroControl')}
                      </button>
                    </table_1.TableHead>
                    <table_1.TableHead>Tipo</table_1.TableHead>
                    <table_1.TableHead>Cliente</table_1.TableHead>
                    <table_1.TableHead className="text-right">
                      <button className="flex items-center justify-end hover:text-foreground transition-colors ml-auto" onClick={() => handleSort('totalPagar')}>
                        Total
                        {getSortIcon('totalPagar')}
                      </button>
                    </table_1.TableHead>
                    <table_1.TableHead>Estado</table_1.TableHead>
                    <table_1.TableHead className="text-right">Acciones</table_1.TableHead>
                  </table_1.TableRow>
                </table_1.TableHeader>
                <table_1.TableBody>
                  {dtes.length === 0 ? (<table_1.TableRow>
                      <table_1.TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {search || filterTipo !== 'all' || filterStatus !== 'all'
                    ? 'No se encontraron documentos con esos filtros'
                    : 'No hay documentos emitidos. Crea tu primera factura.'}
                      </table_1.TableCell>
                    </table_1.TableRow>) : (dtes.map((dte) => (<table_1.TableRow key={dte.id}>
                        <table_1.TableCell className="font-medium">
                          {(0, utils_1.formatDate)(dte.createdAt)}
                        </table_1.TableCell>
                        <table_1.TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {dte.numeroControl}
                          </code>
                        </table_1.TableCell>
                        <table_1.TableCell>{(0, utils_1.getTipoDteName)(dte.tipoDte)}</table_1.TableCell>
                        <table_1.TableCell>
                          <div>
                            <div className="font-medium">
                              {dte.cliente?.nombre || 'Sin cliente'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {dte.cliente?.numDocumento || '-'}
                            </div>
                          </div>
                        </table_1.TableCell>
                        <table_1.TableCell className="text-right font-semibold">
                          {(0, utils_1.formatCurrency)(getTotalPagar(dte))}
                        </table_1.TableCell>
                        <table_1.TableCell>
                          <dte_status_badge_1.DTEStatusBadge status={dte.estado} size="sm"/>
                        </table_1.TableCell>
                        <table_1.TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <link_1.default href={`/facturas/${dte.id}`}>
                              <button_1.Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalle">
                                <lucide_react_1.Eye className="h-4 w-4"/>
                              </button_1.Button>
                            </link_1.default>
                            <link_1.default href={`/facturas/nueva?duplicate=${dte.id}`}>
                              <button_1.Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicar factura">
                                <lucide_react_1.Copy className="h-4 w-4"/>
                              </button_1.Button>
                            </link_1.default>
                            <button_1.Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadPdf(dte)} title="Descargar PDF">
                              <lucide_react_1.FileText className="h-4 w-4"/>
                            </button_1.Button>
                            <button_1.Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(dte.id)} title="Descargar JSON">
                              <lucide_react_1.Download className="h-4 w-4"/>
                            </button_1.Button>
                            {dte.estado === 'PROCESADO' && (<button_1.Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Anular" onClick={() => handleAnular(dte)}>
                                <lucide_react_1.Ban className="h-4 w-4"/>
                              </button_1.Button>)}
                          </div>
                        </table_1.TableCell>
                      </table_1.TableRow>)))}
                </table_1.TableBody>
              </table_1.Table>

              {/* Pagination */}
              <pagination_1.Pagination page={page} totalPages={totalPages} total={total} showing={dtes.length} onPageChange={setPage}/>
            </>)}
        </card_1.CardContent>
      </card_1.Card>

      <ConfirmDialog />
    </div>);
}
