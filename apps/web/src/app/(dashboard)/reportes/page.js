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
exports.default = ReportesPage;
const React = __importStar(require("react"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const select_1 = require("@/components/ui/select");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const skeleton_1 = require("@/components/ui/skeleton");
const toast_1 = require("@/components/ui/toast");
function ReportesPage() {
    const toast = (0, toast_1.useToast)();
    const [dateRange, setDateRange] = React.useState('30d');
    const [startDate, setStartDate] = React.useState('');
    const [endDate, setEndDate] = React.useState('');
    const [groupBy, setGroupBy] = React.useState('day');
    const [isLoading, setIsLoading] = React.useState(true);
    const [summary, setSummary] = React.useState(null);
    const [chartData, setChartData] = React.useState([]);
    const [typeStats, setTypeStats] = React.useState([]);
    const [statusStats, setStatusStats] = React.useState([]);
    const [topClients, setTopClients] = React.useState([]);
    // Calculate date range
    const getDateRange = React.useCallback(() => {
        const end = new Date();
        let start = new Date();
        switch (dateRange) {
            case '7d':
                start.setDate(end.getDate() - 7);
                break;
            case '30d':
                start.setDate(end.getDate() - 30);
                break;
            case '90d':
                start.setDate(end.getDate() - 90);
                break;
            case 'custom':
                return {
                    start: startDate ? new Date(startDate) : null,
                    end: endDate ? new Date(endDate) : null,
                };
        }
        return { start, end };
    }, [dateRange, startDate, endDate]);
    // Fetch all data
    const fetchData = React.useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token)
            return;
        setIsLoading(true);
        const { start, end } = getDateRange();
        const headers = { Authorization: `Bearer ${token}` };
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        // Build query params
        const params = new URLSearchParams();
        if (start)
            params.set('startDate', start.toISOString());
        if (end)
            params.set('endDate', end.toISOString());
        params.set('groupBy', groupBy);
        try {
            const [summaryRes, chartRes, typeRes, statusRes, clientsRes] = await Promise.all([
                fetch(`${baseUrl}/dte/stats/summary`, { headers }),
                fetch(`${baseUrl}/dte/stats/by-date?${params}`, { headers }),
                fetch(`${baseUrl}/dte/stats/by-type?${params}`, { headers }),
                fetch(`${baseUrl}/dte/stats/by-status`, { headers }),
                fetch(`${baseUrl}/dte/stats/top-clients?${params}&limit=5`, { headers }),
            ]);
            if (summaryRes.ok)
                setSummary(await summaryRes.json());
            if (chartRes.ok)
                setChartData(await chartRes.json());
            if (typeRes.ok)
                setTypeStats(await typeRes.json());
            if (statusRes.ok)
                setStatusStats(await statusRes.json());
            if (clientsRes.ok)
                setTopClients(await clientsRes.json());
        }
        catch (error) {
            console.error('Error fetching report data:', error);
        }
        finally {
            setIsLoading(false);
        }
    }, [getDateRange, groupBy]);
    React.useEffect(() => {
        fetchData();
    }, [fetchData]);
    // Export to CSV
    const handleExportCSV = () => {
        try {
            const headers = ['Fecha', 'Cantidad DTEs', 'Total Facturado'];
            const rows = chartData.map((d) => [d.fecha, d.cantidad, d.total.toFixed(2)]);
            const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `reporte-ventas-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Reporte exportado correctamente');
        }
        catch (error) {
            toast.error('Error al exportar el reporte');
        }
    };
    // Calculate chart max
    const maxChart = Math.max(...chartData.map((d) => d.cantidad), 1);
    const maxTotal = Math.max(...chartData.map((d) => d.total), 1);
    // Status colors
    const statusColors = {
        PROCESADO: 'bg-green-500',
        FIRMADO: 'bg-blue-500',
        PENDIENTE: 'bg-yellow-500',
        RECHAZADO: 'bg-red-500',
        ANULADO: 'bg-gray-500',
    };
    // Type colors for pie chart
    const typeColors = ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];
    const totalDTEs = typeStats.reduce((sum, t) => sum + t.cantidad, 0);
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <lucide_react_1.BarChart3 className="w-8 h-8 text-primary"/>
            Reportes y Analytics
          </h1>
          <p className="text-muted-foreground">
            Analiza el rendimiento de tu facturacion electronica
          </p>
        </div>
        <button_1.Button onClick={handleExportCSV} disabled={chartData.length === 0}>
          <lucide_react_1.Download className="mr-2 h-4 w-4"/>
          Exportar CSV
        </button_1.Button>
      </div>

      {/* Filters */}
      <card_1.Card>
        <card_1.CardHeader className="pb-3">
          <card_1.CardTitle className="text-base flex items-center gap-2">
            <lucide_react_1.Calendar className="w-4 h-4"/>
            Rango de Fechas
          </card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Periodo</label>
              <select_1.Select value={dateRange} onValueChange={(v) => setDateRange(v)}>
                <select_1.SelectTrigger className="w-40">
                  <select_1.SelectValue />
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="7d">Ultimos 7 dias</select_1.SelectItem>
                  <select_1.SelectItem value="30d">Ultimos 30 dias</select_1.SelectItem>
                  <select_1.SelectItem value="90d">Ultimos 90 dias</select_1.SelectItem>
                  <select_1.SelectItem value="custom">Personalizado</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>

            {dateRange === 'custom' && (<>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Desde</label>
                  <input_1.Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40"/>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Hasta</label>
                  <input_1.Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40"/>
                </div>
              </>)}

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Agrupar por</label>
              <select_1.Select value={groupBy} onValueChange={(v) => setGroupBy(v)}>
                <select_1.SelectTrigger className="w-32">
                  <select_1.SelectValue />
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="day">Dia</select_1.SelectItem>
                  <select_1.SelectItem value="week">Semana</select_1.SelectItem>
                  <select_1.SelectItem value="month">Mes</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>

            <button_1.Button variant="outline" onClick={fetchData} disabled={isLoading}>
              {isLoading ? <lucide_react_1.Loader2 className="w-4 h-4 animate-spin"/> : 'Actualizar'}
            </button_1.Button>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {isLoading ? (<>
          {/* Skeleton Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (<skeleton_1.SkeletonCard key={i}/>))}
          </div>

          {/* Skeleton Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <card_1.Card className="lg:col-span-2">
              <card_1.CardHeader>
                <skeleton_1.Skeleton className="h-5 w-40"/>
                <skeleton_1.Skeleton className="h-4 w-60"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <skeleton_1.SkeletonChart />
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardHeader>
                <skeleton_1.Skeleton className="h-5 w-48"/>
                <skeleton_1.Skeleton className="h-4 w-56"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="flex items-center justify-center">
                  <skeleton_1.Skeleton className="w-32 h-32 rounded-full"/>
                </div>
                <div className="mt-4 space-y-2">
                  {[...Array(4)].map((_, i) => (<div key={i} className="flex items-center justify-between">
                      <skeleton_1.Skeleton className="h-4 w-24"/>
                      <skeleton_1.Skeleton className="h-4 w-16"/>
                    </div>))}
                </div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardHeader>
                <skeleton_1.Skeleton className="h-5 w-32"/>
                <skeleton_1.Skeleton className="h-4 w-48"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (<div key={i} className="space-y-1">
                      <div className="flex justify-between">
                        <skeleton_1.Skeleton className="h-4 w-24"/>
                        <skeleton_1.Skeleton className="h-4 w-8"/>
                      </div>
                      <skeleton_1.Skeleton className="h-2 w-full rounded-full"/>
                    </div>))}
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>

          {/* Skeleton Top Clients */}
          <card_1.Card>
            <card_1.CardHeader>
              <skeleton_1.Skeleton className="h-5 w-32"/>
              <skeleton_1.Skeleton className="h-4 w-64"/>
            </card_1.CardHeader>
            <card_1.CardContent>
              <skeleton_1.SkeletonList items={5}/>
            </card_1.CardContent>
          </card_1.Card>
        </>) : (<>
          {/* Summary Cards */}
          {summary && (<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <card_1.Card>
                <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <card_1.CardTitle className="text-sm font-medium">DTEs Hoy</card_1.CardTitle>
                  <lucide_react_1.FileText className="h-4 w-4 text-muted-foreground"/>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-2xl font-bold">{summary.dtesHoy}</div>
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card>
                <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <card_1.CardTitle className="text-sm font-medium">DTEs este Mes</card_1.CardTitle>
                  <lucide_react_1.TrendingUp className="h-4 w-4 text-muted-foreground"/>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-2xl font-bold">{summary.dtesMes}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary.dtesMesChange >= 0 ? '+' : ''}{summary.dtesMesChange}% vs mes anterior
                  </p>
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card>
                <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <card_1.CardTitle className="text-sm font-medium">Total Facturado</card_1.CardTitle>
                  <lucide_react_1.DollarSign className="h-4 w-4 text-muted-foreground"/>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-2xl font-bold">{(0, utils_1.formatCurrency)(summary.totalFacturado)}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary.totalFacturadoChange >= 0 ? '+' : ''}{summary.totalFacturadoChange}% vs mes anterior
                  </p>
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card>
                <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <card_1.CardTitle className="text-sm font-medium">Rechazados</card_1.CardTitle>
                  <lucide_react_1.FileText className="h-4 w-4 text-destructive"/>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-2xl font-bold text-destructive">{summary.rechazados}</div>
                  <p className="text-xs text-muted-foreground">Requieren atencion</p>
                </card_1.CardContent>
              </card_1.Card>
            </div>)}

          {/* Charts Grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* DTEs by Date Chart */}
            <card_1.Card className="lg:col-span-2">
              <card_1.CardHeader>
                <card_1.CardTitle>Volumen de DTEs</card_1.CardTitle>
                <card_1.CardDescription>Cantidad de documentos emitidos por periodo</card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                {chartData.length > 0 ? (<div className="flex items-end justify-between h-64 gap-1 overflow-x-auto pb-2">
                    {chartData.map((day, i) => (<div key={i} className="flex flex-col items-center flex-1 min-w-[40px]">
                        <div className="w-full bg-primary rounded-t transition-all hover:bg-primary/80 min-h-[4px]" style={{ height: `${Math.max((day.cantidad / maxChart) * 200, 4)}px` }} title={`${day.cantidad} DTEs - ${(0, utils_1.formatCurrency)(day.total)}`}/>
                        <span className="text-[10px] text-muted-foreground mt-2 truncate max-w-full">
                          {day.fecha.split('-').slice(1).join('/')}
                        </span>
                        <span className="text-xs font-medium">{day.cantidad}</span>
                      </div>))}
                  </div>) : (<div className="h-64 flex items-center justify-center text-muted-foreground">
                    No hay datos para el periodo seleccionado
                  </div>)}
              </card_1.CardContent>
            </card_1.Card>

            {/* DTEs by Type */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.PieChart className="w-4 h-4"/>
                  Por Tipo de Documento
                </card_1.CardTitle>
                <card_1.CardDescription>Distribucion de DTEs por tipo</card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                {typeStats.length > 0 ? (<div className="space-y-4">
                    {/* Simple pie representation */}
                    <div className="flex items-center justify-center">
                      <div className="relative w-32 h-32">
                        <svg viewBox="0 0 100 100" className="transform -rotate-90">
                          {typeStats.reduce((acc, stat, i) => {
                    const percentage = (stat.cantidad / totalDTEs) * 100;
                    const strokeDasharray = `${percentage} ${100 - percentage}`;
                    const element = (<circle key={stat.tipoDte} cx="50" cy="50" r="40" fill="none" stroke={typeColors[i % typeColors.length]} strokeWidth="20" strokeDasharray={strokeDasharray} strokeDashoffset={-acc.offset}/>);
                    acc.elements.push(element);
                    acc.offset += percentage;
                    return acc;
                }, { elements: [], offset: 0 }).elements}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold">{totalDTEs}</span>
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-2">
                      {typeStats.map((stat, i) => (<div key={stat.tipoDte} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColors[i % typeColors.length] }}/>
                            <span className="text-sm">{stat.nombre}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium">{stat.cantidad}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({(0, utils_1.formatCurrency)(stat.total)})
                            </span>
                          </div>
                        </div>))}
                    </div>
                  </div>) : (<div className="h-48 flex items-center justify-center text-muted-foreground">
                    Sin datos
                  </div>)}
              </card_1.CardContent>
            </card_1.Card>

            {/* Status Distribution */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Por Estado</card_1.CardTitle>
                <card_1.CardDescription>Estado actual de los documentos</card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                {statusStats.length > 0 ? (<div className="space-y-3">
                    {statusStats.map((stat) => {
                    const total = statusStats.reduce((sum, s) => sum + s.cantidad, 0);
                    const percentage = total > 0 ? (stat.cantidad / total) * 100 : 0;
                    return (<div key={stat.estado} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{stat.estado}</span>
                            <span className="font-medium">{stat.cantidad}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full transition-all ${statusColors[stat.estado] || 'bg-gray-400'}`} style={{ width: `${percentage}%` }}/>
                          </div>
                        </div>);
                })}
                  </div>) : (<div className="h-48 flex items-center justify-center text-muted-foreground">
                    Sin datos
                  </div>)}
              </card_1.CardContent>
            </card_1.Card>
          </div>

          {/* Top Clients */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.Users className="w-4 h-4"/>
                Top Clientes
              </card_1.CardTitle>
              <card_1.CardDescription>Clientes con mayor facturacion en el periodo</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              {topClients.length > 0 ? (<div className="space-y-4">
                  {topClients.map((client, i) => (<div key={client.clienteId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium">{client.nombre}</p>
                          <p className="text-xs text-muted-foreground">{client.numDocumento}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{(0, utils_1.formatCurrency)(client.totalFacturado)}</p>
                        <p className="text-xs text-muted-foreground">
                          {client.cantidadDtes} DTEs
                        </p>
                      </div>
                    </div>))}
                </div>) : (<div className="h-32 flex items-center justify-center text-muted-foreground">
                  Sin datos de clientes
                </div>)}
            </card_1.CardContent>
          </card_1.Card>
        </>)}
    </div>);
}
