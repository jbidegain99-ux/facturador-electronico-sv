/**
 * Seed script for Demo Tenant - Facturador Electrónico SV
 *
 * Creates a complete demo tenant with:
 * - 1 Tenant + 1 Admin User
 * - 15 Clients (mix of natural/juridical persons)
 * - 20 Catalog Items (products & services)
 * - 30+ DTEs (invoices, CCFs, credit notes) across Jan-Mar 2026
 * - 8 Quotes (various statuses)
 * - 5 Recurring Invoice Templates
 * - Accounting accounts + journal entries
 *
 * Usage: npx ts-node prisma/seed-demo.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

function cuid(): string {
  // Simple cuid-like ID generator
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}`;
}

function uuid(): string {
  return randomUUID().toUpperCase();
}

function numeroControl(tipoDte: string, correlativo: number): string {
  const corr = correlativo.toString().padStart(15, '0');
  return `DTE-${tipoDte}-M001P001-${corr}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatTime(d: Date): string {
  return d.toTimeString().split(' ')[0];
}

function totalEnLetras(amount: number): string {
  const entero = Math.floor(amount);
  const centavos = Math.round((amount - entero) * 100);
  const letras: Record<number, string> = {
    0: 'CERO', 1: 'UN', 2: 'DOS', 3: 'TRES', 4: 'CUATRO',
    5: 'CINCO', 6: 'SEIS', 7: 'SIETE', 8: 'OCHO', 9: 'NUEVE',
    10: 'DIEZ', 11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE',
    15: 'QUINCE', 16: 'DIECISEIS', 17: 'DIECISIETE', 18: 'DIECIOCHO',
    19: 'DIECINUEVE', 20: 'VEINTE', 30: 'TREINTA', 40: 'CUARENTA',
    50: 'CINCUENTA', 60: 'SESENTA', 70: 'SETENTA', 80: 'OCHENTA',
    90: 'NOVENTA', 100: 'CIEN',
  };

  function convertirDecenas(n: number): string {
    if (n <= 20) return letras[n] || `${n}`;
    if (n < 100) {
      const dec = Math.floor(n / 10) * 10;
      const uni = n % 10;
      return uni === 0 ? (letras[dec] || `${n}`) : `${letras[dec] || dec} Y ${letras[uni] || uni}`;
    }
    return `${n}`;
  }

  function convertirCentenas(n: number): string {
    if (n === 0) return 'CERO';
    if (n === 100) return 'CIEN';
    if (n < 100) return convertirDecenas(n);
    const cen = Math.floor(n / 100);
    const resto = n % 100;
    const cenLetras: Record<number, string> = {
      1: 'CIENTO', 2: 'DOSCIENTOS', 3: 'TRESCIENTOS', 4: 'CUATROCIENTOS',
      5: 'QUINIENTOS', 6: 'SEISCIENTOS', 7: 'SETECIENTOS', 8: 'OCHOCIENTOS',
      9: 'NOVECIENTOS',
    };
    if (resto === 0) return cenLetras[cen] || `${n}`;
    return `${cenLetras[cen]} ${convertirDecenas(resto)}`;
  }

  function convertir(n: number): string {
    if (n === 0) return 'CERO';
    if (n < 1000) return convertirCentenas(n);
    if (n < 2000) {
      const resto = n % 1000;
      return resto === 0 ? 'MIL' : `MIL ${convertirCentenas(resto)}`;
    }
    if (n < 1000000) {
      const miles = Math.floor(n / 1000);
      const resto = n % 1000;
      const milesStr = convertirCentenas(miles);
      return resto === 0 ? `${milesStr} MIL` : `${milesStr} MIL ${convertirCentenas(resto)}`;
    }
    return `${n}`;
  }

  const centStr = centavos.toString().padStart(2, '0');
  return `${convertir(entero)} ${centStr}/100 USD`;
}

// ─── Build DTE JSON ─────────────────────────────────────────────────────────

interface DteItem {
  descripcion: string;
  cantidad: number;
  precioUni: number;
  tipoItem: number;
  codigo: string;
  uniMedida: number;
}

interface BuildDteOptions {
  tipoDte: string; // '01' | '03' | '05'
  codigoGeneracion: string;
  numControl: string;
  fecha: Date;
  emisor: {
    nit: string;
    nrc: string;
    nombre: string;
    codActividad: string;
    descActividad: string;
    nombreComercial: string | null;
    direccion: { departamento: string; municipio: string; complemento: string };
    telefono: string;
    correo: string;
  };
  receptor: {
    tipoDocumento: string;
    numDocumento: string;
    nrc: string | null;
    nombre: string;
    codActividad: string | null;
    descActividad: string | null;
    direccion: { departamento: string; municipio: string; complemento: string };
    telefono: string | null;
    correo: string | null;
  } | null;
  items: DteItem[];
  condicionOperacion: number; // 1=Contado, 2=Credito
}

function buildDteJson(opts: BuildDteOptions): string {
  const isCCF = opts.tipoDte === '03';
  const version = isCCF ? 3 : 1;

  // Calculate line items
  const cuerpoDocumento = opts.items.map((item, idx) => {
    const ventaGravada = Math.round(item.cantidad * item.precioUni * 100) / 100;
    const ivaItem = isCCF ? undefined : Math.round(ventaGravada * 0.13 * 100) / 100;

    const line: Record<string, unknown> = {
      numItem: idx + 1,
      tipoItem: item.tipoItem,
      numeroDocumento: null,
      cantidad: item.cantidad,
      codigo: item.codigo,
      codTributo: null,
      uniMedida: item.uniMedida,
      descripcion: item.descripcion,
      precioUni: item.precioUni,
      montoDescu: 0,
      ventaNoSuj: 0,
      ventaExenta: 0,
      ventaGravada,
      tributos: ['20'],
      psv: 0,
      noGravado: 0,
    };

    if (!isCCF) {
      line.ivaItem = ivaItem;
    }

    return line;
  });

  const totalGravada = cuerpoDocumento.reduce((s, l) => s + (l.ventaGravada as number), 0);
  const totalGravadaR = Math.round(totalGravada * 100) / 100;
  const totalIva = Math.round(totalGravadaR * 0.13 * 100) / 100;
  const montoTotal = Math.round((totalGravadaR + totalIva) * 100) / 100;

  let receptor: Record<string, unknown> | null = null;
  if (opts.receptor) {
    if (isCCF) {
      receptor = {
        nit: opts.receptor.numDocumento,
        nrc: opts.receptor.nrc || '0',
        nombre: opts.receptor.nombre,
        codActividad: opts.receptor.codActividad || '10000',
        descActividad: opts.receptor.descActividad || 'Actividad económica',
        nombreComercial: null,
        direccion: opts.receptor.direccion,
        telefono: opts.receptor.telefono,
        correo: opts.receptor.correo,
      };
    } else {
      receptor = {
        tipoDocumento: opts.receptor.tipoDocumento,
        numDocumento: opts.receptor.numDocumento,
        nrc: opts.receptor.nrc,
        nombre: opts.receptor.nombre,
        codActividad: opts.receptor.codActividad,
        descActividad: opts.receptor.descActividad,
        direccion: opts.receptor.direccion,
        telefono: opts.receptor.telefono,
        correo: opts.receptor.correo,
      };
    }
  }

  const resumen: Record<string, unknown> = {
    totalNoSuj: 0,
    totalExenta: 0,
    totalGravada: totalGravadaR,
    subTotalVentas: totalGravadaR,
    descuNoSuj: 0,
    descuExenta: 0,
    descuGravada: 0,
    porcentajeDescuento: 0,
    totalDescu: 0,
    tributos: [
      {
        codigo: '20',
        descripcion: 'Impuesto al Valor Agregado 13%',
        valor: totalIva,
      },
    ],
    subTotal: totalGravadaR,
    ivaRete1: 0,
    reteRenta: 0,
    montoTotalOperacion: montoTotal,
    totalNoGravado: 0,
    totalPagar: montoTotal,
    totalLetras: totalEnLetras(montoTotal),
    totalIva: totalIva,
    saldoFavor: 0,
    condicionOperacion: opts.condicionOperacion,
    pagos: opts.condicionOperacion !== 2
      ? [{ codigo: '01', montoPago: montoTotal, referencia: null, plazo: null, periodo: null }]
      : null,
    numPagoElectronico: null,
  };

  if (isCCF) {
    resumen.ivaPerci1 = 0;
  }

  const json = {
    identificacion: {
      version,
      ambiente: '00',
      tipoDte: opts.tipoDte,
      numeroControl: opts.numControl,
      codigoGeneracion: opts.codigoGeneracion,
      tipoModelo: 1,
      tipoOperacion: 1,
      tipoContingencia: null,
      motivoContin: null,
      fecEmi: formatDate(opts.fecha),
      horEmi: formatTime(opts.fecha),
      tipoMoneda: 'USD',
    },
    documentoRelacionado: null,
    emisor: {
      nit: opts.emisor.nit,
      nrc: opts.emisor.nrc,
      nombre: opts.emisor.nombre,
      codActividad: opts.emisor.codActividad,
      descActividad: opts.emisor.descActividad,
      nombreComercial: opts.emisor.nombreComercial,
      tipoEstablecimiento: '02',
      direccion: opts.emisor.direccion,
      telefono: opts.emisor.telefono,
      correo: opts.emisor.correo,
      codEstableMH: 'M001',
      codEstable: 'M001',
      codPuntoVentaMH: 'P001',
      codPuntoVenta: 'P001',
    },
    receptor,
    otrosDocumentos: null,
    ventaTercero: null,
    cuerpoDocumento,
    resumen,
    extension: null,
    apendice: null,
  };

  return JSON.stringify(json);
}

// ─── Main Seed ──────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting demo tenant seed...\n');

  // ─── Check for existing demo tenant ─────────────────────────────────────
  const existingTenant = await prisma.tenant.findUnique({
    where: { nit: '0614-010100-101-0' },
  });

  if (existingTenant) {
    console.log('⚠️  Demo tenant already exists. Deleting and recreating...');
    // Delete user first (FK constraint)
    await prisma.user.deleteMany({ where: { tenantId: existingTenant.id } });
    // Delete related data (cascade should handle most, but be explicit)
    await prisma.dTE.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.cliente.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.catalogItem.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.catalogCategory.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.recurringInvoiceTemplate.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.journalEntryLine.deleteMany({
      where: { entry: { tenantId: existingTenant.id } },
    });
    await prisma.journalEntry.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.accountMappingRule.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.accountingAccount.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.quoteLineItem.deleteMany({
      where: { quote: { tenantId: existingTenant.id } },
    });
    await prisma.quoteStatusHistory.deleteMany({
      where: { quote: { tenantId: existingTenant.id } },
    });
    await prisma.quote.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.sucursal.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.tenant.delete({ where: { id: existingTenant.id } });
    console.log('✅ Old demo tenant deleted.\n');
  }

  // ─── 1. Create Tenant ───────────────────────────────────────────────────
  console.log('📦 Creating tenant...');
  const tenantId = cuid();
  const tenant = await prisma.tenant.create({
    data: {
      id: tenantId,
      nombre: 'Demo Empresa S.A. de C.V.',
      nit: '0614-010100-101-0',
      nrc: '123456-7',
      actividadEcon: '46900',
      direccion: JSON.stringify({
        departamento: '06',
        municipio: '14',
        complemento: 'Boulevard Los Héroes, Edificio Demo, San Salvador',
      }),
      telefono: '2222-3333',
      correo: 'demo@facturosv.com',
      nombreComercial: 'Demo Empresa',
      plan: 'PROFESIONAL',
      planStatus: 'ACTIVE',
      maxDtesPerMonth: 500,
      maxUsers: 10,
      maxClientes: 500,
      codEstableMH: 'M001',
      codPuntoVentaMH: 'P001',
      autoJournalEnabled: true,
      autoJournalTrigger: 'ON_CREATED',
    },
  });
  console.log(`  ✅ Tenant: ${tenant.nombre} (${tenant.id})`);

  // ─── 2. Create Admin User ──────────────────────────────────────────────
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash('Demo2026!Secure', 10);
  const userId = cuid();
  const user = await prisma.user.create({
    data: {
      id: userId,
      email: 'admin@demo-facturo.com',
      password: hashedPassword,
      nombre: 'Carlos Administrador',
      rol: 'ADMIN',
      tenantId: tenant.id,
      emailVerified: true,
    },
  });
  console.log(`  ✅ User: ${user.email}`);

  // ─── 3. Create Sucursal ────────────────────────────────────────────────
  console.log('🏢 Creating sucursal...');
  const sucursalId = cuid();
  await prisma.sucursal.create({
    data: {
      id: sucursalId,
      tenantId: tenant.id,
      nombre: 'Casa Matriz',
      codEstableMH: 'M001',
      codEstable: 'M001',
      tipoEstablecimiento: '02',
      direccion: JSON.stringify({
        departamento: '06',
        municipio: '14',
        complemento: 'Boulevard Los Héroes, San Salvador',
      }),
      departamento: '06',
      municipio: '14',
      telefono: '2222-3333',
      correo: 'demo@facturosv.com',
      esPrincipal: true,
    },
  });
  console.log('  ✅ Sucursal created');

  // ─── 4. Create Clients ─────────────────────────────────────────────────
  console.log('👥 Creating clients...');

  interface ClientData {
    nombre: string;
    tipoDocumento: string;
    numDocumento: string;
    nrc: string | null;
    correo: string;
    telefono: string;
    direccion: { departamento: string; municipio: string; complemento: string };
    codActividad?: string;
    descActividad?: string;
  }

  const clientsData: ClientData[] = [
    {
      nombre: 'Distribuidora ABC S.A. de C.V.',
      tipoDocumento: '36', numDocumento: '0614-050590-001-2',
      nrc: '100001-5', correo: 'contacto@distribuidoraabc.com.sv',
      telefono: '2223-4455', codActividad: '46900', descActividad: 'Venta al por mayor de otros productos',
      direccion: { departamento: '06', municipio: '14', complemento: 'Calle Arce #123, San Salvador' },
    },
    {
      nombre: 'Tech Solutions S.A.',
      tipoDocumento: '36', numDocumento: '0614-120395-002-3',
      nrc: '200002-3', correo: 'info@techsolutions.com.sv',
      telefono: '2234-5566', codActividad: '62010', descActividad: 'Actividades de programación informática',
      direccion: { departamento: '06', municipio: '14', complemento: 'Col. Escalón, Calle La Reforma #456' },
    },
    {
      nombre: 'Comercial López y Asociados',
      tipoDocumento: '36', numDocumento: '0614-080888-003-4',
      nrc: '300003-1', correo: 'ventas@comerciallopez.com.sv',
      telefono: '2245-6677', codActividad: '47190', descActividad: 'Comercio al por menor en comercios no especializados',
      direccion: { departamento: '06', municipio: '14', complemento: 'Centro Comercial Metro Centro, Local 45' },
    },
    {
      nombre: 'Importadora XYZ Ltda.',
      tipoDocumento: '36', numDocumento: '0614-150192-004-5',
      nrc: '400004-9', correo: 'importaciones@xyz.com.sv',
      telefono: '2256-7788', codActividad: '46100', descActividad: 'Intermediarios del comercio',
      direccion: { departamento: '06', municipio: '14', complemento: 'Boulevard del Hipódromo #789, San Salvador' },
    },
    {
      nombre: 'Farmacia Central',
      tipoDocumento: '36', numDocumento: '0614-220790-005-6',
      nrc: '500005-7', correo: 'info@farmaciacentral.com.sv',
      telefono: '2267-8899', codActividad: '47730', descActividad: 'Venta al por menor de productos farmacéuticos',
      direccion: { departamento: '06', municipio: '14', complemento: '2a. Avenida Norte #234, San Salvador' },
    },
    {
      nombre: 'Restaurante El Buen Sabor',
      tipoDocumento: '36', numDocumento: '0614-030585-006-7',
      nrc: '600006-5', correo: 'reservas@elbuensabor.com.sv',
      telefono: '2278-9900', codActividad: '56101', descActividad: 'Actividades de restaurantes',
      direccion: { departamento: '06', municipio: '14', complemento: 'Paseo General Escalón #567' },
    },
    {
      nombre: 'Constructora Moderna S.A.',
      tipoDocumento: '36', numDocumento: '0614-110293-007-8',
      nrc: '700007-3', correo: 'proyectos@constructoramoderna.com.sv',
      telefono: '2289-0011', codActividad: '41001', descActividad: 'Construcción de edificios',
      direccion: { departamento: '06', municipio: '14', complemento: 'Col. San Benito, Calle La Mascota #890' },
    },
    {
      nombre: 'Clínica San Rafael',
      tipoDocumento: '36', numDocumento: '0614-250696-008-9',
      nrc: '800008-1', correo: 'citas@clinicasanrafael.com.sv',
      telefono: '2290-1122', codActividad: '86200', descActividad: 'Actividades de médicos y odontólogos',
      direccion: { departamento: '06', municipio: '14', complemento: 'Calle del Mirador #1234, Col. Escalón' },
    },
    {
      nombre: 'María Elena García',
      tipoDocumento: '13', numDocumento: '01234567-8',
      nrc: null, correo: 'maria.garcia@gmail.com',
      telefono: '7890-1234',
      direccion: { departamento: '06', municipio: '14', complemento: 'Residencial Las Magnolias, Casa 45' },
    },
    {
      nombre: 'Roberto Martínez Flores',
      tipoDocumento: '13', numDocumento: '02345678-9',
      nrc: null, correo: 'roberto.martinez@hotmail.com',
      telefono: '7801-2345',
      direccion: { departamento: '06', municipio: '14', complemento: 'Urbanización La Esperanza, Pasaje 3, Casa 12' },
    },
    {
      nombre: 'Librería El Conocimiento',
      tipoDocumento: '36', numDocumento: '0614-180494-011-2',
      nrc: '110011-6', correo: 'ventas@libreriaconocimiento.com.sv',
      telefono: '2201-3344', codActividad: '47610', descActividad: 'Venta al por menor de libros',
      direccion: { departamento: '06', municipio: '14', complemento: 'Alameda Juan Pablo II #567' },
    },
    {
      nombre: 'Panadería Don Juan',
      tipoDocumento: '36', numDocumento: '0614-070391-012-3',
      nrc: '120012-4', correo: 'pedidos@panaderiadonjuan.com.sv',
      telefono: '2212-4455', codActividad: '10710', descActividad: 'Elaboración de productos de panadería',
      direccion: { departamento: '06', municipio: '14', complemento: 'Barrio San Miguelito, Calle Principal #89' },
    },
    {
      nombre: 'Servicios Digitales SV S.A.',
      tipoDocumento: '36', numDocumento: '0614-290197-013-4',
      nrc: '130013-2', correo: 'contacto@digitalessv.com',
      telefono: '2223-5566', codActividad: '63110', descActividad: 'Procesamiento de datos',
      direccion: { departamento: '06', municipio: '14', complemento: 'World Trade Center, Nivel 12, Oficina 1205' },
    },
    {
      nombre: 'Hotel Vista Real',
      tipoDocumento: '36', numDocumento: '0614-040898-014-5',
      nrc: '140014-0', correo: 'reservaciones@hotelvistreal.com.sv',
      telefono: '2234-6677', codActividad: '55101', descActividad: 'Actividades de hoteles',
      direccion: { departamento: '06', municipio: '14', complemento: 'Km 8.5, Carretera a Comasagua' },
    },
    {
      nombre: 'Taller Mecánico Express',
      tipoDocumento: '36', numDocumento: '0614-160795-015-6',
      nrc: '150015-8', correo: 'taller@mecanicoexpress.com.sv',
      telefono: '2245-7788', codActividad: '45200', descActividad: 'Mantenimiento y reparación de vehículos',
      direccion: { departamento: '06', municipio: '14', complemento: 'Col. Flor Blanca, 25 Avenida Sur #400' },
    },
  ];

  const clienteIds: string[] = [];
  const clienteMap: Map<string, { id: string; data: ClientData }> = new Map();

  for (const c of clientsData) {
    const clienteId = cuid();
    await prisma.cliente.create({
      data: {
        id: clienteId,
        tenantId: tenant.id,
        tipoDocumento: c.tipoDocumento,
        numDocumento: c.numDocumento,
        nombre: c.nombre,
        nrc: c.nrc,
        correo: c.correo,
        telefono: c.telefono,
        direccion: JSON.stringify(c.direccion),
      },
    });
    clienteIds.push(clienteId);
    clienteMap.set(clienteId, { id: clienteId, data: c });
  }
  console.log(`  ✅ ${clientsData.length} clients created`);

  // ─── 5. Create Catalog Categories & Items ──────────────────────────────
  console.log('📋 Creating catalog items...');

  const catLicencias = cuid();
  const catServicios = cuid();
  const catPacks = cuid();

  await prisma.catalogCategory.createMany({
    data: [
      { id: catLicencias, tenantId: tenant.id, name: 'Licencias', color: '#8b5cf6', sortOrder: 1 },
      { id: catServicios, tenantId: tenant.id, name: 'Servicios', color: '#06b6d4', sortOrder: 2 },
      { id: catPacks, tenantId: tenant.id, name: 'Paquetes', color: '#10b981', sortOrder: 3 },
    ],
  });

  interface CatalogItemInput {
    code: string;
    name: string;
    description: string;
    type: string;
    basePrice: number;
    categoryId: string;
    tipoItem: number;
    uniMedida: number;
  }

  const catalogItemsData: CatalogItemInput[] = [
    { code: 'LIC-BAS', name: 'Licencia Facturo Plan Básico', description: 'Plan básico mensual de facturación', type: 'SERVICE', basePrice: 29.99, categoryId: catLicencias, tipoItem: 2, uniMedida: 99 },
    { code: 'LIC-PRO', name: 'Licencia Facturo Plan Profesional', description: 'Plan profesional mensual', type: 'SERVICE', basePrice: 49.99, categoryId: catLicencias, tipoItem: 2, uniMedida: 99 },
    { code: 'LIC-ENT', name: 'Licencia Facturo Plan Enterprise', description: 'Plan enterprise mensual', type: 'SERVICE', basePrice: 99.99, categoryId: catLicencias, tipoItem: 2, uniMedida: 99 },
    { code: 'MOD-CONT', name: 'Módulo de Contabilidad', description: 'Módulo adicional de contabilidad integrada', type: 'SERVICE', basePrice: 19.99, categoryId: catLicencias, tipoItem: 2, uniMedida: 99 },
    { code: 'MOD-B2B', name: 'Módulo Portal B2B', description: 'Portal de cotizaciones para clientes', type: 'SERVICE', basePrice: 24.99, categoryId: catLicencias, tipoItem: 2, uniMedida: 99 },
    { code: 'CAP-PRES', name: 'Capacitación presencial (por hora)', description: 'Entrenamiento presencial en uso del sistema', type: 'SERVICE', basePrice: 75.00, categoryId: catServicios, tipoItem: 2, uniMedida: 99 },
    { code: 'CAP-VIRT', name: 'Capacitación virtual (por hora)', description: 'Entrenamiento virtual por videollamada', type: 'SERVICE', basePrice: 45.00, categoryId: catServicios, tipoItem: 2, uniMedida: 99 },
    { code: 'SOP-PREM', name: 'Soporte técnico premium mensual', description: 'Soporte prioritario con tiempo de respuesta garantizado', type: 'SERVICE', basePrice: 35.00, categoryId: catServicios, tipoItem: 2, uniMedida: 99 },
    { code: 'IMPL-INI', name: 'Implementación inicial', description: 'Configuración y puesta en marcha del sistema', type: 'SERVICE', basePrice: 150.00, categoryId: catServicios, tipoItem: 2, uniMedida: 99 },
    { code: 'MIG-DAT', name: 'Migración de datos', description: 'Migración de datos desde sistema anterior', type: 'SERVICE', basePrice: 200.00, categoryId: catServicios, tipoItem: 2, uniMedida: 99 },
    { code: 'CERT-FE', name: 'Certificado de firma electrónica', description: 'Gestión de certificado de firma digital', type: 'PRODUCT', basePrice: 50.00, categoryId: catServicios, tipoItem: 1, uniMedida: 99 },
    { code: 'CONS-TRIB', name: 'Consultoría tributaria (por hora)', description: 'Asesoría en temas de cumplimiento tributario', type: 'SERVICE', basePrice: 60.00, categoryId: catServicios, tipoItem: 2, uniMedida: 99 },
    { code: 'PERS-PLANT', name: 'Personalización de plantillas DTE', description: 'Diseño personalizado de plantillas de documentos', type: 'SERVICE', basePrice: 100.00, categoryId: catServicios, tipoItem: 2, uniMedida: 99 },
    { code: 'INT-API', name: 'Integración API personalizada', description: 'Desarrollo de integración con sistemas del cliente', type: 'SERVICE', basePrice: 300.00, categoryId: catServicios, tipoItem: 2, uniMedida: 99 },
    { code: 'BACK-REC', name: 'Backup y recuperación de datos', description: 'Servicio mensual de respaldo y recuperación', type: 'SERVICE', basePrice: 25.00, categoryId: catServicios, tipoItem: 2, uniMedida: 99 },
    { code: 'HOST-DED', name: 'Hosting dedicado', description: 'Servidor dedicado para el sistema', type: 'SERVICE', basePrice: 80.00, categoryId: catServicios, tipoItem: 2, uniMedida: 99 },
    { code: 'DOM-PERS', name: 'Dominio personalizado', description: 'Registro y gestión de dominio personalizado', type: 'SERVICE', basePrice: 15.00, categoryId: catServicios, tipoItem: 2, uniMedida: 99 },
    { code: 'SSL-EMP', name: 'SSL empresarial', description: 'Certificado SSL con validación empresarial', type: 'PRODUCT', basePrice: 40.00, categoryId: catServicios, tipoItem: 1, uniMedida: 99 },
    { code: 'AUD-DTE', name: 'Auditoría de cumplimiento DTE', description: 'Revisión completa de cumplimiento con normativa DTE', type: 'SERVICE', basePrice: 250.00, categoryId: catServicios, tipoItem: 2, uniMedida: 99 },
    { code: 'PACK-PYME', name: 'Pack PYME (Básico + Contabilidad)', description: 'Paquete económico para pequeñas empresas', type: 'SERVICE', basePrice: 44.99, categoryId: catPacks, tipoItem: 2, uniMedida: 99 },
  ];

  const catalogIds: string[] = [];
  for (const item of catalogItemsData) {
    const itemId = cuid();
    await prisma.catalogItem.create({
      data: {
        id: itemId,
        tenantId: tenant.id,
        categoryId: item.categoryId,
        type: item.type,
        code: item.code,
        name: item.name,
        description: item.description,
        tipoItem: item.tipoItem,
        basePrice: item.basePrice,
        uniMedida: item.uniMedida,
        tributo: '20',
        taxRate: 13.00,
        isActive: true,
      },
    });
    catalogIds.push(itemId);
  }
  console.log(`  ✅ ${catalogItemsData.length} catalog items created`);

  // ─── 6. Create DTEs (Invoices) ─────────────────────────────────────────
  console.log('📄 Creating DTEs...');

  const emisorData = {
    nit: '06140101001010',
    nrc: '1234567',
    nombre: 'Demo Empresa S.A. de C.V.',
    codActividad: '46900',
    descActividad: 'Venta al por mayor de otros productos',
    nombreComercial: 'Demo Empresa',
    direccion: { departamento: '06', municipio: '14', complemento: 'Boulevard Los Héroes, Edificio Demo, San Salvador' },
    telefono: '2222-3333',
    correo: 'demo@facturosv.com',
  };

  // DTE distribution: 20 Facturas (01), 8 CCFs (03), 2 Notas de Crédito (05) = 30 DTEs
  interface DteSpec {
    tipoDte: string;
    clienteIdx: number;
    items: { catalogIdx: number; qty: number }[];
    condicion: number;
    estado: string;
    month: number; // 1=Jan, 2=Feb, 3=Mar
    day: number;
  }

  const dteSpecs: DteSpec[] = [
    // January 2026 - 10 DTEs
    { tipoDte: '01', clienteIdx: 8, items: [{ catalogIdx: 0, qty: 1 }], condicion: 1, estado: 'PROCESADO', month: 1, day: 5 },
    { tipoDte: '01', clienteIdx: 9, items: [{ catalogIdx: 6, qty: 2 }], condicion: 1, estado: 'PROCESADO', month: 1, day: 8 },
    { tipoDte: '03', clienteIdx: 0, items: [{ catalogIdx: 1, qty: 1 }, { catalogIdx: 7, qty: 1 }], condicion: 2, estado: 'PROCESADO', month: 1, day: 10 },
    { tipoDte: '01', clienteIdx: 8, items: [{ catalogIdx: 10, qty: 2 }], condicion: 1, estado: 'PROCESADO', month: 1, day: 12 },
    { tipoDte: '03', clienteIdx: 1, items: [{ catalogIdx: 8, qty: 1 }, { catalogIdx: 9, qty: 1 }], condicion: 2, estado: 'PROCESADO', month: 1, day: 15 },
    { tipoDte: '01', clienteIdx: 5, items: [{ catalogIdx: 19, qty: 1 }], condicion: 1, estado: 'PROCESADO', month: 1, day: 18 },
    { tipoDte: '03', clienteIdx: 3, items: [{ catalogIdx: 2, qty: 3 }, { catalogIdx: 3, qty: 2 }], condicion: 2, estado: 'PROCESADO', month: 1, day: 20 },
    { tipoDte: '01', clienteIdx: 4, items: [{ catalogIdx: 0, qty: 1 }], condicion: 1, estado: 'PROCESADO', month: 1, day: 22 },
    { tipoDte: '01', clienteIdx: 11, items: [{ catalogIdx: 5, qty: 3 }], condicion: 1, estado: 'PROCESADO', month: 1, day: 25 },
    { tipoDte: '03', clienteIdx: 6, items: [{ catalogIdx: 13, qty: 1 }, { catalogIdx: 12, qty: 2 }], condicion: 2, estado: 'PROCESADO', month: 1, day: 28 },

    // February 2026 - 10 DTEs
    { tipoDte: '01', clienteIdx: 9, items: [{ catalogIdx: 6, qty: 1 }], condicion: 1, estado: 'PROCESADO', month: 2, day: 2 },
    { tipoDte: '03', clienteIdx: 0, items: [{ catalogIdx: 1, qty: 1 }, { catalogIdx: 7, qty: 1 }], condicion: 2, estado: 'PROCESADO', month: 2, day: 5 },
    { tipoDte: '01', clienteIdx: 10, items: [{ catalogIdx: 0, qty: 1 }, { catalogIdx: 3, qty: 1 }], condicion: 1, estado: 'PROCESADO', month: 2, day: 8 },
    { tipoDte: '03', clienteIdx: 7, items: [{ catalogIdx: 8, qty: 1 }], condicion: 2, estado: 'PROCESADO', month: 2, day: 10 },
    { tipoDte: '01', clienteIdx: 8, items: [{ catalogIdx: 11, qty: 4 }], condicion: 1, estado: 'PROCESADO', month: 2, day: 13 },
    { tipoDte: '03', clienteIdx: 12, items: [{ catalogIdx: 2, qty: 2 }, { catalogIdx: 4, qty: 1 }], condicion: 2, estado: 'PROCESADO', month: 2, day: 16 },
    { tipoDte: '01', clienteIdx: 5, items: [{ catalogIdx: 19, qty: 1 }], condicion: 1, estado: 'PROCESADO', month: 2, day: 18 },
    { tipoDte: '01', clienteIdx: 14, items: [{ catalogIdx: 11, qty: 2 }], condicion: 1, estado: 'PROCESADO', month: 2, day: 20 },
    { tipoDte: '03', clienteIdx: 13, items: [{ catalogIdx: 15, qty: 1 }, { catalogIdx: 17, qty: 1 }], condicion: 2, estado: 'PROCESADO', month: 2, day: 23 },
    { tipoDte: '01', clienteIdx: 4, items: [{ catalogIdx: 0, qty: 1 }], condicion: 1, estado: 'PROCESADO', month: 2, day: 26 },

    // March 2026 - 10 DTEs (some pending)
    { tipoDte: '03', clienteIdx: 0, items: [{ catalogIdx: 1, qty: 1 }, { catalogIdx: 7, qty: 1 }], condicion: 2, estado: 'PROCESADO', month: 3, day: 1 },
    { tipoDte: '01', clienteIdx: 9, items: [{ catalogIdx: 5, qty: 2 }], condicion: 1, estado: 'PROCESADO', month: 3, day: 3 },
    { tipoDte: '03', clienteIdx: 1, items: [{ catalogIdx: 13, qty: 1 }], condicion: 2, estado: 'PROCESADO', month: 3, day: 5 },
    { tipoDte: '01', clienteIdx: 8, items: [{ catalogIdx: 10, qty: 1 }], condicion: 1, estado: 'PROCESADO', month: 3, day: 6 },
    { tipoDte: '03', clienteIdx: 6, items: [{ catalogIdx: 18, qty: 1 }], condicion: 2, estado: 'PROCESADO', month: 3, day: 7 },
    { tipoDte: '01', clienteIdx: 11, items: [{ catalogIdx: 6, qty: 1 }], condicion: 1, estado: 'PROCESADO', month: 3, day: 8 },
    { tipoDte: '01', clienteIdx: 4, items: [{ catalogIdx: 0, qty: 1 }, { catalogIdx: 7, qty: 1 }], condicion: 1, estado: 'PROCESADO', month: 3, day: 9 },
    { tipoDte: '01', clienteIdx: 5, items: [{ catalogIdx: 19, qty: 1 }], condicion: 1, estado: 'PENDIENTE', month: 3, day: 10 },
    { tipoDte: '03', clienteIdx: 3, items: [{ catalogIdx: 2, qty: 5 }], condicion: 2, estado: 'PENDIENTE', month: 3, day: 10 },
    { tipoDte: '03', clienteIdx: 12, items: [{ catalogIdx: 1, qty: 1 }, { catalogIdx: 4, qty: 1 }, { catalogIdx: 7, qty: 1 }], condicion: 2, estado: 'PENDIENTE', month: 3, day: 11 },
  ];

  let correlativoF = 0; // for tipo 01
  let correlativoC = 0; // for tipo 03
  const dteIds: string[] = [];

  for (const spec of dteSpecs) {
    const corr = spec.tipoDte === '01' ? ++correlativoF : ++correlativoC;
    const fecha = new Date(2026, spec.month - 1, spec.day, 8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
    const codGen = uuid();
    const numCtrl = numeroControl(spec.tipoDte, corr);
    const clienteId = clienteIds[spec.clienteIdx];
    const clienteData = clientsData[spec.clienteIdx];

    const dteItems: DteItem[] = spec.items.map((si) => {
      const catItem = catalogItemsData[si.catalogIdx];
      return {
        descripcion: catItem.name,
        cantidad: si.qty,
        precioUni: catItem.basePrice,
        tipoItem: catItem.tipoItem,
        codigo: catItem.code,
        uniMedida: catItem.uniMedida,
      };
    });

    const receptorInfo = {
      tipoDocumento: clienteData.tipoDocumento,
      numDocumento: clienteData.numDocumento,
      nrc: clienteData.nrc,
      nombre: clienteData.nombre,
      codActividad: clienteData.codActividad || null,
      descActividad: clienteData.descActividad || null,
      direccion: clienteData.direccion,
      telefono: clienteData.telefono,
      correo: clienteData.correo,
    };

    const jsonStr = buildDteJson({
      tipoDte: spec.tipoDte,
      codigoGeneracion: codGen,
      numControl: numCtrl,
      fecha,
      emisor: emisorData,
      receptor: receptorInfo,
      items: dteItems,
      condicionOperacion: spec.condicion,
    });

    // Calculate totals from items
    const totalGravada = dteItems.reduce((s, it) => s + it.cantidad * it.precioUni, 0);
    const totalGravadaR = Math.round(totalGravada * 100) / 100;
    const totalIva = Math.round(totalGravadaR * 0.13 * 100) / 100;
    const totalPagar = Math.round((totalGravadaR + totalIva) * 100) / 100;

    const dteId = cuid();
    await prisma.dTE.create({
      data: {
        id: dteId,
        tenantId: tenant.id,
        clienteId,
        tipoDte: spec.tipoDte,
        codigoGeneracion: codGen,
        numeroControl: numCtrl,
        jsonOriginal: jsonStr,
        estado: spec.estado,
        selloRecepcion: spec.estado === 'PROCESADO' ? uuid() : null,
        fechaRecepcion: spec.estado === 'PROCESADO' ? fecha : null,
        totalGravada: new Prisma.Decimal(totalGravadaR),
        totalIva: new Prisma.Decimal(totalIva),
        totalPagar: new Prisma.Decimal(totalPagar),
        sucursalId: sucursalId,
        createdAt: fecha,
      },
    });
    dteIds.push(dteId);
  }
  console.log(`  ✅ ${dteSpecs.length} DTEs created`);

  // ─── 7. Create Accounting Accounts ─────────────────────────────────────
  console.log('📊 Creating accounting accounts...');

  interface AccountDef {
    code: string;
    name: string;
    accountType: string;
    normalBalance: string;
    level: number;
    parentCode?: string;
    allowsPosting: boolean;
  }

  const accountsDef: AccountDef[] = [
    // Activos
    { code: '1', name: 'Activo', accountType: 'ASSET', normalBalance: 'DEBIT', level: 1, allowsPosting: false },
    { code: '11', name: 'Activo Corriente', accountType: 'ASSET', normalBalance: 'DEBIT', level: 2, parentCode: '1', allowsPosting: false },
    { code: '1101', name: 'Efectivo y Equivalentes', accountType: 'ASSET', normalBalance: 'DEBIT', level: 3, parentCode: '11', allowsPosting: false },
    { code: '110101', name: 'Caja General', accountType: 'ASSET', normalBalance: 'DEBIT', level: 4, parentCode: '1101', allowsPosting: true },
    { code: '110102', name: 'Bancos', accountType: 'ASSET', normalBalance: 'DEBIT', level: 4, parentCode: '1101', allowsPosting: true },
    { code: '1102', name: 'Cuentas por Cobrar', accountType: 'ASSET', normalBalance: 'DEBIT', level: 3, parentCode: '11', allowsPosting: false },
    { code: '110201', name: 'Clientes', accountType: 'ASSET', normalBalance: 'DEBIT', level: 4, parentCode: '1102', allowsPosting: true },
    // Pasivos
    { code: '2', name: 'Pasivo', accountType: 'LIABILITY', normalBalance: 'CREDIT', level: 1, allowsPosting: false },
    { code: '21', name: 'Pasivo Corriente', accountType: 'LIABILITY', normalBalance: 'CREDIT', level: 2, parentCode: '2', allowsPosting: false },
    { code: '2102', name: 'Impuestos por Pagar', accountType: 'LIABILITY', normalBalance: 'CREDIT', level: 3, parentCode: '21', allowsPosting: false },
    { code: '210201', name: 'IVA Débito Fiscal', accountType: 'LIABILITY', normalBalance: 'CREDIT', level: 4, parentCode: '2102', allowsPosting: true },
    // Patrimonio
    { code: '3', name: 'Patrimonio', accountType: 'EQUITY', normalBalance: 'CREDIT', level: 1, allowsPosting: false },
    { code: '31', name: 'Capital Social', accountType: 'EQUITY', normalBalance: 'CREDIT', level: 2, parentCode: '3', allowsPosting: true },
    // Ingresos
    { code: '4', name: 'Ingresos', accountType: 'REVENUE', normalBalance: 'CREDIT', level: 1, allowsPosting: false },
    { code: '41', name: 'Ingresos por Ventas', accountType: 'REVENUE', normalBalance: 'CREDIT', level: 2, parentCode: '4', allowsPosting: false },
    { code: '4101', name: 'Ventas', accountType: 'REVENUE', normalBalance: 'CREDIT', level: 3, parentCode: '41', allowsPosting: true },
    // Gastos
    { code: '5', name: 'Gastos', accountType: 'EXPENSE', normalBalance: 'DEBIT', level: 1, allowsPosting: false },
    { code: '51', name: 'Gastos de Operación', accountType: 'EXPENSE', normalBalance: 'DEBIT', level: 2, parentCode: '5', allowsPosting: true },
  ];

  const accountIdMap: Map<string, string> = new Map();

  for (const acc of accountsDef) {
    const accId = cuid();
    const parentId = acc.parentCode ? accountIdMap.get(acc.parentCode) : null;
    await prisma.accountingAccount.create({
      data: {
        id: accId,
        tenantId: tenant.id,
        code: acc.code,
        name: acc.name,
        accountType: acc.accountType,
        normalBalance: acc.normalBalance,
        level: acc.level,
        parentId: parentId || null,
        allowsPosting: acc.allowsPosting,
        isSystem: true,
        isActive: true,
      },
    });
    accountIdMap.set(acc.code, accId);
  }
  console.log(`  ✅ ${accountsDef.length} accounting accounts created`);

  // ─── 8. Create Account Mapping Rules ───────────────────────────────────
  console.log('🔗 Creating account mapping rules...');

  const cajaId = accountIdMap.get('110101')!;
  const clientesCtaId = accountIdMap.get('110201')!;
  const ivaDebitoId = accountIdMap.get('210201')!;
  const ventasId = accountIdMap.get('4101')!;

  const mappingRules = [
    {
      operation: 'VENTA_CONTADO',
      description: 'Venta al contado (Factura)',
      debitAccountId: cajaId,
      creditAccountId: ventasId,
      mappingConfig: JSON.stringify({
        debe: [{ cuenta: '110101', monto: 'total', descripcion: 'Caja General' }],
        haber: [
          { cuenta: '4101', monto: 'subtotal', descripcion: 'Ventas' },
          { cuenta: '210201', monto: 'iva', descripcion: 'IVA Débito Fiscal' },
        ],
      }),
    },
    {
      operation: 'VENTA_CREDITO',
      description: 'Venta al crédito',
      debitAccountId: clientesCtaId,
      creditAccountId: ventasId,
      mappingConfig: JSON.stringify({
        debe: [{ cuenta: '110201', monto: 'total', descripcion: 'Clientes' }],
        haber: [
          { cuenta: '4101', monto: 'subtotal', descripcion: 'Ventas' },
          { cuenta: '210201', monto: 'iva', descripcion: 'IVA Débito Fiscal' },
        ],
      }),
    },
    {
      operation: 'CREDITO_FISCAL',
      description: 'Crédito Fiscal (CCF)',
      debitAccountId: clientesCtaId,
      creditAccountId: ventasId,
      mappingConfig: JSON.stringify({
        debe: [{ cuenta: '110201', monto: 'total', descripcion: 'Clientes' }],
        haber: [
          { cuenta: '4101', monto: 'subtotal', descripcion: 'Ventas' },
          { cuenta: '210201', monto: 'iva', descripcion: 'IVA Débito Fiscal' },
        ],
      }),
    },
  ];

  for (const rule of mappingRules) {
    await prisma.accountMappingRule.create({
      data: {
        id: cuid(),
        tenantId: tenant.id,
        ...rule,
      },
    });
  }
  console.log(`  ✅ ${mappingRules.length} mapping rules created`);

  // ─── 9. Create Journal Entries for processed DTEs ──────────────────────
  console.log('📒 Creating journal entries...');
  let entryCount = 0;

  for (let i = 0; i < dteSpecs.length; i++) {
    const spec = dteSpecs[i];
    if (spec.estado !== 'PROCESADO') continue;

    const dteId = dteIds[i];
    const fecha = new Date(2026, spec.month - 1, spec.day);

    // Calculate totals
    const totalGravada = spec.items.reduce((s, si) => {
      const catItem = catalogItemsData[si.catalogIdx];
      return s + si.qty * catItem.basePrice;
    }, 0);
    const totalGravadaR = Math.round(totalGravada * 100) / 100;
    const totalIva = Math.round(totalGravadaR * 0.13 * 100) / 100;
    const totalPagar = Math.round((totalGravadaR + totalIva) * 100) / 100;

    const entryId = cuid();
    entryCount++;
    const entryNumber = `PD-2026-${entryCount.toString().padStart(4, '0')}`;

    // Determine debit account based on condicion
    const debitAccId = spec.condicion === 1 ? cajaId : clientesCtaId;
    const debitAccCode = spec.condicion === 1 ? '110101' : '110201';
    const debitAccName = spec.condicion === 1 ? 'Caja General' : 'Clientes';

    const clienteData = clientsData[spec.clienteIdx];
    const tipoDesc = spec.tipoDte === '01' ? 'Factura' : 'CCF';

    await prisma.journalEntry.create({
      data: {
        id: entryId,
        tenantId: tenant.id,
        entryNumber,
        entryDate: fecha,
        description: `${tipoDesc} - ${clienteData.nombre}`,
        entryType: 'AUTO_DTE',
        sourceType: 'DTE',
        sourceDocumentId: dteId,
        status: 'POSTED',
        postedAt: fecha,
        postedBy: userId,
        totalDebit: new Prisma.Decimal(totalPagar),
        totalCredit: new Prisma.Decimal(totalPagar),
        fiscalYear: 2026,
        fiscalMonth: spec.month,
        lines: {
          createMany: {
            data: [
              {
                id: cuid(),
                accountId: debitAccId,
                description: debitAccName,
                debit: new Prisma.Decimal(totalPagar),
                credit: new Prisma.Decimal(0),
                lineNumber: 1,
              },
              {
                id: cuid(),
                accountId: ventasId,
                description: 'Ventas',
                debit: new Prisma.Decimal(0),
                credit: new Prisma.Decimal(totalGravadaR),
                lineNumber: 2,
              },
              {
                id: cuid(),
                accountId: ivaDebitoId,
                description: 'IVA Débito Fiscal',
                debit: new Prisma.Decimal(0),
                credit: new Prisma.Decimal(totalIva),
                lineNumber: 3,
              },
            ],
          },
        },
      },
    });
  }
  console.log(`  ✅ ${entryCount} journal entries created`);

  // ─── 10. Create Quotes ─────────────────────────────────────────────────
  console.log('📝 Creating quotes...');

  interface QuoteSpec {
    clienteIdx: number;
    status: string;
    items: { catalogIdx: number; qty: number }[];
    daysAgo: number;
    validDays: number;
  }

  const quoteSpecs: QuoteSpec[] = [
    { clienteIdx: 0, status: 'APPROVED', items: [{ catalogIdx: 2, qty: 5 }, { catalogIdx: 3, qty: 5 }], daysAgo: 30, validDays: 30 },
    { clienteIdx: 1, status: 'APPROVED', items: [{ catalogIdx: 13, qty: 1 }, { catalogIdx: 8, qty: 1 }], daysAgo: 25, validDays: 15 },
    { clienteIdx: 6, status: 'APPROVED', items: [{ catalogIdx: 8, qty: 1 }, { catalogIdx: 9, qty: 1 }, { catalogIdx: 5, qty: 4 }], daysAgo: 20, validDays: 30 },
    { clienteIdx: 3, status: 'PENDING_APPROVAL', items: [{ catalogIdx: 2, qty: 10 }, { catalogIdx: 7, qty: 10 }], daysAgo: 5, validDays: 15 },
    { clienteIdx: 7, status: 'PENDING_APPROVAL', items: [{ catalogIdx: 12, qty: 3 }], daysAgo: 3, validDays: 15 },
    { clienteIdx: 12, status: 'SENT', items: [{ catalogIdx: 1, qty: 1 }, { catalogIdx: 4, qty: 1 }], daysAgo: 7, validDays: 30 },
    { clienteIdx: 13, status: 'SENT', items: [{ catalogIdx: 15, qty: 1 }, { catalogIdx: 14, qty: 1 }, { catalogIdx: 17, qty: 1 }], daysAgo: 4, validDays: 30 },
    { clienteIdx: 14, status: 'REJECTED', items: [{ catalogIdx: 18, qty: 1 }], daysAgo: 15, validDays: 15 },
  ];

  for (let qi = 0; qi < quoteSpecs.length; qi++) {
    const qs = quoteSpecs[qi];
    const clienteData = clientsData[qs.clienteIdx];
    const quoteId = cuid();
    const quoteGroupId = cuid();
    const quoteNum = `COT-2026-${(qi + 1).toString().padStart(4, '0')}`;
    const issueDate = new Date(Date.now() - qs.daysAgo * 86400000);
    const validUntil = new Date(issueDate.getTime() + qs.validDays * 86400000);

    // Calculate totals
    let subtotal = 0;
    const lineItemsData = qs.items.map((item, idx) => {
      const catItem = catalogItemsData[item.catalogIdx];
      const lineSubtotal = Math.round(item.qty * catItem.basePrice * 100) / 100;
      const lineTax = Math.round(lineSubtotal * 0.13 * 100) / 100;
      subtotal += lineSubtotal;
      return {
        id: cuid(),
        lineNumber: idx + 1,
        catalogItemId: catalogIds[item.catalogIdx],
        itemCode: catItem.code,
        description: catItem.name,
        quantity: new Prisma.Decimal(item.qty),
        unitPrice: new Prisma.Decimal(catItem.basePrice),
        discount: new Prisma.Decimal(0),
        taxRate: new Prisma.Decimal(13),
        tipoItem: catItem.tipoItem,
        lineSubtotal: new Prisma.Decimal(lineSubtotal),
        lineTax: new Prisma.Decimal(lineTax),
        lineTotal: new Prisma.Decimal(Math.round((lineSubtotal + lineTax) * 100) / 100),
        approvalStatus: qs.status === 'APPROVED' ? 'APPROVED' : qs.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;
    const taxAmount = Math.round(subtotal * 0.13 * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    await prisma.quote.create({
      data: {
        id: quoteId,
        tenantId: tenant.id,
        quoteNumber: quoteNum,
        quoteGroupId,
        version: 1,
        isLatestVersion: true,
        clienteId: clienteIds[qs.clienteIdx],
        clienteNit: clienteData.numDocumento,
        clienteNombre: clienteData.nombre,
        clienteEmail: clienteData.correo,
        clienteDireccion: JSON.stringify(clienteData.direccion),
        clienteTelefono: clienteData.telefono,
        issueDate,
        validUntil,
        sentAt: ['SENT', 'APPROVED', 'REJECTED', 'PENDING_APPROVAL'].includes(qs.status) ? issueDate : null,
        status: qs.status,
        subtotal: new Prisma.Decimal(subtotal),
        taxAmount: new Prisma.Decimal(taxAmount),
        total: new Prisma.Decimal(total),
        approvedSubtotal: qs.status === 'APPROVED' ? new Prisma.Decimal(subtotal) : null,
        approvedTaxAmount: qs.status === 'APPROVED' ? new Prisma.Decimal(taxAmount) : null,
        approvedTotal: qs.status === 'APPROVED' ? new Prisma.Decimal(total) : null,
        terms: 'Precios válidos durante el período indicado. IVA incluido en los totales.',
        notes: 'Cotización generada desde Demo Empresa.',
        approvedAt: qs.status === 'APPROVED' ? new Date(issueDate.getTime() + 3 * 86400000) : null,
        approvedBy: qs.status === 'APPROVED' ? clienteData.nombre : null,
        rejectedAt: qs.status === 'REJECTED' ? new Date(issueDate.getTime() + 5 * 86400000) : null,
        rejectionReason: qs.status === 'REJECTED' ? 'Presupuesto excedido para este período' : null,
        createdBy: userId,
        lineItems: {
          createMany: { data: lineItemsData },
        },
        statusHistory: {
          createMany: {
            data: [
              {
                id: cuid(),
                fromStatus: null,
                toStatus: 'DRAFT',
                actorType: 'ADMIN',
                actorId: userId,
                actorName: 'Carlos Administrador',
                createdAt: issueDate,
              },
              ...(['SENT', 'APPROVED', 'REJECTED', 'PENDING_APPROVAL'].includes(qs.status) ? [{
                id: cuid(),
                fromStatus: 'DRAFT',
                toStatus: 'SENT',
                actorType: 'ADMIN' as const,
                actorId: userId,
                actorName: 'Carlos Administrador',
                createdAt: issueDate,
              }] : []),
              ...(qs.status === 'APPROVED' ? [{
                id: cuid(),
                fromStatus: 'SENT',
                toStatus: 'APPROVED',
                actorType: 'CLIENT' as const,
                actorName: clienteData.nombre,
                createdAt: new Date(issueDate.getTime() + 3 * 86400000),
              }] : []),
              ...(qs.status === 'REJECTED' ? [{
                id: cuid(),
                fromStatus: 'SENT',
                toStatus: 'REJECTED',
                actorType: 'CLIENT' as const,
                actorName: clienteData.nombre,
                reason: 'Presupuesto excedido para este período',
                createdAt: new Date(issueDate.getTime() + 5 * 86400000),
              }] : []),
            ],
          },
        },
      },
    });
  }
  console.log(`  ✅ ${quoteSpecs.length} quotes created`);

  // ─── 11. Create Recurring Invoice Templates ────────────────────────────
  console.log('🔄 Creating recurring invoice templates...');

  interface RecurringSpec {
    nombre: string;
    clienteIdx: number;
    items: { catalogIdx: number; qty: number }[];
    interval: string;
    anchorDay: number;
  }

  const recurringSpecs: RecurringSpec[] = [
    { nombre: 'Licencia Plan Básico - Farmacia Central', clienteIdx: 4, items: [{ catalogIdx: 0, qty: 1 }], interval: 'MONTHLY', anchorDay: 1 },
    { nombre: 'Licencia Plan Profesional - Distribuidora ABC', clienteIdx: 0, items: [{ catalogIdx: 1, qty: 1 }], interval: 'MONTHLY', anchorDay: 1 },
    { nombre: 'Soporte Premium - Tech Solutions', clienteIdx: 1, items: [{ catalogIdx: 7, qty: 1 }], interval: 'MONTHLY', anchorDay: 15 },
    { nombre: 'Pack PYME - Restaurante El Buen Sabor', clienteIdx: 5, items: [{ catalogIdx: 19, qty: 1 }], interval: 'MONTHLY', anchorDay: 1 },
    { nombre: 'Hosting + SSL - Hotel Vista Real', clienteIdx: 13, items: [{ catalogIdx: 15, qty: 1 }, { catalogIdx: 17, qty: 1 }], interval: 'MONTHLY', anchorDay: 1 },
  ];

  for (const rs of recurringSpecs) {
    const itemsJson = rs.items.map((item, idx) => {
      const catItem = catalogItemsData[item.catalogIdx];
      return {
        numItem: idx + 1,
        tipoItem: catItem.tipoItem,
        cantidad: item.qty,
        codigo: catItem.code,
        uniMedida: catItem.uniMedida,
        descripcion: catItem.name,
        precioUni: catItem.basePrice,
        montoDescu: 0,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada: Math.round(item.qty * catItem.basePrice * 100) / 100,
        tributos: ['20'],
      };
    });

    const nextRun = new Date(2026, 3, rs.anchorDay); // April 2026
    const startDate = new Date(2026, 0, rs.anchorDay); // January 2026

    await prisma.recurringInvoiceTemplate.create({
      data: {
        id: cuid(),
        tenantId: tenant.id,
        nombre: rs.nombre,
        descripcion: `Factura recurrente mensual para ${clientsData[rs.clienteIdx].nombre}`,
        clienteId: clienteIds[rs.clienteIdx],
        tipoDte: '01',
        interval: rs.interval,
        anchorDay: rs.anchorDay,
        mode: 'AUTO_DRAFT',
        autoTransmit: false,
        items: JSON.stringify(itemsJson),
        status: 'ACTIVE',
        nextRunDate: nextRun,
        lastRunDate: new Date(2026, 2, rs.anchorDay), // March 2026
        startDate,
      },
    });
  }
  console.log(`  ✅ ${recurringSpecs.length} recurring templates created`);

  // ─── 12. Create HaciendaConfig ─────────────────────────────────────────
  console.log('⚙️  Creating Hacienda config...');
  const haciendaConfigId = cuid();
  await prisma.haciendaConfig.create({
    data: {
      id: haciendaConfigId,
      tenantId: tenant.id,
      activeEnvironment: 'TEST',
      testingStatus: 'AUTHORIZED',
      environmentConfigs: {
        create: {
          id: cuid(),
          environment: 'TEST',
          isConfigured: true,
          isValidated: true,
          lastValidationAt: new Date(),
        },
      },
    },
  });
  console.log('  ✅ Hacienda config created');

  // ─── Summary ───────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log('✅ Demo tenant seed completed successfully!');
  console.log('═══════════════════════════════════════════');
  console.log(`\n📋 Summary:`);
  console.log(`  Tenant: ${tenant.nombre}`);
  console.log(`  User: ${user.email} / Demo2026!Secure`);
  console.log(`  Clients: ${clientsData.length}`);
  console.log(`  Catalog Items: ${catalogItemsData.length}`);
  console.log(`  DTEs: ${dteSpecs.length}`);
  console.log(`  Journal Entries: ${entryCount}`);
  console.log(`  Quotes: ${quoteSpecs.length}`);
  console.log(`  Recurring Templates: ${recurringSpecs.length}`);
  console.log(`\n🔗 Login at: https://app.facturosv.com/login`);
  console.log(`  Email: admin@demo-facturo.com`);
  console.log(`  Password: Demo2026!Secure\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
