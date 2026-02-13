# FASE 1: Catálogo de Productos/Servicios - Complete Implementation

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes, pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management
1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plans**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

---

## PROYECTO CONTEXT

**Sistema:** Facturador Electrónico SV - Plataforma SaaS para El Salvador
**Stack:** NestJS (API v32) + Next.js 14 (Web v39) + Prisma + Azure SQL + shadcn/ui
**Tema:** Dark purple (#8b5cf6) with glassmorphism, Inter typography
**Deploy:** Azure App Services with Docker containers

**Status Actual:**
- ✅ Portal B2B Cotizaciones Advanced completado (primer sistema en El Salvador)
- ✅ Módulo contable NIIF/PYMES completo con double-entry bookkeeping
- ✅ Facturas recurrentes con cron scheduling
- ✅ Security audit completo (0 vulnerabilities P0/P1)
- ✅ 127/127 tests passing, enterprise-ready platform

---

## MISIÓN DUAL: FASE 1 CATÁLOGO + CRITICAL FIXES

### 🎯 OBJETIVOS PRINCIPALES
1. **FASE 1**: Implementar sistema completo de catálogo de productos/servicios
2. **CRITICAL FIXES**: Resolver 7 issues urgentes identificados en producción

---

## 🚨 PRIORITY 0: CRITICAL FIXES (Resolver PRIMERO)

### Issue #1: Integración Catálogo en Facturas Recurrentes
**Ubicación**: `/facturas/recurrentes/nuevo`
**Problema**: No se puede agregar items del catálogo para llenado fácil
**Fix Required**: 
- Integrar ProductSearch component en RecurringInvoiceForm
- Permitir selección múltiple de productos del catálogo
- Auto-completar descripción, precio, IVA desde catálogo
- Mantener funcionalidad de override manual

### Issue #2: Error 500 al Emitir Facturas
**Problema**: Error 500 al intentar emitir facturas (critical production bug)
**Fix Required**:
- Investigar logs de Azure App Service para identificar root cause
- Likely issues: tenant isolation, DTE construction, MH authentication
- Fix error handling and add proper logging
- Test emisión completa: create → sign → transmit → receive seal

### Issue #3: Formulario Editar Cliente Broken
**Ubicación**: Formulario editar info de clientes
**Problemas**:
- No tiene máscara de validación de datos
- Botón guardar nunca se activa
- No se pueden guardar cambios
**Fix Required**:
- Añadir máscaras para: NIT, DUI, teléfono, email
- Implementar form validation con react-hook-form + zod
- Fix save button state management
- Add loading states y success/error feedback

### Issue #4: Test Contabilidad Sin Emisión
**Problema**: Necesita forma de probar contabilidad sin emitir facturas reales
**Fix Required**:
- Crear modo "DRAFT" para journal entries
- Botón "Test Accounting Impact" en invoice form
- Preview de journal entries antes de emisión
- Simulación completa: invoice → journal → trial balance
- No afectar secuencias ni MH cuando sea test mode

### Issue #5: Unificar Soporte - Email Config
**Ubicación**: `/configuraciones/email`
**Problema**: Form no congruente con sistema de tickets
**Fix Required**:
- Cambiar "¿Necesitas ayuda?" link para dirigir a `/soporte/nuevo`
- Pre-llenar ticket con categoría "Configuración de Email"
- Unificar todo soporte en un solo lugar
- Mantener consistencia en UX de soporte

### Issue #6: Tema Light Mode Broken
**Problema**: Light mode no funciona bien, letras no se ven
**Fix Required**:
- Revisar color scheme completo para light mode
- Asegurar contrast ratios WCAG AA compliance
- Explorar diferentes paletas que funcionen con brand
- Suggested palette: Light grays + purple accents + dark text
- Test readability en todos los componentes

### Issue #7: ProductSearch en Recurrentes (relacionado con #1)
**Problema**: Falta integración completa del catálogo
**Fix Required**: Part of Issue #1 resolution

---

## 🛠 CRITICAL FIXES - DETAILED IMPLEMENTATION

### 🚨 Fix #2: Error 500 al Emitir Facturas (HIGHEST PRIORITY)

**Investigation Steps:**
1. Check Azure App Service logs for recent 500 errors
2. Test complete DTE flow: create → validate → sign → transmit
3. Verify tenant isolation in all DTE endpoints
4. Check MH authentication token validity

**Likely Root Causes:**
```typescript
// Check these areas:
// 1. DTE construction validation
// 2. JWS signing process  
// 3. MH API authentication
// 4. Database constraints (missing fields)
// 5. Tenant filtering in queries
```

**Verification:**
- [ ] Create invoice successfully 
- [ ] Sign DTE without errors
- [ ] Transmit to MH successfully
- [ ] Receive government seal
- [ ] Check all logs are clean

### 🔧 Fix #3: Formulario Editar Cliente

**Current Issues:**
- Save button never activates
- No input validation masks
- Form state not tracking changes

**Implementation:**
```typescript
// Add to client form component:
// 1. Input masks for El Salvador formats
const nitMask = "####-######-###-#";
const duiMask = "########-#";
const phoneEl = "+503 ####-####";

// 2. Form validation schema
const clientSchema = z.object({
  nit: z.string().regex(/^\d{4}-\d{6}-\d{3}-\d$/),
  dui: z.string().regex(/^\d{8}-\d$/),
  telefono: z.string().regex(/^\+503 \d{4}-\d{4}$/),
  email: z.string().email(),
});

// 3. Enable save button when form is dirty and valid
const { formState: { isDirty, isValid } } = useForm();
const canSave = isDirty && isValid;
```

**Verification:**
- [ ] Input masks work correctly
- [ ] Validation shows proper errors
- [ ] Save button activates when form changes
- [ ] Data saves successfully to database
- [ ] Success message shows after save

### 🧪 Fix #4: Test Mode para Contabilidad

**Feature Requirements:**
```typescript
// Add test mode toggle to invoice form
interface InvoiceFormProps {
  testMode?: boolean; // New prop
}

// When testMode=true:
// 1. Don't increment invoice sequences
// 2. Don't send to MH
// 3. Create journal entries with TEST flag
// 4. Show accounting impact preview
// 5. Allow user to see trial balance changes

// Test mode indicator in UI
{testMode && (
  <div className="border-yellow-500 bg-yellow-50 border-l-4 p-4">
    🧪 MODO PRUEBA - Esta factura no será emitida al Ministerio
  </div>
)}
```

**Implementation:**
- Add "Probar Contabilidad" button in invoice form
- Create preview modal showing journal entries
- Implement test journal entries with reversible flag
- Show before/after trial balance comparison

### 📧 Fix #5: Unificar Soporte

**Changes Required:**
```typescript
// In /configuraciones/email page:
// Replace "¿Necesitas ayuda?" link

// Old:
<Link href="/help/email-setup">¿Necesitas ayuda?</Link>

// New:
<Link href="/soporte/nuevo?categoria=configuracion-email">
  ¿Necesitas ayuda?
</Link>

// Pre-fill support ticket form:
// - Category: "Configuración de Email"
// - Subject: "Ayuda con configuración de correos"
// - Context: User's current email settings (if any)
```

### 🎨 Fix #6: Light Mode Color Scheme

**Current Problems:**
- Poor contrast ratios
- Text not visible on light backgrounds
- Inconsistent color usage

**New Light Mode Palette:**
```css
/* Light mode color scheme */
:root[data-theme="light"] {
  /* Backgrounds */
  --background: #ffffff;
  --card: #f8fafc;
  --sidebar: #f1f5f9;
  
  /* Text */
  --foreground: #0f172a;
  --muted-foreground: #64748b;
  
  /* Primary (keep brand purple) */
  --primary: #8b5cf6;
  --primary-foreground: #ffffff;
  
  /* Borders */
  --border: #e2e8f0;
  --input-border: #cbd5e1;
  
  /* Status colors */
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
}
```

**Verification:**
- [ ] All text readable (contrast ratio > 4.5:1)
- [ ] Buttons clearly visible
- [ ] Form inputs have proper borders
- [ ] Status indicators work in both themes
- [ ] Switch between themes works smoothly

### 🛒 Fix #1: ProductSearch en Facturas Recurrentes

**Integration Points:**
```typescript
// 1. Add ProductSearch to RecurringInvoiceForm
import { ProductSearch } from '@/components/products/ProductSearch';

// 2. Replace manual item input with product selector
const [selectedProducts, setSelectedProducts] = useState([]);

// 3. Auto-populate from catalog
const handleProductSelect = (product) => {
  const newItem = {
    description: product.name,
    price: product.price,
    taxRate: product.taxRate,
    unitOfMeasure: product.unitOfMeasure,
    quantity: 1
  };
  setSelectedProducts(prev => [...prev, newItem]);
};
```

**UI Changes:**
- Replace "Agregar Item" with "Seleccionar del Catálogo"
- Show selected products in editable table
- Allow quantity/price overrides
- Maintain manual item addition option

---

## 📋 FASE 1: CATÁLOGO - DETAILED SCOPE

#### 1. DATABASE SCHEMA
```prisma
model ProductCategory {
  id          String    @id @default(cuid())
  name        String
  description String?
  tenantId    String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  products    Product[]
  
  @@map("product_categories")
}

model Product {
  id           String          @id @default(cuid())
  name         String
  description  String?
  sku          String?         // Código interno
  barcode      String?         // Código de barras
  categoryId   String?
  category     ProductCategory? @relation(fields: [categoryId], references: [id])
  
  // Pricing
  price        Decimal         @db.Decimal(10,2)
  cost         Decimal?        @db.Decimal(10,2)
  currency     String          @default("USD")
  
  // Tax & Compliance (El Salvador specific)
  taxRate      Decimal         @default(13.00) @db.Decimal(5,2) // 13% IVA
  isService    Boolean         @default(false)
  unitOfMeasure String         @default("UNI") // UNI, LB, KG, etc.
  
  // Inventory (basic)
  trackInventory Boolean       @default(false)
  currentStock   Int?
  minStock       Int?
  maxStock       Int?
  
  // Status
  isActive     Boolean         @default(true)
  
  // Metadata
  tenantId     String
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  
  // Relations
  invoiceItems DteItem[]
  quoteItems   QuoteItem[]
  
  @@map("products")
  @@unique([tenantId, sku])
}
```

#### 2. API ENDPOINTS (NestJS)
```typescript
// apps/api/src/products/products.controller.ts

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  
  // Products CRUD
  @Get()
  async findAll(@Req() req, @Query() query: ProductQueryDto) {
    // Pagination, search, filter by category, active status
    // Support: ?search=laptop&category=tech&page=1&limit=20
  }
  
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    // Get product with category, stock info
  }
  
  @Post()
  async create(@Body() createProductDto: CreateProductDto, @Req() req) {
    // Create with auto-generated SKU if not provided
    // Validate price > 0, tax rate valid
  }
  
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Req() req) {
    // Update with audit trail
  }
  
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    // Soft delete (isActive = false)
  }
  
  // Categories CRUD
  @Get('categories')
  async getCategories(@Req() req) {}
  
  @Post('categories')
  async createCategory(@Body() dto: CreateCategoryDto, @Req() req) {}
  
  // Special endpoints
  @Get('search/:term')
  async search(@Param('term') term: string, @Req() req) {
    // Fast search for autocomplete in forms
    // Search by name, sku, description
  }
  
  @Post('bulk-import')
  async bulkImport(@Body() dto: BulkImportDto, @Req() req) {
    // CSV/Excel import functionality
  }
  
  @Get('export')
  async export(@Req() req, @Query() query) {
    // Export to CSV/Excel
  }
}
```

#### 3. FRONTEND COMPONENTS (Next.js 14)

**3.1 Products List Page (`/products`)**
```jsx
// Tabla con shadcn/ui DataTable
// Columns: Name, SKU, Category, Price, Stock, Status, Actions
// Features:
// - Search bar (debounced)
// - Category filter dropdown
// - Status filter (Active/Inactive)
// - Pagination
// - Bulk actions (activate/deactivate)
// - Quick actions: Edit, Duplicate, Delete
// - "Add Product" button (opens dialog)
```

**3.2 Product Form Dialog/Page**
```jsx
// Form with react-hook-form + zod validation
// Sections:
// 1. Basic Info: Name, Description, Category
// 2. Identification: SKU (auto-generated), Barcode
// 3. Pricing: Price, Cost, Tax Rate, Currency
// 4. Inventory: Track inventory toggle, Current/Min/Max stock
// 5. Classification: Is Service toggle, Unit of measure
// 
// Features:
// - Auto-save draft functionality
// - Price calculator (price + tax = total)
// - SKU generator (based on category + sequence)
// - Image upload placeholder (future)
```

**3.3 Categories Management**
```jsx
// Simple CRUD interface
// - List view with nested categories support
// - Inline edit functionality
// - Drag & drop reordering
// - Color coding for visual organization
```

**3.4 Product Search Component**
```jsx
// Reusable component for invoice/quote forms
// Features:
// - Command palette style search (Cmd+K)
// - Fuzzy search by name, SKU, description
// - Category filtering
// - Recent products cache
// - Add new product inline option
// - Show price, stock, tax info in results
```

#### 4. INTEGRATION POINTS

**4.1 Invoice Form Integration**
```jsx
// Modify apps/web/src/app/(dashboard)/invoices/create/page.tsx
// Replace current item input with ProductSearch component
// Auto-populate: description, price, tax rate, unit measure
// Show stock warning if applicable
// Allow price override with confirmation
```

**4.2 Quote Form Integration**
```jsx
// Modify quote creation form
// Same ProductSearch integration
// Support for bulk product selection
// Quote-specific pricing (discounts, margins)
```

**4.3 Accounting Integration**
```jsx
// Map products to GL accounts automatically
// Product sales → Revenue accounts
// Product costs → COGS accounts
// Inventory tracking → Asset accounts
```

#### 5. PLAN FEATURES GATING

```tsx
// Plan restrictions:
// FREE (100 invoices): 50 products max
// PRO (unlimited): 1000 products max
// ENTERPRISE: Unlimited products + categories + advanced features

// Component: ProductLimitsGuard
// Show upgrade prompts when limits reached
// Disable create button with tooltip explanation
```

#### 6. DATA MIGRATION & SEEDING

```typescript
// Create migration for existing tenants
// Seed common product categories for El Salvador:
// - Servicios Profesionales
// - Productos Alimenticios  
// - Tecnología
// - Construcción
// - Ropa y Accesorios
// - Salud y Belleza
// - Educación
// - Transporte

// Sample products for demo/testing
// Products with El Salvador specific tax rates and units
```

#### 7. REPORTING & ANALYTICS

```jsx
// Product performance dashboard
// - Top selling products
// - Low stock alerts
// - Category performance
// - Revenue by product
// - Inventory valuation

// Integration with existing dashboard
// New cards: Total Products, Low Stock Items, Top Categories
```

#### 8. IMPORT/EXPORT FUNCTIONALITY

```jsx
// CSV template for bulk product import
// Excel export with formatting
// Validation and error reporting for imports
// Backup/restore product catalogs
```

### 🎯 IMPLEMENTATION PRIORITIES

**PRIORITY 0 (CRITICAL FIXES - DO FIRST):**
1. ❌ Issue #2: Fix Error 500 al emitir facturas (PRODUCTION CRITICAL)
2. 🔧 Issue #3: Fix formulario editar clientes (máscaras, validación, save button)
3. 🧪 Issue #4: Implement test mode para contabilidad sin emisión
4. 📧 Issue #5: Unificar soporte - redirect email config help to tickets
5. 🎨 Issue #6: Fix light mode color scheme y readability
6. 🛒 Issue #1: Integrate ProductSearch en facturas recurrentes

**PRIORITY 1 (CATÁLOGO MVP - AFTER CRITICAL FIXES):**
1. Database schema and migrations
2. Basic API endpoints (CRUD)
3. Simple products list page
4. Basic product form
5. Integration with invoice form

**PRIORITY 2 (CATÁLOGO Enhanced UX):**
1. Advanced search and filtering
2. Categories management
3. Product search component
4. Plan features gating
5. Stock management basics

**PRIORITY 3 (CATÁLOGO Advanced Features):**
1. Bulk import/export
2. Analytics dashboard integration
3. Advanced inventory features
4. Product templates
5. Accounting GL mapping

### ✅ SUCCESS CRITERIA

1. **Speed Test**: Product selection in invoice form < 5 seconds (vs current manual input)
2. **Adoption**: 80%+ of invoices use catalog products vs manual entry
3. **Data Quality**: Consistent pricing, descriptions, tax rates
4. **User Feedback**: Positive reception on product search UX
5. **Performance**: Page loads < 2 seconds with 1000+ products
6. **Plan Conversion**: FREE users hit product limits and upgrade to PRO

### 🚀 ANTI-PATTERNS TO AVOID

❌ **Complex inventory management** (keep it simple for MVP)
❌ **Multi-currency pricing** (stick to USD for now)  
❌ **Product variants/options** (one product = one SKU)
❌ **Advanced tax rules** (El Salvador has simple 13% IVA)
❌ **Product bundles/kits** (future feature)
❌ **Supplier management** (future feature)
❌ **Purchase orders** (future feature)

### 📝 VERIFICATION CHECKLIST

**CRITICAL FIXES:**
- [ ] Issue #2: Error 500 resolved - facturas emit successfully
- [ ] Issue #3: Client form saves correctly with proper validation
- [ ] Issue #4: Test mode for accounting works without affecting MH
- [ ] Issue #5: Email config help redirects to unified support
- [ ] Issue #6: Light mode theme readable and functional
- [ ] Issue #1: Product catalog integrated in recurring invoices

**CATÁLOGO IMPLEMENTATION:**
- [ ] All API endpoints return proper tenant isolation
- [ ] Product search works in invoice/quote forms
- [ ] Plan limits properly enforced
- [ ] Database migrations run cleanly
- [ ] No TypeScript errors
- [ ] Responsive design works on mobile
- [ ] Loading states and error handling work
- [ ] Search performance acceptable
- [ ] Categories CRUD functional
- [ ] Integration with existing auth/permissions

---

## STARTING POINT

**STEP 1: CRITICAL FIXES FIRST**
Resolve all PRIORITY 0 issues before starting catalog implementation:
1. Fix Error 500 al emitir facturas (check Azure logs, test DTE flow)
2. Fix client edit form (validation, save button, masks)
3. Implement accounting test mode
4. Unify support system (email config redirect)
5. Fix light mode color scheme
6. Integrate ProductSearch in recurring invoices

**STEP 2: CATALOG IMPLEMENTATION**
After critical fixes are complete, proceed with catalog:

Read existing codebase structure:
- `apps/api/src/` for API patterns
- `apps/web/src/app/(dashboard)/` for UI patterns  
- `packages/database/prisma/schema.prisma` for DB schema
- `apps/web/src/components/ui/` for component library

Then proceed with **Priority 1 MVP implementation**.

Start with database schema, then API, then frontend. Follow the existing patterns for auth, tenant isolation, and error handling.

**Ready to begin with CRITICAL FIXES!** 🚀
