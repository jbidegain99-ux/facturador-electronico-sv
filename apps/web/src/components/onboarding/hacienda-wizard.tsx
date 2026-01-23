'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { WizardStepper, WizardStepperCompact } from './wizard-stepper';
import {
  WelcomeStep,
  CompanyInfoStep,
  HaciendaCredentialsStep,
  DteSelectionStep,
  ExecuteTestsStep,
  CertificateStep,
  ApiCredentialsStep,
  WaitingStep,
  CompletedStep,
} from './steps';
import {
  OnboardingState,
  OnboardingStep,
  AssistanceLevel,
  CompanyInfoForm,
  HaciendaCredentialsForm,
  CertificateForm,
  ApiCredentialsForm,
  DteType,
  TestProgressSummary,
  StepDetail,
} from '@/types/onboarding';

interface HaciendaWizardProps {
  initialData?: OnboardingState | null;
}

export function HaciendaWizard({ initialData }: HaciendaWizardProps) {
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = React.useState(false);
  const [executingTest, setExecutingTest] = React.useState(false);
  const [data, setData] = React.useState<OnboardingState | null>(initialData || null);
  const [testProgress, setTestProgress] = React.useState<TestProgressSummary | null>(null);

  const currentStep = data?.currentStep || 'WELCOME';
  const steps = data?.steps || getDefaultSteps();

  // =========================================================================
  // API CALLS
  // =========================================================================

  const getToken = () => localStorage.getItem('token');

  const apiCall = async (
    endpoint: string,
    method = 'GET',
    body?: Record<string, unknown>
  ) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/onboarding${endpoint}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      }
    );

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || 'Error en la operación');
    }

    return result;
  };

  const refreshData = async () => {
    try {
      const result = await apiCall('');
      setData(result);
    } catch (error) {
      console.error('Error refreshing onboarding data:', error);
    }
  };

  const refreshTestProgress = async () => {
    try {
      const result = await apiCall('/test-progress');
      setTestProgress(result);
    } catch (error) {
      console.error('Error refreshing test progress:', error);
    }
  };

  // =========================================================================
  // STEP HANDLERS
  // =========================================================================

  const handleStart = async (level: AssistanceLevel) => {
    setLoading(true);
    try {
      const result = await apiCall('/start', 'POST', {
        assistanceLevel: level,
      });
      setData(result);
      toast.success('Proceso de onboarding iniciado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyInfo = async (formData: CompanyInfoForm) => {
    setLoading(true);
    try {
      const result = await apiCall('/company-info', 'PATCH', formData);
      setData(result);
      await handleCompleteStep('COMPANY_INFO');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleHaciendaCredentials = async (formData: HaciendaCredentialsForm) => {
    setLoading(true);
    try {
      const result = await apiCall('/hacienda-credentials', 'POST', formData);
      setData(result);
      await handleCompleteStep('HACIENDA_CREDENTIALS');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDteSelection = async (
    types: { dteType: DteType; isRequired: boolean }[]
  ) => {
    setLoading(true);
    try {
      const result = await apiCall('/dte-types', 'POST', { dteTypes: types });
      setData(result);
      await handleCompleteStep('DTE_TYPE_SELECTION');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleTestCertificate = async (formData: CertificateForm) => {
    setLoading(true);
    try {
      const result = await apiCall('/test-certificate', 'POST', formData);
      setData(result);
      await handleCompleteStep('TEST_CERTIFICATE');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al subir certificado');
    } finally {
      setLoading(false);
    }
  };

  const handleProdCertificate = async (formData: CertificateForm) => {
    setLoading(true);
    try {
      const result = await apiCall('/prod-certificate', 'POST', formData);
      setData(result);
      await handleCompleteStep('PROD_CERTIFICATE');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al subir certificado');
    } finally {
      setLoading(false);
    }
  };

  const handleTestApiCredentials = async (formData: ApiCredentialsForm) => {
    setLoading(true);
    try {
      const result = await apiCall('/test-api-credentials', 'POST', formData);
      setData(result);
      await handleCompleteStep('API_CREDENTIALS_TEST');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleProdApiCredentials = async (formData: ApiCredentialsForm) => {
    setLoading(true);
    try {
      const result = await apiCall('/prod-api-credentials', 'POST', formData);
      setData(result);
      await handleCompleteStep('API_CREDENTIALS_PROD');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTest = async (dteType: DteType) => {
    setExecutingTest(true);
    try {
      const result = await apiCall('/execute-test', 'POST', { dteType });
      if (result.success) {
        toast.success(result.message || 'Prueba exitosa');
      } else {
        toast.error(result.message || 'Prueba fallida');
      }
      await refreshTestProgress();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error en prueba');
    } finally {
      setExecutingTest(false);
    }
  };

  const handleExecuteEventTest = async (eventType: string) => {
    setExecutingTest(true);
    try {
      const result = await apiCall('/execute-event-test', 'POST', { eventType });
      if (result.success) {
        toast.success(result.message || 'Prueba exitosa');
      } else {
        toast.error(result.message || 'Prueba fallida');
      }
      await refreshTestProgress();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error en prueba');
    } finally {
      setExecutingTest(false);
    }
  };

  const handleCompleteStep = async (step: OnboardingStep) => {
    try {
      const result = await apiCall('/complete-step', 'POST', { step });
      setData(result);
    } catch (error) {
      console.error('Error completing step:', error);
    }
  };

  const handleGoToStep = async (step: OnboardingStep) => {
    setLoading(true);
    try {
      const result = await apiCall('/go-to-step', 'POST', { step });
      setData(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al navegar');
    } finally {
      setLoading(false);
    }
  };

  const handleWaitingStepProceed = async (step: OnboardingStep) => {
    setLoading(true);
    try {
      await handleCompleteStep(step);
      await refreshData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al continuar');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    router.push('/dashboard');
  };

  // =========================================================================
  // LOAD TEST PROGRESS WHEN ON EXECUTE_TESTS STEP
  // =========================================================================

  React.useEffect(() => {
    if (currentStep === 'EXECUTE_TESTS') {
      refreshTestProgress();
    }
  }, [currentStep]);

  // =========================================================================
  // RENDER CURRENT STEP
  // =========================================================================

  const renderStep = () => {
    const handleBack = () => {
      const stepOrder = steps.map((s) => s.step);
      const currentIndex = stepOrder.indexOf(currentStep);
      if (currentIndex > 0) {
        handleGoToStep(stepOrder[currentIndex - 1]);
      }
    };

    switch (currentStep) {
      case 'WELCOME':
        return <WelcomeStep onStart={handleStart} loading={loading} />;

      case 'COMPANY_INFO':
        return (
          <CompanyInfoStep
            data={data || undefined}
            onSubmit={handleCompanyInfo}
            onBack={handleBack}
            loading={loading}
          />
        );

      case 'HACIENDA_CREDENTIALS':
        return (
          <HaciendaCredentialsStep
            data={data || undefined}
            onSubmit={handleHaciendaCredentials}
            onBack={handleBack}
            loading={loading}
          />
        );

      case 'DTE_TYPE_SELECTION':
        return (
          <DteSelectionStep
            selectedTypes={data?.dteTypes}
            onSubmit={handleDteSelection}
            onBack={handleBack}
            loading={loading}
          />
        );

      case 'TEST_ENVIRONMENT_REQUEST':
        return (
          <WaitingStep
            type="test-environment"
            onProceed={() => handleWaitingStepProceed('TEST_ENVIRONMENT_REQUEST')}
            onBack={handleBack}
            loading={loading}
          />
        );

      case 'TEST_CERTIFICATE':
        return (
          <CertificateStep
            type="test"
            hasCertificate={data?.hasTestCertificate}
            onSubmit={handleTestCertificate}
            onBack={handleBack}
            loading={loading}
          />
        );

      case 'API_CREDENTIALS_TEST':
        return (
          <ApiCredentialsStep
            type="test"
            hasCredentials={data?.hasTestApiCredentials}
            onSubmit={handleTestApiCredentials}
            onBack={handleBack}
            loading={loading}
          />
        );

      case 'EXECUTE_TESTS':
        return (
          <ExecuteTestsStep
            testProgress={testProgress || undefined}
            onExecuteTest={handleExecuteTest}
            onExecuteEventTest={handleExecuteEventTest}
            onRefresh={refreshTestProgress}
            onNext={() => handleCompleteStep('EXECUTE_TESTS')}
            onBack={handleBack}
            loading={loading}
            executingTest={executingTest}
          />
        );

      case 'REQUEST_AUTHORIZATION':
        return (
          <WaitingStep
            type="authorization"
            onProceed={() => handleWaitingStepProceed('REQUEST_AUTHORIZATION')}
            onBack={handleBack}
            loading={loading}
          />
        );

      case 'PROD_CERTIFICATE':
        return (
          <CertificateStep
            type="prod"
            hasCertificate={data?.hasProdCertificate}
            onSubmit={handleProdCertificate}
            onBack={handleBack}
            loading={loading}
          />
        );

      case 'API_CREDENTIALS_PROD':
        return (
          <ApiCredentialsStep
            type="prod"
            hasCredentials={data?.hasProdApiCredentials}
            onSubmit={handleProdApiCredentials}
            onBack={handleBack}
            loading={loading}
          />
        );

      case 'FINAL_VALIDATION':
        return (
          <CompletedStep
            type="validation"
            onFinish={() => handleCompleteStep('FINAL_VALIDATION')}
            onBack={handleBack}
            loading={loading}
          />
        );

      case 'COMPLETED':
        return <CompletedStep type="completed" onFinish={handleFinish} />;

      default:
        return <div>Paso no reconocido</div>;
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  // If not started yet, show welcome without stepper
  if (!data) {
    return (
      <div className="max-w-4xl mx-auto">
        <WelcomeStep onStart={handleStart} loading={loading} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Stepper - sidebar on large screens */}
      <div className="lg:w-80 shrink-0">
        {/* Mobile compact stepper */}
        <div className="lg:hidden mb-6">
          <WizardStepperCompact steps={steps} currentStep={currentStep} />
        </div>

        {/* Desktop full stepper */}
        <div className="hidden lg:block sticky top-4">
          <WizardStepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleGoToStep}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">{renderStep()}</div>
    </div>
  );
}

// Default steps for when onboarding hasn't started
function getDefaultSteps(): StepDetail[] {
  const stepOrder: OnboardingStep[] = [
    'WELCOME',
    'COMPANY_INFO',
    'HACIENDA_CREDENTIALS',
    'DTE_TYPE_SELECTION',
    'TEST_ENVIRONMENT_REQUEST',
    'TEST_CERTIFICATE',
    'API_CREDENTIALS_TEST',
    'EXECUTE_TESTS',
    'REQUEST_AUTHORIZATION',
    'PROD_CERTIFICATE',
    'API_CREDENTIALS_PROD',
    'FINAL_VALIDATION',
    'COMPLETED',
  ];

  const stepMeta: Record<OnboardingStep, { name: string; description: string }> = {
    WELCOME: { name: 'Bienvenida', description: 'Introducción al proceso' },
    COMPANY_INFO: { name: 'Datos de Empresa', description: 'Información del contribuyente' },
    HACIENDA_CREDENTIALS: { name: 'Credenciales MH', description: 'Acceso a Servicios en Línea' },
    DTE_TYPE_SELECTION: { name: 'Tipos de DTE', description: 'Documentos a emitir' },
    TEST_ENVIRONMENT_REQUEST: { name: 'Ambiente Pruebas', description: 'Solicitar acceso' },
    TEST_CERTIFICATE: { name: 'Certificado Pruebas', description: 'Certificado digital' },
    API_CREDENTIALS_TEST: { name: 'API Pruebas', description: 'Credenciales de API' },
    EXECUTE_TESTS: { name: 'Ejecutar Pruebas', description: 'Pruebas técnicas' },
    REQUEST_AUTHORIZATION: { name: 'Solicitar Autorización', description: 'Enviar solicitud' },
    PROD_CERTIFICATE: { name: 'Certificado Producción', description: 'Certificado productivo' },
    API_CREDENTIALS_PROD: { name: 'API Producción', description: 'Credenciales productivas' },
    FINAL_VALIDATION: { name: 'Validación Final', description: 'Verificar configuración' },
    COMPLETED: { name: 'Completado', description: '¡Listo para facturar!' },
  };

  return stepOrder.map((step, index) => ({
    step,
    ...stepMeta[step],
    order: index + 1,
    status: index === 0 ? 'IN_PROGRESS' : 'PENDING',
    isCurrentStep: index === 0,
    canNavigateTo: index === 0,
  }));
}
