'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SupportTicketsPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const select_1 = require("@/components/ui/select");
const tabs_1 = require("@/components/ui/tabs");
const typeLabels = {
    EMAIL_CONFIG: 'Config. Email',
    TECHNICAL: 'Tecnico',
    BILLING: 'Facturacion',
    GENERAL: 'General',
    ONBOARDING: 'Onboarding',
};
const statusLabels = {
    PENDING: 'Pendiente',
    ASSIGNED: 'Asignado',
    IN_PROGRESS: 'En Progreso',
    WAITING_CUSTOMER: 'Esperando Cliente',
    RESOLVED: 'Resuelto',
    CLOSED: 'Cerrado',
};
const priorityLabels = {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    URGENT: 'Urgente',
};
function SupportTicketsPage() {
    const router = (0, navigation_1.useRouter)();
    const [tickets, setTickets] = (0, react_1.useState)([]);
    const [stats, setStats] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)('');
    const [page, setPage] = (0, react_1.useState)(1);
    const [totalPages, setTotalPages] = (0, react_1.useState)(1);
    const [search, setSearch] = (0, react_1.useState)('');
    const [statusFilter, setStatusFilter] = (0, react_1.useState)('');
    const [priorityFilter, setPriorityFilter] = (0, react_1.useState)('');
    const [typeFilter, setTypeFilter] = (0, react_1.useState)('');
    const [activeTab, setActiveTab] = (0, react_1.useState)('all');
    (0, react_1.useEffect)(() => {
        fetchStats();
    }, []);
    (0, react_1.useEffect)(() => {
        fetchTickets();
    }, [page, statusFilter, priorityFilter, typeFilter, activeTab]);
    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/support-tickets/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        }
        catch (err) {
            console.error('Error fetching stats:', err);
        }
    };
    const fetchTickets = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let status = statusFilter;
            if (activeTab === 'pending')
                status = 'PENDING';
            else if (activeTab === 'in_progress')
                status = 'IN_PROGRESS';
            else if (activeTab === 'resolved')
                status = 'RESOLVED';
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '15',
                ...(search && { search }),
                ...(status && { status }),
                ...(priorityFilter && { priority: priorityFilter }),
                ...(typeFilter && { type: typeFilter }),
            });
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/support-tickets?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error('Error al cargar tickets');
            }
            const data = await res.json();
            setTickets(data.data);
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
        fetchTickets();
    };
    const getStatusBadge = (status) => {
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
    const getPriorityBadge = (priority) => {
        const badges = {
            LOW: 'bg-gray-500/20 text-gray-400',
            MEDIUM: 'bg-blue-500/20 text-blue-400',
            HIGH: 'bg-orange-500/20 text-orange-400',
            URGENT: 'bg-red-500/20 text-red-400',
        };
        return badges[priority] || 'bg-gray-500/20 text-gray-400';
    };
    const getTypeBadge = (type) => {
        const badges = {
            EMAIL_CONFIG: 'bg-cyan-500/20 text-cyan-400',
            TECHNICAL: 'bg-violet-500/20 text-violet-400',
            BILLING: 'bg-emerald-500/20 text-emerald-400',
            GENERAL: 'bg-slate-500/20 text-slate-400',
            ONBOARDING: 'bg-amber-500/20 text-amber-400',
        };
        return badges[type] || 'bg-gray-500/20 text-gray-400';
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tickets de Soporte</h1>
          <p className="text-muted-foreground mt-1">Gestiona las solicitudes de soporte de las empresas</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <lucide_react_1.Clock className="w-5 h-5 text-yellow-400"/>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pendientes</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <lucide_react_1.User className="w-5 h-5 text-purple-400"/>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.inProgress}</div>
                <div className="text-sm text-muted-foreground">En Progreso</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <lucide_react_1.CheckCircle className="w-5 h-5 text-green-400"/>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.resolved}</div>
                <div className="text-sm text-muted-foreground">Resueltos</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <lucide_react_1.Ticket className="w-5 h-5 text-blue-400"/>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </div>)}

      {/* Tabs */}
      <tabs_1.Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setPage(1); }}>
        <tabs_1.TabsList>
          <tabs_1.TabsTrigger value="all">Todos</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="pending">
            Pendientes {stats && stats.pending > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">{stats.pending}</span>}
          </tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="in_progress">En Progreso</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="resolved">Resueltos</tabs_1.TabsTrigger>
        </tabs_1.TabsList>
      </tabs_1.Tabs>

      {/* Filters */}
      <div className="glass-card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <lucide_react_1.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
              <input type="text" placeholder="Buscar por numero, asunto o empresa..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-rc pl-10"/>
            </div>
          </div>
          <select_1.Select value={typeFilter} onValueChange={(value) => {
            setTypeFilter(value === 'ALL' ? '' : value);
            setPage(1);
        }}>
            <select_1.SelectTrigger className="w-40">
              <select_1.SelectValue placeholder="Tipo"/>
            </select_1.SelectTrigger>
            <select_1.SelectContent>
              <select_1.SelectItem value="ALL">Todos los tipos</select_1.SelectItem>
              <select_1.SelectItem value="EMAIL_CONFIG">Config. Email</select_1.SelectItem>
              <select_1.SelectItem value="TECHNICAL">Tecnico</select_1.SelectItem>
              <select_1.SelectItem value="BILLING">Facturacion</select_1.SelectItem>
              <select_1.SelectItem value="GENERAL">General</select_1.SelectItem>
              <select_1.SelectItem value="ONBOARDING">Onboarding</select_1.SelectItem>
            </select_1.SelectContent>
          </select_1.Select>
          <select_1.Select value={priorityFilter} onValueChange={(value) => {
            setPriorityFilter(value === 'ALL' ? '' : value);
            setPage(1);
        }}>
            <select_1.SelectTrigger className="w-40">
              <select_1.SelectValue placeholder="Prioridad"/>
            </select_1.SelectTrigger>
            <select_1.SelectContent>
              <select_1.SelectItem value="ALL">Todas</select_1.SelectItem>
              <select_1.SelectItem value="LOW">Baja</select_1.SelectItem>
              <select_1.SelectItem value="MEDIUM">Media</select_1.SelectItem>
              <select_1.SelectItem value="HIGH">Alta</select_1.SelectItem>
              <select_1.SelectItem value="URGENT">Urgente</select_1.SelectItem>
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
            <div className="overflow-x-auto">
              <table className="table-rc w-full">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Empresa</th>
                    <th>Tipo</th>
                    <th>Asunto</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Asignado</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (<tr key={ticket.id} className="cursor-pointer hover:bg-white/5" onClick={() => router.push(`/admin/support/${ticket.id}`)}>
                      <td className="font-mono text-sm">{ticket.ticketNumber}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <lucide_react_1.Building2 className="w-4 h-4 text-muted-foreground"/>
                          <div>
                            <div className="font-medium text-white">{ticket.tenant.nombre}</div>
                            <div className="text-xs text-muted-foreground">{ticket.requester.nombre}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(ticket.type)}`}>
                          {typeLabels[ticket.type] || ticket.type}
                        </span>
                      </td>
                      <td>
                        <div className="max-w-[200px] truncate" title={ticket.subject}>
                          {ticket.subject}
                        </div>
                        {ticket._count.comments > 0 && (<div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <lucide_react_1.MessageSquare className="w-3 h-3"/>
                            {ticket._count.comments}
                          </div>)}
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                          {statusLabels[ticket.status] || ticket.status}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority)}`}>
                          {priorityLabels[ticket.priority] || ticket.priority}
                        </span>
                      </td>
                      <td>
                        {ticket.assignedTo ? (<span className="text-sm">{ticket.assignedTo.nombre}</span>) : (<span className="text-sm text-muted-foreground">Sin asignar</span>)}
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString('es', {
                    day: '2-digit',
                    month: 'short',
                })}
                      </td>
                      <td>
                        <lucide_react_1.ChevronRight className="w-4 h-4 text-muted-foreground"/>
                      </td>
                    </tr>))}
                  {tickets.length === 0 && (<tr>
                      <td colSpan={9} className="text-center py-12 text-muted-foreground">
                        No se encontraron tickets
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
