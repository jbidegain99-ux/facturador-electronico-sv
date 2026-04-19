import {
  Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Res,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PlanFeatureGuard } from '../plans/guards/plan-feature.guard';
import { RequireFeature } from '../plans/decorators/require-feature.decorator';
import { PhysicalCountService } from './services/physical-count.service';
import { CreatePhysicalCountDto } from './dto/create-physical-count.dto';
import { ListCountsDto } from './dto/list-counts.dto';
import { UpdateDetailDto } from './dto/update-detail.dto';
import { FinalizeDto } from './dto/finalize.dto';
import { CancelDto } from './dto/cancel.dto';

interface MulterFile {
  buffer: Buffer;
  size: number;
  originalname: string;
}

const MAX_CSV_SIZE = 5 * 1024 * 1024;

@ApiTags('physical-counts')
@Controller('physical-counts')
@ApiBearerAuth()
@UseGuards(PlanFeatureGuard)
@RequireFeature('inventory_reports')
export class PhysicalCountsController {
  constructor(private readonly service: PhysicalCountService) {}

  @Post()
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Crear conteo físico anual (DRAFT)' })
  async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreatePhysicalCountDto) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.create(user.tenantId, user.id, dto);
  }

  @Get()
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Listar conteos del tenant' })
  async list(@CurrentUser() user: CurrentUserData, @Query() filters: ListCountsDto) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.findAll(user.tenantId, filters);
  }

  @Get(':id')
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Detalle de conteo + líneas' })
  async findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Query() filters: { search?: string; page?: number; limit?: number },
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.findOne(user.tenantId, id, filters);
  }

  @Patch(':id/details/:detailId')
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Actualizar línea del conteo' })
  async updateDetail(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Param('detailId') detailId: string,
    @Body() dto: UpdateDetailDto,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.updateDetail(user.tenantId, id, detailId, dto);
  }

  @Post(':id/upload-csv')
  @RequirePermission('inventory:adjust')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_CSV_SIZE } }))
  @ApiOperation({ summary: 'Subir CSV con countedQty' })
  async uploadCsv(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @UploadedFile() file: MulterFile,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    if (!file) {
      throw new ForbiddenException('File required');
    }
    const csv = file.buffer.toString('utf8');
    return this.service.uploadCsv(user.tenantId, id, csv);
  }

  @Post(':id/finalize')
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Finalizar conteo (genera ajustes)' })
  async finalize(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() _dto: FinalizeDto,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.finalize(user.tenantId, user.id, id);
  }

  @Post(':id/cancel')
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Cancelar conteo en DRAFT' })
  async cancel(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: CancelDto,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    return this.service.cancel(user.tenantId, id, dto);
  }

  @Get(':id/csv-template')
  @RequirePermission('inventory:adjust')
  @ApiOperation({ summary: 'Descargar plantilla CSV del conteo' })
  async getCsvTemplate(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Usuario no tiene tenant asignado');
    const csv = await this.service.getCsvTemplate(user.tenantId, id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="conteo_template.csv"');
    res.send(csv);
  }
}
