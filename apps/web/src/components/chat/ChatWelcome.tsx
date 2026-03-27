'use client';

import { motion } from 'framer-motion';
import { BarChart3, FileText, Lightbulb, TrendingUp, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface WelcomeAction {
  icon: LucideIcon;
  label: string;
  message: string;
}

const ACTIONS: WelcomeAction[] = [
  { icon: BarChart3, label: 'Resumen del mes', message: 'Resumen del mes' },
  { icon: FileText, label: 'Crear una factura', message: '¿Cómo crear una factura?' },
  { icon: Lightbulb, label: '¿Qué puedes hacer?', message: '¿Qué puedes hacer?' },
  { icon: TrendingUp, label: 'Proyección de ventas', message: 'Proyección de ventas' },
];

interface ChatWelcomeProps {
  userName?: string;
  onAction: (message: string) => void;
}

export function ChatWelcome({ userName, onAction }: ChatWelcomeProps) {
  const greeting = userName ? `¡Hola, ${userName}!` : '¡Hola!';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col items-center justify-center px-5 py-4 overflow-y-auto"
    >
      {/* Greeting */}
      <div className="text-center mb-5">
        <p className="text-2xl mb-1">{greeting}</p>
        <p className="text-sm font-medium text-foreground">
          Soy tu asistente de facturación
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Puedo ayudarte con preguntas sobre la plataforma y tus datos de facturación.
        </p>
      </div>

      {/* Action cards grid */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-[320px]">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onAction(action.message)}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-xl',
              'border border-border/60 bg-muted/30',
              'hover:bg-facturo-violet-50 dark:hover:bg-facturo-violet-950/40',
              'hover:border-facturo-violet-200 dark:hover:border-facturo-violet-800',
              'hover:shadow-sm transition-all duration-150',
              'text-center group cursor-pointer',
            )}
          >
            <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-facturo-violet-600 dark:group-hover:text-facturo-violet-400 group-hover:scale-110 transition-all" />
            <span className="text-xs font-medium text-muted-foreground group-hover:text-facturo-violet-700 dark:group-hover:text-facturo-violet-300 transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Support link */}
      <button
        onClick={() => onAction('Necesito hablar con soporte')}
        className="mt-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-facturo-violet-600 dark:hover:text-facturo-violet-400 underline underline-offset-2 transition-colors"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Hablar con soporte
      </button>
    </motion.div>
  );
}
