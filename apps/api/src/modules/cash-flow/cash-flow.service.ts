import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ForecastDay {
  date: string;
  monto: number;
  count: number;
}

export interface MethodBreakdown {
  tipo: string;
  total: number;
  count: number;
  cuenta: string;
}

export interface CashFlowAlert {
  tipo: 'CHEQUE_VENCIENDO' | 'TRANSFERENCIA_EN_TRANSITO' | 'PAGO_PENDIENTE';
  severidad: 'INFO' | 'WARNING' | 'CRITICAL';
  mensaje: string;
  dteId: string;
  paymentMethodId: string;
}

export interface CashFlowSummary {
  periodo: string;
  total: number;
  cobrado: number;
  pendiente: number;
  byMethod: MethodBreakdown[];
  forecast: ForecastDay[];
}

@Injectable()
export class CashFlowService {
  private readonly logger = new Logger(CashFlowService.name);

  constructor(private prisma: PrismaService) {}

  async getSummary(tenantId: string, days: number = 30): Promise<CashFlowSummary> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    const payments = await this.prisma.paymentMethod.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        dte: {
          select: {
            id: true,
            totalPagar: true,
            createdAt: true,
            estado: true,
          },
        },
      },
    });

    // Calculate totals
    let total = 0;
    let cobrado = 0;

    const methodMap = new Map<string, { total: number; count: number }>();
    const dateMap = new Map<string, { monto: number; count: number }>();

    const cuentaByTipo: Record<string, string> = {
      EFECTIVO: '1001 - Caja',
      TRANSFERENCIA: '1105 - Banco',
      CHEQUE: '1106 - Cheques por cobrar',
      TARJETA: '1201 - Cuentas por cobrar',
      OTRA: '1102 - Otros',
    };

    for (const pm of payments) {
      const monto = Number(pm.dte.totalPagar);
      total += monto;

      if (pm.estado === 'CONFIRMADO') {
        cobrado += monto;
      }

      // Group by method
      const existing = methodMap.get(pm.tipo) || { total: 0, count: 0 };
      existing.total += monto;
      existing.count += 1;
      methodMap.set(pm.tipo, existing);

      // Group by date
      const dateKey = pm.createdAt.toISOString().split('T')[0];
      const dateEntry = dateMap.get(dateKey) || { monto: 0, count: 0 };
      dateEntry.monto += monto;
      dateEntry.count += 1;
      dateMap.set(dateKey, dateEntry);
    }

    const byMethod: MethodBreakdown[] = Array.from(methodMap.entries()).map(
      ([tipo, data]) => ({
        tipo,
        total: Math.round(data.total * 100) / 100,
        count: data.count,
        cuenta: cuentaByTipo[tipo] || '1102 - Otros',
      }),
    );

    const forecast: ForecastDay[] = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        monto: Math.round(data.monto * 100) / 100,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      periodo: `${days} días`,
      total: Math.round(total * 100) / 100,
      cobrado: Math.round(cobrado * 100) / 100,
      pendiente: Math.round((total - cobrado) * 100) / 100,
      byMethod,
      forecast,
    };
  }

  async getAlerts(tenantId: string): Promise<CashFlowAlert[]> {
    const alerts: CashFlowAlert[] = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Cheques pending for more than 7 days
    const oldCheques = await this.prisma.paymentMethod.findMany({
      where: {
        tenantId,
        tipo: 'CHEQUE',
        estado: 'PENDIENTE',
        createdAt: { lte: sevenDaysAgo },
      },
      select: {
        id: true,
        dteId: true,
        numeroCheque: true,
        createdAt: true,
      },
    });

    for (const cheque of oldCheques) {
      const daysOld = Math.ceil(
        (now.getTime() - cheque.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        tipo: 'CHEQUE_VENCIENDO',
        severidad: daysOld > 14 ? 'CRITICAL' : 'WARNING',
        mensaje: `Cheque ${cheque.numeroCheque || 'S/N'} pendiente hace ${daysOld} días`,
        dteId: cheque.dteId,
        paymentMethodId: cheque.id,
      });
    }

    // Transfers pending for more than 3 days
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oldTransfers = await this.prisma.paymentMethod.findMany({
      where: {
        tenantId,
        tipo: 'TRANSFERENCIA',
        estado: 'PENDIENTE',
        createdAt: { lte: threeDaysAgo },
      },
      include: {
        dte: { select: { totalPagar: true } },
      },
    });

    for (const transfer of oldTransfers) {
      const daysOld = Math.ceil(
        (now.getTime() - transfer.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        tipo: 'TRANSFERENCIA_EN_TRANSITO',
        severidad: 'WARNING',
        mensaje: `Transferencia de $${Number(transfer.dte.totalPagar).toFixed(2)} en tránsito hace ${daysOld} días`,
        dteId: transfer.dteId,
        paymentMethodId: transfer.id,
      });
    }

    // Any payment pending more than 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const veryOldPayments = await this.prisma.paymentMethod.findMany({
      where: {
        tenantId,
        estado: 'PENDIENTE',
        tipo: { notIn: ['CHEQUE', 'TRANSFERENCIA'] },
        createdAt: { lte: thirtyDaysAgo },
      },
      include: {
        dte: { select: { totalPagar: true, numeroControl: true } },
      },
    });

    for (const pm of veryOldPayments) {
      alerts.push({
        tipo: 'PAGO_PENDIENTE',
        severidad: 'CRITICAL',
        mensaje: `Pago de $${Number(pm.dte.totalPagar).toFixed(2)} (${pm.dte.numeroControl}) pendiente más de 30 días`,
        dteId: pm.dteId,
        paymentMethodId: pm.id,
      });
    }

    // Sort by severity (CRITICAL first)
    const severityOrder: Record<string, number> = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    alerts.sort((a, b) => severityOrder[a.severidad] - severityOrder[b.severidad]);

    return alerts;
  }
}
