# COTIZACIONES ADVANCED FEATURES — Facturador Electrónico SV

## 🎯 CONTEXTO

Building advanced quote features on top of the existing MVP. The base MVP is complete and functional — we're now adding enterprise-grade features:

- **Client approval portal** (public URLs, no login required)
- **Quote versioning** (quoteGroupId system for quote iterations)
- **Partial approval** (approve/reject individual line items)
- **Email automation** (send quotes, reminders, approval notifications)
- **Advanced workflow states** with audit trail

**Current MVP State**: 
- ✅ Basic CRUD with COT-2026-XXXX numbering
- ✅ DRAFT → SENT → APPROVED → CONVERTED flow
- ✅ One-click conversion to invoices
- ✅ Frontend with tabs, search, pagination

## 🔍 READ FIRST (Critical Context)

1. `apps/api/src/modules/quotes/` — Current MVP implementation
2. `apps/api/prisma/schema.prisma` — Current Quote model
3. `apps/web/src/app/(dashboard)/cotizaciones/` — Current frontend
4. `apps/api/src/modules/dte/` — DTE conversion logic (already working)
5. `apps/web/src/hooks/use-plan-features.ts` — Plan gating patterns

## 📋 SCOPE DEFINITION

### ✅ THIS SPRINT (Advanced Features):

**1. Client Approval Portal**
- Public URLs: `/approve/{approvalToken}` (no login required)
- Client can view quote details, approve/reject, add comments
- Responsive mobile-first design for client convenience
- Email notifications on approval/rejection

**2. Quote Versioning System**
- `quoteGroupId` groups related quote versions
- Clone quote → creates new version (v2, v3, etc.)
- Previous versions remain accessible but locked
- Conversion only available on latest approved version

**3. Partial Line Item Approval**
- Client can approve/reject individual items
- Quantity adjustments per item
- Automatic recalculation of totals
- Create invoice with only approved items

**4. Email Automation**
- Send quote to client with approval link
- Reminder emails for pending quotes
- Approval/rejection notifications to admin
- Custom email templates

**5. Advanced States & Audit Trail**
- Enhanced state machine with proper transitions
- Full audit log of state changes and user actions
- Client interaction tracking
- Quote expiration with automatic status updates

### ⚠️ PLAN GATING (PRO Features):
- Basic quotes: FREE/TRIAL plans
- Advanced features: PRO/ENTERPRISE only
- Portal approval, versioning, partial approval: PRO+
- Email automation: PRO+

---

## 📊 PHASE A: DATABASE SCHEMA ENHANCEMENTS

### Update existing Quote model in `apps/api/prisma/schema.prisma`:

```prisma
model Quote {
  id              String      @id @default(uuid())
  tenantId        String
  tenant          Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Numbering with versioning
  quoteNumber     String      // "COT-2026-0001"
  quoteGroupId    String      // Groups all versions together
  version         Int         @default(1) // v1, v2, v3...
  isLatestVersion Boolean     @default(true)
  
  // Previous version reference
  previousVersionId String?
  previousVersion Quote?      @relation("QuoteVersions", fields: [previousVersionId], references: [id])
  nextVersions    Quote[]     @relation("QuoteVersions")
  
  // Client information (snapshots for portal)
  clienteId       String
  clienteNit      String?
  clienteNombre   String
  clienteEmail    String?     // Required for approval portal
  clienteDireccion String?
  clienteTelefono String?
  
  // Dates
  issueDate       DateTime    @default(now())
  validUntil      DateTime    // Expiration date
  sentAt          DateTime?   // When sent to client
  
  // Enhanced status: DRAFT, SENT, PENDING_APPROVAL, PARTIALLY_APPROVED, APPROVED, REJECTED, EXPIRED, CONVERTED, CANCELLED
  status          String      @default("DRAFT")
  
  // Totals (calculated from line items)
  subtotal        Decimal     @db.Decimal(12,2) @default(0)
  taxAmount       Decimal     @db.Decimal(12,2) @default(0)
  total           Decimal     @db.Decimal(12,2) @default(0)
  
  // Approved totals (for partial approval)
  approvedSubtotal Decimal?   @db.Decimal(12,2)
  approvedTaxAmount Decimal?  @db.Decimal(12,2)
  approvedTotal    Decimal?   @db.Decimal(12,2)
  
  // Content
  lineItems       QuoteLineItem[]
  terms           String?     @db.NVarChar(2000)
  notes           String?     @db.NVarChar(1000)
  clientNotes     String?     @db.NVarChar(1000) // Client feedback/comments
  
  // Approval portal
  approvalToken   String?     @unique // UUID for public access
  approvalUrl     String?     // Full URL for convenience
  
  // Client approval
  approvedAt      DateTime?
  approvedBy      String?     // Client email or name
  rejectedAt      DateTime?
  rejectionReason String?     @db.NVarChar(1000)
  
  // Conversion tracking
  convertedToInvoiceId  String?
  convertedAt           DateTime?
  
  // Email tracking
  emailSentAt     DateTime?
  emailDelivered  Boolean     @default(false)
  remindersSent   Int         @default(0)
  lastReminderAt  DateTime?
  
  // Audit trail
  statusHistory   QuoteStatusHistory[]
  
  // Metadata
  createdBy       String
  updatedBy       String?
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@unique([tenantId, quoteNumber])
  @@unique([tenantId, quoteGroupId, version])
  @@index([tenantId, status])
  @@index([tenantId, quoteGroupId])
  @@index([approvalToken])
  @@index([validUntil]) // For expiration cron
  @@map("quotes")
}

model QuoteLineItem {
  id              String      @id @default(uuid())
  quoteId         String
  quote           Quote       @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  
  // Line order
  lineNumber      Int         // 1, 2, 3...
  
  // Product reference
  catalogItemId   String?
  catalogItem     CatalogItem? @relation(fields: [catalogItemId], references: [id], onDelete: SetNull)
  
  // Item data (snapshot)
  itemCode        String?
  description     String
  quantity        Decimal     @db.Decimal(12,4)
  unitPrice       Decimal     @db.Decimal(12,2)
  discount        Decimal     @db.Decimal(5,2) @default(0)
  taxRate         Decimal     @db.Decimal(5,2) @default(13) // El Salvador IVA
  
  // Calculated totals
  lineSubtotal    Decimal     @db.Decimal(12,2)
  lineTax         Decimal     @db.Decimal(12,2)
  lineTotal       Decimal     @db.Decimal(12,2)
  
  // Partial approval
  approvalStatus  String      @default("PENDING") // PENDING, APPROVED, REJECTED
  approvedQuantity Decimal?   @db.Decimal(12,4)
  rejectionReason String?     @db.NVarChar(500)
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([quoteId, lineNumber])
  @@map("quote_line_items")
}

model QuoteStatusHistory {
  id              String      @id @default(uuid())
  quoteId         String
  quote           Quote       @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  
  // State change
  fromStatus      String?
  toStatus        String
  
  // Actor information
  actorType       String      // "ADMIN", "CLIENT", "SYSTEM"
  actorId         String?     // User ID or email
  actorName       String?
  actorIp         String?
  
  // Change details
  reason          String?     @db.NVarChar(500)
  metadata        Json?       // Additional context
  
  createdAt       DateTime    @default(now())
  
  @@index([quoteId, createdAt])
  @@map("quote_status_history")
}

// Add relation to existing Tenant model:
// quotes Quote[]
// Add relation to existing CatalogItem model:
// quoteLineItems QuoteLineItem[]
```

**SQL for Azure Portal**:
```sql
-- Create new tables
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'quote_line_items')
BEGIN
    CREATE TABLE quote_line_items (
        id NVARCHAR(1000) NOT NULL PRIMARY KEY,
        quoteId NVARCHAR(1000) NOT NULL,
        lineNumber INT NOT NULL,
        catalogItemId NVARCHAR(1000),
        itemCode NVARCHAR(100),
        description NVARCHAR(500) NOT NULL,
        quantity DECIMAL(12,4) NOT NULL,
        unitPrice DECIMAL(12,2) NOT NULL,
        discount DECIMAL(5,2) NOT NULL DEFAULT 0,
        taxRate DECIMAL(5,2) NOT NULL DEFAULT 13,
        lineSubtotal DECIMAL(12,2) NOT NULL,
        lineTax DECIMAL(12,2) NOT NULL,
        lineTotal DECIMAL(12,2) NOT NULL,
        approvalStatus NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
        approvedQuantity DECIMAL(12,4),
        rejectionReason NVARCHAR(500),
        createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        
        CONSTRAINT FK_quote_line_items_quote FOREIGN KEY (quoteId) REFERENCES [quotes] (id) ON DELETE CASCADE
    );
    
    CREATE INDEX IX_quote_line_items_quoteId_lineNumber ON quote_line_items(quoteId, lineNumber);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'quote_status_history')
BEGIN
    CREATE TABLE quote_status_history (
        id NVARCHAR(1000) NOT NULL PRIMARY KEY,
        quoteId NVARCHAR(1000) NOT NULL,
        fromStatus NVARCHAR(30),
        toStatus NVARCHAR(30) NOT NULL,
        actorType NVARCHAR(20) NOT NULL,
        actorId NVARCHAR(1000),
        actorName NVARCHAR(255),
        actorIp NVARCHAR(45),
        reason NVARCHAR(500),
        metadata NVARCHAR(MAX),
        createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        
        CONSTRAINT FK_quote_status_history_quote FOREIGN KEY (quoteId) REFERENCES [quotes] (id) ON DELETE CASCADE
    );
    
    CREATE INDEX IX_quote_status_history_quoteId_createdAt ON quote_status_history(quoteId, createdAt);
END

-- Add new columns to existing quotes table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[quotes]') AND name = 'quoteGroupId')
BEGIN
    ALTER TABLE quotes ADD 
        quoteGroupId NVARCHAR(1000),
        version INT DEFAULT 1,
        isLatestVersion BIT DEFAULT 1,
        previousVersionId NVARCHAR(1000),
        clienteEmail NVARCHAR(255),
        clienteTelefono NVARCHAR(20),
        sentAt DATETIME2,
        approvedSubtotal DECIMAL(12,2),
        approvedTaxAmount DECIMAL(12,2), 
        approvedTotal DECIMAL(12,2),
        clientNotes NVARCHAR(1000),
        approvalToken NVARCHAR(1000),
        approvalUrl NVARCHAR(500),
        approvedBy NVARCHAR(255),
        rejectedAt DATETIME2,
        emailSentAt DATETIME2,
        emailDelivered BIT DEFAULT 0,
        remindersSent INT DEFAULT 0,
        lastReminderAt DATETIME2;
        
    -- Add unique constraints
    CREATE UNIQUE INDEX IX_quotes_tenantId_quoteGroupId_version ON quotes(tenantId, quoteGroupId, version);
    CREATE UNIQUE INDEX IX_quotes_approvalToken ON quotes(approvalToken);
    CREATE INDEX IX_quotes_quoteGroupId ON quotes(tenantId, quoteGroupId);
    CREATE INDEX IX_quotes_validUntil ON quotes(validUntil);
END

-- Update existing quotes to have quoteGroupId
UPDATE quotes 
SET quoteGroupId = id, version = 1, isLatestVersion = 1 
WHERE quoteGroupId IS NULL;
```

---

## 🔧 PHASE B: BACKEND ENHANCEMENTS

### 1. Enhanced Quotes Service

Add to `apps/api/src/modules/quotes/quotes.service.ts`:

```typescript
// New methods for advanced features

async createNewVersion(quoteId: string, tenantId: string, userId: string): Promise<Quote> {
  const originalQuote = await this.findOne(quoteId, tenantId);
  
  if (originalQuote.status === 'CONVERTED') {
    throw new BadRequestException('Cannot create version of converted quote');
  }
  
  // Mark current version as not latest
  await this.prisma.quote.update({
    where: { id: quoteId },
    data: { isLatestVersion: false }
  });
  
  // Get next version number
  const latestVersion = await this.prisma.quote.findFirst({
    where: { quoteGroupId: originalQuote.quoteGroupId },
    orderBy: { version: 'desc' }
  });
  
  const nextVersion = (latestVersion?.version || 0) + 1;
  const newQuoteNumber = `${originalQuote.quoteNumber.split('-').slice(0, -1).join('-')}-v${nextVersion}`;
  
  // Create new version
  const newQuote = await this.prisma.quote.create({
    data: {
      ...originalQuote,
      id: undefined, // Auto-generate new ID
      quoteNumber: newQuoteNumber,
      version: nextVersion,
      previousVersionId: quoteId,
      isLatestVersion: true,
      status: 'DRAFT',
      approvalToken: null,
      approvedAt: null,
      rejectedAt: null,
      convertedAt: null,
      convertedToInvoiceId: null,
      createdBy: userId,
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  
  // Copy line items
  const originalItems = await this.prisma.quoteLineItem.findMany({
    where: { quoteId }
  });
  
  for (const item of originalItems) {
    await this.prisma.quoteLineItem.create({
      data: {
        ...item,
        id: undefined,
        quoteId: newQuote.id
      }
    });
  }
  
  // Log the versioning
  await this.createStatusHistory(newQuote.id, null, 'DRAFT', 'ADMIN', userId, 'Quote version created');
  
  return newQuote;
}

async sendToClient(quoteId: string, tenantId: string, userId: string): Promise<Quote> {
  const quote = await this.findOne(quoteId, tenantId);
  
  if (!quote.clienteEmail) {
    throw new BadRequestException('Client email is required to send quote');
  }
  
  // Generate approval token if not exists
  const approvalToken = quote.approvalToken || crypto.randomUUID();
  const approvalUrl = `${process.env.FRONTEND_URL}/approve/${approvalToken}`;
  
  const updatedQuote = await this.prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: 'SENT',
      approvalToken,
      approvalUrl,
      sentAt: new Date(),
      updatedBy: userId
    },
    include: { lineItems: true }
  });
  
  // Send email (implement email service)
  await this.emailService.sendQuoteToClient(updatedQuote);
  
  // Log status change
  await this.createStatusHistory(quoteId, quote.status, 'SENT', 'ADMIN', userId, 'Quote sent to client');
  
  return updatedQuote;
}

async approveByClient(approvalToken: string, clientData: any): Promise<Quote> {
  const quote = await this.prisma.quote.findUnique({
    where: { approvalToken },
    include: { lineItems: true }
  });
  
  if (!quote) {
    throw new NotFoundException('Quote not found or token invalid');
  }
  
  if (quote.status !== 'SENT' && quote.status !== 'PENDING_APPROVAL') {
    throw new BadRequestException('Quote cannot be approved in current state');
  }
  
  if (new Date() > quote.validUntil) {
    throw new BadRequestException('Quote has expired');
  }
  
  // Handle partial approval
  const hasPartialApproval = clientData.lineItems?.some((item: any) => 
    item.approvalStatus === 'REJECTED'
  );
  
  const newStatus = hasPartialApproval ? 'PARTIALLY_APPROVED' : 'APPROVED';
  
  // Update quote
  const updatedQuote = await this.prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: newStatus,
      approvedAt: new Date(),
      approvedBy: clientData.approverEmail || clientData.approverName,
      clientNotes: clientData.comments
    }
  });
  
  // Update line items if partial approval
  if (clientData.lineItems) {
    for (const lineItem of clientData.lineItems) {
      await this.prisma.quoteLineItem.update({
        where: { id: lineItem.id },
        data: {
          approvalStatus: lineItem.approvalStatus,
          approvedQuantity: lineItem.approvedQuantity,
          rejectionReason: lineItem.rejectionReason
        }
      });
    }
  }
  
  // Calculate approved totals
  await this.calculateApprovedTotals(quote.id);
  
  // Log approval
  await this.createStatusHistory(
    quote.id, 
    quote.status, 
    newStatus, 
    'CLIENT', 
    clientData.approverEmail,
    `Quote ${hasPartialApproval ? 'partially ' : ''}approved by client`
  );
  
  // Send notification to admin
  await this.emailService.notifyQuoteApproval(updatedQuote);
  
  return updatedQuote;
}

async rejectByClient(approvalToken: string, rejectionData: any): Promise<Quote> {
  const quote = await this.prisma.quote.findUnique({
    where: { approvalToken }
  });
  
  if (!quote || quote.status !== 'SENT') {
    throw new BadRequestException('Quote cannot be rejected');
  }
  
  const updatedQuote = await this.prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectionReason: rejectionData.reason,
      clientNotes: rejectionData.comments
    }
  });
  
  await this.createStatusHistory(
    quote.id, 
    'SENT', 
    'REJECTED', 
    'CLIENT', 
    rejectionData.rejectorEmail,
    `Quote rejected: ${rejectionData.reason}`
  );
  
  // Send notification
  await this.emailService.notifyQuoteRejection(updatedQuote);
  
  return updatedQuote;
}

private async calculateApprovedTotals(quoteId: string): Promise<void> {
  const lineItems = await this.prisma.quoteLineItem.findMany({
    where: { 
      quoteId,
      approvalStatus: 'APPROVED'
    }
  });
  
  const approvedSubtotal = lineItems.reduce((sum, item) => 
    sum + (item.approvedQuantity || item.quantity) * item.unitPrice, 0
  );
  
  const approvedTaxAmount = approvedSubtotal * 0.13; // El Salvador IVA
  const approvedTotal = approvedSubtotal + approvedTaxAmount;
  
  await this.prisma.quote.update({
    where: { id: quoteId },
    data: {
      approvedSubtotal,
      approvedTaxAmount,
      approvedTotal
    }
  });
}

private async createStatusHistory(
  quoteId: string,
  fromStatus: string | null,
  toStatus: string,
  actorType: string,
  actorId?: string,
  reason?: string,
  metadata?: any
): Promise<void> {
  await this.prisma.quoteStatusHistory.create({
    data: {
      quoteId,
      fromStatus,
      toStatus,
      actorType,
      actorId,
      reason,
      metadata: metadata ? JSON.stringify(metadata) : null
    }
  });
}
```

### 2. Enhanced Controller Endpoints

Add to `apps/api/src/modules/quotes/quotes.controller.ts`:

```typescript
// New advanced endpoints

@Post(':id/create-version')
@UsePlanFeature('advancedQuotes')
async createNewVersion(
  @Param('id') id: string,
  @TenantId() tenantId: string,
  @CurrentUser() user: any
) {
  return this.quotesService.createNewVersion(id, tenantId, user.id);
}

@Get('group/:groupId')
async getQuoteVersions(
  @Param('groupId') groupId: string,
  @TenantId() tenantId: string
) {
  return this.quotesService.getQuoteVersions(groupId, tenantId);
}

@Post(':id/send-to-client')
@UsePlanFeature('advancedQuotes')
async sendToClient(
  @Param('id') id: string,
  @TenantId() tenantId: string,
  @CurrentUser() user: any
) {
  return this.quotesService.sendToClient(id, tenantId, user.id);
}

@Get(':id/status-history')
async getStatusHistory(
  @Param('id') id: string,
  @TenantId() tenantId: string
) {
  return this.quotesService.getStatusHistory(id, tenantId);
}

// Public endpoints (no auth)
@Get('public/approve/:token')
async getQuoteForApproval(@Param('token') token: string) {
  return this.quotesService.getQuoteByToken(token);
}

@Post('public/approve/:token')
async approveQuote(
  @Param('token') token: string,
  @Body() approvalData: any,
  @Ip() clientIp: string
) {
  return this.quotesService.approveByClient(token, { ...approvalData, clientIp });
}

@Post('public/reject/:token')
async rejectQuote(
  @Param('token') token: string,
  @Body() rejectionData: any,
  @Ip() clientIp: string
) {
  return this.quotesService.rejectByClient(token, { ...rejectionData, clientIp });
}
```

### 3. Email Service Integration

Create `apps/api/src/modules/quotes/email.service.ts`:

```typescript
@Injectable()
export class QuoteEmailService {
  constructor(private configService: ConfigService) {}
  
  async sendQuoteToClient(quote: Quote): Promise<void> {
    const emailTemplate = `
      <h2>Nueva Cotización: ${quote.quoteNumber}</h2>
      <p>Estimado/a ${quote.clienteNombre},</p>
      <p>Adjuntamos cotización para su revisión.</p>
      
      <div style="margin: 20px 0;">
        <strong>Total: $${quote.total}</strong><br>
        <strong>Válida hasta: ${format(quote.validUntil, 'dd/MM/yyyy')}</strong>
      </div>
      
      <a href="${quote.approvalUrl}" 
         style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        Ver y Aprobar Cotización
      </a>
      
      <p>Si tiene preguntas, puede contactarnos respondiendo este email.</p>
    `;
    
    // Implement actual email sending logic
    // Could use SendGrid, AWS SES, Azure Communication Services, etc.
  }
  
  async notifyQuoteApproval(quote: Quote): Promise<void> {
    // Send notification to admin about client approval
  }
  
  async notifyQuoteRejection(quote: Quote): Promise<void> {
    // Send notification to admin about client rejection  
  }
  
  async sendReminder(quote: Quote): Promise<void> {
    // Send reminder email to client
  }
}
```

---

## 🎨 PHASE C: CLIENT APPROVAL PORTAL

### Create public approval routes in `apps/web/src/app/`:

```
app/
├── approve/
│   └── [token]/
│       ├── page.tsx              // Main approval page
│       ├── success/
│       │   └── page.tsx          // Approval success
│       └── components/
│           ├── quote-summary.tsx
│           ├── line-item-approval.tsx
│           └── approval-form.tsx
```

### Main Approval Page (`app/approve/[token]/page.tsx`):

```typescript
'use client';

export default function QuoteApprovalPage({ params }: { params: { token: string } }) {
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approvalData, setApprovalData] = useState({
    approverName: '',
    approverEmail: '',
    comments: '',
    lineItems: []
  });
  
  useEffect(() => {
    fetchQuoteByToken(params.token);
  }, [params.token]);
  
  const fetchQuoteByToken = async (token: string) => {
    try {
      const response = await fetch(`/api/v1/quotes/public/approve/${token}`);
      if (response.ok) {
        const data = await response.json();
        setQuote(data);
        initializeApprovalData(data);
      } else {
        // Handle error (invalid token, expired, etc.)
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApprove = async () => {
    try {
      const response = await fetch(`/api/v1/quotes/public/approve/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalData)
      });
      
      if (response.ok) {
        router.push(`/approve/${params.token}/success`);
      }
    } catch (error) {
      toast.error('Error al aprobar cotización');
    }
  };
  
  const handleReject = async () => {
    // Similar implementation for rejection
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando cotización...</p>
        </div>
      </div>
    );
  }
  
  if (!quote) {
    return <QuoteNotFoundPage />;
  }
  
  if (quote.status === 'EXPIRED') {
    return <QuoteExpiredPage quote={quote} />;
  }
  
  if (['APPROVED', 'REJECTED', 'CONVERTED'].includes(quote.status)) {
    return <QuoteAlreadyProcessedPage quote={quote} />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cotización {quote.quoteNumber}
              </h1>
              <p className="text-gray-600">
                De: {quote.tenant.nombre} • Para: {quote.clienteNombre}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">${quote.total}</p>
              <p className="text-sm text-gray-500">
                Válida hasta: {format(new Date(quote.validUntil), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Line Items with Approval Options */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Productos y Servicios</h2>
          
          {quote.lineItems.map((item: any, index: number) => (
            <LineItemApproval
              key={item.id}
              item={item}
              onUpdate={(updatedItem) => {
                const newLineItems = [...approvalData.lineItems];
                newLineItems[index] = updatedItem;
                setApprovalData(prev => ({ ...prev, lineItems: newLineItems }));
              }}
            />
          ))}
        </div>
        
        {/* Approval Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Información de Aprobación</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="approverName">Nombre completo *</Label>
              <Input
                id="approverName"
                value={approvalData.approverName}
                onChange={(e) => setApprovalData(prev => ({ ...prev, approverName: e.target.value }))}
                placeholder="Su nombre"
                required
              />
            </div>
            <div>
              <Label htmlFor="approverEmail">Email *</Label>
              <Input
                id="approverEmail"
                type="email"
                value={approvalData.approverEmail}
                onChange={(e) => setApprovalData(prev => ({ ...prev, approverEmail: e.target.value }))}
                placeholder="su@email.com"
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <Label htmlFor="comments">Comentarios adicionales</Label>
            <Textarea
              id="comments"
              value={approvalData.comments}
              onChange={(e) => setApprovalData(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="Cualquier comentario o solicitud especial..."
              rows={3}
            />
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            variant="outline"
            size="lg"
            onClick={handleReject}
            className="order-2 sm:order-1"
          >
            <X className="h-4 w-4 mr-2" />
            Rechazar Cotización
          </Button>
          <Button
            size="lg"
            onClick={handleApprove}
            disabled={!approvalData.approverName || !approvalData.approverEmail}
            className="order-1 sm:order-2 bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Aprobar Cotización
          </Button>
        </div>
        
        {/* Terms */}
        {quote.terms && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Términos y Condiciones</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.terms}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Line Item Approval Component:

```typescript
function LineItemApproval({ item, onUpdate }: { item: any, onUpdate: (item: any) => void }) {
  const [approval, setApproval] = useState({
    approvalStatus: 'APPROVED',
    approvedQuantity: item.quantity,
    rejectionReason: ''
  });
  
  useEffect(() => {
    onUpdate({ ...item, ...approval });
  }, [approval]);
  
  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-medium">{item.description}</h3>
          <p className="text-sm text-gray-500">
            Cantidad: {item.quantity} • Precio: ${item.unitPrice} • Total: ${item.lineTotal}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-3">
          <Label className="flex items-center space-x-2">
            <input
              type="radio"
              name={`approval_${item.id}`}
              value="APPROVED"
              checked={approval.approvalStatus === 'APPROVED'}
              onChange={() => setApproval(prev => ({ ...prev, approvalStatus: 'APPROVED' }))}
            />
            <span className="text-green-600 font-medium">Aprobar</span>
          </Label>
          
          <Label className="flex items-center space-x-2">
            <input
              type="radio"
              name={`approval_${item.id}`}
              value="REJECTED"
              checked={approval.approvalStatus === 'REJECTED'}
              onChange={() => setApproval(prev => ({ ...prev, approvalStatus: 'REJECTED' }))}
            />
            <span className="text-red-600 font-medium">Rechazar</span>
          </Label>
        </div>
        
        {approval.approvalStatus === 'APPROVED' && (
          <div className="flex items-center space-x-2">
            <Label className="text-sm">Cantidad:</Label>
            <Input
              type="number"
              min="0"
              max={item.quantity}
              step="0.01"
              value={approval.approvedQuantity}
              onChange={(e) => setApproval(prev => ({ ...prev, approvedQuantity: parseFloat(e.target.value) }))}
              className="w-20 h-8"
            />
          </div>
        )}
      </div>
      
      {approval.approvalStatus === 'REJECTED' && (
        <div className="mt-3">
          <Input
            placeholder="Motivo del rechazo..."
            value={approval.rejectionReason}
            onChange={(e) => setApproval(prev => ({ ...prev, rejectionReason: e.target.value }))}
            className="text-sm"
          />
        </div>
      )}
    </div>
  );
}
```

---

## 📱 PHASE D: ENHANCED ADMIN UI

### Enhanced Quote List with Versioning:

```typescript
// Add to existing cotizaciones/page.tsx

function QuoteVersionBadge({ quote }: { quote: any }) {
  if (quote.version === 1 && !quote.nextVersions?.length) {
    return null; // No version indicator for single version quotes
  }
  
  return (
    <div className="flex items-center space-x-1">
      <Badge variant={quote.isLatestVersion ? "default" : "secondary"}>
        v{quote.version}
      </Badge>
      {!quote.isLatestVersion && (
        <Badge variant="outline" className="text-xs">
          Anterior
        </Badge>
      )}
    </div>
  );
}

// Enhanced QuotesTable component
function QuotesTable({ quotes, onAction }: any) {
  const groupedQuotes = groupQuotesByGroup(quotes);
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cotización</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Creada</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groupedQuotes.map((group: any) => (
          <QuoteGroupRows key={group.groupId} group={group} onAction={onAction} />
        ))}
      </TableBody>
    </Table>
  );
}

function QuoteGroupRows({ group, onAction }: any) {
  const [expanded, setExpanded] = useState(false);
  const latestQuote = group.quotes.find((q: any) => q.isLatestVersion) || group.quotes[0];
  
  return (
    <>
      {/* Latest version row */}
      <TableRow>
        <TableCell>
          <div className="flex items-center space-x-2">
            {group.quotes.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  expanded && "transform rotate-180"
                )} />
              </Button>
            )}
            <span className="font-medium">{latestQuote.quoteNumber}</span>
            <QuoteVersionBadge quote={latestQuote} />
          </div>
        </TableCell>
        <TableCell>{latestQuote.clienteNombre}</TableCell>
        <TableCell><StatusBadge status={latestQuote.status} /></TableCell>
        <TableCell>${latestQuote.total}</TableCell>
        <TableCell>{formatDate(latestQuote.createdAt)}</TableCell>
        <TableCell>
          <QuoteActionDropdown quote={latestQuote} onAction={onAction} />
        </TableCell>
      </TableRow>
      
      {/* Previous versions (if expanded) */}
      {expanded && group.quotes
        .filter((q: any) => !q.isLatestVersion)
        .map((quote: any) => (
          <TableRow key={quote.id} className="bg-gray-50/50">
            <TableCell className="pl-12">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">{quote.quoteNumber}</span>
                <QuoteVersionBadge quote={quote} />
              </div>
            </TableCell>
            <TableCell className="text-gray-600">{quote.clienteNombre}</TableCell>
            <TableCell><StatusBadge status={quote.status} /></TableCell>
            <TableCell className="text-gray-600">${quote.total}</TableCell>
            <TableCell className="text-gray-600">{formatDate(quote.createdAt)}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" onClick={() => onAction('view', quote)}>
                Ver
              </Button>
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}
```

### Enhanced Quote Actions:

```typescript
function QuoteActionDropdown({ quote, onAction }: any) {
  const { hasFeature } = usePlanFeatures();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction('view', quote)}>
          <Eye className="h-4 w-4 mr-2" />
          Ver detalles
        </DropdownMenuItem>
        
        {quote.status === 'DRAFT' && (
          <>
            <DropdownMenuItem onClick={() => onAction('edit', quote)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('send', quote)}>
              <Send className="h-4 w-4 mr-2" />
              Enviar a cliente
            </DropdownMenuItem>
          </>
        )}
        
        {hasFeature('advancedQuotes') && quote.status !== 'CONVERTED' && (
          <DropdownMenuItem onClick={() => onAction('createVersion', quote)}>
            <Copy className="h-4 w-4 mr-2" />
            Crear nueva versión
          </DropdownMenuItem>
        )}
        
        {quote.status === 'SENT' && (
          <>
            <DropdownMenuItem onClick={() => onAction('approve', quote)}>
              <Check className="h-4 w-4 mr-2" />
              Aprobar manualmente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('reject', quote)}>
              <X className="h-4 w-4 mr-2" />
              Rechazar
            </DropdownMenuItem>
          </>
        )}
        
        {quote.status === 'APPROVED' && (
          <DropdownMenuItem onClick={() => onAction('convert', quote)}>
            <FileText className="h-4 w-4 mr-2" />
            Convertir a factura
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction('pdf', quote)}>
          <Download className="h-4 w-4 mr-2" />
          Descargar PDF
        </DropdownMenuItem>
        
        {quote.approvalUrl && (
          <DropdownMenuItem onClick={() => onAction('copyApprovalLink', quote)}>
            <Link className="h-4 w-4 mr-2" />
            Copiar enlace aprobación
          </DropdownMenuItem>
        )}
        
        {quote.status === 'DRAFT' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onAction('delete', quote)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 🔄 PHASE E: CRON JOBS & AUTOMATION

### Quote Expiration Cron:

```typescript
// Add to apps/api/src/modules/quotes/quotes-cron.service.ts

@Injectable()
export class QuotesCronService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: QuoteEmailService
  ) {}
  
  @Cron('0 6 * * *') // Daily at 6 AM
  async handleExpiredQuotes() {
    const today = new Date();
    
    const expiredQuotes = await this.prisma.quote.findMany({
      where: {
        status: 'SENT',
        validUntil: { lt: today }
      }
    });
    
    for (const quote of expiredQuotes) {
      await this.prisma.quote.update({
        where: { id: quote.id },
        data: { status: 'EXPIRED' }
      });
      
      // Log status change
      await this.prisma.quoteStatusHistory.create({
        data: {
          quoteId: quote.id,
          fromStatus: 'SENT',
          toStatus: 'EXPIRED',
          actorType: 'SYSTEM',
          reason: 'Quote expired automatically'
        }
      });
    }
    
    console.log(`Expired ${expiredQuotes.length} quotes`);
  }
  
  @Cron('0 9 * * *') // Daily at 9 AM  
  async sendReminders() {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const quotesNearExpiry = await this.prisma.quote.findMany({
      where: {
        status: 'SENT',
        validUntil: { lte: threeDaysFromNow },
        remindersSent: { lt: 2 } // Max 2 reminders
      }
    });
    
    for (const quote of quotesNearExpiry) {
      await this.emailService.sendReminder(quote);
      
      await this.prisma.quote.update({
        where: { id: quote.id },
        data: {
          remindersSent: quote.remindersSent + 1,
          lastReminderAt: new Date()
        }
      });
    }
    
    console.log(`Sent reminders for ${quotesNearExpiry.length} quotes`);
  }
}
```

---

## ✅ SUCCESS CRITERIA

**Advanced Features:**
- [ ] Quote versioning with quoteGroupId system
- [ ] Client approval portal accessible via public URL without login
- [ ] Partial line item approval with quantity adjustments
- [ ] Email automation for sending quotes and notifications
- [ ] Enhanced admin UI with version grouping and expanded actions
- [ ] Automatic quote expiration and reminder system
- [ ] Complete audit trail with QuoteStatusHistory
- [ ] Plan gating for advanced features (PRO+ only)

**Business Logic:**
- [ ] Latest version can be converted, previous versions are locked
- [ ] Partial approval creates invoice with only approved items
- [ ] Client approval updates quote status and notifies admin
- [ ] Email templates are professional and mobile-responsive
- [ ] Cron jobs handle expiration and reminders automatically

**Security & UX:**
- [ ] Public approval portal validates tokens and handles edge cases
- [ ] Client approval portal is mobile-responsive
- [ ] Admin UI clearly shows version relationships
- [ ] All state transitions are properly validated and logged
- [ ] Email notifications are sent for all major events

## 🚫 ANTI-PATTERNS

- ❌ Don't allow editing of non-latest versions
- ❌ Don't allow conversion of partially approved quotes without user confirmation
- ❌ Don't send more than 2 reminder emails per quote
- ❌ Don't expose sensitive data in public approval portal
- ❌ Don't forget to validate approval tokens and expiration dates
- ❌ Don't skip audit trail for any state changes

---

**Ready to transform quotes into a professional approval system with versioning and client portal. This will differentiate Facturador SV in the El Salvador market.**