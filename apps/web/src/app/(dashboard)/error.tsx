'use client';

import { useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  if (!isOnline) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
            <WifiOff className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold">Sin conexion</h2>
          <p className="text-sm text-muted-foreground">
            Estas sin internet. Los datos guardados localmente estan disponibles.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">Error en el panel</h2>
        <p className="text-sm text-muted-foreground">
          Ha ocurrido un error. Puedes intentar recargar esta seccion.
        </p>
        <pre className="mt-2 text-left text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40 text-red-400">
          {error.message}
          {error.digest && `\nDigest: ${error.digest}`}
        </pre>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
