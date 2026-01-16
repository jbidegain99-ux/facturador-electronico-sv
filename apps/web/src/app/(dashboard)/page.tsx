'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DTEStatusBadge } from '@/components/dte/dte-status-badge';
import { formatCurrency, formatDate, getTipoDteName } from '@/lib/utils';
import {
  FileText,
  TrendingUp,
  DollarSign,
  XCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

// Mock data - replace with API calls
const metrics = {
  dtesHoy: 12,
  dtesMes: 156,
  totalFacturado: 45678.90,
  rechazados: 3,
};

const recentDTEs = [
  { id: '1', numeroControl: 'DTE-01-M001P001-000000000000001', receptorNombre: 'Cliente ABC', totalPagar: 1250.00, status: 'PROCESADO' as const, createdAt: '2024-01-16T10:30:00Z', tipoDte: '01' as const },
  { id: '2', numeroControl: 'DTE-03-M001P001-000000000000002', receptorNombre: 'Empresa XYZ', totalPagar: 3450.00, status: 'PROCESANDO' as const, createdAt: '2024-01-16T09:15:00Z', tipoDte: '03' as const },
  { id: '3', numeroControl: 'DTE-01-M001P001-000000000000003', receptorNombre: 'Comercial 123', totalPagar: 890.50, status: 'RECHAZADO' as const, createdAt: '2024-01-15T16:45:00Z', tipoDte: '01' as const },
  { id: '4', numeroControl: 'DTE-01-M001P001-000000000000004', receptorNombre: 'Tienda Plus', totalPagar: 2100.00, status: 'PROCESADO' as const, createdAt: '2024-01-15T14:20:00Z', tipoDte: '01' as const },
  { id: '5', numeroControl: 'DTE-03-M001P001-000000000000005', receptorNombre: 'Distribuidora El Sol', totalPagar: 5670.00, status: 'PROCESADO' as const, createdAt: '2024-01-15T11:00:00Z', tipoDte: '03' as const },
];

const chartData = [
  { fecha: 'Lun', cantidad: 15 },
  { fecha: 'Mar', cantidad: 22 },
  { fecha: 'Mie', cantidad: 18 },
  { fecha: 'Jue', cantidad: 28 },
  { fecha: 'Vie', cantidad: 35 },
  { fecha: 'Sab', cantidad: 12 },
  { fecha: 'Hoy', cantidad: 12 },
];

export default function DashboardPage() {
  const maxChart = Math.max(...chartData.map((d) => d.cantidad));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de tu actividad de facturacion electronica
          </p>
        </div>
        <Link href="/facturas/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Factura
          </Button>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DTEs Hoy</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dtesHoy}</div>
            <p className="text-xs text-muted-foreground">
              +2 respecto a ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DTEs este Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dtesMes}</div>
            <p className="text-xs text-muted-foreground">
              +12% respecto al mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalFacturado)}</div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.rechazados}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atencion
            </p>
          </CardContent>
        </Card>
      </div>

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
            <div className="flex items-end justify-between h-48 gap-2">
              {chartData.map((day, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                    style={{ height: `${(day.cantidad / maxChart) * 160}px` }}
                  />
                  <span className="text-xs text-muted-foreground mt-2">{day.fecha}</span>
                  <span className="text-xs font-medium">{day.cantidad}</span>
                </div>
              ))}
            </div>
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
            <div className="space-y-4">
              {recentDTEs.map((dte) => (
                <div key={dte.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {dte.receptorNombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getTipoDteName(dte.tipoDte)} - {formatDate(dte.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatCurrency(dte.totalPagar)}
                    </span>
                    <DTEStatusBadge status={dte.status} showIcon={false} size="sm" />
                  </div>
                </div>
              ))}
            </div>
            <Link href="/facturas">
              <Button variant="ghost" className="w-full mt-4">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
