import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTemplateDto, TemplateItemDto } from './dto';
import { UpdateTemplateDto } from './dto';
import { PaginationQueryDto } from '../../common/dto';
import { PaginatedResponse } from '../../common/dto/paginated-response';
import { RecurringInvoiceTemplate, RecurringInvoiceHistory } from '@prisma/client';

export interface TemplateWithRelations extends RecurringInvoiceTemplate {
  cliente: { id: string; nombre: string; numDocumento: string };
  history?: RecurringInvoiceHistory[];
  _count?: { history: number };
}

@Injectable()
export class RecurringInvoicesService {
  private readonly logger = new Logger(RecurringInvoicesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get the plan code for a tenant (used for feature gating)
   */
  async getTenantPlanCode(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });
    return tenant?.plan ?? 'DEMO';
  }

  async create(tenantId: string, dto: CreateTemplateDto): Promise<RecurringInvoiceTemplate> {
    // Verify client belongs to tenant
    const cliente = await this.prisma.cliente.findFirst({
      where: { id: dto.clienteId, tenantId },
    });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const startDate = new Date(dto.startDate);
    const nextRunDate = this.calculateNextRunDate({
      interval: dto.interval,
      anchorDay: dto.anchorDay,
      dayOfWeek: dto.dayOfWeek,
      startDate,
    });

    return this.prisma.recurringInvoiceTemplate.create({
      data: {
        tenantId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        clienteId: dto.clienteId,
        tipoDte: dto.tipoDte || '01',
        interval: dto.interval,
        anchorDay: dto.anchorDay,
        dayOfWeek: dto.dayOfWeek,
        mode: dto.mode || 'AUTO_DRAFT',
        autoTransmit: dto.autoTransmit || false,
        items: JSON.stringify(dto.items),
        notas: dto.notas,
        startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        nextRunDate,
      },
    });
  }

  async findAll(
    tenantId: string,
    query: PaginationQueryDto & { status?: string },
  ): Promise<PaginatedResponse<TemplateWithRelations>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Math.max(1, Number(query.limit) || 20), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { nombre: { contains: query.search } },
        { cliente: { nombre: { contains: query.search } } },
      ];
    }

    const allowedSortFields = ['nombre', 'createdAt', 'nextRunDate', 'status'];
    const sortBy = allowedSortFields.includes(query.sortBy || '') ? query.sortBy : 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const [data, total] = await Promise.all([
      this.prisma.recurringInvoiceTemplate.findMany({
        where,
        include: {
          cliente: { select: { id: true, nombre: true, numDocumento: true } },
          _count: { select: { history: true } },
        },
        orderBy: { [sortBy!]: sortOrder },
        skip,
        take: limit,
      }) as Promise<TemplateWithRelations[]>,
      this.prisma.recurringInvoiceTemplate.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(tenantId: string, id: string): Promise<TemplateWithRelations> {
    const template = await this.prisma.recurringInvoiceTemplate.findFirst({
      where: { id, tenantId },
      include: {
        cliente: { select: { id: true, nombre: true, numDocumento: true } },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { history: true } },
      },
    }) as TemplateWithRelations | null;

    if (!template) {
      throw new NotFoundException('Template no encontrado');
    }

    return template;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateTemplateDto,
  ): Promise<RecurringInvoiceTemplate> {
    const template = await this.prisma.recurringInvoiceTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Template no encontrado');
    }

    const data: Record<string, unknown> = {};

    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.tipoDte !== undefined) data.tipoDte = dto.tipoDte;
    if (dto.mode !== undefined) data.mode = dto.mode;
    if (dto.autoTransmit !== undefined) data.autoTransmit = dto.autoTransmit;
    if (dto.notas !== undefined) data.notas = dto.notas;
    if (dto.items !== undefined) data.items = JSON.stringify(dto.items);
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;

    // If schedule changed, recalculate nextRunDate
    if (dto.interval !== undefined || dto.anchorDay !== undefined || dto.dayOfWeek !== undefined) {
      data.interval = dto.interval ?? template.interval;
      data.anchorDay = dto.anchorDay ?? template.anchorDay;
      data.dayOfWeek = dto.dayOfWeek ?? template.dayOfWeek;

      data.nextRunDate = this.calculateNextRunDate({
        interval: data.interval as string,
        anchorDay: data.anchorDay as number | undefined,
        dayOfWeek: data.dayOfWeek as number | undefined,
        startDate: template.startDate,
      });
    }

    if (dto.clienteId !== undefined) {
      const cliente = await this.prisma.cliente.findFirst({
        where: { id: dto.clienteId, tenantId },
      });
      if (!cliente) {
        throw new NotFoundException('Cliente no encontrado');
      }
      data.clienteId = dto.clienteId;
    }

    return this.prisma.recurringInvoiceTemplate.update({
      where: { id },
      data,
    });
  }

  async pause(tenantId: string, id: string): Promise<RecurringInvoiceTemplate> {
    const template = await this.prisma.recurringInvoiceTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Template no encontrado');
    }

    if (template.status !== 'ACTIVE' && template.status !== 'SUSPENDED_ERROR') {
      throw new BadRequestException('Solo se pueden pausar templates activos o suspendidos');
    }

    return this.prisma.recurringInvoiceTemplate.update({
      where: { id },
      data: { status: 'PAUSED' },
    });
  }

  async resume(tenantId: string, id: string): Promise<RecurringInvoiceTemplate> {
    const template = await this.prisma.recurringInvoiceTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Template no encontrado');
    }

    if (template.status !== 'PAUSED' && template.status !== 'SUSPENDED_ERROR') {
      throw new BadRequestException('Solo se pueden reanudar templates pausados o suspendidos');
    }

    const nextRunDate = this.calculateNextRunDate({
      interval: template.interval,
      anchorDay: template.anchorDay ?? undefined,
      dayOfWeek: template.dayOfWeek ?? undefined,
      startDate: template.startDate,
    });

    return this.prisma.recurringInvoiceTemplate.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        consecutiveFailures: 0,
        lastError: null,
        nextRunDate,
      },
    });
  }

  async cancel(tenantId: string, id: string): Promise<RecurringInvoiceTemplate> {
    const template = await this.prisma.recurringInvoiceTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Template no encontrado');
    }

    if (template.status === 'CANCELLED') {
      throw new BadRequestException('Template ya esta cancelado');
    }

    return this.prisma.recurringInvoiceTemplate.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async getHistory(
    tenantId: string,
    templateId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<RecurringInvoiceHistory>> {
    // Verify template belongs to tenant
    const template = await this.prisma.recurringInvoiceTemplate.findFirst({
      where: { id: templateId, tenantId },
    });
    if (!template) {
      throw new NotFoundException('Template no encontrado');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Math.max(1, Number(query.limit) || 20), 100);
    const skip = (page - 1) * limit;

    const where = { templateId };

    const [data, total] = await Promise.all([
      this.prisma.recurringInvoiceHistory.findMany({
        where,
        orderBy: { runDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.recurringInvoiceHistory.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get templates that are due to run (used by scheduler)
   */
  async getDueTemplates(): Promise<RecurringInvoiceTemplate[]> {
    return this.prisma.recurringInvoiceTemplate.findMany({
      where: {
        status: 'ACTIVE',
        nextRunDate: { lte: new Date() },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
    });
  }

  /**
   * Record a successful execution
   */
  async recordSuccess(templateId: string, dteId: string): Promise<void> {
    const template = await this.prisma.recurringInvoiceTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) return;

    const nextRunDate = this.calculateNextRunDate({
      interval: template.interval,
      anchorDay: template.anchorDay ?? undefined,
      dayOfWeek: template.dayOfWeek ?? undefined,
      startDate: template.startDate,
    });

    await this.prisma.$transaction([
      this.prisma.recurringInvoiceHistory.create({
        data: {
          templateId,
          dteId,
          status: 'SUCCESS',
          runDate: new Date(),
        },
      }),
      this.prisma.recurringInvoiceTemplate.update({
        where: { id: templateId },
        data: {
          status: 'ACTIVE',
          lastRunDate: new Date(),
          nextRunDate,
          consecutiveFailures: 0,
          lastError: null,
        },
      }),
    ]);
  }

  /**
   * Record a failed execution
   */
  async recordFailure(templateId: string, error: string): Promise<void> {
    const template = await this.prisma.recurringInvoiceTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) return;

    const newFailures = template.consecutiveFailures + 1;
    const shouldSuspend = newFailures >= 3;

    const nextRunDate = this.calculateNextRunDate({
      interval: template.interval,
      anchorDay: template.anchorDay ?? undefined,
      dayOfWeek: template.dayOfWeek ?? undefined,
      startDate: template.startDate,
    });

    await this.prisma.$transaction([
      this.prisma.recurringInvoiceHistory.create({
        data: {
          templateId,
          status: 'FAILED',
          error,
          runDate: new Date(),
        },
      }),
      this.prisma.recurringInvoiceTemplate.update({
        where: { id: templateId },
        data: {
          lastRunDate: new Date(),
          nextRunDate: shouldSuspend ? template.nextRunDate : nextRunDate,
          consecutiveFailures: newFailures,
          lastError: error,
          status: shouldSuspend ? 'SUSPENDED_ERROR' : 'ACTIVE',
        },
      }),
    ]);

    if (shouldSuspend) {
      this.logger.warn(
        `Template ${templateId} suspended after ${newFailures} consecutive failures`,
      );
    }
  }

  /**
   * Calculate the next run date based on interval settings.
   * Always returns a future date.
   */
  calculateNextRunDate(config: {
    interval: string;
    anchorDay?: number | null;
    dayOfWeek?: number | null;
    startDate: Date;
  }): Date {
    const now = new Date();
    let next = new Date(Math.max(now.getTime(), config.startDate.getTime()));

    switch (config.interval) {
      case 'DAILY': {
        // Next day at 01:00 UTC
        next.setUTCDate(next.getUTCDate() + 1);
        next.setUTCHours(1, 0, 0, 0);
        break;
      }
      case 'WEEKLY': {
        const targetDay = config.dayOfWeek ?? 1; // Default Monday
        const currentDay = next.getUTCDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil <= 0) daysUntil += 7;
        next.setUTCDate(next.getUTCDate() + daysUntil);
        next.setUTCHours(1, 0, 0, 0);
        break;
      }
      case 'MONTHLY': {
        const targetDay = config.anchorDay ?? 1;
        next.setUTCMonth(next.getUTCMonth() + 1);
        // Handle months with fewer days
        const lastDay = new Date(next.getUTCFullYear(), next.getUTCMonth() + 1, 0).getDate();
        next.setUTCDate(Math.min(targetDay, lastDay));
        next.setUTCHours(1, 0, 0, 0);
        break;
      }
      case 'YEARLY': {
        next.setUTCFullYear(next.getUTCFullYear() + 1);
        if (config.anchorDay) {
          const lastDay = new Date(next.getUTCFullYear(), next.getUTCMonth() + 1, 0).getDate();
          next.setUTCDate(Math.min(config.anchorDay, lastDay));
        }
        next.setUTCHours(1, 0, 0, 0);
        break;
      }
      default:
        next.setUTCDate(next.getUTCDate() + 1);
        next.setUTCHours(1, 0, 0, 0);
    }

    return next;
  }
}
