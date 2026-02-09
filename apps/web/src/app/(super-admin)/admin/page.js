'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminDashboardPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
function AdminDashboardPage() {
    const [stats, setStats] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        fetchStats();
    }, []);
    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/dashboard`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                throw new Error('Error al cargar estadisticas');
            }
            const data = await res.json();
            setStats(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        }
        finally {
            setLoading(false);
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'PROCESADO':
                return <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500"/>;
            case 'PENDIENTE':
                return <lucide_react_1.Clock className="w-4 h-4 text-yellow-500"/>;
            case 'RECHAZADO':
                return <lucide_react_1.XCircle className="w-4 h-4 text-red-500"/>;
            default:
                return <lucide_react_1.AlertCircle className="w-4 h-4 text-blue-500"/>;
        }
    };
    const getPlanColor = (plan) => {
        switch (plan) {
            case 'TRIAL':
                return 'badge-info';
            case 'BASIC':
                return 'badge-warning';
            case 'PROFESSIONAL':
                return 'badge-success';
            case 'ENTERPRISE':
                return 'bg-purple-500/20 text-purple-400';
            default:
                return 'badge-info';
        }
    };
    if (loading) {
        return (<div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
      </div>);
    }
    if (error) {
        return (<div className="glass-card p-6 text-center">
        <lucide_react_1.AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
        <p className="text-red-400">{error}</p>
        <button onClick={fetchStats} className="btn-primary mt-4">
          Reintentar
        </button>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Vista general del sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Empresas</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalTenants || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <lucide_react_1.Building2 className="w-6 h-6 text-white"/>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-sm">
            <span className="text-green-500">{stats?.activeTenants || 0} activas</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-red-500">{stats?.suspendedTenants || 0} suspendidas</span>
          </div>
        </div>

        <div className="glass-card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Usuarios</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalUsers || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center">
              <lucide_react_1.Users className="w-6 h-6 text-white"/>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-sm text-muted-foreground">
            Usuarios registrados en el sistema
          </div>
        </div>

        <div className="glass-card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total DTEs</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalDtes || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <lucide_react_1.FileText className="w-6 h-6 text-white"/>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-sm">
            <lucide_react_1.ArrowUpRight className="w-4 h-4 text-green-500"/>
            <span className="text-green-500">{stats?.dtesThisMonth || 0}</span>
            <span className="text-muted-foreground">este mes</span>
          </div>
        </div>

        <div className="glass-card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En Prueba</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.trialTenants || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <lucide_react_1.TrendingUp className="w-6 h-6 text-white"/>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-sm text-muted-foreground">
            Empresas en plan de prueba
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DTEs by Status */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">DTEs por Estado</h3>
          <div className="space-y-4">
            {stats?.dtesByStatus.map((item) => (<div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <span className="text-sm text-muted-foreground">{item.status}</span>
                </div>
                <span className="text-white font-medium">{item.count}</span>
              </div>))}
            {(!stats?.dtesByStatus || stats.dtesByStatus.length === 0) && (<p className="text-muted-foreground text-sm">No hay datos disponibles</p>)}
          </div>
        </div>

        {/* Tenants by Plan */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Empresas por Plan</h3>
          <div className="space-y-4">
            {stats?.tenantsByPlan.map((item) => (<div key={item.plan} className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(item.plan)}`}>
                  {item.plan}
                </span>
                <span className="text-white font-medium">{item.count}</span>
              </div>))}
            {(!stats?.tenantsByPlan || stats.tenantsByPlan.length === 0) && (<p className="text-muted-foreground text-sm">No hay datos disponibles</p>)}
          </div>
        </div>
      </div>

      {/* Last 7 Days Chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">DTEs - Ultimos 7 Dias</h3>
        <div className="flex items-end justify-between h-40 gap-2">
          {stats?.last7Days.map((day, index) => {
            const maxCount = Math.max(...(stats?.last7Days.map(d => d.count) || [1]));
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            return (<div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs text-muted-foreground">{day.count}</div>
                <div className="w-full rounded-t gradient-primary transition-all duration-300" style={{ height: `${Math.max(height, 4)}%` }}/>
                <div className="text-xs text-muted-foreground">
                  {new Date(day.date).toLocaleDateString('es', { weekday: 'short' })}
                </div>
              </div>);
        })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <link_1.default href="/admin/tenants" className="glass-card p-6 card-hover group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                Ver Empresas
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Gestiona las empresas registradas
              </p>
            </div>
            <lucide_react_1.ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"/>
          </div>
        </link_1.default>

        <link_1.default href="/admin/admins" className="glass-card p-6 card-hover group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                Administradores
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Gestiona los super administradores
              </p>
            </div>
            <lucide_react_1.ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"/>
          </div>
        </link_1.default>

        <link_1.default href="/admin/settings" className="glass-card p-6 card-hover group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                Configuracion
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ajustes del sistema
              </p>
            </div>
            <lucide_react_1.ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"/>
          </div>
        </link_1.default>
      </div>
    </div>);
}
