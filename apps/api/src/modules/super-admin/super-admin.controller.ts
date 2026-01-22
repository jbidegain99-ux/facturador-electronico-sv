import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { SuperAdminService } from './super-admin.service';

// Bootstrap controller - no authentication required
@ApiTags('super-admin')
@Controller('super-admin')
export class SuperAdminBootstrapController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('bootstrap/status')
  @ApiOperation({ summary: 'Check if a Super Admin exists' })
  async checkBootstrapStatus() {
    const hasAdmin = await this.superAdminService.hasSuperAdmin();
    return { hasAdmin, canBootstrap: !hasAdmin };
  }

  @Post('bootstrap')
  @ApiOperation({ summary: 'Create the first Super Admin (only works if none exists)' })
  async bootstrapSuperAdmin(
    @Body() data: { email: string; password: string; nombre: string },
  ) {
    return this.superAdminService.bootstrapSuperAdmin(data);
  }
}

// Main controller - requires SUPER_ADMIN authentication
@ApiTags('super-admin')
@ApiBearerAuth()
@Controller('super-admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  // ============ DASHBOARD ============
  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener estadisticas del dashboard' })
  getDashboardStats() {
    return this.superAdminService.getDashboardStats();
  }

  @Get('activity')
  @ApiOperation({ summary: 'Obtener actividad reciente' })
  getRecentActivity(@Query('limit') limit?: string) {
    return this.superAdminService.getRecentActivity(limit ? parseInt(limit) : 50);
  }

  // ============ TENANTS ============
  @Get('tenants')
  @ApiOperation({ summary: 'Listar todas las empresas' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'plan', required: false })
  @ApiQuery({ name: 'status', required: false })
  getAllTenants(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('plan') plan?: string,
    @Query('status') status?: string,
  ) {
    return this.superAdminService.getAllTenants({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search,
      plan,
      status,
    });
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Obtener detalle de una empresa' })
  getTenantById(@Param('id') id: string) {
    return this.superAdminService.getTenantById(id);
  }

  @Put('tenants/:id')
  @ApiOperation({ summary: 'Actualizar plan/configuracion de empresa' })
  updateTenantPlan(
    @Param('id') id: string,
    @Body() data: {
      plan?: string;
      planStatus?: string;
      planExpiry?: Date;
      maxDtesPerMonth?: number;
      adminNotes?: string;
    },
  ) {
    return this.superAdminService.updateTenantPlan(id, data);
  }

  @Post('tenants/:id/suspend')
  @ApiOperation({ summary: 'Suspender una empresa' })
  suspendTenant(
    @Param('id') id: string,
    @Body() data: { reason?: string },
  ) {
    return this.superAdminService.suspendTenant(id, data.reason);
  }

  @Post('tenants/:id/activate')
  @ApiOperation({ summary: 'Activar una empresa suspendida' })
  activateTenant(@Param('id') id: string) {
    return this.superAdminService.activateTenant(id);
  }

  @Delete('tenants/:id')
  @ApiOperation({ summary: 'Eliminar una empresa y todos sus datos' })
  deleteTenant(@Param('id') id: string) {
    return this.superAdminService.deleteTenant(id);
  }

  // ============ SUPER ADMINS ============
  @Get('admins')
  @ApiOperation({ summary: 'Listar super administradores' })
  getAllSuperAdmins() {
    return this.superAdminService.getAllSuperAdmins();
  }

  @Post('admins')
  @ApiOperation({ summary: 'Crear nuevo super administrador' })
  createSuperAdmin(
    @Body() data: { email: string; password: string; nombre: string },
  ) {
    return this.superAdminService.createSuperAdmin(data);
  }
}
