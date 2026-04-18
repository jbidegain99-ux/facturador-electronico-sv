import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReceivedDtesController } from './received-dtes.controller';
import { DteImportParserService } from './services/dte-import-parser.service';
import { ReceivedDtesService } from './services/received-dtes.service';
import { ReceivedDtesExportService } from './services/received-dtes-export.service';
import { DteFormat } from './dto/preview-dte.dto';

describe('ReceivedDtesController', () => {
  let controller: ReceivedDtesController;
  let parser: { parse: jest.Mock };
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    createManual: jest.Mock;
    retryMhVerify: jest.Mock;
    reParse: jest.Mock;
  };
  let exporter: { exportXlsx: jest.Mock };

  beforeEach(async () => {
    parser = { parse: jest.fn() };
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      createManual: jest.fn(),
      retryMhVerify: jest.fn(),
      reParse: jest.fn(),
    };
    exporter = { exportXlsx: jest.fn() };
    const module = await Test.createTestingModule({
      controllers: [ReceivedDtesController],
      providers: [
        { provide: DteImportParserService, useValue: parser },
        { provide: ReceivedDtesService, useValue: service },
        { provide: ReceivedDtesExportService, useValue: exporter },
      ],
    }).compile();
    controller = module.get(ReceivedDtesController);
  });

  describe('POST /preview', () => {
    it('returns parse result for valid JSON', () => {
      parser.parse.mockReturnValue({ valid: true, dte: { identificacion: { tipoDte: '01' } } });
      const result = controller.preview({ content: '{"a":1}', format: DteFormat.JSON });
      expect(result.valid).toBe(true);
      expect(parser.parse).toHaveBeenCalledWith('{"a":1}');
    });

    it('rejects XML format with 400 BadRequest', () => {
      expect(() =>
        controller.preview({ content: '<xml/>', format: DteFormat.XML }),
      ).toThrow(BadRequestException);
    });

    it('returns invalid result from parser (not throw) for malformed JSON', () => {
      parser.parse.mockReturnValue({ valid: false, errors: [{ code: 'INVALID_JSON', message: 'bad' }] });
      const result = controller.preview({ content: 'nope', format: DteFormat.JSON });
      expect(result.valid).toBe(false);
    });
  });

  describe('GET /', () => {
    it('delegates to service.findAll with tenantId and filters', async () => {
      service.findAll.mockResolvedValue({ data: [], total: 0, totalPages: 0, page: 1, limit: 20 });
      await controller.findAll({ tenantId: 't1', id: 'u1' } as any, {} as any);
      expect(service.findAll).toHaveBeenCalledWith('t1', {});
    });
  });

  describe('GET /:id', () => {
    it('delegates to service.findOne', async () => {
      service.findOne.mockResolvedValue({ id: 'r1' });
      await controller.findOne({ tenantId: 't1', id: 'u1' } as any, 'r1');
      expect(service.findOne).toHaveBeenCalledWith('t1', 'r1');
    });
  });

  describe('POST /', () => {
    it('delegates to service.createManual', async () => {
      service.createManual.mockResolvedValue({ id: 'r-new' });
      await controller.createManual({ tenantId: 't1', id: 'u1' } as any, { content: '{}', format: 'json' } as any);
      expect(service.createManual).toHaveBeenCalledWith('t1', 'u1', { content: '{}', format: 'json' });
    });
  });

  describe('POST /:id/retry-mh', () => {
    it('delegates to service.retryMhVerify', async () => {
      service.retryMhVerify.mockResolvedValue({ id: 'r1' });
      await controller.retryMh({ tenantId: 't1', id: 'u1' } as any, 'r1');
      expect(service.retryMhVerify).toHaveBeenCalledWith('t1', 'r1');
    });
  });

  describe('POST /:id/re-parse', () => {
    it('delegates to service.reParse', async () => {
      service.reParse.mockResolvedValue({ id: 'r1' });
      await controller.reParse({ tenantId: 't1', id: 'u1' } as any, 'r1');
      expect(service.reParse).toHaveBeenCalledWith('t1', 'r1');
    });
  });

  describe('GET /export', () => {
    it('streams XLSX with correct content-type header', async () => {
      exporter.exportXlsx.mockResolvedValue(Buffer.from('x'));
      const res = { setHeader: jest.fn(), send: jest.fn() } as unknown as { setHeader: jest.Mock; send: jest.Mock };
      await controller.exportXlsx({ tenantId: 't1', id: 'u1' } as any, {} as any, res as any);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', expect.stringContaining('spreadsheetml'));
      expect(res.send).toHaveBeenCalled();
    });
  });
});
