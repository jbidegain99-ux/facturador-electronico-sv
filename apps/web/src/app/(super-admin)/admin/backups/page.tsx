'use client';

import * as React from 'react';
import {
  HardDrive,
  Clock,
  CheckCircle,
  Download,
  RefreshCw,
  Database,
  Shield,
  Users,
  FileText,
  Building2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface BackupStats {
  totalTenants: number;
  totalUsers: number;
  totalDtes: number;
  totalClientes: number;
  lastBackupDate: string | null;
  systemStatus: 'healthy' | 'warning' | 'error';
}

interface DataSummary {
  counts: {
    tenants: number;
    users: number;
    dtes: number;
    clientes: number;
  };
  dtesByStatus: { status: string; count: number }[];
  tenantsByPlan: { plan: string; count: number }[];
  estimatedSizeKB: number;
  estimatedSizeMB: number;
}

interface Tenant {
  id: string;
  nombre: string;
  nit: string;
}

export default function BackupsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<BackupStats | null>(null);
  const [summary, setSummary] = React.useState<DataSummary | null>(null);
  const [tenants, setTenants] = React.useState<Tenant[]>([]);

  const getToken = () => localStorage.getItem('token');

  const loadData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [statsRes, summaryRes, tenantsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/backups/stats`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/backups/summary`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/super-admin/tenants?limit=100`, { headers }),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      }
      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        setTenants(tenantsData.data || []);
      }
    } catch (error) {
      console.error('Error loading backup data:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar datos de backup',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleGenerateFullBackup = async () => {
    setGenerating('full');
    try {
      const token = getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/backups/generate/full`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error('Error al generar backup');
      }

      // Download the file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-full-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Backup generado',
        description: 'El backup se ha descargado exitosamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al generar backup del sistema',
        variant: 'destructive',
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateTenantBackup = async (tenantId: string, tenantName: string) => {
    setGenerating(tenantId);
    try {
      const token = getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/backups/generate/tenant/${tenantId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error('Error al generar backup');
      }

      // Download the file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${tenantName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Backup generado',
        description: `Backup de ${tenantName} descargado exitosamente`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al generar backup del tenant',
        variant: 'destructive',
      });
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backups</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de copias de seguridad del sistema
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Building2 className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Empresas</p>
                <p className="text-2xl font-bold">{stats?.totalTenants || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuarios</p>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <FileText className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">DTEs</p>
                <p className="text-2xl font-bold">{stats?.totalDtes || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Database className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tamaño Est.</p>
                <p className="text-2xl font-bold">{summary?.estimatedSizeMB || 0} MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full System Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            Backup Completo del Sistema
          </CardTitle>
          <CardDescription>
            Genera y descarga una copia de seguridad de todos los datos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Backup Completo</p>
              <p className="text-sm text-muted-foreground">
                Incluye: {stats?.totalTenants || 0} empresas, {stats?.totalUsers || 0} usuarios,{' '}
                {stats?.totalDtes || 0} DTEs, {stats?.totalClientes || 0} clientes
              </p>
            </div>
            <Button
              onClick={handleGenerateFullBackup}
              disabled={generating === 'full'}
            >
              {generating === 'full' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Backup
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Backup por Empresa
          </CardTitle>
          <CardDescription>
            Genera copias de seguridad individuales para cada empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay empresas registradas
            </div>
          ) : (
            <div className="space-y-2">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{tenant.nombre}</p>
                    <p className="text-sm text-muted-foreground">NIT: {tenant.nit}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateTenantBackup(tenant.id, tenant.nombre)}
                    disabled={generating === tenant.id}
                  >
                    {generating === tenant.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Estado</span>
              </div>
              <p className="text-lg font-semibold text-green-500 capitalize">
                {stats?.systemStatus || 'Healthy'}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Último Backup</span>
              </div>
              <p className="text-lg">
                {stats?.lastBackupDate
                  ? new Date(stats.lastBackupDate).toLocaleDateString()
                  : 'No registrado'}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Registros Totales</span>
              </div>
              <p className="text-lg">
                {(summary?.counts?.tenants || 0) +
                  (summary?.counts?.users || 0) +
                  (summary?.counts?.dtes || 0) +
                  (summary?.counts?.clientes || 0)}{' '}
                registros
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
        <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
        <div>
          <p className="font-medium text-blue-400">Nota sobre los backups</p>
          <p className="text-sm text-muted-foreground mt-1">
            Los backups descargados contienen datos en formato JSON. Para una restauración completa,
            contacte al equipo de soporte técnico. Los datos sensibles como contraseñas y claves API
            no se incluyen en los backups por seguridad.
          </p>
        </div>
      </div>
    </div>
  );
}
