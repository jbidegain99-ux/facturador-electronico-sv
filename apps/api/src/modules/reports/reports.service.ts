import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface TypeStat {
  tipoDte: string;
  nombre: string;
  cantidad: number;
  total: number;
  promedio: number;
}

interface PeriodStat {
  label: string;
  total: number;
  count: number;
  promedio: number;
}

interface RetencionStat {
  tipoImpuesto: string;
  total: number;
  count: number;
  byRate: Array<{ tasa: number; total: number; count: number }>;
}

interface ExportStat {
  total: number;
  count: number;
  promedio: number;
  byCountry: Array<{ pais: string; total: number; count: number }>;
}

export interface TopClientStat {
  clienteId: string;
  nombre: string;
  numDocumento: string;
  total: number;
  count: number;
  promedio: number;
}

export interface ReportByTypeResult {
  data: TypeStat[];
  grandTotal: number;
  grandCount: number;
}

export interface ReportByPeriodResult {
  period: string;
  year: number;
  data: PeriodStat[];
  grandTotal: number;
  grandCount: number;
}

export interface ReportRetencionesResult {
  data: RetencionStat[];
  grandTotal: number;
}

export interface ReportExportsResult extends ExportStat {}

const TIPO_DTE_NAMES: Record<string, string> = {
  '01': 'Factura',
  '03': 'Crédito Fiscal',
  '04': 'Nota de Remisión',
  '05': 'Nota de Crédito',
  '06': 'Nota de Débito',
  '07': 'Comprobante de Retención',
  '09': 'Liquidación',
  '11': 'Factura de Exportación',
  '14': 'Sujeto Excluido',
  '34': 'Retención CRS',
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  async getByType(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ReportByTypeResult> {
    const stats = await this.prisma.dTE.groupBy({
      by: ['tipoDte'],
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
        estado: { notIn: ['ANULADO'] },
      },
      _count: { id: true },
      _sum: { totalPagar: true },
    });

    const allTypes = ['01', '03', '04', '05', '06', '07', '09', '11', '14', '34'];
    let grandTotal = 0;
    let grandCount = 0;

    const data: TypeStat[] = allTypes.map((tipo) => {
      const stat = stats.find((s) => s.tipoDte === tipo);
      const count = stat?._count?.id || 0;
      const total = Number(stat?._sum?.totalPagar) || 0;
      grandTotal += total;
      grandCount += count;
      return {
        tipoDte: tipo,
        nombre: TIPO_DTE_NAMES[tipo] || tipo,
        cantidad: count,
        total: Math.round(total * 100) / 100,
        promedio: count > 0 ? Math.round((total / count) * 100) / 100 : 0,
      };
    });

    return {
      data,
      grandTotal: Math.round(grandTotal * 100) / 100,
      grandCount,
    };
  }

  async getByPeriod(
    tenantId: string,
    period: 'monthly' | 'quarterly' | 'annual',
    year: number,
  ): Promise<ReportByPeriodResult> {
    const dtes = await this.prisma.dTE.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00Z`),
          lte: new Date(`${year}-12-31T23:59:59Z`),
        },
        estado: { notIn: ['ANULADO'] },
      },
      select: { createdAt: true, totalPagar: true },
    });

    let grandTotal = 0;
    let grandCount = 0;

    if (period === 'monthly') {
      const buckets = MONTH_NAMES.map(() => ({ total: 0, count: 0 }));

      for (const dte of dtes) {
        const monthIdx = dte.createdAt.getMonth();
        const monto = Number(dte.totalPagar);
        buckets[monthIdx].total += monto;
        buckets[monthIdx].count += 1;
        grandTotal += monto;
        grandCount += 1;
      }

      return {
        period: 'monthly',
        year,
        data: MONTH_NAMES.map((label, i) => ({
          label,
          total: Math.round(buckets[i].total * 100) / 100,
          count: buckets[i].count,
          promedio: buckets[i].count > 0
            ? Math.round((buckets[i].total / buckets[i].count) * 100) / 100
            : 0,
        })),
        grandTotal: Math.round(grandTotal * 100) / 100,
        grandCount,
      };
    }

    if (period === 'quarterly') {
      const quarterLabels = ['Q1 (Ene-Mar)', 'Q2 (Abr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dic)'];
      const buckets = quarterLabels.map(() => ({ total: 0, count: 0 }));

      for (const dte of dtes) {
        const q = Math.floor(dte.createdAt.getMonth() / 3);
        const monto = Number(dte.totalPagar);
        buckets[q].total += monto;
        buckets[q].count += 1;
        grandTotal += monto;
        grandCount += 1;
      }

      return {
        period: 'quarterly',
        year,
        data: quarterLabels.map((label, i) => ({
          label,
          total: Math.round(buckets[i].total * 100) / 100,
          count: buckets[i].count,
          promedio: buckets[i].count > 0
            ? Math.round((buckets[i].total / buckets[i].count) * 100) / 100
            : 0,
        })),
        grandTotal: Math.round(grandTotal * 100) / 100,
        grandCount,
      };
    }

    // annual: single bucket
    for (const dte of dtes) {
      grandTotal += Number(dte.totalPagar);
      grandCount += 1;
    }

    return {
      period: 'annual',
      year,
      data: [{
        label: `${year}`,
        total: Math.round(grandTotal * 100) / 100,
        count: grandCount,
        promedio: grandCount > 0 ? Math.round((grandTotal / grandCount) * 100) / 100 : 0,
      }],
      grandTotal: Math.round(grandTotal * 100) / 100,
      grandCount,
    };
  }

  async getRetenciones(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ReportRetencionesResult> {
    // Get tipo 07 and 34 DTEs (retention types)
    const dtes = await this.prisma.dTE.findMany({
      where: {
        tenantId,
        tipoDte: { in: ['07', '34'] },
        createdAt: { gte: startDate, lte: endDate },
        estado: { notIn: ['ANULADO'] },
      },
      select: { jsonOriginal: true, tipoDte: true },
    });

    const retMap = new Map<string, { total: number; count: number; byRate: Map<number, { total: number; count: number }> }>();
    let grandTotal = 0;

    for (const dte of dtes) {
      try {
        const json = JSON.parse(dte.jsonOriginal);
        const items = json.cuerpoDocumento || [];

        for (const item of items) {
          // tipo 34 uses tipoImpuesto, tipo 07 uses codigoRetencionMH
          const tipoImpuesto = item.tipoImpuesto || item.codigoRetencionMH || 'OTRO';
          const tasa = Number(item.tasa) || 0;
          const monto = Number(item.ivaRetenido || item.montoRetencion) || 0;

          if (!retMap.has(tipoImpuesto)) {
            retMap.set(tipoImpuesto, { total: 0, count: 0, byRate: new Map() });
          }

          const entry = retMap.get(tipoImpuesto)!;
          entry.total += monto;
          entry.count += 1;
          grandTotal += monto;

          if (!entry.byRate.has(tasa)) {
            entry.byRate.set(tasa, { total: 0, count: 0 });
          }
          const rateEntry = entry.byRate.get(tasa)!;
          rateEntry.total += monto;
          rateEntry.count += 1;
        }
      } catch {
        this.logger.warn(`Failed to parse jsonOriginal for retention DTE`);
      }
    }

    const data: RetencionStat[] = Array.from(retMap.entries())
      .map(([tipoImpuesto, entry]) => ({
        tipoImpuesto,
        total: Math.round(entry.total * 100) / 100,
        count: entry.count,
        byRate: Array.from(entry.byRate.entries())
          .map(([tasa, rateData]) => ({
            tasa,
            total: Math.round(rateData.total * 100) / 100,
            count: rateData.count,
          }))
          .sort((a, b) => b.total - a.total),
      }))
      .sort((a, b) => b.total - a.total);

    return {
      data,
      grandTotal: Math.round(grandTotal * 100) / 100,
    };
  }

  async getTopClients(
    tenantId: string,
    limit: number,
    startDate: Date,
    endDate: Date,
  ): Promise<TopClientStat[]> {
    const stats = await this.prisma.dTE.groupBy({
      by: ['clienteId'],
      where: {
        tenantId,
        clienteId: { not: null },
        createdAt: { gte: startDate, lte: endDate },
        estado: { notIn: ['ANULADO'] },
      },
      _count: { id: true },
      _sum: { totalPagar: true },
      orderBy: { _sum: { totalPagar: 'desc' } },
      take: limit,
    });

    const clientIds = stats.map((s) => s.clienteId).filter(Boolean) as string[];
    const clients = await this.prisma.cliente.findMany({
      where: { id: { in: clientIds }, tenantId },
      select: { id: true, nombre: true, numDocumento: true },
    });

    const clientMap = new Map(clients.map((c) => [c.id, c]));

    return stats.map((s) => {
      const client = clientMap.get(s.clienteId!);
      const total = Number(s._sum.totalPagar) || 0;
      const count = s._count.id;
      return {
        clienteId: s.clienteId!,
        nombre: client?.nombre || 'Desconocido',
        numDocumento: client?.numDocumento || '',
        total: Math.round(total * 100) / 100,
        count,
        promedio: count > 0 ? Math.round((total / count) * 100) / 100 : 0,
      };
    });
  }

  async getExports(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ReportExportsResult> {
    const dtes = await this.prisma.dTE.findMany({
      where: {
        tenantId,
        tipoDte: '11',
        createdAt: { gte: startDate, lte: endDate },
        estado: { notIn: ['ANULADO'] },
      },
      select: { totalPagar: true, jsonOriginal: true },
    });

    const countryMap = new Map<string, { total: number; count: number }>();
    let total = 0;

    for (const dte of dtes) {
      const monto = Number(dte.totalPagar);
      total += monto;

      let pais = 'Desconocido';
      try {
        const json = JSON.parse(dte.jsonOriginal);
        pais = json.receptor?.nombrePais || json.receptor?.pais || 'Desconocido';
      } catch {
        // use default
      }

      if (!countryMap.has(pais)) {
        countryMap.set(pais, { total: 0, count: 0 });
      }
      const entry = countryMap.get(pais)!;
      entry.total += monto;
      entry.count += 1;
    }

    return {
      total: Math.round(total * 100) / 100,
      count: dtes.length,
      promedio: dtes.length > 0 ? Math.round((total / dtes.length) * 100) / 100 : 0,
      byCountry: Array.from(countryMap.entries())
        .map(([pais, data]) => ({
          pais,
          total: Math.round(data.total * 100) / 100,
          count: data.count,
        }))
        .sort((a, b) => b.total - a.total),
    };
  }

  /**
   * Generate CSV content for any report type.
   */
  generateCSV(
    reportType: string,
    data: ReportByTypeResult | ReportByPeriodResult | ReportRetencionesResult | TopClientStat[] | ReportExportsResult,
  ): string {
    const rows: string[][] = [];

    switch (reportType) {
      case 'by-type': {
        rows.push(['Tipo DTE', 'Nombre', 'Cantidad', 'Total ($)', 'Promedio ($)']);
        const items = (data as ReportByTypeResult).data;
        for (const item of items) {
          rows.push([item.tipoDte, item.nombre, String(item.cantidad), item.total.toFixed(2), item.promedio.toFixed(2)]);
        }
        rows.push(['', 'TOTAL', String((data as ReportByTypeResult).grandCount), (data as ReportByTypeResult).grandTotal.toFixed(2), '']);
        break;
      }
      case 'by-period': {
        rows.push(['Período', 'Cantidad', 'Total ($)', 'Promedio ($)']);
        const items = (data as ReportByPeriodResult).data;
        for (const item of items) {
          rows.push([item.label, String(item.count), item.total.toFixed(2), item.promedio.toFixed(2)]);
        }
        rows.push(['TOTAL', String((data as ReportByPeriodResult).grandCount), (data as ReportByPeriodResult).grandTotal.toFixed(2), '']);
        break;
      }
      case 'retenciones': {
        rows.push(['Tipo Impuesto', 'Cantidad', 'Total Retenido ($)']);
        const items = (data as ReportRetencionesResult).data;
        for (const item of items) {
          rows.push([item.tipoImpuesto, String(item.count), item.total.toFixed(2)]);
        }
        rows.push(['TOTAL', '', (data as ReportRetencionesResult).grandTotal.toFixed(2)]);
        break;
      }
      case 'top-clients': {
        rows.push(['#', 'Cliente', 'Documento', 'Cantidad', 'Total ($)', 'Promedio ($)']);
        const items = data as unknown as TopClientStat[];
        items.forEach((item, i) => {
          rows.push([String(i + 1), item.nombre, item.numDocumento, String(item.count), item.total.toFixed(2), item.promedio.toFixed(2)]);
        });
        break;
      }
      case 'exports': {
        rows.push(['País', 'Cantidad', 'Total ($)']);
        const result = data as unknown as ReportExportsResult;
        for (const c of result.byCountry) {
          rows.push([c.pais, String(c.count), c.total.toFixed(2)]);
        }
        rows.push(['TOTAL', String(result.count), result.total.toFixed(2)]);
        break;
      }
      default:
        rows.push(['No data']);
    }

    return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  }
}
