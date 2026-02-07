# Prisma Schemas - Facturador Electrónico SV
**Archivo de referencia para Claude Code**

Este archivo contiene todos los esquemas Prisma necesarios para las 3 fases del proyecto. Se deben aplicar progresivamente según el plan de trabajo.

---

## 🔧 FASE 0: Esquemas para Issues de QA

### Security Fields para User Model (Issue #14)
```prisma
// Agregar estos campos al modelo User existente
model User {
  // ... campos existentes ...
  
  // Campos de seguridad para bloqueo de cuenta
  failedLoginAttempts Int       @default(0)
  accountLockedUntil  DateTime?
  lastFailedLoginAt   DateTime?
  
  // ... relaciones existentes ...
}
```

### Password Reset Token Model (Issue #13)
```prisma
model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique @default(uuid())
  expiresAt DateTime
  used      Boolean  @default(false)
  usedAt    DateTime?
  createdAt DateTime @default(now())
  
  @@index([token])
  @@index([userId])
  @@index([expiresAt])
  @@map("password_reset_tokens")
}

// Agregar relación en User model:
// passwordResetTokens PasswordResetToken[]
```

**Migración:**
```bash
npx prisma migrate dev --name add-login-security-and-password-reset
```

---

## 📦 FASE 1: Catálogo de Inventarios + Migración de Datos

### Core Catalog Models

```prisma
// Enums necesarios
enum ItemType {
  PRODUCT
  SERVICE
}

enum DiscountTierType {
  ALL_UNITS      // Precio único al superar umbral
  INCREMENTAL    // Precio escalonado por tramo
}

enum ImportJobStatus {
  PENDING
  PARSING
  VALIDATING
  DEDUPLICATING
  IMPORTING
  COMPLETED
  FAILED
  CANCELLED
}

// Categorías jerárquicas
model Category {
  id          String    @id @default(uuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  description String?
  parentId    String?
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Category[] @relation("CategoryHierarchy")
  items       CatalogItem[]
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@unique([tenantId, name])
  @@index([tenantId, isActive])
  @@map("categories")
}

// Unidades de medida (con códigos DTE CAT-014)
model UnitOfMeasure {
  id          String        @id @default(uuid())
  tenantId    String?       // Null para unidades estándar del sistema
  tenant      Tenant?       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String        // "Unidad", "Kilogramo", "Hora"
  abbreviation String       // "UND", "KG", "HR"
  dteCode     String        // Código de CAT-014 del MH
  isDefault   Boolean       @default(false)
  isActive    Boolean       @default(true)
  items       CatalogItem[]
  createdAt   DateTime      @default(now())
  
  @@unique([tenantId, dteCode])
  @@unique([tenantId, name])
  @@map("units_of_measure")
}

// Perfiles fiscales (mapeo a CAT-015)
model TaxProfile {
  id              String        @id @default(uuid())
  tenantId        String
  tenant          Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name            String        // "IVA 13%", "Exento", "No Sujeto"
  taxCode         String        // Código de CAT-015: "20" para IVA 13%
  taxRate         Decimal       @db.Decimal(5,2) // 13.00, 0.00
  isDefault       Boolean       @default(false)
  isActive        Boolean       @default(true)
  items           CatalogItem[]
  createdAt       DateTime      @default(now())
  
  @@unique([tenantId, name])
  @@index([tenantId, isDefault])
  @@map("tax_profiles")
}

// Ítem del catálogo (productos y servicios)
model CatalogItem {
  id                 String    @id @default(uuid())
  tenantId           String
  tenant             Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  type               ItemType
  code               String    // SKU interno de la empresa
  barcode            String?   // EAN/UPC
  name               String
  description        String?   @db.VarChar(500)
  tipoItem           Int       @default(1) // CAT-011 MH: 1=Bienes, 2=Servicios, 3=Ambos
  
  // Precios
  basePrice          Decimal   @db.Decimal(12,2)
  costPrice          Decimal?  @db.Decimal(12,2)
  
  // Fiscal
  taxProfileId       String?
  taxProfile         TaxProfile? @relation(fields: [taxProfileId], references: [id], onDelete: SetNull)
  
  // Inventario (solo para productos)
  isTrackedInventory Boolean   @default(false)
  quantityOnHand     Decimal   @default(0) @db.Decimal(12,4)
  minStockLevel      Decimal?  @db.Decimal(12,4)
  maxStockLevel      Decimal?  @db.Decimal(12,4)
  reorderPoint       Decimal?  @db.Decimal(12,4)
  
  // Unidad de medida
  baseUnitId         String?
  baseUnit           UnitOfMeasure? @relation(fields: [baseUnitId], references: [id], onDelete: SetNull)
  
  // Categorización
  categoryId         String?
  category           Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  
  // UX optimizations
  isActive           Boolean   @default(true)
  isFavorite         Boolean   @default(false)
  usageCount         Int       @default(0) // Para ordenar por más usado
  lastUsedAt         DateTime?
  
  // Metadata
  customFields       Json?     // Para campos adicionales por tenant
  
  // Relaciones
  priceListEntries   PriceListEntry[]
  volumeDiscountTiers VolumeDiscountTier[]
  
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  
  @@unique([tenantId, code])
  @@index([tenantId, type])
  @@index([tenantId, isActive])
  @@index([tenantId, usageCount(sort: Desc)]) // Para "más usados"
  @@index([tenantId, isFavorite])
  @@map("catalog_items")
}

// Listas de precios (mayoreo, retail, VIP, etc.)
model PriceList {
  id          String    @id @default(uuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String    // "Lista Mayoreo", "Precio VIP"
  description String?
  isDefault   Boolean   @default(false)
  isActive    Boolean   @default(true)
  entries     PriceListEntry[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@unique([tenantId, name])
  @@index([tenantId, isDefault])
  @@map("price_lists")
}

model PriceListEntry {
  id            String      @id @default(uuid())
  priceListId   String
  priceList     PriceList   @relation(fields: [priceListId], references: [id], onDelete: Cascade)
  catalogItemId String
  catalogItem   CatalogItem @relation(fields: [catalogItemId], references: [id], onDelete: Cascade)
  price         Decimal     @db.Decimal(12,2)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@unique([priceListId, catalogItemId])
  @@map("price_list_entries")
}

// Descuentos por volumen
model VolumeDiscountTier {
  id            String            @id @default(uuid())
  catalogItemId String
  catalogItem   CatalogItem       @relation(fields: [catalogItemId], references: [id], onDelete: Cascade)
  minQuantity   Decimal           @db.Decimal(12,4)
  maxQuantity   Decimal?          @db.Decimal(12,4)
  type          DiscountTierType  @default(ALL_UNITS)
  discountPrice Decimal           @db.Decimal(12,2)
  createdAt     DateTime          @default(now())
  
  @@index([catalogItemId])
  @@map("volume_discount_tiers")
}
```

### Data Import Models

```prisma
model ImportJob {
  id              String          @id @default(uuid())
  tenantId        String
  tenant          Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  entityType      String          // "clients", "products", "historical_invoices"
  fileName        String
  filePath        String          // Azure Blob Storage URL
  status          ImportJobStatus @default(PENDING)
  totalRows       Int             @default(0)
  processedRows   Int             @default(0)
  successRows     Int             @default(0)
  errorRows       Int             @default(0)
  errorDetails    Json?           // Array de errores con línea y mensaje
  startedAt       DateTime?
  completedAt     DateTime?
  createdBy       String
  createdByUser   User            @relation(fields: [createdBy], references: [id])
  createdAt       DateTime        @default(now())
  
  @@index([tenantId, status])
  @@index([createdAt])
  @@map("import_jobs")
}

// Para marcar registros importados (facilita rollback)
// Agregar a modelos existentes: Client, CatalogItem, etc.
// importJobId String?
// importJob   ImportJob? @relation(fields: [importJobId], references: [id], onDelete: SetNull)
```

**Migración:**
```bash
npx prisma migrate dev --name add-catalog-and-import-system
```

---

## 📅 FASE 2: Facturación Recurrente + Módulo Contable

### Recurring Invoice Models

```prisma
enum RecurringInterval {
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  QUARTERLY
  SEMIANNUAL
  ANNUAL
  CUSTOM
}

enum DayOfMonthPolicy {
  EXACT       // Usar día exacto
  LAST_DAY    // Último día del mes
  FIRST_DAY   // Primer día hábil del mes
}

enum RecurringTemplateStatus {
  DRAFT
  ACTIVE
  PAUSED
  SUSPENDED_ERROR
  CANCELLED
}

enum GenerationMode {
  AUTO_SEND      // Genera y transmite a DGII automáticamente
  AUTO_DRAFT     // Genera como borrador para revisión
  MANUAL_TRIGGER // Solo envía recordatorio
}

model RecurringInvoiceTemplate {
  id                    String                     @id @default(uuid())
  tenantId              String
  tenant                Tenant                     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Cliente
  clientId              String
  client                Client                     @relation(fields: [clientId], references: [id], onDelete: Restrict)
  
  // Configuración de scheduling
  interval              RecurringInterval          @default(MONTHLY)
  intervalCount         Int                        @default(1) // Cada N intervalos
  anchorDay             Int?                       // Día del mes (1-31)
  dayOfMonthPolicy      DayOfMonthPolicy          @default(EXACT)
  customCronExpression  String?                    // Para intervalos CUSTOM
  
  // Fechas de control
  startDate             DateTime
  endDate               DateTime?
  nextGenerationDate    DateTime
  lastGenerationDate    DateTime?
  
  // Modo de operación
  generationMode        GenerationMode            @default(AUTO_DRAFT)
  
  // Líneas de ítem del template
  lineItems             RecurringInvoiceLineItem[]
  
  // Estado y control de errores
  status                RecurringTemplateStatus   @default(ACTIVE)
  consecutiveFailures   Int                       @default(0)
  suspendAfterFailures  Int                       @default(3)
  lastErrorMessage      String?
  
  // Notificaciones
  notifyBeforeGeneration Boolean                  @default(false)
  notificationDaysBefore Int?
  
  // Historial de facturas generadas
  generatedInvoices     RecurringInvoiceHistory[]
  
  createdAt             DateTime                  @default(now())
  updatedAt             DateTime                  @updatedAt
  
  @@index([tenantId, status])
  @@index([tenantId, nextGenerationDate])
  @@index([tenantId, status, nextGenerationDate])
  @@map("recurring_invoice_templates")
}

model RecurringInvoiceLineItem {
  id         String                    @id @default(uuid())
  templateId String
  template   RecurringInvoiceTemplate  @relation(fields: [templateId], references: [id], onDelete: Cascade)
  
  // Item del catálogo
  catalogItemId String
  catalogItem   CatalogItem            @relation(fields: [catalogItemId], references: [id], onDelete: Restrict)
  
  quantity      Decimal                @db.Decimal(12,4)
  unitPrice     Decimal                @db.Decimal(12,2)
  discount      Decimal?               @db.Decimal(12,2)
  
  @@map("recurring_invoice_line_items")
}

model RecurringInvoiceHistory {
  id                String                    @id @default(uuid())
  templateId        String
  template          RecurringInvoiceTemplate  @relation(fields: [templateId], references: [id], onDelete: Cascade)
  invoiceId         String?
  invoice           Invoice?                  @relation(fields: [invoiceId], references: [id], onDelete: SetNull)
  generatedAt       DateTime                  @default(now())
  wasSuccessful     Boolean
  errorMessage      String?
  
  @@index([templateId])
  @@map("recurring_invoice_history")
}
```

### Accounting Module Models

```prisma
enum JournalEntryType {
  AUTOMATIC  // Generada automáticamente por el sistema
  MANUAL     // Ingresada manualmente por usuario
  ADJUSTMENT // Ajuste contable
  CLOSING    // Asiento de cierre
}

enum JournalEntryStatus {
  DRAFT
  POSTED
  VOIDED
}

enum SourceDocumentType {
  FACTURA
  NOTA_CREDITO
  NOTA_DEBITO
  PAYMENT_RECEIVED
  PAYMENT_MADE
  BANK_DEPOSIT
  BANK_WITHDRAWAL
  OTHER
}

// Plan de cuentas
model AccountingAccount {
  id            String    @id @default(uuid())
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Codificación jerárquica salvadoreña
  code          String    // "1101", "110101", "11010101"
  name          String    // "Efectivo", "Caja General"
  parentCode    String?   // Para jerarquía
  
  // Clasificación
  accountType   String    // "ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"
  level         Int       // 1=Elemento, 2=Rubro, 4=Cuenta mayor, 6=Subcuenta
  
  // Estado
  isActive      Boolean   @default(true)
  isSystem      Boolean   @default(false) // Cuentas predefinidas del sistema
  
  // Metadata
  description   String?
  
  // Relaciones
  journalLines  JournalEntryLine[]
  mappingRules  AccountMappingRule[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([tenantId, code])
  @@index([tenantId, accountType])
  @@index([tenantId, isActive])
  @@map("accounting_accounts")
}

// Partidas contables
model JournalEntry {
  id                String              @id @default(uuid())
  tenantId          String
  tenant            Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Numeración secuencial
  entryNumber       String              // "PD-2026-000001"
  
  // Metadata
  entryDate         DateTime
  description       String
  entryType         JournalEntryType    @default(AUTOMATIC)
  
  // Documento fuente (si aplica)
  sourceType        SourceDocumentType?
  sourceDocumentId  String?
  
  // Estado
  status            JournalEntryStatus  @default(DRAFT)
  
  // Totales (validación: debit debe = credit)
  totalDebit        Decimal             @db.Decimal(18,2)
  totalCredit       Decimal             @db.Decimal(18,2)
  
  // Período fiscal
  fiscalPeriod      String              // "2026-01"
  fiscalYear        Int
  
  // Líneas de la partida
  lines             JournalEntryLine[]
  
  // Metadata
  notes             String?
  
  // Auditoría
  postedAt          DateTime?
  postedBy          String?
  postedByUser      User?               @relation("PostedBy", fields: [postedBy], references: [id])
  voidedAt          DateTime?
  voidedBy          String?
  voidedByUser      User?               @relation("VoidedBy", fields: [voidedBy], references: [id])
  voidReason        String?
  
  createdAt         DateTime            @default(now())
  createdBy         String
  createdByUser     User                @relation("CreatedBy", fields: [createdBy], references: [id])
  
  @@unique([tenantId, entryNumber])
  @@index([tenantId, entryDate])
  @@index([tenantId, sourceDocumentId])
  @@index([tenantId, fiscalPeriod])
  @@index([tenantId, status])
  @@map("journal_entries")
}

// Líneas de partida contable
model JournalEntryLine {
  id              String            @id @default(uuid())
  entryId         String
  entry           JournalEntry      @relation(fields: [entryId], references: [id], onDelete: Cascade)
  
  // Cuenta contable
  accountId       String
  account         AccountingAccount @relation(fields: [accountId], references: [id], onDelete: Restrict)
  
  // Montos (solo uno debe tener valor, el otro en 0)
  debit           Decimal           @default(0) @db.Decimal(18,2)
  credit          Decimal           @default(0) @db.Decimal(18,2)
  
  // Metadata
  description     String?
  
  createdAt       DateTime          @default(now())
  
  @@index([entryId])
  @@index([accountId])
  @@map("journal_entry_lines")
}

// Reglas de mapeo automático de cuentas
model AccountMappingRule {
  id              String              @id @default(uuid())
  tenantId        String
  tenant          Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Tipo de operación que dispara la regla
  operationType   String              // "INVOICE_SALE", "PAYMENT_RECEIVED", "CREDIT_NOTE", etc.
  
  // Cuenta a usar
  accountId       String
  account         AccountingAccount   @relation(fields: [accountId], references: [id], onDelete: Restrict)
  
  // Tipo de movimiento
  movementType    String              // "DEBIT" o "CREDIT"
  
  // Condiciones (opcional)
  conditions      Json?               // Para reglas condicionales
  
  // Prioridad (menor número = mayor prioridad)
  priority        Int                 @default(0)
  
  isActive        Boolean             @default(true)
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  @@index([tenantId, operationType])
  @@map("account_mapping_rules")
}
```

**Migración:**
```bash
npx prisma migrate dev --name add-recurring-invoicing-and-accounting
```

---

## 💬 FASE 3: Cotizaciones + Webhooks

### Quote System Models

```prisma
enum QuoteStatus {
  DRAFT
  SENT
  VIEWED
  APPROVED
  PARTIALLY_APPROVED
  REJECTED
  EXPIRED
  CONVERTED
  CANCELLED
}

model Quote {
  id                  String              @id @default(uuid())
  tenantId            String
  tenant              Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Numeración
  quoteNumber         String              // "COT-2026-0001"
  
  // Versionamiento (todas las versiones comparten quoteGroupId)
  quoteGroupId        String              // UUID compartido por todas las versiones
  version             Int                 @default(1)
  isLatestVersion     Boolean             @default(true)
  previousVersionId   String?
  previousVersion     Quote?              @relation("QuoteVersions", fields: [previousVersionId], references: [id], onDelete: SetNull)
  nextVersions        Quote[]             @relation("QuoteVersions")
  
  // Cliente
  clientId            String
  client              Client              @relation(fields: [clientId], references: [id], onDelete: Restrict)
  
  // Fechas
  issueDate           DateTime            @default(now())
  validUntil          DateTime            // Fecha de expiración
  
  // Estado
  status              QuoteStatus         @default(DRAFT)
  
  // Líneas de ítem
  lineItems           QuoteLineItem[]
  
  // Totales
  subtotal            Decimal             @db.Decimal(12,2)
  taxAmount           Decimal             @db.Decimal(12,2)
  total               Decimal             @db.Decimal(12,2)
  
  // Términos y condiciones
  terms               String?             @db.VarChar(2000)
  notes               String?             @db.VarChar(1000)
  
  // Aprobación del cliente
  approvalToken       String?             @unique // Para portal de aprobación
  approvedAt          DateTime?
  approvedBy          String?             // Email o nombre del aprobador
  rejectedAt          DateTime?
  rejectionReason     String?
  
  // Conversión a factura
  convertedToInvoiceAt DateTime?
  invoiceId           String?             @unique
  invoice             Invoice?            @relation(fields: [invoiceId], references: [id], onDelete: SetNull)
  
  // Historial de cambios de estado
  statusHistory       QuoteStatusHistory[]
  
  // Metadata
  customData          Json?
  
  // Auditoría
  createdBy           String
  createdByUser       User                @relation("QuoteCreatedBy", fields: [createdBy], references: [id])
  updatedBy           String?
  updatedByUser       User?               @relation("QuoteUpdatedBy", fields: [updatedBy], references: [id])
  
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
  
  @@unique([tenantId, quoteNumber])
  @@index([tenantId, status])
  @@index([tenantId, quoteGroupId])
  @@index([clientId])
  @@index([approvalToken])
  @@map("quotes")
}

model QuoteLineItem {
  id              String      @id @default(uuid())
  quoteId         String
  quote           Quote       @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  
  // Referencia al catálogo
  catalogItemId   String?
  catalogItem     CatalogItem? @relation(fields: [catalogItemId], references: [id], onDelete: SetNull)
  
  // Datos del ítem (snapshot al momento de cotizar)
  itemCode        String?
  description     String
  quantity        Decimal     @db.Decimal(12,4)
  unitPrice       Decimal     @db.Decimal(12,2)
  discount        Decimal?    @db.Decimal(12,2)
  taxRate         Decimal     @db.Decimal(5,2)
  lineTotal       Decimal     @db.Decimal(12,2)
  
  // Aprobación parcial
  isAccepted      Boolean?    // Null = pendiente, true = aceptado, false = rechazado
  acceptedQuantity Decimal?   @db.Decimal(12,4)
  
  @@index([quoteId])
  @@map("quote_line_items")
}

model QuoteStatusHistory {
  id          String      @id @default(uuid())
  quoteId     String
  quote       Quote       @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  
  fromStatus  QuoteStatus?
  toStatus    QuoteStatus
  
  // Actor del cambio
  actor       String      // "SYSTEM", "USER", "CLIENT"
  actorUserId String?
  actorUser   User?       @relation(fields: [actorUserId], references: [id], onDelete: SetNull)
  
  // Metadata
  ipAddress   String?
  metadata    Json?
  
  createdAt   DateTime    @default(now())
  
  @@index([quoteId])
  @@map("quote_status_history")
}
```

### Webhook System Models

```prisma
enum WebhookEventType {
  // Facturas
  INVOICE_CREATED
  INVOICE_CERTIFIED
  INVOICE_PAID
  INVOICE_VOIDED
  INVOICE_INVALIDATED
  
  // Notas de crédito
  CREDIT_NOTE_CREATED
  CREDIT_NOTE_CERTIFIED
  
  // Pagos
  PAYMENT_RECEIVED
  
  // Retenciones
  RETENTION_CREATED
  
  // DTE
  DTE_TRANSMISSION_FAILED
  
  // Cotizaciones
  QUOTE_APPROVED
  QUOTE_REJECTED
}

enum WebhookDeliveryStatus {
  PENDING
  RETRYING
  DELIVERED
  FAILED
  DEAD_LETTER
}

model WebhookEndpoint {
  id                String    @id @default(uuid())
  tenantId          String
  tenant            Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Configuración
  url               String
  secret            String    // Para firmar payload con HMAC
  previousSecret    String?   // Período de gracia durante rotación
  secretExpiresAt   DateTime? // Para rotación programada
  
  // Eventos suscritos (array de WebhookEventType)
  subscribedEvents  Json      // ["INVOICE_CREATED", "INVOICE_CERTIFIED", ...]
  
  // Estado
  isActive          Boolean   @default(true)
  
  // Circuit breaker
  consecutiveFailures Int     @default(0)
  disabledAt        DateTime?
  disabledReason    String?
  
  // Metadata
  description       String?
  
  // Relaciones
  deliveries        WebhookDelivery[]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([tenantId, isActive])
  @@map("webhook_endpoints")
}

model WebhookEvent {
  id              String              @id @default(uuid())
  tenantId        String
  tenant          Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Tipo de evento
  eventType       WebhookEventType
  
  // Payload
  payload         Json                // Objeto completo con partidas contables embebidas
  
  // Idempotencia
  idempotencyKey  String              @unique // Para prevenir duplicados
  
  // Relaciones
  deliveries      WebhookDelivery[]
  
  createdAt       DateTime            @default(now())
  
  @@index([tenantId, eventType])
  @@index([createdAt])
  @@map("webhook_events")
}

model WebhookDelivery {
  id              String                @id @default(uuid())
  eventId         String
  event           WebhookEvent          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  endpointId      String
  endpoint        WebhookEndpoint       @relation(fields: [endpointId], references: [id], onDelete: Cascade)
  
  // Estado
  status          WebhookDeliveryStatus @default(PENDING)
  
  // Intentos
  attempts        Int                   @default(0)
  maxAttempts     Int                   @default(10)
  nextRetryAt     DateTime?
  
  // Response del endpoint
  responseStatus  Int?
  responseBody    String?               @db.VarChar(5000)
  responseTime    Int?                  // Milisegundos
  
  // Timestamp
  firstAttemptAt  DateTime?
  lastAttemptAt   DateTime?
  deliveredAt     DateTime?
  failedAt        DateTime?
  
  // Error tracking
  lastError       String?
  
  createdAt       DateTime              @default(now())
  
  @@index([eventId])
  @@index([endpointId])
  @@index([status])
  @@index([nextRetryAt])
  @@map("webhook_deliveries")
}
```

**Migración:**
```bash
npx prisma migrate dev --name add-quotes-and-webhooks
```

---

## 🌱 Seed Data

### Unidades de Medida Estándar (CAT-014)
```typescript
// prisma/seeds/units-of-measure.seed.ts
const standardUnits = [
  { name: "Unidad", abbreviation: "UND", dteCode: "59" },
  { name: "Kilogramo", abbreviation: "KG", dteCode: "KGM" },
  { name: "Gramo", abbreviation: "G", dteCode: "GRM" },
  { name: "Libra", abbreviation: "LB", dteCode: "LBR" },
  { name: "Onza", abbreviation: "OZ", dteCode: "ONZ" },
  { name: "Metro", abbreviation: "M", dteCode: "MTR" },
  { name: "Metro cuadrado", abbreviation: "M²", dteCode: "MTK" },
  { name: "Metro cúbico", abbreviation: "M³", dteCode: "MTQ" },
  { name: "Litro", abbreviation: "L", dteCode: "LTR" },
  { name: "Mililitro", abbreviation: "ML", dteCode: "MLT" },
  { name: "Galón", abbreviation: "GAL", dteCode: "GLL" },
  { name: "Hora", abbreviation: "HR", dteCode: "HUR" },
  { name: "Día", abbreviation: "DÍA", dteCode: "DAY" },
  { name: "Mes", abbreviation: "MES", dteCode: "MON" },
  { name: "Año", abbreviation: "AÑO", dteCode: "ANN" },
  { name: "Docena", abbreviation: "DOC", dteCode: "DZN" },
  { name: "Caja", abbreviation: "CJA", dteCode: "BX" },
];
```

### Perfiles Fiscales Estándar (CAT-015)
```typescript
// prisma/seeds/tax-profiles.seed.ts
const standardTaxProfiles = [
  { name: "IVA 13%", taxCode: "20", taxRate: 13.00 },
  { name: "Exento de IVA", taxCode: "C3", taxRate: 0.00 },
  { name: "No Sujeto", taxCode: "D1", taxRate: 0.00 },
  { name: "Exportación", taxCode: "G1", taxRate: 0.00 },
];
```

### Plan de Cuentas Salvadoreño Base (NIIF PYMES)
```typescript
// prisma/seeds/chart-of-accounts.seed.ts
const baseChartOfAccounts = [
  // Nivel 1: ACTIVO
  { code: "1", name: "ACTIVO", level: 1, accountType: "ASSET" },
  { code: "11", name: "ACTIVO CORRIENTE", parentCode: "1", level: 2, accountType: "ASSET" },
  { code: "1101", name: "Efectivo y equivalentes", parentCode: "11", level: 4, accountType: "ASSET" },
  { code: "110101", name: "Caja general", parentCode: "1101", level: 6, accountType: "ASSET" },
  { code: "110102", name: "Caja chica", parentCode: "1101", level: 6, accountType: "ASSET" },
  { code: "1102", name: "Bancos", parentCode: "11", level: 4, accountType: "ASSET" },
  { code: "1103", name: "Cuentas por cobrar", parentCode: "11", level: 4, accountType: "ASSET" },
  { code: "1105", name: "IVA Crédito Fiscal", parentCode: "11", level: 4, accountType: "ASSET" },
  { code: "1107", name: "IVA Retenido", parentCode: "11", level: 4, accountType: "ASSET" },
  
  // Nivel 1: PASIVO
  { code: "2", name: "PASIVO", level: 1, accountType: "LIABILITY" },
  { code: "21", name: "PASIVO CORRIENTE", parentCode: "2", level: 2, accountType: "LIABILITY" },
  { code: "2101", name: "Cuentas por pagar", parentCode: "21", level: 4, accountType: "LIABILITY" },
  { code: "2106", name: "IVA Débito Fiscal", parentCode: "21", level: 4, accountType: "LIABILITY" },
  
  // Nivel 1: PATRIMONIO
  { code: "3", name: "PATRIMONIO", level: 1, accountType: "EQUITY" },
  { code: "31", name: "CAPITAL", parentCode: "3", level: 2, accountType: "EQUITY" },
  { code: "3101", name: "Capital social", parentCode: "31", level: 4, accountType: "EQUITY" },
  
  // Nivel 1: INGRESOS
  { code: "5", name: "INGRESOS", level: 1, accountType: "INCOME" },
  { code: "51", name: "INGRESOS ORDINARIOS", parentCode: "5", level: 2, accountType: "INCOME" },
  { code: "5101", name: "Ingresos por ventas", parentCode: "51", level: 4, accountType: "INCOME" },
  { code: "5102", name: "Ingresos por exportaciones", parentCode: "51", level: 4, accountType: "INCOME" },
  
  // Nivel 1: GASTOS
  { code: "6", name: "GASTOS", level: 1, accountType: "EXPENSE" },
  { code: "61", name: "COSTO DE VENTAS", parentCode: "6", level: 2, accountType: "EXPENSE" },
  { code: "6101", name: "Costo de mercadería vendida", parentCode: "61", level: 4, accountType: "EXPENSE" },
];
```

---

## 📝 Notas de Implementación

### Consideraciones Importantes

1. **Azure SQL vs PostgreSQL:**
   - Usar `@db.VarChar(N)` en lugar de `@db.Text`
   - Azure SQL no soporta arrays nativos (usar JSON para arrays)
   - Considerar índices cuidadosamente para performance

2. **Multi-tenancy:**
   - Todos los modelos incluyen `tenantId`
   - Usar middleware de Prisma para inyectar filtro automáticamente
   - Índices compuestos siempre empiezan con `tenantId`

3. **Soft Deletes:**
   - No implementado por defecto (usar `onDelete: Cascade`)
   - Si se requiere, agregar campo `deletedAt DateTime?` a modelos críticos

4. **Performance:**
   - Índices en campos de búsqueda frecuente
   - Índices compuestos para queries comunes
   - Considerar índices en campos de fecha para reportes

5. **Auditoría:**
   - `createdAt` y `updatedAt` en todos los modelos
   - `createdBy` en modelos transaccionales
   - Considerar tabla de auditoría separada para cambios críticos

---

**Última actualización:** 7 de febrero de 2026  
**Próxima revisión:** Después de aplicar esquemas de FASE 1
