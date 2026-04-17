import * as fs from 'fs';
import * as path from 'path';
import { DteImportParserService } from './dte-import-parser.service';

function loadFixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, '../__fixtures__/received', name), 'utf-8');
}

describe('DteImportParserService', () => {
  let service: DteImportParserService;

  beforeEach(() => {
    service = new DteImportParserService();
  });

  // ========== Happy path, one per DTE type ==========
  const happyPaths: Array<[string, string]> = [
    ['valid-fe-01.json', '01'],
    ['valid-ccfe-03.json', '03'],
    ['valid-nre-04.json', '04'],
    ['valid-nce-05.json', '05'],
    ['valid-nde-06.json', '06'],
    ['valid-cre-07.json', '07'],
    ['valid-cle-08.json', '08'],
    ['valid-dcle-09.json', '09'],
    ['valid-fexe-11.json', '11'],
    ['valid-fsee-14.json', '14'],
    ['valid-cde-15.json', '15'],
  ];

  happyPaths.forEach(([fixture, expectedTipo]) => {
    it(`parses ${fixture} → tipoDte ${expectedTipo}`, () => {
      const result = service.parse(loadFixture(fixture));
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.data!.tipoDte).toBe(expectedTipo);
    });
  });

  it('normalizes to flat ParsedDTE (codigoGeneracion at top level)', () => {
    const result = service.parse(loadFixture('valid-ccfe-03.json'));
    expect(result.data!.codigoGeneracion).toBe('A1B2C3D4-E5F6-7890-ABCD-EF1234567890');
    expect(result.data!.numeroControl).toBe('DTE-03-AB12CD34-000000000000001');
    expect(result.data!.emisor.nit).toBe('06141507251041');
  });

  it('preserves raw JSON for audit', () => {
    const jsonStr = loadFixture('valid-ccfe-03.json');
    const result = service.parse(jsonStr);
    expect(result.data!.raw).toBe(jsonStr);
  });

  // ========== Universal error cases ==========
  it('rejects malformed JSON', () => {
    const result = service.parse('{ not valid json');
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('INVALID_JSON');
  });

  it('rejects JSON with missing identificacion', () => {
    const result = service.parse(JSON.stringify({ emisor: {} }));
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('MISSING_FIELD');
  });

  it('rejects unknown tipoDte 02', () => {
    const fixture = JSON.parse(loadFixture('valid-ccfe-03.json'));
    fixture.identificacion.tipoDte = '02';
    const result = service.parse(JSON.stringify(fixture));
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('INVALID_TIPO_DTE');
  });

  it('rejects CCFE with bad NIT', () => {
    const fixture = JSON.parse(loadFixture('valid-ccfe-03.json'));
    fixture.emisor.nit = '123';
    const result = service.parse(JSON.stringify(fixture));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'INVALID_NIT')).toBe(true);
  });

  it('rejects CCFE with bad UUID codigoGeneracion', () => {
    const fixture = JSON.parse(loadFixture('valid-ccfe-03.json'));
    fixture.identificacion.codigoGeneracion = 'not-a-uuid';
    const result = service.parse(JSON.stringify(fixture));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'INVALID_UUID')).toBe(true);
  });

  it('rejects CCFE with bad numeroControl', () => {
    const fixture = JSON.parse(loadFixture('valid-ccfe-03.json'));
    fixture.identificacion.numeroControl = 'NOT-A-CONTROL';
    const result = service.parse(JSON.stringify(fixture));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'INVALID_NUMERO_CONTROL')).toBe(true);
  });

  it('rejects CCFE with arithmetic mismatch on totalIva', () => {
    const fixture = JSON.parse(loadFixture('valid-ccfe-03.json'));
    fixture.resumen.totalIva = 99.99;
    const result = service.parse(JSON.stringify(fixture));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'ARITHMETIC_MISMATCH')).toBe(true);
  });

  it('rejects CCFE with empty cuerpoDocumento', () => {
    const fixture = JSON.parse(loadFixture('valid-ccfe-03.json'));
    fixture.cuerpoDocumento = [];
    const result = service.parse(JSON.stringify(fixture));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'EMPTY_CUERPO_DOCUMENTO')).toBe(true);
  });

  it('rejects CCFE with wrong currency', () => {
    const fixture = JSON.parse(loadFixture('valid-ccfe-03.json'));
    fixture.identificacion.tipoMoneda = 'EUR';
    const result = service.parse(JSON.stringify(fixture));
    expect(result.valid).toBe(false);
  });

  it('expectedType mismatch fails parse', () => {
    const result = service.parse(loadFixture('valid-ccfe-03.json'), '01');
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('INVALID_TIPO_DTE');
  });

  it('parseObject works on already-parsed JSON', () => {
    const obj = JSON.parse(loadFixture('valid-ccfe-03.json'));
    const result = service.parseObject(obj);
    expect(result.valid).toBe(true);
  });

  it('does not perform I/O (no DB, no HTTP)', () => {
    // Spy on anything the service might mistakenly call — service is constructed
    // with zero deps (no Prisma, no HttpClient), so this is a constructor-signature test.
    expect(service).toBeInstanceOf(DteImportParserService);
    const ctorDeps = DteImportParserService.length;
    expect(ctorDeps).toBe(0); // no constructor args
  });
});
