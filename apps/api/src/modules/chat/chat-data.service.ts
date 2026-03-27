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

function formatDate(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

@Injectable()
export class ChatDataService {
  private readonly logger = new Logger(ChatDataService.name);

  constructor(private readonly prisma: PrismaService) {}

  async fetchData(
    classified: ClassifiedIntent,
    tenantId: string,
  ): Promise<TenantContextItem[]> {
    const { intent, timeRange, params } = classified;
    const { from, to } = timeRange;

    this.logger.log(
      `Fetching data: intent=${intent} tenant=${tenantId} from=${from.toISOString()} to=${to.toISOString()}${params?.clientName ? ` client=${params.clientName}` : ''}`,
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
      // Phase 2B
      case 'TOP_CLIENTS':
        return this.fetchTopClients(tenantId, from, to);
      case 'MONTH_COMPARISON':
        return this.fetchMonthComparison(tenantId);
      case 'CLIENT_INVOICES':
        return this.fetchClientInvoices(tenantId, from, to, params?.clientName);
      case 'NEW_CLIENTS':
        return this.fetchNewClients(tenantId, from, to);
      case 'RECENT_INVOICES_TODAY':
        return this.fetchRecentInvoicesToday(tenantId, from, to);
      case 'LATEST_INVOICES':
        return this.fetchLatestInvoices(tenantId);
      case 'CLIENT_PRODUCTS':
        return this.fetchClientProducts(tenantId, from, to, params?.clientName);
      case 'TAX_SUMMARY':
        return this.fetchTaxSummary(tenantId, from, to);
      case 'CLIENT_QUOTES':
        return this.fetchClientQuotes(tenantId, params?.clientName);
      case 'BRANCH_BREAKDOWN':
        return this.fetchBranchBreakdown(tenantId, from, to);
      case 'SALES_PROJECTION':
        return this.fetchSalesProjection(tenantId);
      // Schema-derived bonus intents
      case 'PLAN_USAGE':
        return this.fetchPlanUsage(tenantId);
      case 'RECURRING_TEMPLATES':
        return this.fetchRecurringTemplates(tenantId);
      case 'HACIENDA_REJECTIONS':
        return this.fetchHaciendaRejections(tenantId, from, to);
      default:
        return [];
    }
  }

  // ============================================================================
  // ORIGINAL INTENTS
  // ============================================================================

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
        tipoDte: { in: ['01', '03', '11', '14'] },
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
    const [dteStats, revenue, newClients, overdueCount, quoteStats] =
      await Promise.all([
        this.prisma.dTE.groupBy({
          by: ['tipoDte'],
          where: {
            tenantId,
            createdAt: { gte: from, lte: to },
            estado: { not: 'ANULADO' },
          },
          _count: { id: true },
        }),
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
        this.prisma.cliente.count({
          where: { tenantId, createdAt: { gte: from, lte: to } },
        }),
        this.prisma.paymentMethod.count({
          where: {
            tenantId,
            estado: 'PENDIENTE',
            dte: { estado: 'APROBADO' },
          },
        }),
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

  // ============================================================================
  // PHASE 2B: NEW INTENTS
  // ============================================================================

  private async fetchTopClients(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<TenantContextItem[]> {
    const dtes = await this.prisma.dTE.findMany({
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
        estado: { not: 'ANULADO' },
        tipoDte: { in: ['01', '03', '11', '14'] },
        clienteId: { not: null },
      },
      select: {
        clienteId: true,
        totalPagar: true,
        cliente: { select: { nombre: true } },
      },
    });

    if (dtes.length === 0) {
      return [{ label: 'Top clientes', data: `Sin facturación en ${formatMonthYear(from)}.` }];
    }

    const clientMap = new Map<string, { name: string; total: number; count: number }>();
    for (const dte of dtes) {
      if (!dte.clienteId) continue;
      const existing = clientMap.get(dte.clienteId) || {
        name: dte.cliente?.nombre || 'Sin nombre',
        total: 0,
        count: 0,
      };
      existing.total += Number(dte.totalPagar);
      existing.count += 1;
      clientMap.set(dte.clienteId, existing);
    }

    const sorted = [...clientMap.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const list = sorted
      .map((c, i) => `${i + 1}) ${c.name} - ${formatMoney(c.total)} (${c.count} facturas)`)
      .join(', ');

    return [
      {
        label: `Top 5 clientes - ${formatMonthYear(from)}`,
        data: list,
      },
    ];
  }

  private async fetchMonthComparison(
    tenantId: string,
  ): Promise<TenantContextItem[]> {
    const now = new Date();
    const curFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const curTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [curStats, prevStats] = await Promise.all([
      this.prisma.dTE.aggregate({
        where: {
          tenantId,
          createdAt: { gte: curFrom, lte: curTo },
          estado: { not: 'ANULADO' },
          tipoDte: { in: ['01', '03', '11', '14'] },
        },
        _sum: { totalPagar: true },
        _count: { id: true },
      }),
      this.prisma.dTE.aggregate({
        where: {
          tenantId,
          createdAt: { gte: prevFrom, lte: prevTo },
          estado: { not: 'ANULADO' },
          tipoDte: { in: ['01', '03', '11', '14'] },
        },
        _sum: { totalPagar: true },
        _count: { id: true },
      }),
    ]);

    const curRevenue = Number(curStats._sum.totalPagar ?? 0);
    const prevRevenue = Number(prevStats._sum.totalPagar ?? 0);
    const curCount = curStats._count.id;
    const prevCount = prevStats._count.id;

    const revenuePct = prevRevenue > 0
      ? ((curRevenue - prevRevenue) / prevRevenue * 100).toFixed(1)
      : 'N/A';
    const countPct = prevCount > 0
      ? ((curCount - prevCount) / prevCount * 100).toFixed(1)
      : 'N/A';

    const curMonth = formatMonthYear(curFrom);
    const prevMonth = formatMonthYear(prevFrom);

    return [
      {
        label: `Comparación ${curMonth} vs ${prevMonth}`,
        data: `Facturas: ${curCount} vs ${prevCount} (${revenuePct !== 'N/A' ? `${Number(revenuePct) >= 0 ? '+' : ''}${countPct}%` : 'sin datos previos'}). Revenue: ${formatMoney(curRevenue)} vs ${formatMoney(prevRevenue)} (${revenuePct !== 'N/A' ? `${Number(revenuePct) >= 0 ? '+' : ''}${revenuePct}%` : 'sin datos previos'}).`,
      },
    ];
  }

  private async fetchClientInvoices(
    tenantId: string,
    from: Date,
    to: Date,
    clientName?: string,
  ): Promise<TenantContextItem[]> {
    if (!clientName) {
      return [{ label: 'Facturación por cliente', data: 'No se detectó nombre de cliente en la pregunta. Intenta: "cuánto le facturé a [nombre]".' }];
    }

    const cliente = await this.prisma.cliente.findFirst({
      where: { tenantId, nombre: { contains: clientName } },
    });

    if (!cliente) {
      return [{ label: 'Facturación por cliente', data: `No se encontró cliente con nombre "${clientName}".` }];
    }

    const result = await this.prisma.dTE.aggregate({
      where: {
        tenantId,
        clienteId: cliente.id,
        createdAt: { gte: from, lte: to },
        estado: { not: 'ANULADO' },
        tipoDte: { in: ['01', '03', '11', '14'] },
      },
      _sum: { totalPagar: true },
      _count: { id: true },
    });

    const total = Number(result._sum.totalPagar ?? 0);
    const count = result._count.id;
    const period = formatMonthYear(from);

    return [
      {
        label: `Facturación a ${cliente.nombre} - ${period}`,
        data: `${count} facturas por ${formatMoney(total)}.`,
      },
    ];
  }

  private async fetchNewClients(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<TenantContextItem[]> {
    const clients = await this.prisma.cliente.findMany({
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
      },
      select: { nombre: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (clients.length === 0) {
      return [{ label: 'Clientes nuevos', data: `No se registraron clientes nuevos en ${formatMonthYear(from)}.` }];
    }

    const total = await this.prisma.cliente.count({
      where: { tenantId, createdAt: { gte: from, lte: to } },
    });

    const list = clients
      .map((c, i) => `${i + 1}) ${c.nombre} (${formatDate(c.createdAt)})`)
      .join(', ');

    return [
      {
        label: `Clientes nuevos - ${formatMonthYear(from)}`,
        data: `${total} clientes nuevos. ${total <= 10 ? `Detalle: ${list}` : `Últimos 10: ${list}`}`,
      },
    ];
  }

  private async fetchRecentInvoicesToday(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<TenantContextItem[]> {
    const result = await this.prisma.dTE.aggregate({
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
        estado: { not: 'ANULADO' },
      },
      _sum: { totalPagar: true },
      _count: { id: true },
    });

    const total = Number(result._sum.totalPagar ?? 0);
    const count = result._count.id;

    // Determine if this is "today" or "this week" based on the range span
    const daySpan = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    const label = daySpan <= 1 ? 'Hoy' : 'Esta semana';

    return [
      {
        label: `Facturas ${label.toLowerCase()}`,
        data: `${label}: ${count} documentos por ${formatMoney(total)}.`,
      },
    ];
  }

  private async fetchLatestInvoices(
    tenantId: string,
  ): Promise<TenantContextItem[]> {
    const dtes = await this.prisma.dTE.findMany({
      where: {
        tenantId,
        estado: { not: 'ANULADO' },
      },
      select: {
        tipoDte: true,
        numeroControl: true,
        totalPagar: true,
        createdAt: true,
        cliente: { select: { nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (dtes.length === 0) {
      return [{ label: 'Últimas facturas', data: 'No hay documentos emitidos.' }];
    }

    const list = dtes
      .map((d, i) => {
        const type = DTE_TYPE_NAMES[d.tipoDte] || d.tipoDte;
        const client = d.cliente?.nombre || 'Sin cliente';
        return `${i + 1}) ${type} ${d.numeroControl} - ${client} - ${formatMoney(Number(d.totalPagar))} (${formatDate(d.createdAt)})`;
      })
      .join(', ');

    return [
      {
        label: 'Últimas 5 facturas emitidas',
        data: list,
      },
    ];
  }

  private async fetchClientProducts(
    tenantId: string,
    from: Date,
    to: Date,
    clientName?: string,
  ): Promise<TenantContextItem[]> {
    if (!clientName) {
      return [{ label: 'Productos por cliente', data: 'No se detectó nombre de cliente. Intenta: "qué productos le vendo a [nombre]".' }];
    }

    const cliente = await this.prisma.cliente.findFirst({
      where: { tenantId, nombre: { contains: clientName } },
    });

    if (!cliente) {
      return [{ label: 'Productos por cliente', data: `No se encontró cliente con nombre "${clientName}".` }];
    }

    const dtes = await this.prisma.dTE.findMany({
      where: {
        tenantId,
        clienteId: cliente.id,
        createdAt: { gte: from, lte: to },
        estado: { not: 'ANULADO' },
        tipoDte: { in: ['01', '03', '11', '14'] },
      },
      select: { jsonOriginal: true },
    });

    if (dtes.length === 0) {
      return [{ label: `Productos vendidos a ${cliente.nombre}`, data: `Sin facturación a ${cliente.nombre} en ${formatMonthYear(from)}.` }];
    }

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
      return [{ label: `Productos vendidos a ${cliente.nombre}`, data: 'No se encontraron items de línea en los documentos.' }];
    }

    const sorted = [...productMap.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10);

    const list = sorted
      .map(([name, stats], i) => `${i + 1}) ${name} (${stats.qty} unid, ${formatMoney(stats.revenue)})`)
      .join(', ');

    return [
      {
        label: `Productos vendidos a ${cliente.nombre} - ${formatMonthYear(from)}`,
        data: list,
      },
    ];
  }

  private async fetchTaxSummary(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<TenantContextItem[]> {
    const byType = await this.prisma.dTE.groupBy({
      by: ['tipoDte'],
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
        estado: { not: 'ANULADO' },
        tipoDte: { in: ['01', '03', '11', '14'] },
      },
      _sum: { totalIva: true, totalPagar: true, totalGravada: true },
      _count: { id: true },
    });

    if (byType.length === 0) {
      return [{ label: 'Resumen de IVA', data: `Sin documentos en ${formatMonthYear(from)}.` }];
    }

    const totalIva = byType.reduce((sum, d) => sum + Number(d._sum.totalIva ?? 0), 0);
    const totalGravada = byType.reduce((sum, d) => sum + Number(d._sum.totalGravada ?? 0), 0);

    const breakdown = byType
      .map((d) => `${DTE_TYPE_NAMES[d.tipoDte] || d.tipoDte}: IVA ${formatMoney(Number(d._sum.totalIva ?? 0))}`)
      .join(', ');

    const period = formatMonthYear(from);

    return [
      {
        label: `Resumen de IVA - ${period}`,
        data: `IVA total: ${formatMoney(totalIva)}. Base gravada: ${formatMoney(totalGravada)}. Desglose: ${breakdown}.`,
      },
    ];
  }

  private async fetchClientQuotes(
    tenantId: string,
    clientName?: string,
  ): Promise<TenantContextItem[]> {
    if (!clientName) {
      return [{ label: 'Cotizaciones por cliente', data: 'No se detectó nombre de cliente. Intenta: "cotizaciones de [nombre]".' }];
    }

    const cliente = await this.prisma.cliente.findFirst({
      where: { tenantId, nombre: { contains: clientName } },
    });

    if (!cliente) {
      return [{ label: 'Cotizaciones por cliente', data: `No se encontró cliente con nombre "${clientName}".` }];
    }

    const stats = await this.prisma.quote.groupBy({
      by: ['status'],
      where: {
        tenantId,
        clienteId: cliente.id,
        isLatestVersion: true,
      },
      _count: { id: true },
      _sum: { total: true },
    });

    if (stats.length === 0) {
      return [{ label: `Cotizaciones de ${cliente.nombre}`, data: 'No hay cotizaciones para este cliente.' }];
    }

    const total = stats.reduce((sum, s) => sum + s._count.id, 0);
    const totalAmount = stats.reduce((sum, s) => sum + Number(s._sum.total ?? 0), 0);
    const breakdown = stats
      .map((s) => `${s.status}: ${s._count.id} (${formatMoney(Number(s._sum.total ?? 0))})`)
      .join(', ');

    return [
      {
        label: `Cotizaciones de ${cliente.nombre}`,
        data: `${total} cotizaciones por ${formatMoney(totalAmount)}. ${breakdown}.`,
      },
    ];
  }

  private async fetchBranchBreakdown(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<TenantContextItem[]> {
    // Check if tenant has sucursales
    const sucursales = await this.prisma.sucursal.findMany({
      where: { tenantId, activa: true },
      select: { id: true, nombre: true, codEstableMH: true },
    });

    if (sucursales.length === 0) {
      return [{ label: 'Ventas por sucursal', data: 'No hay sucursales configuradas para este tenant.' }];
    }

    // Get DTEs grouped by sucursalId
    const dtes = await this.prisma.dTE.findMany({
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
        estado: { not: 'ANULADO' },
        tipoDte: { in: ['01', '03', '11', '14'] },
      },
      select: { sucursalId: true, totalPagar: true },
    });

    const branchMap = new Map<string | null, { total: number; count: number }>();
    for (const dte of dtes) {
      const key = dte.sucursalId;
      const existing = branchMap.get(key) || { total: 0, count: 0 };
      existing.total += Number(dte.totalPagar);
      existing.count += 1;
      branchMap.set(key, existing);
    }

    const sucursalMap = new Map(sucursales.map((s) => [s.id, s]));

    const entries = [...branchMap.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .map(([sucId, stats], i) => {
        const suc = sucId ? sucursalMap.get(sucId) : null;
        const name = suc ? `${suc.codEstableMH || ''} ${suc.nombre}`.trim() : 'Sin sucursal asignada';
        return `${i + 1}) ${name}: ${stats.count} facturas, ${formatMoney(stats.total)}`;
      });

    return [
      {
        label: `Ventas por sucursal - ${formatMonthYear(from)}`,
        data: entries.join('. '),
      },
    ];
  }

  private async fetchSalesProjection(
    tenantId: string,
  ): Promise<TenantContextItem[]> {
    const now = new Date();
    const curFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const curTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Current month stats
    const curStats = await this.prisma.dTE.aggregate({
      where: {
        tenantId,
        createdAt: { gte: curFrom, lte: curTo },
        estado: { not: 'ANULADO' },
        tipoDte: { in: ['01', '03', '11', '14'] },
      },
      _sum: { totalPagar: true },
      _count: { id: true },
    });

    const curRevenue = Number(curStats._sum.totalPagar ?? 0);
    const daysElapsed = Math.max(1, now.getDate());
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyAvg = curRevenue / daysElapsed;
    const projection = dailyAvg * totalDaysInMonth;

    // Previous month for comparison
    const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const prevStats = await this.prisma.dTE.aggregate({
      where: {
        tenantId,
        createdAt: { gte: prevFrom, lte: prevTo },
        estado: { not: 'ANULADO' },
        tipoDte: { in: ['01', '03', '11', '14'] },
      },
      _sum: { totalPagar: true },
    });

    const prevRevenue = Number(prevStats._sum.totalPagar ?? 0);
    const vsLastMonth = prevRevenue > 0
      ? `${((projection - prevRevenue) / prevRevenue * 100).toFixed(1)}%`
      : 'N/A';

    const curMonth = formatMonthYear(curFrom);

    return [
      {
        label: `Proyección de ventas - ${curMonth}`,
        data: `Facturado hasta hoy: ${formatMoney(curRevenue)} (${daysElapsed}/${totalDaysInMonth} días). Promedio diario: ${formatMoney(dailyAvg)}. Proyección mes completo: ~${formatMoney(projection)}. Mes anterior cerró en: ${formatMoney(prevRevenue)} (${vsLastMonth !== 'N/A' ? `${Number(vsLastMonth.replace('%', '')) >= 0 ? '+' : ''}${vsLastMonth} vs proyección` : 'sin datos previos'}).`,
      },
    ];
  }

  // ============================================================================
  // SCHEMA-DERIVED BONUS INTENTS
  // ============================================================================

  private async fetchPlanUsage(
    tenantId: string,
  ): Promise<TenantContextItem[]> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        plan: true,
        planStatus: true,
        maxDtesPerMonth: true,
        dtesUsedThisMonth: true,
        maxUsers: true,
        maxClientes: true,
        planRef: { select: { nombre: true, codigo: true } },
      },
    });

    if (!tenant) {
      return [{ label: 'Uso del plan', data: 'No se encontró información del tenant.' }];
    }

    const userCount = await this.prisma.user.count({ where: { tenantId } });
    const clientCount = await this.prisma.cliente.count({ where: { tenantId } });

    const planName = tenant.planRef?.nombre || tenant.plan;
    const dtePct = tenant.maxDtesPerMonth > 0
      ? ((tenant.dtesUsedThisMonth / tenant.maxDtesPerMonth) * 100).toFixed(0)
      : '∞';
    const dteRemaining = tenant.maxDtesPerMonth > 0
      ? tenant.maxDtesPerMonth - tenant.dtesUsedThisMonth
      : 'ilimitadas';

    return [
      {
        label: `Uso del plan - ${planName}`,
        data: `Plan: ${planName} (${tenant.planStatus}). DTEs: ${tenant.dtesUsedThisMonth}/${tenant.maxDtesPerMonth === -1 ? '∞' : tenant.maxDtesPerMonth} (${dtePct}% usado, ${dteRemaining} restantes). Usuarios: ${userCount}/${tenant.maxUsers === -1 ? '∞' : tenant.maxUsers}. Clientes: ${clientCount}/${tenant.maxClientes === -1 ? '∞' : tenant.maxClientes}.`,
      },
    ];
  }

  private async fetchRecurringTemplates(
    tenantId: string,
  ): Promise<TenantContextItem[]> {
    const templates = await this.prisma.recurringInvoiceTemplate.findMany({
      where: { tenantId },
      select: {
        nombre: true,
        status: true,
        interval: true,
        nextRunDate: true,
        cliente: { select: { nombre: true } },
      },
      orderBy: { nextRunDate: 'asc' },
    });

    if (templates.length === 0) {
      return [{ label: 'Facturas recurrentes', data: 'No hay plantillas de facturas recurrentes configuradas.' }];
    }

    const active = templates.filter((t) => t.status === 'ACTIVE');
    const paused = templates.filter((t) => t.status === 'PAUSED');

    const list = templates
      .slice(0, 5)
      .map((t, i) => `${i + 1}) ${t.nombre} → ${t.cliente.nombre} (${t.interval}, ${t.status}, próx: ${formatDate(t.nextRunDate)})`)
      .join(', ');

    return [
      {
        label: 'Facturas recurrentes',
        data: `Total: ${templates.length}. Activas: ${active.length}. Pausadas: ${paused.length}. ${list}`,
      },
    ];
  }

  private async fetchHaciendaRejections(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<TenantContextItem[]> {
    const rejected = await this.prisma.dTE.findMany({
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
        estado: 'RECHAZADO',
      },
      select: {
        tipoDte: true,
        numeroControl: true,
        descripcionMh: true,
        createdAt: true,
        cliente: { select: { nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const totalRejected = await this.prisma.dTE.count({
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
        estado: 'RECHAZADO',
      },
    });

    if (totalRejected === 0) {
      return [{ label: 'Rechazos de Hacienda', data: `No hay documentos rechazados por Hacienda en ${formatMonthYear(from)}.` }];
    }

    const list = rejected
      .map((d, i) => {
        const type = DTE_TYPE_NAMES[d.tipoDte] || d.tipoDte;
        const reason = d.descripcionMh ? ` - "${d.descripcionMh.substring(0, 60)}"` : '';
        return `${i + 1}) ${type} ${d.numeroControl} (${d.cliente?.nombre || 'Sin cliente'})${reason}`;
      })
      .join(', ');

    const period = formatMonthYear(from);

    return [
      {
        label: `Rechazos de Hacienda - ${period}`,
        data: `${totalRejected} documentos rechazados. ${list}`,
      },
    ];
  }
}
