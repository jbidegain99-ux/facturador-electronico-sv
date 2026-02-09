# 🐛 Bug: Auth Profile Failing on Page Load

## Problem
The dashboard layout is calling `/auth/profile` but getting errors because:
1. The user might not be authenticated yet
2. The response might be empty/malformed
3. The error handling is not graceful

## Error in Browser Console
```
Error loading tenants: SyntaxError: Unexpected end of JSON
TypeError: Cannot read properties of undefined (reading 'length')
```

## Current Code Location
`apps/web/src/app/(dashboard)/layout.tsx` line ~68

## Required Fix
Make the `/auth/profile` call optional and handle errors gracefully:

1. Wrap the fetch in try-catch
2. If it fails, don't block page render
3. Set user to null/undefined if not authenticated
4. Allow the page to render even without user data
5. Show a loading state while fetching

## Success Criteria
- ✅ Page loads without errors
- ✅ Clientes page displays (even if user data fails)
- ✅ No console errors
- ✅ Graceful handling of unauthenticated state

## Test
After fix, the page should load successfully at:
https://facturador-web-sv-chayeth5a0h2abcf.eastus2-01.azurewebsites.net/clientes
