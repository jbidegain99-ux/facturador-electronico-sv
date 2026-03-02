'use client';

import { Lock, ArrowUpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FeatureLockedProps {
  featureName?: string;
  planRequired?: string;
}

export function FeatureLocked({ featureName, planRequired }: FeatureLockedProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">
            {featureName ? `${featureName} no disponible` : 'Funcionalidad no disponible'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {planRequired
              ? `Esta funcionalidad requiere el plan ${planRequired} o superior.`
              : 'Tu plan actual no incluye esta funcionalidad.'}
            {' '}Actualiza tu plan para acceder.
          </p>
          <Button variant="default" className="gap-2" asChild>
            <a href="/configuracion/plan">
              <ArrowUpCircle className="w-4 h-4" />
              Ver planes
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
