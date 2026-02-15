import { Test, TestingModule } from '@nestjs/testing';
import { DteService } from './dte.service';
import { PdfService } from './pdf.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SignerService } from '../signer/signer.service';
import { MhAuthService } from '../mh-auth/mh-auth.service';
import { DefaultEmailService } from '../email-config/services/default-email.service';
import { createMockPrismaService, MockPrismaClient } from '../../test/helpers/mock-prisma';
import { createMockDte } from '../../test/helpers/test-fixtures';

describe('DteService', () => {
  let service: DteService;
  let prisma: MockPrismaClient;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DteService,
        { provide: PrismaService, useValue: prisma },
        { provide: SignerService, useValue: { signDocument: jest.fn() } },
        { provide: MhAuthService, useValue: { getToken: jest.fn() } },
        { provide: DefaultEmailService, useValue: { sendEmail: jest.fn().mockResolvedValue({ success: true }), sendEmailWithAttachment: jest.fn().mockResolvedValue({ success: true }) } },
        { provide: PdfService, useValue: { generateInvoicePdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf')) } },
      ],
    }).compile();

    service = module.get<DteService>(DteService);
  });

  describe('findByTenant', () => {
    it('should return empty results when tenantId is null', async () => {
      const result = await service.findByTenant(null);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
      expect(prisma.dTE.findMany).not.toHaveBeenCalled();
    });

    it('should return empty results when tenantId is undefined', async () => {
      const result = await service.findByTenant(undefined);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(prisma.dTE.findMany).not.toHaveBeenCalled();
    });

    it('should return paginated DTEs for valid tenantId', async () => {
      const dtes = [createMockDte(), createMockDte({ id: 'dte-2' })];
      prisma.dTE.findMany.mockResolvedValue(dtes);
      prisma.dTE.count.mockResolvedValue(2);

      const result = await service.findByTenant('tenant-1', 1, 20);

      expect(result.data).toEqual(dtes);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by tipoDte when provided', async () => {
      prisma.dTE.findMany.mockResolvedValue([]);
      prisma.dTE.count.mockResolvedValue(0);

      await service.findByTenant('tenant-1', 1, 20, { tipoDte: '01' });

      expect(prisma.dTE.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-1', tipoDte: '01' }),
        }),
      );
    });

    it('should filter by estado when provided', async () => {
      prisma.dTE.findMany.mockResolvedValue([]);
      prisma.dTE.count.mockResolvedValue(0);

      await service.findByTenant('tenant-1', 1, 20, { estado: 'PROCESADO' });

      expect(prisma.dTE.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: 'PROCESADO' }),
        }),
      );
    });

    it('should sort by allowed field (totalPagar)', async () => {
      prisma.dTE.findMany.mockResolvedValue([]);
      prisma.dTE.count.mockResolvedValue(0);

      await service.findByTenant('tenant-1', 1, 20, {}, 'totalPagar', 'asc');

      expect(prisma.dTE.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { totalPagar: 'asc' },
        }),
      );
    });

    it('should fallback to createdAt for invalid sortBy', async () => {
      prisma.dTE.findMany.mockResolvedValue([]);
      prisma.dTE.count.mockResolvedValue(0);

      await service.findByTenant('tenant-1', 1, 20, {}, 'hackedField');

      expect(prisma.dTE.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should include cliente relation in results', async () => {
      prisma.dTE.findMany.mockResolvedValue([]);
      prisma.dTE.count.mockResolvedValue(0);

      await service.findByTenant('tenant-1');

      expect(prisma.dTE.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { cliente: true },
        }),
      );
    });
  });
});
