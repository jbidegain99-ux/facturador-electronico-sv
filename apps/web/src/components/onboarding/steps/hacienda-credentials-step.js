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
exports.HaciendaCredentialsStep = HaciendaCredentialsStep;
const React = __importStar(require("react"));
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const alert_1 = require("@/components/ui/alert");
function HaciendaCredentialsStep({ data, onSubmit, onBack, loading, }) {
    const [formData, setFormData] = React.useState({
        haciendaUser: '',
        haciendaPassword: '',
    });
    const [showPassword, setShowPassword] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };
    const validate = () => {
        const newErrors = {};
        if (!formData.haciendaUser) {
            newErrors.haciendaUser = 'El usuario es requerido';
        }
        else if (formData.haciendaUser.length < 14) {
            newErrors.haciendaUser = 'El usuario debe tener al menos 14 caracteres';
        }
        if (!formData.haciendaPassword) {
            newErrors.haciendaPassword = 'La contraseña es requerida';
        }
        else if (formData.haciendaPassword.length < 6) {
            newErrors.haciendaPassword =
                'La contraseña debe tener al menos 6 caracteres';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <lucide_react_1.Key className="h-6 w-6 text-primary"/>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Credenciales de Hacienda</h2>
          <p className="text-muted-foreground">
            Configure sus credenciales de Servicios en Línea del MH
          </p>
        </div>
      </div>

      {/* Info alert */}
      <alert_1.Alert>
        <lucide_react_1.AlertCircle className="h-4 w-4"/>
        <alert_1.AlertDescription>
          <div className="space-y-2">
            <p>
              <strong>¿Dónde obtengo estas credenciales?</strong>
            </p>
            <p className="text-sm">
              Estas son las credenciales que utiliza para acceder al portal de
              Servicios en Línea del Ministerio de Hacienda. El usuario
              generalmente es su NIT sin guiones.
            </p>
            <a href="https://portaldgii.mh.gob.sv/ssc/login" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              Ir a Servicios en Línea del MH
              <lucide_react_1.ExternalLink className="h-3 w-3"/>
            </a>
          </div>
        </alert_1.AlertDescription>
      </alert_1.Alert>

      {data?.hasHaciendaCredentials && (<alert_1.Alert className="border-green-500 bg-green-500/10">
          <lucide_react_1.CheckCircle2 className="h-4 w-4 text-green-500"/>
          <alert_1.AlertDescription className="text-green-700 dark:text-green-400">
            Ya tiene credenciales configuradas. Puede actualizarlas si lo desea.
          </alert_1.AlertDescription>
        </alert_1.Alert>)}

      <form onSubmit={handleSubmit} className="space-y-6">
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Credenciales de Acceso</card_1.CardTitle>
            <card_1.CardDescription>
              Ingrese sus credenciales de Servicios en Línea del MH
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div className="space-y-2">
              <label_1.Label htmlFor="haciendaUser">
                Usuario (NIT sin guiones) <span className="text-red-500">*</span>
              </label_1.Label>
              <input_1.Input id="haciendaUser" placeholder="00000000000000" value={formData.haciendaUser} onChange={(e) => handleChange('haciendaUser', e.target.value)} className={errors.haciendaUser ? 'border-red-500' : ''}/>
              {errors.haciendaUser && (<p className="text-sm text-red-500">{errors.haciendaUser}</p>)}
              <p className="text-xs text-muted-foreground">
                Generalmente es su NIT sin guiones (14 dígitos)
              </p>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="haciendaPassword">
                Contraseña <span className="text-red-500">*</span>
              </label_1.Label>
              <div className="relative">
                <input_1.Input id="haciendaPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.haciendaPassword} onChange={(e) => handleChange('haciendaPassword', e.target.value)} className={errors.haciendaPassword ? 'border-red-500 pr-10' : 'pr-10'}/>
                <button_1.Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (<lucide_react_1.EyeOff className="h-4 w-4"/>) : (<lucide_react_1.Eye className="h-4 w-4"/>)}
                </button_1.Button>
              </div>
              {errors.haciendaPassword && (<p className="text-sm text-red-500">{errors.haciendaPassword}</p>)}
              <p className="text-xs text-muted-foreground">
                Contraseña de Servicios en Línea del MH
              </p>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Security note */}
        <card_1.Card className="bg-muted/50">
          <card_1.CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <lucide_react_1.Key className="h-5 w-5 text-primary"/>
              </div>
              <div>
                <p className="font-medium">Sus credenciales están seguras</p>
                <p className="text-sm text-muted-foreground">
                  Sus credenciales se almacenan de forma encriptada (AES-256) y
                  solo se utilizan para realizar operaciones con el Ministerio
                  de Hacienda en su nombre.
                </p>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <button_1.Button type="button" variant="outline" onClick={onBack}>
            <lucide_react_1.ArrowLeft className="mr-2 h-4 w-4"/>
            Anterior
          </button_1.Button>
          <button_1.Button type="submit" disabled={loading}>
            {loading ? (<>
                <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                Verificando...
              </>) : (<>
                Continuar
                <lucide_react_1.ArrowRight className="ml-2 h-4 w-4"/>
              </>)}
          </button_1.Button>
        </div>
      </form>
    </div>);
}
