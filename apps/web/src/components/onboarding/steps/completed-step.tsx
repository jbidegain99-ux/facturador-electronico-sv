'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2, PartyPopper } from 'lucide-react';

interface CompletedStepProps {
  type: 'validation' | 'completed';
  onFinish?: () => void;
  onBack?: () => void;
  loading?: boolean;
}

export function CompletedStep({ type, onFinish, onBack, loading }: CompletedStepProps) {
  if (type === 'validation') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10"><CheckCircle2 className="h-6 w-6 text-primary" /></div>
          <div><h2 className="text-2xl font-bold">Validacion Final</h2><p className="text-muted-foreground">Verifique que toda la configuracion este correcta</p></div>
        </div>

        <Card>
          <CardHeader><CardTitle>Lista de Verificacion</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Datos de empresa correctos', 'Credenciales de Hacienda configuradas', 'Tipos de DTE seleccionados', 'Certificado de produccion cargado', 'Credenciales API de produccion configuradas', 'Pruebas tecnicas completadas', 'Autorizacion aprobada por Hacienda'].map((item, i) => (
                <div key={i} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="text-sm">{item}</span></div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Anterior</Button>
          <Button onClick={onFinish} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Finalizando...</> : <>Finalizar Proceso<ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-center">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 mx-auto"><PartyPopper className="h-12 w-12 text-green-500" /></div>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">Felicitaciones!</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">Ha completado exitosamente el proceso de habilitacion como emisor de documentos tributarios electronicos.</p>
      </div>
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {['Emisor autorizado por Hacienda', 'Ambiente de produccion configurado', 'Listo para emitir DTE'].map((text, i) => (
              <div key={i} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-green-500" /><span>{text}</span></div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Button size="lg" onClick={onFinish}>Ir al Dashboard<ArrowRight className="ml-2 h-5 w-5" /></Button>
    </div>
  );
}
