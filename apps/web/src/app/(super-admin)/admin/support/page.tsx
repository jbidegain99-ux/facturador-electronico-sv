'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Ticket,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle,
  User,
  Building2,
  MessageSquare,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  type: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  tenant: {
    id: string;
    nombre: string;
    nit: string;
  };
  requester: {
    nombre: string;
    email: string;
  };
  assignedTo: {
    id: string;
    nombre: string;
  } | null;
  _count: {
    comments: number;
  };
}

interface TicketStats {
  pending: number;
  assigned: number;
  inProgress: number;
  waitingCustomer: number;
  resolved: number;
  closed: number;
  total: number;
  open: number;
}

interface TicketsResponse {
  data: SupportTicket[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function SupportTicketsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tSupport = useTranslations('support');
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter, priorityFilter, typeFilter, activeTab]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/support-tickets/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      let status = statusFilter;
      if (activeTab === 'pending') status = 'PENDING';
      else if (activeTab === 'in_progress') status = 'IN_PROGRESS';
      else if (activeTab === 'resolved') status = 'RESOLVED';

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(search && { search }),
        ...(status && { status }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(typeFilter && { type: typeFilter }),
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/support-tickets?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(t('loadTicketsError'));
      }

      const data: TicketsResponse = await res.json();
      setTickets(data.data);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
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

  const getTypeBadge = (type: string) => {
    const badges: Record<string, string> = {
      EMAIL_CONFIG: 'bg-cyan-500/20 text-cyan-400',
      TECHNICAL: 'bg-violet-500/20 text-violet-400',
      BILLING: 'bg-emerald-500/20 text-emerald-400',
      GENERAL: 'bg-slate-500/20 text-slate-400',
      ONBOARDING: 'bg-amber-500/20 text-amber-400',
    };
    return badges[type] || 'bg-gray-500/20 text-gray-400';
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('supportTitle')}</h1>
          <p className="text-muted-foreground mt-1">{t('supportSubtitle')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">{tSupport('statsPending')}</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.inProgress}</div>
                <div className="text-sm text-muted-foreground">{tSupport('statsInProgress')}</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.resolved}</div>
                <div className="text-sm text-muted-foreground">{tSupport('statsResolved')}</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-muted-foreground">{t('totalLabel')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="all">{tSupport('tabAll')}</TabsTrigger>
          <TabsTrigger value="pending">
            {tSupport('tabPending')} {stats && stats.pending > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">{stats.pending}</span>}
          </TabsTrigger>
          <TabsTrigger value="in_progress">{tSupport('tabInProgress')}</TabsTrigger>
          <TabsTrigger value="resolved">{tSupport('tabResolved')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="glass-card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('searchTickets')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-rc pl-10"
              />
            </div>
          </div>
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value === 'ALL' ? '' : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={tCommon('type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('allTypes')}</SelectItem>
              <SelectItem value="EMAIL_CONFIG">{tSupport('typeEmail')}</SelectItem>
              <SelectItem value="TECHNICAL">{tSupport('typeTechnical')}</SelectItem>
              <SelectItem value="BILLING">{tSupport('typeBilling')}</SelectItem>
              <SelectItem value="GENERAL">{tSupport('typeGeneral')}</SelectItem>
              <SelectItem value="ONBOARDING">{tSupport('typeOnboarding')}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(value) => {
              setPriorityFilter(value === 'ALL' ? '' : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={tSupport('priorityLabel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('allPriorities')}</SelectItem>
              <SelectItem value="LOW">{tSupport('priorityLow')}</SelectItem>
              <SelectItem value="MEDIUM">{tSupport('priorityMedium')}</SelectItem>
              <SelectItem value="HIGH">{tSupport('priorityHigh')}</SelectItem>
              <SelectItem value="URGENT">{tSupport('priorityUrgent')}</SelectItem>
            </SelectContent>
          </Select>
          <button type="submit" className="btn-primary">
            <Filter className="w-4 h-4" />
            {tCommon('filter')}
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="glass-card overflow-visible">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-rc w-full">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('company')}</th>
                    <th>{tCommon('type')}</th>
                    <th>{t('subject')}</th>
                    <th>{tCommon('status')}</th>
                    <th>{t('priority')}</th>
                    <th>{t('assignedTo')}</th>
                    <th>{t('dateLabel')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="cursor-pointer hover:bg-white/5"
                      onClick={() => router.push(`/admin/support/${ticket.id}`)}
                    >
                      <td className="font-mono text-sm">{ticket.ticketNumber}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
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
                        {ticket._count.comments > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MessageSquare className="w-3 h-3" />
                            {ticket._count.comments}
                          </div>
                        )}
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
                        {ticket.assignedTo ? (
                          <span className="text-sm">{ticket.assignedTo.nombre}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">{t('unassigned')}</span>
                        )}
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString('es', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </td>
                      <td>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-muted-foreground">
                        {t('noTickets')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  {tCommon('page', { page, totalPages })}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
