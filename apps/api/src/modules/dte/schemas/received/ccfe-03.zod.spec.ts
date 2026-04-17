import * as fs from 'fs';
import * as path from 'path';
import { ccfe03Schema } from './ccfe-03.zod';

function loadFixture(name: string): unknown {
  const p = path.join(__dirname, '../../__fixtures__/received', name);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

describe('CCFE (03) Zod schema', () => {
  it('accepts a well-formed CCFE', () => {
    const fixture = loadFixture('valid-ccfe-03.json');
    const result = ccfe03Schema.safeParse(fixture);
    expect(result.success).toBe(true);
  });

  it('extracts emisor.nit correctly after parse', () => {
    const fixture = loadFixture('valid-ccfe-03.json');
    const result = ccfe03Schema.parse(fixture);
    expect(result.emisor.nit).toBe('06141507251041');
  });

  it('rejects CCFE with wrong tipoDte', () => {
    const fixture = loadFixture('valid-ccfe-03.json') as { identificacion: { tipoDte: string } };
    fixture.identificacion.tipoDte = '01';
    const result = ccfe03Schema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it('rejects CCFE with ventaGravada > 0 but no ivaItem on line', () => {
    const fixture = loadFixture('valid-ccfe-03.json') as {
      cuerpoDocumento: Array<{ ventaGravada: number; ivaItem: number | null }>;
    };
    fixture.cuerpoDocumento[0].ivaItem = null;
    const result = ccfe03Schema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it('rejects CCFE where sum(ivaItem) != resumen.totalIva', () => {
    const fixture = loadFixture('valid-ccfe-03.json') as {
      resumen: { totalIva: number };
    };
    fixture.resumen.totalIva = 99.99;
    const result = ccfe03Schema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it('rejects empty cuerpoDocumento', () => {
    const fixture = loadFixture('valid-ccfe-03.json') as { cuerpoDocumento: unknown[] };
    fixture.cuerpoDocumento = [];
    const result = ccfe03Schema.safeParse(fixture);
    expect(result.success).toBe(false);
  });
});
