'use client';

import * as React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { HaciendaConfig, TestProgress } from '../types';

interface ConfigurationStatusProps {
  config: HaciendaConfig | null;
  testProgress: TestProgress | null;
}

export function ConfigurationStatus({
  config,
  testProgress,
}: ConfigurationStatusProps) {
  if (!config) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Clock className="h-3 w-3 mr-1" />
        Sin configurar
      </Badge>
    );
  }

  const getStatusBadge = () => {
    switch (config.testingStatus) {
      case 'NOT_STARTED':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            Sin iniciar
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                  <PlayCircle className="h-3 w-3 mr-1" />
                  En pruebas ({testProgress?.percentComplete || 0}%)
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {testProgress?.totalCompleted || 0} de {testProgress?.totalRequired || 0} pruebas completadas
                </p>
                {testProgress?.daysRemaining !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    {testProgress.daysRemaining} días restantes
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'PENDING_AUTHORIZATION':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pendiente autorización
          </Badge>
        );
      case 'AUTHORIZED':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Autorizado para producción
          </Badge>
        );
      default:
        return null;
    }
  };

  const getEnvironmentBadge = () => {
    if (config.activeEnvironment === 'PRODUCTION') {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Producción
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-amber-600">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Pruebas
      </Badge>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {getEnvironmentBadge()}
      {getStatusBadge()}
    </div>
  );
}
