import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../super-admin/guards/super-admin.guard';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogFilterDto, AuditAction, AuditModule } from './dto';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('api/v1/admin/audit-logs')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar logs de auditoría con filtros' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'module', required: false, enum: AuditModule })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'success', required: false, type: Boolean })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('userId') userId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('action') action?: AuditAction,
    @Query('module') module?: AuditModule,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('success') success?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    const filters: AuditLogFilterDto = {
      userId,
      tenantId,
      action,
      module,
      entityType,
      entityId,
      success: success ? success === 'true' : undefined,
      startDate,
      endDate,
      search,
    };

    return this.auditLogsService.findAll(filters, page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de auditoría' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getStats(
    @Query('tenantId') tenantId?: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days?: number,
  ) {
    return this.auditLogsService.getStats(tenantId, days);
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Obtener línea de tiempo de actividad' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getTimeline(
    @Query('tenantId') tenantId?: string,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days?: number,
  ) {
    return this.auditLogsService.getActivityTimeline(tenantId, days);
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Obtener actividad de un tenant' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTenantActivity(
    @Param('tenantId') tenantId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.auditLogsService.getTenantActivity(tenantId, limit);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener actividad de un usuario' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.auditLogsService.getUserActivity(userId, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener log por ID' })
  async findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(id);
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Limpiar logs antiguos' })
  @ApiQuery({ name: 'daysToKeep', required: false, type: Number })
  async cleanup(
    @Query('daysToKeep', new DefaultValuePipe(90), ParseIntPipe) daysToKeep: number,
  ) {
    return this.auditLogsService.cleanOldLogs(daysToKeep);
  }
}
