import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma, ReceivedDTE } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DteImportParserService } from './dte-import-parser.service';
import { ReceivedDteRetryCronService } from './received-dte-retry-cron.service';
import { DteFormat } from '../dto/preview-dte.dto';
import { ImportReceivedDteDto } from '../dto/import-received-dte.dto';

export interface FindAllFilters {
  page?: number;
  limit?: number;
  desde?: string;
  hasta?: string;
  status?: string;
  tipoDte?: string;
  search?: string;
  hasPurchase?: string; // 'true' | 'false'
}

@Injectable()
export class ReceivedDtesService {
  private readonly logger = new Logger(ReceivedDtesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: DteImportParserService,
    private readonly retryCron: ReceivedDteRetryCronService,
  ) {}

  async findAll(tenantId: string, filters: FindAllFilters) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const where: Prisma.ReceivedDTEWhereInput = { tenantId };

    if (filters.status) where.ingestStatus = filters.status;
    if (filters.tipoDte) where.tipoDte = filters.tipoDte;
    if (filters.desde || filters.hasta) {
      where.fhEmision = {};
      if (filters.desde) (where.fhEmision as Prisma.DateTimeFilter).gte = new Date(filters.desde);
      if (filters.hasta) (where.fhEmision as Prisma.DateTimeFilter).lte = new Date(filters.hasta);
    }
    if (filters.search) {
      where.OR = [
        { emisorNIT: { contains: filters.search } },
        { emisorNombre: { contains: filters.search } },
      ];
    }
    if (filters.hasPurchase === 'true') where.purchase = { isNot: null };
    else if (filters.hasPurchase === 'false') where.purchase = { is: null };

    const [data, total] = await Promise.all([
      this.prisma.receivedDTE.findMany({
        where,
        include: { purchase: { select: { id: true, purchaseNumber: true, status: true } } },
        orderBy: { fhEmision: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.receivedDTE.count({ where }),
    ]);

    return { data, total, totalPages: Math.ceil(total / limit), page, limit };
  }

  async findOne(tenantId: string, id: string) {
    const row = await this.prisma.receivedDTE.findFirst({
      where: { id, tenantId },
      include: { purchase: { select: { id: true, purchaseNumber: true, status: true } } },
    });
    if (!row) throw new NotFoundException(`ReceivedDTE ${id} not found`);
    return row;
  }

  async createManual(tenantId: string, userId: string, dto: ImportReceivedDteDto) {
    if (dto.format === DteFormat.XML) {
      throw new BadRequestException({ code: 'FORMAT_NOT_SUPPORTED', message: 'XML no soportado, usa JSON' });
    }

    const parsed = this.parser.parse(dto.content);
    if (!parsed.valid || !parsed.data) {
      throw new BadRequestException({
        code: parsed.errors[0]?.code ?? 'INVALID_JSON',
        errors: parsed.errors,
      });
    }

    const dte = parsed.data;

    // Duplicate check
    const existing = await this.prisma.receivedDTE.findFirst({
      where: { tenantId, codigoGeneracion: dte.codigoGeneracion },
    });
    if (existing) {
      throw new ConflictException({ code: 'DUPLICATE', existingId: existing.id });
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rawHash = require('crypto').createHash('sha256').update(dto.content).digest('hex') as string;

    return this.prisma.receivedDTE.create({
      data: {
        tenantId,
        tipoDte: dte.tipoDte,
        numeroControl: dte.numeroControl,
        codigoGeneracion: dte.codigoGeneracion,
        selloRecepcion: dte.selloRecepcion ?? null,
        fhEmision: new Date(dte.fecEmi),
        emisorNIT: dte.emisor.nit ?? '',
        emisorNombre: dte.emisor.nombre,
        rawPayload: dto.content,
        parsedPayload: JSON.stringify(dte),
        rawPayloadHash: rawHash,
        ingestStatus: 'PENDING',
        ingestSource: 'MANUAL',
        createdBy: userId,
      },
      include: { purchase: { select: { id: true, purchaseNumber: true, status: true } } },
    });
  }

  async retryMhVerify(tenantId: string, id: string): Promise<ReceivedDTE> {
    const row = await this.prisma.receivedDTE.findFirst({
      where: { id, tenantId },
    });
    if (!row) throw new NotFoundException(`ReceivedDTE ${id} not found`);
    if (row.ingestStatus === 'VERIFIED') {
      throw new ConflictException({ code: 'ALREADY_VERIFIED', message: 'DTE is already verified' });
    }

    // Delegate full MH verify logic to the cron service (it handles auth + applyVerifyResult)
    await this.retryCron.retryOne(id);

    // Increment attempt counter and set lastMhVerifyAt timestamp
    return this.prisma.receivedDTE.update({
      where: { id },
      data: {
        mhVerifyAttempts: row.mhVerifyAttempts + 1,
        lastMhVerifyAt: new Date(),
      },
      include: { purchase: { select: { id: true, purchaseNumber: true, status: true } } },
    }) as Promise<ReceivedDTE>;
  }

  async reParse(tenantId: string, id: string): Promise<ReceivedDTE> {
    const row = await this.prisma.receivedDTE.findFirst({
      where: { id, tenantId },
    });
    if (!row) throw new NotFoundException(`ReceivedDTE ${id} not found`);

    const result = this.parser.parse(row.rawPayload);

    if (!result.valid) {
      this.logger.warn(`reParse failed for DTE ${id}: ${result.errors?.[0]?.code}`);
      return this.prisma.receivedDTE.update({
        where: { id },
        data: {
          ingestStatus: 'FAILED',
          ingestErrors: JSON.stringify(result.errors),
        },
        include: { purchase: { select: { id: true, purchaseNumber: true, status: true } } },
      }) as Promise<ReceivedDTE>;
    }

    // Parsed successfully — promote FAILED → PENDING, preserve other statuses
    const newStatus = row.ingestStatus === 'FAILED' ? 'PENDING' : row.ingestStatus;

    return this.prisma.receivedDTE.update({
      where: { id },
      data: {
        parsedPayload: JSON.stringify(result.data),
        ingestErrors: null,
        ingestStatus: newStatus,
      },
      include: { purchase: { select: { id: true, purchaseNumber: true, status: true } } },
    }) as Promise<ReceivedDTE>;
  }
}
