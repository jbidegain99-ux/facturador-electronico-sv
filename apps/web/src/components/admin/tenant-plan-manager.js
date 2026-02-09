'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantPlanManager = TenantPlanManager;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const select_1 = require("@/components/ui/select");
function TenantPlanManager({ tenantId, tenantName }) {
    const [plans, setPlans] = (0, react_1.useState)([]);
    const [usage, setUsage] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [selectedPlanId, setSelectedPlanId] = (0, react_1.useState)('');
    const [error, setError] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        fetchData();
    }, [tenantId]);
    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const [plansRes, usageRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/plans/active`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/plans/tenant/${tenantId}/usage`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            if (plansRes.ok) {
                const plansData = await plansRes.json();
                setPlans(plansData);
            }
            if (usageRes.ok) {
                const usageData = await usageRes.json();
                setUsage(usageData);
                setSelectedPlanId(usageData.planId || '');
            }
        }
        catch (err) {
            setError('Error al cargar datos del plan');
        }
        finally {
            setLoading(false);
        }
    };
    const handleAssignPlan = async () => {
        if (!selectedPlanId)
            return;
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/plans/tenant/${tenantId}/assign`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ planId: selectedPlanId }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Error al asignar plan');
            }
            await fetchData();
            alert('Plan asignado correctamente');
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Error al asignar plan');
        }
        finally {
            setSaving(false);
        }
    };
    const handleRemovePlan = async () => {
        if (!confirm('¿Estás seguro de quitar el plan de este tenant?'))
            return;
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/plans/tenant/${tenantId}/plan`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error('Error al quitar plan');
            }
            await fetchData();
            setSelectedPlanId('');
            alert('Plan removido correctamente');
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Error al quitar plan');
        }
        finally {
            setSaving(false);
        }
    };
    const formatLimit = (value) => {
        return value === -1 ? <lucide_react_1.Infinity className="w-4 h-4 inline"/> : value.toLocaleString();
    };
    const getUsagePercentage = (used, max) => {
        if (max === -1)
            return 0; // Unlimited
        return Math.min(100, (used / max) * 100);
    };
    const getUsageColor = (percentage) => {
        if (percentage >= 90)
            return 'bg-red-500';
        if (percentage >= 70)
            return 'bg-yellow-500';
        return 'bg-green-500';
    };
    if (loading) {
        return (<div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <lucide_react_1.CreditCard className="w-5 h-5 text-primary"/>
          <h3 className="text-lg font-semibold text-white">Plan y Límites</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
        </div>
      </div>);
    }
    return (<div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <lucide_react_1.CreditCard className="w-5 h-5 text-primary"/>
          <h3 className="text-lg font-semibold text-white">Plan y Límites</h3>
        </div>
        <button_1.Button variant="outline" size="sm" onClick={fetchData}>
          <lucide_react_1.RefreshCw className="w-4 h-4"/>
        </button_1.Button>
      </div>

      {error ? (<div className="flex items-center gap-2 text-red-400 text-sm">
          <lucide_react_1.AlertCircle className="w-4 h-4"/>
          {error}
        </div>) : (<>
          {/* Current Plan */}
          <div className="mb-6 p-4 rounded-lg bg-white/5">
            <div className="text-sm text-muted-foreground mb-1">Plan actual</div>
            {usage?.planNombre ? (<div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">{usage.planNombre}</span>
                <span className="text-sm font-mono text-primary">({usage.planCodigo})</span>
              </div>) : (<div className="text-yellow-400">Sin plan asignado</div>)}
          </div>

          {/* Plan Selector */}
          <div className="mb-6">
            <label className="block text-sm text-muted-foreground mb-2">Asignar plan</label>
            <div className="flex gap-2">
              <select_1.Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <select_1.SelectTrigger className="flex-1">
                  <select_1.SelectValue placeholder="Seleccionar plan..."/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  {plans.map((plan) => (<select_1.SelectItem key={plan.id} value={plan.id}>
                      <div className="flex items-center gap-2">
                        {plan.nombre}
                        {plan.isDefault && <lucide_react_1.Star className="w-3 h-3 text-yellow-400"/>}
                      </div>
                    </select_1.SelectItem>))}
                </select_1.SelectContent>
              </select_1.Select>
              <button_1.Button onClick={handleAssignPlan} disabled={saving || !selectedPlanId || selectedPlanId === usage?.planId}>
                {saving ? 'Guardando...' : 'Asignar'}
              </button_1.Button>
              {usage?.planId && (<button_1.Button variant="outline" onClick={handleRemovePlan} disabled={saving} className="text-red-400">
                  Quitar
                </button_1.Button>)}
            </div>
          </div>

          {/* Usage Stats */}
          {usage && (<div className="space-y-4">
              <h4 className="text-sm font-medium text-white">Uso actual</h4>

              {/* DTEs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <lucide_react_1.FileText className="w-4 h-4 text-muted-foreground"/>
                    <span className="text-muted-foreground">DTEs este mes</span>
                  </div>
                  <span className="text-white">
                    {usage.usage.dtesThisMonth} / {formatLimit(usage.usage.maxDtesPerMonth)}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${getUsageColor(getUsagePercentage(usage.usage.dtesThisMonth, usage.usage.maxDtesPerMonth))}`} style={{
                    width: `${getUsagePercentage(usage.usage.dtesThisMonth, usage.usage.maxDtesPerMonth)}%`,
                }}/>
                </div>
                {!usage.limits.canCreateDte && (<div className="flex items-center gap-1 text-xs text-red-400">
                    <lucide_react_1.AlertCircle className="w-3 h-3"/>
                    Límite alcanzado
                  </div>)}
              </div>

              {/* Users */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <lucide_react_1.Users className="w-4 h-4 text-muted-foreground"/>
                    <span className="text-muted-foreground">Usuarios</span>
                  </div>
                  <span className="text-white">
                    {usage.usage.users} / {formatLimit(usage.usage.maxUsers)}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${getUsageColor(getUsagePercentage(usage.usage.users, usage.usage.maxUsers))}`} style={{
                    width: `${getUsagePercentage(usage.usage.users, usage.usage.maxUsers)}%`,
                }}/>
                </div>
                {!usage.limits.canAddUser && (<div className="flex items-center gap-1 text-xs text-red-400">
                    <lucide_react_1.AlertCircle className="w-3 h-3"/>
                    Límite alcanzado
                  </div>)}
              </div>

              {/* Clientes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <lucide_react_1.Database className="w-4 h-4 text-muted-foreground"/>
                    <span className="text-muted-foreground">Clientes</span>
                  </div>
                  <span className="text-white">
                    {usage.usage.clientes} / {formatLimit(usage.usage.maxClientes)}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${getUsageColor(getUsagePercentage(usage.usage.clientes, usage.usage.maxClientes))}`} style={{
                    width: `${getUsagePercentage(usage.usage.clientes, usage.usage.maxClientes)}%`,
                }}/>
                </div>
                {!usage.limits.canAddCliente && (<div className="flex items-center gap-1 text-xs text-red-400">
                    <lucide_react_1.AlertCircle className="w-3 h-3"/>
                    Límite alcanzado
                  </div>)}
              </div>

              {/* Status Summary */}
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1 text-sm">
                  {usage.limits.canCreateDte ? (<lucide_react_1.CheckCircle className="w-4 h-4 text-green-400"/>) : (<lucide_react_1.AlertCircle className="w-4 h-4 text-red-400"/>)}
                  <span className="text-muted-foreground">DTEs</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {usage.limits.canAddUser ? (<lucide_react_1.CheckCircle className="w-4 h-4 text-green-400"/>) : (<lucide_react_1.AlertCircle className="w-4 h-4 text-red-400"/>)}
                  <span className="text-muted-foreground">Usuarios</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {usage.limits.canAddCliente ? (<lucide_react_1.CheckCircle className="w-4 h-4 text-green-400"/>) : (<lucide_react_1.AlertCircle className="w-4 h-4 text-red-400"/>)}
                  <span className="text-muted-foreground">Clientes</span>
                </div>
              </div>
            </div>)}
        </>)}
    </div>);
}
