# Sprint 1: PWA Foundation + Offline Infrastructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Facturo installable as a PWA with offline shell, Dexie.js offline storage, sync queue, and service worker caching.

**Architecture:** serwist generates the service worker with cache-first for static assets and network-first for API calls. Dexie.js wraps IndexedDB with 5 tables derived from Prisma models. A Zustand-based sync queue stores pending offline operations and processes them FIFO on reconnect. React Query is configured for offline-first with IndexedDB persistence.

**Tech Stack:** Next.js 14.2.x, serwist, Dexie.js, Zustand, @tanstack/react-query, Vitest

**Sprint dates:** 2026-04-07 → 2026-04-18

---

## File Structure

### New files

```
apps/web/
├── src/
│   ├── lib/
│   │   ├── db.ts                          # Dexie database schema + instance
│   │   ├── db-types.ts                    # Offline table TypeScript interfaces
│   │   ├── sync-engine.ts                 # Sync-on-reconnect logic
│   │   └── query-client.ts               # React Query client config (extracted from providers)
│   ├── store/
│   │   └── sync-queue.ts                 # Zustand sync queue store
│   ├── hooks/
│   │   ├── use-online-status.ts          # Navigator.onLine + events
│   │   └── use-install-prompt.ts         # beforeinstallprompt capture
│   ├── components/
│   │   ├── pwa/
│   │   │   ├── online-indicator.tsx      # Header online/offline/syncing badge
│   │   │   ├── install-banner.tsx        # PWA install prompt banner
│   │   │   └── sw-update-prompt.tsx      # "Update available" toast (placeholder for S4)
│   │   └── mobile/
│   │       └── bottom-nav.tsx            # Mobile bottom navigation
│   ├── sw.ts                              # serwist service worker entry
│   └── app/
│       └── manifest.ts                    # Dynamic PWA manifest (replaces static JSON)
├── public/
│   ├── icons/
│   │   ├── icon-192.png                  # PWA icon 192x192
│   │   └── icon-512.png                  # PWA icon 512x512
│   └── (manifest.json deleted — replaced by manifest.ts)
├── vitest.config.ts                       # Vitest configuration
└── tests/
    └── unit/
        ├── db.test.ts                     # Dexie schema tests
        ├── sync-queue.test.ts             # Sync queue store tests
        ├── sync-engine.test.ts            # Sync engine tests
        └── use-online-status.test.ts      # Online status hook tests

apps/api/src/modules/sync/
├── sync.module.ts                         # NestJS module
├── sync.controller.ts                     # GET /api/v1/sync endpoint
└── sync.service.ts                        # Query logic for incremental sync
```

### Modified files

```
apps/web/package.json                      # Add serwist, dexie, vitest deps
apps/web/next.config.js                    # Wrap with serwist plugin
apps/web/src/app/layout.tsx                # Add viewport meta, apple-touch-icon
apps/web/src/app/providers.tsx             # Use extracted query client, add offline config
apps/web/src/store/index.ts                # No changes (kept separate)
apps/web/tsconfig.json                     # Add vitest types
apps/api/src/app.module.ts                 # Import SyncModule
```

---

## Task 1: Install Dependencies

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/tsconfig.json`
- Create: `apps/web/vitest.config.ts`

- [ ] **Step 1: Install PWA + offline dependencies in web app**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npm install @serwist/next dexie @tanstack/query-persist-client-core @tanstack/query-async-storage-persister idb-keyval
```

- [ ] **Step 2: Install serwist SW runtime as dev dependency**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npm install -D serwist
```

- [ ] **Step 3: Install Vitest + testing utilities**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom fake-indexeddb
```

- [ ] **Step 4: Create Vitest config**

Create `apps/web/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['fake-indexeddb/auto'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 5: Add test script to package.json**

Add to `apps/web/package.json` scripts section:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Verify Vitest runs (no tests yet)**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx vitest run
```
Expected: "No test files found" (not an error).

- [ ] **Step 7: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/package.json apps/web/package-lock.json apps/web/vitest.config.ts && git commit -m "chore: add serwist, dexie, vitest dependencies for PWA sprint 1"
```

---

## Task 2: PWA Manifest + Icons

**Files:**
- Create: `apps/web/src/app/manifest.ts`
- Create: `apps/web/public/icons/icon-192.png`
- Create: `apps/web/public/icons/icon-512.png`
- Delete: `apps/web/public/manifest.json`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Generate PWA icons from existing favicon**

The project uses `/favicon.svg`. Generate PNG icons from it. If svg→png tooling isn't available, create placeholder PNGs and replace later with proper brand icons:

```bash
cd /home/jose/facturador-electronico-sv/apps/web/public && mkdir -p icons
```

Use sharp or an online tool to generate from favicon.svg. For now, create a simple script:
```bash
cd /home/jose/facturador-electronico-sv && npx sharp-cli -i apps/web/public/favicon.svg -o apps/web/public/icons/icon-192.png resize 192 192 2>/dev/null || echo "Generate icons manually from favicon.svg at 192x192 and 512x512"
```

If `sharp-cli` is not available, the icons can be generated from the SVG manually. The manifest will reference them regardless.

- [ ] **Step 2: Create dynamic manifest**

Create `apps/web/src/app/manifest.ts`:
```typescript
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Facturo by Republicode',
    short_name: 'Facturo',
    description: 'Facturación electrónica para El Salvador — crea facturas desde tu celular, incluso sin internet.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#7C3AED',
    orientation: 'portrait-primary',
    categories: ['business', 'finance'],
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Nueva Factura',
        short_name: 'Facturar',
        url: '/es/facturas/nueva',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
```

- [ ] **Step 3: Delete old static manifest.json**

```bash
rm /home/jose/facturador-electronico-sv/apps/web/public/manifest.json
```

- [ ] **Step 4: Update layout.tsx with mobile meta tags**

In `apps/web/src/app/layout.tsx`, update the `viewport` export to include mobile-specific settings:

```typescript
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};
```

And update `metadata` to add `appleWebApp`:

```typescript
export const metadata: Metadata = {
  // ... existing fields stay the same ...
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Facturo',
  },
};
```

- [ ] **Step 5: Verify manifest loads**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx next build 2>&1 | tail -5
```
Expected: Build succeeds. The manifest.ts generates `/manifest.webmanifest` at build time.

- [ ] **Step 6: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/app/manifest.ts apps/web/src/app/layout.tsx apps/web/public/icons/ && git rm apps/web/public/manifest.json && git commit -m "feat(pwa): add dynamic manifest with icons, mobile viewport, apple web app support"
```

---

## Task 3: Service Worker with serwist

**Files:**
- Create: `apps/web/src/sw.ts`
- Modify: `apps/web/next.config.js`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Create service worker entry**

Create `apps/web/src/sw.ts`:
```typescript
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
```

- [ ] **Step 2: Update next.config.js to use serwist plugin**

Replace `apps/web/next.config.js`:
```javascript
const withSerwist = require('@serwist/next').default({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.blob.core.windows.net',
      },
    ],
  },
};

module.exports = withSerwist(withNextIntl(nextConfig));
```

- [ ] **Step 3: Register service worker in root layout**

Add SW registration to `apps/web/src/app/layout.tsx`. Add this `<script>` inside the `<head>` (or use a client component). The simplest approach — add a registration component.

Create `apps/web/src/components/pwa/sw-register.tsx`:
```tsx
'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('SW registration failed:', err);
      });
    }
  }, []);

  return null;
}
```

Then in `layout.tsx`, add `<ServiceWorkerRegister />` inside the `<body>`:
```tsx
import { ServiceWorkerRegister } from '@/components/pwa/sw-register';

// ... inside <body>:
<ServiceWorkerRegister />
<ThemeProvider>
  {/* ... rest stays the same */}
</ThemeProvider>
```

- [ ] **Step 4: Verify build compiles with serwist**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && NODE_ENV=production npx next build 2>&1 | tail -10
```
Expected: Build succeeds. Check for `public/sw.js` generated.

- [ ] **Step 5: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/sw.ts apps/web/next.config.js apps/web/src/components/pwa/sw-register.tsx apps/web/src/app/layout.tsx && git commit -m "feat(pwa): add serwist service worker with network-first API caching"
```

---

## Task 4: Dexie.js Offline Database Schema

**Files:**
- Create: `apps/web/src/lib/db-types.ts`
- Create: `apps/web/src/lib/db.ts`
- Create: `apps/web/tests/unit/db.test.ts`

- [ ] **Step 1: Write failing test for Dexie schema**

Create `apps/web/tests/unit/db.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { db, OfflineDB } from '@/lib/db';

describe('OfflineDB', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await db.delete();
    await db.open();
  });

  it('should have 5 tables defined', () => {
    expect(db.tables.map((t) => t.name).sort()).toEqual([
      'appCache',
      'catalogItems',
      'customers',
      'invoices',
      'syncQueue',
    ]);
  });

  it('should store and retrieve a customer', async () => {
    const customer = {
      serverId: 'cust_123',
      tenantId: 'tenant_1',
      nombre: 'Test Customer',
      tipoDocumento: '36',
      numDocumento: '06141804941014',
      direccion: JSON.stringify({ departamento: '06', municipio: '14', complemento: 'San Salvador' }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const localId = await db.customers.add(customer);
    const retrieved = await db.customers.get(localId);
    expect(retrieved?.nombre).toBe('Test Customer');
    expect(retrieved?.serverId).toBe('cust_123');
  });

  it('should query invoices by tenantId + estado compound index', async () => {
    await db.invoices.bulkAdd([
      { serverId: 'dte_1', tenantId: 't1', codigoGeneracion: 'CG1', estado: 'PROCESADO', tipoDte: '01', totalPagar: 100, createdAt: new Date().toISOString() },
      { serverId: 'dte_2', tenantId: 't1', codigoGeneracion: 'CG2', estado: 'PENDIENTE', tipoDte: '01', totalPagar: 200, createdAt: new Date().toISOString() },
      { serverId: 'dte_3', tenantId: 't2', codigoGeneracion: 'CG3', estado: 'PROCESADO', tipoDte: '01', totalPagar: 300, createdAt: new Date().toISOString() },
    ]);
    const results = await db.invoices.where('[tenantId+estado]').equals(['t1', 'PROCESADO']).toArray();
    expect(results).toHaveLength(1);
    expect(results[0].codigoGeneracion).toBe('CG1');
  });

  it('should store and retrieve sync queue operations', async () => {
    const op = {
      type: 'CREATE_INVOICE' as const,
      payload: JSON.stringify({ tipoDte: '01', items: [] }),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
    const id = await db.syncQueue.add(op);
    const pending = await db.syncQueue.where('status').equals('pending').toArray();
    expect(pending).toHaveLength(1);
    expect(pending[0].type).toBe('CREATE_INVOICE');
  });

  it('should use appCache as key-value store', async () => {
    await db.appCache.put({ key: 'lastSyncTimestamp', value: '2026-04-07T10:00:00Z' });
    const result = await db.appCache.get('lastSyncTimestamp');
    expect(result?.value).toBe('2026-04-07T10:00:00Z');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx vitest run tests/unit/db.test.ts
```
Expected: FAIL — `@/lib/db` does not exist.

- [ ] **Step 3: Create offline database types**

Create `apps/web/src/lib/db-types.ts`:
```typescript
/** Offline-first database types — derived from Prisma models but subset for offline use */

export interface OfflineInvoice {
  localId?: number;
  serverId?: string;          // Prisma `id` — null for offline-created
  tenantId: string;
  codigoGeneracion: string;
  numeroControl?: string;
  tipoDte: string;
  estado: string;             // PENDIENTE | PROCESADO | RECHAZADO | OFFLINE_PENDING
  selloRecepcion?: string;
  totalGravada?: number;
  totalIva?: number;
  totalPagar: number;
  receptorNombre?: string;
  receptorDocumento?: string;
  jsonOriginal?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OfflineCustomer {
  localId?: number;
  serverId?: string;
  tenantId: string;
  tipoDocumento: string;
  numDocumento: string;
  nombre: string;
  nrc?: string;
  correo?: string;
  telefono?: string;
  direccion: string;          // JSON string of {departamento, municipio, complemento}
  createdAt: string;
  updatedAt: string;
}

export interface OfflineCatalogItem {
  localId?: number;
  serverId?: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  type: string;               // PRODUCT | SERVICE
  basePrice: number;
  uniMedida: number;
  taxRate: number;
  isActive: boolean;
  updatedAt: string;
}

export type SyncOpType =
  | 'CREATE_INVOICE'
  | 'CREATE_CUSTOMER'
  | 'UPDATE_CUSTOMER'
  | 'APPROVE_QUOTE'
  | 'REJECT_QUOTE';

export type SyncOpStatus = 'pending' | 'syncing' | 'failed';

export interface SyncQueueItem {
  id?: number;
  type: SyncOpType;
  payload: string;            // JSON-serialized operation data
  status: SyncOpStatus;
  failReason?: string;
  createdAt: string;
}

export interface AppCacheEntry {
  key: string;
  value: string;
}
```

- [ ] **Step 4: Create Dexie database instance**

Create `apps/web/src/lib/db.ts`:
```typescript
import Dexie, { type EntityTable } from 'dexie';
import type {
  OfflineInvoice,
  OfflineCustomer,
  OfflineCatalogItem,
  SyncQueueItem,
  AppCacheEntry,
} from './db-types';

export class OfflineDB extends Dexie {
  invoices!: EntityTable<OfflineInvoice, 'localId'>;
  customers!: EntityTable<OfflineCustomer, 'localId'>;
  catalogItems!: EntityTable<OfflineCatalogItem, 'localId'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  appCache!: EntityTable<AppCacheEntry, 'key'>;

  constructor() {
    super('FacturoDB');

    this.version(1).stores({
      invoices: '++localId, serverId, tenantId, codigoGeneracion, estado, tipoDte, createdAt, [tenantId+estado], [tenantId+createdAt]',
      customers: '++localId, serverId, tenantId, numDocumento, nombre, [tenantId+nombre], [tenantId+numDocumento]',
      catalogItems: '++localId, serverId, tenantId, code, name, [tenantId+name]',
      syncQueue: '++id, type, status, createdAt',
      appCache: 'key',
    });
  }
}

export const db = new OfflineDB();
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx vitest run tests/unit/db.test.ts
```
Expected: All 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/lib/db.ts apps/web/src/lib/db-types.ts apps/web/tests/unit/db.test.ts && git commit -m "feat(pwa): add Dexie.js offline database with 5 tables and compound indexes"
```

---

## Task 5: useOnlineStatus Hook

**Files:**
- Create: `apps/web/src/hooks/use-online-status.ts`
- Create: `apps/web/tests/unit/use-online-status.test.ts`
- Create: `apps/web/src/components/pwa/online-indicator.tsx`

- [ ] **Step 1: Write failing test**

Create `apps/web/tests/unit/use-online-status.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '@/hooks/use-online-status';

describe('useOnlineStatus', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: true },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('should return true when navigator.onLine is true', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.isOnline).toBe(true);
  });

  it('should update to false when offline event fires', () => {
    const { result } = renderHook(() => useOnlineStatus());
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);
  });

  it('should update to true when online event fires', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const { result } = renderHook(() => useOnlineStatus());
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOnline).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx vitest run tests/unit/use-online-status.test.ts
```
Expected: FAIL — `@/hooks/use-online-status` does not exist.

- [ ] **Step 3: Implement useOnlineStatus hook**

Create `apps/web/src/hooks/use-online-status.ts`:
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';

interface OnlineStatus {
  isOnline: boolean;
  lastOnlineAt: Date | null;
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineAt(new Date());
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, lastOnlineAt };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx vitest run tests/unit/use-online-status.test.ts
```
Expected: All 3 tests PASS.

- [ ] **Step 5: Create online indicator component**

Create `apps/web/src/components/pwa/online-indicator.tsx`:
```tsx
'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { useSyncQueueStore } from '@/store/sync-queue';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function OnlineIndicator() {
  const { isOnline } = useOnlineStatus();
  const pendingCount = useSyncQueueStore((s) => s.pendingCount());

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
      <div className="flex items-center gap-1.5 rounded-full bg-facturo-warning/10 px-2.5 py-1 text-xs text-facturo-warning">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span>{pendingCount} pendiente{pendingCount > 1 ? 's' : ''}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-facturo-success/10 px-2.5 py-1 text-xs text-facturo-success">
      <Wifi className="h-3 w-3" />
      <span>En línea</span>
    </div>
  );
}
```

Note: This component imports `useSyncQueueStore` which will be created in Task 6. It will compile after Task 6 is done. This is intentional — the indicator is a visual composition of two data sources.

- [ ] **Step 6: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/hooks/use-online-status.ts apps/web/tests/unit/use-online-status.test.ts apps/web/src/components/pwa/online-indicator.tsx && git commit -m "feat(pwa): add useOnlineStatus hook with online/offline/syncing indicator"
```

---

## Task 6: Sync Queue Store (Zustand)

**Files:**
- Create: `apps/web/src/store/sync-queue.ts`
- Create: `apps/web/tests/unit/sync-queue.test.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/tests/unit/sync-queue.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useSyncQueueStore } from '@/store/sync-queue';
import { db } from '@/lib/db';

describe('SyncQueueStore', () => {
  beforeEach(async () => {
    // Reset store
    useSyncQueueStore.setState({ items: [] });
    // Clear Dexie
    await db.delete();
    await db.open();
  });

  it('should start with empty queue', () => {
    const state = useSyncQueueStore.getState();
    expect(state.items).toEqual([]);
    expect(state.pendingCount()).toBe(0);
  });

  it('should add an operation to the queue', async () => {
    const { addOp } = useSyncQueueStore.getState();
    await addOp('CREATE_INVOICE', { tipoDte: '01', receptor: 'Test' });

    const state = useSyncQueueStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].type).toBe('CREATE_INVOICE');
    expect(state.items[0].status).toBe('pending');

    // Also persisted in Dexie
    const dexieItems = await db.syncQueue.toArray();
    expect(dexieItems).toHaveLength(1);
  });

  it('should remove an operation after sync', async () => {
    const { addOp, removeOp } = useSyncQueueStore.getState();
    await addOp('CREATE_INVOICE', { tipoDte: '01' });
    const items = useSyncQueueStore.getState().items;
    await removeOp(items[0].id!);

    expect(useSyncQueueStore.getState().items).toHaveLength(0);
    expect(await db.syncQueue.count()).toBe(0);
  });

  it('should mark an operation as failed', async () => {
    const { addOp, markFailed } = useSyncQueueStore.getState();
    await addOp('CREATE_CUSTOMER', { nombre: 'Test' });
    const items = useSyncQueueStore.getState().items;
    await markFailed(items[0].id!, 'Network error');

    const state = useSyncQueueStore.getState();
    expect(state.items[0].status).toBe('failed');
    expect(state.items[0].failReason).toBe('Network error');
  });

  it('should count only pending items', async () => {
    const { addOp, markFailed } = useSyncQueueStore.getState();
    await addOp('CREATE_INVOICE', {});
    await addOp('CREATE_CUSTOMER', {});
    const items = useSyncQueueStore.getState().items;
    await markFailed(items[0].id!, 'Error');

    expect(useSyncQueueStore.getState().pendingCount()).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx vitest run tests/unit/sync-queue.test.ts
```
Expected: FAIL — `@/store/sync-queue` does not exist.

- [ ] **Step 3: Implement sync queue store**

Create `apps/web/src/store/sync-queue.ts`:
```typescript
import { create } from 'zustand';
import { db } from '@/lib/db';
import type { SyncQueueItem, SyncOpType } from '@/lib/db-types';

interface SyncQueueState {
  items: SyncQueueItem[];
  isSyncing: boolean;

  // Actions
  addOp: (type: SyncOpType, payload: Record<string, unknown>) => Promise<void>;
  removeOp: (id: number) => Promise<void>;
  markFailed: (id: number, reason: string) => Promise<void>;
  markSyncing: (id: number) => Promise<void>;
  loadFromDexie: () => Promise<void>;

  // Computed
  pendingCount: () => number;
  failedCount: () => number;
}

export const useSyncQueueStore = create<SyncQueueState>((set, get) => ({
  items: [],
  isSyncing: false,

  addOp: async (type, payload) => {
    const item: SyncQueueItem = {
      type,
      payload: JSON.stringify(payload),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const id = await db.syncQueue.add(item);
    item.id = id;
    set((state) => ({ items: [...state.items, item] }));
  },

  removeOp: async (id) => {
    await db.syncQueue.delete(id);
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
  },

  markFailed: async (id, reason) => {
    await db.syncQueue.update(id, { status: 'failed', failReason: reason });
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, status: 'failed' as const, failReason: reason } : i
      ),
    }));
  },

  markSyncing: async (id) => {
    await db.syncQueue.update(id, { status: 'syncing' });
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, status: 'syncing' as const } : i
      ),
    }));
  },

  loadFromDexie: async () => {
    const items = await db.syncQueue.toArray();
    set({ items });
  },

  pendingCount: () => get().items.filter((i) => i.status === 'pending').length,
  failedCount: () => get().items.filter((i) => i.status === 'failed').length,
}));
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx vitest run tests/unit/sync-queue.test.ts
```
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/store/sync-queue.ts apps/web/tests/unit/sync-queue.test.ts && git commit -m "feat(pwa): add Zustand sync queue store with Dexie persistence"
```

---

## Task 7: Sync Engine

**Files:**
- Create: `apps/web/src/lib/sync-engine.ts`
- Create: `apps/web/tests/unit/sync-engine.test.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/tests/unit/sync-engine.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { useSyncQueueStore } from '@/store/sync-queue';

// We test the sync engine logic in isolation by mocking fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after mocking
const { processSyncQueue } = await import('@/lib/sync-engine');

describe('SyncEngine', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    useSyncQueueStore.setState({ items: [], isSyncing: false });
    await db.delete();
    await db.open();
  });

  it('should process pending operations in FIFO order', async () => {
    // Add two ops
    await useSyncQueueStore.getState().addOp('CREATE_INVOICE', { order: 1 });
    await useSyncQueueStore.getState().addOp('CREATE_CUSTOMER', { order: 2 });

    // Mock successful API responses
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'server_1' }) });

    await processSyncQueue('http://localhost:3001/api/v1');

    // Both should be removed from queue
    expect(useSyncQueueStore.getState().items).toHaveLength(0);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // First call should be the first op (FIFO)
    const firstCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(firstCallBody.order).toBe(1);
  });

  it('should mark operation as failed on API error', async () => {
    await useSyncQueueStore.getState().addOp('CREATE_INVOICE', { test: true });

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' }),
    });

    await processSyncQueue('http://localhost:3001/api/v1');

    const state = useSyncQueueStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].status).toBe('failed');
    expect(state.items[0].failReason).toContain('500');
  });

  it('should skip already-failed operations', async () => {
    await useSyncQueueStore.getState().addOp('CREATE_INVOICE', {});
    const items = useSyncQueueStore.getState().items;
    await useSyncQueueStore.getState().markFailed(items[0].id!, 'Previous error');

    await processSyncQueue('http://localhost:3001/api/v1');

    // Should not have made any fetch calls
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should not run if already syncing', async () => {
    useSyncQueueStore.setState({ isSyncing: true });
    await useSyncQueueStore.getState().addOp('CREATE_INVOICE', {});

    await processSyncQueue('http://localhost:3001/api/v1');

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx vitest run tests/unit/sync-engine.test.ts
```
Expected: FAIL — `@/lib/sync-engine` does not exist.

- [ ] **Step 3: Implement sync engine**

Create `apps/web/src/lib/sync-engine.ts`:
```typescript
import { useSyncQueueStore } from '@/store/sync-queue';
import type { SyncOpType } from './db-types';

/** Map sync operation types to API endpoints and methods */
const SYNC_ENDPOINTS: Record<SyncOpType, { path: string; method: string }> = {
  CREATE_INVOICE: { path: '/dte', method: 'POST' },
  CREATE_CUSTOMER: { path: '/clientes', method: 'POST' },
  UPDATE_CUSTOMER: { path: '/clientes', method: 'PATCH' },
  APPROVE_QUOTE: { path: '/quotes/approve', method: 'POST' },
  REJECT_QUOTE: { path: '/quotes/reject', method: 'POST' },
};

/**
 * Process all pending sync queue items sequentially (FIFO).
 * - Skips failed items (user must retry manually).
 * - Marks items as failed on error (no automatic retry in v1).
 * - Sets isSyncing flag to prevent concurrent runs.
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

        // Success: remove from queue
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx vitest run tests/unit/sync-engine.test.ts
```
Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/lib/sync-engine.ts apps/web/tests/unit/sync-engine.test.ts && git commit -m "feat(pwa): add sync engine with FIFO processing and failure tracking"
```

---

## Task 8: React Query Offline Config

**Files:**
- Create: `apps/web/src/lib/query-client.ts`
- Modify: `apps/web/src/app/providers.tsx`

- [ ] **Step 1: Extract and configure React Query client**

Create `apps/web/src/lib/query-client.ts`:
```typescript
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 1000 * 60 * 60 * 24,   // 24h — keep cache for offline
        networkMode: 'offlineFirst',     // Use cache when offline
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error instanceof Error && 'status' in error) {
            const status = (error as { status: number }).status;
            if (status >= 400 && status < 500) return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        networkMode: 'offlineFirst',
      },
    },
  });
}
```

- [ ] **Step 2: Update providers.tsx to use extracted client + add sync-on-reconnect**

Replace `apps/web/src/app/providers.tsx`:
```tsx
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

  // Load pending ops from Dexie on mount
  useEffect(() => {
    loadFromDexie();
  }, [loadFromDexie]);

  // When we come back online, process the sync queue
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
```

- [ ] **Step 3: Verify the build still compiles**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx next build 2>&1 | tail -5
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/lib/query-client.ts apps/web/src/app/providers.tsx && git commit -m "feat(pwa): configure React Query offlineFirst + sync-on-reconnect trigger"
```

---

## Task 9: Backend /api/v1/sync Endpoint

**Files:**
- Create: `apps/api/src/modules/sync/sync.module.ts`
- Create: `apps/api/src/modules/sync/sync.controller.ts`
- Create: `apps/api/src/modules/sync/sync.service.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create sync service**

Create `apps/api/src/modules/sync/sync.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SyncResponse {
  invoices: unknown[];
  customers: unknown[];
  catalogItems: unknown[];
  syncTimestamp: string;
}

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async getChangesSince(tenantId: string, since: string | null): Promise<SyncResponse> {
    const sinceDate = since ? new Date(since) : new Date(0);
    const now = new Date();

    const [invoices, customers, catalogItems] = await Promise.all([
      this.prisma.dTE.findMany({
        where: {
          tenantId,
          createdAt: { gte: sinceDate },
        },
        select: {
          id: true,
          tipoDte: true,
          codigoGeneracion: true,
          numeroControl: true,
          estado: true,
          selloRecepcion: true,
          totalGravada: true,
          totalIva: true,
          totalPagar: true,
          createdAt: true,
          cliente: {
            select: { nombre: true, numDocumento: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      }),
      this.prisma.cliente.findMany({
        where: {
          tenantId,
          updatedAt: { gte: sinceDate },
        },
        select: {
          id: true,
          tipoDocumento: true,
          numDocumento: true,
          nombre: true,
          nrc: true,
          correo: true,
          telefono: true,
          direccion: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.catalogItem.findMany({
        where: {
          tenantId,
          isActive: true,
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          type: true,
          basePrice: true,
          uniMedida: true,
          taxRate: true,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      invoices: invoices.map((inv) => ({
        ...inv,
        totalGravada: Number(inv.totalGravada),
        totalIva: Number(inv.totalIva),
        totalPagar: Number(inv.totalPagar),
        receptorNombre: inv.cliente?.nombre,
        receptorDocumento: inv.cliente?.numDocumento,
      })),
      customers,
      catalogItems: catalogItems.map((item) => ({
        ...item,
        basePrice: Number(item.basePrice),
        taxRate: Number(item.taxRate),
      })),
      syncTimestamp: now.toISOString(),
    };
  }
}
```

- [ ] **Step 2: Create sync controller**

Create `apps/api/src/modules/sync/sync.controller.ts`:
```typescript
import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SyncService } from './sync.service';

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Get()
  @ApiQuery({ name: 'since', required: false, description: 'ISO timestamp — returns records modified since this date' })
  async getChanges(
    @Request() req: { user: { tenantId: string } },
    @Query('since') since?: string,
  ) {
    return this.syncService.getChangesSince(req.user.tenantId, since || null);
  }
}
```

- [ ] **Step 3: Create sync module**

Create `apps/api/src/modules/sync/sync.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
```

- [ ] **Step 4: Register SyncModule in AppModule**

In `apps/api/src/app.module.ts`, add the import:

```typescript
import { SyncModule } from './modules/sync/sync.module';
```

And add `SyncModule` to the `imports` array.

- [ ] **Step 5: Verify API compiles**

```bash
cd /home/jose/facturador-electronico-sv/apps/api && npx nest build 2>&1 | tail -5
```
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/api/src/modules/sync/ apps/api/src/app.module.ts && git commit -m "feat(api): add /api/v1/sync endpoint for incremental offline data sync"
```

---

## Task 10: Install Prompt + Banner

**Files:**
- Create: `apps/web/src/hooks/use-install-prompt.ts`
- Create: `apps/web/src/components/pwa/install-banner.tsx`

- [ ] **Step 1: Create useInstallPrompt hook**

Create `apps/web/src/hooks/use-install-prompt.ts`:
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setShowBanner(false);
  }, []);

  return { showBanner, isInstalled, install, dismiss };
}
```

- [ ] **Step 2: Create install banner component**

Create `apps/web/src/components/pwa/install-banner.tsx`:
```tsx
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
```

- [ ] **Step 3: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/hooks/use-install-prompt.ts apps/web/src/components/pwa/install-banner.tsx && git commit -m "feat(pwa): add install prompt hook and mobile banner component"
```

---

## Task 11: Bottom Navigation (Mobile)

**Files:**
- Create: `apps/web/src/components/mobile/bottom-nav.tsx`

- [ ] **Step 1: Create bottom navigation component**

Create `apps/web/src/components/mobile/bottom-nav.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Plus, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/es/dashboard', label: 'Inicio', icon: Home },
  { href: '/es/facturas', label: 'Facturas', icon: FileText },
  { href: '/es/facturas/nueva', label: 'Nueva', icon: Plus, isAction: true },
  { href: '/es/cotizaciones', label: 'Cotizaciones', icon: ClipboardList },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center py-2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                  <Icon className="h-5 w-5" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Integrate into dashboard layout**

Find the dashboard layout file and add `BottomNav` + `OnlineIndicator` + `InstallBanner`. The dashboard layout is at `apps/web/src/app/(dashboard)/layout.tsx`. Read it first, then add the components:

```tsx
import { BottomNav } from '@/components/mobile/bottom-nav';
import { OnlineIndicator } from '@/components/pwa/online-indicator';
import { InstallBanner } from '@/components/pwa/install-banner';
```

Add these at the end of the layout's return JSX:
```tsx
{/* Mobile PWA components */}
<BottomNav />
<InstallBanner />
```

Add `<OnlineIndicator />` in the header/navbar area of the dashboard layout, next to existing header controls.

Also add bottom padding to the main content area so the bottom nav doesn't cover content:
```tsx
<main className="... pb-20 md:pb-0">
```

- [ ] **Step 3: Add safe-area CSS**

Add to `apps/web/src/app/globals.css` (at the top, after existing content):
```css
/* PWA safe areas for notched devices */
@supports (padding: env(safe-area-inset-bottom)) {
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

/* Prevent input zoom on iOS */
@media (max-width: 768px) {
  input[type="text"],
  input[type="number"],
  input[type="email"],
  input[type="tel"],
  textarea,
  select {
    font-size: 16px !important;
  }
}
```

- [ ] **Step 4: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/components/mobile/bottom-nav.tsx apps/web/src/app/globals.css && git add -u && git commit -m "feat(pwa): add mobile bottom navigation, online indicator integration, safe-area CSS"
```

---

## Task 12: Initial Data Sync (First Login)

**Files:**
- Create: `apps/web/src/lib/initial-sync.ts`

- [ ] **Step 1: Create initial sync function**

Create `apps/web/src/lib/initial-sync.ts`:
```typescript
import { db } from './db';
import { apiFetch } from './api';
import type { OfflineInvoice, OfflineCustomer, OfflineCatalogItem } from './db-types';

interface SyncApiResponse {
  invoices: Array<{
    id: string;
    tipoDte: string;
    codigoGeneracion: string;
    numeroControl: string;
    estado: string;
    selloRecepcion?: string;
    totalGravada: number;
    totalIva: number;
    totalPagar: number;
    receptorNombre?: string;
    receptorDocumento?: string;
    createdAt: string;
  }>;
  customers: Array<{
    id: string;
    tipoDocumento: string;
    numDocumento: string;
    nombre: string;
    nrc?: string;
    correo?: string;
    telefono?: string;
    direccion: string;
    createdAt: string;
    updatedAt: string;
  }>;
  catalogItems: Array<{
    id: string;
    code: string;
    name: string;
    description?: string;
    type: string;
    basePrice: number;
    uniMedida: number;
    taxRate: number;
    isActive: boolean;
  }>;
  syncTimestamp: string;
}

/**
 * Sync data from server to Dexie for offline use.
 * On first login: full sync. On subsequent opens: incremental.
 * Returns progress callback for UI.
 */
export async function syncFromServer(
  tenantId: string,
  onProgress?: (percent: number, message: string) => void,
): Promise<void> {
  const lastSync = await db.appCache.get('lastSyncTimestamp');
  const sinceParam = lastSync?.value ? `?since=${encodeURIComponent(lastSync.value)}` : '';
  const isInitial = !lastSync?.value;

  onProgress?.(10, isInitial ? 'Descargando datos para uso offline...' : 'Sincronizando cambios...');

  const data = await apiFetch<SyncApiResponse>(`/sync${sinceParam}`);

  // Save invoices
  onProgress?.(30, `Guardando ${data.invoices.length} facturas...`);
  if (data.invoices.length > 0) {
    const offlineInvoices: OfflineInvoice[] = data.invoices.map((inv) => ({
      serverId: inv.id,
      tenantId,
      codigoGeneracion: inv.codigoGeneracion,
      numeroControl: inv.numeroControl,
      tipoDte: inv.tipoDte,
      estado: inv.estado,
      selloRecepcion: inv.selloRecepcion,
      totalGravada: inv.totalGravada,
      totalIva: inv.totalIva,
      totalPagar: inv.totalPagar,
      receptorNombre: inv.receptorNombre,
      receptorDocumento: inv.receptorDocumento,
      createdAt: inv.createdAt,
    }));

    if (isInitial) {
      await db.invoices.bulkPut(offlineInvoices);
    } else {
      // Incremental: upsert by serverId
      for (const inv of offlineInvoices) {
        const existing = await db.invoices.where('serverId').equals(inv.serverId!).first();
        if (existing) {
          await db.invoices.update(existing.localId!, inv);
        } else {
          await db.invoices.add(inv);
        }
      }
    }
  }

  // Save customers
  onProgress?.(60, `Guardando ${data.customers.length} clientes...`);
  if (data.customers.length > 0) {
    const offlineCustomers: OfflineCustomer[] = data.customers.map((c) => ({
      serverId: c.id,
      tenantId,
      tipoDocumento: c.tipoDocumento,
      numDocumento: c.numDocumento,
      nombre: c.nombre,
      nrc: c.nrc,
      correo: c.correo,
      telefono: c.telefono,
      direccion: c.direccion,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    if (isInitial) {
      await db.customers.bulkPut(offlineCustomers);
    } else {
      for (const cust of offlineCustomers) {
        const existing = await db.customers.where('serverId').equals(cust.serverId!).first();
        if (existing) {
          await db.customers.update(existing.localId!, cust);
        } else {
          await db.customers.add(cust);
        }
      }
    }
  }

  // Save catalog items
  onProgress?.(80, `Guardando ${data.catalogItems.length} productos...`);
  if (data.catalogItems.length > 0) {
    const offlineCatalog: OfflineCatalogItem[] = data.catalogItems.map((item) => ({
      serverId: item.id,
      tenantId,
      code: item.code,
      name: item.name,
      description: item.description,
      type: item.type,
      basePrice: item.basePrice,
      uniMedida: item.uniMedida,
      taxRate: item.taxRate,
      isActive: item.isActive,
      updatedAt: new Date().toISOString(),
    }));

    // Catalog is server-authoritative — always overwrite
    await db.catalogItems.where('tenantId').equals(tenantId).delete();
    await db.catalogItems.bulkAdd(offlineCatalog);
  }

  // Save sync timestamp
  await db.appCache.put({ key: 'lastSyncTimestamp', value: data.syncTimestamp });

  onProgress?.(100, 'Sincronización completa');
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/lib/initial-sync.ts && git commit -m "feat(pwa): add initial data sync function with progress reporting"
```

---

## Task 13: Run All Tests + Final Verification

- [ ] **Step 1: Run all unit tests**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx vitest run
```
Expected: All tests pass (5 db tests + 3 online status tests + 5 sync queue tests + 4 sync engine tests = 17 tests).

- [ ] **Step 2: Run full project build**

```bash
cd /home/jose/facturador-electronico-sv && npx turbo build
```
Expected: Both `api` and `web` build successfully.

- [ ] **Step 3: Verify generated SW file exists**

```bash
ls -la /home/jose/facturador-electronico-sv/apps/web/.next/static/chunks/app/
```
Verify the build output exists. In production mode, check for sw.js in public/.

- [ ] **Step 4: Final commit if anything was missed**

```bash
cd /home/jose/facturador-electronico-sv && git status
```
Stage and commit any remaining files.

- [ ] **Step 5: Tag Sprint 1 completion**

```bash
cd /home/jose/facturador-electronico-sv && git tag -a sprint1-pwa-foundation -m "Sprint 1 complete: PWA foundation, Dexie offline DB, sync queue, service worker"
```

---

## Sprint 1 Exit Criteria Checklist

- [ ] PWA manifest generates at build time with proper icons
- [ ] Service worker registered and caching (network-first for API)
- [ ] Dexie database with 5 tables and compound indexes
- [ ] Sync queue: add, remove, markFailed operations work
- [ ] Sync engine processes queue FIFO on reconnect
- [ ] Online/offline indicator shows correct state
- [ ] Bottom navigation renders on mobile
- [ ] Install banner shows on supported browsers
- [ ] React Query configured for offlineFirst
- [ ] /api/v1/sync endpoint returns incremental data
- [ ] Initial data sync function with progress callback
- [ ] 17+ unit tests passing
- [ ] Both web and api build successfully
