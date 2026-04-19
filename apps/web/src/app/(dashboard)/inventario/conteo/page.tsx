'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ClipboardCheck, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { apiFetch } from '@/lib/api';
import type { PhysicalCount, PhysicalCountListResponse, PhysicalCountStatus } from '@/types/inventory';

const STATUS_BADGE: Record<PhysicalCountStatus, { label: string; className: string }> = {
  DRAFT: { label: 'En progreso', className: 'bg-amber-100 text-amber-800' },
  FINALIZED: { label: 'Finalizado', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700' },
};

export default function ConteoListPage() {
  const router = useRouter();
  const toast = useToast();
  const [counts, setCounts] = React.useState<PhysicalCount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);

  const currentYear = new Date().getFullYear();
  const hasDraftThisYear = counts.some((c) => c.fiscalYear === currentYear && c.status === 'DRAFT');

  const fetchCounts = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch<PhysicalCountListResponse>('/physical-counts?limit=20');
      setCounts(result.data);
    } catch (e) {
      toast.error('Error cargando conteos');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const result = await apiFetch<{ id: string }>('/physical-counts', {
        method: 'POST',
        body: JSON.stringify({ countDate: today, fiscalYear: currentYear }),
      });
      toast.success('Conteo iniciado');
      router.push(`/inventario/conteo/${result.id}`);
    } catch (e) {
      const err = e as { data?: { code?: string; message?: string } };
      if (err.data?.code === 'DUPLICATE_FISCAL_YEAR') {
        toast.error('Ya existe un conteo para este año');
      } else {
        toast.error('Error creando conteo');
      }
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/inventario">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a inventario
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6" /> Conteo físico
        </h1>
        <Button onClick={handleCreate} disabled={creating || hasDraftThisYear}>
          <Plus className="h-4 w-4 mr-2" />
          {hasDraftThisYear
            ? `Conteo ${currentYear} ya iniciado`
            : `Iniciar conteo ${currentYear}`}
        </Button>
      </div>

      {loading && <p className="text-center text-gray-500 py-8">Cargando…</p>}
      {!loading && counts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No hay conteos físicos. Iniciá el primero con el botón arriba.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {counts.map((c) => {
          const badge = STATUS_BADGE[c.status];
          return (
            <Link key={c.id} href={`/inventario/conteo/${c.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Conteo físico {c.fiscalYear}</h2>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Fecha: {c.countDate} · Iniciado por {c.createdBy}
                  </p>
                  <p className="text-sm text-gray-700">
                    {c.summary.totalLines} ítems · {c.summary.countedLines} contados · {c.summary.pendingLines} pendientes
                  </p>
                  {c.status === 'FINALIZED' && (
                    <p className="text-sm">
                      <strong>{c.summary.adjustedLines}</strong> ajustes · valor neto{' '}
                      <strong className={c.summary.varianceNet < 0 ? 'text-red-600' : 'text-green-700'}>
                        ${c.summary.varianceNet.toFixed(2)}
                      </strong>
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
