import { NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { KardexReportService } from './kardex-report.service';
import { PrismaService } from '../../../prisma/prisma.service';

// =========================================================================
// Mocks
// =========================================================================

type PrismaMock = {
  catalogItem: { findUnique: jest.Mock; findMany: jest.Mock };
  tenant: { findUnique: jest.Mock };
  inventoryMovement: { findMany: jest.Mock; groupBy: jest.Mock };
};

function mockPrisma(): PrismaMock {
  return {
    catalogItem: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    tenant: { findUnique: jest.fn() },
    inventoryMovement: {
      findMany: jest.fn().mockResolvedValue([]),
      groupBy: jest.fn().mockResolvedValue([]),
    },
  };
}

function makeTenant(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tenant-1',
    nombre: 'Wellnest SA de CV',
    nit: '06141507251041',
    nrc: '1234567',
    ...overrides,
  };
}

function makeCatalogItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cat-1',
    tenantId: 'tenant-1',
    code: 'PROD-001',
    name: 'Producto de Prueba',
    uniMedida: 99,
    ...overrides,
  };
}

function makeMovement(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mov-1',
    tenantId: 'tenant-1',
    catalogItemId: 'cat-1',
    movementDate: new Date('2026-04-10T10:00:00Z'),
    correlativo: 1,
    movementType: 'ENTRADA_COMPRA',
    qtyIn: '10.0000',
    qtyOut: '0.0000',
    unitCost: '7.5000',
    totalCost: '75.00',
    balanceQty: '10.0000',
    balanceAvgCost: '7.5000',
    balanceValue: '75.00',
    documentType: 'CCFE',
    documentNumber: 'DTE-03-XYZ-001',
    supplierId: 'sup-1',
    supplierNationality: 'SV',
    sourceType: 'PURCHASE',
    sourceId: 'pur-1',
    notes: null,
    supplier: { numDocumento: '06230987654321', nombre: 'Proveedor Test SA' },
    ...overrides,
  };
}

const startDate = new Date('2026-04-01T00:00:00Z');
const endDate = new Date('2026-04-30T23:59:59Z');

// Helper to read Excel buffer and inspect cells
async function readBuffer(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  return wb;
}

// =========================================================================
// Tests
// =========================================================================

describe('KardexReportService', () => {
  describe('generateKardexExcel (single item)', () => {
    it('1. Happy path — 3 movements generates Excel with header + data rows + totals', async () => {
      const prisma = mockPrisma();
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue(makeCatalogItem());
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());
      (prisma.inventoryMovement.findMany as jest.Mock).mockResolvedValue([
        makeMovement({ correlativo: 1, qtyIn: '10.0000', balanceQty: '10.0000', balanceValue: '75.00' }),
        makeMovement({ correlativo: 2, qtyIn: '0.0000', qtyOut: '3.0000', balanceQty: '7.0000', balanceValue: '52.50' }),
        makeMovement({ correlativo: 3, qtyIn: '5.0000', balanceQty: '12.0000', balanceValue: '90.00' }),
      ]);

      const service = new KardexReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateKardexExcel('tenant-1', 'cat-1', startDate, endDate);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      const wb = await readBuffer(buffer);
      const sheet = wb.getWorksheet('PROD-001');
      expect(sheet).toBeDefined();

      // Row 1: title
      const titleCell = sheet!.getCell('A1').value;
      expect(String(titleCell)).toContain('KARDEX');
      expect(String(titleCell)).toContain('142-A');

      // Row 2: empresa header
      expect(String(sheet!.getCell('A2').value)).toContain('Wellnest');
      expect(String(sheet!.getCell('A2').value)).toContain('06141507251041');

      // Row 3: producto header
      expect(String(sheet!.getCell('A3').value)).toContain('PROD-001');

      // Row 5: column headers
      expect(sheet!.getCell('A5').value).toBe('Correlativo');
      expect(sheet!.getCell('H5').value).toBe('Entrada');
      expect(sheet!.getCell('I5').value).toBe('Salida');

      // Rows 6-8: data rows
      expect(sheet!.getCell('A6').value).toBe(1);
      expect(sheet!.getCell('A7').value).toBe(2);
      expect(sheet!.getCell('A8').value).toBe(3);

      // Totals row at row 10 (rows.length=3 + 7 = 10)
      const totalsRow = sheet!.getRow(10);
      expect(String(totalsRow.getCell('A').value)).toContain('TOTAL');
      expect(Number(totalsRow.getCell('H').value)).toBeCloseTo(15, 4); // 10+0+5
      expect(Number(totalsRow.getCell('I').value)).toBeCloseTo(3, 4);
      expect(Number(totalsRow.getCell('J').value)).toBeCloseTo(12, 4); // final balance
      expect(Number(totalsRow.getCell('L').value)).toBeCloseTo(90, 2);
    });

    it('2. Empty period — returns Excel with "sin movimientos" message, no throw', async () => {
      const prisma = mockPrisma();
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue(makeCatalogItem());
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());
      (prisma.inventoryMovement.findMany as jest.Mock).mockResolvedValue([]);

      const service = new KardexReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateKardexExcel('tenant-1', 'cat-1', startDate, endDate);

      const wb = await readBuffer(buffer);
      const sheet = wb.getWorksheet('PROD-001');
      expect(sheet).toBeDefined();

      // Row 6 should contain "Sin movimientos" message
      const rowText = String(sheet!.getCell('A6').value);
      expect(rowText.toLowerCase()).toContain('sin movimientos');

      // Totals with zeros
      const totalsRow = sheet!.getRow(9);
      expect(String(totalsRow.getCell('A').value)).toContain('TOTAL');
      expect(Number(totalsRow.getCell('H').value) || 0).toBe(0);
    });

    it('3. CatalogItem not found → NotFoundException', async () => {
      const prisma = mockPrisma();
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue(null);

      const service = new KardexReportService(prisma as unknown as PrismaService);
      await expect(
        service.generateKardexExcel('tenant-1', 'cat-missing', startDate, endDate),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('4. tenantId mismatch on catalogItem → NotFoundException', async () => {
      const prisma = mockPrisma();
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue(
        makeCatalogItem({ tenantId: 'different-tenant' }),
      );

      const service = new KardexReportService(prisma as unknown as PrismaService);
      await expect(
        service.generateKardexExcel('tenant-1', 'cat-1', startDate, endDate),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('5. Supplier data joined — row has NIT and nombre from related Cliente', async () => {
      const prisma = mockPrisma();
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue(makeCatalogItem());
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());
      (prisma.inventoryMovement.findMany as jest.Mock).mockResolvedValue([
        makeMovement({
          supplier: { numDocumento: '06230987654321', nombre: 'Proveedor A' },
        }),
        makeMovement({
          supplierId: null,
          supplier: null,
          correlativo: 2,
        }),
      ]);

      const service = new KardexReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateKardexExcel('tenant-1', 'cat-1', startDate, endDate);
      const wb = await readBuffer(buffer);
      const sheet = wb.getWorksheet('PROD-001')!;

      // Row 6: supplier populated
      expect(String(sheet.getCell('E6').value)).toBe('06230987654321');
      expect(String(sheet.getCell('F6').value)).toBe('Proveedor A');

      // Row 7: no supplier (null values)
      const nitCell7 = sheet.getCell('E7').value;
      expect(nitCell7 === null || nitCell7 === '' || nitCell7 === undefined).toBe(true);
    });

    it('6. Totals math — sums, finalBalance use last row', async () => {
      const prisma = mockPrisma();
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue(makeCatalogItem());
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());
      (prisma.inventoryMovement.findMany as jest.Mock).mockResolvedValue([
        makeMovement({ correlativo: 1, qtyIn: '20.0000', qtyOut: '0.0000', balanceQty: '20.0000', balanceValue: '200.00' }),
        makeMovement({ correlativo: 2, qtyIn: '0.0000', qtyOut: '5.0000', balanceQty: '15.0000', balanceValue: '150.00' }),
        makeMovement({ correlativo: 3, qtyIn: '10.0000', qtyOut: '0.0000', balanceQty: '25.0000', balanceValue: '250.00' }),
      ]);

      const service = new KardexReportService(prisma as unknown as PrismaService);
      const data = await service.loadKardexData('tenant-1', 'cat-1', startDate, endDate);

      expect(data.totals.sumQtyIn).toBeCloseTo(30, 4);    // 20 + 0 + 10
      expect(data.totals.sumQtyOut).toBeCloseTo(5, 4);    // 0 + 5 + 0
      expect(data.totals.finalBalanceQty).toBeCloseTo(25, 4);    // last row
      expect(data.totals.finalBalanceValue).toBeCloseTo(250, 2); // last row
    });
  });

  describe('generateKardexBookExcel (multi-item)', () => {
    it('7. Book with 3 items — workbook has 3 sheets ordered by code ASC', async () => {
      const prisma = mockPrisma();
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());
      (prisma.inventoryMovement.groupBy as jest.Mock).mockResolvedValue([
        { catalogItemId: 'cat-b' },
        { catalogItemId: 'cat-a' },
        { catalogItemId: 'cat-c' },
      ]);
      // findMany para ordenar por code — retorna los 3 items ordenados
      (prisma.catalogItem.findMany as jest.Mock).mockResolvedValue([
        { id: 'cat-a', tenantId: 'tenant-1', code: 'AAA-001', name: 'Item A', uniMedida: 99 },
        { id: 'cat-b', tenantId: 'tenant-1', code: 'BBB-002', name: 'Item B', uniMedida: 99 },
        { id: 'cat-c', tenantId: 'tenant-1', code: 'CCC-003', name: 'Item C', uniMedida: 99 },
      ]);
      // findUnique per item in loadKardexData
      (prisma.catalogItem.findUnique as jest.Mock).mockImplementation(({ where }: { where: { id: string } }) => {
        const items: Record<string, unknown> = {
          'cat-a': { id: 'cat-a', tenantId: 'tenant-1', code: 'AAA-001', name: 'Item A', uniMedida: 99 },
          'cat-b': { id: 'cat-b', tenantId: 'tenant-1', code: 'BBB-002', name: 'Item B', uniMedida: 99 },
          'cat-c': { id: 'cat-c', tenantId: 'tenant-1', code: 'CCC-003', name: 'Item C', uniMedida: 99 },
        };
        return Promise.resolve(items[where.id] ?? null);
      });
      (prisma.inventoryMovement.findMany as jest.Mock).mockResolvedValue([makeMovement()]);

      const service = new KardexReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateKardexBookExcel('tenant-1', startDate, endDate);
      const wb = await readBuffer(buffer);

      expect(wb.worksheets).toHaveLength(3);
      expect(wb.worksheets[0].name).toBe('AAA-001');
      expect(wb.worksheets[1].name).toBe('BBB-002');
      expect(wb.worksheets[2].name).toBe('CCC-003');
    });

    it('8. Sheet name truncated to 31 chars when code is long', async () => {
      const prisma = mockPrisma();
      const longCode = 'THIS-IS-A-VERY-LONG-CODE-THAT-EXCEEDS-THIRTY-ONE-CHARS';
      (prisma.catalogItem.findUnique as jest.Mock).mockResolvedValue(
        makeCatalogItem({ code: longCode }),
      );
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());
      (prisma.inventoryMovement.findMany as jest.Mock).mockResolvedValue([makeMovement()]);

      const service = new KardexReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateKardexExcel('tenant-1', 'cat-1', startDate, endDate);
      const wb = await readBuffer(buffer);

      // Sheet name truncated to 31 chars
      const expectedName = longCode.slice(0, 31);
      expect(wb.worksheets[0].name).toBe(expectedName);
      expect(expectedName.length).toBe(31);
    });
  });
});
