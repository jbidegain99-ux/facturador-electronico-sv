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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogItemsService } from './catalog-items.service';
import { CreateCatalogItemDto, UpdateCatalogItemDto, QueryCatalogItemDto } from './dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('catalog-items')
@Controller('catalog-items')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CatalogItemsController {
  constructor(private readonly catalogItemsService: CatalogItemsService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateCatalogItemDto,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.catalogItemsService.create(user.tenantId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query() query: QueryCatalogItemDto,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.catalogItemsService.findAll(user.tenantId, query);
  }

  @Get('search')
  search(
    @CurrentUser() user: CurrentUserData,
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.catalogItemsService.search(
      user.tenantId,
      q || '',
      limit ? Number(limit) : 20,
    );
  }

  @Get('recent')
  getRecent(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.catalogItemsService.getRecent(user.tenantId);
  }

  @Get('favorites')
  getFavorites(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.catalogItemsService.getFavorites(user.tenantId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.catalogItemsService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateCatalogItemDto,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.catalogItemsService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.catalogItemsService.remove(user.tenantId, id);
  }

  @Post(':id/favorite')
  toggleFavorite(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.catalogItemsService.toggleFavorite(user.tenantId, id);
  }
}
