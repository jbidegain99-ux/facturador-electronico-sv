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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OnboardingHaciendaPage;
const React = __importStar(require("react"));
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const onboarding_1 = require("@/components/onboarding");
const button_1 = require("@/components/ui/button");
function OnboardingHaciendaPage() {
    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [demoMode, setDemoMode] = React.useState(false);
    React.useEffect(() => {
        loadOnboardingData();
    }, []);
    const loadOnboardingData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No hay sesion activa');
                setLoading(false);
                return;
            }
            // Fetch both onboarding status and data in parallel
            const [statusRes, onboardingRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/me/onboarding-status`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }),
            ]);
            // Check demo mode status
            if (statusRes.ok) {
                const statusData = await statusRes.json();
                if (statusData.demoMode) {
                    setDemoMode(true);
                    setLoading(false);
                    return;
                }
            }
            // Process onboarding data
            if (onboardingRes.ok) {
                const text = await onboardingRes.text();
                if (text) {
                    try {
                        const result = JSON.parse(text);
                        // Only set data if onboarding exists (not null/404)
                        if (result && result.id) {
                            setData(result);
                        }
                    }
                    catch {
                        // Empty or invalid JSON response, treat as no onboarding yet
                        console.log('No onboarding data found, starting fresh');
                    }
                }
            }
            else if (onboardingRes.status !== 404) {
                // 404 means not started yet, which is fine
                const text = await onboardingRes.text();
                if (text) {
                    console.warn('Onboarding error:', text);
                }
            }
        }
        catch (err) {
            console.error('Error loading onboarding:', err);
            setError('Error al cargar datos de onboarding');
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (<div className="flex items-center justify-center min-h-[600px]">
        <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
      </div>);
    }
    if (error) {
        return (<div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-primary hover:underline">
            Intentar de nuevo
          </button>
        </div>
      </div>);
    }
    // Demo mode message
    if (demoMode) {
        return (<div className="container max-w-2xl py-16">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center mb-6">
            <lucide_react_1.AlertTriangle className="h-8 w-8 text-yellow-500"/>
          </div>

          <h1 className="text-2xl font-bold mb-3">Modo Demostracion Activo</h1>

          <p className="text-muted-foreground mb-6">
            El proceso de onboarding con el Ministerio de Hacienda no esta disponible
            mientras el modo demostracion esta activo.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">¿Que es el modo demo?</strong>
              <br />
              En modo demo, puedes explorar todas las funcionalidades de la plataforma
              sin conectar con el Ministerio de Hacienda. Las facturas generadas son
              simuladas y no tienen validez legal.
            </p>
          </div>

          <p className="text-sm text-muted-foreground mb-8">
            Para completar el proceso de habilitacion con Hacienda, primero desactiva
            el modo demo desde la configuracion de tu empresa.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button_1.Button variant="outline" asChild>
              <link_1.default href="/configuracion">
                <lucide_react_1.Settings className="w-4 h-4 mr-2"/>
                Ir a Configuracion
              </link_1.default>
            </button_1.Button>
            <button_1.Button asChild className="btn-primary">
              <link_1.default href="mailto:soporte@republicode.io">
                <lucide_react_1.Mail className="w-4 h-4 mr-2"/>
                Contactar Soporte
              </link_1.default>
            </button_1.Button>
          </div>
        </div>
      </div>);
    }
    return (<div className="container max-w-7xl py-8">
      <onboarding_1.HaciendaWizard initialData={data}/>
    </div>);
}
