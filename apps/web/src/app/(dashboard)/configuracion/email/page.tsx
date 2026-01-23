'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Mail, Loader2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import {
  ProviderSelector,
  ProviderForm,
  ConnectionStatus,
  StatusBadge,
  AssistanceModal,
  AssistanceButton,
  AssistanceFormData,
} from '@/components/email-config';
import {
  EmailConfig,
  EmailConfigForm,
  EmailProvider,
  EMAIL_PROVIDERS,
  ConnectionTestResult,
} from '@/types/email-config';

export default function EmailConfigPage() {
  const router = useRouter();
  const toast = useToast();

  // State
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [config, setConfig] = React.useState<EmailConfig | null>(null);
  const [selectedProvider, setSelectedProvider] = React.useState<EmailProvider | null>(null);
  const [formData, setFormData] = React.useState<Partial<EmailConfigForm>>({});
  const [showAssistance, setShowAssistance] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Load existing config
  React.useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/email-config`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.configured) {
          setConfig(data);
          setSelectedProvider(data.provider);
          setFormData({
            provider: data.provider,
            authMethod: data.authMethod,
            fromEmail: data.fromEmail,
            fromName: data.fromName,
            replyToEmail: data.replyToEmail,
            rateLimitPerHour: data.rateLimitPerHour,
          });
        }
      }
    } catch (error) {
      console.error('Error loading email config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (provider: EmailProvider) => {
    const providerInfo = EMAIL_PROVIDERS.find((p) => p.id === provider);
    if (!providerInfo) return;

    setSelectedProvider(provider);
    setFormData({
      ...formData,
      provider,
      authMethod: providerInfo.authMethods[0],
    });
    setHasChanges(true);
  };

  const handleFormChange = (
    field: keyof EmailConfigForm,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedProvider || !formData.fromEmail || !formData.fromName) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/email-config`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al guardar');
      }

      const data = await res.json();
      toast.success(data.message || 'Configuración guardada');
      setHasChanges(false);
      await loadConfig();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (): Promise<ConnectionTestResult> => {
    const token = localStorage.getItem('token');
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/email-config/test-connection`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await res.json();

    if (data.success) {
      toast.success(data.message);
    } else {
      toast.error(data.message);
    }

    return data;
  };

  const handleSendTest = async (email: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/email-config/send-test`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientEmail: email }),
      }
    );

    const data = await res.json();

    if (data.success) {
      toast.success(data.message);
      await loadConfig();
    } else {
      toast.error(data.message);
    }
  };

  const handleToggleActive = async () => {
    if (!config) return;

    const token = localStorage.getItem('token');
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/email-config/activate`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !config.isActive }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      toast.success(data.message);
      await loadConfig();
    } else {
      toast.error(data.message || 'Error al actualizar');
    }
  };

  const handleAssistanceSubmit = async (data: AssistanceFormData) => {
    const token = localStorage.getItem('token');
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/email-config/request-assistance`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    const result = await res.json();

    if (res.ok) {
      toast.success(result.message);
    } else {
      toast.error(result.message || 'Error al enviar solicitud');
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/configuracion')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Mail className="h-6 w-6 text-primary" />
              Configuración de Email
            </h1>
            <p className="text-muted-foreground">
              Configure el servicio de correo para enviar facturas y DTEs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge config={config} />

          {config && config.isVerified && (
            <Button
              variant={config.isActive ? 'outline' : 'default'}
              onClick={handleToggleActive}
            >
              {config.isActive ? (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Desactivar
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Activar
                </>
              )}
            </Button>
          )}

          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Proveedor de Email</CardTitle>
              <CardDescription>
                Seleccione el servicio que utilizará para enviar correos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProviderSelector
                selectedProvider={selectedProvider}
                onSelect={handleProviderSelect}
                disabled={saving}
              />
            </CardContent>
          </Card>

          {/* Provider-specific form */}
          {selectedProvider && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Configuración de{' '}
                  {EMAIL_PROVIDERS.find((p) => p.id === selectedProvider)?.name}
                </CardTitle>
                <CardDescription>
                  Complete los datos de conexión y remitente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProviderForm
                  provider={selectedProvider}
                  formData={formData}
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Connection Status */}
          <ConnectionStatus
            config={config}
            onTestConnection={handleTestConnection}
            onSendTest={handleSendTest}
            loading={saving}
          />

          {/* Assistance */}
          <Card>
            <CardHeader>
              <CardTitle>¿Necesita Ayuda?</CardTitle>
              <CardDescription>
                Nuestro equipo puede configurar el email por usted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssistanceButton onClick={() => setShowAssistance(true)} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assistance Modal */}
      <AssistanceModal
        open={showAssistance}
        onOpenChange={setShowAssistance}
        onSubmit={handleAssistanceSubmit}
      />
    </div>
  );
}
