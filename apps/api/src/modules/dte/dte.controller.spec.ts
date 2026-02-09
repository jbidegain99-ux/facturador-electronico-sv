import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import { DteController } from './dte.controller';
import { DteService } from './dte.service';
import { PdfService } from './pdf.service';
import { createMockUser, createMockAuthGuard } from '../../test/helpers/mock-user';

describe('DteController', () => {
  let controller: DteController;
  let mockDteService: Record<string, jest.Mock>;
  const mockUser = createMockUser();

  beforeEach(async () => {
    mockDteService = {
      createDte: jest.fn(),
      signDte: jest.fn(),
      transmitDte: jest.fn(),
      findByTenant: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
      findOne: jest.fn(),
      getSummaryStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DteController],
      providers: [
        { provide: DteService, useValue: mockDteService },
        { provide: PdfService, useValue: { generatePdf: jest.fn() } },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(createMockAuthGuard(mockUser))
      .compile();

    controller = module.get<DteController>(DteController);
  });

  describe('findAll', () => {
    it('should parse page and limit from query strings', async () => {
      const mockReq = { user: { tenantId: 'tenant-1' } };

      await controller.findAll(
        mockReq as Parameters<typeof controller.findAll>[0],
        '2', '10', undefined, undefined, undefined, undefined, undefined,
      );

      expect(mockDteService.findByTenant).toHaveBeenCalledWith(
        'tenant-1', 2, 10, { tipoDte: undefined, estado: undefined, search: undefined },
        undefined, undefined,
      );
    });

    it('should cap limit at 100', async () => {
      const mockReq = { user: { tenantId: 'tenant-1' } };

      await controller.findAll(
        mockReq as Parameters<typeof controller.findAll>[0],
        '1', '500', undefined, undefined, undefined, undefined, undefined,
      );

      expect(mockDteService.findByTenant).toHaveBeenCalledWith(
        'tenant-1', 1, 100,
        expect.anything(), undefined, undefined,
      );
    });

    it('should pass filters to service', async () => {
      const mockReq = { user: { tenantId: 'tenant-1' } };

      await controller.findAll(
        mockReq as Parameters<typeof controller.findAll>[0],
        undefined, undefined, '01', 'PROCESADO', 'test', undefined, undefined,
      );

      expect(mockDteService.findByTenant).toHaveBeenCalledWith(
        'tenant-1', 1, 20,
        { tipoDte: '01', estado: 'PROCESADO', search: 'test' },
        undefined, undefined,
      );
    });

    it('should pass sortBy and sortOrder to service', async () => {
      const mockReq = { user: { tenantId: 'tenant-1' } };

      await controller.findAll(
        mockReq as Parameters<typeof controller.findAll>[0],
        undefined, undefined, undefined, undefined, undefined, 'totalPagar', 'asc',
      );

      expect(mockDteService.findByTenant).toHaveBeenCalledWith(
        'tenant-1', 1, 20,
        expect.anything(), 'totalPagar', 'asc',
      );
    });

    it('should default limit to 20 when not provided', async () => {
      const mockReq = { user: { tenantId: 'tenant-1' } };

      await controller.findAll(
        mockReq as Parameters<typeof controller.findAll>[0],
        undefined, undefined, undefined, undefined, undefined, undefined, undefined,
      );

      expect(mockDteService.findByTenant).toHaveBeenCalledWith(
        'tenant-1', 1, 20,
        expect.anything(), undefined, undefined,
      );
    });
  });
});
