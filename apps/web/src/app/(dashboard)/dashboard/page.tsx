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
  DollarSign,
  Users,
  Package,
  Plus,
  ArrowRight,
  BarChart3,
  CreditCard,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Skeleton, SkeletonCard, SkeletonChart, SkeletonList } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// --- Types ---

interface DashboardStats {
  totalInvoicesThisMonth: number;
  totalInvoicesLastMonth: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  totalClients: number;
  newClientsThisMonth: number;
  totalCatalogItems: number;
  invoicesByStatus: Record<string, number>;
  revenueByDay: Array<{ date: string; amount: number }>;
  topClients: Array<{ name: string; totalInvoices: number; totalRevenue: number }>;
  recentInvoices: Array<{
    id: string;
    numeroControl: string;
    tipoDte: string;
    clientName: string;
    total: number;
    status: string;
    date: string;
  }>;
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

// --- Helpers ---

function calcPercentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function ChangeIndicator({ current, previous, label, vsLabel }: { current: number; previous: number; label: string; vsLabel: string }) {
  const pct = calcPercentChange(current, previous);
  if (pct === null) return <p className="text-xs text-muted-foreground">{label}</p>;

  const isPositive = pct >= 0;
  return (
    <p className={`text-xs flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{pct}{vsLabel}
    </p>
  );
}

// Custom tooltip for the recharts area chart
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

// --- Main Component ---

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { status, isLoading: isLoadingOnboarding } = useOnboardingStatus();
  const { isConfigured: isHaciendaConfigured, isLoading: isLoadingHacienda, demoMode } = useHaciendaStatus();
  const [isLoading, setIsLoading] = React.useState(true);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [planUsage, setPlanUsage] = React.useState<PlanUsage | null>(null);

  const isOnboardingComplete = status
    ? status.hasCompanyData && status.hasCertificate && status.hasTestedConnection
    : true;
  const showHaciendaBanner = !isLoadingHacienda && !isHaciendaConfigured && !demoMode;

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
        const [statsRes, planRes] = await Promise.all([
          safeFetch(`${baseUrl}/dashboard/stats`),
          safeFetch(`${baseUrl}/plans/my-usage`),
        ]);

        if (statsRes?.ok) {
          const data = await statsRes.json().catch(() => null);
          if (data) setStats(data);
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

  // Format chart X-axis labels
  const chartData = React.useMemo(() => {
    if (!stats?.revenueByDay) return [];
    return stats.revenueByDay.map((d) => ({
      ...d,
      label: new Date(d.date + 'T12:00:00').toLocaleDateString('es-SV', { day: '2-digit', month: 'short' }),
    }));
  }, [stats?.revenueByDay]);

  return (
    <div className="space-y-6">
      {/* Hacienda Configuration Banner */}
      {showHaciendaBanner && (
        <HaciendaConfigBanner variant="prominent" className="mb-2" />
      )}

      {/* Onboarding Checklist */}
      {!isLoadingOnboarding && !isOnboardingComplete && status && !showHaciendaBanner && (
        <OnboardingChecklist status={status} className="mb-2" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/reportes">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              {t('reports')}
            </Button>
          </Link>
          <Link href="/facturas/nueva">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('newInvoice')}
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
          {/* ── Stat Cards ── */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Facturas este mes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('invoicesThisMonth')}</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalInvoicesThisMonth ?? 0}</div>
                <ChangeIndicator
                  current={stats?.totalInvoicesThisMonth ?? 0}
                  previous={stats?.totalInvoicesLastMonth ?? 0}
                  label={t('invoicesDesc')}
                  vsLabel={t('vsLastMonth')}
                />
              </CardContent>
            </Card>

            {/* Ingresos este mes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('revenueThisMonth')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.revenueThisMonth ?? 0)}
                </div>
                <ChangeIndicator
                  current={stats?.revenueThisMonth ?? 0}
                  previous={stats?.revenueLastMonth ?? 0}
                  label={t('revenueDesc')}
                  vsLabel={t('vsLastMonth')}
                />
              </CardContent>
            </Card>

            {/* Clientes totales */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('clientsTotal')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalClients ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {(stats?.newClientsThisMonth ?? 0) > 0 ? (
                    <span className="text-green-500">{t('newThisMonth', { count: stats?.newClientsThisMonth ?? 0 })}</span>
                  ) : (
                    t('clientsDesc')
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Catalogo items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('catalogTotal')}</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalCatalogItems ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {t('catalogDesc')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Plan Usage Widget ── */}
          {planUsage?.planNombre && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('myPlan', { planName: planUsage.planNombre })}
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <PlanUsageBar
                    label={t('dtesThisMonth')}
                    used={planUsage.usage.dtesThisMonth}
                    max={planUsage.usage.maxDtesPerMonth}
                    unlimitedLabel={t('unlimited')}
                  />
                  <PlanUsageBar
                    label={t('users')}
                    used={planUsage.usage.users}
                    max={planUsage.usage.maxUsers}
                    unlimitedLabel={t('unlimited')}
                  />
                  <PlanUsageBar
                    label={t('clientsTotal')}
                    used={planUsage.usage.clientes}
                    max={planUsage.usage.maxClientes}
                    unlimitedLabel={t('unlimited')}
                  />
                </div>
                {(!planUsage.limits.canCreateDte || !planUsage.limits.canAddUser || !planUsage.limits.canAddCliente) && (
                  <div className="mt-3 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                    <p className="text-xs text-destructive">
                      {t('planLimitReached')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Revenue Chart + Top Clients ── */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Revenue Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>{t('monthlyRevenue')}</CardTitle>
                <CardDescription>
                  {t('monthlyRevenueDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                        width={50}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-muted-foreground">
                    {t('noRevenueData')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Clients */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>{t('topClients')}</CardTitle>
                <CardDescription>
                  {t('topClientsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(stats?.topClients?.length ?? 0) > 0 ? (
                  <div className="space-y-4">
                    {stats!.topClients.map((client, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{client.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {client.totalInvoices} DTEs
                          </p>
                        </div>
                        <span className="text-sm font-semibold shrink-0">
                          {formatCurrency(client.totalRevenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    {t('noClientData')}
                  </div>
                )}
                <Link href="/clientes">
                  <Button variant="ghost" className="w-full mt-4">
                    {t('viewAllClients')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* ── Recent Invoices ── */}
          <Card>
            <CardHeader>
              <CardTitle>{t('recentInvoices')}</CardTitle>
              <CardDescription>
                {t('recentInvoicesDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(stats?.recentInvoices?.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  {stats!.recentInvoices.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/facturas/${inv.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <code className="text-xs bg-muted px-2 py-1 rounded shrink-0">
                          {inv.numeroControl}
                        </code>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{inv.clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {getTipoDteName(inv.tipoDte as '01' | '03')} — {formatDate(inv.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold">
                          {formatCurrency(inv.total)}
                        </span>
                        <DTEStatusBadge
                          status={inv.status as 'PROCESADO' | 'PENDIENTE' | 'RECHAZADO' | 'FIRMADO' | 'ANULADO'}
                          showIcon={false}
                          size="sm"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  {t('noRecentDocs')}
                </div>
              )}
              <Link href="/facturas">
                <Button variant="ghost" className="w-full mt-4">
                  {t('viewAllInvoices')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// --- Subcomponents ---

function PlanUsageBar({ label, used, max, unlimitedLabel }: { label: string; used: number; max: number; unlimitedLabel: string }) {
  const isUnlimited = max === -1;
  const ratio = isUnlimited ? 0 : max > 0 ? used / max : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {used}
          {isUnlimited ? ` / ${unlimitedLabel}` : ` / ${max}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              ratio > 0.9 ? 'bg-destructive' : ratio > 0.7 ? 'bg-yellow-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(100, ratio * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
