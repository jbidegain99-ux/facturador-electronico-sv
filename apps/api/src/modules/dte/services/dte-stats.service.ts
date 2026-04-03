import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// Enum values as strings for SQL Server compatibility
const DTEStatus = {
  PROCESADO: 'PROCESADO',
  FIRMADO: 'FIRMADO',
  RECHAZADO: 'RECHAZADO',
} as const;

@Injectable()
export class DteStatsService {
  private readonly logger = new Logger(DteStatsService.name);

  constructor(private prisma: PrismaService) {}

  async getSummaryStats(tenantId: string | null | undefined) {
    if (!tenantId) {
      this.logger.warn('User has no tenantId assigned for getSummaryStats');
      return {
        dtesHoy: 0,
        dtesMes: 0,
        dtesMesAnterior: 0,
        dtesMesChange: 0,
        totalFacturado: 0,
        totalFacturadoChange: 0,
        rechazados: 0,
      };
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      dtesToday,
      dtesThisMonth,
      dtesLastMonth,
      totalThisMonth,
      totalLastMonth,
      rejectedCount,
    ] = await Promise.all([
      this.prisma.dTE.count({
        where: { tenantId, createdAt: { gte: startOfDay } },
      }),
      this.prisma.dTE.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.dTE.count({
        where: {
          tenantId,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      this.prisma.dTE.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
          estado: { in: [DTEStatus.PROCESADO, DTEStatus.FIRMADO] },
        },
        _sum: { totalPagar: true },
      }),
      this.prisma.dTE.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          estado: { in: [DTEStatus.PROCESADO, DTEStatus.FIRMADO] },
        },
        _sum: { totalPagar: true },
      }),
      this.prisma.dTE.count({
        where: { tenantId, estado: DTEStatus.RECHAZADO },
      }),
    ]);

    const totalFacturadoMes = Number(totalThisMonth._sum?.totalPagar) || 0;
    const totalFacturadoMesAnterior = Number(totalLastMonth._sum?.totalPagar) || 0;

    const dtesMesChange = dtesLastMonth > 0
      ? Math.round(((dtesThisMonth - dtesLastMonth) / dtesLastMonth) * 100)
      : dtesThisMonth > 0 ? 100 : 0;

    const facturadoChange = totalFacturadoMesAnterior > 0
      ? Math.round(((totalFacturadoMes - totalFacturadoMesAnterior) / totalFacturadoMesAnterior) * 100)
      : totalFacturadoMes > 0 ? 100 : 0;

    return {
      dtesHoy: dtesToday,
      dtesMes: dtesThisMonth,
      dtesMesAnterior: dtesLastMonth,
      dtesMesChange,
      totalFacturado: totalFacturadoMes,
      totalFacturadoChange: facturadoChange,
      rechazados: rejectedCount,
    };
  }

  async getStatsByDate(
    tenantId: string | null | undefined,
    startDate?: Date,
    endDate?: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    if (!tenantId) {
      this.logger.warn('User has no tenantId assigned for getStatsByDate');
      return [];
    }

    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    let dateExpr: string;
    switch (groupBy) {
      case 'month':
        dateExpr = `FORMAT(createdAt, 'yyyy-MM')`;
        break;
      case 'week':
        dateExpr = `CONVERT(VARCHAR(10), DATEADD(DAY, -DATEPART(WEEKDAY, createdAt) + 1, createdAt), 23)`;
        break;
      default:
        dateExpr = `CONVERT(VARCHAR(10), createdAt, 23)`;
    }

    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ period: string; count: number; total: number }>
    >(
      `SELECT ${dateExpr} AS period, COUNT(*) AS [count], ISNULL(SUM(totalPagar), 0) AS total
       FROM DTE
       WHERE tenantId = @P1 AND createdAt >= @P2 AND createdAt <= @P3
       GROUP BY ${dateExpr}
       ORDER BY period ASC`,
      tenantId,
      start,
      end,
    );

    const grouped: Record<string, { count: number; total: number }> = {};
    for (const row of rows) {
      grouped[row.period] = { count: Number(row.count), total: Number(row.total) };
    }

    const result: Array<{ fecha: string; cantidad: number; total: number }> = [];
    const current = new Date(start);

    while (current <= end) {
      let key: string;

      switch (groupBy) {
        case 'month':
          key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
          current.setMonth(current.getMonth() + 1);
          break;
        case 'week': {
          const weekStart = new Date(current);
          weekStart.setDate(current.getDate() - current.getDay());
          key = weekStart.toISOString().split('T')[0];
          current.setDate(current.getDate() + 7);
          break;
        }
        default:
          key = current.toISOString().split('T')[0];
          current.setDate(current.getDate() + 1);
      }

      const data = grouped[key];
      result.push({
        fecha: key,
        cantidad: data?.count || 0,
        total: data?.total || 0,
      });
    }

    return result;
  }

  async getStatsByType(tenantId: string | null | undefined, startDate?: Date, endDate?: Date) {
    if (!tenantId) {
      this.logger.warn('User has no tenantId assigned for getStatsByType');
      return [];
    }

    const where: Record<string, unknown> = { tenantId };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;
      where.createdAt = dateFilter;
    }

    const stats = await this.prisma.dTE.groupBy({
      by: ['tipoDte'],
      where,
      _count: { id: true },
      _sum: { totalPagar: true },
    });

    const tipoDteNames: Record<string, string> = {
      '01': 'Factura',
      '03': 'Crédito Fiscal',
      '05': 'Nota de Crédito',
      '06': 'Nota de Débito',
      '07': 'Nota de Remisión',
      '11': 'Factura Exportación',
      '14': 'Factura Sujeto Excluido',
    };

    return stats.map((s: typeof stats[0]) => ({
      tipoDte: s.tipoDte,
      nombre: tipoDteNames[s.tipoDte] || s.tipoDte,
      cantidad: s._count.id,
      total: Number(s._sum.totalPagar) || 0,
    }));
  }

  async getStatsByStatus(tenantId: string | null | undefined) {
    if (!tenantId) {
      this.logger.warn('User has no tenantId assigned for getStatsByStatus');
      return [];
    }

    const stats = await this.prisma.dTE.groupBy({
      by: ['estado'],
      where: { tenantId },
      _count: { id: true },
    });

    return stats.map((s: typeof stats[0]) => ({
      estado: s.estado,
      cantidad: s._count.id,
    }));
  }

  async getTopClients(
    tenantId: string | null | undefined,
    limit = 10,
    startDate?: Date,
    endDate?: Date,
  ) {
    if (!tenantId) {
      this.logger.warn('User has no tenantId assigned for getTopClients');
      return [];
    }

    const where: Record<string, unknown> = {
      tenantId,
      clienteId: { not: null },
      estado: { in: [DTEStatus.PROCESADO, DTEStatus.FIRMADO] },
    };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;
      where.createdAt = dateFilter;
    }

    const stats = await this.prisma.dTE.groupBy({
      by: ['clienteId'],
      where,
      _count: { id: true },
      _sum: { totalPagar: true },
      orderBy: { _sum: { totalPagar: 'desc' } },
      take: limit,
    });

    const clientIds = stats.map((s: typeof stats[0]) => s.clienteId).filter(Boolean) as string[];
    const clients = await this.prisma.cliente.findMany({
      where: { id: { in: clientIds }, tenantId },
      select: { id: true, nombre: true, numDocumento: true },
    });

    const clientMap = new Map(clients.map((c: typeof clients[0]) => [c.id, c]));

    return stats.map((s: typeof stats[0]) => {
      const client = clientMap.get(s.clienteId!) as typeof clients[0] | undefined;
      return {
        clienteId: s.clienteId,
        nombre: client?.nombre || 'Sin nombre',
        numDocumento: client?.numDocumento || '',
        cantidadDtes: s._count.id,
        totalFacturado: Number(s._sum.totalPagar) || 0,
      };
    });
  }

  async getRecentDTEs(tenantId: string | null | undefined, limit = 5) {
    if (!tenantId) {
      this.logger.warn('User has no tenantId assigned for getRecentDTEs');
      return [];
    }

    return this.prisma.dTE.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { cliente: { select: { nombre: true, numDocumento: true } } },
    });
  }
}
