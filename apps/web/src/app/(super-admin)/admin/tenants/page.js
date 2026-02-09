'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TenantsPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const select_1 = require("@/components/ui/select");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
const button_1 = require("@/components/ui/button");
function TenantsPage() {
    const router = (0, navigation_1.useRouter)();
    const [tenants, setTenants] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)('');
    const [page, setPage] = (0, react_1.useState)(1);
    const [totalPages, setTotalPages] = (0, react_1.useState)(1);
    const [search, setSearch] = (0, react_1.useState)('');
    const [planFilter, setPlanFilter] = (0, react_1.useState)('');
    const [statusFilter, setStatusFilter] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        fetchTenants();
    }, [page, planFilter, statusFilter]);
    const fetchTenants = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(search && { search }),
                ...(planFilter && { plan: planFilter }),
                ...(statusFilter && { status: statusFilter }),
            });
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                throw new Error('Error al cargar empresas');
            }
            const data = await res.json();
            setTenants(data.data);
            setTotalPages(data.meta.totalPages);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchTenants();
    };
    const handleSuspend = async (id) => {
        if (!confirm('¿Estas seguro de suspender esta empresa?'))
            return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants/${id}/suspend`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: 'Suspendido por administrador' }),
            });
            if (!res.ok)
                throw new Error('Error al suspender');
            fetchTenants();
        }
        catch (err) {
            alert('Error al suspender la empresa');
        }
    };
    const handleActivate = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants/${id}/activate`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok)
                throw new Error('Error al activar');
            fetchTenants();
        }
        catch (err) {
            alert('Error al activar la empresa');
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('¿Estas seguro de ELIMINAR esta empresa? Esta accion no se puede deshacer.'))
            return;
        if (!confirm('CONFIRMACION FINAL: Se eliminaran TODOS los datos de esta empresa incluyendo usuarios, clientes y DTEs.'))
            return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok)
                throw new Error('Error al eliminar');
            fetchTenants();
        }
        catch (err) {
            alert('Error al eliminar la empresa');
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
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Empresas</h1>
          <p className="text-muted-foreground mt-1">Gestiona las empresas registradas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <lucide_react_1.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
              <input type="text" placeholder="Buscar por nombre, NIT o correo..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-rc pl-10"/>
            </div>
          </div>
          <select_1.Select value={planFilter} onValueChange={(value) => {
            setPlanFilter(value === 'ALL' ? '' : value);
            setPage(1);
        }}>
            <select_1.SelectTrigger className="w-40">
              <select_1.SelectValue placeholder="Todos los planes"/>
            </select_1.SelectTrigger>
            <select_1.SelectContent>
              <select_1.SelectItem value="ALL">Todos los planes</select_1.SelectItem>
              <select_1.SelectItem value="TRIAL">Prueba</select_1.SelectItem>
              <select_1.SelectItem value="BASIC">Basico</select_1.SelectItem>
              <select_1.SelectItem value="PROFESSIONAL">Profesional</select_1.SelectItem>
              <select_1.SelectItem value="ENTERPRISE">Empresa</select_1.SelectItem>
            </select_1.SelectContent>
          </select_1.Select>
          <select_1.Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value === 'ALL' ? '' : value);
            setPage(1);
        }}>
            <select_1.SelectTrigger className="w-40">
              <select_1.SelectValue placeholder="Todos los estados"/>
            </select_1.SelectTrigger>
            <select_1.SelectContent>
              <select_1.SelectItem value="ALL">Todos los estados</select_1.SelectItem>
              <select_1.SelectItem value="ACTIVE">Activo</select_1.SelectItem>
              <select_1.SelectItem value="SUSPENDED">Suspendido</select_1.SelectItem>
              <select_1.SelectItem value="CANCELLED">Cancelado</select_1.SelectItem>
              <select_1.SelectItem value="EXPIRED">Expirado</select_1.SelectItem>
            </select_1.SelectContent>
          </select_1.Select>
          <button type="submit" className="btn-primary">
            <lucide_react_1.Filter className="w-4 h-4"/>
            Filtrar
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="glass-card overflow-visible">
        {loading ? (<div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
          </div>) : error ? (<div className="flex flex-col items-center justify-center h-64">
            <lucide_react_1.AlertCircle className="w-12 h-12 text-red-500 mb-4"/>
            <p className="text-red-400">{error}</p>
          </div>) : (<>
            <div className="overflow-x-auto overflow-y-visible">
              <table className="table-rc w-full">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>NIT</th>
                    <th>Plan</th>
                    <th>Estado</th>
                    <th>Usuarios</th>
                    <th>DTEs</th>
                    <th>Registro</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (<tr key={tenant.id}>
                      <td>
                        <div>
                          <div className="font-medium">{tenant.nombre}</div>
                          <div className="text-xs text-muted-foreground">{tenant.correo}</div>
                        </div>
                      </td>
                      <td className="font-mono text-sm">{tenant.nit}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadge(tenant.plan)}`}>
                          {tenant.plan}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(tenant.planStatus)}`}>
                          {tenant.planStatus}
                        </span>
                      </td>
                      <td>{tenant._count.usuarios}</td>
                      <td>{tenant._count.dtes}</td>
                      <td className="text-sm text-muted-foreground">
                        {new Date(tenant.createdAt).toLocaleDateString('es')}
                      </td>
                      <td>
                        <dropdown_menu_1.DropdownMenu>
                          <dropdown_menu_1.DropdownMenuTrigger asChild>
                            <button_1.Button variant="ghost" size="icon">
                              <lucide_react_1.MoreVertical className="w-4 h-4"/>
                            </button_1.Button>
                          </dropdown_menu_1.DropdownMenuTrigger>
                          <dropdown_menu_1.DropdownMenuContent align="end" sideOffset={5}>
                            <dropdown_menu_1.DropdownMenuItem onClick={() => router.push(`/admin/tenants/${tenant.id}`)} className="flex items-center gap-2 cursor-pointer">
                              <lucide_react_1.Eye className="w-4 h-4"/>
                              Ver Detalles
                            </dropdown_menu_1.DropdownMenuItem>
                            {tenant.planStatus === 'ACTIVE' ? (<dropdown_menu_1.DropdownMenuItem onClick={() => handleSuspend(tenant.id)} className="text-yellow-600 dark:text-yellow-400">
                                <lucide_react_1.Pause className="w-4 h-4 mr-2"/>
                                Suspender
                              </dropdown_menu_1.DropdownMenuItem>) : (<dropdown_menu_1.DropdownMenuItem onClick={() => handleActivate(tenant.id)} className="text-green-600 dark:text-green-400">
                                <lucide_react_1.Play className="w-4 h-4 mr-2"/>
                                Activar
                              </dropdown_menu_1.DropdownMenuItem>)}
                            <dropdown_menu_1.DropdownMenuSeparator />
                            <dropdown_menu_1.DropdownMenuItem onClick={() => handleDelete(tenant.id)} className="text-destructive">
                              <lucide_react_1.Trash2 className="w-4 h-4 mr-2"/>
                              Eliminar
                            </dropdown_menu_1.DropdownMenuItem>
                          </dropdown_menu_1.DropdownMenuContent>
                        </dropdown_menu_1.DropdownMenu>
                      </td>
                    </tr>))}
                  {tenants.length === 0 && (<tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">
                        No se encontraron empresas
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (<div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Pagina {page} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">
                    <lucide_react_1.ChevronLeft className="w-4 h-4"/>
                  </button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">
                    <lucide_react_1.ChevronRight className="w-4 h-4"/>
                  </button>
                </div>
              </div>)}
          </>)}
      </div>
    </div>);
}
