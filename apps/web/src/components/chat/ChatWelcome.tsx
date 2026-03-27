'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WelcomeAction {
  icon: string;
  label: string;
  message: string;
}

const ACTIONS: WelcomeAction[] = [
  { icon: '📊', label: 'Resumen del mes', message: 'Resumen del mes' },
  { icon: '📄', label: 'Crear una factura', message: '¿Cómo crear una factura?' },
  { icon: '💡', label: '¿Qué puedes hacer?', message: '¿Qué puedes hacer?' },
  { icon: '🔮', label: 'Proyección de ventas', message: 'Proyección de ventas' },
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
        <p className="text-2xl mb-1">{greeting} 👋</p>
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
            <span className="text-xl group-hover:scale-110 transition-transform">
              {action.icon}
            </span>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-facturo-violet-700 dark:group-hover:text-facturo-violet-300 transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Support link */}
      <button
        onClick={() => onAction('Necesito hablar con soporte')}
        className="mt-4 text-xs text-muted-foreground hover:text-facturo-violet-600 dark:hover:text-facturo-violet-400 underline underline-offset-2 transition-colors"
      >
        Hablar con soporte
      </button>
    </motion.div>
  );
}
