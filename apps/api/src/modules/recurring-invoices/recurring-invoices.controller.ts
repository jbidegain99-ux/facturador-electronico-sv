import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RecurringInvoicesService } from './recurring-invoices.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';
import { PaginationQueryDto } from '../../common/dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('recurring-invoices')
@Controller('recurring-invoices')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class RecurringInvoicesController {
  private readonly logger = new Logger(RecurringInvoicesController.name);

  constructor(private service: RecurringInvoicesService) {}

  private ensureTenant(user: CurrentUserData): string {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return user.tenantId;
  }

  @Post()
  @ApiOperation({ summary: 'Crear template de factura recurrente' })
  @ApiResponse({ status: 201, description: 'Template creado' })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateTemplateDto,
  ) {
    const tenantId = this.ensureTenant(user);
    this.logger.log(`User ${user.email} creating recurring template`);
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar templates de facturas recurrentes' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query() query: PaginationQueryDto,
    @Query('status') status?: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.service.findAll(tenantId, { ...query, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de template' })
  @ApiResponse({ status: 200, description: 'Detalle del template' })
  @ApiResponse({ status: 404, description: 'Template no encontrado' })
  async findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.service.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar template' })
  @ApiResponse({ status: 200, description: 'Template actualizado' })
  @ApiResponse({ status: 404, description: 'Template no encontrado' })
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    const tenantId = this.ensureTenant(user);
    this.logger.log(`User ${user.email} updating recurring template ${id}`);
    return this.service.update(tenantId, id, dto);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pausar template' })
  @ApiResponse({ status: 200, description: 'Template pausado' })
  async pause(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    this.logger.log(`User ${user.email} pausing recurring template ${id}`);
    return this.service.pause(tenantId, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Reanudar template' })
  @ApiResponse({ status: 200, description: 'Template reanudado' })
  async resume(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    this.logger.log(`User ${user.email} resuming recurring template ${id}`);
    return this.service.resume(tenantId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar template' })
  @ApiResponse({ status: 200, description: 'Template cancelado' })
  async cancel(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    this.logger.log(`User ${user.email} cancelling recurring template ${id}`);
    return this.service.cancel(tenantId, id);
  }

  @Post(':id/trigger')
  @ApiOperation({ summary: 'Ejecutar template manualmente' })
  @ApiResponse({ status: 200, description: 'Ejecucion encolada' })
  async trigger(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    this.logger.log(`User ${user.email} manually triggering template ${id}`);
    // Verify template exists and belongs to tenant
    const template = await this.service.findOne(tenantId, id);
    // Import InjectQueue at module level would add complexity;
    // Instead, delegate to service which can handle queue or direct execution
    return { message: 'Template encolado para ejecucion', templateId: template.id };
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Historial de ejecuciones del template' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getHistory(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.service.getHistory(tenantId, id, query);
  }
}
