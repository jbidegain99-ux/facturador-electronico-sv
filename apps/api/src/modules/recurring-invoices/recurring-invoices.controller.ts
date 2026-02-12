import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RecurringInvoicesService } from './recurring-invoices.service';
import { RecurringInvoiceCronService } from './recurring-invoice-cron.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';
import { PaginationQueryDto } from '../../common/dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { getPlanFeatures } from '../../common/plan-features';

@ApiTags('recurring-invoices')
@Controller('recurring-invoices')
@ApiBearerAuth()
export class RecurringInvoicesController {
  private readonly logger = new Logger(RecurringInvoicesController.name);

  constructor(
    private service: RecurringInvoicesService,
    private cronService: RecurringInvoiceCronService,
  ) {}

  private ensureTenant(user: CurrentUserData): string {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return user.tenantId;
  }

  private async ensureRecurringAccess(tenantId: string): Promise<void> {
    const planCode = await this.service.getTenantPlanCode(tenantId);
    const features = getPlanFeatures(planCode);
    if (!features.recurringInvoices) {
      throw new ForbiddenException(
        'Las facturas recurrentes requieren el plan Pro. Actualiza tu plan para acceder a esta funcionalidad.',
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Crear template de factura recurrente' })
  @ApiResponse({ status: 201, description: 'Template creado' })
  @ApiResponse({ status: 403, description: 'Plan no permite facturas recurrentes' })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateTemplateDto,
  ) {
    const tenantId = this.ensureTenant(user);
    await this.ensureRecurringAccess(tenantId);
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
  @ApiResponse({ status: 403, description: 'Plan no permite facturas recurrentes' })
  @ApiResponse({ status: 404, description: 'Template no encontrado' })
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    const tenantId = this.ensureTenant(user);
    await this.ensureRecurringAccess(tenantId);
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
  @ApiResponse({ status: 200, description: 'Template ejecutado' })
  @ApiResponse({ status: 400, description: 'Cooldown activo - esperar antes de re-ejecutar' })
  async trigger(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    await this.ensureRecurringAccess(tenantId);

    // Verify template belongs to tenant and check cooldown
    const template = await this.service.findOne(tenantId, id);
    const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
    if (template.lastRunDate) {
      const elapsed = Date.now() - new Date(template.lastRunDate).getTime();
      if (elapsed < COOLDOWN_MS) {
        const minutesLeft = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
        throw new BadRequestException(
          `Template fue ejecutado recientemente. Espera ${minutesLeft} minuto(s) antes de re-ejecutar.`,
        );
      }
    }

    this.logger.log(`User ${user.email} manually triggering template ${id}`);
    const result = await this.cronService.processTemplate(id);
    return { message: 'Template ejecutado exitosamente', dteId: result.dteId };
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
