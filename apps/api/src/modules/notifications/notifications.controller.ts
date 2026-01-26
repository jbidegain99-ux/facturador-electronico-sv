import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../super-admin/guards/super-admin.guard';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, UpdateNotificationDto } from './dto';

@ApiTags('Notifications - Admin')
@ApiBearerAuth()
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class NotificationsAdminController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las notificaciones' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.notificationsService.findAll(includeInactive === 'true');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de notificaciones' })
  async getStats() {
    return this.notificationsService.getNotificationStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener notificación por ID' })
  async findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva notificación' })
  async create(@Body() dto: CreateNotificationDto, @Request() req: any) {
    return this.notificationsService.create(dto, req.user?.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar notificación' })
  async update(@Param('id') id: string, @Body() dto: UpdateNotificationDto) {
    return this.notificationsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar notificación' })
  async delete(@Param('id') id: string) {
    return this.notificationsService.delete(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Desactivar notificación' })
  async deactivate(@Param('id') id: string) {
    return this.notificationsService.update(id, { isActive: false });
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activar notificación' })
  async activate(@Param('id') id: string) {
    return this.notificationsService.update(id, { isActive: true });
  }
}

@ApiTags('Notifications - User')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsUserController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener notificaciones activas para el usuario actual' })
  async getMyNotifications(@Request() req: any) {
    const user = req.user;
    return this.notificationsService.getActiveNotificationsForUser(
      user.id,
      user.tenantId,
      user.tenant?.planId,
    );
  }

  @Get('count')
  @ApiOperation({ summary: 'Obtener cantidad de notificaciones sin leer' })
  async getUnreadCount(@Request() req: any) {
    const user = req.user;
    const count = await this.notificationsService.getUnreadCount(
      user.id,
      user.tenantId,
      user.tenant?.planId,
    );
    return { count };
  }

  @Post(':id/dismiss')
  @ApiOperation({ summary: 'Descartar una notificación' })
  async dismiss(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.dismissNotification(id, req.user.id);
  }

  @Post('dismiss-all')
  @ApiOperation({ summary: 'Descartar todas las notificaciones' })
  async dismissAll(@Request() req: any) {
    return this.notificationsService.dismissAllForUser(req.user.id);
  }
}
