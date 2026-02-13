import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ForbiddenException,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CurrentUser,
  CurrentUserData,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QueryQuoteDto } from './dto/query-quote.dto';
import { ClientApprovalDto, ClientRejectionDto } from './dto/approval.dto';

// ── Public endpoints (no auth) ────────────────────────────────────────
@Public()
@ApiTags('quotes-public')
@Controller('quotes/public')
export class QuotesPublicController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get('approve/:token')
  @ApiOperation({ summary: 'Get quote details by approval token (public)' })
  getQuoteForApproval(@Param('token') token: string) {
    return this.quotesService.getQuoteByToken(token);
  }

  @Post('approve/:token')
  @ApiOperation({ summary: 'Approve a quote via public link' })
  approveQuote(
    @Param('token') token: string,
    @Body() dto: ClientApprovalDto,
    @Ip() clientIp: string,
  ) {
    return this.quotesService.approveByClient(token, dto, clientIp);
  }

  @Post('reject/:token')
  @ApiOperation({ summary: 'Reject a quote via public link' })
  rejectQuote(
    @Param('token') token: string,
    @Body() dto: ClientRejectionDto,
    @Ip() clientIp: string,
  ) {
    return this.quotesService.rejectByClient(token, dto, clientIp);
  }
}

// ── Authenticated endpoints ───────────────────────────────────────────

@ApiTags('quotes')
@Controller('quotes')
@ApiBearerAuth()
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  private ensureTenant(user: CurrentUserData): string {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return user.tenantId;
  }

  // ── CRUD ────────────────────────────────────────────────────────────

  @Get('next-number')
  @ApiOperation({ summary: 'Obtener siguiente numero de cotizacion' })
  getNextNumber(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.getNextNumber(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva cotizacion' })
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateQuoteDto,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.create(tenantId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cotizaciones con paginacion y filtros' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query() query: QueryQuoteDto,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.findAll(tenantId, query);
  }

  // NOTE: group/:groupId MUST be before :id to avoid being shadowed
  @Get('group/:groupId')
  @ApiOperation({ summary: 'Ver todas las versiones de un grupo de cotizacion' })
  getQuoteVersions(
    @CurrentUser() user: CurrentUserData,
    @Param('groupId') groupId: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.getQuoteVersions(tenantId, groupId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cotizacion por ID' })
  findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cotizacion (solo Borrador)' })
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.update(tenantId, id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cotizacion (solo Borrador)' })
  remove(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.remove(tenantId, id);
  }

  // ── State Transitions ─────────────────────────────────────────────

  @Post(':id/send')
  @ApiOperation({ summary: 'Enviar cotizacion (Borrador -> Enviada)' })
  send(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.send(tenantId, id, user.id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprobar cotizacion manualmente (admin)' })
  approve(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.approve(tenantId, id, user.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rechazar cotizacion (Enviada -> Rechazada)' })
  reject(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.reject(tenantId, id, body.reason, user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar cotizacion' })
  cancel(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.cancel(tenantId, id, user.id);
  }

  // ── Conversion ────────────────────────────────────────────────────

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convertir cotizacion a factura' })
  convertToInvoice(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.convertToInvoice(tenantId, id, user.id);
  }

  // ── Versioning ────────────────────────────────────────────────────

  @Post(':id/create-version')
  @ApiOperation({ summary: 'Crear nueva version de cotizacion (PRO)' })
  createNewVersion(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.createNewVersion(tenantId, id, user.id);
  }

  // ── Audit Trail ───────────────────────────────────────────────────

  @Get(':id/status-history')
  @ApiOperation({ summary: 'Obtener historial de estados de cotizacion' })
  getStatusHistory(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.getStatusHistory(tenantId, id);
  }
}
