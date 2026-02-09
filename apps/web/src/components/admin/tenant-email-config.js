'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantEmailConfig = TenantEmailConfig;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const dialog_1 = require("@/components/ui/dialog");
const select_1 = require("@/components/ui/select");
const providerLabels = {
    SENDGRID: 'SendGrid',
    MAILGUN: 'Mailgun',
    AMAZON_SES: 'Amazon SES',
    MICROSOFT_365: 'Microsoft 365',
    GOOGLE_WORKSPACE: 'Google Workspace',
    POSTMARK: 'Postmark',
    BREVO: 'Brevo',
    MAILTRAP: 'Mailtrap',
    SMTP_GENERIC: 'SMTP Generico',
};
const authMethodLabels = {
    API_KEY: 'API Key',
    SMTP_BASIC: 'SMTP Basico',
    OAUTH2: 'OAuth 2.0',
    AWS_IAM: 'AWS IAM',
};
function TenantEmailConfig({ tenantId, tenantName }) {
    const [config, setConfig] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [testing, setTesting] = (0, react_1.useState)(false);
    const [sendingTest, setSendingTest] = (0, react_1.useState)(false);
    const [deleting, setDeleting] = (0, react_1.useState)(false);
    const [showConfigModal, setShowConfigModal] = (0, react_1.useState)(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = (0, react_1.useState)(false);
    const [testResult, setTestResult] = (0, react_1.useState)(null);
    // Config form state
    const [provider, setProvider] = (0, react_1.useState)('SENDGRID');
    const [authMethod, setAuthMethod] = (0, react_1.useState)('API_KEY');
    const [apiKey, setApiKey] = (0, react_1.useState)('');
    const [fromEmail, setFromEmail] = (0, react_1.useState)('');
    const [fromName, setFromName] = (0, react_1.useState)('');
    const [testEmail, setTestEmail] = (0, react_1.useState)('');
    const [saving, setSaving] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        fetchConfig();
    }, [tenantId]);
    const fetchConfig = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-configs/${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.configured) {
                    setConfig(data.config);
                }
                else {
                    setConfig(null);
                }
            }
        }
        catch (err) {
            console.error('Error fetching email config:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleTestConnection = async () => {
        try {
            setTesting(true);
            setTestResult(null);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-configs/${tenantId}/test-connection`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setTestResult({
                success: data.success,
                message: data.success ? 'Conexion exitosa' : data.error || 'Error de conexion',
            });
            fetchConfig();
        }
        catch (err) {
            setTestResult({ success: false, message: 'Error al probar conexion' });
        }
        finally {
            setTesting(false);
        }
    };
    const handleSendTestEmail = async () => {
        if (!testEmail) {
            alert('Ingresa un correo de destino');
            return;
        }
        try {
            setSendingTest(true);
            setTestResult(null);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-configs/${tenantId}/send-test`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ recipientEmail: testEmail }),
            });
            const data = await res.json();
            setTestResult({
                success: data.success,
                message: data.success ? 'Correo de prueba enviado' : data.error || 'Error al enviar',
            });
            fetchConfig();
        }
        catch (err) {
            setTestResult({ success: false, message: 'Error al enviar correo de prueba' });
        }
        finally {
            setSendingTest(false);
        }
    };
    const handleDelete = async () => {
        try {
            setDeleting(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-configs/${tenantId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setConfig(null);
                setShowDeleteConfirm(false);
                alert('Configuracion eliminada');
            }
            else {
                alert('Error al eliminar configuracion');
            }
        }
        catch (err) {
            alert('Error al eliminar configuracion');
        }
        finally {
            setDeleting(false);
        }
    };
    const handleSaveConfig = async () => {
        if (!apiKey || !fromEmail) {
            alert('Completa los campos requeridos');
            return;
        }
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-configs/${tenantId}/configure`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider,
                    authMethod,
                    apiKey,
                    fromEmail,
                    fromName: fromName || tenantName,
                }),
            });
            if (res.ok) {
                setShowConfigModal(false);
                fetchConfig();
                alert('Configuracion guardada correctamente');
                // Reset form
                setApiKey('');
                setFromEmail('');
                setFromName('');
            }
            else {
                const data = await res.json();
                alert(data.message || 'Error al guardar configuracion');
            }
        }
        catch (err) {
            alert('Error al guardar configuracion');
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (<div className="glass-card p-6">
        <div className="flex items-center justify-center h-24">
          <lucide_react_1.Loader2 className="w-6 h-6 animate-spin text-primary"/>
        </div>
      </div>);
    }
    return (<>
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <lucide_react_1.Mail className="w-5 h-5 text-primary"/>
            <h3 className="text-lg font-semibold text-white">Configuracion de Email</h3>
          </div>
          {config ? (<div className="flex items-center gap-2">
              {config.isVerified ? (<span className="flex items-center gap-1 text-xs text-green-400">
                  <lucide_react_1.CheckCircle className="w-3 h-3"/>
                  Verificado
                </span>) : (<span className="flex items-center gap-1 text-xs text-yellow-400">
                  <lucide_react_1.AlertTriangle className="w-3 h-3"/>
                  Sin verificar
                </span>)}
            </div>) : (<span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
              Sin configurar
            </span>)}
        </div>

        {config ? (<div className="space-y-4">
            {/* Config Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Proveedor:</span>
                <span className="ml-2 text-white">{providerLabels[config.provider] || config.provider}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Metodo:</span>
                <span className="ml-2 text-white">{authMethodLabels[config.authMethod] || config.authMethod}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Remitente:</span>
                <span className="ml-2 text-white">{config.fromEmail}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Configurado por:</span>
                <span className="ml-2 text-white">
                  {config.configuredBy === 'REPUBLICODE' ? 'Admin' : 'Usuario'}
                </span>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (<div className={`p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {testResult.success ? (<lucide_react_1.CheckCircle className="w-4 h-4 inline mr-2"/>) : (<lucide_react_1.XCircle className="w-4 h-4 inline mr-2"/>)}
                {testResult.message}
              </div>)}

            {/* Test Email Input */}
            <div className="flex gap-2">
              <input type="email" placeholder="Correo para prueba..." value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="input-rc flex-1"/>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button_1.Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testing}>
                {testing ? (<lucide_react_1.Loader2 className="w-4 h-4 mr-1 animate-spin"/>) : (<lucide_react_1.TestTube className="w-4 h-4 mr-1"/>)}
                Probar Conexion
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" onClick={handleSendTestEmail} disabled={sendingTest || !testEmail}>
                {sendingTest ? (<lucide_react_1.Loader2 className="w-4 h-4 mr-1 animate-spin"/>) : (<lucide_react_1.Send className="w-4 h-4 mr-1"/>)}
                Enviar Prueba
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" onClick={() => setShowConfigModal(true)}>
                <lucide_react_1.Settings className="w-4 h-4 mr-1"/>
                Modificar
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => setShowDeleteConfirm(true)}>
                <lucide_react_1.Trash2 className="w-4 h-4 mr-1"/>
                Eliminar
              </button_1.Button>
            </div>
          </div>) : (<div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Esta empresa no tiene configuracion de email.
            </p>
            <button_1.Button onClick={() => setShowConfigModal(true)}>
              <lucide_react_1.Mail className="w-4 h-4 mr-2"/>
              Configurar Email
            </button_1.Button>
          </div>)}
      </div>

      {/* Config Modal */}
      <dialog_1.Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <dialog_1.DialogContent className="sm:max-w-[500px]">
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>Configurar Email para {tenantName}</dialog_1.DialogTitle>
            <dialog_1.DialogDescription>
              Configura el servicio de email para esta empresa.
            </dialog_1.DialogDescription>
          </dialog_1.DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Proveedor</label>
              <select_1.Select value={provider} onValueChange={setProvider}>
                <select_1.SelectTrigger>
                  <select_1.SelectValue />
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="SENDGRID">SendGrid</select_1.SelectItem>
                  <select_1.SelectItem value="MAILGUN">Mailgun</select_1.SelectItem>
                  <select_1.SelectItem value="AMAZON_SES">Amazon SES</select_1.SelectItem>
                  <select_1.SelectItem value="POSTMARK">Postmark</select_1.SelectItem>
                  <select_1.SelectItem value="BREVO">Brevo</select_1.SelectItem>
                  <select_1.SelectItem value="MAILTRAP">Mailtrap</select_1.SelectItem>
                  <select_1.SelectItem value="SMTP_GENERIC">SMTP Generico</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Metodo de Autenticacion</label>
              <select_1.Select value={authMethod} onValueChange={setAuthMethod}>
                <select_1.SelectTrigger>
                  <select_1.SelectValue />
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="API_KEY">API Key</select_1.SelectItem>
                  <select_1.SelectItem value="SMTP_BASIC">SMTP Basico</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">API Key / Credenciales *</label>
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API Key o contraseña SMTP" className="input-rc"/>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Correo Remitente *</label>
              <input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="noreply@empresa.com" className="input-rc"/>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nombre Remitente</label>
              <input type="text" value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder={tenantName} className="input-rc"/>
            </div>
          </div>

          <dialog_1.DialogFooter>
            <button_1.Button variant="outline" onClick={() => setShowConfigModal(false)}>
              Cancelar
            </button_1.Button>
            <button_1.Button onClick={handleSaveConfig} disabled={saving}>
              {saving ? (<lucide_react_1.Loader2 className="w-4 h-4 mr-2 animate-spin"/>) : null}
              Guardar
            </button_1.Button>
          </dialog_1.DialogFooter>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>

      {/* Delete Confirmation */}
      <dialog_1.Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <dialog_1.DialogContent className="sm:max-w-[400px]">
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>Eliminar Configuracion</dialog_1.DialogTitle>
            <dialog_1.DialogDescription>
              ¿Estas seguro de eliminar la configuracion de email? Esta accion no se puede deshacer.
            </dialog_1.DialogDescription>
          </dialog_1.DialogHeader>
          <dialog_1.DialogFooter>
            <button_1.Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </button_1.Button>
            <button_1.Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (<lucide_react_1.Loader2 className="w-4 h-4 mr-2 animate-spin"/>) : (<lucide_react_1.Trash2 className="w-4 h-4 mr-2"/>)}
              Eliminar
            </button_1.Button>
          </dialog_1.DialogFooter>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>
    </>);
}
