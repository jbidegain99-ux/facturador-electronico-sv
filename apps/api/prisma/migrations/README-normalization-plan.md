# Schema Normalization Plan

**Date:** 2026-04-02
**Author:** Jose / Republicode
**Status:** DRAFT - Do NOT execute without review

---

## Overview

Three bloated models need decomposition for maintainability, separation of concerns, and query performance:

| Model | Current Fields | Proposed Split |
|---|---|---|
| Tenant | 45+ scalar fields + 20 relations | 4 focused tables |
| TenantEmailConfig | 30 fields (3 auth strategies in one row) | Strategy pattern with 4 tables |
| TenantOnboarding | 35+ fields (test/prod duplicated) | Addressed in Phase 2 (lower priority) |

**Database:** Azure SQL Server (sqlserver provider via Prisma)
**Constraint:** All migrations must be backward-compatible. No breaking changes to API responses in the same deploy.

---

## 1. Tenant Model Decomposition

### Current Tenant Fields (scalar only)

```
id, nombre, nit, nrc, actividadEcon, direccion, telefono, correo, nombreComercial,
certificatePath, mhToken, mhTokenExpiry,
logoUrl, primaryColor,
plan, planId, planStatus, planExpiry, maxDtesPerMonth, maxUsers, maxClientes,
dtesUsedThisMonth, monthResetDate,
adminNotes,
autoJournalEnabled, autoJournalTrigger,
codEstableMH, codPuntoVentaMH,
createdAt, updatedAt
```

### 1A. TenantCore (keep on existing `Tenant` table)

Retain identity, MH credentials, and timestamps on the original table. All existing FKs stay untouched.

| Field | Type | Notes |
|---|---|---|
| id | String @id | No change |
| nombre | String | |
| nit | String @unique | |
| nrc | String | |
| actividadEcon | String | |
| direccion | String @db.NVarChar(Max) | |
| telefono | String | |
| correo | String @unique | |
| nombreComercial | String? | |
| certificatePath | String? | MH credential |
| mhToken | String? @db.NVarChar(Max) | MH credential |
| mhTokenExpiry | DateTime? | MH credential |
| adminNotes | String? @db.NVarChar(Max) | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

All 20 relation fields stay on Tenant.

### 1B. TenantBranding (new table)

| Field | Type | Source |
|---|---|---|
| id | String @id @default(cuid()) | New PK |
| tenantId | String @unique | FK -> Tenant.id |
| logoUrl | String? | Tenant.logoUrl |
| primaryColor | String? @default("#8b5cf6") | Tenant.primaryColor |

**Future fields:** invoiceFooter, invoiceHeader, emailBannerUrl, faviconUrl

### 1C. TenantSubscription (new table)

| Field | Type | Source |
|---|---|---|
| id | String @id @default(cuid()) | New PK |
| tenantId | String @unique | FK -> Tenant.id |
| plan | String @default("TRIAL") | Tenant.plan |
| planId | String? | Tenant.planId (FK -> Plan.id) |
| planStatus | String @default("ACTIVE") | Tenant.planStatus |
| planExpiry | DateTime? | Tenant.planExpiry |
| maxDtesPerMonth | Int @default(50) | Tenant.maxDtesPerMonth |
| maxUsers | Int @default(5) | Tenant.maxUsers |
| maxClientes | Int @default(100) | Tenant.maxClientes |
| dtesUsedThisMonth | Int @default(0) | Tenant.dtesUsedThisMonth |
| monthResetDate | DateTime? | Tenant.monthResetDate |
| createdAt | DateTime @default(now()) | New |
| updatedAt | DateTime @updatedAt | New |

**Note:** The `planRef` relation (FK to Plan) moves here. The Plan model's `@relation("TenantPlan")` must be updated.

### 1D. TenantDefaults (new table)

| Field | Type | Source |
|---|---|---|
| id | String @id @default(cuid()) | New PK |
| tenantId | String @unique | FK -> Tenant.id |
| codEstableMH | String? @db.NVarChar(4) | Tenant.codEstableMH |
| codPuntoVentaMH | String? @db.NVarChar(4) | Tenant.codPuntoVentaMH |
| autoJournalEnabled | Boolean @default(false) | Tenant.autoJournalEnabled |
| autoJournalTrigger | String @default("ON_APPROVED") @db.NVarChar(20) | Tenant.autoJournalTrigger |

**Future fields:** condicionOperacion, defaultTipoDte, defaultMoneda

### Migration SQL (1)

```sql
-- Step 1: Create new tables
CREATE TABLE [dbo].[TenantBranding] (
    [id] NVARCHAR(30) NOT NULL,
    [tenantId] NVARCHAR(30) NOT NULL,
    [logoUrl] NVARCHAR(1000) NULL,
    [primaryColor] NVARCHAR(1000) NULL DEFAULT '#8b5cf6',
    CONSTRAINT [PK_TenantBranding] PRIMARY KEY ([id]),
    CONSTRAINT [UQ_TenantBranding_tenantId] UNIQUE ([tenantId]),
    CONSTRAINT [FK_TenantBranding_Tenant] FOREIGN KEY ([tenantId])
        REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE [dbo].[TenantSubscription] (
    [id] NVARCHAR(30) NOT NULL,
    [tenantId] NVARCHAR(30) NOT NULL,
    [plan] NVARCHAR(1000) NOT NULL DEFAULT 'TRIAL',
    [planId] NVARCHAR(30) NULL,
    [planStatus] NVARCHAR(1000) NOT NULL DEFAULT 'ACTIVE',
    [planExpiry] DATETIME2 NULL,
    [maxDtesPerMonth] INT NOT NULL DEFAULT 50,
    [maxUsers] INT NOT NULL DEFAULT 5,
    [maxClientes] INT NOT NULL DEFAULT 100,
    [dtesUsedThisMonth] INT NOT NULL DEFAULT 0,
    [monthResetDate] DATETIME2 NULL,
    [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [PK_TenantSubscription] PRIMARY KEY ([id]),
    CONSTRAINT [UQ_TenantSubscription_tenantId] UNIQUE ([tenantId]),
    CONSTRAINT [FK_TenantSubscription_Tenant] FOREIGN KEY ([tenantId])
        REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [FK_TenantSubscription_Plan] FOREIGN KEY ([planId])
        REFERENCES [dbo].[Plan]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE [dbo].[TenantDefaults] (
    [id] NVARCHAR(30) NOT NULL,
    [tenantId] NVARCHAR(30) NOT NULL,
    [codEstableMH] NVARCHAR(4) NULL,
    [codPuntoVentaMH] NVARCHAR(4) NULL,
    [autoJournalEnabled] BIT NOT NULL DEFAULT 0,
    [autoJournalTrigger] NVARCHAR(20) NOT NULL DEFAULT 'ON_APPROVED',
    CONSTRAINT [PK_TenantDefaults] PRIMARY KEY ([id]),
    CONSTRAINT [UQ_TenantDefaults_tenantId] UNIQUE ([tenantId]),
    CONSTRAINT [FK_TenantDefaults_Tenant] FOREIGN KEY ([tenantId])
        REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Step 2: Migrate data (generate cuid-like IDs using NEWID() truncated)
INSERT INTO [dbo].[TenantBranding] ([id], [tenantId], [logoUrl], [primaryColor])
SELECT LEFT(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', ''), 25),
       [id], [logoUrl], [primaryColor]
FROM [dbo].[Tenant];

INSERT INTO [dbo].[TenantSubscription] ([id], [tenantId], [plan], [planId], [planStatus],
    [planExpiry], [maxDtesPerMonth], [maxUsers], [maxClientes], [dtesUsedThisMonth],
    [monthResetDate], [createdAt], [updatedAt])
SELECT LEFT(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', ''), 25),
       [id], [plan], [planId], [planStatus], [planExpiry],
       [maxDtesPerMonth], [maxUsers], [maxClientes], [dtesUsedThisMonth],
       [monthResetDate], GETUTCDATE(), GETUTCDATE()
FROM [dbo].[Tenant];

INSERT INTO [dbo].[TenantDefaults] ([id], [tenantId], [codEstableMH], [codPuntoVentaMH],
    [autoJournalEnabled], [autoJournalTrigger])
SELECT LEFT(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', ''), 25),
       [id], [codEstableMH], [codPuntoVentaMH],
       [autoJournalEnabled], [autoJournalTrigger]
FROM [dbo].[Tenant];

-- Step 3: DO NOT drop old columns yet. Keep them for rollback.
-- Drop columns only after all services are confirmed working (Phase 2 cleanup).
```

### Code Changes Required (1)

**Services that read/write branding fields (logoUrl, primaryColor):**
- `apps/api/src/modules/dte/dte.service.ts` - reads logoUrl for PDF
- `apps/api/src/modules/dte/pdf.service.ts` - reads logoUrl, primaryColor
- `apps/api/src/modules/tenants/tenants.controller.ts` - CRUD for branding fields

**Services that read/write subscription fields:**
- `apps/api/src/modules/plans/services/plan-features.service.ts` - reads/writes limits & usage
- `apps/api/src/modules/plans/plans.service.ts` - manages plan assignment
- `apps/api/src/modules/plans/plans.controller.ts` - plan endpoints
- `apps/api/src/modules/super-admin/super-admin.service.ts` - admin plan management
- `apps/api/src/modules/super-admin/super-admin.controller.ts` - admin endpoints
- `apps/api/src/modules/notifications/notifications.service.ts` - usage alerts
- `apps/api/src/modules/chat/chat-data.service.ts` - reads plan info
- `apps/api/src/common/plan-features.ts` - plan feature checks

**Services that read/write defaults fields:**
- `apps/api/src/modules/dte/dte.service.ts` - reads codEstableMH, codPuntoVentaMH
- `apps/api/src/modules/dte/services/dte-builder.service.ts` - reads codEstableMH, codPuntoVentaMH
- `apps/api/src/modules/dte/services/dte-validator.service.ts` - validates defaults
- `apps/api/src/modules/accounting/accounting-automation.service.ts` - reads autoJournal*
- `apps/api/src/modules/accounting/accounting.controller.ts` - CRUD for autoJournal*
- `apps/api/src/modules/sucursales/sucursales.service.ts` - reads codEstableMH
- `apps/api/src/modules/hacienda/hacienda.service.ts` - reads codEstableMH
- `apps/api/src/modules/recurring-invoices/recurring-invoice-cron.service.ts` - reads defaults
- `apps/api/src/modules/transmitter/transmitter.service.ts` - reads defaults

**Migration strategy for code:**
1. Add new Prisma models with `?` optional relation on Tenant (e.g., `branding TenantBranding?`)
2. Create a `TenantQueryHelper` utility that reads from new table first, falls back to old column
3. Migrate all services one by one to use the new relations via `include: { branding: true }`
4. Once all services migrated, remove fallback logic and drop old columns

### Rollback Plan (1)

- Old columns are NOT dropped during migration. Data stays in both places.
- If issues arise, revert code to read from old columns (old columns still populated).
- To fully rollback: `DROP TABLE TenantBranding; DROP TABLE TenantSubscription; DROP TABLE TenantDefaults;`

### Estimated Effort (1)

| Task | Effort |
|---|---|
| Prisma schema + migration SQL | 2h |
| TenantBranding service changes (3 files) | 1h |
| TenantSubscription service changes (8 files) | 4h |
| TenantDefaults service changes (9 files) | 4h |
| Tests update | 3h |
| Integration testing | 2h |
| **Total** | **~16h (2 days)** |

---

## 2. TenantEmailConfig Strategy Pattern Decomposition

### Current TenantEmailConfig Fields

```
id, tenantId,
provider, authMethod, isActive, isVerified,
smtpHost, smtpPort, smtpSecure, smtpUser, smtpPassword,
apiKey, apiSecret, apiEndpoint,
oauth2ClientId, oauth2ClientSecret, oauth2TenantId, oauth2RefreshToken, oauth2AccessToken, oauth2TokenExpiry,
fromEmail, fromName, replyToEmail,
rateLimitPerHour, retryAttempts, timeoutSeconds,
configuredBy, configuredByUserId, notes,
createdAt, updatedAt, verifiedAt, lastTestAt
```

**Problem:** Every row has ~15 NULL columns depending on which auth method is used (SMTP rows waste OAuth2 columns, API rows waste SMTP columns, etc.).

### 2A. EmailConfigBase (rename existing table)

| Field | Type | Notes |
|---|---|---|
| id | String @id | Keep existing PK |
| tenantId | String @unique | Keep |
| provider | String | SENDGRID, MAILGUN, etc. |
| authMethod | String | API_KEY, SMTP_BASIC, OAUTH2, AWS_IAM |
| isActive | Boolean @default(false) | |
| isVerified | Boolean @default(false) | |
| fromEmail | String | |
| fromName | String | |
| replyToEmail | String? | |
| rateLimitPerHour | Int? @default(100) | |
| retryAttempts | Int? @default(3) | |
| timeoutSeconds | Int? @default(30) | |
| configuredBy | String @default("PENDING") | |
| configuredByUserId | String? | |
| notes | String? @db.NVarChar(Max) | |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| verifiedAt | DateTime? | |
| lastTestAt | DateTime? | |

Relations: `smtpConfig SmtpConfig?`, `apiConfig ApiConfig?`, `oauth2Config OAuth2Config?`, `healthChecks`, `sendLogs`

### 2B. SmtpConfig (new table)

| Field | Type | Source |
|---|---|---|
| id | String @id @default(cuid()) | New PK |
| configId | String @unique | FK -> TenantEmailConfig.id |
| host | String | smtpHost |
| port | Int | smtpPort |
| secure | Boolean @default(true) | smtpSecure |
| user | String | smtpUser |
| passwordEnc | String @db.NVarChar(Max) | smtpPassword |

### 2C. ApiConfig (new table)

| Field | Type | Source |
|---|---|---|
| id | String @id @default(cuid()) | New PK |
| configId | String @unique | FK -> TenantEmailConfig.id |
| apiKeyEnc | String @db.NVarChar(Max) | apiKey |
| apiSecretEnc | String? @db.NVarChar(Max) | apiSecret |
| endpoint | String? | apiEndpoint |
| domain | String? | Future: Mailgun domain |
| region | String? | Future: SES region |

### 2D. OAuth2Config (new table)

| Field | Type | Source |
|---|---|---|
| id | String @id @default(cuid()) | New PK |
| configId | String @unique | FK -> TenantEmailConfig.id |
| clientId | String | oauth2ClientId |
| clientSecretEnc | String @db.NVarChar(Max) | oauth2ClientSecret |
| azureTenantId | String? | oauth2TenantId |
| refreshTokenEnc | String @db.NVarChar(Max) | oauth2RefreshToken |
| accessTokenEnc | String? @db.NVarChar(Max) | oauth2AccessToken |
| tokenExpiry | DateTime? | oauth2TokenExpiry |

### Migration SQL (2)

```sql
-- Step 1: Create strategy tables
CREATE TABLE [dbo].[SmtpConfig] (
    [id] NVARCHAR(30) NOT NULL,
    [configId] NVARCHAR(30) NOT NULL,
    [host] NVARCHAR(1000) NOT NULL,
    [port] INT NOT NULL,
    [secure] BIT NOT NULL DEFAULT 1,
    [user] NVARCHAR(1000) NOT NULL,
    [passwordEnc] NVARCHAR(MAX) NOT NULL,
    CONSTRAINT [PK_SmtpConfig] PRIMARY KEY ([id]),
    CONSTRAINT [UQ_SmtpConfig_configId] UNIQUE ([configId]),
    CONSTRAINT [FK_SmtpConfig_EmailConfig] FOREIGN KEY ([configId])
        REFERENCES [dbo].[TenantEmailConfig]([id]) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE [dbo].[ApiConfig] (
    [id] NVARCHAR(30) NOT NULL,
    [configId] NVARCHAR(30) NOT NULL,
    [apiKeyEnc] NVARCHAR(MAX) NOT NULL,
    [apiSecretEnc] NVARCHAR(MAX) NULL,
    [endpoint] NVARCHAR(1000) NULL,
    [domain] NVARCHAR(1000) NULL,
    [region] NVARCHAR(100) NULL,
    CONSTRAINT [PK_ApiConfig] PRIMARY KEY ([id]),
    CONSTRAINT [UQ_ApiConfig_configId] UNIQUE ([configId]),
    CONSTRAINT [FK_ApiConfig_EmailConfig] FOREIGN KEY ([configId])
        REFERENCES [dbo].[TenantEmailConfig]([id]) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE [dbo].[OAuth2Config] (
    [id] NVARCHAR(30) NOT NULL,
    [configId] NVARCHAR(30) NOT NULL,
    [clientId] NVARCHAR(1000) NOT NULL,
    [clientSecretEnc] NVARCHAR(MAX) NOT NULL,
    [azureTenantId] NVARCHAR(1000) NULL,
    [refreshTokenEnc] NVARCHAR(MAX) NOT NULL,
    [accessTokenEnc] NVARCHAR(MAX) NULL,
    [tokenExpiry] DATETIME2 NULL,
    CONSTRAINT [PK_OAuth2Config] PRIMARY KEY ([id]),
    CONSTRAINT [UQ_OAuth2Config_configId] UNIQUE ([configId]),
    CONSTRAINT [FK_OAuth2Config_EmailConfig] FOREIGN KEY ([configId])
        REFERENCES [dbo].[TenantEmailConfig]([id]) ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Step 2: Migrate existing SMTP configs
INSERT INTO [dbo].[SmtpConfig] ([id], [configId], [host], [port], [secure], [user], [passwordEnc])
SELECT LEFT(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', ''), 25),
       [id], [smtpHost], ISNULL([smtpPort], 587), ISNULL([smtpSecure], 1),
       [smtpUser], [smtpPassword]
FROM [dbo].[TenantEmailConfig]
WHERE [authMethod] = 'SMTP_BASIC' AND [smtpHost] IS NOT NULL;

-- Step 2b: Migrate existing API configs
INSERT INTO [dbo].[ApiConfig] ([id], [configId], [apiKeyEnc], [apiSecretEnc], [endpoint])
SELECT LEFT(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', ''), 25),
       [id], [apiKey], [apiSecret], [apiEndpoint]
FROM [dbo].[TenantEmailConfig]
WHERE [authMethod] = 'API_KEY' AND [apiKey] IS NOT NULL;

-- Step 2c: Migrate existing OAuth2 configs
INSERT INTO [dbo].[OAuth2Config] ([id], [configId], [clientId], [clientSecretEnc],
    [azureTenantId], [refreshTokenEnc], [accessTokenEnc], [tokenExpiry])
SELECT LEFT(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', ''), 25),
       [id], [oauth2ClientId], [oauth2ClientSecret],
       [oauth2TenantId], [oauth2RefreshToken], [oauth2AccessToken], [oauth2TokenExpiry]
FROM [dbo].[TenantEmailConfig]
WHERE [authMethod] = 'OAUTH2' AND [oauth2ClientId] IS NOT NULL;

-- Step 3: DO NOT drop old columns yet. Keep for rollback.
```

### Code Changes Required (2)

**Services that must be updated:**
- `apps/api/src/modules/email-config/services/email-config.service.ts` - main CRUD, reads/writes all auth fields
- `apps/api/src/modules/email-config/services/default-email.service.ts` - reads credentials for sending
- `apps/api/src/modules/email-config/services/email-health.service.ts` - reads credentials for health checks
- `apps/api/src/modules/backups/backups.service.ts` - includes email config in backup

**Migration strategy for code:**
1. Add new Prisma models and optional relations on TenantEmailConfig
2. Update `email-config.service.ts` to write to both old columns AND new strategy tables (dual-write)
3. Update read operations to prefer new strategy tables with fallback to old columns
4. Once confirmed, remove dual-write and drop old columns

### Rollback Plan (2)

- Old columns preserved. Revert code to read from old columns directly.
- Drop strategy tables: `DROP TABLE SmtpConfig; DROP TABLE ApiConfig; DROP TABLE OAuth2Config;`

### Estimated Effort (2)

| Task | Effort |
|---|---|
| Prisma schema + migration SQL | 1.5h |
| email-config.service.ts refactor | 3h |
| default-email.service.ts update | 1h |
| email-health.service.ts update | 1h |
| backups.service.ts update | 0.5h |
| Tests update | 2h |
| Integration testing | 1h |
| **Total** | **~10h (1.5 days)** |

---

## 3. TenantOnboarding (Assessment Only)

### Current TenantOnboarding Fields

```
id, tenantId,
currentStep, overallStatus,
nit, nrc, razonSocial, nombreComercial, actividadEconomica,
emailHacienda, telefonoHacienda,
haciendaUser, haciendaPassword,
testCertificate, testCertPassword, testCertExpiry, testApiPassword, testEnvironmentUrl,
prodCertificate, prodCertPassword, prodCertExpiry, prodApiPassword, prodEnvironmentUrl,
testAccessGrantedAt, testDeadline, authorizationDate, productionDeadline,
assistanceLevel, assignedAgent,
createdAt, updatedAt, completedAt
```

### Recommendation: LOW PRIORITY - Defer to Phase 2

The TenantOnboarding model is large but has a clear single responsibility (MH onboarding wizard). The test/prod environment duplication is the main smell but is acceptable because:

1. Only 4 services access it (contained blast radius)
2. Onboarding is a one-time process per tenant (low query volume)
3. No NULL-waste problem (most fields get populated during the flow)

**If we do split later, the natural decomposition is:**

- `TenantOnboarding` (id, tenantId, currentStep, overallStatus, assistanceLevel, assignedAgent, dates)
- `OnboardingContribuyente` (nit, nrc, razonSocial, etc. -- contributor info)
- `OnboardingEnvironment` (type ENUM test|prod, certificate, certPassword, certExpiry, apiPassword, environmentUrl) -- one row per environment

**Services affected:**
- `apps/api/src/modules/onboarding/services/onboarding.service.ts`
- `apps/api/src/modules/onboarding/services/test-execution.service.ts`
- `apps/api/src/modules/onboarding/services/communication.service.ts`
- `apps/api/src/modules/backups/backups.service.ts`

---

## Execution Order

| Phase | What | Risk | Effort |
|---|---|---|---|
| **Phase 1a** | TenantBranding extraction | Low (3 files) | 3h |
| **Phase 1b** | TenantDefaults extraction | Medium (9 files) | 6h |
| **Phase 1c** | TenantSubscription extraction | High (8 files, core billing) | 7h |
| **Phase 2** | EmailConfig strategy pattern | Medium (4 files, encryption) | 10h |
| **Phase 3** | TenantOnboarding (optional) | Low priority | 8h |

### Pre-Migration Checklist

- [ ] Backup production database before each phase
- [ ] Run migration on staging first
- [ ] Verify Prisma `db push` generates expected DDL
- [ ] Dual-write period: minimum 1 week before dropping old columns
- [ ] Update all `select:` and `include:` clauses in Prisma queries
- [ ] Update API response DTOs if they expose raw Tenant shape
- [ ] Run full test suite after each phase

### Column Cleanup (Final Step - After All Phases Stable)

```sql
-- ONLY after all services confirmed working on new tables for 1+ week
ALTER TABLE [dbo].[Tenant] DROP COLUMN
    [logoUrl], [primaryColor],
    [plan], [planId], [planStatus], [planExpiry],
    [maxDtesPerMonth], [maxUsers], [maxClientes],
    [dtesUsedThisMonth], [monthResetDate],
    [codEstableMH], [codPuntoVentaMH],
    [autoJournalEnabled], [autoJournalTrigger];

ALTER TABLE [dbo].[TenantEmailConfig] DROP COLUMN
    [smtpHost], [smtpPort], [smtpSecure], [smtpUser], [smtpPassword],
    [apiKey], [apiSecret], [apiEndpoint],
    [oauth2ClientId], [oauth2ClientSecret], [oauth2TenantId],
    [oauth2RefreshToken], [oauth2AccessToken], [oauth2TokenExpiry];
```
