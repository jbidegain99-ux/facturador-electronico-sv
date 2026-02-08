'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { EnvironmentConfig } from './components/EnvironmentConfig';
import { TestCenterDashboard } from './components/TestCenter/TestCenterDashboard';
import { ConfigurationStatus } from './components/ConfigurationStatus';
import { SetupSelector } from './components/SetupSelector';
import { QuickSetupWizard } from './components/QuickSetup';
import type {
  HaciendaConfig,
  HaciendaEnvironment,
  TestProgress,
} from './types';

type ViewMode = 'loading' | 'selector' | 'quick-setup' | 'configured';

export default function HaciendaConfigPage() {
  const router = useRouter();
  const toast = useToast();

  // State
  const [loading, setLoading] = React.useState(true);
  const [config, setConfig] = React.useState<HaciendaConfig | null>(null);
  const [testProgress, setTestProgress] = React.useState<TestProgress | null>(null);
  const [activeTab, setActiveTab] = React.useState<'config' | 'tests'>('config');
  const [activeEnvironment, setActiveEnvironment] = React.useState<HaciendaEnvironment>('TEST');
  const [viewMode, setViewMode] = React.useState<ViewMode>('loading');

  // Load configuration
  const loadConfig = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/hacienda/config`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setActiveEnvironment(data.activeEnvironment || 'TEST');

        // Determine view mode based on configuration state
        const hasTestConfig = data.testConfig?.isConfigured;
        const hasProdConfig = data.prodConfig?.isConfigured;

        if (hasTestConfig || hasProdConfig) {
          setViewMode('configured');
        } else {
          setViewMode('selector');
        }
      } else {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Error al cargar configuracion');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al cargar configuracion'
      );
      setViewMode('selector');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load test progress
  const loadTestProgress = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/hacienda/tests/progress`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setTestProgress(data);
      }
    } catch (error) {
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Setup Selector view
  if (viewMode === 'selector') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/configuracion')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              Configuracion de Hacienda
            </h1>
            <p className="text-muted-foreground">
              Configure su integracion con el Ministerio de Hacienda de El Salvador
            </p>
          </div>
        </div>

        <SetupSelector
          onSelectQuickSetup={handleSelectQuickSetup}
          onSelectFullWizard={handleSelectFullWizard}
        />
      </div>
    );
  }

  // Quick Setup Wizard view
  if (viewMode === 'quick-setup') {
    return (
      <div className="space-y-6">
        <QuickSetupWizard
          onBack={handleQuickSetupBack}
          onComplete={handleQuickSetupComplete}
        />
      </div>
    );
  }

  // Configured view (normal page)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/configuracion')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              Configuracion de Hacienda
            </h1>
            <p className="text-muted-foreground">
              Configure su integracion con el Ministerio de Hacienda de El Salvador
            </p>
          </div>
        </div>

        <ConfigurationStatus config={config} testProgress={testProgress} />
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'config' | 'tests')}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="config">Configuracion</TabsTrigger>
          <TabsTrigger value="tests">Centro de Pruebas</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          {/* Environment Tabs */}
          <Tabs
            value={activeEnvironment}
            onValueChange={(v) => setActiveEnvironment(v as HaciendaEnvironment)}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="TEST" className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Ambiente de Pruebas
              </TabsTrigger>
              <TabsTrigger value="PRODUCTION" className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Produccion
              </TabsTrigger>
            </TabsList>

            <TabsContent value="TEST">
              <EnvironmentConfig
                environment="TEST"
                config={config?.testConfig || null}
                onConfigured={() => {
                  loadConfig();
                  loadTestProgress();
                }}
              />
            </TabsContent>

            <TabsContent value="PRODUCTION">
              <EnvironmentConfig
                environment="PRODUCTION"
                config={config?.prodConfig || null}
                disabled={config?.testingStatus !== 'AUTHORIZED'}
                disabledMessage="Debe completar las pruebas y obtener autorizacion antes de configurar produccion"
                onConfigured={() => {
                  loadConfig();
                }}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="tests">
          <TestCenterDashboard
            progress={testProgress}
            onTestExecuted={() => {
              loadTestProgress();
              loadConfig();
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
