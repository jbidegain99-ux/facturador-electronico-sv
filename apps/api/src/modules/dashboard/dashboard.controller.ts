import { Controller, Get, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadisticas consolidadas del dashboard' })
  @RequirePermission('dte:read')
  async getStats(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.dashboardService.getStats(user.tenantId);
  }
}
