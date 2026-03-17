-- Add error detail fields to DTE table for UI display
ALTER TABLE [dbo].[DTE] ADD
  [lastError] NVARCHAR(MAX) NULL,
  [lastErrorAt] DATETIME2 NULL,
  [lastErrorOperationType] NVARCHAR(50) NULL;

-- Index for querying DTEs with errors by tenant
CREATE INDEX [DTE_tenantId_lastErrorAt_idx] ON [dbo].[DTE]([tenantId], [lastErrorAt] DESC) WHERE [lastErrorAt] IS NOT NULL;
