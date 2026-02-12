import { RecurringInvoiceCronService } from './recurring-invoice-cron.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DteService } from '../dte/dte.service';
import { RecurringInvoicesService } from './recurring-invoices.service';
import { createMockPrismaService, MockPrismaClient } from '../../test/helpers/mock-prisma';
import { createMockTenant } from '../../test/helpers/test-fixtures';

describe('RecurringInvoiceCronService', () => {
  let cronService: RecurringInvoiceCronService;
  let prisma: MockPrismaClient;
  let mockDteService: Record<string, jest.Mock>;
  let mockRecurringService: Record<string, jest.Mock>;

  const templateWithRelations = {
    id: 'template-1',
    tenantId: 'tenant-1',
    nombre: 'Mensualidad',
    clienteId: 'cliente-1',
    tipoDte: '01',
    interval: 'MONTHLY',
    anchorDay: 15,
    dayOfWeek: null,
    mode: 'AUTO_DRAFT',
    autoTransmit: false,
    status: 'ACTIVE',
    items: JSON.stringify([
      { descripcion: 'Hosting', cantidad: 1, precioUnitario: 100, descuento: 0 },
    ]),
    notas: null,
    startDate: new Date('2025-01-01'),
    endDate: null,
    nextRunDate: new Date('2025-02-15'),
    lastRunDate: null,
    consecutiveFailures: 0,
    lastError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    descripcion: null,
    cliente: {
      id: 'cliente-1',
      nombre: 'Test Cliente',
      numDocumento: '06141234567890',
      tipoDocumento: '36',
      nrc: '123456-7',
      correo: 'test@test.com',
      telefono: '2222-3333',
      direccion: JSON.stringify({ departamento: '06', municipio: '14', complemento: 'Calle 1' }),
    },
    tenant: createMockTenant(),
  };

  beforeEach(() => {
    prisma = createMockPrismaService();
    mockDteService = {
      createDte: jest.fn().mockResolvedValue({ id: 'dte-1' }),
      signDte: jest.fn().mockResolvedValue({}),
    };
    mockRecurringService = {
      getDueTemplates: jest.fn().mockResolvedValue([]),
      recordSuccess: jest.fn().mockResolvedValue(undefined),
      recordFailure: jest.fn().mockResolvedValue(undefined),
    };

    cronService = new RecurringInvoiceCronService(
      prisma as unknown as PrismaService,
      mockDteService as unknown as DteService,
      mockRecurringService as unknown as RecurringInvoicesService,
    );
  });

  describe('processTemplate', () => {
    beforeEach(() => {
      // Default: updateMany claims successfully, findUnique returns template
      prisma.recurringInvoiceTemplate.updateMany.mockResolvedValue({ count: 1 });
      prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue(templateWithRelations);
    });

    it('should atomically claim template before processing', async () => {
      await cronService.processTemplate('template-1');

      expect(prisma.recurringInvoiceTemplate.updateMany).toHaveBeenCalledWith({
        where: { id: 'template-1', status: 'ACTIVE' },
        data: { status: 'PROCESSING' },
      });
    });

    it('should create DTE from template and record success', async () => {
      const result = await cronService.processTemplate('template-1');

      expect(result).toEqual({ dteId: 'dte-1' });
      expect(mockDteService.createDte).toHaveBeenCalledWith(
        'tenant-1',
        '01',
        expect.objectContaining({
          identificacion: expect.objectContaining({ tipoDte: '01' }),
          cuerpoDocumento: expect.arrayContaining([
            expect.objectContaining({ descripcion: 'Hosting', precioUni: 100 }),
          ]),
        }),
      );
      expect(mockRecurringService.recordSuccess).toHaveBeenCalledWith('template-1', 'dte-1');
    });

    it('should throw if template could not be claimed (already processing)', async () => {
      prisma.recurringInvoiceTemplate.updateMany.mockResolvedValue({ count: 0 });

      await expect(cronService.processTemplate('template-1')).rejects.toThrow(
        'Template template-1 is not available for processing',
      );
      expect(mockDteService.createDte).not.toHaveBeenCalled();
    });

    it('should throw if template not found after claiming', async () => {
      prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue(null);

      await expect(cronService.processTemplate('nonexistent')).rejects.toThrow(
        'Template nonexistent not found',
      );
      expect(mockDteService.createDte).not.toHaveBeenCalled();
    });

    it('should parse items JSON correctly with multiple items', async () => {
      const multiItemTemplate = {
        ...templateWithRelations,
        items: JSON.stringify([
          { descripcion: 'Item 1', cantidad: 2, precioUnitario: 50, descuento: 5 },
          { descripcion: 'Item 2', cantidad: 1, precioUnitario: 100, descuento: 0 },
        ]),
      };
      prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue(multiItemTemplate);

      await cronService.processTemplate('template-1');

      expect(mockDteService.createDte).toHaveBeenCalledWith(
        'tenant-1',
        '01',
        expect.objectContaining({
          cuerpoDocumento: expect.arrayContaining([
            expect.objectContaining({ numItem: 1, descripcion: 'Item 1', cantidad: 2, precioUni: 50, montoDescu: 5 }),
            expect.objectContaining({ numItem: 2, descripcion: 'Item 2', cantidad: 1, precioUni: 100, montoDescu: 0 }),
          ]),
        }),
      );
    });

    it('should calculate totals with IVA 13%', async () => {
      await cronService.processTemplate('template-1');

      expect(mockDteService.createDte).toHaveBeenCalledWith(
        'tenant-1',
        '01',
        expect.objectContaining({
          resumen: expect.objectContaining({
            totalGravada: 100,
            totalIva: 13,
            totalPagar: 113,
          }),
        }),
      );
    });

    it('should sign DTE when mode is AUTO_SEND and autoTransmit is true', async () => {
      prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue({
        ...templateWithRelations,
        mode: 'AUTO_SEND',
        autoTransmit: true,
      });

      await cronService.processTemplate('template-1');

      expect(mockDteService.signDte).toHaveBeenCalledWith('dte-1');
      expect(mockRecurringService.recordSuccess).toHaveBeenCalled();
    });

    it('should not sign DTE when mode is AUTO_DRAFT', async () => {
      await cronService.processTemplate('template-1');

      expect(mockDteService.signDte).not.toHaveBeenCalled();
      expect(mockRecurringService.recordSuccess).toHaveBeenCalled();
    });

    it('should record failure on DTE creation error', async () => {
      mockDteService.createDte.mockRejectedValue(new Error('API error'));

      await expect(cronService.processTemplate('template-1')).rejects.toThrow('API error');
      expect(mockRecurringService.recordFailure).toHaveBeenCalledWith('template-1', 'API error');
    });

    it('should still record success even if signing fails', async () => {
      prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue({
        ...templateWithRelations,
        mode: 'AUTO_SEND',
        autoTransmit: true,
      });
      mockDteService.signDte.mockRejectedValue(new Error('Sign failed'));

      await cronService.processTemplate('template-1');

      expect(mockRecurringService.recordSuccess).toHaveBeenCalledWith('template-1', 'dte-1');
    });
  });

  describe('handleRecurringInvoices (cron)', () => {
    beforeEach(() => {
      prisma.recurringInvoiceTemplate.updateMany.mockResolvedValue({ count: 1 });
    });

    it('should process all due templates', async () => {
      const templates = [
        { id: 'tmpl-1', nombre: 'Template 1' },
        { id: 'tmpl-2', nombre: 'Template 2' },
      ];
      mockRecurringService.getDueTemplates.mockResolvedValue(templates);
      prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue(templateWithRelations);

      await cronService.handleRecurringInvoices();

      expect(mockRecurringService.getDueTemplates).toHaveBeenCalled();
      // processTemplate atomically claims then loads each template
      expect(prisma.recurringInvoiceTemplate.updateMany).toHaveBeenCalledTimes(2);
      expect(prisma.recurringInvoiceTemplate.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should handle errors without crashing', async () => {
      mockRecurringService.getDueTemplates.mockRejectedValue(new Error('DB connection lost'));

      await expect(cronService.handleRecurringInvoices()).resolves.toBeUndefined();
    });

    it('should not process when no templates are due', async () => {
      mockRecurringService.getDueTemplates.mockResolvedValue([]);

      await cronService.handleRecurringInvoices();

      expect(mockRecurringService.getDueTemplates).toHaveBeenCalled();
      expect(prisma.recurringInvoiceTemplate.updateMany).not.toHaveBeenCalled();
    });

    it('should continue processing remaining templates when one fails', async () => {
      const templates = [
        { id: 'tmpl-1', nombre: 'Template 1' },
        { id: 'tmpl-2', nombre: 'Template 2' },
      ];
      mockRecurringService.getDueTemplates.mockResolvedValue(templates);

      // First template: claim succeeds but findUnique returns null
      // Second template: both succeed
      prisma.recurringInvoiceTemplate.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...templateWithRelations, id: 'tmpl-2' });

      await cronService.handleRecurringInvoices();

      // Both templates were attempted
      expect(prisma.recurringInvoiceTemplate.updateMany).toHaveBeenCalledTimes(2);
      // Second one succeeded
      expect(mockRecurringService.recordSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
