import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DteService } from '../dte/dte.service';
import { CreateQuoteDto, QuoteLineItemDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QueryQuoteDto } from './dto/query-quote.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response';
import { Quote } from '@prisma/client';

const QUOTE_STATUSES = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CONVERTED: 'CONVERTED',
  CANCELLED: 'CANCELLED',
} as const;

const ALLOWED_SORT_FIELDS: Record<string, string> = {
  quoteNumber: 'quoteNumber',
  issueDate: 'issueDate',
  validUntil: 'validUntil',
  total: 'total',
  status: 'status',
  createdAt: 'createdAt',
};

export interface QuoteWithClient extends Quote {
  client?: {
    id: string;
    nombre: string;
    numDocumento: string;
    nrc: string | null;
    tipoDocumento: string;
    correo: string | null;
    telefono: string | null;
    direccion: string;
  } | null;
}

export interface ConvertResult {
  quote: Quote;
  invoice: {
    id: string;
    numeroControl: string;
    codigoGeneracion: string;
  };
}

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private prisma: PrismaService,
    private dteService: DteService,
  ) {}

  // ── Quote Numbering ─────────────────────────────────────────────────

  async getNextNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `COT-${year}-`;

    const lastQuote = await this.prisma.quote.findFirst({
      where: {
        tenantId,
        quoteNumber: { startsWith: prefix },
      },
      orderBy: { quoteNumber: 'desc' },
      select: { quoteNumber: true },
    });

    let nextSeq = 1;
    if (lastQuote) {
      const match = lastQuote.quoteNumber.match(/-(\d+)$/);
      if (match) {
        nextSeq = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
  }

  // ── CRUD ────────────────────────────────────────────────────────────

  async create(
    tenantId: string,
    userId: string,
    dto: CreateQuoteDto,
  ): Promise<Quote> {
    // Verify client belongs to tenant
    const client = await this.prisma.cliente.findFirst({
      where: { id: dto.clienteId, tenantId },
    });
    if (!client) {
      throw new BadRequestException('Cliente no encontrado');
    }

    const quoteNumber = await this.getNextNumber(tenantId);
    const { subtotal, taxAmount, total } = this.calculateTotals(dto.items);

    this.logger.log(
      `Creating quote ${quoteNumber} for tenant ${tenantId}`,
    );

    return this.prisma.quote.create({
      data: {
        tenantId,
        quoteNumber,
        clienteId: dto.clienteId,
        validUntil: new Date(dto.validUntil),
        status: QUOTE_STATUSES.DRAFT,
        subtotal,
        taxAmount,
        total,
        items: JSON.stringify(dto.items),
        terms: dto.terms,
        notes: dto.notes,
        createdBy: userId,
      },
    });
  }

  async findAll(
    tenantId: string,
    query: QueryQuoteDto,
  ): Promise<PaginatedResponse<QuoteWithClient>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Math.max(1, Number(query.limit) || 20), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      // Search by quoteNumber or client name
      where.OR = [
        { quoteNumber: { contains: query.search } },
      ];
    }

    const sortField =
      ALLOWED_SORT_FIELDS[query.sortBy || ''] || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [rawData, rawTotal] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrder },
      }),
      this.prisma.quote.count({ where }),
    ]);

    // Resolve client names
    const clientIds = [...new Set(rawData.map((q) => q.clienteId))];
    const clients = clientIds.length > 0
      ? await this.prisma.cliente.findMany({
          where: { id: { in: clientIds } },
          select: {
            id: true,
            nombre: true,
            numDocumento: true,
            nrc: true,
            tipoDocumento: true,
            correo: true,
            telefono: true,
            direccion: true,
          },
        })
      : [];
    const clientMap = new Map(clients.map((c) => [c.id, c]));

    const data: QuoteWithClient[] = rawData.map((q) => ({
      ...q,
      client: clientMap.get(q.clienteId) || null,
    }));

    // If searching, also filter by client name in-memory
    // (since we can't do a cross-table contains in a simple where)
    let filteredData = data;
    let filteredTotal = rawTotal;
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredData = data.filter(
        (q) =>
          q.quoteNumber.toLowerCase().includes(searchLower) ||
          (q.client?.nombre || '').toLowerCase().includes(searchLower),
      );
      // For search across relations, we approximate the total
      if (filteredData.length < data.length) {
        filteredTotal = filteredData.length;
      }
    }

    return {
      data: filteredData,
      total: filteredTotal,
      page,
      limit,
      totalPages: Math.ceil(filteredTotal / limit),
    };
  }

  async findOne(tenantId: string, id: string): Promise<QuoteWithClient> {
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId },
    });

    if (!quote) {
      throw new NotFoundException('Cotizacion no encontrada');
    }

    const client = await this.prisma.cliente.findFirst({
      where: { id: quote.clienteId, tenantId },
      select: {
        id: true,
        nombre: true,
        numDocumento: true,
        nrc: true,
        tipoDocumento: true,
        correo: true,
        telefono: true,
        direccion: true,
      },
    });

    return { ...quote, client };
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateQuoteDto,
  ): Promise<Quote> {
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId },
    });

    if (!quote) {
      throw new NotFoundException('Cotizacion no encontrada');
    }

    if (quote.status !== QUOTE_STATUSES.DRAFT) {
      throw new BadRequestException(
        'Solo se pueden editar cotizaciones en estado Borrador',
      );
    }

    if (dto.clienteId) {
      const client = await this.prisma.cliente.findFirst({
        where: { id: dto.clienteId, tenantId },
      });
      if (!client) {
        throw new BadRequestException('Cliente no encontrado');
      }
    }

    const data: Record<string, unknown> = {};

    if (dto.clienteId) data.clienteId = dto.clienteId;
    if (dto.validUntil) data.validUntil = new Date(dto.validUntil);
    if (dto.terms !== undefined) data.terms = dto.terms;
    if (dto.notes !== undefined) data.notes = dto.notes;

    if (dto.items) {
      const { subtotal, taxAmount, total } = this.calculateTotals(dto.items);
      data.items = JSON.stringify(dto.items);
      data.subtotal = subtotal;
      data.taxAmount = taxAmount;
      data.total = total;
    }

    this.logger.log(`Updating quote ${id} for tenant ${tenantId}`);

    return this.prisma.quote.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string): Promise<{ message: string }> {
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId },
    });

    if (!quote) {
      throw new NotFoundException('Cotizacion no encontrada');
    }

    if (quote.status !== QUOTE_STATUSES.DRAFT) {
      throw new BadRequestException(
        'Solo se pueden eliminar cotizaciones en estado Borrador',
      );
    }

    this.logger.log(`Deleting quote ${id} for tenant ${tenantId}`);

    await this.prisma.quote.delete({ where: { id } });

    return { message: 'Cotizacion eliminada correctamente' };
  }

  // ── State Transitions ───────────────────────────────────────────────

  async send(tenantId: string, id: string): Promise<Quote> {
    const quote = await this.ensureQuote(tenantId, id);

    if (quote.status !== QUOTE_STATUSES.DRAFT) {
      throw new BadRequestException(
        'Solo se pueden enviar cotizaciones en estado Borrador',
      );
    }

    return this.prisma.quote.update({
      where: { id },
      data: { status: QUOTE_STATUSES.SENT },
    });
  }

  async approve(tenantId: string, id: string): Promise<Quote> {
    const quote = await this.ensureQuote(tenantId, id);

    if (quote.status !== QUOTE_STATUSES.SENT) {
      throw new BadRequestException(
        'Solo se pueden aprobar cotizaciones en estado Enviada',
      );
    }

    return this.prisma.quote.update({
      where: { id },
      data: { status: QUOTE_STATUSES.APPROVED },
    });
  }

  async reject(
    tenantId: string,
    id: string,
    reason: string,
  ): Promise<Quote> {
    const quote = await this.ensureQuote(tenantId, id);

    if (quote.status !== QUOTE_STATUSES.SENT) {
      throw new BadRequestException(
        'Solo se pueden rechazar cotizaciones en estado Enviada',
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException(
        'Se requiere un motivo de rechazo',
      );
    }

    return this.prisma.quote.update({
      where: { id },
      data: {
        status: QUOTE_STATUSES.REJECTED,
        rejectionReason: reason.trim(),
      },
    });
  }

  async cancel(tenantId: string, id: string): Promise<Quote> {
    const quote = await this.ensureQuote(tenantId, id);

    if (quote.status === QUOTE_STATUSES.CONVERTED) {
      throw new BadRequestException(
        'No se puede cancelar una cotizacion ya convertida',
      );
    }

    return this.prisma.quote.update({
      where: { id },
      data: { status: QUOTE_STATUSES.CANCELLED },
    });
  }

  // ── Convert to Invoice ──────────────────────────────────────────────

  async convertToInvoice(
    tenantId: string,
    id: string,
  ): Promise<ConvertResult> {
    const quote = await this.ensureQuote(tenantId, id);

    if (quote.status !== QUOTE_STATUSES.APPROVED) {
      throw new BadRequestException(
        'Solo se pueden convertir cotizaciones en estado Aprobada',
      );
    }

    // Get client data
    const client = await this.prisma.cliente.findFirst({
      where: { id: quote.clienteId, tenantId },
    });

    if (!client) {
      throw new BadRequestException(
        'El cliente de esta cotizacion ya no existe',
      );
    }

    // Parse items
    const quoteItems: QuoteLineItemDto[] = JSON.parse(
      quote.items as string,
    );

    // Build DTE data structure (same as invoice wizard)
    const cuerpoDocumento = quoteItems.map((item, index) => {
      const ventaGravada = item.cantidad * item.precioUnitario - item.descuento;
      const ivaItem = ventaGravada * 0.13;
      return {
        numItem: index + 1,
        tipoItem: item.tipoItem || 1,
        codigo: item.codigo || null,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        uniMedida: 59,
        precioUni: item.precioUnitario,
        montoDescu: item.descuento,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada,
        tributos: null,
        psv: 0,
        noGravado: 0,
        ivaItem,
      };
    });

    const subtotalVal = Number(quote.subtotal);
    const totalIvaVal = Number(quote.taxAmount);
    const totalPagarVal = Number(quote.total);
    const totalDescuentos = quoteItems.reduce(
      (sum, i) => sum + (i.descuento || 0),
      0,
    );

    // Parse client address
    let direccionObj: Record<string, unknown> = {};
    try {
      direccionObj =
        typeof client.direccion === 'string'
          ? JSON.parse(client.direccion)
          : client.direccion;
    } catch {
      direccionObj = { complemento: client.direccion };
    }

    const dteData: Record<string, unknown> = {
      identificacion: {
        version: 1,
        ambiente: '00',
        tipoDte: '01',
        numeroControl: null,
        codigoGeneracion: null,
        tipoModelo: 1,
        tipoOperacion: 1,
        tipoContingencia: null,
        fecEmi: new Date().toISOString().split('T')[0],
        horEmi: new Date().toTimeString().split(' ')[0],
        tipoMoneda: 'USD',
      },
      receptor: {
        tipoDocumento: client.tipoDocumento || '13',
        numDocumento: client.numDocumento || null,
        nrc: client.nrc || null,
        nombre: client.nombre,
        codActividad: null,
        descActividad: null,
        direccion: direccionObj,
        telefono: client.telefono || null,
        correo: client.correo || null,
      },
      cuerpoDocumento,
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada: subtotalVal,
        subTotalVentas: subtotalVal,
        descuNoSuj: 0,
        descuExenta: 0,
        descuGravada: totalDescuentos,
        porcentajeDescuento: 0,
        totalDescu: totalDescuentos,
        tributos: null,
        subTotal: subtotalVal,
        ivaRete1: 0,
        reteRenta: 0,
        montoTotalOperacion: totalPagarVal,
        totalNoGravado: 0,
        totalPagar: totalPagarVal,
        totalLetras: '',
        totalIva: totalIvaVal,
        saldoFavor: 0,
        condicionOperacion: 1,
        pagos: null,
        numPagoElectronico: null,
      },
    };

    this.logger.log(
      `Converting quote ${quote.quoteNumber} to invoice for tenant ${tenantId}`,
    );

    // Create the invoice using the DTE service
    const invoice = await this.dteService.createDte(tenantId, '01', dteData);

    // Update the quote status
    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: {
        status: QUOTE_STATUSES.CONVERTED,
        convertedToInvoiceId: invoice.id,
        convertedAt: new Date(),
      },
    });

    return {
      quote: updatedQuote,
      invoice: {
        id: invoice.id,
        numeroControl: invoice.numeroControl,
        codigoGeneracion: invoice.codigoGeneracion,
      },
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private async ensureQuote(tenantId: string, id: string): Promise<Quote> {
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId },
    });

    if (!quote) {
      throw new NotFoundException('Cotizacion no encontrada');
    }

    return quote;
  }

  private calculateTotals(items: QuoteLineItemDto[]): {
    subtotal: number;
    taxAmount: number;
    total: number;
  } {
    let subtotal = 0;
    let taxAmount = 0;

    for (const item of items) {
      const lineSubtotal =
        item.cantidad * item.precioUnitario - (item.descuento || 0);
      subtotal += lineSubtotal;
      taxAmount += lineSubtotal * 0.13;
    }

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat((subtotal + taxAmount).toFixed(2)),
    };
  }
}
