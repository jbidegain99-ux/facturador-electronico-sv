import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Res,
  UseGuards,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { InvoiceTemplatesService } from './invoice-templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateConfigDto } from './dto/update-template-config.dto';
import {
  CurrentUser,
  CurrentUserData,
} from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PlanFeatureGuard } from '../plans/guards/plan-feature.guard';
import { RequireFeature } from '../plans/decorators/require-feature.decorator';

@ApiTags('invoice-templates')
@Controller('invoice-templates')
@ApiBearerAuth()
export class InvoiceTemplatesController {
  private readonly logger = new Logger(InvoiceTemplatesController.name);

  constructor(private readonly service: InvoiceTemplatesService) {}

  private ensureTenant(user: CurrentUserData): string {
    if (!user.tenantId) {
      throw new ForbiddenException('Se requiere un tenant activo');
    }
    return user.tenantId;
  }

  @Get()
  @ApiOperation({ summary: 'Listar plantillas de factura (sistema + tenant)' })
  @RequirePermission('template:read')
  async findAll(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    return this.service.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una plantilla' })
  @RequirePermission('template:read')
  async findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.service.findOne(id, tenantId);
  }

  @Post()
  @UseGuards(PlanFeatureGuard)
  @RequireFeature('custom_templates')
  @RequirePermission('template:create')
  @ApiOperation({ summary: 'Clonar una plantilla del sistema' })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateTemplateDto,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.service.cloneFromSystem(tenantId, dto);
  }

  @Patch(':id/config')
  @UseGuards(PlanFeatureGuard)
  @RequireFeature('custom_templates')
  @RequirePermission('template:update')
  @ApiOperation({ summary: 'Actualizar configuración de plantilla' })
  async updateConfig(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateConfigDto,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.service.updateConfig(id, tenantId, dto);
  }

  @Patch(':id/default')
  @UseGuards(PlanFeatureGuard)
  @RequireFeature('custom_templates')
  @RequirePermission('template:update')
  @ApiOperation({ summary: 'Establecer plantilla como predeterminada' })
  async setDefault(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.service.setDefault(id, tenantId);
  }

  @Delete(':id')
  @UseGuards(PlanFeatureGuard)
  @RequireFeature('custom_templates')
  @RequirePermission('template:delete')
  @ApiOperation({ summary: 'Eliminar plantilla personalizada' })
  async remove(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.service.remove(id, tenantId);
  }

  @Post(':id/preview')
  @RequirePermission('template:read')
  @ApiOperation({ summary: 'Generar vista previa PDF de plantilla' })
  @ApiProduces('application/pdf')
  async preview(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const tenantId = this.ensureTenant(user);
    const pdfBuffer = await this.service.preview(id, tenantId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="preview-plantilla.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
