-- ============================================================================
-- COTIZACIONES ADVANCED - FINAL IDEMPOTENT MIGRATION
-- ============================================================================
-- Target: Align Azure SQL Database with Prisma schema.prisma
-- Tables: quotes (@@map), quote_line_items (@@map), quote_status_history (@@map)
--
-- Known DB state:
--   quotes            = 44 columns (Prisma expects 43 scalar → DB has 1 extra, OK)
--   quote_line_items  = 18 columns (Prisma expects 19 scalar → 1 MISSING)
--   quote_status_history = 11 columns (Prisma expects 11 → complete)
--
-- Confirmed missing: tipoItem on quote_line_items
-- This script adds ALL potentially missing columns as safety net.
-- Safe to re-run: every operation is guarded with IF NOT EXISTS.
-- ============================================================================

SET NOCOUNT ON;
PRINT '================================================================';
PRINT 'COTIZACIONES ADVANCED - FINAL MIGRATION';
PRINT 'Started at: ' + CONVERT(NVARCHAR(30), GETDATE(), 120);
PRINT '================================================================';

BEGIN TRY
    BEGIN TRANSACTION;

    -- ====================================================================
    -- PHASE 1: quotes TABLE — ensure all expected columns exist
    -- ====================================================================
    PRINT '';
    PRINT '--- PHASE 1: quotes table columns ---';

    -- Versioning
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'quoteGroupId')
    BEGIN ALTER TABLE dbo.quotes ADD quoteGroupId NVARCHAR(1000) NULL; PRINT '  + Added quoteGroupId'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'version')
    BEGIN ALTER TABLE dbo.quotes ADD version INT NOT NULL CONSTRAINT DF_quotes_version DEFAULT 1; PRINT '  + Added version'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'isLatestVersion')
    BEGIN ALTER TABLE dbo.quotes ADD isLatestVersion BIT NOT NULL CONSTRAINT DF_quotes_isLatestVersion DEFAULT 1; PRINT '  + Added isLatestVersion'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'previousVersionId')
    BEGIN ALTER TABLE dbo.quotes ADD previousVersionId NVARCHAR(1000) NULL; PRINT '  + Added previousVersionId'; END

    -- Client snapshots
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'clienteNit')
    BEGIN ALTER TABLE dbo.quotes ADD clienteNit NVARCHAR(20) NULL; PRINT '  + Added clienteNit'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'clienteNombre')
    BEGIN ALTER TABLE dbo.quotes ADD clienteNombre NVARCHAR(255) NULL; PRINT '  + Added clienteNombre'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'clienteEmail')
    BEGIN ALTER TABLE dbo.quotes ADD clienteEmail NVARCHAR(255) NULL; PRINT '  + Added clienteEmail'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'clienteDireccion')
    BEGIN ALTER TABLE dbo.quotes ADD clienteDireccion NVARCHAR(500) NULL; PRINT '  + Added clienteDireccion'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'clienteTelefono')
    BEGIN ALTER TABLE dbo.quotes ADD clienteTelefono NVARCHAR(20) NULL; PRINT '  + Added clienteTelefono'; END

    -- Dates
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'issueDate')
    BEGIN ALTER TABLE dbo.quotes ADD issueDate DATETIME2 NOT NULL CONSTRAINT DF_quotes_issueDate DEFAULT GETDATE(); PRINT '  + Added issueDate'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'sentAt')
    BEGIN ALTER TABLE dbo.quotes ADD sentAt DATETIME2 NULL; PRINT '  + Added sentAt'; END

    -- Approved totals
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvedSubtotal')
    BEGIN ALTER TABLE dbo.quotes ADD approvedSubtotal DECIMAL(12,2) NULL; PRINT '  + Added approvedSubtotal'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvedTaxAmount')
    BEGIN ALTER TABLE dbo.quotes ADD approvedTaxAmount DECIMAL(12,2) NULL; PRINT '  + Added approvedTaxAmount'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvedTotal')
    BEGIN ALTER TABLE dbo.quotes ADD approvedTotal DECIMAL(12,2) NULL; PRINT '  + Added approvedTotal'; END

    -- Content
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'terms')
    BEGIN ALTER TABLE dbo.quotes ADD terms NVARCHAR(2000) NULL; PRINT '  + Added terms'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'notes')
    BEGIN ALTER TABLE dbo.quotes ADD notes NVARCHAR(1000) NULL; PRINT '  + Added notes'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'clientNotes')
    BEGIN ALTER TABLE dbo.quotes ADD clientNotes NVARCHAR(1000) NULL; PRINT '  + Added clientNotes'; END

    -- Approval portal
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvalToken')
    BEGIN ALTER TABLE dbo.quotes ADD approvalToken NVARCHAR(1000) NULL; PRINT '  + Added approvalToken'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvalUrl')
    BEGIN ALTER TABLE dbo.quotes ADD approvalUrl NVARCHAR(500) NULL; PRINT '  + Added approvalUrl'; END

    -- Approval result
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvedAt')
    BEGIN ALTER TABLE dbo.quotes ADD approvedAt DATETIME2 NULL; PRINT '  + Added approvedAt'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvedBy')
    BEGIN ALTER TABLE dbo.quotes ADD approvedBy NVARCHAR(255) NULL; PRINT '  + Added approvedBy'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'rejectedAt')
    BEGIN ALTER TABLE dbo.quotes ADD rejectedAt DATETIME2 NULL; PRINT '  + Added rejectedAt'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'rejectionReason')
    BEGIN ALTER TABLE dbo.quotes ADD rejectionReason NVARCHAR(1000) NULL; PRINT '  + Added rejectionReason'; END

    -- Conversion
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'convertedToInvoiceId')
    BEGIN ALTER TABLE dbo.quotes ADD convertedToInvoiceId NVARCHAR(1000) NULL; PRINT '  + Added convertedToInvoiceId'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'convertedAt')
    BEGIN ALTER TABLE dbo.quotes ADD convertedAt DATETIME2 NULL; PRINT '  + Added convertedAt'; END

    -- Email tracking
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'emailSentAt')
    BEGIN ALTER TABLE dbo.quotes ADD emailSentAt DATETIME2 NULL; PRINT '  + Added emailSentAt'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'emailDelivered')
    BEGIN ALTER TABLE dbo.quotes ADD emailDelivered BIT NULL CONSTRAINT DF_quotes_emailDelivered DEFAULT 0; PRINT '  + Added emailDelivered (nullable)'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'remindersSent')
    BEGIN ALTER TABLE dbo.quotes ADD remindersSent INT NULL CONSTRAINT DF_quotes_remindersSent DEFAULT 0; PRINT '  + Added remindersSent (nullable)'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'lastReminderAt')
    BEGIN ALTER TABLE dbo.quotes ADD lastReminderAt DATETIME2 NULL; PRINT '  + Added lastReminderAt'; END

    -- Audit
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'createdBy')
    BEGIN ALTER TABLE dbo.quotes ADD createdBy NVARCHAR(1000) NOT NULL CONSTRAINT DF_quotes_createdBy DEFAULT ''; PRINT '  + Added createdBy'; END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'updatedBy')
    BEGIN ALTER TABLE dbo.quotes ADD updatedBy NVARCHAR(1000) NULL; PRINT '  + Added updatedBy'; END

    PRINT '  Phase 1 complete.';

    -- ====================================================================
    -- PHASE 2: quote_line_items TABLE
    -- ====================================================================
    PRINT '';
    PRINT '--- PHASE 2: quote_line_items table ---';

    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quote_line_items')
    BEGIN
        PRINT '  Creating quote_line_items table...';
        CREATE TABLE dbo.quote_line_items (
            id               NVARCHAR(1000)  NOT NULL,
            quoteId          NVARCHAR(1000)  NOT NULL,
            lineNumber       INT             NOT NULL,
            catalogItemId    NVARCHAR(1000)  NULL,
            itemCode         NVARCHAR(100)   NULL,
            description      NVARCHAR(500)   NOT NULL,
            quantity         DECIMAL(12,4)   NOT NULL,
            unitPrice        DECIMAL(12,2)   NOT NULL,
            discount         DECIMAL(12,2)   NOT NULL CONSTRAINT DF_qli_discount DEFAULT 0,
            taxRate          DECIMAL(5,2)    NOT NULL CONSTRAINT DF_qli_taxRate DEFAULT 13,
            tipoItem         INT             NOT NULL CONSTRAINT DF_qli_tipoItem DEFAULT 1,
            lineSubtotal     DECIMAL(12,2)   NOT NULL,
            lineTax          DECIMAL(12,2)   NOT NULL,
            lineTotal        DECIMAL(12,2)   NOT NULL,
            approvalStatus   NVARCHAR(1000)  NOT NULL CONSTRAINT DF_qli_approvalStatus DEFAULT 'PENDING',
            approvedQuantity DECIMAL(12,4)   NULL,
            rejectionReason  NVARCHAR(500)   NULL,
            createdAt        DATETIME2       NOT NULL CONSTRAINT DF_qli_createdAt DEFAULT GETDATE(),
            updatedAt        DATETIME2       NOT NULL CONSTRAINT DF_qli_updatedAt DEFAULT GETDATE(),
            CONSTRAINT PK_quote_line_items PRIMARY KEY (id)
        );
        PRINT '  Table created with 19 columns.';
    END
    ELSE
    BEGIN
        PRINT '  Table exists. Checking for missing columns...';

        -- THE CRITICAL FIX: tipoItem is the confirmed missing column
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'tipoItem')
        BEGIN ALTER TABLE dbo.quote_line_items ADD tipoItem INT NOT NULL CONSTRAINT DF_qli_tipoItem DEFAULT 1; PRINT '  + Added tipoItem (THE FIX)'; END

        -- Safety: check all other columns too
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'catalogItemId')
        BEGIN ALTER TABLE dbo.quote_line_items ADD catalogItemId NVARCHAR(1000) NULL; PRINT '  + Added catalogItemId'; END

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'itemCode')
        BEGIN ALTER TABLE dbo.quote_line_items ADD itemCode NVARCHAR(100) NULL; PRINT '  + Added itemCode'; END

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'discount')
        BEGIN ALTER TABLE dbo.quote_line_items ADD discount DECIMAL(12,2) NOT NULL CONSTRAINT DF_qli_discount DEFAULT 0; PRINT '  + Added discount'; END

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'taxRate')
        BEGIN ALTER TABLE dbo.quote_line_items ADD taxRate DECIMAL(5,2) NOT NULL CONSTRAINT DF_qli_taxRate DEFAULT 13; PRINT '  + Added taxRate'; END

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'lineSubtotal')
        BEGIN ALTER TABLE dbo.quote_line_items ADD lineSubtotal DECIMAL(12,2) NOT NULL CONSTRAINT DF_qli_lineSubtotal DEFAULT 0; PRINT '  + Added lineSubtotal'; END

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'lineTax')
        BEGIN ALTER TABLE dbo.quote_line_items ADD lineTax DECIMAL(12,2) NOT NULL CONSTRAINT DF_qli_lineTax DEFAULT 0; PRINT '  + Added lineTax'; END

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'lineTotal')
        BEGIN ALTER TABLE dbo.quote_line_items ADD lineTotal DECIMAL(12,2) NOT NULL CONSTRAINT DF_qli_lineTotal DEFAULT 0; PRINT '  + Added lineTotal'; END

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'approvalStatus')
        BEGIN ALTER TABLE dbo.quote_line_items ADD approvalStatus NVARCHAR(1000) NOT NULL CONSTRAINT DF_qli_approvalStatus DEFAULT 'PENDING'; PRINT '  + Added approvalStatus'; END

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'approvedQuantity')
        BEGIN ALTER TABLE dbo.quote_line_items ADD approvedQuantity DECIMAL(12,4) NULL; PRINT '  + Added approvedQuantity'; END

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'rejectionReason')
        BEGIN ALTER TABLE dbo.quote_line_items ADD rejectionReason NVARCHAR(500) NULL; PRINT '  + Added rejectionReason'; END

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'createdAt')
        BEGIN ALTER TABLE dbo.quote_line_items ADD createdAt DATETIME2 NOT NULL CONSTRAINT DF_qli_createdAt DEFAULT GETDATE(); PRINT '  + Added createdAt'; END

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'updatedAt')
        BEGIN ALTER TABLE dbo.quote_line_items ADD updatedAt DATETIME2 NOT NULL CONSTRAINT DF_qli_updatedAt DEFAULT GETDATE(); PRINT '  + Added updatedAt'; END
    END

    PRINT '  Phase 2 complete.';

    -- ====================================================================
    -- PHASE 3: quote_status_history TABLE
    -- ====================================================================
    PRINT '';
    PRINT '--- PHASE 3: quote_status_history table ---';

    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quote_status_history')
    BEGIN
        PRINT '  Creating quote_status_history table...';
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
            createdAt   DATETIME2       NOT NULL CONSTRAINT DF_qsh_createdAt DEFAULT GETDATE(),
            CONSTRAINT PK_quote_status_history PRIMARY KEY (id)
        );
        PRINT '  Table created with 11 columns.';
    END
    ELSE
    BEGIN
        PRINT '  Table exists (11 columns confirmed). Verifying...';

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_status_history') AND name = 'actorName')
        BEGIN ALTER TABLE dbo.quote_status_history ADD actorName NVARCHAR(255) NULL; PRINT '  + Added actorName'; END

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_status_history') AND name = 'actorIp')
        BEGIN ALTER TABLE dbo.quote_status_history ADD actorIp NVARCHAR(45) NULL; PRINT '  + Added actorIp'; END

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_status_history') AND name = 'reason')
        BEGIN ALTER TABLE dbo.quote_status_history ADD reason NVARCHAR(500) NULL; PRINT '  + Added reason'; END

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_status_history') AND name = 'metadata')
        BEGIN ALTER TABLE dbo.quote_status_history ADD metadata NVARCHAR(MAX) NULL; PRINT '  + Added metadata'; END
    END

    PRINT '  Phase 3 complete.';

    -- ====================================================================
    -- PHASE 4: FOREIGN KEYS
    -- ====================================================================
    PRINT '';
    PRINT '--- PHASE 4: Foreign keys ---';

    -- quote_line_items -> quotes (CASCADE DELETE)
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_quote_line_items_quoteId')
    BEGIN
        -- Check for any existing FK on (quoteId) before creating
        IF NOT EXISTS (
            SELECT 1 FROM sys.foreign_keys fk
            JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
            JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
            WHERE fk.parent_object_id = OBJECT_ID('dbo.quote_line_items') AND c.name = 'quoteId'
        )
        BEGIN
            ALTER TABLE dbo.quote_line_items
                ADD CONSTRAINT FK_quote_line_items_quoteId
                FOREIGN KEY (quoteId) REFERENCES dbo.quotes(id) ON DELETE CASCADE;
            PRINT '  + FK: quote_line_items.quoteId -> quotes.id (CASCADE)';
        END
        ELSE PRINT '  = FK on quote_line_items.quoteId already exists (different name)';
    END
    ELSE PRINT '  = FK_quote_line_items_quoteId exists';

    -- quote_line_items -> CatalogItem (SET NULL)
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_quote_line_items_catalogItemId')
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CatalogItem')
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM sys.foreign_keys fk
                JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
                JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
                WHERE fk.parent_object_id = OBJECT_ID('dbo.quote_line_items') AND c.name = 'catalogItemId'
            )
            BEGIN
                ALTER TABLE dbo.quote_line_items
                    ADD CONSTRAINT FK_quote_line_items_catalogItemId
                    FOREIGN KEY (catalogItemId) REFERENCES dbo.CatalogItem(id) ON DELETE SET NULL ON UPDATE NO ACTION;
                PRINT '  + FK: quote_line_items.catalogItemId -> CatalogItem.id (SET NULL)';
            END
            ELSE PRINT '  = FK on quote_line_items.catalogItemId already exists (different name)';
        END
        ELSE PRINT '  - Skipped FK to CatalogItem (table not found)';
    END
    ELSE PRINT '  = FK_quote_line_items_catalogItemId exists';

    -- quote_status_history -> quotes (CASCADE DELETE)
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_quote_status_history_quoteId')
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM sys.foreign_keys fk
            JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
            JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
            WHERE fk.parent_object_id = OBJECT_ID('dbo.quote_status_history') AND c.name = 'quoteId'
        )
        BEGIN
            ALTER TABLE dbo.quote_status_history
                ADD CONSTRAINT FK_quote_status_history_quoteId
                FOREIGN KEY (quoteId) REFERENCES dbo.quotes(id) ON DELETE CASCADE;
            PRINT '  + FK: quote_status_history.quoteId -> quotes.id (CASCADE)';
        END
        ELSE PRINT '  = FK on quote_status_history.quoteId already exists (different name)';
    END
    ELSE PRINT '  = FK_quote_status_history_quoteId exists';

    -- quotes self-referencing (previousVersionId)
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_quotes_previousVersionId')
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM sys.foreign_keys fk
            JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
            JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
            WHERE fk.parent_object_id = OBJECT_ID('dbo.quotes') AND c.name = 'previousVersionId'
        )
        BEGIN
            ALTER TABLE dbo.quotes
                ADD CONSTRAINT FK_quotes_previousVersionId
                FOREIGN KEY (previousVersionId) REFERENCES dbo.quotes(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
            PRINT '  + FK: quotes.previousVersionId -> quotes.id (NO ACTION)';
        END
        ELSE PRINT '  = FK on quotes.previousVersionId already exists (different name)';
    END
    ELSE PRINT '  = FK_quotes_previousVersionId exists';

    PRINT '  Phase 4 complete.';

    -- ====================================================================
    -- PHASE 5: INDEXES
    -- ====================================================================
    PRINT '';
    PRINT '--- PHASE 5: Indexes ---';

    -- quotes indexes
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_quotes_tenantId_status' AND object_id = OBJECT_ID('dbo.quotes'))
    BEGIN CREATE INDEX IX_quotes_tenantId_status ON dbo.quotes(tenantId, status); PRINT '  + IX_quotes_tenantId_status'; END

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_quotes_tenantId_clienteId' AND object_id = OBJECT_ID('dbo.quotes'))
    BEGIN CREATE INDEX IX_quotes_tenantId_clienteId ON dbo.quotes(tenantId, clienteId); PRINT '  + IX_quotes_tenantId_clienteId'; END

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_quotes_tenantId_quoteGroupId' AND object_id = OBJECT_ID('dbo.quotes'))
    BEGIN CREATE INDEX IX_quotes_tenantId_quoteGroupId ON dbo.quotes(tenantId, quoteGroupId); PRINT '  + IX_quotes_tenantId_quoteGroupId'; END

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_quotes_validUntil' AND object_id = OBJECT_ID('dbo.quotes'))
    BEGIN CREATE INDEX IX_quotes_validUntil ON dbo.quotes(validUntil); PRINT '  + IX_quotes_validUntil'; END

    -- approvalToken unique (filtered — NULL values excluded)
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_quotes_approvalToken' AND object_id = OBJECT_ID('dbo.quotes'))
    BEGIN CREATE UNIQUE INDEX UQ_quotes_approvalToken ON dbo.quotes(approvalToken) WHERE approvalToken IS NOT NULL; PRINT '  + UQ_quotes_approvalToken (filtered unique)'; END

    -- tenantId + quoteNumber unique
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_quotes_tenantId_quoteNumber' AND object_id = OBJECT_ID('dbo.quotes'))
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes i
            JOIN sys.index_columns ic1 ON i.object_id = ic1.object_id AND i.index_id = ic1.index_id
            JOIN sys.columns c1 ON ic1.object_id = c1.object_id AND ic1.column_id = c1.column_id
            JOIN sys.index_columns ic2 ON i.object_id = ic2.object_id AND i.index_id = ic2.index_id
            JOIN sys.columns c2 ON ic2.object_id = c2.object_id AND ic2.column_id = c2.column_id
            WHERE i.object_id = OBJECT_ID('dbo.quotes') AND i.is_unique = 1
            AND c1.name = 'tenantId' AND c2.name = 'quoteNumber' AND c1.column_id <> c2.column_id
        )
        BEGIN CREATE UNIQUE INDEX UQ_quotes_tenantId_quoteNumber ON dbo.quotes(tenantId, quoteNumber); PRINT '  + UQ_quotes_tenantId_quoteNumber'; END
        ELSE PRINT '  = Unique(tenantId, quoteNumber) exists (different name)';
    END
    ELSE PRINT '  = UQ_quotes_tenantId_quoteNumber exists';

    -- quote_line_items indexes
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_qli_quoteId_lineNumber' AND object_id = OBJECT_ID('dbo.quote_line_items'))
    BEGIN CREATE INDEX IX_qli_quoteId_lineNumber ON dbo.quote_line_items(quoteId, lineNumber); PRINT '  + IX_qli_quoteId_lineNumber'; END

    -- quote_status_history indexes
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_qsh_quoteId_createdAt' AND object_id = OBJECT_ID('dbo.quote_status_history'))
    BEGIN CREATE INDEX IX_qsh_quoteId_createdAt ON dbo.quote_status_history(quoteId, createdAt); PRINT '  + IX_qsh_quoteId_createdAt'; END

    PRINT '  Phase 5 complete.';

    -- ====================================================================
    COMMIT TRANSACTION;

    PRINT '';
    PRINT '================================================================';
    PRINT 'MIGRATION COMPLETED SUCCESSFULLY';
    PRINT 'Finished at: ' + CONVERT(NVARCHAR(30), GETDATE(), 120);
    PRINT '================================================================';
    PRINT '';
    PRINT 'Column counts should now be:';
    PRINT '  quotes:               43+ columns (OK)';
    PRINT '  quote_line_items:     19  columns (tipoItem added)';
    PRINT '  quote_status_history: 11  columns (complete)';
    PRINT '';
    PRINT 'Next: Run verify-migration.sql to confirm.';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    PRINT '';
    PRINT '!!! MIGRATION FAILED - ROLLED BACK !!!';
    PRINT 'Error Number:  ' + CAST(ERROR_NUMBER() AS NVARCHAR(10));
    PRINT 'Error Message: ' + ERROR_MESSAGE();
    PRINT 'Error Line:    ' + CAST(ERROR_LINE() AS NVARCHAR(10));
    PRINT 'Error State:   ' + CAST(ERROR_STATE() AS NVARCHAR(10));
END CATCH;
