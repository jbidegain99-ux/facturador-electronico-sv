import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Res, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiProduces } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { DteService } from './dte.service';
import { PdfService } from './pdf.service';
import { PaginationQueryDto } from '../../common/dto';

interface AuthRequest extends Request {
  user: {
    tenantId: string;
  };
}

@ApiTags('dte')
@Controller('dte')
@ApiBearerAuth()
export class DteController {
  constructor(
    private dteService: DteService,
    private pdfService: PdfService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo DTE' })
  create(
    @Request() req: AuthRequest,
    @Body() createDteDto: { tipoDte: string; data: Record<string, unknown> },
  ) {
    return this.dteService.createDte(req.user.tenantId, createDteDto.tipoDte, createDteDto.data);
  }

  @Post(':id/sign')
  @ApiOperation({ summary: 'Firmar DTE' })
  sign(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.dteService.signDte(id, req.user.tenantId);
  }

  @Post(':id/transmit')
  @ApiOperation({ summary: 'Transmitir DTE al MH' })
  transmit(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() credentials: { nit: string; password: string },
  ) {
    return this.dteService.transmitDte(id, credentials.nit, credentials.password, req.user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar DTEs del tenant con paginacion' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numero de pagina (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Registros por pagina (default: 20, max: 100)' })
  @ApiQuery({ name: 'tipoDte', required: false, type: String })
  @ApiQuery({ name: 'estado', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Campo para ordenar (createdAt, totalPagar, numeroControl)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Orden: asc o desc (default: desc)' })
  findAll(
    @Request() req: AuthRequest,
    @Query() query: PaginationQueryDto,
    @Query('tipoDte') tipoDte?: string,
    @Query('estado') estado?: string,
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Math.max(1, Number(query.limit) || 20), 100);
    return this.dteService.findByTenant(
      req.user.tenantId,
      page,
      limit,
      { tipoDte, estado, search: query.search },
      query.sortBy,
      query.sortOrder,
    );
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Obtener resumen de estadisticas del tenant' })
  getSummaryStats(@Request() req: AuthRequest) {
    return this.dteService.getSummaryStats(req.user.tenantId);
  }

  @Get('stats/by-date')
  @ApiOperation({ summary: 'Obtener estadisticas por rango de fechas' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'] })
  getStatsByDate(
    @Request() req: AuthRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    return this.dteService.getStatsByDate(
      req.user.tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      groupBy || 'day',
    );
  }

  @Get('stats/by-type')
  @ApiOperation({ summary: 'Obtener estadisticas por tipo de DTE' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getStatsByType(
    @Request() req: AuthRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dteService.getStatsByType(
      req.user.tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('stats/by-status')
  @ApiOperation({ summary: 'Obtener estadisticas por estado' })
  getStatsByStatus(@Request() req: AuthRequest) {
    return this.dteService.getStatsByStatus(req.user.tenantId);
  }

  @Get('stats/top-clients')
  @ApiOperation({ summary: 'Obtener top clientes por facturacion' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getTopClients(
    @Request() req: AuthRequest,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dteService.getTopClients(
      req.user.tenantId,
      limit ? parseInt(limit, 10) : 10,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('recent')
  @ApiOperation({ summary: 'Obtener los DTEs mas recientes' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRecentDTEs(
    @Request() req: AuthRequest,
    @Query('limit') limit?: string,
  ) {
    return this.dteService.getRecentDTEs(
      req.user.tenantId,
      limit ? parseInt(limit, 10) : 5,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener DTE por ID' })
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.dteService.findOne(id, req.user.tenantId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Descargar DTE como PDF' })
  @ApiProduces('application/pdf')
  async downloadPdf(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const dte = await this.dteService.findOneWithTenant(id, req.user.tenantId);

    if (!dte) {
      throw new NotFoundException('DTE no encontrado');
    }

    const pdfBuffer = await this.pdfService.generateInvoicePdf({
      ...dte,
      data: dte.jsonOriginal ? JSON.parse(dte.jsonOriginal) : {},
    });

    const filename = `DTE-${dte.numeroControl || dte.codigoGeneracion}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Post(':id/anular')
  @ApiOperation({ summary: 'Anular DTE' })
  anular(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { motivo: string },
  ) {
    return this.dteService.anularDte(id, body.motivo, req.user.tenantId);
  }
}
