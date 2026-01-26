import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SignerService } from '../signer/signer.service';
import { MhAuthService } from '../mh-auth/mh-auth.service';
import { sendDTE, SendDTERequest, MHReceptionError } from '@facturador/mh-client';
import { DTE_VERSIONS, TipoDte } from '@facturador/shared';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';

// Enum values as strings for SQL Server compatibility
const DTEStatus = {
  PENDIENTE: 'PENDIENTE',
  FIRMADO: 'FIRMADO',
  ENVIADO: 'ENVIADO',
  PROCESADO: 'PROCESADO',
  RECHAZADO: 'RECHAZADO',
  ANULADO: 'ANULADO',
} as const;

@Injectable()
export class DteService {
  private readonly logger = new Logger(DteService.name);

  constructor(
    private prisma: PrismaService,
    private signerService: SignerService,
    private mhAuthService: MhAuthService,
  ) {}

  /**
   * Check if demo mode is enabled for a tenant
   * Demo mode simulates Hacienda responses without actual API calls
   */
  private isDemoMode(tenant?: { plan?: string } | null): boolean {
    // Enable demo mode via environment variable or if tenant plan is DEMO/TRIAL
    if (process.env.DEMO_MODE === 'true') return true;
    if (tenant?.plan === 'DEMO' || tenant?.plan === 'TRIAL') return true;
    return false;
  }

  /**
   * Generate simulated Hacienda response for demo mode
   */
  private generateDemoResponse(codigoGeneracion: string) {
    const selloRecibido = `DEMO${Date.now()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return {
      estado: 'PROCESADO',
      selloRecibido,
      fhProcesamiento: new Date().toISOString(),
      observaciones: ['[MODO DEMO] Documento procesado en modo de prueba - No enviado a Hacienda'],
    };
  }

  async createDte(tenantId: string, tipoDte: string, data: Record<string, unknown>) {
    this.logger.log(`Creating DTE for tenant ${tenantId}, type ${tipoDte}`);

    const codigoGeneracion = uuidv4().toUpperCase();
    const correlativo = await this.getNextCorrelativo(tenantId, tipoDte);
    const numeroControl = this.generateNumeroControl(tipoDte, correlativo);

    const jsonOriginal = {
      ...data,
      identificacion: {
        ...(data.identificacion as Record<string, unknown>),
        codigoGeneracion,
        numeroControl,
      },
    };

    // Extract totals from resumen
    const resumen = data.resumen as Record<string, unknown> | undefined;
    const totalGravada = Number(resumen?.totalGravada) || 0;
    const totalIva = Number(resumen?.totalIva) || 0;
    const totalPagar = Number(resumen?.totalPagar) || 0;

    // Try to find or create client based on receptor data
    let clienteId: string | undefined;
    const receptor = data.receptor as Record<string, unknown> | undefined;
    if (receptor?.nombre) {
      const existingCliente = await this.prisma.cliente.findFirst({
        where: {
          tenantId,
          OR: [
            { numDocumento: receptor.numDocumento as string },
            { nombre: receptor.nombre as string },
          ].filter(c => Object.values(c)[0]),
        },
      });

      if (existingCliente) {
        clienteId = existingCliente.id;
      } else {
        // Create new client from receptor data
        const newCliente = await this.prisma.cliente.create({
          data: {
            tenantId,
            tipoDocumento: (receptor.tipoDocumento as string) || '13',
            numDocumento: (receptor.numDocumento as string) || '',
            nombre: receptor.nombre as string,
            nrc: (receptor.nrc as string) || null,
            telefono: (receptor.telefono as string) || null,
            correo: (receptor.correo as string) || null,
            direccion: JSON.stringify(receptor.direccion || {}),
          },
        });
        clienteId = newCliente.id;
      }
    }

    this.logger.log(`Creating DTE record: codigoGeneracion=${codigoGeneracion}, numeroControl=${numeroControl}`);
    this.logger.log(`Totals: gravada=${totalGravada}, iva=${totalIva}, pagar=${totalPagar}`);

    try {
      const dte = await this.prisma.dTE.create({
        data: {
          tenantId,
          tipoDte,
          codigoGeneracion,
          numeroControl,
          jsonOriginal: JSON.stringify(jsonOriginal),
          totalGravada: parseFloat(totalGravada.toFixed(2)),
          totalIva: parseFloat(totalIva.toFixed(2)),
          totalPagar: parseFloat(totalPagar.toFixed(2)),
          estado: DTEStatus.PENDIENTE,
          ...(clienteId && { clienteId }),
        },
      });

      this.logger.log(`DTE created successfully: id=${dte.id}`);

      await this.logDteAction(dte.id, 'CREATED', { jsonOriginal });

      return dte;
    } catch (error) {
      this.logger.error(`Failed to create DTE: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  async signDte(dteId: string) {
    const dte = await this.prisma.dTE.findUnique({
      where: { id: dteId },
      include: { tenant: true },
    });

    if (!dte) {
      throw new Error('DTE no encontrado');
    }

    // Parse jsonOriginal from string
    const jsonOriginalParsed = typeof dte.jsonOriginal === 'string'
      ? JSON.parse(dte.jsonOriginal)
      : dte.jsonOriginal;

    let jsonFirmado: string;

    // Demo mode: simulate signing without a real certificate
    if (this.isDemoMode(dte.tenant)) {
      this.logger.log(`[DEMO MODE] Simulating DTE signing for ${dteId}`);
      // Create a mock JWS-like string for demo purposes
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify(jsonOriginalParsed)).toString('base64url');
      const signature = Buffer.from(`DEMO_SIGNATURE_${Date.now()}`).toString('base64url');
      jsonFirmado = `${header}.${payload}.${signature}`;
    } else {
      if (!this.signerService.isCertificateLoaded()) {
        throw new Error('No certificate loaded for signing');
      }
      jsonFirmado = await this.signerService.signDTE(jsonOriginalParsed);
    }

    const updated = await this.prisma.dTE.update({
      where: { id: dteId },
      data: {
        jsonFirmado,
        estado: DTEStatus.FIRMADO,
      },
    });

    await this.logDteAction(dteId, 'SIGNED', {
      jsonFirmado: jsonFirmado.substring(0, 100) + '...',
      demoMode: this.isDemoMode(dte.tenant),
    });

    return updated;
  }

  async transmitDte(dteId: string, nit: string, password: string) {
    const dte = await this.prisma.dTE.findUnique({
      where: { id: dteId },
      include: { tenant: true },
    });

    if (!dte || !dte.jsonFirmado) {
      throw new Error('DTE no encontrado o no firmado');
    }

    // Demo mode: simulate Hacienda response
    if (this.isDemoMode(dte.tenant)) {
      this.logger.log(`[DEMO MODE] Simulating DTE transmission for ${dteId}`);
      const demoResponse = this.generateDemoResponse(dte.codigoGeneracion);

      const updated = await this.prisma.dTE.update({
        where: { id: dteId },
        data: {
          estado: DTEStatus.PROCESADO,
          selloRecepcion: demoResponse.selloRecibido,
          fechaRecepcion: new Date(demoResponse.fhProcesamiento),
          descripcionMh: demoResponse.observaciones?.join(', '),
          intentosEnvio: { increment: 1 },
        },
      });

      await this.logDteAction(dteId, 'TRANSMITTED_DEMO', { response: demoResponse, demoMode: true });

      return updated;
    }

    try {
      // Get auth token
      const env = (process.env.MH_API_ENV as 'test' | 'prod') || 'test';
      const tokenInfo = await this.mhAuthService.getToken(nit, password, env);

      // Parse jsonOriginal from string
      const jsonOriginalParsed = typeof dte.jsonOriginal === 'string'
        ? JSON.parse(dte.jsonOriginal)
        : dte.jsonOriginal;
      const ambiente = (jsonOriginalParsed?.identificacion?.ambiente || '00') as '00' | '01';

      const request: SendDTERequest = {
        ambiente,
        idEnvio: Date.now(),
        version: DTE_VERSIONS[dte.tipoDte as TipoDte],
        tipoDte: dte.tipoDte as TipoDte,
        documento: dte.jsonFirmado,
        codigoGeneracion: dte.codigoGeneracion,
      };

      // Send to MH
      const response = await sendDTE(tokenInfo.token, request, { env });

      const updated = await this.prisma.dTE.update({
        where: { id: dteId },
        data: {
          estado: DTEStatus.PROCESADO,
          selloRecepcion: response.selloRecibido || undefined,
          fechaRecepcion: response.fhProcesamiento ? new Date(response.fhProcesamiento) : null,
          descripcionMh: response.observaciones?.join(', '),
          intentosEnvio: { increment: 1 },
        },
      });

      await this.logDteAction(dteId, 'TRANSMITTED', { response });

      return updated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const observaciones = error instanceof MHReceptionError ? error.observaciones : undefined;

      await this.prisma.dTE.update({
        where: { id: dteId },
        data: {
          estado: DTEStatus.RECHAZADO,
          descripcionMh: observaciones?.join(', ') || errorMessage,
          intentosEnvio: { increment: 1 },
        },
      });

      await this.logDteAction(dteId, 'TRANSMISSION_ERROR', { error: errorMessage, observaciones });

      throw error;
    }
  }

  async findByTenant(
    tenantId: string,
    page = 1,
    limit = 20,
    filters?: { tipoDte?: string; estado?: string; search?: string },
  ) {
    this.logger.log(`Finding DTEs for tenant ${tenantId}, page ${page}, limit ${limit}`);
    this.logger.log(`Filters: ${JSON.stringify(filters)}`);

    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (filters?.tipoDte) {
      where.tipoDte = filters.tipoDte;
    }

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.search) {
      // SQL Server uses collation for case sensitivity, remove 'mode: insensitive'
      where.OR = [
        { numeroControl: { contains: filters.search } },
        { codigoGeneracion: { contains: filters.search } },
        { cliente: { nombre: { contains: filters.search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.dTE.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { cliente: true },
      }),
      this.prisma.dTE.count({ where }),
    ]);

    this.logger.log(`Found ${total} DTEs for tenant ${tenantId}, returning ${data.length} results`);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    return this.prisma.dTE.findUnique({
      where: { id },
      include: { cliente: true, logs: true },
    });
  }

  async findOneWithTenant(id: string) {
    return this.prisma.dTE.findUnique({
      where: { id },
      include: { cliente: true, logs: true, tenant: true },
    });
  }

  async anularDte(dteId: string, motivo: string) {
    const dte = await this.prisma.dTE.findUnique({
      where: { id: dteId },
    });

    if (!dte) {
      throw new Error('DTE no encontrado');
    }

    if (dte.estado === DTEStatus.ANULADO) {
      throw new Error('El DTE ya está anulado');
    }

    const updated = await this.prisma.dTE.update({
      where: { id: dteId },
      data: {
        estado: DTEStatus.ANULADO,
        descripcionMh: `Anulado: ${motivo}`,
      },
    });

    await this.logDteAction(dteId, 'ANULADO', { motivo });

    return updated;
  }

  private async getNextCorrelativo(tenantId: string, tipoDte: string): Promise<number> {
    const lastDte = await this.prisma.dTE.findFirst({
      where: { tenantId, tipoDte },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastDte) return 1;

    const match = lastDte.numeroControl.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) + 1 : 1;
  }

  private generateNumeroControl(tipoDte: string, correlativo: number): string {
    const establecimiento = 'M001P001'; // TODO: Get from tenant config
    return `DTE-${tipoDte}-${establecimiento}-${correlativo.toString().padStart(15, '0')}`;
  }

  private async logDteAction(dteId: string, accion: string, data: Record<string, unknown>) {
    await this.prisma.dTELog.create({
      data: {
        dteId,
        accion,
        request: JSON.stringify(data),
      },
    });
  }

  // =====================
  // Analytics Methods
  // =====================

  async getSummaryStats(tenantId: string) {
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
      // DTEs today
      this.prisma.dTE.count({
        where: { tenantId, createdAt: { gte: startOfDay } },
      }),
      // DTEs this month
      this.prisma.dTE.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      // DTEs last month
      this.prisma.dTE.count({
        where: {
          tenantId,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      // Total facturado this month
      this.prisma.dTE.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
          estado: { in: [DTEStatus.PROCESADO, DTEStatus.FIRMADO] },
        },
        _sum: { totalPagar: true },
      }),
      // Total facturado last month
      this.prisma.dTE.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          estado: { in: [DTEStatus.PROCESADO, DTEStatus.FIRMADO] },
        },
        _sum: { totalPagar: true },
      }),
      // Rejected DTEs
      this.prisma.dTE.count({
        where: { tenantId, estado: DTEStatus.RECHAZADO },
      }),
    ]);

    const totalFacturadoMes = Number(totalThisMonth._sum?.totalPagar) || 0;
    const totalFacturadoMesAnterior = Number(totalLastMonth._sum?.totalPagar) || 0;

    // Calculate percentage changes
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
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days default

    const dtes = await this.prisma.dTE.findMany({
      where: {
        tenantId,
        createdAt: { gte: start, lte: end },
      },
      select: {
        createdAt: true,
        totalPagar: true,
        tipoDte: true,
        estado: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const grouped: Record<string, { count: number; total: number; date: string }> = {};

    dtes.forEach((dte: typeof dtes[0]) => {
      const date = dte.createdAt;
      let key: string;

      switch (groupBy) {
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        default: // day
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = { count: 0, total: 0, date: key };
      }
      grouped[key].count += 1;
      grouped[key].total += Number(dte.totalPagar) || 0;
    });

    // Fill in missing dates for continuous chart
    const result: Array<{ fecha: string; cantidad: number; total: number }> = [];
    const current = new Date(start);

    while (current <= end) {
      let key: string;

      switch (groupBy) {
        case 'month':
          key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
          current.setMonth(current.getMonth() + 1);
          break;
        case 'week':
          const weekStart = new Date(current);
          weekStart.setDate(current.getDate() - current.getDay());
          key = weekStart.toISOString().split('T')[0];
          current.setDate(current.getDate() + 7);
          break;
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

  async getStatsByType(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const stats = await this.prisma.dTE.groupBy({
      by: ['tipoDte'],
      where,
      _count: { id: true },
      _sum: { totalPagar: true },
    });

    const tipoDteNames: Record<string, string> = {
      '01': 'Factura',
      '03': 'Credito Fiscal',
      '05': 'Nota de Credito',
      '06': 'Nota de Debito',
      '07': 'Nota de Remision',
      '11': 'Factura Exportacion',
      '14': 'Factura Sujeto Excluido',
    };

    return stats.map((s: typeof stats[0]) => ({
      tipoDte: s.tipoDte,
      nombre: tipoDteNames[s.tipoDte] || s.tipoDte,
      cantidad: s._count.id,
      total: Number(s._sum.totalPagar) || 0,
    }));
  }

  async getStatsByStatus(tenantId: string) {
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
    tenantId: string,
    limit = 10,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = {
      tenantId,
      clienteId: { not: null },
      estado: { in: [DTEStatus.PROCESADO, DTEStatus.FIRMADO] },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const stats = await this.prisma.dTE.groupBy({
      by: ['clienteId'],
      where,
      _count: { id: true },
      _sum: { totalPagar: true },
      orderBy: { _sum: { totalPagar: 'desc' } },
      take: limit,
    });

    // Get client names
    const clientIds = stats.map((s: typeof stats[0]) => s.clienteId).filter(Boolean) as string[];
    const clients = await this.prisma.cliente.findMany({
      where: { id: { in: clientIds } },
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

  async getRecentDTEs(tenantId: string, limit = 5) {
    return this.prisma.dTE.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { cliente: { select: { nombre: true, numDocumento: true } } },
    });
  }
}
