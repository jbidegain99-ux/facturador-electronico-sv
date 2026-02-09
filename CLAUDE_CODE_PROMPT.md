# 🚨 BUG FIX: Infinite Retry Loop Crashing Entire Web App

## Problem Description

The web app at `https://facturador-web-sv-chayeth5a0h2abcf.eastus2-01.azurewebsites.net` is completely broken. Every page shows "Application error: a client-side exception has occurred".

### Root Cause
The frontend page `/facturas/recurrentes` (and possibly the dashboard layout) makes API calls to `/api/v1/recurring-invoices?page=1&limit=20&...` which returns **404 (Not Found)** because the API (v16) doesn't have that endpoint deployed yet.

**The critical bug**: When the fetch fails (404), the frontend enters an **infinite retry loop**, making thousands of requests (3,129+ observed) which crashes the entire browser tab and makes ALL pages unusable — including `/clientes` which has nothing to do with recurring invoices.

### Evidence from Browser DevTools
- Network tab: 3,129 requests, all to `recurring-invoices?page=1&limit=20&...`, all returning 404
- Console: Hundreds of "404 (Not Found)" errors from `recurring-invoices` endpoint  
- The infinite loop happens even on `/clientes` page — the recurring-invoices fetch seems to run globally or from the layout
- "Application error: a client-side exception has occurred" displayed on screen

## Task

Fix the infinite retry loop in the frontend. There are likely TWO issues to fix:

### Issue A: Infinite Retry on Failed Fetch
Find the data fetching logic for recurring invoices (likely a `useEffect`, React Query hook, SWR, or custom hook) and ensure:
1. On 404 error → **stop retrying immediately**, show empty state or error message
2. On any error → **maximum 1-2 retries with backoff**, then stop and show error state
3. Never create an infinite loop of fetch requests

### Issue B: Recurring Invoices Fetch Running on Wrong Pages
The recurring-invoices fetch is firing on `/clientes` and potentially other unrelated pages. Find why:
- Is it in the dashboard `layout.tsx`? 
- Is it in a global context/provider?
- Is it in a sidebar component that pre-fetches data?

Make sure recurring-invoices data is ONLY fetched on the `/facturas/recurrentes` page, not globally.

## Files to Investigate (in order of priority)

1. `apps/web/src/app/(dashboard)/facturas/recurrentes/page.tsx` - The recurring invoices page
2. `apps/web/src/app/(dashboard)/layout.tsx` - Dashboard layout (recently modified for auth fixes)
3. Any files matching: `**/hooks/*recurr*`, `**/hooks/*fetch*`, `**/providers/*`, `**/context/*`
4. Any API client/fetch wrapper that might have retry logic: `**/lib/api*`, `**/utils/fetch*`, `**/services/*`
5. Sidebar/navigation components that might pre-fetch data

## Required Fix Approach

1. **Find the fetch call** that hits `/recurring-invoices` — trace it from the network request back to the code
2. **Add proper error handling**: 404 should be treated as "endpoint not available", show graceful empty/error state
3. **Remove or limit retries**: No infinite retries. Max 1-2 retries with exponential backoff for transient errors (500, timeout). Zero retries for 404.
4. **Scope the fetch**: Ensure recurring-invoices data is only fetched on its own page
5. **Verify no other pages have similar infinite loop patterns** — check clientes, facturas, dashboard pages

## Success Criteria

- ✅ `/clientes` page loads correctly showing 354 clients (API endpoint works: `GET /api/v1/clientes` returns 200)
- ✅ `/facturas/recurrentes` page shows a graceful error or empty state (since API endpoint doesn't exist yet), NOT an infinite loop
- ✅ No more than 2-3 requests to any endpoint that returns 404
- ✅ No "Application error" on any page
- ✅ Browser DevTools Network tab shows reasonable number of requests (<20 on any page load)
- ✅ Dashboard, Facturas, Clientes, Reportes pages all load without errors

## Anti-Patterns to Avoid

- ❌ Do NOT just suppress the error silently — show the user a proper error/empty state
- ❌ Do NOT add a global retry interceptor — fix the specific fetch logic
- ❌ Do NOT remove the recurring invoices page — just make it handle the missing API gracefully

## Context

- Tech stack: Next.js 14 App Router, shadcn/ui, Tailwind CSS
- API base URL is set via `NEXT_PUBLIC_API_URL` environment variable
- Auth was recently fixed to use `/auth/profile` instead of `/auth/me` (in layout.tsx)
- API v16 is deployed and working for: `/auth/profile`, `/clientes`, `/facturas` — just not `/recurring-invoices`

## Definition of Done

1. ✅ Root cause of infinite loop identified and documented
2. ✅ Fix implemented with proper error handling
3. ✅ All dashboard pages load without errors (test manually)
4. ✅ Recurring invoices page shows graceful error state
5. ✅ Code committed to current branch
6. ✅ Summary of all changes provided
