'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export function SwUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowUpdate(true);
            }
          });
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-lg animate-slide-down md:left-auto md:right-4 md:w-80">
      <RefreshCw className="h-5 w-5 shrink-0 text-primary" />
      <div className="flex-1">
        <p className="text-sm font-medium">Actualización disponible</p>
        <p className="text-xs text-muted-foreground">Una nueva versión de Facturo está lista</p>
      </div>
      <button
        onClick={handleUpdate}
        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
      >
        Actualizar
      </button>
    </div>
  );
}
