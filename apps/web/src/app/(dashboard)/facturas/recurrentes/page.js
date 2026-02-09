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
exports.default = RecurrentesPage;
const React = __importStar(require("react"));
const link_1 = __importDefault(require("next/link"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const table_1 = require("@/components/ui/table");
const skeleton_1 = require("@/components/ui/skeleton");
const toast_1 = require("@/components/ui/toast");
const confirm_dialog_1 = require("@/components/ui/confirm-dialog");
const pagination_1 = require("@/components/ui/pagination");
const page_size_selector_1 = require("@/components/ui/page-size-selector");
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
const TABS = [
    { key: '', label: 'Todas' },
    { key: 'ACTIVE', label: 'Activas' },
    { key: 'PAUSED', label: 'Pausadas' },
    { key: 'CANCELLED', label: 'Canceladas' },
];
function RecurrentesPage() {
    const toast = (0, toast_1.useToast)();
    const toastRef = React.useRef(toast);
    toastRef.current = toast;
    const { confirm, ConfirmDialog } = (0, confirm_dialog_1.useConfirm)();
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('');
    const [page, setPage] = React.useState(1);
    const [limit, setLimit] = React.useState(20);
    const [sortBy, setSortBy] = React.useState('createdAt');
    const [sortOrder, setSortOrder] = React.useState('desc');
    const [templates, setTemplates] = React.useState([]);
    const [total, setTotal] = React.useState(0);
    const [totalPages, setTotalPages] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [fetchError, setFetchError] = React.useState(null);
    const fetchTemplates = React.useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                sortBy,
                sortOrder,
            });
            if (search)
                params.set('search', search);
            if (statusFilter)
                params.set('status', statusFilter);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-invoices?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) {
                if (res.status === 404) {
                    setFetchError('El servicio de facturas recurrentes no esta disponible aun.');
                    return;
                }
                throw new Error(`Error al cargar templates (${res.status})`);
            }
            const data = await res.json();
            setTemplates(data.data);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Error al cargar facturas recurrentes';
            setFetchError(message);
            toastRef.current.error(message);
        }
        finally {
            setLoading(false);
        }
    }, [page, limit, search, statusFilter, sortBy, sortOrder]);
    React.useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);
    const handleAction = async (id, action) => {
        const labels = {
            pause: 'pausar',
            resume: 'reanudar',
            cancel: 'cancelar',
            trigger: 'ejecutar ahora',
        };
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-invoices/${id}/${action}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `Error al ${labels[action]}`);
            }
            toast.success(`Template ${labels[action]} exitosamente`);
            fetchTemplates();
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : `Error al ${labels[action]}`);
        }
    };
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setPage(1);
    };
    const getSortIcon = (field) => {
        if (sortBy !== field)
            return <lucide_react_1.ArrowUpDown className="h-3 w-3 ml-1 opacity-40"/>;
        return sortOrder === 'asc'
            ? <lucide_react_1.ArrowUp className="h-3 w-3 ml-1"/>
            : <lucide_react_1.ArrowDown className="h-3 w-3 ml-1"/>;
    };
    const handleLimitChange = (newLimit) => {
        setLimit(newLimit);
        setPage(1);
    };
    return (<div className="space-y-6">
      <ConfirmDialog />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <lucide_react_1.Repeat className="h-6 w-6"/>
            Facturas Recurrentes
          </h1>
          <p className="text-muted-foreground mt-1">
            Templates automaticos para generacion periodica de facturas
          </p>
        </div>
        <link_1.default href="/facturas/recurrentes/nuevo">
          <button_1.Button>
            <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
            Nuevo Template
          </button_1.Button>
        </link_1.default>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {TABS.map((tab) => (<button key={tab.key} onClick={() => { setStatusFilter(tab.key); setPage(1); }} className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${statusFilter === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'}`}>
            {tab.label}
          </button>))}
      </div>

      <card_1.Card>
        <card_1.CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <card_1.CardTitle className="text-lg">Templates</card_1.CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <lucide_react_1.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <input_1.Input placeholder="Buscar por nombre o cliente..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 w-64"/>
              </div>
              <page_size_selector_1.PageSizeSelector value={limit} onChange={handleLimitChange}/>
            </div>
          </div>
        </card_1.CardHeader>
        <card_1.CardContent className="p-0">
          {loading ? (<skeleton_1.SkeletonTable rows={5}/>) : fetchError ? (<div className="text-center py-12">
              <lucide_react_1.Repeat className="mx-auto h-12 w-12 text-muted-foreground/30"/>
              <p className="mt-4 text-muted-foreground">{fetchError}</p>
              <button_1.Button variant="outline" className="mt-4" onClick={fetchTemplates}>
                Reintentar
              </button_1.Button>
            </div>) : templates.length === 0 ? (<div className="text-center py-12">
              <lucide_react_1.Repeat className="mx-auto h-12 w-12 text-muted-foreground/30"/>
              <p className="mt-4 text-muted-foreground">No se encontraron templates</p>
              <link_1.default href="/facturas/recurrentes/nuevo">
                <button_1.Button variant="outline" className="mt-4">
                  <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
                  Crear primer template
                </button_1.Button>
              </link_1.default>
            </div>) : (<>
              <table_1.Table>
                <table_1.TableHeader>
                  <table_1.TableRow>
                    <table_1.TableHead className="cursor-pointer select-none" onClick={() => handleSort('nombre')}>
                      <div className="flex items-center">
                        Nombre {getSortIcon('nombre')}
                      </div>
                    </table_1.TableHead>
                    <table_1.TableHead>Cliente</table_1.TableHead>
                    <table_1.TableHead>Frecuencia</table_1.TableHead>
                    <table_1.TableHead className="cursor-pointer select-none" onClick={() => handleSort('nextRunDate')}>
                      <div className="flex items-center">
                        Proxima Ejecucion {getSortIcon('nextRunDate')}
                      </div>
                    </table_1.TableHead>
                    <table_1.TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                      <div className="flex items-center">
                        Estado {getSortIcon('status')}
                      </div>
                    </table_1.TableHead>
                    <table_1.TableHead>Ejecuciones</table_1.TableHead>
                    <table_1.TableHead className="text-right">Acciones</table_1.TableHead>
                  </table_1.TableRow>
                </table_1.TableHeader>
                <table_1.TableBody>
                  {templates.map((t) => (<table_1.TableRow key={t.id}>
                      <table_1.TableCell className="font-medium">
                        <link_1.default href={`/facturas/recurrentes/${t.id}`} className="hover:underline text-primary">
                          {t.nombre}
                        </link_1.default>
                      </table_1.TableCell>
                      <table_1.TableCell>{t.cliente.nombre}</table_1.TableCell>
                      <table_1.TableCell>{INTERVAL_LABELS[t.interval] || t.interval}</table_1.TableCell>
                      <table_1.TableCell>
                        {t.status === 'ACTIVE'
                    ? (0, utils_1.formatDate)(t.nextRunDate)
                    : '-'}
                      </table_1.TableCell>
                      <table_1.TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-800'}`}>
                          {STATUS_LABELS[t.status] || t.status}
                        </span>
                      </table_1.TableCell>
                      <table_1.TableCell>{t._count.history}</table_1.TableCell>
                      <table_1.TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <link_1.default href={`/facturas/recurrentes/${t.id}`}>
                            <button_1.Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalle">
                              <lucide_react_1.Eye className="h-4 w-4"/>
                            </button_1.Button>
                          </link_1.default>
                          {t.status === 'ACTIVE' && (<>
                              <button_1.Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAction(t.id, 'trigger')} title="Ejecutar ahora">
                                <lucide_react_1.Zap className="h-4 w-4"/>
                              </button_1.Button>
                              <button_1.Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAction(t.id, 'pause')} title="Pausar">
                                <lucide_react_1.Pause className="h-4 w-4"/>
                              </button_1.Button>
                            </>)}
                          {(t.status === 'PAUSED' || t.status === 'SUSPENDED_ERROR') && (<button_1.Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAction(t.id, 'resume')} title="Reanudar">
                              <lucide_react_1.Play className="h-4 w-4"/>
                            </button_1.Button>)}
                          {t.status !== 'CANCELLED' && (<button_1.Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleAction(t.id, 'cancel')} title="Cancelar">
                              <lucide_react_1.XCircle className="h-4 w-4"/>
                            </button_1.Button>)}
                        </div>
                      </table_1.TableCell>
                    </table_1.TableRow>))}
                </table_1.TableBody>
              </table_1.Table>
              <pagination_1.Pagination page={page} totalPages={totalPages} total={total} showing={templates.length} onPageChange={setPage}/>
            </>)}
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
