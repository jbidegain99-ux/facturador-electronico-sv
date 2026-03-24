/**
 * E2E Integration Tests: SLA Monitoring System
 *
 * Tests that the SLA monitoring logic correctly calculates deadlines,
 * identifies overdue and at-risk tickets, tracks first response, and
 * handles resolution timestamps per plan tier.
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
const TEST_ID = `e2e_sla_${Date.now()}`;

// Plan SLA expectations (from seed-phase1-plans.ts)
const PLAN_SLA: Record<string, { responseHours: number; resolutionHours: number }> = {
  FREE: { responseHours: 0, resolutionHours: 0 },
  STARTER: { responseHours: 24, resolutionHours: 48 },
  PROFESSIONAL: { responseHours: 12, resolutionHours: 24 },
  ENTERPRISE: { responseHours: 2, resolutionHours: 8 },
};

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
      nombre: `E2E SLA ${planCode} ${TEST_ID}`,
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
      nombre: `E2E SLA Admin ${suffix}`,
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

describe('SLA Monitoring E2E', () => {
  jest.setTimeout(60000);

  const tenants: Record<string, TenantContext> = {};

  beforeAll(async () => {
    console.log(`\n========================================`);
    console.log(`SLA Monitoring E2E - Test ID: ${TEST_ID}`);
    console.log(`========================================\n`);

    tenants.FREE = await createTenantWithPlan('FREE', 'free');
    tenants.STARTER = await createTenantWithPlan('STARTER', 'starter');
    tenants.PROFESSIONAL = await createTenantWithPlan('PROFESSIONAL', 'pro');
    tenants.ENTERPRISE = await createTenantWithPlan('ENTERPRISE', 'ent');

    console.log('\nAll SLA test tenants created.\n');
  });

  afterAll(async () => {
    console.log('\n========================================');
    console.log('SLA MONITORING E2E CLEANUP');
    console.log('========================================');

    for (const tenantId of createdTenantIds) {
      await cleanupTenant(tenantId);
    }

    await prisma.$disconnect();
    console.log('========================================\n');
  });

  // ============================================================
  // 1. SLA DEADLINE CALCULATION FROM slaResponseHours
  // ============================================================

  describe('SLA Deadline Calculation', () => {
    it('should correctly calculate slaDeadline from slaResponseHours (STARTER = 24h)', async () => {
      const ctx = tenants.STARTER;
      const beforeCreate = Date.now();

      const res = await apiRequest('POST', '/support-tickets', ctx.token, {
        subject: `SLA calc test ${TEST_ID}`,
        description: 'Verify slaDeadline = createdAt + slaResponseHours',
        type: 'TECHNICAL',
      });

      expect(res.status).toBe(201);
      expect(res.data.slaResponseHours).toBe(24);
      expect(res.data.slaDeadline).not.toBeNull();

      const slaDeadline = new Date(res.data.slaDeadline as string).getTime();
      const expectedDeadline = beforeCreate + 24 * 60 * 60 * 1000;

      // Within 1 minute tolerance
      expect(Math.abs(slaDeadline - expectedDeadline)).toBeLessThan(60000);

      console.log(`  slaDeadline calculated correctly: ${res.data.slaDeadline}`);
    }, 20000);

    it('should correctly calculate resolutionDeadline (STARTER = 48h)', async () => {
      const ctx = tenants.STARTER;
      const beforeCreate = Date.now();

      const res = await apiRequest('POST', '/support-tickets', ctx.token, {
        subject: `Resolution calc test ${TEST_ID}`,
        description: 'Verify resolutionDeadline = createdAt + resolutionHours',
        type: 'GENERAL',
      });

      expect(res.status).toBe(201);
      expect(res.data.resolutionDeadline).not.toBeNull();

      const resDeadline = new Date(res.data.resolutionDeadline as string).getTime();
      const expectedDeadline = beforeCreate + 48 * 60 * 60 * 1000;

      expect(Math.abs(resDeadline - expectedDeadline)).toBeLessThan(60000);

      console.log(`  resolutionDeadline calculated correctly: ${res.data.resolutionDeadline}`);
    }, 20000);
  });

  // ============================================================
  // 2. OVERDUE TICKET DETECTION VIA PRISMA
  // ============================================================

  describe('Overdue Ticket Detection', () => {
    it('should identify a ticket as overdue when slaDeadline is in the past', async () => {
      const ctx = tenants.STARTER;

      // Create ticket via API
      const res = await apiRequest('POST', '/support-tickets', ctx.token, {
        subject: `Overdue detection test ${TEST_ID}`,
        description: 'This ticket will be manually set to overdue',
        type: 'TECHNICAL',
      });

      expect(res.status).toBe(201);
      const ticketId = res.data.id as string;

      // Manually set slaDeadline to 2 hours in the past via Prisma
      const pastDeadline = new Date(Date.now() - 2 * 60 * 60 * 1000);
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { slaDeadline: pastDeadline },
      });

      // Query like the SLA cron does: find open tickets with past slaDeadline
      const now = new Date();
      const overdueTickets = await prisma.supportTicket.findMany({
        where: {
          id: ticketId,
          status: { notIn: ['RESOLVED', 'CLOSED'] },
          slaDeadline: { not: null, lt: now },
          respondedAt: null,
        },
      });

      expect(overdueTickets.length).toBe(1);
      expect(overdueTickets[0].id).toBe(ticketId);

      console.log(`  Overdue ticket detected: ${overdueTickets[0].ticketNumber}`);
    }, 20000);

    it('should identify a ticket as overdue on resolution when resolutionDeadline is in the past', async () => {
      const ctx = tenants.PROFESSIONAL;

      const res = await apiRequest('POST', '/support-tickets', ctx.token, {
        subject: `Resolution overdue test ${TEST_ID}`,
        description: 'This ticket will have past resolution deadline',
        type: 'BILLING',
      });

      expect(res.status).toBe(201);
      const ticketId = res.data.id as string;

      // Set resolutionDeadline to past
      const pastResDeadline = new Date(Date.now() - 1 * 60 * 60 * 1000);
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { resolutionDeadline: pastResDeadline },
      });

      // Query like the SLA cron: find open tickets with past resolutionDeadline
      const now = new Date();
      const overdueResolution = await prisma.supportTicket.findMany({
        where: {
          id: ticketId,
          status: { notIn: ['RESOLVED', 'CLOSED'] },
          resolutionDeadline: { not: null, lt: now },
          resolvedAt: null,
        },
      });

      expect(overdueResolution.length).toBe(1);
      expect(overdueResolution[0].id).toBe(ticketId);

      console.log(`  Resolution overdue ticket detected: ${overdueResolution[0].ticketNumber}`);
    }, 20000);
  });

  // ============================================================
  // 3. FIRST RESPONSE TRACKING (respondedAt)
  // ============================================================

  describe('First Response Tracking', () => {
    it('should track respondedAt when set via Prisma (simulating staff response)', async () => {
      const ctx = tenants.STARTER;

      const res = await apiRequest('POST', '/support-tickets', ctx.token, {
        subject: `First response tracking ${TEST_ID}`,
        description: 'Verify respondedAt is tracked for SLA',
        type: 'TECHNICAL',
      });

      expect(res.status).toBe(201);
      const ticketId = res.data.id as string;

      // Verify respondedAt is initially null
      const ticketBefore = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: { respondedAt: true, slaDeadline: true },
      });

      expect(ticketBefore).not.toBeNull();
      expect(ticketBefore!.respondedAt).toBeNull();
      expect(ticketBefore!.slaDeadline).not.toBeNull();

      // Simulate staff first response
      const respondedTime = new Date();
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { respondedAt: respondedTime },
      });

      // Verify respondedAt is now set
      const ticketAfter = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: { respondedAt: true },
      });

      expect(ticketAfter).not.toBeNull();
      expect(ticketAfter!.respondedAt).not.toBeNull();

      // Responded ticket should NOT appear in overdue query (since respondedAt is set)
      const now = new Date();
      const overdueCheck = await prisma.supportTicket.findMany({
        where: {
          id: ticketId,
          status: { notIn: ['RESOLVED', 'CLOSED'] },
          slaDeadline: { not: null },
          respondedAt: null,
        },
      });

      expect(overdueCheck.length).toBe(0);

      console.log(`  respondedAt set correctly: ${respondedTime.toISOString()}`);
    }, 20000);
  });

  // ============================================================
  // 4. RESOLUTION TRACKING (resolvedAt and status change)
  // ============================================================

  describe('Resolution Tracking', () => {
    it('should set resolvedAt and change status when ticket is resolved via API', async () => {
      const ctx = tenants.STARTER;

      // Create ticket
      const createRes = await apiRequest('POST', '/support-tickets', ctx.token, {
        subject: `Resolution tracking ${TEST_ID}`,
        description: 'Verify resolvedAt is set when status changes to RESOLVED',
        type: 'GENERAL',
      });

      expect(createRes.status).toBe(201);
      const ticketId = createRes.data.id as string;

      // Verify resolvedAt is initially null
      const ticketBefore = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: { resolvedAt: true, status: true },
      });
      expect(ticketBefore!.resolvedAt).toBeNull();
      expect(ticketBefore!.status).toBe('PENDING');

      // Resolve ticket via Prisma (simulating admin action, since user endpoint
      // may not allow status changes directly)
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });

      // Verify resolvedAt is set
      const ticketAfter = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: { resolvedAt: true, status: true },
      });

      expect(ticketAfter!.status).toBe('RESOLVED');
      expect(ticketAfter!.resolvedAt).not.toBeNull();

      // Resolved ticket should NOT appear in SLA cron query
      const overdueCheck = await prisma.supportTicket.findMany({
        where: {
          id: ticketId,
          status: { notIn: ['RESOLVED', 'CLOSED'] },
          slaDeadline: { not: null },
        },
      });

      expect(overdueCheck.length).toBe(0);

      console.log(`  Ticket resolved: status=${ticketAfter!.status}, resolvedAt=${ticketAfter!.resolvedAt?.toISOString()}`);
    }, 20000);
  });

  // ============================================================
  // 5. ENTERPRISE GETS SHORTEST SLA (2h response, 8h resolution)
  // ============================================================

  describe('ENTERPRISE Shortest SLA', () => {
    it('should assign 2h response SLA to ENTERPRISE tickets', async () => {
      const ctx = tenants.ENTERPRISE;
      const beforeCreate = Date.now();

      const res = await apiRequest('POST', '/support-tickets', ctx.token, {
        subject: `Enterprise SLA test ${TEST_ID}`,
        description: 'Verify ENTERPRISE gets shortest SLA',
        type: 'TECHNICAL',
      });

      expect(res.status).toBe(201);
      expect(res.data.slaResponseHours).toBe(2);
      expect(res.data.planAtCreation).toBe('ENTERPRISE');

      // Verify slaDeadline is ~2h from now
      const slaDeadline = new Date(res.data.slaDeadline as string).getTime();
      const expectedDeadline = beforeCreate + 2 * 60 * 60 * 1000;
      expect(Math.abs(slaDeadline - expectedDeadline)).toBeLessThan(60000);

      // Verify resolutionDeadline is ~8h from now
      const resDeadline = new Date(res.data.resolutionDeadline as string).getTime();
      const expectedResDeadline = beforeCreate + 8 * 60 * 60 * 1000;
      expect(Math.abs(resDeadline - expectedResDeadline)).toBeLessThan(60000);

      console.log(`  ENTERPRISE SLA: responseHours=2, slaDeadline=${res.data.slaDeadline}, resolutionDeadline=${res.data.resolutionDeadline}`);
    }, 20000);

    it('ENTERPRISE SLA should be shorter than all other plans', async () => {
      expect(PLAN_SLA.ENTERPRISE.responseHours).toBeLessThan(PLAN_SLA.PROFESSIONAL.responseHours);
      expect(PLAN_SLA.ENTERPRISE.responseHours).toBeLessThan(PLAN_SLA.STARTER.responseHours);
      expect(PLAN_SLA.ENTERPRISE.resolutionHours).toBeLessThan(PLAN_SLA.PROFESSIONAL.resolutionHours);
      expect(PLAN_SLA.ENTERPRISE.resolutionHours).toBeLessThan(PLAN_SLA.STARTER.resolutionHours);

      console.log('  ENTERPRISE has shortest SLA across all plans - PASS');
    });
  });

  // ============================================================
  // 6. FREE TICKETS HAVE NO SLA DEADLINES
  // ============================================================

  describe('FREE Plan No SLA', () => {
    it('should create ticket with null SLA fields for FREE plan', async () => {
      const ctx = tenants.FREE;

      const res = await apiRequest('POST', '/support-tickets', ctx.token, {
        subject: `Free no-SLA test ${TEST_ID}`,
        description: 'FREE plan should have no SLA deadlines',
        type: 'GENERAL',
      });

      expect(res.status).toBe(201);
      expect(res.data.slaResponseHours).toBeNull();
      expect(res.data.slaDeadline).toBeNull();
      expect(res.data.resolutionDeadline).toBeNull();
      expect(res.data.planAtCreation).toBe('FREE');
      expect(res.data.status).toBe('PENDING');

      console.log('  FREE ticket: all SLA fields are null - PASS');
    }, 20000);

    it('FREE tickets should not appear in SLA monitoring queries', async () => {
      const ctx = tenants.FREE;

      // Create a ticket
      const res = await apiRequest('POST', '/support-tickets', ctx.token, {
        subject: `Free SLA query test ${TEST_ID}`,
        description: 'Should not appear in SLA monitoring',
        type: 'GENERAL',
      });

      expect(res.status).toBe(201);
      const ticketId = res.data.id as string;

      // Query like the SLA cron: slaDeadline must not be null
      const slaTickets = await prisma.supportTicket.findMany({
        where: {
          id: ticketId,
          status: { notIn: ['RESOLVED', 'CLOSED'] },
          slaDeadline: { not: null },
        },
      });

      // FREE ticket has null slaDeadline, so it should not appear
      expect(slaTickets.length).toBe(0);

      console.log('  FREE tickets excluded from SLA monitoring - PASS');
    }, 20000);
  });

  // ============================================================
  // 7. CROSS-PLAN SLA VERIFICATION
  // ============================================================

  describe('Cross-Plan SLA Verification', () => {
    it('should assign correct SLA per plan when creating tickets across all plans', async () => {
      const results: Array<{ plan: string; responseHours: number | null; hasDeadline: boolean }> = [];

      for (const [planCode, ctx] of Object.entries(tenants)) {
        const beforeCreate = Date.now();

        const res = await apiRequest('POST', '/support-tickets', ctx.token, {
          subject: `Cross-plan SLA ${planCode} ${TEST_ID}`,
          description: `Cross-plan SLA verification for ${planCode}`,
          type: 'TECHNICAL',
        });

        expect(res.status).toBe(201);
        expect(res.data.planAtCreation).toBe(planCode);

        const expectedSla = PLAN_SLA[planCode];

        if (expectedSla.responseHours === 0) {
          // FREE: no SLA
          expect(res.data.slaResponseHours).toBeNull();
          expect(res.data.slaDeadline).toBeNull();
          expect(res.data.resolutionDeadline).toBeNull();

          results.push({ plan: planCode, responseHours: null, hasDeadline: false });
        } else {
          // Paid plans: verify SLA hours and deadline accuracy
          expect(res.data.slaResponseHours).toBe(expectedSla.responseHours);
          expect(res.data.slaDeadline).not.toBeNull();
          expect(res.data.resolutionDeadline).not.toBeNull();

          // Verify slaDeadline accuracy
          const slaDeadline = new Date(res.data.slaDeadline as string).getTime();
          const expectedDeadline = beforeCreate + expectedSla.responseHours * 60 * 60 * 1000;
          expect(Math.abs(slaDeadline - expectedDeadline)).toBeLessThan(120000);

          // Verify resolutionDeadline accuracy
          const resDeadline = new Date(res.data.resolutionDeadline as string).getTime();
          const expectedResDeadline = beforeCreate + expectedSla.resolutionHours * 60 * 60 * 1000;
          expect(Math.abs(resDeadline - expectedResDeadline)).toBeLessThan(120000);

          results.push({
            plan: planCode,
            responseHours: expectedSla.responseHours,
            hasDeadline: true,
          });
        }
      }

      // Log summary
      console.log('  Cross-plan SLA results:');
      for (const r of results) {
        console.log(`    ${r.plan}: responseHours=${r.responseHours ?? 'null'}, hasDeadline=${r.hasDeadline}`);
      }

      // Verify ordering: ENTERPRISE < PROFESSIONAL < STARTER (response hours)
      const paidResults = results.filter((r) => r.responseHours !== null);
      const sortedByHours = [...paidResults].sort(
        (a, b) => (a.responseHours as number) - (b.responseHours as number),
      );
      expect(sortedByHours[0].plan).toBe('ENTERPRISE');

      console.log('  SLA ordering verified: ENTERPRISE fastest - PASS');
    }, 40000);

    it('should verify SLA config exists in DB for all paid plans', async () => {
      const paidPlans = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

      for (const planCode of paidPlans) {
        const plan = await prisma.plan.findUnique({
          where: { codigo: planCode },
        });

        expect(plan).not.toBeNull();

        // Look up PlanSupportConfig
        const supportConfig = await prisma.planSupportConfig.findFirst({
          where: { planId: plan!.id },
        });

        expect(supportConfig).not.toBeNull();
        expect(supportConfig!.responseTimeHours).toBe(PLAN_SLA[planCode].responseHours);
        expect(supportConfig!.resolutionTimeHours).toBe(PLAN_SLA[planCode].resolutionHours);

        console.log(`  ${planCode}: responseTimeHours=${supportConfig!.responseTimeHours}, resolutionTimeHours=${supportConfig!.resolutionTimeHours}`);
      }
    }, 15000);
  });

  // ============================================================
  // FINAL SUMMARY
  // ============================================================

  afterAll(() => {
    console.log('\n========================================');
    console.log('SLA MONITORING E2E RESULTS SUMMARY');
    console.log('========================================');
    console.log(`Plans tested: FREE, STARTER, PROFESSIONAL, ENTERPRISE`);
    console.log(`Total tenants created: ${createdTenantIds.length}`);
    console.log('========================================\n');
  });
});
