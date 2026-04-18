import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma, ReceivedDTE } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DteImportParserService } from './dte-import-parser.service';
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

  // retryMhVerify + reParse stubs for Task 3
  async retryMhVerify(_tenantId: string, _id: string): Promise<ReceivedDTE> {
    throw new Error('not implemented — Task 3');
  }

  async reParse(_tenantId: string, _id: string): Promise<ReceivedDTE> {
    throw new Error('not implemented — Task 3');
  }
}
