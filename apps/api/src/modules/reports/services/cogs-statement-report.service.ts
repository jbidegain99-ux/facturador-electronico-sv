import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../../prisma/prisma.service';

// =========================================================================
// Public types
// =========================================================================

export interface CogsStatementMeta {
  tenant: { nombre: string; nit: string; nrc: string };
  periodo: { startDate: Date; endDate: Date };
}

export interface CogsStatementFormula {
  inventarioInicial: number;
  comprasBrutas: number;
  devolucionesSobreCompras: number;
  descuentosSobreCompras: number;
  comprasNetas: number;
  mercaderiaDisponible: number;
  inventarioFinal: number;
  costoDeLoVendido: number;
}

export interface CogsStatementReconciliacion {
  cogsFormula: number;
  cogsRegistrado: number;
  faltantes: number;
  sobrantes: number;
  ajusteNeto: number;
  diferencia: number;
}

export interface CogsStatementData {
  meta: CogsStatementMeta;
  formula: CogsStatementFormula;
  reconciliacion: CogsStatementReconciliacion;
}

// =========================================================================
// Constants — Facturo brand
// =========================================================================

const BRAND_PURPLE = 'FF7C3AED';
const HEADER_GREY = 'FFF0F0F0';
const SECTION_GREY = 'FFE0E0E0';
const ALT_ROW_GREY = 'FFFAFAFA';
const TOTALS_YELLOW = 'FFFFF9C4';
const DIFF_OK_GREEN = 'FFC8E6C9';
const NEGATIVE_RED = 'FFC00000';

const COLUMN_WIDTHS = [50, 18, 18];
const SHEET_NAME = 'Estado de Costo de Venta';
const MONEY_FMT = '#,##0.00;(#,##0.00)';

// =========================================================================
// Service
// =========================================================================

@Injectable()
export class CogsStatementReportService {
  private readonly logger = new Logger(CogsStatementReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateCogsStatementExcel(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<Buffer> {
    if (periodEnd.getTime() < periodStart.getTime()) {
      throw new BadRequestException('endDate debe ser posterior a startDate');
    }

    const data = await this.loadCogsStatementData(tenantId, periodStart, periodEnd);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Facturo';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(SHEET_NAME);
    this.buildSheet(sheet, data);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  async loadCogsStatementData(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<CogsStatementData> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    // Paso 1 — Inventario Inicial (último balanceValue por item antes de periodStart)
    const preMovs = await this.prisma.inventoryMovement.findMany({
      where: { tenantId, movementDate: { lt: periodStart } },
      select: { catalogItemId: true, balanceValue: true, movementDate: true, correlativo: true },
      orderBy: [
        { catalogItemId: 'asc' },
        { movementDate: 'desc' },
        { correlativo: 'desc' },
      ],
    });
    const inventarioInicial = this.sumLastBalancePerItem(preMovs);

    // Paso 2 — Compras brutas del período
    const comprasAgg = await this.prisma.inventoryMovement.aggregate({
      where: {
        tenantId,
        movementType: 'ENTRADA_COMPRA',
        movementDate: { gte: periodStart, lte: periodEnd },
      },
      _sum: { totalCost: true },
    });
    const comprasBrutas = Number(comprasAgg._sum.totalCost ?? 0);

    // Paso 7a — COGS registrado: SALIDA_VENTA
    const salidaVentaAgg = await this.prisma.inventoryMovement.aggregate({
      where: {
        tenantId,
        movementType: 'SALIDA_VENTA',
        movementDate: { gte: periodStart, lte: periodEnd },
      },
      _sum: { totalCost: true },
    });
    const salidaVenta = Number(salidaVentaAgg._sum.totalCost ?? 0);

    // Paso 7b — COGS registrado: ENTRADA_DEVOLUCION_VENTA
    const devolucionVentaAgg = await this.prisma.inventoryMovement.aggregate({
      where: {
        tenantId,
        movementType: 'ENTRADA_DEVOLUCION_VENTA',
        movementDate: { gte: periodStart, lte: periodEnd },
      },
      _sum: { totalCost: true },
    });
    const devolucionVenta = Number(devolucionVentaAgg._sum.totalCost ?? 0);

    // Paso 7c — Faltantes
    const faltanteAgg = await this.prisma.inventoryMovement.aggregate({
      where: {
        tenantId,
        movementType: 'AJUSTE_FISICO_FALTANTE',
        movementDate: { gte: periodStart, lte: periodEnd },
      },
      _sum: { totalCost: true },
    });
    const faltantes = Number(faltanteAgg._sum.totalCost ?? 0);

    // Paso 7d — Sobrantes
    const sobranteAgg = await this.prisma.inventoryMovement.aggregate({
      where: {
        tenantId,
        movementType: 'AJUSTE_FISICO_SOBRANTE',
        movementDate: { gte: periodStart, lte: periodEnd },
      },
      _sum: { totalCost: true },
    });
    const sobrantes = Number(sobranteAgg._sum.totalCost ?? 0);

    // Paso 4 — Descuentos sobre compras (de Purchase.discountAmount)
    const descuentosAgg = await this.prisma.purchase.aggregate({
      where: {
        tenantId,
        purchaseDate: { gte: periodStart, lte: periodEnd },
      },
      _sum: { discountAmount: true },
    });
    const descuentosSobreCompras = Number(descuentosAgg._sum.discountAmount ?? 0);

    // Paso 5 — Inventario Final (último balanceValue por item <= periodEnd)
    const allMovs = await this.prisma.inventoryMovement.findMany({
      where: { tenantId, movementDate: { lte: periodEnd } },
      select: { catalogItemId: true, balanceValue: true, movementDate: true, correlativo: true },
      orderBy: [
        { catalogItemId: 'asc' },
        { movementDate: 'desc' },
        { correlativo: 'desc' },
      ],
    });
    const inventarioFinal = this.sumLastBalancePerItem(allMovs);

    // Paso 3 — Devoluciones sobre compras (MVP: 0)
    const devolucionesSobreCompras = 0;

    // Paso 6 — Cálculo fórmula
    const comprasNetas = comprasBrutas - devolucionesSobreCompras - descuentosSobreCompras;
    const mercaderiaDisponible = inventarioInicial + comprasNetas;
    const costoDeLoVendido = mercaderiaDisponible - inventarioFinal;

    // Paso 7 — Reconciliación
    const cogsRegistrado = salidaVenta - devolucionVenta;
    const ajusteNeto = faltantes - sobrantes;
    const diferencia = costoDeLoVendido - cogsRegistrado - ajusteNeto;

    const formula: CogsStatementFormula = {
      inventarioInicial,
      comprasBrutas,
      devolucionesSobreCompras,
      descuentosSobreCompras,
      comprasNetas,
      mercaderiaDisponible,
      inventarioFinal,
      costoDeLoVendido,
    };

    const reconciliacion: CogsStatementReconciliacion = {
      cogsFormula: costoDeLoVendido,
      cogsRegistrado,
      faltantes,
      sobrantes,
      ajusteNeto,
      diferencia,
    };

    const meta: CogsStatementMeta = {
      tenant: { nombre: tenant.nombre, nit: tenant.nit, nrc: tenant.nrc },
      periodo: { startDate: periodStart, endDate: periodEnd },
    };

    return { meta, formula, reconciliacion };
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  private sumLastBalancePerItem(
    movs: Array<{ catalogItemId: string; balanceValue: unknown }>,
  ): number {
    const seen = new Set<string>();
    let total = 0;
    for (const m of movs) {
      if (!seen.has(m.catalogItemId)) {
        seen.add(m.catalogItemId);
        total += Number(m.balanceValue);
      }
    }
    return total;
  }

  private buildSheet(sheet: ExcelJS.Worksheet, data: CogsStatementData): void {
    this.buildHeader(sheet, data.meta);
    this.buildFormulaSection(sheet, data.formula);
    this.buildReconciliacionSection(sheet, data.reconciliacion);
    this.buildFooterNote(sheet);
    this.applyColumnWidths(sheet);
  }

  private buildHeader(sheet: ExcelJS.Worksheet, meta: CogsStatementMeta): void {
    sheet.mergeCells('A1:C1');
    const title = sheet.getCell('A1');
    title.value = 'ESTADO DE COSTO DE VENTA';
    title.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_PURPLE } };
    title.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A2:C2');
    const empresa = sheet.getCell('A2');
    empresa.value = `Empresa: ${meta.tenant.nombre} | NIT: ${meta.tenant.nit} | NRC: ${meta.tenant.nrc}`;
    empresa.font = { bold: true };
    empresa.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_GREY } };
    empresa.alignment = { horizontal: 'center' };

    sheet.mergeCells('A3:C3');
    const periodo = sheet.getCell('A3');
    const startStr = meta.periodo.startDate.toISOString().slice(0, 10);
    const endStr = meta.periodo.endDate.toISOString().slice(0, 10);
    periodo.value = `Período: ${startStr} a ${endStr}`;
    periodo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_GREY } };
    periodo.alignment = { horizontal: 'center' };
  }

  private buildFormulaSection(sheet: ExcelJS.Worksheet, formula: CogsStatementFormula): void {
    // Row 5 — Inv Inicial
    this.setLabelValue(sheet, 5, 'Inventario Inicial', null, formula.inventarioInicial);

    // Rows 7-10 — Compras detalladas
    this.setLabelValue(sheet, 7, 'Compras Brutas del período', formula.comprasBrutas, null);
    this.setLabelValue(sheet, 8, '(−) Devoluciones sobre compras', formula.devolucionesSobreCompras, null);
    this.setLabelValue(sheet, 9, '(−) Descuentos sobre compras', formula.descuentosSobreCompras, null);
    this.setLabelValue(sheet, 10, '(=) Compras Netas', null, formula.comprasNetas);

    // Row 12 — Mercadería Disponible
    this.setLabelValue(sheet, 12, '(=) Mercadería Disponible para la Venta', null, formula.mercaderiaDisponible);

    // Row 14 — Inv Final
    this.setLabelValue(sheet, 14, '(−) Inventario Final', null, formula.inventarioFinal);

    // Row 16 — COGS fórmula (totals yellow, bold)
    const cogsRow = sheet.getRow(16);
    cogsRow.getCell(1).value = '(=) COSTO DE LO VENDIDO (por fórmula)';
    cogsRow.getCell(3).value = formula.costoDeLoVendido;
    cogsRow.getCell(3).numFmt = MONEY_FMT;
    for (let c = 1; c <= 3; c++) {
      const cell = cogsRow.getCell(c);
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTALS_YELLOW } };
    }
  }

  private buildReconciliacionSection(
    sheet: ExcelJS.Worksheet,
    recon: CogsStatementReconciliacion,
  ): void {
    // Row 18 — Section header
    const hdrRow = sheet.getRow(18);
    hdrRow.getCell(1).value = 'Reconciliación con COGS Registrado';
    hdrRow.getCell(1).font = { bold: true };
    hdrRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTION_GREY } };

    // Row 19 — COGS fórmula
    this.setLabelValue(sheet, 19, 'COGS por fórmula (fila 16)', null, recon.cogsFormula);

    // Row 20 — COGS registrado
    this.setLabelValue(sheet, 20, 'COGS registrado en asientos (SALIDA_VENTA neto)', null, recon.cogsRegistrado);

    // Row 22 — Ajustes header
    const ajusteHdr = sheet.getRow(22);
    ajusteHdr.getCell(1).value = 'Ajustes físicos del período:';
    ajusteHdr.getCell(1).font = { italic: true };

    // Row 23 — Faltantes
    this.setLabelValue(sheet, 23, '    (−) Faltantes / Mermas', recon.faltantes, null);

    // Row 24 — Sobrantes
    this.setLabelValue(sheet, 24, '    (+) Sobrantes', recon.sobrantes, null);

    // Row 25 — Ajuste neto
    this.setLabelValue(sheet, 25, '(=) Ajuste neto (faltantes − sobrantes)', null, recon.ajusteNeto);

    // Row 27 — Diferencia (bold, green if 0, red+yellow if not)
    const diffRow = sheet.getRow(27);
    diffRow.getCell(1).value = 'Diferencia (fila 19 − fila 20 − fila 25)';
    diffRow.getCell(3).value = recon.diferencia;
    diffRow.getCell(3).numFmt = MONEY_FMT;

    const isBalanced = Math.abs(recon.diferencia) < 0.005;
    const fillColor = isBalanced ? DIFF_OK_GREEN : TOTALS_YELLOW;
    for (let c = 1; c <= 3; c++) {
      const cell = diffRow.getCell(c);
      cell.font = isBalanced
        ? { bold: true }
        : { bold: true, color: { argb: NEGATIVE_RED } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
    }
  }

  private buildFooterNote(sheet: ExcelJS.Worksheet): void {
    sheet.mergeCells('A29:C29');
    const note = sheet.getCell('A29');
    note.value = 'Nota: Devoluciones sobre compras se registrarán cuando se implemente NCE emitida a proveedor. Actualmente muestran $0.00.';
    note.font = { italic: true, size: 10 };
    note.alignment = { horizontal: 'left', wrapText: true };
  }

  private setLabelValue(
    sheet: ExcelJS.Worksheet,
    rowNum: number,
    label: string,
    subValue: number | null,
    totalValue: number | null,
  ): void {
    const row = sheet.getRow(rowNum);
    row.getCell(1).value = label;
    if (subValue !== null) {
      row.getCell(2).value = subValue;
      row.getCell(2).numFmt = MONEY_FMT;
    }
    if (totalValue !== null) {
      row.getCell(3).value = totalValue;
      row.getCell(3).numFmt = MONEY_FMT;
    }

    // Alternating fill on even rows (within the statement body)
    if (rowNum % 2 === 0) {
      for (let c = 1; c <= 3; c++) {
        const cell = row.getCell(c);
        if (!cell.fill || (cell.fill as { type?: string }).type !== 'pattern') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ALT_ROW_GREY } };
        }
      }
    }
  }

  private applyColumnWidths(sheet: ExcelJS.Worksheet): void {
    COLUMN_WIDTHS.forEach((width, i) => {
      sheet.getColumn(i + 1).width = width;
    });
  }
}
