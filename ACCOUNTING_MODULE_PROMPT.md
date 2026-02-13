# Módulo Contable Integrado — Implementation Prompt
## Date: 2026-02-10
## For: Claude Code (Opus 4.6)

---

## 🎯 **OBJECTIVE**

Implement a complete **Módulo Contable Integrado** (Integrated Accounting Module) for Facturador Electrónico SV with double-entry bookkeeping following El Salvador accounting standards (NIIF/PYMES).

**Core Features:**
- Plan de cuentas estándar de El Salvador
- Double-entry journal entries (partidas contables)
- Balance general y estado de resultados
- Libro mayor y libro diario
- Account hierarchy and management
- Basic financial reporting

---

## 🚨 **CRITICAL: FOLLOW REPUBLICODE METHODOLOGY**

### **1. Plan Mode Default**
- Analyze existing schemas and database structure BEFORE coding
- Create detailed implementation plan with file-by-file changes
- Plan database migration strategy
- Design UI component architecture upfront

### **2. Analysis Before Coding**
- Read existing Prisma schema in `apps/api/prisma/schema.prisma`
- Understand current tenant isolation patterns
- Study existing module structure (recurring-invoices, catalog-items)
- Plan integration points with DTE system

### **3. Verification Before Done**
- Demonstrate working CRUD operations for accounts
- Show balance validation (débitos = créditos)
- Verify plan de cuentas seed data loaded correctly
- Test basic reports generation

### **4. Self-Improvement Loop**
- Document accounting patterns discovered
- Note lessons learned about financial calculations
- Update deployment procedures for accounting module

---

## 📊 **CURRENT STATE ANALYSIS**

### **Existing Architecture**
- **Backend**: NestJS with Prisma ORM
- **Database**: Azure SQL Database
- **Frontend**: Next.js 14 with shadcn/ui
- **Current Version**: API v23, Web v34
- **Multi-tenant**: Tenant isolation at database level

### **Integration Points**
- **DTE Module**: Invoice creation will trigger journal entries
- **Plan Gating**: Accounting features gated behind PRO plan
- **Sidebar**: Add "Contabilidad" menu item
- **Dashboard**: Add accounting summary widgets

---

## 🛠️ **TECHNICAL REQUIREMENTS**

### **Database Schema Extensions**

Based on existing Prisma patterns, implement these models:

```prisma
// Catálogo de cuentas contables
model AccountingAccount {
  id            String    @id @default(cuid()) @db.NVarChar(1000)
  tenantId      String    @db.NVarChar(1000)
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Codificación jerárquica El Salvador
  code          String    @db.NVarChar(20)   // "1101", "110101", "11010101"
  name          String    @db.NVarChar(200)  // "Efectivo", "Caja General"
  
  // Jerarquía
  parentId      String?   @db.NVarChar(1000)
  parent        AccountingAccount? @relation("AccountHierarchy", fields: [parentId], references: [id], onDelete: Restrict)
  children      AccountingAccount[] @relation("AccountHierarchy")
  level         Int       @default(1) // 1=Elemento, 2=Rubro, 3=Cuenta, 4=Subcuenta
  
  // Clasificación contable
  accountType   String    @db.NVarChar(20)  // "ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"
  normalBalance String    @db.NVarChar(10)  // "DEBIT", "CREDIT"
  
  // Estado y configuración
  isActive      Boolean   @default(true)
  isSystem      Boolean   @default(false)  // Cuentas predefinidas
  allowsPosting Boolean   @default(true)   // Permite movimientos directos
  
  // Descripción adicional
  description   String?   @db.NVarChar(500)
  
  // Saldos (calculados)
  currentBalance Decimal  @default(0) @db.Decimal(15, 2)
  
  // Relaciones
  journalLines  JournalEntryLine[]
  debitRules    AccountMappingRule[] @relation("DebitRules")
  creditRules   AccountMappingRule[] @relation("CreditRules")
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([tenantId, code])
  @@index([tenantId, accountType])
  @@index([tenantId, isActive])
  @@index([tenantId, level])
  @@map("accounting_accounts")
}

// Partidas contables (Journal Entries)
model JournalEntry {
  id                String              @id @default(cuid()) @db.NVarChar(1000)
  tenantId          String              @db.NVarChar(1000)
  tenant            Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Identificación secuencial
  entryNumber       String              @db.NVarChar(50)  // "VTA-2026-000001"
  entryDate         DateTime
  description       String              @db.NVarChar(1000)
  
  // Tipo y origen
  entryType         String              @default("AUTOMATIC") // "AUTOMATIC", "MANUAL", "ADJUSTMENT", "CLOSING"
  sourceType        String?             @db.NVarChar(30)  // "INVOICE", "PAYMENT", "CREDIT_NOTE", "MANUAL"
  sourceDocumentId  String?             @db.NVarChar(1000) // ID de factura, pago, etc.
  
  // Estado
  status            String              @default("DRAFT")  // "DRAFT", "POSTED", "VOIDED"
  postedAt          DateTime?
  postedBy          String?             @db.NVarChar(1000)
  voidedAt          DateTime?
  voidedBy          String?             @db.NVarChar(1000)
  voidReason        String?             @db.NVarChar(500)
  
  // Líneas de la partida
  lines             JournalEntryLine[]
  
  // Totales (calculados para validación)
  totalDebit        Decimal             @default(0) @db.Decimal(15, 2)
  totalCredit       Decimal             @default(0) @db.Decimal(15, 2)
  
  // Período fiscal
  fiscalYear        Int
  fiscalMonth       Int
  
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  @@unique([tenantId, entryNumber])
  @@index([tenantId, entryDate])
  @@index([tenantId, status])
  @@index([tenantId, fiscalYear, fiscalMonth])
  @@index([sourceType, sourceDocumentId])
  @@map("journal_entries")
}

// Líneas de partidas contables
model JournalEntryLine {
  id              String            @id @default(cuid()) @db.NVarChar(1000)
  entryId         String            @db.NVarChar(1000)
  entry           JournalEntry      @relation(fields: [entryId], references: [id], onDelete: Cascade)
  
  accountId       String            @db.NVarChar(1000)
  account         AccountingAccount @relation(fields: [accountId], references: [id])
  
  description     String            @db.NVarChar(500)
  debit           Decimal           @default(0) @db.Decimal(15, 2)
  credit          Decimal           @default(0) @db.Decimal(15, 2)
  
  lineNumber      Int
  
  createdAt       DateTime          @default(now())
  
  @@index([entryId])
  @@index([accountId])
  @@map("journal_entry_lines")
}

// Reglas de mapeo automático
model AccountMappingRule {
  id              String            @id @default(cuid()) @db.NVarChar(1000)
  tenantId        String            @db.NVarChar(1000)
  tenant          Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Tipo de operación
  operation       String            @db.NVarChar(50)  // "SALE_INVOICE", "PAYMENT_RECEIVED", etc.
  description     String?           @db.NVarChar(200)
  
  // Mapeo de cuentas
  debitAccountId  String            @db.NVarChar(1000)
  debitAccount    AccountingAccount @relation("DebitRules", fields: [debitAccountId], references: [id])
  creditAccountId String            @db.NVarChar(1000) 
  creditAccount   AccountingAccount @relation("CreditRules", fields: [creditAccountId], references: [id])
  
  // Condiciones adicionales (JSON)
  conditions      Json?
  
  isActive        Boolean           @default(true)
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([tenantId, operation])
  @@index([tenantId, isActive])
  @@map("account_mapping_rules")
}
```

### **Plan de Cuentas El Salvador (Seed Data)**

Implement standard Salvadoran chart of accounts based on NIIF PYMES:

```typescript
// Plan de cuentas base El Salvador
const SALVADOR_CHART_OF_ACCOUNTS = [
  // 1. ACTIVOS
  { code: '1', name: 'ACTIVOS', type: 'ASSET', level: 1, normalBalance: 'DEBIT' },
  { code: '11', name: 'ACTIVO CORRIENTE', type: 'ASSET', level: 2, parentCode: '1', normalBalance: 'DEBIT' },
  { code: '1101', name: 'EFECTIVO Y EQUIVALENTES', type: 'ASSET', level: 3, parentCode: '11', normalBalance: 'DEBIT' },
  { code: '110101', name: 'Caja General', type: 'ASSET', level: 4, parentCode: '1101', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '110102', name: 'Caja Chica', type: 'ASSET', level: 4, parentCode: '1101', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '110103', name: 'Bancos', type: 'ASSET', level: 4, parentCode: '1101', normalBalance: 'DEBIT', allowsPosting: true },
  
  { code: '1102', name: 'INVERSIONES TEMPORALES', type: 'ASSET', level: 3, parentCode: '11', normalBalance: 'DEBIT' },
  { code: '110201', name: 'Depósitos a Plazo', type: 'ASSET', level: 4, parentCode: '1102', normalBalance: 'DEBIT', allowsPosting: true },
  
  { code: '1103', name: 'CUENTAS POR COBRAR', type: 'ASSET', level: 3, parentCode: '11', normalBalance: 'DEBIT' },
  { code: '110301', name: 'Clientes Locales', type: 'ASSET', level: 4, parentCode: '1103', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '110302', name: 'Provisión Cuentas Incobrables', type: 'ASSET', level: 4, parentCode: '1103', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '110303', name: 'IVA Crédito Fiscal', type: 'ASSET', level: 4, parentCode: '1103', normalBalance: 'DEBIT', allowsPosting: true },
  
  { code: '1104', name: 'INVENTARIOS', type: 'ASSET', level: 3, parentCode: '11', normalBalance: 'DEBIT' },
  { code: '110401', name: 'Mercadería', type: 'ASSET', level: 4, parentCode: '1104', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '110402', name: 'Productos en Proceso', type: 'ASSET', level: 4, parentCode: '1104', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '110403', name: 'Productos Terminados', type: 'ASSET', level: 4, parentCode: '1104', normalBalance: 'DEBIT', allowsPosting: true },
  
  { code: '12', name: 'ACTIVO NO CORRIENTE', type: 'ASSET', level: 2, parentCode: '1', normalBalance: 'DEBIT' },
  { code: '1201', name: 'PROPIEDADES, PLANTA Y EQUIPO', type: 'ASSET', level: 3, parentCode: '12', normalBalance: 'DEBIT' },
  { code: '120101', name: 'Terrenos', type: 'ASSET', level: 4, parentCode: '1201', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '120102', name: 'Edificios', type: 'ASSET', level: 4, parentCode: '1201', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '120103', name: 'Vehículos', type: 'ASSET', level: 4, parentCode: '1201', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '120104', name: 'Equipo de Cómputo', type: 'ASSET', level: 4, parentCode: '1201', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '120105', name: 'Depreciación Acumulada Edificios', type: 'ASSET', level: 4, parentCode: '1201', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '120106', name: 'Depreciación Acumulada Vehículos', type: 'ASSET', level: 4, parentCode: '1201', normalBalance: 'CREDIT', allowsPosting: true },
  
  // 2. PASIVOS
  { code: '2', name: 'PASIVOS', type: 'LIABILITY', level: 1, normalBalance: 'CREDIT' },
  { code: '21', name: 'PASIVO CORRIENTE', type: 'LIABILITY', level: 2, parentCode: '2', normalBalance: 'CREDIT' },
  { code: '2101', name: 'CUENTAS POR PAGAR', type: 'LIABILITY', level: 3, parentCode: '21', normalBalance: 'CREDIT' },
  { code: '210101', name: 'Proveedores', type: 'LIABILITY', level: 4, parentCode: '2101', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210102', name: 'Acreedores Diversos', type: 'LIABILITY', level: 4, parentCode: '2101', normalBalance: 'CREDIT', allowsPosting: true },
  
  { code: '2102', name: 'OBLIGACIONES FISCALES', type: 'LIABILITY', level: 3, parentCode: '21', normalBalance: 'CREDIT' },
  { code: '210201', name: 'IVA Débito Fiscal', type: 'LIABILITY', level: 4, parentCode: '2102', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210202', name: 'Retenciones de Renta', type: 'LIABILITY', level: 4, parentCode: '2102', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210203', name: 'Pago a Cuenta', type: 'LIABILITY', level: 4, parentCode: '2102', normalBalance: 'CREDIT', allowsPosting: true },
  
  { code: '2103', name: 'OBLIGACIONES LABORALES', type: 'LIABILITY', level: 3, parentCode: '21', normalBalance: 'CREDIT' },
  { code: '210301', name: 'Sueldos por Pagar', type: 'LIABILITY', level: 4, parentCode: '2103', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210302', name: 'Vacaciones por Pagar', type: 'LIABILITY', level: 4, parentCode: '2103', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210303', name: 'Aguinaldo por Pagar', type: 'LIABILITY', level: 4, parentCode: '2103', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210304', name: 'ISSS por Pagar', type: 'LIABILITY', level: 4, parentCode: '2103', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210305', name: 'AFP por Pagar', type: 'LIABILITY', level: 4, parentCode: '2103', normalBalance: 'CREDIT', allowsPosting: true },
  
  // 3. PATRIMONIO
  { code: '3', name: 'PATRIMONIO', type: 'EQUITY', level: 1, normalBalance: 'CREDIT' },
  { code: '31', name: 'CAPITAL SOCIAL', type: 'EQUITY', level: 2, parentCode: '3', normalBalance: 'CREDIT' },
  { code: '3101', name: 'Capital Autorizado', type: 'EQUITY', level: 3, parentCode: '31', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '3102', name: 'Reserva Legal', type: 'EQUITY', level: 3, parentCode: '31', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '3103', name: 'Utilidades Retenidas', type: 'EQUITY', level: 3, parentCode: '31', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '3104', name: 'Utilidad del Ejercicio', type: 'EQUITY', level: 3, parentCode: '31', normalBalance: 'CREDIT', allowsPosting: true },
  
  // 4. INGRESOS
  { code: '4', name: 'INGRESOS', type: 'INCOME', level: 1, normalBalance: 'CREDIT' },
  { code: '41', name: 'INGRESOS OPERACIONALES', type: 'INCOME', level: 2, parentCode: '4', normalBalance: 'CREDIT' },
  { code: '4101', name: 'Ventas', type: 'INCOME', level: 3, parentCode: '41', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '4102', name: 'Servicios', type: 'INCOME', level: 3, parentCode: '41', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '4103', name: 'Descuentos sobre Ventas', type: 'INCOME', level: 3, parentCode: '41', normalBalance: 'DEBIT', allowsPosting: true },
  
  { code: '42', name: 'INGRESOS NO OPERACIONALES', type: 'INCOME', level: 2, parentCode: '4', normalBalance: 'CREDIT' },
  { code: '4201', name: 'Ingresos Financieros', type: 'INCOME', level: 3, parentCode: '42', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '4202', name: 'Otros Ingresos', type: 'INCOME', level: 3, parentCode: '42', normalBalance: 'CREDIT', allowsPosting: true },
  
  // 5. GASTOS
  { code: '5', name: 'GASTOS', type: 'EXPENSE', level: 1, normalBalance: 'DEBIT' },
  { code: '51', name: 'COSTO DE VENTAS', type: 'EXPENSE', level: 2, parentCode: '5', normalBalance: 'DEBIT' },
  { code: '5101', name: 'Costo de Mercadería Vendida', type: 'EXPENSE', level: 3, parentCode: '51', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5102', name: 'Costo de Servicios', type: 'EXPENSE', level: 3, parentCode: '51', normalBalance: 'DEBIT', allowsPosting: true },
  
  { code: '52', name: 'GASTOS OPERACIONALES', type: 'EXPENSE', level: 2, parentCode: '5', normalBalance: 'DEBIT' },
  { code: '5201', name: 'Sueldos y Salarios', type: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5202', name: 'Prestaciones Sociales', type: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5203', name: 'Alquileres', type: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5204', name: 'Servicios Básicos', type: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5205', name: 'Depreciación', type: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5206', name: 'Combustibles y Lubricantes', type: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  
  { code: '53', name: 'GASTOS FINANCIEROS', type: 'EXPENSE', level: 2, parentCode: '5', normalBalance: 'DEBIT' },
  { code: '5301', name: 'Intereses Pagados', type: 'EXPENSE', level: 3, parentCode: '53', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5302', name: 'Comisiones Bancarias', type: 'EXPENSE', level: 3, parentCode: '53', normalBalance: 'DEBIT', allowsPosting: true }
];
```

---

## 📁 **FILES TO CREATE/MODIFY**

### **1. Backend - Database Migration**
- `apps/api/prisma/schema.prisma` — Add accounting models
- `apps/api/prisma/migrations/` — Migration for accounting tables
- `apps/api/prisma/seeds/accounting-seed.ts` — El Salvador chart of accounts

### **2. Backend - Accounting Module**
- `apps/api/src/modules/accounting/accounting.module.ts` — Module configuration
- `apps/api/src/modules/accounting/accounting.controller.ts` — REST endpoints
- `apps/api/src/modules/accounting/accounting.service.ts` — Business logic
- `apps/api/src/modules/accounting/dto/` — DTOs for all operations
- `apps/api/src/modules/accounting/accounting.controller.spec.ts` — Tests

### **3. Backend - Integration Points**
- `apps/api/src/modules/dte/dte.service.ts` — Hook for journal entry generation
- `apps/api/src/common/plan-features.ts` — Add accounting plan gating

### **4. Frontend - Accounting Pages**
- `apps/web/src/app/(dashboard)/contabilidad/page.tsx` — Main accounting dashboard
- `apps/web/src/app/(dashboard)/contabilidad/cuentas/page.tsx` — Chart of accounts management
- `apps/web/src/app/(dashboard)/contabilidad/libro-diario/page.tsx` — Journal entries (libro diario)
- `apps/web/src/app/(dashboard)/contabilidad/libro-mayor/page.tsx` — General ledger by account
- `apps/web/src/app/(dashboard)/contabilidad/balance/page.tsx` — Balance sheet
- `apps/web/src/app/(dashboard)/contabilidad/resultados/page.tsx` — Income statement

### **5. Frontend - Components**
- `apps/web/src/components/accounting/` — Reusable accounting components
- `apps/web/src/components/layout/sidebar.tsx` — Add "Contabilidad" menu item

---

## ⚡ **IMPLEMENTATION PLAN**

### **Phase 1: Database Foundation (2-3 hours)**

1. **Update Prisma Schema**
   - Add AccountingAccount, JournalEntry, JournalEntryLine, AccountMappingRule models
   - Follow existing patterns for tenantId and naming conventions
   - Use proper indexes and foreign keys

2. **Create Migration**
   ```bash
   npx prisma migrate dev --name add-accounting-module
   npx prisma generate
   ```

3. **Seed Chart of Accounts**
   - Create seed script for El Salvador standard accounts
   - Include hierarchy relationships (parent/child)
   - Mark system accounts vs user-customizable accounts

### **Phase 2: Backend API (4-5 hours)**

1. **Accounting Service Core Logic**
   ```typescript
   @Injectable()
   export class AccountingService {
     // Chart of Accounts management
     async getChartOfAccounts(tenantId: string)
     async createAccount(tenantId: string, accountData: CreateAccountDto)
     async updateAccount(accountId: string, updates: UpdateAccountDto)
     async deactivateAccount(accountId: string)
     
     // Journal Entries
     async createJournalEntry(tenantId: string, entryData: CreateJournalEntryDto)
     async getJournalEntries(tenantId: string, filters: JournalEntryFilters)
     async getJournalEntry(entryId: string)
     async postJournalEntry(entryId: string)
     async voidJournalEntry(entryId: string, reason: string)
     
     // Balance validation
     async validateJournalEntry(entryId: string): Promise<boolean>
     
     // Reports
     async getTrialBalance(tenantId: string, date: Date)
     async getBalanceSheet(tenantId: string, date: Date)
     async getIncomeStatement(tenantId: string, dateFrom: Date, dateTo: Date)
     async getGeneralLedger(tenantId: string, accountId: string, dateFrom?: Date, dateTo?: Date)
   }
   ```

2. **REST Controller**
   - CRUD endpoints for chart of accounts
   - Journal entries management
   - Financial reports endpoints
   - Proper validation and error handling

3. **DTOs and Validation**
   - CreateAccountDto with proper validation rules
   - CreateJournalEntryDto with line items
   - FilterDTOs for reports with date ranges
   - Validation for debit/credit balance rules

### **Phase 3: Frontend UI (4-5 hours)**

1. **Main Accounting Dashboard**
   ```typescript
   // apps/web/src/app/(dashboard)/contabilidad/page.tsx
   export default function ContabilidadPage() {
     return (
       <div className="space-y-6">
         <DashboardHeader title="Contabilidad" />
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <SummaryCard
             title="Total Activos"
             value={formatCurrency(totalAssets)}
             icon={<TrendingUp />}
           />
           <SummaryCard
             title="Total Pasivos"
             value={formatCurrency(totalLiabilities)}
             icon={<TrendingDown />}
           />
           <SummaryCard
             title="Patrimonio"
             value={formatCurrency(totalEquity)}
             icon={<DollarSign />}
           />
           <SummaryCard
             title="Utilidad del Mes"
             value={formatCurrency(monthlyProfit)}
             icon={<BarChart />}
           />
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <RecentJournalEntries />
           <QuickActions />
         </div>
       </div>
     );
   }
   ```

2. **Chart of Accounts Management**
   - Hierarchical tree view of accounts
   - Add/edit account modal
   - Account activation/deactivation
   - Balance display for each account

3. **Journal Entries Views**
   - Libro Diario (chronological journal)
   - Create new journal entry form
   - Post/void journal entries
   - Entry detail view with line items

4. **Financial Reports**
   - Balance Sheet with proper grouping
   - Income Statement with period comparison
   - General Ledger by account
   - Export to Excel functionality

### **Phase 4: Plan Gating & Integration (1-2 hours)**

1. **Plan Feature Gating**
   ```typescript
   // Update apps/api/src/common/plan-features.ts
   const PLAN_FEATURES = {
     FREE: {
       // ... existing features
       accounting: false,
     },
     PRO: {
       // ... existing features  
       accounting: true,
     },
     ENTERPRISE: {
       // ... existing features
       accounting: true,
     }
   };
   ```

2. **Sidebar Menu Integration**
   - Add "Contabilidad" menu item
   - Show PRO badge for non-PRO tenants
   - Proper navigation structure

3. **Hook for Automatic Journal Generation**
   - Integrate with DTE module
   - Generate entries when invoices are created (Phase 3 task)

---

## ✅ **ACCEPTANCE CRITERIA**

### **Functional Requirements**
1. **Chart of Accounts**
   - ✅ Complete El Salvador plan de cuentas loaded via seed
   - ✅ Hierarchical account structure (parent/child relationships)
   - ✅ Account types properly classified (ASSET, LIABILITY, EQUITY, INCOME, EXPENSE)
   - ✅ CRUD operations for account management
   - ✅ Account activation/deactivation

2. **Journal Entries**
   - ✅ Create journal entries with multiple lines
   - ✅ Automatic validation: total debits = total credits
   - ✅ Entry status: DRAFT → POSTED → VOIDED workflow
   - ✅ Sequential entry numbering per tenant
   - ✅ Reference to source documents (invoices, etc.)

3. **Financial Reports**
   - ✅ Balance Sheet with proper account grouping
   - ✅ Income Statement with date range filtering
   - ✅ General Ledger by account
   - ✅ Trial Balance for verification
   - ✅ Export reports to Excel/PDF

4. **Multi-tenant Isolation**
   - ✅ All accounting data scoped to tenant
   - ✅ Chart of accounts can be customized per tenant
   - ✅ No cross-tenant data leakage

### **Non-Functional Requirements**
1. **Performance**
   - ✅ Reports generate under 10 seconds
   - ✅ Chart of accounts loads under 2 seconds
   - ✅ Pagination for journal entries (50 per page)

2. **Data Integrity**
   - ✅ Automatic balance validation on journal posting
   - ✅ Audit trail for all accounting modifications
   - ✅ Backup and restore procedures

3. **User Experience**
   - ✅ Intuitive navigation between accounting modules
   - ✅ Clear error messages for validation failures
   - ✅ Loading states for all async operations

### **Plan Gating Requirements**
1. **FREE Plan**: No access to accounting module
2. **PRO Plan**: Full accounting functionality
3. **ENTERPRISE Plan**: Full accounting + additional features (future)

---

## 🧪 **TESTING STRATEGY**

### **Unit Tests**
1. **AccountingService Tests**
   ```typescript
   describe('AccountingService', () => {
     it('should create chart of accounts from seed', async () => {
       const accounts = await service.seedChartOfAccounts(tenantId);
       expect(accounts.length).toBeGreaterThan(50);
       expect(accounts.find(a => a.code === '110101')).toBeDefined();
     });
     
     it('should validate journal entry balance', async () => {
       const entry = await service.createJournalEntry(tenantId, validEntryData);
       const isValid = await service.validateJournalEntry(entry.id);
       expect(isValid).toBe(true);
     });
     
     it('should reject unbalanced journal entries', async () => {
       const invalidEntry = { /* unbalanced data */ };
       await expect(service.createJournalEntry(tenantId, invalidEntry))
         .rejects.toThrow('Journal entry must balance');
     });
   });
   ```

2. **Integration Tests**
   - Test journal entry creation flow
   - Test report generation with real data
   - Test account hierarchy relationships

### **Frontend Tests**
1. **Component Tests**
   - Chart of accounts tree rendering
   - Journal entry form validation
   - Report table display

2. **E2E Tests**
   - Complete accounting workflow
   - Plan gating enforcement
   - Export functionality

---

## 📈 **DEPLOYMENT PLAN**

### **Pre-Deployment Checklist**
1. **Database Migration**
   - Run migration in staging environment
   - Verify seed data loads correctly
   - Test rollback procedures

2. **API Testing**
   - All endpoints return expected responses
   - Plan gating works correctly
   - Performance within limits

3. **Frontend Testing**
   - All pages load without errors
   - Navigation works properly
   - Plan badges display correctly

### **Deployment Sequence**
1. **Database Migration** (Azure Portal SQL Query Editor)
   ```sql
   -- Migration will be generated by Prisma
   -- Run the generated migration script
   ```

2. **API Deployment** (v24)
   ```bash
   docker build --no-cache -t facturadorsvacr.azurecr.io/facturador-api:v24 -f apps/api/Dockerfile .
   az acr login --name facturadorsvacr
   docker push facturadorsvacr.azurecr.io/facturador-api:v24
   az webapp config container set --name facturador-api-sv --resource-group facturador-sv-rg --container-image-name facturadorsvacr.azurecr.io/facturador-api:v24
   az webapp restart --name facturador-api-sv --resource-group facturador-sv-rg
   ```

3. **Web Deployment** (v35)
   ```bash
   docker build --no-cache -t facturadorsvacr.azurecr.io/facturador-web:v35 -f apps/web/Dockerfile .
   docker push facturadorsvacr.azurecr.io/facturador-web:v35
   az webapp config container set --name facturador-web-sv --resource-group facturador-sv-rg --container-image-name facturadorsvacr.azurecr.io/facturador-web:v35
   az webapp restart --name facturador-web-sv --resource-group facturador-sv-rg
   ```

### **Post-Deployment Verification**
1. **Health Checks**
   - API health endpoint responds correctly
   - Database connectivity confirmed
   - No startup errors in logs

2. **Functional Testing**
   - Chart of accounts loads with seed data
   - Can create simple journal entry
   - Balance sheet generates without errors
   - Plan gating works (FREE users see upgrade prompt)

---

## 🚨 **CRITICAL LESSONS TO FOLLOW**

### **Financial Data Accuracy**
```typescript
// GOOD - Always use Decimal for financial calculations
totalDebit: Decimal @db.Decimal(15, 2)

// BAD - Never use Float for money
// totalDebit: Float
```

### **Journal Entry Validation**
```typescript
// GOOD - Validate balance before saving
async validateAndCreateJournalEntry(entryData) {
  const totalDebits = entryData.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = entryData.lines.reduce((sum, line) => sum + line.credit, 0);
  
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new BadRequestException('Journal entry must balance: debits must equal credits');
  }
  
  return this.prisma.journalEntry.create({ data: entryData });
}
```

### **Audit Trail**
```typescript
// GOOD - Always track who posted/voided entries
await this.prisma.journalEntry.update({
  where: { id },
  data: { 
    status: 'POSTED', 
    postedAt: new Date(),
    postedBy: userId 
  }
});
```

### **Multi-tenant Isolation**
```typescript
// GOOD - Always filter by tenantId
async getAccountsByTenant(tenantId: string) {
  return this.prisma.accountingAccount.findMany({
    where: { tenantId, isActive: true }
  });
}
```

---

## 🎯 **SUCCESS METRICS**

### **Immediate Success** (Deploy Day)
- ✅ API v24 starts without errors
- ✅ Chart of accounts loads with 80+ standard El Salvador accounts
- ✅ Can create and post a simple journal entry
- ✅ Balance sheet generates with basic structure

### **Functional Success** (After Testing)
- ✅ All CRUD operations work for accounts and journal entries
- ✅ Reports generate correctly (balance sheet, income statement)
- ✅ Plan gating enforced (FREE users see upgrade prompt)
- ✅ Multi-tenant isolation verified

### **Business Success** (Ongoing)
- 📊 **Feature Adoption**: PRO plan users actively use accounting module
- 📈 **Plan Upgrades**: FREE users upgrade to access accounting features
- 💼 **Competitive Advantage**: Only electronic invoicing platform in SV with integrated accounting
- 🎯 **Market Position**: Closer to becoming the leading solution in El Salvador

---

## 📋 **DELIVERABLES**

When you complete this task, provide:

### **1. Implementation Summary**
- List of files created/modified
- Database migration details
- Summary of key features implemented
- Any deviations from the original plan

### **2. Testing Evidence**
- Screenshots of chart of accounts
- Example journal entry creation and posting
- Sample balance sheet and income statement
- Plan gating demonstration (FREE vs PRO)

### **3. Deployment Instructions**
- Step-by-step deployment commands
- Post-deployment verification checklist
- Environment variable changes (if any)

### **4. Documentation Updates**
- Update project context document
- Add accounting module to lessons learned
- Document any new patterns or best practices

---

## 🎭 **ANTI-PATTERNS TO AVOID**

### **❌ Don't Break Financial Rules**
- Never allow unbalanced journal entries (debits ≠ credits)
- Don't use floating-point for financial calculations
- Never allow posting to summary/header accounts

### **❌ Don't Skip Validation**
- Validate account codes follow El Salvador standards
- Ensure proper account type classification
- Verify fiscal year/month calculations

### **❌ Don't Ignore Multi-tenancy**
- All accounting data must be tenant-scoped
- No shared chart of accounts between tenants
- Secure all endpoints with proper authorization

### **❌ Don't Over-Complicate**
- Start with basic reports (balance sheet, income statement)
- Don't implement advanced features like consolidation yet
- Keep the UI intuitive for non-accountants

---

## 🔧 **CURRENT PROJECT CONTEXT**

### **Tech Stack**
- **Backend**: NestJS with Prisma ORM
- **Database**: Azure SQL Database
- **Frontend**: Next.js 14 with shadcn/ui
- **Deployment**: Docker → Azure Container Registry → Azure App Services

### **Azure Resources**
- **Resource Group**: `facturador-sv-rg`
- **API App Service**: `facturador-api-sv`
- **Web App Service**: `facturador-web-sv`
- **Container Registry**: `facturadorsvacr`
- **Current Versions**: API v23, Web v34 → API v24, Web v35

### **Integration Points**
- **Plan Features**: Add to `apps/api/src/common/plan-features.ts`
- **Sidebar Navigation**: Update `apps/web/src/components/layout/sidebar.tsx`
- **DTE Module**: Prepare hooks for automatic journal generation (Phase 3)

---

## ⚡ **GET STARTED**

1. **Read this entire prompt** and understand the accounting requirements
2. **Analyze current Prisma schema** and database patterns
3. **Create implementation plan** with specific database and file changes
4. **Implement the accounting module** following the phases above
5. **Test thoroughly** before marking as complete
6. **Document your changes** and provide evidence

Remember: **Analysis before coding, verification before done!**

This is the foundation for double-entry bookkeeping that will integrate with your DTE system to automatically generate journal entries when invoices are created, positioning your platform as the most complete business solution in El Salvador.

---
*Generated: 2026-02-10 for Facturador Electrónico SV — Módulo Contable Integrado*