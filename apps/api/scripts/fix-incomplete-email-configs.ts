/**
 * One-time migration script: Deactivate TenantEmailConfig records
 * that use OAuth providers (MICROSOFT_365, GOOGLE_WORKSPACE) but are
 * missing required OAuth tokens (refresh_token / access_token).
 *
 * Root cause: These incomplete configs prevent email delivery because
 * the adapter throws "No refresh token available" and there is no
 * fallback to the Republicode default adapter.
 *
 * Usage (from apps/api/):
 *   npx ts-node -r dotenv/config scripts/fix-incomplete-email-configs.ts
 *
 * Alternative: Run this SQL directly in Azure Portal Query Editor:
 *
 *   UPDATE TenantEmailConfig
 *   SET isActive = 0, updatedAt = GETDATE()
 *   WHERE isActive = 1
 *     AND provider IN ('MICROSOFT_365', 'GOOGLE_WORKSPACE')
 *     AND (oauth2RefreshToken IS NULL OR oauth2RefreshToken = '')
 *     AND (oauth2AccessToken IS NULL OR oauth2AccessToken = '');
 */

import { PrismaClient } from '@prisma/client';

const OAUTH_PROVIDERS = ['MICROSOFT_365', 'GOOGLE_WORKSPACE'];

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Searching for active OAuth email configs with missing tokens...\n');

    const brokenConfigs = await prisma.tenantEmailConfig.findMany({
      where: {
        isActive: true,
        provider: { in: OAUTH_PROVIDERS },
        OR: [
          { oauth2RefreshToken: null },
          { oauth2RefreshToken: '' },
          {
            AND: [
              { oauth2AccessToken: null },
              { oauth2RefreshToken: null },
            ],
          },
        ],
      },
      select: {
        id: true,
        tenantId: true,
        provider: true,
        isActive: true,
        isVerified: true,
        oauth2ClientId: true,
        oauth2RefreshToken: true,
        oauth2AccessToken: true,
        createdAt: true,
      },
    });

    if (brokenConfigs.length === 0) {
      console.log('No broken OAuth email configs found. Everything looks good!');
      return;
    }

    console.log(`Found ${brokenConfigs.length} broken config(s):\n`);

    for (const config of brokenConfigs) {
      console.log(`  Tenant: ${config.tenantId}`);
      console.log(`  Provider: ${config.provider}`);
      console.log(`  Has ClientId: ${!!config.oauth2ClientId}`);
      console.log(`  Has RefreshToken: ${!!config.oauth2RefreshToken}`);
      console.log(`  Has AccessToken: ${!!config.oauth2AccessToken}`);
      console.log(`  Created: ${config.createdAt.toISOString()}`);
      console.log('');
    }

    // Deactivate all broken configs
    const result = await prisma.tenantEmailConfig.updateMany({
      where: {
        id: { in: brokenConfigs.map((c) => c.id) },
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    console.log(`Deactivated ${result.count} incomplete OAuth email config(s).`);
    console.log('These tenants will now use the Republicode default email adapter.');
    console.log('\nTo reactivate, tenants must complete the OAuth flow and send a test email.');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
