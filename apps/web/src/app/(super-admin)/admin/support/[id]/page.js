'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TicketDetailPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const select_1 = require("@/components/ui/select");
const checkbox_1 = require("@/components/ui/checkbox");
const typeLabels = {
    EMAIL_CONFIG: 'Configuracion de Email',
    TECHNICAL: 'Problema Tecnico',
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
const actionLabels = {
    CREATED: 'Ticket creado',
    STATUS_CHANGED: 'Estado cambiado',
    ASSIGNED: 'Ticket asignado',
    PRIORITY_CHANGED: 'Prioridad cambiada',
    COMMENT_ADDED: 'Comentario agregado',
    RESOLVED: 'Ticket resuelto',
    CLOSED: 'Ticket cerrado',
};
function TicketDetailPage() {
    const params = (0, navigation_1.useParams)();
    const router = (0, navigation_1.useRouter)();
    const [ticket, setTicket] = (0, react_1.useState)(null);
    const [admins, setAdmins] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    // Form state
    const [status, setStatus] = (0, react_1.useState)('');
    const [priority, setPriority] = (0, react_1.useState)('');
    const [assignedToId, setAssignedToId] = (0, react_1.useState)('');
    const [resolution, setResolution] = (0, react_1.useState)('');
    const [newComment, setNewComment] = (0, react_1.useState)('');
    const [isInternal, setIsInternal] = (0, react_1.useState)(false);
    const [addingComment, setAddingComment] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        fetchTicket();
        fetchAdmins();
    }, [params.id]);
    const fetchTicket = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/support-tickets/${params.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error('Error al cargar ticket');
            }
            const data = await res.json();
            setTicket(data);
            setStatus(data.status);
            setPriority(data.priority);
            setAssignedToId(data.assignedTo?.id || '');
            setResolution(data.resolution || '');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        }
        finally {
            setLoading(false);
        }
    };
    const fetchAdmins = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/support-tickets/admins`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setAdmins(data);
            }
        }
        catch (err) {
            console.error('Error fetching admins:', err);
        }
    };
    const handleUpdate = async () => {
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const body = {};
            if (status !== ticket?.status)
                body.status = status;
            if (priority !== ticket?.priority)
                body.priority = priority;
            if (assignedToId !== (ticket?.assignedTo?.id || ''))
                body.assignedToId = assignedToId || null;
            if (resolution !== (ticket?.resolution || ''))
                body.resolution = resolution;
            if (Object.keys(body).length === 0) {
                alert('No hay cambios para guardar');
                return;
            }
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/support-tickets/${params.id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            if (!res.ok)
                throw new Error('Error al actualizar');
            alert('Ticket actualizado correctamente');
            fetchTicket();
        }
        catch (err) {
            alert('Error al actualizar el ticket');
        }
        finally {
            setSaving(false);
        }
    };
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim())
            return;
        try {
            setAddingComment(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/support-tickets/${params.id}/comments`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: newComment,
                    isInternal,
                }),
            });
            if (!res.ok)
                throw new Error('Error al agregar comentario');
            setNewComment('');
            setIsInternal(false);
            fetchTicket();
        }
        catch (err) {
            alert('Error al agregar comentario');
        }
        finally {
            setAddingComment(false);
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
    if (loading) {
        return (<div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
      </div>);
    }
    if (error || !ticket) {
        return (<div className="glass-card p-6 text-center">
        <lucide_react_1.AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
        <p className="text-red-400">{error || 'Ticket no encontrado'}</p>
        <link_1.default href="/admin/support" className="btn-primary mt-4 inline-block">
          Volver a Tickets
        </link_1.default>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <link_1.default href="/admin/support" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <lucide_react_1.ArrowLeft className="w-5 h-5 text-muted-foreground"/>
        </link_1.default>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{ticket.ticketNumber}</h1>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
              {statusLabels[ticket.status]}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority)}`}>
              {priorityLabels[ticket.priority]}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">{ticket.subject}</p>
        </div>
        <button onClick={handleUpdate} disabled={saving} className="btn-primary">
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Description */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Descripcion</h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {ticket.description || 'Sin descripcion'}
              </p>
            </div>

            {/* Metadata */}
            {ticket.metadata && (<div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-white mb-2">Informacion adicional</h4>
                <pre className="text-xs text-muted-foreground bg-black/20 p-3 rounded-lg overflow-auto">
                  {JSON.stringify(JSON.parse(ticket.metadata), null, 2)}
                </pre>
              </div>)}
          </div>

          {/* Resolution */}
          {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' || resolution) && (<div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <lucide_react_1.CheckCircle className="w-5 h-5 text-green-400"/>
                Resolucion
              </h3>
              <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Describe como se resolvio el ticket..." rows={4} className="input-rc"/>
            </div>)}

          {/* Comments */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <lucide_react_1.MessageSquare className="w-5 h-5"/>
              Comentarios ({ticket.comments.length})
            </h3>

            <div className="space-y-4 mb-6">
              {ticket.comments.map((comment) => (<div key={comment.id} className={`p-4 rounded-lg ${comment.isInternal
                ? 'bg-yellow-500/10 border border-yellow-500/20'
                : 'bg-white/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                        {comment.author.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-white">{comment.author.nombre}</span>
                        {comment.author.rol === 'SUPER_ADMIN' && (<span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                            Admin
                          </span>)}
                        {comment.isInternal && (<span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                            Interno
                          </span>)}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString('es')}
                    </span>
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                </div>))}

              {ticket.comments.length === 0 && (<p className="text-muted-foreground text-center py-4">Sin comentarios</p>)}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escribe un comentario..." rows={3} className="input-rc"/>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <checkbox_1.Checkbox checked={isInternal} onCheckedChange={(checked) => setIsInternal(checked === true)}/>
                  Nota interna (solo visible para admins)
                </label>
                <button type="submit" disabled={addingComment || !newComment.trim()} className="btn-primary flex items-center gap-2">
                  <lucide_react_1.Send className="w-4 h-4"/>
                  {addingComment ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>

          {/* Activity Timeline */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <lucide_react_1.Activity className="w-5 h-5"/>
              Actividad
            </h3>

            <div className="space-y-3">
              {ticket.activities.map((activity) => (<div key={activity.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5"/>
                  <div className="flex-1">
                    <span className="text-muted-foreground">
                      <span className="text-white">{activity.actor.nombre}</span>
                      {' '}{actionLabels[activity.action] || activity.action}
                      {activity.oldValue && activity.newValue && (<span>
                          {' '}de <span className="text-white">{activity.oldValue}</span>
                          {' '}a <span className="text-white">{activity.newValue}</span>
                        </span>)}
                      {!activity.oldValue && activity.newValue && (<span>: <span className="text-white">{activity.newValue}</span></span>)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(activity.createdAt).toLocaleString('es', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            })}
                  </span>
                </div>))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Informacion</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Tipo</label>
                <div className="text-white">{typeLabels[ticket.type] || ticket.type}</div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Estado</label>
                <select_1.Select value={status} onValueChange={setStatus}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue />
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="PENDING">Pendiente</select_1.SelectItem>
                    <select_1.SelectItem value="ASSIGNED">Asignado</select_1.SelectItem>
                    <select_1.SelectItem value="IN_PROGRESS">En Progreso</select_1.SelectItem>
                    <select_1.SelectItem value="WAITING_CUSTOMER">Esperando Cliente</select_1.SelectItem>
                    <select_1.SelectItem value="RESOLVED">Resuelto</select_1.SelectItem>
                    <select_1.SelectItem value="CLOSED">Cerrado</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Prioridad</label>
                <select_1.Select value={priority} onValueChange={setPriority}>
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

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Asignado a</label>
                <select_1.Select value={assignedToId} onValueChange={setAssignedToId}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue placeholder="Sin asignar"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="">Sin asignar</select_1.SelectItem>
                    {admins.map((admin) => (<select_1.SelectItem key={admin.id} value={admin.id}>
                        {admin.nombre}
                      </select_1.SelectItem>))}
                  </select_1.SelectContent>
                </select_1.Select>
              </div>
            </div>
          </div>

          {/* Tenant Info */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <lucide_react_1.Building2 className="w-5 h-5"/>
              Empresa
            </h3>
            <div className="space-y-3">
              <div>
                <div className="font-medium text-white">{ticket.tenant.nombre}</div>
                <div className="text-sm text-muted-foreground">NIT: {ticket.tenant.nit}</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <lucide_react_1.Mail className="w-4 h-4"/>
                {ticket.tenant.correo}
              </div>
              <link_1.default href={`/admin/tenants/${ticket.tenant.id}`} className="text-sm text-primary hover:underline">
                Ver empresa
              </link_1.default>
            </div>
          </div>

          {/* Requester Info */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <lucide_react_1.User className="w-5 h-5"/>
              Solicitante
            </h3>
            <div className="space-y-2">
              <div className="font-medium text-white">{ticket.requester.nombre}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <lucide_react_1.Mail className="w-4 h-4"/>
                {ticket.requester.email}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <lucide_react_1.Calendar className="w-5 h-5"/>
              Fechas
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Creado</span>
                <span className="text-white">
                  {new Date(ticket.createdAt).toLocaleString('es')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Actualizado</span>
                <span className="text-white">
                  {new Date(ticket.updatedAt).toLocaleString('es')}
                </span>
              </div>
              {ticket.resolvedAt && (<div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Resuelto</span>
                  <span className="text-white">
                    {new Date(ticket.resolvedAt).toLocaleString('es')}
                  </span>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>);
}
