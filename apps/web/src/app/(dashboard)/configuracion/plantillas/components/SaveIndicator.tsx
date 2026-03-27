'use client';

import { Loader2, Check, AlertCircle } from 'lucide-react';
import type { SaveStatus } from '../hooks/useTemplateConfig';

interface SaveIndicatorProps {
  status: SaveStatus;
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {status === 'saving' && (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Guardando...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="w-3 h-3 text-green-500" />
          <span className="text-green-500">Guardado</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="w-3 h-3 text-destructive" />
          <span className="text-destructive">Error al guardar</span>
        </>
      )}
    </div>
  );
}
