# Execution Evidence - Responsive + Data + UI Fixes

**Date:** 2026-04-06
**Build status:** PASS (zero errors)

---

## 1. PWA Install Banner Removal

### Files Deleted
- `apps/web/src/components/pwa/install-banner.tsx` -- DELETED
- `apps/web/src/hooks/use-install-prompt.ts` -- DELETED

### Files Modified
- `apps/web/src/app/(dashboard)/layout.tsx`
  - Removed `import { InstallBanner } from '@/components/pwa/install-banner'`
  - Removed `<InstallBanner />` from render (was at line 195)

### Verification
```
grep -r "InstallBanner|install-banner|useInstallPrompt" apps/web/src/
# No matches found -- fully removed
```

### Result
- No "Instalar Facturo" banner will ever appear
- The z-50 fixed-bottom overlay that was causing UI overlap is gone

---

## 2. Data Loading Fix (Facturas)

### File Modified
- `apps/web/src/app/(dashboard)/facturas/page.tsx`

### Change: Raw fetch replaced with apiFetch

BEFORE (broken auth handling):
```tsx
const res = await fetch(`${API_URL}/dte?${params}`, { credentials: 'include',
  headers: { 'Content-Type': 'application/json' } });
if (!res.ok) { ... }
const data = await res.json();
```

AFTER (consistent auth with retry):
```tsx
import { API_URL, apiFetch } from '@/lib/api';
const data = await apiFetch<{ data: DTE[]; total: number; totalPages: number }>(`/dte?${params}`);
```

### Why this matters
- apiFetch handles 401 with automatic token refresh
- apiFetch detects MH 503 outages
- apiFetch sends auth cookies + localStorage token fallback
- Raw fetch bypassed all of this

---

## 3. Landing Page Responsiveness

### File: apps/web/src/app/page.tsx

| Element | Before | After |
|---------|--------|-------|
| Hero heading | text-5xl md:text-7xl | text-3xl sm:text-5xl md:text-7xl |
| Hero description | text-xl | text-base sm:text-lg md:text-xl |
| CTA buttons | px-8 py-4 | w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 |
| Stats grid | grid-cols-3 gap-8 | grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-8 |
| Features grid | gap-8 | gap-4 sm:gap-8 |
| Pricing grid | gap-8 | gap-4 sm:gap-8 |
| Section padding | py-24 px-6 | py-12 sm:py-24 px-4 sm:px-6 |
| Card padding | p-8 | p-5 sm:p-8 |
| MH badge text | text-sm | text-xs sm:text-sm |
| Stats numbers | text-3xl | text-2xl sm:text-3xl |

---

## 4. UI Overlap Fix

### Root cause
InstallBanner component was fixed bottom-20 z-50, overlapping BottomNav (fixed bottom-0 z-40).

### Fix
Deleted the component entirely. No other fixed-bottom elements conflict.

---

## 5. Build Verification

```
$ npx next build
Build successful, 0 errors, all pages compiled
```

---

## Summary

| File | Change |
|------|--------|
| components/pwa/install-banner.tsx | DELETED |
| hooks/use-install-prompt.ts | DELETED |
| app/(dashboard)/layout.tsx | Removed InstallBanner |
| app/(dashboard)/facturas/page.tsx | Raw fetch -> apiFetch |
| app/page.tsx | Full landing responsive overhaul |
