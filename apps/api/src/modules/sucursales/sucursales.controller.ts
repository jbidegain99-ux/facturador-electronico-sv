import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SucursalesService } from './sucursales.service';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';

interface AuthRequest {
  user: { tenantId: string; userId: string };
}

@ApiTags('Sucursales')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('sucursales')
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar sucursales del tenant' })
  @RequirePermission('branch:read')
  findAll(@Request() req: AuthRequest) {
    return this.sucursalesService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener sucursal por ID' })
  @RequirePermission('branch:read')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.sucursalesService.findOne(id, req.user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear sucursal' })
  @RequirePermission('branch:update')
  create(
    @Request() req: AuthRequest,
    @Body() body: {
      nombre: string;
      codEstableMH?: string;
      codEstable?: string;
      tipoEstablecimiento?: string;
      direccion: string;
      departamento?: string;
      municipio?: string;
      telefono?: string;
      correo?: string;
      esPrincipal?: boolean;
    },
  ) {
    return this.sucursalesService.create(req.user.tenantId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar sucursal' })
  @RequirePermission('branch:update')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: {
      nombre?: string;
      codEstableMH?: string;
      codEstable?: string;
      tipoEstablecimiento?: string;
      direccion?: string;
      departamento?: string;
      municipio?: string;
      telefono?: string;
      correo?: string;
      esPrincipal?: boolean;
      activa?: boolean;
    },
  ) {
    return this.sucursalesService.update(id, req.user.tenantId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar sucursal' })
  @RequirePermission('branch:update')
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.sucursalesService.remove(id, req.user.tenantId);
  }

  // ===== PUNTOS DE VENTA =====

  @Get(':sucursalId/puntos-venta')
  @ApiOperation({ summary: 'Listar puntos de venta de una sucursal' })
  @RequirePermission('pos:read')
  findPuntosVenta(@Request() req: AuthRequest, @Param('sucursalId') sucursalId: string) {
    return this.sucursalesService.findPuntosVenta(sucursalId, req.user.tenantId);
  }

  @Post(':sucursalId/puntos-venta')
  @ApiOperation({ summary: 'Crear punto de venta' })
  @RequirePermission('pos:update')
  createPuntoVenta(
    @Request() req: AuthRequest,
    @Param('sucursalId') sucursalId: string,
    @Body() body: { nombre: string; codPuntoVentaMH?: string; codPuntoVenta?: string },
  ) {
    return this.sucursalesService.createPuntoVenta(sucursalId, req.user.tenantId, body);
  }

  @Patch('puntos-venta/:pvId')
  @ApiOperation({ summary: 'Actualizar punto de venta' })
  @RequirePermission('pos:update')
  updatePuntoVenta(
    @Request() req: AuthRequest,
    @Param('pvId') pvId: string,
    @Body() body: { nombre?: string; codPuntoVentaMH?: string; codPuntoVenta?: string; activo?: boolean },
  ) {
    return this.sucursalesService.updatePuntoVenta(pvId, req.user.tenantId, body);
  }

  @Delete('puntos-venta/:pvId')
  @ApiOperation({ summary: 'Eliminar punto de venta' })
  @RequirePermission('pos:update')
  removePuntoVenta(@Request() req: AuthRequest, @Param('pvId') pvId: string) {
    return this.sucursalesService.removePuntoVenta(pvId, req.user.tenantId);
  }
}
