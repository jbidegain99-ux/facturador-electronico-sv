import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ReceivedDtesService } from './received-dtes.service';
import { DteImportParserService } from './dte-import-parser.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DteFormat } from '../dto/preview-dte.dto';

describe('ReceivedDtesService', () => {
  let service: ReceivedDtesService;
  let prisma: { receivedDTE: { findMany: jest.Mock; findFirst: jest.Mock; count: jest.Mock; create: jest.Mock; update: jest.Mock } };
  let parser: { parse: jest.Mock };

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
    const module = await Test.createTestingModule({
      providers: [
        ReceivedDtesService,
        { provide: PrismaService, useValue: prisma },
        { provide: DteImportParserService, useValue: parser },
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
});
