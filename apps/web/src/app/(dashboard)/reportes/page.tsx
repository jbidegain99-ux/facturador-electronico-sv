'use client';

import { API_URL } from '@/lib/api';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  FileText,
  Users,
  Download,
  Calendar,
  Loader2,
  PieChart,
  Globe,
  Shield } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton, SkeletonCard, SkeletonChart, SkeletonList } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';

interface StatsData {
  fecha: string;
  cantidad: number;
  total: number;
}

interface TypeStats {
  tipoDte: string;
  nombre: string;
  cantidad: number;
  total: number;
}

interface StatusStats {
  estado: string;
  cantidad: number;
}

interface TopClient {
  clienteId: string;
  nombre: string;
  numDocumento: string;
  cantidadDtes: number;
  totalFacturado: number;
}

interface SummaryStats {
  dtesHoy: number;
  dtesMes: number;
  dtesMesAnterior: number;
  dtesMesChange: number;
  totalFacturado: number;
  totalFacturadoChange: number;
  rechazados: number;
}

interface ReportByPeriodData {
  period: string;
  year: number;
  data: Array<{ label: string; total: number; count: number; promedio: number }>;
  grandTotal: number;
  grandCount: number;
}

interface ReportRetencionesData {
  data: Array<{
    tipoImpuesto: string;
    total: number;
    count: number;
    byRate: Array<{ tasa: number; total: number; count: number }>;
  }>;
  grandTotal: number;
}

interface ReportExportsData {
  total: number;
  count: number;
  promedio: number;
  byCountry: Array<{ pais: string; total: number; count: number }>;
}

export default function ReportesPage() {
  const toast = useToast();
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');

  const [dateRange, setDateRange] = React.useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [groupBy, setGroupBy] = React.useState<'day' | 'week' | 'month'>('day');

  const [isLoading, setIsLoading] = React.useState(true);
  const [summary, setSummary] = React.useState<SummaryStats | null>(null);
  const [chartData, setChartData] = React.useState<StatsData[]>([]);
  const [typeStats, setTypeStats] = React.useState<TypeStats[]>([]);
  const [statusStats, setStatusStats] = React.useState<StatusStats[]>([]);
  const [topClients, setTopClients] = React.useState<TopClient[]>([]);

  // Advanced reports state
  const [advancedTab, setAdvancedTab] = React.useState('by-period');
  const [advPeriodType, setAdvPeriodType] = React.useState<'monthly' | 'quarterly'>('monthly');
  const [advYear, setAdvYear] = React.useState(new Date().getFullYear());
  const [advLoading, setAdvLoading] = React.useState(false);
  const [periodData, setPeriodData] = React.useState<ReportByPeriodData | null>(null);
  const [retencionesData, setRetencionesData] = React.useState<ReportRetencionesData | null>(null);
  const [exportsData, setExportsData] = React.useState<ReportExportsData | null>(null);

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
          end: endDate ? new Date(endDate) : null };
    }

    return { start, end };
  }, [dateRange, startDate, endDate]);

  // Fetch all data
  const fetchData = React.useCallback(async () => {

    setIsLoading(true);
    const { start, end } = getDateRange();

    const headers = { };
    const baseUrl = API_URL;

    // Build query params
    const params = new URLSearchParams();
    if (start) params.set('startDate', start.toISOString());
    if (end) params.set('endDate', end.toISOString());
    params.set('groupBy', groupBy);

    try {
      const [summaryRes, chartRes, typeRes, statusRes, clientsRes] = await Promise.all([
        fetch(`${API_URL}/dte/stats/summary`, { credentials: 'include', headers }),
        fetch(`${API_URL}/dte/stats/by-date?${params}`, { credentials: 'include', headers }),
        fetch(`${API_URL}/dte/stats/by-type?${params}`, { credentials: 'include', headers }),
        fetch(`${API_URL}/dte/stats/by-status`, { credentials: 'include', headers }),
        fetch(`${API_URL}/dte/stats/top-clients?${params}&limit=5`, { credentials: 'include', headers }),
      ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (chartRes.ok) setChartData(await chartRes.json());
      if (typeRes.ok) setTypeStats(await typeRes.json());
      if (statusRes.ok) setStatusStats(await statusRes.json());
      if (clientsRes.ok) setTopClients(await clientsRes.json());
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange, groupBy]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const headers = [tCommon('date'), 'DTEs', tCommon('total')];
      const rows = chartData.map((d) => [d.fecha, d.cantidad, d.total.toFixed(2)]);
      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-ventas-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t('exportSuccess'));
    } catch (error) {
      toast.error(t('exportError'));
    }
  };

  // Fetch advanced report
  const fetchAdvancedReport = React.useCallback(async (tab: string) => {
    setAdvLoading(true);

    const headers = { };
    const baseUrl = API_URL;
    const { start, end } = getDateRange();
    const params = new URLSearchParams();
    if (start) params.set('startDate', start.toISOString());
    if (end) params.set('endDate', end.toISOString());

    try {
      if (tab === 'by-period') {
        params.set('period', advPeriodType);
        params.set('year', String(advYear));
        const res = await fetch(`${API_URL}/reports/by-period?${params}`, { credentials: 'include', headers });
        if (res.ok) setPeriodData(await res.json());
      } else if (tab === 'retenciones') {
        const res = await fetch(`${API_URL}/reports/retenciones?${params}`, { credentials: 'include', headers });
        if (res.ok) setRetencionesData(await res.json());
      } else if (tab === 'exports') {
        const res = await fetch(`${API_URL}/reports/exports?${params}`, { credentials: 'include', headers });
        if (res.ok) setExportsData(await res.json());
      }
    } catch (e) {
      console.error('Error fetching advanced report:', e);
    } finally {
      setAdvLoading(false);
    }
  }, [getDateRange, advPeriodType, advYear]);

  React.useEffect(() => {
    fetchAdvancedReport(advancedTab);
  }, [advancedTab, fetchAdvancedReport]);

  // Server-side CSV export
  const handleAdvancedExportCSV = () => {
    const baseUrl = API_URL;
    const { start, end } = getDateRange();
    const params = new URLSearchParams({ reportType: advancedTab });
    if (start) params.set('startDate', start.toISOString());
    if (end) params.set('endDate', end.toISOString());
    if (advancedTab === 'by-period') {
      params.set('period', advPeriodType);
      params.set('year', String(advYear));
    }

    // Use fetch with auth header then download
    fetch(`${API_URL}/reports/export-csv?${params}`, { credentials: 'include',
      headers: { } })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte-${advancedTab}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(t('exportSuccess'));
      })
      .catch(() => toast.error(t('exportError')));
  };

  // Calculate chart max
  const maxChart = Math.max(...chartData.map((d) => d.cantidad), 1);
  const maxTotal = Math.max(...chartData.map((d) => d.total), 1);

  // Status colors
  const statusColors: Record<string, string> = {
    PROCESADO: 'bg-green-500',
    FIRMADO: 'bg-blue-500',
    PENDIENTE: 'bg-yellow-500',
    RECHAZADO: 'bg-red-500',
    ANULADO: 'bg-muted-foreground' };

  // Type colors for pie chart
  const typeColors = ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

  const totalDTEs = typeStats.reduce((sum, t) => sum + t.cantidad, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {t('subtitle')}
          </p>
        </div>
        <Button onClick={handleExportCSV} disabled={chartData.length === 0} size="sm" className="self-start sm:self-auto">
          <Download className="mr-2 h-4 w-4" />
          {t('exportCsv')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t('dateRange')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">{t('period')}</label>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as '7d' | '30d' | '90d' | 'custom')}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">{t('last7days')}</SelectItem>
                  <SelectItem value="30d">{t('last30days')}</SelectItem>
                  <SelectItem value="90d">{t('last90days')}</SelectItem>
                  <SelectItem value="custom">{t('custom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">{t('from')}</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">{t('to')}</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">{t('groupBy')}</label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'day' | 'week' | 'month')}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{t('day')}</SelectItem>
                  <SelectItem value="week">{t('week')}</SelectItem>
                  <SelectItem value="month">{t('month')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={fetchData} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : tCommon('refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <>
          {/* Skeleton Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>

          {/* Skeleton Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="lg:col-span-2">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent>
                <SkeletonChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <Skeleton className="w-32 h-32 rounded-full" />
                </div>
                <div className="mt-4 space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skeleton Top Clients */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <SkeletonList items={5} />
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="card-metric card-metric-indigo">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dtesToday')}</CardTitle>
                  <div className="card-icon-wrapper">
                    <FileText className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.dtesHoy}</div>
                </CardContent>
              </Card>

              <Card className="card-metric card-metric-purple">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dtesMonth')}</CardTitle>
                  <div className="card-icon-wrapper">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.dtesMes}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('vsLastMonth', { change: `${summary.dtesMesChange >= 0 ? '+' : ''}${summary.dtesMesChange}` })}
                  </p>
                </CardContent>
              </Card>

              <Card className="card-metric card-metric-sky">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('totalBilled')}</CardTitle>
                  <div className="card-icon-wrapper">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(summary.totalFacturado)}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('vsLastMonth', { change: `${summary.totalFacturadoChange >= 0 ? '+' : ''}${summary.totalFacturadoChange}` })}
                  </p>
                </CardContent>
              </Card>

              <Card className="card-metric card-metric-emerald">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('rejected')}</CardTitle>
                  <div className="card-icon-wrapper">
                    <FileText className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.rechazados}</div>
                  <p className="text-xs text-muted-foreground">{t('needAttention')}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* DTEs by Date Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t('dteVolume')}</CardTitle>
                <CardDescription>{t('dteVolumeDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="flex items-end justify-between h-64 gap-1 overflow-x-auto pb-2">
                    {chartData.map((day, i) => (
                      <div key={i} className="flex flex-col items-center flex-1 min-w-[40px]">
                        <div
                          className="w-full bg-primary rounded-t transition-all hover:bg-primary/80 min-h-[4px]"
                          style={{ height: `${Math.max((day.cantidad / maxChart) * 200, 4)}px` }}
                          title={`${day.cantidad} DTEs - ${formatCurrency(day.total)}`}
                        />
                        <span className="text-[10px] text-muted-foreground mt-2 truncate max-w-full">
                          {day.fecha.split('-').slice(1).join('/')}
                        </span>
                        <span className="text-xs font-medium">{day.cantidad}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    {t('noDataPeriod')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DTEs by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  {t('byDocType')}
                </CardTitle>
                <CardDescription>{t('byDocTypeDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {typeStats.length > 0 ? (
                  <div className="space-y-4">
                    {/* Simple pie representation */}
                    <div className="flex items-center justify-center">
                      <div className="relative w-32 h-32">
                        <svg viewBox="0 0 100 100" className="transform -rotate-90">
                          {typeStats.reduce(
                            (acc, stat, i) => {
                              const percentage = (stat.cantidad / totalDTEs) * 100;
                              const strokeDasharray = `${percentage} ${100 - percentage}`;
                              const element = (
                                <circle
                                  key={stat.tipoDte}
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="none"
                                  stroke={typeColors[i % typeColors.length]}
                                  strokeWidth="20"
                                  strokeDasharray={strokeDasharray}
                                  strokeDashoffset={-acc.offset}
                                />
                              );
                              acc.elements.push(element);
                              acc.offset += percentage;
                              return acc;
                            },
                            { elements: [] as React.ReactNode[], offset: 0 }
                          ).elements}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold">{totalDTEs}</span>
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-2">
                      {typeStats.map((stat, i) => (
                        <div key={stat.tipoDte} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: typeColors[i % typeColors.length] }}
                            />
                            <span className="text-sm">{stat.nombre}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium">{stat.cantidad}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({formatCurrency(stat.total)})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    {tCommon('noData')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>{t('byStatus')}</CardTitle>
                <CardDescription>{t('byStatusDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {statusStats.length > 0 ? (
                  <div className="space-y-3">
                    {statusStats.map((stat) => {
                      const total = statusStats.reduce((sum, s) => sum + s.cantidad, 0);
                      const percentage = total > 0 ? (stat.cantidad / total) * 100 : 0;
                      return (
                        <div key={stat.estado} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{stat.estado}</span>
                            <span className="font-medium">{stat.cantidad}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${statusColors[stat.estado] || 'bg-gray-400'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    {tCommon('noData')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Clients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t('topClients')}
              </CardTitle>
              <CardDescription>{t('topClientsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {topClients.length > 0 ? (
                <div className="space-y-4">
                  {topClients.map((client, i) => (
                    <div key={client.clienteId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium truncate">{client.nombre}</p>
                          <p className="text-xs text-muted-foreground">{client.numDocumento}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(client.totalFacturado)}</p>
                        <p className="text-xs text-muted-foreground">
                          {client.cantidadDtes} DTEs
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  {t('noClientData')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Advanced Reports ──────────────────────────────── */}
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Reportes Avanzados
                </CardTitle>
                <CardDescription>Análisis detallado por período, retenciones y exportaciones</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={handleAdvancedExportCSV} className="self-start sm:self-auto">
                <Download className="w-3 h-3 mr-1" />
                CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs value={advancedTab} onValueChange={setAdvancedTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="by-period">
                    <Calendar className="w-3 h-3 mr-1" />
                    Por Período
                  </TabsTrigger>
                  <TabsTrigger value="retenciones">
                    <Shield className="w-3 h-3 mr-1" />
                    Retenciones
                  </TabsTrigger>
                  <TabsTrigger value="exports">
                    <Globe className="w-3 h-3 mr-1" />
                    Exportaciones
                  </TabsTrigger>
                </TabsList>

                {advLoading ? (
                  <div className="h-48 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* By Period Tab */}
                    <TabsContent value="by-period">
                      <div className="flex gap-3 mb-4">
                        <Select
                          value={advPeriodType}
                          onValueChange={(v) => setAdvPeriodType(v as 'monthly' | 'quarterly')}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Mensual</SelectItem>
                            <SelectItem value="quarterly">Trimestral</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={advYear}
                          onChange={(e) => setAdvYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
                          className="w-24"
                          min={2020}
                          max={2100}
                        />
                        <Button size="sm" variant="outline" onClick={() => fetchAdvancedReport('by-period')}>
                          Actualizar
                        </Button>
                      </div>

                      {periodData && periodData.data.length > 0 ? (
                        <div className="space-y-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Período</th>
                                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Cantidad</th>
                                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Total</th>
                                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Promedio</th>
                                </tr>
                              </thead>
                              <tbody>
                                {periodData.data.map((row) => (
                                  <tr key={row.label} className="border-b border-muted hover:bg-muted/50">
                                    <td className="py-2 px-3 font-medium">{row.label}</td>
                                    <td className="py-2 px-3 text-right">{row.count}</td>
                                    <td className="py-2 px-3 text-right font-medium">{formatCurrency(row.total)}</td>
                                    <td className="py-2 px-3 text-right text-muted-foreground">{formatCurrency(row.promedio)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 font-bold">
                                  <td className="py-2 px-3">TOTAL</td>
                                  <td className="py-2 px-3 text-right">{periodData.grandCount}</td>
                                  <td className="py-2 px-3 text-right">{formatCurrency(periodData.grandTotal)}</td>
                                  <td className="py-2 px-3 text-right text-muted-foreground">
                                    {periodData.grandCount > 0 ? formatCurrency(periodData.grandTotal / periodData.grandCount) : '-'}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* Simple bar visualization */}
                          <div className="flex items-end gap-1 h-40 mt-4">
                            {periodData.data.map((row) => {
                              const maxVal = Math.max(...periodData.data.map((r) => r.total), 1);
                              const height = (row.total / maxVal) * 100;
                              return (
                                <div key={row.label} className="flex-1 flex flex-col items-center">
                                  <div
                                    className="w-full bg-primary rounded-t min-h-[2px] transition-all hover:bg-primary/80"
                                    style={{ height: `${Math.max(height, 1)}%` }}
                                    title={`${row.label}: ${formatCurrency(row.total)}`}
                                  />
                                  <span className="text-[9px] text-muted-foreground mt-1 truncate max-w-full">
                                    {row.label.slice(0, 3)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="h-32 flex items-center justify-center text-muted-foreground">
                          {t('noDataPeriod')}
                        </div>
                      )}
                    </TabsContent>

                    {/* Retenciones Tab */}
                    <TabsContent value="retenciones">
                      {retencionesData && retencionesData.data.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <Card className="p-3 border-primary/30">
                              <p className="text-xs text-muted-foreground">Total Retenido</p>
                              <p className="text-xl font-bold text-primary">{formatCurrency(retencionesData.grandTotal)}</p>
                            </Card>
                            {retencionesData.data.slice(0, 3).map((r) => (
                              <Card key={r.tipoImpuesto} className="p-3">
                                <p className="text-xs text-muted-foreground">{r.tipoImpuesto}</p>
                                <p className="text-lg font-bold">{formatCurrency(r.total)}</p>
                                <p className="text-xs text-muted-foreground">{r.count} retenciones</p>
                              </Card>
                            ))}
                          </div>

                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Tipo Impuesto</th>
                                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Cantidad</th>
                                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Total Retenido</th>
                                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Desglose por Tasa</th>
                              </tr>
                            </thead>
                            <tbody>
                              {retencionesData.data.map((ret) => (
                                <tr key={ret.tipoImpuesto} className="border-b border-muted hover:bg-muted/50">
                                  <td className="py-2 px-3 font-medium">{ret.tipoImpuesto}</td>
                                  <td className="py-2 px-3 text-right">{ret.count}</td>
                                  <td className="py-2 px-3 text-right font-medium">{formatCurrency(ret.total)}</td>
                                  <td className="py-2 px-3">
                                    <div className="flex flex-wrap gap-1">
                                      {ret.byRate.map((rate) => (
                                        <span
                                          key={rate.tasa}
                                          className="text-xs bg-muted px-2 py-0.5 rounded"
                                        >
                                          {(rate.tasa * 100).toFixed(1)}%: {formatCurrency(rate.total)}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="h-32 flex items-center justify-center text-muted-foreground">
                          Sin retenciones en el período seleccionado
                        </div>
                      )}
                    </TabsContent>

                    {/* Exports Tab */}
                    <TabsContent value="exports">
                      {exportsData && exportsData.count > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <Card className="p-3">
                              <p className="text-xs text-muted-foreground">Total Exportado</p>
                              <p className="text-xl font-bold">{formatCurrency(exportsData.total)}</p>
                            </Card>
                            <Card className="p-3">
                              <p className="text-xs text-muted-foreground">Facturas Exportación</p>
                              <p className="text-xl font-bold">{exportsData.count}</p>
                            </Card>
                            <Card className="p-3">
                              <p className="text-xs text-muted-foreground">Promedio</p>
                              <p className="text-xl font-bold">{formatCurrency(exportsData.promedio)}</p>
                            </Card>
                          </div>

                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-3 font-medium text-muted-foreground">País</th>
                                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Facturas</th>
                                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Total</th>
                                <th className="text-right py-2 px-3 font-medium text-muted-foreground">% del Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exportsData.byCountry.map((c) => (
                                <tr key={c.pais} className="border-b border-muted hover:bg-muted/50">
                                  <td className="py-2 px-3 font-medium flex items-center gap-2">
                                    <Globe className="w-3 h-3 text-muted-foreground" />
                                    {c.pais}
                                  </td>
                                  <td className="py-2 px-3 text-right">{c.count}</td>
                                  <td className="py-2 px-3 text-right font-medium">{formatCurrency(c.total)}</td>
                                  <td className="py-2 px-3 text-right text-muted-foreground">
                                    {exportsData.total > 0 ? ((c.total / exportsData.total) * 100).toFixed(1) : 0}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="h-32 flex items-center justify-center text-muted-foreground">
                          Sin exportaciones en el período seleccionado
                        </div>
                      )}
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
