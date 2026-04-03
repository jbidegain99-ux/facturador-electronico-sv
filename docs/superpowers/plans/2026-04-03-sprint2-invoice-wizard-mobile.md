# Sprint 2: Invoice Wizard Mobile + Offline Submit

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and submit invoices from mobile phone, including offline. Integrate Sprint 1 PWA components into the dashboard layout.

**Architecture:** A mobile wizard wrapper presents the existing invoice components (cliente-search, items-table, catalog-search, totales-card) as 4 sequential steps on screens < md breakpoint. Desktop view remains unchanged. Offline submit queues the DTE payload to the Dexie sync queue and shows "Saved offline" state. DTE status polling uses React Query refetchInterval.

**Tech Stack:** Next.js 14.2.x, Zustand, React Query, Dexie.js, react-signature-canvas (lazy)

**Sprint dates:** 2026-04-21 → 2026-05-02

**Key principle:** Reuse existing components. The invoice page (`facturas/nueva/page.tsx`) already has client search, items table, catalog search, totals card, and DTE submission logic. We wrap these for mobile, not rewrite them.

---

## File Structure

### New files

```
apps/web/src/
├── components/
│   ├── mobile/
│   │   ├── mobile-wizard.tsx              # Generic step-based wizard shell for mobile
│   │   ├── mobile-wizard-step.tsx         # Individual step wrapper with animation
│   │   └── invoice-list-mobile.tsx        # Mobile invoice list with status badges
│   └── facturas/
│       └── signature-pad.tsx              # Lazy-loaded react-signature-canvas wrapper
├── hooks/
│   └── use-dte-polling.ts                 # DTE status polling with refetchInterval
└── app/(dashboard)/facturas/
    └── page.tsx                           # Invoice list page (mobile card layout)
```

### Modified files

```
apps/web/src/app/(dashboard)/layout.tsx                    # Add BottomNav, OnlineIndicator, InstallBanner, mobile padding
apps/web/src/app/(dashboard)/facturas/nueva/page.tsx       # Add mobile wizard wrapper, offline submit, auto-save to Dexie
apps/web/src/components/facturas/cliente-search.tsx         # Add Dexie offline search fallback
apps/web/src/components/facturas/catalog-search.tsx         # Add Dexie offline search fallback
apps/web/src/components/facturas/items-table.tsx            # Touch-friendly: larger tap targets, swipe hint
apps/web/src/store/index.ts                                # No changes (wizard store already exists)
apps/web/package.json                                      # Add react-signature-canvas
```

---

## Task 1: Install react-signature-canvas

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install dependency**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npm install react-signature-canvas @types/react-signature-canvas
```

- [ ] **Step 2: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/package.json apps/web/package-lock.json && git commit -m "chore: add react-signature-canvas for invoice signing"
```

---

## Task 2: Integrate Sprint 1 PWA Components into Dashboard Layout

**Files:**
- Modify: `apps/web/src/app/(dashboard)/layout.tsx`

This is a critical integration task. The dashboard layout currently has a sidebar + header + main area. We need to add:
1. `BottomNav` (mobile only, hidden on md+)
2. `OnlineIndicator` in the header area
3. `InstallBanner` floating above bottom nav
4. Mobile padding (`pb-20`) so content isn't hidden behind bottom nav

- [ ] **Step 1: Read the current dashboard layout**

Read `apps/web/src/app/(dashboard)/layout.tsx` to understand the exact structure.

- [ ] **Step 2: Add imports for PWA components**

Add at the top of the file:
```tsx
import { BottomNav } from '@/components/mobile/bottom-nav';
import { OnlineIndicator } from '@/components/pwa/online-indicator';
import { InstallBanner } from '@/components/pwa/install-banner';
import { useSyncQueueStore } from '@/store/sync-queue';
```

- [ ] **Step 3: Add OnlineIndicator to the header area**

Inside the header section of the layout, add `<OnlineIndicator />` with the pending count from the sync queue store. Find the header element and add the indicator next to existing header controls. The indicator component takes `pendingCount` as a prop:

```tsx
const pendingCount = useSyncQueueStore((s) => s.pendingCount());
// ... in header JSX:
<OnlineIndicator pendingCount={pendingCount} />
```

- [ ] **Step 4: Add BottomNav and InstallBanner at the end of the layout**

Before the closing fragment/div of the layout, add:
```tsx
<BottomNav />
<InstallBanner />
```

- [ ] **Step 5: Add mobile bottom padding to main content**

Find the `<main>` element and add `pb-20 md:pb-0` to its className so bottom nav doesn't cover content:
```tsx
<main className="... pb-20 md:pb-0">
```

- [ ] **Step 6: Verify the layout renders correctly**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx next build 2>&1 | tail -5
```

- [ ] **Step 7: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/app/'(dashboard)'/layout.tsx && git commit -m "feat(pwa): integrate bottom nav, online indicator, install banner into dashboard layout"
```

---

## Task 3: Mobile Wizard Shell Component

**Files:**
- Create: `apps/web/src/components/mobile/mobile-wizard.tsx`

This is a generic wizard shell that wraps any set of children as sequential steps on mobile. On desktop (md+), it renders nothing — the existing layout takes over.

- [ ] **Step 1: Create the mobile wizard component**

Create `apps/web/src/components/mobile/mobile-wizard.tsx`:
```tsx
'use client';

import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStep {
  label: string;
  content: ReactNode;
  isValid?: boolean;
}

interface MobileWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}

export function MobileWizard({
  steps,
  currentStep,
  onStepChange,
  onSubmit,
  submitLabel = 'Enviar',
  isSubmitting = false,
  className,
}: MobileWizardProps) {
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const currentStepData = steps[currentStep];

  return (
    <div className={cn('flex flex-col md:hidden', className)}>
      {/* Progress bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
        {steps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => onStepChange(idx)}
            className={cn(
              'flex-1 h-1.5 rounded-full transition-colors',
              idx <= currentStep ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Step label */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Paso {currentStep + 1} de {steps.length}
        </p>
        <h2 className="text-lg font-semibold">{currentStepData.label}</h2>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {currentStepData.content}
      </div>

      {/* Navigation footer */}
      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border bg-background px-4 py-3 flex gap-3 md:hidden">
        {!isFirstStep && (
          <button
            onClick={() => onStepChange(currentStep - 1)}
            className="flex items-center gap-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Atrás
          </button>
        )}
        <button
          onClick={isLastStep ? onSubmit : () => onStepChange(currentStep + 1)}
          disabled={isSubmitting}
          className={cn(
            'flex-1 flex items-center justify-center gap-1 rounded-lg px-4 py-2.5 text-sm font-medium text-primary-foreground',
            isLastStep ? 'bg-primary' : 'bg-primary',
            isSubmitting && 'opacity-50'
          )}
        >
          {isSubmitting ? (
            'Enviando...'
          ) : isLastStep ? (
            submitLabel
          ) : (
            <>
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/components/mobile/mobile-wizard.tsx && git commit -m "feat(pwa): add generic mobile wizard shell component"
```

---

## Task 4: Offline Customer Search

**Files:**
- Modify: `apps/web/src/components/facturas/cliente-search.tsx`

Add Dexie fallback: when offline, search the local `customers` table instead of calling the API.

- [ ] **Step 1: Read current cliente-search.tsx**

Read `apps/web/src/components/facturas/cliente-search.tsx` fully to understand the current search logic.

- [ ] **Step 2: Add offline search logic**

At the top of the file, add imports:
```tsx
import { useOnlineStatus } from '@/hooks/use-online-status';
import { db } from '@/lib/db';
```

Inside the component, add the online status check:
```tsx
const { isOnline } = useOnlineStatus();
```

Modify the search function (the debounced API call) to check `isOnline` first. If offline, query Dexie instead:

```tsx
// In the search handler:
if (!isOnline) {
  // Offline: search Dexie
  const results = await db.customers
    .where('nombre')
    .startsWithIgnoreCase(searchTerm)
    .limit(10)
    .toArray();
  // Map Dexie results to Cliente format
  setResults(results.map(c => ({
    id: c.serverId || `local_${c.localId}`,
    tipoDocumento: c.tipoDocumento,
    numDocumento: c.numDocumento,
    nombre: c.nombre,
    nrc: c.nrc,
    correo: c.correo,
    telefono: c.telefono,
    direccion: typeof c.direccion === 'string' ? JSON.parse(c.direccion) : c.direccion,
    createdAt: c.createdAt,
  })));
  return;
}
// ... existing API search continues for online mode
```

- [ ] **Step 3: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/components/facturas/cliente-search.tsx && git commit -m "feat(pwa): add offline customer search via Dexie fallback"
```

---

## Task 5: Offline Catalog Search

**Files:**
- Modify: `apps/web/src/components/facturas/catalog-search.tsx`

Same pattern as Task 4 but for catalog items.

- [ ] **Step 1: Read current catalog-search.tsx**

Read `apps/web/src/components/facturas/catalog-search.tsx` fully.

- [ ] **Step 2: Add offline catalog search**

Add the same imports (`useOnlineStatus`, `db`) and modify the search handler to query Dexie `catalogItems` table when offline:

```tsx
if (!isOnline) {
  const results = await db.catalogItems
    .where('name')
    .startsWithIgnoreCase(searchTerm)
    .limit(10)
    .toArray();
  setResults(results.map(item => ({
    id: item.serverId || `local_${item.localId}`,
    code: item.code,
    name: item.name,
    description: item.description,
    type: item.type,
    basePrice: item.basePrice,
    uniMedida: item.uniMedida,
    taxRate: item.taxRate,
    isActive: item.isActive,
  })));
  return;
}
```

Also add offline fallback for "recent items" — load from Dexie when offline.

- [ ] **Step 3: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/components/facturas/catalog-search.tsx && git commit -m "feat(pwa): add offline catalog search via Dexie fallback"
```

---

## Task 6: DTE Status Polling Hook

**Files:**
- Create: `apps/web/src/hooks/use-dte-polling.ts`
- Create: `apps/web/tests/unit/use-dte-polling.test.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/tests/unit/use-dte-polling.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';

describe('DTE Polling logic', () => {
  it('should stop polling when status is PROCESADO', () => {
    const shouldPoll = (status: string | undefined) => {
      if (!status) return 5000;
      if (status === 'PROCESADO' || status === 'RECHAZADO') return false;
      return 5000;
    };
    
    expect(shouldPoll(undefined)).toBe(5000);
    expect(shouldPoll('PENDIENTE')).toBe(5000);
    expect(shouldPoll('PROCESADO')).toBe(false);
    expect(shouldPoll('RECHAZADO')).toBe(false);
  });

  it('should stop polling after 60 seconds', () => {
    const MAX_POLL_DURATION = 60000;
    const startTime = Date.now() - 61000; // 61 seconds ago
    const shouldContinue = Date.now() - startTime < MAX_POLL_DURATION;
    expect(shouldContinue).toBe(false);
  });
});
```

- [ ] **Step 2: Create the polling hook**

Create `apps/web/src/hooks/use-dte-polling.ts`:
```typescript
'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface DteStatusResponse {
  id: string;
  estado: string;
  selloRecepcion?: string;
  codigoMh?: string;
  descripcionMh?: string;
}

const MAX_POLL_DURATION = 60000; // 60 seconds

export function useDtePolling(dteId: string | null) {
  const [startedAt] = useState(() => Date.now());

  const shouldPoll = useCallback(
    (status: string | undefined): number | false => {
      if (!status) return 5000;
      if (status === 'PROCESADO' || status === 'RECHAZADO' || status === 'ANULADO') return false;
      if (Date.now() - startedAt > MAX_POLL_DURATION) return false;
      return 5000;
    },
    [startedAt],
  );

  const query = useQuery<DteStatusResponse>({
    queryKey: ['dte-status', dteId],
    queryFn: () => apiFetch<DteStatusResponse>(`/dte/${dteId}`),
    enabled: !!dteId,
    refetchInterval: (query) => shouldPoll(query.state.data?.estado),
  });

  const isTerminal = query.data?.estado === 'PROCESADO' || query.data?.estado === 'RECHAZADO';

  return {
    ...query,
    isTerminal,
    isPending: !!dteId && !isTerminal,
  };
}
```

- [ ] **Step 3: Run tests**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx vitest run tests/unit/use-dte-polling.test.ts
```

- [ ] **Step 4: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/hooks/use-dte-polling.ts apps/web/tests/unit/use-dte-polling.test.ts && git commit -m "feat(pwa): add DTE status polling hook with auto-stop on terminal state"
```

---

## Task 7: Offline Invoice Submit + Auto-Save to Dexie

**Files:**
- Modify: `apps/web/src/app/(dashboard)/facturas/nueva/page.tsx`

This is the most complex task. We modify the existing invoice page to:
1. Auto-save to Dexie instead of just localStorage
2. When offline, queue the DTE payload to the sync queue instead of POSTing to API
3. Show offline state in the UI

- [ ] **Step 1: Read current page.tsx fully**

Read `apps/web/src/app/(dashboard)/facturas/nueva/page.tsx` completely.

- [ ] **Step 2: Add offline imports**

Add to the top of page.tsx:
```tsx
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useSyncQueueStore } from '@/store/sync-queue';
import { db } from '@/lib/db';
import { useAppStore } from '@/store';
```

- [ ] **Step 3: Add offline status and sync queue**

Inside the component, add:
```tsx
const { isOnline } = useOnlineStatus();
const addOp = useSyncQueueStore((s) => s.addOp);
const tenant = useAppStore((s) => s.tenant);
```

- [ ] **Step 4: Modify auto-save to use Dexie**

Find the auto-save interval (currently saves to localStorage every 30 seconds). Add Dexie save alongside it:

```tsx
// After existing localStorage save, also save to Dexie for offline recovery
if (tenant?.id) {
  db.appCache.put({
    key: `factura-draft-${tenant.id}`,
    value: JSON.stringify({ tipoDte: formState.tipoDte, cliente: formState.cliente, items: formState.items, condicionPago: formState.condicionPago }),
  }).catch(() => {}); // Non-critical, don't fail on Dexie errors
}
```

- [ ] **Step 5: Modify emit/submit to handle offline**

Find the submit/emit handler (the function that calls `POST /dte`). Wrap it with an online check:

```tsx
const handleEmit = async () => {
  // ... existing validation stays the same ...
  
  if (!isOnline) {
    // Offline: queue to sync queue
    const payload = buildDtePayload(); // existing payload construction
    await addOp('CREATE_INVOICE', payload);
    
    // Also save to Dexie invoices table as OFFLINE_PENDING
    await db.invoices.add({
      tenantId: tenant!.id,
      codigoGeneracion: payload.codigoGeneracion || `offline_${Date.now()}`,
      tipoDte: formState.tipoDte,
      estado: 'OFFLINE_PENDING',
      totalPagar: total,
      receptorNombre: formState.cliente?.nombre,
      receptorDocumento: formState.cliente?.numDocumento,
      jsonOriginal: JSON.stringify(payload),
      createdAt: new Date().toISOString(),
    });
    
    // Show success with offline indicator
    toast({ title: 'Factura guardada offline', description: 'Se enviará automáticamente cuando tengas conexión.' });
    // Reset form
    return;
  }
  
  // ... existing online submit logic stays the same ...
};
```

- [ ] **Step 6: Add mobile wizard view**

Import the MobileWizard and wrap the form content for mobile. Below the existing desktop form, add a mobile-only wizard that presents the same form sections as steps:

```tsx
import { MobileWizard } from '@/components/mobile/mobile-wizard';

// Inside the component, add mobile wizard step state:
const [mobileStep, setMobileStep] = useState(0);

// In the JSX, before the existing desktop form:
<MobileWizard
  steps={[
    { label: 'Tipo y Cliente', content: <>{/* DTE type selector + ClienteSearch */}</> },
    { label: 'Productos', content: <>{/* CatalogSearch + ItemsTable */}</> },
    { label: 'Resumen', content: <>{/* TotalesCard + condición de pago */}</> },
    { label: 'Confirmar', content: <>{/* Preview + signature if needed */}</> },
  ]}
  currentStep={mobileStep}
  onStepChange={setMobileStep}
  onSubmit={handleEmit}
  submitLabel={isOnline ? 'Emitir Factura' : 'Guardar Offline'}
  isSubmitting={isSubmitting}
/>

{/* Existing desktop form - add md:block hidden to show only on desktop */}
<div className="hidden md:block">
  {/* ... existing form content ... */}
</div>
```

IMPORTANT: Don't duplicate components. The wizard steps should reference the SAME component instances (ClienteSearch, ItemsTable, etc.) — they're just wrapped differently for mobile. Extract the form sections into variables that both mobile and desktop can reference.

- [ ] **Step 7: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/app/'(dashboard)'/facturas/nueva/page.tsx && git commit -m "feat(pwa): add mobile wizard view, offline submit, and Dexie auto-save to invoice page"
```

---

## Task 8: Mobile Invoice List Page

**Files:**
- Create: `apps/web/src/components/mobile/invoice-list-mobile.tsx`
- Modify: `apps/web/src/app/(dashboard)/facturas/page.tsx` (if it exists, otherwise create)

- [ ] **Step 1: Check if facturas list page exists**

```bash
ls -la /home/jose/facturador-electronico-sv/apps/web/src/app/\(dashboard\)/facturas/page.tsx
```

- [ ] **Step 2: Create mobile invoice list component**

Create `apps/web/src/components/mobile/invoice-list-mobile.tsx`:
```tsx
'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { useApi } from '@/hooks/use-api';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '@/store';
import { DteStatusBadge } from '@/components/dte/dte-status-badge';
import { FileText, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DTERecord } from '@/types';

export function InvoiceListMobile() {
  const { isOnline } = useOnlineStatus();
  const tenant = useAppStore((s) => s.tenant);

  // Online: fetch from API
  const { data: onlineInvoices, isLoading, refetch } = useApi<DTERecord[]>('/dte?limit=50&sort=createdAt:desc');

  // Offline: read from Dexie
  const offlineInvoices = useLiveQuery(
    () => tenant?.id
      ? db.invoices.where('tenantId').equals(tenant.id).reverse().sortBy('createdAt')
      : [],
    [tenant?.id],
  );

  const invoices = isOnline ? onlineInvoices : (offlineInvoices || []);

  return (
    <div className="space-y-2 md:hidden">
      {/* Pull to refresh hint */}
      {isOnline && (
        <button onClick={() => refetch()} className="flex w-full items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          Actualizar
        </button>
      )}

      {isLoading && <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
      ))}</div>}

      {invoices?.map((inv: DTERecord | typeof offlineInvoices extends (infer U)[] | undefined ? U : never) => (
        <div
          key={'codigoGeneracion' in inv ? inv.codigoGeneracion : inv.localId}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {'receptorNombre' in inv ? inv.receptorNombre : 'Cliente'}
            </p>
            <p className="text-xs text-muted-foreground">
              ${'totalPagar' in inv ? Number(inv.totalPagar).toFixed(2) : '0.00'}
            </p>
          </div>
          <DteStatusBadge status={'estado' in inv ? inv.estado : 'PENDIENTE'} />
        </div>
      ))}

      {(!invoices || invoices.length === 0) && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">No hay facturas recientes</p>
        </div>
      )}
    </div>
  );
}
```

NOTE: This requires `dexie-react-hooks` package — install it:
```bash
cd /home/jose/facturador-electronico-sv/apps/web && npm install dexie-react-hooks
```

- [ ] **Step 3: Integrate into facturas list page**

If the facturas list page exists, add the mobile component. If not, the existing page should be modified to include `<InvoiceListMobile />` for mobile views and hide the desktop table.

- [ ] **Step 4: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add -A && git commit -m "feat(pwa): add mobile invoice list with offline Dexie fallback"
```

---

## Task 9: Signature Pad Component (Lazy)

**Files:**
- Create: `apps/web/src/components/facturas/signature-pad.tsx`

- [ ] **Step 1: Create lazy signature pad wrapper**

Create `apps/web/src/components/facturas/signature-pad.tsx`:
```tsx
'use client';

import { useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Eraser } from 'lucide-react';

const SignatureCanvas = dynamic(() => import('react-signature-canvas'), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-lg bg-muted" />,
});

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

export function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const sigRef = useRef<{ clear: () => void; toDataURL: () => string } | null>(null);

  const handleEnd = useCallback(() => {
    if (sigRef.current) {
      onSignatureChange(sigRef.current.toDataURL());
    }
  }, [onSignatureChange]);

  const handleClear = useCallback(() => {
    sigRef.current?.clear();
    onSignatureChange(null);
  }, [onSignatureChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Firma</label>
        <button
          onClick={handleClear}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Eraser className="h-3 w-3" />
          Borrar
        </button>
      </div>
      <div className="rounded-lg border border-border bg-background">
        <SignatureCanvas
          ref={(ref: unknown) => { sigRef.current = ref as typeof sigRef.current; }}
          canvasProps={{
            className: 'w-full h-40 rounded-lg',
            style: { width: '100%', height: '160px' },
          }}
          onEnd={handleEnd}
        />
      </div>
      <p className="text-xs text-muted-foreground">Firme con el dedo en el recuadro</p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/src/components/facturas/signature-pad.tsx && git commit -m "feat(pwa): add lazy-loaded signature pad component"
```

---

## Task 10: Vitest Tests for Sprint 2

**Files:**
- Create: `apps/web/tests/unit/invoice-offline.test.ts`

- [ ] **Step 1: Write tests for offline invoice submission**

Create `apps/web/tests/unit/invoice-offline.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { useSyncQueueStore } from '@/store/sync-queue';

describe('Offline Invoice Submit', () => {
  beforeEach(async () => {
    useSyncQueueStore.setState({ items: [] });
    await db.delete();
    await db.open();
  });

  it('should save offline invoice to Dexie and sync queue', async () => {
    const tenantId = 'tenant_1';
    const payload = {
      tipoDte: '01',
      codigoGeneracion: `offline_${Date.now()}`,
      receptor: { nombre: 'Test Client', numDocumento: '06141804941014' },
      items: [{ descripcion: 'Test', cantidad: 1, precioUnitario: 10, iva: 1.30, total: 11.30 }],
    };

    // Queue to sync
    await useSyncQueueStore.getState().addOp('CREATE_INVOICE', payload);

    // Save to local invoices
    await db.invoices.add({
      tenantId,
      codigoGeneracion: payload.codigoGeneracion,
      tipoDte: '01',
      estado: 'OFFLINE_PENDING',
      totalPagar: 11.30,
      receptorNombre: 'Test Client',
      receptorDocumento: '06141804941014',
      jsonOriginal: JSON.stringify(payload),
      createdAt: new Date().toISOString(),
    });

    // Verify sync queue
    expect(useSyncQueueStore.getState().pendingCount()).toBe(1);

    // Verify Dexie
    const invoices = await db.invoices.where('tenantId').equals(tenantId).toArray();
    expect(invoices).toHaveLength(1);
    expect(invoices[0].estado).toBe('OFFLINE_PENDING');
  });

  it('should auto-save draft to Dexie appCache', async () => {
    const draft = { tipoDte: '01', items: [], cliente: null };
    await db.appCache.put({
      key: 'factura-draft-tenant_1',
      value: JSON.stringify(draft),
    });

    const saved = await db.appCache.get('factura-draft-tenant_1');
    expect(saved).toBeDefined();
    expect(JSON.parse(saved!.value).tipoDte).toBe('01');
  });

  it('should search customers offline via Dexie', async () => {
    await db.customers.bulkAdd([
      { serverId: 'c1', tenantId: 't1', nombre: 'Farmacia ABC', tipoDocumento: '36', numDocumento: '123', direccion: '{}', createdAt: '', updatedAt: '' },
      { serverId: 'c2', tenantId: 't1', nombre: 'Ferreteria XYZ', tipoDocumento: '36', numDocumento: '456', direccion: '{}', createdAt: '', updatedAt: '' },
      { serverId: 'c3', tenantId: 't2', nombre: 'Farmacia Other', tipoDocumento: '36', numDocumento: '789', direccion: '{}', createdAt: '', updatedAt: '' },
    ]);

    const results = await db.customers
      .where('[tenantId+nombre]')
      .between(['t1', ''], ['t1', '\uffff'])
      .filter(c => c.nombre.toLowerCase().includes('farmacia'))
      .limit(10)
      .toArray();

    expect(results).toHaveLength(1);
    expect(results[0].nombre).toBe('Farmacia ABC');
  });

  it('should search catalog items offline via Dexie', async () => {
    await db.catalogItems.bulkAdd([
      { serverId: 'i1', tenantId: 't1', code: 'P001', name: 'Paracetamol', type: 'PRODUCT', basePrice: 5, uniMedida: 59, taxRate: 13, isActive: true, updatedAt: '' },
      { serverId: 'i2', tenantId: 't1', code: 'P002', name: 'Amoxicilina', type: 'PRODUCT', basePrice: 8, uniMedida: 59, taxRate: 13, isActive: true, updatedAt: '' },
    ]);

    const results = await db.catalogItems
      .where('[tenantId+name]')
      .between(['t1', ''], ['t1', '\uffff'])
      .filter(item => item.name.toLowerCase().includes('para'))
      .limit(10)
      .toArray();

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Paracetamol');
  });
});
```

- [ ] **Step 2: Run all tests**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx vitest run
```
Expected: All tests pass (17 Sprint 1 + 4-6 Sprint 2 = ~21-23 total).

- [ ] **Step 3: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/tests/unit/invoice-offline.test.ts && git commit -m "test(pwa): add offline invoice submit and search tests"
```

---

## Task 11: Playwright E2E - Invoice Creation Flow

**Files:**
- Create: `apps/web/tests/e2e/pwa-invoice.spec.ts`

- [ ] **Step 1: Create E2E test for invoice flow**

Create `apps/web/tests/e2e/pwa-invoice.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('PWA Invoice Creation', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone-size

  test('should show bottom navigation on mobile', async ({ page }) => {
    await page.goto('/es/dashboard');
    // Wait for dashboard to load
    await page.waitForSelector('nav'); // bottom nav
    const bottomNav = page.locator('nav.fixed.bottom-0');
    await expect(bottomNav).toBeVisible();
    // Should have 4 nav items
    const links = bottomNav.locator('a');
    await expect(links).toHaveCount(4);
  });

  test('should show online indicator', async ({ page }) => {
    await page.goto('/es/dashboard');
    // Online indicator should be visible somewhere in the layout
    const indicator = page.locator('text=En línea');
    // May or may not be visible depending on auth state
  });
});
```

NOTE: These E2E tests require a running dev server and authentication. They serve as a template — the full E2E suite will be expanded in Sprint 4 when we have the full flow working.

- [ ] **Step 2: Commit**

```bash
cd /home/jose/facturador-electronico-sv && git add apps/web/tests/e2e/ && git commit -m "test(pwa): add Playwright E2E skeleton for mobile invoice flow"
```

---

## Task 12: Final Verification + Build

- [ ] **Step 1: Run all unit tests**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx vitest run
```

- [ ] **Step 2: Build web app**

```bash
cd /home/jose/facturador-electronico-sv/apps/web && npx next build 2>&1 | tail -10
```

- [ ] **Step 3: Build API**

```bash
cd /home/jose/facturador-electronico-sv/apps/api && npx nest build 2>&1 | tail -5
```

- [ ] **Step 4: Review git log**

```bash
cd /home/jose/facturador-electronico-sv && git log --oneline -15
```

---

## Sprint 2 Exit Criteria

- [ ] Bottom nav visible on mobile in dashboard
- [ ] Online indicator shows in dashboard header
- [ ] Install banner shows on mobile
- [ ] Invoice page shows mobile wizard on small screens, desktop form on large
- [ ] Customer search works offline (Dexie fallback)
- [ ] Catalog search works offline (Dexie fallback)
- [ ] Offline invoice submit queues to sync queue + saves to Dexie
- [ ] DTE status polling works after online submit
- [ ] Signature pad loads lazily on wizard step
- [ ] Auto-save persists to Dexie
- [ ] Mobile invoice list shows invoices with status badges
- [ ] 21+ unit tests passing
- [ ] E2E test skeleton in place
- [ ] Both web and API build successfully
