'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, FileKey, ArrowRight, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface HaciendaConfigBannerProps {
  variant?: 'prominent' | 'subtle' | 'inline';
  showDismiss?: boolean;
  className?: string;
  onDismiss?: () => void;
}

export function HaciendaConfigBanner({
  variant = 'prominent',
  showDismiss = false,
  className,
  onDismiss,
}: HaciendaConfigBannerProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = React.useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleNewUser = () => {
    router.push('/onboarding-hacienda');
  };

  const handleExistingCredentials = () => {
    router.push('/configuracion/hacienda');
  };

  if (isDismissed) return null;

  // Subtle variant - minimal inline banner
  if (variant === 'subtle') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            'flex items-center gap-3 px-4 py-2 rounded-lg',
            'bg-amber-500/10 border border-amber-500/20',
            'text-amber-600 dark:text-amber-400',
            className
          )}
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">
            Configura Hacienda para emitir facturas electronicas
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExistingCredentials}
            className="ml-auto text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 p-1 h-auto"
          >
            Configurar
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Inline variant - for use within cards/sections
  if (variant === 'inline') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className={cn(
            'p-4 rounded-lg',
            'bg-gradient-to-r from-amber-500/10 to-orange-500/10',
            'border border-amber-500/20',
            className
          )}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <FileKey className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground">
                Configuracion de Hacienda pendiente
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Necesitas configurar tu conexion con el Ministerio de Hacienda para poder emitir facturas electronicas.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleExistingCredentials}>
                  Configurar ahora
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Prominent variant - full featured banner
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'relative overflow-hidden rounded-xl',
          'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10',
          'border border-amber-500/20',
          'p-6',
          className
        )}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  Configuracion Pendiente
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    Requerido
                  </span>
                </h3>
                <p className="text-muted-foreground mt-1 max-w-2xl">
                  Para emitir facturas electronicas, necesitas configurar tu conexion con el Ministerio de Hacienda de El Salvador.
                </p>

                <div className="flex flex-wrap gap-3 mt-4">
                  <Button
                    onClick={handleNewUser}
                    className="gap-2"
                    variant="glow"
                  >
                    <Sparkles className="h-4 w-4" />
                    Soy nuevo, iniciar proceso
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExistingCredentials}
                    className="gap-2"
                  >
                    <FileKey className="h-4 w-4" />
                    Ya tengo credenciales
                  </Button>
                </div>
              </div>
            </div>

            {showDismiss && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to check if Hacienda is configured
export function useHaciendaStatus() {
  const [status, setStatus] = React.useState<{
    isConfigured: boolean;
    isLoading: boolean;
    demoMode: boolean;
  }>({
    isConfigured: false,
    isLoading: true,
    demoMode: false,
  });

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setStatus({ isConfigured: false, isLoading: false, demoMode: false });
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/me/onboarding-status`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setStatus({
            isConfigured: data.hasCertificate === true,
            isLoading: false,
            demoMode: data.demoMode === true,
          });
        } else {
          setStatus({ isConfigured: false, isLoading: false, demoMode: false });
        }
      } catch {
        setStatus({ isConfigured: false, isLoading: false, demoMode: false });
      }
    };

    checkStatus();
  }, []);

  return status;
}

export default HaciendaConfigBanner;
