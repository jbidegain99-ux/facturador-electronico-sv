-- ============================================================================
-- QUOTES MODULE - DIAGNOSTIC SCRIPT
-- Run this in Azure Portal Query Editor to see current DB state
-- ============================================================================

-- 1. Check if tables exist
PRINT '=== TABLE EXISTENCE CHECK ===';
SELECT
    'quotes' AS TableName,
    CASE WHEN EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quotes') THEN 'EXISTS' ELSE 'MISSING' END AS Status
UNION ALL
SELECT
    'quote_line_items',
    CASE WHEN EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quote_line_items') THEN 'EXISTS' ELSE 'MISSING' END
UNION ALL
SELECT
    'quote_status_history',
    CASE WHEN EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quote_status_history') THEN 'EXISTS' ELSE 'MISSING' END;

-- 2. List ALL columns in quotes table
PRINT '=== QUOTES TABLE COLUMNS ===';
SELECT c.name AS ColumnName, t.name AS DataType, c.max_length, c.is_nullable
FROM sys.columns c
JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('dbo.quotes')
ORDER BY c.column_id;

-- 3. List ALL columns in quote_line_items table (if exists)
PRINT '=== QUOTE_LINE_ITEMS TABLE COLUMNS ===';
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quote_line_items')
BEGIN
    SELECT c.name AS ColumnName, t.name AS DataType, c.max_length, c.is_nullable
    FROM sys.columns c
    JOIN sys.types t ON c.user_type_id = t.user_type_id
    WHERE c.object_id = OBJECT_ID('dbo.quote_line_items')
    ORDER BY c.column_id;
END
ELSE
    PRINT 'Table quote_line_items does NOT exist!';

-- 4. List ALL columns in quote_status_history table (if exists)
PRINT '=== QUOTE_STATUS_HISTORY TABLE COLUMNS ===';
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quote_status_history')
BEGIN
    SELECT c.name AS ColumnName, t.name AS DataType, c.max_length, c.is_nullable
    FROM sys.columns c
    JOIN sys.types t ON c.user_type_id = t.user_type_id
    WHERE c.object_id = OBJECT_ID('dbo.quote_status_history')
    ORDER BY c.column_id;
END
ELSE
    PRINT 'Table quote_status_history does NOT exist!';

-- 5. Check EXPECTED columns vs ACTUAL for quotes table
PRINT '=== MISSING COLUMNS CHECK - QUOTES ===';
SELECT ExpectedColumn,
    CASE WHEN EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('dbo.quotes') AND name = ExpectedColumn
    ) THEN 'OK' ELSE '** MISSING **' END AS Status
FROM (VALUES
    ('id'), ('tenantId'), ('quoteNumber'), ('quoteGroupId'), ('version'),
    ('isLatestVersion'), ('previousVersionId'), ('clienteId'),
    ('clienteNit'), ('clienteNombre'), ('clienteEmail'), ('clienteDireccion'), ('clienteTelefono'),
    ('issueDate'), ('validUntil'), ('sentAt'), ('status'),
    ('subtotal'), ('taxAmount'), ('total'),
    ('approvedSubtotal'), ('approvedTaxAmount'), ('approvedTotal'),
    ('items'), ('terms'), ('notes'), ('clientNotes'),
    ('approvalToken'), ('approvalUrl'),
    ('approvedAt'), ('approvedBy'), ('rejectedAt'), ('rejectionReason'),
    ('convertedToInvoiceId'), ('convertedAt'),
    ('emailSentAt'), ('emailDelivered'), ('remindersSent'), ('lastReminderAt'),
    ('createdBy'), ('updatedBy'),
    ('createdAt'), ('updatedAt')
) AS Expected(ExpectedColumn);

-- 6. Check EXPECTED columns vs ACTUAL for quote_line_items table
PRINT '=== MISSING COLUMNS CHECK - QUOTE_LINE_ITEMS ===';
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quote_line_items')
BEGIN
    SELECT ExpectedColumn,
        CASE WHEN EXISTS (
            SELECT 1 FROM sys.columns
            WHERE object_id = OBJECT_ID('dbo.quote_line_items') AND name = ExpectedColumn
        ) THEN 'OK' ELSE '** MISSING **' END AS Status
    FROM (VALUES
        ('id'), ('quoteId'), ('lineNumber'),
        ('catalogItemId'), ('itemCode'), ('description'),
        ('quantity'), ('unitPrice'), ('discount'), ('taxRate'), ('tipoItem'),
        ('lineSubtotal'), ('lineTax'), ('lineTotal'),
        ('approvalStatus'), ('approvedQuantity'), ('rejectionReason'),
        ('createdAt'), ('updatedAt')
    ) AS Expected(ExpectedColumn);
END
ELSE
    PRINT 'Table quote_line_items does NOT exist - ALL columns missing!';

-- 7. Check EXPECTED columns vs ACTUAL for quote_status_history table
PRINT '=== MISSING COLUMNS CHECK - QUOTE_STATUS_HISTORY ===';
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quote_status_history')
BEGIN
    SELECT ExpectedColumn,
        CASE WHEN EXISTS (
            SELECT 1 FROM sys.columns
            WHERE object_id = OBJECT_ID('dbo.quote_status_history') AND name = ExpectedColumn
        ) THEN 'OK' ELSE '** MISSING **' END AS Status
    FROM (VALUES
        ('id'), ('quoteId'),
        ('fromStatus'), ('toStatus'),
        ('actorType'), ('actorId'), ('actorName'), ('actorIp'),
        ('reason'), ('metadata'),
        ('createdAt')
    ) AS Expected(ExpectedColumn);
END
ELSE
    PRINT 'Table quote_status_history does NOT exist - ALL columns missing!';

-- 8. Check indexes
PRINT '=== INDEX CHECK ===';
SELECT
    t.name AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType,
    STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS Columns
FROM sys.indexes i
JOIN sys.tables t ON i.object_id = t.object_id
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE t.name IN ('quotes', 'quote_line_items', 'quote_status_history')
GROUP BY t.name, i.name, i.type_desc
ORDER BY t.name, i.name;

-- 9. Row counts
PRINT '=== ROW COUNTS ===';
SELECT 'quotes' AS TableName, COUNT(*) AS RowCount FROM dbo.quotes
UNION ALL
SELECT 'quote_line_items', CASE WHEN EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quote_line_items') THEN (SELECT COUNT(*) FROM dbo.quote_line_items) ELSE -1 END
UNION ALL
SELECT 'quote_status_history', CASE WHEN EXISTS (SELECT 1 FROM sys.tables WHERE name = 'quote_status_history') THEN (SELECT COUNT(*) FROM dbo.quote_status_history) ELSE -1 END;
