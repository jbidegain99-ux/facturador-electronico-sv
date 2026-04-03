# Decision Log — Facturo PWA Architecture

**Purpose:** Audit trail for every architectural decision. Reference for future contributors.
**Date:** 2026-04-03
**Decision-makers:** Jose (Product), Claude Code (Architecture Review), Pragmatic Review (DX/Scope)

---

## DEC-001: Stay on Next.js 14.2.x (Do NOT Upgrade to 16)

**Status:** DECIDED
**Decided:** 2026-04-03
**Options considered:**
1. Upgrade to Next.js 16 (Original Plan)
2. Stay on Next.js 14.2.x (CC + Pragmatic)

**Decision:** Option 2 — Stay on 14.2.x

**Rationale:**
- Codebase is on 14.2.35. Upgrading to 16 implies React 18→19 and potentially breaking App Router changes.
- All PWA tools (serwist, Dexie.js, React Query) work on 14.2.x.
- Estimated migration cost: 3-5 days (24-40 hours) with high risk of unexpected breakage.
- Zero user-facing benefit from the upgrade for PWA features.

**Revisit when:** Post-MVP (v1.1+). Dedicate a full sprint to the upgrade with proper regression testing.

---

## DEC-002: Dexie.js for Offline Storage

**Status:** DECIDED
**Decided:** 2026-04-03
**Options considered:**
1. Dexie.js (~15KB gz) — IndexedDB wrapper with reactive hooks
2. WatermelonDB (~45KB gz) — relational, React Native focused
3. PouchDB (~50KB gz) — CouchDB sync protocol
4. Raw IndexedDB (0KB) — native browser API

**Decision:** Option 1 — Dexie.js

**Rationale:**
- Smallest bundle (15KB) among abstraction options.
- `useLiveQuery` hook provides reactive UI updates without extra plumbing.
- Promise-based API with compound indexes solves primary query pattern: `[tenantId+estado]`.
- `db.version()` migration system maps cleanly to Prisma schema evolution.
- WatermelonDB is optimized for React Native/SQLite — loses advantage in web PWA.
- PouchDB requires CouchDB-compatible backend; current backend is SQL Server/NestJS.
- Raw IndexedDB saves 15KB but costs 5+ days in boilerplate (cursor management, transaction handling).

**Implementation notes:**
- Schema derived from Prisma types (subset): invoices, customers, catalogItems, syncQueue, appCache.
- Compound indexes: `[tenantId+estado]`, `[tenantId+fecha]` — critical for filter performance on budget devices.
- Version migrations must be tested before deploy. Each Prisma schema change that affects synced tables requires a Dexie version bump.
- Sync window: last 90 days of data. Keeps IndexedDB under ~15MB per tenant.

---

## DEC-003: React Query Polling (Not SSE) for DTE Status

**Status:** DECIDED
**Decided:** 2026-04-03
**Options considered:**
1. SSE (Server-Sent Events) — Original Plan
2. React Query polling with `refetchInterval` — CC + Pragmatic
3. WebSockets — full duplex
4. GraphQL Subscriptions — subscription protocol

**Decision:** Option 2 — React Query polling

**Rationale:**
- DTE processing by Hacienda takes 5-30 seconds. Sub-second latency is unnecessary.
- A typical SMB sends 10-50 DTEs/day — not a real-time workload.
- React Query 5.17 is already in the codebase. `refetchInterval: 5000` with conditional stop is ~10 lines of code.
- SSE requires a new NestJS endpoint + server-side connection state management. Azure App Service has connection limits.
- Zero backend changes needed for polling.
- Polling fails silently offline and retries naturally when connectivity returns.
- Trivially upgradeable to SSE later if multi-user dashboards require it.

**Pattern:**
```typescript
const { data } = useQuery({
  queryKey: ['dte-status', codigoGeneracion],
  queryFn: () => api.get(`/dte/${codigoGeneracion}/status`),
  refetchInterval: (query) => {
    const status = query.state.data?.estado;
    if (status === 'PROCESADO' || status === 'RECHAZADO') return false;
    return 5000;
  },
  enabled: !!codigoGeneracion && isPending,
});
```

**Revisit when:** Multi-user real-time dashboard is built (v2.0+). At that point, evaluate SSE (not WebSockets — SSE is simpler for server→client push).

---

## DEC-004: Zustand + React Query (No Change to State Management)

**Status:** DECIDED
**Decided:** 2026-04-03
**Options considered:**
1. Keep Zustand + React Query (all 3 plans agree)
2. Migrate to Redux Toolkit + RTK Query
3. Drop Zustand, use React Query only
4. Jotai (atomic state)

**Decision:** Option 1 — Keep current stack

**Rationale:**
- Already in production: `useAppStore` (user, tenant, theme, permissions), `useFacturaWizardStore` (multi-step form).
- Zustand persist middleware already saves to localStorage — extend to IndexedDB for offline.
- React Query handles all server state with `networkMode: 'offlineFirst'`.
- Migration to any alternative costs 3-5 days for zero user benefit.

**New additions:**
- `useSyncQueueStore`: tracks pending offline operations (Zustand + Dexie persist).
- React Query cache persistence to IndexedDB via `@tanstack/query-persist-client-core`.

---

## DEC-005: CSS Transitions (Drop Framer Motion)

**Status:** DECIDED
**Decided:** 2026-04-03

**Decision:** Remove Framer Motion. Use CSS transitions and animations only.

**Rationale:**
- Framer Motion adds ~30KB gzipped to the bundle.
- PWA animations should be subtle: page transitions, loading states, button feedback.
- CSS `transition: all 0.2s ease`, `@keyframes`, and `transform` cover 100% of PWA animation needs.
- Performance: CSS animations run on the compositor thread; JS animations (Framer) can cause jank on budget devices.

**Note:** Framer Motion is already in the codebase (v12.33). Any existing usage should be migrated to CSS during the PWA sprint.

---

## DEC-006: No Charts in MVP (Stat Cards Only)

**Status:** DECIDED
**Decided:** 2026-04-03
**Options considered:**
1. Recharts eager (~50KB gz) — Original Plan
2. Recharts lazy-loaded — CC Plan
3. No charts, stat cards only — Pragmatic Plan

**Decision:** Option 3 — Stat cards for MVP, lazy-loaded Recharts in v1.1

**Rationale:**
- Recharts adds ~50KB even when lazy-loaded (still downloaded on dashboard visit).
- 4 stat cards (revenue today, invoices today, pending DTEs, overdue) deliver 80% of dashboard value.
- Stat cards are simple server-rendered numbers — zero additional dependencies.
- Charts are a visual enhancement, not a business need for MVP.
- Savings: 50KB bundle + 16 hours of development time.

**Revisit when:** v1.1 (Week 9-12). Lazy-load Recharts on dashboard page. Consider Chart.js (~10KB) as lighter alternative.

---

## DEC-007: FacturoBot Cut from MVP

**Status:** DECIDED
**Decided:** 2026-04-03
**Options considered:**
1. Conversational AI with sidebar + bubble — Original Plan
2. 5 quick-action buttons — CC Plan
3. Cut entirely — Pragmatic Plan

**Decision:** Option 3 — Cut from MVP

**Rationale:**
- The 5 proposed "quick actions" are all reachable via bottom nav in 1-2 taps:
  - Create Invoice → tap "+" tab
  - Check DTE → tap Invoices tab, see status badges
  - Today's Sales → Home screen stat cards
  - Find Customer → search on wizard Step 1
  - Create Quote → Quotes tab → "+"
- Even the simplified 5-button version costs 4 days + ~10KB for UI that duplicates navigation.
- Conversational AI is a 2-3 week feature requiring NLP/LLM integration — well beyond MVP scope.

**Revisit when:** v1.1. If user research shows demand for voice/chat input, build it then with real usage data.

---

## DEC-008: Push Notifications Cut from MVP

**Status:** DECIDED
**Decided:** 2026-04-03

**Decision:** Cut Web Push from MVP. Use in-app notification badge instead.

**Rationale:**
- Android OEMs (Samsung, Xiaomi, Honor) aggressively kill background processes. Push reliability varies 40-70% depending on device.
- Web Push requires: VAPID key generation, backend push endpoint, permission prompt UX, notification handlers in SW.
- Estimated effort: 16 hours of complex cross-cutting work.
- In-app badge (bell icon + unread count) is 100% reliable, simpler (4-5 hours), and sufficient for MVP.

**Revisit when:** v1.1. After measuring actual PWA install rates and user engagement patterns.

---

## DEC-009: Testing Strategy — No Percy, No BrowserStack

**Status:** DECIDED
**Decided:** 2026-04-03

**Decision:** Vitest (80%) + Playwright (5 flows) + Lighthouse CI + 2 physical devices.

**Rationale:**
- Percy ($399/mo) provides visual regression but is unmaintainable by 1 developer. Manual screenshots before deploys suffice.
- BrowserStack ($29+/mo) provides cloud device testing but can't test PWA-specific behaviors (install prompt, push notifications, battery behavior).
- 2 physical devices (~$200 one-time) provide real-world testing that BrowserStack can't replicate.
- Proper test pyramid: 38 unit + 10 component + 5 E2E = 55 tests.
- Total cost: $0/month + $200 one-time.

**Performance target adjusted:** LCP < 3.0s (not 2.5s). On throttled 3G with ~196KB initial load, 2.5s is borderline. 3.0s is realistic and still excellent UX.

---

## DEC-010: Sync Engine — Simple First, Complex Later

**Status:** DECIDED
**Decided:** 2026-04-03
**Options considered:**
1. Full FIFO queue + 3-retry + exponential backoff + batch (CC Plan)
2. Simple: one try, mark failed, manual retry (Pragmatic Plan)

**Decision:** Option 2 for MVP, evolve to Option 1 based on production data.

**Rationale:**
- 95% of syncs will succeed on first try when connectivity is restored.
- Complex retry logic introduces bugs: retry storms, duplicate submissions, race conditions with manual user actions.
- Simple approach: queue op → try once → success: remove + invalidate cache → fail: mark `failed` in UI → user taps "Retry."
- After production launch, Sentry data will show actual failure patterns. Build retry logic that addresses REAL problems, not hypothetical ones.

**Implementation:**
```
syncQueue table: { id, type, payload, status: 'pending'|'syncing'|'failed', createdAt, failReason }
On reconnect: forEach pending op → POST to API → success: delete → fail: status='failed', failReason=error.message
UI: "1 invoice failed to sync" banner with "Retry" button
```

**Revisit when:** After 2 weeks in production. If sync failure rate > 5%, add exponential backoff. If > 10%, investigate root causes (likely token expiry or MH API outages, not network issues).

---

## DEC-011: Production Monitoring (New — Neither Original Plan Had This)

**Status:** DECIDED
**Decided:** 2026-04-03

**Decision:** Add Sentry (free tier) + custom analytics for PWA-specific metrics.

**Rationale:**
- Neither the Original Plan nor CC Review mention production error tracking.
- Offline sync failures are SILENT without monitoring — users think invoices submitted when they didn't.
- Sentry free tier: 5K events/month, sufficient for early-stage PWA.

**What to track:**
1. JS errors (Sentry automatic)
2. Sync queue failures (custom event)
3. Service Worker registration failures (custom event)
4. PWA installs (`appinstalled` browser event)
5. Offline usage detection (`display-mode: standalone` + `navigator.onLine` false)
6. MH API 503/timeout rates (custom event)

---

## DEC-012: Initial Data Sync on First Login (New)

**Status:** DECIDED
**Decided:** 2026-04-03

**Decision:** On first PWA login, bulk-sync last 90 days of data to Dexie with progress bar.

**Rationale:**
- PWA offline only works if there's data in IndexedDB. Both original plans assumed data would "be there" without specifying how.
- Typical SMB: 50-500 customers (~100KB), 20-200 catalog items (~50KB), 100-5000 DTEs 90 days (~2MB).
- First sync: 3-8 seconds on 3G. Show progress bar: "Syncing for offline use... 45%"
- Incremental sync: on each app open, `GET /api/sync?since={lastSyncTimestamp}` → only changed records.

**API requirement:** Backend needs a `/api/sync` endpoint that returns records modified since a timestamp. Add to Sprint 1.
