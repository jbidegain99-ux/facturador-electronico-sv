import { Body, Controller, ForbiddenException, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PlanFeatureGuard } from '../plans/guards/plan-feature.guard';
import { RequireFeature } from '../plans/decorators/require-feature.decorator';
import { InventoryAdjustmentService } from './services/inventory-adjustment.service';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { ListAdjustmentsDto } from './dto/list-adjustments.dto';

@ApiTags('inventory-adjustments')
@Controller('inventory/adjustments')
@ApiBearerAuth()
@UseGuards(PlanFeatureGuard)
@RequireFeature('inventory_reports')
export class InventoryAdjustmentsController {
  constructor(private readonly service: InventoryAdjustmentService) {}

  @Post()
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Crear ajuste manual de inventario' })
  async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateAdjustmentDto) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.createAdjustment(user.tenantId, user.id, dto);
  }

  @Get()
  @RequirePermission('catalog:read')
  @ApiOperation({ summary: 'Listar ajustes manuales' })
  async list(@CurrentUser() user: CurrentUserData, @Query() filters: ListAdjustmentsDto) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.listAdjustments(user.tenantId, filters);
  }
}
