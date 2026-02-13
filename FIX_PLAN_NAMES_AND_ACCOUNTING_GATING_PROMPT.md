# Fix Plan Names & Add Accounting Module Plan Gating — Implementation Prompt
## Date: 2026-02-10
## For: Claude Code (Opus 4.6)

---

## 🎯 **OBJECTIVE**

Fix two critical issues with plan management and feature gating:

1. **Plan Names Inconsistency**: System currently uses "EMPRESARIAL" but code expects "PRO" and "ENTERPRISE"
2. **Accounting Module Plan Gating**: Add upgrade message like recurring invoices for non-PRO users

---

## 🚨 **CRITICAL: FOLLOW REPUBLICODE METHODOLOGY**

### **1. Plan Mode Default**
- Analyze current plan structure in both super admin and tenant systems
- Understand how plan names are stored vs how they're checked
- Plan migration strategy for existing tenants

### **2. Analysis Before Coding**
- Read current `apps/api/src/common/plan-features.ts` 
- Check how plans are stored in database (Tenant table)
- Understand how recurring invoices gating works (copy the pattern)
- Review accounting module access control

### **3. Verification Before Done**
- Show plan names consistency across super admin and tenant system
- Demonstrate accounting upgrade message for non-PRO users  
- Verify PRO users can access accounting normally

---

## 📊 **CURRENT STATE ANALYSIS**

### **Problem #1: Plan Names Mismatch**
- **Code expects**: "PRO", "ENTERPRISE" (in plan-features.ts)
- **Super admin shows**: "EMPRESARIAL" and other names
- **Database stores**: Unknown current values
- **Result**: Plan gating not working correctly

### **Problem #2: Missing Accounting Gating Message**
- **Accounting module**: Currently accessible to all users
- **Should be**: Gated behind PRO/ENTERPRISE with upgrade message
- **Pattern exists**: Recurring invoices has this working correctly

---

## 🛠️ **TECHNICAL REQUIREMENTS**

### **Task 1: Standardize Plan Names**

#### **1.1 Identify Current Plan Storage**
```sql
-- Check what plan values exist in database
SELECT DISTINCT plan, COUNT(*) as tenant_count 
FROM Tenant 
GROUP BY plan;
```

#### **1.2 Update Plan Features Map**
Ensure `apps/api/src/common/plan-features.ts` uses consistent names:

```typescript
export const PLAN_FEATURES = {
  FREE: {           // or "DEMO" if that's what's used
    recurringInvoices: false,
    accounting: false,
    maxInvoices: 50,
  },
  TRIAL: {          // if this exists
    recurringInvoices: false, 
    accounting: false,
    maxInvoices: 100,
  },
  BASIC: {          // if this exists
    recurringInvoices: false,
    accounting: false, 
    maxInvoices: 200,
  },
  PRO: {            // Make sure this matches database
    recurringInvoices: true,
    accounting: true,
    maxInvoices: 500,
  },
  ENTERPRISE: {     // Make sure this matches database
    recurringInvoices: true,
    accounting: true,
    maxInvoices: -1,  // unlimited
  }
  // Add any other plans that exist in super admin
};
```

#### **1.3 Update Super Admin Plan Management**
Find and fix super admin interface to use consistent plan names:
- Update plan creation/editing forms
- Update plan display names  
- Ensure database stores exactly "PRO", "ENTERPRISE", etc.

#### **1.4 Migrate Existing Tenants (if needed)**
If database has "EMPRESARIAL" but code expects "ENTERPRISE":

```sql
-- Migration script to run in Azure Portal
UPDATE Tenant 
SET plan = 'ENTERPRISE' 
WHERE plan = 'EMPRESARIAL';

UPDATE Tenant 
SET plan = 'PRO' 
WHERE plan = 'PROFESIONAL';

-- Add any other mappings needed
```

### **Task 2: Add Accounting Module Plan Gating**

#### **2.1 Backend Plan Check**
Add plan validation to accounting endpoints (copy pattern from recurring-invoices):

```typescript
// apps/api/src/modules/accounting/accounting.controller.ts

// Add to all accounting endpoints
private async ensureAccountingAccess(tenantId: string) {
  const features = await this.plansService.getTenantFeatures(tenantId);
  
  if (!features.accounting) {
    throw new ForbiddenException(
      'El módulo de contabilidad requiere el plan Pro o Enterprise. Actualiza tu plan para acceder a estas funcionalidades.'
    );
  }
}

@Get('accounts')
async getAccounts(@Req() req) {
  await this.ensureAccountingAccess(req.tenant.id);
  return this.accountingService.getAccounts(req.tenant.id);
}

// Apply to all accounting endpoints:
// - GET /accounting/accounts
// - POST /accounting/accounts  
// - GET /accounting/journal-entries
// - POST /accounting/journal-entries
// - GET /accounting/reports/balance-sheet
// etc.
```

#### **2.2 Frontend Upgrade Message**
Copy the pattern from recurring invoices page and apply to accounting:

```typescript
// apps/web/src/app/(dashboard)/contabilidad/page.tsx

import { usePlanFeatures } from '@/hooks/use-plan-features';

export default function ContabilidadPage() {
  const { features, loading } = usePlanFeatures();

  if (loading) return <div>Cargando...</div>;

  // Show upgrade message if accounting not available
  if (!features?.accounting) {
    return (
      <div className="p-6">
        <DashboardHeader title="Contabilidad" />
        
        {/* Upgrade Banner */}
        <div className="mt-6">
          <UpsellBanner
            title="Módulo de Contabilidad — Plan Pro"
            description="Lleva el control completo de tu contabilidad con nuestro sistema integrado de partida doble."
            features={[
              "Plan de cuentas estándar El Salvador",
              "Partidas contables automáticas al facturar", 
              "Balance general y estado de resultados",
              "Libro diario y libro mayor",
              "Reportes financieros exportables"
            ]}
            ctaText="Actualizar a Plan Pro"
            ctaAction={() => {
              // TODO: Navigate to pricing page or open upgrade modal
              console.log('Navigate to upgrade page');
            }}
          />
        </div>
      </div>
    );
  }

  // Normal accounting dashboard for PRO/ENTERPRISE users
  return (
    <div className="p-6">
      <DashboardHeader title="Contabilidad" />
      {/* ... existing accounting dashboard content ... */}
    </div>
  );
}
```

#### **2.3 Sidebar Badge**
Add PRO badge in sidebar for non-PRO users (copy from recurring invoices):

```typescript
// apps/web/src/components/layout/sidebar.tsx

// Find the accounting menu item and add conditional badge
{
  title: "Contabilidad",
  icon: Calculator,
  href: "/contabilidad",
  badge: !features?.accounting ? "PRO" : undefined,
}
```

#### **2.4 Create Reusable UpsellBanner Component**
If it doesn't exist already, create the UpsellBanner component used by both modules:

```typescript
// apps/web/src/components/ui/upsell-banner.tsx

interface UpsellBannerProps {
  title: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaAction: () => void;
}

export function UpsellBanner({ title, description, features, ctaText, ctaAction }: UpsellBannerProps) {
  return (
    <div className="border border-purple-200 rounded-lg p-6 bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <Star className="h-8 w-8 text-purple-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {description}
          </p>
          
          <ul className="space-y-2 mb-6">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                {feature}
              </li>
            ))}
          </ul>
          
          <Button 
            onClick={ctaAction}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            {ctaText}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ **ACCEPTANCE CRITERIA**

### **Plan Names Consistency**
1. ✅ Database stores exactly: "FREE", "TRIAL", "BASIC", "PRO", "ENTERPRISE"
2. ✅ Super admin interface uses same plan names
3. ✅ `plan-features.ts` has entries for all existing plans
4. ✅ Existing tenants migrated to new plan names (if needed)

### **Accounting Plan Gating**
1. ✅ **FREE/TRIAL/BASIC users**: See upgrade banner on `/contabilidad`
2. ✅ **PRO/ENTERPRISE users**: See normal accounting dashboard
3. ✅ **Sidebar**: Shows "PRO" badge for non-PRO users
4. ✅ **Backend**: All accounting endpoints return 403 for non-PRO plans
5. ✅ **UpsellBanner**: Reusable component for both modules

### **Functional Requirements**
1. ✅ Plan checking works consistently across all modules
2. ✅ No breaking changes to existing functionality
3. ✅ Clear upgrade messaging for users
4. ✅ Proper error handling and user feedback

---

## 🧪 **TESTING STRATEGY**

### **Plan Names Testing**
1. **Check current database values**: Run SQL to see existing plan names
2. **Test super admin**: Create/edit tenants with new plan names
3. **Verify features**: Each plan gets correct feature set
4. **Migration testing**: If migration needed, test on staging data

### **Accounting Gating Testing**
1. **FREE user testing**:
   - Navigate to `/contabilidad` → Should see upgrade banner
   - Sidebar → Should show "Contabilidad [PRO]"
   - API calls → Should return 403

2. **PRO user testing**:
   - Navigate to `/contabilidad` → Should see normal dashboard
   - Sidebar → Should show "Contabilidad" (no badge)
   - API calls → Should work normally

3. **Cross-module consistency**:
   - Both recurring invoices and accounting show same upgrade pattern
   - Plan features API returns consistent data

---

## 📈 **DEPLOYMENT PLAN**

### **Phase 1: Database Analysis & Migration**
1. **Check current plan values**:
   ```sql
   SELECT DISTINCT plan, COUNT(*) FROM Tenant GROUP BY plan;
   ```

2. **Run migration if needed** (Azure Portal):
   ```sql
   -- Update plan names to match code expectations
   UPDATE Tenant SET plan = 'ENTERPRISE' WHERE plan = 'EMPRESARIAL';
   -- Add other mappings as discovered
   ```

### **Phase 2: Backend Updates**
1. **Update plan-features.ts** with all existing plan types
2. **Add accounting gating** to all accounting endpoints
3. **Update super admin** plan management (if needed)

### **Phase 3: Frontend Updates**
1. **Add UpsellBanner component** (if not exists)
2. **Update accounting pages** with plan gating
3. **Update sidebar** with PRO badges

### **Phase 4: Deployment**
```bash
# API v25 (plan consistency + accounting gating)
docker build --no-cache -t facturadorsvacr.azurecr.io/facturador-api:v25 -f apps/api/Dockerfile .
docker push facturadorsvacr.azurecr.io/facturador-api:v25
az webapp config container set --name facturador-api-sv --resource-group facturador-sv-rg --container-image-name facturadorsvacr.azurecr.io/facturador-api:v25
az webapp restart --name facturador-api-sv --resource-group facturador-sv-rg

# Web v36 (accounting upgrade messages)
docker build --no-cache -t facturadorsvacr.azurecr.io/facturador-web:v36 -f apps/web/Dockerfile .
docker push facturadorsvacr.azurecr.io/facturador-web:v36
az webapp config container set --name facturador-web-sv --resource-group facturador-sv-rg --container-image-name facturadorsvacr.azurecr.io/facturador-web:v36
az webapp restart --name facturador-web-sv --resource-group facturador-sv-rg
```

---

## 🚨 **CRITICAL LESSONS TO FOLLOW**

### **Plan Name Consistency**
```typescript
// GOOD - Consistent naming across all systems
const PLAN_NAMES = {
  FREE: 'FREE',
  PRO: 'PRO', 
  ENTERPRISE: 'ENTERPRISE'
};

// BAD - Mixed naming
// Database: "EMPRESARIAL", Code: "ENTERPRISE"
```

### **Feature Gating Pattern**
```typescript
// GOOD - Reusable pattern across modules
if (!features.accounting) {
  throw new ForbiddenException('Requires Pro plan');
}

// BAD - Hardcoded plan checks
// if (tenant.plan !== 'PRO') { ... }
```

### **User Experience Consistency**
```typescript
// GOOD - Same upgrade experience across modules
<UpsellBanner title="Feature Name — Plan Pro" />

// BAD - Different messages/styling per module
```

---

## 🎯 **SUCCESS METRICS**

### **Immediate Success** (Deploy Day)
- ✅ All plan names consistent across super admin and tenant system
- ✅ Accounting upgrade message appears for non-PRO users
- ✅ PRO users can access accounting normally
- ✅ No errors in console or server logs

### **Functional Success** (After Testing)
- ✅ Plan gating works consistently across recurring invoices and accounting
- ✅ Super admin can create tenants with standard plan names
- ✅ Migration (if needed) completed successfully
- ✅ Clear upgrade path for users

---

## 📋 **DELIVERABLES**

When you complete this task, provide:

### **1. Database Analysis Report**
- Current plan values in database
- SQL migration script (if needed)
- Confirmation of plan name standardization

### **2. Implementation Summary**
- Files modified for plan consistency
- Accounting gating implementation details
- UpsellBanner component creation/reuse

### **3. Testing Evidence**
- Screenshots of upgrade message for non-PRO user
- Screenshots of normal access for PRO user
- Proof of consistent sidebar badges

### **4. Deployment Ready**
- Updated deployment commands
- Post-deployment verification steps
- Migration instructions (if needed)

---

## ⚡ **GET STARTED**

1. **Analyze current plan structure** in database and super admin
2. **Identify inconsistencies** between stored values and code expectations
3. **Plan migration strategy** (if needed)
4. **Copy recurring invoices pattern** for accounting module gating
5. **Test thoroughly** with both PRO and non-PRO users
6. **Document changes** and provide evidence

Remember: **Analysis before coding, verification before done!**

---
*Generated: 2026-02-10 for Facturador Electrónico SV — Fix Plan Names & Add Accounting Plan Gating*