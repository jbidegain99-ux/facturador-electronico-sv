import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let mockPrisma: Record<string, Record<string, jest.Mock>>;

  beforeEach(() => {
    mockPrisma = {
      dTE: {
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
      cliente: {
        findMany: jest.fn(),
      },
    };
    service = new ReportsService(mockPrisma as never);
  });

  const startDate = new Date('2026-01-01');
  const endDate = new Date('2026-03-31');

  describe('getByType', () => {
    it('should return all 10 DTE types with stats', async () => {
      mockPrisma.dTE.groupBy.mockResolvedValue([
        { tipoDte: '01', _count: { id: 5 }, _sum: { totalPagar: 1000 } },
        { tipoDte: '03', _count: { id: 3 }, _sum: { totalPagar: 600 } },
      ]);

      const result = await service.getByType('tenant-1', startDate, endDate);

      expect(result.data).toHaveLength(10);
      expect(result.grandTotal).toBe(1600);
      expect(result.grandCount).toBe(8);

      const factura = result.data.find((d) => d.tipoDte === '01');
      expect(factura?.cantidad).toBe(5);
      expect(factura?.total).toBe(1000);
      expect(factura?.promedio).toBe(200);
      expect(factura?.nombre).toBe('Factura');

      // Types with no data should show 0
      const nd = result.data.find((d) => d.tipoDte === '06');
      expect(nd?.cantidad).toBe(0);
      expect(nd?.total).toBe(0);
      expect(nd?.promedio).toBe(0);
    });

    it('should return zeros when no DTEs exist', async () => {
      mockPrisma.dTE.groupBy.mockResolvedValue([]);

      const result = await service.getByType('tenant-1', startDate, endDate);

      expect(result.data).toHaveLength(10);
      expect(result.grandTotal).toBe(0);
      expect(result.grandCount).toBe(0);
    });
  });

  describe('getByPeriod', () => {
    it('should return 12 months for monthly period', async () => {
      mockPrisma.dTE.findMany.mockResolvedValue([
        { createdAt: new Date('2026-01-15'), totalPagar: 100 },
        { createdAt: new Date('2026-01-20'), totalPagar: 200 },
        { createdAt: new Date('2026-03-10'), totalPagar: 500 },
      ]);

      const result = await service.getByPeriod('tenant-1', 'monthly', 2026);

      expect(result.period).toBe('monthly');
      expect(result.year).toBe(2026);
      expect(result.data).toHaveLength(12);
      expect(result.grandTotal).toBe(800);
      expect(result.grandCount).toBe(3);

      const enero = result.data[0];
      expect(enero.label).toBe('Enero');
      expect(enero.count).toBe(2);
      expect(enero.total).toBe(300);
      expect(enero.promedio).toBe(150);

      const febrero = result.data[1];
      expect(febrero.count).toBe(0);
      expect(febrero.total).toBe(0);
    });

    it('should return 4 quarters for quarterly period', async () => {
      mockPrisma.dTE.findMany.mockResolvedValue([
        { createdAt: new Date(2026, 0, 15), totalPagar: 100 },  // Jan = Q1
        { createdAt: new Date(2026, 3, 10), totalPagar: 200 },  // Apr = Q2
        { createdAt: new Date(2026, 6, 5), totalPagar: 300 },   // Jul = Q3
        { createdAt: new Date(2026, 9, 1), totalPagar: 400 },   // Oct = Q4
      ]);

      const result = await service.getByPeriod('tenant-1', 'quarterly', 2026);

      expect(result.data).toHaveLength(4);
      expect(result.data[0].label).toContain('Q1');
      expect(result.data[0].total).toBe(100);
      expect(result.data[1].total).toBe(200);
      expect(result.data[2].total).toBe(300);
      expect(result.data[3].total).toBe(400);
      expect(result.grandTotal).toBe(1000);
    });

    it('should return single entry for annual period', async () => {
      mockPrisma.dTE.findMany.mockResolvedValue([
        { createdAt: new Date('2026-06-15'), totalPagar: 1000 },
      ]);

      const result = await service.getByPeriod('tenant-1', 'annual', 2026);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].label).toBe('2026');
      expect(result.grandTotal).toBe(1000);
    });

    it('should handle empty data', async () => {
      mockPrisma.dTE.findMany.mockResolvedValue([]);

      const result = await service.getByPeriod('tenant-1', 'monthly', 2026);

      expect(result.grandTotal).toBe(0);
      expect(result.grandCount).toBe(0);
      result.data.forEach((d) => {
        expect(d.count).toBe(0);
        expect(d.total).toBe(0);
      });
    });
  });

  describe('getRetenciones', () => {
    it('should aggregate retenciones by tax type', async () => {
      mockPrisma.dTE.findMany.mockResolvedValue([
        {
          tipoDte: '34',
          jsonOriginal: JSON.stringify({
            cuerpoDocumento: [
              { tipoImpuesto: 'ISR', tasa: 0.10, montoRetencion: 100 },
              { tipoImpuesto: 'IVA', tasa: 0.01, montoRetencion: 10 },
            ],
          }),
        },
        {
          tipoDte: '34',
          jsonOriginal: JSON.stringify({
            cuerpoDocumento: [
              { tipoImpuesto: 'ISR', tasa: 0.10, montoRetencion: 200 },
            ],
          }),
        },
      ]);

      const result = await service.getRetenciones('tenant-1', startDate, endDate);

      expect(result.grandTotal).toBe(310);
      expect(result.data).toHaveLength(2);

      const isr = result.data.find((d) => d.tipoImpuesto === 'ISR');
      expect(isr?.total).toBe(300);
      expect(isr?.count).toBe(2);
      expect(isr?.byRate).toHaveLength(1);
      expect(isr?.byRate[0].tasa).toBe(0.10);

      const iva = result.data.find((d) => d.tipoImpuesto === 'IVA');
      expect(iva?.total).toBe(10);
    });

    it('should handle tipo 07 with ivaRetenido field', async () => {
      mockPrisma.dTE.findMany.mockResolvedValue([
        {
          tipoDte: '07',
          jsonOriginal: JSON.stringify({
            cuerpoDocumento: [
              { codigoRetencionMH: 'C4', tasa: 0.01, ivaRetenido: 50 },
            ],
          }),
        },
      ]);

      const result = await service.getRetenciones('tenant-1', startDate, endDate);

      expect(result.grandTotal).toBe(50);
      const c4 = result.data.find((d) => d.tipoImpuesto === 'C4');
      expect(c4?.total).toBe(50);
    });

    it('should return empty when no retention DTEs', async () => {
      mockPrisma.dTE.findMany.mockResolvedValue([]);

      const result = await service.getRetenciones('tenant-1', startDate, endDate);

      expect(result.data).toHaveLength(0);
      expect(result.grandTotal).toBe(0);
    });

    it('should handle malformed JSON gracefully', async () => {
      mockPrisma.dTE.findMany.mockResolvedValue([
        { tipoDte: '34', jsonOriginal: 'not valid json' },
      ]);

      const result = await service.getRetenciones('tenant-1', startDate, endDate);

      expect(result.data).toHaveLength(0);
      expect(result.grandTotal).toBe(0);
    });
  });

  describe('getTopClients', () => {
    it('should return top clients sorted by total', async () => {
      mockPrisma.dTE.groupBy.mockResolvedValue([
        { clienteId: 'c1', _count: { id: 5 }, _sum: { totalPagar: 1000 } },
        { clienteId: 'c2', _count: { id: 2 }, _sum: { totalPagar: 500 } },
      ]);
      mockPrisma.cliente.findMany.mockResolvedValue([
        { id: 'c1', nombre: 'Empresa A', numDocumento: '1234' },
        { id: 'c2', nombre: 'Empresa B', numDocumento: '5678' },
      ]);

      const result = await service.getTopClients('tenant-1', 10, startDate, endDate);

      expect(result).toHaveLength(2);
      expect(result[0].nombre).toBe('Empresa A');
      expect(result[0].total).toBe(1000);
      expect(result[0].promedio).toBe(200);
      expect(result[1].nombre).toBe('Empresa B');
    });

    it('should handle missing client names', async () => {
      mockPrisma.dTE.groupBy.mockResolvedValue([
        { clienteId: 'c1', _count: { id: 1 }, _sum: { totalPagar: 100 } },
      ]);
      mockPrisma.cliente.findMany.mockResolvedValue([]);

      const result = await service.getTopClients('tenant-1', 10, startDate, endDate);

      expect(result[0].nombre).toBe('Desconocido');
    });
  });

  describe('getExports', () => {
    it('should aggregate exports by country', async () => {
      mockPrisma.dTE.findMany.mockResolvedValue([
        {
          totalPagar: 1000,
          jsonOriginal: JSON.stringify({ receptor: { nombrePais: 'Estados Unidos' } }),
        },
        {
          totalPagar: 500,
          jsonOriginal: JSON.stringify({ receptor: { nombrePais: 'México' } }),
        },
        {
          totalPagar: 300,
          jsonOriginal: JSON.stringify({ receptor: { nombrePais: 'Estados Unidos' } }),
        },
      ]);

      const result = await service.getExports('tenant-1', startDate, endDate);

      expect(result.total).toBe(1800);
      expect(result.count).toBe(3);
      expect(result.promedio).toBe(600);
      expect(result.byCountry).toHaveLength(2);

      const us = result.byCountry.find((c) => c.pais === 'Estados Unidos');
      expect(us?.total).toBe(1300);
      expect(us?.count).toBe(2);
    });

    it('should handle empty exports', async () => {
      mockPrisma.dTE.findMany.mockResolvedValue([]);

      const result = await service.getExports('tenant-1', startDate, endDate);

      expect(result.total).toBe(0);
      expect(result.count).toBe(0);
      expect(result.byCountry).toHaveLength(0);
    });
  });

  describe('generateCSV', () => {
    it('should generate CSV for by-type report', () => {
      const data = {
        data: [
          { tipoDte: '01', nombre: 'Factura', cantidad: 5, total: 1000, promedio: 200 },
        ],
        grandTotal: 1000,
        grandCount: 5,
      };

      const csv = service.generateCSV('by-type', data);

      expect(csv).toContain('Tipo DTE');
      expect(csv).toContain('Factura');
      expect(csv).toContain('1000.00');
      expect(csv).toContain('TOTAL');
    });

    it('should generate CSV for retenciones report', () => {
      const data = {
        data: [
          { tipoImpuesto: 'ISR', total: 300, count: 2, byRate: [{ tasa: 0.1, total: 300, count: 2 }] },
        ],
        grandTotal: 300,
      };

      const csv = service.generateCSV('retenciones', data);

      expect(csv).toContain('Tipo Impuesto');
      expect(csv).toContain('ISR');
      expect(csv).toContain('300.00');
    });

    it('should properly escape CSV values with quotes', () => {
      const data = {
        data: [
          { tipoDte: '01', nombre: 'Factura "especial"', cantidad: 1, total: 100, promedio: 100 },
        ],
        grandTotal: 100,
        grandCount: 1,
      };

      const csv = service.generateCSV('by-type', data);

      expect(csv).toContain('""especial""');
    });
  });
});
