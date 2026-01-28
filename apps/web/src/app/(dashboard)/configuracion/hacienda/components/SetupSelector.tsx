'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Clock, ChevronRight, FileKey2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SetupSelectorProps {
  onSelectQuickSetup: () => void;
  onSelectFullWizard: () => void;
}

export function SetupSelector({ onSelectQuickSetup, onSelectFullWizard }: SetupSelectorProps) {
  return (
    <div className="min-h-[500px] flex items-center justify-center">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20">
            <Building2 className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold">Configuracion con Ministerio de Hacienda</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cual es tu situacion actual con la facturacion electronica?
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Option 1: First Time */}
          <OptionCard
            icon={<Sparkles className="h-8 w-8" />}
            title="Primera Vez"
            description="Nunca he configurado facturacion electronica con Hacienda. Necesito solicitar ambiente de pruebas y generar mi certificado."
            duration="5-10 dias"
            buttonText="Proceso completo"
            onClick={onSelectFullWizard}
            variant="secondary"
          />

          {/* Option 2: Have Credentials */}
          <OptionCard
            icon={<FileKey2 className="h-8 w-8" />}
            title="Ya Tengo Credenciales"
            description="Ya complete el proceso con Hacienda y tengo mi certificado .p12 y credenciales de API. Solo necesito configurarlas en el sistema."
            duration="5 minutos"
            buttonText="Configuracion rapida"
            onClick={onSelectQuickSetup}
            variant="primary"
            highlighted
          />
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            No estas seguro? Si vienes de otro proveedor (Gosocket, ContaPortable, etc.)
            o ya tienes un archivo .p12, selecciona <strong>Ya Tengo Credenciales</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  duration: string;
  buttonText: string;
  onClick: () => void;
  variant: 'primary' | 'secondary';
  highlighted?: boolean;
}

function OptionCard({
  icon,
  title,
  description,
  duration,
  buttonText,
  onClick,
  variant,
  highlighted,
}: OptionCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200 hover:border-purple-500/50',
        'bg-slate-900/50 backdrop-blur-sm border-white/10',
        highlighted && 'ring-2 ring-purple-500/30'
      )}
    >
      {highlighted && (
        <div className="absolute top-0 right-0 px-3 py-1 bg-purple-600 text-xs font-medium rounded-bl-lg">
          Recomendado
        </div>
      )}
      <CardContent className="p-6 space-y-6">
        {/* Icon */}
        <div
          className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center',
            variant === 'primary' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700/50 text-slate-400'
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed min-h-[60px]">
            {description}
          </p>
        </div>

        {/* Duration Badge */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Tiempo estimado:</span>
          <span
            className={cn(
              'font-medium',
              variant === 'primary' ? 'text-green-400' : 'text-amber-400'
            )}
          >
            {duration}
          </span>
        </div>

        {/* Action Button */}
        <Button
          onClick={onClick}
          className={cn(
            'w-full',
            variant === 'primary'
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-slate-700 hover:bg-slate-600'
          )}
        >
          {buttonText}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
