import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface RevenueByDay {
  date: string;
  amount: number;
}

interface TopClient {
  name: string;
  totalInvoices: number;
  totalRevenue: number;
}

interface RecentInvoice {
  id: string;
  numeroControl: string;
  tipoDte: string;
  clientName: string;
  total: number;
  status: string;
  date: string;
}

export interface DashboardStats {
  totalInvoicesThisMonth: number;
  totalInvoicesLastMonth: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  totalClients: number;
  newClientsThisMonth: number;
  totalCatalogItems: number;
  invoicesByStatus: Record<string, number>;
  revenueByDay: RevenueByDay[];
  topClients: TopClient[];
  recentInvoices: RecentInvoice[];
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string): Promise<DashboardStats> {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Run all queries in parallel for performance
    const [
      invoicesThisMonth,
      invoicesLastMonth,
      revenueThisMonthResult,
      revenueLastMonthResult,
      totalClients,
      newClientsThisMonth,
      totalCatalogItems,
      statusCounts,
      revenueByDayRaw,
      topClientsRaw,
      recentInvoicesRaw,
    ] = await Promise.all([
      // Count invoices this month
      this.prisma.dTE.count({
        where: { tenantId, createdAt: { gte: startOfThisMonth } },
      }),

      // Count invoices last month
      this.prisma.dTE.count({
        where: {
          tenantId,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),

      // Revenue this month
      this.prisma.dTE.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfThisMonth },
          estado: { in: ['PROCESADO', 'FIRMADO'] },
        },
        _sum: { totalPagar: true },
      }),

      // Revenue last month
      this.prisma.dTE.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          estado: { in: ['PROCESADO', 'FIRMADO'] },
        },
        _sum: { totalPagar: true },
      }),

      // Total clients
      this.prisma.cliente.count({ where: { tenantId } }),

      // New clients this month
      this.prisma.cliente.count({
        where: { tenantId, createdAt: { gte: startOfThisMonth } },
      }),

      // Total catalog items
      this.prisma.catalogItem.count({ where: { tenantId } }),

      // Invoices by status (this month)
      this.prisma.dTE.groupBy({
        by: ['estado'],
        where: { tenantId, createdAt: { gte: startOfThisMonth } },
        _count: { id: true },
      }),

      // Revenue by day (current month) - raw DTEs grouped by date
      this.prisma.dTE.findMany({
        where: {
          tenantId,
          createdAt: { gte: startOfThisMonth },
          estado: { in: ['PROCESADO', 'FIRMADO'] },
        },
        select: { createdAt: true, totalPagar: true },
        orderBy: { createdAt: 'asc' },
      }),

      // Top 5 clients by revenue this month
      this.prisma.dTE.groupBy({
        by: ['clienteId'],
        where: {
          tenantId,
          createdAt: { gte: startOfThisMonth },
          estado: { in: ['PROCESADO', 'FIRMADO'] },
          clienteId: { not: null },
        },
        _sum: { totalPagar: true },
        _count: { id: true },
        orderBy: { _sum: { totalPagar: 'desc' } },
        take: 5,
      }),

      // Recent 5 invoices
      this.prisma.dTE.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          numeroControl: true,
          tipoDte: true,
          estado: true,
          totalPagar: true,
          createdAt: true,
          cliente: { select: { nombre: true } },
        },
      }),
    ]);

    // Process revenue by day - aggregate by date string
    const revenueMap = new Map<string, number>();
    for (const dte of revenueByDayRaw) {
      const dateKey = dte.createdAt.toISOString().slice(0, 10);
      const amount = Number(dte.totalPagar) || 0;
      revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + amount);
    }

    // Fill in missing days for the current month
    const revenueByDay: RevenueByDay[] = [];
    const daysInMonth = Math.min(now.getDate(), new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(now.getFullYear(), now.getMonth(), d);
      const dateKey = date.toISOString().slice(0, 10);
      revenueByDay.push({
        date: dateKey,
        amount: Math.round((revenueMap.get(dateKey) || 0) * 100) / 100,
      });
    }

    // Resolve top client names
    const clientIds = topClientsRaw
      .map((c) => c.clienteId)
      .filter((id): id is string => id !== null);

    const clientNames = clientIds.length > 0
      ? await this.prisma.cliente.findMany({
          where: { id: { in: clientIds }, tenantId },
          select: { id: true, nombre: true },
        })
      : [];

    const clientNameMap = new Map(clientNames.map((c) => [c.id, c.nombre]));

    const topClients: TopClient[] = topClientsRaw.map((c) => ({
      name: clientNameMap.get(c.clienteId ?? '') || 'Sin cliente',
      totalInvoices: c._count.id,
      totalRevenue: Math.round(Number(c._sum.totalPagar || 0) * 100) / 100,
    }));

    // Build invoicesByStatus map
    const invoicesByStatus: Record<string, number> = {};
    for (const s of statusCounts) {
      invoicesByStatus[s.estado.toLowerCase()] = s._count.id;
    }

    // Format recent invoices
    const recentInvoices: RecentInvoice[] = recentInvoicesRaw.map((dte) => ({
      id: dte.id,
      numeroControl: dte.numeroControl,
      tipoDte: dte.tipoDte,
      clientName: dte.cliente?.nombre || 'Sin cliente',
      total: Math.round(Number(dte.totalPagar) * 100) / 100,
      status: dte.estado,
      date: dte.createdAt.toISOString(),
    }));

    const revenueThisMonth = Math.round(Number(revenueThisMonthResult._sum.totalPagar || 0) * 100) / 100;
    const revenueLastMonth = Math.round(Number(revenueLastMonthResult._sum.totalPagar || 0) * 100) / 100;

    return {
      totalInvoicesThisMonth: invoicesThisMonth,
      totalInvoicesLastMonth: invoicesLastMonth,
      revenueThisMonth,
      revenueLastMonth,
      totalClients,
      newClientsThisMonth,
      totalCatalogItems,
      invoicesByStatus,
      revenueByDay,
      topClients,
      recentInvoices,
    };
  }
}
