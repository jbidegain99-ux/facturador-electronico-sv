import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../../prisma/prisma.service';

// =========================================================================
// Public types
// =========================================================================

export interface IvaDeclaracionMeta {
  tenant: { nombre: string; nit: string; nrc: string };
  periodo: { startDate: Date; endDate: Date };
}

export type IvaDeclaracionEstado = 'ACEPTADO' | 'ANULADO';

export interface IvaDeclaracionDetalleRow {
  fechaRecepcion: Date | null;
  fechaAnulacion: Date | null;
  tipoDte: string;
  nombreTipo: string;
  numeroControl: string;
  codigoGeneracion: string;
  clienteNit: string | null;
  clienteNombre: string | null;
  estado: IvaDeclaracionEstado;
  gravada: number;
  iva: number;
  total: number;
  observacion: string;
}

export interface IvaDeclaracionCategoria {
  cantDocs: number;
  base: number;
  iva: number;
}

export interface IvaDeclaracionTotals {
  ventasInternasGravadas: IvaDeclaracionCategoria;
  exportaciones: { cantDocs: number; monto: number };
  ajustesNotasCredito: IvaDeclaracionCategoria;
  ajustesNotasDebito: IvaDeclaracionCategoria;
  anulacionesEnPeriodo: IvaDeclaracionCategoria;
  totalGravadoNeto: number;
  totalIvaDebitoAPagar: number;
  totalExportaciones: number;
}

export interface IvaDeclaracionData {
  meta: IvaDeclaracionMeta;
  detalle: IvaDeclaracionDetalleRow[];
  totals: IvaDeclaracionTotals;
}

// =========================================================================
// Constants — Facturo brand + F07 labels
// =========================================================================

const BRAND_PURPLE = 'FF7C3AED';
const HEADER_GREY = 'FFF0F0F0';
const COL_HEADER_GREY = 'FFE0E0E0';
const ALT_ROW_GREY = 'FFFAFAFA';
const TOTALS_YELLOW = 'FFFFF9C4';
const NEGATIVE_RED = 'FFC00000';

const DTE_TYPES_IN_SCOPE = ['01', '03', '05', '06', '11'] as const;

const TIPO_DTE_NAMES: Record<string, string> = {
  '01': 'Factura',
  '03': 'CCFE',
  '05': 'Nota de Crédito',
  '06': 'Nota de Débito',
  '11': 'Factura Exportación',
};

const RESUMEN_COL_HEADERS = ['Casilla', 'Concepto', 'Cant. Docs', 'Monto (USD)'];
const RESUMEN_COL_WIDTHS = [10, 55, 14, 18];

const DETALLE_COL_HEADERS = [
  'Fecha Recepción',
  'Fecha Anulación',
  'Tipo',
  'Nombre Tipo',
  'Número Control',
  'Código Generación',
  'Cliente NIT',
  'Cliente Nombre',
  'Estado',
  'Gravada',
  'IVA',
  'Total',
  'Observación',
];
const DETALLE_COL_WIDTHS = [12, 12, 8, 14, 22, 38, 18, 30, 12, 14, 14, 14, 30];

// =========================================================================
// Service
// =========================================================================

@Injectable()
export class IvaDeclaracionReportService {
  private readonly logger = new Logger(IvaDeclaracionReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateIvaDeclaracionExcel(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<Buffer> {
    if (periodEnd.getTime() < periodStart.getTime()) {
      throw new BadRequestException('endDate debe ser posterior a startDate');
    }

    const data = await this.loadIvaDeclaracionData(tenantId, periodStart, periodEnd);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Facturo';
    workbook.created = new Date();

    const resumenSheet = workbook.addWorksheet('Resumen F07');
    this.buildResumenSheet(resumenSheet, data);

    const detalleSheet = workbook.addWorksheet('Detalle DTE');
    this.buildDetalleSheet(detalleSheet, data);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  async loadIvaDeclaracionData(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<IvaDeclaracionData> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    // Query 1 — DTEs aceptados dentro del período, no anulados en el período
    const aceptados = await this.prisma.dTE.findMany({
      where: {
        tenantId,
        estado: 'ACEPTADO',
        fechaRecepcion: { gte: periodStart, lte: periodEnd },
        tipoDte: { in: ['01', '03', '05', '06', '11'] },
        OR: [
          { fechaAnulacion: null },
          { fechaAnulacion: { gt: periodEnd } },
        ],
      },
      include: { cliente: { select: { numDocumento: true, nombre: true } } },
      orderBy: { fechaRecepcion: 'asc' },
    });

    // Query 2 — DTEs anulados cuyo fechaAnulacion cae en el período
    const anulados = await this.prisma.dTE.findMany({
      where: {
        tenantId,
        estado: 'ANULADO',
        fechaAnulacion: { gte: periodStart, lte: periodEnd },
        tipoDte: { in: ['01', '03', '05', '06', '11'] },
      },
      include: { cliente: { select: { numDocumento: true, nombre: true } } },
      orderBy: { fechaAnulacion: 'asc' },
    });

    // Clasificar y totalizar
    const totals: IvaDeclaracionTotals = {
      ventasInternasGravadas: { cantDocs: 0, base: 0, iva: 0 },
      exportaciones: { cantDocs: 0, monto: 0 },
      ajustesNotasCredito: { cantDocs: 0, base: 0, iva: 0 },
      ajustesNotasDebito: { cantDocs: 0, base: 0, iva: 0 },
      anulacionesEnPeriodo: { cantDocs: 0, base: 0, iva: 0 },
      totalGravadoNeto: 0,
      totalIvaDebitoAPagar: 0,
      totalExportaciones: 0,
    };

    for (const dte of aceptados) {
      const base = Number(dte.totalGravada);
      const iva = Number(dte.totalIva);
      const total = Number(dte.totalPagar);

      if (dte.tipoDte === '01' || dte.tipoDte === '03') {
        totals.ventasInternasGravadas.cantDocs += 1;
        totals.ventasInternasGravadas.base += base;
        totals.ventasInternasGravadas.iva += iva;
      } else if (dte.tipoDte === '05') {
        totals.ajustesNotasCredito.cantDocs += 1;
        totals.ajustesNotasCredito.base += base;
        totals.ajustesNotasCredito.iva += iva;
      } else if (dte.tipoDte === '06') {
        totals.ajustesNotasDebito.cantDocs += 1;
        totals.ajustesNotasDebito.base += base;
        totals.ajustesNotasDebito.iva += iva;
      } else if (dte.tipoDte === '11') {
        totals.exportaciones.cantDocs += 1;
        totals.exportaciones.monto += total;
      }
    }

    for (const dte of anulados) {
      totals.anulacionesEnPeriodo.cantDocs += 1;
      totals.anulacionesEnPeriodo.base += Number(dte.totalGravada);
      totals.anulacionesEnPeriodo.iva += Number(dte.totalIva);
    }

    totals.totalGravadoNeto =
      totals.ventasInternasGravadas.base +
      totals.ajustesNotasDebito.base -
      totals.ajustesNotasCredito.base -
      totals.anulacionesEnPeriodo.base;

    totals.totalIvaDebitoAPagar =
      totals.ventasInternasGravadas.iva +
      totals.ajustesNotasDebito.iva -
      totals.ajustesNotasCredito.iva -
      totals.anulacionesEnPeriodo.iva;

    totals.totalExportaciones = totals.exportaciones.monto;

    // Construir detalle (union ordenada por fecha efectiva)
    const detalle: IvaDeclaracionDetalleRow[] = [];
    for (const dte of aceptados) {
      const sup = (dte as { cliente?: { numDocumento: string; nombre: string } | null }).cliente;
      const observacion = dte.fechaAnulacion
        ? 'Aceptado y anulado fuera de período'
        : 'Aceptado';
      detalle.push({
        fechaRecepcion: dte.fechaRecepcion,
        fechaAnulacion: dte.fechaAnulacion,
        tipoDte: dte.tipoDte,
        nombreTipo: TIPO_DTE_NAMES[dte.tipoDte] ?? dte.tipoDte,
        numeroControl: dte.numeroControl,
        codigoGeneracion: dte.codigoGeneracion,
        clienteNit: sup?.numDocumento ?? null,
        clienteNombre: sup?.nombre ?? null,
        estado: 'ACEPTADO',
        gravada: Number(dte.totalGravada),
        iva: Number(dte.totalIva),
        total: Number(dte.totalPagar),
        observacion,
      });
    }
    for (const dte of anulados) {
      const sup = (dte as { cliente?: { numDocumento: string; nombre: string } | null }).cliente;
      detalle.push({
        fechaRecepcion: dte.fechaRecepcion,
        fechaAnulacion: dte.fechaAnulacion,
        tipoDte: dte.tipoDte,
        nombreTipo: TIPO_DTE_NAMES[dte.tipoDte] ?? dte.tipoDte,
        numeroControl: dte.numeroControl,
        codigoGeneracion: dte.codigoGeneracion,
        clienteNit: sup?.numDocumento ?? null,
        clienteNombre: sup?.nombre ?? null,
        estado: 'ANULADO',
        gravada: Number(dte.totalGravada),
        iva: Number(dte.totalIva),
        total: Number(dte.totalPagar),
        observacion: 'Anulado en período',
      });
    }

    // Ordenar por fecha efectiva ASC (fechaAnulacion si anulado, fechaRecepcion si aceptado)
    detalle.sort((a, b) => {
      const dateA = a.estado === 'ANULADO' ? a.fechaAnulacion : a.fechaRecepcion;
      const dateB = b.estado === 'ANULADO' ? b.fechaAnulacion : b.fechaRecepcion;
      const ta = dateA ? dateA.getTime() : 0;
      const tb = dateB ? dateB.getTime() : 0;
      return ta - tb;
    });

    const meta: IvaDeclaracionMeta = {
      tenant: { nombre: tenant.nombre, nit: tenant.nit, nrc: tenant.nrc },
      periodo: { startDate: periodStart, endDate: periodEnd },
    };

    return { meta, detalle, totals };
  }

  // =========================================================================
  // Private helpers — Hoja 1 Resumen F07
  // =========================================================================

  private buildResumenSheet(sheet: ExcelJS.Worksheet, data: IvaDeclaracionData): void {
    this.buildResumenHeader(sheet, data.meta);
    this.buildResumenTableHeader(sheet);
    this.buildResumenDataRows(sheet, data.totals);
    this.buildResumenTotalRows(sheet, data.totals);
    this.buildResumenNote(sheet);
    this.applyColumnWidths(sheet, RESUMEN_COL_WIDTHS);
  }

  private buildResumenHeader(sheet: ExcelJS.Worksheet, meta: IvaDeclaracionMeta): void {
    sheet.mergeCells('A1:D1');
    const title = sheet.getCell('A1');
    const startStr = meta.periodo.startDate.toISOString().slice(0, 10);
    const endStr = meta.periodo.endDate.toISOString().slice(0, 10);
    title.value = `DECLARACIÓN IVA F07 — ${startStr} a ${endStr}`;
    title.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_PURPLE } };
    title.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A2:D2');
    const empresa = sheet.getCell('A2');
    empresa.value = `Empresa: ${meta.tenant.nombre} | NIT: ${meta.tenant.nit} | NRC: ${meta.tenant.nrc}`;
    empresa.font = { bold: true };
    empresa.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_GREY } };
    empresa.alignment = { horizontal: 'center' };

    sheet.mergeCells('A3:D3');
    const periodo = sheet.getCell('A3');
    periodo.value = `Período: ${startStr} a ${endStr}`;
    periodo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_GREY } };
    periodo.alignment = { horizontal: 'center' };
  }

  private buildResumenTableHeader(sheet: ExcelJS.Worksheet): void {
    const headerRow = sheet.getRow(5);
    RESUMEN_COL_HEADERS.forEach((label, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = label;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_HEADER_GREY } };
      cell.alignment = { horizontal: 'center' };
    });
  }

  private buildResumenDataRows(sheet: ExcelJS.Worksheet, totals: IvaDeclaracionTotals): void {
    const rows: Array<{
      casilla: number;
      concepto: string;
      cant: number;
      monto: number;
      negative?: boolean;
    }> = [
      { casilla: 1, concepto: 'Ventas Internas Gravadas (01 + 03 aceptados) — Base', cant: totals.ventasInternasGravadas.cantDocs, monto: totals.ventasInternasGravadas.base },
      { casilla: 2, concepto: 'Débito Fiscal 13% (IVA de fila 1)', cant: 0, monto: totals.ventasInternasGravadas.iva },
      { casilla: 3, concepto: 'Exportaciones (11 aceptados) — Monto', cant: totals.exportaciones.cantDocs, monto: totals.exportaciones.monto },
      { casilla: 4, concepto: 'Ajustes — Notas de Crédito (05) — Base', cant: totals.ajustesNotasCredito.cantDocs, monto: -totals.ajustesNotasCredito.base, negative: true },
      { casilla: 5, concepto: 'Ajustes — Notas de Débito (06) — Base', cant: totals.ajustesNotasDebito.cantDocs, monto: totals.ajustesNotasDebito.base },
      { casilla: 6, concepto: 'Disminución — DTEs anulados en período — Base', cant: totals.anulacionesEnPeriodo.cantDocs, monto: -totals.anulacionesEnPeriodo.base, negative: true },
    ];

    rows.forEach((r, i) => {
      const rowNum = 6 + i;
      const row = sheet.getRow(rowNum);
      row.getCell(1).value = r.casilla;
      row.getCell(2).value = r.concepto;
      row.getCell(3).value = r.casilla === 2 ? '—' : r.cant;
      row.getCell(4).value = r.monto;
      row.getCell(4).numFmt = '#,##0.00;(#,##0.00)';

      if (r.negative) {
        row.getCell(4).font = { color: { argb: NEGATIVE_RED } };
      }
      if (i % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ALT_ROW_GREY } };
        });
      }
    });
  }

  private buildResumenTotalRows(sheet: ExcelJS.Worksheet, totals: IvaDeclaracionTotals): void {
    const totalRows: Array<{ row: number; label: string; value: number }> = [
      { row: 13, label: 'TOTAL GRAVADO NETO', value: totals.totalGravadoNeto },
      { row: 14, label: 'TOTAL IVA DÉBITO A PAGAR', value: totals.totalIvaDebitoAPagar },
      { row: 15, label: 'TOTAL EXPORTACIONES', value: totals.totalExportaciones },
    ];

    totalRows.forEach(({ row, label, value }) => {
      const r = sheet.getRow(row);
      r.getCell(1).value = 'TOTAL';
      r.getCell(2).value = label;
      r.getCell(4).value = value;
      r.getCell(4).numFmt = '#,##0.00;(#,##0.00)';

      r.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTALS_YELLOW } };
      });
    });
  }

  private buildResumenNote(sheet: ExcelJS.Worksheet): void {
    sheet.mergeCells('A17:D17');
    const note = sheet.getCell('A17');
    note.value = 'Nota: Casillas 1-6 son numeración interna del reporte. Consultar Manual Anexos F07 v14 para casillas oficiales del portal MH.';
    note.font = { italic: true, size: 10 };
    note.alignment = { horizontal: 'left', wrapText: true };
  }

  // =========================================================================
  // Private helpers — Hoja 2 Detalle DTE
  // =========================================================================

  private buildDetalleSheet(sheet: ExcelJS.Worksheet, data: IvaDeclaracionData): void {
    this.buildDetalleHeader(sheet, data.meta);
    this.buildDetalleColumnHeaders(sheet);

    if (data.detalle.length === 0) {
      sheet.mergeCells('A5:M5');
      const empty = sheet.getCell('A5');
      empty.value = 'Sin movimientos en el período seleccionado';
      empty.font = { italic: true };
      empty.alignment = { horizontal: 'center' };
    } else {
      this.buildDetalleDataRows(sheet, data.detalle);
    }

    this.applyColumnWidths(sheet, DETALLE_COL_WIDTHS);
  }

  private buildDetalleHeader(sheet: ExcelJS.Worksheet, meta: IvaDeclaracionMeta): void {
    sheet.mergeCells('A1:M1');
    const title = sheet.getCell('A1');
    const startStr = meta.periodo.startDate.toISOString().slice(0, 10);
    const endStr = meta.periodo.endDate.toISOString().slice(0, 10);
    title.value = `Detalle DTE — ${startStr} a ${endStr}`;
    title.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_PURPLE } };
    title.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A2:M2');
    const empresa = sheet.getCell('A2');
    empresa.value = `Empresa: ${meta.tenant.nombre} | NIT: ${meta.tenant.nit} | NRC: ${meta.tenant.nrc}`;
    empresa.font = { bold: true };
    empresa.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_GREY } };
    empresa.alignment = { horizontal: 'center' };
  }

  private buildDetalleColumnHeaders(sheet: ExcelJS.Worksheet): void {
    const headerRow = sheet.getRow(4);
    DETALLE_COL_HEADERS.forEach((label, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = label;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_HEADER_GREY } };
      cell.alignment = { horizontal: 'center' };
    });
  }

  private buildDetalleDataRows(sheet: ExcelJS.Worksheet, rows: IvaDeclaracionDetalleRow[]): void {
    rows.forEach((r, i) => {
      const rowNum = 5 + i;
      const excelRow = sheet.getRow(rowNum);
      excelRow.getCell(1).value = r.fechaRecepcion;
      excelRow.getCell(1).numFmt = 'dd/mm/yyyy';
      excelRow.getCell(2).value = r.fechaAnulacion;
      excelRow.getCell(2).numFmt = 'dd/mm/yyyy';
      excelRow.getCell(3).value = r.tipoDte;
      excelRow.getCell(4).value = r.nombreTipo;
      excelRow.getCell(5).value = r.numeroControl;
      excelRow.getCell(6).value = r.codigoGeneracion;
      excelRow.getCell(7).value = r.clienteNit;
      excelRow.getCell(8).value = r.clienteNombre;
      excelRow.getCell(9).value = r.estado;
      excelRow.getCell(10).value = r.gravada;
      excelRow.getCell(10).numFmt = '0.00';
      excelRow.getCell(11).value = r.iva;
      excelRow.getCell(11).numFmt = '0.00';
      excelRow.getCell(12).value = r.total;
      excelRow.getCell(12).numFmt = '0.00';
      excelRow.getCell(13).value = r.observacion;

      if (r.estado === 'ANULADO') {
        excelRow.eachCell((cell) => {
          cell.font = { color: { argb: NEGATIVE_RED } };
        });
      }
      if (i % 2 === 1) {
        excelRow.eachCell((cell) => {
          const existingFont = cell.font;
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ALT_ROW_GREY } };
          if (existingFont) cell.font = existingFont;
        });
      }
    });
  }

  private applyColumnWidths(sheet: ExcelJS.Worksheet, widths: number[]): void {
    widths.forEach((width, i) => {
      sheet.getColumn(i + 1).width = width;
    });
  }
}
