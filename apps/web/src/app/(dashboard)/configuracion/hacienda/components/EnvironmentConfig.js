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
exports.EnvironmentConfig = EnvironmentConfig;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const alert_1 = require("@/components/ui/alert");
const toast_1 = require("@/components/ui/toast");
function EnvironmentConfig({ environment, config, disabled = false, disabledMessage, onConfigured, }) {
    const toast = (0, toast_1.useToast)();
    const fileInputRef = React.useRef(null);
    // Form state
    const [apiUser, setApiUser] = React.useState('');
    const [apiPassword, setApiPassword] = React.useState('');
    const [certificatePassword, setCertificatePassword] = React.useState('');
    const [certificateFile, setCertificateFile] = React.useState(null);
    // UI state
    const [saving, setSaving] = React.useState(false);
    const [testing, setTesting] = React.useState(false);
    const [renewing, setRenewing] = React.useState(false);
    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file extension
            const ext = file.name.toLowerCase().split('.').pop();
            const allowedExtensions = ['p12', 'pfx', 'crt', 'cer', 'pem'];
            if (!ext || !allowedExtensions.includes(ext)) {
                toast.error('El archivo debe ser .p12, .pfx, .crt, .cer o .pem');
                return;
            }
            setCertificateFile(file);
        }
    };
    const handleSave = async () => {
        if (!apiUser || !apiPassword || !certificatePassword) {
            toast.error('Complete todos los campos requeridos');
            return;
        }
        if (!certificateFile && !config?.isConfigured) {
            toast.error('Seleccione el archivo de certificado');
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('apiUser', apiUser);
            formData.append('apiPassword', apiPassword);
            formData.append('certificatePassword', certificatePassword);
            if (certificateFile) {
                formData.append('certificate', certificateFile);
            }
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hacienda/config/${environment}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Configuración guardada');
                onConfigured();
                // Clear form
                setApiPassword('');
                setCertificatePassword('');
                setCertificateFile(null);
            }
            else {
                throw new Error(data.message || 'Error al guardar');
            }
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al guardar');
        }
        finally {
            setSaving(false);
        }
    };
    const handleTestConnection = async () => {
        setTesting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hacienda/config/test-connection`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ environment }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Conexión exitosa');
                onConfigured();
            }
            else {
                throw new Error(data.message || 'Error de conexión');
            }
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error de conexión');
        }
        finally {
            setTesting(false);
        }
    };
    const handleRenewToken = async () => {
        setRenewing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hacienda/config/renew-token`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ environment }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Token renovado exitosamente');
                onConfigured();
            }
            else {
                throw new Error(data.message || 'Error al renovar token');
            }
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al renovar');
        }
        finally {
            setRenewing(false);
        }
    };
    if (disabled) {
        return (<card_1.Card className="border-dashed">
        <card_1.CardContent className="flex flex-col items-center justify-center py-12">
          <lucide_react_1.AlertCircle className="h-12 w-12 text-muted-foreground mb-4"/>
          <p className="text-center text-muted-foreground max-w-md">
            {disabledMessage || 'Esta configuración no está disponible actualmente'}
          </p>
        </card_1.CardContent>
      </card_1.Card>);
    }
    const isEnvironmentTest = environment === 'TEST';
    const environmentLabel = isEnvironmentTest ? 'Pruebas' : 'Producción';
    return (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Certificate Upload */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Shield className="h-5 w-5"/>
              Certificado Digital
            </card_1.CardTitle>
            <card_1.CardDescription>
              Cargue el certificado .p12, .pfx o .crt proporcionado por Hacienda para el ambiente de {environmentLabel.toLowerCase()}
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            {config?.certificateInfo ? (<alert_1.Alert className="bg-emerald-500/10 border-emerald-500/20">
                <lucide_react_1.CheckCircle2 className="h-4 w-4 text-emerald-600"/>
                <alert_1.AlertDescription className="ml-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Certificado cargado: {config.certificateInfo.fileName}</span>
                    <span className="text-sm text-muted-foreground">
                      NIT: {config.certificateInfo.nit || 'N/A'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Válido hasta: {new Date(config.certificateInfo.validUntil).toLocaleDateString()}
                    </span>
                  </div>
                </alert_1.AlertDescription>
              </alert_1.Alert>) : null}

            <div className="space-y-2">
              <label_1.Label htmlFor="certificate">
                {config?.certificateInfo ? 'Reemplazar certificado' : 'Seleccionar certificado'}
              </label_1.Label>
              <div className="flex items-center gap-3">
                <input_1.Input ref={fileInputRef} id="certificate" type="file" accept=".p12,.pfx,.crt,.cer,.pem" onChange={handleFileSelect} className="hidden"/>
                <button_1.Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                  <lucide_react_1.Upload className="h-4 w-4 mr-2"/>
                  Seleccionar archivo
                </button_1.Button>
                {certificateFile && (<span className="text-sm text-muted-foreground">
                    {certificateFile.name}
                  </span>)}
              </div>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="certPassword">Contraseña del certificado</label_1.Label>
              <input_1.Input id="certPassword" type="password" value={certificatePassword} onChange={(e) => setCertificatePassword(e.target.value)} placeholder="Ingrese la contraseña del certificado" disabled={saving}/>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* API Credentials */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Key className="h-5 w-5"/>
              Credenciales de API
            </card_1.CardTitle>
            <card_1.CardDescription>
              Ingrese las credenciales de API proporcionadas por Hacienda para autenticación
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div className="space-y-2">
              <label_1.Label htmlFor="apiUser">Usuario de API</label_1.Label>
              <input_1.Input id="apiUser" type="text" value={apiUser} onChange={(e) => setApiUser(e.target.value)} placeholder="NIT sin guiones (ej: 06141234567890)" disabled={saving}/>
              <p className="text-xs text-muted-foreground">
                Generalmente es el NIT del contribuyente sin guiones
              </p>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="apiPassword">Contraseña de API</label_1.Label>
              <input_1.Input id="apiPassword" type="password" value={apiPassword} onChange={(e) => setApiPassword(e.target.value)} placeholder="Contraseña asignada por Hacienda" disabled={saving}/>
              <p className="text-xs text-muted-foreground">
                Debe tener entre 13-25 caracteres, incluir letras, números y caracteres especiales
              </p>
            </div>

            <button_1.Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (<>
                  <lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                  Guardando...
                </>) : (<>
                  Guardar configuración
                </>)}
            </button_1.Button>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* Connection Status Sidebar */}
      <div className="space-y-6">
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Estado de Conexión</card_1.CardTitle>
            <card_1.CardDescription>
              Verifique la conexión con Hacienda
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {config?.isValidated ? (<lucide_react_1.CheckCircle2 className="h-5 w-5 text-emerald-600"/>) : (<lucide_react_1.XCircle className="h-5 w-5 text-muted-foreground"/>)}
                <span className="font-medium">
                  {config?.isValidated ? 'Conectado' : 'Sin validar'}
                </span>
              </div>
              {config?.isValidated && config.tokenExpiry && (<span className="text-xs text-muted-foreground">
                  Expira: {new Date(config.tokenExpiry).toLocaleString()}
                </span>)}
            </div>

            {config?.lastValidationError && (<alert_1.Alert variant="destructive">
                <lucide_react_1.XCircle className="h-4 w-4"/>
                <alert_1.AlertDescription className="ml-2 text-sm">
                  {config.lastValidationError}
                </alert_1.AlertDescription>
              </alert_1.Alert>)}

            <button_1.Button onClick={handleTestConnection} disabled={!config?.isConfigured || testing} variant="outline" className="w-full">
              {testing ? (<>
                  <lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                  Probando...
                </>) : (<>
                  Probar conexión
                </>)}
            </button_1.Button>

            {config?.isValidated && (<button_1.Button onClick={handleRenewToken} disabled={renewing} variant="ghost" className="w-full">
                {renewing ? (<>
                    <lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                    Renovando...
                  </>) : (<>
                    <lucide_react_1.RefreshCw className="h-4 w-4 mr-2"/>
                    Renovar token
                  </>)}
              </button_1.Button>)}
          </card_1.CardContent>
        </card_1.Card>

        {/* Help Card */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="text-base">Información</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="text-sm text-muted-foreground space-y-3">
            <div className="flex items-start gap-2">
              <lucide_react_1.Calendar className="h-4 w-4 mt-0.5 shrink-0"/>
              <p>
                Los tokens de {isEnvironmentTest ? 'pruebas' : 'producción'} tienen validez de{' '}
                <strong>{isEnvironmentTest ? '48' : '24'} horas</strong>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <lucide_react_1.Shield className="h-4 w-4 mt-0.5 shrink-0"/>
              <p>
                Sus credenciales se almacenan de forma encriptada y segura
              </p>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
}
