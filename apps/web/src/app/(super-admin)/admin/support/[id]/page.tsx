'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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

export default function TicketDetailPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tSupport = useTranslations('support');
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

  const typeLabels: Record<string, string> = {
    EMAIL_CONFIG: tSupport('typeEmail'),
    TECHNICAL: tSupport('typeTechnical'),
    BILLING: tSupport('typeBilling'),
    GENERAL: tSupport('typeGeneral'),
    ONBOARDING: tSupport('typeOnboarding'),
  };

  const statusLabels: Record<string, string> = {
    PENDING: tSupport('statusPending'),
    ASSIGNED: tSupport('statusAssigned'),
    IN_PROGRESS: tSupport('statusInProgress'),
    WAITING_CUSTOMER: t('statusWaitingClient'),
    RESOLVED: tSupport('statusResolved'),
    CLOSED: tSupport('statusClosed'),
  };

  const priorityLabels: Record<string, string> = {
    LOW: tSupport('priorityLow'),
    MEDIUM: tSupport('priorityMedium'),
    HIGH: tSupport('priorityHigh'),
    URGENT: tSupport('priorityUrgent'),
  };

  const actionLabels: Record<string, string> = {
    CREATED: t('activityTicketCreated'),
    STATUS_CHANGED: t('activityStatusChanged'),
    ASSIGNED: t('activityAssigned'),
    PRIORITY_CHANGED: t('activityPriorityChanged'),
    COMMENT_ADDED: t('activityCommentAdded'),
    RESOLVED: t('activityResolved'),
    CLOSED: t('activityClosed'),
  };

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
        throw new Error(t('loadTicketsError'));
      }

      const data: TicketDetail = await res.json();
      setTicket(data);
      setStatus(data.status);
      setPriority(data.priority);
      setAssignedToId(data.assignedTo?.id || '__none__');
      setResolution(data.resolution || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
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

      const body: Record<string, string | null> = {};
      if (status !== ticket?.status) body.status = status;
      if (priority !== ticket?.priority) body.priority = priority;
      const currentAssignedId = ticket?.assignedTo?.id || '';
      const newAssignedId = assignedToId === '__none__' ? '' : assignedToId;
      if (newAssignedId !== currentAssignedId) body.assignedToId = newAssignedId || null;
      if (resolution !== (ticket?.resolution || '')) body.resolution = resolution;

      if (Object.keys(body).length === 0) {
        alert(t('noChanges'));
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

      if (!res.ok) throw new Error(t('updateError'));
      alert(t('updateSuccess'));
      fetchTicket();
    } catch (err) {
      alert(t('updateError'));
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

      if (!res.ok) throw new Error(t('commentError'));
      setNewComment('');
      setIsInternal(false);
      fetchTicket();
    } catch (err) {
      alert(t('commentError'));
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
        <p className="text-red-400">{error || t('ticketNotFound')}</p>
        <Link href="/admin/support" className="btn-primary mt-4 inline-block">
          {t('backToTickets')}
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
          {saving ? tCommon('saving') : t('saveChanges')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Description */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">{t('description')}</h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {ticket.description || t('noDescription')}
              </p>
            </div>

            {/* Metadata */}
            {ticket.metadata && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-white mb-2">{t('additionalInfo')}</h4>
                <pre className="text-xs text-muted-foreground bg-black/20 p-3 rounded-lg overflow-auto">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(ticket.metadata as string), null, 2);
                    } catch {
                      return ticket.metadata;
                    }
                  })()}
                </pre>
              </div>
            )}
          </div>

          {/* Resolution */}
          {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' || resolution) && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                {t('resolution')}
              </h3>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder={t('resolutionPlaceholder')}
                rows={4}
                className="input-rc"
              />
            </div>
          )}

          {/* Comments */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {t('comments')} ({ticket.comments.length})
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
                            {t('adminBadge')}
                          </span>
                        )}
                        {comment.isInternal && (
                          <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                            {t('internalBadge')}
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
                <p className="text-muted-foreground text-center py-4">{t('noComments')}</p>
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('writeComment')}
                rows={3}
                className="input-rc"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={isInternal}
                    onCheckedChange={(checked) => setIsInternal(checked === true)}
                  />
                  {t('internalNote')}
                </label>
                <button
                  type="submit"
                  disabled={addingComment || !newComment.trim()}
                  className="btn-primary flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {addingComment ? tCommon('sending') : tSupport('send')}
                </button>
              </div>
            </form>
          </div>

          {/* Activity Timeline */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {t('activity')}
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
                          {' '}<span className="text-white">{activity.oldValue}</span>
                          {' '}<span className="text-white">{activity.newValue}</span>
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
            <h3 className="text-lg font-semibold text-white mb-4">{t('information')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">{t('typeLabel')}</label>
                <div className="text-white">{typeLabels[ticket.type] || ticket.type}</div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">{tCommon('status')}</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">{tSupport('statusPending')}</SelectItem>
                    <SelectItem value="ASSIGNED">{tSupport('statusAssigned')}</SelectItem>
                    <SelectItem value="IN_PROGRESS">{tSupport('statusInProgress')}</SelectItem>
                    <SelectItem value="WAITING_CUSTOMER">{t('statusWaitingClient')}</SelectItem>
                    <SelectItem value="RESOLVED">{tSupport('statusResolved')}</SelectItem>
                    <SelectItem value="CLOSED">{tSupport('statusClosed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">{t('priority')}</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">{tSupport('priorityLow')}</SelectItem>
                    <SelectItem value="MEDIUM">{tSupport('priorityMedium')}</SelectItem>
                    <SelectItem value="HIGH">{tSupport('priorityHigh')}</SelectItem>
                    <SelectItem value="URGENT">{tSupport('priorityUrgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">{t('assignToLabel')}</label>
                <Select value={assignedToId} onValueChange={setAssignedToId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('unassigned')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('unassigned')}</SelectItem>
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
              {t('companyLabel')}
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
                {t('viewCompany')}
              </Link>
            </div>
          </div>

          {/* Requester Info */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('requester')}
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
              {t('dates')}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('createdAt')}</span>
                <span className="text-white">
                  {new Date(ticket.createdAt).toLocaleString('es')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('updatedAt')}</span>
                <span className="text-white">
                  {new Date(ticket.updatedAt).toLocaleString('es')}
                </span>
              </div>
              {ticket.resolvedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('resolvedAt')}</span>
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
