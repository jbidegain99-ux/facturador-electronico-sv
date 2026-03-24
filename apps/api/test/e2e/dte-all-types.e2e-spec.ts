/**
 * E2E Integration Tests: All 9 DTE Types
 *
 * Tests the complete lifecycle: Create → Auto-Sign → Auto-Transmit → Verify
 * Uses a temporary test tenant in TRIAL mode (demo Hacienda simulation).
 *
 * Usage:
 *   npm run test:e2e                         # against local API (default)
 *   API_BASE_URL=https://api.facturosv.com npm run test:e2e  # against production
 *
 * Prerequisites:
 *   - API running locally (npm run dev) OR accessible at API_BASE_URL
 *   - Database accessible (for test setup/teardown)
 */

import { PrismaClient } from '@prisma/client';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API = `${BASE_URL}/api/v1`;

// Unique suffix to avoid collisions with existing data
const TEST_ID = `e2e_${Date.now()}`;

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

const TEST_NIT = generateUniqueNit();
const TEST_NRC = generateUniqueNrc();

interface TestContext {
  token: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  createdDteIds: string[];
}

const ctx: TestContext = {
  token: '',
  tenantId: '',
  userId: '',
  userEmail: `test_${TEST_ID}@e2etest.com`,
  createdDteIds: [],
};

const prisma = new PrismaClient();

// Helper: make authenticated API request
async function apiRequest(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: Record<string, unknown>,
): Promise<{ status: number; data: Record<string, unknown> }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (ctx.token) {
    headers['Authorization'] = `Bearer ${ctx.token}`;
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: Record<string, unknown> = {};
  try {
    data = await res.json() as Record<string, unknown>;
  } catch {
    // Response may not be JSON
  }

  return { status: res.status, data };
}

// Helper: wait for auto-sign+transmit to complete
async function waitForProcessed(dteId: string, maxWaitMs = 15000): Promise<Record<string, unknown>> {
  const start = Date.now();
  const interval = 1000;

  while (Date.now() - start < maxWaitMs) {
    const { data } = await apiRequest('GET', `/dte/${dteId}`);
    if (data.estado === 'PROCESADO' || data.estado === 'RECHAZADO') {
      return data;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  // Final attempt
  const { data } = await apiRequest('GET', `/dte/${dteId}`);
  return data;
}

// ============================================================
// SETUP & TEARDOWN
// ============================================================

describe('DTE E2E: All 9 Types', () => {
  beforeAll(async () => {
    console.log(`\nTest NIT: ${TEST_NIT}, NRC: ${TEST_NRC}`);
    console.log(`Test user: ${ctx.userEmail}\n`);

    // 1. Register test tenant + admin user via API
    const registerRes = await apiRequest('POST', '/auth/register', {
      tenant: {
        nombre: `E2E Test ${TEST_ID}`,
        nit: TEST_NIT,
        nrc: TEST_NRC,
        actividadEcon: '62010',
        descActividad: 'Actividades de programacion informatica',
        telefono: '2222-3333',
        correo: `tenant_${TEST_ID}@e2etest.com`,
        direccion: {
          departamento: '06',
          municipio: '14',
          complemento: 'Calle Test #123',
        },
      },
      user: {
        nombre: 'E2E Test Admin',
        email: ctx.userEmail,
        password: 'TestPassword123',
      },
    });

    if (registerRes.status !== 201) {
      console.error('Registration failed:', JSON.stringify(registerRes.data));
    }
    expect(registerRes.status).toBe(201);

    const tenantData = registerRes.data.tenant as Record<string, unknown>;
    const userData = registerRes.data.user as Record<string, unknown>;
    ctx.tenantId = tenantData.id as string;
    ctx.userId = userData.id as string;

    expect(ctx.tenantId).toBeTruthy();
    console.log(`Tenant created: ${ctx.tenantId}`);

    // 2. Verify email directly via Prisma (bypass email verification)
    await prisma.user.update({
      where: { id: ctx.userId },
      data: { emailVerified: true, emailVerificationToken: null, emailVerificationExpiresAt: null },
    });
    console.log('Email verified via Prisma');

    // 3. Login to get JWT token
    const loginRes = await apiRequest('POST', '/auth/login', {
      email: ctx.userEmail,
      password: 'TestPassword123',
    });

    if (loginRes.status !== 200 && loginRes.status !== 201) {
      console.error('Login failed:', JSON.stringify(loginRes.data));
    }
    expect(loginRes.data.access_token).toBeDefined();

    ctx.token = loginRes.data.access_token as string;
    console.log('Login successful, token acquired\n');
  });

  afterAll(async () => {
    // Cleanup: delete test data from DB
    console.log('\n========================================');
    console.log('E2E CLEANUP');
    console.log('========================================');

    if (ctx.tenantId) {
      // Delete in FK-safe order: logs first, then DTEs, then clients, then user, then tenant
      const logResult = await prisma.dTELog.deleteMany({
        where: { dte: { tenantId: ctx.tenantId } },
      }).catch(() => ({ count: 0 }));
      console.log(`Deleted ${logResult.count} DTE logs`);

      // Delete accounting entries linked to DTEs
      await prisma.journalEntry.deleteMany({
        where: { tenantId: ctx.tenantId },
      }).catch(() => ({ count: 0 }));

      const dteResult = await prisma.dTE.deleteMany({ where: { tenantId: ctx.tenantId } });
      console.log(`Deleted ${dteResult.count} DTEs`);

      const clientResult = await prisma.cliente.deleteMany({ where: { tenantId: ctx.tenantId } });
      console.log(`Deleted ${clientResult.count} clients`);

      // Delete audit logs
      await prisma.auditLog.deleteMany({ where: { tenantId: ctx.tenantId } }).catch(() => null);

      await prisma.user.deleteMany({ where: { tenantId: ctx.tenantId } });
      console.log('Deleted test user');

      await prisma.tenant.delete({ where: { id: ctx.tenantId } }).catch(() => null);
      console.log('Deleted test tenant');
    }

    await prisma.$disconnect();
    console.log('========================================\n');
  });

  // ============================================================
  // Helper: Create DTE and verify full lifecycle
  // ============================================================

  async function createAndVerifyDte(
    tipoDte: string,
    data: Record<string, unknown>,
    assertions: {
      expectedIva?: number;
      expectedTotal?: number;
    } = {},
  ): Promise<Record<string, unknown>> {
    // Step 1: Create
    const createRes = await apiRequest('POST', '/dte', { tipoDte, data });

    if (createRes.status !== 201) {
      console.error(`CREATE ${tipoDte} failed:`, JSON.stringify(createRes.data));
    }
    expect(createRes.status).toBe(201);
    expect(createRes.data.id).toBeDefined();
    expect(createRes.data.tipoDte).toBe(tipoDte);
    expect(createRes.data.codigoGeneracion).toBeDefined();
    expect(createRes.data.numeroControl).toBeDefined();

    const dteId = createRes.data.id as string;
    ctx.createdDteIds.push(dteId);

    console.log(`  [${tipoDte}] Created: id=${dteId}, control=${createRes.data.numeroControl}`);

    // Step 2: Wait for auto-sign+transmit (demo mode ~instant)
    const dte = await waitForProcessed(dteId);

    // Step 3: Verify
    expect(dte.estado).toBe('PROCESADO');
    expect(dte.numeroControl).toBeTruthy();

    if (assertions.expectedIva !== undefined) {
      expect(Number(dte.totalIva)).toBeCloseTo(assertions.expectedIva, 2);
    }

    if (assertions.expectedTotal !== undefined) {
      expect(Number(dte.totalPagar)).toBeCloseTo(assertions.expectedTotal, 2);
    }

    console.log(`  [${tipoDte}] PASS: estado=${dte.estado}, IVA=${dte.totalIva}, total=${dte.totalPagar}`);

    return dte;
  }

  // ============================================================
  // TEST 1: Tipo 01 - Factura Electrónica
  // ============================================================

  it('Tipo 01 - Factura', async () => {
    await createAndVerifyDte('01', {
      receptor: {
        tipoDocumento: '13',
        numDocumento: '00000000-0',
        nombre: `Test Factura ${TEST_ID}`,
        direccion: { departamento: '06', municipio: '14', complemento: 'Dir test' },
        telefono: '7777-8888',
        correo: 'factura@test.com',
      },
      cuerpoDocumento: [{
        numItem: 1,
        tipoItem: 1,
        cantidad: 1,
        descripcion: 'Servicio de prueba E2E',
        precioUni: 1000,
        ventaGravada: 1000,
        ventaExenta: 0,
        ventaNoSuj: 0,
        montoDescu: 0,
        ivaItem: 130,
        tributos: ['20'],
        uniMedida: 59,
        codigo: null,
        codTributo: null,
        psv: 0,
        noGravado: 0,
      }],
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada: 1000,
        subTotalVentas: 1000,
        descuNoSuj: 0,
        descuExenta: 0,
        descuGravada: 0,
        porcentajeDescuento: 0,
        totalDescu: 0,
        tributos: [{ codigo: '20', descripcion: 'Impuesto al Valor Agregado 13%', valor: 130 }],
        subTotal: 1000,
        ivaRete1: 0,
        reteRenta: 0,
        montoTotalOperacion: 1130,
        totalNoGravado: 0,
        totalPagar: 1130,
        totalLetras: 'MIL CIENTO TREINTA 00/100 USD',
        totalIva: 130,
        saldoFavor: 0,
        condicionOperacion: 1,
        pagos: [{ codigo: '01', montoPago: 1130, referencia: null, plazo: null, periodo: null }],
        numPagoElectronico: null,
      },
    }, {
      expectedIva: 130,
      expectedTotal: 1130,
    });
  });

  // ============================================================
  // TEST 2: Tipo 03 - Crédito Fiscal
  // ============================================================

  it('Tipo 03 - Credito Fiscal', async () => {
    await createAndVerifyDte('03', {
      receptor: {
        nit: '06140806211034',
        nrc: '123456-7',
        nombre: `Test CCF ${TEST_ID}`,
        codActividad: '62010',
        descActividad: 'Servicios',
        nombreComercial: null,
        direccion: { departamento: '06', municipio: '14', complemento: 'Dir CCF' },
        telefono: '7777-8888',
        correo: 'ccf@test.com',
      },
      cuerpoDocumento: [{
        numItem: 1,
        tipoItem: 1,
        cantidad: 1,
        descripcion: 'Servicio CCF E2E',
        precioUni: 1000,
        ventaGravada: 1000,
        ventaExenta: 0,
        ventaNoSuj: 0,
        montoDescu: 0,
        tributos: ['20'],
        uniMedida: 59,
        codigo: null,
        psv: 0,
        noGravado: 0,
      }],
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada: 1000,
        subTotalVentas: 1000,
        condicionOperacion: 1,
      },
    }, {
      expectedIva: 130,
      expectedTotal: 1130,
    });
  });

  // ============================================================
  // TEST 3: Tipo 04 - Nota de Remisión
  // ============================================================

  it('Tipo 04 - Nota de Remision', async () => {
    await createAndVerifyDte('04', {
      receptor: {
        nit: '06140806211034',
        nrc: '123456-7',
        nombre: `Test NR ${TEST_ID}`,
        codActividad: '62010',
        descActividad: 'Servicios',
        bienTitulo: '01',
        direccion: { departamento: '06', municipio: '14', complemento: 'Dir NR' },
        correo: 'nr@test.com',
      },
      cuerpoDocumento: [{
        numItem: 1,
        tipoItem: 1,
        cantidad: 1,
        descripcion: 'Item remitido E2E',
        precioUni: 800,
        ventaGravada: 800,
        ventaExenta: 0,
        ventaNoSuj: 0,
        montoDescu: 0,
        tributos: ['20'],
        uniMedida: 59,
        codigo: null,
        numeroDocumento: '',
      }],
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada: 800,
        subTotalVentas: 800,
        condicionOperacion: 1,
      },
    }, {
      expectedIva: 104,
      expectedTotal: 904,
    });
  });

  // ============================================================
  // TEST 4: Tipo 05 - Nota de Crédito
  // ============================================================

  it('Tipo 05 - Nota de Credito', async () => {
    // Create a factura (01) first to reference
    const refRes = await apiRequest('POST', '/dte', {
      tipoDte: '01',
      data: {
        receptor: {
          tipoDocumento: '36',
          numDocumento: '06140806211034',
          nrc: '123456-7',
          nombre: `Cliente NC Ref ${TEST_ID}`,
          direccion: { departamento: '06', municipio: '14', complemento: 'Dir' },
          correo: 'nc-ref@test.com',
        },
        cuerpoDocumento: [{
          numItem: 1, tipoItem: 1, cantidad: 1,
          descripcion: 'Item para NC', precioUni: 2000,
          ventaGravada: 2000, ventaExenta: 0, ventaNoSuj: 0,
          montoDescu: 0, ivaItem: 260, tributos: ['20'],
          uniMedida: 59, codigo: null, codTributo: null, psv: 0, noGravado: 0,
        }],
        resumen: {
          totalNoSuj: 0, totalExenta: 0, totalGravada: 2000,
          subTotalVentas: 2000, totalIva: 260, montoTotalOperacion: 2260,
          totalPagar: 2260, totalLetras: 'DOS MIL DOSCIENTOS SESENTA 00/100 USD',
          condicionOperacion: 1, ivaRete1: 0, reteRenta: 0, saldoFavor: 0,
          subTotal: 2000, totalDescu: 0, totalNoGravado: 0,
          tributos: [{ codigo: '20', descripcion: 'IVA 13%', valor: 260 }],
          pagos: [{ codigo: '01', montoPago: 2260, referencia: null, plazo: null, periodo: null }],
        },
      },
    });

    expect(refRes.status).toBe(201);
    const refDteId = refRes.data.id as string;
    ctx.createdDteIds.push(refDteId);

    const refDte = await waitForProcessed(refDteId);
    const refCodGen = refDte.codigoGeneracion as string;
    console.log(`  [05] Reference DTE 01: ${refDteId}, codGen=${refCodGen}`);

    const today = new Date().toISOString().split('T')[0];

    await createAndVerifyDte('05', {
      receptor: {
        nit: '06140806211034',
        nrc: '123456-7',
        nombre: `Cliente NC Ref ${TEST_ID}`,
        codActividad: '62010',
        descActividad: 'Servicios',
        direccion: { departamento: '06', municipio: '14', complemento: 'Dir' },
        correo: 'nc@test.com',
      },
      documentoRelacionado: [{
        tipoDte: '01',
        tipoGeneracion: 1,
        numeroDocumento: refCodGen,
        fechaEmision: today,
      }],
      cuerpoDocumento: [{
        numItem: 1, tipoItem: 1, cantidad: 1,
        descripcion: 'Devolucion parcial E2E',
        precioUni: 500, ventaGravada: 500, ventaExenta: 0, ventaNoSuj: 0,
        montoDescu: 0, tributos: ['20'], uniMedida: 59,
        codigo: null, numeroDocumento: refCodGen,
      }],
      resumen: {
        totalNoSuj: 0, totalExenta: 0, totalGravada: 500,
        subTotalVentas: 500, condicionOperacion: 1,
      },
    }, {
      expectedIva: 65,
      expectedTotal: 565,
    });
  });

  // ============================================================
  // TEST 5: Tipo 06 - Nota de Débito
  // ============================================================

  it('Tipo 06 - Nota de Debito', async () => {
    // Use first DTE as reference
    const firstDteId = ctx.createdDteIds[0];
    const refDte = await apiRequest('GET', `/dte/${firstDteId}`);
    const refCodGen = refDte.data.codigoGeneracion as string;
    const today = new Date().toISOString().split('T')[0];

    await createAndVerifyDte('06', {
      receptor: {
        nit: '06140806211034',
        nrc: '123456-7',
        nombre: `Cliente ND ${TEST_ID}`,
        codActividad: '62010',
        descActividad: 'Servicios',
        direccion: { departamento: '06', municipio: '14', complemento: 'Dir ND' },
        correo: 'nd@test.com',
      },
      documentoRelacionado: [{
        tipoDte: '01',
        tipoGeneracion: 1,
        numeroDocumento: refCodGen,
        fechaEmision: today,
      }],
      cuerpoDocumento: [{
        numItem: 1, tipoItem: 1, cantidad: 1,
        descripcion: 'Cargo adicional E2E',
        precioUni: 300, ventaGravada: 300, ventaExenta: 0, ventaNoSuj: 0,
        montoDescu: 0, tributos: ['20'], uniMedida: 59,
        codigo: null, numeroDocumento: refCodGen,
      }],
      resumen: {
        totalNoSuj: 0, totalExenta: 0, totalGravada: 300,
        subTotalVentas: 300, condicionOperacion: 1,
      },
    }, {
      expectedIva: 39,
      expectedTotal: 339,
    });
  });

  // ============================================================
  // TEST 6: Tipo 07 - Comprobante de Retención
  // ============================================================

  it('Tipo 07 - Comprobante de Retencion', async () => {
    const today = new Date().toISOString().split('T')[0];

    await createAndVerifyDte('07', {
      receptor: {
        nit: '06140806211034',
        nrc: '123456-7',
        nombre: `Test Retencion ${TEST_ID}`,
        codActividad: '62010',
        descActividad: 'Servicios',
        direccion: { departamento: '06', municipio: '14', complemento: 'Dir Ret' },
        correo: 'ret@test.com',
      },
      cuerpoDocumento: [{
        numItem: 1,
        tipoDte: '03',
        tipoDoc: 2,
        numDocumento: 'DTE-03-00000001-000000000000001',
        fechaEmision: today,
        montoSujetoGrav: 1500,
        codigoRetencionMH: 'C4',
        ivaRetenido: 15,
        descripcion: 'Retencion IVA E2E',
      }],
      resumen: {
        totalSujetoRetencion: 1500,
        totalIVAretenido: 15,
      },
    }, {
      expectedIva: 15,
      expectedTotal: 15,
    });
  });

  // ============================================================
  // TEST 7: Tipo 09 - Documento Contable de Liquidación
  // ============================================================

  it('Tipo 09 - Liquidacion', async () => {
    const today = new Date().toISOString().split('T')[0];
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // DCL: valorOperaciones=1200, IVA=156, subTotal=1356
    // percepcion=24, comision=0 → liquidoApagar=1332
    await createAndVerifyDte('09', {
      receptor: {
        tipoDocumento: '36',
        nit: '06140806211034',
        nrc: '123456-7',
        nombre: `Test Liquidacion ${TEST_ID}`,
        codActividad: '62010',
        descActividad: 'Servicios',
        direccion: { departamento: '06', municipio: '14', complemento: 'Dir Liq' },
        correo: 'liq@test.com',
      },
      cuerpoDocumento: [{
        tipoDte: '03',
        tipoGeneracion: 1,
        periodoLiquidacionFechaInicio: lastMonth,
        periodoLiquidacionFechaFin: today,
        codLiquidacion: 1,
        cantidadDoc: 1,
        valorOperaciones: 1200,
        montoSinPercepcion: 0,
        descripcion: 'Liquidacion E2E',
      }],
      extension: {
        nombEntrega: 'Test Entrega',
        docuEntrega: '00000000-0',
        nombRecibe: 'Test Recibe',
        docuRecibe: '00000000-0',
        observaciones: 'Liquidacion de prueba E2E',
      },
      resumen: {},
    });
    // DCL totals are complex (liquidoApagar), skip exact assertions
  });

  // ============================================================
  // TEST 8: Tipo 11 - Factura de Exportación
  // ============================================================

  it('Tipo 11 - Factura de Exportacion', async () => {
    await createAndVerifyDte('11', {
      emisor: {
        tipoItemExpor: 1,
        recintoFiscal: null,
        regimen: null,
      },
      receptor: {
        tipoDocumento: null,
        numDocumento: null,
        nombre: `Export Co USA ${TEST_ID}`,
        codPais: '9303',
        nombrePais: 'ESTADOS UNIDOS DE AMERICA',
        complemento: '123 Main St, New York',
        tipoPersona: null,
        descActividad: null,
        telefono: null,
        correo: 'export@test.com',
      },
      cuerpoDocumento: [{
        numItem: 1,
        cantidad: 1,
        descripcion: 'Export Service E2E',
        precioUnitario: 5000,
        uniMedida: 59,
        codigo: null,
        noGravado: 0,
      }],
      resumen: {
        condicionOperacion: 1,
        codIncoterms: null,
        descIncoterms: null,
        observaciones: 'Exportacion de prueba E2E',
      },
    }, {
      expectedIva: 0,
      expectedTotal: 5000,
    });
  });

  // ============================================================
  // TEST 9: Tipo 14 - Factura de Sujeto Excluido
  // ============================================================

  it('Tipo 14 - Sujeto Excluido', async () => {
    await createAndVerifyDte('14', {
      sujetoExcluido: {
        tipoDocumento: '13',
        numDocumento: '00000000-0',
        nombre: `Cooperativa Test ${TEST_ID}`,
        codActividad: null,
        descActividad: null,
        direccion: { departamento: '06', municipio: '14', complemento: 'Dir SE' },
        telefono: '7777-8888',
        correo: 'se@test.com',
      },
      cuerpoDocumento: [{
        numItem: 1,
        tipoItem: 1,
        cantidad: 1,
        descripcion: 'Compra sujeto excluido E2E',
        precioUnitario: 2000,
        uniMedida: 59,
        codigo: null,
      }],
      resumen: {
        condicionOperacion: 1,
      },
    }, {
      expectedIva: 0,
      expectedTotal: 2000,
    });
  });

  // ============================================================
  // FINAL SUMMARY
  // ============================================================

  afterAll(() => {
    console.log('\n========================================');
    console.log('E2E TEST RESULTS SUMMARY');
    console.log('========================================');
    console.log(`Total DTEs created: ${ctx.createdDteIds.length}`);
    console.log(`Tenant: ${ctx.tenantId} (TRIAL/demo mode)`);
    console.log('========================================\n');
  });
});
