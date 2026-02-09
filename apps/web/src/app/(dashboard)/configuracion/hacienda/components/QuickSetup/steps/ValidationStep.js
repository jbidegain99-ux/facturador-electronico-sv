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
exports.ValidationStep = ValidationStep;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const alert_1 = require("@/components/ui/alert");
const progress_1 = require("@/components/ui/progress");
const utils_1 = require("@/lib/utils");
function ValidationStep({ data, onBack, onComplete }) {
    const [phase, setPhase] = React.useState('idle');
    const [progress, setProgress] = React.useState(0);
    const [result, setResult] = React.useState(null);
    const [error, setError] = React.useState(null);
    const startValidation = async () => {
        setPhase('uploading');
        setProgress(10);
        setError(null);
        setResult(null);
        try {
            // Simulate phases for better UX
            await new Promise((r) => setTimeout(r, 500));
            setPhase('validating-cert');
            setProgress(30);
            await new Promise((r) => setTimeout(r, 500));
            setPhase('validating-auth');
            setProgress(50);
            // Prepare form data
            const formData = new FormData();
            formData.append('certificate', data.certificate);
            formData.append('certificatePassword', data.certificatePassword);
            formData.append('environment', data.environment);
            formData.append('apiUser', data.apiUser);
            formData.append('apiPassword', data.apiPassword);
            setProgress(70);
            setPhase('saving');
            // Call quick-setup endpoint
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hacienda/quick-setup`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            const response = await res.json();
            setProgress(100);
            if (response.success) {
                setPhase('complete');
                setResult(response);
            }
            else {
                setPhase('error');
                setError(response.errors?.[0]?.message || response.message || 'Error desconocido');
            }
        }
        catch (err) {
            setPhase('error');
            setError(err instanceof Error ? err.message : 'Error de conexion');
        }
    };
    // Auto-start validation when component mounts
    React.useEffect(() => {
        startValidation();
    }, []);
    const phaseLabels = {
        idle: 'Preparando...',
        uploading: 'Subiendo certificado...',
        'validating-cert': 'Validando certificado...',
        'validating-auth': 'Verificando credenciales con Hacienda...',
        saving: 'Guardando configuracion...',
        complete: 'Configuracion completada!',
        error: 'Error en la configuracion',
    };
    if (phase === 'complete' && result?.success) {
        return (<div className="space-y-6 max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30">
            <lucide_react_1.CheckCircle className="h-10 w-10 text-green-400"/>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-green-400">Configuracion Exitosa!</h3>
            <p className="text-muted-foreground mt-2">
              Tu ambiente de{' '}
              <span className={result.data?.environment === 'TEST' ? 'text-amber-400' : 'text-emerald-400'}>
                {result.data?.environment === 'TEST' ? 'Pruebas' : 'Produccion'}
              </span>{' '}
              ha sido configurado correctamente.
            </p>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid gap-4">
          {/* Certificate Info */}
          <card_1.Card variant="glass" className="border-green-500/30">
            <card_1.CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <lucide_react_1.FileKey2 className="h-6 w-6 text-green-500"/>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Certificado Validado</p>
                  <p className="text-sm text-muted-foreground">
                    NIT: {result.data?.certificate.nit || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expira en {result.data?.certificate.daysUntilExpiry} dias
                  </p>
                </div>
                <lucide_react_1.CheckCircle className="h-6 w-6 text-green-500"/>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Auth Info */}
          <card_1.Card variant="glass" className="border-green-500/30">
            <card_1.CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <lucide_react_1.Key className="h-6 w-6 text-green-500"/>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Autenticacion Exitosa</p>
                  <p className="text-sm text-muted-foreground">
                    Token valido hasta:{' '}
                    {result.data?.authentication.tokenExpiresAt
                ? new Date(result.data.authentication.tokenExpiresAt).toLocaleString()
                : 'N/A'}
                  </p>
                </div>
                <lucide_react_1.CheckCircle className="h-6 w-6 text-green-500"/>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        {/* Next Steps */}
        <alert_1.Alert className="bg-primary/10 border-primary/30">
          <lucide_react_1.Server className="h-4 w-4"/>
          <alert_1.AlertDescription>
            <strong>Siguiente paso:</strong> Ahora puedes ir al Centro de Pruebas para ejecutar
            las pruebas tecnicas requeridas por Hacienda, o comenzar a crear facturas si ya
            tienes autorizacion.
          </alert_1.AlertDescription>
        </alert_1.Alert>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-4">
          <button_1.Button onClick={onComplete}>
            Continuar al Dashboard
            <lucide_react_1.ArrowRight className="h-4 w-4 ml-2"/>
          </button_1.Button>
        </div>
      </div>);
    }
    if (phase === 'error') {
        return (<div className="space-y-6 max-w-2xl mx-auto">
        {/* Error Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30">
            <lucide_react_1.XCircle className="h-10 w-10 text-red-400"/>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-red-400">Error de Configuracion</h3>
            <p className="text-muted-foreground mt-2">
              No pudimos completar la configuracion. Por favor verifica los datos e intenta de nuevo.
            </p>
          </div>
        </div>

        {/* Error Details */}
        <alert_1.Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
          <lucide_react_1.AlertCircle className="h-4 w-4"/>
          <alert_1.AlertDescription>
            <strong>Error:</strong> {error}
          </alert_1.AlertDescription>
        </alert_1.Alert>

        {/* Troubleshooting */}
        <card_1.Card variant="glass">
          <card_1.CardContent className="p-4 space-y-3">
            <p className="font-medium">Posibles soluciones:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                Verifica que la contrasena del certificado sea correcta
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                Asegurate que el certificado no haya expirado
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                Confirma que el usuario y contrasena de API sean correctos
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">4.</span>
                Verifica que el ambiente seleccionado coincida con tus credenciales
              </li>
            </ul>
          </card_1.CardContent>
        </card_1.Card>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <button_1.Button variant="ghost" onClick={onBack}>
            Volver y Corregir
          </button_1.Button>
          <button_1.Button onClick={startValidation}>
            <lucide_react_1.RefreshCw className="h-4 w-4 mr-2"/>
            Reintentar
          </button_1.Button>
        </div>
      </div>);
    }
    // Loading state
    return (<div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/20 border border-purple-500/30">
          <lucide_react_1.Loader2 className="h-10 w-10 text-purple-400 animate-spin"/>
        </div>
        <div>
          <h3 className="text-2xl font-bold">Validando Configuracion</h3>
          <p className="text-muted-foreground mt-2">{phaseLabels[phase]}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <progress_1.Progress value={progress} className="h-2"/>
        <p className="text-center text-sm text-muted-foreground">{progress}%</p>
      </div>

      {/* Steps Progress */}
      <card_1.Card variant="glass">
        <card_1.CardContent className="p-4 space-y-3">
          <ValidationPhaseItem label="Subir certificado" status={phase === 'uploading' ? 'active' : progress >= 10 ? 'complete' : 'pending'}/>
          <ValidationPhaseItem label="Validar certificado" status={phase === 'validating-cert' ? 'active' : progress >= 30 ? 'complete' : 'pending'}/>
          <ValidationPhaseItem label="Verificar credenciales con Hacienda" status={phase === 'validating-auth' ? 'active' : progress >= 50 ? 'complete' : 'pending'}/>
          <ValidationPhaseItem label="Guardar configuracion" status={phase === 'saving' ? 'active' : progress >= 70 ? 'complete' : 'pending'}/>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
function ValidationPhaseItem({ label, status }) {
    return (<div className="flex items-center gap-3">
      <div className={(0, utils_1.cn)('w-6 h-6 rounded-full flex items-center justify-center', status === 'complete' && 'bg-green-500', status === 'active' && 'bg-primary', status === 'pending' && 'bg-muted')}>
        {status === 'complete' ? (<lucide_react_1.CheckCircle className="h-4 w-4 text-white"/>) : status === 'active' ? (<lucide_react_1.Loader2 className="h-4 w-4 text-white animate-spin"/>) : (<div className="w-2 h-2 rounded-full bg-muted-foreground/50"/>)}
      </div>
      <span className={(0, utils_1.cn)('text-sm', status === 'complete' && 'text-green-500', status === 'active' && 'text-primary', status === 'pending' && 'text-muted-foreground')}>
        {label}
      </span>
    </div>);
}
