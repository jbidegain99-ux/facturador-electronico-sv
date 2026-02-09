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
exports.default = DashboardPage;
const React = __importStar(require("react"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const dte_status_badge_1 = require("@/components/dte/dte-status-badge");
const onboarding_checklist_1 = require("@/components/onboarding/onboarding-checklist");
const HaciendaConfigBanner_1 = require("@/components/HaciendaConfigBanner");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const skeleton_1 = require("@/components/ui/skeleton");
function DashboardPage() {
    const { status, isLoading: isLoadingOnboarding } = (0, onboarding_checklist_1.useOnboardingStatus)();
    const { isConfigured: isHaciendaConfigured, isLoading: isLoadingHacienda, demoMode } = (0, HaciendaConfigBanner_1.useHaciendaStatus)();
    const [isLoading, setIsLoading] = React.useState(true);
    const [summary, setSummary] = React.useState(null);
    const [chartData, setChartData] = React.useState([]);
    const [recentDTEs, setRecentDTEs] = React.useState([]);
    const [planUsage, setPlanUsage] = React.useState(null);
    // Check if onboarding is fully complete
    const isOnboardingComplete = status
        ? status.hasCompanyData && status.hasCertificate && status.hasTestedConnection
        : true;
    // Show Hacienda banner if not configured and not in demo mode
    const showHaciendaBanner = !isLoadingHacienda && !isHaciendaConfigured && !demoMode;
    // Fetch dashboard data - each call is independent so one failure doesn't block others
    React.useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }
            const headers = { Authorization: `Bearer ${token}` };
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;
            const safeFetch = async (url) => {
                try {
                    return await fetch(url, { headers });
                }
                catch (err) {
                    console.warn(`[Dashboard] Failed to fetch ${url}:`, err);
                    return null;
                }
            };
            try {
                const [summaryRes, chartRes, recentRes, planRes] = await Promise.all([
                    safeFetch(`${baseUrl}/dte/stats/summary`),
                    safeFetch(`${baseUrl}/dte/stats/by-date?groupBy=day`),
                    safeFetch(`${baseUrl}/dte/recent?limit=5`),
                    safeFetch(`${baseUrl}/plans/my-usage`),
                ]);
                if (summaryRes?.ok) {
                    const data = await summaryRes.json().catch(() => null);
                    if (data)
                        setSummary(data);
                }
                if (chartRes?.ok) {
                    const data = await chartRes.json().catch(() => null);
                    if (Array.isArray(data)) {
                        setChartData(data.slice(-7));
                    }
                }
                if (recentRes?.ok) {
                    const data = await recentRes.json().catch(() => null);
                    if (Array.isArray(data)) {
                        setRecentDTEs(data);
                    }
                }
                if (planRes?.ok) {
                    const data = await planRes.json().catch(() => null);
                    if (data)
                        setPlanUsage(data);
                }
            }
            catch (error) {
                console.error('[Dashboard] Error fetching dashboard data:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);
    // Format chart date labels
    const formatChartDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        if (isToday)
            return 'Hoy';
        const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        return days[date.getDay()];
    };
    const maxChart = Math.max(...chartData.map((d) => d.cantidad), 1);
    // Helper to get totalPagar as number (handles Prisma Decimal serialization)
    const getTotalPagar = (dte) => {
        if (dte.totalPagar === null || dte.totalPagar === undefined)
            return 0;
        if (typeof dte.totalPagar === 'number')
            return dte.totalPagar;
        if (typeof dte.totalPagar === 'string')
            return parseFloat(dte.totalPagar) || 0;
        if (typeof dte.totalPagar === 'object' && dte.totalPagar !== null) {
            return parseFloat(dte.totalPagar.toString()) || 0;
        }
        return 0;
    };
    return (<div className="space-y-6">
      {/* Hacienda Configuration Banner - Show if not configured */}
      {showHaciendaBanner && (<HaciendaConfigBanner_1.HaciendaConfigBanner variant="prominent" className="mb-2"/>)}

      {/* Onboarding Checklist - Show if not complete (and Hacienda is configured) */}
      {!isLoadingOnboarding && !isOnboardingComplete && status && !showHaciendaBanner && (<onboarding_checklist_1.OnboardingChecklist status={status} className="mb-2"/>)}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de tu actividad de facturacion electronica
          </p>
        </div>
        <div className="flex gap-2">
          <link_1.default href="/reportes">
            <button_1.Button variant="outline">
              <lucide_react_1.BarChart3 className="mr-2 h-4 w-4"/>
              Reportes
            </button_1.Button>
          </link_1.default>
          <link_1.default href="/facturas/nueva">
            <button_1.Button>
              <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
              Nueva Factura
            </button_1.Button>
          </link_1.default>
        </div>
      </div>

      {isLoading ? (<>
          {/* Skeleton Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (<skeleton_1.SkeletonCard key={i}/>))}
          </div>

          {/* Skeleton Charts */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <card_1.Card className="col-span-4">
              <card_1.CardHeader>
                <skeleton_1.Skeleton className="h-5 w-40"/>
                <skeleton_1.Skeleton className="h-4 w-60"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <skeleton_1.SkeletonChart />
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card className="col-span-3">
              <card_1.CardHeader>
                <skeleton_1.Skeleton className="h-5 w-32"/>
                <skeleton_1.Skeleton className="h-4 w-48"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <skeleton_1.SkeletonList items={5}/>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </>) : (<>
          {/* Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <card_1.Card>
              <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <card_1.CardTitle className="text-sm font-medium">DTEs Hoy</card_1.CardTitle>
                <lucide_react_1.FileText className="h-4 w-4 text-muted-foreground"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="text-2xl font-bold">{summary?.dtesHoy || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Documentos emitidos hoy
                </p>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <card_1.CardTitle className="text-sm font-medium">DTEs este Mes</card_1.CardTitle>
                <lucide_react_1.TrendingUp className="h-4 w-4 text-muted-foreground"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="text-2xl font-bold">{summary?.dtesMes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {summary?.dtesMesChange !== undefined && (<>
                      {summary.dtesMesChange >= 0 ? '+' : ''}{summary.dtesMesChange}% vs mes anterior
                    </>)}
                </p>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <card_1.CardTitle className="text-sm font-medium">Total Facturado</card_1.CardTitle>
                <lucide_react_1.DollarSign className="h-4 w-4 text-muted-foreground"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="text-2xl font-bold">
                  {(0, utils_1.formatCurrency)(summary?.totalFacturado || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary?.totalFacturadoChange !== undefined && (<>
                      {summary.totalFacturadoChange >= 0 ? '+' : ''}{summary.totalFacturadoChange}% vs mes anterior
                    </>)}
                </p>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <card_1.CardTitle className="text-sm font-medium">Rechazados</card_1.CardTitle>
                <lucide_react_1.XCircle className="h-4 w-4 text-destructive"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {summary?.rechazados || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requieren atencion
                </p>
              </card_1.CardContent>
            </card_1.Card>
          </div>

          {/* Plan Usage Widget */}
          {planUsage && (<card_1.Card>
              <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <card_1.CardTitle className="text-sm font-medium">
                  {planUsage.planNombre ? `Mi Plan: ${planUsage.planNombre}` : 'Mi Plan'}
                </card_1.CardTitle>
                <lucide_react_1.CreditCard className="h-4 w-4 text-muted-foreground"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                {!planUsage.planNombre ? (<div className="text-sm text-muted-foreground">
                    <p>No tienes un plan asignado actualmente.</p>
                    <p className="mt-1">Contacta a soporte para obtener un plan.</p>
                  </div>) : (<>
                    <div className="space-y-3">
                      {/* DTEs */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">DTEs este mes</span>
                          <span className="font-medium">
                            {planUsage.usage.dtesThisMonth}
                            {planUsage.usage.maxDtesPerMonth !== -1 && ` / ${planUsage.usage.maxDtesPerMonth}`}
                            {planUsage.usage.maxDtesPerMonth === -1 && ' / Ilimitado'}
                          </span>
                        </div>
                        {planUsage.usage.maxDtesPerMonth !== -1 && (<div className="w-full bg-muted rounded-full h-2">
                            <div className={`h-2 rounded-full transition-all ${planUsage.usage.dtesThisMonth / planUsage.usage.maxDtesPerMonth > 0.9
                            ? 'bg-destructive'
                            : planUsage.usage.dtesThisMonth / planUsage.usage.maxDtesPerMonth > 0.7
                                ? 'bg-yellow-500'
                                : 'bg-primary'}`} style={{
                            width: `${Math.min(100, (planUsage.usage.dtesThisMonth / planUsage.usage.maxDtesPerMonth) * 100)}%`,
                        }}/>
                          </div>)}
                      </div>

                      {/* Users */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Usuarios</span>
                          <span className="font-medium">
                            {planUsage.usage.users}
                            {planUsage.usage.maxUsers !== -1 && ` / ${planUsage.usage.maxUsers}`}
                            {planUsage.usage.maxUsers === -1 && ' / Ilimitado'}
                          </span>
                        </div>
                        {planUsage.usage.maxUsers !== -1 && (<div className="w-full bg-muted rounded-full h-2">
                            <div className={`h-2 rounded-full transition-all ${planUsage.usage.users / planUsage.usage.maxUsers > 0.9
                            ? 'bg-destructive'
                            : 'bg-primary'}`} style={{
                            width: `${Math.min(100, (planUsage.usage.users / planUsage.usage.maxUsers) * 100)}%`,
                        }}/>
                          </div>)}
                      </div>

                      {/* Clients */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Clientes</span>
                          <span className="font-medium">
                            {planUsage.usage.clientes}
                            {planUsage.usage.maxClientes !== -1 && ` / ${planUsage.usage.maxClientes}`}
                            {planUsage.usage.maxClientes === -1 && ' / Ilimitado'}
                          </span>
                        </div>
                        {planUsage.usage.maxClientes !== -1 && (<div className="w-full bg-muted rounded-full h-2">
                            <div className={`h-2 rounded-full transition-all ${planUsage.usage.clientes / planUsage.usage.maxClientes > 0.9
                            ? 'bg-destructive'
                            : 'bg-primary'}`} style={{
                            width: `${Math.min(100, (planUsage.usage.clientes / planUsage.usage.maxClientes) * 100)}%`,
                        }}/>
                          </div>)}
                      </div>
                    </div>

                    {/* Warning if near limits */}
                    {(!planUsage.limits.canCreateDte || !planUsage.limits.canAddUser || !planUsage.limits.canAddCliente) && (<div className="mt-3 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                        <p className="text-xs text-destructive">
                          Has alcanzado el limite de tu plan. Contacta a soporte para actualizar.
                        </p>
                      </div>)}
                  </>)}
              </card_1.CardContent>
            </card_1.Card>)}

          {/* Charts and Recent DTEs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Chart */}
            <card_1.Card className="col-span-4">
              <card_1.CardHeader>
                <card_1.CardTitle>DTEs Ultimos 7 dias</card_1.CardTitle>
                <card_1.CardDescription>
                  Cantidad de documentos emitidos por dia
                </card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                {chartData.length > 0 ? (<div className="flex items-end justify-between h-48 gap-2">
                    {chartData.map((day, i) => (<div key={i} className="flex flex-col items-center flex-1">
                        <div className="w-full bg-primary rounded-t transition-all hover:bg-primary/80 min-h-[4px]" style={{ height: `${Math.max((day.cantidad / maxChart) * 160, 4)}px` }} title={`${day.cantidad} DTEs - ${(0, utils_1.formatCurrency)(day.total)}`}/>
                        <span className="text-xs text-muted-foreground mt-2">
                          {formatChartDate(day.fecha)}
                        </span>
                        <span className="text-xs font-medium">{day.cantidad}</span>
                      </div>))}
                  </div>) : (<div className="h-48 flex items-center justify-center text-muted-foreground">
                    No hay datos recientes
                  </div>)}
              </card_1.CardContent>
            </card_1.Card>

            {/* Recent DTEs */}
            <card_1.Card className="col-span-3">
              <card_1.CardHeader>
                <card_1.CardTitle>Ultimos DTEs</card_1.CardTitle>
                <card_1.CardDescription>
                  Los 5 documentos mas recientes
                </card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                {recentDTEs.length > 0 ? (<div className="space-y-4">
                    {recentDTEs.map((dte) => (<div key={dte.id} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {dte.cliente?.nombre || 'Sin cliente'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(0, utils_1.getTipoDteName)(dte.tipoDte)} - {(0, utils_1.formatDate)(dte.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {(0, utils_1.formatCurrency)(getTotalPagar(dte))}
                          </span>
                          <dte_status_badge_1.DTEStatusBadge status={dte.estado} showIcon={false} size="sm"/>
                        </div>
                      </div>))}
                  </div>) : (<div className="h-32 flex items-center justify-center text-muted-foreground">
                    No hay documentos recientes
                  </div>)}
                <link_1.default href="/facturas">
                  <button_1.Button variant="ghost" className="w-full mt-4">
                    Ver todos
                    <lucide_react_1.ArrowRight className="ml-2 h-4 w-4"/>
                  </button_1.Button>
                </link_1.default>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </>)}
    </div>);
}
