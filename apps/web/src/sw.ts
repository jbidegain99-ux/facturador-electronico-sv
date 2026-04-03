import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, NetworkFirst, Serwist, StaleWhileRevalidate } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // API calls: always network-first (prevents stale DTE status)
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
      handler: new NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        plugins: [],
      }),
    },
    // Images from Azure Blob: stale-while-revalidate
    {
      urlPattern: ({ url }) => url.hostname.endsWith('.blob.core.windows.net'),
      handler: new StaleWhileRevalidate({
        cacheName: 'azure-images',
      }),
    },
    // Google Fonts: cache-first
    {
      urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
      handler: new CacheFirst({
        cacheName: 'google-fonts',
      }),
    },
    // Default caching for everything else
    ...defaultCache,
  ],
});

serwist.addEventListeners();
