# FACTURO PWA MASTER PLAN

**Version:** 1.0 — Consolidated from 3 independent reviews
**Date:** 2026-04-03
**Inputs:** Original Plan (Jose) + Claude Code Review + Pragmatic Review
**Timeline:** 8 weeks (Sprint start: 2026-04-07)
**Team:** 1 developer + QA
**Confidence:** 8/10

---

## 1. Executive Summary

Facturo will ship a Progressive Web App (PWA) optimized for El Salvador's SMB market — business owners creating invoices on budget Android phones with unreliable 3G connectivity. The PWA enables offline invoice creation, automatic sync to Hacienda (MH), and mobile-first business management.

**3 critical decisions that define this plan:**

1. **No framework upgrades.** Stay on Next.js 14.2.x and Tailwind 3.3. All PWA tools work on the current stack. Framework migration is a separate initiative post-MVP.
2. **Offline-first, complexity-later.** Dexie.js for storage, simple sync-on-reconnect (no retry algorithms in v1), React Query polling for DTE status (no SSE). Ship simple, add complexity based on real production data.
3. **Ruthless scope.** 4 core features ship in MVP: invoice wizard, offline sync, quote approval, stat cards. Everything else (charts, FacturoBot, push notifications) is v1.1 in weeks 9-12.

### What Ships (v1.0 MVP)

| Feature | User Value |
|---------|-----------|
| Installable PWA with offline shell | Open app without internet, see cached data |
| 4-step invoice wizard (mobile-optimized) | Create invoices on phone in < 2 minutes |
| Offline invoice creation + sync | Create invoice on bus, auto-submits when signal returns |
| DTE status polling | Know if Hacienda accepted within 30 seconds |
| Customer search (online + offline) | Find customers even without connectivity |
| Quote approve/reject (card-based) | Approve quotes from phone with signature |
| Home stat cards (4 KPIs) | Glanceable business metrics, no heavy charts |
| In-app notification badge | See pending items without push notifications |
| Production monitoring (Sentry) | Know when things break before users complain |

### What Waits (v1.1, Weeks 9-12)

| Feature | Why It Waits |
|---------|-------------|
| Recharts dashboard | 50KB + 16h. Stat cards deliver 80% value. |
| FacturoBot | Nav already provides all "quick actions" in 1-2 taps. |
| Push notifications | Android OEMs block them. In-app badge is reliable. |
| Advanced sync (retry, backoff, batch) | Ship simple, add complexity from real Sentry data. |

---

## 2. Architecture

### Tech Stack (Final)

| Layer | Technology | Version | Bundle (gz) | Status |
|-------|-----------|---------|-------------|--------|
| Framework | Next.js (App Router) | 14.2.x | ~85KB | Existing |
| Runtime | React | 18.x | ~45KB | Existing |
| Language | TypeScript | 5.x | 0 | Existing |
| Styling | Tailwind CSS | 3.3 | ~10KB (CSS) | Existing |
| UI Components | shadcn/ui + Radix | Latest | ~10KB (audited) | Existing |
| Forms | react-hook-form + zod | Latest | ~15KB | Existing |
| State (client) | Zustand + persist | 4.5.0 | ~4KB | Existing |
| State (server) | @tanstack/react-query | 5.17.0 | ~12KB | Existing |
| Offline storage | Dexie.js | Latest | ~15KB | **New** |
| Service Worker | serwist | Latest | ~5KB (SW file) | **New** |
| Signatures | react-signature-canvas | Latest | ~5KB (lazy) | **New** |
| i18n | next-intl | 4.8.3 | ~8KB | Existing |
| RQ persistence | @tanstack/query-persist-client-core | Latest | ~2KB | **New** |
| Error tracking | @sentry/nextjs | Latest | ~15KB | **New** |
| Testing (unit) | Vitest | Latest | Dev only | **New** |
| Testing (E2E) | Playwright | 1.58.2 | Dev only | Existing |

### Removed from Original Plan

| Technology | Original Role | Reason for Removal | Savings |
|-----------|--------------|-------------------|---------|
| Framer Motion | Animations | CSS transitions sufficient. 30KB saved. | 30KB + 0h (don't add) |
| Recharts | Dashboard charts | Stat cards for MVP. Charts lazy v1.1. | 50KB initial + 16h |
| Percy | Visual regression | Manual screenshots for 1-dev team. | $399/mo + 8h |
| BrowserStack | Cloud device testing | 2 physical devices more useful for PWA. | $29+/mo + 4h |

### Bundle Budget

**Initial page load target: < 200KB gzipped (stretch) / < 220KB (hard gate)**

```
Next.js + React runtime          ~130 KB   unavoidable
Zustand + persist                  ~4 KB   eager (app state)
React Query + persist             ~14 KB   eager (data fetching)
Dexie.js                          ~15 KB   eager (offline core)
shadcn/ui (8 components audited)  ~10 KB   eager (tree-shaken)
react-hook-form + zod             ~15 KB   eager (form validation)
Route code (current page)         ~10 KB   code-split by App Router
─────────────────────────────────────────
INITIAL TOTAL                    ~198 KB
```

**Lazy-loaded (on demand):**
```
Sentry                            ~15 KB   loaded async after hydration
react-signature-canvas             ~5 KB   wizard Step 3 only
Quote approval UI                  ~5 KB   Quotes tab
─────────────────────────────────────────
FULL LOAD                        ~223 KB
```

**Enforcement:** Lighthouse CI gate on every PR. Hard fail > 220KB initial. `@next/bundle-analyzer` review weekly.

**Key discipline rules:**
- No barrel exports (`index.ts` re-exporting everything). Import directly.
- shadcn: only import used components. No Calendar, DataTable, Menubar, Carousel for MVP.
- next-intl: evaluate if ES-only mobile views can skip i18n bundle (~8KB savings).

### Offline Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     PWA (Browser)                        │
│                                                          │
│  ┌─────────┐   ┌──────────┐   ┌────────────────────┐   │
│  │ Zustand  │   │  React   │   │     Dexie.js       │   │
│  │ Stores   │   │  Query   │   │    (IndexedDB)     │   │
│  │          │   │          │   │                    │   │
│  │ appStore │◄─►│ online:  │◄─►│ invoices           │   │
│  │ syncQ    │   │  fetch   │   │ customers          │   │
│  │ offline  │   │ offline: │   │ catalogItems       │   │
│  │          │   │  Dexie   │   │ syncQueue          │   │
│  └─────────┘   └──────────┘   │ appCache           │   │
│                                └────────────────────┘   │
│       ▲                              ▲                   │
│       │                              │                   │
│  ┌────┴──────────────────────────────┴────────────────┐ │
│  │              Service Worker (serwist)               │ │
│  │  cache-first: static assets, fonts, app shell      │ │
│  │  network-first: ALL API calls                      │ │
│  │  stale-while-revalidate: images                    │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────────┘
                       │ online
                       ▼
┌──────────────────────────────────────────────────────────┐
│              NestJS API (Azure App Service)               │
│                                                          │
│  /api/sync?since={timestamp}  ← incremental sync         │
│  /api/dte                     ← invoice submission        │
│  /api/dte/:id/status          ← polling endpoint          │
│  /api/customers               ← CRUD                     │
│  /api/quotes                  ← approve/reject            │
│                                                          │
│  Prisma → SQL Server (Azure)                             │
└──────────────────────────────────────────────────────────┘
```

### Dexie Schema

```typescript
const db = new Dexie('FacturoDB');

db.version(1).stores({
  invoices:    '++localId, id, tenantId, codigoGeneracion, estado, fhProcesamiento, [tenantId+estado], [tenantId+fhProcesamiento]',
  customers:   '++localId, id, tenantId, nombre, nit, [tenantId+nombre]',
  catalogItems:'++localId, id, tenantId, codigo, nombre, [tenantId+nombre]',
  syncQueue:   '++id, type, status, createdAt',
  appCache:    'key'
});
```

**Key design decisions:**
- `localId` (auto-increment) for offline-created records. `id` (server UUID) populated after sync.
- Compound indexes `[tenantId+estado]` for fast filtered queries on budget devices.
- `syncQueue` status: `pending` → `syncing` → (deleted on success) or `failed`.
- `appCache` key-value store: last sync timestamp, cached user permissions, tenant config.

### Sync Strategy

**First login (initial sync):**
1. User authenticates → JWT + refresh token
2. Detect empty Dexie for this tenant
3. Parallel requests: `GET /api/customers`, `GET /api/catalog`, `GET /api/dte?days=90`
4. Save all to Dexie. Show progress bar: "Preparing offline mode... 60%"
5. Save `lastSyncTimestamp` to `appCache`
6. Estimated: 2-3MB data, 3-8 seconds on 3G

**Incremental sync (each app open):**
1. If online: `GET /api/sync?since={lastSyncTimestamp}`
2. Upsert changed records in Dexie
3. Update `lastSyncTimestamp`
4. Typically < 50KB, < 1 second

**Offline operation sync (on reconnect):**
1. `navigator.onLine` event fires
2. Check JWT expiry → if expired, refresh token → if fails, prompt re-login (preserve data)
3. Process `syncQueue` sequentially (FIFO by createdAt)
4. Each op: POST to API → success: delete from queue, invalidate RQ cache → fail: mark `failed`
5. UI: "Syncing 3 items..." → "All synced" OR "1 item failed to sync [Retry]"

**Conflict resolution:**
- New invoices: always safe (offline gets local UUID, server assigns real ID)
- Customer edits: last-write-wins (timestamp comparison)
- Catalog: server is authoritative (read-only offline)

---

## 3. Sprint Breakdown (8 Weeks)

**Start date:** 2026-04-07 (Monday)
**Working hours:** 8h/day, 10 days/sprint, 80h/sprint raw, 72h effective (8h buffer)

---

### Sprint 1 — PWA Foundation + Offline Infrastructure
**Dates:** 2026-04-07 → 2026-04-18 (Week 1-2)
**Goal:** App installs, works offline (cached shell), Dexie schema ready, sync engine working.

| # | Task | Hours | Risk | Notes |
|---|------|-------|------|-------|
| 1 | PWA manifest upgrade: icons (192/512 PNG from logo), shortcuts, standalone display, theme_color, background_color | 3h | Low | Existing manifest.json needs proper icons |
| 2 | serwist setup: install, `sw.ts` config, register in app, precache app shell (HTML/CSS/JS) | 6h | Med | Replaces deprecated next-pwa |
| 3 | Cache strategies: cache-first (static, fonts), network-first (ALL /api/* calls), stale-while-revalidate (images, Azure Blob) | 6h | Med | Network-first for API is non-negotiable — prevents stale DTE status |
| 4 | Bottom navigation: 4 tabs (Home, Invoices, +New, Quotes), fixed bottom, safe-area-inset, active state, haptic feedback | 5h | Low | Replace current sidebar navigation on mobile breakpoints |
| 5 | Mobile viewport: meta tags, touch-action, prevent-zoom on inputs, safe-area padding | 2h | Low | |
| 6 | `useOnlineStatus` hook + header indicator: green=online, yellow=syncing, red=offline, "Last synced: Xm ago" | 3h | Low | Visible on every page |
| 7 | Dexie.js setup: 5 tables, compound indexes, TypeScript types derived from Prisma | 8h | **HIGH** | Critical path — all offline features depend on this |
| 8 | Dexie migration strategy: document `db.version(N)` pattern, test upgrade from v1→v2 | 4h | **HIGH** | Must be right before shipping |
| 9 | React Query offline: `networkMode: 'offlineFirst'`, `gcTime: Infinity`, persist to IndexedDB | 6h | Med | Use `@tanstack/query-persist-client-core` |
| 10 | Sync queue store (Zustand): `addOp()`, `removeOp()`, `pendingCount`, persist to Dexie | 4h | Low | |
| 11 | Sync engine: on reconnect → check JWT → process queue FIFO → update Dexie → invalidate RQ. On fail: mark `failed`. | 8h | **HIGH** | Simple: one try, then flag. No retry algorithm v1. |
| 12 | `/api/sync` backend endpoint: returns records modified since timestamp for invoices, customers, catalog | 6h | Med | New NestJS endpoint needed |
| 13 | Initial data sync: first login → bulk download → progress bar → save to Dexie | 5h | Med | Depends on #12 |
| 14 | Install prompt: `beforeinstallprompt` → custom "Add to Home Screen" banner → dismiss after install | 3h | Low | |
| 15 | Vitest setup + 8 unit tests: sync queue (enqueue, dequeue, FIFO order), Dexie CRUD, online status hook | 5h | Low | Foundation for test pyramid |
| | **Buffer** | **8h** | | Unexpected SW debugging, Dexie edge cases |
| | **TOTAL** | **82h** | | Tight but achievable — #7 and #11 are critical path |

**Exit criteria:**
- [ ] Install PWA on Android phone
- [ ] Turn on airplane mode → app shell loads, shows "Offline" indicator
- [ ] Sync queue processes after reconnect
- [ ] 8 unit tests passing

**Backend dependency:** Task #12 (`/api/sync` endpoint) must be built in this sprint. Can be started day 1 in parallel with frontend tasks.

---

### Sprint 2 — Invoice Wizard + Offline Submit
**Dates:** 2026-04-21 → 2026-05-02 (Week 3-4)
**Goal:** Create and submit invoices entirely on mobile. Works offline.

| # | Task | Hours | Risk | Notes |
|---|------|-------|------|-------|
| 16 | Wizard shell: 4-step layout, progress bar, step navigation (next/back buttons + swipe), validation gates between steps | 6h | Med | Refactor existing `useFacturaWizardStore` for mobile |
| 17 | Step 1 — Receptor: customer search (Dexie offline / API online), recent customers (top 5), inline quick-add modal | 8h | Med | Search queries Dexie `customers` table with `[tenantId+nombre]` index |
| 18 | Customer quick-add: modal form (nombre, NIT, NRC, email, departamento/municipio/complemento from cached catalog), save to Dexie + queue sync | 5h | Med | `direccion` must be parsed object, not JSON string (CLAUDE.md rule) |
| 19 | Step 2 — Line items: catalog search (Dexie), quantity stepper (touch-friendly ±), unit price display, swipe-to-delete, live subtotal/IVA/total | 10h | Med | Reuse existing calculation logic from `useFacturaWizardStore` |
| 20 | Step 3 — Summary: totals review, payment method selector, observations text, signature pad (lazy `react-signature-canvas`) | 6h | Low | Lazy-load canvas only when step 3 mounts |
| 21 | Step 4 — Submit: **online** → POST `/api/dte` → show polling spinner. **Offline** → save to Dexie `invoices` + add to `syncQueue` → show "Saved offline" toast with pending badge. | 8h | **HIGH** | Core offline-first flow. Must handle: online submit, offline save, sync queue add |
| 22 | Auto-save: debounced (500ms) save of wizard state to Dexie `appCache`. Restore on revisit. Clear on submit. | 4h | Low | Prevents data loss if user switches apps |
| 23 | DTE status polling: after online submit, `refetchInterval: 5000` for 60s. Stop on PROCESADO/RECHAZADO. Show result. | 3h | Low | See DEC-003 pattern |
| 24 | Invoice list (mobile): card layout, status badges (procesado/rechazado/pendiente/offline), pull-to-refresh, tap → detail | 6h | Med | Uses RQ online, Dexie offline |
| 25 | Vitest: 12 tests — wizard math (subtotal, IVA 13%, total, rounding), offline submit mock, customer search, DTE normalization (`parseMhDate`, `receptor.direccion` parsing) | 5h | Low | Test DTE normalization rules from CLAUDE.md |
| 26 | Playwright E2E #1: login → create invoice → submit → see PROCESADO | 3h | Med | First E2E test |
| | **Buffer** | **8h** | | Integration issues between wizard + sync |
| | **TOTAL** | **72h** | | |

**Exit criteria:**
- [ ] Create invoice on phone → submit online → status shows PROCESADO
- [ ] Create invoice offline → "Saved offline" toast → reconnect → invoice syncs → shows PROCESADO
- [ ] Auto-save preserves wizard state across app restart
- [ ] 20 unit tests passing, 1 E2E passing

**DTE normalization checkpoint:** All invoices (tipo 01) must normalize `receptor.direccion` (parse JSON string to object), `resumen.totalLetras`, `resumen.pagos`, and round decimals to 2 places per CLAUDE.md rules.

---

### Sprint 3 — Quotes + Home Screen + Polish
**Dates:** 2026-05-05 → 2026-05-16 (Week 5-6)
**Goal:** Quote approval, home dashboard (stat cards), JWT refresh, RBAC offline, mobile UX polish.

| # | Task | Hours | Risk | Notes |
|---|------|-------|------|-------|
| 27 | Home screen: 4 stat cards — revenue today ($), invoices today (#), pending DTEs (#), overdue invoices (#). Single API call, RQ cached, skeleton loading. | 6h | Low | No charts. Numbers only. |
| 28 | Stat cards offline: cache last values in Dexie `appCache`. Show "as of [timestamp]" when offline. | 2h | Low | |
| 29 | Quote list (mobile): card layout, status badges (draft/sent/approved/rejected), pull-to-refresh | 5h | Low | Similar pattern to invoice list |
| 30 | Quote approve/reject: action buttons on card. Approve → signature capture → POST status change. Reject → reason input → POST. | 6h | Med | Lazy-load signature canvas (already loaded if wizard was used) |
| 31 | Quote offline: approve/reject queue to `syncQueue`. Sync on reconnect. | 3h | Med | Reuses sync engine from Sprint 1 |
| 32 | JWT refresh on reconnect: check `exp` claim → if expired, POST `/api/auth/refresh` with refresh token (encrypted in Dexie) → if fails, show "Please log in again" preserving all offline data | 5h | **HIGH** | Critical for users who go offline for hours |
| 33 | RBAC offline: on login, cache user's 34 permissions in Dexie `appCache`. Apply checks client-side (e.g., FACTURADOR can't approve quotes offline). | 4h | Med | Aligns with existing RBAC system (34 perms, guards) |
| 34 | Mobile UX polish: input focus (no zoom iOS), keyboard avoidance, scroll restoration, loading skeletons for all API calls, empty states with illustrations | 6h | Med | Polish pass across all Sprint 1-2 features |
| 35 | Error boundaries: per route segment. Offline → "Showing cached data." API error → retry button. Unhandled → "Something went wrong" | 4h | Low | |
| 36 | In-app notification center: bell icon in header, unread count badge, dropdown with recent items (DTE processed, quote approved, sync failures) | 4h | Low | Replaces push notifications |
| 37 | Playwright E2E #2-#4: offline invoice→sync, quote approve, home screen loads < 3s | 5h | Med | |
| 38 | Lighthouse CI setup: gate on PR — LCP < 3.0s, FCP < 1.8s, CLS < 0.1. Fail build if exceeded. | 3h | Low | Enforces performance budget |
| 39 | Bundle audit: `@next/bundle-analyzer`. Verify all lazy-loads work. Kill eager imports of heavy deps. | 3h | Med | Critical: catch bundle regressions before Sprint 4 |
| | **Buffer** | **8h** | | |
| | **TOTAL** | **64h** | | Lighter sprint — allows polish + catch-up |

**Exit criteria:**
- [ ] Home screen shows 4 stat cards, loads in < 3s on throttled 3G
- [ ] Quote approve/reject works online + offline
- [ ] JWT refresh works after simulated 2-hour offline period
- [ ] RBAC enforced: FACTURADOR role blocked from admin actions offline
- [ ] Lighthouse CI passing on PR
- [ ] 30 unit tests + 4 E2E passing

---

### Sprint 4 — Testing + Monitoring + Hardening + Launch
**Dates:** 2026-05-19 → 2026-05-30 (Week 7-8)
**Goal:** Production-ready. Error tracking. Device testing. Zero P0 bugs.

| # | Task | Hours | Risk | Notes |
|---|------|-------|------|-------|
| 40 | Vitest expansion: +8 tests — Dexie migrations, sync edge cases (network drop mid-sync, duplicate prevention), DTE normalization (all 10 types), IVA rounding | 6h | Low | |
| 41 | Playwright E2E #5: full offline round-trip — go offline → create invoice + create customer → come online → everything syncs correctly | 4h | Med | The critical E2E test |
| 42 | Playwright mobile viewports: run 5 E2E tests with `--device="Galaxy S5"` + `--device="iPhone 12"` | 2h | Low | Built-in Playwright, free |
| 43 | Physical device test #1: Galaxy A12 or similar budget Android. Install PWA, run all flows, document issues. | 6h | Med | Buy/borrow device ~$80 |
| 44 | Physical device test #2: Xiaomi Redmi or Honor. Same flows. | 4h | Med | Borrow or ~$120 |
| 45 | Bug fix sprint: address all P0/P1 from device testing. Estimate 8-12 bugs. | 16h | **HIGH** | Largest allocation — device testing WILL find bugs |
| 46 | Sentry integration: `@sentry/nextjs` setup, DSN config, track: JS errors, sync failures, SW registration failures, API timeouts | 4h | Low | Free tier: 5K events/mo |
| 47 | PWA analytics: track `appinstalled` event, `display-mode: standalone` detection, offline usage (events to Dexie, batch-sync to API) | 4h | Low | Know if users actually install |
| 48 | SW update strategy: on `updatefound` → show "Update available" toast → user taps → `skipWaiting()` + `window.location.reload()` | 3h | Med | Prevents stale app after deploys |
| 49 | MH outage indicator: when `/api/dte` returns 503 or timeout, show "Hacienda temporalmente no disponible" in header. Don't count as sync failure. | 2h | Low | |
| 50 | NRC display format verification: ensure all mobile views show NRC with hyphen (`367475-0`), API sends raw digits per CLAUDE.md | 1h | Low | |
| 51 | Production deploy: build → smoke test staging → deploy API + Web to Azure App Service | 4h | Low | Existing deploy scripts |
| 52 | Post-deploy verification: install PWA from production URL → create real invoice → verify Hacienda accepts → test offline round-trip | 3h | Low | |
| | **Buffer** | **8h** | | Launch-week surprises |
| | **TOTAL** | **67h** | | |

**Exit criteria (LAUNCH GATES):**
- [ ] 46+ unit tests passing
- [ ] 5 E2E tests passing (including mobile viewports)
- [ ] Tested on 2 physical devices with zero P0 bugs
- [ ] Lighthouse: LCP < 3.0s, FCP < 1.8s, CLS < 0.1
- [ ] Bundle: initial < 220KB gzipped
- [ ] Sentry receiving events (test error + test sync failure)
- [ ] PWA installable from production URL
- [ ] Offline invoice → sync → Hacienda PROCESADO works end-to-end
- [ ] SW update toast works (deploy new version, verify prompt appears)

---

## 4. Risk Management

### Top 12 Risks (Consolidated from All Reviews)

| # | Risk | S×P | Sprint | Mitigation | Status |
|---|------|-----|--------|------------|--------|
| 1 | IndexedDB schema diverges from Prisma | 72 | S1 | Derive Dexie types from Prisma. `db.version()` migrations tested before deploy. | Design in S1 |
| 2 | Offline invoice data inconsistency | 63 | S2 | Local UUID for offline records. `codigoGeneracion` as idempotency key. Server rejects duplicates. | Implement in S2 |
| 3 | Service worker serves stale DTE status | 56 | S1 | Network-first for ALL API calls. Cache-first only for static assets. "Last synced" indicator. | Implement in S1 |
| 4 | Android OEMs kill background processes | 49 | S2 | Foreground sync-on-reconnect is primary. Background Sync is best-effort enhancement. Pending count badge. | Implement in S1-S2 |
| 5 | Bundle exceeds 220KB gate | 42 | S1-S4 | No charts MVP. No Framer. Lazy-load signature. Lighthouse CI gate. Weekly `bundle-analyzer` review. | Monitor always |
| 6 | JWT expires during extended offline | 40 | S3 | Encrypted refresh token in Dexie. Auto-refresh on reconnect. If fails, re-login preserving data. | Implement in S3 |
| 7 | Sync failures are silent (no monitoring) | 40 | S4 | Sentry free tier. Custom events for sync failures. "1 item failed" UI banner. | Implement in S4 |
| 8 | Users stuck on old app version after deploy | 35 | S4 | SW `updatefound` → "Update available" toast → tap to reload. | Implement in S4 |
| 9 | First-time PWA opens with empty data | 35 | S1 | Initial bulk sync with progress bar on first login. ~3-8s on 3G. | Implement in S1 |
| 10 | MH API outage fills sync queue | 30 | S4 | Detect 503/timeout → show "Hacienda unavailable" → don't count as sync failure. | Implement in S4 |
| 11 | Playwright E2E flaky on mobile viewports | 30 | S3-S4 | Limit to 5 flows. Use `--device` flag (built-in). Run in CI, not locally. | Monitor S3-S4 |
| 12 | Developer illness/burnout | 28 | All | 8 days total buffer (2/sprint). Prioritize ruthlessly. Scope cuts defined in advance. | Always active |

---

## 5. Testing Strategy

### Test Pyramid

```
           /\
          /  \   E2E: 5 Playwright flows
         / 5% \  (login, invoice, offline-sync, quotes, home)
        /------\
       /  15%   \   Component: 10 Vitest + Testing Library
      /          \  (wizard steps, stat cards, offline badge, nav)
     /-----------\
    /    80%      \   Unit: 38+ Vitest
   /               \  (sync queue, Dexie CRUD, IVA calc, DTE
  /-----------------\ normalization, permissions, date parsing)
```

### Test Schedule

| Sprint | Unit | Component | E2E | Manual | Cumulative |
|--------|------|-----------|-----|--------|------------|
| S1 | 8 | 0 | 0 | 0 | 8 |
| S2 | 12 | 4 | 1 | 0 | 25 |
| S3 | 8 | 4 | 3 | 0 | 40 |
| S4 | 10 | 2 | 1 | 2 devices | 55 |

### Performance Targets

| Metric | Target | Tool | Gate |
|--------|--------|------|------|
| LCP | < 3.0s (3G throttled) | Lighthouse CI | Hard — blocks PR merge |
| FCP | < 1.8s | Lighthouse CI | Hard |
| CLS | < 0.1 | Lighthouse CI | Hard |
| TTI | < 5.0s (3G) | Lighthouse CI | Soft — warning only |
| Initial JS | < 220KB gz | @next/bundle-analyzer | Hard — blocks deploy |
| Offline sync | < 10s for 50 queued ops | Manual test in S4 | Soft |

### Cost: $0/month + $200 one-time (devices)

---

## 6. API Changes Required

The PWA needs these backend additions:

| Endpoint | Method | Purpose | Sprint |
|----------|--------|---------|--------|
| `GET /api/sync?since={ISO timestamp}` | GET | Returns all records modified since timestamp (invoices, customers, catalog). Paginated. | S1 |
| `GET /api/dte/:codigoGeneracion/status` | GET | Returns DTE status for polling. **May already exist** — verify. | S2 |
| `POST /api/auth/refresh` | POST | Refresh JWT using refresh token. Returns new JWT. | S3 |
| `POST /api/analytics/events` | POST | Batch-receive PWA analytics events (installs, offline usage). | S4 |

**Note:** Most DTE endpoints already exist. The key new endpoint is `/api/sync` which enables incremental offline data sync.

---

## 7. Calendar View

```
April 2026
Mo Tu We Th Fr Sa Su
       1  2  3  4  5
 6  7  8  9 10 11 12   ← Sprint 1 starts Apr 7
13 14 15 16 17 18 19   ← Sprint 1 ends Apr 18
20 21 22 23 24 25 26   ← Sprint 2 starts Apr 21
27 28 29 30            

May 2026
Mo Tu We Th Fr Sa Su
             1  2  3   ← Sprint 2 ends May 2
 4  5  6  7  8  9 10   ← Sprint 3 starts May 5
11 12 13 14 15 16 17   ← Sprint 3 ends May 16
18 19 20 21 22 23 24   ← Sprint 4 starts May 19
25 26 27 28 29 30 31   ← Sprint 4 ends May 30 → LAUNCH
```

**Key dates:**
- **Apr 7:** Sprint 1 kickoff — PWA foundation
- **Apr 18:** Sprint 1 complete — installable PWA with offline shell
- **May 2:** Sprint 2 complete — invoice wizard + offline submit
- **May 16:** Sprint 3 complete — quotes + stats + polish
- **May 30:** Sprint 4 complete — LAUNCH

---

## 8. v1.1 Roadmap (Weeks 9-12, June 2026)

| Feature | Effort | Priority | Notes |
|---------|--------|----------|-------|
| Recharts dashboard (lazy-loaded) | 3 days | P1 | Revenue trend, DTE distribution, top customers charts |
| Dashboard drill-down | 2 days | P1 | Tap chart segment → filtered invoice list |
| FacturoBot quick-actions (5 intents) | 4 days | P2 | Only if user research shows demand |
| Push notifications (Web Push) | 3 days | P2 | Only if install rate > 30% |
| Advanced sync (exponential backoff, batch) | 3 days | P1 | Based on Sentry failure data |
| Percy visual regression | 2 days | P3 | Only if team grows to 2+ devs |
| Performance optimization | 2 days | P1 | Based on real Lighthouse data from production |

---

## 9. Success Metrics

### Week 1 After Launch (June 1-7)

| Metric | Target | How to Measure |
|--------|--------|---------------|
| PWA installs | > 20 | `appinstalled` event in analytics |
| Invoices created (mobile) | > 50 | API logs filtered by user-agent |
| Offline invoices synced | > 5 | Sentry custom events |
| P0 bugs | 0 | Sentry + user reports |
| LCP (production) | < 3.0s | Sentry Web Vitals |

### Month 1 (June)

| Metric | Target | How to Measure |
|--------|--------|---------------|
| PWA installs | > 100 | Analytics |
| Daily active mobile users | > 30 | Analytics |
| Offline sync success rate | > 95% | Sentry |
| App store rating equivalent (user feedback) | > 4.0/5 | In-app feedback form |

---

## 10. Go/No-Go

### GO.

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Architecture | 9/10 | Proven stack, no risky migrations, Dexie well-suited |
| Timeline | 8/10 | 8 weeks with scope cuts + 32h buffer |
| Bundle | 8/10 | ~198KB achievable with discipline + Lighthouse gate |
| Team | 7/10 | 1 dev is tight. Buffers + defined scope cuts mitigate. |
| Market fit | 9/10 | PWA + offline = exactly what El Salvador SMBs need |
| Risk management | 9/10 | 12 risks identified, all have mitigations |
| **OVERALL** | **8/10** | **Ship it. Start Sprint 1 on Monday April 7.** |

---

## Appendix: Decision Reference

All architectural decisions are documented with full rationale in `PHASE4_DECISION_LOG.md`. Key decisions:

- DEC-001: Stay on Next.js 14.2.x
- DEC-002: Dexie.js for offline storage
- DEC-003: React Query polling (not SSE)
- DEC-004: Keep Zustand + React Query
- DEC-005: CSS transitions (drop Framer Motion)
- DEC-006: Stat cards only (no charts MVP)
- DEC-007: FacturoBot cut from MVP
- DEC-008: Push notifications cut from MVP
- DEC-009: No Percy, no BrowserStack
- DEC-010: Simple sync engine (no retry algorithms v1)
- DEC-011: Sentry for production monitoring
- DEC-012: Initial data sync on first login
