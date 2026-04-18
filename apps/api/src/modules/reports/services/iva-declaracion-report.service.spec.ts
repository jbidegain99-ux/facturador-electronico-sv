import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { IvaDeclaracionReportService } from './iva-declaracion-report.service';
import { PrismaService } from '../../../prisma/prisma.service';

// =========================================================================
// Mocks
// =========================================================================

type PrismaMock = {
  dTE: { findMany: jest.Mock };
  tenant: { findUnique: jest.Mock };
};

function mockPrisma(): PrismaMock {
  return {
    dTE: { findMany: jest.fn().mockResolvedValue([]) },
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

function makeDte(overrides: Record<string, unknown> = {}) {
  return {
    id: 'dte-1',
    tenantId: 'tenant-1',
    tipoDte: '01',
    estado: 'ACEPTADO',
    numeroControl: 'DTE-01-XYZ-000001',
    codigoGeneracion: 'ABCD1234-5678-90EF-1234-567890ABCDEF',
    fechaRecepcion: new Date('2026-04-10T10:00:00Z'),
    fechaAnulacion: null,
    totalGravada: '100.00',
    totalIva: '13.00',
    totalPagar: '113.00',
    clienteId: 'cli-1',
    cliente: { numDocumento: '06230987654321', nombre: 'Cliente Test SA' },
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

// =========================================================================
// Tests
// =========================================================================

describe('IvaDeclaracionReportService', () => {
  describe('generateIvaDeclaracionExcel', () => {
    it('1. Happy path — mixed types produces correct totals', async () => {
      const prisma = mockPrisma();
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());

      // Aceptados query returns: 3 FCF (01) + 2 CCFE (03) + 1 NCE (05) + 1 NDE (06) + 1 FEXE (11)
      (prisma.dTE.findMany as jest.Mock)
        .mockResolvedValueOnce([
          makeDte({ id: 'd1', tipoDte: '01', totalGravada: '100.00', totalIva: '13.00', totalPagar: '113.00' }),
          makeDte({ id: 'd2', tipoDte: '01', totalGravada: '200.00', totalIva: '26.00', totalPagar: '226.00' }),
          makeDte({ id: 'd3', tipoDte: '01', totalGravada: '300.00', totalIva: '39.00', totalPagar: '339.00' }),
          makeDte({ id: 'd4', tipoDte: '03', totalGravada: '500.00', totalIva: '65.00', totalPagar: '565.00' }),
          makeDte({ id: 'd5', tipoDte: '03', totalGravada: '1000.00', totalIva: '130.00', totalPagar: '1130.00' }),
          makeDte({ id: 'd6', tipoDte: '05', totalGravada: '50.00', totalIva: '6.50', totalPagar: '56.50' }),
          makeDte({ id: 'd7', tipoDte: '06', totalGravada: '20.00', totalIva: '2.60', totalPagar: '22.60' }),
          makeDte({ id: 'd8', tipoDte: '11', totalGravada: '0.00', totalIva: '0.00', totalPagar: '2100.00' }),
        ])
        .mockResolvedValueOnce([]); // no anulaciones

      const service = new IvaDeclaracionReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateIvaDeclaracionExcel('tenant-1', startDate, endDate);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      const wb = await readBuffer(buffer);
      expect(wb.worksheets).toHaveLength(2);

      // Hoja 1: Resumen F07
      const resumen = wb.getWorksheet('Resumen F07')!;
      expect(String(resumen.getCell('A1').value)).toContain('DECLARACIÓN IVA F07');
      expect(String(resumen.getCell('A2').value)).toContain('Wellnest');

      // Fila 6: Ventas Internas Gravadas (01+03) = 100+200+300+500+1000 = 2100
      expect(Number(resumen.getCell('C6').value)).toBe(5); // 3 FCF + 2 CCFE
      expect(Number(resumen.getCell('D6').value)).toBeCloseTo(2100, 2);

      // Fila 7: Débito Fiscal 13% = 13+26+39+65+130 = 273
      expect(Number(resumen.getCell('D7').value)).toBeCloseTo(273, 2);

      // Fila 8: Exportaciones = 2100
      expect(Number(resumen.getCell('C8').value)).toBe(1);
      expect(Number(resumen.getCell('D8').value)).toBeCloseTo(2100, 2);

      // Fila 9: NC = 50 (stored positive, rendered as negative visually)
      expect(Number(resumen.getCell('C9').value)).toBe(1);
      expect(Number(resumen.getCell('D9').value)).toBeCloseTo(-50, 2);

      // Fila 10: ND = 20
      expect(Number(resumen.getCell('C10').value)).toBe(1);
      expect(Number(resumen.getCell('D10').value)).toBeCloseTo(20, 2);

      // Fila 11: anulaciones = 0
      expect(Number(resumen.getCell('C11').value)).toBe(0);

      // Fila 13: Total Gravado Neto = 2100 + 20 - 50 - 0 = 2070
      expect(Number(resumen.getCell('D13').value)).toBeCloseTo(2070, 2);

      // Fila 14: Total IVA Débito = 273 + 2.60 - 6.50 - 0 = 269.10
      expect(Number(resumen.getCell('D14').value)).toBeCloseTo(269.10, 2);

      // Fila 15: Total Exportaciones = 2100
      expect(Number(resumen.getCell('D15').value)).toBeCloseTo(2100, 2);

      // Hoja 2: Detalle DTE (8 filas datos)
      const detalle = wb.getWorksheet('Detalle DTE')!;
      expect(detalle).toBeDefined();
      // Row 1 banner, 2 empresa, 3 spacer, 4 headers, 5..12 data
      expect(String(detalle.getCell('A4').value)).toContain('Fecha');
    });

    it('2. Solo FCF — único tipo 01', async () => {
      const prisma = mockPrisma();
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());
      (prisma.dTE.findMany as jest.Mock)
        .mockResolvedValueOnce([
          makeDte({ tipoDte: '01', totalGravada: '1000.00', totalIva: '130.00' }),
        ])
        .mockResolvedValueOnce([]);

      const service = new IvaDeclaracionReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateIvaDeclaracionExcel('tenant-1', startDate, endDate);
      const wb = await readBuffer(buffer);
      const resumen = wb.getWorksheet('Resumen F07')!;

      expect(Number(resumen.getCell('D6').value)).toBeCloseTo(1000, 2);  // gravada
      expect(Number(resumen.getCell('D7').value)).toBeCloseTo(130, 2);   // iva
      expect(Number(resumen.getCell('D8').value) || 0).toBe(0);          // exportaciones
      expect(Number(resumen.getCell('D13').value)).toBeCloseTo(1000, 2); // total gravado neto
      expect(Number(resumen.getCell('D14').value)).toBeCloseTo(130, 2);  // total iva debito
    });

    it('3. Anulación cross-period — tipo 03 emitido antes, anulado en periodo', async () => {
      const prisma = mockPrisma();
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());
      // Query 1 (aceptados no anulados en período): vacío
      // Query 2 (anulados en período): 1 CCFE con fechaRecepcion en marzo y fechaAnulacion en abril
      (prisma.dTE.findMany as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          makeDte({
            id: 'd1',
            tipoDte: '03',
            estado: 'ANULADO',
            fechaRecepcion: new Date('2026-03-15T10:00:00Z'),
            fechaAnulacion: new Date('2026-04-15T10:00:00Z'),
            totalGravada: '500.00',
            totalIva: '65.00',
            totalPagar: '565.00',
          }),
        ]);

      const service = new IvaDeclaracionReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateIvaDeclaracionExcel('tenant-1', startDate, endDate);
      const wb = await readBuffer(buffer);
      const resumen = wb.getWorksheet('Resumen F07')!;

      // Fila 11: Disminución por anulaciones = -500
      expect(Number(resumen.getCell('C11').value)).toBe(1);
      expect(Number(resumen.getCell('D11').value)).toBeCloseTo(-500, 2);

      // Ventas Internas Gravadas (fila 6) = 0 (query 1 vacío)
      expect(Number(resumen.getCell('D6').value) || 0).toBe(0);

      // Total Gravado Neto = 0 - 500 = -500
      expect(Number(resumen.getCell('D13').value)).toBeCloseTo(-500, 2);

      // Total IVA Débito = 0 - 65 = -65
      expect(Number(resumen.getCell('D14').value)).toBeCloseTo(-65, 2);

      // Hoja 2 detalle: 1 fila con observación "Anulado en período"
      const detalle = wb.getWorksheet('Detalle DTE')!;
      const obsCell = String(detalle.getCell('M5').value);
      expect(obsCell.toLowerCase()).toContain('anulado');
    });

    it('4. Anulación posterior al período — DTE aceptado en periodo y anulado fuera', async () => {
      const prisma = mockPrisma();
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());
      // Query 1 (aceptados en período con fechaAnulacion > endDate): 1 CCFE con anulación posterior
      (prisma.dTE.findMany as jest.Mock)
        .mockResolvedValueOnce([
          makeDte({
            id: 'd1',
            tipoDte: '03',
            estado: 'ACEPTADO',
            fechaRecepcion: new Date('2026-04-10T10:00:00Z'),
            fechaAnulacion: new Date('2026-05-05T10:00:00Z'),
            totalGravada: '1000.00',
            totalIva: '130.00',
            totalPagar: '1130.00',
          }),
        ])
        .mockResolvedValueOnce([]);

      const service = new IvaDeclaracionReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateIvaDeclaracionExcel('tenant-1', startDate, endDate);
      const wb = await readBuffer(buffer);
      const resumen = wb.getWorksheet('Resumen F07')!;

      // Cuenta en Ventas Internas Gravadas (fila 6)
      expect(Number(resumen.getCell('C6').value)).toBe(1);
      expect(Number(resumen.getCell('D6').value)).toBeCloseTo(1000, 2);

      // Hoja 2 detalle: observación "Aceptado y anulado fuera de período"
      const detalle = wb.getWorksheet('Detalle DTE')!;
      const obsCell = String(detalle.getCell('M5').value);
      expect(obsCell.toLowerCase()).toContain('fuera');
    });

    it('5. Período vacío — sin DTEs, retorna Excel válido con totales 0', async () => {
      const prisma = mockPrisma();
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());
      (prisma.dTE.findMany as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const service = new IvaDeclaracionReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateIvaDeclaracionExcel('tenant-1', startDate, endDate);

      const wb = await readBuffer(buffer);
      const resumen = wb.getWorksheet('Resumen F07')!;
      const detalle = wb.getWorksheet('Detalle DTE')!;

      // Totales en 0
      expect(Number(resumen.getCell('D13').value) || 0).toBe(0);
      expect(Number(resumen.getCell('D14').value) || 0).toBe(0);
      expect(Number(resumen.getCell('D15').value) || 0).toBe(0);

      // Hoja 2 muestra "Sin movimientos"
      const msgCell = String(detalle.getCell('A5').value);
      expect(msgCell.toLowerCase()).toContain('sin movimientos');
    });

    it('6. Tenant no existe → NotFoundException', async () => {
      const prisma = mockPrisma();
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      const service = new IvaDeclaracionReportService(prisma as unknown as PrismaService);
      await expect(
        service.generateIvaDeclaracionExcel('tenant-missing', startDate, endDate),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('7. endDate < startDate → BadRequestException', async () => {
      const prisma = mockPrisma();

      const service = new IvaDeclaracionReportService(prisma as unknown as PrismaService);
      await expect(
        service.generateIvaDeclaracionExcel('tenant-1', endDate, startDate),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('8. Tipos fuera de scope — DTEs tipo 04/07 no aparecen en reporte', async () => {
      const prisma = mockPrisma();
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(makeTenant());
      // La query debe filtrar tipoDte IN (01,03,05,06,11) — así que incluso si el mock devolviera 04/07, no se les daría paso.
      // Simulamos la query real: devolvemos solo los tipos permitidos (04/07 excluidos por el filtro de Prisma).
      (prisma.dTE.findMany as jest.Mock)
        .mockResolvedValueOnce([
          makeDte({ tipoDte: '01', totalGravada: '100.00', totalIva: '13.00' }),
        ])
        .mockResolvedValueOnce([]);

      const service = new IvaDeclaracionReportService(prisma as unknown as PrismaService);
      const buffer = await service.generateIvaDeclaracionExcel('tenant-1', startDate, endDate);
      const wb = await readBuffer(buffer);
      const resumen = wb.getWorksheet('Resumen F07')!;

      // Verifica que la query usó tipoDte IN filter
      const firstCall = (prisma.dTE.findMany as jest.Mock).mock.calls[0][0];
      expect(firstCall.where.tipoDte).toEqual({ in: ['01', '03', '05', '06', '11'] });

      // Solo el tipo 01 aparece
      expect(Number(resumen.getCell('C6').value)).toBe(1);
      expect(Number(resumen.getCell('D6').value)).toBeCloseTo(100, 2);
    });
  });
});
