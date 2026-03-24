'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Banknote,
  Building2,
  Receipt,
  CreditCard,
  HelpCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// --- Types ---

interface CashFlowSummary {
  periodo: string;
  total: number;
  cobrado: number;
  pendiente: number;
  byMethod: Array<{
    tipo: string;
    total: number;
    count: number;
    cuenta: string;
  }>;
  forecast: Array<{
    date: string;
    monto: number;
    count: number;
  }>;
}

interface CashFlowAlert {
  tipo: string;
  severidad: 'INFO' | 'WARNING' | 'CRITICAL';
  mensaje: string;
  dteId: string;
  paymentMethodId: string;
}

// --- Constants ---

const PERIOD_OPTIONS = [7, 14, 30, 60] as const;

const METHOD_COLORS: Record<string, string> = {
  EFECTIVO: '#22c55e',
  TRANSFERENCIA: '#3b82f6',
  CHEQUE: '#f59e0b',
  TARJETA: '#8b5cf6',
  OTRA: '#6b7280',
};

const METHOD_ICONS: Record<string, React.ReactNode> = {
  EFECTIVO: <Banknote className="w-4 h-4" />,
  TRANSFERENCIA: <Building2 className="w-4 h-4" />,
  CHEQUE: <Receipt className="w-4 h-4" />,
  TARJETA: <CreditCard className="w-4 h-4" />,
  OTRA: <HelpCircle className="w-4 h-4" />,
};

const METHOD_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  CHEQUE: 'Cheque',
  TARJETA: 'Tarjeta',
  OTRA: 'Otra',
};

// --- Component ---

export default function CashFlowPage() {
  const [summary, setSummary] = React.useState<CashFlowSummary | null>(null);
  const [alerts, setAlerts] = React.useState<CashFlowAlert[]>([]);
  const [period, setPeriod] = React.useState<number>(30);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    setLoading(true);

    Promise.all([
      fetch(`${apiUrl}/cash-flow/summary?period=${period}`, { headers }).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch(`${apiUrl}/cash-flow/alerts`, { headers }).then((r) =>
        r.ok ? r.json() : [],
      ),
    ])
      .then(([summaryData, alertsData]) => {
        setSummary(summaryData as CashFlowSummary | null);
        setAlerts((alertsData as CashFlowAlert[]) || []);
      })
      .catch(() => {
        setSummary(null);
        setAlerts([]);
      })
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const pieData = (summary?.byMethod || []).map((m) => ({
    name: METHOD_LABELS[m.tipo] || m.tipo,
    value: m.total,
    color: METHOD_COLORS[m.tipo] || '#6b7280',
  }));

  const barData = (summary?.forecast || []).map((f) => ({
    date: f.date.slice(5), // MM-DD
    monto: f.monto,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Cash Flow
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Flujo de efectivo - próximos {period} días
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {PERIOD_OPTIONS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? 'default' : 'ghost'}
              onClick={() => setPeriod(p)}
              className="text-xs"
            >
              {p}d
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Esperado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.periodo || `${period} días`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
              Cobrado
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summary?.cobrado || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Confirmado</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Pendiente
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {formatCurrency(summary?.pendiente || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Por confirmar</p>
          </CardContent>
        </Card>
      </div>

      {/* Method Breakdown */}
      {summary && summary.byMethod.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {summary.byMethod.map((m) => (
            <Card key={m.tipo} className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: METHOD_COLORS[m.tipo] || '#6b7280' }}
                />
                <span className="text-xs font-medium flex items-center gap-1">
                  {METHOD_ICONS[m.tipo]}
                  {METHOD_LABELS[m.tipo] || m.tipo}
                </span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(m.total)}</p>
              <p className="text-xs text-muted-foreground">
                {m.count} pago{m.count !== 1 ? 's' : ''} &middot; {m.cuenta}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bar Chart - By Date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Por Fecha</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), 'Monto']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="monto" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                Sin datos para el período seleccionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - By Method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={(props) =>
                      `${String(props.name || '')} ${((Number(props.percent) || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), 'Monto']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                Sin datos para el período seleccionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Alertas ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 rounded-lg p-3 text-sm ${
                  alert.severidad === 'CRITICAL'
                    ? 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
                    : alert.severidad === 'WARNING'
                      ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400'
                      : 'bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400'
                }`}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{alert.mensaje}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!summary || (summary.total === 0 && alerts.length === 0) ? (
        <Card className="p-8 text-center">
          <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin datos de flujo de efectivo</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Los datos aparecerán cuando registres métodos de pago en tus facturas.
          </p>
          <Button asChild variant="default">
            <a href="/facturas/nueva">Crear Factura</a>
          </Button>
        </Card>
      ) : null}
    </div>
  );
}
