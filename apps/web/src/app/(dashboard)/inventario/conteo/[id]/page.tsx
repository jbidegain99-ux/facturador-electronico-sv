'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, Upload, CheckCircle, XCircle, Search } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { API_URL, apiFetch, apiRawFetch } from '@/lib/api';
import { downloadReport } from '@/lib/download-report';
import type {
  PhysicalCountFull, PhysicalCountStatus,
  CsvUploadResult, FinalizeResult,
} from '@/types/inventory';

const STATUS_BADGE: Record<PhysicalCountStatus, { label: string; className: string }> = {
  DRAFT: { label: 'En progreso', className: 'bg-amber-100 text-amber-800' },
  FINALIZED: { label: 'Finalizado', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700' },
};

export default function ConteoDetailPage() {
  const params = useParams<{ id: string }>();
  const countId = params.id;
  const router = useRouter();
  const toast = useToast();

  const [count, setCount] = React.useState<PhysicalCountFull | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [searchDebounced, setSearchDebounced] = React.useState('');
  const [showFinalize, setShowFinalize] = React.useState(false);
  const [finalizing, setFinalizing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCount = React.useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({ limit: '500' });
      if (searchDebounced) queryParams.set('search', searchDebounced);
      const result = await apiFetch<PhysicalCountFull>(`/physical-counts/${countId}?${queryParams.toString()}`);
      setCount(result);
    } catch (e) {
      toast.error('Error cargando conteo');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [countId, searchDebounced, toast]);

  React.useEffect(() => { fetchCount(); }, [fetchCount]);

  const handleCountedChange = React.useCallback(
    async (detailId: string, value: string) => {
      const qty = value === '' ? null : parseFloat(value);
      try {
        await apiFetch(`/physical-counts/${countId}/details/${detailId}`, {
          method: 'PATCH',
          body: JSON.stringify({ countedQty: qty }),
        });
        await fetchCount();
      } catch {
        toast.error('Error guardando');
      }
    },
    [countId, fetchCount, toast],
  );

  const handleUnitCostChange = React.useCallback(
    async (detailId: string, value: string) => {
      const cost = parseFloat(value);
      if (!Number.isFinite(cost)) return;
      try {
        await apiFetch(`/physical-counts/${countId}/details/${detailId}`, {
          method: 'PATCH',
          body: JSON.stringify({ unitCost: cost }),
        });
        await fetchCount();
      } catch {
        toast.error('Error guardando costo');
      }
    },
    [countId, fetchCount, toast],
  );

  const handleDownloadTemplate = async () => {
    try {
      await downloadReport(
        `${API_URL}/physical-counts/${countId}/csv-template`,
        `conteo_${count?.fiscalYear ?? ''}_template.csv`,
      );
    } catch (e) {
      toast.error('Error descargando plantilla');
      console.error(e);
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiRawFetch(`/physical-counts/${countId}/upload-csv`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = (await res.json()) as CsvUploadResult;
      if (result.errors.length > 0) {
        toast.error(`CSV: ${result.matched} actualizados, ${result.errors.length} errores`);
      } else {
        toast.success(`CSV: ${result.matched} ítems actualizados`);
      }
      await fetchCount();
    } catch (e) {
      toast.error('Error subiendo CSV');
      console.error(e);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Cancelar este conteo? No se podrá reanudar.')) return;
    try {
      await apiFetch(`/physical-counts/${countId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast.success('Conteo cancelado');
      router.push('/inventario/conteo');
    } catch (e) {
      toast.error('Error cancelando');
      console.error(e);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      const result = await apiFetch<FinalizeResult>(`/physical-counts/${countId}/finalize`, {
        method: 'POST',
        body: JSON.stringify({ confirm: true }),
      });
      toast.success(`Conteo finalizado · ${result.adjustmentsGenerated} ajustes generados`);
      await fetchCount();
      setShowFinalize(false);
    } catch (e) {
      const err = e as { data?: { code?: string; message?: string } };
      toast.error(err.data?.message ?? 'Error finalizando conteo');
      console.error(e);
    } finally {
      setFinalizing(false);
    }
  };

  if (loading || !count) {
    return <p className="text-center text-gray-500 py-8">Cargando…</p>;
  }

  const isDraft = count.status === 'DRAFT';
  const badge = STATUS_BADGE[count.status];
  const faltantes = count.details.data.filter((d) => d.variance < 0);
  const sobrantes = count.details.data.filter((d) => d.variance > 0);
  const faltantesValue = faltantes.reduce((s, d) => s + d.totalValue, 0);
  const sobrantesValue = sobrantes.reduce((s, d) => s + d.totalValue, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/inventario/conteo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">Conteo físico {count.fiscalYear}</h1>
              <p className="text-sm text-gray-600">Fecha: {count.countDate}</p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><p className="text-gray-500">Total ítems</p><p className="font-semibold">{count.summary.totalLines}</p></div>
            <div><p className="text-gray-500">Contados</p><p className="font-semibold">{count.summary.countedLines}</p></div>
            <div><p className="text-gray-500">Pendientes</p><p className="font-semibold">{count.summary.pendingLines}</p></div>
            <div>
              <p className="text-gray-500">Valor variance neto</p>
              <p className={`font-semibold ${count.summary.varianceNet < 0 ? 'text-red-600' : 'text-green-700'}`}>
                ${count.summary.varianceNet.toFixed(2)}
              </p>
            </div>
          </div>

          {isDraft && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-1" /> Plantilla CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" /> Subir CSV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = '';
                }}
              />
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <XCircle className="h-4 w-4 mr-1" /> Cancelar conteo
              </Button>
              <Button size="sm" onClick={() => setShowFinalize(true)}>
                <CheckCircle className="h-4 w-4 mr-1" /> Finalizar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por código o descripción…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Código</th>
                  <th className="text-left p-2">Descripción</th>
                  <th className="text-right p-2">Sistema</th>
                  <th className="text-right p-2">Contado</th>
                  <th className="text-right p-2">Variance</th>
                  <th className="text-right p-2">Costo un.</th>
                  <th className="text-left p-2">Movement</th>
                </tr>
              </thead>
              <tbody>
                {count.details.data.map((d) => (
                  <tr key={d.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 font-mono">{d.code}</td>
                    <td className="p-2">{d.description ?? '—'}</td>
                    <td className="p-2 text-right">{d.systemQty.toFixed(4)}</td>
                    <td className="p-2 text-right">
                      {isDraft ? (
                        <Input
                          type="number"
                          step="0.0001"
                          min="0"
                          defaultValue={d.countedQty !== null ? d.countedQty.toFixed(4) : ''}
                          className="w-24 text-right"
                          onBlur={(e) => handleCountedChange(d.id, e.target.value)}
                        />
                      ) : d.countedQty !== null ? d.countedQty.toFixed(4) : '—'}
                    </td>
                    <td className={`p-2 text-right ${d.variance < 0 ? 'text-red-600' : d.variance > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                      {d.countedQty === null ? '—' : d.variance.toFixed(4)}
                    </td>
                    <td className="p-2 text-right">
                      {isDraft && d.variance > 0 ? (
                        <Input
                          type="number"
                          step="0.0001"
                          min="0"
                          defaultValue={d.unitCost.toFixed(4)}
                          className="w-24 text-right"
                          onBlur={(e) => handleUnitCostChange(d.id, e.target.value)}
                        />
                      ) : `$${d.unitCost.toFixed(4)}`}
                    </td>
                    <td className="p-2 text-xs text-gray-600">
                      {d.adjustmentMovementId ? (
                        <Link href={`/inventario/${d.catalogItemId}`} className="text-blue-600 hover:underline">
                          Ver kardex →
                        </Link>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            Mostrando {count.details.data.length} de {count.details.total}.
          </p>
        </CardContent>
      </Card>

      {showFinalize && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold">Finalizar conteo {count.fiscalYear}</h2>
              <div className="text-sm space-y-2">
                <p>Se generarán <strong>{faltantes.length + sobrantes.length}</strong> ajustes:</p>
                <ul className="list-disc ml-5 text-gray-700">
                  <li>Faltantes: {faltantes.length} ítems · ${faltantesValue.toFixed(2)}</li>
                  <li>Sobrantes: {sobrantes.length} ítems · ${sobrantesValue.toFixed(2)}</li>
                </ul>
                <p>Valor neto: <strong>${(faltantesValue + sobrantesValue).toFixed(2)}</strong></p>
                {count.summary.pendingLines > 0 && (
                  <p className="text-amber-700">
                    ⚠️ {count.summary.pendingLines} ítems sin contar — no se ajustarán.
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowFinalize(false)} disabled={finalizing}>
                  Volver
                </Button>
                <Button onClick={handleFinalize} disabled={finalizing}>
                  {finalizing ? 'Finalizando…' : 'Confirmar y finalizar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
