'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store';
import { Building2, Key, Upload, CheckCircle, AlertCircle, Loader2, Mail, ChevronRight, Rocket, Sparkles, XCircle, FileUp } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const NRC_PATTERN = /^\d{1,7}(-\d)?$/;
const PHONE_PATTERN = /^\d{4}-\d{4}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateConfigField(field: string, value: string): string {
  switch (field) {
    case 'nombre':
      if (!value.trim()) return 'Este campo es requerido';
      if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
      return '';
    case 'nrc':
      if (!value) return '';
      if (!NRC_PATTERN.test(value)) return 'NRC invalido (formato: 000000-0)';
      return '';
    case 'telefono':
      if (!value) return '';
      if (!PHONE_PATTERN.test(value)) return 'Formato invalido (debe ser 0000-0000)';
      return '';
    case 'correo':
      if (!value) return '';
      if (!EMAIL_PATTERN.test(value)) return 'El correo electronico no es valido';
      return '';
    case 'complemento':
      if (value.length > 500) return 'La direccion no puede exceder 500 caracteres';
      return '';
    default:
      return '';
  }
}

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
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { tenant, setTenant } = useAppStore();
  const [certificateStatus, setCertificateStatus] = React.useState<'loaded' | 'not_loaded'>('not_loaded');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [demoMode, setDemoMode] = React.useState(false);
  const [togglingDemo, setTogglingDemo] = React.useState(false);

  // Form state
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
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
        setError(tCommon('noSession'));
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
          throw new Error(errorData.message || t('loadError'));
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
        setError(err instanceof Error ? err.message : t('configLoadError'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setTenant]);

  const toggleDemoMode = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError(tCommon('noSession'));
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
        throw new Error(errorData.message || t('demoModeError'));
      }

      const data = await res.json();
      setDemoMode(data.demoMode);
      setSuccess(data.message);
    } catch (err) {
      console.error('Error toggling demo mode:', err);
      setError(err instanceof Error ? err.message : t('demoModeError'));
    } finally {
      setTogglingDemo(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
    const err = validateConfigField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleDireccionChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      direccion: { ...prev.direccion!, [field]: value },
    }));
    setError(null);
    setSuccess(null);
    const err = validateConfigField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError(tCommon('noSession'));
      return;
    }

    // Validate all editable fields
    const errors: Record<string, string> = {};
    errors.nombre = validateConfigField('nombre', formData.nombre || '');
    errors.nrc = validateConfigField('nrc', formData.nrc || '');
    errors.correo = validateConfigField('correo', formData.correo || '');
    errors.telefono = validateConfigField('telefono', formData.telefono || '');
    errors.complemento = validateConfigField('complemento', formData.direccion?.complemento || '');

    const activeErrors = Object.entries(errors).filter(([, v]) => v);
    if (activeErrors.length > 0) {
      setFieldErrors(errors);
      setError(t('formErrors'));
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
        throw new Error(errorData.message || t('saveError'));
      }

      const updatedTenant = await res.json();
      setTenant(updatedTenant);
      setSuccess(t('saveSuccess'));
    } catch (err) {
      console.error('Error saving tenant:', err);
      setError(err instanceof Error ? err.message : t('saveError'));
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
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
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
              {t('companyData')}
            </CardTitle>
            <CardDescription>
              {t('companyDataDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('nameLabel')} *</label>
              <Input
                placeholder="Mi Empresa S.A. de C.V."
                value={formData.nombre || ''}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                className={fieldErrors.nombre ? 'border-red-500' : ''}
              />
              {fieldErrors.nombre && (
                <p className="text-xs text-red-500">{fieldErrors.nombre}</p>
              )}
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
                <p className="text-xs text-muted-foreground">{t('nitReadonly')}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('nrcLabel')}</label>
                <Input
                  placeholder="000000-0"
                  value={formData.nrc || ''}
                  onChange={(e) => handleInputChange('nrc', e.target.value)}
                  className={fieldErrors.nrc ? 'border-red-500' : ''}
                />
                {fieldErrors.nrc && (
                  <p className="text-xs text-red-500">{fieldErrors.nrc}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('emailLabel')}</label>
              <Input
                type="email"
                placeholder="facturacion@empresa.com"
                value={formData.correo || ''}
                onChange={(e) => handleInputChange('correo', e.target.value)}
                className={fieldErrors.correo ? 'border-red-500' : ''}
              />
              {fieldErrors.correo && (
                <p className="text-xs text-red-500">{fieldErrors.correo}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('phoneLabel')}</label>
              <Input
                placeholder="0000-0000"
                value={formData.telefono || ''}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                className={fieldErrors.telefono ? 'border-red-500' : ''}
              />
              {fieldErrors.telefono && (
                <p className="text-xs text-red-500">{fieldErrors.telefono}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('addressLabel')}</label>
              <Input
                placeholder={t('addressPlaceholder')}
                value={formData.direccion?.complemento || ''}
                onChange={(e) => handleDireccionChange('complemento', e.target.value)}
                className={fieldErrors.complemento ? 'border-red-500' : ''}
              />
              {fieldErrors.complemento && (
                <p className="text-xs text-red-500">{fieldErrors.complemento}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Credenciales MH */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t('mhCredentials')}
            </CardTitle>
            <CardDescription>
              {t('mhCredentialsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('nitUser')}</label>
              <Input placeholder="0000000000000" />
              <p className="text-xs text-muted-foreground">{t('nitUserDesc')}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('mhPassword')}</label>
              <Input type="password" placeholder="********" />
              <p className="text-xs text-muted-foreground">
                {t('mhPasswordDesc')}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{tCommon('status')}</label>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  {t('envTest')}
                </Button>
                <Button variant="default" className="flex-1">
                  {t('envProd')}
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
              {t('certificate')}
            </CardTitle>
            <CardDescription>
              {t('certificateDesc')}
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
                      <p className="font-medium">{t('certUploaded')}</p>
                      <p className="text-sm text-muted-foreground">
                        certificado.p12 - {t('certValidUntil', { date: '31/12/2025' })}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                      <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-medium">{t('noCert')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('noCertDesc')}
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
                      {t('uploadCert')}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
            {certificateStatus === 'not_loaded' && (
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium">{t('certPassword')}</label>
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
              {t('emailConfig')}
            </CardTitle>
            <CardDescription>
              {t('emailConfigDesc')}
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
                    <p className="font-medium">{t('emailService')}</p>
                    <p className="text-sm text-muted-foreground">
                      SendGrid, Mailgun, Amazon SES, Microsoft 365, Gmail
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
              {t('haciendaConfig')}
              <Badge className="ml-2 bg-primary/10 text-primary border-primary/20">{tCommon('new')}</Badge>
            </CardTitle>
            <CardDescription>
              {t('haciendaConfigDesc')}
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
                    <p className="font-medium">{t('configCenter')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('haciendaConfigDesc')}
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
              {t('haciendaOnboarding')}
            </CardTitle>
            <CardDescription>
              {t('haciendaOnboardingDesc')}
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
                    <p className="font-medium">{t('onboardingWizard')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('haciendaOnboardingDesc')}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Data Migration Link */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              {t('migration')}
            </CardTitle>
            <CardDescription>
              {t('migrationDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/configuracion/migracion">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <FileUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{t('importData')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('migrationDesc')}
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
              {t('demoMode')}
              {demoMode && (
                <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-500">
                  {tCommon('active')}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {t('demoModeDesc')}
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
                      <p className="font-medium text-yellow-600 dark:text-yellow-400">{t('demoActive')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('demoActiveDesc')}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <XCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{t('demoInactive')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('demoInactiveDesc')}
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
                {demoMode ? t('deactivateDemo') : t('activateDemo')}
              </Button>
            </div>
            {demoMode && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  {t('demoInfo')}
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
              {tCommon('saving')}
            </>
          ) : (
            t('saveConfig')
          )}
        </Button>
      </div>
    </div>
  );
}
