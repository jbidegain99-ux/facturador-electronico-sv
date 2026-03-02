-- =============================================================================
-- Seed Plan Features & Support Config — 3-Plan Model
-- Canonical plans: STARTER, PROFESSIONAL, ENTERPRISE
-- Run after prisma db push to populate/update plan tables
-- =============================================================================

BEGIN TRANSACTION;

-- 1. Migrate legacy plan codes to canonical codes
-- Tenant.plan field
UPDATE [dbo].[Tenant] SET [plan] = 'STARTER' WHERE [plan] IN ('BASIC', 'DEMO', 'TRIAL');
UPDATE [dbo].[Tenant] SET [plan] = 'PROFESSIONAL' WHERE [plan] IN ('PRO', 'PROFESIONAL');
UPDATE [dbo].[Tenant] SET [plan] = 'ENTERPRISE' WHERE [plan] = 'EMPRESARIAL';

-- Plan table codes
UPDATE [dbo].[Plan] SET codigo = 'STARTER' WHERE codigo IN ('BASIC', 'DEMO', 'TRIAL');
UPDATE [dbo].[Plan] SET codigo = 'PROFESSIONAL' WHERE codigo IN ('PRO', 'PROFESIONAL');

-- 2. Remove deprecated plan feature/support rows
DELETE FROM [dbo].[plan_features] WHERE planCode IN ('DEMO', 'TRIAL', 'BASIC');
DELETE FROM [dbo].[plan_support_config] WHERE planCode IN ('DEMO', 'TRIAL', 'BASIC');

-- 3. Clear and re-seed plan_features (10 features x 3 plans = 30 rows)
DELETE FROM [dbo].[plan_features] WHERE planCode IN ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- STARTER ($15/mo): invoicing, accounting, catalog, recurring_invoices, ticket_support
INSERT INTO [dbo].[plan_features] (id, planCode, featureCode, enabled) VALUES
(NEWID(), 'STARTER', 'invoicing', 1),
(NEWID(), 'STARTER', 'accounting', 1),
(NEWID(), 'STARTER', 'catalog', 1),
(NEWID(), 'STARTER', 'recurring_invoices', 1),
(NEWID(), 'STARTER', 'quotes_b2b', 0),
(NEWID(), 'STARTER', 'webhooks', 0),
(NEWID(), 'STARTER', 'api_full', 0),
(NEWID(), 'STARTER', 'advanced_reports', 0),
(NEWID(), 'STARTER', 'ticket_support', 1),
(NEWID(), 'STARTER', 'phone_support', 0);

-- PROFESSIONAL ($65/mo): everything except phone_support
INSERT INTO [dbo].[plan_features] (id, planCode, featureCode, enabled) VALUES
(NEWID(), 'PROFESSIONAL', 'invoicing', 1),
(NEWID(), 'PROFESSIONAL', 'accounting', 1),
(NEWID(), 'PROFESSIONAL', 'catalog', 1),
(NEWID(), 'PROFESSIONAL', 'recurring_invoices', 1),
(NEWID(), 'PROFESSIONAL', 'quotes_b2b', 1),
(NEWID(), 'PROFESSIONAL', 'webhooks', 1),
(NEWID(), 'PROFESSIONAL', 'api_full', 1),
(NEWID(), 'PROFESSIONAL', 'advanced_reports', 1),
(NEWID(), 'PROFESSIONAL', 'ticket_support', 1),
(NEWID(), 'PROFESSIONAL', 'phone_support', 0);

-- ENTERPRISE ($199/mo): everything enabled
INSERT INTO [dbo].[plan_features] (id, planCode, featureCode, enabled) VALUES
(NEWID(), 'ENTERPRISE', 'invoicing', 1),
(NEWID(), 'ENTERPRISE', 'accounting', 1),
(NEWID(), 'ENTERPRISE', 'catalog', 1),
(NEWID(), 'ENTERPRISE', 'recurring_invoices', 1),
(NEWID(), 'ENTERPRISE', 'quotes_b2b', 1),
(NEWID(), 'ENTERPRISE', 'webhooks', 1),
(NEWID(), 'ENTERPRISE', 'api_full', 1),
(NEWID(), 'ENTERPRISE', 'advanced_reports', 1),
(NEWID(), 'ENTERPRISE', 'ticket_support', 1),
(NEWID(), 'ENTERPRISE', 'phone_support', 1);

-- 4. Clear and re-seed plan_support_config (3 plans)
DELETE FROM [dbo].[plan_support_config] WHERE planCode IN ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');

INSERT INTO [dbo].[plan_support_config] (id, planCode, ticketSupportEnabled, ticketResponseHours, phoneSupportEnabled, phoneSupportHours, accountManagerEnabled) VALUES
(NEWID(), 'STARTER',      1, 72, 0, NULL, 0),
(NEWID(), 'PROFESSIONAL', 1, 48, 0, NULL, 0),
(NEWID(), 'ENTERPRISE',   1, 24, 1, '24/7', 1);

-- 5. Update Plan table with new limits and prices
UPDATE [dbo].[Plan] SET
  nombre = 'Starter',
  descripcion = 'Perfecto para pequenas empresas comenzando con facturacion electronica',
  maxDtesPerMonth = 300,
  maxUsers = 3,
  maxClientes = 100,
  maxStorageMb = 1024,
  precioMensual = 15.00,
  precioAnual = 150.00,
  isActive = 1,
  isDefault = 1,
  orden = 1
WHERE codigo = 'STARTER';

UPDATE [dbo].[Plan] SET
  nombre = 'Professional',
  descripcion = 'Para empresas en crecimiento que necesitan herramientas avanzadas',
  maxDtesPerMonth = 2000,
  maxUsers = 10,
  maxClientes = 500,
  maxStorageMb = 10240,
  precioMensual = 65.00,
  precioAnual = 650.00,
  isActive = 1,
  isDefault = 0,
  orden = 2
WHERE codigo = 'PROFESSIONAL';

UPDATE [dbo].[Plan] SET
  nombre = 'Enterprise',
  descripcion = 'Solucion completa sin limites para grandes organizaciones',
  maxDtesPerMonth = -1,
  maxUsers = -1,
  maxClientes = -1,
  maxStorageMb = -1,
  precioMensual = 199.00,
  precioAnual = 2388.00,
  isActive = 1,
  isDefault = 0,
  orden = 3
WHERE codigo = 'ENTERPRISE';

-- 6. Update Tenant limits for tenants on each plan
UPDATE t SET
  t.maxDtesPerMonth = 300,
  t.maxUsers = 3,
  t.maxClientes = 100
FROM [dbo].[Tenant] t
WHERE t.[plan] = 'STARTER';

UPDATE t SET
  t.maxDtesPerMonth = 2000,
  t.maxUsers = 10,
  t.maxClientes = 500
FROM [dbo].[Tenant] t
WHERE t.[plan] = 'PROFESSIONAL';

UPDATE t SET
  t.maxDtesPerMonth = -1,
  t.maxUsers = -1,
  t.maxClientes = -1
FROM [dbo].[Tenant] t
WHERE t.[plan] = 'ENTERPRISE';

COMMIT TRANSACTION;
