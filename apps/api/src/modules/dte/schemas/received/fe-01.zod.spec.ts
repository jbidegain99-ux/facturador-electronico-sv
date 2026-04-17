import * as fs from 'fs';
import * as path from 'path';
import { fe01Schema } from './fe-01.zod';

function loadFixture(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../../__fixtures__/received', name), 'utf-8'));
}

describe('FE (01) Zod schema', () => {
  it('accepts valid FE', () => {
    expect(fe01Schema.safeParse(loadFixture('valid-fe-01.json')).success).toBe(true);
  });

  it('accepts FE with null receptor (consumer anonymous)', () => {
    const fixture = loadFixture('valid-fe-01.json') as { receptor: unknown };
    expect(fixture.receptor).toBeNull();
    expect(fe01Schema.safeParse(fixture).success).toBe(true);
  });

  it('rejects FE with tipoDte 03', () => {
    const fixture = loadFixture('valid-fe-01.json') as { identificacion: { tipoDte: string } };
    fixture.identificacion.tipoDte = '03';
    expect(fe01Schema.safeParse(fixture).success).toBe(false);
  });

  it('rejects FE with empty cuerpoDocumento', () => {
    const fixture = loadFixture('valid-fe-01.json') as { cuerpoDocumento: unknown[] };
    fixture.cuerpoDocumento = [];
    expect(fe01Schema.safeParse(fixture).success).toBe(false);
  });
});
