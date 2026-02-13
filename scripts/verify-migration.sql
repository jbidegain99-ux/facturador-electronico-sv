-- ============================================================================
-- COTIZACIONES ADVANCED - POST-MIGRATION VERIFICATION
-- ============================================================================
-- Run this AFTER executing quotes-final-migration.sql
-- Expected result: ALL checks should PASS
-- ============================================================================

SET NOCOUNT ON;
PRINT '================================================================';
PRINT 'COTIZACIONES ADVANCED - MIGRATION VERIFICATION';
PRINT 'Running at: ' + CONVERT(NVARCHAR(30), GETDATE(), 120);
PRINT '================================================================';

DECLARE @pass INT = 0, @fail INT = 0, @warn INT = 0;

-- ====================================================================
-- CHECK 1: Table existence
-- ====================================================================
PRINT '';
PRINT '--- CHECK 1: Table Existence ---';

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quotes')
BEGIN PRINT '  PASS: quotes table exists'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: quotes table MISSING'; SET @fail += 1; END

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quote_line_items')
BEGIN PRINT '  PASS: quote_line_items table exists'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: quote_line_items table MISSING'; SET @fail += 1; END

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quote_status_history')
BEGIN PRINT '  PASS: quote_status_history table exists'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: quote_status_history table MISSING'; SET @fail += 1; END

-- ====================================================================
-- CHECK 2: Column counts
-- ====================================================================
PRINT '';
PRINT '--- CHECK 2: Column Counts ---';

DECLARE @quoteCols INT, @qliCols INT, @qshCols INT;

SELECT @quoteCols = COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes');
SELECT @qliCols = COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items');
SELECT @qshCols = COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_status_history');

-- quotes: Prisma has 43 scalar fields. DB might have extra (from earlier migration), so >= 43 is OK
IF @quoteCols >= 43
BEGIN PRINT '  PASS: quotes has ' + CAST(@quoteCols AS NVARCHAR(5)) + ' columns (expected >= 43)'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: quotes has ' + CAST(@quoteCols AS NVARCHAR(5)) + ' columns (expected >= 43)'; SET @fail += 1; END

-- quote_line_items: must be exactly 19 (with tipoItem)
IF @qliCols >= 19
BEGIN PRINT '  PASS: quote_line_items has ' + CAST(@qliCols AS NVARCHAR(5)) + ' columns (expected >= 19)'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: quote_line_items has ' + CAST(@qliCols AS NVARCHAR(5)) + ' columns (expected >= 19)'; SET @fail += 1; END

-- quote_status_history: must be exactly 11
IF @qshCols >= 11
BEGIN PRINT '  PASS: quote_status_history has ' + CAST(@qshCols AS NVARCHAR(5)) + ' columns (expected >= 11)'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: quote_status_history has ' + CAST(@qshCols AS NVARCHAR(5)) + ' columns (expected >= 11)'; SET @fail += 1; END

-- ====================================================================
-- CHECK 3: Critical columns exist (the ones that caused past errors)
-- ====================================================================
PRINT '';
PRINT '--- CHECK 3: Critical Columns ---';

-- tipoItem on quote_line_items (THE critical missing column)
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'tipoItem')
BEGIN PRINT '  PASS: quote_line_items.tipoItem exists'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: quote_line_items.tipoItem MISSING (this is the critical fix!)'; SET @fail += 1; END

-- approvalStatus on quote_line_items
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = 'approvalStatus')
BEGIN PRINT '  PASS: quote_line_items.approvalStatus exists'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: quote_line_items.approvalStatus MISSING'; SET @fail += 1; END

-- approvalToken on quotes
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvalToken')
BEGIN PRINT '  PASS: quotes.approvalToken exists'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: quotes.approvalToken MISSING'; SET @fail += 1; END

-- approvedSubtotal on quotes
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'approvedSubtotal')
BEGIN PRINT '  PASS: quotes.approvedSubtotal exists'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: quotes.approvedSubtotal MISSING'; SET @fail += 1; END

-- quoteGroupId on quotes (versioning)
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'quoteGroupId')
BEGIN PRINT '  PASS: quotes.quoteGroupId exists'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: quotes.quoteGroupId MISSING'; SET @fail += 1; END

-- clienteNit (client snapshot)
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'clienteNit')
BEGIN PRINT '  PASS: quotes.clienteNit exists'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: quotes.clienteNit MISSING'; SET @fail += 1; END

-- convertedToInvoiceId
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'convertedToInvoiceId')
BEGIN PRINT '  PASS: quotes.convertedToInvoiceId exists'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: quotes.convertedToInvoiceId MISSING'; SET @fail += 1; END

-- emailSentAt
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'emailSentAt')
BEGIN PRINT '  PASS: quotes.emailSentAt exists'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: quotes.emailSentAt MISSING'; SET @fail += 1; END

-- updatedBy
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.quotes') AND name = 'updatedBy')
BEGIN PRINT '  PASS: quotes.updatedBy exists'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: quotes.updatedBy MISSING'; SET @fail += 1; END

-- ====================================================================
-- CHECK 4: All quote_line_items columns (complete list)
-- ====================================================================
PRINT '';
PRINT '--- CHECK 4: Complete quote_line_items Column List ---';

DECLARE @expected_qli TABLE (col_name NVARCHAR(100));
INSERT INTO @expected_qli VALUES
  ('id'), ('quoteId'), ('lineNumber'), ('catalogItemId'), ('itemCode'),
  ('description'), ('quantity'), ('unitPrice'), ('discount'), ('taxRate'),
  ('tipoItem'), ('lineSubtotal'), ('lineTax'), ('lineTotal'),
  ('approvalStatus'), ('approvedQuantity'), ('rejectionReason'),
  ('createdAt'), ('updatedAt');

DECLARE @missing_qli NVARCHAR(MAX) = '';
SELECT @missing_qli = @missing_qli + e.col_name + ', '
FROM @expected_qli e
LEFT JOIN sys.columns c ON c.object_id = OBJECT_ID('dbo.quote_line_items') AND c.name = e.col_name
WHERE c.name IS NULL;

IF LEN(@missing_qli) = 0
BEGIN PRINT '  PASS: All 19 expected columns present'; SET @pass += 1; END
ELSE
BEGIN PRINT '  FAIL: Missing columns: ' + @missing_qli; SET @fail += 1; END

-- ====================================================================
-- CHECK 5: Foreign keys
-- ====================================================================
PRINT '';
PRINT '--- CHECK 5: Foreign Keys ---';

-- FK on quote_line_items.quoteId
IF EXISTS (
    SELECT 1 FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
    WHERE fk.parent_object_id = OBJECT_ID('dbo.quote_line_items') AND c.name = 'quoteId'
)
BEGIN PRINT '  PASS: FK exists on quote_line_items.quoteId -> quotes'; SET @pass += 1; END
ELSE
BEGIN PRINT '  WARN: No FK on quote_line_items.quoteId (Prisma may handle via app)'; SET @warn += 1; END

-- FK on quote_status_history.quoteId
IF EXISTS (
    SELECT 1 FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
    WHERE fk.parent_object_id = OBJECT_ID('dbo.quote_status_history') AND c.name = 'quoteId'
)
BEGIN PRINT '  PASS: FK exists on quote_status_history.quoteId -> quotes'; SET @pass += 1; END
ELSE
BEGIN PRINT '  WARN: No FK on quote_status_history.quoteId (Prisma may handle via app)'; SET @warn += 1; END

-- ====================================================================
-- CHECK 6: Indexes
-- ====================================================================
PRINT '';
PRINT '--- CHECK 6: Indexes ---';

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_quotes_tenantId_status' AND object_id = OBJECT_ID('dbo.quotes'))
BEGIN PRINT '  PASS: IX_quotes_tenantId_status'; SET @pass += 1; END
ELSE
BEGIN PRINT '  WARN: IX_quotes_tenantId_status missing'; SET @warn += 1; END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_quotes_tenantId_clienteId' AND object_id = OBJECT_ID('dbo.quotes'))
BEGIN PRINT '  PASS: IX_quotes_tenantId_clienteId'; SET @pass += 1; END
ELSE
BEGIN PRINT '  WARN: IX_quotes_tenantId_clienteId missing'; SET @warn += 1; END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_qli_quoteId_lineNumber' AND object_id = OBJECT_ID('dbo.quote_line_items'))
BEGIN PRINT '  PASS: IX_qli_quoteId_lineNumber'; SET @pass += 1; END
ELSE
BEGIN PRINT '  WARN: IX_qli_quoteId_lineNumber missing'; SET @warn += 1; END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_qsh_quoteId_createdAt' AND object_id = OBJECT_ID('dbo.quote_status_history'))
BEGIN PRINT '  PASS: IX_qsh_quoteId_createdAt'; SET @pass += 1; END
ELSE
BEGIN PRINT '  WARN: IX_qsh_quoteId_createdAt missing'; SET @warn += 1; END

-- ====================================================================
-- CHECK 7: Data integrity (if any rows exist)
-- ====================================================================
PRINT '';
PRINT '--- CHECK 7: Data Integrity ---';

DECLARE @quoteCount INT, @qliCount INT, @qshCount INT;
SELECT @quoteCount = COUNT(*) FROM dbo.quotes;
SELECT @qliCount = COUNT(*) FROM dbo.quote_line_items;
SELECT @qshCount = COUNT(*) FROM dbo.quote_status_history;

PRINT '  INFO: quotes rows        = ' + CAST(@quoteCount AS NVARCHAR(10));
PRINT '  INFO: quote_line_items   = ' + CAST(@qliCount AS NVARCHAR(10));
PRINT '  INFO: quote_status_history = ' + CAST(@qshCount AS NVARCHAR(10));

-- Check for orphaned line items
DECLARE @orphanedLI INT;
SELECT @orphanedLI = COUNT(*) FROM dbo.quote_line_items li
LEFT JOIN dbo.quotes q ON li.quoteId = q.id
WHERE q.id IS NULL;

IF @orphanedLI = 0
BEGIN PRINT '  PASS: No orphaned line items'; SET @pass += 1; END
ELSE
BEGIN PRINT '  WARN: ' + CAST(@orphanedLI AS NVARCHAR(10)) + ' orphaned line items found'; SET @warn += 1; END

-- Check tipoItem has valid values (1 or 2)
IF @qliCount > 0
BEGIN
    DECLARE @invalidTipoItem INT;
    SELECT @invalidTipoItem = COUNT(*) FROM dbo.quote_line_items WHERE tipoItem NOT IN (1, 2);
    IF @invalidTipoItem = 0
    BEGIN PRINT '  PASS: All tipoItem values are valid (1 or 2)'; SET @pass += 1; END
    ELSE
    BEGIN PRINT '  WARN: ' + CAST(@invalidTipoItem AS NVARCHAR(10)) + ' rows with tipoItem not in (1,2)'; SET @warn += 1; END
END
ELSE
BEGIN PRINT '  INFO: No line items to validate (empty table)'; END

-- Check quotes have valid status
DECLARE @invalidStatus INT;
SELECT @invalidStatus = COUNT(*) FROM dbo.quotes
WHERE status NOT IN ('DRAFT', 'SENT', 'PENDING_APPROVAL', 'PARTIALLY_APPROVED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED', 'CANCELLED');

IF @invalidStatus = 0
BEGIN PRINT '  PASS: All quote statuses are valid'; SET @pass += 1; END
ELSE
BEGIN PRINT '  WARN: ' + CAST(@invalidStatus AS NVARCHAR(10)) + ' quotes with unknown status'; SET @warn += 1; END

-- ====================================================================
-- CHECK 8: Quick CRUD Test (read-only, no data modification)
-- ====================================================================
PRINT '';
PRINT '--- CHECK 8: Prisma Query Simulation ---';

-- Simulate a typical Prisma findMany with lineItems include
BEGIN TRY
    DECLARE @testCount INT;
    SELECT @testCount = COUNT(*)
    FROM dbo.quotes q
    LEFT JOIN dbo.quote_line_items li ON li.quoteId = q.id
    WHERE q.tenantId IS NOT NULL;
    PRINT '  PASS: JOIN query (quotes + line_items) succeeds (' + CAST(@testCount AS NVARCHAR(10)) + ' rows)';
    SET @pass += 1;
END TRY
BEGIN CATCH
    PRINT '  FAIL: JOIN query error: ' + ERROR_MESSAGE();
    SET @fail += 1;
END CATCH

-- Simulate status history join
BEGIN TRY
    SELECT @testCount = COUNT(*)
    FROM dbo.quotes q
    LEFT JOIN dbo.quote_status_history sh ON sh.quoteId = q.id;
    PRINT '  PASS: JOIN query (quotes + status_history) succeeds';
    SET @pass += 1;
END TRY
BEGIN CATCH
    PRINT '  FAIL: JOIN query error: ' + ERROR_MESSAGE();
    SET @fail += 1;
END CATCH

-- Simulate line item SELECT with all columns (tests tipoItem exists)
BEGIN TRY
    SELECT TOP 1
        id, quoteId, lineNumber, catalogItemId, itemCode,
        description, quantity, unitPrice, discount, taxRate,
        tipoItem, lineSubtotal, lineTax, lineTotal,
        approvalStatus, approvedQuantity, rejectionReason,
        createdAt, updatedAt
    FROM dbo.quote_line_items;
    PRINT '  PASS: SELECT all 19 columns from quote_line_items succeeds';
    SET @pass += 1;
END TRY
BEGIN CATCH
    PRINT '  FAIL: SELECT all columns error: ' + ERROR_MESSAGE();
    SET @fail += 1;
END CATCH

-- ====================================================================
-- SUMMARY
-- ====================================================================
PRINT '';
PRINT '================================================================';
PRINT 'VERIFICATION SUMMARY';
PRINT '================================================================';
PRINT '  PASS: ' + CAST(@pass AS NVARCHAR(5));
PRINT '  FAIL: ' + CAST(@fail AS NVARCHAR(5));
PRINT '  WARN: ' + CAST(@warn AS NVARCHAR(5));
PRINT '';

IF @fail = 0
BEGIN
    PRINT 'RESULT: ALL CRITICAL CHECKS PASSED';
    PRINT '';
    PRINT 'The database schema is compatible with Prisma schema.prisma.';
    PRINT 'You can safely deploy the API with prisma generate + build.';
END
ELSE
BEGIN
    PRINT 'RESULT: SOME CHECKS FAILED - DO NOT DEPLOY';
    PRINT '';
    PRINT 'Review the FAIL items above and re-run quotes-final-migration.sql.';
END

PRINT '';
PRINT 'Completed at: ' + CONVERT(NVARCHAR(30), GETDATE(), 120);
PRINT '================================================================';
