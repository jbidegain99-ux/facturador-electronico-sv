'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';
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
    if (!token) return;

    setIsLoading(true);
    const { start, end } = getDateRange();

    const headers = { Authorization: `Bearer ${token}` };
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    // Build query params
    const params = new URLSearchParams();
    if (start) params.set('startDate', start.toISOString());
    if (end) params.set('endDate', end.toISOString());
    params.set('groupBy', groupBy);

    try {
      const [summaryRes, chartRes, typeRes, statusRes, clientsRes] = await Promise.all([
        fetch(`${baseUrl}/dte/stats/summary`, { headers }),
        fetch(`${baseUrl}/dte/stats/by-date?${params}`, { headers }),
        fetch(`${baseUrl}/dte/stats/by-type?${params}`, { headers }),
        fetch(`${baseUrl}/dte/stats/by-status`, { headers }),
        fetch(`${baseUrl}/dte/stats/top-clients?${params}&limit=5`, { headers }),
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

  // Calculate chart max
  const maxChart = Math.max(...chartData.map((d) => d.cantidad), 1);
  const maxTotal = Math.max(...chartData.map((d) => d.total), 1);

  // Status colors
  const statusColors: Record<string, string> = {
    PROCESADO: 'bg-green-500',
    FIRMADO: 'bg-blue-500',
    PENDIENTE: 'bg-yellow-500',
    RECHAZADO: 'bg-red-500',
    ANULADO: 'bg-gray-500',
  };

  // Type colors for pie chart
  const typeColors = ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

  const totalDTEs = typeStats.reduce((sum, t) => sum + t.cantidad, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <Button onClick={handleExportCSV} disabled={chartData.length === 0}>
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dtesToday')}</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.dtesHoy}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dtesMonth')}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.dtesMes}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('vsLastMonth', { change: `${summary.dtesMesChange >= 0 ? '+' : ''}${summary.dtesMesChange}` })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('totalBilled')}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(summary.totalFacturado)}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('vsLastMonth', { change: `${summary.totalFacturadoChange >= 0 ? '+' : ''}${summary.totalFacturadoChange}` })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('rejected')}</CardTitle>
                  <FileText className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{summary.rechazados}</div>
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
                          <p className="font-medium">{client.nombre}</p>
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
        </>
      )}
    </div>
  );
}
