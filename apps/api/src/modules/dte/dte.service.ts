import { Injectable, Logger, BadRequestException, Optional, Inject, forwardRef } from '@nestjs/common';
declare global {
  interface String {
    hashCode(): number;
  }
}

String.prototype.hashCode = function() {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};
import { PrismaService } from '../../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { AccountingAutomationService } from '../accounting/accounting-automation.service';
import { SucursalesService } from '../sucursales/sucursales.service';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { DteNormalizationService } from './services/dte-normalization.service';
import { DteLifecycleService } from './services/dte-lifecycle.service';
import { DteStatsService } from './services/dte-stats.service';

// Enum values as strings for SQL Server compatibility
const DTEStatus = {
  PENDIENTE: 'PENDIENTE',
} as const;

@Injectable()
export class DteService {
  private readonly logger = new Logger(DteService.name);

  constructor(
    private prisma: PrismaService,
    private normalizationService: DteNormalizationService,
    private lifecycleService: DteLifecycleService,
    private statsService: DteStatsService,
    @Optional() @Inject(forwardRef(() => WebhooksService)) private webhooksService: WebhooksService | null,
    @Optional() @Inject(forwardRef(() => AccountingAutomationService)) private accountingAutomation: AccountingAutomationService | null,
    @Optional() private sucursalesService: SucursalesService | null,
  ) {}

  async createDte(tenantId: string | null | undefined, tipoDte: string, data: Record<string, unknown>, sucursalId?: string, puntoVentaId?: string) {
    this.logger.log(`Creating DTE for tenant ${tenantId}, type ${tipoDte}`);

    if (!tenantId) {
      throw new BadRequestException('No se puede crear un DTE sin un tenant asignado');
    }

    if (!data || typeof data !== 'object') {
      throw new BadRequestException('Datos del DTE son requeridos');
    }

    const codigoGeneracion = uuidv4().toUpperCase();

    const ambiente = await this.lifecycleService.resolveAmbiente(tenantId);

    const identificacionData = (data.identificacion as Record<string, unknown>) || {};

    // Normalize the DTE JSON to comply with Hacienda schema for the specific tipoDte
    let normalizedData: Record<string, unknown>;
    try {
      normalizedData = await this.normalizationService.normalizeJsonForHacienda(tenantId, tipoDte, data);
    } catch (normalizeError) {
      this.logger.error(`Failed to normalize DTE JSON for tenant ${tenantId}, type ${tipoDte}: ${normalizeError instanceof Error ? normalizeError.message : normalizeError}`);
      if (normalizeError instanceof BadRequestException) throw normalizeError;
      throw new BadRequestException(
        `Error al preparar datos del DTE: ${normalizeError instanceof Error ? normalizeError.message : 'Error desconocido'}`,
      );
    }

    // Extract totals from resumen (structure varies by DTE type)
    const { totalGravada, totalIva, totalPagar } = this.extractTotals(tipoDte, normalizedData);

    // Try to find or create client based on receptor data
    const clienteId = await this.resolveClienteId(tenantId, tipoDte, data);

    try {
      const dte = await this.prisma.$transaction(async (tx) => {
        const correlativo = await this.getNextCorrelativo(tenantId, tipoDte, tx);
        const numeroControl = await this.generateNumeroControl(tenantId, tipoDte, correlativo, sucursalId, puntoVentaId);

        const jsonOriginal = {
          ...normalizedData,
          identificacion: {
            ...((normalizedData.identificacion as Record<string, unknown>) || identificacionData),
            codigoGeneracion,
            numeroControl,
            ambiente,
          },
        };

        this.logger.log(`Creating DTE record: codigoGeneracion=${codigoGeneracion}, numeroControl=${numeroControl}`);
        this.logger.log(`Totals: gravada=${totalGravada}, iva=${totalIva}, pagar=${totalPagar}`);

        return tx.dTE.create({
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
            ...(sucursalId && { sucursalId }),
            ...(puntoVentaId && { puntoVentaId }),
          },
        });
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      });

      this.logger.log(`DTE created successfully: id=${dte.id}`);

      await this.logDteAction(dte.id, 'CREATED', {
        jsonOriginal: JSON.parse(dte.jsonOriginal as string),
      });

      // Trigger webhook (fire-and-forget)
      this.triggerWebhook(tenantId, 'dte.created', {
        dteId: dte.id,
        codigoGeneracion: dte.codigoGeneracion,
        numeroControl: dte.numeroControl,
        tipoDte: dte.tipoDte,
        totalPagar: Number(dte.totalPagar),
        estado: dte.estado,
      }, dte.id);

      // Trigger accounting entry on creation (fire-and-forget)
      this.triggerAccountingEntry(dte.id, tenantId, 'ON_CREATED');

      // Auto sign and transmit to Hacienda (fire-and-forget)
      this.lifecycleService.autoSignAndTransmit(dte.id, tenantId).catch(err =>
        this.logger.error(`Auto sign+transmit failed for DTE ${dte.id}: ${err instanceof Error ? err.message : err}`),
      );

      return dte;
    } catch (error) {
      this.logger.error(`Failed to create DTE: ${error instanceof Error ? error.message : error}`);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException(
          `Numero de control duplicado. Intente de nuevo.`,
        );
      }
      throw error;
    }
  }

  // =====================
  // Delegated lifecycle methods
  // =====================

  async signDte(dteId: string, tenantId: string) {
    return this.lifecycleService.signDte(dteId, tenantId);
  }

  async transmitDte(dteId: string, nit: string, password: string, tenantId: string) {
    return this.lifecycleService.transmitDte(dteId, nit, password, tenantId);
  }

  async anularDte(dteId: string, motivo: string, tenantId: string) {
    return this.lifecycleService.anularDte(dteId, motivo, tenantId);
  }

  async sendEmailManually(id: string, tenantId: string, overrideEmail?: string) {
    return this.lifecycleService.sendEmailManually(id, tenantId, overrideEmail);
  }

  // =====================
  // Query methods
  // =====================

  async findByTenant(
    tenantId: string | null | undefined,
    page = 1,
    limit = 20,
    filters?: { tipoDte?: string; estado?: string; search?: string },
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ) {
    this.logger.log(`Finding DTEs for tenant ${tenantId}, page ${page}, limit ${limit}`);
    this.logger.log(`Filters: ${JSON.stringify(filters)}, sort: ${sortBy || 'createdAt'} ${sortOrder || 'desc'}`);

    if (!tenantId) {
      this.logger.warn('User has no tenantId assigned, returning empty results');
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const skip = (page - 1) * limit;

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      totalPagar: 'totalPagar',
      numeroControl: 'numeroControl',
      tipoDte: 'tipoDte',
      estado: 'estado',
    };

    const resolvedSortBy = sortBy && allowedSortFields[sortBy] ? allowedSortFields[sortBy] : 'createdAt';
    const resolvedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const where: Record<string, unknown> = { tenantId };

    if (filters?.tipoDte) {
      where.tipoDte = filters.tipoDte;
    }

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.search) {
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
        orderBy: { [resolvedSortBy]: resolvedSortOrder },
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

  async findOne(id: string, tenantId: string) {
    return this.prisma.dTE.findFirst({
      where: { id, tenantId },
      include: { cliente: true, logs: true },
    });
  }

  async findOneWithTenant(id: string, tenantId: string) {
    return this.prisma.dTE.findFirst({
      where: { id, tenantId },
      include: { cliente: true, logs: true, tenant: true },
    });
  }

  // =====================
  // Delegated stats methods
  // =====================

  async getSummaryStats(tenantId: string | null | undefined) {
    return this.statsService.getSummaryStats(tenantId);
  }

  async getStatsByDate(
    tenantId: string | null | undefined,
    startDate?: Date,
    endDate?: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.statsService.getStatsByDate(tenantId, startDate, endDate, groupBy);
  }

  async getStatsByType(tenantId: string | null | undefined, startDate?: Date, endDate?: Date) {
    return this.statsService.getStatsByType(tenantId, startDate, endDate);
  }

  async getStatsByStatus(tenantId: string | null | undefined) {
    return this.statsService.getStatsByStatus(tenantId);
  }

  async getTopClients(
    tenantId: string | null | undefined,
    limit = 10,
    startDate?: Date,
    endDate?: Date,
  ) {
    return this.statsService.getTopClients(tenantId, limit, startDate, endDate);
  }

  async getRecentDTEs(tenantId: string | null | undefined, limit = 5) {
    return this.statsService.getRecentDTEs(tenantId, limit);
  }

  // =====================
  // Private helpers (used directly by createDte)
  // =====================

  private extractTotals(tipoDte: string, normalizedData: Record<string, unknown>): { totalGravada: number; totalIva: number; totalPagar: number } {
    const resumen = normalizedData.resumen as Record<string, unknown> | undefined;

    if (tipoDte === '07') {
      return {
        totalGravada: Number(resumen?.totalSujetoRetencion) || 0,
        totalIva: Number(resumen?.totalIVAretenido) || 0,
        totalPagar: Number(resumen?.totalIVAretenido) || 0,
      };
    }
    if (tipoDte === '34') {
      return {
        totalGravada: Number(resumen?.totalSujetoRetencion) || 0,
        totalIva: 0,
        totalPagar: Number(resumen?.totalRetenido) || 0,
      };
    }
    if (tipoDte === '09') {
      return {
        totalGravada: Number(resumen?.totalGravada) || 0,
        totalIva: Number(resumen?.totalIva) || 0,
        totalPagar: Number(resumen?.liquidoApagar) || Number(resumen?.totalPagar) || 0,
      };
    }
    if (tipoDte === '11') {
      return {
        totalGravada: Number(resumen?.totalGravada) || 0,
        totalIva: 0,
        totalPagar: Number(resumen?.totalPagar) || Number(resumen?.montoTotalOperacion) || 0,
      };
    }
    if (tipoDte === '14') {
      const totalGravada = Number(resumen?.totalCompra) || 0;
      return {
        totalGravada,
        totalIva: 0,
        totalPagar: Number(resumen?.totalPagar) || totalGravada,
      };
    }

    // Default: 01, 03, 05, 06
    const totalGravada = Number(resumen?.totalGravada) || 0;
    const tributos = resumen?.tributos as Array<Record<string, unknown>> | null | undefined;
    const tributosIva = tributos?.[0]?.valor ? Number(tributos[0].valor) : 0;
    return {
      totalGravada,
      totalIva: Number(resumen?.totalIva) || tributosIva || 0,
      totalPagar: Number(resumen?.totalPagar) || 0,
    };
  }

  private async resolveClienteId(tenantId: string, tipoDte: string, data: Record<string, unknown>): Promise<string | undefined> {
    const receptor = (tipoDte === '14'
      ? data.sujetoExcluido as Record<string, unknown> | undefined
      : data.receptor as Record<string, unknown> | undefined);

    if (!receptor?.nombre) return undefined;

    const receptorNombre = receptor.nombre as string;
    const receptorNumDoc = (receptor.numDocumento as string) || '';
    const hasNumDocumento = receptorNumDoc.length > 0;

    this.logger.log(`Client lookup: nombre="${receptorNombre}", numDocumento="${receptorNumDoc}", hasNumDoc=${hasNumDocumento}`);

    const orConditions: Array<Record<string, string>> = [];
    if (hasNumDocumento) {
      orConditions.push({ numDocumento: receptorNumDoc });
    }
    orConditions.push({ nombre: receptorNombre });

    const existingCliente = await this.prisma.cliente.findFirst({
      where: {
        tenantId,
        OR: orConditions,
      },
    });

    if (existingCliente) {
      this.logger.log(`Found existing client: id=${existingCliente.id}, nombre="${existingCliente.nombre}", numDocumento="${existingCliente.numDocumento}"`);

      if (existingCliente.nombre !== receptorNombre ||
          existingCliente.correo !== ((receptor.correo as string) || null) ||
          existingCliente.telefono !== ((receptor.telefono as string) || null)) {
        this.logger.log(`Updating existing client ${existingCliente.id} with new details`);
        await this.prisma.cliente.updateMany({
          where: { id: existingCliente.id, tenantId },
          data: {
            nombre: receptorNombre,
            correo: (receptor.correo as string) || null,
            telefono: (receptor.telefono as string) || null,
          },
        }).catch(err => this.logger.warn(`Failed to update client: ${err instanceof Error ? err.message : err}`));
      }

      return existingCliente.id;
    }

    // Create new client
    const numDocumentoForDb = hasNumDocumento ? receptorNumDoc : `AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      const newCliente = await this.prisma.cliente.create({
        data: {
          tenantId,
          tipoDocumento: (receptor.tipoDocumento as string) || '13',
          numDocumento: numDocumentoForDb,
          nombre: receptorNombre,
          nrc: (receptor.nrc as string) || null,
          telefono: (receptor.telefono as string) || null,
          correo: (receptor.correo as string) || null,
          direccion: JSON.stringify(receptor.direccion || {}),
        },
      });
      this.logger.log(`Created new client: id=${newCliente.id}, nombre="${newCliente.nombre}", numDocumento="${newCliente.numDocumento}"`);
      return newCliente.id;
    } catch (clientError) {
      if (clientError instanceof Prisma.PrismaClientKnownRequestError && clientError.code === 'P2002') {
        this.logger.warn(`Client unique constraint hit for numDocumento="${receptorNumDoc}", finding by document`);
        if (hasNumDocumento) {
          const retryCliente = await this.prisma.cliente.findFirst({
            where: { tenantId, numDocumento: receptorNumDoc },
          });
          return retryCliente?.id;
        }
      } else {
        this.logger.error(`Failed to create client during DTE: ${clientError instanceof Error ? clientError.message : clientError}`);
      }
      return undefined;
    }
  }

  private async getNextCorrelativo(
    tenantId: string,
    tipoDte: string,
    prismaClient?: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
  ): Promise<number> {
    const client = prismaClient || this.prisma;
    const lastDte = await client.dTE.findFirst({
      where: { tenantId, tipoDte },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastDte) return 1;

    const match = lastDte.numeroControl.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) + 1 : 1;
  }

  private async generateNumeroControl(
    tenantId: string,
    tipoDte: string,
    correlativo: number,
    sucursalId?: string,
    puntoVentaId?: string,
  ): Promise<string> {
    let codEstablecimiento = 'M001P001';

    if (this.sucursalesService) {
      try {
        codEstablecimiento = await this.sucursalesService.getCodEstablecimiento(
          tenantId,
          sucursalId,
          puntoVentaId,
        );
      } catch (err) {
        this.logger.warn(`Failed to get codEstablecimiento for tenant ${tenantId}: ${err instanceof Error ? err.message : err}`);
      }
    }

    const codPadded = codEstablecimiento.padStart(8, '0').slice(0, 8);
    return `DTE-${tipoDte}-${codPadded}-${correlativo.toString().padStart(15, '0')}`;
  }

  private async logDteAction(dteId: string, accion: string, data: Record<string, unknown>) {
    try {
      await this.prisma.dTELog.create({
        data: {
          dteId,
          accion,
          request: JSON.stringify(data),
        },
      });
    } catch (logError) {
      this.logger.error(`Failed to log DTE action [${accion}] for ${dteId}: ${logError instanceof Error ? logError.message : logError}`);
    }
  }

  private triggerWebhook(
    tenantId: string,
    eventType: string,
    data: Record<string, unknown>,
    correlationId: string,
  ): void {
    if (!this.webhooksService) return;
    this.webhooksService.triggerEvent({ tenantId, eventType, data, correlationId }).catch((err) =>
      this.logger.error(`Webhook trigger failed for ${eventType}: ${err instanceof Error ? err.message : err}`),
    );
  }

  private triggerAccountingEntry(dteId: string, tenantId: string, trigger: string): void {
    if (!this.accountingAutomation) return;
    this.accountingAutomation.generateFromDTE(dteId, tenantId, trigger).catch((err) =>
      this.logger.error(`Accounting auto-entry failed for DTE ${dteId}: ${err instanceof Error ? err.message : err}`),
    );
  }
}
