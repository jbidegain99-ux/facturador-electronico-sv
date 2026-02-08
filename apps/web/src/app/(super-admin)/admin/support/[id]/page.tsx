'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  User,
  Clock,
  Calendar,
  MessageSquare,
  Send,
  AlertCircle,
  Mail,
  CheckCircle,
  Activity,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface TicketDetail {
  id: string;
  ticketNumber: string;
  type: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  metadata: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  tenant: {
    id: string;
    nombre: string;
    nit: string;
    correo: string;
  };
  requester: {
    id: string;
    nombre: string;
    email: string;
  };
  assignedTo: {
    id: string;
    nombre: string;
    email: string;
  } | null;
  comments: {
    id: string;
    content: string;
    isInternal: boolean;
    createdAt: string;
    author: {
      id: string;
      nombre: string;
      email: string;
      rol: string;
    };
  }[];
  activities: {
    id: string;
    action: string;
    oldValue: string | null;
    newValue: string | null;
    createdAt: string;
    actor: {
      nombre: string;
      email: string;
    };
  }[];
}

interface Admin {
  id: string;
  nombre: string;
  email: string;
}

const typeLabels: Record<string, string> = {
  EMAIL_CONFIG: 'Configuracion de Email',
  TECHNICAL: 'Problema Tecnico',
  BILLING: 'Facturacion',
  GENERAL: 'General',
  ONBOARDING: 'Onboarding',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  ASSIGNED: 'Asignado',
  IN_PROGRESS: 'En Progreso',
  WAITING_CUSTOMER: 'Esperando Cliente',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const actionLabels: Record<string, string> = {
  CREATED: 'Ticket creado',
  STATUS_CHANGED: 'Estado cambiado',
  ASSIGNED: 'Ticket asignado',
  PRIORITY_CHANGED: 'Prioridad cambiada',
  COMMENT_ADDED: 'Comentario agregado',
  RESOLVED: 'Ticket resuelto',
  CLOSED: 'Ticket cerrado',
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [resolution, setResolution] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    fetchTicket();
    fetchAdmins();
  }, [params.id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/support-tickets/${params.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error('Error al cargar ticket');
      }

      const data: TicketDetail = await res.json();
      setTicket(data);
      setStatus(data.status);
      setPriority(data.priority);
      setAssignedToId(data.assignedTo?.id || '');
      setResolution(data.resolution || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/support-tickets/admins`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
    }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const body: any = {};
      if (status !== ticket?.status) body.status = status;
      if (priority !== ticket?.priority) body.priority = priority;
      if (assignedToId !== (ticket?.assignedTo?.id || '')) body.assignedToId = assignedToId || null;
      if (resolution !== (ticket?.resolution || '')) body.resolution = resolution;

      if (Object.keys(body).length === 0) {
        alert('No hay cambios para guardar');
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/support-tickets/${params.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) throw new Error('Error al actualizar');
      alert('Ticket actualizado correctamente');
      fetchTicket();
    } catch (err) {
      alert('Error al actualizar el ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setAddingComment(true);
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/support-tickets/${params.id}/comments`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newComment,
            isInternal,
          }),
        }
      );

      if (!res.ok) throw new Error('Error al agregar comentario');
      setNewComment('');
      setIsInternal(false);
      fetchTicket();
    } catch (err) {
      alert('Error al agregar comentario');
    } finally {
      setAddingComment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-400',
      ASSIGNED: 'bg-blue-500/20 text-blue-400',
      IN_PROGRESS: 'bg-purple-500/20 text-purple-400',
      WAITING_CUSTOMER: 'bg-orange-500/20 text-orange-400',
      RESOLVED: 'bg-green-500/20 text-green-400',
      CLOSED: 'bg-gray-500/20 text-gray-400',
    };
    return badges[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      LOW: 'bg-gray-500/20 text-gray-400',
      MEDIUM: 'bg-blue-500/20 text-blue-400',
      HIGH: 'bg-orange-500/20 text-orange-400',
      URGENT: 'bg-red-500/20 text-red-400',
    };
    return badges[priority] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="glass-card p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400">{error || 'Ticket no encontrado'}</p>
        <Link href="/admin/support" className="btn-primary mt-4 inline-block">
          Volver a Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/support" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
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
        <button
          onClick={handleUpdate}
          disabled={saving}
          className="btn-primary"
        >
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
            {ticket.metadata && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-white mb-2">Informacion adicional</h4>
                <pre className="text-xs text-muted-foreground bg-black/20 p-3 rounded-lg overflow-auto">
                  {JSON.stringify(JSON.parse(ticket.metadata), null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Resolution */}
          {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' || resolution) && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Resolucion
              </h3>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe como se resolvio el ticket..."
                rows={4}
                className="input-rc"
              />
            </div>
          )}

          {/* Comments */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comentarios ({ticket.comments.length})
            </h3>

            <div className="space-y-4 mb-6">
              {ticket.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-4 rounded-lg ${
                    comment.isInternal
                      ? 'bg-yellow-500/10 border border-yellow-500/20'
                      : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                        {comment.author.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-white">{comment.author.nombre}</span>
                        {comment.author.rol === 'SUPER_ADMIN' && (
                          <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                        {comment.isInternal && (
                          <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                            Interno
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString('es')}
                    </span>
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}

              {ticket.comments.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Sin comentarios</p>
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                rows={3}
                className="input-rc"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={isInternal}
                    onCheckedChange={(checked) => setIsInternal(checked === true)}
                  />
                  Nota interna (solo visible para admins)
                </label>
                <button
                  type="submit"
                  disabled={addingComment || !newComment.trim()}
                  className="btn-primary flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {addingComment ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>

          {/* Activity Timeline */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Actividad
            </h3>

            <div className="space-y-3">
              {ticket.activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  <div className="flex-1">
                    <span className="text-muted-foreground">
                      <span className="text-white">{activity.actor.nombre}</span>
                      {' '}{actionLabels[activity.action] || activity.action}
                      {activity.oldValue && activity.newValue && (
                        <span>
                          {' '}de <span className="text-white">{activity.oldValue}</span>
                          {' '}a <span className="text-white">{activity.newValue}</span>
                        </span>
                      )}
                      {!activity.oldValue && activity.newValue && (
                        <span>: <span className="text-white">{activity.newValue}</span></span>
                      )}
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
                </div>
              ))}
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
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="ASSIGNED">Asignado</SelectItem>
                    <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                    <SelectItem value="WAITING_CUSTOMER">Esperando Cliente</SelectItem>
                    <SelectItem value="RESOLVED">Resuelto</SelectItem>
                    <SelectItem value="CLOSED">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Prioridad</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baja</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Asignado a</label>
                <Select value={assignedToId} onValueChange={setAssignedToId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {admins.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tenant Info */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Empresa
            </h3>
            <div className="space-y-3">
              <div>
                <div className="font-medium text-white">{ticket.tenant.nombre}</div>
                <div className="text-sm text-muted-foreground">NIT: {ticket.tenant.nit}</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                {ticket.tenant.correo}
              </div>
              <Link
                href={`/admin/tenants/${ticket.tenant.id}`}
                className="text-sm text-primary hover:underline"
              >
                Ver empresa
              </Link>
            </div>
          </div>

          {/* Requester Info */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Solicitante
            </h3>
            <div className="space-y-2">
              <div className="font-medium text-white">{ticket.requester.nombre}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                {ticket.requester.email}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
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
              {ticket.resolvedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Resuelto</span>
                  <span className="text-white">
                    {new Date(ticket.resolvedAt).toLocaleString('es')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
