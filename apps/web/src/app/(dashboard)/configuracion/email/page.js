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
exports.default = EmailConfigPage;
const React = __importStar(require("react"));
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const toast_1 = require("@/components/ui/toast");
const email_config_1 = require("@/components/email-config");
const email_config_2 = require("@/types/email-config");
function EmailConfigPage() {
    const router = (0, navigation_1.useRouter)();
    const toast = (0, toast_1.useToast)();
    // State
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [config, setConfig] = React.useState(null);
    const [selectedProvider, setSelectedProvider] = React.useState(null);
    const [formData, setFormData] = React.useState({});
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/email-config`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
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
        }
        catch (error) {
            console.error('Error loading email config:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleProviderSelect = (provider) => {
        const providerInfo = email_config_2.EMAIL_PROVIDERS.find((p) => p.id === provider);
        if (!providerInfo)
            return;
        setSelectedProvider(provider);
        setFormData({
            ...formData,
            provider,
            authMethod: providerInfo.authMethods[0],
        });
        setHasChanges(true);
    };
    const handleFormChange = (field, value) => {
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/email-config`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.message || 'Error al guardar');
            }
            const data = await res.json();
            toast.success(data.message || 'Configuración guardada');
            setHasChanges(false);
            await loadConfig();
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al guardar');
        }
        finally {
            setSaving(false);
        }
    };
    const handleTestConnection = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/email-config/test-connection`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        const data = await res.json();
        if (data.success) {
            toast.success(data.message);
        }
        else {
            toast.error(data.message);
        }
        return data;
    };
    const handleSendTest = async (email) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/email-config/send-test`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ recipientEmail: email }),
        });
        const data = await res.json();
        if (data.success) {
            toast.success(data.message);
            await loadConfig();
        }
        else {
            toast.error(data.message);
        }
    };
    const handleToggleActive = async () => {
        if (!config)
            return;
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/email-config/activate`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isActive: !config.isActive }),
        });
        const data = await res.json();
        if (res.ok) {
            toast.success(data.message);
            await loadConfig();
        }
        else {
            toast.error(data.message || 'Error al actualizar');
        }
    };
    const handleAssistanceSubmit = async (data) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/email-config/request-assistance`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (res.ok) {
            toast.success(result.message);
        }
        else {
            toast.error(result.message || 'Error al enviar solicitud');
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
        <div className="flex items-center gap-4">
          <button_1.Button variant="ghost" size="icon" onClick={() => router.push('/configuracion')}>
            <lucide_react_1.ArrowLeft className="h-5 w-5"/>
          </button_1.Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <lucide_react_1.Mail className="h-6 w-6 text-primary"/>
              Configuración de Email
            </h1>
            <p className="text-muted-foreground">
              Configure el servicio de correo para enviar facturas y DTEs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <email_config_1.StatusBadge config={config}/>

          {config && config.isVerified && (<button_1.Button variant={config.isActive ? 'outline' : 'default'} onClick={handleToggleActive}>
              {config.isActive ? (<>
                  <lucide_react_1.PowerOff className="h-4 w-4 mr-2"/>
                  Desactivar
                </>) : (<>
                  <lucide_react_1.Power className="h-4 w-4 mr-2"/>
                  Activar
                </>)}
            </button_1.Button>)}

          <button_1.Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (<lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/>) : (<lucide_react_1.Save className="h-4 w-4 mr-2"/>)}
            Guardar
          </button_1.Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Selection */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Proveedor de Email</card_1.CardTitle>
              <card_1.CardDescription>
                Seleccione el servicio que utilizará para enviar correos
              </card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <email_config_1.ProviderSelector selectedProvider={selectedProvider} onSelect={handleProviderSelect} disabled={saving}/>
            </card_1.CardContent>
          </card_1.Card>

          {/* Provider-specific form */}
          {selectedProvider && (<card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>
                  Configuración de{' '}
                  {email_config_2.EMAIL_PROVIDERS.find((p) => p.id === selectedProvider)?.name}
                </card_1.CardTitle>
                <card_1.CardDescription>
                  Complete los datos de conexión y remitente
                </card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <email_config_1.ProviderForm provider={selectedProvider} formData={formData} onChange={handleFormChange} disabled={saving}/>
              </card_1.CardContent>
            </card_1.Card>)}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Connection Status */}
          <email_config_1.ConnectionStatus config={config} onTestConnection={handleTestConnection} onSendTest={handleSendTest} loading={saving}/>

          {/* Assistance */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>¿Necesita Ayuda?</card_1.CardTitle>
              <card_1.CardDescription>
                Nuestro equipo puede configurar el email por usted
              </card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <email_config_1.AssistanceButton onClick={() => setShowAssistance(true)}/>
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>

      {/* Assistance Modal */}
      <email_config_1.AssistanceModal open={showAssistance} onOpenChange={setShowAssistance} onSubmit={handleAssistanceSubmit}/>
    </div>);
}
