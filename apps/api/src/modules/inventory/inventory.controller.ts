import { Controller, Get, Param, Query, Res, ForbiddenException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { InventoryService } from './services/inventory.service';
import { InventoryExportService } from './services/inventory-export.service';
import { InventoryFilterDto } from './dto/inventory-filter.dto';
import { KardexFilterDto } from './dto/kardex-filter.dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PlanFeatureGuard } from '../plans/guards/plan-feature.guard';
import { RequireFeature } from '../plans/decorators/require-feature.decorator';

@ApiTags('inventory')
@Controller('inventory')
@ApiBearerAuth()
@UseGuards(PlanFeatureGuard)
@RequireFeature('inventory_reports')
export class InventoryController {
  constructor(
    private readonly service: InventoryService,
    private readonly exporter: InventoryExportService,
  ) {}

  @Get()
  @RequirePermission('catalog:read')
  @ApiOperation({ summary: 'Listar inventario con filtros + paginación' })
  async findAll(@CurrentUser() user: CurrentUserData, @Query() filters: InventoryFilterDto) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.findAll(user.tenantId, filters);
  }

  @Get('export')
  @RequirePermission('report:export')
  @ApiOperation({ summary: 'Exportar snapshot XLSX del inventario' })
  async exportStockList(
    @CurrentUser() user: CurrentUserData,
    @Query() filters: InventoryFilterDto,
    @Res() res: Response,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    const buf = await this.exporter.exportStockList(user.tenantId, filters);
    const filename = `inventario_snapshot_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  }

  @Get('alerts')
  @RequirePermission('catalog:read')
  @ApiOperation({ summary: 'Counts de alertas de inventario (bajo mínimo, sin stock)' })
  getAlerts(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.getAlerts(user.tenantId);
  }

  @Get('alerts/top')
  @RequirePermission('catalog:read')
  @ApiOperation({ summary: 'Top N ítems bajo mínimo / sin stock ordenados por déficit' })
  getTopBelowReorder(@CurrentUser() user: CurrentUserData, @Query('limit') limit?: string) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    const parsed = limit ? parseInt(limit, 10) : 5;
    const n = Math.min(50, Math.max(1, Number.isFinite(parsed) && parsed > 0 ? parsed : 5));
    return this.service.getTopBelowReorder(user.tenantId, n);
  }

  @Get(':catalogItemId')
  @RequirePermission('catalog:read')
  @ApiOperation({ summary: 'Obtener detalle de inventario por ítem' })
  findOne(@CurrentUser() user: CurrentUserData, @Param('catalogItemId') catalogItemId: string) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.findOne(user.tenantId, catalogItemId);
  }

  @Get(':catalogItemId/kardex')
  @RequirePermission('catalog:read')
  @ApiOperation({ summary: 'Kardex JSON para un ítem en un rango de fechas' })
  getKardex(
    @CurrentUser() user: CurrentUserData,
    @Param('catalogItemId') catalogItemId: string,
    @Query() filters: KardexFilterDto,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.getKardex(
      user.tenantId,
      catalogItemId,
      filters.startDate,
      filters.endDate,
      filters.movementType,
    );
  }
}
