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
exports.default = HistorialRecurrentePage;
const React = __importStar(require("react"));
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const table_1 = require("@/components/ui/table");
const skeleton_1 = require("@/components/ui/skeleton");
const toast_1 = require("@/components/ui/toast");
const pagination_1 = require("@/components/ui/pagination");
const page_size_selector_1 = require("@/components/ui/page-size-selector");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const STATUS_ICONS = {
    SUCCESS: <lucide_react_1.CheckCircle className="h-4 w-4 text-green-600"/>,
    FAILED: <lucide_react_1.XCircle className="h-4 w-4 text-red-600"/>,
    SKIPPED: <lucide_react_1.AlertTriangle className="h-4 w-4 text-yellow-600"/>,
};
const STATUS_COLORS = {
    SUCCESS: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    SKIPPED: 'bg-yellow-100 text-yellow-800',
};
function HistorialRecurrentePage() {
    const params = (0, navigation_1.useParams)();
    const templateId = params.id;
    const toast = (0, toast_1.useToast)();
    const toastRef = React.useRef(toast);
    toastRef.current = toast;
    const [history, setHistory] = React.useState([]);
    const [page, setPage] = React.useState(1);
    const [limit, setLimit] = React.useState(20);
    const [total, setTotal] = React.useState(0);
    const [totalPages, setTotalPages] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [fetchError, setFetchError] = React.useState(null);
    // Stats
    const [stats, setStats] = React.useState({ success: 0, failed: 0, total: 0 });
    const fetchHistory = React.useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-invoices/${templateId}/history?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) {
                if (res.status === 404) {
                    setFetchError('Historial no disponible. El servicio de facturas recurrentes no esta habilitado.');
                    return;
                }
                throw new Error(`Error al cargar historial (${res.status})`);
            }
            const data = await res.json();
            setHistory(data.data);
            setTotal(data.total);
            setTotalPages(data.totalPages);
            // Calculate stats from current page (approximation)
            if (page === 1) {
                const success = data.data.filter((h) => h.status === 'SUCCESS').length;
                const failed = data.data.filter((h) => h.status === 'FAILED').length;
                setStats({ success, failed, total: data.total });
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Error al cargar historial';
            setFetchError(message);
            toastRef.current.error(message);
        }
        finally {
            setLoading(false);
        }
    }, [page, limit, templateId]);
    React.useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);
    const handleLimitChange = (newLimit) => {
        setLimit(newLimit);
        setPage(1);
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <link_1.default href={`/facturas/recurrentes/${templateId}`}>
          <button_1.Button variant="ghost" size="icon">
            <lucide_react_1.ArrowLeft className="h-5 w-5"/>
          </button_1.Button>
        </link_1.default>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <lucide_react_1.History className="h-6 w-6"/>
            Historial de Ejecuciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro completo de facturas generadas por este template
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <card_1.Card>
          <card_1.CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Ejecuciones</p>
          </card_1.CardContent>
        </card_1.Card>
        <card_1.Card>
          <card_1.CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.success}</p>
            <p className="text-sm text-muted-foreground">Exitosas</p>
          </card_1.CardContent>
        </card_1.Card>
        <card_1.Card>
          <card_1.CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-sm text-muted-foreground">Fallidas</p>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* History Table */}
      <card_1.Card>
        <card_1.CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <card_1.CardTitle className="text-lg">Ejecuciones</card_1.CardTitle>
            <page_size_selector_1.PageSizeSelector value={limit} onChange={handleLimitChange}/>
          </div>
        </card_1.CardHeader>
        <card_1.CardContent className="p-0">
          {loading ? (<skeleton_1.SkeletonTable rows={5}/>) : fetchError ? (<div className="text-center py-12">
              <p className="text-muted-foreground">{fetchError}</p>
              <button_1.Button variant="outline" className="mt-4" onClick={fetchHistory}>
                Reintentar
              </button_1.Button>
            </div>) : history.length === 0 ? (<div className="text-center py-12 text-muted-foreground">
              No hay ejecuciones registradas
            </div>) : (<>
              <table_1.Table>
                <table_1.TableHeader>
                  <table_1.TableRow>
                    <table_1.TableHead>Fecha</table_1.TableHead>
                    <table_1.TableHead>Estado</table_1.TableHead>
                    <table_1.TableHead>DTE Generado</table_1.TableHead>
                    <table_1.TableHead>Error</table_1.TableHead>
                  </table_1.TableRow>
                </table_1.TableHeader>
                <table_1.TableBody>
                  {history.map((h) => (<table_1.TableRow key={h.id}>
                      <table_1.TableCell className="text-sm">{(0, utils_1.formatDate)(h.runDate)}</table_1.TableCell>
                      <table_1.TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[h.status] || 'bg-gray-100 text-gray-800'}`}>
                          {STATUS_ICONS[h.status]}
                          {h.status}
                        </span>
                      </table_1.TableCell>
                      <table_1.TableCell>
                        {h.dteId ? (<link_1.default href="/facturas" className="text-primary hover:underline text-sm">
                            Ver Factura
                          </link_1.default>) : (<span className="text-muted-foreground text-sm">-</span>)}
                      </table_1.TableCell>
                      <table_1.TableCell className="text-sm text-muted-foreground max-w-[300px]">
                        {h.error ? (<span className="text-red-600" title={h.error}>
                            {h.error.length > 100 ? h.error.substring(0, 100) + '...' : h.error}
                          </span>) : ('-')}
                      </table_1.TableCell>
                    </table_1.TableRow>))}
                </table_1.TableBody>
              </table_1.Table>
              <pagination_1.Pagination page={page} totalPages={totalPages} total={total} showing={history.length} onPageChange={setPage}/>
            </>)}
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
