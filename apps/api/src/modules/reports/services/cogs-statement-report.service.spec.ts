import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { CogsStatementReportService } from './cogs-statement-report.service';
import { PrismaService } from '../../../prisma/prisma.service';

// =========================================================================
// Mocks
// =========================================================================

type PrismaMock = {
  inventoryMovement: { findMany: jest.Mock; aggregate: jest.Mock };
  purchase: { aggregate: jest.Mock };
  tenant: { findUnique: jest.Mock };
};

function mockPrisma(): PrismaMock {
  return {
    inventoryMovement: {
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { totalCost: null } }),
    },
    purchase: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { discountAmount: null } }),
    },
    tenant: { findUnique: jest.fn() },
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

const startDate = new Date('2026-04-01T00:00:00Z');
const endDate = new Date('2026-04-30T23:59:59Z');

async function readBuffer(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  return wb;
}

// Mock helpers to distinguish the 2 findMany calls (pre-period then all-including-period)
// and the 6 aggregate calls in known order:
// aggregate order: compras, salida_venta, devolucion_venta, faltante, sobrante
// purchase.aggregate: discuentos
function setupAggregates(prisma: PrismaMock, opts: {
  compras: number; salidaVenta: number; devolucionVenta: number;
  faltante: number; sobrante: number; descuentos: number;
}) {
  const calls = [
    opts.compras, opts.salidaVenta, opts.devolucionVenta, opts.faltante, opts.sobrante,
  ];
  (prisma.inventoryMovement.aggregate as jest.Mock).mockImplementation(() => {
    const val = calls.shift();
    return Promise.resolve({ _sum: { totalCost: val != null ? String(val) : null } });
  });
  (prisma.purchase.aggregate as jest.Mock).mockResolvedValue({
    _sum: { discountAmount: String(opts.descuentos) },
  });
}

// =========================================================================
// Tests
// =========================================================================

describe('CogsStatementReportService', () => {
  describe('generateCogsStatementExcel', () => {
    it('1. Happy path — 2 items with start/end inventory, purchases, sales, and merma', async () => {
      const prisma = mockPrisma();
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());

      // Pre-period: each item's last movement has a balanceValue
      // Inv inicial = 600 + 400 = 1000
      // Post-period: each item's last movement (including period movs)
      // Inv final = 700 + 350 = 1050
      (prisma.inventoryMovement.findMany as jest.Mock)
        .mockResolvedValueOnce([
          // Ordered by catalogItemId ASC, movementDate DESC, correlativo DESC
          { catalogItemId: 'item-a', balanceValue: '600.00', movementDate: new Date('2026-03-15'), correlativo: 5 },
          { catalogItemId: 'item-a', balanceValue: '500.00', movementDate: new Date('2026-03-10'), correlativo: 4 },
          { catalogItemId: 'item-b', balanceValue: '400.00', movementDate: new Date('2026-03-20'), correlativo: 2 },
        ])
        .mockResolvedValueOnce([
          { catalogItemId: 'item-a', balanceValue: '700.00', movementDate: new Date('2026-04-20'), correlativo: 9 },
          { catalogItemId: 'item-a', balanceValue: '600.00', movementDate: new Date('2026-03-15'), correlativo: 5 },
          { catalogItemId: 'item-b', balanceValue: '350.00', movementDate: new Date('2026-04-25'), correlativo: 6 },
          { catalogItemId: 'item-b', balanceValue: '400.00', movementDate: new Date('2026-03-20'), correlativo: 2 },
        ]);

      // Compras brutas = 500, descuentos = 20, devoluciones compras = 0 (MVP)
      // Compras netas = 500 - 0 - 20 = 480
      // Mercadería disponible = 1000 + 480 = 1480
      // Inv final = 1050
      // COGS fórmula = 1480 - 1050 = 430
      //
      // COGS registrado: salida_venta 400, devolucion_venta 0 → cogsRegistrado = 400
      // Faltantes 30, sobrantes 0 → ajusteNeto = 30
      // Diferencia = 430 - 400 - 30 = 0
      setupAggregates(prisma, {
        compras: 500, salidaVenta: 400, devolucionVenta: 0,
        faltante: 30, sobrante: 0, descuentos: 20,
      });

      const service = new CogsStatementReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateCogsStatementExcel('tenant-1', startDate, endDate);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      const wb = await readBuffer(buffer);
      const sheet = wb.getWorksheet('Estado de Costo de Venta')!;
      expect(sheet).toBeDefined();

      // Row 1 banner
      expect(String(sheet.getCell('A1').value)).toContain('ESTADO DE COSTO DE VENTA');

      // Row 2 empresa
      expect(String(sheet.getCell('A2').value)).toContain('Wellnest');

      // Row 5 Inv Inicial = 1000
      expect(Number(sheet.getCell('C5').value)).toBeCloseTo(1000, 2);

      // Row 7 Compras brutas = 500
      expect(Number(sheet.getCell('B7').value)).toBeCloseTo(500, 2);

      // Row 8 Devoluciones = 0
      expect(Number(sheet.getCell('B8').value) || 0).toBe(0);

      // Row 9 Descuentos = 20
      expect(Number(sheet.getCell('B9').value)).toBeCloseTo(20, 2);

      // Row 10 Compras Netas = 480
      expect(Number(sheet.getCell('C10').value)).toBeCloseTo(480, 2);

      // Row 12 Mercadería Disponible = 1480
      expect(Number(sheet.getCell('C12').value)).toBeCloseTo(1480, 2);

      // Row 14 Inv Final = 1050
      expect(Number(sheet.getCell('C14').value)).toBeCloseTo(1050, 2);

      // Row 16 COGS fórmula = 430
      expect(Number(sheet.getCell('C16').value)).toBeCloseTo(430, 2);

      // Row 19 COGS fórmula (duplicado en reconciliación)
      expect(Number(sheet.getCell('C19').value)).toBeCloseTo(430, 2);

      // Row 20 COGS registrado = 400
      expect(Number(sheet.getCell('C20').value)).toBeCloseTo(400, 2);

      // Row 23 Faltantes = 30
      expect(Number(sheet.getCell('B23').value)).toBeCloseTo(30, 2);

      // Row 24 Sobrantes = 0
      expect(Number(sheet.getCell('B24').value) || 0).toBe(0);

      // Row 25 Ajuste neto = 30
      expect(Number(sheet.getCell('C25').value)).toBeCloseTo(30, 2);

      // Row 27 Diferencia = 0
      expect(Number(sheet.getCell('C27').value) || 0).toBeCloseTo(0, 2);
    });

    it('2. Solo compras — sin ventas ni ajustes', async () => {
      const prisma = mockPrisma();
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());

      // Inv inicial = 500, inv final = 1000 (subió por compras)
      (prisma.inventoryMovement.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { catalogItemId: 'item-a', balanceValue: '500.00', movementDate: new Date('2026-03-15'), correlativo: 3 },
        ])
        .mockResolvedValueOnce([
          { catalogItemId: 'item-a', balanceValue: '1000.00', movementDate: new Date('2026-04-20'), correlativo: 8 },
          { catalogItemId: 'item-a', balanceValue: '500.00', movementDate: new Date('2026-03-15'), correlativo: 3 },
        ]);

      // Compras 500, todo lo demás 0
      // COGS fórmula = 500 + 500 - 1000 = 0
      setupAggregates(prisma, {
        compras: 500, salidaVenta: 0, devolucionVenta: 0,
        faltante: 0, sobrante: 0, descuentos: 0,
      });

      const service = new CogsStatementReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateCogsStatementExcel('tenant-1', startDate, endDate);
      const wb = await readBuffer(buffer);
      const sheet = wb.getWorksheet('Estado de Costo de Venta')!;

      expect(Number(sheet.getCell('C16').value) || 0).toBe(0); // COGS fórmula
      expect(Number(sheet.getCell('C20').value) || 0).toBe(0); // COGS registrado
      expect(Number(sheet.getCell('C27').value) || 0).toBe(0); // Diferencia
    });

    it('3. Solo ventas — sin compras ni ajustes', async () => {
      const prisma = mockPrisma();
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());

      // Inv inicial = 1000, inv final = 600 (bajó por ventas)
      (prisma.inventoryMovement.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { catalogItemId: 'item-a', balanceValue: '1000.00', movementDate: new Date('2026-03-15'), correlativo: 3 },
        ])
        .mockResolvedValueOnce([
          { catalogItemId: 'item-a', balanceValue: '600.00', movementDate: new Date('2026-04-20'), correlativo: 8 },
          { catalogItemId: 'item-a', balanceValue: '1000.00', movementDate: new Date('2026-03-15'), correlativo: 3 },
        ]);

      // Compras 0, salida_venta 400
      // COGS fórmula = 1000 + 0 - 600 = 400
      // COGS registrado = 400, diferencia = 0
      setupAggregates(prisma, {
        compras: 0, salidaVenta: 400, devolucionVenta: 0,
        faltante: 0, sobrante: 0, descuentos: 0,
      });

      const service = new CogsStatementReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateCogsStatementExcel('tenant-1', startDate, endDate);
      const wb = await readBuffer(buffer);
      const sheet = wb.getWorksheet('Estado de Costo de Venta')!;

      expect(Number(sheet.getCell('C16').value)).toBeCloseTo(400, 2); // COGS fórmula
      expect(Number(sheet.getCell('C20').value)).toBeCloseTo(400, 2); // COGS registrado
      expect(Number(sheet.getCell('C27').value) || 0).toBe(0);        // Diferencia = 0
    });

    it('4. Con merma (faltante físico)', async () => {
      const prisma = mockPrisma();
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());

      // Inv inicial 1000, inv final 550 (ventas 400 + merma 50)
      (prisma.inventoryMovement.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { catalogItemId: 'item-a', balanceValue: '1000.00', movementDate: new Date('2026-03-15'), correlativo: 3 },
        ])
        .mockResolvedValueOnce([
          { catalogItemId: 'item-a', balanceValue: '550.00', movementDate: new Date('2026-04-28'), correlativo: 10 },
          { catalogItemId: 'item-a', balanceValue: '1000.00', movementDate: new Date('2026-03-15'), correlativo: 3 },
        ]);

      // COGS fórmula = 1000 - 550 = 450
      // COGS registrado = 400
      // Faltantes = 50, ajuste neto = 50
      // Diferencia = 450 - 400 - 50 = 0
      setupAggregates(prisma, {
        compras: 0, salidaVenta: 400, devolucionVenta: 0,
        faltante: 50, sobrante: 0, descuentos: 0,
      });

      const service = new CogsStatementReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateCogsStatementExcel('tenant-1', startDate, endDate);
      const wb = await readBuffer(buffer);
      const sheet = wb.getWorksheet('Estado de Costo de Venta')!;

      expect(Number(sheet.getCell('C16').value)).toBeCloseTo(450, 2);  // COGS fórmula
      expect(Number(sheet.getCell('C20').value)).toBeCloseTo(400, 2);  // COGS registrado
      expect(Number(sheet.getCell('B23').value)).toBeCloseTo(50, 2);   // Faltantes
      expect(Number(sheet.getCell('C25').value)).toBeCloseTo(50, 2);   // Ajuste neto
      expect(Number(sheet.getCell('C27').value) || 0).toBeCloseTo(0, 2); // Diferencia
    });

    it('5. Con sobrante físico', async () => {
      const prisma = mockPrisma();
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());

      // Inv inicial 1000, inv final 650 (ventas 400 reducen, sobrante 50 aumenta)
      (prisma.inventoryMovement.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { catalogItemId: 'item-a', balanceValue: '1000.00', movementDate: new Date('2026-03-15'), correlativo: 3 },
        ])
        .mockResolvedValueOnce([
          { catalogItemId: 'item-a', balanceValue: '650.00', movementDate: new Date('2026-04-28'), correlativo: 10 },
          { catalogItemId: 'item-a', balanceValue: '1000.00', movementDate: new Date('2026-03-15'), correlativo: 3 },
        ]);

      // COGS fórmula = 1000 - 650 = 350
      // COGS registrado = 400
      // Sobrantes = 50, ajuste neto = -50
      // Diferencia = 350 - 400 - (-50) = 0
      setupAggregates(prisma, {
        compras: 0, salidaVenta: 400, devolucionVenta: 0,
        faltante: 0, sobrante: 50, descuentos: 0,
      });

      const service = new CogsStatementReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateCogsStatementExcel('tenant-1', startDate, endDate);
      const wb = await readBuffer(buffer);
      const sheet = wb.getWorksheet('Estado de Costo de Venta')!;

      expect(Number(sheet.getCell('C16').value)).toBeCloseTo(350, 2);  // COGS fórmula
      expect(Number(sheet.getCell('C20').value)).toBeCloseTo(400, 2);  // COGS registrado
      expect(Number(sheet.getCell('B24').value)).toBeCloseTo(50, 2);   // Sobrantes
      expect(Number(sheet.getCell('C25').value)).toBeCloseTo(-50, 2);  // Ajuste neto = faltantes - sobrantes
      expect(Number(sheet.getCell('C27').value) || 0).toBeCloseTo(0, 2); // Diferencia
    });

    it('6. Con devolución de venta (ENTRADA_DEVOLUCION_VENTA)', async () => {
      const prisma = mockPrisma();
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());

      // Inv inicial 1000, inv final 650 (ventas 400 bajan, devolución 50 sube)
      (prisma.inventoryMovement.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { catalogItemId: 'item-a', balanceValue: '1000.00', movementDate: new Date('2026-03-15'), correlativo: 3 },
        ])
        .mockResolvedValueOnce([
          { catalogItemId: 'item-a', balanceValue: '650.00', movementDate: new Date('2026-04-28'), correlativo: 10 },
          { catalogItemId: 'item-a', balanceValue: '1000.00', movementDate: new Date('2026-03-15'), correlativo: 3 },
        ]);

      // COGS fórmula = 1000 - 650 = 350
      // COGS registrado = salida_venta 400 - devolucion_venta 50 = 350
      // Ajuste neto = 0, diferencia = 350 - 350 - 0 = 0
      setupAggregates(prisma, {
        compras: 0, salidaVenta: 400, devolucionVenta: 50,
        faltante: 0, sobrante: 0, descuentos: 0,
      });

      const service = new CogsStatementReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateCogsStatementExcel('tenant-1', startDate, endDate);
      const wb = await readBuffer(buffer);
      const sheet = wb.getWorksheet('Estado de Costo de Venta')!;

      expect(Number(sheet.getCell('C16').value)).toBeCloseTo(350, 2);   // COGS fórmula
      expect(Number(sheet.getCell('C20').value)).toBeCloseTo(350, 2);   // COGS registrado (400 - 50)
      expect(Number(sheet.getCell('C27').value) || 0).toBeCloseTo(0, 2); // Diferencia
    });

    it('7. Período vacío — sin movimientos en el rango', async () => {
      const prisma = mockPrisma();
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());

      // Inv inicial 1000, inv final 1000 (el mismo último movimiento histórico)
      (prisma.inventoryMovement.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { catalogItemId: 'item-a', balanceValue: '1000.00', movementDate: new Date('2026-03-15'), correlativo: 3 },
        ])
        .mockResolvedValueOnce([
          { catalogItemId: 'item-a', balanceValue: '1000.00', movementDate: new Date('2026-03-15'), correlativo: 3 },
        ]);

      // Todo 0
      setupAggregates(prisma, {
        compras: 0, salidaVenta: 0, devolucionVenta: 0,
        faltante: 0, sobrante: 0, descuentos: 0,
      });

      const service = new CogsStatementReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateCogsStatementExcel('tenant-1', startDate, endDate);
      const wb = await readBuffer(buffer);
      const sheet = wb.getWorksheet('Estado de Costo de Venta')!;

      // Inv inicial = Inv final = 1000
      expect(Number(sheet.getCell('C5').value)).toBeCloseTo(1000, 2);
      expect(Number(sheet.getCell('C14').value)).toBeCloseTo(1000, 2);
      expect(Number(sheet.getCell('C16').value) || 0).toBe(0); // COGS = 0
      expect(Number(sheet.getCell('C27').value) || 0).toBe(0); // Diferencia = 0
    });

    it('8. Error paths — Tenant 404 + endDate < startDate 400', async () => {
      // Tenant no existe → NotFoundException
      const prisma404 = mockPrisma();
      (prisma404.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      const service404 = new CogsStatementReportService(prisma404 as unknown as PrismaService);
      await expect(
        service404.generateCogsStatementExcel('tenant-missing', startDate, endDate),
      ).rejects.toBeInstanceOf(NotFoundException);

      // endDate < startDate → BadRequestException (antes de cualquier Prisma call)
      const prisma400 = mockPrisma();
      const service400 = new CogsStatementReportService(prisma400 as unknown as PrismaService);
      await expect(
        service400.generateCogsStatementExcel('tenant-1', endDate, startDate),
      ).rejects.toBeInstanceOf(BadRequestException);
      // Verifica que no se consultó nada (short-circuit de validación)
      expect(prisma400.tenant.findUnique).not.toHaveBeenCalled();
    });
  });
});
