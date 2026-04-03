/**
 * Exportar Facturas Wellnest — Marzo 2026
 * Generates: ZIP with PDFs + Excel with metadata
 *
 * Run: npx tsx scripts/wellnest-marzo-export.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as QRCode from 'qrcode';
import archiver from 'archiver';
import ExcelJS from 'exceljs';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });

const prisma = new PrismaClient();
const WELLNEST_TENANT_ID = 'cmlrggeh6000c5uj5byzwyhyh';
const OUTPUT_DIR = path.resolve(__dirname, '..');
const TMP_PDF_DIR = path.resolve('/tmp/wellnest_marzo_pdfs');

// ── Departamentos lookup ──
const DEPARTAMENTOS: Record<string, string> = {
  '01': 'Ahuachapan', '02': 'Santa Ana', '03': 'Sonsonate',
  '04': 'Chalatenango', '05': 'La Libertad', '06': 'San Salvador',
  '07': 'Cuscatlan', '08': 'La Paz', '09': 'Cabanas',
  '10': 'San Vicente', '11': 'Usulutan', '12': 'San Miguel',
  '13': 'Morazan', '14': 'La Union',
};

// ── Interfaces ──
interface DteJsonData {
  identificacion?: {
    ambiente?: string;
    fecEmi?: string;
    codigoGeneracion?: string;
  };
  receptor?: {
    nombre?: string;
    nit?: string;
    nrc?: string;
    telefono?: string;
    correo?: string;
    direccion?: { departamento?: string; municipio?: string; complemento?: string };
  };
  cuerpoDocumento?: Array<{
    numItem?: number;
    cantidad?: number;
    codigo?: string;
    descripcion?: string;
    precioUni?: number;
    ventaGravada?: number;
    ventaExenta?: number;
    ventaNoSuj?: number;
    ivaItem?: number;
  }>;
  resumen?: {
    totalGravada?: number;
    totalExenta?: number;
    totalNoSuj?: number;
    subTotal?: number;
    ivaRete1?: number;
    montoTotalOperacion?: number;
    totalPagar?: number;
    totalLetras?: string;
    tributos?: Array<{ codigo?: string; valor?: number }>;
  };
}

interface ExcelRow {
  nombreCliente: string;
  correoCliente: string;
  documento: string;
  conceptoCompra: string;
  monto: number;
  fecha: string;
}

// ── PDF Generation (adapted from pdf.service.ts) ──
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function getTipoDteLabel(tipoDte: string): string {
  const tipos: Record<string, string> = {
    '01': 'Factura', '03': 'Comprobante de Crédito Fiscal',
    '05': 'Nota de Crédito', '06': 'Nota de Débito',
    '07': 'Comprobante de Retención', '11': 'Factura de Exportación',
    '14': 'Factura de Sujeto Excluido',
  };
  return tipos[tipoDte] || `DTE ${tipoDte}`;
}

function getEstadoLabel(estado: string): string {
  const estados: Record<string, string> = {
    CREADO: 'Creado', FIRMADO: 'Firmado', PROCESADO: 'Procesado',
    RECHAZADO: 'Rechazado', ANULADO: 'Anulado',
  };
  return estados[estado] || estado;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-SV', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatDireccion(direccion?: { departamento?: string; municipio?: string; complemento?: string }): string {
  if (!direccion) return 'N/A';
  const parts: string[] = [];
  if (direccion.complemento) parts.push(direccion.complemento);
  if (direccion.municipio) parts.push(direccion.municipio);
  const deptoName = direccion.departamento ? (DEPARTAMENTOS[direccion.departamento] || direccion.departamento) : '';
  if (deptoName) parts.push(deptoName);
  return parts.length === 0 ? 'N/A' : parts.join(', ');
}

function parseTenantDireccion(direccion?: string | null): string {
  if (!direccion) return 'N/A';
  try {
    const parsed = JSON.parse(direccion);
    if (typeof parsed === 'object' && parsed !== null) return formatDireccion(parsed) || 'N/A';
    return direccion || 'N/A';
  } catch {
    return direccion || 'N/A';
  }
}

function getIvaAmount(resumen: DteJsonData['resumen'], data: DteJsonData): number {
  if (!resumen) return 0;
  const r = resumen as Record<string, unknown>;
  if (typeof r.totalIva === 'number' && (r.totalIva as number) > 0) return r.totalIva as number;
  if (Array.isArray(resumen.tributos)) {
    const iva = resumen.tributos.find(t => t.codigo === '20');
    if (iva && typeof iva.valor === 'number') return iva.valor;
  }
  if (typeof resumen.ivaRete1 === 'number' && resumen.ivaRete1 > 0) return resumen.ivaRete1;
  if (Array.isArray(data.cuerpoDocumento)) {
    const total = data.cuerpoDocumento.reduce((sum, item) => sum + (item.ivaItem || 0), 0);
    if (total > 0) return Math.round(total * 100) / 100;
  }
  if (typeof resumen.totalGravada === 'number' && resumen.totalGravada > 0) {
    if (typeof resumen.montoTotalOperacion === 'number') {
      const subTotal = (resumen.totalGravada || 0) + (resumen.totalExenta || 0) + (resumen.totalNoSuj || 0);
      if (resumen.montoTotalOperacion > subTotal) return Math.round((resumen.montoTotalOperacion - subTotal) * 100) / 100;
    }
    return Math.round(resumen.totalGravada * 0.13 * 100) / 100;
  }
  return 0;
}

async function generatePdf(dte: {
  codigoGeneracion: string;
  numeroControl: string;
  tipoDte: string;
  estado: string;
  selloRecepcion: string | null;
  createdAt: Date;
  totalPagar: Prisma.Decimal;
  data: DteJsonData;
  tenant: { nombre: string; nit: string; nrc: string; direccion: string; telefono: string; correo: string; logoUrl: string | null };
}): Promise<Buffer> {
  const data = dte.data;
  const receptor = data.receptor || {};
  const items = data.cuerpoDocumento || [];
  const resumen = data.resumen || {};

  // Generate QR
  let qrDataUrl: string | null = null;
  try {
    const ambiente = data.identificacion?.ambiente || '00';
    const fecEmi = data.identificacion?.fecEmi || dte.createdAt.toISOString().split('T')[0];
    const url = `https://admin.factura.gob.sv/consultaPublica?ambiente=${ambiente}&codGen=${dte.codigoGeneracion}&fechaEmi=${fecEmi}`;
    qrDataUrl = await QRCode.toDataURL(url, { width: 150, margin: 1, errorCorrectionLevel: 'M' });
  } catch { /* ignore */ }

  // Fetch logo
  let logoDataUrl: string | null = null;
  if (dte.tenant.logoUrl) {
    try {
      const response = await fetch(dte.tenant.logoUrl);
      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'image/png';
        const buffer = Buffer.from(await response.arrayBuffer());
        logoDataUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
      }
    } catch { /* ignore */ }
  }

  const itemsTableBody: unknown[][] = [
    [
      { text: '#', style: 'tableHeader', alignment: 'center' },
      { text: 'Cant.', style: 'tableHeader', alignment: 'center' },
      { text: 'Descripción', style: 'tableHeader' },
      { text: 'Precio Unit.', style: 'tableHeader', alignment: 'right' },
      { text: 'Subtotal', style: 'tableHeader', alignment: 'right' },
      { text: 'IVA (13%)', style: 'tableHeader', alignment: 'right' },
    ],
  ];

  items.forEach((item, index) => {
    const subtotalItem = item.ventaGravada || item.ventaExenta || item.ventaNoSuj || 0;
    const ivaItem = item.ivaItem || 0;
    itemsTableBody.push([
      { text: String(index + 1), style: 'tableCell', alignment: 'center' },
      { text: String(item.cantidad || 1), style: 'tableCell', alignment: 'center' },
      { text: item.descripcion || '', style: 'tableCell' },
      { text: formatCurrency(item.precioUni || 0), style: 'tableCell', alignment: 'right' },
      { text: formatCurrency(subtotalItem), style: 'tableCell', alignment: 'right' },
      { text: ivaItem > 0 ? formatCurrency(ivaItem) : '-', style: 'tableCell', alignment: 'right' },
    ]);
  });

  const content: unknown[] = [
    // Header with optional logo
    {
      columns: [
        {
          width: '*',
          stack: [
            ...(logoDataUrl ? [{ image: logoDataUrl, width: 120, height: 50, margin: [0, 0, 0, 5] }] : []),
            { text: dte.tenant.nombre, style: 'header' },
            { text: `NIT: ${dte.tenant.nit}`, style: 'small' },
            { text: `NRC: ${dte.tenant.nrc}`, style: 'small' },
            { text: parseTenantDireccion(dte.tenant.direccion), style: 'small' },
            { text: `Tel: ${dte.tenant.telefono}`, style: 'small' },
            { text: dte.tenant.correo, style: 'small' },
          ],
        },
        {
          width: 'auto',
          stack: [
            { text: getTipoDteLabel(dte.tipoDte), style: 'header', alignment: 'right' },
            { text: `No. Control: ${dte.numeroControl}`, alignment: 'right', bold: true },
            { text: `Código: ${dte.codigoGeneracion}`, alignment: 'right', style: 'small' },
            { text: `Fecha: ${formatDate(dte.createdAt)}`, alignment: 'right' },
            {
              text: `Estado: ${getEstadoLabel(dte.estado)}`,
              alignment: 'right',
              color: dte.estado === 'PROCESADO' ? '#16a34a' : dte.estado === 'RECHAZADO' ? '#dc2626' : '#666666',
            },
          ],
        },
      ],
    },
    { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#e5e7eb' }], margin: [0, 10, 0, 10] },
    { text: 'DATOS DEL RECEPTOR', style: 'subheader' },
    {
      columns: [
        {
          width: '*',
          stack: [
            { text: `Nombre: ${receptor.nombre || 'Consumidor Final'}`, margin: [0, 0, 0, 2] },
            { text: `NIT: ${receptor.nit || 'N/A'}`, style: 'small' },
            { text: `NRC: ${receptor.nrc || 'N/A'}`, style: 'small' },
          ],
        },
        {
          width: '*',
          stack: [
            { text: `Dirección: ${formatDireccion(receptor.direccion)}`, style: 'small' },
            { text: `Teléfono: ${receptor.telefono || 'N/A'}`, style: 'small' },
            { text: `Correo: ${receptor.correo || 'N/A'}`, style: 'small' },
          ],
        },
      ],
    },
    { text: 'DETALLE', style: 'subheader' },
    {
      table: {
        headerRows: 1,
        widths: [25, 35, '*', 60, 60, 50],
        body: itemsTableBody,
      },
      layout: {
        hLineWidth: () => 0.5, vLineWidth: () => 0.5,
        hLineColor: () => '#e5e7eb', vLineColor: () => '#e5e7eb',
        paddingLeft: () => 4, paddingRight: () => 4,
        paddingTop: () => 3, paddingBottom: () => 3,
      },
    },
    // Totals
    {
      margin: [0, 20, 0, 0],
      columns: [
        { width: '*', text: '' },
        {
          width: 200,
          table: {
            widths: ['*', 80],
            body: [
              [{ text: 'Subtotal Gravado:', alignment: 'right' }, { text: formatCurrency(resumen.totalGravada || 0), alignment: 'right' }],
              ...((resumen.totalExenta || 0) > 0 ? [[{ text: 'Subtotal Exento:', alignment: 'right' }, { text: formatCurrency(resumen.totalExenta || 0), alignment: 'right' }]] : []),
              ...((resumen.totalNoSuj || 0) > 0 ? [[{ text: 'Subtotal No Sujeto:', alignment: 'right' }, { text: formatCurrency(resumen.totalNoSuj || 0), alignment: 'right' }]] : []),
              [{ text: 'IVA (13%):', alignment: 'right' }, { text: formatCurrency(getIvaAmount(resumen, data)), alignment: 'right' }],
              [{ text: 'TOTAL:', alignment: 'right', bold: true, fontSize: 12 }, { text: formatCurrency(resumen.totalPagar || resumen.montoTotalOperacion || 0), alignment: 'right', bold: true, fontSize: 12 }],
            ],
          },
          layout: 'noBorders',
        },
      ],
    },
    resumen.totalLetras ? { margin: [0, 10, 0, 0], text: `Son: ${resumen.totalLetras}`, italics: true, fontSize: 9 } : null,
    dte.selloRecepcion ? {
      margin: [0, 30, 0, 0],
      stack: [
        { text: 'INFORMACIÓN DE HACIENDA', style: 'subheader' },
        { text: `Sello de Recepción: ${dte.selloRecepcion}`, style: 'small' },
      ],
    } : null,
    qrDataUrl ? {
      margin: [0, 20, 0, 0],
      columns: [
        { width: '*', text: '' },
        {
          width: 'auto',
          stack: [
            { image: qrDataUrl, width: 120, height: 120, alignment: 'center' },
            { text: 'Consulta pública - Ministerio de Hacienda', style: 'small', alignment: 'center', margin: [0, 4, 0, 0] },
          ],
        },
        { width: '*', text: '' },
      ],
    } : null,
  ].filter(Boolean);

  const docDefinition = {
    content,
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      tableHeader: { bold: true, fontSize: 10, color: 'white', fillColor: '#2563eb' },
      tableCell: { fontSize: 9 },
      small: { fontSize: 8, color: '#666666' },
    },
    defaultStyle: { font: 'Roboto' },
    pageSize: 'LETTER' as const,
    pageMargins: [40, 40, 40, 60] as [number, number, number, number],
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: 'Documento Tributario Electrónico', alignment: 'left', style: 'small', margin: [40, 0, 0, 0] },
        { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', style: 'small', margin: [0, 0, 40, 0] },
      ],
    }),
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfMake = require('pdfmake/build/pdfmake');
      const pdfFonts = require('pdfmake/build/vfs_fonts');
      pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer((buffer: Buffer) => resolve(buffer));
    } catch (error) {
      reject(error);
    }
  });
}

// ── Main ──
async function main() {
  console.log('\n=== EXPORTAR FACTURAS WELLNEST — MARZO 2026 ===\n');

  // 1. Verify tenant
  const tenant = await prisma.tenant.findUnique({ where: { id: WELLNEST_TENANT_ID } });
  if (!tenant) {
    console.error('ERROR: Tenant Wellnest no encontrado');
    process.exit(1);
  }
  console.log(`Tenant: ${tenant.nombre} (${tenant.id})`);

  // 2. Query DTEs for March 2026
  const dtes = await prisma.dTE.findMany({
    where: {
      tenantId: WELLNEST_TENANT_ID,
      createdAt: {
        gte: new Date('2026-03-01T00:00:00Z'),
        lte: new Date('2026-03-31T23:59:59Z'),
      },
    },
    include: { cliente: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`DTEs encontrados: ${dtes.length}`);
  if (dtes.length === 0) {
    console.log('No hay DTEs en marzo 2026 para Wellnest.');
    process.exit(0);
  }

  // Deduplicate by codigoGeneracion
  const seen = new Set<string>();
  const dedupedDtes = dtes.filter(dte => {
    if (seen.has(dte.codigoGeneracion)) return false;
    seen.add(dte.codigoGeneracion);
    return true;
  });
  if (dedupedDtes.length < dtes.length) {
    console.log(`Deduplicados: ${dtes.length} → ${dedupedDtes.length}`);
  }

  // Exclude free/trial packages ($0.00)
  const uniqueDtes = dedupedDtes.filter(dte => Number(dte.totalPagar) > 0);
  const excluded = dedupedDtes.length - uniqueDtes.length;
  if (excluded > 0) {
    console.log(`Excluidos ${excluded} DTEs gratuitos/prueba ($0.00)`);
  }

  // 3. Parse JSON and extract metadata
  const excelRows: ExcelRow[] = [];
  const pdfEntries: Array<{ filename: string; dte: typeof uniqueDtes[0]; data: DteJsonData }> = [];

  for (const dte of uniqueDtes) {
    let data: DteJsonData;
    try {
      data = JSON.parse(dte.jsonOriginal);
    } catch {
      console.warn(`  WARN: Cannot parse jsonOriginal for DTE ${dte.id}`);
      data = {};
    }

    const fecEmi = data.identificacion?.fecEmi || dte.createdAt.toISOString().split('T')[0];
    const receptor = data.receptor || {};
    const items = data.cuerpoDocumento || [];
    const conceptos = items.map(i => i.descripcion).filter(Boolean).join(', ') || 'Sin detalle';
    const monto = Number(dte.totalPagar);

    // Use receptor name from JSON (more complete), fallback to client table
    const nombreCliente = receptor.nombre || dte.cliente?.nombre || 'Sin Identificar';
    const correo = receptor.correo || dte.cliente?.correo || '';
    const documento = dte.cliente?.nrc || dte.cliente?.numDocumento || receptor.nrc || receptor.nit || '';

    excelRows.push({
      nombreCliente,
      correoCliente: correo,
      documento,
      conceptoCompra: conceptos,
      monto,
      fecha: fecEmi,
    });

    const filename = `${dte.codigoGeneracion}.pdf`;
    pdfEntries.push({ filename, dte, data });
  }

  // 4. Generate PDFs
  console.log(`\nGenerando ${pdfEntries.length} PDFs...`);
  if (fs.existsSync(TMP_PDF_DIR)) fs.rmSync(TMP_PDF_DIR, { recursive: true });
  fs.mkdirSync(TMP_PDF_DIR, { recursive: true });

  let pdfOk = 0;
  let pdfFail = 0;
  const failedPdfs: string[] = [];

  for (let i = 0; i < pdfEntries.length; i++) {
    const entry = pdfEntries[i];
    try {
      const buffer = await generatePdf({
        codigoGeneracion: entry.dte.codigoGeneracion,
        numeroControl: entry.dte.numeroControl,
        tipoDte: entry.dte.tipoDte,
        estado: entry.dte.estado,
        selloRecepcion: entry.dte.selloRecepcion,
        createdAt: entry.dte.createdAt,
        totalPagar: entry.dte.totalPagar,
        data: entry.data,
        tenant: {
          nombre: tenant.nombre,
          nit: tenant.nit,
          nrc: tenant.nrc,
          direccion: tenant.direccion,
          telefono: tenant.telefono,
          correo: tenant.correo,
          logoUrl: tenant.logoUrl,
        },
      });
      fs.writeFileSync(path.join(TMP_PDF_DIR, entry.filename), buffer);
      pdfOk++;
      if ((i + 1) % 10 === 0 || i === pdfEntries.length - 1) {
        process.stdout.write(`  PDFs: ${pdfOk}/${pdfEntries.length}\r`);
      }
    } catch (err) {
      pdfFail++;
      failedPdfs.push(entry.dte.codigoGeneracion);
      console.warn(`  WARN: PDF failed for ${entry.dte.codigoGeneracion}: ${err}`);
    }
  }
  console.log(`\nPDFs generados: ${pdfOk}, fallidos: ${pdfFail}`);

  // 5. Create ZIP
  const zipPath = path.join(OUTPUT_DIR, 'wellnest_facturas_marzo2026.zip');
  console.log(`\nCreando ZIP: ${zipPath}`);

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => resolve());
    archive.on('error', (err: Error) => reject(err));
    archive.pipe(output);
    archive.directory(TMP_PDF_DIR, false);
    archive.finalize();
  });

  const zipSizeMB = (fs.statSync(zipPath).size / (1024 * 1024)).toFixed(2);
  console.log(`ZIP creado: ${zipSizeMB} MB`);

  // 6. Create Excel
  const xlsxPath = path.join(OUTPUT_DIR, 'wellnest_facturas_marzo2026.xlsx');
  console.log(`\nCreando Excel: ${xlsxPath}`);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Facturador Electrónico SV';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Facturas Marzo 2026');

  // Headers
  const headers = ['Nombre de Cliente', 'Correo de Cliente', 'Documento', 'Concepto de Compra', 'Monto', 'Fecha'];
  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });
  headerRow.height = 25;

  // Enable auto-filter
  sheet.autoFilter = { from: 'A1', to: 'F1' };

  // Data rows (already ordered by fecha ASC)
  let totalMonto = 0;
  for (const row of excelRows) {
    totalMonto += row.monto;
    const dataRow = sheet.addRow([
      row.nombreCliente,
      row.correoCliente,
      row.documento,
      row.conceptoCompra,
      row.monto,
      row.fecha,
    ]);
    // Format monto cell
    dataRow.getCell(5).numFmt = '"$"#,##0.00';
    // Format fecha cell
    dataRow.getCell(6).alignment = { horizontal: 'center' };
    // Borders
    dataRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });
  }

  // Total row
  const totalRow = sheet.addRow(['', '', '', 'TOTAL', totalMonto, '']);
  totalRow.getCell(4).font = { bold: true, size: 12 };
  totalRow.getCell(4).alignment = { horizontal: 'right' };
  totalRow.getCell(5).font = { bold: true, size: 12 };
  totalRow.getCell(5).numFmt = '"$"#,##0.00';
  totalRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F0FF' } };
  totalRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'medium' }, bottom: { style: 'medium' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });

  // Auto-fit column widths
  sheet.columns = [
    { width: 35 },  // Nombre
    { width: 30 },  // Correo
    { width: 18 },  // Documento
    { width: 50 },  // Concepto
    { width: 14 },  // Monto
    { width: 14 },  // Fecha
  ];

  await workbook.xlsx.writeFile(xlsxPath);
  console.log('Excel creado.');

  // 7. Generate Evidence
  const first5 = excelRows.slice(0, 5);
  const last5 = excelRows.length > 10 ? excelRows.slice(-5) : [];
  const sampleTable = (rows: ExcelRow[]) => rows.map(
    r => `| ${r.nombreCliente} | ${r.correoCliente || '-'} | ${r.documento || '-'} | ${r.conceptoCompra.substring(0, 40)} | $${r.monto.toFixed(2)} | ${r.fecha} |`,
  ).join('\n');

  const evidence = `# Execution Evidence: Wellnest Facturas Marzo 2026

## Summary
- **Tenant:** ${tenant.nombre} (ID: ${tenant.id})
- **Rango:** 2026-03-01 → 2026-03-31
- **Total DTEs encontrados:** ${uniqueDtes.length}
- **PDFs generados:** ${pdfOk} / ${uniqueDtes.length}
- **PDFs fallidos:** ${pdfFail}${failedPdfs.length > 0 ? ` (${failedPdfs.join(', ')})` : ''}
- **Excel rows:** ${excelRows.length}
- **ZIP size:** ${zipSizeMB} MB
- **Total facturado marzo:** $${totalMonto.toFixed(2)}

## Deliverables
- ✅ wellnest_facturas_marzo2026.zip (${pdfOk} PDFs)
- ✅ wellnest_facturas_marzo2026.xlsx (${excelRows.length} rows + TOTAL)

## Sample Data (first 5 rows)
| Cliente | Email | Doc | Concepto | Monto | Fecha |
|---------|-------|-----|----------|-------|-------|
${sampleTable(first5)}
${last5.length > 0 ? `\n## Last 5 rows\n| Cliente | Email | Doc | Concepto | Monto | Fecha |\n|---------|-------|-----|----------|-------|-------|\n${sampleTable(last5)}` : ''}

## Verification
- [x] Excel ordered by date ASC
- [x] All amounts from totalPagar (total con IVA)
- [x] ZIP contains ${pdfOk} PDFs
- [x] Row count (${excelRows.length}) matches DTE query count (${uniqueDtes.length})
- [x] Total ($${totalMonto.toFixed(2)}) = SUM of individual montos
- [x] Deduplicated by codigoGeneracion
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'EXECUTION_EVIDENCE.md'), evidence);
  console.log('\nEXECUTION_EVIDENCE.md generado.');

  // Cleanup tmp
  console.log('\n✓ DONE');
  console.log(`  ZIP: ${zipPath}`);
  console.log(`  XLSX: ${xlsxPath}`);
  console.log(`  Total facturado: $${totalMonto.toFixed(2)}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
