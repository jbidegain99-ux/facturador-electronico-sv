'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  trialTenants: number;
  totalUsers: number;
  totalDtes: number;
  dtesThisMonth: number;
  dtesByStatus: { status: string; count: number }[];
  tenantsByPlan: { plan: string; count: number }[];
  last7Days: { date: string; count: number }[];
}

export default function AdminDashboardPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(t('statsError'));
      }

      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROCESADO':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PENDIENTE':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'RECHAZADO':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'TRIAL':
        return 'badge-info';
      case 'BASIC':
        return 'badge-warning';
      case 'PROFESSIONAL':
        return 'badge-success';
      case 'ENTERPRISE':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'badge-info';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400">{error}</p>
        <button onClick={fetchStats} className="btn-primary mt-4">
          {tCommon('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">{t('dashboard')}</h1>
        <p className="text-muted-foreground mt-1">{t('dashboardSubtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('totalCompanies')}</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalTenants || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-sm">
            <span className="text-green-500">{stats?.activeTenants || 0} {t('activeLabel')}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-red-500">{stats?.suspendedTenants || 0} {t('suspendedLabel')}</span>
          </div>
        </div>

        <div className="glass-card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('totalUsers')}</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalUsers || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-sm text-muted-foreground">
            {t('registeredUsers')}
          </div>
        </div>

        <div className="glass-card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('totalDtes')}</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalDtes || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-sm">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
            <span className="text-green-500">{stats?.dtesThisMonth || 0}</span>
            <span className="text-muted-foreground">{t('thisMonth')}</span>
          </div>
        </div>

        <div className="glass-card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('inTrial')}</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.trialTenants || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-sm text-muted-foreground">
            {t('trialCompanies')}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DTEs by Status */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('dtesByStatus')}</h3>
          <div className="space-y-4">
            {stats?.dtesByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <span className="text-sm text-muted-foreground">{item.status}</span>
                </div>
                <span className="text-white font-medium">{item.count}</span>
              </div>
            ))}
            {(!stats?.dtesByStatus || stats.dtesByStatus.length === 0) && (
              <p className="text-muted-foreground text-sm">{t('noData')}</p>
            )}
          </div>
        </div>

        {/* Tenants by Plan */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('companiesByPlan')}</h3>
          <div className="space-y-4">
            {stats?.tenantsByPlan.map((item) => (
              <div key={item.plan} className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(item.plan)}`}>
                  {item.plan}
                </span>
                <span className="text-white font-medium">{item.count}</span>
              </div>
            ))}
            {(!stats?.tenantsByPlan || stats.tenantsByPlan.length === 0) && (
              <p className="text-muted-foreground text-sm">{t('noData')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Last 7 Days Chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('dtesLast7Days')}</h3>
        <div className="flex items-end justify-between h-40 gap-2">
          {stats?.last7Days.map((day, index) => {
            const maxCount = Math.max(...(stats?.last7Days.map(d => d.count) || [1]));
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs text-muted-foreground">{day.count}</div>
                <div
                  className="w-full rounded-t gradient-primary transition-all duration-300"
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
                <div className="text-xs text-muted-foreground">
                  {new Date(day.date).toLocaleDateString('es', { weekday: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/tenants" className="glass-card p-6 card-hover group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                {t('viewCompanies')}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('manageCompanies')}
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>

        <Link href="/admin/admins" className="glass-card p-6 card-hover group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                {t('administrators')}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('manageAdmins')}
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>

        <Link href="/admin/settings" className="glass-card p-6 card-hover group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                {t('systemSettings')}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('systemSettingsDesc')}
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
}
