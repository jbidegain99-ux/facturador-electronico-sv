import {
  Controller,
  Get,
  Query,
  Res,
  Param,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { RequireFeature } from '../plans/decorators/require-feature.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ReportsService,
  ReportByTypeResult,
  ReportByPeriodResult,
  ReportRetencionesResult,
  TopClientStat,
  ReportExportsResult,
} from './reports.service';
import { KardexReportService } from './services/kardex-report.service';
import { IvaDeclaracionReportService } from './services/iva-declaracion-report.service';
import { CogsStatementReportService } from './services/cogs-statement-report.service';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly kardexReportService: KardexReportService,
    private readonly ivaDeclaracionReportService: IvaDeclaracionReportService,
    private readonly cogsStatementReportService: CogsStatementReportService,
    private readonly prisma: PrismaService,
  ) {}

  private ensureTenant(user: CurrentUserData): string {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return user.tenantId;
  }

  private parseDateRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }

    // Set end to end of day
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  private streamXlsx(res: Response, buffer: Buffer, filename: string): void {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.end(buffer);
  }

  private buildKardexItemFilename(itemCode: string, endDate: Date): string {
    const dateStr = endDate.toISOString().slice(0, 10).replace(/-/g, '');
    return `kardex-${itemCode}-${dateStr}.xlsx`;
  }

  private buildKardexBookFilename(endDate: Date): string {
    const monthStr = endDate.toISOString().slice(0, 7).replace('-', '');
    return `kardex-libro-${monthStr}.xlsx`;
  }

  private buildIvaFilename(endDate: Date): string {
    const monthStr = endDate.toISOString().slice(0, 7).replace('-', '');
    return `iva-f07-${monthStr}.xlsx`;
  }

  private buildCogsFilename(endDate: Date): string {
    const yearStr = endDate.toISOString().slice(0, 4);
    return `estado-costo-venta-${yearStr}.xlsx`;
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Reporte de ventas por tipo de DTE' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @RequirePermission('report:read')
  async getByType(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = this.ensureTenant(user);
    const { start, end } = this.parseDateRange(startDate, endDate);
    return this.reportsService.getByType(tenantId, start, end);
  }

  @Get('by-period')
  @ApiOperation({ summary: 'Reporte por período (mensual, trimestral, anual)' })
  @ApiQuery({ name: 'period', required: false, enum: ['monthly', 'quarterly', 'annual'] })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @RequirePermission('report:read')
  async getByPeriod(
    @CurrentUser() user: CurrentUserData,
    @Query('period') period?: string,
    @Query('year') yearStr?: string,
  ) {
    const tenantId = this.ensureTenant(user);
    const validPeriod = (['monthly', 'quarterly', 'annual'] as const).includes(period as 'monthly')
      ? (period as 'monthly' | 'quarterly' | 'annual')
      : 'monthly';
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();

    if (isNaN(year) || year < 2000 || year > 2100) {
      throw new BadRequestException('Año inválido');
    }

    return this.reportsService.getByPeriod(tenantId, validPeriod, year);
  }

  @Get('retenciones')
  @ApiOperation({ summary: 'Reporte de retenciones por tipo de impuesto' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @RequirePermission('report:read')
  async getRetenciones(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = this.ensureTenant(user);
    const { start, end } = this.parseDateRange(startDate, endDate);
    return this.reportsService.getRetenciones(tenantId, start, end);
  }

  @Get('top-clients')
  @ApiOperation({ summary: 'Reporte de top clientes por facturación' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @RequirePermission('report:read')
  async getTopClients(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limitStr?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = this.ensureTenant(user);
    const { start, end } = this.parseDateRange(startDate, endDate);
    const limit = Math.min(Math.max(parseInt(limitStr || '10', 10) || 10, 1), 50);
    return this.reportsService.getTopClients(tenantId, limit, start, end);
  }

  @Get('exports')
  @ApiOperation({ summary: 'Reporte de exportaciones por país' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @RequirePermission('report:export')
  async getExports(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = this.ensureTenant(user);
    const { start, end } = this.parseDateRange(startDate, endDate);
    return this.reportsService.getExports(tenantId, start, end);
  }

  @Get('export-csv')
  @ApiOperation({ summary: 'Exportar reporte en CSV' })
  @ApiQuery({ name: 'reportType', required: true, enum: ['by-type', 'by-period', 'retenciones', 'top-clients', 'exports'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'period', required: false, type: String })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @RequirePermission('report:export')
  async exportCSV(
    @CurrentUser() user: CurrentUserData,
    @Res() res: Response,
    @Query('reportType') reportType: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period?: string,
    @Query('year') yearStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const tenantId = this.ensureTenant(user);

    type ReportData = ReportByTypeResult | ReportByPeriodResult | ReportRetencionesResult | TopClientStat[] | ReportExportsResult;
    let reportData: ReportData;

    switch (reportType) {
      case 'by-type': {
        const { start, end } = this.parseDateRange(startDate, endDate);
        reportData = await this.reportsService.getByType(tenantId, start, end);
        break;
      }
      case 'by-period': {
        const validPeriod = (['monthly', 'quarterly', 'annual'] as const).includes(period as 'monthly')
          ? (period as 'monthly' | 'quarterly' | 'annual')
          : 'monthly';
        const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
        reportData = await this.reportsService.getByPeriod(tenantId, validPeriod, year);
        break;
      }
      case 'retenciones': {
        const { start, end } = this.parseDateRange(startDate, endDate);
        reportData = await this.reportsService.getRetenciones(tenantId, start, end);
        break;
      }
      case 'top-clients': {
        const { start, end } = this.parseDateRange(startDate, endDate);
        const limit = Math.min(parseInt(limitStr || '10', 10) || 10, 50);
        reportData = await this.reportsService.getTopClients(tenantId, limit, start, end);
        break;
      }
      case 'exports': {
        const { start, end } = this.parseDateRange(startDate, endDate);
        reportData = await this.reportsService.getExports(tenantId, start, end);
        break;
      }
      default:
        throw new BadRequestException(`Tipo de reporte inválido: ${reportType}`);
    }

    const csv = this.reportsService.generateCSV(reportType, reportData);
    const filename = `reporte-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
  }

  // =====================================================================
  // Fase 2 — Fiscal reports endpoints
  // =====================================================================

  @Get('kardex/item/:catalogItemId')
  @ApiOperation({ summary: 'Descarga Kardex Art. 142-A para un producto' })
  @ApiParam({ name: 'catalogItemId', required: true, type: String })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @RequirePermission('report:export')
  @RequireFeature('inventory_reports')
  async getKardexItem(
    @CurrentUser() user: CurrentUserData,
    @Param('catalogItemId') catalogItemId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = this.ensureTenant(user);
    const { start, end } = this.parseDateRange(startDate, endDate);

    if (end.getTime() < start.getTime()) {
      throw new BadRequestException('endDate debe ser posterior a startDate');
    }

    const item = await this.prisma.catalogItem.findUnique({
      where: { id: catalogItemId },
      select: { code: true, tenantId: true },
    });
    if (!item || item.tenantId !== tenantId) {
      throw new NotFoundException(`CatalogItem ${catalogItemId} not found for tenant`);
    }

    const buffer = await this.kardexReportService.generateKardexExcel(tenantId, catalogItemId, start, end);
    this.streamXlsx(res, buffer, this.buildKardexItemFilename(item.code, end));
  }

  @Get('kardex/book')
  @ApiOperation({ summary: 'Descarga Kardex Libro Mensual (multi-item)' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @RequirePermission('report:export')
  @RequireFeature('inventory_reports')
  async getKardexBook(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = this.ensureTenant(user);
    const { start, end } = this.parseDateRange(startDate, endDate);

    if (end.getTime() < start.getTime()) {
      throw new BadRequestException('endDate debe ser posterior a startDate');
    }

    const buffer = await this.kardexReportService.generateKardexBookExcel(tenantId, start, end);
    this.streamXlsx(res, buffer, this.buildKardexBookFilename(end));
  }

  @Get('iva-declaracion')
  @ApiOperation({ summary: 'Descarga Declaración IVA F07 (ventas emitidas)' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @RequirePermission('report:export')
  @RequireFeature('advanced_reports')
  async getIvaDeclaracion(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = this.ensureTenant(user);
    const { start, end } = this.parseDateRange(startDate, endDate);

    // Service internally throws BadRequestException if endDate < startDate
    const buffer = await this.ivaDeclaracionReportService.generateIvaDeclaracionExcel(tenantId, start, end);
    this.streamXlsx(res, buffer, this.buildIvaFilename(end));
  }

  @Get('cogs-statement')
  @ApiOperation({ summary: 'Descarga Estado de Costo de Venta' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @RequirePermission('report:export')
  @RequireFeature('advanced_reports')
  async getCogsStatement(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = this.ensureTenant(user);
    const { start, end } = this.parseDateRange(startDate, endDate);

    // Service internally throws BadRequestException if endDate < startDate
    const buffer = await this.cogsStatementReportService.generateCogsStatementExcel(tenantId, start, end);
    this.streamXlsx(res, buffer, this.buildCogsFilename(end));
  }
}
