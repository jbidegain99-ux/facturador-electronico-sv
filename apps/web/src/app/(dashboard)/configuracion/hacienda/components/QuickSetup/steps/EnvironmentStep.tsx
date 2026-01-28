'use client';

import * as React from 'react';
import { FlaskConical, Building, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { HaciendaEnvironment } from '../../../types';

interface EnvironmentStepProps {
  environment: HaciendaEnvironment | null;
  onSelect: (env: HaciendaEnvironment) => void;
}

export function EnvironmentStep({ environment, onSelect }: EnvironmentStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Selecciona el Ambiente</h3>
        <p className="text-muted-foreground">
          Elige el ambiente que deseas configurar primero
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Test Environment */}
        <EnvironmentCard
          title="Ambiente de Pruebas"
          description="Para realizar pruebas tecnicas y validar la integracion antes de ir a produccion."
          icon={<FlaskConical className="h-8 w-8" />}
          features={[
            'DTEs no tienen validez fiscal',
            'Ideal para pruebas',
            'Token valido por 48 horas',
          ]}
          selected={environment === 'TEST'}
          onClick={() => onSelect('TEST')}
          variant="test"
        />

        {/* Production Environment */}
        <EnvironmentCard
          title="Produccion"
          description="Ambiente oficial para emitir documentos tributarios electronicos con validez fiscal."
          icon={<Building className="h-8 w-8" />}
          features={[
            'DTEs con validez fiscal',
            'Requiere autorizacion de MH',
            'Token valido por 24 horas',
          ]}
          selected={environment === 'PRODUCTION'}
          onClick={() => onSelect('PRODUCTION')}
          variant="production"
          requiresAuth
        />
      </div>

      {/* Info Alert */}
      <Alert className="max-w-3xl mx-auto bg-slate-800/50 border-slate-700">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Recomendacion:</strong> Si es tu primera vez, comienza con el ambiente de
          pruebas para verificar que todo funciona correctamente antes de pasar a produccion.
        </AlertDescription>
      </Alert>
    </div>
  );
}

interface EnvironmentCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  selected: boolean;
  onClick: () => void;
  variant: 'test' | 'production';
  requiresAuth?: boolean;
}

function EnvironmentCard({
  title,
  description,
  icon,
  features,
  selected,
  onClick,
  variant,
  requiresAuth,
}: EnvironmentCardProps) {
  const colorClasses = {
    test: {
      icon: 'bg-amber-500/20 text-amber-400',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      ring: 'ring-amber-500/50',
      hover: 'hover:border-amber-500/50',
    },
    production: {
      icon: 'bg-emerald-500/20 text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      ring: 'ring-emerald-500/50',
      hover: 'hover:border-emerald-500/50',
    },
  };

  const colors = colorClasses[variant];

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        'bg-slate-900/50 backdrop-blur-sm border-white/10',
        colors.hover,
        selected && `ring-2 ${colors.ring}`
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', colors.icon)}>
            {icon}
          </div>
          {requiresAuth && (
            <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
              <AlertTriangle className="h-3 w-3" />
              Requiere autorizacion
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h4 className="text-lg font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Features */}
        <ul className="space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={cn('w-1.5 h-1.5 rounded-full', colors.icon.replace('text-', 'bg-').replace('/20', ''))} />
              {feature}
            </li>
          ))}
        </ul>

        {/* Selection indicator */}
        <div
          className={cn(
            'w-full h-1 rounded-full transition-all',
            selected
              ? colors.icon.replace('text-', 'bg-').replace('/20', '')
              : 'bg-slate-700'
          )}
        />
      </CardContent>
    </Card>
  );
}
