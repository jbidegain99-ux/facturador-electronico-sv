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
exports.QuickSetupWizard = QuickSetupWizard;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const utils_1 = require("@/lib/utils");
const EnvironmentStep_1 = require("./steps/EnvironmentStep");
const CertificateStep_1 = require("./steps/CertificateStep");
const CredentialsStep_1 = require("./steps/CredentialsStep");
const ValidationStep_1 = require("./steps/ValidationStep");
const steps = [
    { id: 1, title: 'Ambiente', description: 'Selecciona el ambiente' },
    { id: 2, title: 'Certificado', description: 'Sube tu archivo .p12' },
    { id: 3, title: 'Credenciales', description: 'Ingresa usuario y password' },
    { id: 4, title: 'Validar', description: 'Verificar configuracion' },
];
function QuickSetupWizard({ onBack, onComplete }) {
    const [currentStep, setCurrentStep] = React.useState(1);
    const [data, setData] = React.useState({
        environment: null,
        certificate: null,
        certificatePassword: '',
        apiUser: '',
        apiPassword: '',
    });
    const updateData = React.useCallback((updates) => {
        setData((prev) => ({ ...prev, ...updates }));
    }, []);
    const handleNext = React.useCallback(() => {
        if (currentStep < steps.length) {
            setCurrentStep((prev) => prev + 1);
        }
    }, [currentStep]);
    const handlePrev = React.useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
        else {
            onBack();
        }
    }, [currentStep, onBack]);
    const goToStep = React.useCallback((step) => {
        if (step < currentStep) {
            setCurrentStep(step);
        }
    }, [currentStep]);
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (<EnvironmentStep_1.EnvironmentStep environment={data.environment} onSelect={(env) => {
                        updateData({ environment: env });
                        handleNext();
                    }}/>);
            case 2:
                return (<CertificateStep_1.CertificateStep certificate={data.certificate} certificatePassword={data.certificatePassword} onSubmit={(cert, password) => {
                        updateData({ certificate: cert, certificatePassword: password });
                        handleNext();
                    }} onBack={handlePrev}/>);
            case 3:
                return (<CredentialsStep_1.CredentialsStep apiUser={data.apiUser} apiPassword={data.apiPassword} environment={data.environment} onSubmit={(user, password) => {
                        updateData({ apiUser: user, apiPassword: password });
                        handleNext();
                    }} onBack={handlePrev}/>);
            case 4:
                return (<ValidationStep_1.ValidationStep data={data} onBack={handlePrev} onComplete={onComplete}/>);
            default:
                return null;
        }
    };
    return (<div className="space-y-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button_1.Button variant="ghost" size="icon" onClick={onBack}>
          <lucide_react_1.ArrowLeft className="h-5 w-5"/>
        </button_1.Button>
        <div>
          <h2 className="text-2xl font-bold">Configuracion Rapida</h2>
          <p className="text-muted-foreground">
            Configura tu ambiente de Hacienda en minutos
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between px-4">
        {steps.map((step, index) => (<React.Fragment key={step.id}>
            <button onClick={() => goToStep(step.id)} disabled={step.id >= currentStep} className={(0, utils_1.cn)('flex items-center gap-3 transition-all', step.id < currentStep && 'cursor-pointer', step.id >= currentStep && 'cursor-default')}>
              <div className={(0, utils_1.cn)('w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all', step.id < currentStep && 'bg-green-500 text-white', step.id === currentStep && 'bg-purple-600 text-white ring-4 ring-purple-600/20', step.id > currentStep && 'bg-slate-700 text-slate-400')}>
                {step.id < currentStep ? (<lucide_react_1.Check className="h-5 w-5"/>) : (step.id)}
              </div>
              <div className="hidden md:block text-left">
                <p className={(0, utils_1.cn)('text-sm font-medium', step.id === currentStep ? 'text-white' : 'text-muted-foreground')}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </button>
            {index < steps.length - 1 && (<div className={(0, utils_1.cn)('flex-1 h-0.5 mx-2 md:mx-4', step.id < currentStep ? 'bg-green-500' : 'bg-slate-700')}/>)}
          </React.Fragment>))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">{renderStep()}</div>
    </div>);
}
