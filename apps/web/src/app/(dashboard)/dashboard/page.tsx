'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DTEStatusBadge } from '@/components/dte/dte-status-badge';
import { OnboardingChecklist, useOnboardingStatus } from '@/components/onboarding/onboarding-checklist';
import { HaciendaConfigBanner, useHaciendaStatus } from '@/components/HaciendaConfigBanner';
import { formatCurrency, formatDate, getTipoDteName } from '@/lib/utils';
import {
  FileText,
  TrendingUp,
  DollarSign,
  XCircle,
  Plus,
  ArrowRight,
  BarChart3,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton, SkeletonCard, SkeletonChart, SkeletonList } from '@/components/ui/skeleton';

interface SummaryStats {
  dtesHoy: number;
  dtesMes: number;
  dtesMesAnterior: number;
  dtesMesChange: number;
  totalFacturado: number;
  totalFacturadoChange: number;
  rechazados: number;
}

interface ChartData {
  fecha: string;
  cantidad: number;
  total: number;
}

interface RecentDTE {
  id: string;
  numeroControl: string;
  tipoDte: string;
  estado: string;
  totalPagar: number | string | { toString(): string };
  createdAt: string;
  cliente?: {
    nombre: string;
    numDocumento: string;
  };
}

interface PlanUsage {
  planNombre: string | null;
  planCodigo: string | null;
  usage: {
    dtesThisMonth: number;
    maxDtesPerMonth: number;
    dtesRemaining: number;
    users: number;
    maxUsers: number;
    usersRemaining: number;
    clientes: number;
    maxClientes: number;
    clientesRemaining: number;
  };
  limits: {
    canCreateDte: boolean;
    canAddUser: boolean;
    canAddCliente: boolean;
  };
}

export default function DashboardPage() {
  const { status, isLoading: isLoadingOnboarding } = useOnboardingStatus();
  const { isConfigured: isHaciendaConfigured, isLoading: isLoadingHacienda, demoMode } = useHaciendaStatus();
  const [isLoading, setIsLoading] = React.useState(true);
  const [summary, setSummary] = React.useState<SummaryStats | null>(null);
  const [chartData, setChartData] = React.useState<ChartData[]>([]);
  const [recentDTEs, setRecentDTEs] = React.useState<RecentDTE[]>([]);
  const [planUsage, setPlanUsage] = React.useState<PlanUsage | null>(null);

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

      const safeFetch = async (url: string): Promise<Response | null> => {
        try {
          return await fetch(url, { headers });
        } catch (err) {
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
          if (data) setSummary(data);
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
          if (data) setPlanUsage(data);
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format chart date labels
  const formatChartDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) return 'Hoy';

    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    return days[date.getDay()];
  };

  const maxChart = Math.max(...chartData.map((d) => d.cantidad), 1);

  // Helper to get totalPagar as number (handles Prisma Decimal serialization)
  const getTotalPagar = (dte: RecentDTE): number => {
    if (dte.totalPagar === null || dte.totalPagar === undefined) return 0;
    if (typeof dte.totalPagar === 'number') return dte.totalPagar;
    if (typeof dte.totalPagar === 'string') return parseFloat(dte.totalPagar) || 0;
    if (typeof dte.totalPagar === 'object' && dte.totalPagar !== null) {
      return parseFloat(dte.totalPagar.toString()) || 0;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Hacienda Configuration Banner - Show if not configured */}
      {showHaciendaBanner && (
        <HaciendaConfigBanner variant="prominent" className="mb-2" />
      )}

      {/* Onboarding Checklist - Show if not complete (and Hacienda is configured) */}
      {!isLoadingOnboarding && !isOnboardingComplete && status && !showHaciendaBanner && (
        <OnboardingChecklist status={status} className="mb-2" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de tu actividad de facturacion electronica
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/reportes">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Reportes
            </Button>
          </Link>
          <Link href="/facturas/nueva">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Factura
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <>
          {/* Skeleton Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>

          {/* Skeleton Charts */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent>
                <SkeletonChart />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <SkeletonList items={5} />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">DTEs Hoy</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.dtesHoy || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Documentos emitidos hoy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">DTEs este Mes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.dtesMes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {summary?.dtesMesChange !== undefined && (
                    <>
                      {summary.dtesMesChange >= 0 ? '+' : ''}{summary.dtesMesChange}% vs mes anterior
                    </>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary?.totalFacturado || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary?.totalFacturadoChange !== undefined && (
                    <>
                      {summary.totalFacturadoChange >= 0 ? '+' : ''}{summary.totalFacturadoChange}% vs mes anterior
                    </>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {summary?.rechazados || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requieren atencion
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Plan Usage Widget */}
          {planUsage && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {planUsage.planNombre ? `Mi Plan: ${planUsage.planNombre}` : 'Mi Plan'}
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {!planUsage.planNombre ? (
                  <div className="text-sm text-muted-foreground">
                    <p>No tienes un plan asignado actualmente.</p>
                    <p className="mt-1">Contacta a soporte para obtener un plan.</p>
                  </div>
                ) : (
                  <>
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
                        {planUsage.usage.maxDtesPerMonth !== -1 && (
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                planUsage.usage.dtesThisMonth / planUsage.usage.maxDtesPerMonth > 0.9
                                  ? 'bg-destructive'
                                  : planUsage.usage.dtesThisMonth / planUsage.usage.maxDtesPerMonth > 0.7
                                  ? 'bg-yellow-500'
                                  : 'bg-primary'
                              }`}
                              style={{
                                width: `${Math.min(100, (planUsage.usage.dtesThisMonth / planUsage.usage.maxDtesPerMonth) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
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
                        {planUsage.usage.maxUsers !== -1 && (
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                planUsage.usage.users / planUsage.usage.maxUsers > 0.9
                                  ? 'bg-destructive'
                                  : 'bg-primary'
                              }`}
                              style={{
                                width: `${Math.min(100, (planUsage.usage.users / planUsage.usage.maxUsers) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
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
                        {planUsage.usage.maxClientes !== -1 && (
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                planUsage.usage.clientes / planUsage.usage.maxClientes > 0.9
                                  ? 'bg-destructive'
                                  : 'bg-primary'
                              }`}
                              style={{
                                width: `${Math.min(100, (planUsage.usage.clientes / planUsage.usage.maxClientes) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Warning if near limits */}
                    {(!planUsage.limits.canCreateDte || !planUsage.limits.canAddUser || !planUsage.limits.canAddCliente) && (
                      <div className="mt-3 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                        <p className="text-xs text-destructive">
                          Has alcanzado el limite de tu plan. Contacta a soporte para actualizar.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Charts and Recent DTEs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>DTEs Ultimos 7 dias</CardTitle>
                <CardDescription>
                  Cantidad de documentos emitidos por dia
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="flex items-end justify-between h-48 gap-2">
                    {chartData.map((day, i) => (
                      <div key={i} className="flex flex-col items-center flex-1">
                        <div
                          className="w-full bg-primary rounded-t transition-all hover:bg-primary/80 min-h-[4px]"
                          style={{ height: `${Math.max((day.cantidad / maxChart) * 160, 4)}px` }}
                          title={`${day.cantidad} DTEs - ${formatCurrency(day.total)}`}
                        />
                        <span className="text-xs text-muted-foreground mt-2">
                          {formatChartDate(day.fecha)}
                        </span>
                        <span className="text-xs font-medium">{day.cantidad}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    No hay datos recientes
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent DTEs */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Ultimos DTEs</CardTitle>
                <CardDescription>
                  Los 5 documentos mas recientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentDTEs.length > 0 ? (
                  <div className="space-y-4">
                    {recentDTEs.map((dte) => (
                      <div key={dte.id} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {dte.cliente?.nombre || 'Sin cliente'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getTipoDteName(dte.tipoDte as '01' | '03')} - {formatDate(dte.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatCurrency(getTotalPagar(dte))}
                          </span>
                          <DTEStatusBadge
                            status={dte.estado as 'PROCESADO' | 'PENDIENTE' | 'RECHAZADO' | 'FIRMADO' | 'ANULADO'}
                            showIcon={false}
                            size="sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    No hay documentos recientes
                  </div>
                )}
                <Link href="/facturas">
                  <Button variant="ghost" className="w-full mt-4">
                    Ver todos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
