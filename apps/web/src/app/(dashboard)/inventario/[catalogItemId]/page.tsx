'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Package } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { API_URL, apiFetch } from '@/lib/api';
import type { ApiError } from '@/lib/api';
import { downloadReport } from '@/lib/download-report';
import { StockStatusBadge } from '@/components/inventory/stock-status-badge';
import { KardexTable } from '@/components/inventory/kardex-table';
import type { InventoryItemDetail, KardexRow } from '@/types/inventory';

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() { return new Date().toISOString().slice(0, 10); }

function isHttp404(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  // apiFetch attaches `.status` as ApiError — check it directly for reliability
  return (err as ApiError).status === 404;
}

export default function InventarioDetailPage() {
  const params = useParams<{ catalogItemId: string }>();
  const catalogItemId = params.catalogItemId;
  const toast = useToast();

  const [item, setItem] = React.useState<InventoryItemDetail | null>(null);
  const [kardex, setKardex] = React.useState<KardexRow[] | null>(null);
  const [startDate, setStartDate] = React.useState(firstDayOfMonth());
  const [endDate, setEndDate] = React.useState(today());
  const [movementType, setMovementType] = React.useState<string>('ALL');
  const [loading, setLoading] = React.useState(true);
  const [notFoundMsg, setNotFoundMsg] = React.useState<string | null>(null);

  const fetchItem = React.useCallback(async () => {
    try {
      const result = await apiFetch<InventoryItemDetail>(`/inventory/${catalogItemId}`);
      setItem(result);
    } catch (e) {
      if (isHttp404(e)) {
        setNotFoundMsg('Este ítem aún no tiene movimientos de inventario');
      } else {
        toast.error('Error cargando ítem');
        console.error(e);
      }
    }
  }, [catalogItemId, toast]);

  const fetchKardex = React.useCallback(async () => {
    setLoading(true);
    try {
      const qp = new URLSearchParams({ startDate, endDate });
      if (movementType !== 'ALL') qp.set('movementType', movementType);
      const result = await apiFetch<KardexRow[]>(`/inventory/${catalogItemId}/kardex?${qp.toString()}`);
      setKardex(result);
    } catch (e) {
      toast.error('Error cargando kardex');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [catalogItemId, startDate, endDate, movementType, toast]);

  React.useEffect(() => { fetchItem(); }, [fetchItem]);
  React.useEffect(() => { if (item) fetchKardex(); }, [fetchKardex, item]);

  const handleExcelDownload = async () => {
    try {
      const qp = new URLSearchParams({ startDate, endDate });
      const url = `${API_URL}/reports/kardex/item/${catalogItemId}?${qp.toString()}`;
      const filename = `kardex-${item?.code ?? catalogItemId}-${startDate}_${endDate}.xlsx`;
      await downloadReport(url, filename);
    } catch (e) {
      toast.error('Error descargando kardex Excel');
      console.error(e);
    }
  };

  const movementTypes = React.useMemo(() => {
    if (!kardex) return [];
    return Array.from(new Set(kardex.map((k) => k.movementType))).sort();
  }, [kardex]);

  if (notFoundMsg) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <Package className="h-12 w-12 mx-auto text-gray-400" />
          <p className="text-gray-600">{notFoundMsg}</p>
          <Link href="/inventario">
            <Button variant="outline">← Volver a inventario</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/inventario">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
        </Link>
      </div>

      {item && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono text-sm text-gray-500">{item.code}</p>
                <h1 className="text-xl font-bold">{item.description ?? 'Sin descripción'}</h1>
                <p className="text-sm text-gray-600">{item.categoryName ?? 'Sin categoría'}</p>
              </div>
              <StockStatusBadge status={item.status} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-gray-500">Stock actual</p><p className="font-semibold">{item.currentQty.toFixed(4)}</p></div>
              <div><p className="text-gray-500">Costo promedio</p><p className="font-semibold">${item.currentAvgCost.toFixed(4)}</p></div>
              <div><p className="text-gray-500">Valor total</p><p className="font-semibold">${item.totalValue.toFixed(2)}</p></div>
              <div><p className="text-gray-500">Reorder level</p><p className="font-semibold">{item.reorderLevel?.toFixed(4) ?? '—'}</p></div>
              <div className="col-span-2">
                <p className="text-gray-500">Último movimiento</p>
                <p className="font-semibold">{item.lastMovementAt ? new Date(item.lastMovementAt).toLocaleString('es-SV') : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Kardex</h2>
            <Button variant="outline" size="sm" onClick={handleExcelDownload}>
              <Download className="h-4 w-4 mr-2" /> Descargar Excel
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Desde</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hasta</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo</label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los tipos</SelectItem>
                  {movementTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading && <p className="text-center text-gray-500 py-4">Cargando kardex…</p>}
          {!loading && kardex && <KardexTable rows={kardex} />}
        </CardContent>
      </Card>
    </div>
  );
}
