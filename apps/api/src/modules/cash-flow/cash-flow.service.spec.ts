import { CashFlowService } from './cash-flow.service';

describe('CashFlowService', () => {
  let service: CashFlowService;
  let mockPrisma: Record<string, Record<string, jest.Mock>>;

  beforeEach(() => {
    mockPrisma = {
      paymentMethod: {
        findMany: jest.fn(),
      },
    };
    service = new CashFlowService(mockPrisma as never);
  });

  describe('getSummary', () => {
    it('should return empty summary when no payments exist', async () => {
      mockPrisma.paymentMethod.findMany.mockResolvedValue([]);

      const result = await service.getSummary('tenant-1', 30);

      expect(result.total).toBe(0);
      expect(result.cobrado).toBe(0);
      expect(result.pendiente).toBe(0);
      expect(result.byMethod).toHaveLength(0);
      expect(result.forecast).toHaveLength(0);
      expect(result.periodo).toBe('30 días');
    });

    it('should calculate totals correctly', async () => {
      mockPrisma.paymentMethod.findMany.mockResolvedValue([
        {
          tipo: 'EFECTIVO',
          estado: 'CONFIRMADO',
          createdAt: new Date('2026-03-13'),
          dte: { id: '1', totalPagar: 100, createdAt: new Date('2026-03-13'), estado: 'PROCESADO' },
        },
        {
          tipo: 'TRANSFERENCIA',
          estado: 'PENDIENTE',
          createdAt: new Date('2026-03-14'),
          dte: { id: '2', totalPagar: 200, createdAt: new Date('2026-03-14'), estado: 'PROCESADO' },
        },
        {
          tipo: 'EFECTIVO',
          estado: 'CONFIRMADO',
          createdAt: new Date('2026-03-13'),
          dte: { id: '3', totalPagar: 50, createdAt: new Date('2026-03-13'), estado: 'PROCESADO' },
        },
      ]);

      const result = await service.getSummary('tenant-1', 30);

      expect(result.total).toBe(350);
      expect(result.cobrado).toBe(150);
      expect(result.pendiente).toBe(200);
    });

    it('should group by method correctly', async () => {
      mockPrisma.paymentMethod.findMany.mockResolvedValue([
        {
          tipo: 'EFECTIVO',
          estado: 'CONFIRMADO',
          createdAt: new Date('2026-03-13'),
          dte: { id: '1', totalPagar: 100, createdAt: new Date(), estado: 'PROCESADO' },
        },
        {
          tipo: 'CHEQUE',
          estado: 'PENDIENTE',
          createdAt: new Date('2026-03-13'),
          dte: { id: '2', totalPagar: 300, createdAt: new Date(), estado: 'PROCESADO' },
        },
        {
          tipo: 'EFECTIVO',
          estado: 'PENDIENTE',
          createdAt: new Date('2026-03-13'),
          dte: { id: '3', totalPagar: 50, createdAt: new Date(), estado: 'PROCESADO' },
        },
      ]);

      const result = await service.getSummary('tenant-1', 30);

      expect(result.byMethod).toHaveLength(2);
      const efectivo = result.byMethod.find((m) => m.tipo === 'EFECTIVO');
      const cheque = result.byMethod.find((m) => m.tipo === 'CHEQUE');
      expect(efectivo?.total).toBe(150);
      expect(efectivo?.count).toBe(2);
      expect(efectivo?.cuenta).toBe('1001 - Caja');
      expect(cheque?.total).toBe(300);
      expect(cheque?.count).toBe(1);
      expect(cheque?.cuenta).toBe('1106 - Cheques por cobrar');
    });

    it('should generate forecast grouped by date', async () => {
      mockPrisma.paymentMethod.findMany.mockResolvedValue([
        {
          tipo: 'EFECTIVO',
          estado: 'CONFIRMADO',
          createdAt: new Date('2026-03-13T10:00:00Z'),
          dte: { id: '1', totalPagar: 100, createdAt: new Date('2026-03-13'), estado: 'PROCESADO' },
        },
        {
          tipo: 'EFECTIVO',
          estado: 'PENDIENTE',
          createdAt: new Date('2026-03-13T15:00:00Z'),
          dte: { id: '2', totalPagar: 50, createdAt: new Date('2026-03-13'), estado: 'PROCESADO' },
        },
        {
          tipo: 'TRANSFERENCIA',
          estado: 'PENDIENTE',
          createdAt: new Date('2026-03-15T10:00:00Z'),
          dte: { id: '3', totalPagar: 200, createdAt: new Date('2026-03-15'), estado: 'PROCESADO' },
        },
      ]);

      const result = await service.getSummary('tenant-1', 30);

      expect(result.forecast.length).toBeGreaterThanOrEqual(2);
      // Dates should be sorted
      for (let i = 1; i < result.forecast.length; i++) {
        expect(result.forecast[i].date >= result.forecast[i - 1].date).toBe(true);
      }
    });

    it('should handle different period values', async () => {
      mockPrisma.paymentMethod.findMany.mockResolvedValue([]);

      const result7 = await service.getSummary('tenant-1', 7);
      expect(result7.periodo).toBe('7 días');

      const result60 = await service.getSummary('tenant-1', 60);
      expect(result60.periodo).toBe('60 días');
    });
  });

  describe('getAlerts', () => {
    it('should return empty alerts when no pending payments', async () => {
      mockPrisma.paymentMethod.findMany.mockResolvedValue([]);

      const alerts = await service.getAlerts('tenant-1');

      expect(alerts).toHaveLength(0);
    });

    it('should detect old pending cheques', async () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      mockPrisma.paymentMethod.findMany
        .mockResolvedValueOnce([
          {
            id: 'pm-1',
            dteId: 'dte-1',
            numeroCheque: '12345',
            createdAt: tenDaysAgo,
          },
        ])
        .mockResolvedValueOnce([]) // transfers
        .mockResolvedValueOnce([]); // old payments

      const alerts = await service.getAlerts('tenant-1');

      expect(alerts.length).toBeGreaterThanOrEqual(1);
      const chequeAlert = alerts.find((a) => a.tipo === 'CHEQUE_VENCIENDO');
      expect(chequeAlert).toBeDefined();
      expect(chequeAlert?.severidad).toBe('WARNING');
      expect(chequeAlert?.mensaje).toContain('12345');
    });

    it('should mark cheques older than 14 days as CRITICAL', async () => {
      const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
      mockPrisma.paymentMethod.findMany
        .mockResolvedValueOnce([
          {
            id: 'pm-1',
            dteId: 'dte-1',
            numeroCheque: '99999',
            createdAt: twentyDaysAgo,
          },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const alerts = await service.getAlerts('tenant-1');

      const chequeAlert = alerts.find((a) => a.tipo === 'CHEQUE_VENCIENDO');
      expect(chequeAlert?.severidad).toBe('CRITICAL');
    });

    it('should detect old pending transfers', async () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      mockPrisma.paymentMethod.findMany
        .mockResolvedValueOnce([]) // cheques
        .mockResolvedValueOnce([
          {
            id: 'pm-2',
            dteId: 'dte-2',
            createdAt: fiveDaysAgo,
            dte: { totalPagar: 500 },
          },
        ])
        .mockResolvedValueOnce([]); // old payments

      const alerts = await service.getAlerts('tenant-1');

      const transferAlert = alerts.find((a) => a.tipo === 'TRANSFERENCIA_EN_TRANSITO');
      expect(transferAlert).toBeDefined();
      expect(transferAlert?.severidad).toBe('WARNING');
      expect(transferAlert?.mensaje).toContain('$500.00');
    });

    it('should sort alerts by severity (CRITICAL first)', async () => {
      const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      mockPrisma.paymentMethod.findMany
        .mockResolvedValueOnce([
          { id: 'pm-1', dteId: 'dte-1', numeroCheque: '111', createdAt: twentyDaysAgo },
        ])
        .mockResolvedValueOnce([
          { id: 'pm-2', dteId: 'dte-2', createdAt: fiveDaysAgo, dte: { totalPagar: 100 } },
        ])
        .mockResolvedValueOnce([]);

      const alerts = await service.getAlerts('tenant-1');

      expect(alerts.length).toBe(2);
      expect(alerts[0].severidad).toBe('CRITICAL');
      expect(alerts[1].severidad).toBe('WARNING');
    });
  });
});
