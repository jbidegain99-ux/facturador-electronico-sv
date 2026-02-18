'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Webhook,
  Building2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TenantWebhookSummary {
  tenantId: string;
  tenantName: string;
  endpointCount: number;
  activeEndpoints: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminWebhooksPage() {
  const [summaries, setSummaries] = useState<TenantWebhookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEndpoints, setTotalEndpoints] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalDelivered, setTotalDelivered] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);

  const loadData = useCallback(async () => {
    try {
      // Fetch all tenants with webhook data
      const res = await fetch(`${API_BASE}/admin/webhooks/summary`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        // If admin endpoint doesn't exist yet, show empty state
        setSummaries([]);
        return;
      }
      const json = await res.json().catch(() => ({ data: [] }));
      const data: TenantWebhookSummary[] = Array.isArray(json.data) ? json.data : [];
      setSummaries(data);

      // Calculate totals
      let endpoints = 0, active = 0, delivered = 0, failed = 0;
      for (const s of data) {
        endpoints += s.endpointCount;
        active += s.activeEndpoints;
        delivered += s.successfulDeliveries;
        failed += s.failedDeliveries;
      }
      setTotalEndpoints(endpoints);
      setTotalActive(active);
      setTotalDelivered(delivered);
      setTotalFailed(failed);
    } catch {
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Webhook className="h-8 w-8" />
            Webhooks — Admin
          </h1>
          <p className="text-muted-foreground">
            Vista global de webhooks de todos los tenants
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); loadData(); }}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Endpoints Totales</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEndpoints}</div>
            <p className="text-xs text-muted-foreground">{totalActive} activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants con Webhooks</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaries.length}</div>
            <p className="text-xs text-muted-foreground">tenants configurados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Exitosas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalDelivered}</div>
            <p className="text-xs text-muted-foreground">total histórico</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Fallidas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalFailed}</div>
            <p className="text-xs text-muted-foreground">requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks por Tenant</CardTitle>
          <CardDescription>Resumen de configuración de webhooks por empresa</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Endpoints</TableHead>
                <TableHead>Activos</TableHead>
                <TableHead>Entregas</TableHead>
                <TableHead>Exitosas</TableHead>
                <TableHead>Fallidas</TableHead>
                <TableHead>Tasa de Éxito</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((s) => {
                const rate = s.totalDeliveries > 0
                  ? ((s.successfulDeliveries / s.totalDeliveries) * 100).toFixed(1)
                  : '—';
                return (
                  <TableRow key={s.tenantId}>
                    <TableCell className="font-medium">{s.tenantName}</TableCell>
                    <TableCell>{s.endpointCount}</TableCell>
                    <TableCell>
                      <Badge variant={s.activeEndpoints > 0 ? 'default' : 'secondary'}>
                        {s.activeEndpoints}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.totalDeliveries}</TableCell>
                    <TableCell className="text-green-600">{s.successfulDeliveries}</TableCell>
                    <TableCell className="text-red-600">{s.failedDeliveries}</TableCell>
                    <TableCell>
                      {rate === '—' ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <Badge
                          variant="outline"
                          className={
                            parseFloat(rate) >= 90
                              ? 'border-green-300 text-green-700 dark:text-green-400'
                              : parseFloat(rate) >= 50
                                ? 'border-yellow-300 text-yellow-700 dark:text-yellow-400'
                                : 'border-red-300 text-red-700 dark:text-red-400'
                          }
                        >
                          {rate}%
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {summaries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Webhook className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Ningún tenant ha configurado webhooks aún
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
