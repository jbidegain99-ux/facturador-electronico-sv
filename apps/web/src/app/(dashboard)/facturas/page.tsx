'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DTEStatusBadge } from '@/components/dte/dte-status-badge';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { formatCurrency, formatDate, getTipoDteName } from '@/lib/utils';
import { Plus, Search, Download, Eye, Ban, Loader2, ChevronLeft, ChevronRight, Copy, FileText } from 'lucide-react';
import { DTEStatus, TipoDte } from '@/types';

interface DTE {
  id: string;
  numeroControl: string;
  codigoGeneracion: string;
  tipoDte: TipoDte;
  estado: DTEStatus;
  totalPagar: number | { toNumber: () => number };
  selloRecepcion?: string;
  createdAt: string;
  cliente?: {
    nombre: string;
    numDocumento: string;
  };
}

interface DTEResponse {
  data: DTE[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function FacturasPage() {
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const [search, setSearch] = React.useState('');
  const [filterTipo, setFilterTipo] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);
  const [dtes, setDtes] = React.useState<DTE[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDTEs = React.useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No hay sesion activa');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');

      if (filterTipo !== 'all') params.set('tipoDte', filterTipo);
      if (filterStatus !== 'all') params.set('estado', filterStatus);
      if (search) params.set('search', search);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dte?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al cargar facturas');
      }

      const data: DTEResponse = await res.json();
      setDtes(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      console.error('Error fetching DTEs:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  }, [page, filterTipo, filterStatus, search]);

  // Fetch on mount and when filters change
  React.useEffect(() => {
    fetchDTEs();
  }, [fetchDTEs]);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filterTipo, filterStatus]);

  const handleDownload = async (dteId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dte/${dteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Error al descargar');

      const data = await res.json();
      const jsonStr = JSON.stringify(data.jsonOriginal || data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DTE-${data.codigoGeneracion}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Documento descargado correctamente');
    } catch (err) {
      console.error('Error downloading DTE:', err);
      toast.error('Error al descargar el documento');
    }
  };

  const handleDownloadPdf = async (dte: DTE) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dte/${dte.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Error al generar el PDF');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DTE-${dte.numeroControl || dte.codigoGeneracion}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF descargado correctamente');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error('Error al generar el PDF');
    }
  };

  const handleAnular = async (dte: DTE) => {
    const confirmed = await confirm({
      title: 'Anular documento',
      description: `¿Estás seguro que deseas anular el documento ${dte.numeroControl}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, anular',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dte/${dte.id}/anular`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Error al anular el documento');

      toast.success('Documento anulado correctamente');
      fetchDTEs(); // Refresh the list
    } catch (err) {
      console.error('Error anulando DTE:', err);
      toast.error('Error al anular el documento');
    }
  };

  const getTotalPagar = (dte: DTE): number => {
    if (typeof dte.totalPagar === 'number') return dte.totalPagar;
    if (typeof dte.totalPagar === 'string') return parseFloat(dte.totalPagar) || 0;
    if (dte.totalPagar && typeof dte.totalPagar.toNumber === 'function') {
      return dte.totalPagar.toNumber();
    }
    // Handle Prisma Decimal object format
    if (dte.totalPagar && typeof dte.totalPagar === 'object') {
      const val = (dte.totalPagar as any).toString?.() || (dte.totalPagar as any).value;
      return parseFloat(val) || 0;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
          <p className="text-muted-foreground">
            Gestiona tus documentos tributarios electronicos
          </p>
        </div>
        <Link href="/facturas/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Factura
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
          <Button variant="link" className="ml-2 text-red-700" onClick={fetchDTEs}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por numero, cliente o codigo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo DTE" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="01">Factura</SelectItem>
                <SelectItem value="03">Credito Fiscal</SelectItem>
                <SelectItem value="05">Nota de Credito</SelectItem>
                <SelectItem value="06">Nota de Debito</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="FIRMADO">Firmado</SelectItem>
                <SelectItem value="PROCESADO">Procesado</SelectItem>
                <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                <SelectItem value="ANULADO">Anulado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <SkeletonTable rows={10} />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Numero Control</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dtes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {search || filterTipo !== 'all' || filterStatus !== 'all'
                          ? 'No se encontraron documentos con esos filtros'
                          : 'No hay documentos emitidos. Crea tu primera factura.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    dtes.map((dte) => (
                      <TableRow key={dte.id}>
                        <TableCell className="font-medium">
                          {formatDate(dte.createdAt)}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {dte.numeroControl}
                          </code>
                        </TableCell>
                        <TableCell>{getTipoDteName(dte.tipoDte)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {dte.cliente?.nombre || 'Sin cliente'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {dte.cliente?.numDocumento || '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(getTotalPagar(dte))}
                        </TableCell>
                        <TableCell>
                          <DTEStatusBadge status={dte.estado} size="sm" />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/facturas/${dte.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalle">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/facturas/nueva?duplicate=${dte.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicar factura">
                                <Copy className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDownloadPdf(dte)}
                              title="Descargar PDF"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDownload(dte.id)}
                              title="Descargar JSON"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {dte.estado === 'PROCESADO' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                title="Anular"
                                onClick={() => handleAnular(dte)}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {dtes.length} de {total} documentos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <span className="text-sm">
                      Pagina {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog />
    </div>
  );
}
