'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface OnlineIndicatorProps {
  pendingCount?: number;
}

export function OnlineIndicator({ pendingCount = 0 }: OnlineIndicatorProps) {
  const { isOnline } = useOnlineStatus();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs text-destructive">
        <WifiOff className="h-3 w-3" />
        <span>Sin conexión</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs text-yellow-600 dark:text-yellow-400">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span>{pendingCount} pendiente{pendingCount > 1 ? 's' : ''}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400">
      <Wifi className="h-3 w-3" />
      <span>En línea</span>
    </div>
  );
}
