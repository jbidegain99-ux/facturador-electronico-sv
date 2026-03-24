import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type TipoMetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'TARJETA' | 'OTRA';

interface CreatePaymentMethodDto {
  dteId: string;
  tipo: TipoMetodoPago;
  descripcion?: string;
  numeroCheque?: string;
  bancoEmisor?: string;
  numeroCuenta?: string;
  referencia?: string;
}

interface UpdatePaymentStatusDto {
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO';
}

const CUENTA_BY_TIPO: Record<TipoMetodoPago, string> = {
  EFECTIVO: '1001',
  TRANSFERENCIA: '1105',
  CHEQUE: '1106',
  TARJETA: '1201',
  OTRA: '1102',
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {}

  getCuentaByTipo(tipo: TipoMetodoPago): string {
    return CUENTA_BY_TIPO[tipo] || '1102';
  }

  async create(tenantId: string, dto: CreatePaymentMethodDto) {
    // Verify DTE belongs to tenant
    const dte = await this.prisma.dTE.findFirst({
      where: { id: dto.dteId, tenantId },
    });
    if (!dte) {
      throw new NotFoundException('DTE no encontrado');
    }

    // Check no duplicate payment for this DTE
    const existing = await this.prisma.paymentMethod.findUnique({
      where: { dteId: dto.dteId },
    });
    if (existing) {
      throw new BadRequestException('Ya existe un método de pago registrado para este DTE');
    }

    // Validate cheque fields
    if (dto.tipo === 'CHEQUE' && !dto.numeroCheque) {
      throw new BadRequestException('Número de cheque es requerido para pagos con cheque');
    }

    const cuentaContable = this.getCuentaByTipo(dto.tipo);

    const payment = await this.prisma.paymentMethod.create({
      data: {
        tenantId,
        dteId: dto.dteId,
        tipo: dto.tipo,
        descripcion: dto.descripcion || null,
        numeroCheque: dto.numeroCheque || null,
        bancoEmisor: dto.bancoEmisor || null,
        numeroCuenta: dto.numeroCuenta || null,
        referencia: dto.referencia || null,
        cuentaContable,
      },
    });

    this.logger.log(
      `Payment method ${dto.tipo} registered for DTE ${dto.dteId} → cuenta ${cuentaContable}`,
    );

    return payment;
  }

  async findByDteId(dteId: string, tenantId: string) {
    const payment = await this.prisma.paymentMethod.findFirst({
      where: { dteId, tenantId },
    });
    if (!payment) {
      throw new NotFoundException('Método de pago no encontrado para este DTE');
    }
    return payment;
  }

  async updateStatus(id: string, tenantId: string, dto: UpdatePaymentStatusDto) {
    const payment = await this.prisma.paymentMethod.findFirst({
      where: { id, tenantId },
    });
    if (!payment) {
      throw new NotFoundException('Método de pago no encontrado');
    }

    return this.prisma.paymentMethod.update({
      where: { id },
      data: { estado: dto.estado },
    });
  }

  async findAllByTenant(tenantId: string, filters?: { tipo?: string; estado?: string }) {
    return this.prisma.paymentMethod.findMany({
      where: {
        tenantId,
        ...(filters?.tipo && { tipo: filters.tipo }),
        ...(filters?.estado && { estado: filters.estado }),
      },
      include: {
        dte: {
          select: {
            id: true,
            numeroControl: true,
            tipoDte: true,
            totalPagar: true,
            cliente: { select: { nombre: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
