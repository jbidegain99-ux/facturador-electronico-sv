/**
 * E2E Integration Tests: Plan Tiers & Feature Gating
 *
 * Tests that each plan (FREE, STARTER, PROFESSIONAL, ENTERPRISE) enforces
 * correct pricing, limits, feature access, and SLA configuration.
 *
 * For each plan, a test tenant is created, assigned to the plan via Prisma,
 * and then API endpoints are tested to verify feature gating (403 for
 * disallowed features, 2xx for allowed ones).
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
const TEST_ID = `e2e_plans_${Date.now()}`;

// Generate a unique NIT in format 0000-000000-000-0
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

interface TenantTestContext {
  token: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  planCode: string;
  nit: string;
  nrc: string;
}

const prisma = new PrismaClient();

// We'll create one test tenant per plan
const tenants: Record<string, TenantTestContext> = {};

// Helper: make authenticated API request with a specific token
async function apiRequest(
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH',
  path: string,
  token?: string,
  body?: Record<string, unknown>,
): Promise<{ status: number; data: Record<string, unknown> }> {
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

// Helper: register a tenant, verify email, login, assign plan, return context
async function createTenantWithPlan(planCode: string, suffix: string): Promise<TenantTestContext> {
  const nit = generateUniqueNit();
  const nrc = generateUniqueNrc();
  const email = `test_${TEST_ID}_${suffix}@e2etest.com`;

  // 1. Register
  const registerRes = await apiRequest('POST', '/auth/register', undefined, {
    tenant: {
      nombre: `E2E ${planCode} ${TEST_ID}`,
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
      nombre: `E2E ${planCode} Admin`,
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

  // 2. Verify email via Prisma
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true, emailVerificationToken: null, emailVerificationExpiresAt: null },
  });

  // 3. Assign plan via Prisma
  const plan = await prisma.plan.findUnique({ where: { codigo: planCode } });
  if (!plan) {
    throw new Error(`Plan ${planCode} not found in DB. Run seed-phase1-plans.ts first.`);
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { plan: planCode, planId: plan.id },
  });

  // 4. Login
  const loginRes = await apiRequest('POST', '/auth/login', undefined, {
    email,
    password: 'TestPassword123',
  });

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    console.error(`Login failed for ${planCode}:`, JSON.stringify(loginRes.data));
  }
  expect(loginRes.data.access_token).toBeDefined();

  const ctx: TenantTestContext = {
    token: loginRes.data.access_token as string,
    tenantId,
    userId,
    userEmail: email,
    planCode,
    nit,
    nrc,
  };

  console.log(`  [${planCode}] Tenant created: ${tenantId}, user: ${email}`);
  return ctx;
}

// Helper: cleanup a single tenant's data
async function cleanupTenant(ctx: TenantTestContext): Promise<void> {
  if (!ctx.tenantId) return;

  // Delete in FK-safe order
  await prisma.ticketComment.deleteMany({
    where: { ticket: { tenantId: ctx.tenantId } },
  }).catch(() => ({ count: 0 }));

  await prisma.ticketAttachment.deleteMany({
    where: { ticket: { tenantId: ctx.tenantId } },
  }).catch(() => ({ count: 0 }));

  await prisma.supportTicket.deleteMany({
    where: { tenantId: ctx.tenantId },
  }).catch(() => ({ count: 0 }));

  await prisma.dTELog.deleteMany({
    where: { dte: { tenantId: ctx.tenantId } },
  }).catch(() => ({ count: 0 }));

  await prisma.journalEntry.deleteMany({
    where: { tenantId: ctx.tenantId },
  }).catch(() => ({ count: 0 }));

  await prisma.dTE.deleteMany({ where: { tenantId: ctx.tenantId } }).catch(() => ({ count: 0 }));

  await prisma.cliente.deleteMany({ where: { tenantId: ctx.tenantId } }).catch(() => ({ count: 0 }));

  await prisma.sucursal.deleteMany({ where: { tenantId: ctx.tenantId } }).catch(() => ({ count: 0 }));

  await prisma.auditLog.deleteMany({ where: { tenantId: ctx.tenantId } }).catch(() => null);

  await prisma.user.deleteMany({ where: { tenantId: ctx.tenantId } });

  await prisma.tenant.delete({ where: { id: ctx.tenantId } }).catch(() => null);

  console.log(`  [${ctx.planCode}] Cleaned up tenant: ${ctx.tenantId}`);
}

// ============================================================
// TEST SUITE
// ============================================================

describe('Plan Tiers E2E', () => {
  // Increase timeout for setup
  jest.setTimeout(60000);

  beforeAll(async () => {
    console.log(`\n========================================`);
    console.log(`Plan Tiers E2E - Test ID: ${TEST_ID}`);
    console.log(`========================================\n`);

    // Create one tenant per plan
    tenants.FREE = await createTenantWithPlan('FREE', 'free');
    tenants.STARTER = await createTenantWithPlan('STARTER', 'starter');
    tenants.PROFESSIONAL = await createTenantWithPlan('PROFESSIONAL', 'pro');
    tenants.ENTERPRISE = await createTenantWithPlan('ENTERPRISE', 'ent');

    console.log('\nAll test tenants created.\n');
  });

  afterAll(async () => {
    console.log('\n========================================');
    console.log('E2E CLEANUP');
    console.log('========================================');

    for (const ctx of Object.values(tenants)) {
      await cleanupTenant(ctx);
    }

    await prisma.$disconnect();
    console.log('========================================\n');
  });

  // ============================================================
  // 1. PLAN VERIFICATION - All 4 plans exist with correct data
  // ============================================================

  describe('Plan Verification', () => {
    it('should have all 4 plans with correct pricing and limits', async () => {
      const res = await apiRequest('GET', '/plans/active', tenants.FREE.token);
      expect(res.status).toBe(200);

      const plans = res.data as unknown as Array<Record<string, unknown>>;
      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThanOrEqual(4);

      // Find each plan by code
      const freePlan = plans.find((p) => p.codigo === 'FREE');
      const starterPlan = plans.find((p) => p.codigo === 'STARTER');
      const professionalPlan = plans.find((p) => p.codigo === 'PROFESSIONAL');
      const enterprisePlan = plans.find((p) => p.codigo === 'ENTERPRISE');

      expect(freePlan).toBeDefined();
      expect(starterPlan).toBeDefined();
      expect(professionalPlan).toBeDefined();
      expect(enterprisePlan).toBeDefined();

      // FREE: $0, 10 DTEs, 1 user, 1 branch
      expect(Number(freePlan!.precioMensual)).toBe(0);
      expect(freePlan!.maxDtesPerMonth).toBe(10);
      expect(freePlan!.maxUsers).toBe(1);
      expect(freePlan!.maxBranches).toBe(1);

      // STARTER: $19, 300 DTEs, 3 users, 1 branch
      expect(Number(starterPlan!.precioMensual)).toBe(19);
      expect(starterPlan!.maxDtesPerMonth).toBe(300);
      expect(starterPlan!.maxUsers).toBe(3);
      expect(starterPlan!.maxBranches).toBe(1);

      // PROFESSIONAL: $65, 2000 DTEs, 10 users, 5 branches
      expect(Number(professionalPlan!.precioMensual)).toBe(65);
      expect(professionalPlan!.maxDtesPerMonth).toBe(2000);
      expect(professionalPlan!.maxUsers).toBe(10);
      expect(professionalPlan!.maxBranches).toBe(5);

      // ENTERPRISE: $199, unlimited (-1) DTEs, users, branches
      expect(Number(enterprisePlan!.precioMensual)).toBe(199);
      expect(enterprisePlan!.maxDtesPerMonth).toBe(-1);
      expect(enterprisePlan!.maxUsers).toBe(-1);
      expect(enterprisePlan!.maxBranches).toBe(-1);
    });

    it('should return current plan for each tenant', async () => {
      for (const [planCode, ctx] of Object.entries(tenants)) {
        const res = await apiRequest('GET', '/plans/current', ctx.token);
        expect(res.status).toBe(200);
        expect(res.data).toBeDefined();
        console.log(`  [${planCode}] Current plan response OK`);
      }
    });
  });

  // ============================================================
  // 2. FREE TIER LIMITS
  // ============================================================

  describe('FREE Tier', () => {
    it('should have correct plan assigned', async () => {
      const res = await apiRequest('GET', '/plans/current', tenants.FREE.token);
      expect(res.status).toBe(200);
    });

    it('should NOT access accounting endpoints (403)', async () => {
      const res = await apiRequest('GET', '/accounting/accounts', tenants.FREE.token);
      expect(res.status).toBe(403);
    });

    it('should NOT access quotes (403)', async () => {
      const res = await apiRequest('GET', '/quotes', tenants.FREE.token);
      expect(res.status).toBe(403);
    });

    it('should NOT access webhooks (403)', async () => {
      const res = await apiRequest('GET', '/webhooks/endpoints', tenants.FREE.token);
      expect(res.status).toBe(403);
    });

    it('should be able to create a support ticket (no SLA deadlines)', async () => {
      const res = await apiRequest('POST', '/support-tickets', tenants.FREE.token, {
        subject: `E2E Free ticket ${TEST_ID}`,
        description: 'Testing FREE plan SLA',
        type: 'GENERAL',
      });

      expect(res.status).toBe(201);
      expect(res.data.id).toBeDefined();
      expect(res.data.ticketNumber).toBeDefined();

      // FREE plan has 0 SLA hours, so no deadlines should be set
      expect(res.data.slaResponseHours).toBeNull();
      expect(res.data.slaDeadline).toBeNull();
      expect(res.data.resolutionDeadline).toBeNull();
      expect(res.data.planAtCreation).toBe('FREE');
    });

    it('should have maxDtesPerMonth limit of 10', async () => {
      const plan = await prisma.plan.findUnique({ where: { codigo: 'FREE' } });
      expect(plan).toBeDefined();
      expect(plan!.maxDtesPerMonth).toBe(10);
    });
  });

  // ============================================================
  // 3. STARTER TIER
  // ============================================================

  describe('STARTER Tier', () => {
    it('should have price of $19', async () => {
      const plan = await prisma.plan.findUnique({ where: { codigo: 'STARTER' } });
      expect(plan).toBeDefined();
      expect(Number(plan!.precioMensual)).toBe(19);
    });

    it('should have accounting feature (can access accounting)', async () => {
      const res = await apiRequest('GET', '/accounting/accounts', tenants.STARTER.token);
      // Should NOT be 403 (feature is allowed); may be 200 or other non-403 status
      expect(res.status).not.toBe(403);
    });

    it('should have recurring_invoices feature', async () => {
      const plan = await prisma.plan.findUnique({ where: { codigo: 'STARTER' } });
      const features: string[] = JSON.parse(plan!.features || '[]');
      expect(features).toContain('recurring_invoices');
    });

    it('should NOT have quotes_b2b (403)', async () => {
      const res = await apiRequest('GET', '/quotes', tenants.STARTER.token);
      expect(res.status).toBe(403);
    });

    it('should NOT have webhooks (403)', async () => {
      const res = await apiRequest('GET', '/webhooks/endpoints', tenants.STARTER.token);
      expect(res.status).toBe(403);
    });

    it('should NOT have external_email feature', async () => {
      const plan = await prisma.plan.findUnique({ where: { codigo: 'STARTER' } });
      const features: string[] = JSON.parse(plan!.features || '[]');
      expect(features).not.toContain('external_email');
    });

    it('should create support ticket with correct SLA (24h response)', async () => {
      const res = await apiRequest('POST', '/support-tickets', tenants.STARTER.token, {
        subject: `E2E Starter ticket ${TEST_ID}`,
        description: 'Testing STARTER plan SLA',
        type: 'TECHNICAL',
      });

      expect(res.status).toBe(201);
      expect(res.data.id).toBeDefined();
      expect(res.data.slaResponseHours).toBe(24);
      expect(res.data.slaDeadline).toBeDefined();
      expect(res.data.slaDeadline).not.toBeNull();
      expect(res.data.resolutionDeadline).toBeDefined();
      expect(res.data.resolutionDeadline).not.toBeNull();
      expect(res.data.planAtCreation).toBe('STARTER');
    });

    it('should be limited to 1 branch', async () => {
      const plan = await prisma.plan.findUnique({ where: { codigo: 'STARTER' } });
      expect(plan!.maxBranches).toBe(1);
    });
  });

  // ============================================================
  // 4. PROFESSIONAL TIER
  // ============================================================

  describe('PROFESSIONAL Tier', () => {
    it('should have price of $65', async () => {
      const plan = await prisma.plan.findUnique({ where: { codigo: 'PROFESSIONAL' } });
      expect(plan).toBeDefined();
      expect(Number(plan!.precioMensual)).toBe(65);
    });

    it('should have quotes_b2b (can access quotes)', async () => {
      const res = await apiRequest('GET', '/quotes', tenants.PROFESSIONAL.token);
      // Should NOT be 403 (feature is allowed)
      expect(res.status).not.toBe(403);
    });

    it('should have advanced_reports feature', async () => {
      const plan = await prisma.plan.findUnique({ where: { codigo: 'PROFESSIONAL' } });
      const features: string[] = JSON.parse(plan!.features || '[]');
      expect(features).toContain('advanced_reports');
    });

    it('should have external_email feature', async () => {
      const plan = await prisma.plan.findUnique({ where: { codigo: 'PROFESSIONAL' } });
      const features: string[] = JSON.parse(plan!.features || '[]');
      expect(features).toContain('external_email');
    });

    it('should have accounting feature (can access accounting)', async () => {
      const res = await apiRequest('GET', '/accounting/accounts', tenants.PROFESSIONAL.token);
      expect(res.status).not.toBe(403);
    });

    it('should NOT have webhooks (403)', async () => {
      const res = await apiRequest('GET', '/webhooks/endpoints', tenants.PROFESSIONAL.token);
      expect(res.status).toBe(403);
    });

    it('should NOT have api_full feature', async () => {
      const plan = await prisma.plan.findUnique({ where: { codigo: 'PROFESSIONAL' } });
      const features: string[] = JSON.parse(plan!.features || '[]');
      expect(features).not.toContain('api_full');
    });

    it('should be limited to 5 branches', async () => {
      const plan = await prisma.plan.findUnique({ where: { codigo: 'PROFESSIONAL' } });
      expect(plan!.maxBranches).toBe(5);
    });

    it('should create support ticket with correct SLA (12h response)', async () => {
      const res = await apiRequest('POST', '/support-tickets', tenants.PROFESSIONAL.token, {
        subject: `E2E Professional ticket ${TEST_ID}`,
        description: 'Testing PROFESSIONAL plan SLA',
        type: 'BILLING',
      });

      expect(res.status).toBe(201);
      expect(res.data.id).toBeDefined();
      expect(res.data.slaResponseHours).toBe(12);
      expect(res.data.slaDeadline).toBeDefined();
      expect(res.data.slaDeadline).not.toBeNull();
      expect(res.data.resolutionDeadline).toBeDefined();
      expect(res.data.resolutionDeadline).not.toBeNull();
      expect(res.data.planAtCreation).toBe('PROFESSIONAL');
    });
  });

  // ============================================================
  // 5. ENTERPRISE TIER
  // ============================================================

  describe('ENTERPRISE Tier', () => {
    it('should have price of $199', async () => {
      const plan = await prisma.plan.findUnique({ where: { codigo: 'ENTERPRISE' } });
      expect(plan).toBeDefined();
      expect(Number(plan!.precioMensual)).toBe(199);
    });

    it('should have ALL features including webhooks', async () => {
      const plan = await prisma.plan.findUnique({ where: { codigo: 'ENTERPRISE' } });
      const features: string[] = JSON.parse(plan!.features || '[]');

      const allExpectedFeatures = [
        'invoicing',
        'accounting',
        'catalog',
        'recurring_invoices',
        'quotes_b2b',
        'webhooks',
        'api_full',
        'advanced_reports',
        'ticket_support',
        'phone_support',
        'logo_branding',
        'external_email',
        'hacienda_setup_support',
      ];

      for (const feature of allExpectedFeatures) {
        expect(features).toContain(feature);
      }
    });

    it('should access webhooks endpoints (not 403)', async () => {
      const res = await apiRequest('GET', '/webhooks/endpoints', tenants.ENTERPRISE.token);
      expect(res.status).not.toBe(403);
    });

    it('should access quotes endpoints (not 403)', async () => {
      const res = await apiRequest('GET', '/quotes', tenants.ENTERPRISE.token);
      expect(res.status).not.toBe(403);
    });

    it('should access accounting endpoints (not 403)', async () => {
      const res = await apiRequest('GET', '/accounting/accounts', tenants.ENTERPRISE.token);
      expect(res.status).not.toBe(403);
    });

    it('should have unlimited branches (-1)', async () => {
      const plan = await prisma.plan.findUnique({ where: { codigo: 'ENTERPRISE' } });
      expect(plan!.maxBranches).toBe(-1);
    });

    it('should have unlimited DTEs (-1)', async () => {
      const plan = await prisma.plan.findUnique({ where: { codigo: 'ENTERPRISE' } });
      expect(plan!.maxDtesPerMonth).toBe(-1);
    });

    it('should have unlimited users (-1)', async () => {
      const plan = await prisma.plan.findUnique({ where: { codigo: 'ENTERPRISE' } });
      expect(plan!.maxUsers).toBe(-1);
    });

    it('should create support ticket with correct SLA (2h response)', async () => {
      const res = await apiRequest('POST', '/support-tickets', tenants.ENTERPRISE.token, {
        subject: `E2E Enterprise ticket ${TEST_ID}`,
        description: 'Testing ENTERPRISE plan SLA',
        type: 'TECHNICAL',
      });

      expect(res.status).toBe(201);
      expect(res.data.id).toBeDefined();
      expect(res.data.slaResponseHours).toBe(2);
      expect(res.data.slaDeadline).toBeDefined();
      expect(res.data.slaDeadline).not.toBeNull();
      expect(res.data.resolutionDeadline).toBeDefined();
      expect(res.data.resolutionDeadline).not.toBeNull();
      expect(res.data.planAtCreation).toBe('ENTERPRISE');
    });
  });

  // ============================================================
  // CROSS-PLAN FEATURE MATRIX SUMMARY
  // ============================================================

  describe('Cross-Plan Feature Matrix', () => {
    it('accounting: denied for FREE, allowed for STARTER+', async () => {
      const freeRes = await apiRequest('GET', '/accounting/accounts', tenants.FREE.token);
      const starterRes = await apiRequest('GET', '/accounting/accounts', tenants.STARTER.token);
      const proRes = await apiRequest('GET', '/accounting/accounts', tenants.PROFESSIONAL.token);
      const entRes = await apiRequest('GET', '/accounting/accounts', tenants.ENTERPRISE.token);

      expect(freeRes.status).toBe(403);
      expect(starterRes.status).not.toBe(403);
      expect(proRes.status).not.toBe(403);
      expect(entRes.status).not.toBe(403);
    });

    it('quotes_b2b: denied for FREE and STARTER, allowed for PROFESSIONAL+', async () => {
      const freeRes = await apiRequest('GET', '/quotes', tenants.FREE.token);
      const starterRes = await apiRequest('GET', '/quotes', tenants.STARTER.token);
      const proRes = await apiRequest('GET', '/quotes', tenants.PROFESSIONAL.token);
      const entRes = await apiRequest('GET', '/quotes', tenants.ENTERPRISE.token);

      expect(freeRes.status).toBe(403);
      expect(starterRes.status).toBe(403);
      expect(proRes.status).not.toBe(403);
      expect(entRes.status).not.toBe(403);
    });

    it('webhooks: denied for FREE, STARTER, PROFESSIONAL; allowed for ENTERPRISE only', async () => {
      const freeRes = await apiRequest('GET', '/webhooks/endpoints', tenants.FREE.token);
      const starterRes = await apiRequest('GET', '/webhooks/endpoints', tenants.STARTER.token);
      const proRes = await apiRequest('GET', '/webhooks/endpoints', tenants.PROFESSIONAL.token);
      const entRes = await apiRequest('GET', '/webhooks/endpoints', tenants.ENTERPRISE.token);

      expect(freeRes.status).toBe(403);
      expect(starterRes.status).toBe(403);
      expect(proRes.status).toBe(403);
      expect(entRes.status).not.toBe(403);
    });
  });

  // ============================================================
  // FINAL SUMMARY
  // ============================================================

  afterAll(() => {
    console.log('\n========================================');
    console.log('PLAN TIERS E2E RESULTS SUMMARY');
    console.log('========================================');
    for (const [planCode, ctx] of Object.entries(tenants)) {
      console.log(`  ${planCode}: tenant=${ctx.tenantId}`);
    }
    console.log('========================================\n');
  });
});
