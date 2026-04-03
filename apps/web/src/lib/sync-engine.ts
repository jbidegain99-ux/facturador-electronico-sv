import { useSyncQueueStore } from '@/store/sync-queue';
import type { SyncOpType } from './db-types';

const SYNC_ENDPOINTS: Record<SyncOpType, { path: string; method: string }> = {
  CREATE_INVOICE: { path: '/dte', method: 'POST' },
  CREATE_CUSTOMER: { path: '/clientes', method: 'POST' },
  UPDATE_CUSTOMER: { path: '/clientes', method: 'PATCH' },
  APPROVE_QUOTE: { path: '/quotes/approve', method: 'POST' },
  REJECT_QUOTE: { path: '/quotes/reject', method: 'POST' },
};

/**
 * Process all pending sync queue items sequentially (FIFO).
 * Skips failed items. Marks items as failed on error (no auto retry in v1).
 */
export async function processSyncQueue(apiBaseUrl: string): Promise<void> {
  const store = useSyncQueueStore.getState();

  if (store.isSyncing) return;

  const pendingItems = store.items
    .filter((item) => item.status === 'pending')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (pendingItems.length === 0) return;

  useSyncQueueStore.setState({ isSyncing: true });

  try {
    for (const item of pendingItems) {
      const endpoint = SYNC_ENDPOINTS[item.type];
      if (!endpoint) {
        await store.markFailed(item.id!, `Unknown operation type: ${item.type}`);
        continue;
      }

      try {
        await store.markSyncing(item.id!);

        const payload = JSON.parse(item.payload);
        const url = `${apiBaseUrl}${endpoint.path}`;

        const response = await fetch(url, {
          method: endpoint.method,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.message || `HTTP ${response.status}`;
          await store.markFailed(item.id!, errorMsg);
          continue;
        }

        await store.removeOp(item.id!);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        await store.markFailed(item.id!, message);
      }
    }
  } finally {
    useSyncQueueStore.setState({ isSyncing: false });
  }
}
