# 🚨 BUG FIX: Application crash from unhandled 404 responses on missing API endpoints

## Problem Description

Web v22 is deployed. The previous infinite retry loop for recurring-invoices is FIXED (only 7 requests now). However, the app still crashes with "Application error: a client-side exception has occurred" on `/clientes`.

### Root Cause from Browser Console
The console shows this sequence:
```
[Tenant] Fetching tenant data...
[Auth] Fetching user profile...
[Tenant] Response status: 200
[Auth] Response status: 200
[Auth] User loaded: facturadorsv@republicode.com
Failed to load resource: the server responded with a status of 404 (Not Found)
  → /api/v1/plans/my-usage
TypeError: Cannot read properties of undefined (reading 'length')
```

The auth and tenant loading gates work correctly now. But **after** auth completes, some component (likely in the layout or sidebar) fetches `/api/v1/plans/my-usage` which returns 404 (endpoint doesn't exist in API v16). The response is `undefined`, and the code tries to read `.length` on it, causing a crash that kills the entire page.

## Task

### 1. Fix the immediate crash: `/plans/my-usage` 404 handling
- Find where `/plans/my-usage` or similar plans endpoint is called
- Add proper null/undefined checks so a 404 doesn't crash the app
- Show graceful fallback (e.g., hide the usage display, or show "Plan info unavailable")

### 2. Audit ALL fetch calls in layout/shared components for the same pattern
Search the entire `apps/web/src` directory for ALL fetch/API calls and ensure NONE of them can crash the app when the API returns 404. Focus especially on:
- Dashboard layout (`apps/web/src/app/(dashboard)/layout.tsx`)
- Sidebar components
- Any providers or context files
- Any hooks used across multiple pages

For EVERY fetch call found in shared/layout components:
- Wrap in try/catch
- Handle 404 specifically → return null/empty/default, don't throw
- Handle all errors gracefully → never let an unhandled error crash the page
- Add null checks before accessing properties on API responses (`.length`, `.data`, `.map`, etc.)

### 3. Specific pattern to apply everywhere:

```typescript
// BAD - crashes on 404
const response = await fetch(`${API_URL}/some-endpoint`);
const data = await response.json();
console.log(data.items.length); // TypeError if data is undefined

// GOOD - handles 404 gracefully
try {
  const response = await fetch(`${API_URL}/some-endpoint`);
  if (!response.ok) {
    console.warn(`[Component] /some-endpoint returned ${response.status}`);
    return; // or set default state
  }
  const data = await response.json();
  if (data?.items) {
    console.log(data.items.length);
  }
} catch (error) {
  console.error('[Component] Failed to fetch:', error);
  // Set error state, don't crash
}
```

## Files to Investigate (priority order)

1. `apps/web/src/app/(dashboard)/layout.tsx` - Already has auth/tenant fetches, might have plans fetch too
2. Any files matching: `**/plans*`, `**/usage*`, `**/subscription*`
3. Sidebar/navigation components that might show plan usage
4. `apps/web/src/app/(dashboard)/configuracion/**` - Config pages likely fetch plan data  
5. ALL files in `apps/web/src/app/(dashboard)/` - check every page and shared component

## Search Commands to Run First

```bash
# Find ALL API fetch calls in the web app
grep -rn "fetch\|axios\|api.*get\|api.*post" apps/web/src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".next"

# Find plans/usage related code
grep -rn "plans\|my-usage\|usage\|subscription" apps/web/src/ --include="*.tsx" --include="*.ts"

# Find all places that could crash on undefined
grep -rn "\.length\|\.map\|\.filter\|\.forEach\|\.data\." apps/web/src/app/ --include="*.tsx" --include="*.ts" | grep -v node_modules
```

## Success Criteria

- ✅ `/clientes` page loads and shows 354 clients
- ✅ `/facturas/recurrentes` shows graceful error (already fixed in v22)
- ✅ `/facturas` page loads without errors
- ✅ Dashboard page loads without errors
- ✅ No `TypeError: Cannot read properties of undefined` in console
- ✅ 404 responses from any API endpoint are handled gracefully (logged, not crashed)
- ✅ Network tab shows reasonable number of requests (<20)

## Anti-Patterns to Avoid
- ❌ Don't just add `?.` optional chaining everywhere blindly — understand what's being fetched and provide proper defaults
- ❌ Don't suppress errors silently — at minimum log them with console.warn
- ❌ Don't create mock data/endpoints on the API side — fix the frontend to handle missing endpoints

## Definition of Done
1. ✅ All fetch calls in shared components (layout, sidebar, providers) have proper error handling
2. ✅ All pages load without crashes even if API endpoints return 404
3. ✅ Build succeeds with zero errors
4. ✅ Code committed
5. ✅ List of all files changed and what was fixed in each
