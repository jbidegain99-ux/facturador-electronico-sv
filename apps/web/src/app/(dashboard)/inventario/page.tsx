'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Package, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { PageSizeSelector } from '@/components/ui/page-size-selector';
import { apiFetch, apiRawFetch } from '@/lib/api';
import { StockStatusBadge } from '@/components/inventory/stock-status-badge';
import type { InventoryItem, InventoryListResponse, InventoryAlerts, StockStatus } from '@/types/inventory';

export default function InventarioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StockStatus | 'ALL'>(
    searchParams.get('filter') === 'below-reorder' ? 'BELOW_REORDER' : 'ALL',
  );
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [sortBy, setSortBy] = React.useState('code');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  const [data, setData] = React.useState<InventoryListResponse | null>(null);
  const [alerts, setAlerts] = React.useState<InventoryAlerts | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);
      const result = await apiFetch<InventoryListResponse>(`/inventory?${params.toString()}`);
      setData(result);
    } catch (e) {
      toast.error('Error cargando inventario');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, toast]);

  const fetchAlerts = React.useCallback(async () => {
    try {
      const result = await apiFetch<InventoryAlerts>('/inventory/alerts');
      setAlerts(result);
    } catch {
      /* non-fatal */
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);
  React.useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ sortBy, sortOrder });
      if (search) params.set('search', search);
      const res = await apiRawFetch(`/inventory/export?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario_snapshot_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Error exportando XLSX');
      console.error(e);
    }
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  const visibleRows = React.useMemo<InventoryItem[]>(() => {
    if (!data) return [];
    if (statusFilter === 'ALL') return data.data;
    return data.data.filter((it) => it.status === statusFilter);
  }, [data, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6" /> Inventario
        </h1>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" /> Exportar XLSX
        </Button>
      </div>

      {alerts && (alerts.belowReorderCount > 0 || alerts.outOfStockCount > 0) && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-sm">
              <strong>{alerts.belowReorderCount}</strong> ítems bajo mínimo ·{' '}
              <strong>{alerts.outOfStockCount}</strong> sin stock.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por código o descripción…"
                className="pl-8"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StockStatus | 'ALL'); }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value="OK">OK</SelectItem>
                <SelectItem value="BELOW_REORDER">Bajo mínimo</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Sin stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 cursor-pointer" onClick={() => toggleSort('code')}>Código</th>
                  <th className="text-left p-2 cursor-pointer" onClick={() => toggleSort('description')}>Descripción</th>
                  <th className="text-left p-2">Categoría</th>
                  <th className="text-right p-2 cursor-pointer" onClick={() => toggleSort('currentQty')}>Stock</th>
                  <th className="text-right p-2">Costo prom.</th>
                  <th className="text-right p-2 cursor-pointer" onClick={() => toggleSort('totalValue')}>Valor</th>
                  <th className="text-right p-2">Reorder</th>
                  <th className="text-left p-2 cursor-pointer" onClick={() => toggleSort('lastMovementAt')}>Últ. mov.</th>
                  <th className="text-left p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500">Cargando…</td></tr>
                )}
                {!loading && data && visibleRows.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500">
                    {statusFilter === 'ALL'
                      ? <>No hay ítems con movimientos de inventario.{' '}
                          <Link href="/catalogo" className="text-blue-600 hover:underline">Ir a Catálogo →</Link>
                        </>
                      : <>No hay ítems con estado <strong>{statusFilter === 'BELOW_REORDER' ? 'Bajo mínimo' : 'Sin stock'}</strong> en esta página.</>
                    }
                  </td></tr>
                )}
                {!loading && visibleRows.map((it: InventoryItem) => (
                  <tr key={it.catalogItemId} className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/inventario/${it.catalogItemId}`)}>
                    <td className="p-2 font-mono">{it.code}</td>
                    <td className="p-2">{it.description ?? '—'}</td>
                    <td className="p-2 text-gray-500">{it.categoryName ?? '—'}</td>
                    <td className="p-2 text-right">{it.currentQty.toFixed(4)}</td>
                    <td className="p-2 text-right">${it.currentAvgCost.toFixed(4)}</td>
                    <td className="p-2 text-right">${it.totalValue.toFixed(2)}</td>
                    <td className="p-2 text-right">{it.reorderLevel?.toFixed(4) ?? '—'}</td>
                    <td className="p-2 text-gray-600">
                      {it.lastMovementAt ? new Date(it.lastMovementAt).toLocaleDateString('es-SV') : '—'}
                    </td>
                    <td className="p-2"><StockStatusBadge status={it.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.total > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {data.total} items · Página {data.page} de {data.totalPages}
                {statusFilter !== 'ALL' && (
                  <span className="ml-2 text-amber-600">
                    (filtro {statusFilter === 'BELOW_REORDER' ? 'Bajo mínimo' : 'Sin stock'} aplicado a esta página)
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <PageSizeSelector value={limit} onChange={(v) => { setLimit(v); setPage(1); }} />
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
