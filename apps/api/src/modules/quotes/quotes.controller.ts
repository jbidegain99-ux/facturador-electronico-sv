import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  CurrentUser,
  CurrentUserData,
} from '../../common/decorators/current-user.decorator';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QueryQuoteDto } from './dto/query-quote.dto';

@ApiTags('quotes')
@Controller('quotes')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  private ensureTenant(user: CurrentUserData): string {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return user.tenantId;
  }

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
    return this.quotesService.update(tenantId, id, dto);
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
    return this.quotesService.send(tenantId, id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprobar cotizacion (Enviada -> Aprobada)' })
  approve(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.approve(tenantId, id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rechazar cotizacion (Enviada -> Rechazada)' })
  reject(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.reject(tenantId, id, body.reason);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar cotizacion' })
  cancel(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.cancel(tenantId, id);
  }

  // ── Conversion ────────────────────────────────────────────────────

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convertir cotizacion a factura (Aprobada -> Convertida)' })
  convertToInvoice(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.convertToInvoice(tenantId, id);
  }
}
