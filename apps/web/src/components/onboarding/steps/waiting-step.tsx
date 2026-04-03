'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Loader2, Send, FlaskConical, ExternalLink, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WaitingStepProps {
  type: 'test-environment' | 'authorization';
  onProceed: () => void;
  onBack: () => void;
  loading?: boolean;
}

export function WaitingStep({ type, onProceed, onBack, loading }: WaitingStepProps) {
  const isTestEnv = type === 'test-environment';
  const title = isTestEnv ? 'Solicitar Ambiente de Pruebas' : 'Solicitar Autorizacion';
  const description = isTestEnv ? 'Solicite acceso al ambiente de pruebas del Ministerio de Hacienda' : 'Envie su solicitud de autorizacion como emisor de DTE';
  const Icon = isTestEnv ? FlaskConical : Send;

  const steps = isTestEnv
    ? ['Ingrese a Servicios en Linea del MH', 'Navegue a "Facturacion Electronica" > "Ambiente de Pruebas"', 'Complete el formulario de solicitud', 'Espere la aprobacion (generalmente inmediata)']
    : ['Complete todas las pruebas tecnicas requeridas', 'Ingrese a Servicios en Linea del MH', 'Navegue a "Facturacion Electronica" > "Solicitud de Autorizacion"', 'Adjunte la documentacion requerida', 'Espere la aprobacion de Hacienda'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10"><Icon className="h-6 w-6 text-primary" /></div>
        <div><h2 className="text-2xl font-bold">{title}</h2><p className="text-muted-foreground">{description}</p></div>
      </div>

      <Card>
        <CardHeader><CardTitle>Pasos a Seguir</CardTitle><CardDescription>Siga estos pasos en el portal del Ministerio de Hacienda</CardDescription></CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-medium">{index + 1}</span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p>Este paso requiere que realice acciones en el portal del Ministerio de Hacienda.</p>
            <a href="https://portaldgii.mh.gob.sv/ssc/login" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              Ir a Servicios en Linea del MH<ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </AlertDescription>
      </Alert>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Anterior</Button>
        <Button onClick={onProceed} disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</> : <>Ya lo complete, continuar<ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}
