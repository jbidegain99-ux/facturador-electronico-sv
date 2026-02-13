import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CatalogItemsService, CatalogItemRow } from './catalog-items.service';
import {
  CreateCatalogItemDto,
  UpdateCatalogItemDto,
  QueryCatalogItemDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ImportItemDto {
  code: string;
  name: string;
  description?: string;
  type?: string;
  basePrice: number;
  costPrice?: number;
  tipoItem?: number;
  uniMedida?: number;
  tributo?: string;
  taxRate?: number;
  categoryId?: string;
}

class ImportCatalogItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportItemDto)
  rows: ImportItemDto[];
}

@ApiTags('catalog-items')
@Controller('catalog-items')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CatalogItemsController {
  private readonly logger = new Logger(CatalogItemsController.name);

  constructor(private readonly catalogItemsService: CatalogItemsService) {}

  private ensureTenant(user: CurrentUserData): string {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return user.tenantId;
  }

  // =========================================================================
  // PLAN LIMIT INFO
  // =========================================================================

  @Get('plan-limit')
  @ApiOperation({ summary: 'Get current plan limit info for catalog items' })
  getPlanLimit(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    return this.catalogItemsService.getPlanLimitInfo(tenantId);
  }

  // =========================================================================
  // CATEGORIES
  // =========================================================================

  @Get('categories')
  @ApiOperation({ summary: 'List categories for tenant' })
  getCategories(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    return this.catalogItemsService.getCategories(tenantId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  createCategory(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateCategoryDto,
  ) {
    const tenantId = this.ensureTenant(user);
    this.logger.log(`User ${user.email} creating category "${dto.name}"`);
    return this.catalogItemsService.createCategory(tenantId, dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.catalogItemsService.updateCategory(tenantId, id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category (unlinks items)' })
  deleteCategory(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    this.logger.log(`User ${user.email} deleting category ${id}`);
    return this.catalogItemsService.deleteCategory(tenantId, id);
  }

  // =========================================================================
  // IMPORT / EXPORT
  // =========================================================================

  @Post('import')
  @ApiOperation({ summary: 'Bulk import catalog items (upsert by code)' })
  importItems(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ImportCatalogItemsDto,
  ) {
    const tenantId = this.ensureTenant(user);
    this.logger.log(`User ${user.email} importing ${dto.rows.length} items`);
    return this.catalogItemsService.importItems(tenantId, dto.rows as CatalogItemRow[]);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export all active catalog items' })
  exportItems(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    this.logger.log(`User ${user.email} exporting catalog items`);
    return this.catalogItemsService.exportItems(tenantId);
  }

  // =========================================================================
  // CATALOG ITEMS CRUD
  // =========================================================================

  @Post()
  @ApiOperation({ summary: 'Create a catalog item' })
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateCatalogItemDto,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.catalogItemsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List catalog items with pagination and filters' })
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query() query: QueryCatalogItemDto,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.catalogItemsService.findAll(tenantId, query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search catalog items by name or code' })
  search(
    @CurrentUser() user: CurrentUserData,
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.catalogItemsService.search(
      tenantId,
      q || '',
      limit ? Number(limit) : 20,
    );
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recently used catalog items' })
  getRecent(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    return this.catalogItemsService.getRecent(tenantId);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get favorite catalog items' })
  getFavorites(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    return this.catalogItemsService.getFavorites(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a catalog item by ID' })
  findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.catalogItemsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a catalog item' })
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateCatalogItemDto,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.catalogItemsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a catalog item' })
  remove(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.catalogItemsService.remove(tenantId, id);
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: 'Toggle favorite status' })
  toggleFavorite(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.catalogItemsService.toggleFavorite(tenantId, id);
  }
}
