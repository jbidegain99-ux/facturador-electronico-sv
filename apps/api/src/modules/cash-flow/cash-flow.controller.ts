import {
  Controller,
  Get,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { CashFlowService } from './cash-flow.service';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';

@ApiTags('Cash Flow')
@ApiBearerAuth()
@Controller('cash-flow')
export class CashFlowController {
  constructor(private readonly cashFlowService: CashFlowService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumen de cash flow para el período indicado' })
  @ApiQuery({ name: 'period', required: false, type: Number, description: 'Días (default 30)' })
  @RequirePermission('report:read')
  async getSummary(
    @CurrentUser() user: CurrentUserData,
    @Query('period') periodStr?: string,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    const period = periodStr ? Math.min(Math.max(parseInt(periodStr, 10) || 30, 1), 365) : 30;
    return this.cashFlowService.getSummary(user.tenantId, period);
  }

  @Get('by-method')
  @ApiOperation({ summary: 'Cash flow desglosado por método de pago' })
  @ApiQuery({ name: 'period', required: false, type: Number })
  @RequirePermission('report:read')
  async getByMethod(
    @CurrentUser() user: CurrentUserData,
    @Query('period') periodStr?: string,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    const period = periodStr ? Math.min(Math.max(parseInt(periodStr, 10) || 30, 1), 365) : 30;
    const summary = await this.cashFlowService.getSummary(user.tenantId, period);
    return summary.byMethod;
  }

  @Get('by-date')
  @ApiOperation({ summary: 'Cash flow por fecha (forecast)' })
  @ApiQuery({ name: 'period', required: false, type: Number })
  @RequirePermission('report:read')
  async getByDate(
    @CurrentUser() user: CurrentUserData,
    @Query('period') periodStr?: string,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    const period = periodStr ? Math.min(Math.max(parseInt(periodStr, 10) || 30, 1), 365) : 30;
    const summary = await this.cashFlowService.getSummary(user.tenantId, period);
    return summary.forecast;
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Alertas de cash flow (cheques venciendo, etc.)' })
  @RequirePermission('report:read')
  async getAlerts(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.cashFlowService.getAlerts(user.tenantId);
  }
}
