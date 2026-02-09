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
exports.OnboardingChecklist = OnboardingChecklist;
exports.useOnboardingStatus = useOnboardingStatus;
const React = __importStar(require("react"));
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const utils_1 = require("@/lib/utils");
function OnboardingChecklist({ status, onDismiss, className, }) {
    const router = (0, navigation_1.useRouter)();
    const steps = [
        {
            id: 'company',
            label: 'Datos de empresa',
            description: 'Registrar informacion de tu empresa',
            completed: status.hasCompanyData,
            action: () => router.push('/configuracion'),
            actionLabel: 'Configurar',
        },
        {
            id: 'certificate',
            label: 'Certificado digital',
            description: 'Subir certificado .p12 del MH',
            completed: status.hasCertificate,
            action: () => router.push('/configuracion?tab=certificado'),
            actionLabel: 'Subir',
        },
        {
            id: 'connection',
            label: 'Conexion con MH',
            description: 'Probar conexion con Hacienda',
            completed: status.hasTestedConnection,
            action: () => router.push('/configuracion?tab=conexion'),
            actionLabel: 'Probar',
        },
        {
            id: 'invoice',
            label: 'Primera factura',
            description: 'Crear tu primera factura de prueba',
            completed: status.hasFirstInvoice,
            action: () => router.push('/facturas/nueva'),
            actionLabel: 'Crear',
        },
    ];
    const completedCount = steps.filter((s) => s.completed).length;
    const progress = (completedCount / steps.length) * 100;
    const allCompleted = completedCount === steps.length;
    // Don't show if all completed
    if (allCompleted) {
        return null;
    }
    return (<div className={(0, utils_1.cn)('glass-card p-5', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <lucide_react_1.Rocket className="w-5 h-5 text-primary"/>
          </div>
          <div>
            <h3 className="font-semibold text-white">
              Configura tu cuenta ({completedCount}/{steps.length})
            </h3>
            <p className="text-sm text-muted-foreground">
              Completa estos pasos para empezar a facturar
            </p>
          </div>
        </div>
        {onDismiss && (<button_1.Button variant="ghost" size="sm" onClick={onDismiss} className="text-muted-foreground hover:text-white -mr-2 -mt-2">
            <lucide_react_1.X className="w-4 h-4"/>
          </button_1.Button>)}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }}/>
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {progress.toFixed(0)}% completado
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => {
            const Icon = step.id === 'company'
                ? lucide_react_1.Building2
                : step.id === 'certificate'
                    ? lucide_react_1.KeyRound
                    : step.id === 'connection'
                        ? lucide_react_1.Wifi
                        : lucide_react_1.FileText;
            return (<div key={step.id} className={(0, utils_1.cn)('flex items-center justify-between p-3 rounded-lg transition-colors', step.completed
                    ? 'bg-green-500/10'
                    : 'bg-white/5 hover:bg-white/10')}>
              <div className="flex items-center gap-3">
                <div className={(0, utils_1.cn)('w-8 h-8 rounded-full flex items-center justify-center', step.completed
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-muted text-muted-foreground')}>
                  {step.completed ? (<lucide_react_1.Check className="w-4 h-4"/>) : (<Icon className="w-4 h-4"/>)}
                </div>
                <div>
                  <p className={(0, utils_1.cn)('text-sm font-medium', step.completed ? 'text-green-500' : 'text-white')}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>

              {step.completed ? (<span className="text-xs text-green-500 font-medium">
                  Completado
                </span>) : (<button_1.Button size="sm" variant="ghost" onClick={step.action} className="text-primary hover:text-primary hover:bg-primary/20">
                  {step.actionLabel}
                  <lucide_react_1.ChevronRight className="w-4 h-4 ml-1"/>
                </button_1.Button>)}
            </div>);
        })}
      </div>

      {/* Help text */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        ¿Necesitas ayuda?{' '}
        <a href="#" className="text-primary hover:underline">
          Ver guia de inicio
        </a>
      </p>
    </div>);
}
// Hook to get onboarding status
function useOnboardingStatus() {
    const [status, setStatus] = React.useState({
        hasCompanyData: false,
        hasCertificate: false,
        hasTestedConnection: false,
        hasFirstInvoice: false,
    });
    const [isLoading, setIsLoading] = React.useState(true);
    React.useEffect(() => {
        async function fetchStatus() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setIsLoading(false);
                    return;
                }
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/me/onboarding-status`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setStatus(data);
                }
            }
            catch (error) {
                console.error('Error fetching onboarding status:', error);
            }
            finally {
                setIsLoading(false);
            }
        }
        fetchStatus();
    }, []);
    return { status, isLoading };
}
