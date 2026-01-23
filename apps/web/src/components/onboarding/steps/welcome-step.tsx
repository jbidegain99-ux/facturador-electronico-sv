'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Rocket,
  Users,
  Headphones,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { AssistanceLevel } from '@/types/onboarding';

interface WelcomeStepProps {
  onStart: (level: AssistanceLevel) => void;
  loading?: boolean;
}

const ASSISTANCE_OPTIONS = [
  {
    value: 'SELF_SERVICE' as AssistanceLevel,
    icon: Rocket,
    title: 'Auto-servicio',
    description: 'Realizo el proceso por mi cuenta siguiendo la guía',
    features: [
      'Guía paso a paso interactiva',
      'Documentación completa',
      'Soporte por chat si lo necesito',
    ],
  },
  {
    value: 'GUIDED' as AssistanceLevel,
    icon: Users,
    title: 'Asistido',
    description: 'Republicode me guía en cada paso',
    features: [
      'Sesión de videollamada inicial',
      'Acompañamiento en pasos clave',
      'Revisión de configuración',
    ],
  },
  {
    value: 'FULL_SERVICE' as AssistanceLevel,
    icon: Headphones,
    title: 'Servicio Completo',
    description: 'Republicode hace todo por mí',
    features: [
      'Gestión completa del proceso',
      'Solo proporciono información',
      'Soporte prioritario',
    ],
  },
];

export function WelcomeStep({ onStart, loading }: WelcomeStepProps) {
  const [selectedLevel, setSelectedLevel] =
    React.useState<AssistanceLevel>('SELF_SERVICE');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
          <Rocket className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">¡Bienvenido al proceso de habilitación!</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Este asistente lo guiará a través de los pasos necesarios para
          convertirse en emisor autorizado de documentos tributarios
          electrónicos en El Salvador.
        </p>
      </div>

      {/* What to expect */}
      <Card>
        <CardHeader>
          <CardTitle>¿Qué incluye el proceso?</CardTitle>
          <CardDescription>
            El proceso de habilitación consta de 12 pasos principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Registro de datos de empresa',
              'Verificación de credenciales MH',
              'Selección de tipos de DTE',
              'Configuración de ambiente de pruebas',
              'Ejecución de pruebas técnicas',
              'Solicitud de autorización',
              'Configuración de producción',
              'Validación final',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assistance level selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          ¿Cómo prefiere realizar el proceso?
        </h2>
        <RadioGroup
          value={selectedLevel}
          onValueChange={(v) => setSelectedLevel(v as AssistanceLevel)}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {ASSISTANCE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Label
                key={option.value}
                htmlFor={option.value}
                className={`
                  flex flex-col p-6 rounded-lg border-2 cursor-pointer transition-all
                  ${
                    selectedLevel === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/50'
                  }
                `}
              >
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="sr-only"
                />
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`p-2 rounded-lg ${
                      selectedLevel === option.value
                        ? 'bg-primary text-white'
                        : 'bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">{option.title}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {option.description}
                </p>
                <ul className="space-y-2 mt-auto">
                  {option.features.map((feature, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Label>
            );
          })}
        </RadioGroup>
      </div>

      {/* Start button */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={() => onStart(selectedLevel)}
          disabled={loading}
          className="min-w-[200px]"
        >
          {loading ? (
            'Iniciando...'
          ) : (
            <>
              Comenzar Proceso
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>

      {/* Note */}
      <p className="text-center text-sm text-muted-foreground">
        Puede cambiar el nivel de asistencia en cualquier momento durante el
        proceso.
      </p>
    </div>
  );
}
