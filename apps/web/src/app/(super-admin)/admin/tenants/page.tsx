'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

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
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/super-admin/tenants?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error('Error al cargar empresas');
      }

      const data: TenantsResponse = await res.json();
      setTenants(data.data);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
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
    if (!confirm('¿Estas seguro de suspender esta empresa?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/super-admin/tenants/${id}/suspend`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: 'Suspendido por administrador' }),
        }
      );

      if (!res.ok) throw new Error('Error al suspender');
      fetchTenants();
    } catch (err) {
      alert('Error al suspender la empresa');
    }
    setActiveMenu(null);
  };

  const handleActivate = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/super-admin/tenants/${id}/activate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error('Error al activar');
      fetchTenants();
    } catch (err) {
      alert('Error al activar la empresa');
    }
    setActiveMenu(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estas seguro de ELIMINAR esta empresa? Esta accion no se puede deshacer.')) return;
    if (!confirm('CONFIRMACION FINAL: Se eliminaran TODOS los datos de esta empresa incluyendo usuarios, clientes y DTEs.')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/super-admin/tenants/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error('Error al eliminar');
      fetchTenants();
    } catch (err) {
      alert('Error al eliminar la empresa');
    }
    setActiveMenu(null);
  };

  const getPlanBadge = (plan: string) => {
    const badges: Record<string, string> = {
      TRIAL: 'badge-info',
      BASIC: 'badge-warning',
      PROFESSIONAL: 'badge-success',
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
          <h1 className="text-3xl font-bold text-white">Empresas</h1>
          <p className="text-muted-foreground mt-1">Gestiona las empresas registradas</p>
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
                placeholder="Buscar por nombre, NIT o correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-rc pl-10"
              />
            </div>
          </div>
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="input-rc w-40"
          >
            <option value="">Todos los planes</option>
            <option value="TRIAL">Prueba</option>
            <option value="BASIC">Basico</option>
            <option value="PROFESSIONAL">Profesional</option>
            <option value="ENTERPRISE">Empresa</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input-rc w-40"
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="SUSPENDED">Suspendido</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="EXPIRED">Expirado</option>
          </select>
          <button type="submit" className="btn-primary">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
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
              <table className="table-rc">
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
                  {tenants.map((tenant) => (
                    <tr key={tenant.id}>
                      <td>
                        <div>
                          <div className="font-medium text-white">{tenant.nombre}</div>
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
                        <div className="relative">
                          <button
                            onClick={() => setActiveMenu(activeMenu === tenant.id ? null : tenant.id)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                          {activeMenu === tenant.id && (
                            <div className="absolute right-0 mt-2 w-48 glass-card py-2 z-10">
                              <Link
                                href={`/admin/tenants/${tenant.id}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-white hover:bg-white/5"
                              >
                                <Eye className="w-4 h-4" />
                                Ver Detalles
                              </Link>
                              {tenant.planStatus === 'ACTIVE' ? (
                                <button
                                  onClick={() => handleSuspend(tenant.id)}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/10 w-full"
                                >
                                  <Pause className="w-4 h-4" />
                                  Suspender
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivate(tenant.id)}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-green-400 hover:bg-green-500/10 w-full"
                                >
                                  <Play className="w-4 h-4" />
                                  Activar
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(tenant.id)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 w-full"
                              >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">
                        No se encontraron empresas
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
                  Pagina {page} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
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
