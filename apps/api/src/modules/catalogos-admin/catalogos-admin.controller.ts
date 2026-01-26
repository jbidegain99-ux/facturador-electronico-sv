import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../super-admin/guards/super-admin.guard';
import { CatalogosAdminService } from './catalogos-admin.service';
import { SyncCatalogoDto, CreateCatalogoDto, UpdateCatalogoDto } from './dto';

// ============ ADMIN ENDPOINTS ============
@ApiTags('admin-catalogos')
@ApiBearerAuth()
@Controller('admin/catalogos')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class CatalogosAdminController {
  constructor(private readonly catalogosService: CatalogosAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los catalogos' })
  getAllCatalogos() {
    return this.catalogosService.getAllCatalogos();
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo catalogo' })
  createCatalogo(@Body() data: CreateCatalogoDto) {
    return this.catalogosService.createCatalogo(data);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Sembrar catalogos iniciales' })
  seedCatalogos() {
    return this.catalogosService.seedInitialCatalogos();
  }

  @Post('seed/departamentos')
  @ApiOperation({ summary: 'Sembrar departamentos de El Salvador' })
  seedDepartamentos() {
    return this.catalogosService.seedDepartamentosYMunicipios();
  }

  @Get(':codigo')
  @ApiOperation({ summary: 'Obtener detalle de un catalogo' })
  getCatalogo(@Param('codigo') codigo: string) {
    return this.catalogosService.getCatalogoByCodigo(codigo);
  }

  @Patch(':codigo')
  @ApiOperation({ summary: 'Actualizar un catalogo' })
  updateCatalogo(
    @Param('codigo') codigo: string,
    @Body() data: UpdateCatalogoDto,
  ) {
    return this.catalogosService.updateCatalogo(codigo, data);
  }

  @Get(':codigo/items')
  @ApiOperation({ summary: 'Obtener items de un catalogo' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'parentCodigo', required: false })
  getCatalogoItems(
    @Param('codigo') codigo: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('parentCodigo') parentCodigo?: string,
  ) {
    return this.catalogosService.getCatalogoItems(codigo, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      search,
      parentCodigo,
    });
  }

  @Post(':codigo/sync')
  @ApiOperation({ summary: 'Sincronizar items de un catalogo' })
  syncCatalogo(
    @Param('codigo') codigo: string,
    @Body() data: SyncCatalogoDto,
  ) {
    return this.catalogosService.syncCatalogo(codigo, data);
  }

  @Get(':codigo/export')
  @ApiOperation({ summary: 'Exportar catalogo como JSON' })
  async exportCatalogo(
    @Param('codigo') codigo: string,
    @Res() res: Response,
  ) {
    const data = await this.catalogosService.exportCatalogo(codigo);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${codigo}.json`);
    return res.send(JSON.stringify(data, null, 2));
  }
}

// ============ PUBLIC ENDPOINTS (for forms) ============
@ApiTags('catalogos')
@Controller('catalogos')
export class CatalogosPublicController {
  constructor(private readonly catalogosService: CatalogosAdminService) {}

  @Get(':codigo/items')
  @ApiOperation({ summary: 'Obtener items activos de un catalogo (publico)' })
  @ApiQuery({ name: 'parentCodigo', required: false })
  getPublicItems(
    @Param('codigo') codigo: string,
    @Query('parentCodigo') parentCodigo?: string,
  ) {
    return this.catalogosService.getPublicCatalogoItems(codigo, parentCodigo);
  }
}
