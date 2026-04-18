import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReceivedDtesController } from './received-dtes.controller';
import { DteImportParserService } from './services/dte-import-parser.service';
import { DteFormat } from './dto/preview-dte.dto';

describe('ReceivedDtesController', () => {
  let controller: ReceivedDtesController;
  let parser: { parse: jest.Mock };

  beforeEach(async () => {
    parser = { parse: jest.fn() };
    const module = await Test.createTestingModule({
      controllers: [ReceivedDtesController],
      providers: [{ provide: DteImportParserService, useValue: parser }],
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
});
