'use client';

import * as React from 'react';
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DteTypeCard } from './DteTypeCard';
import { TestExecutor } from './TestExecutor';
import { TestHistoryTable } from './TestHistoryTable';
import type { TestProgress, DteTypeCode, HaciendaTestType } from '../../types';

interface TestCenterDashboardProps {
  progress: TestProgress | null;
  onTestExecuted: () => void;
}

export function TestCenterDashboard({
  progress,
  onTestExecuted,
}: TestCenterDashboardProps) {
  const [selectedDteType, setSelectedDteType] = React.useState<DteTypeCode | null>(null);
  const [selectedTestType, setSelectedTestType] = React.useState<HaciendaTestType | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);

  const handleExecuteTest = (dteType: DteTypeCode, testType: HaciendaTestType) => {
    setSelectedDteType(dteType);
    setSelectedTestType(testType);
  };

  const handleTestComplete = () => {
    setSelectedDteType(null);
    setSelectedTestType(null);
    onTestExecuted();
  };

  if (!progress) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground max-w-md">
            Configure el ambiente de pruebas antes de ejecutar las pruebas de acreditación
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progreso Total</p>
                <p className="text-2xl font-bold">{progress.percentComplete}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <Progress value={progress.percentComplete} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pruebas Completadas</p>
                <p className="text-2xl font-bold">
                  {progress.totalCompleted} / {progress.totalRequired}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Días Restantes</p>
                <p className="text-2xl font-bold">
                  {progress.daysRemaining !== undefined ? progress.daysRemaining : '--'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge
                  className={
                    progress.canRequestAuthorization
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }
                >
                  {progress.canRequestAuthorization
                    ? 'Listo para autorización'
                    : 'En progreso'}
                </Badge>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tipos de DTE</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            <FileText className="h-4 w-4 mr-2" />
            {showHistory ? 'Ver progreso' : 'Ver historial'}
          </Button>
          {progress.canRequestAuthorization && (
            <Button size="sm">
              <Award className="h-4 w-4 mr-2" />
              Solicitar autorización
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {showHistory ? (
        <TestHistoryTable />
      ) : (
        <>
          {/* DTE Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {progress.progress.map((item) => (
              <DteTypeCard
                key={item.dteType}
                progress={item}
                onExecuteTest={handleExecuteTest}
              />
            ))}
          </div>

          {/* Test Executor Modal */}
          {selectedDteType && selectedTestType && (
            <TestExecutor
              dteType={selectedDteType}
              testType={selectedTestType}
              onClose={() => {
                setSelectedDteType(null);
                setSelectedTestType(null);
              }}
              onComplete={handleTestComplete}
            />
          )}

          {/* Requirements Info */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Requisitos de Acreditación</CardTitle>
              <CardDescription>
                Hacienda requiere un mínimo de pruebas exitosas para cada tipo de DTE
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-medium">Factura</p>
                  <p className="text-muted-foreground">5 emisiones + 1 anulación</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">CCF</p>
                  <p className="text-muted-foreground">5 emisiones + 1 anulación</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">N. Remisión</p>
                  <p className="text-muted-foreground">3 emisiones + 1 anulación</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">N. Crédito</p>
                  <p className="text-muted-foreground">2 emisiones + 1 anulación</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">N. Débito</p>
                  <p className="text-muted-foreground">2 emisiones + 1 anulación</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">F. Exportación</p>
                  <p className="text-muted-foreground">3 emisiones + 1 anulación</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">F. S. Excluido</p>
                  <p className="text-muted-foreground">3 emisiones + 1 anulación</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
