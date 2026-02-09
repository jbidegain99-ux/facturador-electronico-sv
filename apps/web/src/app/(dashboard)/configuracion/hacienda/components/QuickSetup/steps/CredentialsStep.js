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
exports.CredentialsStep = CredentialsStep;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const card_1 = require("@/components/ui/card");
const alert_1 = require("@/components/ui/alert");
const lucide_react_2 = require("lucide-react");
function CredentialsStep({ apiUser: initialUser, apiPassword: initialPassword, environment, onSubmit, onBack, }) {
    const [apiUser, setApiUser] = React.useState(initialUser);
    const [apiPassword, setApiPassword] = React.useState(initialPassword);
    const [showPassword, setShowPassword] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [validating, setValidating] = React.useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        // Basic validation
        if (!apiUser.trim()) {
            setError('El usuario de API es requerido');
            return;
        }
        if (!apiPassword) {
            setError('La contrasena de API es requerida');
            return;
        }
        if (apiPassword.length < 8) {
            setError('La contrasena debe tener al menos 8 caracteres');
            return;
        }
        // Optional: validate credentials before proceeding
        setValidating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hacienda/validate-connection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    apiUser: apiUser.trim(),
                    apiPassword,
                    environment,
                }),
            });
            const result = await res.json();
            if (!result.success) {
                setError(result.error || 'Credenciales invalidas');
                setValidating(false);
                return;
            }
            // Credentials are valid, proceed
            onSubmit(apiUser.trim(), apiPassword);
        }
        catch (err) {
            setError('Error al validar credenciales. Intenta nuevamente.');
        }
        finally {
            setValidating(false);
        }
    };
    const portalUrl = environment === 'PRODUCTION'
        ? 'https://portaldgii.mh.gob.sv/ssc/login'
        : 'https://portaldgii.mh.gob.sv/ssc/login';
    return (<form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Credenciales de API</h3>
        <p className="text-muted-foreground">
          Ingresa las credenciales de API para el ambiente de{' '}
          <span className={environment === 'TEST' ? 'text-amber-400' : 'text-emerald-400'}>
            {environment === 'TEST' ? 'Pruebas' : 'Produccion'}
          </span>
        </p>
      </div>

      {/* Form Card */}
      <card_1.Card variant="glass">
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2 text-lg">
            <lucide_react_1.Key className="h-5 w-5 text-primary"/>
            Credenciales de Hacienda
          </card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-4">
          {/* API User */}
          <div className="space-y-2">
            <label_1.Label htmlFor="apiUser">Usuario de API (NIT)</label_1.Label>
            <input_1.Input id="apiUser" type="text" value={apiUser} onChange={(e) => setApiUser(e.target.value)} placeholder="06141234567890"/>
            <p className="text-xs text-muted-foreground">
              Generalmente es tu NIT sin guiones (14 digitos)
            </p>
          </div>

          {/* API Password */}
          <div className="space-y-2">
            <label_1.Label htmlFor="apiPassword">Contrasena de API</label_1.Label>
            <div className="relative">
              <input_1.Input id="apiPassword" type={showPassword ? 'text' : 'password'} value={apiPassword} onChange={(e) => setApiPassword(e.target.value)} placeholder="Tu contrasena de API" className="pr-10"/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <lucide_react_1.EyeOff className="h-4 w-4"/> : <lucide_react_1.Eye className="h-4 w-4"/>}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Esta contrasena se genera en el portal de Hacienda (minimo 8 caracteres)
            </p>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Error Alert */}
      {error && (<alert_1.Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
          <lucide_react_1.AlertCircle className="h-4 w-4"/>
          <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
        </alert_1.Alert>)}

      {/* Help Card */}
      <card_1.Card variant="glass">
        <card_1.CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
                <lucide_react_1.ExternalLink className="h-5 w-5 text-info"/>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">No tienes tus credenciales de API?</p>
              <p className="text-xs text-muted-foreground">
                Puedes obtener o regenerar tus credenciales desde el portal de Hacienda.
              </p>
              <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1">
                Ir al portal de Hacienda
                <lucide_react_1.ExternalLink className="h-3 w-3"/>
              </a>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Security Note */}
      <alert_1.Alert className="bg-muted/50 border-border">
        <lucide_react_1.Shield className="h-4 w-4"/>
        <alert_1.AlertDescription>
          <strong>Seguridad:</strong> Tus credenciales se almacenan de forma encriptada (AES-256).
          Nunca compartimos tu informacion con terceros.
        </alert_1.AlertDescription>
      </alert_1.Alert>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <button_1.Button type="button" variant="ghost" onClick={onBack} disabled={validating}>
          Atras
        </button_1.Button>
        <button_1.Button type="submit" disabled={!apiUser || !apiPassword || validating}>
          {validating ? (<>
              <lucide_react_2.Loader2 className="h-4 w-4 mr-2 animate-spin"/>
              Validando...
            </>) : ('Continuar')}
        </button_1.Button>
      </div>
    </form>);
}
