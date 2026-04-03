# Sprint 3: Quotes + Home Dashboard + Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quote approval on mobile, home screen stat cards, JWT refresh for offline, RBAC offline, error boundaries, Lighthouse CI.

**Architecture:** Reuse existing quote pages and dashboard — add mobile card views, offline fallbacks, and PWA polish. Error boundaries via Next.js `error.tsx` convention. Lighthouse CI gates performance on PRs.

**Tech Stack:** Next.js 14.2.x, Zustand, React Query, Dexie.js, Lighthouse CI

**Sprint dates:** 2026-05-05 → 2026-05-16

---

## Task 1: Home Screen Stat Cards (Mobile)

**Files:**
- Create: `apps/web/src/components/mobile/stat-cards-mobile.tsx`
- Modify: `apps/web/src/app/(dashboard)/dashboard/page.tsx`

Create a mobile-only stat cards component showing 4 KPIs (revenue today, invoices today, pending DTEs, overdue) as a 2x2 grid. Cache values in Dexie for offline. Integrate into existing dashboard page with `md:hidden`.

The existing dashboard already fetches from `/dashboard/stats` — reuse that data.

- [ ] Read current dashboard page
- [ ] Create stat-cards-mobile.tsx with 4 cards, Dexie offline cache, skeleton loading
- [ ] Add `<StatCardsMobile />` to dashboard page (md:hidden), hide existing charts on mobile
- [ ] Commit: `feat(pwa): add mobile stat cards with offline cache`

---

## Task 2: Quote List Mobile View

**Files:**
- Create: `apps/web/src/components/mobile/quote-list-mobile.tsx`
- Modify: `apps/web/src/app/(dashboard)/cotizaciones/page.tsx`

Create mobile card-based quote list with status badges, actions (approve/reject/send), and offline fallback.

- [ ] Read current quotes list page
- [ ] Create quote-list-mobile.tsx with card layout, status filtering, action buttons
- [ ] Integrate into quotes page (md:hidden for mobile, hide desktop table)
- [ ] Commit: `feat(pwa): add mobile quote list with status actions`

---

## Task 3: Quote Approve/Reject Mobile

**Files:**
- Modify: `apps/web/src/app/(dashboard)/cotizaciones/[id]/page.tsx`

Add mobile-optimized approve/reject actions with signature pad. Queue offline operations.

- [ ] Read current quote detail page
- [ ] Add mobile layout wrapper (simplified card view for small screens)
- [ ] Add offline approve/reject: queue to syncQueue when offline
- [ ] Add signature pad on approve action (lazy-loaded, reuse existing component)
- [ ] Commit: `feat(pwa): add mobile quote approve/reject with offline support`

---

## Task 4: JWT Token Refresh on Reconnect

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/lib/sync-engine.ts`

Add token refresh before sync queue processing. The API uses HTTP-only cookies, so refresh means calling a refresh endpoint.

- [ ] Read current api.ts
- [ ] Add `refreshAuth()` function that calls `POST /auth/refresh` (or whatever endpoint exists)
- [ ] Modify `apiFetch` to detect 401 and attempt one refresh before failing
- [ ] Modify sync-engine.ts to call refresh before processing queue
- [ ] Commit: `feat(pwa): add JWT token refresh on 401 and before sync`

---

## Task 5: RBAC Offline (Cache Permissions in Dexie)

**Files:**
- Modify: `apps/web/src/app/(dashboard)/layout.tsx`
- Modify: `apps/web/src/hooks/use-permissions.ts`

Cache user permissions in Dexie on login. Apply client-side permission checks offline.

- [ ] Read current layout.tsx permission loading and use-permissions.ts
- [ ] After permissions are loaded from API, save to `db.appCache` with key `permissions-{userId}`
- [ ] In use-permissions hook, fall back to Dexie-cached permissions when offline
- [ ] Commit: `feat(pwa): cache RBAC permissions in Dexie for offline enforcement`

---

## Task 6: Error Boundaries (Next.js error.tsx)

**Files:**
- Create: `apps/web/src/app/(dashboard)/error.tsx`
- Create: `apps/web/src/app/error.tsx`

Add Next.js error boundary pages with offline-aware messaging.

- [ ] Create root error.tsx with "Something went wrong" + retry button
- [ ] Create dashboard error.tsx with offline detection: "You're offline, showing cached data" vs "Something went wrong"
- [ ] Commit: `feat(pwa): add error boundaries with offline-aware messaging`

---

## Task 7: In-App Notification Center Enhancement

**Files:**
- Modify: `apps/web/src/components/notifications/notification-bell.tsx`

Enhance existing notification bell to show sync status and offline notifications.

- [ ] Read current notification-bell.tsx
- [ ] Add sync queue pending count badge next to notification count
- [ ] Add "sync failed" notifications when sync engine marks items as failed
- [ ] Commit: `feat(pwa): enhance notification bell with sync status indicators`

---

## Task 8: Mobile UX Polish

**Files:**
- Modify: various components

Polish pass across all mobile views.

- [ ] Add loading skeletons to all mobile components that fetch data
- [ ] Ensure all inputs have `font-size: 16px` on mobile (prevent iOS zoom)
- [ ] Add `touch-action: manipulation` to interactive elements
- [ ] Verify scroll restoration on navigation
- [ ] Add empty states with illustrations to quote list, invoice list
- [ ] Commit: `feat(pwa): mobile UX polish — skeletons, touch targets, empty states`

---

## Task 9: Lighthouse CI Setup

**Files:**
- Create: `apps/web/lighthouserc.js`

Configure Lighthouse CI with performance gates.

- [ ] Create lighthouserc.js with assertions: LCP < 3.0s, FCP < 1.8s, CLS < 0.1
- [ ] Add lighthouse CI script to package.json
- [ ] Commit: `chore: add Lighthouse CI configuration with performance gates`

---

## Task 10: Bundle Audit

**Files:**
- Modify: `apps/web/package.json`

Run bundle analysis and optimize.

- [ ] Install @next/bundle-analyzer as dev dependency
- [ ] Add `analyze` script to package.json
- [ ] Run analysis, document findings
- [ ] Remove any unused imports found
- [ ] Commit: `chore: add bundle analyzer and optimize imports`

---

## Task 11: Sprint 3 Tests

**Files:**
- Create: `apps/web/tests/unit/stat-cards.test.ts`
- Create: `apps/web/tests/unit/quote-offline.test.ts`

- [ ] Write tests for stat card Dexie caching
- [ ] Write tests for offline quote approve/reject
- [ ] Write tests for permission caching
- [ ] Run all tests
- [ ] Commit: `test(pwa): add Sprint 3 unit tests for stats, quotes, permissions`

---

## Task 12: Playwright E2E #2-#4

**Files:**
- Modify: `apps/web/tests/e2e/pwa-invoice.spec.ts`

- [ ] Add E2E test: dashboard loads stat cards
- [ ] Add E2E test: quote list loads on mobile viewport
- [ ] Add E2E test: offline indicator shows correct state
- [ ] Commit: `test(pwa): add Playwright E2E tests for dashboard and quotes`

---

## Task 13: Final Verification + Build

- [ ] Run all unit tests (target: 30+)
- [ ] Build web app
- [ ] Build API
- [ ] Review git log
- [ ] Commit any remaining files

---

## Sprint 3 Exit Criteria

- [ ] Home screen shows 4 stat cards on mobile, cached offline
- [ ] Quote list shows as cards on mobile with status badges
- [ ] Quote approve/reject works on mobile with signature
- [ ] Offline quote operations queue to syncQueue
- [ ] JWT refresh works on 401 and before sync
- [ ] Permissions cached in Dexie for offline RBAC
- [ ] Error boundaries show offline-aware messages
- [ ] Notification bell shows sync status
- [ ] Lighthouse CI config in place
- [ ] Bundle analyzer available
- [ ] 30+ unit tests passing
- [ ] 5+ E2E test skeletons
- [ ] Both apps build successfully
