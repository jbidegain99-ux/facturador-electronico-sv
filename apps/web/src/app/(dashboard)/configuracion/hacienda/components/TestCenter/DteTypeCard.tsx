'use client';

import * as React from 'react';
import {
  CheckCircle2,
  PlayCircle,
  XCircle,
  Send,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { TestProgressByDte, DteTypeCode, HaciendaTestType } from '../../types';

interface DteTypeCardProps {
  progress: TestProgressByDte;
  onExecuteTest: (dteType: DteTypeCode, testType: HaciendaTestType) => void;
}

export function DteTypeCard({ progress, onExecuteTest }: DteTypeCardProps) {
  const totalRequired = progress.emissionRequired + progress.cancellationRequired;
  const totalCompleted = progress.emissionCompleted + progress.cancellationCompleted;
  const percentComplete = Math.round((totalCompleted / totalRequired) * 100);

  const emissionComplete = progress.emissionCompleted >= progress.emissionRequired;
  const cancellationComplete = progress.cancellationCompleted >= progress.cancellationRequired;
  const canCancelTest = progress.emissionCompleted > progress.cancellationCompleted;

  return (
    <Card className={progress.isComplete ? 'border-emerald-500/30 bg-emerald-500/5' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {progress.isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <PlayCircle className="h-5 w-5 text-amber-600" />
            )}
            {progress.dteName}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {progress.dteType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{percentComplete}%</span>
          </div>
          <Progress value={percentComplete} className="h-2" />
        </div>

        {/* Emission Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className={`h-4 w-4 ${emissionComplete ? 'text-emerald-600' : 'text-muted-foreground'}`} />
            <span className="text-sm">Emisiones</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {progress.emissionCompleted} / {progress.emissionRequired}
            </span>
            {emissionComplete ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => onExecuteTest(progress.dteType, 'EMISSION')}
              >
                <PlayCircle className="h-3 w-3 mr-1" />
                Ejecutar
              </Button>
            )}
          </div>
        </div>

        {/* Cancellation Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ban className={`h-4 w-4 ${cancellationComplete ? 'text-emerald-600' : 'text-muted-foreground'}`} />
            <span className="text-sm">Anulaciones</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {progress.cancellationCompleted} / {progress.cancellationRequired}
            </span>
            {cancellationComplete ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : canCancelTest ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => onExecuteTest(progress.dteType, 'CANCELLATION')}
              >
                <PlayCircle className="h-3 w-3 mr-1" />
                Ejecutar
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                Requiere emisión
              </span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        {progress.isComplete && (
          <Badge className="w-full justify-center bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completado
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
