/**
 * Reporte de Clientes - Facturosv.com
 * Genera reporte post-limpieza en JSON, CSV y HTML.
 *
 * Run: npx tsx scripts/reporte-clientes.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });

const prisma = new PrismaClient();
const OUTPUT_DIR = path.resolve(__dirname, '../outputs');

const DTE_TYPE_LABELS: Record<string, string> = {
  '01': 'Factura',
  '03': 'Comprobante de Crédito Fiscal',
  '05': 'Nota de Crédito',
  '06': 'Nota de Débito',
  '11': 'Factura de Exportación',
  '14': 'Factura de Sujeto Excluido',
};

interface DteRow {
  empresa: string;
  cliente: string;
  tipoDte: string;
  tipoLabel: string;
  numeroControl: string;
  concepto: string;
  totalGravada: number;
  totalIva: number;
  totalPagar: number;
  estado: string;
  fecha: string;
}

function extractConcepto(jsonOriginal: string): string {
  try {
    const parsed = JSON.parse(jsonOriginal);
    // cuerpoDocumento contains the line items
    const cuerpo = parsed.cuerpoDocumento;
    if (Array.isArray(cuerpo) && cuerpo.length > 0) {
      const descriptions = cuerpo
        .map((item: Record<string, unknown>) => item.descripcion || item.descripción || '')
        .filter(Boolean);
      if (descriptions.length === 1) return descriptions[0] as string;
      if (descriptions.length > 1) {
        const first = descriptions[0] as string;
        return `${first} (+${descriptions.length - 1} más)`;
      }
    }
  } catch {
    // jsonOriginal might not parse
  }
  return 'N/A';
}

async function generateReport(): Promise<void> {
  console.log('\n=== GENERANDO REPORTE DE CLIENTES ===\n');

  // Fetch all valid DTEs with relations
  const dtes = await prisma.dTE.findMany({
    where: {
      estado: { not: 'ANULADO' },
    },
    select: {
      tipoDte: true,
      numeroControl: true,
      totalGravada: true,
      totalIva: true,
      totalPagar: true,
      estado: true,
      createdAt: true,
      jsonOriginal: true,
      tenant: { select: { nombre: true, nombreComercial: true } },
      cliente: { select: { nombre: true } },
    },
    orderBy: [
      { tenant: { nombre: 'asc' } },
      { createdAt: 'desc' },
    ],
  });

  console.log(`  DTEs encontrados: ${dtes.length}`);

  // Also count anulados for the summary
  const anuladosCount = await prisma.dTE.count({ where: { estado: 'ANULADO' } });

  // Map to report rows
  const rows: DteRow[] = dtes.map((d) => ({
    empresa: d.tenant.nombreComercial || d.tenant.nombre,
    cliente: d.cliente?.nombre || 'Consumidor Final',
    tipoDte: d.tipoDte,
    tipoLabel: DTE_TYPE_LABELS[d.tipoDte] || `Tipo ${d.tipoDte}`,
    numeroControl: d.numeroControl,
    concepto: extractConcepto(d.jsonOriginal),
    totalGravada: Number(d.totalGravada),
    totalIva: Number(d.totalIva),
    totalPagar: Number(d.totalPagar),
    estado: d.estado,
    fecha: d.createdAt.toISOString().slice(0, 10),
  }));

  // Summary
  const totalVentas = rows.reduce((sum, r) => sum + r.totalPagar, 0);
  const totalIva = rows.reduce((sum, r) => sum + r.totalIva, 0);
  const totalGravada = rows.reduce((sum, r) => sum + r.totalGravada, 0);

  // Unique clients
  const uniqueClients = [...new Set(rows.map((r) => r.cliente))];
  // Unique empresas
  const uniqueEmpresas = [...new Set(rows.map((r) => r.empresa))];

  const summary = {
    timestamp: new Date().toISOString(),
    fechaCorte: new Date().toISOString().slice(0, 10),
    totalDtes: rows.length,
    dtesAnulados: anuladosCount,
    totalEmpresas: uniqueEmpresas.length,
    totalClientes: uniqueClients.length,
    totalGravada: Math.round(totalGravada * 100) / 100,
    totalIva: Math.round(totalIva * 100) / 100,
    totalVentas: Math.round(totalVentas * 100) / 100,
  };

  console.log(`\n  Resumen:`);
  console.log(`    Empresas emisoras: ${summary.totalEmpresas}`);
  console.log(`    Clientes únicos:   ${summary.totalClientes}`);
  console.log(`    DTEs válidos:      ${summary.totalDtes}`);
  console.log(`    DTEs anulados:     ${summary.dtesAnulados}`);
  console.log(`    Total gravada:     $${summary.totalGravada.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`    Total IVA:         $${summary.totalIva.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`    Total ventas:      $${summary.totalVentas.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

  // Print table to console
  console.log('\n  --- DETALLE POR EMPRESA ---\n');

  for (const empresa of uniqueEmpresas) {
    const empresaRows = rows.filter((r) => r.empresa === empresa);
    const empresaTotal = empresaRows.reduce((s, r) => s + r.totalPagar, 0);
    console.log(`  📋 ${empresa} (${empresaRows.length} DTEs, Total: $${empresaTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })})`);
    for (const r of empresaRows) {
      console.log(
        `     ${r.tipoDte} | ${r.numeroControl.padEnd(35)} | ${r.cliente.substring(0, 40).padEnd(40)} | $${r.totalPagar.toFixed(2).padStart(12)} | ${r.fecha} | ${r.concepto.substring(0, 50)}`,
      );
    }
    console.log('');
  }

  // --- Generate outputs ---
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. JSON
  const jsonData = { summary, empresas: uniqueEmpresas.map((emp) => {
    const empRows = rows.filter((r) => r.empresa === emp);
    return {
      nombre: emp,
      totalDtes: empRows.length,
      totalVentas: Math.round(empRows.reduce((s, r) => s + r.totalPagar, 0) * 100) / 100,
      dtes: empRows.map((r) => ({
        cliente: r.cliente,
        tipo: r.tipoDte,
        tipoLabel: r.tipoLabel,
        numero: r.numeroControl,
        concepto: r.concepto,
        gravada: r.totalGravada,
        iva: r.totalIva,
        total: r.totalPagar,
        estado: r.estado,
        fecha: r.fecha,
      })),
    };
  })};

  fs.writeFileSync(path.join(OUTPUT_DIR, 'reporte-clientes.json'), JSON.stringify(jsonData, null, 2));
  console.log('  📄 reporte-clientes.json generado');

  // 2. CSV
  const csvHeader = 'Empresa,Cliente,Tipo DTE,Tipo,Numero Control,Concepto,Gravada,IVA,Total,Estado,Fecha';
  const csvRows = rows.map((r) =>
    [
      csvQuote(r.empresa),
      csvQuote(r.cliente),
      r.tipoDte,
      csvQuote(r.tipoLabel),
      csvQuote(r.numeroControl),
      csvQuote(r.concepto),
      r.totalGravada.toFixed(2),
      r.totalIva.toFixed(2),
      r.totalPagar.toFixed(2),
      r.estado,
      r.fecha,
    ].join(','),
  );
  fs.writeFileSync(path.join(OUTPUT_DIR, 'reporte-clientes.csv'), '\uFEFF' + [csvHeader, ...csvRows].join('\n'));
  console.log('  📄 reporte-clientes.csv generado');

  // 3. HTML
  const html = generateHtml(summary, rows, uniqueEmpresas);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'reporte-clientes.html'), html);
  console.log('  📄 reporte-clientes.html generado');

  console.log(`\n  ✅ Archivos generados en ${OUTPUT_DIR}/`);
}

function csvQuote(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
}

function generateHtml(
  summary: Record<string, unknown>,
  rows: DteRow[],
  empresas: string[],
): string {
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const empresaSections = empresas
    .map((emp) => {
      const empRows = rows.filter((r) => r.empresa === emp);
      const empTotal = empRows.reduce((s, r) => s + r.totalPagar, 0);
      const tableRows = empRows
        .map(
          (r) => `
        <tr>
          <td>${escHtml(r.cliente)}</td>
          <td><span class="badge tipo-${r.tipoDte}">${r.tipoDte}</span> ${escHtml(r.tipoLabel)}</td>
          <td class="mono">${escHtml(r.numeroControl)}</td>
          <td>${escHtml(r.concepto)}</td>
          <td class="num">$${fmt(r.totalGravada)}</td>
          <td class="num">$${fmt(r.totalIva)}</td>
          <td class="num total">$${fmt(r.totalPagar)}</td>
          <td><span class="estado ${r.estado.toLowerCase()}">${r.estado}</span></td>
          <td>${r.fecha}</td>
        </tr>`,
        )
        .join('');

      return `
      <div class="empresa-section">
        <h2>${escHtml(emp)} <span class="empresa-stats">${empRows.length} DTEs &mdash; Total: $${fmt(empTotal)}</span></h2>
        <table>
          <thead>
            <tr>
              <th>Cliente</th><th>Tipo DTE</th><th>Numero Control</th><th>Concepto</th>
              <th>Gravada</th><th>IVA</th><th>Total</th><th>Estado</th><th>Fecha</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="6" class="total-label">Total ${escHtml(emp)}</td>
              <td class="num total">$${fmt(empTotal)}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reporte de Clientes - Facturosv.com</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; padding: 24px; }
  .header { text-align: center; margin-bottom: 32px; }
  .header h1 { font-size: 24px; color: #1a1a2e; }
  .header .subtitle { color: #666; margin-top: 4px; }
  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; max-width: 900px; margin-left: auto; margin-right: auto; }
  .summary-card { background: #fff; border-radius: 8px; padding: 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .summary-card .label { font-size: 12px; text-transform: uppercase; color: #888; }
  .summary-card .value { font-size: 24px; font-weight: 700; color: #1a1a2e; margin-top: 4px; }
  .summary-card .value.money { color: #16a34a; }
  .empresa-section { background: #fff; border-radius: 8px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow-x: auto; }
  .empresa-section h2 { font-size: 18px; margin-bottom: 16px; color: #1a1a2e; }
  .empresa-stats { font-size: 14px; font-weight: 400; color: #888; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f8f9fa; padding: 8px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; white-space: nowrap; }
  td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
  tr:hover td { background: #f8f9fa; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .total { font-weight: 700; }
  .total-label { text-align: right; font-weight: 700; }
  .mono { font-family: 'SF Mono', monospace; font-size: 12px; }
  .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; color: #fff; }
  .tipo-01 { background: #3b82f6; }
  .tipo-03 { background: #8b5cf6; }
  .tipo-05 { background: #ef4444; }
  .tipo-06 { background: #f59e0b; }
  .tipo-11 { background: #06b6d4; }
  .tipo-14 { background: #10b981; }
  .estado { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px; }
  .estado.procesado { background: #dcfce7; color: #166534; }
  .estado.pendiente { background: #fef3c7; color: #92400e; }
  .estado.rechazado, .estado.error { background: #fee2e2; color: #991b1b; }
  tfoot td { border-top: 2px solid #e5e7eb; background: #f8f9fa; }
  .footer { text-align: center; color: #999; font-size: 12px; margin-top: 32px; }
</style>
</head>
<body>
  <div class="header">
    <h1>Reporte de Clientes - Facturosv.com</h1>
    <div class="subtitle">Fecha de corte: ${summary.fechaCorte} | Generado: ${new Date().toISOString()}</div>
  </div>

  <div class="summary">
    <div class="summary-card"><div class="label">Empresas</div><div class="value">${summary.totalEmpresas}</div></div>
    <div class="summary-card"><div class="label">Clientes</div><div class="value">${summary.totalClientes}</div></div>
    <div class="summary-card"><div class="label">DTEs Validos</div><div class="value">${summary.totalDtes}</div></div>
    <div class="summary-card"><div class="label">Total Ventas</div><div class="value money">$${fmt(summary.totalVentas as number)}</div></div>
  </div>

  ${empresaSections}

  <div class="footer">Facturosv.com &mdash; Reporte generado automaticamente</div>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function main(): Promise<void> {
  try {
    await generateReport();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
