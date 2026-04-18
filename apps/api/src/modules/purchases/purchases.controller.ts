import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PurchasesService } from './services/purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PostPurchaseDto } from './dto/post-purchase.dto';
import { PayPurchaseDto } from './dto/pay-purchase.dto';
import { AnularPurchaseDto } from './dto/anular-purchase.dto';
import { ReceivePurchaseDto } from './dto/receive-purchase.dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';

@ApiTags('purchases')
@Controller('purchases')
@ApiBearerAuth()
export class PurchasesController {
  private readonly logger = new Logger(PurchasesController.name);

  constructor(private readonly service: PurchasesService) {}

  @Post()
  @RequirePermission('purchases:create')
  @ApiOperation({ summary: 'Crear compra manual (DRAFT o POSTED)' })
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreatePurchaseDto) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.service.createManual(user.tenantId, user.id, dto);
  }

  @Get()
  @RequirePermission('purchases:read')
  @ApiOperation({ summary: 'Listar compras con paginación y filtros' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'proveedorId', required: false })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('proveedorId') proveedorId?: string,
    @Query('estado') estado?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.service.findAll(user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      proveedorId,
      estado,
      desde,
      hasta,
    });
  }

  @Get(':id')
  @RequirePermission('purchases:read')
  @ApiOperation({ summary: 'Obtener compra por ID' })
  findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.service.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @RequirePermission('purchases:update')
  @ApiOperation({ summary: 'Actualizar compra' })
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseDto,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.service.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('purchases:delete')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar (soft delete) compra' })
  async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    await this.service.softDelete(user.tenantId, id);
  }

  @Post(':id/post')
  @RequirePermission('purchases:post')
  @ApiOperation({ summary: 'Enviar compra de DRAFT a POSTED (genera asiento)' })
  post(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: PostPurchaseDto,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.service.postDraft(user.tenantId, user.id, id, dto);
  }

  @Post(':id/pay')
  @RequirePermission('purchases:pay')
  @ApiOperation({ summary: 'Registrar pago de compra' })
  pay(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: PayPurchaseDto,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.service.pay(user.tenantId, user.id, id, dto);
  }

  @Post(':id/anular')
  @RequirePermission('purchases:anular')
  @ApiOperation({ summary: 'Anular compra (reversa de asiento si aplica)' })
  anular(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: AnularPurchaseDto,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.service.anular(user.tenantId, user.id, id, dto);
  }

  @Post(':id/receive')
  @RequirePermission('purchases:receive')
  @ApiOperation({ summary: 'Recibir compra (post-dated reception)' })
  receive(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseDto,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return this.service.receiveLate(user.tenantId, user.id, id, dto);
  }
}
