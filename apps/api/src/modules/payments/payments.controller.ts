import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Request,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PaymentsService } from './payments.service';

interface AuthRequest {
  user: { tenantId: string; userId: string };
}

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar método de pago para un DTE' })
  @RequirePermission('dte:update')
  create(
    @Request() req: AuthRequest,
    @Body() body: {
      dteId: string;
      tipo: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'TARJETA' | 'OTRA';
      descripcion?: string;
      numeroCheque?: string;
      bancoEmisor?: string;
      numeroCuenta?: string;
      referencia?: string;
    },
  ) {
    return this.paymentsService.create(req.user.tenantId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar métodos de pago del tenant' })
  @RequirePermission('dte:read')
  findAll(
    @Request() req: AuthRequest,
    @Query('tipo') tipo?: string,
    @Query('estado') estado?: string,
  ) {
    return this.paymentsService.findAllByTenant(req.user.tenantId, { tipo, estado });
  }

  @Get('dte/:dteId')
  @ApiOperation({ summary: 'Obtener método de pago por DTE ID' })
  @RequirePermission('dte:read')
  findByDte(@Request() req: AuthRequest, @Param('dteId') dteId: string) {
    return this.paymentsService.findByDteId(dteId, req.user.tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado del método de pago' })
  @RequirePermission('dte:update')
  updateStatus(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { estado: 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO' },
  ) {
    return this.paymentsService.updateStatus(id, req.user.tenantId, body);
  }
}
