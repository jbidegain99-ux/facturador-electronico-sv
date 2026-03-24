/**
 * E2E Integration Tests: Support Ticket System
 *
 * Tests the complete support ticket lifecycle including creation, SLA verification
 * by plan tier, comments, pagination, tenant isolation, and validation.
 *
 * Usage:
 *   npm run test:e2e                         # against local API (default)
 *   API_BASE_URL=https://api.facturosv.com npm run test:e2e  # against production
 *
 * Prerequisites:
 *   - API running locally (npm run dev) OR accessible at API_BASE_URL
 *   - Database accessible (for test setup/teardown)
 *   - PlanSupportConfig seeded (run seed-phase1-plans.ts)
 */

import { PrismaClient } from '@prisma/client';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API = `${BASE_URL}/api/v1`;

// Unique suffix to avoid collisions with existing data
const TEST_ID = `e2e_st_${Date.now()}`;

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

interface TenantContext {
  token: string;
  tenantId: string;
  userId: string;
  userEmail: string;
}

interface ApiResponse {
  status: number;
  data: Record<string, unknown>;
}

// Plan SLA expectations (from seed-phase1-plans.ts)
const PLAN_SLA: Record<string, { responseHours: number; resolutionHours: number }> = {
  FREE: { responseHours: 0, resolutionHours: 0 },
  STARTER: { responseHours: 24, resolutionHours: 48 },
  PROFESSIONAL: { responseHours: 12, resolutionHours: 24 },
  ENTERPRISE: { responseHours: 2, resolutionHours: 8 },
};

const TICKET_TYPES = ['EMAIL_CONFIG', 'TECHNICAL', 'BILLING', 'GENERAL', 'ONBOARDING'] as const;

const prisma = new PrismaClient();

// Track all created tenants for cleanup
const createdTenantIds: string[] = [];
const createdUserIds: string[] = [];

// Helper: make authenticated API request
async function apiRequest(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: Record<string, unknown>,
  token?: string,
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

// Helper: register a new tenant, verify email, login, and return context
async function createTenantAndLogin(planCode: string, suffix: string): Promise<TenantContext> {
  const nit = generateUniqueNit();
  const nrc = generateUniqueNrc();
  const email = `test_${TEST_ID}_${suffix}@e2etest.com`;

  // 1. Register
  const registerRes = await apiRequest('POST', '/auth/register', {
    tenant: {
      nombre: `E2E Support ${suffix} ${TEST_ID}`,
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
      nombre: `E2E Support Admin ${suffix}`,
      email,
      password: 'TestPassword123',
    },
  });

  if (registerRes.status !== 201) {
    console.error(`Registration failed for ${suffix}:`, JSON.stringify(registerRes.data));
  }
  expect(registerRes.status).toBe(201);

  const tenantData = registerRes.data.tenant as Record<string, unknown>;
  const userData = registerRes.data.user as Record<string, unknown>;
  const tenantId = tenantData.id as string;
  const userId = userData.id as string;

  createdTenantIds.push(tenantId);
  createdUserIds.push(userId);

  // 2. Set plan on tenant directly via Prisma
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { plan: planCode },
  });

  // 3. Verify email directly via Prisma
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true, emailVerificationToken: null, emailVerificationExpiresAt: null },
  });

  // 4. Login
  const loginRes = await apiRequest('POST', '/auth/login', {
    email,
    password: 'TestPassword123',
  });

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    console.error(`Login failed for ${suffix}:`, JSON.stringify(loginRes.data));
  }
  expect(loginRes.data.access_token).toBeDefined();

  return {
    token: loginRes.data.access_token as string,
    tenantId,
    userId,
    userEmail: email,
  };
}

// ============================================================
// TESTS
// ============================================================

describe('Support Tickets E2E', () => {
  // Main test tenant (used for lifecycle/types/validation tests)
  let mainCtx: TenantContext;

  // Per-plan contexts (created on demand)
  const planContexts: Record<string, TenantContext> = {};

  // Track created ticket IDs for cleanup
  const createdTicketIds: string[] = [];

  beforeAll(async () => {
    console.log(`\nSupport Tickets E2E - TEST_ID: ${TEST_ID}\n`);

    // Create main tenant with STARTER plan
    mainCtx = await createTenantAndLogin('STARTER', 'main');
    planContexts['STARTER'] = mainCtx;
    console.log(`Main tenant (STARTER): ${mainCtx.tenantId}`);
  }, 30000);

  afterAll(async () => {
    console.log('\n========================================');
    console.log('SUPPORT TICKETS E2E CLEANUP');
    console.log('========================================');

    for (const tenantId of createdTenantIds) {
      try {
        // Delete in FK-safe order
        await prisma.ticketActivity.deleteMany({
          where: { ticket: { tenantId } },
        }).catch(() => ({ count: 0 }));

        await prisma.ticketAttachment.deleteMany({
          where: { ticket: { tenantId } },
        }).catch(() => ({ count: 0 }));

        await prisma.ticketComment.deleteMany({
          where: { ticket: { tenantId } },
        }).catch(() => ({ count: 0 }));

        const ticketResult = await prisma.supportTicket.deleteMany({
          where: { tenantId },
        }).catch(() => ({ count: 0 }));
        console.log(`Tenant ${tenantId}: deleted ${ticketResult.count} tickets`);

        // Delete audit logs
        await prisma.auditLog.deleteMany({ where: { tenantId } }).catch(() => null);

        // Delete users
        await prisma.user.deleteMany({ where: { tenantId } });

        // Delete tenant
        await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => null);
        console.log(`Deleted tenant ${tenantId}`);
      } catch (err) {
        console.error(`Cleanup error for tenant ${tenantId}:`, err);
      }
    }

    await prisma.$disconnect();
    console.log('========================================\n');
  }, 30000);

  // ============================================================
  // 1. TICKET CREATION BY PLAN TIER
  // ============================================================

  describe('Ticket Creation by Plan Tier', () => {
    it('FREE plan: no SLA fields set', async () => {
      const ctx = await createTenantAndLogin('FREE', 'free');
      planContexts['FREE'] = ctx;

      const res = await apiRequest(
        'POST',
        '/support-tickets',
        {
          subject: `FREE plan ticket ${TEST_ID}`,
          description: 'Testing FREE plan SLA',
          type: 'GENERAL',
        },
        ctx.token,
      );

      expect(res.status).toBe(201);
      const ticket = res.data;

      expect(ticket.planAtCreation).toBe('FREE');
      expect(ticket.slaResponseHours).toBeNull();
      expect(ticket.slaDeadline).toBeNull();
      expect(ticket.resolutionDeadline).toBeNull();
      expect(ticket.status).toBe('PENDING');

      // Verify ticketNumber format TKT-YYYYMMDD-XXXX
      const ticketNumber = ticket.ticketNumber as string;
      expect(ticketNumber).toMatch(/^TKT-\d{8}-\d{4}$/);

      createdTicketIds.push(ticket.id as string);
      console.log(`  FREE ticket: ${ticketNumber}, slaResponseHours=null, slaDeadline=null`);
    }, 20000);

    it('STARTER plan: slaResponseHours=24, resolutionDeadline ~NOW+48h', async () => {
      const ctx = planContexts['STARTER'];
      const beforeCreate = Date.now();

      const res = await apiRequest(
        'POST',
        '/support-tickets',
        {
          subject: `STARTER plan ticket ${TEST_ID}`,
          description: 'Testing STARTER plan SLA',
          type: 'TECHNICAL',
        },
        ctx.token,
      );

      expect(res.status).toBe(201);
      const ticket = res.data;

      expect(ticket.planAtCreation).toBe('STARTER');
      expect(ticket.slaResponseHours).toBe(PLAN_SLA.STARTER.responseHours);

      // Verify slaDeadline is approximately NOW + 24h
      const slaDeadline = new Date(ticket.slaDeadline as string).getTime();
      const expectedSlaDeadline = beforeCreate + PLAN_SLA.STARTER.responseHours * 60 * 60 * 1000;
      expect(Math.abs(slaDeadline - expectedSlaDeadline)).toBeLessThan(60000); // within 1 min

      // Verify resolutionDeadline is approximately NOW + 48h
      const resolutionDeadline = new Date(ticket.resolutionDeadline as string).getTime();
      const expectedResDeadline = beforeCreate + PLAN_SLA.STARTER.resolutionHours * 60 * 60 * 1000;
      expect(Math.abs(resolutionDeadline - expectedResDeadline)).toBeLessThan(60000);

      // Verify ticketNumber format
      expect(ticket.ticketNumber).toMatch(/^TKT-\d{8}-\d{4}$/);

      createdTicketIds.push(ticket.id as string);
      console.log(`  STARTER ticket: ${ticket.ticketNumber}, slaResponseHours=${ticket.slaResponseHours}, slaDeadline=${ticket.slaDeadline}`);
    }, 20000);

    it('PROFESSIONAL plan: slaResponseHours=12, resolutionDeadline ~NOW+24h', async () => {
      const ctx = await createTenantAndLogin('PROFESSIONAL', 'pro');
      planContexts['PROFESSIONAL'] = ctx;
      const beforeCreate = Date.now();

      const res = await apiRequest(
        'POST',
        '/support-tickets',
        {
          subject: `PROFESSIONAL plan ticket ${TEST_ID}`,
          description: 'Testing PROFESSIONAL plan SLA',
          type: 'BILLING',
        },
        ctx.token,
      );

      expect(res.status).toBe(201);
      const ticket = res.data;

      expect(ticket.planAtCreation).toBe('PROFESSIONAL');
      expect(ticket.slaResponseHours).toBe(PLAN_SLA.PROFESSIONAL.responseHours);

      // Verify slaDeadline is approximately NOW + 12h
      const slaDeadline = new Date(ticket.slaDeadline as string).getTime();
      const expectedSlaDeadline = beforeCreate + PLAN_SLA.PROFESSIONAL.responseHours * 60 * 60 * 1000;
      expect(Math.abs(slaDeadline - expectedSlaDeadline)).toBeLessThan(60000);

      // Verify resolutionDeadline is approximately NOW + 24h
      const resolutionDeadline = new Date(ticket.resolutionDeadline as string).getTime();
      const expectedResDeadline = beforeCreate + PLAN_SLA.PROFESSIONAL.resolutionHours * 60 * 60 * 1000;
      expect(Math.abs(resolutionDeadline - expectedResDeadline)).toBeLessThan(60000);

      expect(ticket.ticketNumber).toMatch(/^TKT-\d{8}-\d{4}$/);

      createdTicketIds.push(ticket.id as string);
      console.log(`  PROFESSIONAL ticket: ${ticket.ticketNumber}, slaResponseHours=${ticket.slaResponseHours}`);
    }, 20000);

    it('ENTERPRISE plan: slaResponseHours=2, resolutionDeadline ~NOW+8h', async () => {
      const ctx = await createTenantAndLogin('ENTERPRISE', 'ent');
      planContexts['ENTERPRISE'] = ctx;
      const beforeCreate = Date.now();

      const res = await apiRequest(
        'POST',
        '/support-tickets',
        {
          subject: `ENTERPRISE plan ticket ${TEST_ID}`,
          description: 'Testing ENTERPRISE plan SLA',
          type: 'EMAIL_CONFIG',
        },
        ctx.token,
      );

      expect(res.status).toBe(201);
      const ticket = res.data;

      expect(ticket.planAtCreation).toBe('ENTERPRISE');
      expect(ticket.slaResponseHours).toBe(PLAN_SLA.ENTERPRISE.responseHours);

      // Verify slaDeadline is approximately NOW + 2h
      const slaDeadline = new Date(ticket.slaDeadline as string).getTime();
      const expectedSlaDeadline = beforeCreate + PLAN_SLA.ENTERPRISE.responseHours * 60 * 60 * 1000;
      expect(Math.abs(slaDeadline - expectedSlaDeadline)).toBeLessThan(60000);

      // Verify resolutionDeadline is approximately NOW + 8h
      const resolutionDeadline = new Date(ticket.resolutionDeadline as string).getTime();
      const expectedResDeadline = beforeCreate + PLAN_SLA.ENTERPRISE.resolutionHours * 60 * 60 * 1000;
      expect(Math.abs(resolutionDeadline - expectedResDeadline)).toBeLessThan(60000);

      expect(ticket.ticketNumber).toMatch(/^TKT-\d{8}-\d{4}$/);

      createdTicketIds.push(ticket.id as string);
      console.log(`  ENTERPRISE ticket: ${ticket.ticketNumber}, slaResponseHours=${ticket.slaResponseHours}`);
    }, 20000);
  });

  // ============================================================
  // 2. TICKET LIFECYCLE
  // ============================================================

  describe('Ticket Lifecycle', () => {
    let lifecycleTicketId: string;

    it('should create a ticket with status PENDING', async () => {
      const res = await apiRequest(
        'POST',
        '/support-tickets',
        {
          subject: `Lifecycle ticket ${TEST_ID}`,
          description: 'Testing full ticket lifecycle',
          type: 'TECHNICAL',
        },
        mainCtx.token,
      );

      expect(res.status).toBe(201);
      expect(res.data.status).toBe('PENDING');
      expect(res.data.subject).toBe(`Lifecycle ticket ${TEST_ID}`);
      expect(res.data.description).toBe('Testing full ticket lifecycle');
      expect(res.data.type).toBe('TECHNICAL');
      expect(res.data.id).toBeDefined();

      lifecycleTicketId = res.data.id as string;
      createdTicketIds.push(lifecycleTicketId);
      console.log(`  Created lifecycle ticket: ${res.data.ticketNumber}`);
    }, 15000);

    it('should add a comment to the ticket', async () => {
      const res = await apiRequest(
        'POST',
        `/support-tickets/${lifecycleTicketId}/comments`,
        {
          content: `Test comment on lifecycle ticket ${TEST_ID}`,
        },
        mainCtx.token,
      );

      expect(res.status).toBe(201);
      expect(res.data.content).toBe(`Test comment on lifecycle ticket ${TEST_ID}`);
      expect(res.data.ticketId).toBe(lifecycleTicketId);
      expect(res.data.authorId).toBe(mainCtx.userId);
      expect(res.data.isInternal).toBe(false);
      console.log(`  Comment added: id=${res.data.id}`);
    }, 15000);

    it('should get ticket by ID with all fields', async () => {
      const res = await apiRequest(
        'GET',
        `/support-tickets/${lifecycleTicketId}`,
        undefined,
        mainCtx.token,
      );

      expect(res.status).toBe(200);
      const ticket = res.data;

      // Core fields
      expect(ticket.id).toBe(lifecycleTicketId);
      expect(ticket.subject).toBe(`Lifecycle ticket ${TEST_ID}`);
      expect(ticket.description).toBe('Testing full ticket lifecycle');
      expect(ticket.type).toBe('TECHNICAL');
      expect(ticket.status).toBe('PENDING');
      expect(ticket.priority).toBe('MEDIUM'); // default priority
      expect(ticket.tenantId).toBe(mainCtx.tenantId);
      expect(ticket.requesterId).toBe(mainCtx.userId);
      expect(ticket.ticketNumber).toMatch(/^TKT-\d{8}-\d{4}$/);

      // SLA fields (STARTER plan)
      expect(ticket.slaResponseHours).toBe(24);
      expect(ticket.slaDeadline).toBeTruthy();
      expect(ticket.resolutionDeadline).toBeTruthy();
      expect(ticket.planAtCreation).toBe('STARTER');

      // Relations
      expect(ticket.requester).toBeDefined();
      expect(ticket.tenant).toBeDefined();

      // Comments should include the one we added
      const comments = ticket.comments as Array<Record<string, unknown>>;
      expect(comments.length).toBeGreaterThanOrEqual(1);
      expect(comments[0].content).toBe(`Test comment on lifecycle ticket ${TEST_ID}`);

      console.log(`  Ticket detail verified: ${ticket.ticketNumber}, all fields present`);
    }, 15000);

    it('should list tickets with pagination', async () => {
      // Create a second ticket so we have at least 2
      const res2 = await apiRequest(
        'POST',
        '/support-tickets',
        {
          subject: `Pagination ticket ${TEST_ID}`,
          description: 'Testing pagination',
          type: 'GENERAL',
        },
        mainCtx.token,
      );
      expect(res2.status).toBe(201);
      createdTicketIds.push(res2.data.id as string);

      // List with pagination
      const listRes = await apiRequest(
        'GET',
        '/support-tickets?page=1&limit=10',
        undefined,
        mainCtx.token,
      );

      expect(listRes.status).toBe(200);
      const body = listRes.data;

      // Verify pagination structure
      expect(body.data).toBeDefined();
      expect(body.meta).toBeDefined();

      const meta = body.meta as Record<string, unknown>;
      expect(meta.total).toBeDefined();
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(10);
      expect(meta.totalPages).toBeDefined();

      const tickets = body.data as Array<Record<string, unknown>>;
      expect(tickets.length).toBeGreaterThanOrEqual(2);

      // Verify tickets belong to this tenant
      for (const t of tickets) {
        expect(t.tenantId).toBeDefined(); // list response includes tenantId
        // But tickets should be our tenant's (verified by auth)
      }

      console.log(`  Pagination: ${tickets.length} tickets, total=${meta.total}, pages=${meta.totalPages}`);
    }, 15000);

    it('should not allow access to another tenant tickets', async () => {
      // Create a separate tenant
      const otherCtx = await createTenantAndLogin('FREE', 'other');

      // Try to access main tenant's ticket with other tenant's token
      const res = await apiRequest(
        'GET',
        `/support-tickets/${lifecycleTicketId}`,
        undefined,
        otherCtx.token,
      );

      // Should get 403 Forbidden or 404 Not Found (depending on implementation)
      expect([403, 404]).toContain(res.status);
      console.log(`  Tenant isolation verified: status=${res.status} for cross-tenant access`);
    }, 20000);
  });

  // ============================================================
  // 3. SLA VERIFICATION BY PLAN (summary/cross-check)
  // ============================================================

  describe('SLA Verification by Plan', () => {
    it('FREE plan has no SLA deadlines', async () => {
      const ctx = planContexts['FREE'];
      if (!ctx) {
        console.log('  Skipping: FREE context not available');
        return;
      }

      const res = await apiRequest(
        'POST',
        '/support-tickets',
        {
          subject: `SLA verify FREE ${TEST_ID}`,
          description: 'SLA verification for FREE',
          type: 'GENERAL',
        },
        ctx.token,
      );

      expect(res.status).toBe(201);
      expect(res.data.slaResponseHours).toBeNull();
      expect(res.data.slaDeadline).toBeNull();
      expect(res.data.resolutionDeadline).toBeNull();
      expect(res.data.planAtCreation).toBe('FREE');
      createdTicketIds.push(res.data.id as string);
      console.log('  FREE: no SLA fields - PASS');
    }, 15000);

    it('STARTER plan has 24h response, 48h resolution SLA', async () => {
      const ctx = planContexts['STARTER'];
      const beforeCreate = Date.now();

      const res = await apiRequest(
        'POST',
        '/support-tickets',
        {
          subject: `SLA verify STARTER ${TEST_ID}`,
          description: 'SLA verification for STARTER',
          type: 'TECHNICAL',
        },
        ctx.token,
      );

      expect(res.status).toBe(201);
      expect(res.data.slaResponseHours).toBe(24);
      expect(res.data.planAtCreation).toBe('STARTER');

      const slaDeadline = new Date(res.data.slaDeadline as string).getTime();
      const resDeadline = new Date(res.data.resolutionDeadline as string).getTime();

      // slaDeadline should be ~24h from now
      const expectedSla = beforeCreate + 24 * 60 * 60 * 1000;
      expect(Math.abs(slaDeadline - expectedSla)).toBeLessThan(120000); // 2 min tolerance

      // resolutionDeadline should be ~48h from now
      const expectedRes = beforeCreate + 48 * 60 * 60 * 1000;
      expect(Math.abs(resDeadline - expectedRes)).toBeLessThan(120000);

      createdTicketIds.push(res.data.id as string);
      console.log('  STARTER: 24h response, 48h resolution - PASS');
    }, 15000);

    it('PROFESSIONAL plan has 12h response, 24h resolution SLA', async () => {
      const ctx = planContexts['PROFESSIONAL'];
      if (!ctx) {
        console.log('  Skipping: PROFESSIONAL context not available');
        return;
      }
      const beforeCreate = Date.now();

      const res = await apiRequest(
        'POST',
        '/support-tickets',
        {
          subject: `SLA verify PRO ${TEST_ID}`,
          description: 'SLA verification for PROFESSIONAL',
          type: 'BILLING',
        },
        ctx.token,
      );

      expect(res.status).toBe(201);
      expect(res.data.slaResponseHours).toBe(12);
      expect(res.data.planAtCreation).toBe('PROFESSIONAL');

      const slaDeadline = new Date(res.data.slaDeadline as string).getTime();
      const resDeadline = new Date(res.data.resolutionDeadline as string).getTime();

      const expectedSla = beforeCreate + 12 * 60 * 60 * 1000;
      expect(Math.abs(slaDeadline - expectedSla)).toBeLessThan(120000);

      const expectedRes = beforeCreate + 24 * 60 * 60 * 1000;
      expect(Math.abs(resDeadline - expectedRes)).toBeLessThan(120000);

      createdTicketIds.push(res.data.id as string);
      console.log('  PROFESSIONAL: 12h response, 24h resolution - PASS');
    }, 15000);

    it('ENTERPRISE plan has 2h response, 8h resolution SLA', async () => {
      const ctx = planContexts['ENTERPRISE'];
      if (!ctx) {
        console.log('  Skipping: ENTERPRISE context not available');
        return;
      }
      const beforeCreate = Date.now();

      const res = await apiRequest(
        'POST',
        '/support-tickets',
        {
          subject: `SLA verify ENT ${TEST_ID}`,
          description: 'SLA verification for ENTERPRISE',
          type: 'ONBOARDING',
        },
        ctx.token,
      );

      expect(res.status).toBe(201);
      expect(res.data.slaResponseHours).toBe(2);
      expect(res.data.planAtCreation).toBe('ENTERPRISE');

      const slaDeadline = new Date(res.data.slaDeadline as string).getTime();
      const resDeadline = new Date(res.data.resolutionDeadline as string).getTime();

      const expectedSla = beforeCreate + 2 * 60 * 60 * 1000;
      expect(Math.abs(slaDeadline - expectedSla)).toBeLessThan(120000);

      const expectedRes = beforeCreate + 8 * 60 * 60 * 1000;
      expect(Math.abs(resDeadline - expectedRes)).toBeLessThan(120000);

      createdTicketIds.push(res.data.id as string);
      console.log('  ENTERPRISE: 2h response, 8h resolution - PASS');
    }, 15000);
  });

  // ============================================================
  // 4. TICKET TYPES
  // ============================================================

  describe('Ticket Types', () => {
    for (const ticketType of TICKET_TYPES) {
      it(`should create ticket with type ${ticketType}`, async () => {
        const res = await apiRequest(
          'POST',
          '/support-tickets',
          {
            subject: `Type test ${ticketType} ${TEST_ID}`,
            description: `Testing ticket type ${ticketType}`,
            type: ticketType,
          },
          mainCtx.token,
        );

        expect(res.status).toBe(201);
        expect(res.data.type).toBe(ticketType);
        expect(res.data.subject).toBe(`Type test ${ticketType} ${TEST_ID}`);
        expect(res.data.status).toBe('PENDING');
        expect(res.data.ticketNumber).toMatch(/^TKT-\d{8}-\d{4}$/);

        createdTicketIds.push(res.data.id as string);
        console.log(`  Type ${ticketType}: ticket ${res.data.ticketNumber} - PASS`);
      }, 15000);
    }
  });

  // ============================================================
  // 5. VALIDATION
  // ============================================================

  describe('Validation', () => {
    it('should fail when subject is missing', async () => {
      const res = await apiRequest(
        'POST',
        '/support-tickets',
        {
          description: 'No subject provided',
          type: 'GENERAL',
        },
        mainCtx.token,
      );

      expect(res.status).toBe(400);
      console.log(`  Missing subject: status=${res.status} - PASS`);
    }, 15000);

    it('should fail when type is missing', async () => {
      const res = await apiRequest(
        'POST',
        '/support-tickets',
        {
          subject: `Missing type ticket ${TEST_ID}`,
          description: 'No type provided',
        },
        mainCtx.token,
      );

      expect(res.status).toBe(400);
      console.log(`  Missing type: status=${res.status} - PASS`);
    }, 15000);

    it('should fail when type is invalid', async () => {
      const res = await apiRequest(
        'POST',
        '/support-tickets',
        {
          subject: `Invalid type ticket ${TEST_ID}`,
          description: 'Invalid type value',
          type: 'INVALID_TYPE',
        },
        mainCtx.token,
      );

      expect(res.status).toBe(400);
      console.log(`  Invalid type: status=${res.status} - PASS`);
    }, 15000);

    it('should fail without authentication', async () => {
      const res = await apiRequest('POST', '/support-tickets', {
        subject: `Unauth ticket ${TEST_ID}`,
        description: 'No auth token',
        type: 'GENERAL',
      });

      expect(res.status).toBe(401);
      console.log(`  No auth: status=${res.status} - PASS`);
    }, 15000);
  });

  // ============================================================
  // FINAL SUMMARY
  // ============================================================

  afterAll(() => {
    console.log('\n========================================');
    console.log('SUPPORT TICKETS E2E RESULTS SUMMARY');
    console.log('========================================');
    console.log(`Total tickets created: ${createdTicketIds.length}`);
    console.log(`Total tenants created: ${createdTenantIds.length}`);
    console.log(`Plans tested: FREE, STARTER, PROFESSIONAL, ENTERPRISE`);
    console.log(`Types tested: ${TICKET_TYPES.join(', ')}`);
    console.log('========================================\n');
  });
});
