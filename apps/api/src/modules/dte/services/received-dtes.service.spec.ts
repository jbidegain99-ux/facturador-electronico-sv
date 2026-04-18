import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException, ConflictException as CE } from '@nestjs/common';
import { ReceivedDtesService } from './received-dtes.service';
import { DteImportParserService } from './dte-import-parser.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReceivedDteRetryCronService } from './received-dte-retry-cron.service';
import { DteFormat } from '../dto/preview-dte.dto';

// Silence unused import warning
void CE;

describe('ReceivedDtesService', () => {
  let service: ReceivedDtesService;
  let prisma: { receivedDTE: { findMany: jest.Mock; findFirst: jest.Mock; count: jest.Mock; create: jest.Mock; update: jest.Mock } };
  let parser: { parse: jest.Mock };
  let retryCron: { retryOne: jest.Mock };

  beforeEach(async () => {
    prisma = {
      receivedDTE: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    parser = { parse: jest.fn() };
    retryCron = { retryOne: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        ReceivedDtesService,
        { provide: PrismaService, useValue: prisma },
        { provide: DteImportParserService, useValue: parser },
        { provide: ReceivedDteRetryCronService, useValue: retryCron },
      ],
    }).compile();
    service = module.get(ReceivedDtesService);
  });

  describe('findAll', () => {
    it('returns paginated list with default page=1 limit=20', async () => {
      prisma.receivedDTE.findMany.mockResolvedValue([{ id: 'r1' }]);
      prisma.receivedDTE.count.mockResolvedValue(1);
      const r = await service.findAll('t1', {});
      expect(r).toEqual({ data: [{ id: 'r1' }], total: 1, totalPages: 1, page: 1, limit: 20 });
    });

    it('applies status filter', async () => {
      prisma.receivedDTE.findMany.mockResolvedValue([]);
      prisma.receivedDTE.count.mockResolvedValue(0);
      await service.findAll('t1', { status: 'FAILED' });
      expect(prisma.receivedDTE.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ ingestStatus: 'FAILED' }) }),
      );
    });

    it('applies date range filter', async () => {
      prisma.receivedDTE.findMany.mockResolvedValue([]);
      prisma.receivedDTE.count.mockResolvedValue(0);
      await service.findAll('t1', { desde: '2026-04-01', hasta: '2026-04-30' });
      expect(prisma.receivedDTE.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fhEmision: { gte: new Date('2026-04-01'), lte: new Date('2026-04-30') },
          }),
        }),
      );
    });

    it('applies search on emisorNIT or emisorNombre', async () => {
      prisma.receivedDTE.findMany.mockResolvedValue([]);
      prisma.receivedDTE.count.mockResolvedValue(0);
      await service.findAll('t1', { search: 'Acme' });
      const call = prisma.receivedDTE.findMany.mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
    });

    it('filters hasPurchase=true using purchase relation', async () => {
      prisma.receivedDTE.findMany.mockResolvedValue([]);
      prisma.receivedDTE.count.mockResolvedValue(0);
      await service.findAll('t1', { hasPurchase: 'true' });
      expect(prisma.receivedDTE.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ purchase: { isNot: null } }) }),
      );
    });
  });

  describe('findOne', () => {
    it('returns ReceivedDTE including purchase', async () => {
      prisma.receivedDTE.findFirst.mockResolvedValue({ id: 'r1', purchase: null });
      const r = await service.findOne('t1', 'r1');
      expect(r.id).toBe('r1');
    });
    it('throws 404 if not found in tenant', async () => {
      prisma.receivedDTE.findFirst.mockResolvedValue(null);
      await expect(service.findOne('t1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createManual', () => {
    it('rejects XML format with 400', async () => {
      await expect(
        service.createManual('t1', 'u1', { content: '<xml/>', format: DteFormat.XML }),
      ).rejects.toThrow(BadRequestException);
    });

    it('persists with ingestSource=MANUAL and returns created row', async () => {
      parser.parse.mockReturnValue({
        valid: true,
        data: {
          tipoDte: '01',
          numeroControl: 'NC-1',
          codigoGeneracion: 'CG-1',
          fecEmi: '2026-04-01',
          selloRecepcion: undefined,
          emisor: { nit: '0614', nombre: 'Proveedor X' },
        },
        errors: [],
      });
      prisma.receivedDTE.findFirst.mockResolvedValue(null);
      prisma.receivedDTE.create.mockResolvedValue({ id: 'r1', ingestSource: 'MANUAL', ingestStatus: 'PENDING' });
      const r = await service.createManual('t1', 'u1', { content: '{"a":1}', format: DteFormat.JSON });
      expect(r.id).toBe('r1');
      expect(prisma.receivedDTE.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 't1',
            createdBy: 'u1',
            ingestSource: 'MANUAL',
            ingestStatus: 'PENDING',
          }),
        }),
      );
    });

    it('throws 409 DUPLICATE if codigoGeneracion + tenantId already exists', async () => {
      parser.parse.mockReturnValue({
        valid: true,
        data: {
          tipoDte: '01',
          numeroControl: 'NC-1',
          codigoGeneracion: 'CG-DUP',
          fecEmi: '2026-04-01',
          selloRecepcion: undefined,
          emisor: { nit: '0614', nombre: 'X' },
        },
        errors: [],
      });
      prisma.receivedDTE.findFirst.mockResolvedValue({ id: 'existing-r', codigoGeneracion: 'CG-DUP' });
      await expect(
        service.createManual('t1', 'u1', { content: '{"a":1}', format: DteFormat.JSON }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws 400 INVALID_JSON if parser.parse returns invalid', async () => {
      parser.parse.mockReturnValue({ valid: false, errors: [{ code: 'INVALID_JSON', message: 'bad' }] });
      await expect(
        service.createManual('t1', 'u1', { content: 'nope', format: DteFormat.JSON }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('retryMhVerify', () => {
    it('throws 404 if row not found for tenant', async () => {
      prisma.receivedDTE.findFirst.mockResolvedValue(null);
      await expect(service.retryMhVerify('t1', 'bad-id')).rejects.toThrow(NotFoundException);
    });

    it('throws 409 ALREADY_VERIFIED if ingestStatus is VERIFIED', async () => {
      prisma.receivedDTE.findFirst.mockResolvedValue({
        id: 'r1',
        tenantId: 't1',
        ingestStatus: 'VERIFIED',
        mhVerifyAttempts: 2,
      });
      await expect(service.retryMhVerify('t1', 'r1')).rejects.toThrow(ConflictException);
    });

    it('calls retryCron.retryOne and returns updated row on success', async () => {
      const row = { id: 'r1', tenantId: 't1', ingestStatus: 'PENDING', mhVerifyAttempts: 1, lastMhVerifyAt: null };
      prisma.receivedDTE.findFirst
        .mockResolvedValueOnce(row) // initial findOne
        .mockResolvedValueOnce({ ...row, mhVerifyAttempts: 2, ingestStatus: 'VERIFIED' }); // after update
      retryCron.retryOne.mockResolvedValue({ newStatus: 'VERIFIED', newAttempts: 2 });
      prisma.receivedDTE.update.mockResolvedValue({ ...row, mhVerifyAttempts: 2, lastMhVerifyAt: new Date() });
      const result = await service.retryMhVerify('t1', 'r1');
      expect(retryCron.retryOne).toHaveBeenCalledWith('r1');
      expect(result.mhVerifyAttempts).toBe(2);
    });
  });

  describe('reParse', () => {
    it('throws 404 if row not found for tenant', async () => {
      prisma.receivedDTE.findFirst.mockResolvedValue(null);
      await expect(service.reParse('t1', 'bad-id')).rejects.toThrow(NotFoundException);
    });

    it('marks row FAILED with ingestErrors if parser returns invalid', async () => {
      const row = {
        id: 'r1', tenantId: 't1', ingestStatus: 'PENDING',
        rawPayload: 'bad-json', parsedPayload: null, ingestErrors: null,
      };
      prisma.receivedDTE.findFirst.mockResolvedValue(row);
      parser.parse.mockReturnValue({ valid: false, errors: [{ code: 'INVALID_JSON', message: 'bad' }] });
      const updated = { ...row, ingestStatus: 'FAILED', ingestErrors: JSON.stringify([{ code: 'INVALID_JSON', message: 'bad' }]) };
      prisma.receivedDTE.update.mockResolvedValue(updated);
      const result = await service.reParse('t1', 'r1');
      expect(prisma.receivedDTE.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ ingestStatus: 'FAILED' }) }),
      );
      expect(result.ingestStatus).toBe('FAILED');
    });

    it('updates parsedPayload and clears errors; status FAILED → PENDING on success', async () => {
      const row = {
        id: 'r1', tenantId: 't1', ingestStatus: 'FAILED',
        rawPayload: '{"identificacion":{"tipoDte":"01"}}', parsedPayload: null, ingestErrors: 'old-err',
      };
      const parsedData = {
        tipoDte: '01', numeroControl: 'NC-1', codigoGeneracion: 'CG-1',
        fecEmi: '2026-04-01', emisor: { nit: '1234', nombre: 'X' },
      };
      prisma.receivedDTE.findFirst.mockResolvedValue(row);
      parser.parse.mockReturnValue({ valid: true, data: parsedData, errors: [] });
      const updated = { ...row, ingestStatus: 'PENDING', parsedPayload: JSON.stringify(parsedData), ingestErrors: null };
      prisma.receivedDTE.update.mockResolvedValue(updated);
      const result = await service.reParse('t1', 'r1');
      expect(prisma.receivedDTE.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            parsedPayload: JSON.stringify(parsedData),
            ingestErrors: null,
            ingestStatus: 'PENDING',
          }),
        }),
      );
      expect(result.ingestStatus).toBe('PENDING');
    });
  });
});
