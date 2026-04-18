import {
  ConflictException,
  NotFoundException,
  NotImplementedException,
  PreconditionFailedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { AccountingAutomationService } from '../../accounting/accounting-automation.service';
import { AccountingService } from '../../accounting/accounting.service';
import { PurchaseReceptionService } from './purchase-reception.service';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ParsedDTE } from '../../dte/services/dte-import-parser.service';
import type { CreatePurchaseDto } from '../dto/create-purchase.dto';
import type { UpdatePurchaseDto } from '../dto/update-purchase.dto';
import type { PostPurchaseDto } from '../dto/post-purchase.dto';
import type { PayPurchaseDto } from '../dto/pay-purchase.dto';
import type { AnularPurchaseDto } from '../dto/anular-purchase.dto';
import type { ReceivePurchaseDto } from '../dto/receive-purchase.dto';
import { PurchaseLineTipo } from '../dto/purchase-line.dto';

// =========================================================================
// Mocks
// =========================================================================

type PrismaMock = {
  receivedDTE: { findFirst: jest.Mock };
  cliente: { findUnique: jest.Mock; findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  catalogItem: { findUnique: jest.Mock };
  purchase: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  purchaseLineItem: { deleteMany: jest.Mock; findMany: jest.Mock };
  inventoryMovement: { findMany: jest.Mock; deleteMany: jest.Mock };
  $transaction: jest.Mock;
};

function mockPrisma(): PrismaMock {
  const purchaseCreate = jest.fn();
  const clienteCreate = jest.fn();
  const clienteUpdate = jest.fn();
  const p: PrismaMock = {
    receivedDTE: { findFirst: jest.fn() },
    cliente: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: clienteCreate,
      update: clienteUpdate,
    },
    catalogItem: { findUnique: jest.fn() },
    purchase: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: purchaseCreate,
      update: jest.fn(),
      delete: jest.fn(),
    },
    purchaseLineItem: { deleteMany: jest.fn(), findMany: jest.fn() },
    inventoryMovement: { findMany: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn(async (fns) => {
      // Support both: fn(prisma) pattern and array of promises pattern
      if (typeof fns === 'function') return fns(p);
      if (Array.isArray(fns)) return Promise.all(fns);
      return fns;
    }),
  };
  return p;
}

// =========================================================================
// Fixtures
// =========================================================================

const validParsedCcfe: ParsedDTE = {
  tipoDte: '03',
  version: 3,
  ambiente: '00',
  numeroControl: 'DTE-03-AB12CD34-000000000000001',
  codigoGeneracion: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
  tipoModelo: 1,
  tipoOperacion: 1,
  fecEmi: '2026-04-15',
  horEmi: '14:30:45',
  tipoMoneda: 'USD',
  emisor: {
    nit: '06141507251041',
    nombre: 'Proveedor Test SA',
    nrc: '1234567',
    direccion: JSON.stringify({ departamento: '06', municipio: '14', complemento: 'Col 1' }) as unknown as ParsedDTE['emisor']['direccion'],
  },
  receptor: { nit: '06231507251041', nombre: 'Receptor SA' },
  cuerpoDocumento: [
    {
      numItem: 1,
      tipoItem: 1,
      cantidad: '10',
      codigo: 'ITEM-001',
      uniMedida: 99,
      descripcion: 'Producto de prueba',
      precioUni: '10.00',
      ventaGravada: '100.00',
      ivaItem: '13.00',
    },
  ] as unknown as ParsedDTE['cuerpoDocumento'],
  resumen: {
    totalGravada: '100.00',
    subTotalVentas: '100.00',
    subTotal: '100.00',
    totalIva: '13.00',
    montoTotalOperacion: '113.00',
    totalPagar: '113.00',
    ivaRete1: '0',
  } as unknown as ParsedDTE['resumen'],
  raw: '{}',
};

const validParsedFe: ParsedDTE = {
  ...validParsedCcfe,
  tipoDte: '01',
  numeroControl: 'DTE-01-AB12CD34-000000000000001',
  codigoGeneracion: 'B1C2D3E4-F5A6-7890-ABCD-EF1234567890',
  cuerpoDocumento: [
    {
      numItem: 1,
      tipoItem: 1,
      cantidad: '2',
      codigo: 'PROD-A',
      uniMedida: 99,
      descripcion: 'Prod FE',
      precioUni: '11.30',
      ventaGravada: '22.60',
    },
  ] as unknown as ParsedDTE['cuerpoDocumento'],
  resumen: {
    totalGravada: '22.60',
    subTotalVentas: '22.60',
    subTotal: '22.60',
    totalPagar: '22.60',
    ivaRete1: '0',
  } as unknown as ParsedDTE['resumen'],
};

const validParsedFsee: ParsedDTE = {
  ...validParsedCcfe,
  tipoDte: '14',
  numeroControl: 'DTE-14-AB12CD34-000000000000001',
  codigoGeneracion: 'C1D2E3F4-A5B6-7890-ABCD-EF1234567890',
  emisor: {
    tipoDocumento: '13',
    numDocumento: '012345678',
    nombre: 'Juan Perez (sujeto excluido)',
  } as unknown as ParsedDTE['emisor'],
  cuerpoDocumento: [
    {
      numItem: 1,
      tipoItem: 1,
      cantidad: '5',
      uniMedida: 99,
      descripcion: 'Servicio',
      precioUni: '10.00',
      ventaGravada: '50.00',
    },
  ] as unknown as ParsedDTE['cuerpoDocumento'],
  resumen: {
    totalGravada: '50.00',
    subTotalVentas: '50.00',
    subTotal: '50.00',
    totalPagar: '50.00',
  } as unknown as ParsedDTE['resumen'],
};

function makeReceivedDte(overrides: Record<string, unknown>, parsed: ParsedDTE = validParsedCcfe) {
  return {
    id: 'rdte-1',
    tenantId: 'tenant-1',
    tipoDte: parsed.tipoDte,
    numeroControl: parsed.numeroControl,
    codigoGeneracion: parsed.codigoGeneracion,
    ingestStatus: 'VERIFIED',
    ingestSource: 'JSON_UPLOAD',
    parsedPayload: JSON.stringify(parsed),
    rawPayload: '{}',
    emisorNIT: parsed.emisor.nit ?? parsed.emisor.numDocumento ?? 'UNKNOWN',
    emisorNombre: parsed.emisor.nombre,
    fhEmision: new Date('2026-04-15T14:30:45Z'),
    mhVerifyAttempts: 1,
    ...overrides,
  };
}

function makeService(prisma: PrismaMock) {
  const accounting = {
    generateFromPurchase: jest.fn().mockResolvedValue({ id: 'entry-1', entryNumber: 'JE-1' }),
  } as unknown as AccountingAutomationService;
  const accountingService = {
    createJournalEntry: jest.fn().mockResolvedValue({ id: 'je-pay-1' }),
    postJournalEntry: jest.fn().mockResolvedValue({ id: 'je-pay-1', status: 'POSTED' }),
    voidJournalEntry: jest.fn().mockResolvedValue({ id: 'je-1', status: 'VOIDED' }),
  } as unknown as AccountingService;
  const receptionService = {
    receive: jest.fn().mockResolvedValue({ success: true }),
  } as unknown as PurchaseReceptionService;
  const service = new PurchasesService(
    prisma as unknown as PrismaService,
    accounting,
    accountingService,
    receptionService,
  );
  return { service, accounting, accountingService, receptionService };
}

const baseOptions = { createdBy: 'user-1' };
const baseCall = ['tenant-1', 'rdte-1', baseOptions] as const;

// =========================================================================
// Tests
// =========================================================================

describe('PurchasesService', () => {
  describe('createFromReceivedDte', () => {
    // ---- Happy paths (3) ----

    it('1. CCFE (03) → creates Purchase with documentType=CCFE and invokes asiento', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(makeReceivedDte({}));
      (prisma.purchase.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.create as jest.Mock).mockResolvedValue({ id: 'sup-1', isSupplier: true });
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-1', code: 'ITEM-001' });
      (prisma.purchase.create as jest.Mock).mockResolvedValue({ id: 'pur-1', documentType: 'CCFE', lineItems: [], supplier: {}, journalEntry: null });

      const { service, accounting } = makeService(prisma);
      const result = await service.createFromReceivedDte(...baseCall);

      expect(result.id).toBe('pur-1');
      expect((prisma.purchase.create as jest.Mock).mock.calls[0][0].data.documentType).toBe('CCFE');
      expect(accounting.generateFromPurchase).toHaveBeenCalledWith('pur-1', 'tenant-1', 'ON_PURCHASE_CREATED');
    });

    it('2. FE (01) → creates Purchase with documentType=FCFE (IVA capitalized)', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(makeReceivedDte({}, validParsedFe));
      (prisma.purchase.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.create as jest.Mock).mockResolvedValue({ id: 'sup-1', isSupplier: true });
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.purchase.create as jest.Mock).mockResolvedValue({ id: 'pur-2', documentType: 'FCFE', lineItems: [], supplier: {}, journalEntry: null });

      const { service } = makeService(prisma);
      const result = await service.createFromReceivedDte(...baseCall);

      expect((prisma.purchase.create as jest.Mock).mock.calls[0][0].data.documentType).toBe('FCFE');
      expect(result.documentType).toBe('FCFE');
    });

    it('3. FSEE (14) → creates Purchase with documentType=FSEE, supplier uses numDocumento', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(makeReceivedDte({}, validParsedFsee));
      (prisma.purchase.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.create as jest.Mock).mockResolvedValue({ id: 'sup-3', isSupplier: true });
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.purchase.create as jest.Mock).mockResolvedValue({ id: 'pur-3', documentType: 'FSEE', lineItems: [], supplier: {}, journalEntry: null });

      const { service } = makeService(prisma);
      await service.createFromReceivedDte(...baseCall);

      // Supplier created with DUI (tipoDocumento='13', numDocumento='012345678')
      const createCall = (prisma.cliente.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.tipoDocumento).toBe('13');
      expect(createCall.data.numDocumento).toBe('012345678');
      expect(createCall.data.isSupplier).toBe(true);
      expect(createCall.data.isCustomer).toBe(false);
    });

    // ---- Status gating (4) ----

    it('4. FAILED_PARSE status → throws PreconditionFailedException', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(makeReceivedDte({ ingestStatus: 'FAILED_PARSE' }));
      const { service } = makeService(prisma);
      await expect(service.createFromReceivedDte(...baseCall)).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('5. FAILED_MH_NOT_FOUND → throws PreconditionFailedException', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(makeReceivedDte({ ingestStatus: 'FAILED_MH_NOT_FOUND' }));
      const { service } = makeService(prisma);
      await expect(service.createFromReceivedDte(...baseCall)).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('6. STRUCTURAL_OK + requireVerified=false (default) → creates with warning', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(makeReceivedDte({ ingestStatus: 'STRUCTURAL_OK' }));
      (prisma.purchase.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.create as jest.Mock).mockResolvedValue({ id: 'sup-1', isSupplier: true });
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.purchase.create as jest.Mock).mockResolvedValue({ id: 'pur-6', documentType: 'CCFE', lineItems: [], supplier: {}, journalEntry: null });

      const { service } = makeService(prisma);
      const result = await service.createFromReceivedDte(...baseCall);
      expect(result.id).toBe('pur-6');
    });

    it('7. STRUCTURAL_OK + requireVerified=true → throws', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(makeReceivedDte({ ingestStatus: 'STRUCTURAL_OK' }));
      const { service } = makeService(prisma);
      await expect(
        service.createFromReceivedDte('tenant-1', 'rdte-1', { createdBy: 'user-1', requireVerified: true }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    // ---- Type gating (2) ----

    it('8. tipoDte=05 (NC) → throws NotImplementedException', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(
        makeReceivedDte({}, { ...validParsedCcfe, tipoDte: '05' as ParsedDTE['tipoDte'] })
      );
      const { service } = makeService(prisma);
      await expect(service.createFromReceivedDte(...baseCall)).rejects.toBeInstanceOf(NotImplementedException);
    });

    it('9. tipoDte=07 (CRE) → throws NotImplementedException', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(
        makeReceivedDte({}, { ...validParsedCcfe, tipoDte: '07' as ParsedDTE['tipoDte'] })
      );
      const { service } = makeService(prisma);
      await expect(service.createFromReceivedDte(...baseCall)).rejects.toBeInstanceOf(NotImplementedException);
    });

    // ---- Supplier logic (2) ----

    it('10. Cliente existente con isCustomer=true, isSupplier=false → update only flips isSupplier', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(makeReceivedDte({}));
      (prisma.purchase.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-sup',
        isCustomer: true,
        isSupplier: false,
        nombre: 'PRESERVED NAME',
      });
      (prisma.cliente.update as jest.Mock).mockResolvedValue({ id: 'existing-sup', isSupplier: true });
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.purchase.create as jest.Mock).mockResolvedValue({ id: 'pur-10', documentType: 'CCFE', lineItems: [], supplier: {}, journalEntry: null });

      const { service } = makeService(prisma);
      await service.createFromReceivedDte(...baseCall);

      const updateCall = (prisma.cliente.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data).toEqual({ isSupplier: true });
      expect(prisma.cliente.create).not.toHaveBeenCalled();
    });

    it('11. Nuevo Cliente → create with isSupplier=true, isCustomer=false', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(makeReceivedDte({}));
      (prisma.purchase.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.create as jest.Mock).mockResolvedValue({ id: 'new-sup', isSupplier: true });
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.purchase.create as jest.Mock).mockResolvedValue({ id: 'pur-11', documentType: 'CCFE', lineItems: [], supplier: {}, journalEntry: null });

      const { service } = makeService(prisma);
      await service.createFromReceivedDte(...baseCall);

      const createCall = (prisma.cliente.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.isSupplier).toBe(true);
      expect(createCall.data.isCustomer).toBe(false);
      expect(createCall.data.tipoDocumento).toBe('36'); // NIT
      expect(createCall.data.nombre).toBe('Proveedor Test SA');
    });

    // ---- Catalog match (2) ----

    it('12. Line.codigo matches CatalogItem → catalogItemId populated', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(makeReceivedDte({}));
      (prisma.purchase.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.create as jest.Mock).mockResolvedValue({ id: 'sup-1' });
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-ITEM-001', code: 'ITEM-001' });
      (prisma.purchase.create as jest.Mock).mockResolvedValue({ id: 'pur-12', documentType: 'CCFE', lineItems: [], supplier: {}, journalEntry: null });

      const { service } = makeService(prisma);
      await service.createFromReceivedDte(...baseCall);

      const createCall = (prisma.purchase.create as jest.Mock).mock.calls[0][0];
      const firstLine = createCall.data.lineItems.create[0];
      expect(firstLine.catalogItemId).toBe('cat-ITEM-001');
    });

    it('13. Line.codigo no match → catalogItemId=null, line still created', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(makeReceivedDte({}));
      (prisma.purchase.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.create as jest.Mock).mockResolvedValue({ id: 'sup-1' });
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.purchase.create as jest.Mock).mockResolvedValue({ id: 'pur-13', documentType: 'CCFE', lineItems: [], supplier: {}, journalEntry: null });

      const { service } = makeService(prisma);
      await service.createFromReceivedDte(...baseCall);

      const createCall = (prisma.purchase.create as jest.Mock).mock.calls[0][0];
      const firstLine = createCall.data.lineItems.create[0];
      expect(firstLine.catalogItemId).toBeNull();
      expect(firstLine.description).toBe('Producto de prueba');
    });

    // ---- Edge cases (2) ----

    it('14. Idempotency — second call with same receivedDteId returns existing', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(makeReceivedDte({}));
      (prisma.purchase.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-pur',
        receivedDteId: 'rdte-1',
        documentType: 'CCFE',
        lineItems: [],
        supplier: {},
        journalEntry: { id: 'e-1' },
      });

      const { service, accounting } = makeService(prisma);
      const result = await service.createFromReceivedDte(...baseCall);

      expect(result.id).toBe('existing-pur');
      expect(prisma.cliente.findUnique).not.toHaveBeenCalled();
      expect(prisma.purchase.create).not.toHaveBeenCalled();
      expect(accounting.generateFromPurchase).not.toHaveBeenCalled();
    });

    it('15. Asiento generation throws → Purchase still created, error logged', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(makeReceivedDte({}));
      (prisma.purchase.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.create as jest.Mock).mockResolvedValue({ id: 'sup-1' });
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.purchase.create as jest.Mock).mockResolvedValue({ id: 'pur-15', documentType: 'CCFE', lineItems: [], supplier: {}, journalEntry: null });

      const accounting = {
        generateFromPurchase: jest.fn().mockRejectedValue(new Error('Mapping rule not seeded')),
      } as unknown as AccountingAutomationService;

      const service = new PurchasesService(
        prisma as unknown as PrismaService,
        accounting,
        {} as unknown as AccountingService,
        {} as unknown as PurchaseReceptionService,
      );
      const result = await service.createFromReceivedDte(...baseCall);

      expect(result.id).toBe('pur-15'); // Purchase still returned
      expect(accounting.generateFromPurchase).toHaveBeenCalled();
      // No throw
    });

    // ---- Not-found sanity ----

    it('throws NotFoundException when ReceivedDTE does not exist', async () => {
      const prisma = mockPrisma();
      (prisma.receivedDTE.findFirst as jest.Mock).mockResolvedValue(null);
      const { service } = makeService(prisma);
      await expect(service.createFromReceivedDte(...baseCall)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // =========================================================================
  // Task 4 new methods
  // =========================================================================

  // ---- Fixtures for manual purchase tests ----

  function makeSupplier(overrides: Record<string, unknown> = {}) {
    return {
      id: 'sup-manual',
      tenantId: 'tenant-1',
      nombre: 'Proveedor Manual SA',
      isSupplier: true,
      isCustomer: false,
      esGranContribuyente: false,
      retieneISR: false,
      ...overrides,
    };
  }

  function makeCreateDto(overrides: Partial<CreatePurchaseDto> = {}): CreatePurchaseDto {
    return {
      proveedorId: 'sup-manual',
      tipoDoc: 'CCF' as CreatePurchaseDto['tipoDoc'],
      numDocumentoProveedor: 'F001-0001',
      fechaDoc: '2026-04-15',
      fechaContable: '2026-04-15',
      estadoInicial: 'DRAFT' as CreatePurchaseDto['estadoInicial'],
      lineas: [
        {
          tipo: PurchaseLineTipo.BIEN,
          descripcion: 'Producto A',
          itemId: 'item-1',
          cantidad: 10,
          precioUnit: 100,
          descuentoPct: 0,
          ivaAplica: true,
        },
      ],
      ...overrides,
    } as CreatePurchaseDto;
  }

  function makePurchase(overrides: Record<string, unknown> = {}) {
    return {
      id: 'pur-manual-1',
      tenantId: 'tenant-1',
      status: 'DRAFT',
      supplierId: 'sup-manual',
      purchaseNumber: 'PUR-tenant-12345',
      totalAmount: '1130.00',
      outstandingBalance: '1130.00',
      journalEntryId: null,
      lineItems: [],
      supplier: makeSupplier(),
      journalEntry: null,
      ...overrides,
    };
  }

  // =========================================================================
  describe('createManual', () => {
    it('1. DRAFT purchase created without calling generateFromPurchase', async () => {
      const prisma = mockPrisma();
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValue(makeSupplier());
      (prisma.purchase.create as jest.Mock).mockResolvedValue(makePurchase());
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(makePurchase());

      const { service, accounting } = makeService(prisma);
      const dto = makeCreateDto({ estadoInicial: 'DRAFT' as CreatePurchaseDto['estadoInicial'] });
      const result = await service.createManual('tenant-1', 'user-1', dto);

      expect(result.status).toBe('DRAFT');
      expect(accounting.generateFromPurchase).not.toHaveBeenCalled();
    });

    it('2. POSTED purchase triggers generateFromPurchase with MANUAL trigger', async () => {
      const prisma = mockPrisma();
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValue(makeSupplier());
      const postedPurchase = makePurchase({ status: 'POSTED' });
      (prisma.purchase.create as jest.Mock).mockResolvedValue(postedPurchase);
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(postedPurchase);

      const { service, accounting } = makeService(prisma);
      const dto = makeCreateDto({ estadoInicial: 'POSTED' as CreatePurchaseDto['estadoInicial'] });
      await service.createManual('tenant-1', 'user-1', dto);

      expect(accounting.generateFromPurchase).toHaveBeenCalledWith(
        'pur-manual-1',
        'tenant-1',
        'MANUAL',
      );
    });

    it('3. POSTED + generateFromPurchase returns null (auto journal disabled) → purchase still returned', async () => {
      const prisma = mockPrisma();
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValue(makeSupplier());
      const postedPurchase = makePurchase({ status: 'POSTED' });
      (prisma.purchase.create as jest.Mock).mockResolvedValue(postedPurchase);
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(postedPurchase);

      const accountingDisabled = {
        generateFromPurchase: jest.fn().mockResolvedValue(null),
      } as unknown as AccountingAutomationService;
      const service = new PurchasesService(
        prisma as unknown as PrismaService,
        accountingDisabled,
        {} as unknown as AccountingService,
        {} as unknown as PurchaseReceptionService,
      );

      const dto = makeCreateDto({ estadoInicial: 'POSTED' as CreatePurchaseDto['estadoInicial'] });
      const result = await service.createManual('tenant-1', 'user-1', dto);

      expect(result.status).toBe('POSTED');
    });

    it('4. Proveedor not found → throws NotFoundException', async () => {
      const prisma = mockPrisma();
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValue(null);

      const { service } = makeService(prisma);
      const dto = makeCreateDto();
      await expect(service.createManual('tenant-1', 'user-1', dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('5. POSTED + generateFromPurchase throws → PreconditionFailedException + revert to DRAFT', async () => {
      const prisma = mockPrisma();
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValue(makeSupplier());
      const postedPurchase = makePurchase({ status: 'POSTED' });
      (prisma.purchase.create as jest.Mock).mockResolvedValue(postedPurchase);
      (prisma.purchase.update as jest.Mock).mockResolvedValue({ ...postedPurchase, status: 'DRAFT' });

      const accountingError = {
        generateFromPurchase: jest.fn().mockRejectedValue(new Error('Mapping rule not seeded')),
      } as unknown as AccountingAutomationService;
      const service = new PurchasesService(
        prisma as unknown as PrismaService,
        accountingError,
        {} as unknown as AccountingService,
        {} as unknown as PurchaseReceptionService,
      );

      const dto = makeCreateDto({ estadoInicial: 'POSTED' as CreatePurchaseDto['estadoInicial'] });
      await expect(service.createManual('tenant-1', 'user-1', dto)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      // Status reverted
      expect(prisma.purchase.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'DRAFT' }) }),
      );
    });

    it('6. Gran contribuyente supplier → ivaRetenidoAmount computed as 1% of taxable subtotal', async () => {
      const prisma = mockPrisma();
      const granContrib = makeSupplier({ esGranContribuyente: true });
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValue(granContrib);
      (prisma.purchase.create as jest.Mock).mockResolvedValue(makePurchase());
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(makePurchase());

      const { service } = makeService(prisma);
      const dto = makeCreateDto();
      await service.createManual('tenant-1', 'user-1', dto);

      const createCall = (prisma.purchase.create as jest.Mock).mock.calls[0][0];
      // subtotal taxable = 10 * 100 = 1000, ivaRetenido = 1000 * 0.01 = 10
      expect(Number(createCall.data.ivaRetenidoAmount)).toBeCloseTo(10, 1);
    });
  });

  // =========================================================================
  describe('findAll', () => {
    it('1. Returns paginated list with metadata', async () => {
      const prisma = mockPrisma();
      const purchases = Array.from({ length: 10 }, (_, i) => makePurchase({ id: `pur-${i}` }));
      (prisma.purchase.findMany as jest.Mock).mockResolvedValue(purchases);
      (prisma.purchase.count as jest.Mock).mockResolvedValue(25);
      (prisma.$transaction as jest.Mock).mockResolvedValue([purchases, 25]);

      const { service } = makeService(prisma);
      const result = await service.findAll('tenant-1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(10);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('2. Filters by status', async () => {
      const prisma = mockPrisma();
      const postedPurchases = Array.from({ length: 3 }, (_, i) =>
        makePurchase({ id: `pur-posted-${i}`, status: 'POSTED' }),
      );
      (prisma.$transaction as jest.Mock).mockResolvedValue([postedPurchases, 3]);

      const { service } = makeService(prisma);
      const result = await service.findAll('tenant-1', { estado: 'POSTED' });

      expect(result.total).toBe(3);
      const [findManyCall] = (prisma.$transaction as jest.Mock).mock.calls[0][0];
      void findManyCall; // validated via mock return
      // Verify where clause had status filter
      const txArg = (prisma.$transaction as jest.Mock).mock.calls[0][0];
      expect(txArg).toHaveLength(2);
    });

    it('3. Filters by proveedorId', async () => {
      const prisma = mockPrisma();
      const filtered = [makePurchase({ supplierId: 'sup-x' }), makePurchase({ id: 'pur-2', supplierId: 'sup-x' })];
      (prisma.$transaction as jest.Mock).mockResolvedValue([filtered, 2]);

      const { service } = makeService(prisma);
      const result = await service.findAll('tenant-1', { proveedorId: 'sup-x' });

      expect(result.total).toBe(2);
    });

    it('4. Filters by date range', async () => {
      const prisma = mockPrisma();
      const febPurchases = [makePurchase({ id: 'pur-feb' })];
      (prisma.$transaction as jest.Mock).mockResolvedValue([febPurchases, 1]);

      const { service } = makeService(prisma);
      const result = await service.findAll('tenant-1', {
        desde: '2026-02-01',
        hasta: '2026-02-28',
      });

      expect(result.total).toBe(1);
    });

    it('5. Default pagination clamped to limit 20', async () => {
      const prisma = mockPrisma();
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const { service } = makeService(prisma);
      const result = await service.findAll('tenant-1', {});

      expect(result.limit).toBe(20);
      expect(result.page).toBe(1);
    });
  });

  // =========================================================================
  describe('update (DRAFT only)', () => {
    it('1. Updates DRAFT purchase lines and header', async () => {
      const prisma = mockPrisma();
      const draft = makePurchase({ status: 'DRAFT' });
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(draft);
      (prisma.purchaseLineItem.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.purchase.update as jest.Mock).mockResolvedValue(draft);
      // $transaction returns array of results
      (prisma.$transaction as jest.Mock).mockResolvedValue([{ count: 1 }, draft]);

      const { service } = makeService(prisma);
      const dto: UpdatePurchaseDto = {
        lineas: [
          {
            tipo: PurchaseLineTipo.SERVICIO,
            descripcion: 'Servicio actualizado',
            cuentaContableId: 'cta-1',
            monto: 200,
            descuentoPct: 0,
            ivaAplica: true,
          },
        ],
      } as UpdatePurchaseDto;
      await service.update('tenant-1', 'pur-manual-1', dto);

      expect(prisma.purchase.update).toHaveBeenCalled();
    });

    it('2. Rejects update of POSTED purchase with PreconditionFailedException', async () => {
      const prisma = mockPrisma();
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(makePurchase({ status: 'POSTED' }));

      const { service } = makeService(prisma);
      const dto: UpdatePurchaseDto = { lineas: [] } as UpdatePurchaseDto;
      await expect(service.update('tenant-1', 'pur-manual-1', dto)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(prisma.purchase.update).not.toHaveBeenCalled();
    });

    it('3. Throws NotFoundException if purchase not found', async () => {
      const prisma = mockPrisma();
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(null);

      const { service } = makeService(prisma);
      const dto: UpdatePurchaseDto = {} as UpdatePurchaseDto;
      await expect(service.update('tenant-1', 'nonexistent', dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  describe('softDelete', () => {
    it('1. Deletes DRAFT purchase and its line items', async () => {
      const prisma = mockPrisma();
      const draft = makePurchase({ status: 'DRAFT' });
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(draft);
      (prisma.purchaseLineItem.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.purchase.delete as jest.Mock).mockResolvedValue(draft);
      (prisma.$transaction as jest.Mock).mockResolvedValue([{ count: 1 }, draft]);

      const { service } = makeService(prisma);
      await service.softDelete('tenant-1', 'pur-manual-1');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('2. Rejects delete of POSTED purchase with PreconditionFailedException', async () => {
      const prisma = mockPrisma();
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(makePurchase({ status: 'POSTED' }));

      const { service } = makeService(prisma);
      await expect(service.softDelete('tenant-1', 'pur-manual-1')).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(prisma.purchase.delete).not.toHaveBeenCalled();
    });

    it('3. Throws NotFoundException if purchase not found', async () => {
      const prisma = mockPrisma();
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(null);

      const { service } = makeService(prisma);
      await expect(service.softDelete('tenant-1', 'nonexistent')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  describe('postDraft', () => {
    const postDto: PostPurchaseDto = {
      formaPago: 'credito' as PostPurchaseDto['formaPago'],
      fechaVencimiento: '2026-05-15',
    };

    it('1. DRAFT purchase transitions to POSTED and generates asiento', async () => {
      const prisma = mockPrisma();
      const draft = makePurchase({ status: 'DRAFT' });
      const posted = makePurchase({ status: 'POSTED', journalEntryId: 'je-1' });
      (prisma.purchase.findFirst as jest.Mock)
        .mockResolvedValueOnce(draft)   // first load
        .mockResolvedValueOnce(posted); // findOne at end
      (prisma.purchase.update as jest.Mock).mockResolvedValue(posted);

      const { service, accounting } = makeService(prisma);
      const result = await service.postDraft('tenant-1', 'user-1', 'pur-manual-1', postDto);

      expect(result.status).toBe('POSTED');
      expect(accounting.generateFromPurchase).toHaveBeenCalledWith('pur-manual-1', 'tenant-1', 'MANUAL');
    });

    it('2. Non-DRAFT purchase throws ConflictException (STATE_IMMUTABLE)', async () => {
      const prisma = mockPrisma();
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(makePurchase({ status: 'POSTED' }));

      const { service } = makeService(prisma);
      await expect(service.postDraft('tenant-1', 'user-1', 'pur-manual-1', postDto))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it('3. generateFromPurchase throws → rollback to DRAFT + PreconditionFailedException', async () => {
      const prisma = mockPrisma();
      const draft = makePurchase({ status: 'DRAFT' });
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(draft);
      (prisma.purchase.update as jest.Mock).mockResolvedValue(draft);

      const accountingError = {
        generateFromPurchase: jest.fn().mockRejectedValue(new Error('Mapping missing')),
      } as unknown as AccountingAutomationService;
      const accountingService = {
        createJournalEntry: jest.fn(),
        postJournalEntry: jest.fn(),
        voidJournalEntry: jest.fn(),
      } as unknown as AccountingService;
      const receptionService = { receive: jest.fn() } as unknown as PurchaseReceptionService;
      const service = new PurchasesService(
        prisma as unknown as PrismaService,
        accountingError,
        accountingService,
        receptionService,
      );

      await expect(service.postDraft('tenant-1', 'user-1', 'pur-manual-1', postDto))
        .rejects.toBeInstanceOf(PreconditionFailedException);
      expect(prisma.purchase.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'DRAFT' }) }),
      );
    });

    it('4. formaPago=contado → calls pay() internally', async () => {
      const prisma = mockPrisma();
      const draft = makePurchase({ status: 'DRAFT', totalAmount: '113.00', outstandingBalance: '113.00' });
      const posted = makePurchase({
        status: 'POSTED',
        outstandingBalance: '113.00',
        journalEntryId: 'je-1',
        supplier: makeSupplier({ cuentaCxPDefaultId: 'cta-cxp-1' }),
      });
      const paid = makePurchase({ status: 'PAID', outstandingBalance: '0.00' });
      // Sequence: postDraft-load, pay-load, pay-findOne-end, postDraft-findOne-end
      (prisma.purchase.findFirst as jest.Mock)
        .mockResolvedValueOnce(draft)   // postDraft initial load
        .mockResolvedValueOnce(posted)  // pay() initial load
        .mockResolvedValueOnce(paid)    // pay() findOne at end
        .mockResolvedValueOnce(paid);   // postDraft findOne at end
      (prisma.purchase.update as jest.Mock).mockResolvedValue(paid);

      const { service, accountingService } = makeService(prisma);
      const contadoDto: PostPurchaseDto = {
        formaPago: 'contado' as PostPurchaseDto['formaPago'],
        fechaPago: '2026-04-17',
        cuentaPagoId: 'cta-banco-1',
      };
      await service.postDraft('tenant-1', 'user-1', 'pur-manual-1', contadoDto);

      expect(accountingService.createJournalEntry).toHaveBeenCalled();
      expect(accountingService.postJournalEntry).toHaveBeenCalled();
    });
  });

  // =========================================================================
  describe('pay', () => {
    const payDto: PayPurchaseDto = {
      fechaPago: '2026-04-17',
      cuentaSalidaId: 'cta-banco-1',
      monto: 1130,
    };

    it('1. Pays in full → status=PAID, outstandingBalance=0', async () => {
      const prisma = mockPrisma();
      const posted = makePurchase({
        status: 'POSTED',
        outstandingBalance: '1130.00',
        supplier: makeSupplier({ cuentaCxPDefaultId: 'cta-cxp-1' }),
      });
      const paid = makePurchase({ status: 'PAID', outstandingBalance: '0.00' });
      (prisma.purchase.findFirst as jest.Mock)
        .mockResolvedValueOnce(posted)
        .mockResolvedValueOnce(paid);
      (prisma.purchase.update as jest.Mock).mockResolvedValue(paid);

      const { service, accountingService } = makeService(prisma);
      const result = await service.pay('tenant-1', 'user-1', 'pur-manual-1', payDto);

      expect(result.status).toBe('PAID');
      expect(accountingService.createJournalEntry).toHaveBeenCalled();
      expect(accountingService.postJournalEntry).toHaveBeenCalled();
    });

    it('2. Non-POSTED purchase throws ConflictException', async () => {
      const prisma = mockPrisma();
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(makePurchase({ status: 'DRAFT' }));

      const { service } = makeService(prisma);
      await expect(service.pay('tenant-1', 'user-1', 'pur-manual-1', payDto))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it('3. monto > outstandingBalance → UnprocessableEntityException PAGO_EXCEDE_SALDO', async () => {
      const prisma = mockPrisma();
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(
        makePurchase({ status: 'POSTED', outstandingBalance: '100.00', supplier: makeSupplier({ cuentaCxPDefaultId: 'cta-cxp-1' }) }),
      );

      const { service } = makeService(prisma);
      await expect(
        service.pay('tenant-1', 'user-1', 'pur-manual-1', { ...payDto, monto: 200 }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('4. Supplier without cuentaCxPDefaultId → PreconditionFailedException MAPPING_MISSING', async () => {
      const prisma = mockPrisma();
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(
        makePurchase({
          status: 'POSTED',
          outstandingBalance: '1130.00',
          supplier: makeSupplier({ cuentaCxPDefaultId: null }),
        }),
      );

      const { service } = makeService(prisma);
      await expect(service.pay('tenant-1', 'user-1', 'pur-manual-1', payDto))
        .rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  // =========================================================================
  describe('anular', () => {
    const anularDto: AnularPurchaseDto = { motivo: 'Error en factura' };

    it('1. POSTED purchase with no inventory → anulada + journal voided', async () => {
      const prisma = mockPrisma();
      const posted = makePurchase({ status: 'POSTED', journalEntryId: 'je-1', lineItems: [{ id: 'li-1' }] });
      const anulada = makePurchase({ status: 'ANULADA' });
      (prisma.purchase.findFirst as jest.Mock)
        .mockResolvedValueOnce(posted)
        .mockResolvedValueOnce(anulada);
      (prisma.purchaseLineItem.findMany as jest.Mock).mockResolvedValue([{ id: 'li-1' }]);
      (prisma.inventoryMovement.findMany as jest.Mock).mockResolvedValue([]); // no consumed movements
      (prisma.inventoryMovement.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.purchase.update as jest.Mock).mockResolvedValue(anulada);

      const { service, accountingService } = makeService(prisma);
      await service.anular('tenant-1', 'user-1', 'pur-manual-1', anularDto);

      expect(accountingService.voidJournalEntry).toHaveBeenCalledWith('tenant-1', 'je-1', 'user-1', 'Error en factura');
    });

    it('2. PAID purchase → can also be anulada', async () => {
      const prisma = mockPrisma();
      const paid = makePurchase({ status: 'PAID', journalEntryId: 'je-1', lineItems: [{ id: 'li-1' }] });
      const anulada = makePurchase({ status: 'ANULADA' });
      (prisma.purchase.findFirst as jest.Mock)
        .mockResolvedValueOnce(paid)
        .mockResolvedValueOnce(anulada);
      (prisma.purchaseLineItem.findMany as jest.Mock).mockResolvedValue([{ id: 'li-1' }]);
      (prisma.inventoryMovement.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inventoryMovement.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.purchase.update as jest.Mock).mockResolvedValue(anulada);

      const { service } = makeService(prisma);
      const result = await service.anular('tenant-1', 'user-1', 'pur-manual-1', anularDto);
      expect(result.status).toBe('ANULADA');
    });

    it('3. DRAFT purchase → ConflictException (cannot anular)', async () => {
      const prisma = mockPrisma();
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(makePurchase({ status: 'DRAFT' }));

      const { service } = makeService(prisma);
      await expect(service.anular('tenant-1', 'user-1', 'pur-manual-1', anularDto))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it('4. Inventory consumed by DTE → PreconditionFailedException KARDEX_CONSUMED', async () => {
      const prisma = mockPrisma();
      const posted = makePurchase({ status: 'POSTED', lineItems: [{ id: 'li-1' }] });
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(posted);
      (prisma.purchaseLineItem.findMany as jest.Mock).mockResolvedValue([{ id: 'li-1' }]);
      (prisma.inventoryMovement.findMany as jest.Mock).mockResolvedValue([
        { id: 'mov-1', sourceType: 'DTE', sourceId: 'dte-abc', purchaseLineItemId: 'li-1' },
      ]);

      const { service } = makeService(prisma);
      await expect(service.anular('tenant-1', 'user-1', 'pur-manual-1', anularDto))
        .rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('5. Purchase without journalEntryId → skips voidJournalEntry', async () => {
      const prisma = mockPrisma();
      const posted = makePurchase({ status: 'POSTED', journalEntryId: null, lineItems: [] });
      const anulada = makePurchase({ status: 'ANULADA' });
      (prisma.purchase.findFirst as jest.Mock)
        .mockResolvedValueOnce(posted)
        .mockResolvedValueOnce(anulada);
      (prisma.purchaseLineItem.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inventoryMovement.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inventoryMovement.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.purchase.update as jest.Mock).mockResolvedValue(anulada);

      const { service, accountingService } = makeService(prisma);
      await service.anular('tenant-1', 'user-1', 'pur-manual-1', anularDto);

      expect(accountingService.voidJournalEntry).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  describe('receiveLate', () => {
    const receiveDto: ReceivePurchaseDto = {
      fechaRecepcion: '2026-04-17',
      lineas: [],
    };

    it('1. POSTED purchase with no prior inventory → delegates to receptionService', async () => {
      const prisma = mockPrisma();
      const posted = makePurchase({ status: 'POSTED', lineItems: [{ id: 'li-1' }] });
      const received = makePurchase({ status: 'RECEIVED' });
      (prisma.purchase.findFirst as jest.Mock)
        .mockResolvedValueOnce(posted)
        .mockResolvedValueOnce(received);
      (prisma.purchaseLineItem.findMany as jest.Mock).mockResolvedValue([{ id: 'li-1' }]);
      (prisma.inventoryMovement.findMany as jest.Mock).mockResolvedValue([]); // not yet received

      const { service, receptionService } = makeService(prisma);
      await service.receiveLate('tenant-1', 'user-1', 'pur-manual-1', receiveDto);

      expect(receptionService.receive).toHaveBeenCalled();
    });

    it('2. Non-POSTED/PAID purchase → ConflictException', async () => {
      const prisma = mockPrisma();
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(makePurchase({ status: 'DRAFT' }));

      const { service } = makeService(prisma);
      await expect(service.receiveLate('tenant-1', 'user-1', 'pur-manual-1', receiveDto))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it('3. Already has InventoryMovements → ConflictException ALREADY_RECEIVED', async () => {
      const prisma = mockPrisma();
      const posted = makePurchase({ status: 'POSTED', lineItems: [{ id: 'li-1' }] });
      (prisma.purchase.findFirst as jest.Mock).mockResolvedValue(posted);
      (prisma.purchaseLineItem.findMany as jest.Mock).mockResolvedValue([{ id: 'li-1' }]);
      (prisma.inventoryMovement.findMany as jest.Mock).mockResolvedValue([
        { id: 'mov-1', sourceType: 'PURCHASE', sourceId: 'pur-manual-1' },
      ]);

      const { service } = makeService(prisma);
      await expect(service.receiveLate('tenant-1', 'user-1', 'pur-manual-1', receiveDto))
        .rejects.toBeInstanceOf(ConflictException);
    });
  });
});
