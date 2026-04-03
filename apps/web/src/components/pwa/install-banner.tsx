'use client';

import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { Download, X } from 'lucide-react';

export function InstallBanner() {
  const { showBanner, install, dismiss } = useInstallPrompt();

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-lg animate-slide-up md:hidden">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Download className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">Instalar Facturo</p>
        <p className="text-xs text-muted-foreground">Accede rápido desde tu pantalla de inicio</p>
      </div>
      <button
        onClick={install}
        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
      >
        Instalar
      </button>
      <button onClick={dismiss} className="shrink-0 p-1 text-muted-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
