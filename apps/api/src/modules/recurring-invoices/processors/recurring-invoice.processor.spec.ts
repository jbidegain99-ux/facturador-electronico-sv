import { Job } from 'bullmq';
import { RecurringInvoiceProcessor } from './recurring-invoice.processor';
import { PrismaService } from '../../../prisma/prisma.service';
import { DteService } from '../../dte/dte.service';
import { RecurringInvoicesService } from '../recurring-invoices.service';
import { createMockPrismaService, MockPrismaClient } from '../../../test/helpers/mock-prisma';
import { createMockTenant } from '../../../test/helpers/test-fixtures';

describe('RecurringInvoiceProcessor', () => {
  let processor: RecurringInvoiceProcessor;
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
      recordSuccess: jest.fn().mockResolvedValue(undefined),
      recordFailure: jest.fn().mockResolvedValue(undefined),
    };

    processor = new RecurringInvoiceProcessor(
      prisma as unknown as PrismaService,
      mockDteService as unknown as DteService,
      mockRecurringService as unknown as RecurringInvoicesService,
    );
  });

  function createJob(data: { templateId: string }): Job<{ templateId: string }> {
    return { data } as Job<{ templateId: string }>;
  }

  it('should create DTE from template and record success', async () => {
    prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue(templateWithRelations);

    await processor.process(createJob({ templateId: 'template-1' }));

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

  it('should skip if template not found', async () => {
    prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue(null);

    await processor.process(createJob({ templateId: 'nonexistent' }));

    expect(mockDteService.createDte).not.toHaveBeenCalled();
    expect(mockRecurringService.recordSuccess).not.toHaveBeenCalled();
  });

  it('should skip if template is not ACTIVE', async () => {
    prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue({
      ...templateWithRelations,
      status: 'PAUSED',
    });

    await processor.process(createJob({ templateId: 'template-1' }));

    expect(mockDteService.createDte).not.toHaveBeenCalled();
  });

  it('should parse items JSON correctly', async () => {
    const multiItemTemplate = {
      ...templateWithRelations,
      items: JSON.stringify([
        { descripcion: 'Item 1', cantidad: 2, precioUnitario: 50, descuento: 5 },
        { descripcion: 'Item 2', cantidad: 1, precioUnitario: 100, descuento: 0 },
      ]),
    };
    prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue(multiItemTemplate);

    await processor.process(createJob({ templateId: 'template-1' }));

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
    // Single item: cantidad=1, precioUnitario=100, descuento=0
    // totalGravada = 100, totalIva = 13, totalPagar = 113
    prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue(templateWithRelations);

    await processor.process(createJob({ templateId: 'template-1' }));

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

    await processor.process(createJob({ templateId: 'template-1' }));

    expect(mockDteService.signDte).toHaveBeenCalledWith('dte-1');
    expect(mockRecurringService.recordSuccess).toHaveBeenCalled();
  });

  it('should not sign DTE when mode is AUTO_DRAFT', async () => {
    prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue(templateWithRelations);

    await processor.process(createJob({ templateId: 'template-1' }));

    expect(mockDteService.signDte).not.toHaveBeenCalled();
    expect(mockRecurringService.recordSuccess).toHaveBeenCalled();
  });

  it('should record failure on exception', async () => {
    prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue(templateWithRelations);
    mockDteService.createDte.mockRejectedValue(new Error('API error'));

    await expect(
      processor.process(createJob({ templateId: 'template-1' })),
    ).rejects.toThrow('API error');

    expect(mockRecurringService.recordFailure).toHaveBeenCalledWith('template-1', 'API error');
  });

  it('should still record success even if signing fails', async () => {
    prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue({
      ...templateWithRelations,
      mode: 'AUTO_SEND',
      autoTransmit: true,
    });
    mockDteService.signDte.mockRejectedValue(new Error('Sign failed'));

    await processor.process(createJob({ templateId: 'template-1' }));

    // Should still record success because DTE was created
    expect(mockRecurringService.recordSuccess).toHaveBeenCalledWith('template-1', 'dte-1');
  });
});
