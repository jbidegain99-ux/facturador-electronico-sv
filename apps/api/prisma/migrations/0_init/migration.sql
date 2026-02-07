BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Tenant] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [nit] NVARCHAR(1000) NOT NULL,
    [nrc] NVARCHAR(1000) NOT NULL,
    [actividadEcon] NVARCHAR(1000) NOT NULL,
    [direccion] NVARCHAR(max) NOT NULL,
    [telefono] NVARCHAR(1000) NOT NULL,
    [correo] NVARCHAR(1000) NOT NULL,
    [nombreComercial] NVARCHAR(1000),
    [certificatePath] NVARCHAR(1000),
    [mhToken] NVARCHAR(max),
    [mhTokenExpiry] DATETIME2,
    [logoUrl] NVARCHAR(1000),
    [primaryColor] NVARCHAR(1000) CONSTRAINT [Tenant_primaryColor_df] DEFAULT '#8b5cf6',
    [plan] NVARCHAR(1000) NOT NULL CONSTRAINT [Tenant_plan_df] DEFAULT 'TRIAL',
    [planId] NVARCHAR(1000),
    [planStatus] NVARCHAR(1000) NOT NULL CONSTRAINT [Tenant_planStatus_df] DEFAULT 'ACTIVE',
    [planExpiry] DATETIME2,
    [maxDtesPerMonth] INT NOT NULL CONSTRAINT [Tenant_maxDtesPerMonth_df] DEFAULT 50,
    [maxUsers] INT NOT NULL CONSTRAINT [Tenant_maxUsers_df] DEFAULT 5,
    [maxClientes] INT NOT NULL CONSTRAINT [Tenant_maxClientes_df] DEFAULT 100,
    [dtesUsedThisMonth] INT NOT NULL CONSTRAINT [Tenant_dtesUsedThisMonth_df] DEFAULT 0,
    [monthResetDate] DATETIME2,
    [adminNotes] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Tenant_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Tenant_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Tenant_nit_key] UNIQUE NONCLUSTERED ([nit])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [rol] NVARCHAR(1000) NOT NULL CONSTRAINT [User_rol_df] DEFAULT 'FACTURADOR',
    [tenantId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Cliente] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [tipoDocumento] NVARCHAR(1000) NOT NULL,
    [numDocumento] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [nrc] NVARCHAR(1000),
    [correo] NVARCHAR(1000),
    [telefono] NVARCHAR(1000),
    [direccion] NVARCHAR(max) NOT NULL,
    CONSTRAINT [Cliente_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Cliente_tenantId_numDocumento_key] UNIQUE NONCLUSTERED ([tenantId],[numDocumento])
);

-- CreateTable
CREATE TABLE [dbo].[DTE] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [clienteId] NVARCHAR(1000),
    [tipoDte] NVARCHAR(1000) NOT NULL,
    [codigoGeneracion] NVARCHAR(1000) NOT NULL,
    [numeroControl] NVARCHAR(1000) NOT NULL,
    [jsonOriginal] NVARCHAR(max) NOT NULL,
    [jsonFirmado] NVARCHAR(max),
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [DTE_estado_df] DEFAULT 'PENDIENTE',
    [selloRecepcion] NVARCHAR(1000),
    [fechaRecepcion] DATETIME2,
    [codigoMh] NVARCHAR(1000),
    [descripcionMh] NVARCHAR(max),
    [totalGravada] DECIMAL(12,2) NOT NULL,
    [totalIva] DECIMAL(12,2) NOT NULL,
    [totalPagar] DECIMAL(12,2) NOT NULL,
    [intentosEnvio] INT NOT NULL CONSTRAINT [DTE_intentosEnvio_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DTE_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DTE_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DTE_codigoGeneracion_key] UNIQUE NONCLUSTERED ([codigoGeneracion]),
    CONSTRAINT [DTE_numeroControl_key] UNIQUE NONCLUSTERED ([numeroControl])
);

-- CreateTable
CREATE TABLE [dbo].[DTELog] (
    [id] NVARCHAR(1000) NOT NULL,
    [dteId] NVARCHAR(1000) NOT NULL,
    [accion] NVARCHAR(1000) NOT NULL,
    [request] NVARCHAR(max),
    [response] NVARCHAR(max),
    [error] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DTELog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DTELog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TenantEmailConfig] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [provider] NVARCHAR(1000) NOT NULL,
    [authMethod] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [TenantEmailConfig_isActive_df] DEFAULT 0,
    [isVerified] BIT NOT NULL CONSTRAINT [TenantEmailConfig_isVerified_df] DEFAULT 0,
    [smtpHost] NVARCHAR(1000),
    [smtpPort] INT,
    [smtpSecure] BIT CONSTRAINT [TenantEmailConfig_smtpSecure_df] DEFAULT 1,
    [smtpUser] NVARCHAR(1000),
    [smtpPassword] NVARCHAR(max),
    [apiKey] NVARCHAR(max),
    [apiSecret] NVARCHAR(max),
    [apiEndpoint] NVARCHAR(1000),
    [oauth2ClientId] NVARCHAR(1000),
    [oauth2ClientSecret] NVARCHAR(max),
    [oauth2TenantId] NVARCHAR(1000),
    [oauth2RefreshToken] NVARCHAR(max),
    [oauth2AccessToken] NVARCHAR(max),
    [oauth2TokenExpiry] DATETIME2,
    [fromEmail] NVARCHAR(1000) NOT NULL,
    [fromName] NVARCHAR(1000) NOT NULL,
    [replyToEmail] NVARCHAR(1000),
    [rateLimitPerHour] INT CONSTRAINT [TenantEmailConfig_rateLimitPerHour_df] DEFAULT 100,
    [retryAttempts] INT CONSTRAINT [TenantEmailConfig_retryAttempts_df] DEFAULT 3,
    [timeoutSeconds] INT CONSTRAINT [TenantEmailConfig_timeoutSeconds_df] DEFAULT 30,
    [configuredBy] NVARCHAR(1000) NOT NULL CONSTRAINT [TenantEmailConfig_configuredBy_df] DEFAULT 'PENDING',
    [configuredByUserId] NVARCHAR(1000),
    [notes] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TenantEmailConfig_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [verifiedAt] DATETIME2,
    [lastTestAt] DATETIME2,
    CONSTRAINT [TenantEmailConfig_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TenantEmailConfig_tenantId_key] UNIQUE NONCLUSTERED ([tenantId])
);

-- CreateTable
CREATE TABLE [dbo].[EmailHealthCheck] (
    [id] NVARCHAR(1000) NOT NULL,
    [configId] NVARCHAR(1000) NOT NULL,
    [checkType] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [responseTimeMs] INT,
    [errorMessage] NVARCHAR(max),
    [errorCode] NVARCHAR(1000),
    [checkedAt] DATETIME2 NOT NULL CONSTRAINT [EmailHealthCheck_checkedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [EmailHealthCheck_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[EmailSendLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [configId] NVARCHAR(1000) NOT NULL,
    [dteId] NVARCHAR(1000),
    [recipientEmail] NVARCHAR(1000) NOT NULL,
    [subject] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [providerMessageId] NVARCHAR(1000),
    [errorMessage] NVARCHAR(max),
    [attemptNumber] INT NOT NULL CONSTRAINT [EmailSendLog_attemptNumber_df] DEFAULT 1,
    [sentAt] DATETIME2 NOT NULL CONSTRAINT [EmailSendLog_sentAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deliveredAt] DATETIME2,
    [openedAt] DATETIME2,
    CONSTRAINT [EmailSendLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[EmailConfigRequest] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [requestType] NVARCHAR(1000) NOT NULL,
    [desiredProvider] NVARCHAR(1000),
    [currentProvider] NVARCHAR(1000),
    [accountEmail] NVARCHAR(1000),
    [additionalNotes] NVARCHAR(max),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [EmailConfigRequest_status_df] DEFAULT 'PENDING',
    [assignedTo] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [EmailConfigRequest_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [completedAt] DATETIME2,
    CONSTRAINT [EmailConfigRequest_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[EmailConfigMessage] (
    [id] NVARCHAR(1000) NOT NULL,
    [requestId] NVARCHAR(1000) NOT NULL,
    [senderType] NVARCHAR(1000) NOT NULL,
    [senderId] NVARCHAR(1000),
    [message] NVARCHAR(max) NOT NULL,
    [attachments] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [EmailConfigMessage_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [EmailConfigMessage_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TenantOnboarding] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [currentStep] NVARCHAR(1000) NOT NULL CONSTRAINT [TenantOnboarding_currentStep_df] DEFAULT 'WELCOME',
    [overallStatus] NVARCHAR(1000) NOT NULL CONSTRAINT [TenantOnboarding_overallStatus_df] DEFAULT 'NOT_STARTED',
    [nit] NVARCHAR(1000),
    [nrc] NVARCHAR(1000),
    [razonSocial] NVARCHAR(1000),
    [nombreComercial] NVARCHAR(1000),
    [actividadEconomica] NVARCHAR(1000),
    [emailHacienda] NVARCHAR(1000),
    [telefonoHacienda] NVARCHAR(1000),
    [haciendaUser] NVARCHAR(1000),
    [haciendaPassword] NVARCHAR(max),
    [testCertificate] NVARCHAR(max),
    [testCertPassword] NVARCHAR(max),
    [testCertExpiry] DATETIME2,
    [testApiPassword] NVARCHAR(max),
    [testEnvironmentUrl] NVARCHAR(1000),
    [prodCertificate] NVARCHAR(max),
    [prodCertPassword] NVARCHAR(max),
    [prodCertExpiry] DATETIME2,
    [prodApiPassword] NVARCHAR(max),
    [prodEnvironmentUrl] NVARCHAR(1000),
    [testAccessGrantedAt] DATETIME2,
    [testDeadline] DATETIME2,
    [authorizationDate] DATETIME2,
    [productionDeadline] DATETIME2,
    [assistanceLevel] NVARCHAR(1000) NOT NULL CONSTRAINT [TenantOnboarding_assistanceLevel_df] DEFAULT 'GUIDED',
    [assignedAgent] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TenantOnboarding_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [completedAt] DATETIME2,
    CONSTRAINT [TenantOnboarding_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TenantOnboarding_tenantId_key] UNIQUE NONCLUSTERED ([tenantId])
);

-- CreateTable
CREATE TABLE [dbo].[DteTypeSelection] (
    [id] NVARCHAR(1000) NOT NULL,
    [onboardingId] NVARCHAR(1000) NOT NULL,
    [dteType] NVARCHAR(1000) NOT NULL,
    [isRequired] BIT NOT NULL CONSTRAINT [DteTypeSelection_isRequired_df] DEFAULT 1,
    [testCompleted] BIT NOT NULL CONSTRAINT [DteTypeSelection_testCompleted_df] DEFAULT 0,
    [testCompletedAt] DATETIME2,
    CONSTRAINT [DteTypeSelection_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DteTypeSelection_onboardingId_dteType_key] UNIQUE NONCLUSTERED ([onboardingId],[dteType])
);

-- CreateTable
CREATE TABLE [dbo].[OnboardingStepRecord] (
    [id] NVARCHAR(1000) NOT NULL,
    [onboardingId] NVARCHAR(1000) NOT NULL,
    [step] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [OnboardingStepRecord_status_df] DEFAULT 'PENDING',
    [stepData] NVARCHAR(max),
    [notes] NVARCHAR(max),
    [blockerReason] NVARCHAR(max),
    [performedBy] NVARCHAR(1000),
    [performedById] NVARCHAR(1000),
    [startedAt] DATETIME2,
    [completedAt] DATETIME2,
    CONSTRAINT [OnboardingStepRecord_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [OnboardingStepRecord_onboardingId_step_key] UNIQUE NONCLUSTERED ([onboardingId],[step])
);

-- CreateTable
CREATE TABLE [dbo].[TestProgress] (
    [id] NVARCHAR(1000) NOT NULL,
    [onboardingId] NVARCHAR(1000) NOT NULL,
    [testsRequired] NVARCHAR(max) NOT NULL,
    [testsCompleted] NVARCHAR(max) NOT NULL,
    [eventsRequired] NVARCHAR(max) NOT NULL,
    [eventsCompleted] NVARCHAR(max) NOT NULL,
    [lastTestAt] DATETIME2,
    [lastTestResult] NVARCHAR(1000),
    [lastTestError] NVARCHAR(max),
    CONSTRAINT [TestProgress_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TestProgress_onboardingId_key] UNIQUE NONCLUSTERED ([onboardingId])
);

-- CreateTable
CREATE TABLE [dbo].[OnboardingCommunication] (
    [id] NVARCHAR(1000) NOT NULL,
    [onboardingId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [direction] NVARCHAR(1000) NOT NULL,
    [subject] NVARCHAR(1000),
    [content] NVARCHAR(max) NOT NULL,
    [attachments] NVARCHAR(max),
    [relatedStep] NVARCHAR(1000),
    [sentBy] NVARCHAR(1000),
    [sentAt] DATETIME2 NOT NULL CONSTRAINT [OnboardingCommunication_sentAt_df] DEFAULT CURRENT_TIMESTAMP,
    [readAt] DATETIME2,
    CONSTRAINT [OnboardingCommunication_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SupportTicket] (
    [id] NVARCHAR(1000) NOT NULL,
    [ticketNumber] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [subject] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(max),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [SupportTicket_status_df] DEFAULT 'PENDING',
    [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [SupportTicket_priority_df] DEFAULT 'MEDIUM',
    [assignedToId] NVARCHAR(1000),
    [assignedAt] DATETIME2,
    [requesterId] NVARCHAR(1000) NOT NULL,
    [metadata] NVARCHAR(max),
    [resolution] NVARCHAR(max),
    [resolvedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [SupportTicket_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [SupportTicket_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [SupportTicket_ticketNumber_key] UNIQUE NONCLUSTERED ([ticketNumber])
);

-- CreateTable
CREATE TABLE [dbo].[TicketComment] (
    [id] NVARCHAR(1000) NOT NULL,
    [ticketId] NVARCHAR(1000) NOT NULL,
    [authorId] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [isInternal] BIT NOT NULL CONSTRAINT [TicketComment_isInternal_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TicketComment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [TicketComment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TicketActivity] (
    [id] NVARCHAR(1000) NOT NULL,
    [ticketId] NVARCHAR(1000) NOT NULL,
    [actorId] NVARCHAR(1000) NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [oldValue] NVARCHAR(1000),
    [newValue] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TicketActivity_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TicketActivity_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Catalogo] (
    [id] NVARCHAR(1000) NOT NULL,
    [codigo] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(255) NOT NULL,
    [descripcion] NVARCHAR(500),
    [version] NVARCHAR(1000) NOT NULL CONSTRAINT [Catalogo_version_df] DEFAULT '1.0',
    [totalItems] INT NOT NULL CONSTRAINT [Catalogo_totalItems_df] DEFAULT 0,
    [lastSyncAt] DATETIME2,
    [isActive] BIT NOT NULL CONSTRAINT [Catalogo_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Catalogo_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Catalogo_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Catalogo_codigo_key] UNIQUE NONCLUSTERED ([codigo])
);

-- CreateTable
CREATE TABLE [dbo].[CatalogoItem] (
    [id] NVARCHAR(1000) NOT NULL,
    [catalogoId] NVARCHAR(1000) NOT NULL,
    [codigo] NVARCHAR(1000) NOT NULL,
    [valor] NVARCHAR(255) NOT NULL,
    [descripcion] NVARCHAR(500),
    [parentCodigo] NVARCHAR(1000),
    [orden] INT NOT NULL CONSTRAINT [CatalogoItem_orden_df] DEFAULT 0,
    [isActive] BIT NOT NULL CONSTRAINT [CatalogoItem_isActive_df] DEFAULT 1,
    [metadata] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [CatalogoItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [CatalogoItem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CatalogoItem_catalogoId_codigo_key] UNIQUE NONCLUSTERED ([catalogoId],[codigo])
);

-- CreateTable
CREATE TABLE [dbo].[Plan] (
    [id] NVARCHAR(1000) NOT NULL,
    [codigo] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(100) NOT NULL,
    [descripcion] NVARCHAR(500),
    [maxDtesPerMonth] INT NOT NULL CONSTRAINT [Plan_maxDtesPerMonth_df] DEFAULT 100,
    [maxUsers] INT NOT NULL CONSTRAINT [Plan_maxUsers_df] DEFAULT 1,
    [maxClientes] INT NOT NULL CONSTRAINT [Plan_maxClientes_df] DEFAULT 100,
    [maxStorageMb] INT NOT NULL CONSTRAINT [Plan_maxStorageMb_df] DEFAULT 500,
    [features] NVARCHAR(max),
    [precioMensual] DECIMAL(10,2),
    [precioAnual] DECIMAL(10,2),
    [isActive] BIT NOT NULL CONSTRAINT [Plan_isActive_df] DEFAULT 1,
    [isDefault] BIT NOT NULL CONSTRAINT [Plan_isDefault_df] DEFAULT 0,
    [orden] INT NOT NULL CONSTRAINT [Plan_orden_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Plan_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Plan_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Plan_codigo_key] UNIQUE NONCLUSTERED ([codigo])
);

-- CreateTable
CREATE TABLE [dbo].[SystemNotification] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(255) NOT NULL,
    [message] NVARCHAR(max) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL CONSTRAINT [SystemNotification_type_df] DEFAULT 'GENERAL',
    [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [SystemNotification_priority_df] DEFAULT 'MEDIUM',
    [target] NVARCHAR(1000) NOT NULL CONSTRAINT [SystemNotification_target_df] DEFAULT 'ALL_USERS',
    [targetTenantId] NVARCHAR(1000),
    [targetUserId] NVARCHAR(1000),
    [targetPlanIds] NVARCHAR(1000),
    [startsAt] DATETIME2 NOT NULL CONSTRAINT [SystemNotification_startsAt_df] DEFAULT CURRENT_TIMESTAMP,
    [expiresAt] DATETIME2,
    [isDismissable] BIT NOT NULL CONSTRAINT [SystemNotification_isDismissable_df] DEFAULT 1,
    [showOnce] BIT NOT NULL CONSTRAINT [SystemNotification_showOnce_df] DEFAULT 0,
    [actionUrl] NVARCHAR(1000),
    [actionLabel] NVARCHAR(100),
    [createdById] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [SystemNotification_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [SystemNotification_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [SystemNotification_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[NotificationDismissal] (
    [id] NVARCHAR(1000) NOT NULL,
    [notificationId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [dismissedAt] DATETIME2 NOT NULL CONSTRAINT [NotificationDismissal_dismissedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [NotificationDismissal_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [NotificationDismissal_notificationId_userId_key] UNIQUE NONCLUSTERED ([notificationId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[AuditLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000),
    [userEmail] NVARCHAR(255),
    [userName] NVARCHAR(255),
    [userRole] NVARCHAR(50),
    [tenantId] NVARCHAR(1000),
    [tenantNombre] NVARCHAR(255),
    [action] NVARCHAR(50) NOT NULL,
    [module] NVARCHAR(50) NOT NULL,
    [description] NVARCHAR(500) NOT NULL,
    [entityType] NVARCHAR(100),
    [entityId] NVARCHAR(1000),
    [oldValue] NVARCHAR(max),
    [newValue] NVARCHAR(max),
    [metadata] NVARCHAR(max),
    [ipAddress] NVARCHAR(50),
    [userAgent] NVARCHAR(500),
    [requestPath] NVARCHAR(500),
    [requestMethod] NVARCHAR(10),
    [success] BIT NOT NULL CONSTRAINT [AuditLog_success_df] DEFAULT 1,
    [errorMessage] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AuditLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AuditLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_tenantId_idx] ON [dbo].[User]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Cliente_tenantId_idx] ON [dbo].[Cliente]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DTE_tenantId_idx] ON [dbo].[DTE]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DTE_estado_idx] ON [dbo].[DTE]([estado]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DTE_createdAt_idx] ON [dbo].[DTE]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DTELog_dteId_idx] ON [dbo].[DTELog]([dteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TenantEmailConfig_tenantId_idx] ON [dbo].[TenantEmailConfig]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailHealthCheck_configId_checkedAt_idx] ON [dbo].[EmailHealthCheck]([configId], [checkedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailSendLog_configId_sentAt_idx] ON [dbo].[EmailSendLog]([configId], [sentAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailSendLog_dteId_idx] ON [dbo].[EmailSendLog]([dteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailConfigRequest_tenantId_idx] ON [dbo].[EmailConfigRequest]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailConfigRequest_status_idx] ON [dbo].[EmailConfigRequest]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailConfigMessage_requestId_idx] ON [dbo].[EmailConfigMessage]([requestId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TenantOnboarding_tenantId_idx] ON [dbo].[TenantOnboarding]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TenantOnboarding_currentStep_idx] ON [dbo].[TenantOnboarding]([currentStep]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TenantOnboarding_overallStatus_idx] ON [dbo].[TenantOnboarding]([overallStatus]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DteTypeSelection_onboardingId_idx] ON [dbo].[DteTypeSelection]([onboardingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OnboardingStepRecord_onboardingId_idx] ON [dbo].[OnboardingStepRecord]([onboardingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TestProgress_onboardingId_idx] ON [dbo].[TestProgress]([onboardingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OnboardingCommunication_onboardingId_idx] ON [dbo].[OnboardingCommunication]([onboardingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SupportTicket_tenantId_idx] ON [dbo].[SupportTicket]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SupportTicket_status_idx] ON [dbo].[SupportTicket]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SupportTicket_assignedToId_idx] ON [dbo].[SupportTicket]([assignedToId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SupportTicket_createdAt_idx] ON [dbo].[SupportTicket]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TicketComment_ticketId_idx] ON [dbo].[TicketComment]([ticketId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TicketActivity_ticketId_idx] ON [dbo].[TicketActivity]([ticketId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CatalogoItem_catalogoId_idx] ON [dbo].[CatalogoItem]([catalogoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CatalogoItem_parentCodigo_idx] ON [dbo].[CatalogoItem]([parentCodigo]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SystemNotification_isActive_startsAt_idx] ON [dbo].[SystemNotification]([isActive], [startsAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SystemNotification_target_idx] ON [dbo].[SystemNotification]([target]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [NotificationDismissal_userId_idx] ON [dbo].[NotificationDismissal]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_userId_idx] ON [dbo].[AuditLog]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_tenantId_idx] ON [dbo].[AuditLog]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_action_idx] ON [dbo].[AuditLog]([action]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_module_idx] ON [dbo].[AuditLog]([module]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_createdAt_idx] ON [dbo].[AuditLog]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_entityType_entityId_idx] ON [dbo].[AuditLog]([entityType], [entityId]);

-- AddForeignKey
ALTER TABLE [dbo].[Tenant] ADD CONSTRAINT [Tenant_planId_fkey] FOREIGN KEY ([planId]) REFERENCES [dbo].[Plan]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Cliente] ADD CONSTRAINT [Cliente_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DTE] ADD CONSTRAINT [DTE_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DTE] ADD CONSTRAINT [DTE_clienteId_fkey] FOREIGN KEY ([clienteId]) REFERENCES [dbo].[Cliente]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DTELog] ADD CONSTRAINT [DTELog_dteId_fkey] FOREIGN KEY ([dteId]) REFERENCES [dbo].[DTE]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TenantEmailConfig] ADD CONSTRAINT [TenantEmailConfig_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmailHealthCheck] ADD CONSTRAINT [EmailHealthCheck_configId_fkey] FOREIGN KEY ([configId]) REFERENCES [dbo].[TenantEmailConfig]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmailSendLog] ADD CONSTRAINT [EmailSendLog_configId_fkey] FOREIGN KEY ([configId]) REFERENCES [dbo].[TenantEmailConfig]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmailConfigRequest] ADD CONSTRAINT [EmailConfigRequest_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmailConfigMessage] ADD CONSTRAINT [EmailConfigMessage_requestId_fkey] FOREIGN KEY ([requestId]) REFERENCES [dbo].[EmailConfigRequest]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TenantOnboarding] ADD CONSTRAINT [TenantOnboarding_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DteTypeSelection] ADD CONSTRAINT [DteTypeSelection_onboardingId_fkey] FOREIGN KEY ([onboardingId]) REFERENCES [dbo].[TenantOnboarding]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[OnboardingStepRecord] ADD CONSTRAINT [OnboardingStepRecord_onboardingId_fkey] FOREIGN KEY ([onboardingId]) REFERENCES [dbo].[TenantOnboarding]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TestProgress] ADD CONSTRAINT [TestProgress_onboardingId_fkey] FOREIGN KEY ([onboardingId]) REFERENCES [dbo].[TenantOnboarding]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[OnboardingCommunication] ADD CONSTRAINT [OnboardingCommunication_onboardingId_fkey] FOREIGN KEY ([onboardingId]) REFERENCES [dbo].[TenantOnboarding]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SupportTicket] ADD CONSTRAINT [SupportTicket_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SupportTicket] ADD CONSTRAINT [SupportTicket_assignedToId_fkey] FOREIGN KEY ([assignedToId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SupportTicket] ADD CONSTRAINT [SupportTicket_requesterId_fkey] FOREIGN KEY ([requesterId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketComment] ADD CONSTRAINT [TicketComment_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[SupportTicket]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketComment] ADD CONSTRAINT [TicketComment_authorId_fkey] FOREIGN KEY ([authorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketActivity] ADD CONSTRAINT [TicketActivity_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[SupportTicket]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketActivity] ADD CONSTRAINT [TicketActivity_actorId_fkey] FOREIGN KEY ([actorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CatalogoItem] ADD CONSTRAINT [CatalogoItem_catalogoId_fkey] FOREIGN KEY ([catalogoId]) REFERENCES [dbo].[Catalogo]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[NotificationDismissal] ADD CONSTRAINT [NotificationDismissal_notificationId_fkey] FOREIGN KEY ([notificationId]) REFERENCES [dbo].[SystemNotification]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

