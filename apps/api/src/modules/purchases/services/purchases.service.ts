import {
  Injectable,
  Logger,
  NotFoundException,
  NotImplementedException,
  PreconditionFailedException,
} from '@nestjs/common';
import type { Purchase, PurchaseLineItem, Cliente, JournalEntry } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountingAutomationService } from '../../accounting/accounting-automation.service';
import type { ParsedDTE } from '../../dte/services/dte-import-parser.service';

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
}
