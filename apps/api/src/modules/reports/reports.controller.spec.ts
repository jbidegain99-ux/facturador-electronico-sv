import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { KardexReportService } from './services/kardex-report.service';
import { IvaDeclaracionReportService } from './services/iva-declaracion-report.service';
import { CogsStatementReportService } from './services/cogs-statement-report.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockUser, createMockUserWithoutTenant, createMockAuthGuard } from '../../test/helpers/mock-user';

type MockRes = {
  setHeader: jest.Mock;
  end: jest.Mock;
};

function makeMockRes(): MockRes {
  return {
    setHeader: jest.fn(),
    end: jest.fn(),
  };
}

describe('ReportsController (fiscal endpoints)', () => {
  let controller: ReportsController;
  let mockReportsService: Record<string, jest.Mock>;
  let mockKardex: Record<string, jest.Mock>;
  let mockIva: Record<string, jest.Mock>;
  let mockCogs: Record<string, jest.Mock>;
  let mockPrisma: { catalogItem: { findUnique: jest.Mock } };
  const mockUser = createMockUser();

  beforeEach(async () => {
    mockReportsService = {
      getByType: jest.fn(),
      getByPeriod: jest.fn(),
      getRetenciones: jest.fn(),
      getTopClients: jest.fn(),
      getExports: jest.fn(),
      generateCSV: jest.fn(),
    };
    mockKardex = {
      generateKardexExcel: jest.fn(),
      generateKardexBookExcel: jest.fn(),
    };
    mockIva = {
      generateIvaDeclaracionExcel: jest.fn(),
    };
    mockCogs = {
      generateCogsStatementExcel: jest.fn(),
    };
    mockPrisma = {
      catalogItem: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: ReportsService, useValue: mockReportsService },
        { provide: KardexReportService, useValue: mockKardex },
        { provide: IvaDeclaracionReportService, useValue: mockIva },
        { provide: CogsStatementReportService, useValue: mockCogs },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(createMockAuthGuard(mockUser))
      .compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  describe('GET /reports/kardex/item/:catalogItemId', () => {
    it('1. Happy path — returns xlsx buffer with correct headers and filename', async () => {
      const fakeBuffer = Buffer.from('fake-kardex-xlsx-content');
      mockPrisma.catalogItem.findUnique.mockResolvedValue({ code: 'PROD-001', tenantId: 'tenant-1' });
      mockKardex.generateKardexExcel.mockResolvedValue(fakeBuffer);

      const res = makeMockRes();
      await controller.getKardexItem(
        mockUser,
        'cat-item-1',
        '2026-04-01',
        '2026-04-30',
        res as unknown as Response,
      );

      expect(mockPrisma.catalogItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-item-1' },
        select: { code: true, tenantId: true },
      });
      expect(mockKardex.generateKardexExcel).toHaveBeenCalledWith(
        'tenant-1',
        'cat-item-1',
        expect.any(Date),
        expect.any(Date),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/^attachment; filename="kardex-PROD-001-\d{8}\.xlsx"$/),
      );
      expect(res.end).toHaveBeenCalledWith(fakeBuffer);
    });

    it('2. catalogItemId not found → NotFoundException', async () => {
      mockPrisma.catalogItem.findUnique.mockResolvedValue(null);

      const res = makeMockRes();
      await expect(
        controller.getKardexItem(
          mockUser,
          'cat-missing',
          '2026-04-01',
          '2026-04-30',
          res as unknown as Response,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockKardex.generateKardexExcel).not.toHaveBeenCalled();
    });

    it('3. tenant mismatch on catalogItem → NotFoundException', async () => {
      mockPrisma.catalogItem.findUnique.mockResolvedValue({ code: 'PROD-X', tenantId: 'other-tenant' });

      const res = makeMockRes();
      await expect(
        controller.getKardexItem(
          mockUser,
          'cat-x',
          '2026-04-01',
          '2026-04-30',
          res as unknown as Response,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockKardex.generateKardexExcel).not.toHaveBeenCalled();
    });

    it('4. endDate < startDate → BadRequestException (short-circuit, service not called)', async () => {
      const res = makeMockRes();
      await expect(
        controller.getKardexItem(
          mockUser,
          'cat-item-1',
          '2026-04-30',
          '2026-04-01',
          res as unknown as Response,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.catalogItem.findUnique).not.toHaveBeenCalled();
      expect(mockKardex.generateKardexExcel).not.toHaveBeenCalled();
    });

    it('5. User without tenantId → ForbiddenException', async () => {
      const userNoTenant = createMockUserWithoutTenant();
      const res = makeMockRes();
      await expect(
        controller.getKardexItem(
          userNoTenant,
          'cat-item-1',
          '2026-04-01',
          '2026-04-30',
          res as unknown as Response,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('GET /reports/kardex/book', () => {
    it('6. Happy path — returns xlsx buffer with book filename', async () => {
      const fakeBuffer = Buffer.from('fake-book-xlsx');
      mockKardex.generateKardexBookExcel.mockResolvedValue(fakeBuffer);

      const res = makeMockRes();
      await controller.getKardexBook(mockUser, '2026-04-01', '2026-04-30', res as unknown as Response);

      expect(mockKardex.generateKardexBookExcel).toHaveBeenCalledWith(
        'tenant-1',
        expect.any(Date),
        expect.any(Date),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/^attachment; filename="kardex-libro-\d{6}\.xlsx"$/),
      );
      expect(res.end).toHaveBeenCalledWith(fakeBuffer);
    });
  });

  describe('GET /reports/iva-declaracion', () => {
    it('7. Happy path — returns xlsx buffer with iva filename', async () => {
      const fakeBuffer = Buffer.from('fake-iva-xlsx');
      mockIva.generateIvaDeclaracionExcel.mockResolvedValue(fakeBuffer);

      const res = makeMockRes();
      await controller.getIvaDeclaracion(mockUser, '2026-04-01', '2026-04-30', res as unknown as Response);

      expect(mockIva.generateIvaDeclaracionExcel).toHaveBeenCalledWith(
        'tenant-1',
        expect.any(Date),
        expect.any(Date),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/^attachment; filename="iva-f07-\d{6}\.xlsx"$/),
      );
      expect(res.end).toHaveBeenCalledWith(fakeBuffer);
    });
  });

  describe('GET /reports/cogs-statement', () => {
    it('8. Happy path — returns xlsx buffer with cogs filename', async () => {
      const fakeBuffer = Buffer.from('fake-cogs-xlsx');
      mockCogs.generateCogsStatementExcel.mockResolvedValue(fakeBuffer);

      const res = makeMockRes();
      await controller.getCogsStatement(mockUser, '2026-01-01', '2026-12-31', res as unknown as Response);

      expect(mockCogs.generateCogsStatementExcel).toHaveBeenCalledWith(
        'tenant-1',
        expect.any(Date),
        expect.any(Date),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/^attachment; filename="estado-costo-venta-\d{4}\.xlsx"$/),
      );
      expect(res.end).toHaveBeenCalledWith(fakeBuffer);
    });
  });
});
