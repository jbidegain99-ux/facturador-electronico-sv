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
exports.OnboardingWizard = OnboardingWizard;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const utils_1 = require("@/lib/utils");
const steps = [
    { id: 1, name: 'Bienvenida', icon: lucide_react_1.Sparkles },
    { id: 2, name: 'Datos', icon: lucide_react_1.Building2 },
    { id: 3, name: 'Certificado', icon: lucide_react_1.KeyRound },
    { id: 4, name: 'Conexion', icon: lucide_react_1.Wifi },
    { id: 5, name: 'Primera Factura', icon: lucide_react_1.FileText },
];
function OnboardingWizard({ tenantData, onComplete, onSkip, }) {
    const [currentStep, setCurrentStep] = React.useState(1);
    const [isLoading, setIsLoading] = React.useState(false);
    // Certificate state
    const [certificateFile, setCertificateFile] = React.useState(null);
    const [certificatePassword, setCertificatePassword] = React.useState('');
    const [certificateError, setCertificateError] = React.useState(null);
    const [certificateUploaded, setCertificateUploaded] = React.useState(tenantData?.hasCertificate || false);
    // Connection test state
    const [connectionTested, setConnectionTested] = React.useState(false);
    const [connectionError, setConnectionError] = React.useState(null);
    const fileInputRef = React.useRef(null);
    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return true;
            case 2:
                return true; // Data is already filled from registration
            case 3:
                return certificateUploaded;
            case 4:
                return connectionTested;
            case 5:
                return true;
            default:
                return false;
        }
    };
    const handleNext = () => {
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
        else {
            onComplete();
        }
    };
    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const fileName = file.name.toLowerCase();
            if (!fileName.endsWith('.p12') && !fileName.endsWith('.pfx')) {
                if (fileName.endsWith('.cer') || fileName.endsWith('.crt') || fileName.endsWith('.pem')) {
                    setCertificateError('El archivo debe ser .p12 o .pfx (contiene clave privada). Los archivos .cer, .crt o .pem no incluyen la clave privada necesaria para firmar.');
                }
                else {
                    setCertificateError('Formato no soportado. El certificado debe ser .p12 o .pfx');
                }
                return;
            }
            setCertificateFile(file);
            setCertificateError(null);
        }
    };
    const handleUploadCertificate = async () => {
        if (!certificateFile || !certificatePassword) {
            setCertificateError('Selecciona el archivo y escribe la contrasena');
            return;
        }
        setIsLoading(true);
        setCertificateError(null);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('certificate', certificateFile);
            formData.append('password', certificatePassword);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/me/certificate`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Error al subir certificado');
            }
            setCertificateUploaded(true);
        }
        catch (error) {
            setCertificateError(error instanceof Error ? error.message : 'Error al subir certificado');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleTestConnection = async () => {
        setIsLoading(true);
        setConnectionError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/me/test-mh`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Error en conexion con MH');
            }
            setConnectionTested(true);
        }
        catch (error) {
            setConnectionError(error instanceof Error ? error.message : 'Error de conexion');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {steps.map((step, index) => (<React.Fragment key={step.id}>
                <button onClick={() => step.id < currentStep && setCurrentStep(step.id)} disabled={step.id > currentStep} className={(0, utils_1.cn)('flex items-center gap-2 px-3 py-2 rounded-lg transition-all', currentStep === step.id && 'bg-primary text-white', currentStep > step.id && 'bg-primary/20 text-primary cursor-pointer', currentStep < step.id && 'text-muted-foreground')}>
                  <div className={(0, utils_1.cn)('w-8 h-8 rounded-full flex items-center justify-center border-2', currentStep === step.id && 'border-white/50 bg-white/20', currentStep > step.id && 'border-primary bg-primary text-white', currentStep < step.id && 'border-muted-foreground')}>
                    {currentStep > step.id ? (<lucide_react_1.Check className="w-4 h-4"/>) : (<step.icon className="w-4 h-4"/>)}
                  </div>
                  <span className="hidden md:inline text-sm font-medium">
                    {step.name}
                  </span>
                </button>
                {index < steps.length - 1 && (<lucide_react_1.ChevronRight className="w-4 h-4 text-muted-foreground hidden md:block"/>)}
              </React.Fragment>))}
          </div>
        </div>

        {/* Content card */}
        <div className="glass-card p-8">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (<div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                <lucide_react_1.Sparkles className="w-10 h-10 text-primary"/>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  ¡Bienvenido a Facturador SV!
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Vamos a configurar tu cuenta para que puedas empezar a emitir
                  facturas electronicas. Solo tomara unos minutos.
                </p>
              </div>

              <div className="glass-card p-4 text-left max-w-md mx-auto">
                <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                  <lucide_react_1.Clock className="w-4 h-4 text-primary"/>
                  Lo que necesitas tener listo:
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <lucide_react_1.Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"/>
                    <span>Datos de tu empresa (ya los tienes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <lucide_react_1.KeyRound className="w-4 h-4 text-warning mt-0.5 flex-shrink-0"/>
                    <span>
                      Certificado digital (.p12) del Ministerio de Hacienda
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <lucide_react_1.KeyRound className="w-4 h-4 text-warning mt-0.5 flex-shrink-0"/>
                    <span>Contrasena del certificado</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                Tiempo estimado: 3-5 minutos
              </p>

              <div className="glass-card p-4 text-left max-w-md mx-auto border-yellow-500/30">
                <h3 className="font-medium text-yellow-400 mb-2 flex items-center gap-2">
                  <lucide_react_1.Sparkles className="w-4 h-4"/>
                  ¿Solo quieres probar?
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Puedes activar el <strong className="text-white">modo demo</strong> para
                  probar la plataforma sin necesidad de un certificado real.
                  Las facturas se generaran simuladas.
                </p>
                <button_1.Button variant="outline" onClick={onSkip} className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10">
                  <lucide_react_1.Sparkles className="w-4 h-4 mr-2"/>
                  Activar Modo Demo
                </button_1.Button>
              </div>
            </div>)}

          {/* Step 2: Verify Data */}
          {currentStep === 2 && (<div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <lucide_react_1.Building2 className="w-8 h-8 text-primary"/>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Verifica tus datos
                </h2>
                <p className="text-muted-foreground">
                  Estos son los datos que registraste. Puedes editarlos despues
                  en Configuracion.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Razon Social
                  </p>
                  <p className="text-sm font-medium text-white truncate">
                    {tenantData?.nombre || 'No especificado'}
                  </p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground mb-1">NIT</p>
                  <p className="text-sm font-medium text-white font-mono">
                    {tenantData?.nit || 'No especificado'}
                  </p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground mb-1">NRC</p>
                  <p className="text-sm font-medium text-white font-mono">
                    {tenantData?.nrc || 'No especificado'}
                  </p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Actividad
                  </p>
                  <p className="text-sm font-medium text-white">
                    {tenantData?.actividadEcon || 'No especificado'}
                  </p>
                </div>
                <div className="glass-card p-3 col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Correo</p>
                  <p className="text-sm font-medium text-white">
                    {tenantData?.correo || 'No especificado'}
                  </p>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Si los datos son correctos, continua al siguiente paso.
              </p>
            </div>)}

          {/* Step 3: Certificate Upload */}
          {currentStep === 3 && (<div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <lucide_react_1.KeyRound className="w-8 h-8 text-primary"/>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Certificado Digital
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Sube tu certificado digital (.p12) del Ministerio de Hacienda.
                  Este se usa para firmar tus facturas electronicas.
                </p>
              </div>

              {certificateUploaded ? (<div className="max-w-md mx-auto">
                  <div className="glass-card p-6 text-center border-green-500/50">
                    <lucide_react_1.CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3"/>
                    <h3 className="font-semibold text-white mb-1">
                      Certificado Configurado
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Tu certificado digital ha sido subido y validado
                      correctamente.
                    </p>
                  </div>
                </div>) : (<div className="max-w-md mx-auto space-y-4">
                  {/* File drop zone */}
                  <div onClick={() => fileInputRef.current?.click()} className={(0, utils_1.cn)('border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all', certificateFile
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-white/5')}>
                    <input ref={fileInputRef} type="file" accept=".p12,.pfx,.cer,.crt,.pem,application/x-pkcs12" onChange={handleFileChange} className="hidden"/>
                    {certificateFile ? (<>
                        <lucide_react_1.KeyRound className="w-10 h-10 text-primary mx-auto mb-3"/>
                        <p className="font-medium text-white">
                          {certificateFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Click para cambiar archivo
                        </p>
                      </>) : (<>
                        <lucide_react_1.Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3"/>
                        <p className="font-medium text-white">
                          Arrastra tu archivo .p12 o .pfx aqui
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          o haz click para seleccionar (formatos: .p12, .pfx)
                        </p>
                      </>)}
                  </div>

                  {/* Password input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Contrasena del certificado
                    </label>
                    <input_1.Input type="password" value={certificatePassword} onChange={(e) => setCertificatePassword(e.target.value)} placeholder="Ingresa la contrasena" className="input-rc"/>
                  </div>

                  {certificateError && (<div className="flex items-center gap-2 text-sm text-destructive">
                      <lucide_react_1.AlertCircle className="w-4 h-4"/>
                      <span>{certificateError}</span>
                    </div>)}

                  <button_1.Button onClick={handleUploadCertificate} disabled={!certificateFile || !certificatePassword || isLoading} className="w-full btn-primary">
                    {isLoading ? (<>
                        <lucide_react_1.Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                        Subiendo...
                      </>) : (<>
                        <lucide_react_1.Upload className="w-4 h-4 mr-2"/>
                        Subir Certificado
                      </>)}
                  </button_1.Button>
                </div>)}
            </div>)}

          {/* Step 4: Test Connection */}
          {currentStep === 4 && (<div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <lucide_react_1.Wifi className="w-8 h-8 text-primary"/>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Probar Conexion
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Vamos a verificar que tu cuenta puede conectarse correctamente
                  con el Ministerio de Hacienda.
                </p>
              </div>

              <div className="max-w-md mx-auto">
                {connectionTested ? (<div className="glass-card p-6 text-center border-green-500/50">
                    <lucide_react_1.CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3"/>
                    <h3 className="font-semibold text-white mb-1">
                      Conexion Exitosa
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Tu cuenta esta lista para emitir facturas electronicas.
                    </p>
                  </div>) : (<div className="space-y-4">
                    <div className="glass-card p-4">
                      <h3 className="font-medium text-white mb-2">
                        Se verificara:
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <lucide_react_1.Check className="w-4 h-4 text-primary"/>
                          Autenticacion con el MH
                        </li>
                        <li className="flex items-center gap-2">
                          <lucide_react_1.Check className="w-4 h-4 text-primary"/>
                          Validez del certificado
                        </li>
                        <li className="flex items-center gap-2">
                          <lucide_react_1.Check className="w-4 h-4 text-primary"/>
                          Permisos de emision
                        </li>
                      </ul>
                    </div>

                    {connectionError && (<div className="flex items-center gap-2 text-sm text-destructive">
                        <lucide_react_1.AlertCircle className="w-4 h-4"/>
                        <span>{connectionError}</span>
                      </div>)}

                    <button_1.Button onClick={handleTestConnection} disabled={isLoading} className="w-full btn-primary">
                      {isLoading ? (<>
                          <lucide_react_1.Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                          Probando conexion...
                        </>) : (<>
                          <lucide_react_1.Wifi className="w-4 h-4 mr-2"/>
                          Probar Conexion
                        </>)}
                    </button_1.Button>
                  </div>)}
              </div>
            </div>)}

          {/* Step 5: First Invoice */}
          {currentStep === 5 && (<div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <lucide_react_1.CheckCircle2 className="w-8 h-8 text-green-500"/>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  ¡Todo Listo!
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Tu cuenta esta completamente configurada. Ya puedes empezar a
                  emitir facturas electronicas.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div className="glass-card p-4">
                  <h3 className="font-medium text-white mb-3">
                    Configuracion completada:
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <lucide_react_1.CheckCircle2 className="w-4 h-4 text-green-500"/>
                      <span className="text-white">Datos de empresa</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <lucide_react_1.CheckCircle2 className="w-4 h-4 text-green-500"/>
                      <span className="text-white">Certificado digital</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <lucide_react_1.CheckCircle2 className="w-4 h-4 text-green-500"/>
                      <span className="text-white">Conexion con MH</span>
                    </li>
                  </ul>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  ¿Quieres crear tu primera factura de prueba?
                </div>
              </div>
            </div>)}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <div>
              {currentStep > 1 ? (<button_1.Button variant="ghost" onClick={handleBack}>
                  <lucide_react_1.ChevronLeft className="w-4 h-4 mr-1"/>
                  Anterior
                </button_1.Button>) : (<button_1.Button variant="ghost" onClick={onSkip}>
                  Saltar por ahora
                </button_1.Button>)}
            </div>

            <button_1.Button onClick={handleNext} disabled={!canProceed()} className="btn-primary">
              {currentStep === 5 ? (<>
                  Ir al Dashboard
                  <lucide_react_1.ChevronRight className="w-4 h-4 ml-1"/>
                </>) : (<>
                  Continuar
                  <lucide_react_1.ChevronRight className="w-4 h-4 ml-1"/>
                </>)}
            </button_1.Button>
          </div>
        </div>
      </div>
    </div>);
}
