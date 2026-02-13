-- ============================================================================
-- QUOTES ADVANCED MODULE - COMPLETE IDEMPOTENT MIGRATION
-- Run this in Azure Portal Query Editor
-- Safe to re-run: all operations check IF NOT EXISTS first
-- ============================================================================
-- Target: Align Azure SQL database with Prisma schema for:
--   1. quotes table (@@map("quotes"))
--   2. quote_line_items table (@@map("quote_line_items"))
--   3. quote_status_history table (@@map("quote_status_history"))
-- ============================================================================

BEGIN TRY
    BEGIN TRANSACTION;

    PRINT '=== PHASE 1: quotes TABLE - ADD MISSING COLUMNS ===';

    -- Versioning columns
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'quoteGroupId')
        ALTER TABLE dbo.quotes ADD quoteGroupId NVARCHAR(1000) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'version')
        ALTER TABLE dbo.quotes ADD version INT NOT NULL DEFAULT 1;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'isLatestVersion')
        ALTER TABLE dbo.quotes ADD isLatestVersion BIT NOT NULL DEFAULT 1;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'previousVersionId')
        ALTER TABLE dbo.quotes ADD previousVersionId NVARCHAR(1000) NULL;

    -- Client snapshot columns
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'clienteNit')
        ALTER TABLE dbo.quotes ADD clienteNit NVARCHAR(20) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'clienteNombre')
        ALTER TABLE dbo.quotes ADD clienteNombre NVARCHAR(255) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'clienteEmail')
        ALTER TABLE dbo.quotes ADD clienteEmail NVARCHAR(255) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'clienteDireccion')
        ALTER TABLE dbo.quotes ADD clienteDireccion NVARCHAR(500) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'clienteTelefono')
        ALTER TABLE dbo.quotes ADD clienteTelefono NVARCHAR(20) NULL;

    -- Date columns
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'issueDate')
        ALTER TABLE dbo.quotes ADD issueDate DATETIME2 NOT NULL DEFAULT GETDATE();

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'sentAt')
        ALTER TABLE dbo.quotes ADD sentAt DATETIME2 NULL;

    -- Approved totals
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvedSubtotal')
        ALTER TABLE dbo.quotes ADD approvedSubtotal DECIMAL(12,2) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvedTaxAmount')
        ALTER TABLE dbo.quotes ADD approvedTaxAmount DECIMAL(12,2) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvedTotal')
        ALTER TABLE dbo.quotes ADD approvedTotal DECIMAL(12,2) NULL;

    -- Content columns
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'terms')
        ALTER TABLE dbo.quotes ADD terms NVARCHAR(2000) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'notes')
        ALTER TABLE dbo.quotes ADD notes NVARCHAR(1000) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'clientNotes')
        ALTER TABLE dbo.quotes ADD clientNotes NVARCHAR(1000) NULL;

    -- Approval portal columns
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvalToken')
        ALTER TABLE dbo.quotes ADD approvalToken NVARCHAR(1000) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvalUrl')
        ALTER TABLE dbo.quotes ADD approvalUrl NVARCHAR(500) NULL;

    -- Approval result columns
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvedAt')
        ALTER TABLE dbo.quotes ADD approvedAt DATETIME2 NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvedBy')
        ALTER TABLE dbo.quotes ADD approvedBy NVARCHAR(255) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'rejectedAt')
        ALTER TABLE dbo.quotes ADD rejectedAt DATETIME2 NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'rejectionReason')
        ALTER TABLE dbo.quotes ADD rejectionReason NVARCHAR(1000) NULL;

    -- Conversion columns
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'convertedToInvoiceId')
        ALTER TABLE dbo.quotes ADD convertedToInvoiceId NVARCHAR(1000) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'convertedAt')
        ALTER TABLE dbo.quotes ADD convertedAt DATETIME2 NULL;

    -- Email tracking columns
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'emailSentAt')
        ALTER TABLE dbo.quotes ADD emailSentAt DATETIME2 NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'emailDelivered')
        ALTER TABLE dbo.quotes ADD emailDelivered BIT NOT NULL DEFAULT 0;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'remindersSent')
        ALTER TABLE dbo.quotes ADD remindersSent INT NOT NULL DEFAULT 0;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'lastReminderAt')
        ALTER TABLE dbo.quotes ADD lastReminderAt DATETIME2 NULL;

    -- Audit columns
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'createdBy')
        ALTER TABLE dbo.quotes ADD createdBy NVARCHAR(1000) NOT NULL DEFAULT '';

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'updatedBy')
        ALTER TABLE dbo.quotes ADD updatedBy NVARCHAR(1000) NULL;

    PRINT 'Phase 1 complete: quotes table columns verified/added.';

    -- ========================================================================
    PRINT '=== PHASE 2: quote_line_items TABLE ===';
    -- ========================================================================

    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quote_line_items')
    BEGIN
        PRINT 'Creating quote_line_items table from scratch...';
        CREATE TABLE dbo.quote_line_items (
            id              NVARCHAR(1000)  NOT NULL,
            quoteId         NVARCHAR(1000)  NOT NULL,
            lineNumber      INT             NOT NULL,
            catalogItemId   NVARCHAR(1000)  NULL,
            itemCode        NVARCHAR(100)   NULL,
            description     NVARCHAR(500)   NOT NULL,
            quantity        DECIMAL(12,4)   NOT NULL,
            unitPrice       DECIMAL(12,2)   NOT NULL,
            discount        DECIMAL(12,2)   NOT NULL DEFAULT 0,
            taxRate         DECIMAL(5,2)    NOT NULL DEFAULT 13,
            tipoItem        INT             NOT NULL DEFAULT 1,
            lineSubtotal    DECIMAL(12,2)   NOT NULL,
            lineTax         DECIMAL(12,2)   NOT NULL,
            lineTotal       DECIMAL(12,2)   NOT NULL,
            approvalStatus  NVARCHAR(1000)  NOT NULL DEFAULT 'PENDING',
            approvedQuantity DECIMAL(12,4)  NULL,
            rejectionReason NVARCHAR(500)   NULL,
            createdAt       DATETIME2       NOT NULL DEFAULT GETDATE(),
            updatedAt       DATETIME2       NOT NULL DEFAULT GETDATE(),
            CONSTRAINT PK_quote_line_items PRIMARY KEY (id)
        );
        PRINT 'Table quote_line_items created.';
    END
    ELSE
    BEGIN
        PRINT 'Table quote_line_items already exists, checking for missing columns...';

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'tipoItem')
            ALTER TABLE dbo.quote_line_items ADD tipoItem INT NOT NULL DEFAULT 1;

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'catalogItemId')
            ALTER TABLE dbo.quote_line_items ADD catalogItemId NVARCHAR(1000) NULL;

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'itemCode')
            ALTER TABLE dbo.quote_line_items ADD itemCode NVARCHAR(100) NULL;

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'discount')
            ALTER TABLE dbo.quote_line_items ADD discount DECIMAL(12,2) NOT NULL DEFAULT 0;

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'taxRate')
            ALTER TABLE dbo.quote_line_items ADD taxRate DECIMAL(5,2) NOT NULL DEFAULT 13;

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'lineSubtotal')
            ALTER TABLE dbo.quote_line_items ADD lineSubtotal DECIMAL(12,2) NOT NULL DEFAULT 0;

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'lineTax')
            ALTER TABLE dbo.quote_line_items ADD lineTax DECIMAL(12,2) NOT NULL DEFAULT 0;

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'lineTotal')
            ALTER TABLE dbo.quote_line_items ADD lineTotal DECIMAL(12,2) NOT NULL DEFAULT 0;

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'approvalStatus')
            ALTER TABLE dbo.quote_line_items ADD approvalStatus NVARCHAR(1000) NOT NULL DEFAULT 'PENDING';

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'approvedQuantity')
            ALTER TABLE dbo.quote_line_items ADD approvedQuantity DECIMAL(12,4) NULL;

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'rejectionReason')
            ALTER TABLE dbo.quote_line_items ADD rejectionReason NVARCHAR(500) NULL;

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'createdAt')
            ALTER TABLE dbo.quote_line_items ADD createdAt DATETIME2 NOT NULL DEFAULT GETDATE();

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'updatedAt')
            ALTER TABLE dbo.quote_line_items ADD updatedAt DATETIME2 NOT NULL DEFAULT GETDATE();
    END

    PRINT 'Phase 2 complete: quote_line_items table ready.';

    -- ========================================================================
    PRINT '=== PHASE 3: quote_status_history TABLE ===';
    -- ========================================================================

    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quote_status_history')
    BEGIN
        PRINT 'Creating quote_status_history table from scratch...';
        CREATE TABLE dbo.quote_status_history (
            id          NVARCHAR(1000)  NOT NULL,
            quoteId     NVARCHAR(1000)  NOT NULL,
            fromStatus  NVARCHAR(1000)  NULL,
            toStatus    NVARCHAR(1000)  NOT NULL,
            actorType   NVARCHAR(1000)  NOT NULL,
            actorId     NVARCHAR(1000)  NULL,
            actorName   NVARCHAR(255)   NULL,
            actorIp     NVARCHAR(45)    NULL,
            reason      NVARCHAR(500)   NULL,
            metadata    NVARCHAR(MAX)   NULL,
            createdAt   DATETIME2       NOT NULL DEFAULT GETDATE(),
            CONSTRAINT PK_quote_status_history PRIMARY KEY (id)
        );
        PRINT 'Table quote_status_history created.';
    END
    ELSE
    BEGIN
        PRINT 'Table quote_status_history already exists, checking for missing columns...';

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_status_history') AND name = 'actorName')
            ALTER TABLE dbo.quote_status_history ADD actorName NVARCHAR(255) NULL;

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_status_history') AND name = 'actorIp')
            ALTER TABLE dbo.quote_status_history ADD actorIp NVARCHAR(45) NULL;

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_status_history') AND name = 'reason')
            ALTER TABLE dbo.quote_status_history ADD reason NVARCHAR(500) NULL;

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_status_history') AND name = 'metadata')
            ALTER TABLE dbo.quote_status_history ADD metadata NVARCHAR(MAX) NULL;
    END

    PRINT 'Phase 3 complete: quote_status_history table ready.';

    -- ========================================================================
    PRINT '=== PHASE 4: FOREIGN KEYS ===';
    -- ========================================================================

    -- quote_line_items -> quotes (CASCADE DELETE)
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_quote_line_items_quotes')
    BEGIN
        ALTER TABLE dbo.quote_line_items
            ADD CONSTRAINT FK_quote_line_items_quotes
            FOREIGN KEY (quoteId) REFERENCES dbo.quotes(id) ON DELETE CASCADE;
        PRINT 'FK: quote_line_items -> quotes created.';
    END

    -- quote_line_items -> CatalogItem (SET NULL on delete)
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_quote_line_items_catalog')
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CatalogItem')
        BEGIN
            ALTER TABLE dbo.quote_line_items
                ADD CONSTRAINT FK_quote_line_items_catalog
                FOREIGN KEY (catalogItemId) REFERENCES dbo.CatalogItem(id) ON DELETE SET NULL ON UPDATE NO ACTION;
            PRINT 'FK: quote_line_items -> CatalogItem created.';
        END
        ELSE
            PRINT 'CatalogItem table not found, skipping FK.';
    END

    -- quote_status_history -> quotes (CASCADE DELETE)
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_quote_status_history_quotes')
    BEGIN
        ALTER TABLE dbo.quote_status_history
            ADD CONSTRAINT FK_quote_status_history_quotes
            FOREIGN KEY (quoteId) REFERENCES dbo.quotes(id) ON DELETE CASCADE;
        PRINT 'FK: quote_status_history -> quotes created.';
    END

    -- quotes self-referencing FK for versioning
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_quotes_previousVersion')
    BEGIN
        ALTER TABLE dbo.quotes
            ADD CONSTRAINT FK_quotes_previousVersion
            FOREIGN KEY (previousVersionId) REFERENCES dbo.quotes(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
        PRINT 'FK: quotes -> quotes (previousVersion) created.';
    END

    PRINT 'Phase 4 complete: Foreign keys verified.';

    -- ========================================================================
    PRINT '=== PHASE 5: INDEXES ===';
    -- ========================================================================

    -- quotes indexes
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_quotes_tenantId_status' AND object_id = OBJECT_ID('dbo.quotes'))
        CREATE INDEX IX_quotes_tenantId_status ON dbo.quotes(tenantId, status);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_quotes_tenantId_clienteId' AND object_id = OBJECT_ID('dbo.quotes'))
        CREATE INDEX IX_quotes_tenantId_clienteId ON dbo.quotes(tenantId, clienteId);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_quotes_tenantId_quoteGroupId' AND object_id = OBJECT_ID('dbo.quotes'))
        CREATE INDEX IX_quotes_tenantId_quoteGroupId ON dbo.quotes(tenantId, quoteGroupId);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_quotes_validUntil' AND object_id = OBJECT_ID('dbo.quotes'))
        CREATE INDEX IX_quotes_validUntil ON dbo.quotes(validUntil);

    -- approvalToken unique index
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_quotes_approvalToken' AND object_id = OBJECT_ID('dbo.quotes'))
        CREATE UNIQUE INDEX UQ_quotes_approvalToken ON dbo.quotes(approvalToken) WHERE approvalToken IS NOT NULL;

    -- quote_line_items indexes
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_quote_line_items_quoteId_lineNumber' AND object_id = OBJECT_ID('dbo.quote_line_items'))
        CREATE INDEX IX_quote_line_items_quoteId_lineNumber ON dbo.quote_line_items(quoteId, lineNumber);

    -- quote_status_history indexes
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_quote_status_history_quoteId_createdAt' AND object_id = OBJECT_ID('dbo.quote_status_history'))
        CREATE INDEX IX_quote_status_history_quoteId_createdAt ON dbo.quote_status_history(quoteId, createdAt);

    PRINT 'Phase 5 complete: Indexes verified.';

    -- ========================================================================
    PRINT '=== PHASE 6: UNIQUE CONSTRAINTS ===';
    -- ========================================================================

    -- tenantId + quoteNumber unique constraint
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_quotes_tenantId_quoteNumber' AND object_id = OBJECT_ID('dbo.quotes'))
    BEGIN
        -- Check if there's already a unique constraint with different name
        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes i
            JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            WHERE i.object_id = OBJECT_ID('dbo.quotes') AND i.is_unique = 1
            AND c.name IN ('tenantId', 'quoteNumber')
            GROUP BY i.index_id HAVING COUNT(*) = 2
        )
        BEGIN
            CREATE UNIQUE INDEX UQ_quotes_tenantId_quoteNumber ON dbo.quotes(tenantId, quoteNumber);
            PRINT 'Unique constraint on (tenantId, quoteNumber) created.';
        END
        ELSE
            PRINT 'Unique constraint on (tenantId, quoteNumber) already exists (different name).';
    END

    PRINT 'Phase 6 complete: Unique constraints verified.';

    COMMIT TRANSACTION;
    PRINT '';
    PRINT '============================================================';
    PRINT 'MIGRATION COMPLETE - All tables and columns are now in sync.';
    PRINT '============================================================';
    PRINT '';
    PRINT 'Next steps:';
    PRINT '1. Rebuild API container: docker build -t facturadorsvacr.azurecr.io/facturador-api:v27 -f apps/api/Dockerfile .';
    PRINT '2. Push: docker push facturadorsvacr.azurecr.io/facturador-api:v27';
    PRINT '3. Deploy: az webapp config container set --name facturador-api-sv --resource-group facturador-sv-rg --container-image-name facturadorsvacr.azurecr.io/facturador-api:v27';
    PRINT '4. Restart: az webapp restart --name facturador-api-sv --resource-group facturador-sv-rg';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    PRINT 'ERROR during migration!';
    PRINT 'Error Number: ' + CAST(ERROR_NUMBER() AS NVARCHAR(10));
    PRINT 'Error Message: ' + ERROR_MESSAGE();
    PRINT 'Error Line: ' + CAST(ERROR_LINE() AS NVARCHAR(10));
END CATCH;
