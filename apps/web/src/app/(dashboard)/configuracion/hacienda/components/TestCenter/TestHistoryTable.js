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
exports.TestHistoryTable = TestHistoryTable;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const table_1 = require("@/components/ui/table");
const select_1 = require("@/components/ui/select");
const badge_1 = require("@/components/ui/badge");
const types_1 = require("../../types");
function TestHistoryTable() {
    const [loading, setLoading] = React.useState(true);
    const [records, setRecords] = React.useState([]);
    const [filterDteType, setFilterDteType] = React.useState('all');
    const [filterStatus, setFilterStatus] = React.useState('all');
    const loadHistory = React.useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filterDteType !== 'all')
                params.set('dteType', filterDteType);
            if (filterStatus !== 'all')
                params.set('status', filterStatus);
            params.set('limit', '50');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hacienda/tests/history?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (res.ok) {
                const data = await res.json();
                setRecords(data);
            }
        }
        catch (error) {
            console.error('Error loading history:', error);
        }
        finally {
            setLoading(false);
        }
    }, [filterDteType, filterStatus]);
    React.useEffect(() => {
        loadHistory();
    }, [loadHistory]);
    const getStatusBadge = (status) => {
        switch (status) {
            case 'SUCCESS':
                return (<badge_1.Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <lucide_react_1.CheckCircle2 className="h-3 w-3 mr-1"/>
            Exitosa
          </badge_1.Badge>);
            case 'FAILED':
                return (<badge_1.Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <lucide_react_1.XCircle className="h-3 w-3 mr-1"/>
            Fallida
          </badge_1.Badge>);
            case 'PENDING':
                return (<badge_1.Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            <lucide_react_1.Clock className="h-3 w-3 mr-1"/>
            Pendiente
          </badge_1.Badge>);
            default:
                return <badge_1.Badge variant="outline">{status}</badge_1.Badge>;
        }
    };
    const getTestTypeIcon = (testType) => {
        switch (testType) {
            case 'EMISSION':
                return <lucide_react_1.Send className="h-4 w-4 text-blue-600"/>;
            case 'CANCELLATION':
                return <lucide_react_1.Ban className="h-4 w-4 text-amber-600"/>;
            default:
                return null;
        }
    };
    const getTestTypeName = (testType) => {
        switch (testType) {
            case 'EMISSION':
                return 'Emisión';
            case 'CANCELLATION':
                return 'Anulación';
            case 'CONTINGENCY':
                return 'Contingencia';
            default:
                return testType;
        }
    };
    return (<card_1.Card>
      <card_1.CardHeader className="flex flex-row items-center justify-between">
        <card_1.CardTitle>Historial de Pruebas</card_1.CardTitle>
        <div className="flex items-center gap-2">
          <select_1.Select value={filterDteType} onValueChange={setFilterDteType}>
            <select_1.SelectTrigger className="w-[180px]">
              <select_1.SelectValue placeholder="Tipo de DTE"/>
            </select_1.SelectTrigger>
            <select_1.SelectContent>
              <select_1.SelectItem value="all">Todos los tipos</select_1.SelectItem>
              {Object.entries(types_1.DTE_TYPES).map(([code, name]) => (<select_1.SelectItem key={code} value={code}>
                  {name}
                </select_1.SelectItem>))}
            </select_1.SelectContent>
          </select_1.Select>

          <select_1.Select value={filterStatus} onValueChange={setFilterStatus}>
            <select_1.SelectTrigger className="w-[140px]">
              <select_1.SelectValue placeholder="Estado"/>
            </select_1.SelectTrigger>
            <select_1.SelectContent>
              <select_1.SelectItem value="all">Todos</select_1.SelectItem>
              <select_1.SelectItem value="SUCCESS">Exitosas</select_1.SelectItem>
              <select_1.SelectItem value="FAILED">Fallidas</select_1.SelectItem>
              <select_1.SelectItem value="PENDING">Pendientes</select_1.SelectItem>
            </select_1.SelectContent>
          </select_1.Select>

          <button_1.Button variant="outline" size="icon" onClick={loadHistory}>
            <lucide_react_1.RefreshCw className="h-4 w-4"/>
          </button_1.Button>
        </div>
      </card_1.CardHeader>
      <card_1.CardContent>
        {loading ? (<div className="flex items-center justify-center py-8">
            <lucide_react_1.Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
          </div>) : records.length === 0 ? (<div className="text-center py-8 text-muted-foreground">
            No se encontraron pruebas con los filtros seleccionados
          </div>) : (<div className="rounded-md border">
            <table_1.Table>
              <table_1.TableHeader>
                <table_1.TableRow>
                  <table_1.TableHead>Tipo DTE</table_1.TableHead>
                  <table_1.TableHead>Prueba</table_1.TableHead>
                  <table_1.TableHead>Estado</table_1.TableHead>
                  <table_1.TableHead>Código</table_1.TableHead>
                  <table_1.TableHead>Sello</table_1.TableHead>
                  <table_1.TableHead>Fecha</table_1.TableHead>
                </table_1.TableRow>
              </table_1.TableHeader>
              <table_1.TableBody>
                {records.map((record) => (<table_1.TableRow key={record.id}>
                    <table_1.TableCell>
                      <div className="flex items-center gap-2">
                        <badge_1.Badge variant="outline" className="font-mono text-xs">
                          {record.dteType}
                        </badge_1.Badge>
                        <span className="text-sm">{record.dteName}</span>
                      </div>
                    </table_1.TableCell>
                    <table_1.TableCell>
                      <div className="flex items-center gap-2">
                        {getTestTypeIcon(record.testType)}
                        <span className="text-sm">{getTestTypeName(record.testType)}</span>
                      </div>
                    </table_1.TableCell>
                    <table_1.TableCell>{getStatusBadge(record.status)}</table_1.TableCell>
                    <table_1.TableCell>
                      <code className="text-xs text-muted-foreground">
                        {record.codigoGeneracion
                    ? `${record.codigoGeneracion.slice(0, 8)}...`
                    : '-'}
                      </code>
                    </table_1.TableCell>
                    <table_1.TableCell>
                      <code className="text-xs text-muted-foreground">
                        {record.selloRecibido
                    ? `${record.selloRecibido.slice(0, 12)}...`
                    : '-'}
                      </code>
                    </table_1.TableCell>
                    <table_1.TableCell className="text-sm text-muted-foreground">
                      {new Date(record.executedAt).toLocaleString()}
                    </table_1.TableCell>
                  </table_1.TableRow>))}
              </table_1.TableBody>
            </table_1.Table>
          </div>)}
      </card_1.CardContent>
    </card_1.Card>);
}
