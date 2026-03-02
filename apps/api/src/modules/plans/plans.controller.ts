import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../super-admin/guards/super-admin.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PlansService } from './plans.service';
import { PlanFeaturesService } from './services/plan-features.service';
import { PlanSupportService } from './services/plan-support.service';
import { CreatePlanDto, UpdatePlanDto, AssignPlanDto } from './dto';

@ApiTags('Plans')
@ApiBearerAuth()
@Controller('admin/plans')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class PlansAdminController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los planes con estadísticas' })
  async findAll() {
    return this.plansService.getPlansWithStats();
  }

  @Get('active')
  @ApiOperation({ summary: 'Listar solo planes activos' })
  async findActive() {
    return this.plansService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener plan por ID' })
  async findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo plan' })
  async create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar plan' })
  async update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar plan' })
  async delete(@Param('id') id: string) {
    return this.plansService.delete(id);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Crear planes por defecto' })
  async seed() {
    return this.plansService.seedDefaultPlans();
  }

  @Post('tenant/:tenantId/assign')
  @ApiOperation({ summary: 'Asignar plan a tenant' })
  async assignPlan(
    @Param('tenantId') tenantId: string,
    @Body() dto: AssignPlanDto,
  ) {
    return this.plansService.assignPlanToTenant(tenantId, dto.planId);
  }

  @Delete('tenant/:tenantId/plan')
  @ApiOperation({ summary: 'Remover plan de tenant' })
  async removePlan(@Param('tenantId') tenantId: string) {
    return this.plansService.removePlanFromTenant(tenantId);
  }

  @Get('tenant/:tenantId/usage')
  @ApiOperation({ summary: 'Obtener uso del tenant respecto a su plan' })
  async getTenantUsage(@Param('tenantId') tenantId: string) {
    return this.plansService.getTenantUsage(tenantId);
  }
}

@ApiTags('Plans')
@ApiBearerAuth()
@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(
    private readonly plansService: PlansService,
    private readonly planFeaturesService: PlanFeaturesService,
    private readonly planSupportService: PlanSupportService,
  ) {}

  @Get('active')
  @ApiOperation({ summary: 'Listar planes activos (para usuarios)' })
  async findActive() {
    return this.plansService.findActive();
  }

  @Get('my-usage')
  @ApiOperation({ summary: 'Obtener uso del plan del tenant actual' })
  async getMyUsage(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new BadRequestException('Solo usuarios de empresas pueden consultar uso del plan');
    }
    return this.plansService.getTenantUsage(user.tenantId);
  }

  @Get('features')
  @ApiOperation({ summary: 'Obtener features del plan actual del tenant' })
  async getFeatures(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new BadRequestException('Solo usuarios de empresas pueden consultar features del plan');
    }
    return this.plansService.getTenantFeatures(user.tenantId);
  }

  @Get('current')
  @ApiOperation({ summary: 'Obtener info completa del plan + uso del tenant actual' })
  async getCurrentPlan(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new BadRequestException('Solo usuarios de empresas pueden consultar su plan');
    }
    return this.planFeaturesService.getTenantUsageInfo(user.tenantId);
  }

  @Get('tenant/features')
  @ApiOperation({ summary: 'Obtener lista de features habilitados del tenant actual' })
  async getTenantFeatures(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new BadRequestException('Solo usuarios de empresas pueden consultar features');
    }
    const planCode = await this.planFeaturesService.getTenantPlanCode(user.tenantId);
    const enabledFeatures = await this.planFeaturesService.getPlanFeatures(planCode);
    return { planCode, features: enabledFeatures };
  }

  @Get('tenant/support')
  @ApiOperation({ summary: 'Obtener configuración de soporte del plan del tenant' })
  async getTenantSupport(@CurrentUser() user: CurrentUserData) {
    if (!user.tenantId) {
      throw new BadRequestException('Solo usuarios de empresas pueden consultar soporte');
    }
    const planCode = await this.planFeaturesService.getTenantPlanCode(user.tenantId);
    const config = await this.planSupportService.getSupportConfig(planCode);
    return { planCode, ...config };
  }

  @Get(':code')
  @ApiOperation({ summary: 'Obtener detalles públicos de un plan por código' })
  async getPlanByCode(@Param('code') code: string) {
    const plan = await this.plansService.findByCode(code.toUpperCase());
    if (!plan) {
      throw new BadRequestException(`Plan con código ${code} no encontrado`);
    }
    const enabledFeatures = await this.planFeaturesService.getPlanFeatures(plan.codigo);
    return { ...plan, enabledFeatures };
  }
}
