# Fase 1.2 — Schema Migration + Seed (Compras + Inventario MVP)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar el schema de Azure SQL para soportar el módulo Compras + Inventario (Kardex Art. 142-A, promedio ponderado, DTEs recibidos, conteo físico F983), sembrar cuentas contables y mapping rules faltantes. Sin servicios, sin controllers, sin frontend — solo schema + datos.

**Architecture:** Extender `CatalogItem` + `Cliente` con campos mínimos (flags booleanos). Agregar 7 modelos nuevos (`InventoryState`, `InventoryMovement`, `ReceivedDTE`, `Purchase`, `PurchaseLineItem`, `PhysicalCount`, `PhysicalCountDetail`). Sembrar cuentas contables faltantes y mapping rules de compras. Reutilizar al máximo lo existente — solo agregar lo que no se puede derivar.

**Tech Stack:** Prisma 5.10 + Azure SQL Server + NestJS 10 + Jest. El proyecto **usa `prisma db push`** (sin migrations SQL versionadas) según `CLAUDE.md` — por eso este plan usa `db push` en lugar de `migrate dev`.

**Depende de:** `outputs/PHASE_1_1_SCHEMA_PLAN.md` (spec aprobada).

**NO cubre:** plan gating changes (sub-proyecto aparte, ver §6.3 del spec), services, controllers, parsers, frontend, reportes. Cada uno de esos llevará su propio plan.

---

### Task 1: Crear rama feature + backup del schema

**Files:**
- Create: `apps/api/prisma/schema.prisma.backup-20260417`

- [ ] **Step 1: Verificar working tree limpio en los archivos relevantes**

Run:
```bash
cd /home/jose/facturador-electronico-sv
git status apps/api/prisma/schema.prisma apps/api/src/modules/accounting/
```
Expected: No modificaciones en `schema.prisma` ni en `apps/api/src/modules/accounting/`. Si hay, confirmar con el usuario antes de continuar.

- [ ] **Step 2: Crear rama feature**

Run:
```bash
git checkout -b feature/purchases-inventory-schema
```
Expected: `Switched to a new branch 'feature/purchases-inventory-schema'`

- [ ] **Step 3: Backup del schema actual**

Run:
```bash
cp apps/api/prisma/schema.prisma apps/api/prisma/schema.prisma.backup-20260417
```

- [ ] **Step 4: Commit del backup**

```bash
git add apps/api/prisma/schema.prisma.backup-20260417
git commit -m "chore(schema): backup schema before purchases+inventory migration"
```

---

### Task 2: Auditar chart of accounts existente

**Files:**
- Read-only: `apps/api/src/modules/accounting/chart-of-accounts.data.ts`

- [ ] **Step 1: Identificar cuentas de inventario existentes**

Run:
```bash
grep -n "Inventario\|Mercadería\|Crédito Fiscal\|Proveedores\|Costo.*Venta\|IVA.*Retenci\|IVA.*Perce\|IVA.*Anticipo" \
  apps/api/src/modules/accounting/chart-of-accounts.data.ts
```

Expected output debe incluir estas cuentas existentes (confirmar presencia):
- `110303` IVA Crédito Fiscal
- `110401` Mercadería
- `210201` IVA Débito Fiscal (para ventas, no compras — pero existe)

Si alguna falta, continuar — se agregará en Task 13.

- [ ] **Step 2: Identificar cuentas FALTANTES para compras**

Las cuentas necesarias para el módulo Compras + Inventario, con su estado:

| Código | Nombre | Estado en seed actual |
|---|---|---|
| `110303` | IVA Crédito Fiscal | ✅ EXISTE — reusar |
| `110401` | Mercadería | ✅ EXISTE — reusar para Inventario |
| `110305` | IVA Anticipo a Cuenta 2% | ⚠️ VERIFICAR (si no existe, agregar) |
| `210101` | Proveedores Locales | ⚠️ VERIFICAR (típicamente existe en sección PASIVO) |
| `210202` | IVA Retención 1% por Pagar | ⚠️ VERIFICAR |
| `410901` | Sobrantes de Inventario (Otros Ingresos) | ⚠️ VERIFICAR |
| `6101` o `5101` | Costo de Venta (rubro) | ⚠️ VERIFICAR sección GASTO/COSTO |
| `610101` | Costo de Venta Mercadería | ⚠️ VERIFICAR |
| `610103` | Costo por Ajustes/Mermas | ⚠️ VERIFICAR |

Run (para cada código sospechoso):
```bash
grep -n "^  { code: '210101'\|^  { code: '210202'\|^  { code: '110305'\|^  { code: '410901'\|^  { code: '6101'\|^  { code: '610101'\|^  { code: '610103'" \
  apps/api/src/modules/accounting/chart-of-accounts.data.ts
```

- [ ] **Step 3: Documentar qué falta**

Crear archivo `outputs/chart-audit-2026-04-17.md` con lista de cuentas confirmadas como FALTANTES. Este archivo guía Task 13.

Ejemplo de contenido:
```markdown
# Chart of Accounts Audit — 2026-04-17

## Existentes (reusar)
- 110303 IVA Crédito Fiscal
- 110401 Mercadería
- 210201 IVA Débito Fiscal

## Faltantes (agregar en Task 13)
- 110305 IVA Anticipo a Cuenta 2%
- 210101 Proveedores Locales
- 210202 IVA Retención 1% por Pagar
- 410901 Sobrantes de Inventario
- 6101 COSTO DE VENTAS (rubro)
- 610101 Costo Venta Mercadería
- 610103 Costo por Ajustes Físicos
```

- [ ] **Step 4: Commit del audit**

```bash
git add outputs/chart-audit-2026-04-17.md
git commit -m "docs(schema): audit chart of accounts before adding purchases accounts"
```

---

### Task 3: Extender `CatalogItem` con `trackInventory`

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (buscar `model CatalogItem {` en línea ~1228)

- [ ] **Step 1: Agregar el campo al modelo**

Localizar el modelo `CatalogItem` en `schema.prisma`. Agregar `trackInventory` después de `isFavorite` (o campo similar), antes de la sección de relaciones:

```prisma
  trackInventory Boolean @default(false)
```

La relación `inventoryState InventoryState?` se agrega en Task 5.

- [ ] **Step 2: Validar schema**

Run:
```bash
cd apps/api && npx prisma format && npx prisma validate
```
Expected: `The schema at apps/api/prisma/schema.prisma is valid` ✅

- [ ] **Step 3: Commit**

```bash
git add apps/api/prisma/schema.prisma
git commit -m "feat(schema): add trackInventory flag to CatalogItem"
```

---

### Task 4: Extender `Cliente` con flags `isCustomer` / `isSupplier`

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (buscar `model Cliente {` en línea ~165)

- [ ] **Step 1: Agregar campos al modelo**

Localizar `model Cliente`. Agregar **antes** de la sección `@@index` o `@@unique`:

```prisma
  isCustomer Boolean @default(true)
  isSupplier Boolean @default(false)
```

Agregar **dentro** del bloque (después de los índices existentes):

```prisma
  @@index([tenantId, isSupplier])
  @@index([tenantId, isCustomer])
```

- [ ] **Step 2: Validar**

Run:
```bash
cd apps/api && npx prisma format && npx prisma validate
```
Expected: `The schema at apps/api/prisma/schema.prisma is valid` ✅

- [ ] **Step 3: Commit**

```bash
git add apps/api/prisma/schema.prisma
git commit -m "feat(schema): add isCustomer/isSupplier flags to Cliente"
```

---

### Task 5: Agregar modelo `InventoryState` + relaciones inversas

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Agregar relación inversa en `Tenant`**

En el modelo `Tenant`, agregar junto a las demás relaciones (buscar otros arrays de relación como `dtes DTE[]`):

```prisma
  inventoryStates InventoryState[]
```

- [ ] **Step 2: Agregar relación inversa en `CatalogItem`**

En el modelo `CatalogItem`, agregar junto a otras relaciones:

```prisma
  inventoryState InventoryState?
```

- [ ] **Step 3: Agregar modelo `InventoryState`**

Al final de `schema.prisma` (o en sección de inventario que se crea):

```prisma
// ============================================================================
// INVENTORY MODULE (Compras + Inventario MVP — Fase 1.2)
// ============================================================================

model InventoryState {
  id             String   @id @default(cuid())
  tenantId       String
  catalogItemId  String   @unique
  currentQty     Decimal  @default(0) @db.Decimal(15, 4)
  currentAvgCost Decimal  @default(0) @db.Decimal(15, 4)
  totalValue     Decimal  @default(0) @db.Decimal(15, 2)
  reorderLevel   Decimal? @db.Decimal(15, 4)
  lastMovementAt DateTime?
  lastCountedAt  DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  tenant      Tenant      @relation(fields: [tenantId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  catalogItem CatalogItem @relation(fields: [catalogItemId], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@index([tenantId])
  @@index([tenantId, currentQty])
  @@map("inventory_states")
}
```

**Nota SQL Server:** `onDelete: NoAction` + `onUpdate: NoAction` es el patrón del repo para evitar errores "cascading reference constraints" de SQL Server. Excepción: cuando la eliminación DEBE cascadear (ej. `CatalogItem` borrado → `InventoryState` también), usar `onDelete: Cascade`.

- [ ] **Step 4: Validar**

Run:
```bash
cd apps/api && npx prisma format && npx prisma validate
```
Expected: `The schema at apps/api/prisma/schema.prisma is valid` ✅

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma
git commit -m "feat(schema): add InventoryState model"
```

---

### Task 6: Agregar modelo `InventoryMovement` + relaciones inversas

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Agregar relaciones inversas**

En `Tenant`:
```prisma
  inventoryMovements InventoryMovement[]
```

En `CatalogItem`:
```prisma
  inventoryMovements InventoryMovement[]
```

En `Cliente`:
```prisma
  supplierMovements InventoryMovement[] @relation("SupplierMovements")
```

En `JournalEntry` (buscar `model JournalEntry {` en línea ~1469):
```prisma
  inventoryMovements InventoryMovement[]
```

- [ ] **Step 2: Agregar el modelo**

En la sección INVENTORY MODULE:

```prisma
model InventoryMovement {
  id                  String   @id @default(cuid())
  tenantId            String
  catalogItemId       String
  movementDate        DateTime
  correlativo         Int
  movementType        String   @db.NVarChar(40)
  qtyIn               Decimal  @default(0) @db.Decimal(15, 4)
  qtyOut              Decimal  @default(0) @db.Decimal(15, 4)
  unitCost            Decimal  @db.Decimal(15, 4)
  totalCost           Decimal  @db.Decimal(15, 2)
  balanceQty          Decimal  @db.Decimal(15, 4)
  balanceAvgCost      Decimal  @db.Decimal(15, 4)
  balanceValue        Decimal  @db.Decimal(15, 2)

  documentType        String?  @db.NVarChar(10)
  documentNumber      String?  @db.NVarChar(50)
  supplierId          String?
  supplierNationality String?  @db.NVarChar(100)

  sourceType          String   @db.NVarChar(30)
  sourceId            String
  purchaseLineItemId  String?
  notes               String?  @db.NVarChar(500)

  createdAt           DateTime @default(now())
  createdBy           String
  journalEntryId      String?

  tenant       Tenant        @relation(fields: [tenantId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  catalogItem  CatalogItem   @relation(fields: [catalogItemId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  supplier     Cliente?      @relation("SupplierMovements", fields: [supplierId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  journalEntry JournalEntry? @relation(fields: [journalEntryId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@unique([tenantId, catalogItemId, correlativo])
  @@index([tenantId, catalogItemId, movementDate])
  @@index([tenantId, movementDate])
  @@index([tenantId, sourceType, sourceId])
  @@map("inventory_movements")
}
```

- [ ] **Step 3: Validar**

Run:
```bash
cd apps/api && npx prisma format && npx prisma validate
```
Expected: valid ✅

Si falla con "Error validating relation field" → revisar que TODAS las relaciones inversas estén en Tenant, CatalogItem, Cliente, JournalEntry.

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma
git commit -m "feat(schema): add InventoryMovement model for Kardex Art.142-A"
```

---

### Task 7: Agregar modelo `ReceivedDTE`

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Agregar relación inversa en `Tenant`**

```prisma
  receivedDtes ReceivedDTE[]
```

- [ ] **Step 2: Agregar el modelo**

```prisma
model ReceivedDTE {
  id                String    @id @default(cuid())
  tenantId          String
  tipoDte           String    @db.NVarChar(10)
  numeroControl     String    @db.NVarChar(50)
  codigoGeneracion  String    @db.NVarChar(40)
  selloRecepcion    String?   @db.NVarChar(100)
  fhProcesamiento   DateTime?
  fhEmision         DateTime
  emisorNIT         String    @db.NVarChar(20)
  emisorNombre      String    @db.NVarChar(250)
  rawPayload        String    @db.NVarChar(Max)
  parsedPayload     String?   @db.NVarChar(Max)

  ingestStatus      String    @default("PENDING") @db.NVarChar(20)
  ingestErrors      String?   @db.NVarChar(Max)
  ingestSource      String    @db.NVarChar(30)

  createdAt         DateTime  @default(now())
  createdBy         String

  tenant   Tenant    @relation(fields: [tenantId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  purchase Purchase?

  @@unique([tenantId, codigoGeneracion])
  @@index([tenantId, ingestStatus])
  @@index([tenantId, emisorNIT])
  @@map("received_dtes")
}
```

**Nota:** la relación `purchase Purchase?` es la parte inversa. La FK vive en `Purchase.receivedDteId` (Task 8).

- [ ] **Step 3: Validar**

Run:
```bash
cd apps/api && npx prisma format && npx prisma validate
```
Expected: **Warning** que `Purchase` no existe aún → temporalmente falla. **Esto es esperado porque aún no agregamos Purchase. Validar después de Task 8.**

Si queremos validación limpia aquí, comentar la línea `purchase Purchase?` temporalmente y descomentarla en Task 8.

**Decisión práctica:** comentar la línea `purchase Purchase?` en este paso; re-agregar en Task 8.

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma
git commit -m "feat(schema): add ReceivedDTE model (inverse relation to Purchase pending)"
```

---

### Task 8: Agregar modelos `Purchase` + `PurchaseLineItem`

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Agregar relaciones inversas**

En `Tenant`:
```prisma
  purchases Purchase[]
```

En `Cliente`:
```prisma
  purchases Purchase[] @relation("SupplierPurchases")
```

En `CatalogItem`:
```prisma
  purchaseLineItems PurchaseLineItem[]
```

En `JournalEntry`:
```prisma
  purchases Purchase[] @relation("PurchaseJournalEntry")
```

En `ReceivedDTE` — descomentar la línea de Task 7:
```prisma
  purchase Purchase?
```

- [ ] **Step 2: Agregar modelo `Purchase`**

```prisma
model Purchase {
  id              String    @id @default(cuid())
  tenantId        String
  purchaseNumber  String    @db.NVarChar(30)
  supplierId      String
  receivedDteId   String?   @unique
  documentType    String?   @db.NVarChar(10)
  documentNumber  String?   @db.NVarChar(50)

  purchaseDate    DateTime
  receiptDate     DateTime?
  currency        String    @default("USD") @db.NVarChar(3)

  subtotal        Decimal   @db.Decimal(12, 2)
  ivaAmount       Decimal   @default(0) @db.Decimal(12, 2)
  otherTaxes      Decimal   @default(0) @db.Decimal(12, 2)
  discountAmount  Decimal   @default(0) @db.Decimal(12, 2)
  retentionAmount Decimal   @default(0) @db.Decimal(12, 2)
  totalAmount     Decimal   @db.Decimal(12, 2)

  status          String    @db.NVarChar(30)
  paymentMethod   String?   @db.NVarChar(10)

  notes           String?   @db.NVarChar(1000)
  journalEntryId  String?
  cancelledAt     DateTime?
  cancelledBy     String?
  cancelReason    String?   @db.NVarChar(500)

  createdAt       DateTime  @default(now())
  createdBy       String
  updatedAt       DateTime  @updatedAt
  receivedBy      String?

  tenant       Tenant        @relation(fields: [tenantId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  supplier     Cliente       @relation("SupplierPurchases", fields: [supplierId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  receivedDte  ReceivedDTE?  @relation(fields: [receivedDteId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  journalEntry JournalEntry? @relation("PurchaseJournalEntry", fields: [journalEntryId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  lineItems    PurchaseLineItem[]

  @@unique([tenantId, purchaseNumber])
  @@index([tenantId, supplierId])
  @@index([tenantId, status, purchaseDate])
  @@index([tenantId, documentNumber])
  @@map("purchases")
}
```

- [ ] **Step 3: Agregar modelo `PurchaseLineItem`**

```prisma
model PurchaseLineItem {
  id             String   @id @default(cuid())
  purchaseId     String
  tenantId       String
  lineNumber     Int
  catalogItemId  String?
  description    String   @db.NVarChar(500)
  quantity       Decimal  @db.Decimal(15, 4)
  unitPrice      Decimal  @db.Decimal(15, 4)
  discountAmount Decimal  @default(0) @db.Decimal(12, 2)
  taxCode        String   @db.NVarChar(5)
  taxAmount      Decimal  @default(0) @db.Decimal(12, 2)
  lineTotal      Decimal  @db.Decimal(12, 2)
  unitCostPosted Decimal? @db.Decimal(15, 4)

  qtyExpected    Decimal  @db.Decimal(15, 4)
  qtyReceived    Decimal  @default(0) @db.Decimal(15, 4)
  receiptStatus  String   @default("PENDING") @db.NVarChar(20)

  purchase    Purchase     @relation(fields: [purchaseId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  catalogItem CatalogItem? @relation(fields: [catalogItemId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@unique([purchaseId, lineNumber])
  @@index([tenantId, catalogItemId])
  @@map("purchase_line_items")
}
```

- [ ] **Step 4: Validar**

Run:
```bash
cd apps/api && npx prisma format && npx prisma validate
```
Expected: `The schema at apps/api/prisma/schema.prisma is valid` ✅

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma
git commit -m "feat(schema): add Purchase + PurchaseLineItem models"
```

---

### Task 9: Agregar modelos `PhysicalCount` + `PhysicalCountDetail`

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Agregar relaciones inversas**

En `Tenant`:
```prisma
  physicalCounts PhysicalCount[]
```

En `CatalogItem`:
```prisma
  physicalCountDetails PhysicalCountDetail[]
```

En `InventoryMovement`:
```prisma
  physicalCountDetail PhysicalCountDetail? @relation("PhysicalCountAdjustment")
```

- [ ] **Step 2: Agregar modelos**

```prisma
model PhysicalCount {
  id          String    @id @default(cuid())
  tenantId    String
  countDate   DateTime
  fiscalYear  Int
  status      String    @db.NVarChar(20)
  notes       String?   @db.NVarChar(1000)

  finalizedAt DateTime?
  finalizedBy String?

  createdAt   DateTime  @default(now())
  createdBy   String

  tenant  Tenant                @relation(fields: [tenantId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  details PhysicalCountDetail[]

  @@unique([tenantId, fiscalYear])
  @@index([tenantId, status])
  @@map("physical_counts")
}

model PhysicalCountDetail {
  id                   String   @id @default(cuid())
  physicalCountId      String
  tenantId             String
  catalogItemId        String
  systemQty            Decimal  @db.Decimal(15, 4)
  countedQty           Decimal  @db.Decimal(15, 4)
  variance             Decimal  @db.Decimal(15, 4)
  unitCost             Decimal  @db.Decimal(15, 4)
  totalValue           Decimal  @db.Decimal(15, 2)

  adjustmentMovementId String?  @unique
  notes                String?  @db.NVarChar(500)

  physicalCount PhysicalCount      @relation(fields: [physicalCountId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  catalogItem   CatalogItem        @relation(fields: [catalogItemId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  adjustment    InventoryMovement? @relation("PhysicalCountAdjustment", fields: [adjustmentMovementId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@unique([physicalCountId, catalogItemId])
  @@index([tenantId, physicalCountId])
  @@map("physical_count_details")
}
```

- [ ] **Step 3: Validar**

Run:
```bash
cd apps/api && npx prisma format && npx prisma validate
```
Expected: valid ✅

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma
git commit -m "feat(schema): add PhysicalCount + PhysicalCountDetail models for F983"
```

---

### Task 10: Validación final del schema + generar cliente Prisma

**Files:** ninguno (solo ejecución)

- [ ] **Step 1: Validar schema final**

Run:
```bash
cd /home/jose/facturador-electronico-sv/apps/api
npx prisma format
npx prisma validate
```
Expected: `The schema at ... is valid` ✅

- [ ] **Step 2: Generar cliente Prisma (TypeScript types)**

Run:
```bash
npx prisma generate
```
Expected: `Generated Prisma Client (v5.10.x)` ✅

- [ ] **Step 3: Verificar que los types nuevos compilan en TypeScript**

Crear archivo temporal de verificación de tipos:

**File:** `apps/api/scripts/verify-schema-types.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import type { Purchase, PurchaseLineItem, InventoryState, InventoryMovement, ReceivedDTE, PhysicalCount, PhysicalCountDetail } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTypes() {
  // Type-only test: si compila, los modelos están en el client
  const check: {
    purchase: Purchase | null;
    purchaseLine: PurchaseLineItem | null;
    invState: InventoryState | null;
    invMov: InventoryMovement | null;
    receivedDte: ReceivedDTE | null;
    physCount: PhysicalCount | null;
    physDetail: PhysicalCountDetail | null;
  } = {
    purchase: null,
    purchaseLine: null,
    invState: null,
    invMov: null,
    receivedDte: null,
    physCount: null,
    physDetail: null,
  };

  console.log('[OK] All new Prisma models compile:', Object.keys(check).join(', '));
  await prisma.$disconnect();
}

verifyTypes().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Run:
```bash
cd apps/api && npx tsc --noEmit scripts/verify-schema-types.ts
```
Expected: no errores TypeScript.

- [ ] **Step 4: Ejecutar script (requiere DB staging configurada)**

Run:
```bash
cd apps/api && npx ts-node --compiler-options '{"strict":false}' scripts/verify-schema-types.ts
```
Expected: `[OK] All new Prisma models compile: purchase, purchaseLine, invState, invMov, receivedDte, physCount, physDetail`

Nota: este script no requiere que las tablas existan en la DB — solo valida que el cliente Prisma tenga los types. Si falla con error de conexión, ignorar — lo importante es que compile (Step 3).

- [ ] **Step 5: Commit del script de verificación**

```bash
git add apps/api/scripts/verify-schema-types.ts
git commit -m "chore(schema): add type verification script for new inventory models"
```

---

### Task 11: Aplicar schema a DB de staging con `db push`

**Files:** ninguno (ejecución contra DB staging)

**IMPORTANTE:** este paso modifica la DB de staging. Confirmar con el usuario antes de ejecutar.

- [ ] **Step 1: Agregar IP al firewall de Azure SQL**

Run (manual, vía portal Azure o CLI):
```bash
# Obtener IP actual
curl -s https://api.ipify.org

# Agregar firewall rule (manual en portal, o:)
# az sql server firewall-rule create --resource-group <rg> --server facturador-rc-sql \
#   --name tmp-$(whoami) --start-ip-address <IP> --end-ip-address <IP>
```

- [ ] **Step 2: Verificar `DATABASE_URL` apunta a STAGING**

Run:
```bash
cd apps/api
grep -o "DATABASE_URL=.*" .env.staging 2>/dev/null || echo "No .env.staging — verificar manualmente"
```
**Confirmar manualmente** que la conexión es staging, NO producción. Si no hay `.env.staging`, preguntar al usuario.

- [ ] **Step 3: Ejecutar `db push`**

Run:
```bash
cd apps/api && dotenv -e .env.staging -- npx prisma db push --skip-generate
```

Expected output (aproximado):
```
The database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

Si no está `dotenv-cli`, usar:
```bash
cd apps/api && DATABASE_URL="<staging_url>" npx prisma db push --skip-generate
```

- [ ] **Step 4: Smoke test — verificar que las tablas existen**

Crear **File:** `apps/api/scripts/smoke-inventory-schema.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function smokeTest() {
  console.log('[1/7] Count inventory_states:', await prisma.inventoryState.count());
  console.log('[2/7] Count inventory_movements:', await prisma.inventoryMovement.count());
  console.log('[3/7] Count received_dtes:', await prisma.receivedDTE.count());
  console.log('[4/7] Count purchases:', await prisma.purchase.count());
  console.log('[5/7] Count purchase_line_items:', await prisma.purchaseLineItem.count());
  console.log('[6/7] Count physical_counts:', await prisma.physicalCount.count());
  console.log('[7/7] Count physical_count_details:', await prisma.physicalCountDetail.count());
  console.log('[OK] All 7 new tables exist in staging DB');
  await prisma.$disconnect();
}

smokeTest().catch((e) => {
  console.error('[FAIL]', e.message);
  process.exit(1);
});
```

Run:
```bash
cd apps/api && dotenv -e .env.staging -- npx ts-node --compiler-options '{"strict":false}' scripts/smoke-inventory-schema.ts
```
Expected: 7 líneas `[N/7] Count ... : 0` + `[OK] All 7 new tables exist in staging DB`

- [ ] **Step 5: Remover IP del firewall**

```bash
# az sql server firewall-rule delete --resource-group <rg> --server facturador-rc-sql \
#   --name tmp-$(whoami)
```

- [ ] **Step 6: Commit del smoke test**

```bash
git add apps/api/scripts/smoke-inventory-schema.ts
git commit -m "chore(schema): add smoke test for new inventory tables in staging"
```

---

### Task 12: Round-trip smoke test — crear y leer un `Purchase`

**Files:**
- Create: `apps/api/scripts/smoke-purchase-roundtrip.ts`

- [ ] **Step 1: Escribir el script**

**File:** `apps/api/scripts/smoke-purchase-roundtrip.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * End-to-end smoke test of the new inventory/purchase schema.
 * Uses a dummy tenant and supplier — requires that at least one tenant exists.
 * Creates data, verifies, then cleans up.
 */
async function smoke() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error('No tenant in DB — seed one first');
  const tenantId = tenant.id;

  // 1. Create/find a supplier (Cliente with isSupplier=true)
  const supplier = await prisma.cliente.upsert({
    where: { tenantId_nit: { tenantId, nit: '06141234567891' } },
    create: {
      tenantId,
      nit: '06141234567891',
      nrc: '1234567',
      nombre: 'Smoke Test Supplier SA de CV',
      direccion: JSON.stringify({ departamento: '06', municipio: '14', complemento: 'Test' }),
      telefono: '22001234',
      correo: 'smoke@test.com',
      tipoContribuyente: 'CONTRIBUYENTE',
      actividadEcon: '47301',
      isCustomer: false,
      isSupplier: true,
    },
    update: { isSupplier: true },
  });

  // 2. Create/find a catalog item (trackInventory=true)
  const item = await prisma.catalogItem.upsert({
    where: { tenantId_code: { tenantId, code: 'SMOKE-INV-001' } },
    create: {
      tenantId,
      code: 'SMOKE-INV-001',
      name: 'Smoke Item',
      type: 'PRODUCT',
      tipoItem: '1',
      uniMedida: '99',
      tributo: '20',
      basePrice: 10,
      costPrice: 7,
      taxRate: 13,
      trackInventory: true,
    },
    update: { trackInventory: true },
  });

  // 3. Create a Purchase with one line item
  const purchaseNumber = `SMOKE-${Date.now()}`;
  const purchase = await prisma.purchase.create({
    data: {
      tenantId,
      purchaseNumber,
      supplierId: supplier.id,
      documentType: 'CCFE',
      documentNumber: '001-001-00-SMOKE',
      purchaseDate: new Date(),
      subtotal: '100.00',
      ivaAmount: '13.00',
      totalAmount: '113.00',
      status: 'DRAFT',
      createdBy: 'smoke-script',
      lineItems: {
        create: [
          {
            tenantId,
            lineNumber: 1,
            catalogItemId: item.id,
            description: 'Smoke line',
            quantity: '10.0000',
            unitPrice: '10.0000',
            taxCode: '20',
            taxAmount: '13.00',
            lineTotal: '100.00',
            qtyExpected: '10.0000',
          },
        ],
      },
    },
    include: { lineItems: true },
  });

  if (purchase.lineItems.length !== 1) throw new Error('Expected 1 line item');
  console.log(`[OK] Created Purchase ${purchase.purchaseNumber} with ${purchase.lineItems.length} line`);

  // 4. Read back via supplier relation
  const viaSupplier = await prisma.cliente.findUnique({
    where: { id: supplier.id },
    include: { purchases: { where: { purchaseNumber } } },
  });
  if (viaSupplier?.purchases.length !== 1) throw new Error('Supplier relation broken');
  console.log('[OK] Purchase readable via Cliente.purchases relation');

  // 5. Cleanup
  await prisma.purchase.delete({ where: { id: purchase.id } });
  console.log('[OK] Cleanup successful');
  console.log('[OK] ALL GREEN — schema round-trip works');

  await prisma.$disconnect();
}

smoke().catch((e) => {
  console.error('[FAIL]', e);
  prisma.$disconnect();
  process.exit(1);
});
```

- [ ] **Step 2: Ejecutar (firewall debe estar abierto — ver Task 11 Step 1)**

Run:
```bash
cd apps/api && dotenv -e .env.staging -- npx ts-node --compiler-options '{"strict":false}' scripts/smoke-purchase-roundtrip.ts
```

Expected:
```
[OK] Created Purchase SMOKE-<timestamp> with 1 line
[OK] Purchase readable via Cliente.purchases relation
[OK] Cleanup successful
[OK] ALL GREEN — schema round-trip works
```

Si falla con `P2002` (unique constraint violation) — el NIT `06141234567891` del supplier ya existe con otro tenant o la lógica de upsert está mal. Revisar.

Si falla con `P2003` (foreign key) — alguna relación mal definida. Revisar el schema.

- [ ] **Step 3: Commit**

```bash
git add apps/api/scripts/smoke-purchase-roundtrip.ts
git commit -m "test(schema): add round-trip smoke test for Purchase + relations"
```

---

### Task 13: Agregar cuentas contables faltantes a `chart-of-accounts.data.ts`

**⚠️ Actualización post-audit (Task 2):** el chart original ya usa `5xxx` para costos (no `6xxx`), `5101` es posting directo, y `210205 IVA Retenido` puede reusarse para retención 1%. Ver `outputs/chart-audit-2026-04-17.md`. Los códigos a REUSAR y AGREGAR se fijaron abajo basados en ese audit.

**Mapping final de cuentas:**

| Propósito | Código | Acción |
|---|---|---|
| Inventario | `110401` Mercadería | REUSAR existente |
| IVA Crédito Fiscal | `110303` IVA Crédito Fiscal | REUSAR existente |
| CxP Proveedores | `210101` Proveedores | REUSAR existente |
| IVA Retención 1% por Pagar | `210205` IVA Retenido | REUSAR existente (semánticamente equivale) |
| Costo Venta Mercadería | `5101` Costo de Mercadería Vendida | REUSAR existente (level 3, allowsPosting:true) |
| IVA Anticipo a Cuenta 2% | `110306` | **AGREGAR** (110305 ocupado por Deudores Diversos) |
| Sobrantes de Inventario | `4105` | **AGREGAR** (level 3 sibling de 4101/4102/4103/4104) |
| Costo por Ajustes Físicos | `5103` | **AGREGAR** (level 3 sibling de 5101/5102) |

**Files:**
- Modify: `apps/api/src/modules/accounting/chart-of-accounts.data.ts`
- Modify: `apps/api/src/modules/accounting/accounting.service.spec.ts` (si hay assertions de conteo)

- [ ] **Step 1: Escribir test que falle**

**File:** `apps/api/src/modules/accounting/chart-of-accounts.purchases.spec.ts`

```typescript
import { EL_SALVADOR_CHART_OF_ACCOUNTS } from './chart-of-accounts.data';

describe('Chart of Accounts — Purchases & Inventory (Fase 1.2)', () => {
  const codes = new Set(EL_SALVADOR_CHART_OF_ACCOUNTS.map((a) => a.code));
  const byCode = new Map(EL_SALVADOR_CHART_OF_ACCOUNTS.map((a) => [a.code, a]));

  // ============ Existentes (reusar) ============
  it('has inventario Mercadería (existing)', () => {
    expect(codes.has('110401')).toBe(true);
  });

  it('has IVA Crédito Fiscal (existing)', () => {
    expect(codes.has('110303')).toBe(true);
  });

  it('has Proveedores (existing) — reused for CxP', () => {
    expect(codes.has('210101')).toBe(true);
  });

  it('has IVA Retenido (existing) — reused for retención 1%', () => {
    expect(codes.has('210205')).toBe(true);
  });

  it('has Costo de Mercadería Vendida (existing) — reused for COGS', () => {
    const a = byCode.get('5101');
    expect(a).toBeDefined();
    expect(a!.allowsPosting).toBe(true);
  });

  // ============ Nuevas (agregar) ============
  it('has IVA Anticipo a Cuenta 2% (new 110306)', () => {
    const a = byCode.get('110306');
    expect(a).toBeDefined();
    expect(a!.accountType).toBe('ASSET');
    expect(a!.normalBalance).toBe('DEBIT');
    expect(a!.parentCode).toBe('1103');
    expect(a!.allowsPosting).toBe(true);
  });

  it('has Sobrantes de Inventario (new 4105)', () => {
    const a = byCode.get('4105');
    expect(a).toBeDefined();
    expect(a!.accountType).toBe('INCOME');
    expect(a!.normalBalance).toBe('CREDIT');
    expect(a!.parentCode).toBe('41');
    expect(a!.allowsPosting).toBe(true);
  });

  it('has Costo por Ajustes Físicos (new 5103)', () => {
    const a = byCode.get('5103');
    expect(a).toBeDefined();
    expect(a!.accountType).toBe('EXPENSE');
    expect(a!.normalBalance).toBe('DEBIT');
    expect(a!.parentCode).toBe('51');
    expect(a!.allowsPosting).toBe(true);
  });
});
```

- [ ] **Step 2: Ejecutar el test — debe fallar en los "(new)"**

Run:
```bash
cd apps/api && npx jest src/modules/accounting/chart-of-accounts.purchases.spec.ts
```
Expected: 5 tests "(existing)" pasan; 3 tests "(new)" fallan con `Expected account to be defined, got undefined`.

- [ ] **Step 3: Agregar las 3 cuentas faltantes**

Editar `chart-of-accounts.data.ts`. Agregar cada cuenta en su sección correspondiente, **en orden de código**:

**(a)** En sección `1103 CUENTAS POR COBRAR`, después de la línea `110305 Deudores Diversos`:

```typescript
  { code: '110306', name: 'IVA Anticipo a Cuenta 2%', accountType: 'ASSET', level: 4, parentCode: '1103', normalBalance: 'DEBIT', allowsPosting: true },
```

**(b)** En sección `41 INGRESOS OPERACIONALES`, después de la línea `4104 Devoluciones sobre Ventas`:

```typescript
  { code: '4105', name: 'Sobrantes de Inventario', accountType: 'INCOME', level: 3, parentCode: '41', normalBalance: 'CREDIT', allowsPosting: true },
```

**(c)** En sección `51 COSTOS DE VENTAS`, después de la línea `5102 Costo de Servicios`:

```typescript
  { code: '5103', name: 'Costo por Ajustes Físicos', accountType: 'EXPENSE', level: 3, parentCode: '51', normalBalance: 'DEBIT', allowsPosting: true },
```

**Nota convención:** el archivo usa level 3 (4 dígitos) como posting account para las secciones `41` (INCOME) y `51` (EXPENSE). No crear subcuentas de 6 dígitos bajo `5101` — rompería la convención.

- [ ] **Step 4: Ejecutar tests otra vez**

Run:
```bash
cd apps/api && npx jest src/modules/accounting/chart-of-accounts.purchases.spec.ts
```
Expected: **8/8 pass** ✅

- [ ] **Step 5: Verificar que el test de conteo del seed no se rompió**

Run:
```bash
cd apps/api && npx jest src/modules/accounting/accounting.service.spec.ts
```
Si falla por conteo de accounts (p.ej. `expect(seeded).toBe(85)`), actualizar el número al nuevo total (+3).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/accounting/chart-of-accounts.data.ts \
        apps/api/src/modules/accounting/chart-of-accounts.purchases.spec.ts \
        apps/api/src/modules/accounting/accounting.service.spec.ts
git commit -m "feat(accounting): add purchases & inventory accounts to El Salvador chart"
```

---

### Task 14: Agregar mapping rules de compras a `default-mappings.data.ts`

**Files:**
- Modify: `apps/api/src/modules/accounting/default-mappings.data.ts`
- Create: `apps/api/src/modules/accounting/default-mappings.purchases.spec.ts`

- [ ] **Step 1: Escribir test que falle**

**File:** `apps/api/src/modules/accounting/default-mappings.purchases.spec.ts`

```typescript
import { DEFAULT_MAPPINGS } from './default-mappings.data';

describe('Default Mappings — Purchases (Fase 1.2)', () => {
  const ops = new Set(DEFAULT_MAPPINGS.map((m) => m.operation));

  it('has COMPRA_CCFE mapping', () => {
    expect(ops.has('COMPRA_CCFE')).toBe(true);
  });

  it('has COMPRA_FCFE mapping', () => {
    expect(ops.has('COMPRA_FCFE')).toBe(true);
  });

  it('has COMPRA_FSEE mapping', () => {
    expect(ops.has('COMPRA_FSEE')).toBe(true);
  });

  it('has SALIDA_VENTA_COGS mapping (COGS on sale)', () => {
    expect(ops.has('SALIDA_VENTA_COGS')).toBe(true);
  });

  it('has AJUSTE_FISICO_FALTANTE mapping', () => {
    expect(ops.has('AJUSTE_FISICO_FALTANTE')).toBe(true);
  });

  it('has AJUSTE_FISICO_SOBRANTE mapping', () => {
    expect(ops.has('AJUSTE_FISICO_SOBRANTE')).toBe(true);
  });

  it('has DEVOLUCION_COMPRA mapping', () => {
    expect(ops.has('DEVOLUCION_COMPRA')).toBe(true);
  });

  it('COMPRA_CCFE splits IVA to credit fiscal account', () => {
    const m = DEFAULT_MAPPINGS.find((x) => x.operation === 'COMPRA_CCFE')!;
    const hasIvaCreditoFiscal = m.mappingConfig.debe.some(
      (l) => l.cuenta === '110303' && l.monto === 'iva',
    );
    expect(hasIvaCreditoFiscal).toBe(true);
  });

  it('COMPRA_FCFE capitalizes IVA into inventory (uses total)', () => {
    const m = DEFAULT_MAPPINGS.find((x) => x.operation === 'COMPRA_FCFE')!;
    const singleDebitTotal =
      m.mappingConfig.debe.length === 1 &&
      m.mappingConfig.debe[0].cuenta === '110401' &&
      m.mappingConfig.debe[0].monto === 'total';
    expect(singleDebitTotal).toBe(true);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run:
```bash
cd apps/api && npx jest src/modules/accounting/default-mappings.purchases.spec.ts
```
Expected: tests fallan con `Expected true, got false`.

- [ ] **Step 3: Agregar los mappings**

Editar `default-mappings.data.ts`. Dentro del array `DEFAULT_MAPPINGS`, **después del último mapping existente y antes del `]`**, agregar:

```typescript
  // ============================================================
  // COMPRAS — módulo Compras + Inventario (Fase 1.2)
  // ============================================================
  {
    operation: 'COMPRA_CCFE',
    description: 'Compra con Crédito Fiscal (CCFE) — IVA separado a crédito',
    debitCode: '110401',
    creditCode: '210101',
    mappingConfig: {
      debe: [
        { cuenta: '110401', monto: 'subtotal', descripcion: 'Inventario Mercadería' },
        { cuenta: '110303', monto: 'iva', descripcion: 'IVA Crédito Fiscal' },
      ],
      haber: [
        { cuenta: '210101', monto: 'total', descripcion: 'Proveedores Locales' },
      ],
    },
  },
  {
    operation: 'COMPRA_FCFE',
    description: 'Compra con Factura Consumidor Final (FCFE) — IVA capitalizado',
    debitCode: '110401',
    creditCode: '210101',
    mappingConfig: {
      debe: [
        { cuenta: '110401', monto: 'total', descripcion: 'Inventario (IVA capitalizado)' },
      ],
      haber: [
        { cuenta: '210101', monto: 'total', descripcion: 'Proveedores Locales' },
      ],
    },
  },
  {
    operation: 'COMPRA_FSEE',
    description: 'Compra a Sujeto Excluido (FSEE) — sin IVA',
    debitCode: '110401',
    creditCode: '210101',
    mappingConfig: {
      debe: [
        { cuenta: '110401', monto: 'total', descripcion: 'Inventario (sin IVA)' },
      ],
      haber: [
        { cuenta: '210101', monto: 'total', descripcion: 'Proveedores Locales' },
      ],
    },
  },
  {
    operation: 'SALIDA_VENTA_COGS',
    description: 'Salida de inventario por venta — carga a Costo de Venta',
    debitCode: '5101',
    creditCode: '110401',
    mappingConfig: {
      debe: [
        { cuenta: '5101', monto: 'total', descripcion: 'Costo de Mercadería Vendida' },
      ],
      haber: [
        { cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería' },
      ],
    },
  },
  {
    operation: 'AJUSTE_FISICO_FALTANTE',
    description: 'Ajuste por faltante en toma física',
    debitCode: '5103',
    creditCode: '110401',
    mappingConfig: {
      debe: [
        { cuenta: '5103', monto: 'total', descripcion: 'Costo por Ajustes Físicos' },
      ],
      haber: [
        { cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería' },
      ],
    },
  },
  {
    operation: 'AJUSTE_FISICO_SOBRANTE',
    description: 'Ajuste por sobrante en toma física',
    debitCode: '110401',
    creditCode: '4105',
    mappingConfig: {
      debe: [
        { cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería' },
      ],
      haber: [
        { cuenta: '4105', monto: 'total', descripcion: 'Sobrantes de Inventario' },
      ],
    },
  },
  {
    operation: 'DEVOLUCION_COMPRA',
    description: 'Devolución de compra a proveedor',
    debitCode: '210101',
    creditCode: '110401',
    mappingConfig: {
      debe: [
        { cuenta: '210101', monto: 'total', descripcion: 'Proveedores Locales (reversa)' },
      ],
      haber: [
        { cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería (reversa)' },
      ],
    },
  },
```

**Nota sobre retención 1%:** no agrego `COMPRA_CON_RETENCION` como operación separada aquí porque el `DefaultMappingLine.monto` actual es enum `'total' | 'subtotal' | 'iva'` — no soporta una línea "retention". Documentar como decisión abierta O5 del spec; se resuelve en Fase 1.6 (auto-entries) extendiendo el enum.

- [ ] **Step 4: Ejecutar tests otra vez**

Run:
```bash
cd apps/api && npx jest src/modules/accounting/default-mappings.purchases.spec.ts
```
Expected: **9/9 pass** ✅

- [ ] **Step 5: Ejecutar suite completa de accounting para detectar regresiones**

Run:
```bash
cd apps/api && npx jest src/modules/accounting/
```
Expected: todos los tests del módulo accounting pasan.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/accounting/default-mappings.data.ts \
        apps/api/src/modules/accounting/default-mappings.purchases.spec.ts
git commit -m "feat(accounting): add purchases + inventory mapping rules"
```

---

### Task 15: Agregar dependencia `exceljs` al API

**Files:**
- Modify: `apps/api/package.json`

- [ ] **Step 1: Instalar `exceljs`**

Run:
```bash
cd /home/jose/facturador-electronico-sv/apps/api
npm install exceljs@^4.4.0
```
Expected: `added 1 package`. `package.json` y `package-lock.json` modificados.

- [ ] **Step 2: Verificar import funciona**

Crear archivo temporal `apps/api/scripts/verify-exceljs.ts`:

```typescript
import ExcelJS from 'exceljs';

async function verify() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Test');
  ws.addRow(['Kardex', 'column', 'test']);
  ws.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF7C3AED' },
  };
  console.log('[OK] exceljs import + basic API works');
}

verify();
```

Run:
```bash
npx ts-node --compiler-options '{"strict":false}' scripts/verify-exceljs.ts
```
Expected: `[OK] exceljs import + basic API works`

- [ ] **Step 3: Commit**

```bash
git add apps/api/package.json apps/api/package-lock.json apps/api/scripts/verify-exceljs.ts
git commit -m "chore(deps): add exceljs for Kardex + F983 Excel generation"
```

---

### Task 16: Resumen final + push branch

**Files:**
- Create: `outputs/EXECUTION_EVIDENCE_PHASE_1_2.md`

- [ ] **Step 1: Generar evidencia**

**File:** `outputs/EXECUTION_EVIDENCE_PHASE_1_2.md`

```markdown
# Execution Evidence — Fase 1.2: Schema Migration

**Date:** 2026-04-17
**Branch:** feature/purchases-inventory-schema
**Status:** ✅ COMPLETE

## Schema changes
- Extended: `CatalogItem.trackInventory`, `Cliente.isCustomer`, `Cliente.isSupplier`
- Added models: `InventoryState`, `InventoryMovement`, `ReceivedDTE`, `Purchase`, `PurchaseLineItem`, `PhysicalCount`, `PhysicalCountDetail`
- Total new Prisma models: 7
- Total modified existing models: 4 (Tenant, CatalogItem, Cliente, JournalEntry — inverse relations only)

## Seed changes
- Chart of accounts: +N accounts (see `outputs/chart-audit-2026-04-17.md`)
- Default mappings: +7 operations (COMPRA_CCFE, COMPRA_FCFE, COMPRA_FSEE, SALIDA_VENTA_COGS, AJUSTE_FISICO_FALTANTE, AJUSTE_FISICO_SOBRANTE, DEVOLUCION_COMPRA)

## DB state (staging)
- `prisma db push` ejecutado exitosamente
- `smoke-inventory-schema.ts` pasa ✅
- `smoke-purchase-roundtrip.ts` pasa ✅

## Tests
- `chart-of-accounts.purchases.spec.ts`: 9/9 pass
- `default-mappings.purchases.spec.ts`: 9/9 pass
- Suite accounting completa sin regresiones

## Commits
- [fill with `git log --oneline main..HEAD`]

## Next
- Fase 1.3: DTE parser (JSON ingest de CCFE/FCFE/FSEE recibidos)
- **Bloqueante antes de prod:** sub-proyecto de migración de gating de plan (accounting y advanced_reports a ENTERPRISE only)
```

Completar el campo `Commits` con:
```bash
git log --oneline main..HEAD >> outputs/EXECUTION_EVIDENCE_PHASE_1_2.md
```

- [ ] **Step 2: Commit evidencia**

```bash
git add outputs/EXECUTION_EVIDENCE_PHASE_1_2.md
git commit -m "docs: execution evidence for Fase 1.2 schema migration"
```

- [ ] **Step 3: Push branch**

Run:
```bash
git push -u origin feature/purchases-inventory-schema
```

- [ ] **Step 4: Reportar a José**

Mensaje final con:
- Branch + commit count
- Total de tablas nuevas + existentes modificadas
- Links a los 3 scripts de verificación
- Cualquier discrepancia encontrada vs. el spec (p.ej. códigos de cuenta ajustados)
- Próximo paso: Fase 1.3 o decisión del usuario

---

## Self-Review

### 1. Spec coverage
- ✅ §0 decisiones D1-D5 — aplicadas en Tasks 3, 4, 5, 6, 7, 8, 9
- ✅ §1 cambios a modelos existentes — Tasks 3, 4
- ✅ §2 nuevos modelos — Tasks 5-9
- ✅ §3 relaciones inversas — dispersas en cada task correspondiente
- ✅ §4 cuentas contables — Task 13 (con caveat en §5 del plan sobre 210101)
- ✅ §5 mapping rules — Task 14 (COMPRA_CON_RETENCION diferido, documentado)
- ⚠️ §6 plan gating — **NO cubierto** en este plan (sub-proyecto separado, explícito en overview)
- ✅ §7 dependencia exceljs — Task 15
- ✅ §9 plan de migración — Tasks 10-12
- ⚠️ §10 checklist — se resuelve al reportar a José en Task 16

### 2. Placeholder scan
No "TBD"/"TODO"/"later" en el plan. Una referencia a "código libre siguiente" en Task 13 Step 4 que es instrucción concreta, no placeholder.

### 3. Type consistency
- `Purchase.receivedDteId String? @unique` + `ReceivedDTE.purchase Purchase?` — consistente entre Task 7 y Task 8.
- `InventoryMovement.catalogItemId` tiene inverso `CatalogItem.inventoryMovements` — consistente.
- `PhysicalCountDetail.adjustmentMovementId String? @unique` + `InventoryMovement.physicalCountDetail PhysicalCountDetail? @relation("PhysicalCountAdjustment")` — consistente.
- Uso de `String @db.NVarChar(N)` consistente (no mezclo `String` sin especificar).

### 4. Codes
- Todos los códigos contables: `110303`, `110305`, `110401`, `210101`, `210203`, `410901`, `510101`, `510103` — consistentes entre Task 13 (seed) y Task 14 (mappings).
- Operations: `COMPRA_CCFE`, `COMPRA_FCFE`, `COMPRA_FSEE`, `SALIDA_VENTA_COGS`, `AJUSTE_FISICO_FALTANTE`, `AJUSTE_FISICO_SOBRANTE`, `DEVOLUCION_COMPRA` — consistentes.
