# 🐛 Auth Still Failing - Need Better State Management

## Problem
Even with error handling, page still crashes with:
```
TypeError: Cannot read properties of undefined (reading 'length')
```

## Root Cause
The component is rendering with undefined user/tenant data before fetches complete or when they fail.

## Required Fix in `apps/web/src/app/(dashboard)/layout.tsx`

1. **Add loading state**: Don't render children until fetches complete
2. **Initialize user as null**: `const [user, setUser] = useState<User | null>(null)`
3. **Show loading spinner** while `user === undefined` (still fetching)
4. **Render children only when**: `user !== undefined` (either logged in or confirmed not logged in)
5. **Add console.log** for debugging:
   - Log when fetch starts
   - Log response status
   - Log parsed data
   - Log errors

## Example Pattern
```typescript
const [user, setUser] = useState<User | null | undefined>(undefined) // undefined = loading

useEffect(() => {
  async function loadUser() {
    try {
      console.log('[Auth] Fetching user...')
      const response = await fetch(...)
      console.log('[Auth] Response:', response.status)
      
      if (!response.ok) {
        console.log('[Auth] Not authenticated')
        setUser(null)
        return
      }
      
      const data = await response.json()
      console.log('[Auth] User loaded:', data)
      setUser(data)
    } catch (error) {
      console.error('[Auth] Error:', error)
      setUser(null)
    }
  }
  loadUser()
}, [])

if (user === undefined) {
  return <div>Loading...</div>
}

return <>{children}</>
```

## Success Criteria
- ✅ No TypeErrors
- ✅ Console shows clear auth flow
- ✅ Page shows "Loading..." then renders
- ✅ Works even when not authenticated
