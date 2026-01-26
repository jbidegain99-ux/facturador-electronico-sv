'use client';

import { useState, useEffect } from 'react';
import {
  ScrollText,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Building,
  Activity,
  Clock,
  Eye,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
  tenantId: string | null;
  tenantNombre: string | null;
  action: string;
  module: string;
  description: string;
  entityType: string | null;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestPath: string | null;
  requestMethod: string | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  byAction: { action: string; count: number }[];
  byModule: { module: string; count: number }[];
  successRate: number;
  failureRate: number;
  recentActivity: any[];
}

const actionOptions = [
  'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW',
  'EXPORT', 'IMPORT', 'UPLOAD', 'DOWNLOAD', 'SEND', 'SIGN', 'TRANSMIT', 'CONFIG_CHANGE',
];

const moduleOptions = [
  'AUTH', 'TENANT', 'USER', 'DTE', 'CLIENTE',
  'CERTIFICATE', 'EMAIL_CONFIG', 'SETTINGS', 'SUPPORT', 'ADMIN',
];

const actionColors: Record<string, string> = {
  LOGIN: 'bg-green-500/20 text-green-400',
  LOGOUT: 'bg-gray-500/20 text-gray-400',
  CREATE: 'bg-blue-500/20 text-blue-400',
  UPDATE: 'bg-yellow-500/20 text-yellow-400',
  DELETE: 'bg-red-500/20 text-red-400',
  VIEW: 'bg-purple-500/20 text-purple-400',
  EXPORT: 'bg-cyan-500/20 text-cyan-400',
  IMPORT: 'bg-cyan-500/20 text-cyan-400',
  UPLOAD: 'bg-indigo-500/20 text-indigo-400',
  DOWNLOAD: 'bg-indigo-500/20 text-indigo-400',
  SEND: 'bg-orange-500/20 text-orange-400',
  SIGN: 'bg-pink-500/20 text-pink-400',
  TRANSMIT: 'bg-emerald-500/20 text-emerald-400',
  CONFIG_CHANGE: 'bg-amber-500/20 text-amber-400',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, search, actionFilter, moduleFilter, successFilter, startDate, endDate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/audit-logs/stats`,
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

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
      });

      if (search) params.append('search', search);
      if (actionFilter && actionFilter !== 'ALL') params.append('action', actionFilter);
      if (moduleFilter && moduleFilter !== 'ALL') params.append('module', moduleFilter);
      if (successFilter === 'true') params.append('success', 'true');
      if (successFilter === 'false') params.append('success', 'false');
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/audit-logs?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error('Error al cargar logs');

      const data = await res.json();
      setLogs(data.data);
      setTotalPages(data.meta.totalPages);
      setTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const clearFilters = () => {
    setSearch('');
    setActionFilter('');
    setModuleFilter('');
    setSuccessFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseJson = (value: string | null) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs de Auditoría</h1>
          <p className="text-muted-foreground mt-1">
            Monitorea la actividad del sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { fetchLogs(); fetchStats(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total eventos</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.successRate}</div>
                <div className="text-sm text-muted-foreground">Exitosos</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.failureRate}</div>
                <div className="text-sm text-muted-foreground">Con errores</div>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ScrollText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.byModule.length}</div>
                <div className="text-sm text-muted-foreground">Módulos activos</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="glass-card p-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="input-rc pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Acción</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas</SelectItem>
                    {actionOptions.map((action) => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Módulo</label>
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    {moduleOptions.map((mod) => (
                      <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Estado</label>
                <Select value={successFilter} onValueChange={setSuccessFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="true">Exitosos</SelectItem>
                    <SelectItem value="false">Con errores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Desde</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-rc"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Hasta</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-rc"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit">Buscar</Button>
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Limpiar
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Logs Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Sin logs</h3>
            <p className="text-muted-foreground">
              No hay logs de auditoría que coincidan con los filtros.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-rc w-full">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Módulo</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {log.userName ? (
                            <>
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm text-white">{log.userName}</div>
                                <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Sistema</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-gray-500/20 text-gray-400'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="text-sm">{log.module}</td>
                      <td className="max-w-xs">
                        <div className="text-sm truncate" title={log.description}>
                          {log.description}
                        </div>
                        {log.tenantNombre && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building className="w-3 h-3" />
                            {log.tenantNombre}
                          </div>
                        )}
                      </td>
                      <td>
                        {log.success ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Mostrando {logs.length} de {total} registros
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Log</DialogTitle>
            <DialogDescription>
              {selectedLog && formatDate(selectedLog.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Acción</label>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[selectedLog.action] || 'bg-gray-500/20 text-gray-400'}`}>
                      {selectedLog.action}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Módulo</label>
                  <div className="text-white mt-1">{selectedLog.module}</div>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Descripción</label>
                <div className="text-white mt-1">{selectedLog.description}</div>
              </div>

              {(selectedLog.userName || selectedLog.userEmail) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Usuario</label>
                    <div className="text-white mt-1">{selectedLog.userName}</div>
                    <div className="text-sm text-muted-foreground">{selectedLog.userEmail}</div>
                  </div>
                  {selectedLog.userRole && (
                    <div>
                      <label className="text-sm text-muted-foreground">Rol</label>
                      <div className="text-white mt-1">{selectedLog.userRole}</div>
                    </div>
                  )}
                </div>
              )}

              {selectedLog.tenantNombre && (
                <div>
                  <label className="text-sm text-muted-foreground">Tenant</label>
                  <div className="text-white mt-1">{selectedLog.tenantNombre}</div>
                </div>
              )}

              {(selectedLog.entityType || selectedLog.entityId) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.entityType && (
                    <div>
                      <label className="text-sm text-muted-foreground">Tipo de Entidad</label>
                      <div className="text-white mt-1">{selectedLog.entityType}</div>
                    </div>
                  )}
                  {selectedLog.entityId && (
                    <div>
                      <label className="text-sm text-muted-foreground">ID de Entidad</label>
                      <div className="text-white mt-1 font-mono text-sm">{selectedLog.entityId}</div>
                    </div>
                  )}
                </div>
              )}

              {selectedLog.ipAddress && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">IP Address</label>
                    <div className="text-white mt-1 font-mono text-sm">{selectedLog.ipAddress}</div>
                  </div>
                  {selectedLog.requestMethod && (
                    <div>
                      <label className="text-sm text-muted-foreground">Método</label>
                      <div className="text-white mt-1">{selectedLog.requestMethod} {selectedLog.requestPath}</div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm text-muted-foreground">Estado</label>
                <div className="flex items-center gap-2 mt-1">
                  {selectedLog.success ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Exitoso</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400">Error</span>
                    </>
                  )}
                </div>
                {selectedLog.errorMessage && (
                  <div className="mt-2 p-2 bg-red-500/10 rounded text-sm text-red-400">
                    {selectedLog.errorMessage}
                  </div>
                )}
              </div>

              {selectedLog.oldValue && (
                <div>
                  <label className="text-sm text-muted-foreground">Valor Anterior</label>
                  <pre className="mt-1 p-2 bg-white/5 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(parseJson(selectedLog.oldValue), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <label className="text-sm text-muted-foreground">Valor Nuevo</label>
                  <pre className="mt-1 p-2 bg-white/5 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(parseJson(selectedLog.newValue), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <label className="text-sm text-muted-foreground">Metadata</label>
                  <pre className="mt-1 p-2 bg-white/5 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(parseJson(selectedLog.metadata), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
