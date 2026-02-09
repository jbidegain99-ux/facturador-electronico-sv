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
exports.default = HaciendaConfigPage;
const React = __importStar(require("react"));
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const tabs_1 = require("@/components/ui/tabs");
const toast_1 = require("@/components/ui/toast");
const EnvironmentConfig_1 = require("./components/EnvironmentConfig");
const TestCenterDashboard_1 = require("./components/TestCenter/TestCenterDashboard");
const ConfigurationStatus_1 = require("./components/ConfigurationStatus");
const SetupSelector_1 = require("./components/SetupSelector");
const QuickSetup_1 = require("./components/QuickSetup");
function HaciendaConfigPage() {
    const router = (0, navigation_1.useRouter)();
    const toast = (0, toast_1.useToast)();
    const toastRef = React.useRef(toast);
    toastRef.current = toast;
    // State
    const [loading, setLoading] = React.useState(true);
    const [config, setConfig] = React.useState(null);
    const [testProgress, setTestProgress] = React.useState(null);
    const [activeTab, setActiveTab] = React.useState('config');
    const [activeEnvironment, setActiveEnvironment] = React.useState('TEST');
    const [viewMode, setViewMode] = React.useState('loading');
    // Load configuration
    const loadConfig = React.useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hacienda/config`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
                setActiveEnvironment(data.activeEnvironment || 'TEST');
                // Determine view mode based on configuration state
                const hasTestConfig = data.testConfig?.isConfigured;
                const hasProdConfig = data.prodConfig?.isConfigured;
                if (hasTestConfig || hasProdConfig) {
                    setViewMode('configured');
                }
                else {
                    setViewMode('selector');
                }
            }
            else {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.message || 'Error al cargar configuracion');
            }
        }
        catch (error) {
            toastRef.current.error(error instanceof Error ? error.message : 'Error al cargar configuracion');
            setViewMode('selector');
        }
        finally {
            setLoading(false);
        }
    }, []);
    // Load test progress
    const loadTestProgress = React.useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hacienda/tests/progress`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (res.ok) {
                const data = await res.json();
                setTestProgress(data);
            }
        }
        catch (error) {
            console.error('Error loading test progress:', error);
        }
    }, []);
    React.useEffect(() => {
        loadConfig();
        loadTestProgress();
    }, [loadConfig, loadTestProgress]);
    // Handle quick setup selection
    const handleSelectQuickSetup = () => {
        setViewMode('quick-setup');
    };
    // Handle full wizard selection
    const handleSelectFullWizard = () => {
        router.push('/onboarding-hacienda');
    };
    // Handle quick setup back
    const handleQuickSetupBack = () => {
        setViewMode('selector');
    };
    // Handle quick setup completion
    const handleQuickSetupComplete = () => {
        toast.success('Configuracion completada exitosamente');
        loadConfig();
        loadTestProgress();
        setViewMode('configured');
    };
    // Loading state
    if (loading || viewMode === 'loading') {
        return (<div className="flex items-center justify-center min-h-[400px]">
        <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
      </div>);
    }
    // Setup Selector view
    if (viewMode === 'selector') {
        return (<div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button_1.Button variant="ghost" size="icon" onClick={() => router.push('/configuracion')}>
            <lucide_react_1.ArrowLeft className="h-5 w-5"/>
          </button_1.Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <lucide_react_1.Building2 className="h-6 w-6 text-primary"/>
              Configuracion de Hacienda
            </h1>
            <p className="text-muted-foreground">
              Configure su integracion con el Ministerio de Hacienda de El Salvador
            </p>
          </div>
        </div>

        <SetupSelector_1.SetupSelector onSelectQuickSetup={handleSelectQuickSetup} onSelectFullWizard={handleSelectFullWizard}/>
      </div>);
    }
    // Quick Setup Wizard view
    if (viewMode === 'quick-setup') {
        return (<div className="space-y-6">
        <QuickSetup_1.QuickSetupWizard onBack={handleQuickSetupBack} onComplete={handleQuickSetupComplete}/>
      </div>);
    }
    // Configured view (normal page)
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button_1.Button variant="ghost" size="icon" onClick={() => router.push('/configuracion')}>
            <lucide_react_1.ArrowLeft className="h-5 w-5"/>
          </button_1.Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <lucide_react_1.Building2 className="h-6 w-6 text-primary"/>
              Configuracion de Hacienda
            </h1>
            <p className="text-muted-foreground">
              Configure su integracion con el Ministerio de Hacienda de El Salvador
            </p>
          </div>
        </div>

        <ConfigurationStatus_1.ConfigurationStatus config={config} testProgress={testProgress}/>
      </div>

      {/* Main Content */}
      <tabs_1.Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="space-y-6">
        <tabs_1.TabsList className="grid w-full max-w-md grid-cols-2">
          <tabs_1.TabsTrigger value="config">Configuracion</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="tests">Centro de Pruebas</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        <tabs_1.TabsContent value="config" className="space-y-6">
          {/* Environment Tabs */}
          <tabs_1.Tabs value={activeEnvironment} onValueChange={(v) => setActiveEnvironment(v)} className="space-y-4">
            <tabs_1.TabsList>
              <tabs_1.TabsTrigger value="TEST" className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500"/>
                Ambiente de Pruebas
              </tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="PRODUCTION" className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"/>
                Produccion
              </tabs_1.TabsTrigger>
            </tabs_1.TabsList>

            <tabs_1.TabsContent value="TEST">
              <EnvironmentConfig_1.EnvironmentConfig environment="TEST" config={config?.testConfig || null} onConfigured={() => {
            loadConfig();
            loadTestProgress();
        }}/>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="PRODUCTION">
              <EnvironmentConfig_1.EnvironmentConfig environment="PRODUCTION" config={config?.prodConfig || null} disabled={config?.testingStatus !== 'AUTHORIZED'} disabledMessage="Debe completar las pruebas y obtener autorizacion antes de configurar produccion" onConfigured={() => {
            loadConfig();
        }}/>
            </tabs_1.TabsContent>
          </tabs_1.Tabs>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="tests">
          <TestCenterDashboard_1.TestCenterDashboard progress={testProgress} onTestExecuted={() => {
            loadTestProgress();
            loadConfig();
        }}/>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
