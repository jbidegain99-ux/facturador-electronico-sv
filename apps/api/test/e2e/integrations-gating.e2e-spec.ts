/**
 * E2E Integration Tests: Integration Feature Gating
 *
 * Tests that plan-restricted features (webhooks, quotes, accounting, email config)
 * are properly blocked by PlanFeatureGuard based on tenant plan tier.
 *
 * Usage:
 *   npm run test:e2e                         # against local API (default)
 *   API_BASE_URL=https://api.facturosv.com npm run test:e2e  # against production
 *
 * Prerequisites:
 *   - API running locally (npm run dev) OR accessible at API_BASE_URL
 *   - Database accessible (for test setup/teardown)
 *   - Plans seeded (seed-phase1-plans.ts already run)
 */

import { PrismaClient } from '@prisma/client';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API = `${BASE_URL}/api/v1`;
const TEST_ID = `e2e_gating_${Date.now()}`;

/**
 * Feature gating matrix:
 *   Feature           | FREE | STARTER | PROFESSIONAL | ENTERPRISE
 *   accounting        |  403 |   200   |     200      |    200
 *   quotes_b2b        |  403 |   403   |     200      |    200
 *   webhooks          |  403 |   403   |     403      |    200
 *   external_email    |  403 |   403   |     200      |    200
 */

function generateUniqueNit(): string {
  const ts = Date.now().toString().slice(-10);
  const p1 = ts.slice(0, 4);
  const p2 = ts.slice(4, 10);
  const p3 = Math.floor(Math.random() * 900 + 100).toString();
  const p4 = Math.floor(Math.random() * 10).toString();
  return `${p1}-${p2}-${p3}-${p4}`;
}

function generateUniqueNrc(): string {
  const n = Math.floor(Math.random() * 900000 + 100000);
  const d = Math.floor(Math.random() * 10);
  return `${n}-${d}`;
}

interface TenantContext {
  token: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  planCode: string;
}

interface ApiResponse {
  status: number;
  data: Record<string, unknown>;
}

const prisma = new PrismaClient();
const createdTenantIds: string[] = [];

async function apiRequest(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  token?: string,
  body?: Record<string, unknown>,
): Promise<ApiResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    // Response may not be JSON
  }

  return { status: res.status, data };
}

async function createTenantWithPlan(planCode: string, suffix: string): Promise<TenantContext> {
  const nit = generateUniqueNit();
  const nrc = generateUniqueNrc();
  const email = `test_${TEST_ID}_${suffix}@e2etest.com`;

  const registerRes = await apiRequest('POST', '/auth/register', undefined, {
    tenant: {
      nombre: `E2E Gating ${planCode} ${TEST_ID}`,
      nit,
      nrc,
      actividadEcon: '62010',
      descActividad: 'Actividades de programacion informatica',
      telefono: '2222-3333',
      correo: `tenant_${TEST_ID}_${suffix}@e2etest.com`,
      direccion: {
        departamento: '06',
        municipio: '14',
        complemento: 'Calle Test #123',
      },
    },
    user: {
      nombre: `E2E Gating Admin ${suffix}`,
      email,
      password: 'TestPassword123',
    },
  });

  if (registerRes.status !== 201) {
    console.error(`Registration failed for ${planCode}:`, JSON.stringify(registerRes.data));
  }
  expect(registerRes.status).toBe(201);

  const tenantData = registerRes.data.tenant as Record<string, unknown>;
  const userData = registerRes.data.user as Record<string, unknown>;
  const tenantId = tenantData.id as string;
  const userId = userData.id as string;

  createdTenantIds.push(tenantId);

  // Verify email via Prisma
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true, emailVerificationToken: null, emailVerificationExpiresAt: null },
  });

  // Assign plan via Prisma
  const plan = await prisma.plan.findUnique({ where: { codigo: planCode } });
  if (!plan) {
    throw new Error(`Plan ${planCode} not found in DB. Run seed-phase1-plans.ts first.`);
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { plan: planCode, planId: plan.id },
  });

  // Login
  const loginRes = await apiRequest('POST', '/auth/login', undefined, {
    email,
    password: 'TestPassword123',
  });

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    console.error(`Login failed for ${planCode}:`, JSON.stringify(loginRes.data));
  }
  expect(loginRes.data.access_token).toBeDefined();

  console.log(`  [${planCode}] Tenant created: ${tenantId}, user: ${email}`);

  return {
    token: loginRes.data.access_token as string,
    tenantId,
    userId,
    userEmail: email,
    planCode,
  };
}

async function cleanupTenant(tenantId: string): Promise<void> {
  try {
    // Delete feature usage tracking records
    await prisma.tenantFeatureUsage.deleteMany({
      where: { tenantId },
    }).catch(() => ({ count: 0 }));

    await prisma.ticketActivity.deleteMany({
      where: { ticket: { tenantId } },
    }).catch(() => ({ count: 0 }));

    await prisma.ticketAttachment.deleteMany({
      where: { ticket: { tenantId } },
    }).catch(() => ({ count: 0 }));

    await prisma.ticketComment.deleteMany({
      where: { ticket: { tenantId } },
    }).catch(() => ({ count: 0 }));

    await prisma.supportTicket.deleteMany({
      where: { tenantId },
    }).catch(() => ({ count: 0 }));

    await prisma.journalEntry.deleteMany({
      where: { tenantId },
    }).catch(() => ({ count: 0 }));

    await prisma.auditLog.deleteMany({ where: { tenantId } }).catch(() => null);

    await prisma.user.deleteMany({ where: { tenantId } });

    await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => null);

    console.log(`  Cleaned up tenant: ${tenantId}`);
  } catch (err) {
    console.error(`Cleanup error for tenant ${tenantId}:`, err);
  }
}

// ============================================================
// TEST SUITE
// ============================================================

describe('Integrations Feature Gating E2E', () => {
  jest.setTimeout(60000);

  const tenants: Record<string, TenantContext> = {};

  // Gated endpoints to test
  const GATED_ENDPOINTS = {
    accounting: '/accounting/accounts',
    quotes: '/quotes',
    webhooks: '/webhooks/endpoints',
    emailConfig: '/email-config',
  };

  beforeAll(async () => {
    console.log(`\n========================================`);
    console.log(`Integrations Feature Gating E2E - Test ID: ${TEST_ID}`);
    console.log(`========================================\n`);

    tenants.FREE = await createTenantWithPlan('FREE', 'free');
    tenants.STARTER = await createTenantWithPlan('STARTER', 'starter');
    tenants.PROFESSIONAL = await createTenantWithPlan('PROFESSIONAL', 'pro');
    tenants.ENTERPRISE = await createTenantWithPlan('ENTERPRISE', 'ent');

    console.log('\nAll feature gating test tenants created.\n');
  });

  afterAll(async () => {
    console.log('\n========================================');
    console.log('INTEGRATIONS GATING E2E CLEANUP');
    console.log('========================================');

    for (const tenantId of createdTenantIds) {
      await cleanupTenant(tenantId);
    }

    await prisma.$disconnect();
    console.log('========================================\n');
  });

  // ============================================================
  // 1. FREE TENANT: 403 on all gated endpoints
  // ============================================================

  describe('FREE Tenant - All Gated Endpoints Blocked', () => {
    it('should return 403 on /accounting/accounts', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.accounting, tenants.FREE.token);
      expect(res.status).toBe(403);
      console.log(`  FREE -> ${GATED_ENDPOINTS.accounting}: ${res.status} - PASS`);
    }, 15000);

    it('should return 403 on /quotes', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.quotes, tenants.FREE.token);
      expect(res.status).toBe(403);
      console.log(`  FREE -> ${GATED_ENDPOINTS.quotes}: ${res.status} - PASS`);
    }, 15000);

    it('should return 403 on /webhooks/endpoints', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.webhooks, tenants.FREE.token);
      expect(res.status).toBe(403);
      console.log(`  FREE -> ${GATED_ENDPOINTS.webhooks}: ${res.status} - PASS`);
    }, 15000);

    it('should return 403 on /email-config', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.emailConfig, tenants.FREE.token);
      expect(res.status).toBe(403);
      console.log(`  FREE -> ${GATED_ENDPOINTS.emailConfig}: ${res.status} - PASS`);
    }, 15000);
  });

  // ============================================================
  // 2. STARTER TENANT: accounting OK, quotes/webhooks/email blocked
  // ============================================================

  describe('STARTER Tenant - Accounting Allowed, Others Blocked', () => {
    it('should allow access to /accounting/accounts (not 403)', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.accounting, tenants.STARTER.token);
      expect(res.status).not.toBe(403);
      console.log(`  STARTER -> ${GATED_ENDPOINTS.accounting}: ${res.status} (allowed) - PASS`);
    }, 15000);

    it('should return 403 on /quotes', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.quotes, tenants.STARTER.token);
      expect(res.status).toBe(403);
      console.log(`  STARTER -> ${GATED_ENDPOINTS.quotes}: ${res.status} - PASS`);
    }, 15000);

    it('should return 403 on /webhooks/endpoints', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.webhooks, tenants.STARTER.token);
      expect(res.status).toBe(403);
      console.log(`  STARTER -> ${GATED_ENDPOINTS.webhooks}: ${res.status} - PASS`);
    }, 15000);

    it('should return 403 on /email-config', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.emailConfig, tenants.STARTER.token);
      expect(res.status).toBe(403);
      console.log(`  STARTER -> ${GATED_ENDPOINTS.emailConfig}: ${res.status} - PASS`);
    }, 15000);
  });

  // ============================================================
  // 3. PROFESSIONAL TENANT: accounting/quotes/email OK, webhooks blocked
  // ============================================================

  describe('PROFESSIONAL Tenant - Most Allowed, Webhooks Blocked', () => {
    it('should allow access to /accounting/accounts (not 403)', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.accounting, tenants.PROFESSIONAL.token);
      expect(res.status).not.toBe(403);
      console.log(`  PROFESSIONAL -> ${GATED_ENDPOINTS.accounting}: ${res.status} (allowed) - PASS`);
    }, 15000);

    it('should allow access to /quotes (not 403)', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.quotes, tenants.PROFESSIONAL.token);
      expect(res.status).not.toBe(403);
      console.log(`  PROFESSIONAL -> ${GATED_ENDPOINTS.quotes}: ${res.status} (allowed) - PASS`);
    }, 15000);

    it('should return 403 on /webhooks/endpoints', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.webhooks, tenants.PROFESSIONAL.token);
      expect(res.status).toBe(403);
      console.log(`  PROFESSIONAL -> ${GATED_ENDPOINTS.webhooks}: ${res.status} - PASS`);
    }, 15000);

    it('should allow access to /email-config (not 403)', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.emailConfig, tenants.PROFESSIONAL.token);
      expect(res.status).not.toBe(403);
      console.log(`  PROFESSIONAL -> ${GATED_ENDPOINTS.emailConfig}: ${res.status} (allowed) - PASS`);
    }, 15000);
  });

  // ============================================================
  // 4. ENTERPRISE TENANT: all endpoints allowed
  // ============================================================

  describe('ENTERPRISE Tenant - All Endpoints Allowed', () => {
    it('should allow access to /accounting/accounts (not 403)', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.accounting, tenants.ENTERPRISE.token);
      expect(res.status).not.toBe(403);
      console.log(`  ENTERPRISE -> ${GATED_ENDPOINTS.accounting}: ${res.status} (allowed) - PASS`);
    }, 15000);

    it('should allow access to /quotes (not 403)', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.quotes, tenants.ENTERPRISE.token);
      expect(res.status).not.toBe(403);
      console.log(`  ENTERPRISE -> ${GATED_ENDPOINTS.quotes}: ${res.status} (allowed) - PASS`);
    }, 15000);

    it('should allow access to /webhooks/endpoints (not 403)', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.webhooks, tenants.ENTERPRISE.token);
      expect(res.status).not.toBe(403);
      console.log(`  ENTERPRISE -> ${GATED_ENDPOINTS.webhooks}: ${res.status} (allowed) - PASS`);
    }, 15000);

    it('should allow access to /email-config (not 403)', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.emailConfig, tenants.ENTERPRISE.token);
      expect(res.status).not.toBe(403);
      console.log(`  ENTERPRISE -> ${GATED_ENDPOINTS.emailConfig}: ${res.status} (allowed) - PASS`);
    }, 15000);
  });

  // ============================================================
  // 5. 403 RESPONSE CONTAINS PLAN INFO FOR UPGRADE GUIDANCE
  // ============================================================

  describe('403 Response Contains Plan Info', () => {
    it('should include plan code in 403 error message for upgrade guidance', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.webhooks, tenants.FREE.token);

      expect(res.status).toBe(403);
      expect(res.data.message).toBeDefined();

      const message = res.data.message as string;

      // PlanFeatureGuard returns: "Tu plan actual (FREE) no incluye esta funcionalidad..."
      expect(message).toContain('FREE');
      expect(message).toContain('plan');

      console.log(`  403 message includes plan info: "${message}"`);
    }, 15000);

    it('should include plan code for STARTER denied from quotes', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.quotes, tenants.STARTER.token);

      expect(res.status).toBe(403);
      expect(res.data.message).toBeDefined();

      const message = res.data.message as string;
      expect(message).toContain('STARTER');

      console.log(`  STARTER 403 on quotes: "${message}"`);
    }, 15000);

    it('should include plan code for PROFESSIONAL denied from webhooks', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.webhooks, tenants.PROFESSIONAL.token);

      expect(res.status).toBe(403);
      expect(res.data.message).toBeDefined();

      const message = res.data.message as string;
      expect(message).toContain('PROFESSIONAL');

      console.log(`  PROFESSIONAL 403 on webhooks: "${message}"`);
    }, 15000);

    it('should include upgrade guidance text in 403 response', async () => {
      const res = await apiRequest('GET', GATED_ENDPOINTS.webhooks, tenants.STARTER.token);

      expect(res.status).toBe(403);
      const message = res.data.message as string;

      // Guard message includes "Actualiza tu plan para acceder a esta caracteristica"
      expect(message.toLowerCase()).toMatch(/actualiza|upgrade|plan/);

      console.log(`  Upgrade guidance present in 403 - PASS`);
    }, 15000);
  });

  // ============================================================
  // CROSS-PLAN FEATURE MATRIX (summary test)
  // ============================================================

  describe('Cross-Plan Feature Matrix', () => {
    interface MatrixEntry {
      endpoint: string;
      expectedByPlan: Record<string, 'allow' | 'deny'>;
    }

    const matrix: MatrixEntry[] = [
      {
        endpoint: '/accounting/accounts',
        expectedByPlan: { FREE: 'deny', STARTER: 'allow', PROFESSIONAL: 'allow', ENTERPRISE: 'allow' },
      },
      {
        endpoint: '/quotes',
        expectedByPlan: { FREE: 'deny', STARTER: 'deny', PROFESSIONAL: 'allow', ENTERPRISE: 'allow' },
      },
      {
        endpoint: '/webhooks/endpoints',
        expectedByPlan: { FREE: 'deny', STARTER: 'deny', PROFESSIONAL: 'deny', ENTERPRISE: 'allow' },
      },
      {
        endpoint: '/email-config',
        expectedByPlan: { FREE: 'deny', STARTER: 'deny', PROFESSIONAL: 'allow', ENTERPRISE: 'allow' },
      },
    ];

    for (const entry of matrix) {
      it(`should enforce correct gating for ${entry.endpoint}`, async () => {
        const results: string[] = [];

        for (const [planCode, expected] of Object.entries(entry.expectedByPlan)) {
          const ctx = tenants[planCode];
          const res = await apiRequest('GET', entry.endpoint, ctx.token);

          if (expected === 'deny') {
            expect(res.status).toBe(403);
            results.push(`${planCode}=403`);
          } else {
            expect(res.status).not.toBe(403);
            results.push(`${planCode}=${res.status}`);
          }
        }

        console.log(`  ${entry.endpoint}: ${results.join(', ')}`);
      }, 30000);
    }
  });

  // ============================================================
  // FINAL SUMMARY
  // ============================================================

  afterAll(() => {
    console.log('\n========================================');
    console.log('INTEGRATIONS GATING E2E RESULTS SUMMARY');
    console.log('========================================');
    console.log(`Plans tested: FREE, STARTER, PROFESSIONAL, ENTERPRISE`);
    console.log(`Endpoints tested: ${Object.values(GATED_ENDPOINTS).join(', ')}`);
    console.log(`Total tenants created: ${createdTenantIds.length}`);
    console.log('========================================\n');
  });
});
