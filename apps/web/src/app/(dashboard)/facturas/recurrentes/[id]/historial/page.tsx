'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import { PageSizeSelector } from '@/components/ui/page-size-selector';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, History, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface HistoryEntry {
  id: string;
  status: string;
  dteId: string | null;
  error: string | null;
  runDate: string;
  createdAt: string;
}

interface HistoryResponse {
  data: HistoryEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  SUCCESS: <CheckCircle className="h-4 w-4 text-green-600" />,
  FAILED: <XCircle className="h-4 w-4 text-red-600" />,
  SKIPPED: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
};

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  SKIPPED: 'bg-yellow-100 text-yellow-800',
};

export default function HistorialRecurrentePage() {
  const params = useParams();
  const templateId = params.id as string;
  const toast = useToast();

  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Stats
  const [stats, setStats] = React.useState({ success: 0, failed: 0, total: 0 });

  const fetchHistory = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recurring-invoices/${templateId}/history?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) throw new Error('Error al cargar historial');

      const data: HistoryResponse = await res.json();
      setHistory(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);

      // Calculate stats from current page (approximation)
      if (page === 1) {
        const success = data.data.filter((h) => h.status === 'SUCCESS').length;
        const failed = data.data.filter((h) => h.status === 'FAILED').length;
        setStats({ success, failed, total: data.total });
      }
    } catch {
      toast.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  }, [page, limit, templateId, toast]);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/facturas/recurrentes/${templateId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            Historial de Ejecuciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro completo de facturas generadas por este template
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Ejecuciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.success}</p>
            <p className="text-sm text-muted-foreground">Exitosas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-sm text-muted-foreground">Fallidas</p>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Ejecuciones</CardTitle>
            <PageSizeSelector value={limit} onChange={handleLimitChange} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable rows={5} />
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay ejecuciones registradas
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>DTE Generado</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="text-sm">{formatDate(h.runDate)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_COLORS[h.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {STATUS_ICONS[h.status]}
                          {h.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {h.dteId ? (
                          <Link
                            href="/facturas"
                            className="text-primary hover:underline text-sm"
                          >
                            Ver Factura
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px]">
                        {h.error ? (
                          <span className="text-red-600" title={h.error}>
                            {h.error.length > 100 ? h.error.substring(0, 100) + '...' : h.error}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                showing={history.length}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
