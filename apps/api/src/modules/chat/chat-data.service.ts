import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClassifiedIntent } from './chat-intent';

interface TenantContextItem {
  label: string;
  data: string;
}

// DTE type codes per MH El Salvador
const DTE_TYPE_NAMES: Record<string, string> = {
  '01': 'Factura',
  '03': 'Comprobante de Crédito Fiscal',
  '05': 'Nota de Crédito',
  '06': 'Nota de Débito',
  '07': 'Comprobante de Retención',
  '08': 'Comprobante de Liquidación',
  '09': 'DTE Contable de Liquidación',
  '11': 'Factura de Exportación',
  '14': 'Factura de Sujeto Excluido',
  '15': 'Comprobante de Donación',
};

function formatMoney(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMonthYear(date: Date): string {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

@Injectable()
export class ChatDataService {
  private readonly logger = new Logger(ChatDataService.name);

  constructor(private readonly prisma: PrismaService) {}

  async fetchData(
    classified: ClassifiedIntent,
    tenantId: string,
  ): Promise<TenantContextItem[]> {
    const { intent, timeRange } = classified;
    const { from, to } = timeRange;

    this.logger.log(
      `Fetching data: intent=${intent} tenant=${tenantId} from=${from.toISOString()} to=${to.toISOString()}`,
    );

    switch (intent) {
      case 'INVOICE_COUNT':
        return this.fetchInvoiceCount(tenantId, from, to);
      case 'OVERDUE_INVOICES':
        return this.fetchOverdueInvoices(tenantId);
      case 'REVENUE_SUMMARY':
        return this.fetchRevenueSummary(tenantId, from, to);
      case 'CLIENT_COUNT':
        return this.fetchClientCount(tenantId);
      case 'TOP_PRODUCTS':
        return this.fetchTopProducts(tenantId, from, to);
      case 'MONTHLY_SUMMARY':
        return this.fetchMonthlySummary(tenantId, from, to);
      case 'QUOTE_STATUS':
        return this.fetchQuoteStatus(tenantId);
      case 'DTE_BREAKDOWN':
        return this.fetchDteBreakdown(tenantId, from, to);
      default:
        return [];
    }
  }

  private async fetchInvoiceCount(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<TenantContextItem[]> {
    const dtes = await this.prisma.dTE.groupBy({
      by: ['tipoDte'],
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
        estado: { not: 'ANULADO' },
      },
      _count: { id: true },
    });

    const total = dtes.reduce((sum, d) => sum + d._count.id, 0);
    const breakdown = dtes
      .map((d) => `${DTE_TYPE_NAMES[d.tipoDte] || d.tipoDte}: ${d._count.id}`)
      .join(', ');

    const period = formatMonthYear(from);

    return [
      {
        label: `Facturas emitidas en ${period}`,
        data: `Total: ${total} documentos. ${breakdown || 'Sin documentos en este período.'}`,
      },
    ];
  }

  private async fetchOverdueInvoices(
    tenantId: string,
  ): Promise<TenantContextItem[]> {
    // Overdue = PaymentMethod.estado = 'PENDIENTE' and DTE was approved
    const overdue = await this.prisma.paymentMethod.findMany({
      where: {
        tenantId,
        estado: 'PENDIENTE',
        dte: {
          estado: 'APROBADO',
        },
      },
      include: {
        dte: {
          select: {
            totalPagar: true,
            createdAt: true,
            numeroControl: true,
            tipoDte: true,
            cliente: { select: { nombre: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    if (overdue.length === 0) {
      return [
        {
          label: 'Facturas pendientes de cobro',
          data: 'No se encontraron facturas con pago pendiente.',
        },
      ];
    }

    const totalAmount = overdue.reduce(
      (sum, pm) => sum + Number(pm.dte.totalPagar),
      0,
    );

    const details = overdue
      .map((pm, i) => {
        const clientName = pm.dte.cliente?.nombre || 'Sin cliente';
        const amount = formatMoney(Number(pm.dte.totalPagar));
        const daysAgo = Math.floor(
          (Date.now() - pm.dte.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        );
        return `${i + 1}) ${clientName} - ${amount} (hace ${daysAgo} días)`;
      })
      .join(', ');

    return [
      {
        label: 'Facturas pendientes de cobro',
        data: `${overdue.length} facturas pendientes por un total de ${formatMoney(totalAmount)}. Detalle: ${details}`,
      },
    ];
  }

  private async fetchRevenueSummary(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<TenantContextItem[]> {
    const result = await this.prisma.dTE.aggregate({
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
        estado: { not: 'ANULADO' },
        tipoDte: { in: ['01', '03', '11', '14'] }, // Revenue DTEs only
      },
      _sum: { totalPagar: true, totalIva: true, totalGravada: true },
      _count: { id: true },
    });

    const totalPagar = Number(result._sum.totalPagar ?? 0);
    const totalIva = Number(result._sum.totalIva ?? 0);
    const totalGravada = Number(result._sum.totalGravada ?? 0);
    const count = result._count.id;
    const avg = count > 0 ? totalPagar / count : 0;

    const period = formatMonthYear(from);

    return [
      {
        label: `Total facturado ${period}`,
        data: `Revenue: ${formatMoney(totalPagar)} en ${count} documentos. Gravado: ${formatMoney(totalGravada)}, IVA: ${formatMoney(totalIva)}. Promedio por documento: ${formatMoney(avg)}.`,
      },
    ];
  }

  private async fetchClientCount(
    tenantId: string,
  ): Promise<TenantContextItem[]> {
    const total = await this.prisma.cliente.count({
      where: { tenantId },
    });

    // Clients created this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = await this.prisma.cliente.count({
      where: {
        tenantId,
        createdAt: { gte: monthStart },
      },
    });

    return [
      {
        label: 'Clientes registrados',
        data: `Total: ${total} clientes. Nuevos este mes: ${newThisMonth}.`,
      },
    ];
  }

  private async fetchTopProducts(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<TenantContextItem[]> {
    // Parse line items from DTE jsonOriginal to count product frequency
    const dtes = await this.prisma.dTE.findMany({
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
        estado: { not: 'ANULADO' },
        tipoDte: { in: ['01', '03', '11', '14'] },
      },
      select: { jsonOriginal: true },
    });

    if (dtes.length === 0) {
      return [
        {
          label: 'Productos/servicios más vendidos',
          data: `No hay documentos emitidos en ${formatMonthYear(from)}.`,
        },
      ];
    }

    // Aggregate line items by description
    const productMap = new Map<string, { qty: number; revenue: number }>();

    for (const dte of dtes) {
      try {
        const json = JSON.parse(dte.jsonOriginal);
        const items = json.cuerpoDocumento as Array<{
          descripcion?: string;
          cantidad?: number;
          ventaGravada?: number;
        }> | undefined;
        if (!items) continue;

        for (const item of items) {
          const name = item.descripcion?.trim();
          if (!name) continue;
          const existing = productMap.get(name) || { qty: 0, revenue: 0 };
          existing.qty += Number(item.cantidad ?? 1);
          existing.revenue += Number(item.ventaGravada ?? 0);
          productMap.set(name, existing);
        }
      } catch {
        // Skip malformed JSON
      }
    }

    if (productMap.size === 0) {
      return [
        {
          label: 'Productos/servicios más vendidos',
          data: `No se encontraron items de línea en los documentos de ${formatMonthYear(from)}.`,
        },
      ];
    }

    const sorted = [...productMap.entries()]
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 5);

    const list = sorted
      .map(
        ([name, stats], i) =>
          `${i + 1}) ${name} (${stats.qty} unidades, ${formatMoney(stats.revenue)})`,
      )
      .join(', ');

    return [
      {
        label: `Top 5 productos/servicios más vendidos - ${formatMonthYear(from)}`,
        data: list,
      },
    ];
  }

  private async fetchMonthlySummary(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<TenantContextItem[]> {
    // Run multiple queries in parallel
    const [dteStats, revenue, newClients, overdueCount, quoteStats] =
      await Promise.all([
        // DTE count by type
        this.prisma.dTE.groupBy({
          by: ['tipoDte'],
          where: {
            tenantId,
            createdAt: { gte: from, lte: to },
            estado: { not: 'ANULADO' },
          },
          _count: { id: true },
        }),
        // Revenue
        this.prisma.dTE.aggregate({
          where: {
            tenantId,
            createdAt: { gte: from, lte: to },
            estado: { not: 'ANULADO' },
            tipoDte: { in: ['01', '03', '11', '14'] },
          },
          _sum: { totalPagar: true },
          _count: { id: true },
        }),
        // New clients
        this.prisma.cliente.count({
          where: { tenantId, createdAt: { gte: from, lte: to } },
        }),
        // Overdue payments
        this.prisma.paymentMethod.count({
          where: {
            tenantId,
            estado: 'PENDIENTE',
            dte: { estado: 'APROBADO' },
          },
        }),
        // Quote stats
        this.prisma.quote.groupBy({
          by: ['status'],
          where: { tenantId, issueDate: { gte: from, lte: to } },
          _count: { id: true },
          _sum: { total: true },
        }),
      ]);

    const totalDtes = dteStats.reduce((sum, d) => sum + d._count.id, 0);
    const dteBreakdown = dteStats
      .map((d) => `${DTE_TYPE_NAMES[d.tipoDte] || d.tipoDte}: ${d._count.id}`)
      .join(', ');

    const totalRevenue = Number(revenue._sum.totalPagar ?? 0);

    const quoteInfo = quoteStats
      .map(
        (q) =>
          `${q.status}: ${q._count.id} (${formatMoney(Number(q._sum.total ?? 0))})`,
      )
      .join(', ');

    const period = formatMonthYear(from);

    return [
      {
        label: `Resumen del mes - ${period}`,
        data: `Documentos emitidos: ${totalDtes} (${dteBreakdown || 'ninguno'}). Revenue total: ${formatMoney(totalRevenue)}. Clientes nuevos: ${newClients}. Pagos pendientes: ${overdueCount}. Cotizaciones: ${quoteInfo || 'ninguna'}.`,
      },
    ];
  }

  private async fetchQuoteStatus(
    tenantId: string,
  ): Promise<TenantContextItem[]> {
    const stats = await this.prisma.quote.groupBy({
      by: ['status'],
      where: { tenantId, isLatestVersion: true },
      _count: { id: true },
      _sum: { total: true },
    });

    if (stats.length === 0) {
      return [
        {
          label: 'Estado de cotizaciones',
          data: 'No hay cotizaciones registradas.',
        },
      ];
    }

    const total = stats.reduce((sum, s) => sum + s._count.id, 0);
    const breakdown = stats
      .map(
        (s) =>
          `${s.status}: ${s._count.id} (${formatMoney(Number(s._sum.total ?? 0))})`,
      )
      .join(', ');

    return [
      {
        label: 'Estado de cotizaciones',
        data: `Total: ${total} cotizaciones. ${breakdown}`,
      },
    ];
  }

  private async fetchDteBreakdown(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<TenantContextItem[]> {
    const dtes = await this.prisma.dTE.groupBy({
      by: ['tipoDte'],
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
        estado: { not: 'ANULADO' },
      },
      _count: { id: true },
      _sum: { totalPagar: true },
    });

    if (dtes.length === 0) {
      const period = formatMonthYear(from);
      return [
        {
          label: `Desglose por tipo de DTE - ${period}`,
          data: 'No se encontraron documentos en este período.',
        },
      ];
    }

    const total = dtes.reduce((sum, d) => sum + d._count.id, 0);
    const breakdown = dtes
      .map(
        (d) =>
          `${DTE_TYPE_NAMES[d.tipoDte] || `Tipo ${d.tipoDte}`} (${d.tipoDte}): ${d._count.id} documentos, ${formatMoney(Number(d._sum.totalPagar ?? 0))}`,
      )
      .join('. ');

    const period = formatMonthYear(from);

    return [
      {
        label: `Desglose por tipo de DTE - ${period}`,
        data: `Total: ${total} documentos. ${breakdown}`,
      },
    ];
  }
}
