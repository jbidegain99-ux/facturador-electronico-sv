import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import {
  ReportsService,
  ReportByTypeResult,
  ReportByPeriodResult,
  ReportRetencionesResult,
  TopClientStat,
  ReportExportsResult,
} from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

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

  @Get('by-type')
  @ApiOperation({ summary: 'Reporte de ventas por tipo de DTE' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
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
}
