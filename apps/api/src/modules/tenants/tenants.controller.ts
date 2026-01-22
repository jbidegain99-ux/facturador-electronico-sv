import { Controller, Get, Post, Body, Patch, Put, Param, UseGuards, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  private readonly logger = new Logger(TenantsController.name);

  constructor(private tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo tenant/empresa' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener datos del tenant del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del tenant' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async getMyTenant(@CurrentUser() user: CurrentUserData) {
    this.logger.log(`Getting tenant for user ${user.email}, tenantId: ${user.tenantId}`);

    if (!user.tenantId) {
      this.logger.warn(`User ${user.email} has no tenantId`);
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    const tenant = await this.tenantsService.findOne(user.tenantId);

    if (!tenant) {
      this.logger.error(`Tenant ${user.tenantId} not found for user ${user.email}`);
      throw new NotFoundException('Tenant no encontrado');
    }

    this.logger.log(`Tenant ${tenant.nombre} found for user ${user.email}`);
    return tenant;
  }

  @Put('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar datos del tenant del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Tenant actualizado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Usuario no tiene tenant asignado' })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async updateMyTenant(
    @CurrentUser() user: CurrentUserData,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    this.logger.log(`Updating tenant for user ${user.email}, tenantId: ${user.tenantId}`);
    this.logger.debug(`Update data: ${JSON.stringify(updateTenantDto)}`);

    if (!user.tenantId) {
      this.logger.warn(`User ${user.email} has no tenantId`);
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    const existingTenant = await this.tenantsService.findOne(user.tenantId);

    if (!existingTenant) {
      this.logger.error(`Tenant ${user.tenantId} not found for user ${user.email}`);
      throw new NotFoundException('Tenant no encontrado');
    }

    const updatedTenant = await this.tenantsService.update(user.tenantId, updateTenantDto);
    this.logger.log(`Tenant ${updatedTenant.nombre} updated successfully`);

    return updatedTenant;
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los tenants' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener tenant por ID' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar tenant' })
  update(@Param('id') id: string, @Body() updateTenantDto: Partial<CreateTenantDto>) {
    return this.tenantsService.update(id, updateTenantDto);
  }
}
