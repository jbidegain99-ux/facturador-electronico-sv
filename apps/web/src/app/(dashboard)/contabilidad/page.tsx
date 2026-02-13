'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { UpsellBanner } from '@/components/ui/upsell-banner';
import { usePlanFeatures } from '@/hooks/use-plan-features';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BookOpen,
  FileText,
  Landmark,
  PieChart,
  BarChart3,
  List,
  Loader2,
  Zap,
  Calculator,
  ChevronRight,
  FlaskConical,
  AlertTriangle,
  Check,
} from 'lucide-react';

interface DashboardData {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netIncome: number;
  accountCount: number;
  journalEntryCount: number;
}

interface SimulatedLine {
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

interface SimulationResult {
  description: string;
  lines: SimulatedLine[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  accountsFound: boolean;
  missingAccounts: string[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function ContabilidadPage() {
  const { features, loading: planLoading } = usePlanFeatures();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const [simAmount, setSimAmount] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      if (json) setData(json);
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSeedAccounts = async () => {
    setSeeding(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting/seed`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toastRef.current.success('Plan de cuentas sembrado', `Se crearon ${(json as { created?: number }).created ?? 0} cuentas`);
        fetchData();
      } else {
        toastRef.current.error('Error', (json as { message?: string }).message || 'Error al sembrar cuentas');
      }
    } catch {
      toastRef.current.error('Error', 'Error de conexión');
    } finally {
      setSeeding(false);
    }
  };

  const handleSimulate = async () => {
    const amount = parseFloat(simAmount);
    if (isNaN(amount) || amount <= 0) {
      toastRef.current.error('Ingrese un monto válido mayor a cero');
      return;
    }

    setSimulating(true);
    setSimResult(null);
    try {
      const token = localStorage.getItem('token');
      const totalGravada = Math.round((amount / 1.13) * 100) / 100;
      const totalIva = Math.round((amount - totalGravada) * 100) / 100;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting/simulate-invoice`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalGravada,
          totalIva,
          totalPagar: amount,
          tipoDte: '01',
          description: `Simulación: Factura por $${amount.toFixed(2)}`,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setSimResult(json as SimulationResult);
      } else {
        toastRef.current.error((json as { message?: string }).message || 'Error al simular');
      }
    } catch {
      toastRef.current.error('Error de conexión');
    } finally {
      setSimulating(false);
    }
  };

  const navItems = [
    { name: 'Plan de Cuentas', href: '/contabilidad/cuentas', icon: List, description: 'Gestionar catálogo de cuentas' },
    { name: 'Libro Diario', href: '/contabilidad/libro-diario', icon: FileText, description: 'Partidas contables' },
    { name: 'Libro Mayor', href: '/contabilidad/libro-mayor', icon: BookOpen, description: 'Movimientos por cuenta' },
    { name: 'Balance General', href: '/contabilidad/balance', icon: Landmark, description: 'Estado de situación financiera' },
    { name: 'Estado de Resultados', href: '/contabilidad/resultados', icon: PieChart, description: 'Ingresos y gastos' },
  ];

  if (!planLoading && !features.accounting) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Contabilidad</h1>
          <p className="text-muted-foreground">Modulo contable integrado - Partida doble</p>
        </div>
        <UpsellBanner
          title="Contabilidad — Plan Pro"
          description="Lleva el control completo de tu contabilidad con nuestro sistema integrado de partida doble."
          features={[
            'Plan de cuentas estandar El Salvador (NIIF PYMES)',
            'Libro diario y libro mayor',
            'Balance general y estado de resultados',
            'Partidas contables con validacion automatica',
            'Reportes financieros completos',
          ]}
        />
      </div>
    );
  }

  const hasAccounts = data !== null && data.accountCount > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contabilidad</h1>
        <p className="text-muted-foreground">Módulo contable integrado - Partida doble</p>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !hasAccounts ? (
        /* ====== EMPTY STATE: No accounts seeded ====== */
        <div className="rounded-lg border bg-card p-8 text-center max-w-lg mx-auto">
          <Calculator className="h-16 w-16 text-purple-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Inicializar Plan de Cuentas</h3>
          <p className="text-muted-foreground mb-6">
            Crea el plan de cuentas estándar de El Salvador (NIIF PYMES) para comenzar a registrar partidas contables.
          </p>
          <button
            onClick={handleSeedAccounts}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-6 py-3 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {seeding ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
            {seeding ? 'Creando cuentas...' : 'Crear Plan de Cuentas (85+ cuentas)'}
          </button>
        </div>
      ) : (
        /* ====== DASHBOARD: Accounts exist ====== */
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Total Activos
              </div>
              <p className="text-2xl font-bold">{formatCurrency(data.totalAssets)}</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Total Pasivos
              </div>
              <p className="text-2xl font-bold">{formatCurrency(data.totalLiabilities)}</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4 text-blue-500" />
                Patrimonio
              </div>
              <p className="text-2xl font-bold">{formatCurrency(data.totalEquity)}</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                Utilidad Neta
              </div>
              <p className={`text-2xl font-bold ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.netIncome)}
              </p>
            </div>
          </div>

          {/* Simulation Card */}
          <div className="rounded-lg border border-yellow-500/30 bg-card p-6">
            <button
              onClick={() => setSimOpen(!simOpen)}
              className="flex items-center gap-2 w-full text-left"
            >
              <FlaskConical className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold flex-1">Simulador Contable</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                MODO PRUEBA
              </span>
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${simOpen ? 'rotate-90' : ''}`} />
            </button>

            {simOpen && (
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    El simulador muestra las partidas contables que se generarían al emitir una factura.
                    No se crean registros ni se envía nada al Ministerio de Hacienda.
                  </p>
                </div>

                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">Monto total (con IVA)</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Ej: 113.00"
                      value={simAmount}
                      onChange={(e) => { setSimAmount(e.target.value); setSimResult(null); }}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
                    />
                  </div>
                  <button
                    onClick={handleSimulate}
                    disabled={simulating || !simAmount}
                    className="inline-flex items-center gap-2 rounded-md bg-yellow-600 px-4 h-9 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {simulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                    Simular
                  </button>
                </div>

                {simResult && (
                  <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {simResult.balanced ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">{simResult.description}</span>
                    </div>

                    {!simResult.accountsFound && (
                      <div className="text-xs text-red-600 dark:text-red-400 p-2 rounded bg-red-50 dark:bg-red-900/10">
                        Cuentas faltantes: {simResult.missingAccounts.join(', ')}.
                        Siembre el plan de cuentas para usar el simulador completamente.
                      </div>
                    )}

                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-1 font-medium">Cuenta</th>
                          <th className="text-left py-1 font-medium">Descripción</th>
                          <th className="text-right py-1 font-medium">Débito</th>
                          <th className="text-right py-1 font-medium">Crédito</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simResult.lines.map((line, i) => (
                          <tr key={i} className="border-b border-muted/50">
                            <td className="py-1.5">
                              <span className="font-mono text-xs">{line.accountCode}</span>
                              <span className="ml-2 text-muted-foreground">{line.accountName}</span>
                            </td>
                            <td className="py-1.5 text-muted-foreground">{line.description}</td>
                            <td className="py-1.5 text-right font-mono">
                              {line.debit > 0 ? formatCurrency(line.debit) : ''}
                            </td>
                            <td className="py-1.5 text-right font-mono">
                              {line.credit > 0 ? formatCurrency(line.credit) : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-semibold">
                          <td colSpan={2} className="py-1.5">TOTALES</td>
                          <td className="py-1.5 text-right font-mono">{formatCurrency(simResult.totalDebit)}</td>
                          <td className="py-1.5 text-right font-mono">{formatCurrency(simResult.totalCredit)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    {simResult.balanced && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Partida cuadrada — débitos iguales a créditos
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-2">Resumen</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuentas contables</span>
                  <span className="font-medium">{data.accountCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Partidas contabilizadas</span>
                  <span className="font-medium">{data.journalEntryCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ingresos del período</span>
                  <span className="font-medium text-green-600">{formatCurrency(data.monthlyIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gastos del período</span>
                  <span className="font-medium text-red-600">{formatCurrency(data.monthlyExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Navigation Cards - inline in dashboard */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-3">Accesos rápidos</h3>
              <div className="space-y-2">
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-md p-2 text-sm hover:bg-muted transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Navigation always visible (even before seeding) */}
      {!loading && !hasAccounts && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-3">Módulos contables</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md border p-3 text-sm hover:bg-muted transition-colors group"
              >
                <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
