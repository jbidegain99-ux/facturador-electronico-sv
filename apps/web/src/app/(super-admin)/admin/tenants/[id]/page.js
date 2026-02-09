'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TenantDetailPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const tenant_email_config_1 = require("@/components/admin/tenant-email-config");
const tenant_plan_manager_1 = require("@/components/admin/tenant-plan-manager");
function TenantDetailPage() {
    const params = (0, navigation_1.useParams)();
    const router = (0, navigation_1.useRouter)();
    const [tenant, setTenant] = (0, react_1.useState)(null);
    const [tickets, setTickets] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    // Form state
    const [plan, setPlan] = (0, react_1.useState)('');
    const [planStatus, setPlanStatus] = (0, react_1.useState)('');
    const [maxDtesPerMonth, setMaxDtesPerMonth] = (0, react_1.useState)(50);
    const [adminNotes, setAdminNotes] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        fetchTenant();
        fetchTickets();
    }, [params.id]);
    const fetchTenant = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants/${params.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                throw new Error('Error al cargar empresa');
            }
            const data = await res.json();
            setTenant(data);
            setPlan(data.plan);
            setPlanStatus(data.planStatus);
            setMaxDtesPerMonth(data.maxDtesPerMonth);
            setAdminNotes(data.adminNotes || '');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        }
        finally {
            setLoading(false);
        }
    };
    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/support-tickets/tenant/${params.id}?limit=5`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            }
        }
        catch (err) {
            console.error('Error fetching tickets:', err);
        }
    };
    const getTicketStatusBadge = (status) => {
        const badges = {
            PENDING: 'bg-yellow-500/20 text-yellow-400',
            ASSIGNED: 'bg-blue-500/20 text-blue-400',
            IN_PROGRESS: 'bg-purple-500/20 text-purple-400',
            WAITING_CUSTOMER: 'bg-orange-500/20 text-orange-400',
            RESOLVED: 'bg-green-500/20 text-green-400',
            CLOSED: 'bg-gray-500/20 text-gray-400',
        };
        return badges[status] || 'bg-gray-500/20 text-gray-400';
    };
    const ticketStatusLabels = {
        PENDING: 'Pendiente',
        ASSIGNED: 'Asignado',
        IN_PROGRESS: 'En Progreso',
        WAITING_CUSTOMER: 'Esperando',
        RESOLVED: 'Resuelto',
        CLOSED: 'Cerrado',
    };
    const handleSave = async () => {
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants/${params.id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan,
                    planStatus,
                    maxDtesPerMonth,
                    adminNotes,
                }),
            });
            if (!res.ok)
                throw new Error('Error al guardar');
            alert('Cambios guardados correctamente');
            fetchTenant();
        }
        catch (err) {
            alert('Error al guardar los cambios');
        }
        finally {
            setSaving(false);
        }
    };
    const getPlanBadge = (plan) => {
        const badges = {
            TRIAL: 'badge-info',
            BASIC: 'badge-warning',
            PROFESSIONAL: 'badge-success',
            ENTERPRISE: 'bg-purple-500/20 text-purple-400',
        };
        return badges[plan] || 'badge-info';
    };
    const getStatusBadge = (status) => {
        const badges = {
            ACTIVE: 'badge-success',
            SUSPENDED: 'badge-error',
            CANCELLED: 'badge-warning',
            EXPIRED: 'badge-error',
        };
        return badges[status] || 'badge-info';
    };
    if (loading) {
        return (<div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
      </div>);
    }
    if (error || !tenant) {
        return (<div className="glass-card p-6 text-center">
        <lucide_react_1.AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
        <p className="text-red-400">{error || 'Empresa no encontrada'}</p>
        <link_1.default href="/admin/tenants" className="btn-primary mt-4 inline-block">
          Volver a Empresas
        </link_1.default>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <link_1.default href="/admin/tenants" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <lucide_react_1.ArrowLeft className="w-5 h-5 text-muted-foreground"/>
        </link_1.default>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{tenant.nombre}</h1>
          <p className="text-muted-foreground mt-1">NIT: {tenant.nit}</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <lucide_react_1.Save className="w-4 h-4"/>
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Informacion de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <lucide_react_1.Mail className="w-5 h-5 text-muted-foreground"/>
                <div>
                  <div className="text-sm text-muted-foreground">Correo</div>
                  <div className="text-white">{tenant.correo}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <lucide_react_1.Phone className="w-5 h-5 text-muted-foreground"/>
                <div>
                  <div className="text-sm text-muted-foreground">Telefono</div>
                  <div className="text-white">{tenant.telefono}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <lucide_react_1.MapPin className="w-5 h-5 text-muted-foreground"/>
                <div>
                  <div className="text-sm text-muted-foreground">Direccion</div>
                  <div className="text-white">{tenant.direccion.complemento}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <lucide_react_1.Calendar className="w-5 h-5 text-muted-foreground"/>
                <div>
                  <div className="text-sm text-muted-foreground">Fecha de Registro</div>
                  <div className="text-white">
                    {new Date(tenant.createdAt).toLocaleDateString('es', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Configuration */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Configuracion de Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Plan</label>
                <select value={plan} onChange={(e) => setPlan(e.target.value)} className="input-rc">
                  <option value="TRIAL">Prueba</option>
                  <option value="BASIC">Basico</option>
                  <option value="PROFESSIONAL">Profesional</option>
                  <option value="ENTERPRISE">Empresa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Estado</label>
                <select value={planStatus} onChange={(e) => setPlanStatus(e.target.value)} className="input-rc">
                  <option value="ACTIVE">Activo</option>
                  <option value="SUSPENDED">Suspendido</option>
                  <option value="CANCELLED">Cancelado</option>
                  <option value="EXPIRED">Expirado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">DTEs por Mes</label>
                <input type="number" value={maxDtesPerMonth} onChange={(e) => setMaxDtesPerMonth(parseInt(e.target.value))} className="input-rc"/>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">DTEs Usados Este Mes</label>
                <div className="input-rc bg-white/5 cursor-not-allowed">
                  {tenant.dtesUsedThisMonth} / {tenant.maxDtesPerMonth}
                </div>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Notas del Administrador</h3>
            <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Notas internas sobre esta empresa..." rows={4} className="input-rc"/>
          </div>

          {/* Email Configuration */}
          <tenant_email_config_1.TenantEmailConfig tenantId={tenant.id} tenantName={tenant.nombre}/>

          {/* Plan Management */}
          <tenant_plan_manager_1.TenantPlanManager tenantId={tenant.id} tenantName={tenant.nombre}/>

          {/* Support Tickets */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <lucide_react_1.Ticket className="w-5 h-5 text-primary"/>
                <h3 className="text-lg font-semibold text-white">Tickets de Soporte</h3>
              </div>
              <link_1.default href={`/admin/support?tenantId=${params.id}`} className="text-sm text-primary hover:underline">
                Ver todos
              </link_1.default>
            </div>

            {tickets.length > 0 ? (<div className="space-y-3">
                {tickets.map((ticket) => (<link_1.default key={ticket.id} href={`/admin/support/${ticket.id}`} className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">
                            {ticket.ticketNumber}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getTicketStatusBadge(ticket.status)}`}>
                            {ticketStatusLabels[ticket.status] || ticket.status}
                          </span>
                        </div>
                        <div className="text-sm text-white truncate">{ticket.subject}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <lucide_react_1.Clock className="w-3 h-3"/>
                          {new Date(ticket.createdAt).toLocaleDateString('es')}
                        </div>
                      </div>
                      <lucide_react_1.ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0"/>
                    </div>
                  </link_1.default>))}
              </div>) : (<div className="text-center py-6">
                <lucide_react_1.MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2"/>
                <p className="text-sm text-muted-foreground">
                  Esta empresa no tiene tickets de soporte
                </p>
              </div>)}
          </div>

          {/* Users */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Usuarios ({tenant.usuarios.length})</h3>
            <div className="overflow-x-auto">
              <table className="table-rc">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.usuarios.map((user) => (<tr key={user.id}>
                      <td className="text-white">{user.nombre}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.rol === 'ADMIN' ? 'badge-success' : 'badge-info'}`}>
                          {user.rol}
                        </span>
                      </td>
                      <td className="text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('es')}
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Estadisticas</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <lucide_react_1.Users className="w-4 h-4 text-muted-foreground"/>
                  <span className="text-muted-foreground">Usuarios</span>
                </div>
                <span className="text-white font-medium">{tenant.usuarios.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <lucide_react_1.FileText className="w-4 h-4 text-muted-foreground"/>
                  <span className="text-muted-foreground">Total DTEs</span>
                </div>
                <span className="text-white font-medium">{tenant._count.dtes}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <lucide_react_1.Building2 className="w-4 h-4 text-muted-foreground"/>
                  <span className="text-muted-foreground">Clientes</span>
                </div>
                <span className="text-white font-medium">{tenant._count.clientes}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <lucide_react_1.Calendar className="w-4 h-4 text-muted-foreground"/>
                  <span className="text-muted-foreground">DTEs (30 dias)</span>
                </div>
                <span className="text-white font-medium">{tenant.dtesLast30Days}</span>
              </div>
            </div>
          </div>

          {/* Plan Status */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Estado Actual</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadge(tenant.plan)}`}>
                  {tenant.plan}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estado</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(tenant.planStatus)}`}>
                  {tenant.planStatus}
                </span>
              </div>
            </div>
          </div>

          {/* DTE by Status */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">DTEs por Estado</h3>
            <div className="space-y-3">
              {tenant.dteStats.map((stat) => (<div key={stat.status} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{stat.status}</span>
                  <span className="text-white font-medium">{stat.count}</span>
                </div>))}
              {tenant.dteStats.length === 0 && (<p className="text-muted-foreground text-sm">Sin DTEs</p>)}
            </div>
          </div>
        </div>
      </div>
    </div>);
}
