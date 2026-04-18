import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  NotImplementedException,
  PreconditionFailedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Purchase, PurchaseLineItem, Cliente, JournalEntry, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountingAutomationService } from '../../accounting/accounting-automation.service';
import { AccountingService } from '../../accounting/accounting.service';
import { PurchaseReceptionService } from './purchase-reception.service';
import type { ParsedDTE } from '../../dte/services/dte-import-parser.service';
import type { CreatePurchaseDto } from '../dto/create-purchase.dto';
import type { UpdatePurchaseDto } from '../dto/update-purchase.dto';
import type { PostPurchaseDto } from '../dto/post-purchase.dto';
import type { PayPurchaseDto } from '../dto/pay-purchase.dto';
import type { AnularPurchaseDto } from '../dto/anular-purchase.dto';
import type { ReceivePurchaseDto } from '../dto/receive-purchase.dto';
import type { PurchaseLineDto } from '../dto/purchase-line.dto';

interface ParsedLineItem {
  numItem: number;
  tipoItem?: number;
  cantidad: string | number;
  codigo?: string;
  uniMedida?: number;
  descripcion: string;
  precioUni: string | number;
  ventaGravada?: string;
  ventaExenta?: string;
  ventaNoSuj?: string;
  ivaItem?: string;
  montoDescu?: string;
}

// =========================================================================
// Public types
// =========================================================================

export interface CreateFromDteOptions {
  createdBy: string;
  requireVerified?: boolean;
}

export type PurchaseWithRelations = Purchase & {
  lineItems: PurchaseLineItem[];
  supplier: Cliente;
  journalEntry: JournalEntry | null;
};

export interface FindAllPurchasesOptions {
  page?: number;
  limit?: number;
  proveedorId?: string;
  estado?: string;
  desde?: string;
  hasta?: string;
}

export interface FindAllPurchasesResult {
  data: Purchase[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

// =========================================================================
// Constants
// =========================================================================

const SUPPORTED_TIPOS: ReadonlyArray<string> = ['01', '03', '14'];

const TIPO_TO_DOC_TYPE: Record<string, 'CCFE' | 'FCFE' | 'FSEE'> = {
  '03': 'CCFE',
  '01': 'FCFE',
  '14': 'FSEE',
};

const FAILED_STATUSES: ReadonlyArray<string> = ['FAILED_PARSE', 'FAILED_MH_NOT_FOUND'];
const NON_VERIFIED_STATUSES: ReadonlyArray<string> = [
  'STRUCTURAL_OK',
  'VERIFY_TIMEOUT_RETRY',
  'VERIFY_5XX_RETRY',
  'VERIFY_AUTH_RETRY',
];

// =========================================================================
// Service
// =========================================================================

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingAutomation: AccountingAutomationService,
    private readonly accountingService: AccountingService,
    private readonly purchaseReceptionService: PurchaseReceptionService,
  ) {}

  async createFromReceivedDte(
    tenantId: string,
    receivedDteId: string,
    options: CreateFromDteOptions,
  ): Promise<PurchaseWithRelations> {
    // 1. Load ReceivedDTE
    const receivedDte = await this.prisma.receivedDTE.findFirst({
      where: { id: receivedDteId, tenantId },
    });
    if (!receivedDte) {
      throw new NotFoundException(`ReceivedDTE ${receivedDteId} not found for tenant ${tenantId}`);
    }

    // 2. Validate ingestStatus
    if (FAILED_STATUSES.includes(receivedDte.ingestStatus)) {
      throw new PreconditionFailedException(
        `Cannot create Purchase from ReceivedDTE ${receivedDteId}: ingestStatus=${receivedDte.ingestStatus}`,
      );
    }
    if (options.requireVerified && receivedDte.ingestStatus !== 'VERIFIED') {
      throw new PreconditionFailedException(
        `Strict mode: ReceivedDTE ${receivedDteId} has ingestStatus=${receivedDte.ingestStatus}, need VERIFIED`,
      );
    }
    if (NON_VERIFIED_STATUSES.includes(receivedDte.ingestStatus)) {
      this.logger.warn(
        `Creating Purchase from ReceivedDTE ${receivedDteId} with non-VERIFIED status=${receivedDte.ingestStatus} ` +
        `(requireVerified=false). Asiento will proceed; flag for manual review.`,
      );
    }

    // 3. Validate tipoDte
    if (!SUPPORTED_TIPOS.includes(receivedDte.tipoDte)) {
      throw new NotImplementedException(
        `tipoDte ${receivedDte.tipoDte} no mapeable a Purchase en Fase 1.4b — ` +
        `soportados: ${SUPPORTED_TIPOS.join(', ')}`,
      );
    }

    // 4. Idempotency — return existing Purchase if already created for this ReceivedDTE
    const existingPurchase = await this.prisma.purchase.findUnique({
      where: { receivedDteId },
      include: { lineItems: true, supplier: true, journalEntry: true },
    });
    if (existingPurchase) {
      this.logger.debug(
        `Purchase already exists for ReceivedDTE ${receivedDteId}: ${existingPurchase.id} — returning existing`,
      );
      return existingPurchase as PurchaseWithRelations;
    }

    // 5. Parse the stored parsedPayload back to ParsedDTE
    if (!receivedDte.parsedPayload) {
      throw new PreconditionFailedException(
        `ReceivedDTE ${receivedDteId} has no parsedPayload — cannot create Purchase`,
      );
    }
    const parsed = JSON.parse(receivedDte.parsedPayload) as ParsedDTE;

    // 6. Supplier upsert
    const supplier = await this.upsertSupplier(tenantId, parsed);

    // 7. Map line items (catalog match per line)
    const lineItemsData = await Promise.all(
      ((parsed.cuerpoDocumento ?? []) as ParsedLineItem[]).map(async (line) => {
        const mapped = await this.mapLine(line, tenantId);
        return { ...mapped, tenantId };
      }),
    );

    // 8. Compute Purchase header
    const documentType = TIPO_TO_DOC_TYPE[parsed.tipoDte];
    const purchaseNumber = `PUR-${tenantId.slice(0, 6)}-${Date.now()}`;
    const purchaseDate = new Date(`${parsed.fecEmi}T${parsed.horEmi}`);
    const resumen = (parsed.resumen ?? {}) as Record<string, string | undefined>;

    const subtotal = this.num(resumen.subTotalVentas ?? resumen.totalGravada ?? '0');
    const ivaAmount = this.num(resumen.totalIva ?? '0');
    const retentionAmount = this.num(resumen.ivaRete1 ?? '0');
    const totalAmount = this.num(resumen.totalPagar ?? '0');

    // 9. Create Purchase + lines atomically
    const purchase = await this.prisma.purchase.create({
      data: {
        tenantId,
        purchaseNumber,
        supplierId: supplier.id,
        receivedDteId,
        documentType,
        documentNumber: parsed.numeroControl,
        purchaseDate,
        subtotal: subtotal.toFixed(2),
        ivaAmount: ivaAmount.toFixed(2),
        otherTaxes: '0',
        discountAmount: '0',
        retentionAmount: retentionAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        status: 'DRAFT',
        createdBy: options.createdBy,
        lineItems: { create: lineItemsData },
      },
      include: { lineItems: true, supplier: true, journalEntry: true },
    });

    // 10. Generate asiento (non-blocking)
    try {
      await this.accountingAutomation.generateFromPurchase(
        purchase.id,
        tenantId,
        'ON_PURCHASE_CREATED',
      );
    } catch (err) {
      this.logger.error(
        `Failed to generate asiento for Purchase ${purchase.id}: ${
          err instanceof Error ? err.message : 'unknown'
        }. Purchase created in DRAFT, asiento can be generated manually.`,
      );
    }

    return purchase as PurchaseWithRelations;
  }

  // =========================================================================
  // Manual CRUD methods
  // =========================================================================

  async createManual(
    tenantId: string,
    userId: string,
    dto: CreatePurchaseDto,
  ): Promise<PurchaseWithRelations> {
    // Validate supplier belongs to tenant and is a supplier
    const proveedor = await this.prisma.cliente.findFirst({
      where: { id: dto.proveedorId, tenantId, isSupplier: true },
    });
    if (!proveedor) {
      throw new NotFoundException(`Proveedor ${dto.proveedorId} not found for tenant ${tenantId}`);
    }

    // Compute totals from line items
    const { subtotal, iva, ivaRetenido, isrRetenido, total } = this.computeTotals(
      dto.lineas,
      proveedor,
      dto.ivaRetenidoOverride,
      dto.isrRetenidoPct,
    );

    // Generate purchase number
    const purchaseNumber = this.generatePurchaseNumber(tenantId);

    // Map line items to schema fields
    const lineItemsData = dto.lineas.map((l, i) => this.mapManualLine(l, i + 1, tenantId));

    // Create purchase
    const purchase = await this.prisma.purchase.create({
      data: {
        tenantId,
        purchaseNumber,
        supplierId: dto.proveedorId,
        documentType: dto.tipoDoc,
        documentNumber: dto.numDocumentoProveedor,
        purchaseDate: new Date(dto.fechaDoc),
        fechaContable: new Date(dto.fechaContable),
        status: dto.estadoInicial,
        subtotal: subtotal.toFixed(2),
        ivaAmount: iva.toFixed(2),
        ivaRetenidoAmount: ivaRetenido.toFixed(2),
        isrRetenidoAmount: isrRetenido.toFixed(2),
        retentionAmount: (ivaRetenido + isrRetenido).toFixed(2),
        otherTaxes: '0',
        discountAmount: '0',
        totalAmount: total.toFixed(2),
        outstandingBalance: total.toFixed(2),
        paymentMethod: dto.formaPago ?? null,
        paymentAccountId: dto.cuentaPagoId ?? null,
        paidDate: dto.fechaPago ? new Date(dto.fechaPago) : null,
        dueDate: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
        createdBy: userId,
        lineItems: { create: lineItemsData },
      },
      include: { lineItems: true, supplier: true, journalEntry: true },
    });

    // If initial status is POSTED, generate journal entry
    if (dto.estadoInicial === 'POSTED') {
      try {
        await this.accountingAutomation.generateFromPurchase(purchase.id, tenantId, 'MANUAL');
      } catch (err) {
        // Revert to DRAFT on failure
        await this.prisma.purchase.update({
          where: { id: purchase.id },
          data: { status: 'DRAFT' },
        });
        this.logger.warn(
          `Failed to generate asiento for Purchase ${purchase.id}: ${err instanceof Error ? err.message : 'unknown'}. Reverted to DRAFT.`,
        );
        throw new PreconditionFailedException({
          code: 'MAPPING_MISSING',
          detalle: err instanceof Error ? err.message : 'unknown',
          purchaseId: purchase.id,
        });
      }
    }

    return this.findOne(tenantId, purchase.id);
  }

  async findAll(
    tenantId: string,
    options: FindAllPurchasesOptions,
  ): Promise<FindAllPurchasesResult> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));

    const where: Prisma.PurchaseWhereInput = { tenantId };
    if (options.proveedorId) where.supplierId = options.proveedorId;
    if (options.estado) where.status = options.estado;
    if (options.desde || options.hasta) {
      where.purchaseDate = {};
      if (options.desde) (where.purchaseDate as Prisma.DateTimeFilter).gte = new Date(options.desde);
      if (options.hasta) (where.purchaseDate as Prisma.DateTimeFilter).lte = new Date(options.hasta);
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({
        where,
        include: { supplier: true },
        orderBy: { purchaseDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return {
      data: data as Purchase[],
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    };
  }

  async findOne(tenantId: string, id: string): Promise<PurchaseWithRelations> {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, tenantId },
      include: { lineItems: true, supplier: true, journalEntry: true },
    });
    if (!purchase) {
      throw new NotFoundException(`Purchase ${id} not found for tenant ${tenantId}`);
    }
    return purchase as PurchaseWithRelations;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdatePurchaseDto,
  ): Promise<PurchaseWithRelations> {
    const existing = await this.findOne(tenantId, id);
    if (existing.status !== 'DRAFT') {
      throw new PreconditionFailedException({
        code: 'STATE_IMMUTABLE',
        status: existing.status,
        message: `Purchase ${id} is in status ${existing.status} and cannot be updated`,
      });
    }

    // Build header update data (only provided fields)
    const headerData: Prisma.PurchaseUpdateInput = {};
    if (dto.tipoDoc !== undefined) headerData.documentType = dto.tipoDoc;
    if (dto.numDocumentoProveedor !== undefined) headerData.documentNumber = dto.numDocumentoProveedor;
    if (dto.fechaDoc !== undefined) headerData.purchaseDate = new Date(dto.fechaDoc);
    if (dto.fechaContable !== undefined) headerData.fechaContable = new Date(dto.fechaContable);
    if (dto.formaPago !== undefined) headerData.paymentMethod = dto.formaPago;
    if (dto.cuentaPagoId !== undefined) {
      headerData.paymentAccount = dto.cuentaPagoId
        ? { connect: { id: dto.cuentaPagoId } }
        : { disconnect: true };
    }
    if (dto.fechaPago !== undefined) headerData.paidDate = new Date(dto.fechaPago);
    if (dto.fechaVencimiento !== undefined) headerData.dueDate = new Date(dto.fechaVencimiento);

    // Recompute totals if lines provided
    if (dto.lineas !== undefined && dto.lineas.length >= 0) {
      const supplier = existing.supplier;
      const { subtotal, iva, ivaRetenido, isrRetenido, total } = this.computeTotals(
        dto.lineas,
        supplier,
        dto.ivaRetenidoOverride,
        dto.isrRetenidoPct,
      );
      headerData.subtotal = subtotal.toFixed(2);
      headerData.ivaAmount = iva.toFixed(2);
      headerData.ivaRetenidoAmount = ivaRetenido.toFixed(2);
      headerData.isrRetenidoAmount = isrRetenido.toFixed(2);
      headerData.retentionAmount = (ivaRetenido + isrRetenido).toFixed(2);
      headerData.totalAmount = total.toFixed(2);
      headerData.outstandingBalance = total.toFixed(2);
    }

    // Delete existing line items and recreate
    await this.prisma.$transaction([
      this.prisma.purchaseLineItem.deleteMany({ where: { purchaseId: id } }),
      this.prisma.purchase.update({
        where: { id },
        data: {
          ...headerData,
          ...(dto.lineas !== undefined && {
            lineItems: {
              create: dto.lineas.map((l, i) => this.mapManualLine(l, i + 1, tenantId)),
            },
          }),
        },
      }),
    ]);

    return this.findOne(tenantId, id);
  }

  async softDelete(tenantId: string, id: string): Promise<void> {
    const existing = await this.findOne(tenantId, id);
    if (existing.status !== 'DRAFT') {
      throw new PreconditionFailedException({
        code: 'STATE_IMMUTABLE',
        status: existing.status,
        message: `Purchase ${id} is in status ${existing.status} and cannot be deleted`,
      });
    }

    await this.prisma.$transaction([
      this.prisma.purchaseLineItem.deleteMany({ where: { purchaseId: id } }),
      this.prisma.purchase.delete({ where: { id } }),
    ]);
  }

  // =========================================================================
  // State transition methods (Task 5)
  // =========================================================================

  async postDraft(
    tenantId: string,
    userId: string,
    id: string,
    dto: PostPurchaseDto,
  ): Promise<PurchaseWithRelations> {
    const purchase = await this.findOne(tenantId, id);
    if (purchase.status !== 'DRAFT') {
      throw new ConflictException({
        code: 'STATE_IMMUTABLE',
        status: purchase.status,
        message: `Purchase ${id} is in status ${purchase.status} — only DRAFT can be posted`,
      });
    }

    // Update to POSTED with payment metadata
    await this.prisma.purchase.update({
      where: { id },
      data: {
        status: 'POSTED',
        paymentMethod: dto.formaPago ?? null,
        paymentAccountId: dto.cuentaPagoId ?? null,
        paidDate: dto.fechaPago ? new Date(dto.fechaPago) : null,
        dueDate: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
      },
    });

    // Generate asiento; rollback to DRAFT if it fails
    try {
      await this.accountingAutomation.generateFromPurchase(id, tenantId, 'MANUAL');
    } catch (err) {
      await this.prisma.purchase.update({ where: { id }, data: { status: 'DRAFT' } });
      throw new PreconditionFailedException({
        code: 'MAPPING_MISSING',
        detalle: err instanceof Error ? err.message : 'unknown',
        purchaseId: id,
      });
    }

    // If contado → pay immediately using already-known totalAmount
    if (dto.formaPago === 'contado' && dto.cuentaPagoId) {
      await this.pay(tenantId, userId, id, {
        fechaPago: dto.fechaPago ?? new Date().toISOString().substring(0, 10),
        cuentaSalidaId: dto.cuentaPagoId,
        monto: Number(purchase.totalAmount),
      });
    }

    return this.findOne(tenantId, id);
  }

  async pay(
    tenantId: string,
    userId: string,
    id: string,
    dto: PayPurchaseDto,
  ): Promise<PurchaseWithRelations> {
    const purchase = await this.findOne(tenantId, id);
    if (purchase.status !== 'POSTED') {
      throw new ConflictException({
        code: 'STATE_IMMUTABLE',
        status: purchase.status,
        message: `Purchase ${id} must be POSTED to register a payment (current: ${purchase.status})`,
      });
    }

    const outstanding = Number(purchase.outstandingBalance);
    if (dto.monto > outstanding + 0.001) {
      throw new UnprocessableEntityException({
        code: 'PAGO_EXCEDE_SALDO',
        monto: dto.monto,
        saldo: outstanding,
        message: `Payment amount ${dto.monto} exceeds outstanding balance ${outstanding}`,
      });
    }

    const supplier = purchase.supplier as Cliente & { cuentaCxPDefaultId?: string | null };
    const cuentaCxPId = (supplier as Record<string, unknown>).cuentaCxPDefaultId as string | null | undefined;
    if (!cuentaCxPId) {
      throw new PreconditionFailedException({
        code: 'MAPPING_MISSING',
        detalle: 'Proveedor sin cuenta CxP default',
      });
    }

    // Create payment journal entry (DRAFT) then post it
    const je = await this.accountingService.createJournalEntry(tenantId, {
      entryDate: dto.fechaPago,
      description: `Pago compra ${purchase.purchaseNumber}`,
      entryType: 'MANUAL',
      sourceType: 'PURCHASE_PAYMENT',
      sourceDocumentId: id,
      lines: [
        { accountId: cuentaCxPId, description: 'Cuenta por pagar proveedor', debit: dto.monto, credit: 0 },
        { accountId: dto.cuentaSalidaId, description: 'Cuenta de salida / banco', debit: 0, credit: dto.monto },
      ],
    });
    await this.accountingService.postJournalEntry(tenantId, je.id, userId);

    // Update balances
    const newBalance = Math.max(0, outstanding - dto.monto);
    const newStatus = newBalance <= 0.001 ? 'PAID' : 'POSTED';
    await this.prisma.purchase.update({
      where: { id },
      data: {
        outstandingBalance: newBalance.toFixed(2),
        status: newStatus,
        paidDate: newStatus === 'PAID' ? new Date(dto.fechaPago) : undefined,
      },
    });

    return this.findOne(tenantId, id);
  }

  async anular(
    tenantId: string,
    userId: string,
    id: string,
    dto: AnularPurchaseDto,
  ): Promise<PurchaseWithRelations> {
    const purchase = await this.findOne(tenantId, id);
    const allowedStatuses = ['POSTED', 'PAID'];
    if (!allowedStatuses.includes(purchase.status)) {
      throw new ConflictException({
        code: 'STATE_IMMUTABLE',
        status: purchase.status,
        message: `Purchase ${id} must be POSTED or PAID to be anulada (current: ${purchase.status})`,
      });
    }

    // Check if any inventory has been consumed by a DTE sale
    const lineIds = (purchase.lineItems as PurchaseLineItem[]).map((l) => l.id);
    if (lineIds.length > 0) {
      const consumedMovements = await this.prisma.inventoryMovement.findMany({
        where: {
          tenantId,
          sourceType: 'DTE',
          purchaseLineItemId: { in: lineIds },
        },
        select: { id: true, sourceId: true },
      });
      if (consumedMovements.length > 0) {
        const dteIds = [...new Set(consumedMovements.map((m) => m.sourceId))];
        throw new PreconditionFailedException({
          code: 'KARDEX_CONSUMED',
          dteIds,
          message: `Purchase ${id} has inventory consumed by DTEs: ${dteIds.join(', ')}`,
        });
      }
    }

    // Transaction: delete inventory movements, void journal entry, update purchase
    await this.prisma.$transaction(async (tx) => {
      // Delete inventory movements for this purchase's lines
      if (lineIds.length > 0) {
        await tx.inventoryMovement.deleteMany({
          where: { tenantId, purchaseLineItemId: { in: lineIds } },
        });
      }

      // Void journal entry if one exists
      if (purchase.journalEntryId) {
        await this.accountingService.voidJournalEntry(
          tenantId,
          purchase.journalEntryId,
          userId,
          dto.motivo,
        );
      }

      // Update purchase to ANULADA
      await tx.purchase.update({
        where: { id },
        data: {
          status: 'ANULADA',
          cancelReason: dto.motivo,
          cancelledAt: new Date(),
          cancelledBy: userId,
        },
      });
    });

    return this.findOne(tenantId, id);
  }

  async receiveLate(
    tenantId: string,
    userId: string,
    id: string,
    dto: ReceivePurchaseDto,
  ): Promise<PurchaseWithRelations> {
    const purchase = await this.findOne(tenantId, id);
    const allowedStatuses = ['POSTED', 'PAID'];
    if (!allowedStatuses.includes(purchase.status)) {
      throw new ConflictException({
        code: 'STATE_IMMUTABLE',
        status: purchase.status,
        message: `Purchase ${id} must be POSTED or PAID to receive late (current: ${purchase.status})`,
      });
    }

    // Check if inventory already received (any PURCHASE-type movements for this purchase's lines)
    const lineIds = (purchase.lineItems as PurchaseLineItem[]).map((l) => l.id);
    const existingMovements = await this.prisma.inventoryMovement.findMany({
      where: {
        tenantId,
        sourceType: 'PURCHASE',
        purchaseLineItemId: { in: lineIds.length > 0 ? lineIds : ['__none__'] },
      },
      select: { id: true },
      take: 1,
    });
    if (existingMovements.length > 0) {
      throw new ConflictException({
        code: 'ALREADY_RECEIVED',
        message: `Purchase ${id} has already been received into inventory`,
      });
    }

    // Delegate to reception service
    await this.purchaseReceptionService.receive(tenantId, id, {
      receivedBy: userId,
      receiptDate: new Date(dto.fechaRecepcion),
    });

    return this.findOne(tenantId, id);
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  private async upsertSupplier(tenantId: string, parsed: ParsedDTE): Promise<Cliente> {
    // Extract doc
    let tipoDocumento: string;
    let numDocumento: string;
    const emisor = parsed.emisor;

    if (emisor.nit) {
      tipoDocumento = '36'; // NIT per CAT-022
      numDocumento = emisor.nit;
    } else if (emisor.tipoDocumento && emisor.numDocumento) {
      tipoDocumento = String(emisor.tipoDocumento);
      numDocumento = String(emisor.numDocumento);
    } else {
      throw new PreconditionFailedException(
        `Cannot extract supplier identification from ReceivedDTE — emisor missing nit and numDocumento`,
      );
    }

    const existing = await this.prisma.cliente.findUnique({
      where: { tenantId_numDocumento: { tenantId, numDocumento } },
    });

    if (existing) {
      if (!existing.isSupplier) {
        return this.prisma.cliente.update({
          where: { id: existing.id },
          data: { isSupplier: true },
        });
      }
      return existing;
    }

    // New Cliente from DTE emisor data
    const direccion =
      typeof emisor.direccion === 'string'
        ? emisor.direccion
        : emisor.direccion
          ? JSON.stringify(emisor.direccion)
          : '{}';

    return this.prisma.cliente.create({
      data: {
        tenantId,
        tipoDocumento,
        numDocumento,
        nombre: emisor.nombre,
        nrc: (emisor as { nrc?: string }).nrc ?? null,
        correo: (emisor as { correo?: string }).correo ?? null,
        telefono: (emisor as { telefono?: string }).telefono ?? null,
        direccion,
        isCustomer: false,
        isSupplier: true,
      },
    });
  }

  private async mapLine(
    line: ParsedLineItem,
    tenantId: string,
  ): Promise<{
    lineNumber: number;
    catalogItemId: string | null;
    description: string;
    quantity: string;
    unitPrice: string;
    discountAmount: string;
    taxCode: string;
    taxAmount: string;
    lineTotal: string;
    unitCostPosted: string;
    qtyExpected: string;
    qtyReceived: string;
    receiptStatus: string;
  }> {
    // Catalog match by exact code (null if no match or no codigo)
    let catalogItemId: string | null = null;
    if (line.codigo) {
      const item = await this.prisma.catalogItem.findUnique({
        where: { tenantId_code: { tenantId, code: line.codigo } },
      });
      catalogItemId = item?.id ?? null;
    }

    // Tax code
    const ventaGravada = this.num(line.ventaGravada ?? '0');
    const ventaExenta = this.num(line.ventaExenta ?? '0');
    const ventaNoSuj = this.num(line.ventaNoSuj ?? '0');
    let taxCode = '20'; // IVA 13% default
    if (ventaGravada <= 0 && ventaExenta > 0) taxCode = '10';
    else if (ventaGravada <= 0 && ventaNoSuj > 0) taxCode = '30';

    const ivaItem = this.num(line.ivaItem ?? '0');
    const discountAmount = this.num(line.montoDescu ?? '0');
    const lineTotal = ventaGravada + ventaExenta + ventaNoSuj + ivaItem - discountAmount;

    const unitCostPosted = this.num(line.precioUni);

    return {
      lineNumber: line.numItem,
      catalogItemId,
      description: line.descripcion,
      quantity: String(line.cantidad),
      unitPrice: String(line.precioUni),
      discountAmount: discountAmount.toFixed(2),
      taxCode,
      taxAmount: ivaItem.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
      unitCostPosted: unitCostPosted.toFixed(4),
      qtyExpected: String(line.cantidad),
      qtyReceived: '0',
      receiptStatus: 'PENDING',
    };
  }

  private num(v: string | number): number {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  private generatePurchaseNumber(tenantId: string): string {
    const rand = Math.floor(Math.random() * 9000 + 1000);
    return `PUR-${tenantId.slice(0, 6)}-${Date.now()}-${rand}`;
  }

  private computeTotals(
    lineas: PurchaseLineDto[],
    proveedor: Cliente,
    ivaRetenidoOverride?: boolean,
    isrRetenidoPct?: number,
  ): { subtotal: number; iva: number; ivaRetenido: number; isrRetenido: number; total: number } {
    const subtotalGravado = lineas
      .filter((l) => l.ivaAplica)
      .reduce((sum, l) => sum + this.lineTotalAmount(l), 0);
    const subtotalExento = lineas
      .filter((l) => !l.ivaAplica)
      .reduce((sum, l) => sum + this.lineTotalAmount(l), 0);
    const subtotal = subtotalGravado + subtotalExento;
    const iva = subtotalGravado * 0.13;
    const aplicaIvaRet = ivaRetenidoOverride ?? proveedor.esGranContribuyente;
    const ivaRetenido = aplicaIvaRet ? subtotalGravado * 0.01 : 0;
    const isrPct = isrRetenidoPct ?? (proveedor.retieneISR ? 10 : 0);
    const isrRetenido = subtotalGravado * (isrPct / 100);
    const total = subtotal + iva - ivaRetenido - isrRetenido;
    return { subtotal, iva, ivaRetenido, isrRetenido, total };
  }

  private lineTotalAmount(l: PurchaseLineDto): number {
    if (l.tipo === 'servicio') return (l.monto ?? 0) * (1 - l.descuentoPct / 100);
    const bruto = (l.cantidad ?? 0) * (l.precioUnit ?? 0);
    return bruto * (1 - l.descuentoPct / 100);
  }

  private mapManualLine(
    l: PurchaseLineDto,
    lineNumber: number,
    tenantId: string,
  ): {
    tenantId: string;
    lineNumber: number;
    lineType: string;
    catalogItemId: string | null;
    accountingAccountId: string | null;
    description: string;
    quantity: string;
    unitPrice: string;
    discountAmount: string;
    taxCode: string;
    taxAmount: string;
    lineTotal: string;
    unitCostPosted: string;
    qtyExpected: string;
    qtyReceived: string;
    receiptStatus: string;
  } {
    const lineTotal = this.lineTotalAmount(l);
    const discountAbsolute = lineTotal * (l.descuentoPct / 100);
    const taxCode = l.ivaAplica ? '13' : '0';
    const taxAmount = l.ivaAplica ? lineTotal * 0.13 : 0;

    // For servicio: quantity=1, unitPrice=monto
    const quantity = l.tipo === 'servicio' ? 1 : (l.cantidad ?? 0);
    const unitPrice = l.tipo === 'servicio' ? (l.monto ?? 0) : (l.precioUnit ?? 0);

    return {
      tenantId,
      lineNumber,
      lineType: l.tipo === 'bien' ? 'BIEN' : 'SERVICIO',
      catalogItemId: l.tipo === 'bien' ? (l.itemId ?? null) : null,
      accountingAccountId: l.tipo === 'servicio' ? (l.cuentaContableId ?? null) : null,
      description: l.descripcion,
      quantity: String(quantity),
      unitPrice: String(unitPrice),
      discountAmount: discountAbsolute.toFixed(2),
      taxCode,
      taxAmount: taxAmount.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
      unitCostPosted: unitPrice.toFixed(4),
      qtyExpected: String(quantity),
      qtyReceived: '0',
      receiptStatus: 'PENDING',
    };
  }
}
