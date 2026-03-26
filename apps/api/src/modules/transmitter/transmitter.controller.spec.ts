import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransmitterController, TransmitDto, CreateAndTransmitDto, AnularDto, ConsultarDto } from './transmitter.controller';
import { TransmitterService, DTERecord } from './transmitter.service';
import { DteBuilderService } from '../dte/services/dte-builder.service';
import { DteOperationLoggerService } from '../dte/services/dte-operation-logger.service';
import { createMockUser, createMockUserWithoutTenant, createMockAuthGuard } from '../../test/helpers/mock-user';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';

describe('TransmitterController', () => {
  let controller: TransmitterController;
  let mockTransmitterService: Record<string, jest.Mock>;
  let mockDteBuilder: Record<string, jest.Mock>;
  const mockUser = createMockUser();
  const mockUserB = createMockUser({ id: 'user-2', tenantId: 'tenant-2', email: 'b@test.com' });

  const createMockDTERecord = (overrides?: Partial<DTERecord>): DTERecord => ({
    id: 'dte-1',
    tenantId: 'tenant-1',
    codigoGeneracion: 'CG-001',
    numeroControl: 'DTE-01-M001P001-000000000000001',
    tipoDte: '01',
    ambiente: '00',
    status: 'PENDIENTE',
    jsonDte: { identificacion: { codigoGeneracion: 'CG-001', numeroControl: 'NC-001', fecEmi: '2026-03-09' }, emisor: { nombre: 'Test', telefono: '0000-0000', correo: 'test@test.com' } } as never,
    intentos: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    mockTransmitterService = {
      getDTE: jest.fn(),
      getDTEByCodigoGeneracion: jest.fn(),
      saveDTE: jest.fn(),
      transmitSync: jest.fn(),
      transmitAsync: jest.fn(),
      anular: jest.fn(),
      getLogs: jest.fn(),
      getJobStatus: jest.fn(),
      consultarEstado: jest.fn(),
    };

    mockDteBuilder = {
      buildFactura: jest.fn(),
      buildCCF: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransmitterController],
      providers: [
        { provide: TransmitterService, useValue: mockTransmitterService },
        { provide: DteBuilderService, useValue: mockDteBuilder },
        { provide: DteOperationLoggerService, useValue: { logOperationStart: jest.fn(), logOperationSuccess: jest.fn(), logOperationError: jest.fn(), getTenantErrors: jest.fn() } },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(createMockAuthGuard(mockUser))
      .compile();

    controller = module.get<TransmitterController>(TransmitterController);
  });

  describe('sendDTE', () => {
    const dto: TransmitDto = { nit: '0614', password: 'pass' };

    it('should transmit DTE when user owns it', async () => {
      const record = createMockDTERecord();
      mockTransmitterService.getDTE.mockReturnValue(record);
      mockTransmitterService.transmitSync.mockResolvedValue({
        success: true,
        dteId: 'dte-1',
        codigoGeneracion: 'CG-001',
        status: 'PROCESADO',
      });

      const result = await controller.sendDTE('dte-1', dto, mockUser);

      expect(result).toEqual(expect.objectContaining({ success: true }));
      expect(mockTransmitterService.transmitSync).toHaveBeenCalledWith('dte-1', '0614', 'pass', 'test');
    });

    it('should return 404 when DTE does not exist', async () => {
      mockTransmitterService.getDTE.mockReturnValue(undefined);

      await expect(
        controller.sendDTE('nonexistent', dto, mockUser),
      ).rejects.toThrow(HttpException);

      try {
        await controller.sendDTE('nonexistent', dto, mockUser);
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should return 404 when DTE belongs to another tenant (prevents IDOR)', async () => {
      const record = createMockDTERecord({ tenantId: 'tenant-2' });
      mockTransmitterService.getDTE.mockReturnValue(record);

      await expect(
        controller.sendDTE('dte-1', dto, mockUser),
      ).rejects.toThrow(HttpException);

      try {
        await controller.sendDTE('dte-1', dto, mockUser);
      } catch (e) {
        // Returns 404, NOT 403 — prevents tenant enumeration
        expect((e as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should throw ForbiddenException when user has no tenantId', async () => {
      const userWithoutTenant = createMockUserWithoutTenant();

      await expect(
        controller.sendDTE('dte-1', dto, userWithoutTenant),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should use async transmission when dto.async is true', async () => {
      const record = createMockDTERecord();
      mockTransmitterService.getDTE.mockReturnValue(record);
      mockTransmitterService.transmitAsync.mockResolvedValue({
        jobId: 'sync',
        message: 'DTE transmitido',
      });

      const asyncDto: TransmitDto = { nit: '0614', password: 'pass', async: true };
      const result = await controller.sendDTE('dte-1', asyncDto, mockUser);

      expect(result).toEqual(expect.objectContaining({ success: true, jobId: 'sync' }));
      expect(mockTransmitterService.transmitAsync).toHaveBeenCalledWith(
        'dte-1', 'tenant-1', '0614', 'pass', 'test',
      );
    });
  });

  describe('createAndSend', () => {
    const dto: CreateAndTransmitDto = {
      nit: '0614',
      password: 'pass',
      tipoDte: '01',
      emisor: { nombre: 'Test' },
      items: [{ descripcion: 'Item', cantidad: 1, precioUnitario: 100 }],
      codEstablecimiento: 'M001P001',
      correlativo: 1,
    };

    it('should use tenantId from JWT, not from request body', async () => {
      const mockDte = { identificacion: { codigoGeneracion: 'CG-002', numeroControl: 'NC-002' } };
      mockDteBuilder.buildFactura.mockReturnValue(mockDte);
      mockTransmitterService.transmitSync.mockResolvedValue({ success: true, dteId: 'x' });

      await controller.createAndSend(dto, mockUser);

      const savedRecord = mockTransmitterService.saveDTE.mock.calls[0][0] as DTERecord;
      expect(savedRecord.tenantId).toBe('tenant-1');
    });

    it('should throw ForbiddenException when user has no tenantId', async () => {
      const userWithoutTenant = createMockUserWithoutTenant();

      await expect(
        controller.createAndSend(dto, userWithoutTenant),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getDTE', () => {
    it('should return DTE when user owns it', () => {
      const record = createMockDTERecord();
      mockTransmitterService.getDTE.mockReturnValue(record);

      const result = controller.getDTE('dte-1', mockUser);

      expect(result).toEqual(expect.objectContaining({
        id: 'dte-1',
        codigoGeneracion: 'CG-001',
      }));
      // Should NOT expose tenantId in response
      expect(result).not.toHaveProperty('tenantId');
    });

    it('should return 404 for cross-tenant access', () => {
      const record = createMockDTERecord({ tenantId: 'tenant-2' });
      mockTransmitterService.getDTE.mockReturnValue(record);

      expect(() => controller.getDTE('dte-1', mockUser)).toThrow(HttpException);
    });
  });

  describe('getDTEJson', () => {
    it('should return DTE JSON when user owns it', () => {
      const record = createMockDTERecord();
      mockTransmitterService.getDTE.mockReturnValue(record);

      const result = controller.getDTEJson('dte-1', mockUser);

      expect(result).toBeDefined();
      expect(result).toEqual(record.jsonDte);
    });

    it('should return 404 for cross-tenant access', () => {
      const record = createMockDTERecord({ tenantId: 'tenant-2' });
      mockTransmitterService.getDTE.mockReturnValue(record);

      expect(() => controller.getDTEJson('dte-1', mockUser)).toThrow(HttpException);
    });
  });

  describe('getDTELogs', () => {
    it('should return logs when user owns the DTE', () => {
      const record = createMockDTERecord();
      mockTransmitterService.getDTE.mockReturnValue(record);
      mockTransmitterService.getLogs.mockReturnValue([{ action: 'CREATE' }]);

      const result = controller.getDTELogs('dte-1', mockUser);

      expect(result).toEqual([{ action: 'CREATE' }]);
    });

    it('should return 404 for cross-tenant access', () => {
      const record = createMockDTERecord({ tenantId: 'tenant-2' });
      mockTransmitterService.getDTE.mockReturnValue(record);

      expect(() => controller.getDTELogs('dte-1', mockUser)).toThrow(HttpException);
    });
  });

  describe('anularDTE', () => {
    const dto: AnularDto = { nit: '0614', password: 'pass', motivo: 'Error en datos' };

    it('should anular DTE when user owns it', async () => {
      const record = createMockDTERecord({ status: 'PROCESADO' });
      mockTransmitterService.getDTE.mockReturnValue(record);
      mockTransmitterService.anular.mockResolvedValue({
        success: true,
        dteId: 'dte-1',
        status: 'ANULADO',
      });

      const result = await controller.anularDTE('dte-1', dto, mockUser);

      expect(result).toEqual(expect.objectContaining({ success: true, status: 'ANULADO' }));
    });

    it('should return 404 for cross-tenant anulation attempt', async () => {
      const record = createMockDTERecord({ tenantId: 'tenant-2' });
      mockTransmitterService.getDTE.mockReturnValue(record);

      await expect(
        controller.anularDTE('dte-1', dto, mockUser),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('getStatus', () => {
    const query: ConsultarDto = { nit: '0614', password: 'pass' };

    it('should return local status when DTE found and owned', async () => {
      const record = createMockDTERecord({ status: 'PROCESADO', selloRecibido: 'SELLO-001' });
      mockTransmitterService.getDTEByCodigoGeneracion.mockReturnValue(record);

      const result = await controller.getStatus('CG-001', query, mockUser);

      expect(result).toEqual(expect.objectContaining({
        source: 'local',
        status: 'PROCESADO',
      }));
    });

    it('should return 404 when DTE found but belongs to another tenant', async () => {
      const record = createMockDTERecord({ tenantId: 'tenant-2' });
      mockTransmitterService.getDTEByCodigoGeneracion.mockReturnValue(record);

      await expect(
        controller.getStatus('CG-001', query, mockUser),
      ).rejects.toThrow(HttpException);
    });

    it('should throw ForbiddenException when user has no tenantId', async () => {
      const userWithoutTenant = createMockUserWithoutTenant();

      await expect(
        controller.getStatus('CG-001', query, userWithoutTenant),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
