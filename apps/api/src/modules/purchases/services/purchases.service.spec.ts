import {
  NotFoundException,
  NotImplementedException,
  PreconditionFailedException,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { AccountingAutomationService } from '../../accounting/accounting-automation.service';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ParsedDTE } from '../../dte/services/dte-import-parser.service';

// =========================================================================
// Mocks
// =========================================================================

type PrismaMock = {
  receivedDTE: { findFirst: jest.Mock };
  cliente: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
  catalogItem: { findUnique: jest.Mock };
  purchase: { findUnique: jest.Mock; create: jest.Mock };
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
      create: clienteCreate,
      update: clienteUpdate,
    },
    catalogItem: { findUnique: jest.fn() },
    purchase: { findUnique: jest.fn(), create: purchaseCreate },
    $transaction: jest.fn(async (fn) => fn(p)), // pass-through transaction
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
  const service = new PurchasesService(prisma as unknown as PrismaService, accounting);
  return { service, accounting };
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

      const service = new PurchasesService(prisma as unknown as PrismaService, accounting);
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
});
