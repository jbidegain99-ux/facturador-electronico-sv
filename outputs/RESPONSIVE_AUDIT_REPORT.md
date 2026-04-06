# RESPONSIVE AUDIT REPORT - Facturo by Republicode

**Date:** 2026-04-06
**Auditor:** Claude Code (automated codebase analysis)
**Scope:** All pages and components under `apps/web/src/`
**Tailwind Config:** Default breakpoints (sm:640, md:768, lg:1024, xl:1280)

---

## 1. Current State: Responsive Coverage Matrix (320px - 1440px)

| Component / Page          | 320px | 640px (sm) | 768px (md) | 1024px (lg) | 1440px (xl+) |
|---------------------------|-------|------------|------------|-------------|---------------|
| **Root Layout**           | OK    | OK         | OK         | OK          | OK            |
| **Header / Top Bar**      | OK    | OK         | OK         | OK          | OK            |
| **Sidebar**               | OK (overlay) | OK (overlay) | OK (fixed) | OK (fixed) | OK (fixed) |
| **Bottom Nav**            | OK    | OK         | hidden     | hidden      | hidden        |
| **Dashboard KPIs**        | OK (mobile component) | OK | OK (2-col) | OK (4-col) | OK (4-col) |
| **Dashboard Charts**      | !! single-col no span fix | OK | OK (7-col) | OK (7-col) | OK (7-col) |
| **Facturas Filters**      | !! overflow | !! | OK | OK | OK |
| **Facturas Table**        | OK (mobile list) | OK | OK (table) | OK | OK |
| **Clientes Page**         | OK (cards) | OK | OK (table) | OK | OK |
| **Sucursales Table**      | !! h-scroll | !! h-scroll | !! h-scroll | OK | OK |
| **Usuarios Table**        | !! h-scroll | !! h-scroll | !! h-scroll | OK | OK |
| **Config Page**           | OK    | OK         | OK (2-col) | OK (2-col)  | OK            |
| **Catalogo/Products**     | OK    | OK         | OK         | OK          | OK            |
| **Soporte Page**          | OK    | OK         | OK         | OK          | OK            |
| **Items Table (forms)**   | !! h-scroll, inputs cramped | !! | !! | OK | OK |
| **Totals Summary**        | !! hardcoded w-64 | OK | OK | OK | OK |
| **Chat Sidebar**          | !! mr-[380px] overflow | !! | OK | OK | OK |
| **Modals/Dialogs**        | OK    | OK         | OK         | OK          | OK            |
| **Admin Support Table**   | !! 9 cols h-scroll | !! | !! | OK | OK |
| **Admin Tenants Table**   | !! 8 cols h-scroll | !! | !! | OK | OK |

**Legend:** OK = works well | !! = broken/needs fix | h-scroll = horizontal scroll required

---

## 2. Root Cause Diagnosis

### 2.1 CRITICAL: Chat Sidebar Overflow (P0)
**File:** `src/app/(dashboard)/layout.tsx:175`
```tsx
// CURRENT (line 175)
chatSidebarOpen && 'mr-[380px]'

// PROBLEM: No breakpoint guard. On 320px screen, mr-[380px] pushes
// content 380px to the left, causing massive horizontal overflow.
```
**Root cause:** Missing `md:` prefix on chat sidebar margin.

---

### 2.2 CRITICAL: Facturas Filter Row Overflow (P1)
**File:** `src/app/(dashboard)/facturas/page.tsx:298-339`
```tsx
// CURRENT (lines 298-311)
<div className="flex flex-wrap gap-4">
  <div className="flex-1 min-w-[200px]">         // 200px min
    <Input ... />
  </div>
  <Select>
    <SelectTrigger className="w-[180px]">         // 180px fixed
  </Select>
  <Select>
    <SelectTrigger className="w-[180px]">         // 180px fixed
  </Select>
</div>

// PROBLEM: 200px + 180px + 180px + gaps = 576px minimum.
// On 320px screen, flex-wrap helps but min-w-[200px] still
// forces search input to 200px, and selects remain 180px each.
// Result: Each wrapped row still has fixed-width elements.
```
**Root cause:** Hardcoded `w-[180px]` on selects, `min-w-[200px]` on search.

---

### 2.3 HIGH: Sucursales Table - No Mobile Layout (P1)
**File:** `src/app/(dashboard)/configuracion/sucursales/page.tsx:427-437`
```tsx
// CURRENT (lines 427-437)
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-10"></TableHead>    // expand toggle
      <TableHead>Sucursal</TableHead>              // name + icon
      <TableHead>Codigo MH</TableHead>             // code
      <TableHead>Tipo</TableHead>                  // type
      <TableHead>Ubicacion</TableHead>             // location
      <TableHead>Estado</TableHead>                // status badge
      <TableHead className="text-right">Acciones</TableHead>  // 3 buttons
    </TableRow>
  </TableHeader>
  // ... 7 columns, NO md:hidden, NO mobile card alternative
</Table>
```
**Root cause:** No mobile card view. Only `overflow-x-auto` (inherited from Table component). Users must scroll horizontally on any screen < ~900px.

---

### 2.4 HIGH: Usuarios Table - No Mobile Layout (P1)
**File:** `src/app/(dashboard)/configuracion/usuarios/page.tsx:425-432`
```tsx
// 5 columns: Nombre, Email, Rol(legacy), Roles RBAC, Acciones
// Email can be 200+ chars with no truncation
// RBAC roles column uses flex flex-wrap gap-1 badges — can overflow
// No mobile card view, no hidden columns
```
**Root cause:** Same as sucursales — table-only layout with no responsive alternative.

---

### 2.5 MEDIUM: Items Table Input Row (P2)
**File:** `src/components/forms/items-table.tsx:145-179`
```tsx
// CURRENT: Add-item row is a <TableRow> with inline inputs:
<TableCell><Input placeholder="Descripcion..." /></TableCell>    // flexible
<TableCell><Input className="w-20 text-right" /></TableCell>     // 80px fixed
<TableCell><MoneyInput className="w-28" /></TableCell>           // 112px fixed
<TableCell colSpan={3}></TableCell>                              // empty
<TableCell><Button className="h-8 w-8">+</Button></TableCell>   // 32px

// PROBLEM: Inside a 7-column table that's already horizontally scrolled.
// On mobile, the description input gets compressed to ~50px, making it
// nearly impossible to type into.
```
**Root cause:** Add-item form is embedded in the table rather than being a separate stacked mobile form.

---

### 2.6 MEDIUM: Totals Summary Hardcoded Width (P2)
**File:** `src/components/forms/items-table.tsx:185-200`
```tsx
// CURRENT (line 186)
<div className="w-64 space-y-2">    // 256px hardcoded
  <div className="flex justify-between text-sm">
    <span>Subtotal:</span>
    <span>{formatCurrency(subtotal)}</span>
  </div>
  // ...
</div>

// PROBLEM: On 320px - 32px padding = 288px content area.
// w-64 (256px) fits but barely. Not responsive.
```
**Root cause:** Hardcoded `w-64` instead of responsive width.

---

### 2.7 MEDIUM: Dashboard Charts col-span on Mobile (P2)
**File:** `src/app/(dashboard)/dashboard/page.tsx:212-231`
```tsx
// CURRENT (line 212)
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
  <Card className="col-span-4">    // Revenue chart
  <Card className="col-span-3">    // Top clients
</div>

// PROBLEM: On mobile (no grid-cols defined), col-span-4 and col-span-3
// are meaningless (single column), but they don't cause breakage.
// However, on md (2 cols), col-span-4 overflows 2-col grid.
```
**Root cause:** `col-span-4` and `col-span-3` need `md:col-span-*` prefix to avoid layout issues at md breakpoint.

---

### 2.8 LOW: Admin Tables (Support 9 cols, Tenants 8 cols) (P3)
**Files:**
- `src/app/(super-admin)/admin/support/page.tsx` — 9 columns
- `src/app/(super-admin)/admin/tenants/page.tsx` — 8 columns

**Root cause:** Admin pages are desktop-focused. No mobile card alternatives. Rely purely on `overflow-x-auto`. Acceptable for admin but could be improved.

---

## 3. Prioritized Fix List

### Priority 1: HIGH IMPACT (Fix first - Week 1)

#### 1.1 Fix Chat Sidebar Overflow
- **Impact:** All mobile users get broken layout when chat opens
- **Effort:** 5 minutes
- **File:** `src/app/(dashboard)/layout.tsx:175`
- **Change:**
```tsx
// BEFORE
chatSidebarOpen && 'mr-[380px]'

// AFTER
chatSidebarOpen && 'mr-0 md:mr-[380px]'
```
- On mobile, chat should overlay (full-screen or slide-over), not push content.

---

#### 1.2 Fix Facturas Filter Row
- **Impact:** Invoice page filters overflow on mobile
- **Effort:** 1-2 hours
- **File:** `src/app/(dashboard)/facturas/page.tsx:298-339`
- **Change:**
```tsx
// BEFORE (line 298-311)
<div className="flex flex-wrap gap-4">
  <div className="flex-1 min-w-[200px]">
  <SelectTrigger className="w-[180px]">
  <SelectTrigger className="w-[180px]">

// AFTER
<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
  <div className="w-full sm:flex-1 sm:min-w-[200px]">
  <SelectTrigger className="w-full sm:w-[180px]">
  <SelectTrigger className="w-full sm:w-[180px]">
```
- On mobile: stacked full-width inputs. On sm+: original wrapping row.

---

#### 1.3 Sucursales Mobile Card View
- **Impact:** Config section unusable on mobile
- **Effort:** 3-4 hours
- **File:** `src/app/(dashboard)/configuracion/sucursales/page.tsx:420-480`
- **Change:**
```tsx
// ADD mobile card list before the table
<div className="md:hidden space-y-3">
  {sucursales.map((suc) => (
    <div key={suc.id} className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <div className="font-medium text-sm">{suc.nombre}</div>
            <div className="text-xs text-muted-foreground font-mono">{suc.codEstableMH}</div>
          </div>
        </div>
        <Badge>{suc.activa ? 'Activa' : 'Inactiva'}</Badge>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{TIPO_ESTABLECIMIENTO[suc.tipoEstablecimiento]}</span>
        <div className="flex gap-1">
          {/* action buttons */}
        </div>
      </div>
    </div>
  ))}
</div>

// WRAP existing table with hidden md:block
<div className="hidden md:block">
  <Table>...</Table>
</div>
```

---

#### 1.4 Usuarios Mobile Card View
- **Impact:** User management unusable on mobile
- **Effort:** 2-3 hours
- **File:** `src/app/(dashboard)/configuracion/usuarios/page.tsx:425-475`
- **Change:** Same pattern as sucursales — `md:hidden` cards + `hidden md:block` table.
```tsx
// Mobile cards showing: Name, Email (truncated), Role badges, Edit button
<div className="md:hidden space-y-2">
  {users.map(user => (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{user.nombre}</div>
        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {user.roles.map(r => <Badge key={r} className="text-[10px]">{r}</Badge>)}
        </div>
      </div>
      <Button variant="ghost" size="icon">...</Button>
    </div>
  ))}
</div>
```

---

### Priority 2: MEDIUM IMPACT (Week 2)

#### 2.1 Items Table Mobile Form
- **Impact:** Adding invoice items very difficult on mobile
- **Effort:** 3-4 hours
- **Files:**
  - `src/components/forms/items-table.tsx:145-179`
  - `src/components/facturas/items-table.tsx` (similar)
- **Change:**
```tsx
// Add a separate mobile add-item form above the table
<div className="md:hidden space-y-3 p-3 border rounded-lg">
  <Input placeholder="Descripcion..." className="w-full" />
  <div className="grid grid-cols-2 gap-3">
    <Input type="number" placeholder="Cant." className="text-right" />
    <MoneyInput placeholder="Precio" />
  </div>
  <Button className="w-full">Agregar Item</Button>
</div>

// Keep table add-row for desktop only
<TableRow className="hidden md:table-row">
  {/* existing inline inputs */}
</TableRow>
```

---

#### 2.2 Totals Summary Responsive Width
- **Impact:** Totals box slightly cramped on small screens
- **Effort:** 15 minutes
- **File:** `src/components/forms/items-table.tsx:186`
- **Change:**
```tsx
// BEFORE
<div className="w-64 space-y-2">

// AFTER
<div className="w-full sm:w-64 space-y-2">
```

---

#### 2.3 Dashboard Chart Grid col-span Fix
- **Impact:** Chart layout may behave unexpectedly at md breakpoint
- **Effort:** 15 minutes
- **File:** `src/app/(dashboard)/dashboard/page.tsx:212-222`
- **Change:**
```tsx
// BEFORE
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
  <Card className="col-span-4">
  <Card className="col-span-3">

// AFTER
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
  <Card className="md:col-span-1 lg:col-span-4">
  <Card className="md:col-span-1 lg:col-span-3">
```

---

#### 2.4 Global Table Padding Reduction on Mobile
- **Impact:** Tables have too much padding on small screens
- **Effort:** 30 minutes
- **File:** `src/app/globals.css` (lines 331-355)
- **Change:**
```css
/* BEFORE */
.table-rc th { @apply px-4 py-3 text-sm ...; }
.table-rc td { @apply px-4 py-3 text-sm ...; }

/* AFTER */
.table-rc th { @apply px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm ...; }
.table-rc td { @apply px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm ...; }
```

---

### Priority 3: LOWER IMPACT (Week 3 / Polish)

#### 3.1 Admin Tables (Support + Tenants) Mobile Cards
- **Impact:** Admin-only pages, fewer users
- **Effort:** 4-5 hours total
- **Files:**
  - `src/app/(super-admin)/admin/support/page.tsx`
  - `src/app/(super-admin)/admin/tenants/page.tsx`
- **Change:** Same card pattern as sucursales/usuarios.

---

#### 3.2 Add overflow-x-hidden to Body
- **Impact:** Prevents any accidental horizontal scroll on the entire app
- **Effort:** 5 minutes
- **File:** `src/app/globals.css`
- **Change:**
```css
body {
  overflow-x: hidden;
}
```

---

#### 3.3 Notification Dropdown Max Height
- **Impact:** Long notification lists may push past viewport on mobile
- **Effort:** 10 minutes
- **File:** `src/components/layout/header.tsx:167`
- **Change:**
```tsx
// BEFORE
className="w-[calc(100vw-2rem)] md:w-96"

// AFTER
className="w-[calc(100vw-2rem)] md:w-96 max-h-[70vh] overflow-y-auto"
```

---

#### 3.4 Sidebar Transition Speed
- **Impact:** Minor UX — feels slightly laggy on low-end phones
- **Effort:** 5 minutes
- **File:** `src/components/layout/sidebar.tsx`
- **Change:** `duration-300` -> `duration-200`

---

## 4. Effort Breakdown

| # | Fix | Effort | Priority |
|---|-----|--------|----------|
| 1.1 | Chat sidebar overflow | 5 min | P0 |
| 1.2 | Facturas filter row | 1-2 hrs | P1 |
| 1.3 | Sucursales mobile cards | 3-4 hrs | P1 |
| 1.4 | Usuarios mobile cards | 2-3 hrs | P1 |
| **P1 Subtotal** | | **6-9 hrs** | |
| 2.1 | Items table mobile form | 3-4 hrs | P2 |
| 2.2 | Totals width responsive | 15 min | P2 |
| 2.3 | Chart grid col-span | 15 min | P2 |
| 2.4 | Table padding mobile | 30 min | P2 |
| **P2 Subtotal** | | **4-5 hrs** | |
| 3.1 | Admin tables mobile | 4-5 hrs | P3 |
| 3.2 | Body overflow-x | 5 min | P3 |
| 3.3 | Notification dropdown | 10 min | P3 |
| 3.4 | Sidebar transition | 5 min | P3 |
| **P3 Subtotal** | | **4-5 hrs** | |
| **Testing (all devices)** | | **4-6 hrs** | |
| **GRAND TOTAL** | | **~18-25 hrs** | |

---

## 5. What's Already Working Well

These components have **excellent** responsive implementation:

| Component | Why It Works |
|-----------|-------------|
| **Dashboard KPIs** | `StatCardsMobile` component (grid-cols-2) + desktop `hidden md:grid` pattern |
| **Facturas List** | `InvoiceListMobile` component with proper truncation (`min-w-0`, `truncate`) |
| **Clientes Page** | `md:hidden` cards with flex-1 min-w-0 + `hidden md:block` table |
| **Header** | Responsive h-14/h-16, gap-1/gap-2, company name `hidden md:block`, user name `hidden md:inline-block` |
| **Bottom Nav** | 4-item fixed nav with `md:hidden`, safe-area-inset support |
| **Sidebar** | Mobile overlay with backdrop + auto-close on navigate |
| **Modals/Dialogs** | `max-h-[85vh]`, footer `flex-col-reverse sm:flex-row` |
| **Config Page** | `grid gap-6 lg:grid-cols-2`, form grids `md:grid-cols-2` |
| **Onboarding Wizard** | Mobile-specific `MobileWizard` component with step progress |

---

## 6. Responsive Prefix Usage Stats

| Prefix | Files | Occurrences | Notes |
|--------|-------|-------------|-------|
| `sm:` | 44 | 134 | Well used for small adjustments |
| `md:` | 49 | 112 | Primary breakpoint (mobile/desktop split) |
| `lg:` | 42 | 88 | Large layout adjustments |
| `xl:` | 4 | 6 | Barely used |
| `2xl:` | 1 | 1 | Nearly absent |

**Key finding:** No custom breakpoints. Standard Tailwind defaults are sufficient.

---

## 7. Validation Answers

### Do we need a Next.js upgrade (14 -> 16)?
**No.** All responsive issues are CSS/Tailwind fixes. No framework-level changes needed.

### Do we need PWA/ServiceWorker for responsive web?
**No.** ServiceWorker already registered (`sw-register.tsx`). Responsive fixes are pure CSS.

### Do we need new libraries?
**No.** Tailwind + shadcn/ui + existing mobile components are sufficient. No CSS framework additions needed.

### Can we do this in 1 week?
**Yes.** P0+P1 fixes (the critical ones) take ~6-9 hours. Full P1-P3 + testing is ~18-25 hours, doable in 1 week for 1 developer.

### What's the dependency chain?
```
P0: Chat sidebar fix (5 min, no deps)
  |
P1: Facturas filters (independent)
P1: Sucursales cards (independent)
P1: Usuarios cards (independent)
  |
P2: Items table form (depends on understanding P1 card patterns)
P2: Table padding (independent, affects all tables)
P2: Chart col-span + totals width (independent, quick)
  |
P3: Admin tables (can reuse P1 card patterns)
P3: Polish fixes (independent)
  |
FINAL: Cross-device testing on 320px, 375px, 768px, 1024px, 1440px
```

### Recommended execution order:
1. `layout.tsx` chat sidebar fix (P0 - immediate)
2. `facturas/page.tsx` filter fix (P1)
3. `sucursales/page.tsx` mobile cards (P1)
4. `usuarios/page.tsx` mobile cards (P1)
5. `items-table.tsx` mobile form (P2)
6. Quick fixes: totals width, chart spans, table padding, body overflow (P2-P3)
7. Admin tables if time permits (P3)
8. Full device testing pass

---

## 8. Files to Modify (Complete List)

| File | Changes |
|------|---------|
| `src/app/(dashboard)/layout.tsx` | Add `md:` prefix to chat sidebar margin (line 175) |
| `src/app/(dashboard)/facturas/page.tsx` | Make filter selects full-width on mobile (lines 299, 311, 328) |
| `src/app/(dashboard)/configuracion/sucursales/page.tsx` | Add mobile card view + hide table on mobile (lines 420-480) |
| `src/app/(dashboard)/configuracion/usuarios/page.tsx` | Add mobile card view + hide table on mobile (lines 425-475) |
| `src/components/forms/items-table.tsx` | Add mobile add-item form, responsive totals width (lines 145-200) |
| `src/components/facturas/items-table.tsx` | Same items table mobile form |
| `src/app/(dashboard)/dashboard/page.tsx` | Fix col-span at md breakpoint (lines 212-222) |
| `src/app/globals.css` | Reduce table padding on mobile, add body overflow-x (lines 331-355) |
| `src/components/layout/header.tsx` | Add max-h to notification dropdown (line 167) |
| `src/components/layout/sidebar.tsx` | Optional: reduce transition duration |
| `src/app/(super-admin)/admin/support/page.tsx` | Optional: add mobile cards (P3) |
| `src/app/(super-admin)/admin/tenants/page.tsx` | Optional: add mobile cards (P3) |

---

*Report generated from static code analysis. Recommend validating with Chrome DevTools device emulation at 320px, 375px, and 768px before implementation.*

---

## 9. TEXT SIZING FIXES (Implemented 2026-04-06)

All text sizing fixes below have been **applied and verified** (build passes).

### 9.1 Page Titles: `text-3xl` -> `text-xl sm:text-2xl md:text-3xl`

**30+ instances fixed across these files:**

| File | Line | Text Content |
|------|------|-------------|
| `(dashboard)/dashboard/page.tsx` | 179 | Dashboard title |
| `(dashboard)/facturas/page.tsx` | 257 | Facturas title |
| `(dashboard)/clientes/page.tsx` | 461 | Clientes title |
| `(dashboard)/soporte/page.tsx` | 270 | Soporte title |
| `(dashboard)/webhooks/page.tsx` | 234 | Webhooks title + icon h-8->h-6/sm:h-8 |
| `(dashboard)/perfil/page.tsx` | 193, 207 | Mi Perfil (both instances) |
| `(dashboard)/configuracion/page.tsx` | 223 | Configuracion title |
| `(dashboard)/configuracion/usuarios/page.tsx` | 380 | Usuarios title + icon w-7->w-5/sm:w-7 |
| `(dashboard)/configuracion/sucursales/page.tsx` | 394 | Sucursales title + icon w-7->w-5/sm:w-7 |
| `(dashboard)/configuracion/migracion/page.tsx` | 258 | Migracion title |
| `(dashboard)/configuracion/hacienda/.../SetupSelector.tsx` | 24 | Hacienda config (text-lg on mobile) |
| `(dashboard)/configuracion/plan/page.tsx` | 147 | Mi Plan title |
| `(super-admin)/admin/page.tsx` | 112 | Admin dashboard title |
| `(super-admin)/admin/admins/page.tsx` | 67 | Super Admins title |
| `(super-admin)/admin/settings/page.tsx` | 12 | Settings title |
| `(super-admin)/admin/webhooks/page.tsx` | 112 | Webhooks title |
| `(super-admin)/admin/backups/page.tsx` | 172 | Backups title |
| `(super-admin)/admin/catalogos/page.tsx` | 253 | Catalogos title |
| `(super-admin)/admin/tenants/page.tsx` | 187 | Companies title |
| `(super-admin)/admin/logs/page.tsx` | 291 | Logs title |
| `(super-admin)/admin/notificaciones/page.tsx` | 374 | Notificaciones title |
| `(super-admin)/admin/planes/page.tsx` | 236 | Planes title |
| `(super-admin)/admin/support/page.tsx` | 212 | Support title |
| `(super-admin)/admin/tenants/[id]/page.tsx` | 225 | Tenant detail title + truncate |
| `(super-admin)/admin/tenants/[id]/hacienda/page.tsx` | 296 | Hacienda config title |
| `app/privacidad/page.tsx` | 5 | Privacy policy title |
| `app/terminos/page.tsx` | 5 | Terms title |
| `onboarding/steps/welcome-step.tsx` | 75 | Onboarding welcome |
| `onboarding/steps/completed-step.tsx` | 49 | Onboarding complete |

### 9.2 Landing Page: `text-4xl` -> `text-2xl sm:text-3xl md:text-4xl`

| File | Line | Text Content |
|------|------|-------------|
| `app/page.tsx` | 91 | "Todo lo que necesitas para facturar" |
| `app/page.tsx` | 181 | "Planes para cada necesidad" |
| `app/page.tsx` | 193, 220, 248 | Pricing cards: `text-3xl sm:text-4xl` |

### 9.3 Stat Numbers: `text-3xl` -> `text-2xl sm:text-3xl`

| File | Lines | Content |
|------|-------|---------|
| `(super-admin)/admin/page.tsx` | 122,139,154,171 | Admin dashboard stat values |
| `(dashboard)/configuracion/migracion/page.tsx` | 454,458,462,466 | Import result counts |

### 9.4 Truncation Added to User-Data Fields

| File | Line | Field | Fix |
|------|------|-------|-----|
| `facturas/factura-preview.tsx` | 168 | Client name | Added `truncate` |
| `facturas/factura-preview.tsx` | 174 | Client email | Added `truncate` |
| `reportes/page.tsx` | 670 | Top client name | Added `truncate` |
| `facturas/recurrentes/[id]/page.tsx` | 485 | Template client name | Added `truncate` |
| `(super-admin)/admin/tenants/[id]/page.tsx` | 225 | Tenant name heading | Added `truncate` |
| `(super-admin)/admin/tenants/page.tsx` | 281-282 | Company name+email in table | Added `truncate` + `max-w-[200px]` |
| `configuracion/usuarios/page.tsx` | 445-446 | User name+email in table | Added `truncate` + `max-w-[150px]/[200px]` |
| `(super-admin)/admin/support/page.tsx` | 378-379 | Ticket tenant+requester names | Added `truncate` + `max-w-[150px]` |
