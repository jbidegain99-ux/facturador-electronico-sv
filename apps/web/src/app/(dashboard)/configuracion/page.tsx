'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store';
import { Building2, Key, Upload, CheckCircle, AlertCircle, Loader2, Mail, ChevronRight, Rocket, Sparkles, XCircle } from 'lucide-react';
import Link from 'next/link';

interface TenantData {
  id: string;
  nombre: string;
  nit: string;
  nrc: string;
  actividadEcon: string;
  direccion: {
    departamento: string;
    municipio: string;
    complemento: string;
  };
  telefono: string;
  correo: string;
  nombreComercial?: string;
}

export default function ConfiguracionPage() {
  const { tenant, setTenant } = useAppStore();
  const [certificateStatus, setCertificateStatus] = React.useState<'loaded' | 'not_loaded'>('not_loaded');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [demoMode, setDemoMode] = React.useState(false);
  const [togglingDemo, setTogglingDemo] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState<Partial<TenantData>>({
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
          const errorData = await tenantRes.json();
          throw new Error(errorData.message || 'Error al cargar datos');
        }

        const data: TenantData = await tenantRes.json();
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
      } catch (err) {
        console.error('Error loading tenant:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar configuracion');
      } finally {
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
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al cambiar modo demo');
      }

      const data = await res.json();
      setDemoMode(data.demoMode);
      setSuccess(data.message);
    } catch (err) {
      console.error('Error toggling demo mode:', err);
      setError(err instanceof Error ? err.message : 'Error al cambiar modo demo');
    } finally {
      setTogglingDemo(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleDireccionChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      direccion: { ...prev.direccion!, [field]: value },
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
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar');
      }

      const updatedTenant = await res.json();
      setTenant(updatedTenant);
      setSuccess('Configuracion guardada exitosamente');
    } catch (err) {
      console.error('Error saving tenant:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar configuracion');
    } finally {
      setSaving(false);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Configura los datos de tu empresa y credenciales del MH
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Datos de la Empresa
            </CardTitle>
            <CardDescription>
              Informacion del emisor para los documentos tributarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre / Razon Social</label>
              <Input
                placeholder="Mi Empresa S.A. de C.V."
                value={formData.nombre || ''}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">NIT</label>
                <Input
                  placeholder="0000-000000-000-0"
                  value={formData.nit || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">El NIT no se puede modificar</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">NRC</label>
                <Input
                  placeholder="000000-0"
                  value={formData.nrc || ''}
                  onChange={(e) => handleInputChange('nrc', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo Electronico</label>
              <Input
                type="email"
                placeholder="facturacion@empresa.com"
                value={formData.correo || ''}
                onChange={(e) => handleInputChange('correo', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefono</label>
              <Input
                placeholder="0000-0000"
                value={formData.telefono || ''}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Direccion</label>
              <Input
                placeholder="Direccion completa del establecimiento"
                value={formData.direccion?.complemento || ''}
                onChange={(e) => handleDireccionChange('complemento', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Credenciales MH */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Credenciales del MH
            </CardTitle>
            <CardDescription>
              Credenciales para autenticacion con el Ministerio de Hacienda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">NIT (Usuario)</label>
              <Input placeholder="0000000000000" />
              <p className="text-xs text-muted-foreground">NIT sin guiones</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password Privado</label>
              <Input type="password" placeholder="********" />
              <p className="text-xs text-muted-foreground">
                Contraseña proporcionada por el MH
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ambiente</label>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Pruebas
                </Button>
                <Button variant="default" className="flex-1">
                  Produccion
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificado Digital */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Certificado Digital
            </CardTitle>
            <CardDescription>
              Certificado .p12 para firma de documentos electronicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                {certificateStatus === 'loaded' ? (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">Certificado cargado</p>
                      <p className="text-sm text-muted-foreground">
                        certificado.p12 - Valido hasta: 31/12/2025
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                      <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-medium">Sin certificado</p>
                      <p className="text-sm text-muted-foreground">
                        Sube tu certificado .p12 para poder firmar documentos
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".p12,.pfx"
                  className="hidden"
                  id="certificate-upload"
                  onChange={() => setCertificateStatus('loaded')}
                />
                <label htmlFor="certificate-upload">
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir Certificado
                    </span>
                  </Button>
                </label>
              </div>
            </div>
            {certificateStatus === 'not_loaded' && (
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium">Contraseña del Certificado</label>
                <Input type="password" placeholder="********" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Configuration Link */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configuracion de Email
            </CardTitle>
            <CardDescription>
              Configura el servicio de email para enviar facturas y DTEs a tus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/configuracion/email">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Servicio de Email</p>
                    <p className="text-sm text-muted-foreground">
                      SendGrid, Mailgun, Amazon SES, Microsoft 365, Gmail y mas
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Hacienda Configuration Link */}
        <Card className="lg:col-span-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Configuracion de Hacienda
              <Badge className="ml-2 bg-primary/10 text-primary border-primary/20">Nuevo</Badge>
            </CardTitle>
            <CardDescription>
              Configure su integracion con el Ministerio de Hacienda y ejecute las pruebas de acreditacion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/configuracion/hacienda">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-primary/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Centro de Configuracion y Pruebas</p>
                    <p className="text-sm text-muted-foreground">
                      Certificados, credenciales API, ambiente de pruebas y produccion
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Hacienda Onboarding Link */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Habilitacion con Hacienda
            </CardTitle>
            <CardDescription>
              Proceso guiado para convertirse en emisor autorizado de DTE
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/onboarding-hacienda">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Rocket className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Wizard de Onboarding</p>
                    <p className="text-sm text-muted-foreground">
                      13 pasos para habilitarse como emisor de documentos electronicos
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Demo Mode Card */}
        <Card className={`lg:col-span-2 ${demoMode ? 'border-yellow-500/50' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className={`h-5 w-5 ${demoMode ? 'text-yellow-500' : ''}`} />
              Modo Demo
              {demoMode && (
                <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-500">
                  Activo
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Prueba la plataforma sin conectar con el Ministerio de Hacienda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                {demoMode ? (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                      <Sparkles className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-medium text-yellow-600 dark:text-yellow-400">Modo Demo Activo</p>
                      <p className="text-sm text-muted-foreground">
                        Las facturas se crean con datos simulados. No se envian a Hacienda.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <XCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Modo Demo Desactivado</p>
                      <p className="text-sm text-muted-foreground">
                        Las facturas se envian al Ministerio de Hacienda en modo produccion.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Button
                variant={demoMode ? 'destructive' : 'outline'}
                onClick={toggleDemoMode}
                disabled={togglingDemo}
                className={!demoMode ? 'border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' : ''}
              >
                {togglingDemo ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : demoMode ? (
                  <XCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {demoMode ? 'Desactivar Demo' : 'Activar Demo'}
              </Button>
            </div>
            {demoMode && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  <strong>Nota:</strong> En modo demo, las facturas se generan con un sello simulado y no son validas legalmente.
                  Para emitir facturas reales, desactiva el modo demo y completa el proceso de habilitacion con Hacienda.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar Configuracion'
          )}
        </Button>
      </div>
    </div>
  );
}
