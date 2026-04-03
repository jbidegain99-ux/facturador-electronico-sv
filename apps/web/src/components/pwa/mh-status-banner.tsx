'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function MhStatusBanner() {
  const [isDown, setIsDown] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Listen for custom event dispatched when MH returns 503
    const handler = () => setIsDown(true);
    window.addEventListener('mh-outage', handler);
    return () => window.removeEventListener('mh-outage', handler);
  }, []);

  if (!isDown || dismissed) return null;

  return (
    <div className="mx-4 mt-2 flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-xs text-yellow-700 dark:text-yellow-400">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1">Hacienda temporalmente no disponible. Las facturas se enviarán cuando el servicio se restablezca.</span>
      <button onClick={() => setDismissed(true)} className="shrink-0">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
