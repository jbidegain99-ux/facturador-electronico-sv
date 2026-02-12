import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { DteService } from '../dte/dte.service';
import { QuoteEmailService } from './quote-email.service';
import { CreateQuoteDto, QuoteLineItemDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QueryQuoteDto } from './dto/query-quote.dto';
import { ClientApprovalDto, ClientRejectionDto } from './dto/approval.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response';
import { Quote, QuoteLineItem } from '@prisma/client';

// ── Types ─────────────────────────────────────────────────────────────

const QUOTE_STATUSES = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  PARTIALLY_APPROVED: 'PARTIALLY_APPROVED',
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

export type QuoteWithLineItems = Quote & {
  lineItems: QuoteLineItem[];
};

export interface QuoteWithClient extends Quote {
  lineItems: QuoteLineItem[];
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

// ── Service ───────────────────────────────────────────────────────────

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private prisma: PrismaService,
    private dteService: DteService,
    private emailService: QuoteEmailService,
    private configService: ConfigService,
  ) {}

  // ── Quote Numbering ─────────────────────────────────────────────────

  async getNextNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `COT-${year}-`;

    const lastQuote = await this.prisma.quote.findFirst({
      where: {
        tenantId,
        quoteNumber: { startsWith: prefix },
        version: 1,
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
  ): Promise<QuoteWithLineItems> {
    const client = await this.prisma.cliente.findFirst({
      where: { id: dto.clienteId, tenantId },
    });
    if (!client) {
      throw new BadRequestException('Cliente no encontrado');
    }

    const quoteNumber = await this.getNextNumber(tenantId);
    const groupId = randomUUID();
    const { subtotal, taxAmount, total } = this.calculateTotals(dto.items);

    this.logger.log(
      `Creating quote ${quoteNumber} for tenant ${tenantId}`,
    );

    // Parse client email from direccion JSON if needed
    const clienteEmail =
      dto.clienteEmail || client.correo || undefined;

    const quote = await this.prisma.quote.create({
      data: {
        tenantId,
        quoteNumber,
        quoteGroupId: groupId,
        version: 1,
        isLatestVersion: true,
        clienteId: dto.clienteId,
        clienteNit: client.numDocumento,
        clienteNombre: client.nombre,
        clienteEmail: clienteEmail,
        clienteDireccion:
          typeof client.direccion === 'string'
            ? client.direccion
            : JSON.stringify(client.direccion),
        clienteTelefono: client.telefono,
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

    // Create line items
    const lineItems = await this.createLineItems(quote.id, dto.items);

    // Log creation
    await this.createStatusHistory(
      quote.id,
      null,
      QUOTE_STATUSES.DRAFT,
      'ADMIN',
      userId,
      'Quote created',
    );

    return { ...quote, lineItems };
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
      where.OR = [
        { quoteNumber: { contains: query.search } },
        { clienteNombre: { contains: query.search } },
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
        include: { lineItems: true },
      }),
      this.prisma.quote.count({ where }),
    ]);

    // Resolve client details
    const clientIds = [...new Set(rawData.map((q) => q.clienteId))];
    const clients =
      clientIds.length > 0
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

    return {
      data,
      total: rawTotal,
      page,
      limit,
      totalPages: Math.ceil(rawTotal / limit),
    };
  }

  async findOne(
    tenantId: string,
    id: string,
  ): Promise<QuoteWithClient> {
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId },
      include: { lineItems: { orderBy: { lineNumber: 'asc' } } },
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
    userId?: string,
  ): Promise<QuoteWithLineItems> {
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

    // Refresh client snapshots if clienteId changed
    let client: {
      numDocumento: string;
      nombre: string;
      correo: string | null;
      telefono: string | null;
      direccion: string;
    } | null = null;
    if (dto.clienteId) {
      client = await this.prisma.cliente.findFirst({
        where: { id: dto.clienteId, tenantId },
        select: {
          numDocumento: true,
          nombre: true,
          correo: true,
          telefono: true,
          direccion: true,
        },
      });
      if (!client) {
        throw new BadRequestException('Cliente no encontrado');
      }
    }

    const data: Record<string, unknown> = {};

    if (dto.clienteId && client) {
      data.clienteId = dto.clienteId;
      data.clienteNit = client.numDocumento;
      data.clienteNombre = client.nombre;
      data.clienteDireccion =
        typeof client.direccion === 'string'
          ? client.direccion
          : JSON.stringify(client.direccion);
      data.clienteTelefono = client.telefono;
      if (!dto.clienteEmail) {
        data.clienteEmail = client.correo;
      }
    }
    if (dto.validUntil) data.validUntil = new Date(dto.validUntil);
    if (dto.terms !== undefined) data.terms = dto.terms;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.clienteEmail !== undefined)
      data.clienteEmail = dto.clienteEmail;
    if (userId) data.updatedBy = userId;

    if (dto.items) {
      const { subtotal, taxAmount, total } = this.calculateTotals(
        dto.items,
      );
      data.items = JSON.stringify(dto.items);
      data.subtotal = subtotal;
      data.taxAmount = taxAmount;
      data.total = total;
    }

    this.logger.log(`Updating quote ${id} for tenant ${tenantId}`);

    const updated = await this.prisma.quote.update({
      where: { id },
      data,
    });

    // Replace line items if provided
    let lineItems: QuoteLineItem[] = [];
    if (dto.items) {
      await this.prisma.quoteLineItem.deleteMany({
        where: { quoteId: id },
      });
      lineItems = await this.createLineItems(id, dto.items);
    } else {
      lineItems = await this.prisma.quoteLineItem.findMany({
        where: { quoteId: id },
        orderBy: { lineNumber: 'asc' },
      });
    }

    return { ...updated, lineItems };
  }

  async remove(
    tenantId: string,
    id: string,
  ): Promise<{ message: string }> {
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

  async send(
    tenantId: string,
    id: string,
    userId?: string,
  ): Promise<QuoteWithLineItems> {
    const quote = await this.ensureQuote(tenantId, id);

    if (quote.status !== QUOTE_STATUSES.DRAFT) {
      throw new BadRequestException(
        'Solo se pueden enviar cotizaciones en estado Borrador',
      );
    }

    // Generate approval token
    const approvalToken = quote.approvalToken || randomUUID();
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      '',
    );
    const approvalUrl = frontendUrl
      ? `${frontendUrl}/approve/${approvalToken}`
      : undefined;

    const updated = await this.prisma.quote.update({
      where: { id },
      data: {
        status: QUOTE_STATUSES.SENT,
        approvalToken,
        approvalUrl,
        sentAt: new Date(),
        updatedBy: userId,
      },
      include: { lineItems: true },
    });

    // Attempt to send email
    if (updated.clienteEmail) {
      const sent = await this.emailService.sendQuoteToClient(updated);
      if (sent) {
        await this.prisma.quote.update({
          where: { id },
          data: { emailSentAt: new Date(), emailDelivered: true },
        });
      }
    }

    await this.createStatusHistory(
      id,
      QUOTE_STATUSES.DRAFT,
      QUOTE_STATUSES.SENT,
      'ADMIN',
      userId,
      'Quote sent to client',
    );

    return updated;
  }

  async approve(
    tenantId: string,
    id: string,
    userId?: string,
  ): Promise<QuoteWithLineItems> {
    const quote = await this.ensureQuote(tenantId, id);

    if (
      quote.status !== QUOTE_STATUSES.SENT &&
      quote.status !== QUOTE_STATUSES.PARTIALLY_APPROVED
    ) {
      throw new BadRequestException(
        'Solo se pueden aprobar cotizaciones en estado Enviada o Parcialmente Aprobada',
      );
    }

    // Mark all line items as approved
    await this.prisma.quoteLineItem.updateMany({
      where: { quoteId: id },
      data: { approvalStatus: 'APPROVED' },
    });

    const updated = await this.prisma.quote.update({
      where: { id },
      data: {
        status: QUOTE_STATUSES.APPROVED,
        approvedAt: new Date(),
        approvedBy: userId || 'admin',
        approvedSubtotal: quote.subtotal,
        approvedTaxAmount: quote.taxAmount,
        approvedTotal: quote.total,
        updatedBy: userId,
      },
      include: { lineItems: true },
    });

    await this.createStatusHistory(
      id,
      quote.status,
      QUOTE_STATUSES.APPROVED,
      'ADMIN',
      userId,
      'Quote approved by admin',
    );

    return updated;
  }

  async reject(
    tenantId: string,
    id: string,
    reason: string,
    userId?: string,
  ): Promise<QuoteWithLineItems> {
    const quote = await this.ensureQuote(tenantId, id);

    if (quote.status !== QUOTE_STATUSES.SENT) {
      throw new BadRequestException(
        'Solo se pueden rechazar cotizaciones en estado Enviada',
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Se requiere un motivo de rechazo');
    }

    const updated = await this.prisma.quote.update({
      where: { id },
      data: {
        status: QUOTE_STATUSES.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: reason.trim(),
        updatedBy: userId,
      },
      include: { lineItems: true },
    });

    await this.createStatusHistory(
      id,
      QUOTE_STATUSES.SENT,
      QUOTE_STATUSES.REJECTED,
      'ADMIN',
      userId,
      `Rejected: ${reason.trim()}`,
    );

    return updated;
  }

  async cancel(
    tenantId: string,
    id: string,
    userId?: string,
  ): Promise<QuoteWithLineItems> {
    const quote = await this.ensureQuote(tenantId, id);

    const terminalStatuses = [
      QUOTE_STATUSES.CONVERTED,
      QUOTE_STATUSES.CANCELLED,
      QUOTE_STATUSES.EXPIRED,
    ];
    if (terminalStatuses.includes(quote.status as typeof terminalStatuses[number])) {
      throw new BadRequestException(
        `No se puede cancelar una cotizacion en estado ${quote.status}`,
      );
    }

    const updated = await this.prisma.quote.update({
      where: { id },
      data: {
        status: QUOTE_STATUSES.CANCELLED,
        updatedBy: userId,
      },
      include: { lineItems: true },
    });

    await this.createStatusHistory(
      id,
      quote.status,
      QUOTE_STATUSES.CANCELLED,
      'ADMIN',
      userId,
      'Quote cancelled',
    );

    return updated;
  }

  // ── Versioning ──────────────────────────────────────────────────────

  async createNewVersion(
    tenantId: string,
    id: string,
    userId: string,
  ): Promise<QuoteWithLineItems> {
    const original = await this.prisma.quote.findFirst({
      where: { id, tenantId },
      include: { lineItems: { orderBy: { lineNumber: 'asc' } } },
    });

    if (!original) {
      throw new NotFoundException('Cotizacion no encontrada');
    }

    if (original.status === QUOTE_STATUSES.CONVERTED) {
      throw new BadRequestException(
        'No se puede crear version de una cotizacion convertida',
      );
    }

    // Mark current as not latest
    await this.prisma.quote.update({
      where: { id },
      data: { isLatestVersion: false },
    });

    // Get next version number
    const groupId = original.quoteGroupId || original.id;
    const latestVersion = await this.prisma.quote.findFirst({
      where: { tenantId, quoteGroupId: groupId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    // Base quote number without version suffix
    const baseNumber = original.quoteNumber.replace(/-v\d+$/, '');
    const newQuoteNumber = `${baseNumber}-v${nextVersion}`;

    const newQuote = await this.prisma.quote.create({
      data: {
        tenantId: original.tenantId,
        quoteNumber: newQuoteNumber,
        quoteGroupId: groupId,
        version: nextVersion,
        isLatestVersion: true,
        previousVersionId: id,
        clienteId: original.clienteId,
        clienteNit: original.clienteNit,
        clienteNombre: original.clienteNombre,
        clienteEmail: original.clienteEmail,
        clienteDireccion: original.clienteDireccion,
        clienteTelefono: original.clienteTelefono,
        validUntil: original.validUntil,
        status: QUOTE_STATUSES.DRAFT,
        subtotal: original.subtotal,
        taxAmount: original.taxAmount,
        total: original.total,
        items: original.items,
        terms: original.terms,
        notes: original.notes,
        createdBy: userId,
      },
    });

    // Copy line items
    const lineItems: QuoteLineItem[] = [];
    for (const item of original.lineItems) {
      const newItem = await this.prisma.quoteLineItem.create({
        data: {
          quoteId: newQuote.id,
          lineNumber: item.lineNumber,
          catalogItemId: item.catalogItemId,
          itemCode: item.itemCode,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          tipoItem: item.tipoItem,
          lineSubtotal: item.lineSubtotal,
          lineTax: item.lineTax,
          lineTotal: item.lineTotal,
          approvalStatus: 'PENDING',
        },
      });
      lineItems.push(newItem);
    }

    await this.createStatusHistory(
      newQuote.id,
      null,
      QUOTE_STATUSES.DRAFT,
      'ADMIN',
      userId,
      `New version (v${nextVersion}) created from ${original.quoteNumber}`,
    );

    this.logger.log(
      `Created version ${nextVersion} of quote group ${groupId}`,
    );

    return { ...newQuote, lineItems };
  }

  async getQuoteVersions(
    tenantId: string,
    groupId: string,
  ): Promise<QuoteWithLineItems[]> {
    const quotes = await this.prisma.quote.findMany({
      where: { tenantId, quoteGroupId: groupId },
      include: { lineItems: { orderBy: { lineNumber: 'asc' } } },
      orderBy: { version: 'desc' },
    });

    if (quotes.length === 0) {
      throw new NotFoundException(
        'No se encontraron versiones de cotizacion',
      );
    }

    return quotes;
  }

  // ── Client Approval Portal ──────────────────────────────────────────

  async getQuoteByToken(token: string): Promise<QuoteWithLineItems> {
    const quote = await this.prisma.quote.findFirst({
      where: { approvalToken: token },
      include: {
        lineItems: { orderBy: { lineNumber: 'asc' } },
      },
    });

    if (!quote) {
      throw new NotFoundException('Cotizacion no encontrada o token invalido');
    }

    return quote;
  }

  async approveByClient(
    token: string,
    dto: ClientApprovalDto,
    clientIp?: string,
  ): Promise<QuoteWithLineItems> {
    const quote = await this.prisma.quote.findFirst({
      where: { approvalToken: token },
      include: { lineItems: true },
    });

    if (!quote) {
      throw new NotFoundException('Cotizacion no encontrada o token invalido');
    }

    if (
      quote.status !== QUOTE_STATUSES.SENT &&
      quote.status !== QUOTE_STATUSES.PENDING_APPROVAL
    ) {
      throw new BadRequestException(
        'Esta cotizacion no puede ser aprobada en su estado actual',
      );
    }

    if (new Date() > quote.validUntil) {
      throw new BadRequestException('Esta cotizacion ha expirado');
    }

    // Handle line-item-level approval if provided
    let hasPartialApproval = false;
    if (dto.lineItems && dto.lineItems.length > 0) {
      for (const lineApproval of dto.lineItems) {
        // Verify the line item belongs to this quote (prevent IDOR)
        const lineItem = await this.prisma.quoteLineItem.findFirst({
          where: { id: lineApproval.id, quoteId: quote.id },
        });
        if (!lineItem) {
          throw new BadRequestException(
            `Linea de cotizacion no encontrada: ${lineApproval.id}`,
          );
        }
        await this.prisma.quoteLineItem.update({
          where: { id: lineApproval.id },
          data: {
            approvalStatus: lineApproval.approvalStatus,
            approvedQuantity: lineApproval.approvedQuantity,
            rejectionReason: lineApproval.rejectionReason,
          },
        });
        if (lineApproval.approvalStatus === 'REJECTED') {
          hasPartialApproval = true;
        }
      }
    } else {
      // Approve all line items
      await this.prisma.quoteLineItem.updateMany({
        where: { quoteId: quote.id },
        data: { approvalStatus: 'APPROVED' },
      });
    }

    const newStatus = hasPartialApproval
      ? QUOTE_STATUSES.PARTIALLY_APPROVED
      : QUOTE_STATUSES.APPROVED;

    const updated = await this.prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: newStatus,
        approvedAt: new Date(),
        approvedBy: dto.approverEmail || dto.approverName,
        clientNotes: dto.comments,
      },
      include: { lineItems: { orderBy: { lineNumber: 'asc' } } },
    });

    // Calculate approved totals
    await this.calculateApprovedTotals(quote.id);

    await this.createStatusHistory(
      quote.id,
      quote.status,
      newStatus,
      'CLIENT',
      dto.approverEmail,
      `Quote ${hasPartialApproval ? 'partially ' : ''}approved by client`,
      undefined,
      clientIp,
    );

    // Notify admin
    await this.emailService.notifyQuoteApproval(updated);

    return updated;
  }

  async rejectByClient(
    token: string,
    dto: ClientRejectionDto,
    clientIp?: string,
  ): Promise<QuoteWithLineItems> {
    const quote = await this.prisma.quote.findFirst({
      where: { approvalToken: token },
      include: { lineItems: true },
    });

    if (!quote) {
      throw new NotFoundException('Cotizacion no encontrada o token invalido');
    }

    if (
      quote.status !== QUOTE_STATUSES.SENT &&
      quote.status !== QUOTE_STATUSES.PENDING_APPROVAL
    ) {
      throw new BadRequestException(
        'Esta cotizacion no puede ser rechazada en su estado actual',
      );
    }

    const updated = await this.prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: QUOTE_STATUSES.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: dto.reason,
        clientNotes: dto.comments,
      },
      include: { lineItems: true },
    });

    await this.createStatusHistory(
      quote.id,
      quote.status,
      QUOTE_STATUSES.REJECTED,
      'CLIENT',
      dto.rejectorEmail,
      `Rejected: ${dto.reason}`,
      undefined,
      clientIp,
    );

    await this.emailService.notifyQuoteRejection(updated);

    return updated;
  }

  // ── Status History ──────────────────────────────────────────────────

  async getStatusHistory(tenantId: string, id: string) {
    // Verify ownership
    await this.ensureQuote(tenantId, id);

    return this.prisma.quoteStatusHistory.findMany({
      where: { quoteId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Convert to Invoice ──────────────────────────────────────────────

  async convertToInvoice(
    tenantId: string,
    id: string,
    userId?: string,
  ): Promise<ConvertResult> {
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId },
      include: { lineItems: { orderBy: { lineNumber: 'asc' } } },
    });

    if (!quote) {
      throw new NotFoundException('Cotizacion no encontrada');
    }

    if (
      quote.status !== QUOTE_STATUSES.APPROVED &&
      quote.status !== QUOTE_STATUSES.PARTIALLY_APPROVED
    ) {
      throw new BadRequestException(
        'Solo se pueden convertir cotizaciones aprobadas',
      );
    }

    if (quote.convertedToInvoiceId) {
      throw new BadRequestException(
        'Esta cotizacion ya fue convertida a factura',
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

    // Use approved line items only (or all if fully approved)
    const itemsToConvert =
      quote.lineItems.length > 0
        ? quote.lineItems.filter(
            (li) => li.approvalStatus === 'APPROVED',
          )
        : [];

    // Fall back to legacy JSON if no line items
    let cuerpoDocumento: Record<string, unknown>[];
    if (itemsToConvert.length > 0) {
      cuerpoDocumento = itemsToConvert.map((item, index) => {
        const qty = item.approvedQuantity
          ? Number(item.approvedQuantity)
          : Number(item.quantity);
        const price = Number(item.unitPrice);
        const disc = Number(item.discount);
        const ventaGravada = qty * price - disc;
        const ivaItem = ventaGravada * 0.13;
        return {
          numItem: index + 1,
          tipoItem: item.tipoItem || 1,
          codigo: item.itemCode || null,
          descripcion: item.description,
          cantidad: qty,
          uniMedida: 59,
          precioUni: price,
          montoDescu: disc,
          ventaNoSuj: 0,
          ventaExenta: 0,
          ventaGravada,
          tributos: null,
          psv: 0,
          noGravado: 0,
          ivaItem,
        };
      });
    } else {
      // Legacy path for old quotes with only JSON items
      const legacyItems: QuoteLineItemDto[] = quote.items
        ? JSON.parse(quote.items as string)
        : [];
      cuerpoDocumento = legacyItems.map((item, index) => {
        const ventaGravada =
          item.quantity * item.unitPrice - item.discount;
        const ivaItem = ventaGravada * 0.13;
        return {
          numItem: index + 1,
          tipoItem: item.tipoItem || 1,
          codigo: item.itemCode || null,
          descripcion: item.description,
          cantidad: item.quantity,
          uniMedida: 59,
          precioUni: item.unitPrice,
          montoDescu: item.discount,
          ventaNoSuj: 0,
          ventaExenta: 0,
          ventaGravada,
          tributos: null,
          psv: 0,
          noGravado: 0,
          ivaItem,
        };
      });
    }

    // Use approved totals if available, otherwise quote totals
    const subtotalVal = quote.approvedSubtotal
      ? Number(quote.approvedSubtotal)
      : Number(quote.subtotal);
    const totalIvaVal = quote.approvedTaxAmount
      ? Number(quote.approvedTaxAmount)
      : Number(quote.taxAmount);
    const totalPagarVal = quote.approvedTotal
      ? Number(quote.approvedTotal)
      : Number(quote.total);
    const totalDescuentos = cuerpoDocumento.reduce(
      (sum, i) => sum + (Number(i.montoDescu) || 0),
      0,
    );

    // Parse client address
    let direccionObj: Record<string, unknown> = {};
    try {
      direccionObj =
        typeof client.direccion === 'string'
          ? JSON.parse(client.direccion)
          : (client.direccion as Record<string, unknown>);
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

    const invoice = await this.dteService.createDte(
      tenantId,
      '01',
      dteData,
    );

    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: {
        status: QUOTE_STATUSES.CONVERTED,
        convertedToInvoiceId: invoice.id,
        convertedAt: new Date(),
        updatedBy: userId,
      },
    });

    await this.createStatusHistory(
      id,
      quote.status,
      QUOTE_STATUSES.CONVERTED,
      'ADMIN',
      userId,
      'Quote converted to invoice',
    );

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

  private async ensureQuote(
    tenantId: string,
    id: string,
  ): Promise<Quote> {
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
        item.quantity * item.unitPrice - (item.discount || 0);
      const rate = (item.taxRate ?? 13) / 100;
      subtotal += lineSubtotal;
      taxAmount += lineSubtotal * rate;
    }

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat((subtotal + taxAmount).toFixed(2)),
    };
  }

  private async createLineItems(
    quoteId: string,
    items: QuoteLineItemDto[],
  ): Promise<QuoteLineItem[]> {
    const created: QuoteLineItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const lineSubtotal =
        item.quantity * item.unitPrice - (item.discount || 0);
      const rate = (item.taxRate ?? 13) / 100;
      const lineTax = lineSubtotal * rate;

      const lineItem = await this.prisma.quoteLineItem.create({
        data: {
          quoteId,
          lineNumber: i + 1,
          catalogItemId: item.catalogItemId || undefined,
          itemCode: item.itemCode,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          taxRate: item.taxRate ?? 13,
          tipoItem: item.tipoItem,
          lineSubtotal: parseFloat(lineSubtotal.toFixed(2)),
          lineTax: parseFloat(lineTax.toFixed(2)),
          lineTotal: parseFloat(
            (lineSubtotal + lineTax).toFixed(2),
          ),
        },
      });
      created.push(lineItem);
    }
    return created;
  }

  private async calculateApprovedTotals(
    quoteId: string,
  ): Promise<void> {
    const approvedItems = await this.prisma.quoteLineItem.findMany({
      where: { quoteId, approvalStatus: 'APPROVED' },
    });

    let approvedSubtotal = 0;
    let approvedTaxAmount = 0;

    for (const item of approvedItems) {
      const qty = item.approvedQuantity
        ? Number(item.approvedQuantity)
        : Number(item.quantity);
      const price = Number(item.unitPrice);
      const disc = Number(item.discount);
      const rate = Number(item.taxRate) / 100;

      const sub = qty * price - disc;
      approvedSubtotal += sub;
      approvedTaxAmount += sub * rate;
    }

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        approvedSubtotal: parseFloat(approvedSubtotal.toFixed(2)),
        approvedTaxAmount: parseFloat(approvedTaxAmount.toFixed(2)),
        approvedTotal: parseFloat(
          (approvedSubtotal + approvedTaxAmount).toFixed(2),
        ),
      },
    });
  }

  private async createStatusHistory(
    quoteId: string,
    fromStatus: string | null,
    toStatus: string,
    actorType: string,
    actorId?: string,
    reason?: string,
    metadata?: Record<string, unknown>,
    actorIp?: string,
  ): Promise<void> {
    await this.prisma.quoteStatusHistory.create({
      data: {
        quoteId,
        fromStatus,
        toStatus,
        actorType,
        actorId,
        reason,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        actorIp,
      },
    });
  }
}
