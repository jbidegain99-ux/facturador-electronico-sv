# Fix Empty Accounting Dashboard — Quick Implementation

## Problem
The /contabilidad page shows only a header but no content. It should display:
1. A "Seed Chart of Accounts" button when no accounts exist
2. Summary cards showing totals (Assets, Liabilities, Equity) 
3. Quick navigation to accounting sub-modules

## Requirements

### 1. Check if Chart of Accounts Exists
Add API call to check if tenant has accounting accounts seeded:
```typescript
const { data: accounts } = await fetch('/api/v1/accounting/accounts?limit=1')
const hasAccounts = accounts && accounts.length > 0
```

### 2. Show Seed Button When Empty
If no accounts exist, show prominent seed button:
```typescript
if (!hasAccounts) {
  return (
    <div className="text-center py-12">
      <Calculator className="h-16 w-16 text-purple-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">Inicializar Plan de Cuentas</h3>
      <p className="text-gray-600 mb-6">
        Crea el plan de cuentas estándar de El Salvador para comenzar.
      </p>
      <Button 
        onClick={handleSeedAccounts}
        size="lg"
        className="bg-purple-600 hover:bg-purple-700"
      >
        <Zap className="h-5 w-5 mr-2" />
        Crear Plan de Cuentas (85+ cuentas)
      </Button>
    </div>
  )
}
```

### 3. Dashboard Content When Seeded
When accounts exist, show:
- Summary cards with totals
- Recent transactions
- Quick navigation buttons

### 4. Seed Functionality
Implement handleSeedAccounts function that:
- Calls POST /api/v1/accounting/accounts/seed
- Shows loading state
- Refreshes page on success
- Handles errors gracefully

## Files to Modify
- `apps/web/src/app/(dashboard)/contabilidad/page.tsx` - Main dashboard logic
- `apps/api/src/modules/accounting/accounting.controller.ts` - Ensure seed endpoint exists

## Success Criteria
- Empty state shows seed button clearly
- Seed button works and creates ~85 accounts
- Dashboard shows summary after seeding
- No more empty/broken accounting page

## Priority
HIGH - This breaks the user experience for the completed accounting module.
