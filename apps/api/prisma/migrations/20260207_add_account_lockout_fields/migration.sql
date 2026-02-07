-- Add account lockout fields to User table
ALTER TABLE [dbo].[User] ADD [failedLoginAttempts] INT NOT NULL CONSTRAINT [User_failedLoginAttempts_df] DEFAULT 0;
ALTER TABLE [dbo].[User] ADD [accountLockedUntil] DATETIME2;
ALTER TABLE [dbo].[User] ADD [lastFailedLoginAt] DATETIME2;
