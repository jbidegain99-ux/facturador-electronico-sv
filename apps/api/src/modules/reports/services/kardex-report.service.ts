import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../../prisma/prisma.service';

// =========================================================================
// Public types
// =========================================================================

export interface KardexReportMeta {
  tenant: {
    nombre: string;
    nit: string;
    nrc: string;
  };
  catalogItem: {
    code: string;
    name: string;
    unit: string;  // uniMedida as string (CAT-014 code)
  };
  periodo: {
    startDate: Date;
    endDate: Date;
  };
}

export interface KardexReportRow {
  correlativo: number;
  fecha: Date;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  nitProveedor: string | null;
  nombreProveedor: string | null;
  nacionalidadProveedor: string;
  qtyIn: number;
  qtyOut: number;
  balanceQty: number;
  unitCost: number;
  balanceValue: number;
  observaciones: string | null;
}

export interface KardexReportTotals {
  sumQtyIn: number;
  sumQtyOut: number;
  finalBalanceQty: number;
  finalBalanceValue: number;
}

export interface KardexReportData {
  meta: KardexReportMeta;
  rows: KardexReportRow[];
  totals: KardexReportTotals;
}

// =========================================================================
// Constants — Facturo brand + Art. 142-A columns
// =========================================================================

const BRAND_PURPLE = 'FF7C3AED';
const HEADER_GREY = 'FFF0F0F0';
const COL_HEADER_GREY = 'FFE0E0E0';
const ALT_ROW_GREY = 'FFFAFAFA';
const TOTALS_YELLOW = 'FFFFF9C4';
const EMPTY_MSG_GREY = 'FFF5F5F5';

const COLUMN_HEADERS = [
  'Correlativo',
  'Fecha',
  'Tipo Doc',
  'Número Doc',
  'NIT Proveedor',
  'Nombre Proveedor',
  'Nacionalidad',
  'Entrada',
  'Salida',
  'Saldo Qty',
  'Costo Unit',
  'Saldo Valor',
  'Observaciones',
];
const COLUMN_WIDTHS = [12, 12, 10, 25, 18, 35, 14, 12, 12, 14, 14, 16, 30];

// =========================================================================
// Service
// =========================================================================

@Injectable()
export class KardexReportService {
  private readonly logger = new Logger(KardexReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateKardexExcel(
    tenantId: string,
    catalogItemId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Buffer> {
    const data = await this.loadKardexData(tenantId, catalogItemId, startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Facturo';
    workbook.created = new Date();

    const sheetName = data.meta.catalogItem.code.slice(0, 31);
    const sheet = workbook.addWorksheet(sheetName);

    this.buildSheet(sheet, data);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  async generateKardexBookExcel(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Buffer> {
    // 1. Find catalogItemIds with movements in period
    const grouped = await this.prisma.inventoryMovement.groupBy({
      by: ['catalogItemId'],
      where: {
        tenantId,
        movementDate: { gte: startDate, lte: endDate },
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Facturo';
    workbook.created = new Date();

    if (grouped.length === 0) {
      // No movements in period for any item — add single "empty" sheet
      const sheet = workbook.addWorksheet('Kardex Mensual');
      const row = sheet.addRow(['Sin movimientos en el período seleccionado']);
      row.font = { italic: true };
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer as ArrayBuffer);
    }

    // 2. Load all items to sort by code
    const itemIds = grouped.map((g) => g.catalogItemId);
    const items = await this.prisma.catalogItem.findMany({
      where: { id: { in: itemIds }, tenantId },
      orderBy: { code: 'asc' },
    });

    // 3. For each item, load data and build sheet
    for (const item of items) {
      const data = await this.loadKardexData(tenantId, item.id, startDate, endDate);
      const sheetName = data.meta.catalogItem.code.slice(0, 31);
      const sheet = workbook.addWorksheet(sheetName);
      this.buildSheet(sheet, data);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  async loadKardexData(
    tenantId: string,
    catalogItemId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<KardexReportData> {
    const [catalogItem, tenant] = await Promise.all([
      this.prisma.catalogItem.findUnique({ where: { id: catalogItemId } }),
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
    ]);

    if (!catalogItem || catalogItem.tenantId !== tenantId) {
      throw new NotFoundException(`CatalogItem ${catalogItemId} not found for tenant ${tenantId}`);
    }
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const movements = await this.prisma.inventoryMovement.findMany({
      where: {
        tenantId,
        catalogItemId,
        movementDate: { gte: startDate, lte: endDate },
      },
      include: {
        supplier: { select: { numDocumento: true, nombre: true } },
      },
      orderBy: { correlativo: 'asc' },
    });

    const rows: KardexReportRow[] = movements.map((m) => {
      const sup = (m as { supplier?: { numDocumento: string; nombre: string } | null }).supplier;
      return {
        correlativo: m.correlativo,
        fecha: m.movementDate,
        tipoDocumento: m.documentType,
        numeroDocumento: m.documentNumber,
        nitProveedor: sup?.numDocumento ?? null,
        nombreProveedor: sup?.nombre ?? null,
        nacionalidadProveedor: m.supplierNationality ?? 'SV',
        qtyIn: Number(m.qtyIn),
        qtyOut: Number(m.qtyOut),
        balanceQty: Number(m.balanceQty),
        unitCost: Number(m.unitCost),
        balanceValue: Number(m.balanceValue),
        observaciones: m.notes,
      };
    });

    const totals: KardexReportTotals = {
      sumQtyIn: rows.reduce((s, r) => s + r.qtyIn, 0),
      sumQtyOut: rows.reduce((s, r) => s + r.qtyOut, 0),
      finalBalanceQty: rows.length > 0 ? rows[rows.length - 1].balanceQty : 0,
      finalBalanceValue: rows.length > 0 ? rows[rows.length - 1].balanceValue : 0,
    };

    const meta: KardexReportMeta = {
      tenant: {
        nombre: tenant.nombre,
        nit: tenant.nit,
        nrc: tenant.nrc,
      },
      catalogItem: {
        code: catalogItem.code,
        name: catalogItem.name,
        unit: String(catalogItem.uniMedida ?? 99),  // CAT-014 code as string
      },
      periodo: { startDate, endDate },
    };

    return { meta, rows, totals };
  }

  // =========================================================================
  // Private helpers — Excel layout building
  // =========================================================================

  private buildSheet(sheet: ExcelJS.Worksheet, data: KardexReportData): void {
    this.buildSheetHeader(sheet, data.meta);
    this.buildColumnHeaders(sheet);

    if (data.rows.length === 0) {
      this.buildEmptyMessageRow(sheet);
      this.buildTotalsRow(sheet, 9, data.totals);  // row 6 empty msg + row 7 spacer + row 8 spacer + row 9 totals
    } else {
      this.buildDataRows(sheet, data.rows);
      // Rows occupy 6 .. (6 + rows.length - 1), spacer at (6 + rows.length), totals at (6 + rows.length + 1) = rows.length + 7
      this.buildTotalsRow(sheet, data.rows.length + 7, data.totals);
    }

    this.applyColumnWidths(sheet);
  }

  private buildSheetHeader(sheet: ExcelJS.Worksheet, meta: KardexReportMeta): void {
    // Row 1: title
    sheet.mergeCells('A1:M1');
    const title = sheet.getCell('A1');
    title.value = 'KARDEX - ART. 142-A CÓDIGO TRIBUTARIO';
    title.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_PURPLE } };
    title.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 2: empresa
    sheet.mergeCells('A2:M2');
    const empresaCell = sheet.getCell('A2');
    empresaCell.value = `Empresa: ${meta.tenant.nombre} | NIT: ${meta.tenant.nit} | NRC: ${meta.tenant.nrc}`;
    empresaCell.font = { bold: true };
    empresaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_GREY } };
    empresaCell.alignment = { horizontal: 'center' };

    // Row 3: producto
    sheet.mergeCells('A3:M3');
    const productoCell = sheet.getCell('A3');
    const startStr = meta.periodo.startDate.toISOString().slice(0, 10);
    const endStr = meta.periodo.endDate.toISOString().slice(0, 10);
    productoCell.value = `Producto: ${meta.catalogItem.code} - ${meta.catalogItem.name} (${meta.catalogItem.unit}) | Período: ${startStr} a ${endStr}`;
    productoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_GREY } };
    productoCell.alignment = { horizontal: 'center' };

    // Row 4: spacer (empty)
  }

  private buildColumnHeaders(sheet: ExcelJS.Worksheet): void {
    const headerRow = sheet.getRow(5);
    COLUMN_HEADERS.forEach((label, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = label;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_HEADER_GREY } };
      cell.alignment = { horizontal: 'center' };
    });
  }

  private buildDataRows(sheet: ExcelJS.Worksheet, rows: KardexReportRow[]): void {
    rows.forEach((row, i) => {
      const rowNum = i + 6;
      const excelRow = sheet.getRow(rowNum);
      excelRow.getCell(1).value = row.correlativo;
      excelRow.getCell(2).value = row.fecha;
      excelRow.getCell(2).numFmt = 'dd/mm/yyyy';
      excelRow.getCell(3).value = row.tipoDocumento;
      excelRow.getCell(4).value = row.numeroDocumento;
      excelRow.getCell(5).value = row.nitProveedor;
      excelRow.getCell(6).value = row.nombreProveedor;
      excelRow.getCell(7).value = row.nacionalidadProveedor;
      excelRow.getCell(8).value = row.qtyIn;
      excelRow.getCell(8).numFmt = '0.0000';
      excelRow.getCell(9).value = row.qtyOut;
      excelRow.getCell(9).numFmt = '0.0000';
      excelRow.getCell(10).value = row.balanceQty;
      excelRow.getCell(10).numFmt = '0.0000';
      excelRow.getCell(11).value = row.unitCost;
      excelRow.getCell(11).numFmt = '0.0000';
      excelRow.getCell(12).value = row.balanceValue;
      excelRow.getCell(12).numFmt = '0.00';
      excelRow.getCell(13).value = row.observaciones;

      // Alternating row fill
      if (i % 2 === 1) {
        excelRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ALT_ROW_GREY } };
        });
      }
    });
  }

  private buildEmptyMessageRow(sheet: ExcelJS.Worksheet): void {
    sheet.mergeCells('A6:M6');
    const cell = sheet.getCell('A6');
    cell.value = 'Sin movimientos en el período seleccionado';
    cell.font = { italic: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EMPTY_MSG_GREY } };
    cell.alignment = { horizontal: 'center' };
  }

  private buildTotalsRow(
    sheet: ExcelJS.Worksheet,
    rowNum: number,
    totals: KardexReportTotals,
  ): void {
    const row = sheet.getRow(rowNum);
    row.getCell(1).value = 'TOTAL';
    row.getCell(8).value = totals.sumQtyIn;
    row.getCell(8).numFmt = '0.0000';
    row.getCell(9).value = totals.sumQtyOut;
    row.getCell(9).numFmt = '0.0000';
    row.getCell(10).value = totals.finalBalanceQty;
    row.getCell(10).numFmt = '0.0000';
    row.getCell(12).value = totals.finalBalanceValue;
    row.getCell(12).numFmt = '0.00';

    row.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTALS_YELLOW } };
    });
  }

  private applyColumnWidths(sheet: ExcelJS.Worksheet): void {
    COLUMN_WIDTHS.forEach((width, i) => {
      sheet.getColumn(i + 1).width = width;
    });
  }
}
