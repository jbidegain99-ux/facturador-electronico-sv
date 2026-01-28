'use client';

import * as React from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Send,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/toast';
import { DTE_TYPES, type DteTypeCode, type HaciendaTestType, type ExecuteTestResult, type TestRecord } from '../../types';

interface TestExecutorProps {
  dteType: DteTypeCode;
  testType: HaciendaTestType;
  onClose: () => void;
  onComplete: () => void;
}

interface SuccessfulEmission {
  id: string;
  codigoGeneracion: string;
  executedAt: string;
}

export function TestExecutor({
  dteType,
  testType,
  onClose,
  onComplete,
}: TestExecutorProps) {
  const toast = useToast();

  const [executing, setExecuting] = React.useState(false);
  const [result, setResult] = React.useState<ExecuteTestResult | null>(null);
  const [testData, setTestData] = React.useState<Record<string, unknown> | null>(null);
  const [loadingData, setLoadingData] = React.useState(true);
  const [successfulEmissions, setSuccessfulEmissions] = React.useState<SuccessfulEmission[]>([]);
  const [selectedEmission, setSelectedEmission] = React.useState<string>('');
  const [loadingEmissions, setLoadingEmissions] = React.useState(testType === 'CANCELLATION');

  const dteName = DTE_TYPES[dteType];
  const testTypeName = testType === 'EMISSION' ? 'Emisión' : 'Anulación';

  // Load test data preview
  React.useEffect(() => {
    if (testType === 'EMISSION') {
      loadTestData();
    } else {
      setLoadingData(false);
    }
  }, [testType]);

  // Load successful emissions for cancellation
  React.useEffect(() => {
    if (testType === 'CANCELLATION') {
      loadSuccessfulEmissions();
    }
  }, [testType, dteType]);

  const loadTestData = async () => {
    setLoadingData(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/hacienda/tests/generate-data`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dteType }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setTestData(data);
      }
    } catch (error) {
      console.error('Error loading test data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadSuccessfulEmissions = async () => {
    setLoadingEmissions(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/hacienda/tests/successful-emissions?dteType=${dteType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSuccessfulEmissions(data);
        if (data.length > 0) {
          setSelectedEmission(data[0].codigoGeneracion);
        }
      }
    } catch (error) {
      console.error('Error loading emissions:', error);
    } finally {
      setLoadingEmissions(false);
    }
  };

  const executeTest = async () => {
    setExecuting(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const body: Record<string, unknown> = {
        dteType,
        testType,
      };

      if (testType === 'CANCELLATION' && selectedEmission) {
        body.codigoGeneracionToCancel = selectedEmission;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/hacienda/tests/execute`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      const data: ExecuteTestResult = await res.json();

      if (res.ok) {
        setResult(data);
        if (data.success) {
          toast.success('Prueba ejecutada exitosamente');
        } else {
          toast.error(data.testRecord.errorMessage || 'La prueba falló');
        }
      } else {
        throw new Error((data as any).message || 'Error al ejecutar prueba');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al ejecutar prueba');
    } finally {
      setExecuting(false);
    }
  };

  const handleClose = () => {
    if (result?.success) {
      onComplete();
    }
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {testType === 'EMISSION' ? (
              <Send className="h-5 w-5 text-primary" />
            ) : (
              <Ban className="h-5 w-5 text-amber-600" />
            )}
            Prueba de {testTypeName} - {dteName}
          </DialogTitle>
          <DialogDescription>
            {testType === 'EMISSION'
              ? 'Se generará y enviará un DTE de prueba al Ministerio de Hacienda'
              : 'Seleccione un DTE emitido exitosamente para anular'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cancellation: Select DTE to cancel */}
          {testType === 'CANCELLATION' && (
            <div className="space-y-2">
              <Label>DTE a anular</Label>
              {loadingEmissions ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando emisiones...
                </div>
              ) : successfulEmissions.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No hay DTEs disponibles para anular. Primero ejecute una prueba de emisión.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={selectedEmission} onValueChange={setSelectedEmission}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un DTE" />
                  </SelectTrigger>
                  <SelectContent>
                    {successfulEmissions.map((emission) => (
                      <SelectItem key={emission.id} value={emission.codigoGeneracion || ''}>
                        {emission.codigoGeneracion} -{' '}
                        {new Date(emission.executedAt).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Emission: Show test data preview */}
          {testType === 'EMISSION' && (
            <div className="space-y-2">
              <Label>Vista previa de datos de prueba</Label>
              {loadingData ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando datos...
                </div>
              ) : testData ? (
                <ScrollArea className="h-48 rounded-md border bg-muted/50 p-3">
                  <pre className="text-xs">
                    {JSON.stringify(testData, null, 2)}
                  </pre>
                </ScrollArea>
              ) : (
                <Alert>
                  <AlertDescription>
                    No se pudo cargar la vista previa de datos
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <Label>Resultado de la prueba</Label>
              <Alert
                className={
                  result.success
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-medium">
                      {result.success ? 'Prueba exitosa' : 'Prueba fallida'}
                    </p>
                    {result.testRecord.codigoGeneracion && (
                      <p className="text-sm text-muted-foreground">
                        Código: {result.testRecord.codigoGeneracion}
                      </p>
                    )}
                    {result.testRecord.selloRecibido && (
                      <p className="text-sm text-muted-foreground">
                        Sello: {result.testRecord.selloRecibido}
                      </p>
                    )}
                    {result.testRecord.errorMessage && (
                      <p className="text-sm text-red-600">
                        Error: {result.testRecord.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </Alert>

              {/* Updated progress */}
              <div className="text-sm text-muted-foreground">
                Progreso actualizado: {result.progress.totalCompleted} de{' '}
                {result.progress.totalRequired} pruebas completadas (
                {result.progress.percentComplete}%)
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!result && (
            <Button
              onClick={executeTest}
              disabled={
                executing ||
                (testType === 'CANCELLATION' && !selectedEmission)
              }
            >
              {executing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Ejecutar prueba
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
