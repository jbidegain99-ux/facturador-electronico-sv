import { SetMetadata } from '@nestjs/common';

export const SKIP_TENANT_KEY = 'skipTenantCheck';

/**
 * Marks an endpoint to skip TenantGuard validation.
 * Use only on endpoints that are intentionally tenant-agnostic
 * (e.g. super-admin endpoints that operate across tenants).
 */
export const SkipTenantCheck = () => SetMetadata(SKIP_TENANT_KEY, true);
