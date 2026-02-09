'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoportePage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const tabs_1 = require("@/components/ui/tabs");
const button_1 = require("@/components/ui/button");
const dialog_1 = require("@/components/ui/dialog");
const select_1 = require("@/components/ui/select");
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
    WAITING_CUSTOMER: 'Esperando Respuesta',
    RESOLVED: 'Resuelto',
    CLOSED: 'Cerrado',
};
const priorityLabels = {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    URGENT: 'Urgente',
};
function SoportePage() {
    const router = (0, navigation_1.useRouter)();
    const [tickets, setTickets] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)('');
    const [page, setPage] = (0, react_1.useState)(1);
    const [totalPages, setTotalPages] = (0, react_1.useState)(1);
    const [total, setTotal] = (0, react_1.useState)(0);
    const [activeTab, setActiveTab] = (0, react_1.useState)('all');
    // New ticket form
    const [showNewTicket, setShowNewTicket] = (0, react_1.useState)(false);
    const [newTicketType, setNewTicketType] = (0, react_1.useState)('GENERAL');
    const [newTicketPriority, setNewTicketPriority] = (0, react_1.useState)('MEDIUM');
    const [newTicketSubject, setNewTicketSubject] = (0, react_1.useState)('');
    const [newTicketDescription, setNewTicketDescription] = (0, react_1.useState)('');
    const [creating, setCreating] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        fetchTickets();
    }, [page, activeTab]);
    const fetchTickets = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
            });
            const res = await fetch(`${baseUrl}/support-tickets?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error('Error al cargar tickets');
            }
            const data = await res.json();
            let filtered = data.data;
            // Client-side filter by tab (backend doesn't support status filter for tenant)
            if (activeTab === 'pending') {
                filtered = filtered.filter(t => t.status === 'PENDING' || t.status === 'ASSIGNED');
            }
            else if (activeTab === 'in_progress') {
                filtered = filtered.filter(t => t.status === 'IN_PROGRESS' || t.status === 'WAITING_CUSTOMER');
            }
            else if (activeTab === 'resolved') {
                filtered = filtered.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
            }
            setTickets(filtered);
            setTotalPages(data.meta.totalPages);
            setTotal(data.meta.total);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!newTicketSubject.trim())
            return;
        try {
            setCreating(true);
            const token = localStorage.getItem('token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${baseUrl}/support-tickets`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: newTicketType,
                    priority: newTicketPriority,
                    subject: newTicketSubject,
                    description: newTicketDescription,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({ message: 'Error al crear ticket' }));
                throw new Error(data.message || 'Error al crear ticket');
            }
            // Reset form and refresh
            setNewTicketSubject('');
            setNewTicketDescription('');
            setNewTicketType('GENERAL');
            setNewTicketPriority('MEDIUM');
            setShowNewTicket(false);
            setPage(1);
            fetchTickets();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        }
        finally {
            setCreating(false);
        }
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
    const getStatusIcon = (status) => {
        if (status === 'RESOLVED' || status === 'CLOSED') {
            return <lucide_react_1.CheckCircle className="w-4 h-4 text-green-400"/>;
        }
        if (status === 'IN_PROGRESS' || status === 'ASSIGNED') {
            return <lucide_react_1.Loader2 className="w-4 h-4 text-purple-400"/>;
        }
        return <lucide_react_1.Clock className="w-4 h-4 text-yellow-400"/>;
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Soporte</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus tickets de soporte</p>
        </div>
        <dialog_1.Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
          <dialog_1.DialogTrigger asChild>
            <button_1.Button>
              <lucide_react_1.Plus className="w-4 h-4 mr-2"/>
              Nuevo Ticket
            </button_1.Button>
          </dialog_1.DialogTrigger>
          <dialog_1.DialogContent className="sm:max-w-[500px]">
            <dialog_1.DialogHeader>
              <dialog_1.DialogTitle>Nuevo Ticket de Soporte</dialog_1.DialogTitle>
              <dialog_1.DialogDescription>
                Describe tu problema y nuestro equipo te ayudara lo antes posible.
              </dialog_1.DialogDescription>
            </dialog_1.DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select_1.Select value={newTicketType} onValueChange={setNewTicketType}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue />
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="GENERAL">General</select_1.SelectItem>
                      <select_1.SelectItem value="TECHNICAL">Tecnico</select_1.SelectItem>
                      <select_1.SelectItem value="BILLING">Facturacion</select_1.SelectItem>
                      <select_1.SelectItem value="EMAIL_CONFIG">Config. Email</select_1.SelectItem>
                      <select_1.SelectItem value="ONBOARDING">Onboarding</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prioridad</label>
                  <select_1.Select value={newTicketPriority} onValueChange={setNewTicketPriority}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue />
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="LOW">Baja</select_1.SelectItem>
                      <select_1.SelectItem value="MEDIUM">Media</select_1.SelectItem>
                      <select_1.SelectItem value="HIGH">Alta</select_1.SelectItem>
                      <select_1.SelectItem value="URGENT">Urgente</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Asunto</label>
                <input type="text" value={newTicketSubject} onChange={(e) => setNewTicketSubject(e.target.value)} placeholder="Describe brevemente tu problema" required className="block w-full rounded-lg border border-input bg-background py-2.5 px-4 text-foreground shadow-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripcion</label>
                <textarea value={newTicketDescription} onChange={(e) => setNewTicketDescription(e.target.value)} placeholder="Proporciona todos los detalles posibles..." rows={4} className="block w-full rounded-lg border border-input bg-background py-2.5 px-4 text-foreground shadow-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"/>
              </div>
              <div className="flex justify-end gap-2">
                <button_1.Button type="button" variant="outline" onClick={() => setShowNewTicket(false)}>
                  Cancelar
                </button_1.Button>
                <button_1.Button type="submit" disabled={creating || !newTicketSubject.trim()}>
                  {creating ? 'Creando...' : 'Crear Ticket'}
                </button_1.Button>
              </div>
            </form>
          </dialog_1.DialogContent>
        </dialog_1.Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <lucide_react_1.Clock className="w-5 h-5 text-yellow-400"/>
            </div>
            <div>
              <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'PENDING' || t.status === 'ASSIGNED').length}</div>
              <div className="text-sm text-muted-foreground">Pendientes</div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <lucide_react_1.Loader2 className="w-5 h-5 text-purple-400"/>
            </div>
            <div>
              <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'WAITING_CUSTOMER').length}</div>
              <div className="text-sm text-muted-foreground">En Progreso</div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <lucide_react_1.CheckCircle className="w-5 h-5 text-green-400"/>
            </div>
            <div>
              <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length}</div>
              <div className="text-sm text-muted-foreground">Resueltos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <tabs_1.Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setPage(1); }}>
        <tabs_1.TabsList>
          <tabs_1.TabsTrigger value="all">Todos ({total})</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="pending">Pendientes</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="in_progress">En Progreso</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="resolved">Resueltos</tabs_1.TabsTrigger>
        </tabs_1.TabsList>
      </tabs_1.Tabs>

      {/* Tickets List */}
      <div className="bg-card rounded-lg border">
        {loading ? (<div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
          </div>) : error ? (<div className="flex flex-col items-center justify-center h-64">
            <lucide_react_1.AlertCircle className="w-12 h-12 text-red-500 mb-4"/>
            <p className="text-red-400">{error}</p>
          </div>) : tickets.length === 0 ? (<div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <lucide_react_1.Ticket className="w-12 h-12 mb-4 opacity-50"/>
            <p className="text-lg font-medium">No tienes tickets</p>
            <p className="text-sm mt-1">Crea un nuevo ticket si necesitas ayuda</p>
          </div>) : (<>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">#</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Asunto</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Tipo</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Estado</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Prioridad</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Fecha</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (<tr key={ticket.id} className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push(`/soporte/${ticket.id}`)}>
                      <td className="px-4 py-3 font-mono text-sm">{ticket.ticketNumber}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ticket.status)}
                          <div>
                            <div className="font-medium max-w-[250px] truncate">{ticket.subject}</div>
                            {ticket._count.comments > 0 && (<div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <lucide_react_1.MessageSquare className="w-3 h-3"/>
                                {ticket._count.comments} comentarios
                              </div>)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {typeLabels[ticket.type] || ticket.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                          {statusLabels[ticket.status] || ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority)}`}>
                          {priorityLabels[ticket.priority] || ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString('es', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                })}
                      </td>
                      <td className="px-4 py-3">
                        <lucide_react_1.ChevronRight className="w-4 h-4 text-muted-foreground"/>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (<div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Pagina {page} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button_1.Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <lucide_react_1.ChevronLeft className="w-4 h-4"/>
                  </button_1.Button>
                  <button_1.Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <lucide_react_1.ChevronRight className="w-4 h-4"/>
                  </button_1.Button>
                </div>
              </div>)}
          </>)}
      </div>
    </div>);
}
