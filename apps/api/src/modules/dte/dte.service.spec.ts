import { Test, TestingModule } from '@nestjs/testing';
import { DteService } from './dte.service';
import { PdfService } from './pdf.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SignerService } from '../signer/signer.service';
import { MhAuthService } from '../mh-auth/mh-auth.service';
import { DefaultEmailService } from '../email-config/services/default-email.service';
import { HaciendaAuthService } from '../hacienda/services/hacienda-auth.service';
import { CertificateService } from '../hacienda/services/certificate.service';
import { EncryptionService } from '../email-config/services/encryption.service';
import { DteErrorMapperService } from './services/error-mapper.service';
import { DteOperationLoggerService } from './services/dte-operation-logger.service';
import { createMockPrismaService, MockPrismaClient } from '../../test/helpers/mock-prisma';
import { createMockDte, createMockTenant } from '../../test/helpers/test-fixtures';

describe('DteService', () => {
  let service: DteService;
  let prisma: MockPrismaClient;

  const mockTenantWithSucursal = {
    ...createMockTenant(),
    sucursales: [{
      id: 'suc-1',
      activa: true,
      esPrincipal: true,
      tipoEstablecimiento: '01',
      codEstableMH: 'M001',
      codEstable: 'M001',
    }],
  };

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
        { provide: HaciendaAuthService, useValue: { getTokenForTenant: jest.fn().mockResolvedValue({ token: 'mock-token' }) } },
        { provide: CertificateService, useValue: { signPayload: jest.fn().mockResolvedValue('mock-jws-signature') } },
        { provide: EncryptionService, useValue: { decrypt: jest.fn().mockReturnValue('mock-password') } },
        { provide: DteErrorMapperService, useValue: { mapError: jest.fn().mockReturnValue({ message: 'error', code: 'UNKNOWN' }) } },
        { provide: DteOperationLoggerService, useValue: { logOperationStart: jest.fn(), logOperationSuccess: jest.fn(), logOperationError: jest.fn() } },
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

  describe('Bug #1: totalPagar in resumen for NC/ND', () => {
    const setupCreateDteMocks = () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenantWithSucursal);
      prisma.dTE.findFirst.mockResolvedValue(null); // no previous DTE for correlativo
      prisma.dTE.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'dte-new', ...data }),
      );
      prisma.dTELog.create.mockResolvedValue({});
      prisma.cliente.findFirst.mockResolvedValue(null);
      prisma.cliente.create.mockResolvedValue({ id: 'cliente-new' });
      prisma.haciendaConfig.findUnique.mockResolvedValue(null);
    };

    it('should have totalPagar in resumen for tipo 05 (Nota de Crédito)', async () => {
      setupCreateDteMocks();

      await service.createDte('tenant-1', '05', {
        identificacion: { tipoDte: '05', version: 3 },
        receptor: {
          nit: '06149876543210',
          nrc: '7654321',
          nombre: 'Cliente NC',
          codActividad: '62010',
          descActividad: 'Servicios',
          direccion: { departamento: '06', municipio: '14', complemento: 'Test' },
          correo: 'nc@test.com',
        },
        documentoRelacionado: [{ tipoDocumento: '03', tipoGeneracion: 2, numeroDocumento: 'DOC-001', fechaEmision: '2026-03-01' }],
        cuerpoDocumento: [{ descripcion: 'Devolución', cantidad: 1, precioUnitario: 100, ventaGravada: 100, numeroDocumento: 'DOC-001' }],
        resumen: { totalGravada: 100, totalExenta: 0, totalNoSuj: 0, subTotal: 100 },
      });

      const createCall = prisma.dTE.create.mock.calls[0][0];
      const jsonOriginal = JSON.parse(createCall.data.jsonOriginal);
      expect(jsonOriginal.resumen.totalPagar).toBeDefined();
      expect(jsonOriginal.resumen.totalPagar).toBe(jsonOriginal.resumen.montoTotalOperacion);
      expect(jsonOriginal.resumen.totalPagar).toBeGreaterThan(0);

      // Also verify totalPagar is stored in DB record
      expect(createCall.data.totalPagar).toBeGreaterThan(0);
    });

    it('should have totalPagar in resumen for tipo 06 (Nota de Débito)', async () => {
      setupCreateDteMocks();

      await service.createDte('tenant-1', '06', {
        identificacion: { tipoDte: '06', version: 3 },
        receptor: {
          nit: '06149876543210',
          nrc: '7654321',
          nombre: 'Cliente ND',
          codActividad: '62010',
          descActividad: 'Servicios',
          direccion: { departamento: '06', municipio: '14', complemento: 'Test' },
          correo: 'nd@test.com',
        },
        documentoRelacionado: [{ tipoDocumento: '03', tipoGeneracion: 2, numeroDocumento: 'DOC-001', fechaEmision: '2026-03-01' }],
        cuerpoDocumento: [{ descripcion: 'Cargo', cantidad: 1, precioUnitario: 200, ventaGravada: 200, numeroDocumento: 'DOC-001' }],
        resumen: { totalGravada: 200, totalExenta: 0, totalNoSuj: 0, subTotal: 200 },
      });

      const createCall = prisma.dTE.create.mock.calls[0][0];
      const jsonOriginal = JSON.parse(createCall.data.jsonOriginal);
      expect(jsonOriginal.resumen.totalPagar).toBeDefined();
      expect(jsonOriginal.resumen.totalPagar).toBe(jsonOriginal.resumen.montoTotalOperacion);
      expect(jsonOriginal.resumen.totalPagar).toBe(226); // 200 + 13% IVA

      expect(createCall.data.totalPagar).toBe(226);
    });

    it('totalPagar should equal montoTotalOperacion for NC with mixed items', async () => {
      setupCreateDteMocks();

      await service.createDte('tenant-1', '05', {
        identificacion: { tipoDte: '05', version: 3 },
        receptor: {
          nit: '06149876543210',
          nrc: '7654321',
          nombre: 'Cliente Mixed',
          codActividad: '62010',
          descActividad: 'Servicios',
          direccion: { departamento: '06', municipio: '14', complemento: 'Test' },
          correo: 'mix@test.com',
        },
        documentoRelacionado: [{ tipoDocumento: '03', tipoGeneracion: 2, numeroDocumento: 'DOC-001', fechaEmision: '2026-03-01' }],
        cuerpoDocumento: [
          { descripcion: 'Gravado', cantidad: 1, precioUnitario: 100, ventaGravada: 100, numeroDocumento: 'DOC-001' },
        ],
        resumen: { totalGravada: 100, totalExenta: 50, totalNoSuj: 0, subTotal: 150 },
      });

      const createCall = prisma.dTE.create.mock.calls[0][0];
      const jsonOriginal = JSON.parse(createCall.data.jsonOriginal);
      // montoTotalOperacion = gravada + exenta + noSuj + IVA = 100 + 50 + 0 + 13 = 163
      expect(jsonOriginal.resumen.montoTotalOperacion).toBe(163);
      expect(jsonOriginal.resumen.totalPagar).toBe(163);
    });
  });

  describe('Bug #2: NIT fallback chain in normalizer', () => {
    const setupCreateDteMocks = () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenantWithSucursal);
      prisma.dTE.findFirst.mockResolvedValue(null);
      prisma.dTE.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'dte-new', ...data }),
      );
      prisma.dTELog.create.mockResolvedValue({});
      prisma.cliente.findFirst.mockResolvedValue(null);
      prisma.cliente.create.mockResolvedValue({ id: 'cliente-new' });
      prisma.haciendaConfig.findUnique.mockResolvedValue(null);
    };

    it('should use nit when present for NC receptor', async () => {
      setupCreateDteMocks();

      await service.createDte('tenant-1', '05', {
        identificacion: { tipoDte: '05', version: 3 },
        receptor: {
          nit: '0614-1234-567890',
          nrc: '7654321',
          nombre: 'Cliente NIT',
          codActividad: '62010',
          descActividad: 'Servicios',
          direccion: { departamento: '06', municipio: '14', complemento: 'Test' },
          correo: 'nit@test.com',
        },
        documentoRelacionado: [{ tipoDocumento: '03', tipoGeneracion: 2, numeroDocumento: 'DOC-001', fechaEmision: '2026-03-01' }],
        cuerpoDocumento: [{ descripcion: 'Dev', cantidad: 1, precioUnitario: 100, ventaGravada: 100, numeroDocumento: 'DOC-001' }],
        resumen: { totalGravada: 100, subTotal: 100 },
      });

      const createCall = prisma.dTE.create.mock.calls[0][0];
      const jsonOriginal = JSON.parse(createCall.data.jsonOriginal);
      expect(jsonOriginal.receptor.nit).toBe('06141234567890');
    });

    it('should fallback to numDocumento if nit missing for NC receptor', async () => {
      setupCreateDteMocks();

      await service.createDte('tenant-1', '05', {
        identificacion: { tipoDte: '05', version: 3 },
        receptor: {
          numDocumento: '0614-9999-888877',
          nrc: '7654321',
          nombre: 'Cliente NumDoc',
          codActividad: '62010',
          descActividad: 'Servicios',
          direccion: { departamento: '06', municipio: '14', complemento: 'Test' },
          correo: 'numdoc@test.com',
        },
        documentoRelacionado: [{ tipoDocumento: '03', tipoGeneracion: 2, numeroDocumento: 'DOC-001', fechaEmision: '2026-03-01' }],
        cuerpoDocumento: [{ descripcion: 'Dev', cantidad: 1, precioUnitario: 100, ventaGravada: 100, numeroDocumento: 'DOC-001' }],
        resumen: { totalGravada: 100, subTotal: 100 },
      });

      const createCall = prisma.dTE.create.mock.calls[0][0];
      const jsonOriginal = JSON.parse(createCall.data.jsonOriginal);
      expect(jsonOriginal.receptor.nit).toBe('06149999888877');
    });

    it('should prioritize nit over numDocumento for NC receptor', async () => {
      setupCreateDteMocks();

      await service.createDte('tenant-1', '05', {
        identificacion: { tipoDte: '05', version: 3 },
        receptor: {
          nit: '0614-1111-222233',
          numDocumento: '0614-9999-888877',
          nrc: '7654321',
          nombre: 'Cliente Both',
          codActividad: '62010',
          descActividad: 'Servicios',
          direccion: { departamento: '06', municipio: '14', complemento: 'Test' },
          correo: 'both@test.com',
        },
        documentoRelacionado: [{ tipoDocumento: '03', tipoGeneracion: 2, numeroDocumento: 'DOC-001', fechaEmision: '2026-03-01' }],
        cuerpoDocumento: [{ descripcion: 'Dev', cantidad: 1, precioUnitario: 100, ventaGravada: 100, numeroDocumento: 'DOC-001' }],
        resumen: { totalGravada: 100, subTotal: 100 },
      });

      const createCall = prisma.dTE.create.mock.calls[0][0];
      const jsonOriginal = JSON.parse(createCall.data.jsonOriginal);
      expect(jsonOriginal.receptor.nit).toBe('06141111222233');
    });

    it('should strip hyphens from NIT in tipo 07 receptor', async () => {
      setupCreateDteMocks();

      await service.createDte('tenant-1', '07', {
        identificacion: { tipoDte: '07', version: 3 },
        receptor: {
          nit: '0614-5555-666677',
          nrc: '7654321',
          nombre: 'Cliente Retencion',
          codActividad: '62010',
          descActividad: 'Servicios',
          direccion: { departamento: '06', municipio: '14', complemento: 'Test' },
          correo: 'ret@test.com',
        },
        cuerpoDocumento: [{
          tipoDte: '03',
          tipoDoc: 2,
          numDocumento: 'DOC-001',
          fechaEmision: '2026-03-01',
          montoSujetoGrav: 1000,
          codigoRetencionMH: 'C4',
          ivaRetenido: 10,
          descripcion: 'Retención IVA',
        }],
        resumen: {},
      });

      const createCall = prisma.dTE.create.mock.calls[0][0];
      const jsonOriginal = JSON.parse(createCall.data.jsonOriginal);
      expect(jsonOriginal.receptor.nit).toBe('06145555666677');
    });

    it('should strip hyphens from NIT in tipo 03 receptor', async () => {
      setupCreateDteMocks();

      await service.createDte('tenant-1', '03', {
        identificacion: { tipoDte: '03', version: 3 },
        receptor: {
          nit: '0614-7777-888899',
          nrc: '123456-7',
          nombre: 'Cliente CCF',
          codActividad: '62010',
          descActividad: 'Servicios',
          direccion: { departamento: '06', municipio: '14', complemento: 'Test' },
          correo: 'ccf@test.com',
        },
        cuerpoDocumento: [{ descripcion: 'Servicio', cantidad: 1, precioUnitario: 100, ventaGravada: 100 }],
        resumen: { totalGravada: 100, subTotal: 100 },
      });

      const createCall = prisma.dTE.create.mock.calls[0][0];
      const jsonOriginal = JSON.parse(createCall.data.jsonOriginal);
      expect(jsonOriginal.receptor.nit).toBe('06147777888899');
      expect(jsonOriginal.receptor.nrc).toBe('1234567');
    });
  });
});
