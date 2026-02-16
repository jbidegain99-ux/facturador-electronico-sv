'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Building2,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Pause,
  Play,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface Tenant {
  id: string;
  nombre: string;
  nit: string;
  correo: string;
  plan: string;
  planStatus: string;
  createdAt: string;
  _count: {
    usuarios: number;
    dtes: number;
  };
}

interface TenantsResponse {
  data: Tenant[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function TenantsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
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

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(t('loadError'));
      }

      const data: TenantsResponse = await res.json();
      setTenants(data.data);
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
    fetchTenants();
  };

  const handleSuspend = async (id: string) => {
    if (!confirm(t('suspendConfirm'))) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants/${id}/suspend`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: t('suspendedByAdmin') }),
        }
      );

      if (!res.ok) throw new Error(t('suspendError'));
      fetchTenants();
    } catch (err) {
      alert(t('suspendError'));
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants/${id}/activate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error(t('activateError'));
      fetchTenants();
    } catch (err) {
      alert(t('activateError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteCompanyConfirm'))) return;
    if (!confirm(t('deleteCompanyFinal'))) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error(t('deleteError'));
      fetchTenants();
    } catch (err) {
      alert(t('deleteError'));
    }
  };

  const getPlanBadge = (plan: string) => {
    const badges: Record<string, string> = {
      TRIAL: 'badge-info',
      BASIC: 'badge-warning',
      PRO: 'badge-success',
      ENTERPRISE: 'bg-purple-500/20 text-purple-400',
    };
    return badges[plan] || 'badge-info';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      ACTIVE: 'badge-success',
      SUSPENDED: 'badge-error',
      CANCELLED: 'badge-warning',
      EXPIRED: 'badge-error',
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('companies')}</h1>
          <p className="text-muted-foreground mt-1">{t('companiesSubtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('searchCompanies')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-rc pl-10"
              />
            </div>
          </div>
          <Select
            value={planFilter}
            onValueChange={(value) => {
              setPlanFilter(value === 'ALL' ? '' : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('allPlans')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('allPlans')}</SelectItem>
              <SelectItem value="TRIAL">{t('planTrial')}</SelectItem>
              <SelectItem value="BASIC">{t('planBasic')}</SelectItem>
              <SelectItem value="PRO">{t('planPro')}</SelectItem>
              <SelectItem value="ENTERPRISE">{t('planEnterprise')}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value === 'ALL' ? '' : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('allStatuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('allStatuses')}</SelectItem>
              <SelectItem value="ACTIVE">{t('statusActive')}</SelectItem>
              <SelectItem value="SUSPENDED">{t('statusSuspended')}</SelectItem>
              <SelectItem value="CANCELLED">{t('statusCancelled')}</SelectItem>
              <SelectItem value="EXPIRED">{t('statusExpired')}</SelectItem>
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
            <div className="overflow-x-auto overflow-y-visible">
              <table className="table-rc w-full">
                <thead>
                  <tr>
                    <th>{t('company')}</th>
                    <th>NIT</th>
                    <th>{t('plan')}</th>
                    <th>{tCommon('status')}</th>
                    <th>{t('users')}</th>
                    <th>{t('dtes')}</th>
                    <th>{t('registration')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id}>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" sideOffset={5}>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              {tCommon('viewDetails')}
                            </DropdownMenuItem>
                            {tenant.planStatus === 'ACTIVE' ? (
                              <DropdownMenuItem
                                onClick={() => handleSuspend(tenant.id)}
                                className="text-yellow-600 dark:text-yellow-400"
                              >
                                <Pause className="w-4 h-4 mr-2" />
                                {t('suspend')}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleActivate(tenant.id)}
                                className="text-green-600 dark:text-green-400"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                {t('activate')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(tenant.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {tCommon('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">
                        {t('noCompanies')}
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
