'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  FileText,
  Users,
  Database,
  HardDrive,
  Infinity,
  AlertCircle,
  CheckCircle,
  Star,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  maxDtesPerMonth: number;
  maxUsers: number;
  maxClientes: number;
  maxStorageMb: number;
  isDefault: boolean;
}

interface Usage {
  dtesThisMonth: number;
  maxDtesPerMonth: number;
  dtesRemaining: number;
  users: number;
  maxUsers: number;
  usersRemaining: number;
  clientes: number;
  maxClientes: number;
  clientesRemaining: number;
}

interface Limits {
  canCreateDte: boolean;
  canAddUser: boolean;
  canAddCliente: boolean;
}

interface TenantUsage {
  tenantId: string;
  planId: string | null;
  planCodigo: string | null;
  planNombre: string | null;
  usage: Usage;
  limits: Limits;
}

interface TenantPlanManagerProps {
  tenantId: string;
  tenantName: string;
}

export function TenantPlanManager({ tenantId, tenantName }: TenantPlanManagerProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<TenantUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      const [plansRes, usageRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/plans/active`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/plans/tenant/${tenantId}/usage`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData);
      }

      if (usageRes.ok) {
        const usageData: TenantUsage = await usageRes.json();
        setUsage(usageData);
        setSelectedPlanId(usageData.planId || '');
      }
    } catch (err) {
      setError('Error al cargar datos del plan');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedPlanId) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/plans/tenant/${tenantId}/assign`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ planId: selectedPlanId }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al asignar plan');
      }

      await fetchData();
      alert('Plan asignado correctamente');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al asignar plan');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePlan = async () => {
    if (!confirm('¿Estás seguro de quitar el plan de este tenant?')) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/plans/tenant/${tenantId}/plan`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error('Error al quitar plan');
      }

      await fetchData();
      setSelectedPlanId('');
      alert('Plan removido correctamente');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al quitar plan');
    } finally {
      setSaving(false);
    }
  };

  const formatLimit = (value: number) => {
    return value === -1 ? <Infinity className="w-4 h-4 inline" /> : value.toLocaleString();
  };

  const getUsagePercentage = (used: number, max: number) => {
    if (max === -1) return 0; // Unlimited
    return Math.min(100, (used / max) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Plan y Límites</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Plan y Límites</h3>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      ) : (
        <>
          {/* Current Plan */}
          <div className="mb-6 p-4 rounded-lg bg-white/5">
            <div className="text-sm text-muted-foreground mb-1">Plan actual</div>
            {usage?.planNombre ? (
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">{usage.planNombre}</span>
                <span className="text-sm font-mono text-primary">({usage.planCodigo})</span>
              </div>
            ) : (
              <div className="text-yellow-400">Sin plan asignado</div>
            )}
          </div>

          {/* Plan Selector */}
          <div className="mb-6">
            <label className="block text-sm text-muted-foreground mb-2">Asignar plan</label>
            <div className="flex gap-2">
              <Select
                value={selectedPlanId}
                onValueChange={setSelectedPlanId}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar plan..." />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex items-center gap-2">
                        {plan.nombre}
                        {plan.isDefault && <Star className="w-3 h-3 text-yellow-400" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssignPlan}
                disabled={saving || !selectedPlanId || selectedPlanId === usage?.planId}
              >
                {saving ? 'Guardando...' : 'Asignar'}
              </Button>
              {usage?.planId && (
                <Button
                  variant="outline"
                  onClick={handleRemovePlan}
                  disabled={saving}
                  className="text-red-400"
                >
                  Quitar
                </Button>
              )}
            </div>
          </div>

          {/* Usage Stats */}
          {usage && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-white">Uso actual</h4>

              {/* DTEs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">DTEs este mes</span>
                  </div>
                  <span className="text-white">
                    {usage.usage.dtesThisMonth} / {formatLimit(usage.usage.maxDtesPerMonth)}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getUsageColor(getUsagePercentage(usage.usage.dtesThisMonth, usage.usage.maxDtesPerMonth))}`}
                    style={{
                      width: `${getUsagePercentage(usage.usage.dtesThisMonth, usage.usage.maxDtesPerMonth)}%`,
                    }}
                  />
                </div>
                {!usage.limits.canCreateDte && (
                  <div className="flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    Límite alcanzado
                  </div>
                )}
              </div>

              {/* Users */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Usuarios</span>
                  </div>
                  <span className="text-white">
                    {usage.usage.users} / {formatLimit(usage.usage.maxUsers)}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getUsageColor(getUsagePercentage(usage.usage.users, usage.usage.maxUsers))}`}
                    style={{
                      width: `${getUsagePercentage(usage.usage.users, usage.usage.maxUsers)}%`,
                    }}
                  />
                </div>
                {!usage.limits.canAddUser && (
                  <div className="flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    Límite alcanzado
                  </div>
                )}
              </div>

              {/* Clientes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Clientes</span>
                  </div>
                  <span className="text-white">
                    {usage.usage.clientes} / {formatLimit(usage.usage.maxClientes)}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getUsageColor(getUsagePercentage(usage.usage.clientes, usage.usage.maxClientes))}`}
                    style={{
                      width: `${getUsagePercentage(usage.usage.clientes, usage.usage.maxClientes)}%`,
                    }}
                  />
                </div>
                {!usage.limits.canAddCliente && (
                  <div className="flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    Límite alcanzado
                  </div>
                )}
              </div>

              {/* Status Summary */}
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1 text-sm">
                  {usage.limits.canCreateDte ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-muted-foreground">DTEs</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {usage.limits.canAddUser ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-muted-foreground">Usuarios</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {usage.limits.canAddCliente ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-muted-foreground">Clientes</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
