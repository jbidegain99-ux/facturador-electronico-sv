'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { createQueryClient } from '@/lib/query-client';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useSyncQueueStore } from '@/store/sync-queue';
import { processSyncQueue } from '@/lib/sync-engine';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function SyncOnReconnect() {
  const { isOnline } = useOnlineStatus();
  const loadFromDexie = useSyncQueueStore((s) => s.loadFromDexie);

  useEffect(() => {
    loadFromDexie();
  }, [loadFromDexie]);

  useEffect(() => {
    if (isOnline) {
      processSyncQueue(API_URL);
    }
  }, [isOnline]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SyncOnReconnect />
      {children}
    </QueryClientProvider>
  );
}
