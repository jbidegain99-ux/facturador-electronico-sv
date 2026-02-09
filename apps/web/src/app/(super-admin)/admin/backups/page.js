'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BackupsPage;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const toast_1 = require("@/components/ui/toast");
function BackupsPage() {
    const { success, error: showError } = (0, toast_1.useToast)();
    const [loading, setLoading] = React.useState(true);
    const [generating, setGenerating] = React.useState(null);
    const [stats, setStats] = React.useState(null);
    const [summary, setSummary] = React.useState(null);
    const [tenants, setTenants] = React.useState([]);
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
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/backups/stats`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/backups/summary`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants?limit=100`, { headers }),
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
        }
        catch (err) {
            console.error('Error loading backup data:', err);
            showError('Error al cargar datos de backup');
        }
        finally {
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/backups/generate/full`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
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
            success('El backup se ha descargado exitosamente');
        }
        catch (err) {
            showError('Error al generar backup del sistema');
        }
        finally {
            setGenerating(null);
        }
    };
    const handleGenerateTenantBackup = async (tenantId, tenantName) => {
        setGenerating(tenantId);
        try {
            const token = getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/backups/generate/tenant/${tenantId}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
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
            success(`Backup de ${tenantName} descargado exitosamente`);
        }
        catch (err) {
            showError('Error al generar backup del tenant');
        }
        finally {
            setGenerating(null);
        }
    };
    if (loading) {
        return (<div className="flex items-center justify-center min-h-[400px]">
        <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backups</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de copias de seguridad del sistema
          </p>
        </div>
        <button_1.Button onClick={loadData} variant="outline">
          <lucide_react_1.RefreshCw className="h-4 w-4 mr-2"/>
          Actualizar
        </button_1.Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <lucide_react_1.Building2 className="h-6 w-6 text-blue-400"/>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Empresas</p>
                <p className="text-2xl font-bold">{stats?.totalTenants || 0}</p>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <lucide_react_1.Users className="h-6 w-6 text-green-400"/>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuarios</p>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <lucide_react_1.FileText className="h-6 w-6 text-purple-400"/>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">DTEs</p>
                <p className="text-2xl font-bold">{stats?.totalDtes || 0}</p>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <lucide_react_1.Database className="h-6 w-6 text-orange-400"/>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tamaño Est.</p>
                <p className="text-2xl font-bold">{summary?.estimatedSizeMB || 0} MB</p>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* Full System Backup */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2">
            <lucide_react_1.HardDrive className="h-5 w-5 text-primary"/>
            Backup Completo del Sistema
          </card_1.CardTitle>
          <card_1.CardDescription>
            Genera y descarga una copia de seguridad de todos los datos del sistema
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Backup Completo</p>
              <p className="text-sm text-muted-foreground">
                Incluye: {stats?.totalTenants || 0} empresas, {stats?.totalUsers || 0} usuarios,{' '}
                {stats?.totalDtes || 0} DTEs, {stats?.totalClientes || 0} clientes
              </p>
            </div>
            <button_1.Button onClick={handleGenerateFullBackup} disabled={generating === 'full'}>
              {generating === 'full' ? (<>
                  <lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                  Generando...
                </>) : (<>
                  <lucide_react_1.Download className="h-4 w-4 mr-2"/>
                  Descargar Backup
                </>)}
            </button_1.Button>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Tenant Backups */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2">
            <lucide_react_1.Building2 className="h-5 w-5 text-primary"/>
            Backup por Empresa
          </card_1.CardTitle>
          <card_1.CardDescription>
            Genera copias de seguridad individuales para cada empresa
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          {tenants.length === 0 ? (<div className="text-center py-8 text-muted-foreground">
              No hay empresas registradas
            </div>) : (<div className="space-y-2">
              {tenants.map((tenant) => (<div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div>
                    <p className="font-medium">{tenant.nombre}</p>
                    <p className="text-sm text-muted-foreground">NIT: {tenant.nit}</p>
                  </div>
                  <button_1.Button variant="outline" size="sm" onClick={() => handleGenerateTenantBackup(tenant.id, tenant.nombre)} disabled={generating === tenant.id}>
                    {generating === tenant.id ? (<>
                        <lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                        Generando...
                      </>) : (<>
                        <lucide_react_1.Download className="h-4 w-4 mr-2"/>
                        Descargar
                      </>)}
                  </button_1.Button>
                </div>))}
            </div>)}
        </card_1.CardContent>
      </card_1.Card>

      {/* System Status */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2">
            <lucide_react_1.Shield className="h-5 w-5 text-primary"/>
            Estado del Sistema
          </card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <lucide_react_1.CheckCircle className="h-4 w-4 text-green-500"/>
                <span className="text-sm font-medium">Estado</span>
              </div>
              <p className="text-lg font-semibold text-green-500 capitalize">
                {stats?.systemStatus || 'Healthy'}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <lucide_react_1.Clock className="h-4 w-4 text-muted-foreground"/>
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
                <lucide_react_1.Database className="h-4 w-4 text-muted-foreground"/>
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
        </card_1.CardContent>
      </card_1.Card>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
        <lucide_react_1.AlertCircle className="h-5 w-5 text-blue-400 mt-0.5"/>
        <div>
          <p className="font-medium text-blue-400">Nota sobre los backups</p>
          <p className="text-sm text-muted-foreground mt-1">
            Los backups descargados contienen datos en formato JSON. Para una restauración completa,
            contacte al equipo de soporte técnico. Los datos sensibles como contraseñas y claves API
            no se incluyen en los backups por seguridad.
          </p>
        </div>
      </div>
    </div>);
}
