-- DteOperationLog: registra cada operación (VALIDATION, SIGNING, TRANSMISSION, RECEIPT)
CREATE TABLE [dbo].[DteOperationLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [dteId] NVARCHAR(36) NOT NULL,
    [dteType] NVARCHAR(20),
    [dteNumber] NVARCHAR(50),
    [operationType] NVARCHAR(50) NOT NULL,
    [status] NVARCHAR(20) NOT NULL,
    [timestamp] DATETIME2 NOT NULL CONSTRAINT [DteOperationLog_timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    [emitterNit] NVARCHAR(50),
    [receiverNit] NVARCHAR(50),
    [operationDetails] NVARCHAR(MAX),
    CONSTRAINT [DteOperationLog_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [FK_DteOperationLog_Tenant] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE INDEX [IX_DteOperationLog_Tenant_Timestamp] ON [dbo].[DteOperationLog]([tenantId], [timestamp] DESC);
CREATE INDEX [IX_DteOperationLog_DteId] ON [dbo].[DteOperationLog]([dteId]);

-- DteErrorLog: detalles de cada error
CREATE TABLE [dbo].[DteErrorLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [operationLogId] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [dteId] NVARCHAR(36),
    [timestamp] DATETIME2 NOT NULL CONSTRAINT [DteErrorLog_timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    [errorType] NVARCHAR(100) NOT NULL,
    [errorCode] NVARCHAR(50) NOT NULL,
    [rawErrorMessage] NVARCHAR(MAX),
    [field] NVARCHAR(100),
    [value] NVARCHAR(500),
    [expectedFormat] NVARCHAR(500),
    [mhStatusCode] INT,
    [mhResponseBody] NVARCHAR(MAX),
    [userFriendlyMessage] NVARCHAR(MAX),
    [suggestedAction] NVARCHAR(MAX),
    [resolvable] BIT NOT NULL CONSTRAINT [DteErrorLog_resolvable_df] DEFAULT 0,
    CONSTRAINT [DteErrorLog_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [FK_DteErrorLog_OperationLog] FOREIGN KEY ([operationLogId]) REFERENCES [dbo].[DteOperationLog]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [FK_DteErrorLog_Tenant] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE INDEX [IX_DteErrorLog_Tenant_Timestamp] ON [dbo].[DteErrorLog]([tenantId], [timestamp] DESC);
CREATE INDEX [IX_DteErrorLog_DteId] ON [dbo].[DteErrorLog]([dteId]);
