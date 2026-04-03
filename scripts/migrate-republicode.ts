/**
 * Migration Script: Republicode Legacy Data → Facturosv Azure SQL
 *
 * Phase 1: Validate existing tenant
 * Phase 2: Migrate Clientes (7 records)
 * Phase 3: Migrate DTEs (20 records)
 * Phase 4: Validate integrity
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const TENANT_ID = 'cmkwth4ie0001b3hld086ommq'; // Republicode

// ========== CLIENT DATA MAPPING ==========
// From Clientes.csv: Id, Nombre, NumeroNit, NumeroNrc, Correo, Telefono, Direccion, TipoDocumento
interface OldCliente {
  oldId: number;
  nombre: string;
  tipoDocumento: string; // Maps from old TipoDocumento int to MH code
  numDocumento: string;  // NIT cleaned
  nrc: string | null;
  correo: string | null;
  telefono: string | null;
  direccion: string;
}

function parseCsvClientes(): OldCliente[] {
  const csvPath = path.join(__dirname, '..', 'Clientes.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');

  // Parse CSV properly (handle quoted fields)
  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  const clients: OldCliente[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]!);
    // CSV columns: Id,CodCliente,Nombre,Apellido,NumeroDui,NumeroNit,NumeroNrc,Direccion,
    //   Estado,EsEntidadLegal,TipoDocumento,CodDepartamento,CodMunicipio,CodDistrito,
    //   EsExtranjero,EsGranContribuyente,PaisId,ActividadEconomicaId,Telefono,Correo,...

    const oldId = parseInt(fields[0] || '0');
    const nombre = [fields[2], fields[3]].filter(Boolean).join(' ').trim();
    const numeroDui = (fields[4] || '').trim();
    const numeroNit = (fields[5] || '').trim();
    const numeroNrc = (fields[6] || '').trim();
    const direccion = (fields[7] || '').trim();
    const tipoDocumentoOld = parseInt(fields[10] || '0');
    const telefono = (fields[18] || '').trim() || null;
    const correo = (fields[19] || '').trim() || null;

    // Map old TipoDocumento: 1=DUI, 5=NIT
    // In MH system: "36"=NIT, "13"=DUI
    let tipoDocumento = '36'; // Default NIT
    let numDocumento = numeroNit;

    if (tipoDocumentoOld === 1) {
      tipoDocumento = '13'; // DUI
      numDocumento = numeroDui || numeroNit;
    } else {
      tipoDocumento = '36'; // NIT
      numDocumento = numeroNit;
    }

    // Clean NIT: remove hyphens for storage
    numDocumento = numDocumento.replace(/-/g, '');

    clients.push({
      oldId,
      nombre,
      tipoDocumento,
      numDocumento,
      nrc: numeroNrc || null,
      correo,
      telefono,
      direccion: direccion || 'Sin dirección',
    });
  }
  return clients;
}

// ========== DTE DATA ==========
interface OldDte {
  id: number;
  facturaId: number;
  clienteId: number;
  fechaEmision: string;
  codigoGeneracion: string;
  numeroControl: string;
  selloRecibido: string;
  respuestaJson: string;
  jsonEnviado: string;
  tipoDocumento: number;
  estado: number;
  fechaCreacion: string;
}

function loadDteData(): OldDte[] {
  const dataPath = path.join(__dirname, 'migration-dte-data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  return data.documentosElectronicos || [];
}

// Map old estado int to new estado string
function mapEstado(estado: number): string {
  // Old system: 1=PROCESADO, 2=something, 5=PROCESADO, 6=ANULADO (invalidado)
  // Based on the Facturas.csv, Estado 5=emitido+no invalidado, 6=emitido+invalidado
  const map: Record<number, string> = {
    1: 'PROCESADO',
    2: 'PROCESADO',
    3: 'PROCESADO',
    5: 'PROCESADO',
    6: 'ANULADO',
  };
  return map[estado] || 'PROCESADO';
}

// Map old TipoDocumento int to MH tipoDte string
function mapTipoDte(tipoDoc: number): string {
  const map: Record<number, string> = {
    1: '01', // Factura
    2: '03', // Credito Fiscal
    3: '05', // Nota de Credito
    4: '06', // Nota de Debito
    5: '07', // Comprobante de Retencion
    6: '14', // Factura Sujeto Excluido
  };
  return map[tipoDoc] || '03'; // Default CCF
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  MIGRACIÓN REPUBLICODE → FACTUROSV AZURE SQL    ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // ============ PHASE 1: Validate tenant ============
  console.log('📋 FASE 1: Validar tenant Republicode...');
  const tenant = await prisma.tenant.findUnique({ where: { id: TENANT_ID } });
  if (!tenant) {
    throw new Error(`Tenant ${TENANT_ID} no encontrado!`);
  }
  console.log(`  ✓ Tenant: ${tenant.nombre} (${tenant.nit})`);
  console.log(`  ✓ Plan: ${tenant.plan}`);

  const existingClients = await prisma.cliente.count({ where: { tenantId: TENANT_ID } });
  const existingDtes = await prisma.dTE.count({ where: { tenantId: TENANT_ID } });
  console.log(`  ✓ Clientes existentes: ${existingClients}`);
  console.log(`  ✓ DTEs existentes: ${existingDtes}`);
  console.log('');

  // ============ PHASE 2: Migrate Clientes ============
  console.log('👥 FASE 2: Migrar Clientes...');
  const csvClientes = parseCsvClientes();
  console.log(`  Encontrados ${csvClientes.length} clientes en CSV`);

  // Map old client ID → new client ID
  const clientIdMap = new Map<number, string>();

  for (const client of csvClientes) {
    try {
      // Upsert by tenantId + numDocumento (unique constraint)
      const created = await prisma.cliente.upsert({
        where: {
          tenantId_numDocumento: {
            tenantId: TENANT_ID,
            numDocumento: client.numDocumento,
          },
        },
        update: {
          nombre: client.nombre,
          nrc: client.nrc,
          correo: client.correo,
          telefono: client.telefono,
          direccion: client.direccion,
        },
        create: {
          tenantId: TENANT_ID,
          tipoDocumento: client.tipoDocumento,
          numDocumento: client.numDocumento,
          nombre: client.nombre,
          nrc: client.nrc,
          correo: client.correo,
          telefono: client.telefono,
          direccion: client.direccion,
        },
      });
      clientIdMap.set(client.oldId, created.id);
      console.log(`  ✓ [${client.oldId}] ${client.nombre} → ${created.id}`);
    } catch (err) {
      const error = err as Error;
      console.error(`  ✗ [${client.oldId}] ${client.nombre}: ${error.message}`);
    }
  }
  console.log(`  Migrados: ${clientIdMap.size}/${csvClientes.length}`);
  console.log('');

  // ============ PHASE 3: Migrate DTEs ============
  console.log('📄 FASE 3: Migrar DTEs...');
  const dtes = loadDteData();
  console.log(`  Encontrados ${dtes.length} DTEs en datos extraídos`);

  let dteSuccess = 0;
  let dteSkipped = 0;
  let dteFailed = 0;

  for (const dte of dtes) {
    try {
      // Check if already exists by codigoGeneracion
      const existing = await prisma.dTE.findUnique({
        where: { codigoGeneracion: dte.codigoGeneracion },
      });
      if (existing) {
        console.log(`  ⊘ [${dte.id}] ${dte.codigoGeneracion} ya existe, skip`);
        dteSkipped++;
        continue;
      }

      // Also check by numeroControl
      const existingByCtrl = await prisma.dTE.findUnique({
        where: { numeroControl: dte.numeroControl },
      });
      if (existingByCtrl) {
        console.log(`  ⊘ [${dte.id}] ${dte.numeroControl} ya existe, skip`);
        dteSkipped++;
        continue;
      }

      // Parse JSON to extract financial totals
      let jsonData: Record<string, unknown> = {};
      try {
        jsonData = JSON.parse(dte.jsonEnviado);
      } catch {
        console.warn(`  ⚠ [${dte.id}] Could not parse jsonEnviado`);
      }

      const resumen = (jsonData as { resumen?: { totalGravada?: number; montoTotalOperacion?: number; totalPagar?: number } }).resumen;
      const totalGravada = resumen?.totalGravada ?? 0;
      const totalIva = (resumen?.montoTotalOperacion ?? 0) - (resumen?.totalGravada ?? 0);
      const totalPagar = resumen?.totalPagar ?? 0;

      // Get tipoDte from JSON identificacion
      const identificacion = (jsonData as { identificacion?: { tipoDte?: string } }).identificacion;
      const tipoDte = identificacion?.tipoDte || mapTipoDte(dte.tipoDocumento);

      // Map old clienteId to new
      const newClienteId = clientIdMap.get(dte.clienteId) || null;

      // Parse respuestaJson to get selloRecibido and fechaRecepcion
      let selloRecepcion: string | null = null;
      let fechaRecepcion: Date | null = null;
      let codigoMh: string | null = null;
      let descripcionMh: string | null = null;
      try {
        const resp = JSON.parse(dte.respuestaJson);
        selloRecepcion = resp.selloRecibido || dte.selloRecibido || null;
        if (resp.fhProcesamiento) {
          // Format: "14/07/2025 13:16:06" → parse
          const parts = resp.fhProcesamiento.split(' ');
          if (parts[0]) {
            const dateParts = parts[0].split('/');
            if (dateParts.length === 3) {
              const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${parts[1] || '00:00:00'}`;
              fechaRecepcion = new Date(isoDate);
            }
          }
        }
        codigoMh = resp.codigoMsg || null;
        descripcionMh = resp.descripcionMsg || null;
      } catch {
        selloRecepcion = dte.selloRecibido || null;
      }

      const estado = mapEstado(dte.estado);

      await prisma.dTE.create({
        data: {
          tenantId: TENANT_ID,
          clienteId: newClienteId,
          tipoDte,
          codigoGeneracion: dte.codigoGeneracion,
          numeroControl: dte.numeroControl,
          jsonOriginal: dte.jsonEnviado,
          jsonFirmado: null,
          estado,
          selloRecepcion,
          fechaRecepcion,
          codigoMh,
          descripcionMh,
          totalGravada,
          totalIva: totalIva > 0 ? totalIva : 0,
          totalPagar,
          intentosEnvio: estado === 'PROCESADO' ? 1 : 0,
          createdAt: new Date(dte.fechaCreacion),
        },
      });

      dteSuccess++;
      console.log(`  ✓ [${dte.id}] ${dte.numeroControl} (${tipoDte}) → ${estado} $${totalPagar}`);
    } catch (err) {
      const error = err as Error;
      dteFailed++;
      console.error(`  ✗ [${dte.id}] ${dte.codigoGeneracion}: ${error.message}`);
    }
  }

  console.log(`  Creados: ${dteSuccess} | Skipped: ${dteSkipped} | Fallidos: ${dteFailed}`);
  console.log('');

  // ============ PHASE 4: Validate ============
  console.log('🔍 FASE 4: Validación de integridad...');

  const finalClients = await prisma.cliente.count({ where: { tenantId: TENANT_ID } });
  const finalDtes = await prisma.dTE.count({ where: { tenantId: TENANT_ID } });
  const procesados = await prisma.dTE.count({ where: { tenantId: TENANT_ID, estado: 'PROCESADO' } });
  const anulados = await prisma.dTE.count({ where: { tenantId: TENANT_ID, estado: 'ANULADO' } });

  // Check orphan DTEs (clienteId not null but doesn't match any client)
  const dtesWithClient = await prisma.dTE.count({
    where: { tenantId: TENANT_ID, clienteId: { not: null } },
  });

  // Get financial summary
  const dtesAll = await prisma.dTE.findMany({
    where: { tenantId: TENANT_ID },
    select: { totalPagar: true, estado: true, tipoDte: true, createdAt: true },
  });

  let totalFacturado = 0;
  const tipoCounts: Record<string, number> = {};
  for (const d of dtesAll) {
    totalFacturado += Number(d.totalPagar);
    const key = d.tipoDte;
    tipoCounts[key] = (tipoCounts[key] || 0) + 1;
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║           REPORTE DE MIGRACIÓN                  ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Tenant: ${tenant.nombre.padEnd(38)}║`);
  console.log(`║  NIT: ${tenant.nit.padEnd(41)}║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Clientes migrados:    ${String(finalClients).padStart(5)}                     ║`);
  console.log(`║  DTEs migrados:        ${String(finalDtes).padStart(5)}                     ║`);
  console.log(`║    - Procesados:       ${String(procesados).padStart(5)}                     ║`);
  console.log(`║    - Anulados:         ${String(anulados).padStart(5)}                     ║`);
  console.log(`║  DTEs con cliente:     ${String(dtesWithClient).padStart(5)}                     ║`);
  console.log(`║  Total facturado:  $${totalFacturado.toFixed(2).padStart(10)}                  ║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  DTEs por tipo:                                 ║');
  for (const [tipo, count] of Object.entries(tipoCounts)) {
    const label = tipo === '03' ? 'CCF' : tipo === '01' ? 'Factura' : tipo === '05' ? 'NC' : tipo;
    console.log(`║    ${label.padEnd(20)} ${String(count).padStart(5)}                     ║`);
  }
  console.log('╠══════════════════════════════════════════════════╣');

  // Integrity checks
  let issues = 0;

  if (finalClients !== csvClientes.length) {
    console.log(`║  ⚠ Clientes: esperados ${csvClientes.length}, migrados ${finalClients}    ║`);
    issues++;
  } else {
    console.log(`║  ✓ Clientes: ${finalClients}/${csvClientes.length} OK                       ║`);
  }

  if (finalDtes !== dtes.length) {
    console.log(`║  ⚠ DTEs: esperados ${dtes.length}, migrados ${finalDtes}               ║`);
    issues++;
  } else {
    console.log(`║  ✓ DTEs: ${finalDtes}/${dtes.length} OK                               ║`);
  }

  if (issues === 0) {
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║  ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE           ║');
  } else {
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  ⚠  MIGRACIÓN CON ${issues} ADVERTENCIA(S)              ║`);
  }
  console.log('╚══════════════════════════════════════════════════╝');
}

main()
  .catch((err) => {
    console.error('FATAL:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
