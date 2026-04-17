# PHASE 1.1 — SCHEMA PLAN (Compras + Inventario MVP)

**Fecha:** 2026-04-17
**Fase:** 0 → 1.1 (pre-migration)
**Depende de:** `VALIDATION_RESEARCH.md`
**Propósito:** Documentar todas las decisiones de schema antes de tocar `schema.prisma` ni escribir una línea de servicio. Este documento se vuelve el contrato de la Fase 1.2 (implementación).

---

## 0. Decisiones acordadas (locked)

| # | Decisión | Elegido |
|---|---|---|
| D1 | Inventario sobre `CatalogItem` o separado | **Híbrido (C):** `CatalogItem.trackInventory` flag + tabla auxiliar `InventoryState` 1:1 opcional |
| D2 | DTEs recibidos de proveedores | **(B):** Tabla nueva `ReceivedDTE`, relación 1:0..1 con `Purchase` |
| D3 | Entidad proveedor | **(A):** Extender `Cliente` con `isCustomer` + `isSupplier` flags |
| D4 | Costing method MVP | Solo **Promedio Ponderado móvil** (NIIF PYMES 13.18). FIFO futuro, LIFO prohibido |
| D5 | Plan gating | `accounting` + `advanced_reports` → ENTERPRISE only. `inventory_full` / `purchases_capture` / `fiscal_reports_sv` → PRO+ |

---

## 1. Cambios a modelos existentes

### 1.1 `CatalogItem` (extensión mínima)

```prisma
model CatalogItem {
  // ... campos existentes ...
  trackInventory Boolean @default(false) // NUEVO — activa tracking Kardex
  inventoryState InventoryState? // NUEVO — 1:0..1, sólo si trackInventory=true
}
```

**Invariante:** si `trackInventory=false`, `inventoryState` es null. Servicios no-inventario no consultan `inventoryState`. `trackInventory=true` + `inventoryState=null` es estado transitorio permitido (item recién activado, sin compras aún).

**Razón:** mantiene `CatalogItem` limpio; items SERVICE y productos no inventariables no arrastran campos null innecesarios.

### 1.2 `Cliente` (agregar roles)

```prisma
model Cliente {
  // ... campos existentes ...
  isCustomer Boolean @default(true) // NUEVO
  isSupplier Boolean @default(false) // NUEVO
}
```

**Index:** `@@index([tenantId, isSupplier])` y `@@index([tenantId, isCustomer])` para filtros rápidos.

**Compatibilidad:** default garantiza que todos los Cliente existentes siguen siendo customer. Services de compras filtran `where: { tenantId, isSupplier: true }`.

**Servicios afectados:** `ClientesService` expone `findSuppliers()` / `findCustomers()` nuevos. UI tendrá toggle en formulario.

---

## 2. Nuevos modelos Prisma

**Nota de precisión:** siguiendo el patrón del repo, dinero usa `Decimal(12,2)` para montos y `Decimal(15,4)` para costo unitario + cantidades (mayor precisión para cálculo promedio ponderado sin perder centavos por redondeo).

### 2.1 `InventoryState` (estado actual por item)

```prisma
model InventoryState {
  id               String   @id @default(cuid())
  tenantId         String
  catalogItemId    String   @unique // 1:1 con CatalogItem
  currentQty       Decimal  @default(0) @db.Decimal(15, 4) // unidades
  currentAvgCost   Decimal  @default(0) @db.Decimal(15, 4) // USD por unidad
  totalValue       Decimal  @default(0) @db.Decimal(15, 2) // currentQty * currentAvgCost
  reorderLevel     Decimal? @db.Decimal(15, 4) // alerta stock bajo, null = sin alerta
  lastMovementAt   DateTime?
  lastCountedAt    DateTime? // última toma física (F983)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  catalogItem CatalogItem @relation(fields: [catalogItemId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([tenantId, currentQty])
  @@map("inventory_states")
}
```

**Invariante:** `totalValue = round(currentQty * currentAvgCost, 2)`. Recalculado transaccionalmente en cada movimiento.

### 2.2 `InventoryMovement` (Kardex Art. 142-A)

```prisma
model InventoryMovement {
  id                String   @id @default(cuid())
  tenantId          String
  catalogItemId     String
  movementDate      DateTime
  correlativo       Int      // correlativo POR (tenantId, catalogItemId) — Art. 142-A exige numeración consecutiva. Asignado en aplicación dentro de transacción (Prisma no soporta auto-increment compuesto en SQL Server)
  movementType      String   // enum-like: ENTRADA_COMPRA, SALIDA_VENTA, AJUSTE_ENTRADA,
                             // AJUSTE_SALIDA, MERMA, CONSUMO, DEVOLUCION_COMPRA,
                             // DEVOLUCION_VENTA, TOMA_FISICA
  qtyIn             Decimal  @default(0) @db.Decimal(15, 4)
  qtyOut            Decimal  @default(0) @db.Decimal(15, 4)
  unitCost          Decimal  @db.Decimal(15, 4) // costo unitario del movimiento
  totalCost         Decimal  @db.Decimal(15, 2) // qty * unitCost
  balanceQty        Decimal  @db.Decimal(15, 4) // saldo unidades DESPUÉS de este mov
  balanceAvgCost    Decimal  @db.Decimal(15, 4) // promedio ponderado DESPUÉS
  balanceValue      Decimal  @db.Decimal(15, 2) // valor DESPUÉS

  // Referencias Art. 142-A
  documentType      String?  // CCFE, FCFE, FSEE, NC, ND, FACTURA_VENTA, AJUSTE_MANUAL
  documentNumber    String?  // numeroControl
  supplierId        String?  // si es compra
  supplierNationality String? @db.NVarChar(100) // Art. 142-A inciso (b): nacionalidad proveedor

  // Origen del movimiento
  sourceType        String   // PURCHASE, INVOICE, PHYSICAL_COUNT, MANUAL_ADJUSTMENT
  sourceId          String   // id del Purchase / DTE emitido / PhysicalCount / ajuste manual
  purchaseLineItemId String? // si sourceType=PURCHASE
  notes             String?  @db.NVarChar(500)

  createdAt         DateTime @default(now())
  createdBy         String   // userId — auditoría
  journalEntryId    String?  // asiento contable generado, si aplica

  tenant      Tenant       @relation(fields: [tenantId], references: [id])
  catalogItem CatalogItem  @relation(fields: [catalogItemId], references: [id])
  supplier    Cliente?     @relation("SupplierMovements", fields: [supplierId], references: [id])
  journalEntry JournalEntry? @relation(fields: [journalEntryId], references: [id])

  @@unique([tenantId, catalogItemId, correlativo]) // correlativo único por item
  @@index([tenantId, catalogItemId, movementDate])
  @@index([tenantId, movementDate])
  @@index([tenantId, sourceType, sourceId])
  @@map("inventory_movements")
}
```

**Invariantes:**
- `qtyIn > 0 XOR qtyOut > 0` (un movimiento o entra o sale, no ambos).
- `balanceQty`, `balanceAvgCost`, `balanceValue` son **snapshots del estado después** de aplicar este movimiento — permiten generar Kardex histórico sin replay.
- `correlativo` es **autoincremental por `(tenantId, catalogItemId)`** — requisito Art. 142-A (numeración consecutiva en Kardex).
- `journalEntryId` existe si el movimiento generó asiento automático. Un movimiento puede no generarlo (p.ej. ajuste manual sin efecto contable).

**Columnas Art. 142-A cubiertas:** correlativo, movementDate, documentNumber, supplierId (→ nombre), supplierNationality, catalogItem (→ descripción), qtyIn, qtyOut, balanceQty, unitCost, balanceValue, notes (observaciones), movementType (origen).

### 2.3 `ReceivedDTE`

```prisma
model ReceivedDTE {
  id                 String   @id @default(cuid())
  tenantId           String
  tipoDte            String   // 01, 03, 05, 06, 14
  numeroControl      String   // 001-001-00-00000001
  codigoGeneracion   String   // UUID emitido por el proveedor
  selloRecepcion     String?  // sello MH (si el proveedor lo transmitió)
  fhProcesamiento    DateTime? // fecha procesamiento MH (parsed via parseMhDate)
  fhEmision          DateTime  // fecha emisión declarada en el JSON
  emisorNIT          String   // NIT emisor (proveedor)
  emisorNombre       String   @db.NVarChar(250)
  rawPayload         String   @db.NVarChar(Max) // JSON completo tal como llegó
  parsedPayload      String?  @db.NVarChar(Max) // JSON normalizado, post-validación

  // Estado de ingesta
  ingestStatus       String   @default("PENDING") // PENDING, VALIDATED, FAILED, LINKED
  ingestErrors       String?  @db.NVarChar(Max) // JSON array de errores de validación
  ingestSource       String   // JSON_UPLOAD, OCR_PDF, MANUAL_ENTRY

  createdAt          DateTime @default(now())
  createdBy          String

  tenant  Tenant    @relation(fields: [tenantId], references: [id])
  purchase Purchase? // 1:0..1 — un ReceivedDTE puede ser la evidencia de 1 Purchase

  @@unique([tenantId, codigoGeneracion]) // dedupe por codigoGeneracion + tenant
  @@index([tenantId, ingestStatus])
  @@index([tenantId, emisorNIT])
  @@map("received_dtes")
}
```

**Notas:**
- `fhProcesamiento` usa `parseMhDate()` helper (DD/MM/YYYY HH:mm:ss) — regla del proyecto.
- Un DTE recibido puede existir sin Purchase (PENDING/FAILED). Queda huérfano si FAILED.
- `codigoGeneracion` único por tenant evita importar el mismo JSON dos veces.

### 2.4 `Purchase` + `PurchaseLineItem`

```prisma
model Purchase {
  id               String   @id @default(cuid())
  tenantId         String
  purchaseNumber   String   // correlativo interno PC-2026-0001
  supplierId       String   // FK a Cliente donde isSupplier=true
  receivedDteId    String?  @unique // si importada desde DTE recibido
  documentType     String?  // CCFE, FCFE, FSEE, NC, ND (cuando hay DTE); null si manual/paper
  documentNumber   String?  // numeroControl del DTE o del recibo manual

  purchaseDate     DateTime // fecha de la compra declarada
  receiptDate      DateTime? // fecha de recepción efectiva en bodega
  currency         String   @default("USD")

  // Totales (post-parseo / captura manual)
  subtotal         Decimal  @db.Decimal(12, 2)
  ivaAmount        Decimal  @default(0) @db.Decimal(12, 2)
  otherTaxes       Decimal  @default(0) @db.Decimal(12, 2)
  discountAmount   Decimal  @default(0) @db.Decimal(12, 2)
  retentionAmount  Decimal  @default(0) @db.Decimal(12, 2) // retención IVA 1% si aplica
  totalAmount      Decimal  @db.Decimal(12, 2)

  status           String   // DRAFT, VALIDATED, RECEIVED, CANCELLED, INVOICED_BY_SUPPLIER
  paymentMethod    String?  // CAT-017 MH (efectivo, transferencia, etc)

  notes            String?  @db.NVarChar(1000)
  journalEntryId   String?  // asiento generado al recibir
  cancelledAt      DateTime?
  cancelledBy      String?
  cancelReason     String?  @db.NVarChar(500)

  createdAt        DateTime @default(now())
  createdBy        String
  updatedAt        DateTime @updatedAt
  receivedBy       String?  // usuario que confirmó recepción

  tenant       Tenant        @relation(fields: [tenantId], references: [id])
  supplier     Cliente       @relation("SupplierPurchases", fields: [supplierId], references: [id])
  receivedDte  ReceivedDTE?  @relation(fields: [receivedDteId], references: [id])
  journalEntry JournalEntry? @relation("PurchaseJournalEntry", fields: [journalEntryId], references: [id])
  lineItems    PurchaseLineItem[]

  @@unique([tenantId, purchaseNumber])
  @@index([tenantId, supplierId])
  @@index([tenantId, status, purchaseDate])
  @@index([tenantId, documentNumber])
  @@map("purchases")
}

model PurchaseLineItem {
  id             String  @id @default(cuid())
  purchaseId     String
  tenantId       String  // denormalizado para queries y enforcement
  lineNumber     Int
  catalogItemId  String? // null = descripción libre (servicio, consumible no catalogado)
  description    String  @db.NVarChar(500)
  quantity       Decimal @db.Decimal(15, 4)
  unitPrice      Decimal @db.Decimal(15, 4) // precio declarado por proveedor
  discountAmount Decimal @default(0) @db.Decimal(12, 2)
  taxCode        String  // "20" IVA 13%, "10" exento, "30" no sujeto (CAT-015)
  taxAmount      Decimal @default(0) @db.Decimal(12, 2)
  lineTotal      Decimal @db.Decimal(12, 2) // qty*price - discount + tax (si FCF/FSE)
  unitCostPosted Decimal? @db.Decimal(15, 4) // costo real ingresado al inventario
                           // (capitaliza IVA si tipoDte in {01,14})

  qtyExpected    Decimal @db.Decimal(15, 4) // = quantity al crear
  qtyReceived    Decimal @default(0) @db.Decimal(15, 4) // incrementa al recepcionar
  receiptStatus  String  @default("PENDING") // PENDING, PARTIAL, COMPLETE, REJECTED

  purchase      Purchase        @relation(fields: [purchaseId], references: [id], onDelete: Cascade)
  catalogItem   CatalogItem?    @relation(fields: [catalogItemId], references: [id])

  @@unique([purchaseId, lineNumber])
  @@index([tenantId, catalogItemId])
  @@map("purchase_line_items")
}
```

**Invariante costo unitario:**
- Si `purchase.documentType = 'CCFE'` → `unitCostPosted = unitPrice` (IVA va a Crédito Fiscal, no al costo)
- Si `purchase.documentType in ('FCFE', 'FSEE')` → `unitCostPosted = unitPrice + (taxAmount/quantity)` (IVA capitalizado al costo)
- Si `documentType = null` (manual) → `unitCostPosted = unitPrice` por default (usuario puede ajustar)

Esta regla se aplica en `PurchasesService.receivePurchase()` al crear los `InventoryMovement` y recalcular `InventoryState.currentAvgCost`.

### 2.5 `PhysicalCount` + `PhysicalCountDetail`

```prisma
model PhysicalCount {
  id         String   @id @default(cuid())
  tenantId   String
  countDate  DateTime
  fiscalYear Int      // año que cierra (ej: 2026 para cierre 31/12/2026)
  status     String   // DRAFT, IN_PROGRESS, FINALIZED, CANCELLED
  notes      String?  @db.NVarChar(1000)

  finalizedAt DateTime?
  finalizedBy String?

  createdAt  DateTime @default(now())
  createdBy  String

  tenant  Tenant                 @relation(fields: [tenantId], references: [id])
  details PhysicalCountDetail[]

  @@unique([tenantId, fiscalYear]) // 1 F983 finalizado por año fiscal
  @@index([tenantId, status])
  @@map("physical_counts")
}

model PhysicalCountDetail {
  id              String  @id @default(cuid())
  physicalCountId String
  tenantId        String  // denormalizado
  catalogItemId   String
  systemQty       Decimal @db.Decimal(15, 4) // qty según Kardex al momento
  countedQty      Decimal @db.Decimal(15, 4) // qty contada físicamente
  variance        Decimal @db.Decimal(15, 4) // countedQty - systemQty
  unitCost        Decimal @db.Decimal(15, 4) // costo promedio ponderado al momento
  totalValue      Decimal @db.Decimal(15, 2) // countedQty * unitCost

  adjustmentMovementId String? // si se generó InventoryMovement de ajuste
  notes                String? @db.NVarChar(500)

  physicalCount PhysicalCount       @relation(fields: [physicalCountId], references: [id], onDelete: Cascade)
  catalogItem   CatalogItem         @relation(fields: [catalogItemId], references: [id])
  adjustment    InventoryMovement?  @relation("PhysicalCountAdjustment", fields: [adjustmentMovementId], references: [id])

  @@unique([physicalCountId, catalogItemId])
  @@index([tenantId, physicalCountId])
  @@map("physical_count_details")
}
```

**Flujo:** Al finalizar el count, se generan `InventoryMovement`s tipo `TOMA_FISICA` para cuadrar systemQty con countedQty. El XML F983 se arma leyendo `PhysicalCountDetail` del año fiscal.

---

## 3. Relaciones inversas a agregar en modelos existentes

```prisma
model Tenant {
  // ... existentes ...
  inventoryStates     InventoryState[]
  inventoryMovements  InventoryMovement[]
  receivedDtes        ReceivedDTE[]
  purchases           Purchase[]
  physicalCounts      PhysicalCount[]
}

model CatalogItem {
  // ... existentes ...
  inventoryState      InventoryState?
  inventoryMovements  InventoryMovement[]
  purchaseLineItems   PurchaseLineItem[]
  physicalCountDetails PhysicalCountDetail[]
}

model Cliente {
  // ... existentes ...
  purchases           Purchase[]          @relation("SupplierPurchases")
  supplierMovements   InventoryMovement[] @relation("SupplierMovements")
}

model JournalEntry {
  // ... existentes ...
  inventoryMovements  InventoryMovement[]
  purchases           Purchase[]          @relation("PurchaseJournalEntry")
}
```

---

## 4. Cambios a `chart-of-accounts.data.ts` (seed)

Cuentas a agregar (NIIF PYMES + COE comercio El Salvador):

| Código | Nombre | Tipo | Normal |
|---|---|---|---|
| 110101 | Inventario de Mercadería | ACTIVO | DEBIT |
| 110102 | IVA Crédito Fiscal por Cobrar | ACTIVO | DEBIT |
| 110103 | IVA Anticipo a Cuenta 2% | ACTIVO | DEBIT |
| 210101 | Cuentas por Pagar Proveedores | PASIVO | CREDIT |
| 210102 | IVA Retención 1% por Pagar | PASIVO | CREDIT |
| 610101 | Costo de Venta — Mercadería | GASTO | DEBIT |
| 610102 | Costo de Venta — Mermas | GASTO | DEBIT |
| 610103 | Costo de Venta — Ajustes Físicos | GASTO | DEBIT |

Si alguna ya existe (que lo valide el service al reseedar), no sobrescribir — upsert idempotente.

---

## 5. Nuevas `AccountMappingRule` operations

Agregar al seed `default-mappings.data.ts`:

| Operation | Débito | Crédito | Condición |
|---|---|---|---|
| `COMPRA_CCFE` | 110101 Inventario (subtotal) + 110102 IVA Crédito Fiscal (ivaAmount) | 210101 CxP (totalAmount) | documentType=CCFE |
| `COMPRA_FCFE` | 110101 Inventario (totalAmount, IVA capitalizado) | 210101 CxP (totalAmount) | documentType=FCFE |
| `COMPRA_FSEE` | 110101 Inventario (totalAmount) | 210101 CxP (totalAmount) | documentType=FSEE, sin IVA |
| `COMPRA_CON_RETENCION` | (igual que CCFE) | 210102 Ret 1% (retentionAmount) + 210101 CxP (diferencia) | retentionAmount>0 |
| `SALIDA_VENTA_COGS` | 610101 COGS (balanceQty * unitCost) | 110101 Inventario | generado al emitir DTE venta con líneas inventariables |
| `AJUSTE_FISICO_FALTANTE` | 610103 Costo Ajustes | 110101 Inventario | countedQty < systemQty |
| `AJUSTE_FISICO_SOBRANTE` | 110101 Inventario | 410901 Otros Ingresos (a crear si no existe) | countedQty > systemQty — ver O4 §8 |
| `DEVOLUCION_COMPRA` | 210101 CxP | 110101 Inventario | |

**Nota Fase 1.6:** reutilizar `AccountingAutomationService` + agregar método `generateFromPurchase(purchaseId, tenantId, trigger)` y `generateFromInventoryMovement(movementId, ...)` para salidas por venta.

---

## 6. Plan gating — cambios a `apps/api/src/common/plan-features.ts`

### 6.1 Nuevos FeatureCodes

```typescript
export type FeatureCode =
  | 'invoicing'
  | 'accounting'
  | 'catalog'
  | 'recurring_invoices'
  | 'quotes_b2b'
  | 'webhooks'
  | 'api_full'
  | 'advanced_reports'
  | 'ticket_support'
  | 'phone_support'
  | 'logo_branding'
  | 'external_email'
  | 'hacienda_setup_support'
  | 'inventory_basic'      // NUEVO — stock visible en catálogo
  | 'inventory_full'       // NUEVO — compras + kardex + promedio ponderado
  | 'purchases_capture'    // NUEVO — import DTEs JSON/OCR/manual
  | 'fiscal_reports_sv';   // NUEVO — Kardex Art.142-A, F07, F983
```

### 6.2 Redistribución de features por plan

| Feature | FREE | STARTER $19 | PRO $65 | ENT $199 |
|---|:---:|:---:|:---:|:---:|
| `invoicing` | ✅ | ✅ | ✅ | ✅ |
| `catalog` | ✅ | ✅ | ✅ | ✅ |
| `recurring_invoices` | ❌ | ✅ | ✅ | ✅ |
| `quotes_b2b` | ❌ | ❌ | ✅ | ✅ |
| `logo_branding` | ❌ | ✅ | ✅ | ✅ |
| `external_email` | ❌ | ❌ | ✅ | ✅ |
| `hacienda_setup_support` | ❌ | ❌ | ✅ | ✅ |
| `webhooks` | ❌ | ❌ | ❌ | ✅ |
| `api_full` | ❌ | ❌ | ❌ | ✅ |
| `phone_support` | ❌ | ❌ | ❌ | ✅ |
| **`accounting`** | ❌ | ❌ **(cambio: era ✅)** | ❌ **(cambio: era ✅)** | ✅ |
| **`advanced_reports`** | ❌ | ❌ | ❌ **(cambio: era ✅)** | ✅ |
| **`inventory_basic`** | ❌ | ✅ NUEVO | ✅ NUEVO | ✅ NUEVO |
| **`inventory_full`** | ❌ | ❌ | ✅ NUEVO | ✅ NUEVO |
| **`purchases_capture`** | ❌ | ❌ | ✅ NUEVO | ✅ NUEVO |
| **`fiscal_reports_sv`** | ❌ | ❌ | ✅ NUEVO | ✅ NUEVO |

### 6.3 ⚠️ Alerta de migración para Fase 1 (bloqueante)

Antes de aplicar este cambio en producción:

1. **Identificar tenants STARTER/PROFESSIONAL que usan accounting hoy** — query Prisma contra `JournalEntry` agrupado por `tenantId` + join a `Tenant.planCode`.
2. **Decidir grandfathering:** ¿tenants existentes pagando PRO conservan accounting?
   - **Opción 1:** Flag `grandfatheredFeatures: Json` en `Tenant` — sobreescribe PlanFeature.
   - **Opción 2:** Aplicar cambio sin grandfather (riesgo: pérdida de confianza en PRO actuales).
   - **Opción 3:** Migrar manualmente a ENTERPRISE los afectados con descuento promocional.
3. **Comunicación:** preparar email + deprecation notice ≥ 30 días antes del deploy.
4. **Landing page:** actualizar `apps/web/app/(marketing)/pricing/page.tsx` con nueva matriz.

**Este PHASE_1_1_SCHEMA_PLAN NO incluye la implementación de la migración de gating — debe ser un sub-proyecto separado con su propio plan.**

### 6.4 Nuevos endpoints gated

Cada controller nuevo lleva:

```typescript
@UseGuards(PlanFeatureGuard)
@RequireFeature('inventory_full') // o la que aplique
```

| Controller | Feature gate |
|---|---|
| `PurchasesController` (todo) | `purchases_capture` |
| `InventoryMovementController` (listar Kardex) | `inventory_full` |
| `InventoryStateController` (ver stock actual) | `inventory_basic` |
| `PhysicalCountController` | `inventory_full` |
| `FiscalReportsController` (F07, F983, Kardex XLS) | `fiscal_reports_sv` |

---

## 7. Nuevas dependencias

**`apps/api/package.json`:**
```json
"dependencies": {
  "exceljs": "^4.4.0",  // Kardex + F983 Excel/XML export
  "xml2js": "^0.6.2"    // opcional, si parseo de DTE XML (JSON suficiente por ahora)
}
```

**`apps/web`:** ninguna nueva dependencia obligatoria. React Query + Zustand + shadcn ya están.

**OCR:** decisión Fase 2 (Tesseract.js local vs Claude Vision API vs Azure Form Recognizer). **No bloqueante para schema.**

---

## 8. Decisiones abiertas (no bloqueantes para Fase 1.2)

| # | Decisión | Dónde se resuelve |
|---|---|---|
| O1 | Grandfathering de tenants PRO con accounting actual | Pre-deploy Fase 4 |
| O2 | Manual de Anexos F07 v14: mapping exacto de casillas de compras | Fase 3 (F07) |
| O3 | OCR engine para DTE PDF → JSON | Fase 2 |
| O4 | Cuenta contable para "sobrante de inventario" | Fase 1.6 (mapping rules) |
| O5 | Soporte de fracciones de unidad (Decimal 15,4) ¿es suficiente? | Revisar con Wellnest en Fase 2 |
| O6 | Integración con cierre de período fiscal (bloquear movimientos pasados) | Post-MVP |

---

## 9. Plan de migración Prisma (Fase 1.2)

**Orden de operaciones:**

1. Backup schema actual (`schema.prisma.backup-YYYYMMDD`).
2. Agregar nuevos modelos + campos al schema (sin eliminar nada).
3. `npx prisma format` → `npx prisma validate`.
4. **Azure SQL:** agregar IP a firewall (temporal). Verificar `DATABASE_URL` apunta a staging primero.
5. `npx prisma migrate dev --name add_purchases_inventory_module` (genera SQL diff).
6. Revisar SQL generado — asegurar índices y constraints correctos.
7. `npx prisma db push` en staging.
8. Ejecutar seed de `chart-of-accounts` + `default-mappings` (idempotente).
9. Correr tests unitarios en staging.
10. Remover IP del firewall.
11. Producción: **sólo después de validar Fase 1 completa end-to-end en staging**.

**No modificar `plan-features.ts` en esta fase** — el gating se aplica en Fase 1.5 (controllers) y la migración de tenants existentes es sub-proyecto aparte.

---

## 10. Checklist de aprobación para avanzar a Fase 1.2

- [ ] José revisa decisiones D1-D5 (§0)
- [ ] José confirma cambios a modelos existentes (§1) — mínimos e inofensivos
- [ ] José valida campos de Purchase / InventoryMovement (§2)
- [ ] José aprueba cuentas contables nuevas (§4)
- [ ] José aprueba gating matrix (§6) **y** acepta que la migración de tenants existentes es sub-proyecto aparte
- [ ] José aprueba dependencia `exceljs` (§7)
- [ ] José prioriza decisiones abiertas (§8) — cuáles son bloqueantes, cuáles no

Una vez aprobado, pasamos a Fase 1.2: implementación del schema en `schema.prisma` y migración.
