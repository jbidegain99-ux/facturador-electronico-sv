'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { usePlanFeatures } from '@/hooks/use-plan-features';
import { ArrowLeft, Loader2, PieChart, RefreshCw } from 'lucide-react';

interface IncomeStatementAccount {
  code: string;
  name: string;
  balance: number;
}

interface IncomeStatementSection {
  title: string;
  accounts: IncomeStatementAccount[];
  total: number;
}

interface IncomeStatementData {
  income: IncomeStatementSection[];
  expenses: IncomeStatementSection[];
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function ResultadosPage() {
  const { features, loading: planLoading } = usePlanFeatures();
  const router = useRouter();

  useEffect(() => {
    if (!planLoading && !features.accounting) {
      router.replace('/contabilidad');
    }
  }, [planLoading, features.accounting, router]);

  const [data, setData] = useState<IncomeStatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const url = `${process.env.NEXT_PUBLIC_API_URL}/accounting/reports/income-statement${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json) setData(json);
      } else {
        const json = await res.json().catch(() => ({}));
        toastRef.current.error('Error', (json as { message?: string }).message || 'Error al obtener estado de resultados');
      }
    } catch {
      toastRef.current.error('Error', 'Error de conexion');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const periodLabel = (() => {
    if (dateFrom && dateTo) return `Del ${dateFrom} al ${dateTo}`;
    if (dateFrom) return `Desde ${dateFrom}`;
    if (dateTo) return `Hasta ${dateTo}`;
    return 'Periodo actual';
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/contabilidad" className="p-2 rounded-md hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Estado de Resultados</h1>
            <p className="text-muted-foreground">Ingresos y gastos del periodo</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Date Filter */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <div className="text-center py-12 text-muted-foreground">
          <PieChart className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p className="text-lg font-medium">No hay datos disponibles</p>
          <p className="text-sm mt-1">Contabiliza partidas de ingresos y gastos para ver el estado de resultados</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-6 space-y-6 max-w-3xl">
          {/* Report Header */}
          <div className="text-center border-b pb-4">
            <h2 className="text-lg font-bold">ESTADO DE RESULTADOS</h2>
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
            <p className="text-xs text-muted-foreground">(Cifras expresadas en dolares de los Estados Unidos de America)</p>
          </div>

          {/* Income */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-green-700 dark:text-green-400 border-b pb-1">INGRESOS</h3>
            {data.income.length > 0 ? (
              data.income.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  {section.accounts.map(account => (
                    <div key={account.code} className="flex justify-between text-sm py-0.5 pl-4">
                      <span>
                        <span className="font-mono text-muted-foreground mr-2">{account.code}</span>
                        {account.name}
                      </span>
                      <span className="font-mono">{formatCurrency(account.balance)}</span>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground pl-4">No hay ingresos en el periodo</p>
            )}
            <div className="flex justify-between font-semibold text-base border-t border-green-600 pt-2 text-green-700 dark:text-green-400">
              <span>TOTAL INGRESOS</span>
              <span className="font-mono">{formatCurrency(data.totalIncome)}</span>
            </div>
          </div>

          {/* Expenses */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-red-700 dark:text-red-400 border-b pb-1">GASTOS</h3>
            {data.expenses.length > 0 ? (
              data.expenses.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  {section.accounts.map(account => (
                    <div key={account.code} className="flex justify-between text-sm py-0.5 pl-4">
                      <span>
                        <span className="font-mono text-muted-foreground mr-2">{account.code}</span>
                        {account.name}
                      </span>
                      <span className="font-mono">{formatCurrency(account.balance)}</span>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground pl-4">No hay gastos en el periodo</p>
            )}
            <div className="flex justify-between font-semibold text-base border-t border-red-600 pt-2 text-red-700 dark:text-red-400">
              <span>TOTAL GASTOS</span>
              <span className="font-mono">{formatCurrency(data.totalExpenses)}</span>
            </div>
          </div>

          <hr className="border-t-2" />

          {/* Net Income */}
          <div className="bg-muted/50 rounded-md p-4">
            <div className="flex justify-between font-bold text-lg">
              <span>{data.netIncome >= 0 ? 'UTILIDAD NETA' : 'PERDIDA NETA'}</span>
              <span className={`font-mono ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.netIncome)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>Margen: {data.totalIncome > 0 ? ((data.netIncome / data.totalIncome) * 100).toFixed(1) : '0.0'}%</span>
              <span>Ingresos - Gastos = {formatCurrency(data.totalIncome)} - {formatCurrency(data.totalExpenses)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
