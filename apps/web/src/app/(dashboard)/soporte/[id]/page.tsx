'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Calendar,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TicketDetail {
  id: string;
  ticketNumber: string;
  type: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
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
  WAITING_CUSTOMER: 'Esperando tu Respuesta',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [params.id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;

      const res = await fetch(
        `${baseUrl}/support-tickets/${params.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error('Error al cargar ticket');
      }

      const data: TicketDetail = await res.json();
      setTicket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setAddingComment(true);
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;

      const res = await fetch(
        `${baseUrl}/support-tickets/${params.id}/comments`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newComment,
          }),
        }
      );

      if (!res.ok) throw new Error('Error al agregar comentario');
      setNewComment('');
      fetchTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar comentario');
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
      <div className="bg-card rounded-lg border p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400">{error || 'Ticket no encontrado'}</p>
        <Link href="/soporte">
          <Button variant="outline" className="mt-4">
            Volver a Soporte
          </Button>
        </Link>
      </div>
    );
  }

  // Filter out internal comments - tenants should only see public comments
  const publicComments = ticket.comments.filter(c => !c.isInternal);
  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/soporte')}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{ticket.ticketNumber}</h1>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
              {statusLabels[ticket.status]}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority)}`}>
              {priorityLabels[ticket.priority]}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">{ticket.subject}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Description */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Descripcion</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {ticket.description || 'Sin descripcion adicional'}
            </p>
          </div>

          {/* Resolution */}
          {ticket.resolution && (
            <div className="bg-card rounded-lg border p-6 border-green-500/20">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Resolucion
              </h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {ticket.resolution}
              </p>
            </div>
          )}

          {/* Comments */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comentarios ({publicComments.length})
            </h3>

            <div className="space-y-4 mb-6">
              {publicComments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                        {comment.author.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium">{comment.author.nombre}</span>
                        {comment.author.rol === 'SUPER_ADMIN' && (
                          <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                            Soporte
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString('es', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}

              {publicComments.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Sin comentarios aun</p>
              )}
            </div>

            {/* Add Comment Form - only show if ticket is not closed */}
            {!isResolved ? (
              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario o respuesta..."
                  rows={3}
                  className="block w-full rounded-lg border border-input bg-background py-2.5 px-4 text-foreground shadow-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={addingComment || !newComment.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {addingComment ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-3 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                Este ticket esta {ticket.status === 'RESOLVED' ? 'resuelto' : 'cerrado'}. Si necesitas mas ayuda, crea un nuevo ticket.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Informacion</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Tipo</label>
                <div className="font-medium">{typeLabels[ticket.type] || ticket.type}</div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Estado</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                  {statusLabels[ticket.status]}
                </span>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Prioridad</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority)}`}>
                  {priorityLabels[ticket.priority]}
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Fechas
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Creado</span>
                <span>
                  {new Date(ticket.createdAt).toLocaleDateString('es', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Actualizado</span>
                <span>
                  {new Date(ticket.updatedAt).toLocaleDateString('es', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {ticket.resolvedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Resuelto</span>
                  <span>
                    {new Date(ticket.resolvedAt).toLocaleDateString('es', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Waiting for response banner */}
          {ticket.status === 'WAITING_CUSTOMER' && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium text-sm">Esperando tu respuesta</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Nuestro equipo necesita mas informacion para resolver tu caso. Agrega un comentario con los detalles solicitados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
