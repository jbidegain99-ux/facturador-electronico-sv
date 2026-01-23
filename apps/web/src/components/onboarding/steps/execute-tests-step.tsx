'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PlayCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestProgressSummary, DteType, DTE_TYPE_INFO } from '@/types/onboarding';

interface ExecuteTestsStepProps {
  testProgress?: TestProgressSummary;
  onExecuteTest: (dteType: DteType) => Promise<void>;
  onExecuteEventTest: (eventType: string) => Promise<void>;
  onRefresh: () => void;
  onNext: () => void;
  onBack: () => void;
  loading?: boolean;
  executingTest?: boolean;
}

export function ExecuteTestsStep({
  testProgress,
  onExecuteTest,
  onExecuteEventTest,
  onRefresh,
  onNext,
  onBack,
  loading,
  executingTest,
}: ExecuteTestsStepProps) {
  const [runningTest, setRunningTest] = React.useState<string | null>(null);

  const handleRunTest = async (dteType: DteType) => {
    setRunningTest(dteType);
    try {
      await onExecuteTest(dteType);
    } finally {
      setRunningTest(null);
    }
  };

  const handleRunEventTest = async (eventType: string) => {
    setRunningTest(eventType);
    try {
      await onExecuteEventTest(eventType);
    } finally {
      setRunningTest(null);
    }
  };

  if (!testProgress?.initialized) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <PlayCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Ejecutar Pruebas</h2>
            <p className="text-muted-foreground">
              Debe configurar los tipos de DTE primero
            </p>
          </div>
        </div>

        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Complete los pasos anteriores para habilitar las pruebas técnicas.
          </AlertDescription>
        </Alert>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
        </div>
      </div>
    );
  }

  const canProceed = testProgress.canRequestAuthorization;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <PlayCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Ejecutar Pruebas</h2>
            <p className="text-muted-foreground">
              Realice las pruebas técnicas requeridas
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Overall progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Progreso General</p>
                <p className="text-sm text-muted-foreground">
                  {testProgress.totalTestsCompleted} de{' '}
                  {testProgress.totalTestsRequired} pruebas completadas
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {testProgress.percentComplete}%
                </p>
              </div>
            </div>
            <Progress value={testProgress.percentComplete} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* DTE Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Pruebas de Documentos</CardTitle>
          <CardDescription>
            Ejecute las pruebas para cada tipo de DTE seleccionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testProgress.dteProgress.map((dte) => (
              <div
                key={dte.dteType}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {dte.isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  <div>
                    <p className="font-medium">{dte.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {dte.completed} de {dte.required} pruebas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Progress
                    value={(dte.completed / dte.required) * 100}
                    className="w-24 h-2"
                  />
                  {dte.isComplete ? (
                    <Badge variant="default" className="bg-green-500">
                      Completado
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleRunTest(dte.dteType)}
                      disabled={executingTest || runningTest !== null}
                    >
                      {runningTest === dte.dteType ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Ejecutando...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Ejecutar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Pruebas de Eventos</CardTitle>
          <CardDescription>
            Ejecute las pruebas de eventos especiales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testProgress.eventProgress.map((event) => (
              <div
                key={event.eventType}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {event.isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.completed} de {event.required} pruebas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Progress
                    value={(event.completed / event.required) * 100}
                    className="w-24 h-2"
                  />
                  {event.isComplete ? (
                    <Badge variant="default" className="bg-green-500">
                      Completado
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleRunEventTest(event.eventType)}
                      disabled={executingTest || runningTest !== null}
                    >
                      {runningTest === event.eventType ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Ejecutando...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Ejecutar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Last test result */}
      {testProgress.lastTestAt && (
        <Alert
          className={
            testProgress.lastTestResult === 'SUCCESS'
              ? 'border-green-500 bg-green-500/10'
              : 'border-red-500 bg-red-500/10'
          }
        >
          {testProgress.lastTestResult === 'SUCCESS' ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription>
            <span
              className={
                testProgress.lastTestResult === 'SUCCESS'
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              }
            >
              Última prueba:{' '}
              {testProgress.lastTestResult === 'SUCCESS' ? 'Exitosa' : 'Fallida'}{' '}
              ({new Date(testProgress.lastTestAt).toLocaleTimeString()})
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        <Button onClick={onNext} disabled={!canProceed || loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {!canProceed && (
        <p className="text-center text-sm text-muted-foreground">
          Complete todas las pruebas requeridas para continuar
        </p>
      )}
    </div>
  );
}
