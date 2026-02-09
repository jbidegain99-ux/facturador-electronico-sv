# Fix 3 UI Issues on /clientes Page

## Current State
The /clientes page loads correctly and shows client data. Three issues remain:

## Issue 1: Pagination Not Working
The client list shows all records without pagination controls (no page numbers, no next/prev buttons visible at the bottom). The API supports pagination via `?page=1&limit=20&sortBy=createdAt`. The page should show pagination controls and only load the specified number of records per page.

**Investigate**: Check if pagination UI components are rendered and if the page/limit state variables correctly update when the user changes pages. Check the Network tab — the request goes to `clientes?page=1&limit=20&sortBy=cr...` so the API call has pagination params, but the UI might not be rendering the pagination controls or the total/totalPages might be wrong after our defensive fix.

## Issue 2: "Mostrar X" Filter Not Working  
There's a "Mostrar 10" dropdown selector that should control how many clients are shown per page (10, 20, 50, etc). Changing the value doesn't seem to affect the display.

**Investigate**: Check if the onChange handler for the "Mostrar" select actually updates the limit state and triggers a re-fetch. It might be that `setLimit()` is called but doesn't trigger the useEffect/useCallback that fetches data.

## Issue 3: Tenant Name Not Displaying
In the top header/navbar area, there are two gray placeholder bars where the tenant/company name should appear. The tenant data loads successfully (console shows `[Tenant] Response status: 200`), but the name isn't rendering.

**Investigate**: 
- Check `apps/web/src/app/(dashboard)/layout.tsx` — the tenant data is fetched but might not be passed to the header component correctly
- Check the header/navbar component — it might expect `tenant.nombre` or `tenant.name` but the API returns a different field name
- Look at what the `/tenants/current` endpoint returns and match the field names

## Files to Check
1. `apps/web/src/app/(dashboard)/clientes/page.tsx` — pagination logic, limit filter, data fetching
2. `apps/web/src/app/(dashboard)/layout.tsx` — tenant data passing to header
3. `apps/web/src/components/layout/header.tsx` or similar — tenant name display
4. Any pagination component in `apps/web/src/components/`

## Debugging Steps
1. For pagination: Add `console.log('Pagination state:', { page, limit, total, totalPages, clientesLength: clientes.length })` after the fetch to see what values are set
2. For tenant: Add `console.log('Tenant data:', tenantData)` in layout.tsx to see the full response shape
3. Run `curl https://facturador-api-sv-gvavh8heb5c5gkc9.eastus2-01.azurewebsites.net/api/v1/tenants/current` to see the API response shape

## Success Criteria
- ✅ Pagination controls visible at bottom of client list
- ✅ Clicking next/prev page loads different clients  
- ✅ "Mostrar X" dropdown changes the number of visible clients per page
- ✅ Tenant/company name displays in the header where the gray bars are
- ✅ No console errors
- ✅ Build passes

## Definition of Done
1. All 3 issues fixed
2. Build succeeds
3. Code committed
4. Summary of changes provided
