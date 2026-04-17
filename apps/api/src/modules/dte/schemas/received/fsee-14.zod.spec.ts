import * as fs from 'fs';
import * as path from 'path';
import { fsee14Schema } from './fsee-14.zod';

function loadFixture(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../../__fixtures__/received', name), 'utf-8'));
}

describe('FSEE (14) Zod schema', () => {
  it('accepts valid FSEE', () => {
    expect(fsee14Schema.safeParse(loadFixture('valid-fsee-14.json')).success).toBe(true);
  });

  it('extracts sujetoExcluido.numDocumento correctly', () => {
    const result = fsee14Schema.parse(loadFixture('valid-fsee-14.json'));
    expect(result.sujetoExcluido.numDocumento).toBe('012345678');
    expect(result.sujetoExcluido.tipoDocumento).toBe('13');
  });

  it('rejects FSEE with tipoDte 01', () => {
    const fixture = loadFixture('valid-fsee-14.json') as { identificacion: { tipoDte: string } };
    fixture.identificacion.tipoDte = '01';
    expect(fsee14Schema.safeParse(fixture).success).toBe(false);
  });

  it('rejects FSEE with invalid tipoDocumento', () => {
    const fixture = loadFixture('valid-fsee-14.json') as { sujetoExcluido: { tipoDocumento: string } };
    fixture.sujetoExcluido.tipoDocumento = '99';
    expect(fsee14Schema.safeParse(fixture).success).toBe(false);
  });
});
