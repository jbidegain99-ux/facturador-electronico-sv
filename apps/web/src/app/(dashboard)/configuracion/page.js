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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ConfiguracionPage;
const React = __importStar(require("react"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const badge_1 = require("@/components/ui/badge");
const store_1 = require("@/store");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
function ConfiguracionPage() {
    const { tenant, setTenant } = (0, store_1.useAppStore)();
    const [certificateStatus, setCertificateStatus] = React.useState('not_loaded');
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [success, setSuccess] = React.useState(null);
    const [demoMode, setDemoMode] = React.useState(false);
    const [togglingDemo, setTogglingDemo] = React.useState(false);
    // Form state
    const [formData, setFormData] = React.useState({
        nombre: '',
        nit: '',
        nrc: '',
        correo: '',
        telefono: '',
        direccion: { departamento: '', municipio: '', complemento: '' },
    });
    // Load tenant data and demo status on mount
    React.useEffect(() => {
        const loadData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No hay sesion activa');
                setLoading(false);
                return;
            }
            try {
                // Fetch tenant data and onboarding status in parallel
                const [tenantRes, statusRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/me/onboarding-status`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }),
                ]);
                if (!tenantRes.ok) {
                    const errorData = await tenantRes.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Error al cargar datos');
                }
                const data = await tenantRes.json();
                setFormData({
                    nombre: data.nombre || '',
                    nit: data.nit || '',
                    nrc: data.nrc || '',
                    correo: data.correo || '',
                    telefono: data.telefono || '',
                    direccion: data.direccion || { departamento: '', municipio: '', complemento: '' },
                });
                setTenant(data);
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    setDemoMode(statusData.demoMode || false);
                    if (statusData.hasCertificate && !statusData.demoMode) {
                        setCertificateStatus('loaded');
                    }
                }
            }
            catch (err) {
                console.error('Error loading tenant:', err);
                setError(err instanceof Error ? err.message : 'Error al cargar configuracion');
            }
            finally {
                setLoading(false);
            }
        };
        loadData();
    }, [setTenant]);
    const toggleDemoMode = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No hay sesion activa');
            return;
        }
        setTogglingDemo(true);
        setError(null);
        try {
            const endpoint = demoMode
                ? `${process.env.NEXT_PUBLIC_API_URL}/tenants/me/disable-demo`
                : `${process.env.NEXT_PUBLIC_API_URL}/tenants/me/onboarding-skip`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al cambiar modo demo');
            }
            const data = await res.json();
            setDemoMode(data.demoMode);
            setSuccess(data.message);
        }
        catch (err) {
            console.error('Error toggling demo mode:', err);
            setError(err instanceof Error ? err.message : 'Error al cambiar modo demo');
        }
        finally {
            setTogglingDemo(false);
        }
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
        setSuccess(null);
    };
    const handleDireccionChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            direccion: { ...prev.direccion, [field]: value },
        }));
        setError(null);
        setSuccess(null);
    };
    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No hay sesion activa');
            return;
        }
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/me`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    nrc: formData.nrc,
                    correo: formData.correo,
                    telefono: formData.telefono,
                    direccion: formData.direccion,
                }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al guardar');
            }
            const updatedTenant = await res.json();
            setTenant(updatedTenant);
            setSuccess('Configuracion guardada exitosamente');
        }
        catch (err) {
            console.error('Error saving tenant:', err);
            setError(err instanceof Error ? err.message : 'Error al guardar configuracion');
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (<div className="flex items-center justify-center min-h-[400px]">
        <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Configura los datos de tu empresa y credenciales del MH
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>)}
      {success && (<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>)}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos Empresa */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Building2 className="h-5 w-5"/>
              Datos de la Empresa
            </card_1.CardTitle>
            <card_1.CardDescription>
              Informacion del emisor para los documentos tributarios
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre / Razon Social</label>
              <input_1.Input placeholder="Mi Empresa S.A. de C.V." value={formData.nombre || ''} onChange={(e) => handleInputChange('nombre', e.target.value)}/>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">NIT</label>
                <input_1.Input placeholder="0000-000000-000-0" value={formData.nit || ''} disabled className="bg-muted"/>
                <p className="text-xs text-muted-foreground">El NIT no se puede modificar</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">NRC</label>
                <input_1.Input placeholder="000000-0" value={formData.nrc || ''} onChange={(e) => handleInputChange('nrc', e.target.value)}/>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo Electronico</label>
              <input_1.Input type="email" placeholder="facturacion@empresa.com" value={formData.correo || ''} onChange={(e) => handleInputChange('correo', e.target.value)}/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefono</label>
              <input_1.Input placeholder="0000-0000" value={formData.telefono || ''} onChange={(e) => handleInputChange('telefono', e.target.value)}/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Direccion</label>
              <input_1.Input placeholder="Direccion completa del establecimiento" value={formData.direccion?.complemento || ''} onChange={(e) => handleDireccionChange('complemento', e.target.value)}/>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Credenciales MH */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Key className="h-5 w-5"/>
              Credenciales del MH
            </card_1.CardTitle>
            <card_1.CardDescription>
              Credenciales para autenticacion con el Ministerio de Hacienda
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">NIT (Usuario)</label>
              <input_1.Input placeholder="0000000000000"/>
              <p className="text-xs text-muted-foreground">NIT sin guiones</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password Privado</label>
              <input_1.Input type="password" placeholder="********"/>
              <p className="text-xs text-muted-foreground">
                Contraseña proporcionada por el MH
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ambiente</label>
              <div className="flex gap-2">
                <button_1.Button variant="outline" className="flex-1">
                  Pruebas
                </button_1.Button>
                <button_1.Button variant="default" className="flex-1">
                  Produccion
                </button_1.Button>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Certificado Digital */}
        <card_1.Card className="lg:col-span-2">
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Upload className="h-5 w-5"/>
              Certificado Digital
            </card_1.CardTitle>
            <card_1.CardDescription>
              Certificado .p12 para firma de documentos electronicos
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                {certificateStatus === 'loaded' ? (<>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <lucide_react_1.CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400"/>
                    </div>
                    <div>
                      <p className="font-medium">Certificado cargado</p>
                      <p className="text-sm text-muted-foreground">
                        certificado.p12 - Valido hasta: 31/12/2025
                      </p>
                    </div>
                  </>) : (<>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                      <lucide_react_1.AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400"/>
                    </div>
                    <div>
                      <p className="font-medium">Sin certificado</p>
                      <p className="text-sm text-muted-foreground">
                        Sube tu certificado .p12 para poder firmar documentos
                      </p>
                    </div>
                  </>)}
              </div>
              <div className="flex gap-2">
                <input_1.Input type="file" accept=".p12,.pfx" className="hidden" id="certificate-upload" onChange={() => setCertificateStatus('loaded')}/>
                <label htmlFor="certificate-upload">
                  <button_1.Button variant="outline" asChild>
                    <span>
                      <lucide_react_1.Upload className="mr-2 h-4 w-4"/>
                      Subir Certificado
                    </span>
                  </button_1.Button>
                </label>
              </div>
            </div>
            {certificateStatus === 'not_loaded' && (<div className="mt-4 space-y-2">
                <label className="text-sm font-medium">Contraseña del Certificado</label>
                <input_1.Input type="password" placeholder="********"/>
              </div>)}
          </card_1.CardContent>
        </card_1.Card>

        {/* Email Configuration Link */}
        <card_1.Card className="lg:col-span-2">
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Mail className="h-5 w-5"/>
              Configuracion de Email
            </card_1.CardTitle>
            <card_1.CardDescription>
              Configura el servicio de email para enviar facturas y DTEs a tus clientes
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <link_1.default href="/configuracion/email">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <lucide_react_1.Mail className="h-6 w-6 text-primary"/>
                  </div>
                  <div>
                    <p className="font-medium">Servicio de Email</p>
                    <p className="text-sm text-muted-foreground">
                      SendGrid, Mailgun, Amazon SES, Microsoft 365, Gmail y mas
                    </p>
                  </div>
                </div>
                <lucide_react_1.ChevronRight className="h-5 w-5 text-muted-foreground"/>
              </div>
            </link_1.default>
          </card_1.CardContent>
        </card_1.Card>

        {/* Hacienda Configuration Link */}
        <card_1.Card className="lg:col-span-2 border-primary/30">
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Building2 className="h-5 w-5 text-primary"/>
              Configuracion de Hacienda
              <badge_1.Badge className="ml-2 bg-primary/10 text-primary border-primary/20">Nuevo</badge_1.Badge>
            </card_1.CardTitle>
            <card_1.CardDescription>
              Configure su integracion con el Ministerio de Hacienda y ejecute las pruebas de acreditacion
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <link_1.default href="/configuracion/hacienda">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-primary/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <lucide_react_1.Building2 className="h-6 w-6 text-primary"/>
                  </div>
                  <div>
                    <p className="font-medium">Centro de Configuracion y Pruebas</p>
                    <p className="text-sm text-muted-foreground">
                      Certificados, credenciales API, ambiente de pruebas y produccion
                    </p>
                  </div>
                </div>
                <lucide_react_1.ChevronRight className="h-5 w-5 text-muted-foreground"/>
              </div>
            </link_1.default>
          </card_1.CardContent>
        </card_1.Card>

        {/* Hacienda Onboarding Link */}
        <card_1.Card className="lg:col-span-2">
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Rocket className="h-5 w-5"/>
              Habilitacion con Hacienda
            </card_1.CardTitle>
            <card_1.CardDescription>
              Proceso guiado para convertirse en emisor autorizado de DTE
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <link_1.default href="/onboarding-hacienda">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <lucide_react_1.Rocket className="h-6 w-6 text-primary"/>
                  </div>
                  <div>
                    <p className="font-medium">Wizard de Onboarding</p>
                    <p className="text-sm text-muted-foreground">
                      13 pasos para habilitarse como emisor de documentos electronicos
                    </p>
                  </div>
                </div>
                <lucide_react_1.ChevronRight className="h-5 w-5 text-muted-foreground"/>
              </div>
            </link_1.default>
          </card_1.CardContent>
        </card_1.Card>

        {/* Data Migration Link */}
        <card_1.Card className="lg:col-span-2">
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.FileUp className="h-5 w-5"/>
              Migracion de Datos
            </card_1.CardTitle>
            <card_1.CardDescription>
              Importa clientes desde archivos CSV para migrar datos de otros sistemas
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <link_1.default href="/configuracion/migracion">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <lucide_react_1.FileUp className="h-6 w-6 text-primary"/>
                  </div>
                  <div>
                    <p className="font-medium">Importar Datos</p>
                    <p className="text-sm text-muted-foreground">
                      Carga clientes desde CSV para comenzar a facturar rapidamente
                    </p>
                  </div>
                </div>
                <lucide_react_1.ChevronRight className="h-5 w-5 text-muted-foreground"/>
              </div>
            </link_1.default>
          </card_1.CardContent>
        </card_1.Card>

        {/* Demo Mode Card */}
        <card_1.Card className={`lg:col-span-2 ${demoMode ? 'border-yellow-500/50' : ''}`}>
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Sparkles className={`h-5 w-5 ${demoMode ? 'text-yellow-500' : ''}`}/>
              Modo Demo
              {demoMode && (<badge_1.Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-500">
                  Activo
                </badge_1.Badge>)}
            </card_1.CardTitle>
            <card_1.CardDescription>
              Prueba la plataforma sin conectar con el Ministerio de Hacienda
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                {demoMode ? (<>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                      <lucide_react_1.Sparkles className="h-6 w-6 text-yellow-600 dark:text-yellow-400"/>
                    </div>
                    <div>
                      <p className="font-medium text-yellow-600 dark:text-yellow-400">Modo Demo Activo</p>
                      <p className="text-sm text-muted-foreground">
                        Las facturas se crean con datos simulados. No se envian a Hacienda.
                      </p>
                    </div>
                  </>) : (<>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <lucide_react_1.XCircle className="h-6 w-6 text-muted-foreground"/>
                    </div>
                    <div>
                      <p className="font-medium">Modo Demo Desactivado</p>
                      <p className="text-sm text-muted-foreground">
                        Las facturas se envian al Ministerio de Hacienda en modo produccion.
                      </p>
                    </div>
                  </>)}
              </div>
              <button_1.Button variant={demoMode ? 'destructive' : 'outline'} onClick={toggleDemoMode} disabled={togglingDemo} className={!demoMode ? 'border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' : ''}>
                {togglingDemo ? (<lucide_react_1.Loader2 className="h-4 w-4 animate-spin mr-2"/>) : demoMode ? (<lucide_react_1.XCircle className="h-4 w-4 mr-2"/>) : (<lucide_react_1.Sparkles className="h-4 w-4 mr-2"/>)}
                {demoMode ? 'Desactivar Demo' : 'Activar Demo'}
              </button_1.Button>
            </div>
            {demoMode && (<div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  <strong>Nota:</strong> En modo demo, las facturas se generan con un sello simulado y no son validas legalmente.
                  Para emitir facturas reales, desactiva el modo demo y completa el proceso de habilitacion con Hacienda.
                </p>
              </div>)}
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button_1.Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? (<>
              <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
              Guardando...
            </>) : ('Guardar Configuracion')}
        </button_1.Button>
      </div>
    </div>);
}
