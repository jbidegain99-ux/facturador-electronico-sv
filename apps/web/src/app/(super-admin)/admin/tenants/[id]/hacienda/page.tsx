'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Wifi,
  Key,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnvironmentConfig {
  environment: string;
  isConfigured: boolean;
  isValidated: boolean;
  tokenExpiry?: string;
  certificateInfo?: {
    fileName: string;
    validUntil: string;
    nit: string | null;
    subject: string;
  };
  lastValidationAt?: string;
  lastValidationError?: string;
}

interface HaciendaConfig {
  activeEnvironment: string;
  testingStatus: string;
  testingStartedAt?: string;
  testingCompletedAt?: string;
  productionAuthorizedAt?: string;
  testConfig?: EnvironmentConfig;
  prodConfig?: EnvironmentConfig;
}

interface TestProgress {
  progress: {
    dteType: string;
    dteName: string;
    emissionRequired: number;
    emissionCompleted: number;
    cancellationRequired: number;
    cancellationCompleted: number;
    isComplete: boolean;
  }[];
  totalRequired: number;
  totalCompleted: number;
  percentComplete: number;
  canRequestAuthorization: boolean;
}

interface ActionResult {
  success: boolean;
  message: string;
}

export default function AdminHaciendaConfigPage() {
  const params = useParams();
  const tenantId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<HaciendaConfig | null>(null);
  const [testProgress, setTestProgress] = useState<TestProgress | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(true);

  // Quick setup form
  const [environment, setEnvironment] = useState<'TEST' | 'PRODUCTION'>('TEST');
  const [apiUser, setApiUser] = useState('');
  const [apiPassword, setApiPassword] = useState('');
  const [certificatePassword, setCertificatePassword] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<ActionResult | null>(null);

  // Actions
  const [testingConnection, setTestingConnection] = useState(false);
  const [renewingToken, setRenewingToken] = useState(false);
  const [switchingEnv, setSwitchingEnv] = useState(false);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const [configRes, tenantRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/hacienda/${tenantId}/config`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants/${tenantId}`, { headers }),
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);

        // Fetch test progress if configured
        if (configData.testConfig?.isConfigured || configData.prodConfig?.isConfigured) {
          const progressRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/admin/hacienda/${tenantId}/tests/progress`,
            { headers }
          );
          if (progressRes.ok) {
            setTestProgress(await progressRes.json());
          }
        }
      }

      if (tenantRes.ok) {
        const tenantData = await tenantRes.json();
        setTenantName(tenantData.nombre);
      }
    } catch (err) {
      console.error('Error fetching hacienda data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSetup = async () => {
    if (!apiUser || !apiPassword || !certificatePassword || !certificateFile) {
      setSetupResult({ success: false, message: 'Completa todos los campos requeridos' });
      return;
    }

    try {
      setSetupLoading(true);
      setSetupResult(null);

      const formData = new FormData();
      formData.append('environment', environment);
      formData.append('apiUser', apiUser);
      formData.append('apiPassword', apiPassword);
      formData.append('certificatePassword', certificatePassword);
      formData.append('certificate', certificateFile);

      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/hacienda/${tenantId}/quick-setup`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setSetupResult({ success: true, message: 'Configuracion completada exitosamente' });
        // Reset form
        setApiUser('');
        setApiPassword('');
        setCertificatePassword('');
        setCertificateFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchData();
      } else {
        setSetupResult({
          success: false,
          message: data.message || data.error || 'Error en la configuracion',
        });
      }
    } catch (err) {
      setSetupResult({ success: false, message: 'Error de conexion' });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config) return;
    try {
      setTestingConnection(true);
      setActionResult(null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/hacienda/${tenantId}/test-connection`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ environment: config.activeEnvironment }),
        }
      );

      const data = await res.json();
      setActionResult({
        success: data.success,
        message: data.success ? 'Conexion exitosa con Hacienda' : data.error || 'Error de conexion',
      });
      fetchData();
    } catch (err) {
      setActionResult({ success: false, message: 'Error al probar conexion' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleRenewToken = async () => {
    if (!config) return;
    try {
      setRenewingToken(true);
      setActionResult(null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/hacienda/${tenantId}/renew-token`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ environment: config.activeEnvironment }),
        }
      );

      const data = await res.json();
      setActionResult({
        success: data.success,
        message: data.success
          ? `Token renovado. Expira: ${new Date(data.expiresAt).toLocaleString('es')}`
          : data.error || 'Error al renovar token',
      });
      fetchData();
    } catch (err) {
      setActionResult({ success: false, message: 'Error al renovar token' });
    } finally {
      setRenewingToken(false);
    }
  };

  const handleSwitchEnvironment = async (newEnv: 'TEST' | 'PRODUCTION') => {
    try {
      setSwitchingEnv(true);
      setActionResult(null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/hacienda/${tenantId}/switch-environment`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ environment: newEnv }),
        }
      );

      const data = await res.json();
      setActionResult({
        success: data.success,
        message: data.success
          ? `Ambiente cambiado a ${newEnv === 'PRODUCTION' ? 'Produccion' : 'Pruebas'}`
          : data.error || 'Error al cambiar ambiente',
      });
      fetchData();
    } catch (err) {
      setActionResult({ success: false, message: 'Error al cambiar ambiente' });
    } finally {
      setSwitchingEnv(false);
    }
  };

  const getActiveEnvConfig = (): EnvironmentConfig | undefined => {
    if (!config) return undefined;
    return config.activeEnvironment === 'PRODUCTION'
      ? config.prodConfig
      : config.testConfig;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const envConfig = getActiveEnvConfig();
  const isConfigured = envConfig?.isConfigured ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/tenants/${tenantId}`}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">Configuracion de Hacienda</h1>
          <p className="text-muted-foreground mt-1">{tenantName}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Setup Form */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-white">Configuracion Rapida</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Ambiente</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as 'TEST' | 'PRODUCTION')}
                  className="input-rc"
                >
                  <option value="TEST">Pruebas (TEST)</option>
                  <option value="PRODUCTION">Produccion (PRODUCTION)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Usuario API (NIT sin guiones) *
                </label>
                <input
                  type="text"
                  value={apiUser}
                  onChange={(e) => setApiUser(e.target.value)}
                  placeholder="06140101001000"
                  className="input-rc"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Contrasena API *
                </label>
                <input
                  type="password"
                  value={apiPassword}
                  onChange={(e) => setApiPassword(e.target.value)}
                  placeholder="Contrasena de Hacienda"
                  className="input-rc"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Certificado (.p12 / .pfx) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".p12,.pfx,.crt,.cer,.pem"
                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                    className="input-rc flex-1"
                  />
                  {certificateFile && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <FileCheck className="w-3 h-3" />
                      {certificateFile.name}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Contrasena del Certificado *
                </label>
                <input
                  type="password"
                  value={certificatePassword}
                  onChange={(e) => setCertificatePassword(e.target.value)}
                  placeholder="Contrasena del certificado"
                  className="input-rc"
                />
              </div>

              {setupResult && (
                <div className={`p-3 rounded-lg text-sm ${
                  setupResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {setupResult.success ? (
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 inline mr-2" />
                  )}
                  {setupResult.message}
                </div>
              )}

              <Button
                onClick={handleQuickSetup}
                disabled={setupLoading}
                className="w-full"
              >
                {setupLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {setupLoading ? 'Configurando...' : 'Configurar Hacienda'}
              </Button>
            </div>
          </div>

          {/* Actions (only show when configured) */}
          {isConfigured && config && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Acciones</h3>

              {actionResult && (
                <div className={`p-3 rounded-lg text-sm mb-4 ${
                  actionResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {actionResult.success ? (
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 inline mr-2" />
                  )}
                  {actionResult.message}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                >
                  {testingConnection ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wifi className="w-4 h-4 mr-2" />
                  )}
                  Probar Conexion
                </Button>

                <Button
                  variant="outline"
                  onClick={handleRenewToken}
                  disabled={renewingToken}
                >
                  {renewingToken ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4 mr-2" />
                  )}
                  Renovar Token
                </Button>

                {config.activeEnvironment === 'TEST' && config.prodConfig?.isConfigured && (
                  <Button
                    variant="outline"
                    onClick={() => handleSwitchEnvironment('PRODUCTION')}
                    disabled={switchingEnv}
                    className="text-green-400 hover:text-green-300"
                  >
                    {switchingEnv ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4 mr-2" />
                    )}
                    Cambiar a Produccion
                  </Button>
                )}

                {config.activeEnvironment === 'PRODUCTION' && config.testConfig?.isConfigured && (
                  <Button
                    variant="outline"
                    onClick={() => handleSwitchEnvironment('TEST')}
                    disabled={switchingEnv}
                    className="text-yellow-400 hover:text-yellow-300"
                  >
                    {switchingEnv ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4 mr-2" />
                    )}
                    Cambiar a Pruebas
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Test Progress */}
          {testProgress && testProgress.progress.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Progreso de Pruebas ({testProgress.percentComplete}%)
              </h3>

              <div className="w-full bg-white/10 rounded-full h-3 mb-4">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${testProgress.percentComplete}%` }}
                />
              </div>

              <div className="space-y-3">
                {testProgress.progress.map((item) => (
                  <div
                    key={item.dteType}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                  >
                    <div>
                      <span className="text-white font-medium">{item.dteName}</span>
                      <span className="text-xs text-muted-foreground ml-2">({item.dteType})</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Emision: {item.emissionCompleted}/{item.emissionRequired}
                      </span>
                      <span className="text-muted-foreground">
                        Anulacion: {item.cancellationCompleted}/{item.cancellationRequired}
                      </span>
                      {item.isComplete ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Status */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Estado Actual</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ambiente</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  config?.activeEnvironment === 'PRODUCTION'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {config?.activeEnvironment === 'PRODUCTION' ? 'Produccion' : 'Pruebas'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Configurado</span>
                {isConfigured ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>

              {envConfig?.tokenExpiry && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Token</span>
                  {new Date(envConfig.tokenExpiry) > new Date() ? (
                    <span className="text-xs text-green-400">Valido</span>
                  ) : (
                    <span className="text-xs text-red-400">Expirado</span>
                  )}
                </div>
              )}

              {envConfig?.isValidated && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Validado</span>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
              )}
            </div>
          </div>

          {/* Certificate Info */}
          {envConfig?.certificateInfo && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Certificado</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground block">Archivo</span>
                  <span className="text-white">{envConfig.certificateInfo.fileName}</span>
                </div>
                {envConfig.certificateInfo.nit && (
                  <div>
                    <span className="text-muted-foreground block">NIT</span>
                    <span className="text-white">{envConfig.certificateInfo.nit}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block">Sujeto</span>
                  <span className="text-white text-xs break-all">{envConfig.certificateInfo.subject}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Vencimiento</span>
                  <span className={`${
                    new Date(envConfig.certificateInfo.validUntil) > new Date()
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {new Date(envConfig.certificateInfo.validUntil).toLocaleDateString('es', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Environment Details */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Ambientes</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">Pruebas (TEST)</span>
                  {config?.testConfig?.isConfigured ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {config?.testConfig?.isConfigured ? 'Configurado' : 'Sin configurar'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">Produccion</span>
                  {config?.prodConfig?.isConfigured ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {config?.prodConfig?.isConfigured ? 'Configurado' : 'Sin configurar'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
